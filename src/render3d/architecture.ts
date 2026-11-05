// Adapted from floorplan-3d (MIT, Copyright (c) 2026 wuyi). See NOTICE.md.
import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import type { FloorMaterial, Opening, Project, Room, SpaceCode, Wall } from '../types';
import { polygonCentroid } from '../core/geometry';
import { MaterialKit } from './materials';
import { PrimitiveKit } from './primitives';

export interface ArchitectureContext {
  mats: MaterialKit;
  prims: PrimitiveKit;
  wx: (x: number) => number;
  wz: (y: number) => number;
}

const DEFAULT_FLOOR: Record<SpaceCode, FloorMaterial> = {
  KT: 'wood', CT: 'wood', ZW: 'wood', SF: 'wood', WS: 'wood',
  LRF: 'wood', XHF: 'wood', XCW: 'tile800', CF: 'tile600',
  WSJ: 'tile600', GDYT: 'tile800', YT: 'antislip', YMJ: 'wood',
  WSWSJ: 'tile600', CS: 'wood',
};

function floorForRoom(room: Room, ctx: ArchitectureContext): THREE.Mesh {
  const shape = new THREE.Shape();
  room.polygon.forEach(([x, y], i) => {
    if (i === 0) shape.moveTo(ctx.wx(x), ctx.wz(y));
    else shape.lineTo(ctx.wx(x), ctx.wz(y));
  });
  const geo = new THREE.ShapeGeometry(shape);
  geo.rotateX(Math.PI / 2);
  const mesh = new THREE.Mesh(geo, ctx.mats.floor(room.floorMaterial ?? DEFAULT_FLOOR[room.spaceCode] ?? 'wood'));
  mesh.position.y = 0.004;
  mesh.receiveShadow = true;
  mesh.userData.roomId = room.id;
  return mesh;
}

function wallLength(wall: Wall) {
  return Math.hypot(wall.b[0] - wall.a[0], wall.b[1] - wall.a[1]);
}

function wallAngle(wall: Wall) {
  return Math.atan2(wall.b[1] - wall.a[1], wall.b[0] - wall.a[0]);
}

function buildWall(wall: Wall, openings: Opening[], ctx: ArchitectureContext, ceiling: number) {
  const { prims, mats } = ctx;
  const group = new THREE.Group();
  group.position.set(ctx.wx(wall.a[0]), 0, ctx.wz(wall.a[1]));
  group.rotation.y = -wallAngle(wall);
  const len = wallLength(wall) / 1000;
  const t = Math.max(0.08, wall.thickness / 1000);
  const top = Math.min(ceiling, wall.height / 1000 || ceiling);

  const segment = (start: number, end: number, y0: number, y1: number, material: THREE.Material | string = mats.wall) => {
    const length = end - start;
    if (length <= 0.002 || y1 - y0 <= 0.002) return;
    const x = start + length / 2;
    group.add(prims.box(length, y1 - y0, t, material, x, y0, 0));
    group.add(prims.box(length, 0.035, t + 0.012, mats.cap, x, y1, 0));
  };

  const sorted = openings.slice().sort((a, b) => a.start - b.start);
  let cursor = 0;
  for (const opening of sorted) {
    const start = opening.start / 1000;
    const end = (opening.start + opening.width) / 1000;
    if (start > cursor) segment(cursor, start, 0, top);
    const width = end - start;
    const center = start + width / 2;
    if (opening.type === 'window') {
      const sill = (opening.sill ?? 900) / 1000;
      const head = Math.min(top, sill + opening.height / 1000);
      segment(start, end, 0, sill);
      if (head < top) segment(start, end, head, top);
      const gh = head - sill;
      if (gh > 0.02) {
        const pane = prims.box(width, gh, 0.018, mats.glass, center, sill, 0);
        pane.castShadow = false;
        group.add(pane);
        const mullions = Math.max(1, Math.round(width / 0.9));
        for (let i = 0; i <= mullions; i++) {
          const x = start + (width * i) / mullions;
          group.add(prims.box(0.035, gh, 0.055, mats.frame, x, sill, 0));
        }
        for (const y of [sill + 0.02, head - 0.02]) {
          group.add(prims.box(width, 0.035, 0.055, mats.frame, center, y, 0));
        }
      }
    } else if (opening.type === 'door' || opening.type === 'sliding') {
      const dh = Math.min(top, opening.height / 1000 || 2.1);
      if (dh < top) segment(start, end, dh, top);
      if (opening.type === 'sliding') {
        const panel = width * 0.54;
        for (const s of [-1, 1]) {
          const px = center + s * width * 0.235;
          const pane = prims.box(panel, Math.min(2.35, dh), 0.018, mats.glass, px, 0, 0.015 * s);
          pane.castShadow = false;
          group.add(pane);
          for (const y of [0.03, Math.min(2.35, dh) - 0.03]) {
            group.add(prims.box(panel, 0.04, 0.05, mats.frame, px, y, 0.015 * s));
          }
        }
      } else {
        group.add(prims.box(width * 0.92, 2.04, 0.04, mats.mat('#efe6d8', { roughness: 0.5 }), center, 0.02, 0.035));
        group.add(prims.cyl(0.022, 0.022, 0.04, mats.metal('#b9b3a8'), center + width * 0.34, 1.0, 0.075));
        for (const s of [-1, 1]) {
          group.add(prims.box(0.05, 2.1, 0.1, mats.frame, center + s * width * 0.5, 0, 0));
        }
        group.add(prims.box(width + 0.1, 0.05, 0.1, mats.frame, center, 2.08, 0));
      }
    }
    cursor = end;
  }
  if (cursor < len) segment(cursor, len, 0, top);
  return group;
}

export function buildArchitecture(
  project: Project,
  ctx: ArchitectureContext,
  groups: { floors: THREE.Group; walls: THREE.Group; labels: THREE.Group },
) {
  const openingsByWall = new Map<string, Opening[]>();
  for (const o of project.openings) {
    const list = openingsByWall.get(o.wallId) ?? [];
    list.push(o);
    openingsByWall.set(o.wallId, list);
  }
  for (const room of project.rooms) groups.floors.add(floorForRoom(room, ctx));
  for (const wall of project.walls) {
    groups.walls.add(buildWall(wall, openingsByWall.get(wall.id) ?? [], ctx, project.ceilingHeight / 1000));
  }
  for (const room of project.rooms) {
    const c = polygonCentroid(room.polygon);
    const el = document.createElement('div');
    el.className = 'scene-room-label';
    el.textContent = room.name;
    const obj = new CSS2DObject(el);
    obj.position.set(ctx.wx(c[0]), 0.16, ctx.wz(c[1]));
    groups.labels.add(obj);
  }
}

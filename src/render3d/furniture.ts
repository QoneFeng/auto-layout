// Adapted from floorplan-3d (MIT, Copyright (c) 2026 wuyi). See NOTICE.md.
import * as THREE from 'three';
import type { Furniture } from '../types';
import { MaterialKit } from './materials';
import { PrimitiveKit } from './primitives';

export interface FurnitureContext {
  mats: MaterialKit;
  prims: PrimitiveKit;
  wx: (x: number) => number;
  wz: (y: number) => number;
}

const COLORS: Record<string, string> = {
  bed: '#b5c8d5', nightstand: '#ddcdb7', wardrobe: '#e2d6c4', dresser: '#e2d6c4',
  sofa: '#9fb29a', coffeeTable: '#ddcdb7', tvCabinet: '#d8c19f', tv: '#1d1d1f',
  diningTable: '#c9ad8a', chair: '#bfb3a2', sideboard: '#e2d6c4', desk: '#d4b98f',
  bookshelf: '#d4b98f', kitchenCounter: '#dedad1', upperCabinet: '#e2d6c4',
  sink: '#e1e6ea', stove: '#dcdcdc', fridge: '#dfe4e8', toilet: '#ffffff',
  vanity: '#eef1f3', shower: '#e4edf2', bathtub: '#eef3f6',
  shoeCabinet: '#e2d6c4', bench: '#cdb48e', washingMachine: '#e6ebee',
  dryer: '#e6ebee', dryingRack: '#cfd6da', teaTable: '#e8dccb',
  displayCabinet: '#e2d6c4', island: '#dedad1', curtain: '#d8cfc2',
  console: '#e2d6c4', mirror: '#dfeaee', rug: '#c9b9a2',
};

const darker = (hex: string, k = 0.8) => '#' + new THREE.Color(hex).multiplyScalar(k).getHexString();
const lighter = (hex: string, k = 0.2) => '#' + new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), k).getHexString();

function rot<T extends THREE.Object3D>(o: T, x = 0, y = 0, z = 0): T {
  o.rotation.set(x, y, z);
  return o;
}

function cabinet(ctx: FurnitureContext, g: THREE.Group, w: number, d: number, c: string, height = 0.85) {
  const { prims, mats } = ctx;
  const bz = -d / 2;
  const material = mats.mat(c, { roughness: 0.55 });
  prims.legs(g, w, d, 0.1, mats.wood('#3a3027'), 0.05, 0.016);
  g.add(prims.box(w, height - 0.13, d - 0.02, material, 0, 0.1, -0.01));
  prims.fronts(g, -w / 2, 0.62, w, 0.2, d / 2 - 0.02, Math.max(1, Math.round(w / 0.5)), 1, material, 'bar');
  prims.fronts(g, -w / 2, 0.1, w, 0.52, d / 2 - 0.02, Math.max(1, Math.round(w / 0.5)), 1, material, 'bar', 0.52);
  g.add(prims.rbox(w + 0.02, 0.03, d + 0.01, mats.wood(darker(c, 0.78)), 0, height - 0.03, 0, 0.008));
  prims.vase(g, w * 0.3, height, 0, 0.07, 0.24, '#e9e2d6', Math.random, false);
  g.add(rot(prims.box(0.3, 0.38, 0.02, mats.wood('#3a3027'), -w * 0.25, height, bz + 0.06), -0.12));
  return bz;
}

export function buildFurniture(f: Furniture, ctx: FurnitureContext): THREE.Group {
  const { prims, mats } = ctx;
  const g = new THREE.Group();
  const w = f.rect[2] / 1000;
  const d = f.rect[3] / 1000;
  const c = COLORS[f.type] ?? '#d8d2c6';
  const bz = -d / 2;
  let seed = Math.round(f.rect[0] * 7 + f.rect[1] * 13 + w * 1000 + d * 1000);
  const random = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  switch (f.type) {
    case 'bed': {
      const frame = mats.wood('#8d7258');
      const fabric = mats.fabric(c);
      const fh = 0.3;
      const mt = 0.22;
      const top = fh + mt;
      const n = Math.max(3, Math.round(w / 0.28));
      const sw = (w - 0.04) / n;
      g.add(prims.box(w - 0.12, 0.06, d - 0.14, '#4a3e33', 0, 0, 0.03));
      g.add(prims.rbox(w, fh - 0.06, d - 0.08, frame, 0, 0.06, 0.04, 0.015));
      g.add(prims.rbox(w, 1.08, 0.06, frame, 0, 0, bz + 0.03, 0.012));
      for (let i = 0; i < n; i++) {
        g.add(prims.rbox(sw - 0.006, 0.62, 0.06, mats.fabric(darker(c, 0.8)), -w / 2 + 0.02 + sw * (i + 0.5), 0.42, bz + 0.08, 0.025));
      }
      const md = d - 0.13;
      const dd = md * 0.66;
      const dz = d / 2 - 0.015 - dd / 2;
      g.add(prims.rbox(w - 0.06, mt, md, '#f6f3ee', 0, fh, bz + 0.11 + md / 2, 0.07));
      g.add(prims.rbox(w + 0.02, 0.27, dd, fabric, 0, top - 0.2, dz, 0.04));
      g.add(prims.rbox(w + 0.024, 0.06, 0.22, mats.fabric('#fbfaf7'), 0, top + 0.025, dz - dd / 2 + 0.11, 0.025));
      g.add(prims.rbox(w + 0.05, 0.285, 0.42, mats.fabric(darker(c, 0.62)), 0, top - 0.205, d / 2 - 0.35, 0.03));
      const np = w >= 1.3 ? 2 : 1;
      const pw = (w - 0.16 - (np - 1) * 0.06) / np;
      for (let i = 0; i < np; i++) {
        const x = -w / 2 + 0.08 + pw / 2 + i * (pw + 0.06);
        g.add(rot(prims.rbox(pw, 0.15, 0.42, mats.fabric('#ffffff'), x, top - 0.01, bz + 0.34, 0.07), -0.28));
        g.add(rot(prims.rbox(pw * 0.62, 0.3, 0.1, mats.fabric(i ? '#efe7da' : darker(c, 0.7)), x, top, bz + 0.54, 0.045), -0.3));
      }
      break;
    }
    case 'sofa':
    case 'bench': {
      const fabric = mats.fabric(c);
      const dark = mats.fabric(darker(c, 0.88));
      const arm = Math.min(0.18, w * 0.14);
      const n = w > 2.2 ? 3 : 2;
      const cw = (w - 2 * arm) / n;
      const bd = Math.min(0.2, d * 0.24);
      const lh = 0.12;
      const sd = d - bd - 0.02;
      prims.legs(g, w, d, lh, mats.wood('#3a3027'), 0.07, 0.018);
      g.add(prims.rbox(w, 0.16, d, dark, 0, lh, 0, 0.03));
      g.add(prims.rbox(w, 0.73, bd, dark, 0, lh, bz + bd / 2, 0.06));
      for (const s of [-1, 1]) g.add(prims.rbox(arm, 0.5, d, dark, s * (w / 2 - arm / 2), lh, 0, 0.07));
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + arm + cw / 2 + i * cw;
        g.add(prims.rbox(cw - 0.012, 0.15, sd, fabric, x, lh + 0.16, bz + bd + sd / 2, 0.055));
        g.add(rot(prims.rbox(cw - 0.03, 0.44, 0.16, fabric, x, lh + 0.3, bz + bd + 0.08, 0.07), -0.16));
      }
      if (n > 1) {
        for (const s of [-1, 1]) {
          g.add(rot(prims.rbox(0.42, 0.42, 0.12, mats.fabric(s < 0 ? '#ece5d8' : darker(c, 0.7)), s * (w / 2 - arm - 0.26), lh + 0.32, bz + bd + 0.22, 0.06), -0.3, s * -0.25));
        }
      }
      break;
    }
    case 'nightstand': {
      const wood = mats.wood(c);
      prims.legs(g, w, d, 0.1, mats.wood('#5a4a3b'), 0.04, 0.014);
      g.add(prims.rbox(w, 0.4, d - 0.02, wood, 0, 0.1, -0.01, 0.012));
      prims.fronts(g, -w / 2 + 0.02, 0.12, w - 0.04, 0.36, d / 2 - 0.02, 1, 2, wood, 'bar');
      prims.tableLamp(g, -w * 0.12, 0.5, -d * 0.12, 0.85);
      break;
    }
    case 'wardrobe': {
      const material = mats.mat(c, { roughness: 0.55 });
      const h = 2.2;
      const n = Math.max(1, Math.round(w / 0.5));
      g.add(prims.box(w - 0.02, 0.08, d - 0.06, '#4a4641', 0, 0, -0.03));
      g.add(prims.box(w, h - 0.08, d - 0.02, material, 0, 0.08, -0.01));
      prims.fronts(g, -w / 2, 0.08, w, h - 0.1, d / 2 - 0.02, n, 1, material, 'bar', 1.05);
      g.add(prims.box(w, 0.02, d - 0.02, darker(c, 0.9), 0, h - 0.02, -0.01));
      break;
    }
    case 'desk': {
      const wood = mats.wood(c);
      const metal = mats.blackMetal();
      g.add(prims.rbox(w, 0.025, d, wood, 0, 0.72, 0, 0.006));
      for (const s of [-1, 1]) {
        const x = s * (w / 2 - 0.06);
        g.add(prims.box(0.03, 0.72, 0.03, metal, x, 0, d / 2 - 0.06));
        g.add(prims.box(0.03, 0.72, 0.03, metal, x, 0, bz + 0.06));
        g.add(prims.box(0.03, 0.03, d - 0.1, metal, x, 0, 0));
      }
      g.add(prims.rbox(0.62, 0.37, 0.02, '#1d1d1f', 0, 0.86, bz + 0.12, 0.006));
      g.add(prims.box(0.6, 0.33, 0.002, mats.screen('#27405c'), 0, 0.89, bz + 0.135));
      const lx = -w / 2 + 0.15;
      const lz = bz + 0.12;
      g.add(prims.cyl(0.07, 0.075, 0.02, metal, lx, 0.745, lz, 28));
      g.add(prims.rod([lx, 0.765, lz], [lx, 1.05, lz + 0.03], 0.008, metal));
      break;
    }
    case 'diningTable':
    case 'teaTable':
    case 'coffeeTable': {
      const isCoffee = f.type === 'coffeeTable' || f.type === 'teaTable';
      const top = isCoffee ? 0.4 : 0.75;
      const material = mats.mat(c, { roughness: 0.4 });
      const leg = mats.wood(darker(c, 0.55));
      for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
        g.add(prims.rod([a * (w / 2 - 0.08), 0, b * (d / 2 - 0.08)], [a * (w / 2 - 0.1), top - 0.035, b * (d / 2 - 0.1)], 0.016, leg, 0.026));
      }
      g.add(prims.rbox(w, 0.035, d, material, 0, top - 0.035, 0, 0.012));
      if (isCoffee) {
        g.add(prims.rbox(w - 0.12, 0.02, d - 0.12, mats.wood(darker(c, 0.85)), 0, 0.12, 0, 0.006));
        g.add(prims.box(0.3, 0.03, 0.22, '#2f5d62', w * 0.2, 0.14, 0));
        g.add(prims.rbox(0.38, 0.015, 0.24, mats.wood('#6b543f'), -w * 0.2, top - 0.02, 0, 0.006));
        g.add(prims.box(0.22, 0.025, 0.16, '#e6dccd', -w * 0.22, top, 0));
        prims.vase(g, w * 0.24, top - 0.01, -0.05, 0.055, 0.18, '#e9e2d6', random, false);
      } else {
        g.add(prims.box(w - 0.22, 0.07, d - 0.22, leg, 0, top - 0.1, 0));
        g.add(prims.box(w * 0.7, 0.003, 0.32, mats.fabric('#b9a58c'), 0, top, 0));
        prims.vase(g, 0, top + 0.003, 0, 0.06, 0.2, '#e9e2d6', random, false);
      }
      break;
    }
    case 'chair': {
      const wood = mats.wood('#6b543f');
      const fabric = mats.fabric(c);
      const sy = 0.44;
      for (const s of [-1, 1]) g.add(prims.rod([s * (w / 2 - 0.04), 0, d / 2 - 0.05], [s * (w / 2 - 0.05), sy, d / 2 - 0.07], 0.012, wood, 0.018));
      for (const s of [-1, 1]) g.add(prims.rod([s * (w / 2 - 0.04), 0, bz + 0.03], [s * (w / 2 - 0.05), 0.86, bz + 0.07], 0.012, wood, 0.018));
      g.add(prims.box(w - 0.06, 0.04, d - 0.1, wood, 0, sy - 0.03, 0));
      g.add(prims.rbox(w - 0.04, 0.05, d - 0.08, fabric, 0, sy, 0.005, 0.022));
      g.add(rot(prims.rbox(w - 0.08, 0.15, 0.025, wood, 0, 0.66, bz + 0.065, 0.012), -0.12));
      break;
    }
    case 'tvCabinet': {
      const material = mats.mat(c, { roughness: 0.5 });
      const n = Math.max(2, Math.round(w / 0.6));
      prims.legs(g, w, d, 0.1, mats.blackMetal(), 0.08, 0.012);
      g.add(prims.rbox(w, 0.4, d - 0.02, material, 0, 0.1, -0.01, 0.01));
      prims.fronts(g, -w / 2 + 0.005, 0.105, w - 0.01, 0.39, d / 2 - 0.02, n, 1, material, 'edge');
      g.add(prims.rbox(1.45, 0.84, 0.025, mats.mat('#18181a', { roughness: 0.4, metalness: 0.3 }), 0, 0.95, bz + 0.03, 0.004));
      g.add(prims.box(1.43, 0.81, 0.002, mats.screen(), 0, 0.962, bz + 0.0435));
      prims.vase(g, w / 2 - 0.25, 0.5, 0, 0.06, 0.26, '#d8cfc2', random, false);
      break;
    }
    case 'tv': {
      const th = w * 0.5625;
      const yb = 1.2 - th / 2;
      const z = bz + 0.03;
      g.add(prims.rbox(w, th, 0.025, mats.mat('#18181a', { roughness: 0.4, metalness: 0.3 }), 0, yb, z + 0.01, 0.004));
      g.add(prims.box(w - 0.016, th - 0.022, 0.002, mats.screen('#1f2b3a'), 0, yb + 0.014, z + 0.0235));
      break;
    }
    case 'rug': {
      const layers: Array<[number, number, number, string, number]> = [
        [w, d, 0.01, c, 0],
        [w - 0.16, d - 0.16, 0.002, darker(c, 0.82), 0.01],
        [w - 0.26, d - 0.26, 0.002, lighter(c, 0.12), 0.0115],
      ];
      for (const [a, b, h, cc, y] of layers) {
        const rug = prims.box(a, h, b, mats.mat(cc, { roughness: 1 }), 0, y + 0.002);
        rug.castShadow = false;
        g.add(rug);
      }
      break;
    }
    case 'kitchenCounter':
    case 'island': {
      const material = mats.mat(c, { roughness: 0.45 });
      const stone = mats.mat('#dcd7cf', { roughness: 0.22 });
      const n = Math.max(1, Math.round(w / 0.6));
      const cd = f.type === 'island' ? d - 0.3 : d - 0.04;
      g.add(prims.box(w - 0.01, 0.1, cd - 0.1, '#4a4641', 0, 0, -0.05));
      g.add(prims.box(w, 0.72, cd - 0.04, material, 0, 0.1, -0.02));
      prims.fronts(g, -w / 2, 0.64, w, 0.18, d / 2 - 0.04, n, 1, material, 'bar');
      prims.fronts(g, -w / 2, 0.1, w, 0.54, d / 2 - 0.04, n, 1, material, 'bar', 0.56);
      g.add(prims.rbox(w + 0.01, 0.04, d, stone, 0, 0.82, 0, 0.004));
      if (f.type === 'kitchenCounter') {
        g.add(prims.box(w, 0.7, 0.33, material, 0, 1.48, bz + 0.165));
        prims.fronts(g, -w / 2, 1.48, w, 0.7, bz + 0.33, n, 1, material, 'bar', 1.56);
        g.add(prims.box(w - 0.04, 0.01, 0.02, mats.glow('#fff7e6', '#ffe9c4', 0.8), 0, 1.47, bz + 0.29));
      }
      break;
    }
    case 'upperCabinet': {
      const material = mats.mat(c, { roughness: 0.55 });
      const n = Math.max(1, Math.round(w / 0.45));
      g.add(prims.box(w, 0.7, d - 0.02, material, 0, 1.5, -0.01));
      prims.fronts(g, -w / 2, 1.5, w, 0.68, d / 2 - 0.02, n, 1, material, 'bar', 1.82);
      g.add(prims.box(w - 0.04, 0.01, 0.02, mats.glow('#fff7e6', '#ffe9c4', 0.8), 0, 1.49, d / 2 - 0.05));
      break;
    }
    case 'stove': {
      const steel = mats.mat('#b9bec3', { metalness: 0.8, roughness: 0.3 });
      g.add(prims.rbox(w, 0.012, d, mats.mat('#0d0d0e', { roughness: 0.06, metalness: 0.3 }), 0, 0.862, 0, 0.004));
      for (const [x, z] of (w / d > 1.4 ? [[-w / 4, 0], [w / 4, 0]] : [[-w / 4, -d / 4], [w / 4, -d / 4], [-w / 4, d / 4], [w / 4, d / 4]])) {
        g.add(prims.cyl(0.085, 0.09, 0.008, '#2b2b2b', x, 0.874, z, 32));
        g.add(prims.cyl(0.045, 0.05, 0.014, mats.mat('#6b5a45', { metalness: 0.7, roughness: 0.35 }), x, 0.874, z, 28));
      }
      g.add(prims.rbox(w, 0.06, 0.5, steel, 0, 1.55, bz + 0.25, 0.01));
      break;
    }
    case 'sink': {
      const steel = mats.mat('#c7ccd1', { metalness: 0.85, roughness: 0.28 });
      const inner = mats.mat('#9aa1a8', { metalness: 0.8, roughness: 0.35 });
      g.add(prims.box(w, 0.008, d, steel, 0, 0.862, 0));
      g.add(prims.shell(w * 0.8, d * 0.66, 0.02, 0.015, 0.04, steel, 0, 0.862, 0.03));
      g.add(prims.box(w * 0.75, 0.002, d * 0.6, inner, 0, 0.87, 0.03));
      const fx = w * 0.3;
      g.add(prims.cyl(0.025, 0.028, 0.03, mats.chrome(), fx, 0.87, bz + 0.06, 20));
      g.add(prims.tube([[fx, 0.9, bz + 0.06], [fx, 1.12, bz + 0.06], [fx, 1.17, bz + 0.1], [fx, 1.14, bz + 0.18], [fx, 1.08, bz + 0.2]], 0.012, mats.chrome()));
      break;
    }
    case 'fridge': {
      const material = mats.mat(c, { metalness: 0.45, roughness: 0.28 });
      const h = 1.8;
      const fz = d / 2 - 0.05;
      g.add(prims.box(w - 0.02, 0.06, d - 0.06, '#2a2c2e', 0, 0, -0.03));
      g.add(prims.rbox(w, h - 0.06, d - 0.05, material, 0, 0.06, -0.025, 0.02));
      g.add(prims.box(w - 0.01, h - 0.07, 0.003, '#2a2c2e', 0, 0.065, fz + 0.0015));
      if (w > 0.85) {
        for (const s of [-1, 1]) {
          g.add(prims.rbox(w / 2 - 0.004, h - 0.08, 0.04, material, s * w / 4, 0.07, fz + 0.023, 0.012));
          prims.pull(g, 0.8, true, s * 0.035, 1.05, fz + 0.043);
        }
      } else {
        g.add(prims.rbox(w - 0.006, 1.06, 0.04, material, 0, 0.72, fz + 0.023, 0.012));
        g.add(prims.rbox(w - 0.006, 0.64, 0.04, material, 0, 0.07, fz + 0.023, 0.012));
        prims.pull(g, 0.5, true, -w / 2 + 0.06, 1.05, fz + 0.043);
      }
      break;
    }
    case 'toilet': {
      const cer = mats.ceramic();
      const Rb = w * 0.45;
      const zc = bz + d * 0.62;
      const kz = (d * 0.37) / Rb;
      g.add(prims.rbox(w * 0.88, 0.4, d * 0.24, cer, 0, 0.36, bz + d * 0.12, 0.04));
      g.add(prims.rbox(w * 0.92, 0.03, d * 0.27, cer, 0, 0.76, bz + d * 0.135, 0.012));
      const pedestal = prims.lathe([[0, 0], [Rb * 0.62, 0], [Rb * 0.66, 0.02], [Rb * 0.56, 0.12], [Rb * 0.62, 0.22], [Rb * 0.92, 0.33], [Rb, 0.37]], cer, 0, 0, zc, 40);
      const seat = prims.cyl(Rb * 1.01, Rb * 1.01, 0.022, mats.mat('#f4f4f2', { roughness: 0.2 }), 0, 0.37, zc, 40);
      pedestal.scale.z = seat.scale.z = kz;
      g.add(pedestal, seat);
      break;
    }
    case 'vanity': {
      const material = mats.mat(c, { roughness: 0.5 });
      const stone = mats.mat('#fafafa', { roughness: 0.18 });
      const nb = w >= 1.1 ? 2 : 1;
      const cd = d - 0.04;
      g.add(prims.rbox(w, 0.45, cd, material, 0, 0.33, bz + cd / 2, 0.008));
      prims.fronts(g, -w / 2 + 0.005, 0.335, w - 0.01, 0.44, d / 2 - 0.04, nb, 2, material, 'edge');
      g.add(prims.rbox(w, 0.03, d, stone, 0, 0.78, 0, 0.006));
      const rb = Math.min(0.19, (w / nb) * 0.36);
      for (let i = 0; i < nb; i++) {
        const x = nb === 1 ? 0 : (i ? w / 4 : -w / 4);
        g.add(prims.lathe([[0, 0], [rb * 0.55, 0], [rb * 0.85, 0.03], [rb, 0.1], [rb * 0.97, 0.12]], mats.ceramic({ side: THREE.DoubleSide }), x, 0.81, 0.03, 40));
        g.add(prims.cyl(0.02, 0.022, 0.02, mats.chrome(), x, 0.81, bz + 0.06, 16));
        g.add(prims.tube([[x, 0.83, bz + 0.06], [x, 1.03, bz + 0.06], [x, 1.07, bz + 0.11], [x, 1.03, bz + 0.15]], 0.01, mats.chrome()));
      }
      const mw = Math.min(w * 0.9, nb * 0.7);
      g.add(prims.rbox(mw + 0.02, 0.82, 0.02, mats.glow('#fff7e6', '#ffe9c4', 0.9), 0, 1.14, bz + 0.01, 0.01));
      g.add(prims.box(mw, 0.8, 0.01, mats.mirror(), 0, 1.15, bz + 0.025));
      break;
    }
    case 'shower': {
      g.add(prims.rbox(w, 0.05, d, mats.mat('#f4f4f2', { roughness: 0.3 }), 0, 0, 0, 0.01));
      const paneA = prims.box(w, 1.95, 0.01, mats.glass, 0, 0.05, d / 2 - 0.005);
      const paneB = prims.box(0.01, 1.95, d, mats.glass, w / 2 - 0.005, 0.05, 0);
      paneA.castShadow = false;
      paneB.castShadow = false;
      g.add(paneA, paneB);
      g.add(prims.box(0.02, 1.95, 0.02, mats.frame, w / 2 - 0.01, 0.05, d / 2 - 0.01));
      g.add(prims.rod([-w / 4, 1.1, bz + 0.03], [-w / 4, 1.95, bz + 0.03], 0.012, mats.chrome()));
      g.add(prims.rbox(0.24, 0.012, 0.24, mats.chrome(), -w / 4, 1.95, bz + 0.25, 0.004));
      break;
    }
    case 'bathtub': {
      const cer = mats.ceramic();
      const h = 0.56;
      const t = 0.07;
      g.add(prims.shell(w, d, h, t, 0.14, cer));
      g.add(prims.box(w - 2 * t + 0.004, 0.004, d - 2 * t + 0.004, mats.mat('#bfe0ea', { roughness: 0.03, transparent: true, opacity: 0.6 }), 0, 0.4, 0));
      const fx = w / 2 - t / 2;
      g.add(prims.tube([[fx, h - 0.02, 0], [fx, h + 0.1, 0], [fx - 0.06, h + 0.13, 0], [fx - 0.13, h + 0.09, 0]], 0.014, mats.chrome()));
      break;
    }
    case 'washingMachine':
    case 'dryer': {
      const material = mats.mat(c, { roughness: 0.35 });
      const R0 = Math.min(w, d) * 0.25;
      const fz = d / 2 - 0.02;
      g.add(prims.box(w - 0.02, 0.04, d - 0.04, '#8f969b', 0, 0, -0.02));
      g.add(prims.rbox(w, 0.81, d - 0.02, material, 0, 0.04, -0.01, 0.025));
      g.add(prims.box(w - 0.04, 0.1, 0.006, lighter(c, 0.3), 0, 0.72, fz + 0.003));
      g.add(prims.box(0.12, 0.035, 0.003, mats.screen('#1f6f6a'), w * 0.14, 0.745, fz + 0.007));
      const drum = new THREE.Mesh(new THREE.CircleGeometry(R0, 40), mats.mat('#1b1f22', { roughness: 0.6 }));
      drum.position.set(0, 0.4, fz + 0.004);
      g.add(drum);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R0 + 0.02, 0.022, 14, 48), mats.mat('#c7cfd5', { metalness: 0.7, roughness: 0.25 }));
      ring.position.set(0, 0.4, fz + 0.016);
      prims.shadow(ring);
      g.add(ring);
      break;
    }
    case 'bookshelf': {
      const h = 1.8;
      const t = 0.022;
      const ns = 5;
      const wood = mats.wood(c);
      const sh = (h - 0.06 - t) / ns;
      g.add(prims.box(w, h, 0.012, mats.wood(darker(c, 0.85)), 0, 0, bz + 0.006));
      g.add(prims.box(t, h, d, wood, -w / 2 + t / 2, 0, 0));
      g.add(prims.box(t, h, d, wood, w / 2 - t / 2, 0, 0));
      for (let s = 0; s <= ns; s++) {
        const y = s < ns ? 0.06 + s * sh : h - t;
        g.add(prims.box(w - 2 * t, t, d - 0.012, wood, 0, y, 0.006));
        if (s === ns) break;
        let x = -w / 2 + t + 0.01;
        while (x < w / 2 - t - 0.05) {
          const bw = 0.02 + random() * 0.03;
          const bh = Math.min(sh - t - 0.03, 0.17 + random() * 0.13);
          const bd = d * (0.62 + random() * 0.22);
          if (x + bw > w / 2 - t) break;
          const colors = ['#b88a6a', '#6f8f8a', '#d9c08c', '#9aa58c', '#a8675e', '#e6dccd'];
          g.add(prims.box(bw, bh, bd, mats.mat(colors[Math.floor(random() * colors.length)], { roughness: 0.75 }), x + bw / 2, y + t, d / 2 - 0.015 - bd / 2));
          x += bw + 0.004;
        }
      }
      break;
    }
    case 'shoeCabinet': {
      const material = mats.mat(c, { roughness: 0.55 });
      const h = 1.0;
      const y0 = 0.16;
      const n = Math.max(1, Math.round(w / 0.45));
      g.add(prims.box(w, h - y0, d - 0.02, material, 0, y0, -0.01));
      g.add(prims.box(w - 0.04, 0.01, 0.03, mats.glow('#fff7e6', '#ffe9c4', 0.8), 0, y0 - 0.01, d / 2 - 0.06));
      prims.fronts(g, -w / 2, y0, w, h - y0, d / 2 - 0.02, n, 1, material, 'edge');
      g.add(prims.rbox(w + 0.01, 0.025, d, mats.wood(darker(c, 0.8)), 0, h, 0, 0.006));
      break;
    }
    case 'displayCabinet': {
      const material = mats.mat(c, { roughness: 0.55 });
      const h = 2.0;
      g.add(prims.box(w, h, d - 0.02, material, 0, 0, -0.01));
      g.add(prims.box(w - 0.08, h - 0.12, 0.01, mats.glass, 0, 0.06, d / 2 - 0.03));
      for (let i = 1; i < 4; i++) g.add(prims.box(w - 0.08, 0.02, d - 0.1, material, 0, i * (h / 4), 0));
      break;
    }
    case 'dresser': {
      const material = mats.wood(c);
      prims.legs(g, w, d, 0.1, mats.wood('#3a3027'), 0.05, 0.016);
      g.add(prims.box(w, 0.7, d - 0.02, material, 0, 0.1, -0.01));
      prims.fronts(g, -w / 2 + 0.03, 0.12, w - 0.06, 0.66, d / 2 - 0.02, 2, 3, material, 'knob');
      g.add(prims.box(w * 0.8, 0.8, 0.02, mats.mirror(), 0, 1.0, bz + 0.02));
      break;
    }
    case 'mirror': {
      const h = Math.max(1.2, f.height / 1000);
      g.add(prims.rbox(w, h, 0.03, mats.wood('#6b543f'), 0, 0.9, bz + 0.02, 0.01));
      g.add(prims.box(w - 0.08, h - 0.08, 0.01, mats.mirror(), 0, 0.94, bz + 0.04));
      break;
    }
    case 'curtain': {
      const h = Math.max(1.8, f.height / 1000);
      const fabric = mats.fabric(c);
      g.add(prims.box(w, 0.04, 0.04, mats.wood('#6b543f'), 0, h, bz + 0.02));
      const folds = Math.max(3, Math.round(w / 0.18));
      for (let i = 0; i < folds; i++) {
        const fw = w / folds;
        g.add(prims.rbox(fw * 0.8, h, 0.06, fabric, -w / 2 + fw * (i + 0.5), 0, bz + 0.06, 0.02));
      }
      break;
    }
    case 'dryingRack': {
      const h = 1.7;
      for (const s of [-1, 1]) g.add(prims.rod([s * (w / 2 - 0.05), 0, 0], [s * (w / 2 - 0.05), h, 0], 0.015, mats.metal()));
      for (let i = 0; i < 4; i++) g.add(prims.rod([-w / 2, h - i * 0.18, 0], [w / 2, h - i * 0.18, 0], 0.01, mats.metal()));
      break;
    }
    case 'console':
    case 'sideboard': {
      cabinet(ctx, g, w, d, c, 0.85);
      break;
    }
    default: {
      g.add(prims.rbox(w, Math.max(0.3, f.height / 1000), d, mats.mat(c, { roughness: 0.75 }), 0, 0, 0, 0.03));
    }
  }

  g.position.set(ctx.wx(f.rect[0] + f.rect[2] / 2), 0, ctx.wz(f.rect[1] + f.rect[3] / 2));
  g.rotation.y = (-f.rotation * Math.PI) / 180;
  g.userData.furnitureId = f.id;
  return g;
}

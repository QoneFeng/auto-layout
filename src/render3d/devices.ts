import * as THREE from 'three';
import type { PlacedDevice, Project } from '../types';
import { MaterialKit } from './materials';
import { PrimitiveKit } from './primitives';

export interface DeviceContext {
  mats: MaterialKit;
  prims: PrimitiveKit;
  wx: (x: number) => number;
  wz: (y: number) => number;
}

interface DeviceOptions {
  lightsOn: boolean;
  showGlow: boolean;
  selectedDeviceId: string | null;
}

export function visualOf(d: PlacedDevice) {
  if (d.visual && d.visual !== 'none') return d.visual;
  const key = d.deviceKey || d.deviceType2;
  if (key.includes('口字灯带')) return 'rect';
  if (key.includes('L 型灯带')) return 'l';
  if (key.includes('U 型灯带')) return 'u';
  if (key.includes('灯带')) return 'line';
  if (key.includes('轨道')) return 'track';
  if (key.includes('一字组')) return 'array';
  if (key.includes('口字组')) return 'pointRect';
  return 'point';
}

function glowRadius(d: PlacedDevice) {
  const z = Math.max(500, d.position.z);
  const angle = d.deviceType2.includes('射灯') ? 36 : d.deviceType2.includes('吊灯') ? 120 : 70;
  return Math.max(0.35, Math.min(2.8, (z * Math.tan((angle / 2) * Math.PI / 180) * 1.25) / 1000));
}

let glowTexture: THREE.CanvasTexture | null = null;
function makeGlowTexture() {
  if (glowTexture) return glowTexture;
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  gradient.addColorStop(0, 'rgba(255,240,190,0.95)');
  gradient.addColorStop(0.25, 'rgba(255,198,100,0.45)');
  gradient.addColorStop(0.65, 'rgba(255,166,60,0.12)');
  gradient.addColorStop(1, 'rgba(255,166,60,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  glowTexture = new THREE.CanvasTexture(canvas);
  glowTexture.colorSpace = THREE.SRGBColorSpace;
  return glowTexture;
}

function addBox(g: THREE.Group, prims: PrimitiveKit, w: number, h: number, d: number, x: number, y: number, z: number, material: THREE.Material) {
  const mesh = prims.box(w, h, d, material, x, y, z);
  g.add(mesh);
  return mesh;
}

function buildDeviceMesh(d: PlacedDevice, g: THREE.Group, ctx: DeviceContext, material: THREE.Material, accent: THREE.Material) {
  const { prims } = ctx;
  const v = visualOf(d);
  const w = d.size.width / 1000;
  const depth = Math.max(0.06, d.size.depth / 1000);
  const t = 0.045;

  if (v === 'line') {
    addBox(g, prims, w, t, depth, 0, 0, 0, material);
    addBox(g, prims, w * 0.99, 0.012, depth * 0.62, 0, -0.012, 0, accent);
  } else if (v === 'l') {
    const h = Math.max(depth, 0.45);
    addBox(g, prims, t, t, h, -w / 2, 0, 0, material);
    addBox(g, prims, w, t, t, 0, 0, -h / 2, material);
    addBox(g, prims, t * 0.4, 0.012, h, -w / 2, -0.012, 0, accent);
    addBox(g, prims, w, 0.012, t * 0.4, 0, -0.012, -h / 2, accent);
  } else if (v === 'u') {
    const h = Math.max(depth, 0.45);
    for (const x of [-w / 2, w / 2]) {
      addBox(g, prims, t, t, h, x, 0, 0, material);
      addBox(g, prims, t * 0.4, 0.012, h, x, -0.012, 0, accent);
    }
    addBox(g, prims, w, t, t, 0, 0, h / 2, material);
    addBox(g, prims, w, 0.012, t * 0.4, 0, -0.012, h / 2, accent);
  } else if (v === 'rect') {
    const h = Math.max(depth, 0.45);
    for (const z of [-h / 2, h / 2]) {
      addBox(g, prims, w, t, t, 0, 0, z, material);
      addBox(g, prims, w, 0.012, t * 0.4, 0, -0.012, z, accent);
    }
    for (const x of [-w / 2, w / 2]) {
      addBox(g, prims, t, t, h, x, 0, 0, material);
      addBox(g, prims, t * 0.4, 0.012, h, x, -0.012, 0, accent);
    }
  } else if (v === 'track') {
    addBox(g, prims, w, 0.035, Math.max(depth, 0.06), 0, 0, 0, material);
    addBox(g, prims, w, 0.01, 0.028, 0, -0.02, 0, accent);
    for (const k of [0.2, 0.4, 0.6, 0.8]) {
      const head = prims.cyl(0.06, 0.06, 0.08, material, -w / 2 + w * k, -0.05, 0, 16);
      g.add(head);
      g.add(prims.cyl(0.025, 0.025, 0.015, accent, -w / 2 + w * k, -0.06, 0, 16));
    }
  } else if (v === 'array') {
    for (const k of [-1, 0, 1]) {
      const x = (k * w) / 3.2;
      g.add(prims.cyl(0.09, 0.09, 0.06, material, x, 0, 0, 18));
      g.add(prims.cyl(0.055, 0.055, 0.012, accent, x, -0.03, 0, 18));
    }
  } else if (v === 'pointRect') {
    const h = Math.max(depth, 0.45);
    for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      const x = (sx * w) / 2;
      const z = (sz * h) / 2;
      g.add(prims.cyl(0.09, 0.09, 0.06, material, x, 0, z, 18));
      g.add(prims.cyl(0.055, 0.055, 0.012, accent, x, -0.03, z, 18));
    }
  } else if (d.category1 === '控制') {
    addBox(g, prims, 0.16, 0.02, 0.12, 0, 0, 0, material);
    addBox(g, prims, 0.11, 0.012, 0.07, 0, -0.016, 0, accent);
  } else if (d.category1 === '环境') {
    g.add(prims.cyl(0.08, 0.1, 0.045, material, 0, 0, 0, 24));
    g.add(prims.cyl(0.035, 0.035, 0.01, accent, 0, -0.026, 0, 20));
  } else if (d.category1 === '安防监控') {
    if (d.deviceType2.includes('门锁')) {
      addBox(g, prims, 0.09, 0.22, 0.035, 0, 0, 0, material);
      addBox(g, prims, 0.05, 0.1, 0.012, 0, -0.12, 0.02, accent);
    } else {
      g.add(prims.cyl(0.055, 0.075, 0.09, material, 0, 0, 0, 20));
      g.add(prims.cyl(0.028, 0.028, 0.012, accent, 0, -0.045, 0.02, 16));
    }
  } else if (d.category1 === '音乐') {
    g.add(prims.cyl(0.12, 0.12, 0.035, material, 0, 0, 0, 32));
    for (let i = 0; i < 6; i++) g.add(prims.cyl(0.005, 0.005, 0.008, accent, -0.06 + i * 0.024, -0.02, 0, 8));
  } else if (d.category1 === '暖通') {
    addBox(g, prims, Math.max(0.7, w), 0.22, 0.25, 0, 0, 0, material);
    addBox(g, prims, Math.max(0.6, w * 0.92), 0.012, 0.02, 0, -0.11, 0.04, accent);
  } else if (d.category1 === '灯光' && (d.deviceType2.includes('吸顶灯') || d.deviceType2.includes('面板灯') || d.deviceType2.includes('格栅灯'))) {
    if (d.deviceType2.includes('面板灯') || d.deviceType2.includes('格栅灯')) {
      addBox(g, prims, 0.52, 0.035, 0.52, 0, 0, 0, material);
      addBox(g, prims, 0.46, 0.012, 0.46, 0, -0.022, 0, accent);
    } else {
      g.add(prims.cyl(0.22, 0.22, 0.035, material, 0, 0, 0, 32));
      g.add(prims.cyl(0.18, 0.18, 0.012, accent, 0, -0.026, 0, 32));
    }
  } else if (d.category1 === '灯光' && d.deviceType2.includes('吊灯')) {
    g.add(prims.cyl(0.012, 0.012, 0.55, material, 0, -0.55, 0, 8));
    g.add(prims.lathe([[0.28, 0], [0.2, 0.2], [0.05, 0.3]], accent, 0, -0.32, 0, 40));
  } else {
    g.add(prims.cyl(0.09, 0.09, 0.06, material, 0, 0, 0, 20));
    g.add(prims.cyl(0.055, 0.055, 0.012, accent, 0, -0.03, 0, 18));
  }
}

export function buildDevices(project: Project, ctx: DeviceContext, options: DeviceOptions): THREE.Group {
  const root = new THREE.Group();
  const all = [...project.devices, ...project.wholeHouseDevices];
  let lightCount = 0;

  for (const d of all) {
    const group = new THREE.Group();
    group.position.set(ctx.wx(d.position.x), Math.max(0.02, d.position.z / 1000), ctx.wz(d.position.y));
    group.rotation.y = (-d.rotation * Math.PI) / 180;
    group.userData.deviceId = d.id;

    const isLight = d.category1 === '灯光';
    const bodyColor = isLight ? '#262a2f' : d.category1 === '控制' ? '#d7d1c6' : '#3b4149';
    const body = ctx.mats.mat(bodyColor, {
      roughness: isLight ? 0.42 : 0.6,
      metalness: isLight ? 0.35 : 0.15,
      emissive: isLight ? '#ffc46b' : '#7fa4c8',
      emissiveIntensity: options.lightsOn && isLight ? 0.85 : 0.08,
    });
    const accent = ctx.mats.glow(
      isLight ? '#fff4d6' : '#9fc2dd',
      isLight ? '#ffd08a' : '#8eb8e0',
      options.lightsOn && isLight ? 1.6 : 0.18,
    );
    buildDeviceMesh(d, group, ctx, body, accent);

    if (options.showGlow && options.lightsOn && isLight && d.glow !== 'none') {
      const spriteMaterial = new THREE.SpriteMaterial({
        map: makeGlowTexture(),
        color: 0xffc46b,
        transparent: true,
        opacity: d.glow === 'line' ? 0.22 : 0.36,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const v = visualOf(d);
      if (['line', 'l', 'u', 'rect', 'track'].includes(v)) {
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(Math.max(1.1, (d.size.width / 1000) * 0.75), Math.max(0.55, (d.size.depth / 1000) * 1.2), 1);
        group.add(sprite);
      } else if (v === 'array' || v === 'pointRect') {
        const points = v === 'array' ? [-1, 0, 1] : [-1, 1];
        for (const p of points) {
          const sprite = new THREE.Sprite(spriteMaterial.clone());
          const r = glowRadius(d) * 0.9;
          sprite.scale.set(r, r, 1);
          sprite.position.set((p * d.size.width) / 3200, 0, 0);
          group.add(sprite);
        }
      } else {
        const sprite = new THREE.Sprite(spriteMaterial);
        const r = glowRadius(d) * 1.15;
        sprite.scale.set(r, r, 1);
        group.add(sprite);
      }
      if (lightCount < 6 && d.glow !== 'line') {
        const light = new THREE.PointLight(0xffc46b, 0.32, Math.max(2.2, glowRadius(d) * 2.4), 2);
        light.position.y = -0.15;
        group.add(light);
        lightCount++;
      }
    }

    if (options.selectedDeviceId === d.id) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.2, 0.26, 32),
        new THREE.MeshBasicMaterial({ color: 0xffd98a, side: THREE.DoubleSide }),
      );
      ring.rotation.x = -Math.PI / 2;
      group.add(ring);
    }
    root.add(group);
  }
  return root;
}

export function disposeGlowTexture() {
  glowTexture?.dispose();
  glowTexture = null;
}

// Adapted from floorplan-3d (MIT, Copyright (c) 2026 wuyi). See NOTICE.md.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { FloorMaterial } from '../types';

type MatOptions = {
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  side?: THREE.Side;
  depthWrite?: boolean;
  envMapIntensity?: number;
};

const TEX: Record<FloorMaterial, { sx: number; sy: number; base: string; grout?: string; rough: number }> = {
  wood: { sx: 1.8, sy: 0.36, base: '#d6b58a', rough: 0.55 },
  walnut: { sx: 1.8, sy: 0.36, base: '#9a6f4b', rough: 0.5 },
  tile800: { sx: 0.8, sy: 0.8, base: '#ebe6dd', grout: '#cfc6b7', rough: 0.3 },
  tile600: { sx: 0.6, sy: 0.6, base: '#dfe3e0', grout: '#bfc6c1', rough: 0.35 },
  antislip: { sx: 0.3, sy: 0.3, base: '#d3d8d4', grout: '#aab2ac', rough: 0.8 },
  marble: { sx: 1.2, sy: 1.2, base: '#f2efe9', grout: '#d9d2c4', rough: 0.18 },
  terrazzo: { sx: 0.5, sy: 0.5, base: '#e6dfd3', rough: 0.4 },
  carpet: { sx: 0.3, sy: 0.3, base: '#c6bfd2', rough: 1 },
};

function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rgbK = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

export class MaterialKit {
  private cache = new Map<string, THREE.MeshStandardMaterial>();
  private floors = new Map<FloorMaterial, THREE.MeshStandardMaterial>();
  private envTexture: THREE.Texture | null = null;

  readonly glass: THREE.MeshPhysicalMaterial;
  readonly wall: THREE.MeshStandardMaterial;
  readonly cap: THREE.MeshStandardMaterial;
  readonly frame: THREE.MeshStandardMaterial;

  constructor(private renderer: THREE.WebGLRenderer) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    this.glass = new THREE.MeshPhysicalMaterial({
      color: 0xcfe6ef,
      roughness: 0.05,
      transparent: true,
      opacity: 0.28,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
    this.wall = this.mat('#f4f1eb', { roughness: 0.92 });
    this.cap = this.mat('#34312d', { roughness: 0.9 });
    this.frame = this.mat('#5d6166', { roughness: 0.5, metalness: 0.4 });
  }

  get environment() {
    return this.envTexture;
  }

  mat(color: string, opts: MatOptions = {}): THREE.MeshStandardMaterial {
    const key = `${color}|${JSON.stringify(opts)}`;
    const cached = this.cache.get(key);
    if (cached) return cached;
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.7,
      ...opts,
    });
    if (this.envTexture && (material.metalness > 0 || material.roughness < 0.4)) {
      material.envMap = this.envTexture;
      material.envMapIntensity = material.metalness > 0.5 ? 1 : 0.55;
    }
    this.cache.set(key, material);
    return material;
  }

  wood(color: string) { return this.mat(color, { roughness: 0.55 }); }
  fabric(color: string) { return this.mat(color, { roughness: 0.96 }); }
  metal(color = '#cfd2d4') { return this.mat(color, { metalness: 0.9, roughness: 0.25 }); }
  chrome() { return this.mat('#eef0f2', { metalness: 1, roughness: 0.08 }); }
  blackMetal() { return this.mat('#2b2b2d', { metalness: 0.6, roughness: 0.4 }); }
  hardware() { return this.mat('#b9b3a8', { metalness: 0.85, roughness: 0.3 }); }
  mirror() { return this.mat('#dfeaee', { metalness: 0.55, roughness: 0.06 }); }
  ceramic(opts: MatOptions = {}) { return this.mat('#fbfbf9', { roughness: 0.12, ...opts }); }
  screen(glow = '#1a2636') {
    return this.mat('#0b0e13', { roughness: 0.1, metalness: 0.3, emissive: glow, emissiveIntensity: 0.35 });
  }
  glow(color = '#fff4dc', emissive = '#ffdca0', intensity = 0.5) {
    return this.mat(color, { emissive, emissiveIntensity: intensity, roughness: 0.9, side: THREE.DoubleSide });
  }

  floor(kind: FloorMaterial): THREE.MeshStandardMaterial {
    const cached = this.floors.get(kind);
    if (cached) return cached;
    const spec = TEX[kind] ?? TEX.tile800;
    const random = rng(kind.length * 977 + 13);
    const canvas = document.createElement('canvas');
    const wood = kind === 'wood' || kind === 'walnut';
    canvas.width = wood ? 1024 : 512;
    canvas.height = wood ? 205 : 512;
    const ctx = canvas.getContext('2d')!;
    const W = canvas.width;
    const H = canvas.height;
    ctx.fillStyle = spec.base;
    ctx.fillRect(0, 0, W, H);

    if (wood) {
      const rowH = H / 2;
      const joints = [[W * 2 / 3], [W / 3]];
      for (let row = 0; row < 2; row++) {
        let x0 = 0;
        [...joints[row], W].forEach(x1 => {
          ctx.fillStyle = rgbK(spec.base, 0.9 + random() * 0.2);
          ctx.fillRect(x0, row * rowH, x1 - x0, rowH);
          ctx.strokeStyle = rgbK(spec.base, 0.8);
          ctx.globalAlpha = 0.35;
          ctx.lineWidth = 1.2;
          for (let k = 0; k < 7; k++) {
            const y = row * rowH + 6 + random() * (rowH - 12);
            ctx.beginPath();
            ctx.moveTo(x0, y);
            for (let x = x0; x <= x1; x += 40) ctx.lineTo(x, y + Math.sin(x * 0.02 + k) * 2.5);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = rgbK(spec.base, 0.62);
          ctx.fillRect(x1 - 1.5, row * rowH, 3, rowH);
          x0 = x1;
        });
        ctx.fillStyle = rgbK(spec.base, 0.62);
        ctx.fillRect(0, row * rowH, W, 2.5);
      }
    } else if (kind === 'marble') {
      ctx.strokeStyle = 'rgba(160,150,135,.35)';
      for (let k = 0; k < 6; k++) {
        ctx.lineWidth = 1 + random() * 3;
        ctx.beginPath();
        ctx.moveTo(random() * W, 0);
        ctx.bezierCurveTo(random() * W, random() * H, random() * W, random() * H, random() * W, H);
        ctx.stroke();
      }
    } else if (kind === 'terrazzo') {
      const colors = ['#b9a58c', '#8fa3a0', '#c9b7a2', '#a88f76', '#7e8a86'];
      for (let k = 0; k < 160; k++) {
        ctx.fillStyle = colors[k % colors.length];
        ctx.beginPath();
        ctx.arc(random() * W, random() * H, 2 + random() * 7, 0, 7);
        ctx.fill();
      }
    } else {
      for (let k = 0; k < 1500; k++) {
        ctx.fillStyle = `rgba(0,0,0,${random() * 0.04})`;
        ctx.fillRect(random() * W, random() * H, 2, 2);
      }
    }
    if (spec.grout) {
      ctx.fillStyle = spec.grout;
      ctx.fillRect(0, 0, W, 3);
      ctx.fillRect(0, 0, 3, H);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1 / spec.sx, 1 / spec.sy);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    const tint = wood ? 0xd2bb9c : kind === 'marble' ? 0xf2eee6 : 0xe8e4dc;
    const material = new THREE.MeshStandardMaterial({ map: texture, roughness: spec.rough, color: tint });
    this.floors.set(kind, material);
    return material;
  }

  dispose() {
    this.cache.forEach(m => m.dispose());
    this.cache.clear();
    this.floors.forEach(m => {
      m.map?.dispose();
      m.dispose();
    });
    this.floors.clear();
    this.glass.dispose();
    this.envTexture?.dispose();
    this.envTexture = null;
  }
}

// Adapted from floorplan-3d (MIT, Copyright (c) 2026 wuyi). See NOTICE.md.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { MaterialKit } from './materials';

export class PrimitiveKit {
  constructor(readonly mats: MaterialKit) {}

  shadow<T extends THREE.Object3D>(o: T): T {
    o.castShadow = true;
    o.receiveShadow = true;
    return o;
  }

  mesh(geo: THREE.BufferGeometry, material: THREE.Material | string): THREE.Mesh {
    const m = typeof material === 'string' ? this.mats.mat(material) : material;
    return this.shadow(new THREE.Mesh(geo, m));
  }

  box(w: number, h: number, d: number, material: THREE.Material | string, x = 0, y = 0, z = 0) {
    const o = this.mesh(new THREE.BoxGeometry(w, h, d), material);
    o.position.set(x, y + h / 2, z);
    return o;
  }

  rbox(w: number, h: number, d: number, material: THREE.Material | string, x = 0, y = 0, z = 0, r = 0.04) {
    const radius = Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001);
    const o = this.mesh(new RoundedBoxGeometry(w, h, d, 3, Math.max(0.001, radius)), material);
    o.position.set(x, y + h / 2, z);
    return o;
  }

  cyl(rt: number, rb: number, h: number, material: THREE.Material | string, x = 0, y = 0, z = 0, seg = 28) {
    const o = this.mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
    o.position.set(x, y + h / 2, z);
    return o;
  }

  lathe(points: Array<[number, number]>, material: THREE.Material | string, x = 0, y = 0, z = 0, seg = 40) {
    const o = this.mesh(
      new THREE.LatheGeometry(points.map(([r, h]) => new THREE.Vector2(Math.max(r, 0.0001), h)), seg),
      material,
    );
    o.position.set(x, y, z);
    return o;
  }

  rod(a: [number, number, number], b: [number, number, number], r0: number, material: THREE.Material | string, r1 = r0, seg = 12) {
    const A = new THREE.Vector3(...a);
    const B = new THREE.Vector3(...b);
    const o = this.mesh(new THREE.CylinderGeometry(r1, r0, A.distanceTo(B), seg), material);
    o.position.copy(A).add(B).multiplyScalar(0.5);
    o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize());
    return o;
  }

  tube(points: Array<[number, number, number]>, r: number, material: THREE.Material | string, seg = 40) {
    return this.mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)), false, 'centripetal'),
        seg,
        r,
        10,
      ),
      material,
    );
  }

  blob(rx: number, ry: number, rz: number, material: THREE.Material | string, x = 0, y = 0, z = 0, seg = 24) {
    const o = this.mesh(new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)), material);
    o.scale.set(rx, ry, rz);
    o.position.set(x, y, z);
    return o;
  }

  ring(R: number, r: number, material: THREE.Material | string, x = 0, y = 0, z = 0) {
    const o = this.mesh(new THREE.TorusGeometry(R, r, 10, 48), material);
    o.rotation.x = Math.PI / 2;
    o.position.set(x, y, z);
    return o;
  }

  rrect(w: number, d: number, r: number) {
    const s = new THREE.Shape();
    const x = -w / 2;
    const y = -d / 2;
    r = Math.min(r, w / 2 - 0.001, d / 2 - 0.001);
    s.moveTo(x + r, y);
    s.lineTo(x + w - r, y);
    s.quadraticCurveTo(x + w, y, x + w, y + r);
    s.lineTo(x + w, y + d - r);
    s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
    s.lineTo(x + r, y + d);
    s.quadraticCurveTo(x, y + d, x, y + d - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  shell(w: number, d: number, h: number, t: number, r: number, material: THREE.Material | string, x = 0, y = 0, z = 0) {
    const s = this.rrect(w, d, r);
    s.holes.push(this.rrect(w - 2 * t, d - 2 * t, Math.max(0.004, r - t)));
    const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 10 });
    geo.rotateX(-Math.PI / 2);
    const o = this.mesh(geo, material);
    o.position.set(x, y, z);
    return o;
  }

  legs(g: THREE.Group, w: number, d: number, h: number, material: THREE.Material | string, inset = 0.05, r = 0.02) {
    for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      g.add(this.rod(
        [a * (w / 2 - inset), 0, b * (d / 2 - inset)],
        [a * (w / 2 - inset), h, b * (d / 2 - inset)],
        r * 0.7,
        material,
        r,
      ));
    }
  }

  pull(g: THREE.Group, len: number, vertical: boolean, x: number, y: number, z: number) {
    const m = this.mats.hardware();
    const o = new THREE.Group();
    o.add(vertical
      ? this.box(0.01, len, 0.01, m, 0, -len / 2, 0.028)
      : this.box(len, 0.01, 0.01, m, 0, -0.005, 0.028));
    for (const s of [-1, 1]) {
      o.add(vertical
        ? this.box(0.008, 0.008, 0.028, m, 0, s * (len / 2 - 0.015) - 0.004, 0.014)
        : this.box(0.008, 0.008, 0.028, m, s * (len / 2 - 0.015), -0.004, 0.014));
    }
    o.position.set(x, y, z);
    g.add(o);
  }

  knob(g: THREE.Group, x: number, y: number, z: number) {
    const k = this.cyl(0.011, 0.014, 0.02, this.mats.hardware(), x, y - 0.01, z + 0.01, 16);
    k.rotation.x = Math.PI / 2;
    g.add(k, this.blob(0.014, 0.014, 0.008, this.mats.hardware(), x, y, z + 0.022, 12));
  }

  fronts(
    g: THREE.Group,
    x0: number, y0: number, w: number, h: number, z: number,
    nx: number, ny: number,
    material: THREE.Material | string,
    handle: 'bar' | 'knob' | 'edge' | 'none' = 'bar',
    handleY: number | null = null,
  ) {
    const gap = 0.005;
    const pw = w / nx;
    const ph = h / ny;
    const fz = z + 0.018;
    g.add(this.box(w, h, 0.002, '#2a2724', x0 + w / 2, y0, z + 0.001));
    for (let i = 0; i < nx; i++) {
      for (let j = 0; j < ny; j++) {
        const cx = x0 + pw * (i + 0.5);
        const yb = y0 + ph * j;
        const drawer = ph < 0.4 && pw >= ph;
        g.add(this.rbox(pw - gap, ph - gap, 0.018, material, cx, yb + gap / 2, z + 0.009, 0.003));
        if (handle === 'none') continue;
        if (handle === 'edge') {
          g.add(this.box(pw - 0.05, 0.01, 0.006, '#3c3a37', cx, yb + ph - gap - 0.018, fz));
          continue;
        }
        if (drawer) {
          if (handle === 'knob') this.knob(g, cx, yb + ph / 2, fz);
          else this.pull(g, Math.min(0.3, pw * 0.45), false, cx, yb + ph / 2, fz);
          continue;
        }
        const len = Math.min(0.45, ph * 0.35);
        const hx = nx === 1 ? cx + pw / 2 - 0.045 : (i % 2 ? cx - pw / 2 + 0.04 : cx + pw / 2 - 0.04);
        const y = Math.min(yb + ph - 0.05 - len / 2, Math.max(yb + 0.05 + len / 2, handleY ?? yb + ph / 2));
        if (handle === 'knob') this.knob(g, hx, y, fz);
        else this.pull(g, len, true, hx, y, fz);
      }
    }
  }

  vase(g: THREE.Group, x: number, y: number, z: number, r: number, h: number, color: string, random: () => number, flowers = true) {
    const points: Array<[number, number]> = [[0, 0], [r * 0.65, 0], [r, h * 0.32], [r * 0.92, h * 0.62], [r * 0.42, h * 0.86], [r * 0.5, h]];
    g.add(this.lathe(points, this.mats.mat(color, { roughness: 0.35, side: THREE.DoubleSide }), x, y, z, 32));
    if (!flowers) return;
    const colors = ['#f3e6d8', '#e8b4a0', '#f6d27a', '#ffffff'];
    for (let k = 0; k < 5; k++) {
      const a = k * 1.26 + random() * 0.4;
      const s = 0.03 + random() * 0.05;
      const top: [number, number, number] = [x + Math.cos(a) * s, y + h + 0.12 + random() * 0.14, z + Math.sin(a) * s];
      g.add(this.rod([x, y + h * 0.6, z], top, 0.003, '#6f8f4a', 0.003, 6));
      g.add(this.blob(0.022, 0.018, 0.022, colors[k % 4], ...top, 12));
    }
  }

  tableLamp(g: THREE.Group, x: number, y: number, z: number, s = 1) {
    g.add(this.lathe(
      [[0, 0], [0.06 * s, 0], [0.075 * s, 0.05 * s], [0.08 * s, 0.12 * s], [0.055 * s, 0.2 * s], [0.018 * s, 0.25 * s], [0.012 * s, 0.3 * s]],
      this.mats.ceramic({ roughness: 0.3 }),
      x, y, z, 32,
    ));
    g.add(this.lathe([[0.13 * s, 0], [0.1 * s, 0.18 * s]], this.mats.glow('#f6ecd9', '#ffdca0', 0.35), x, y + 0.26 * s, z, 40));
    g.add(this.blob(0.03 * s, 0.03 * s, 0.03 * s, this.mats.glow('#fff', '#ffe2b0', 1), x, y + 0.31 * s, z, 12));
  }
}

import type { DeviceVisual, Furniture, Opening, Point2, Project, Room, Wall } from '../types';

export const EPS = 1e-6;

export function polygonArea(poly: Point2[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return Math.abs(a) / 2;
}

export function polygonCentroid(poly: Point2[]): Point2 {
  let cx = 0, cy = 0, a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    const cross = x1 * y2 - x2 * y1;
    a += cross;
    cx += (x1 + x2) * cross;
    cy += (y1 + y2) * cross;
  }
  if (Math.abs(a) < EPS) {
    const n = poly.length || 1;
    return [poly.reduce((s, p) => s + p[0], 0) / n, poly.reduce((s, p) => s + p[1], 0) / n];
  }
  return [cx / (3 * a), cy / (3 * a)];
}

export function bboxOf(poly: Point2[]): { x: number; y: number; w: number; h: number } {
  const xs = poly.map(p => p[0]);
  const ys = poly.map(p => p[1]);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
}

export function pointInPolygon(p: Point2, poly: Point2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    const intersect = yi > p[1] !== yj > p[1] && p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi + EPS) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

export function distance(a: Point2, b: Point2): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}

export function lerp(a: Point2, b: Point2, t: number): Point2 {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

export function pointToSegmentDistance(p: Point2, a: Point2, b: Point2): number {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const l2 = dx * dx + dy * dy;
  if (l2 < EPS) return distance(p, a);
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
  return distance(p, [a[0] + t * dx, a[1] + t * dy]);
}

export function rectCorners(rect: [number, number, number, number]): Point2[] {
  const [x, y, w, h] = rect;
  return [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
}

export function rectCenter(rect: [number, number, number, number]): Point2 {
  return [rect[0] + rect[2] / 2, rect[1] + rect[3] / 2];
}

export function rectIntersectsPolygon(rect: [number, number, number, number], poly: Point2[]): boolean {
  const corners = rectCorners(rect);
  if (corners.some(p => pointInPolygon(p, poly))) return true;
  if (poly.some(p => p[0] >= rect[0] && p[0] <= rect[0] + rect[2] && p[1] >= rect[1] && p[1] <= rect[1] + rect[3])) return true;
  return false;
}

export function polygonEdges(poly: Point2[]): Array<{ a: Point2; b: Point2; length: number }> {
  return poly.map((a, i) => {
    const b = poly[(i + 1) % poly.length];
    return { a, b, length: distance(a, b) };
  });
}

export function inwardNormal(edge: { a: Point2; b: Point2 }, centroid: Point2): Point2 {
  const dx = edge.b[0] - edge.a[0], dy = edge.b[1] - edge.a[1];
  const len = Math.hypot(dx, dy) || 1;
  let n: Point2 = [-dy / len, dx / len];
  const mid: Point2 = [(edge.a[0] + edge.b[0]) / 2, (edge.a[1] + edge.b[1]) / 2];
  const toCenter: Point2 = [centroid[0] - mid[0], centroid[1] - mid[1]];
  if (n[0] * toCenter[0] + n[1] * toCenter[1] < 0) n = [-n[0], -n[1]];
  return n;
}

export function sideOfLine(p: Point2, a: Point2, b: Point2): number {
  return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
}

export function openingCenter(opening: Opening, wall: Wall): Point2 {
  const dx = wall.b[0] - wall.a[0], dy = wall.b[1] - wall.a[1];
  const len = Math.hypot(dx, dy) || 1;
  const u: Point2 = [dx / len, dy / len];
  const t = opening.start + opening.width / 2;
  return [wall.a[0] + u[0] * t, wall.a[1] + u[1] * t];
}

export function openingEnds(opening: Opening, wall: Wall): { p0: Point2; p1: Point2; u: Point2; n: Point2 } {
  const dx = wall.b[0] - wall.a[0], dy = wall.b[1] - wall.a[1];
  const len = Math.hypot(dx, dy) || 1;
  const u: Point2 = [dx / len, dy / len];
  const n: Point2 = [-u[1], u[0]];
  const p0: Point2 = [wall.a[0] + u[0] * opening.start, wall.a[1] + u[1] * opening.start];
  const p1: Point2 = [p0[0] + u[0] * opening.width, p0[1] + u[1] * opening.width];
  return { p0, p1, u, n };
}

export function openingNearRoom(opening: Opening, wall: Wall, room: Room, tol = 650): boolean {
  const c = openingCenter(opening, wall);
  if (pointInPolygon(c, room.polygon)) return true;
  return polygonEdges(room.polygon).some(e => pointToSegmentDistance(c, e.a, e.b) <= tol);
}

export function doorSwingPolygon(opening: Opening, wall: Wall, room: Room): Point2[] {
  if (opening.type !== 'door') return [];
  const { p0, p1, u, n } = openingEnds(opening, wall);
  const hinge = opening.hinge === 'end' ? p1 : p0;
  const other = opening.hinge === 'end' ? p0 : p1;
  const centroid = polygonCentroid(room.polygon);
  const towardRoom = sideOfLine(centroid, wall.a, wall.b) >= 0 ? 1 : -1;
  const normal: Point2 = [n[0] * towardRoom, n[1] * towardRoom];
  const r = opening.width + 50;
  const a0 = Math.atan2(other[1] - hinge[1], other[0] - hinge[0]);
  const a1 = Math.atan2(normal[1], normal[0]);
  let delta = a1 - a0;
  while (delta > Math.PI) delta -= Math.PI * 2;
  while (delta < -Math.PI) delta += Math.PI * 2;
  const pts: Point2[] = [hinge];
  for (let i = 0; i <= 10; i++) {
    const ang = a0 + (delta * i) / 10;
    pts.push([hinge[0] + Math.cos(ang) * r, hinge[1] + Math.sin(ang) * r]);
  }
  return pts;
}

export function polygonBounds(poly: Point2[]): { minX: number; minY: number; maxX: number; maxY: number } {
  const b = bboxOf(poly);
  return { minX: b.x, minY: b.y, maxX: b.x + b.w, maxY: b.y + b.h };
}

export function inscribedRect(poly: Point2[], clearance = 100): { x: number; y: number; w: number; h: number } {
  const b = bboxOf(poly);
  const xs = new Set<number>([b.x + clearance, b.x + b.w - clearance]);
  const ys = new Set<number>([b.y + clearance, b.y + b.h - clearance]);
  for (const p of poly) {
    if (p[0] > b.x + clearance && p[0] < b.x + b.w - clearance) xs.add(p[0]);
    if (p[1] > b.y + clearance && p[1] < b.y + b.h - clearance) ys.add(p[1]);
  }
  for (let x = b.x + clearance; x <= b.x + b.w - clearance; x += 500) xs.add(x);
  for (let y = b.y + clearance; y <= b.y + b.h - clearance; y += 500) ys.add(y);
  const xa = [...xs].sort((a, b) => a - b);
  const ya = [...ys].sort((a, b) => a - b);
  let best = { x: b.x + clearance, y: b.y + clearance, w: Math.max(0, b.w - clearance * 2), h: Math.max(0, b.h - clearance * 2) };
  let bestArea = best.w * best.h;
  for (let i = 0; i < xa.length; i++) {
    for (let j = i + 1; j < xa.length; j++) {
      for (let k = 0; k < ya.length; k++) {
        for (let l = k + 1; l < ya.length; l++) {
          const x = xa[i], y = ya[k], w = xa[j] - xa[i], h = ya[l] - ya[k];
          if (w < 400 || h < 400) continue;
          const area = w * h;
          if (area <= bestArea) continue;
          const probes: Point2[] = [
            [x, y], [x + w, y], [x + w, y + h], [x, y + h],
            [x + w / 2, y + h / 2], [x + w / 2, y], [x + w / 2, y + h],
            [x, y + h / 2], [x + w, y + h / 2],
          ];
          if (probes.every(p => pointInPolygon(p, poly))) {
            best = { x, y, w, h };
            bestArea = area;
          }
        }
      }
    }
  }
  return best;
}

export function furnitureInRoom(project: Project, roomId: string, types?: string[]): Furniture[] {
  return project.furniture.filter(f => f.roomId === roomId && (!types?.length || types.includes(f.type)));
}

export function furniturePoints(f: Furniture, mode: 'center' | 'edge' | 'pair', roomCentroid: Point2, count = 2): Point2[] {
  const [x, y, w, h] = f.rect;
  const c: Point2 = [x + w / 2, y + h / 2];
  if (mode === 'center') return [c];
  if (mode === 'pair') {
    return [[x + w * 0.25, y + h / 2], [x + w * 0.75, y + h / 2]];
  }
  const horizontal = w >= h;
  const dx = roomCentroid[0] - c[0], dy = roomCentroid[1] - c[1];
  const len = Math.hypot(dx, dy) || 1;
  const ox = (dx / len) * (horizontal ? h / 2 + 180 : w / 2 + 180);
  const oy = (dy / len) * (horizontal ? h / 2 + 180 : w / 2 + 180);
  // edge 模式按规则数量沿长边等分，避免数量 >2 时永远只回来 2 个候选点。
  const n = Math.max(1, Math.round(count));
  if (horizontal) {
    return Array.from({ length: n }, (_, i) => [x + w * ((i + 0.5) / n), c[1] + oy] as Point2);
  }
  return Array.from({ length: n }, (_, i) => [c[0] + ox, y + h * ((i + 0.5) / n)] as Point2);
}

/**
 * 家具朝向房间中心那一侧的长边中点，用于柜体灯带 / 贴墙灯带。
 * 返回的 length 为该长边的完整长度。
 */
export function furnitureEdgeCenter(
  f: Furniture,
  roomCentroid: Point2,
  offset = 80,
): { p: Point2; angle: number; length: number } {
  const [x, y, w, h] = f.rect;
  const cx = x + w / 2;
  const cy = y + h / 2;
  const horizontal = w >= h;
  const dx = roomCentroid[0] - cx;
  const dy = roomCentroid[1] - cy;
  const len = Math.hypot(dx, dy) || 1;
  const off = (horizontal ? h : w) / 2 + offset;
  return {
    p: [cx + (dx / len) * off, cy + (dy / len) * off],
    angle: f.rotation,
    length: horizontal ? w : h,
  };
}

export function wallOffsetPoints(room: Room, offset: number): Array<{ p: Point2; angle: number }> {
  const c = polygonCentroid(room.polygon);
  const out: Array<{ p: Point2; angle: number }> = [];
  for (const e of polygonEdges(room.polygon)) {
    const n = inwardNormal(e, c);
    const a: Point2 = [e.a[0] + n[0] * offset, e.a[1] + n[1] * offset];
    const b: Point2 = [e.b[0] + n[0] * offset, e.b[1] + n[1] * offset];
    const angle = (Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]) * 180) / Math.PI;
    out.push({ p: lerp(a, b, 0.33), angle }, { p: lerp(a, b, 0.67), angle });
  }
  return out;
}

export function perimeterPoints(room: Room, offset: number): Array<{ p: Point2; angle: number }> {
  return wallOffsetPoints(room, offset);
}

export function perimeterSegments(room: Room, offset: number): Array<{ p: Point2; angle: number; length: number }> {
  const c = polygonCentroid(room.polygon);
  return polygonEdges(room.polygon).map(e => {
    const n = inwardNormal(e, c);
    const mid: Point2 = [(e.a[0] + e.b[0]) / 2 + n[0] * offset, (e.a[1] + e.b[1]) / 2 + n[1] * offset];
    return {
      p: mid,
      angle: (Math.atan2(e.b[1] - e.a[1], e.b[0] - e.a[0]) * 180) / Math.PI,
      length: Math.max(300, e.length - offset * 2),
    };
  });
}

function moveInsideRoom(room: Room, p: Point2): Point2 {
  if (pointInPolygon(p, room.polygon)) return p;
  const c = polygonCentroid(room.polygon);
  const dx = c[0] - p[0];
  const dy = c[1] - p[1];
  const dist = Math.hypot(dx, dy) || 1;
  const limit = Math.min(dist, 2400);
  for (let t = 20; t <= limit; t += 20) {
    const q: Point2 = [p[0] + (dx / dist) * t, p[1] + (dy / dist) * t];
    if (pointInPolygon(q, room.polygon)) return q;
  }
  return c;
}

function rayInsideDistance(room: Room, p: Point2, dir: Point2, maxDist: number): number {
  let lo = 0;
  let hi = Math.max(0, maxDist);
  for (let i = 0; i < 26; i++) {
    const mid = (lo + hi) / 2;
    const q: Point2 = [p[0] + dir[0] * mid, p[1] + dir[1] * mid];
    if (pointInPolygon(q, room.polygon)) lo = mid;
    else hi = mid;
  }
  return lo;
}

/**
 * 把一条以 center 为中线、沿 angle 方向展开的线段收进房间：
 * - 先保证中心点在房间内；
 * - 线段较短时沿自身方向平移，尽量保持原始长度；
 * - 线段长于房间可容纳长度时按房间边界截短。
 */
export function fitSegmentInRoom(
  room: Room,
  center: Point2,
  angleDeg: number,
  length: number,
): { center: Point2; length: number } {
  const p0 = moveInsideRoom(room, center);
  const a = (angleDeg * Math.PI) / 180;
  const dir: Point2 = [Math.cos(a), Math.sin(a)];
  const b = bboxOf(room.polygon);
  const maxDist = Math.hypot(b.w, b.h);
  const minus = rayInsideDistance(room, p0, [-dir[0], -dir[1]], maxDist);
  const plus = rayInsideDistance(room, p0, dir, maxDist);
  const span = minus + plus;
  const len = Math.max(0, Math.min(length, span));
  if (len <= 0) return { center: p0, length: 0 };
  const lower = len / 2 - minus;
  const upper = plus - len / 2;
  const shift = Math.min(Math.max(0, lower), upper);
  return {
    center: [p0[0] + dir[0] * shift, p0[1] + dir[1] * shift],
    length: len,
  };
}

export function fitBoxInRoom(
  room: Room,
  center: Point2,
  angleDeg: number,
  width: number,
  depth: number,
): { center: Point2; width: number; depth: number } {
  const x = fitSegmentInRoom(room, center, angleDeg, width);
  const y = fitSegmentInRoom(room, x.center, angleDeg + 90, depth);
  return { center: y.center, width: x.length, depth: y.length };
}

/**
 * 线型 / 组合灯形按房间边界收口，避免灯带、轨道跨越墙体进入相邻空间。
 */
export function fitDeviceGeometry(
  room: Room,
  center: Point2,
  angleDeg: number,
  width: number,
  depth: number,
  visual: DeviceVisual,
): { center: Point2; width: number; depth: number; clipped: boolean } {
  if (visual === 'line' || visual === 'track') {
    const fit = fitSegmentInRoom(room, center, angleDeg, width);
    return {
      center: fit.center,
      width: Math.max(60, fit.length),
      depth,
      clipped: fit.length < width - 1,
    };
  }
  if (visual === 'l' || visual === 'u' || visual === 'rect') {
    const fit = fitBoxInRoom(room, center, angleDeg, width, depth);
    return {
      center: fit.center,
      width: Math.max(60, fit.width),
      depth: Math.max(60, fit.depth),
      clipped: fit.width < width - 1 || fit.depth < depth - 1,
    };
  }
  return { center, width, depth, clipped: false };
}

/**
 * 口字 / L 型 / U 型灯组的示意包围盒：
 * 以空间可用内接矩形为边界，按净面积取约 35% 的灯组投影面积，
 * 再按房间长宽比分配宽深，避免所有房间都画成同一个固定尺寸。
 */
export function dynamicBoxSize(room: Room): { width: number; depth: number } {
  const usable = inscribedRect(room.polygon, 300);
  const areaM2 = polygonArea(room.polygon) / 1e6;
  if (usable.w <= 0 || usable.h <= 0) return { width: 1200, depth: 900 };
  const usableW = usable.w / 1000;
  const usableH = usable.h / 1000;
  const targetArea = Math.max(1.2, Math.min(areaM2 * 0.35, usableW * usableH * 0.6, 12));
  const aspect = Math.max(0.5, Math.min(2.2, usableW / usableH));
  let width = Math.sqrt(targetArea * aspect);
  let depth = targetArea / width;
  width = Math.min(width, usableW * 0.88);
  depth = Math.min(depth, usableH * 0.88);
  return {
    width: Math.round(Math.max(800, width * 1000)),
    depth: Math.round(Math.max(600, depth * 1000)),
  };
}

export function longAxisPoints(room: Room, count: number): Array<{ p: Point2; angle: number }> {
  const b = bboxOf(room.polygon);
  const c = polygonCentroid(room.polygon);
  const horizontal = b.w >= b.h;
  const length = horizontal ? b.w : b.h;
  const n = Math.max(1, count);
  const out: Array<{ p: Point2; angle: number }> = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : (i + 1) / (n + 1);
    const p: Point2 = horizontal
      ? [b.x + length * t, c[1]]
      : [c[0], b.y + length * t];
    out.push({ p, angle: horizontal ? 0 : 90 });
  }
  return out;
}

export function gridPoints(room: Room, rows: number, rowGap: number, colGap: number, clearance: number): Array<{ p: Point2; angle: number }> {
  const r = inscribedRect(room.polygon, clearance);
  if (r.w <= 0 || r.h <= 0) return [];
  const horizontal = r.w >= r.h;
  const out: Array<{ p: Point2; angle: number }> = [];
  if (horizontal) {
    const yTop = r.y + r.h / 2 + rowGap / 2;
    const yBottom = r.y + r.h / 2 - rowGap / 2;
    const n = Math.max(1, Math.round(r.w / Math.max(colGap, 1)));
    for (let i = 0; i < Math.max(rows, 1); i++) {
      const y = i === 0 ? yBottom : yTop;
      for (let j = 0; j < n; j++) {
        const t = n === 1 ? 0.5 : (j + 0.5) / n;
        out.push({ p: [r.x + r.w * t, y], angle: 0 });
      }
    }
  } else {
    const xLeft = r.x + r.w / 2 - rowGap / 2;
    const xRight = r.x + r.w / 2 + rowGap / 2;
    const n = Math.max(1, Math.round(r.h / Math.max(colGap, 1)));
    for (let i = 0; i < Math.max(rows, 1); i++) {
      const x = i === 0 ? xLeft : xRight;
      for (let j = 0; j < n; j++) {
        const t = n === 1 ? 0.5 : (j + 0.5) / n;
        out.push({ p: [x, r.y + r.h * t], angle: 90 });
      }
    }
  }
  return out;
}

export function pathPoints(room: Room, project: Project, count = 4): Array<{ p: Point2; angle: number }> {
  const bed = furnitureInRoom(project, room.id, ['bed'])[0];
  const target = bed ? rectCenter(bed.rect) : polygonCentroid(room.polygon);
  const doors = project.openings.filter(o => o.type === 'door').map(o => {
    const w = project.walls.find(w => w.id === o.wallId);
    return w ? { o, w } : null;
  }).filter(Boolean) as Array<{ o: Opening; w: Wall }>;
  let doorP: Point2 | null = null;
  let best = Infinity;
  for (const { o, w } of doors) {
    const c = openingCenter(o, w);
    const d = pointToSegmentDistance(c, room.polygon[0], room.polygon[1]);
    if (pointInPolygon(c, room.polygon) || d < 800) {
      if (d < best) { best = d; doorP = c; }
    }
  }
  const start = doorP ?? polygonCentroid(room.polygon);
  return Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count;
    return { p: lerp(start, target, t), angle: 0 };
  });
}

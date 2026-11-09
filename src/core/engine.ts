import rulesJson from '../data/rules.generated.json';
import { DEVICE_BY_KEY, SPACE_BY_CODE, findDevice } from '../data/catalog';
import { CROSS_RULE_BY_CODE, CROSS_RULE_TEMPLATES } from '../data/cross-rules';
import { DEMO_DEFAULTS } from '../data/defaults';
import { normalizeDeviceName, ruleDeviceNames, ruleMatchesDeviceKey } from '../../shared/placement-rules.mjs';
import type {
  AnchorSpec, DemoDefaults, DeviceDef, Furniture, LayoutResult, Opening, PlacedDevice,
  PendingDiagnostic, Point2, PointRule, Project, QuantitySpec, Room, RuleExecution, SpaceCode, UnplacedRule, Wall,
} from '../types';
import {
  bboxOf, doorSwingPolygon, distance, dynamicBoxSize, furnitureEdgeCenter, furnitureInRoom, furniturePoints, gridPoints,
  fitDeviceGeometry, inscribedRect, longAxisPoints, openingCenter, openingEnds, openingNearRoom,
  pathPoints, perimeterPoints, perimeterSegments, pointInPolygon, pointToSegmentDistance, polygonArea,
  polygonCentroid, polygonEdges, rectCenter, sideOfLine, wallOffsetPoints,
} from './geometry';

const RULES = rulesJson as unknown as PointRule[];

interface Candidate {
  p: Point2;
  angle: number;
  length?: number;
  note?: string;
}

interface EngOptions {
  mode?: 'all' | 'currentRoom';
  roomId?: string;
  defaults?: DemoDefaults;
  preserveLocked?: boolean;
  sources?: Array<'manual' | 'rule' | 'wholeHouse'>;
}

/**
 * 把一条规则原文里的 device_type2 展开成设备目录里的分类。
 * 一条规则可能同时覆盖多个设备分类，例如「窗帘电机 / 卷帘电机」。
 * 名称展开口径下沉到 shared/placement-rules.mjs，服务端布点目录共用同一份。
 */
export function catalogDevicesForRule(rule: PointRule): DeviceDef[] {
  const found = new Map<string, DeviceDef>();
  const add = (d?: DeviceDef) => { if (d) found.set(d.key, d); };
  for (const name of ruleDeviceNames(rule)) {
    add(DEVICE_BY_KEY[name]);
    add(findDevice(name));
  }
  return [...found.values()];
}

function deviceForRule(rule: PointRule): DeviceDef | undefined {
  return catalogDevicesForRule(rule)[0];
}

function rulesForRoom(spaceCode: SpaceCode): PointRule[] {
  return RULES.filter(r => r.spaceCode === spaceCode);
}

function openingsNearRoom(project: Project, room: Room, type?: Opening['type']): Array<{ o: Opening; w: Wall }> {
  return project.openings
    .filter(o => !type || o.type === type)
    .map(o => {
      const w = project.walls.find(w => w.id === o.wallId);
      return w ? { o, w } : null;
    })
    .filter((x): x is { o: Opening; w: Wall } => !!x && openingNearRoom(x.o, x.w, room));
}

function doorSideCandidates(room: Room, project: Project, offset: number): Candidate[] {
  const c = polygonCentroid(room.polygon);
  const doors = openingsNearRoom(project, room, 'door');
  const out: Candidate[] = [];
  for (const { o, w } of doors) {
    const { p0, p1, u, n } = openingEnds(o, w);
    const side = sideOfLine(c, w.a, w.b) >= 0 ? 1 : -1;
    const inward: Point2 = [n[0] * side, n[1] * side];
    const angle = (Math.atan2(u[1], u[0]) * 180) / Math.PI;
    const candidates: Point2[] = [
      [p0[0] - u[0] * offset + inward[0] * 80, p0[1] - u[1] * offset + inward[1] * 80],
      [p1[0] + u[0] * offset + inward[0] * 80, p1[1] + u[1] * offset + inward[1] * 80],
    ];
    for (const p of candidates) if (pointInPolygon(p, room.polygon)) out.push({ p, angle });
  }
  return out.length ? out : wallOffsetPoints(room, 150);
}

function windowCandidates(project: Project, room: Room): Candidate[] {
  const c = polygonCentroid(room.polygon);
  const wins = openingsNearRoom(project, room, 'window');
  const out: Candidate[] = [];
  for (const { o, w } of wins) {
    const center = openingCenter(o, w);
    const { u, n } = openingEnds(o, w);
    const side = sideOfLine(c, w.a, w.b) >= 0 ? 1 : -1;
    const inward: Point2 = [n[0] * side, n[1] * side];
    const p: Point2 = [center[0] + inward[0] * 160, center[1] + inward[1] * 160];
    out.push({
      p,
      angle: (Math.atan2(u[1], u[0]) * 180) / Math.PI,
      length: o.width,
    });
  }
  return out.length ? out : wallOffsetPoints(room, 160);
}

function chooseFurniture(project: Project, room: Room, anchor: AnchorSpec): Furniture[] {
  const types = anchor.furnitureTypes ?? [];
  if (types.length) {
    const found = furnitureInRoom(project, room.id, types);
    if (found.length) return found;
  }
  if (anchor.target === 'tv') {
    return furnitureInRoom(project, room.id, ['tv', 'tvCabinet']);
  }
  if (anchor.target === 'tvCabinet') {
    return furnitureInRoom(project, room.id, ['tvCabinet', 'tv']);
  }
  return [];
}

/** 距离给定点最近的一段房间边界墙。 */
function nearestRoomEdge(room: Room, p: Point2): { a: Point2; b: Point2; d: number } | null {
  let best: { a: Point2; b: Point2; d: number } | null = null;
  for (const e of polygonEdges(room.polygon)) {
    const d = pointToSegmentDistance(p, e.a, e.b);
    if (!best || d < best.d) best = { a: e.a, b: e.b, d };
  }
  return best;
}

/** 家具前沿的平行线，作为磁吸轨道/灯体的宿主路径。 */
function hostTrackLine(host: Furniture, roomCentroid: Point2): { a: Point2; b: Point2; len: number; angle: number } {
  const [x, y, w, h] = host.rect;
  const cx = x + w / 2, cy = y + h / 2;
  const horizontal = w >= h;
  const dx = roomCentroid[0] - cx, dy = roomCentroid[1] - cy;
  const len = Math.hypot(dx, dy) || 1;
  const off = (horizontal ? h : w) / 2 + 300;
  if (horizontal) {
    const ly = cy + (dy / len) * off;
    return { a: [x, ly], b: [x + w, ly], len: w, angle: 0 };
  }
  const lx = cx + (dx / len) * off;
  return { a: [lx, y], b: [lx, y + h], len: h, angle: 90 };
}

function candidatesFor(rule: PointRule, room: Room, project: Project): { list: Candidate[]; note?: string } {
  const anchor = rule.anchor;
  const c = polygonCentroid(room.polygon);
  // 床头背景墙灯带：贴最近墙面，按床宽取长度。
  if (rule.deviceType2.includes('贴墙灯带') && anchor.kind === 'roomCenter' && rule.quantity.measure === 'wall') {
    const bed = furnitureInRoom(project, room.id, ['bed'])[0];
    if (bed) {
      const bc = rectCenter(bed.rect);
      const windows = openingsNearRoom(project, room, 'window');
      const edges = polygonEdges(room.polygon)
        .map(e => ({ e, d: pointToSegmentDistance(bc, e.a, e.b) }))
        .sort((a, b) => a.d - b.d);
      for (const { e: edge } of edges) {
        const ux = edge.b[0] - edge.a[0];
        const uy = edge.b[1] - edge.a[1];
        const len = Math.hypot(ux, uy) || 1;
        const t = Math.max(0, Math.min(len, ((bc[0] - edge.a[0]) * ux + (bc[1] - edge.a[1]) * uy) / len));
        const p: Point2 = [edge.a[0] + (ux / len) * t, edge.a[1] + (uy / len) * t];
        const nearWindow = windows.some(({ o, w }) => {
          const { p0, p1 } = openingEnds(o, w);
          return pointToSegmentDistance(p, p0, p1) < 300;
        });
        if (nearWindow) continue;
        return {
          list: [{
            p,
            angle: (Math.atan2(uy, ux) * 180) / Math.PI,
            length: Math.min(Math.max(bed.rect[2], bed.rect[3]), len),
          }],
        };
      }
    }
  }
  // 灯槽灯带应沿房间周圈，不能以房间中心拉一条长线穿过房间。
  if (rule.deviceType2.includes('灯槽灯带') && anchor.kind === 'roomCenter') {
    return { list: perimeterSegments(room, 120) };
  }
  // 洗墙射灯（电视墙/餐边柜/书架…）：沿被照家具所贴的墙面等分，
  // 而不是只在家具中心生成 2 个点，否则数量 >2 时必然出现待处理。
  if (anchor.kind === 'furnitureEdge' && rule.deviceType2 === '射灯') {
    const f = chooseFurniture(project, room, anchor)[0];
    if (f) {
      const edge = nearestRoomEdge(room, rectCenter(f.rect));
      if (edge) {
        const len = distance(edge.a, edge.b) || 1;
        const ux = (edge.b[0] - edge.a[0]) / len;
        const uy = (edge.b[1] - edge.a[1]) / len;
        let nx = -uy, ny = ux;
        const mx = (edge.a[0] + edge.b[0]) / 2;
        const my = (edge.a[1] + edge.b[1]) / 2;
        if ((c[0] - mx) * nx + (c[1] - my) * ny < 0) { nx = -nx; ny = -ny; }
        const n = Math.max(2, Math.min(8, quantityFor(rule, room, project).count));
        const offset = 300;
        const list: Candidate[] = Array.from({ length: n }, (_, i) => {
          const t = (i + 0.5) / n;
          return {
            p: [edge.a[0] + ux * len * t + nx * offset, edge.a[1] + uy * len * t + ny * offset] as Point2,
            angle: (Math.atan2(uy, ux) * 180) / Math.PI,
          };
        });
        return { list };
      }
    }
  }
  // 客厅通行补光：沙发与电视柜之间的通行带中轴，随两件家具的位置实时计算。
  if (rule.deviceType2 === '筒灯' && anchor.kind === 'furnitureEdge' && anchor.target === 'tv') {
    const tv = furnitureInRoom(project, room.id, ['tv', 'tvCabinet'])[0];
    const sofa = furnitureInRoom(project, room.id, ['sofa'])[0];
    if (tv && sofa) {
      const [tx, ty, tw, th] = tv.rect;
      const [sx, sy, sw, sh] = sofa.rect;
      const horizontal = Math.abs((sx + sw / 2) - (tx + tw / 2)) >= Math.abs((sy + sh / 2) - (ty + th / 2));
      const q = Math.max(1, quantityFor(rule, room, project).count);
      const list: Candidate[] = [];
      if (horizontal) {
        const tvFront = tx + tw < sx ? tx + tw : tx;
        const sofaFront = tx + tw < sx ? sx : sx + sw;
        const midX = (tvFront + sofaFront) / 2;
        const y0 = Math.max(ty, sy), y1 = Math.min(ty + th, sy + sh);
        const span = y1 > y0 ? y1 - y0 : Math.min(th, sh);
        const base = y1 > y0 ? y0 : (ty + th / 2) - span / 2;
        for (let i = 0; i < q; i++) list.push({ p: [midX, base + span * ((i + 0.5) / q)], angle: 0 });
      } else {
        const tvFront = ty + th < sy ? ty + th : ty;
        const sofaFront = ty + th < sy ? sy : sy + sh;
        const midY = (tvFront + sofaFront) / 2;
        const x0 = Math.max(tx, sx), x1 = Math.min(tx + tw, sx + sw);
        const span = x1 > x0 ? x1 - x0 : Math.min(tw, sw);
        const base = x1 > x0 ? x0 : (tx + tw / 2) - span / 2;
        for (let i = 0; i < q; i++) list.push({ p: [base + span * ((i + 0.5) / q), midY], angle: 90 });
      }
      return { list };
    }
  }
  // 磁吸灯体/轨道按“当前电视柜或沙发的长边”生成宿主路径，而不是固定房间中轴。
  if (rule.deviceType2.includes('磁吸')) {
    const host = furnitureInRoom(project, room.id, ['tv', 'tvCabinet'])[0]
      ?? furnitureInRoom(project, room.id, ['sofa'])[0];
    if (host) {
      const line = hostTrackLine(host, c);
      // 轨道按“一条连续轨道 + 模块数”建模：效果图只有一条线，长度=宿主路径长，
      // 报价里的 2/3 条是模块数，不再画成多段重叠轨道。
      if (rule.deviceType2.includes('磁吸轨道')) {
        return {
          list: [{
            p: [(line.a[0] + line.b[0]) / 2, (line.a[1] + line.b[1]) / 2],
            angle: line.angle,
            length: line.len,
          }],
        };
      }
      const n = Math.max(1, Math.min(12, quantityFor(rule, room, project).count));
      const isTrack = rule.deviceType2.includes('轨道');
      const isGrid = rule.deviceType2.includes('格栅');
      const list: Candidate[] = [];
      for (let i = 0; i < n; i++) {
        // 轨道按 n 段切分铺满宿主长度；灯体按灯位等分；格栅灯与泛光灯错半格。
        const t = isTrack ? (i + 0.5) / n : isGrid ? (i + 1) / (n + 1) : (i + 0.5) / n;
        const p: Point2 = [line.a[0] + (line.b[0] - line.a[0]) * t, line.a[1] + (line.b[1] - line.a[1]) * t];
        list.push({ p, angle: line.angle, ...(isTrack ? { length: line.len / n } : {}) });
      }
      return { list };
    }
  }
  // 规则文本写“沙发…”但结构锚点是 roomCenter/longAxisLine 时，按当前沙发几何取点，
  // 这样移动沙发后，阅读射灯 / 落地灯 / 吸顶喇叭会跟着重新计算。
  if ((anchor.kind === 'roomCenter' || anchor.kind === 'longAxisLine') && String(anchor.raw || '').includes('沙发')) {
    const sofa = furnitureInRoom(project, room.id, ['sofa'])[0];
    if (sofa) {
      const [x, y, w, h] = sofa.rect;
      const cx = x + w / 2, cy = y + h / 2;
      const horizontal = w >= h;
      const b = bboxOf(room.polygon);
      const clamp = (p: Point2): Point2 => [
        Math.max(b.x + 150, Math.min(b.x + b.w - 150, p[0])),
        Math.max(b.y + 150, Math.min(b.y + b.h - 150, p[1])),
      ];
      if (rule.deviceType2 === '射灯') {
        const pts: Point2[] = horizontal
          ? [[x - 400, cy], [x + w + 400, cy]]
          : [[cx, y - 400], [cx, y + h + 400]];
        return { list: pts.map(p => ({ p: clamp(p), angle: sofa.rotation })) };
      }
      if (rule.deviceType2 === '落地灯') {
        // “沙发单侧”是沙发两端的外侧，不是沙发正中前方；落地灯放在扶手外侧，
        // 避免挡住坐姿视线。取离房间边界更远的一端。
        const dx = c[0] - cx, dy = c[1] - cy;
        const ends: Point2[] = horizontal
          ? [
              [x - 300, (dy >= 0 ? y + h : y) + (dy >= 0 ? 250 : -250)],
              [x + w + 300, (dy >= 0 ? y + h : y) + (dy >= 0 ? 250 : -250)],
            ]
          : [
              [(dx >= 0 ? x + w : x) + (dx >= 0 ? 250 : -250), y - 300],
              [(dx >= 0 ? x + w : x) + (dx >= 0 ? 250 : -250), y + h + 300],
            ];
        const score = (p: Point2) => Math.min(p[0] - b.x, b.x + b.w - p[0], p[1] - b.y, b.y + b.h - p[1]);
        const best = ends.sort((a, b2) => score(b2) - score(a))[0];
        return { list: [{ p: clamp(best), angle: sofa.rotation }] };
      }
      if (rule.deviceType2 === '吸顶喇叭') {
        const dx = c[0] - cx, dy = c[1] - cy;
        const len = Math.hypot(dx, dy) || 1;
        const off = (horizontal ? h : w) / 2 + 600;
        const q = Math.max(1, quantityFor(rule, room, project).count);
        const along = horizontal ? w : h;
        const list: Candidate[] = Array.from({ length: q }, (_, i) => {
          const t = q === 1 ? 0 : (i / (q - 1) - 0.5) * 0.6 * along;
          const p: Point2 = horizontal
            ? [cx + t, cy + (dy / len) * off]
            : [cx + (dx / len) * off, cy + t];
          return { p: clamp(p), angle: sofa.rotation };
        });
        return { list };
      }
    }
  }
  // 光照传感器按“距窗 500~800”落在窗内侧，不再放房间中心。
  if (anchor.kind === 'roomCenter' && rule.deviceType2.includes('光照传感器')) {
    const wins = openingsNearRoom(project, room, 'window');
    if (wins.length) {
      const { o, w } = wins[0];
      const ct = openingCenter(o, w);
      const { u, n } = openingEnds(o, w);
      const side = sideOfLine(c, w.a, w.b) >= 0 ? 1 : -1;
      // 距窗 500~800 的同时，沿窗宽偏到一侧，避免正好压在窗下家具/坐具上。
      const lateral = Math.min(600, (o.width || 1800) * 0.3);
      return {
        list: [{
          p: [
            ct[0] - u[0] * lateral + n[0] * side * 650,
            ct[1] - u[1] * lateral + n[1] * side * 650,
          ],
          angle: 0,
        }],
      };
    }
  }
  // 情景面板规则：“同上，与开关面板并排（间距 100）”，不能放房间中心。
  if (rule.deviceType2 === '情景面板' && anchor.kind === 'roomCenter' && String(anchor.raw || '').includes('开关面板')) {
    const pts = doorSideCandidates(room, project, 175);
    if (pts.length) {
      const base = pts[0];
      const ux = Math.cos((base.angle * Math.PI) / 180);
      const uy = Math.sin((base.angle * Math.PI) / 180);
      return { list: [{ p: [base.p[0] + ux * 100, base.p[1] + uy * 100], angle: base.angle }] };
    }
  }
  // 任务照明：书桌/学习桌重点灯与台灯必须围绕桌面，而不是放房间中心。
  if ((rule.deviceType2 === '射灯' || rule.deviceType2 === '台灯') && /书桌|学习桌/.test(String(anchor.raw || ''))) {
    const desk = furnitureInRoom(project, room.id, ['desk'])[0];
    if (desk) {
      const [x, y, w, h] = desk.rect;
      if (rule.deviceType2 === '台灯') {
        // 台灯放在桌面非惯用手一侧（默认左侧）。
        return { list: [{ p: [x + w * .18, y + h * .5], angle: desk.rotation }] };
      }
      return {
        list: furniturePoints(desk, 'edge', c, 2).map(p => ({ p, angle: desk.rotation, length: Math.max(desk.rect[2], desk.rect[3]) })),
      };
    }
  }
  // 中控屏：“客厅主入口或沙发正对墙面”，优先落在入户门侧墙，而不是沙发前沿。
  if (rule.deviceType2 === '中控屏' && String(anchor.raw || '').includes('入口')) {
    const doors = openingsNearRoom(project, room, 'door');
    const pts = doorSideCandidates(room, project, 175);
    if (pts.length && doors.length) {
      const doorCenter = openingCenter(doors[0].o, doors[0].w);
      const base = pts[0];
      const ux = Math.cos((base.angle * Math.PI) / 180);
      const uy = Math.sin((base.angle * Math.PI) / 180);
      const sign = (base.p[0] - doorCenter[0]) * ux + (base.p[1] - doorCenter[1]) * uy >= 0 ? 1 : -1;
      return { list: [{ p: [base.p[0] + ux * sign * 400, base.p[1] + uy * sign * 400], angle: base.angle }] };
    }
  }
  switch (anchor.kind) {
    case 'roomCenter': {
      // 房间中心锚点不代表“所有设备叠在圆心”。
      // 按规则数量沿房间长轴均匀展开：1 台居中，2 台落在 1/4、3/4，依此类推。
      const b = bboxOf(room.polygon);
      const n = Math.max(1, Math.min(8, quantityFor(rule, room, project).count));
      const horizontal = b.w >= b.h;
      const list: Candidate[] = [];
      for (let i = 0; i < n; i++) {
        const t = n === 1 ? 0.5 : (i + 0.5) / n;
        list.push(horizontal
          ? { p: [b.x + b.w * t, c[1]], angle: 0 }
          : { p: [c[0], b.y + b.h * t], angle: 90 });
      }
      return { list };
    }
    case 'inscribedRectCenter': {
      const r = inscribedRect(room.polygon, 200);
      return { list: [{ p: [r.x + r.w / 2, r.y + r.h / 2], angle: 0 }] };
    }
    case 'inscribedGrid': {
      const d = DEMO_DEFAULTS.downlight;
      return {
        list: gridPoints(room.polygon ? room : room, anchor.rows ?? d.rows, anchor.rowGap ?? d.rowGap, anchor.colGap ?? d.colGap, d.wallClearance),
      };
    }
    case 'longAxisLine':
      return { list: longAxisPoints(room, 10) };
    case 'wallOffset':
      return { list: wallOffsetPoints(room, anchor.offset ?? 300) };
    case 'wallEvenDivide':
      return { list: wallOffsetPoints(room, anchor.offset ?? 250) };
    case 'doorSideWall':
      return { list: doorSideCandidates(room, project, anchor.offset ?? 175) };
    case 'windowHead':
      return { list: windowCandidates(project, room) };
    case 'furnitureCenter': {
      const fs = chooseFurniture(project, room, anchor);
      // 没有对应家具时不能把设备放到房间中心伪装成“已布点”。
      if (!fs.length) return { list: [], note: 'NO_FURNITURE' };
      if (rule.deviceType2.includes('灯带')) {
        return {
          list: fs.map(f => {
            const e = furnitureEdgeCenter(f, c, 50);
            return { p: e.p, angle: e.angle, length: e.length };
          }),
        };
      }
      return { list: fs.flatMap(f => furniturePoints(f, 'center', c).map(p => ({ p, angle: f.rotation }))) };
    }
    case 'furniturePair': {
      const ns = furnitureInRoom(project, room.id, ['nightstand']);
      if (ns.length >= 2) {
        return { list: ns.slice(0, 2).map(f => ({ p: rectCenter(f.rect), angle: f.rotation })) };
      }
      const bed = furnitureInRoom(project, room.id, ['bed'])[0];
      if (bed) {
        const [x, y, w, h] = bed.rect;
        return {
          list: [
            { p: [x - 350, y + h * 0.5], angle: 0 },
            { p: [x + w + 350, y + h * 0.5], angle: 0 },
          ],
          note: 'BED_SIDE_FALLBACK',
        };
      }
      return { list: wallOffsetPoints(room, 250), note: 'NO_FURNITURE' };
    }
    case 'furnitureEdge': {
      const fs = chooseFurniture(project, room, anchor);
      if (!fs.length) return { list: [], note: 'NO_FURNITURE' };
      if (rule.deviceType2.includes('灯带')) {
        return {
          list: fs.map(f => {
            const e = furnitureEdgeCenter(f, c);
            return { p: e.p, angle: e.angle, length: e.length };
          }),
        };
      }
      const n = Math.max(2, Math.min(12, quantityFor(rule, room, project).count));
      return { list: fs.flatMap(f => furniturePoints(f, 'edge', c, n).map(p => ({ p, angle: f.rotation, length: Math.max(f.rect[2], f.rect[3]) }))) };
    }
    case 'pathLine':
      return { list: pathPoints(room, project, 6) };
    case 'hostTrack':
      return { list: longAxisPoints(room, 8), note: 'HOST_TRACK_FALLBACK' };
    case 'cabinetShelf': {
      const fs = furnitureInRoom(project, room.id, ['wardrobe', 'upperCabinet', 'bookshelf', 'displayCabinet']);
      if (!fs.length) return { list: [], note: 'NO_FURNITURE' };
      if (rule.deviceType2.includes('灯带')) {
        return {
          list: fs.map(f => {
            const e = furnitureEdgeCenter(f, c, 50);
            return { p: e.p, angle: e.angle, length: e.length };
          }),
        };
      }
      return { list: fs.flatMap(f => furniturePoints(f, 'edge', c).map(p => ({ p, angle: f.rotation, length: Math.max(f.rect[2], f.rect[3]) }))) };
    }
    case 'perimeter':
      return { list: perimeterSegments(room, anchor.offset ?? 100) };
    default:
      return { list: [{ p: c, angle: 0 }] };
  }
}

function targetLengthM(rule: PointRule, room: Room, project: Project): number {
  const q = rule.quantity;
  // 磁吸灯体按实际宿主（电视柜/沙发）长边计算数量，避免 7 台灯挤在 2.4m 轨道上。
  if ((q.kind === 'perLength' || q.measure === 'track') && rule.deviceType2.includes('磁吸')) {
    const host = furnitureInRoom(project, room.id, ['tv', 'tvCabinet'])[0]
      ?? furnitureInRoom(project, room.id, ['sofa'])[0];
    if (host) return Math.max(host.rect[2], host.rect[3]) / 1000;
  }
  // 洗墙射灯的数量按“电视墙/柜体所贴墙面的可用宽”计算，而不是房间最长边。
  if (q.kind === 'perLength' && rule.anchor.kind === 'furnitureEdge' && rule.deviceType2 === '射灯') {
    const types = rule.anchor.furnitureTypes ?? [];
    const f = types.length ? furnitureInRoom(project, room.id, types)[0] : undefined;
    if (f) {
      const edge = nearestRoomEdge(room, rectCenter(f.rect));
      if (edge) return distance(edge.a, edge.b) / 1000;
    }
  }
  if (q.target === 'window') {
    const wins = openingsNearRoom(project, room, 'window');
    if (wins.length) return wins.reduce((s, x) => s + x.o.width, 0) / 1000;
  }
  if (q.target?.startsWith('furniture:')) {
    const type = q.target.split(':')[1];
    const fs = furnitureInRoom(project, room.id, [type]);
    if (fs.length) return Math.max(...fs.map(f => Math.max(f.rect[2], f.rect[3]))) / 1000;
  }
  const b = bboxOf(room.polygon);
  return Math.max(b.w, b.h) / 1000;
}

function applyRound(n: number, q: QuantitySpec): number {
  // 2.4 / 0.8 这类浮点除法会得到 2.9999999996，直接 floor 会少一台。
  if (q.round === 'floor') return Math.floor(n + 1e-6);
  if (q.round === 'round') return Math.round(n);
  return Math.ceil(n);
}

function quantityFor(rule: PointRule, room: Room, project: Project): { count: number; stripLengthMm?: number; note?: string } {
  const q = rule.quantity;
  const excludedArea = (room.excludePolygons ?? []).reduce((s, poly) => s + polygonArea(poly), 0);
  const areaM2 = Math.max(0.5, (polygonArea(room.polygon) - excludedArea) / 1e6);
  const lenM = targetLengthM(rule, room, project);
  let count = 1;
  let stripLengthMm: number | undefined;
  let note: string | undefined;
  switch (q.kind) {
    case 'fixed':
      count = q.value ?? 1;
      break;
    case 'perArea': {
      const raw = areaM2 / (q.value ?? 2.5);
      count = applyRound(raw, q);
      break;
    }
    case 'perLength': {
      const raw = lenM / (q.value ?? 1);
      count = applyRound(raw, q);
      if (rule.deviceType2.includes('灯带')) {
        stripLengthMm = Math.round(Math.max(lenM, 0.8) * 1000);
        count = 1;
      }
      break;
    }
    case 'measuredLength': {
      // 新版规则：灯带/轨道长度在布置完成后按实际路径实测，不在这里预先拉伸。
      if (q.measure === 'perimeter') count = 4;
      else if (q.measure === 'window') count = Math.max(1, openingsNearRoom(project, room, 'window').length);
      else if (q.measure === 'track') count = Math.max(1, Math.ceil(lenM / 1.2 - 1e-6));
      else if (q.measure === 'cabinet') {
        const types = rule.anchor.furnitureTypes?.length
          ? rule.anchor.furnitureTypes
          : ['wardrobe', 'upperCabinet', 'bookshelf', 'displayCabinet'];
        count = Math.max(1, furnitureInRoom(project, room.id, types).length);
      } else count = 1;
      break;
    }
    case 'perOpening': {
      const opens = openingsNearRoom(project, room, q.target === 'door' ? 'door' : 'window');
      count = Math.max(opens.length, 0) * (q.value ?? 1);
      if (!opens.length) note = 'NO_TARGET';
      break;
    }
    case 'perFurniture': {
      const fs = furnitureInRoom(project, room.id, q.furnitureTypes);
      count = fs.length * (q.value ?? 1);
      if (!fs.length) {
        if (q.furnitureTypes?.includes('nightstand') && furnitureInRoom(project, room.id, ['bed']).length) {
          count = 2;
          note = 'BED_SIDE_FALLBACK';
        } else {
          count = 0;
          note = 'NO_FURNITURE';
        }
      }
      break;
    }
    case 'stripPerimeter': {
      const length = Math.max(2, (q.factor ?? 0.8) * 4 * Math.sqrt(Math.max(areaM2, 1)));
      stripLengthMm = Math.round(length * 1000);
      count = 4;
      break;
    }
    case 'cabinetLength': {
      const fs = furnitureInRoom(project, room.id, ['wardrobe', 'upperCabinet', 'bookshelf', 'displayCabinet']);
      const length = fs.reduce((s, f) => s + Math.max(f.rect[2], f.rect[3]) / 1000, 0);
      stripLengthMm = Math.round(Math.max(length, 1) * 1000);
      count = 1;
      if (!fs.length) note = 'NO_FURNITURE';
      break;
    }
    case 'wholeHouseArea':
      count = 1;
      break;
    default:
      count = q.value ?? 1;
      note = 'GENERIC_COUNT';
  }
  if (q.min != null) count = Math.max(count, q.min);
  if (q.max != null) count = Math.min(count, q.max);
  if (q.even) count = Math.floor(count / 2) * 2;
  count = Math.max(0, Math.min(count, DEMO_DEFAULTS.maxDevicesPerRule));
  return { count, stripLengthMm, note };
}

function collisionZones(project: Project, room: Room): Array<{ poly: Point2[]; label: string }> {
  const zones: Array<{ poly: Point2[]; label: string }> = [];
  for (const { o, w } of openingsNearRoom(project, room, 'door')) {
    const poly = doorSwingPolygon(o, w, room);
    if (poly.length) zones.push({ poly, label: 'DOOR_SWING' });
  }
  for (const { o, w } of openingsNearRoom(project, room, 'window')) {
    const { p0, p1, n } = openingEnds(o, w);
    const t = 120;
    const poly: Point2[] = [
      [p0[0] - n[0] * t, p0[1] - n[1] * t],
      [p1[0] - n[0] * t, p1[1] - n[1] * t],
      [p1[0] + n[0] * t, p1[1] + n[1] * t],
      [p0[0] + n[0] * t, p0[1] + n[1] * t],
    ];
    zones.push({ poly, label: 'WINDOW' });
  }
  const stove = furnitureInRoom(project, room.id, ['stove'])[0];
  if (stove) {
    const [x, y, w, h] = stove.rect;
    zones.push({ poly: [[x - 600, y - 600], [x + w + 600, y - 600], [x + w + 600, y + h + 600], [x - 600, y + h + 600]], label: 'STOVE' });
  }
  const tv = furnitureInRoom(project, room.id, ['tv', 'tvCabinet'])[0];
  if (tv) {
    const [x, y, w, h] = tv.rect;
    zones.push({ poly: [[x + w * 0.2, y - 300], [x + w * 0.8, y - 300], [x + w * 0.8, y + h + 300], [x + w * 0.2, y + h + 300]], label: 'TV_SCREEN' });
  }
  const shower = furnitureInRoom(project, room.id, ['shower', 'bathtub'])[0];
  if (shower) {
    const [x, y, w, h] = shower.rect;
    zones.push({ poly: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], label: 'WET_ZONE' });
  }
  return zones;
}

function blocked(rule: PointRule, p: Point2, room: Room, project: Project, zones: Array<{ poly: Point2[]; label: string }>): string | null {
  if (!pointInPolygon(p, room.polygon)) {
    const near = polygonEdges(room.polygon).some(e => pointToSegmentDistance(p, e.a, e.b) < 120);
    if (!near) return 'OUT_OF_ROOM';
  }
  if (room.excludePolygons?.some(poly => pointInPolygon(p, poly))) return 'FUNCTION_ZONE_EXCLUDED';
  const mount = rule.mount;
  for (const z of zones) {
    if (mount === 'WL') continue;
    if (mount === 'CL' && ['DOOR_SWING', 'WINDOW', 'WET_ZONE', 'TV_SCREEN'].includes(z.label)) continue;
    if (mount === 'BL' && z.label === 'DOOR_SWING') continue;
    if (pointInPolygon(p, z.poly)) return z.label;
  }
  return null;
}

function nearestExisting(p: Point2, devices: PlacedDevice[], rule: PointRule): { ok: boolean; min: number } {
  let min = Infinity;
  for (const d of devices) {
    if (d.ruleCode === rule.pointCode) continue;
    // 间距约束只约束同类型设备（筒灯对筒灯、射灯对射灯…）。
    // 不同设备类型互不抢占间距，否则磁吸灯/射灯/筒灯会互相把对方挤出合法点位。
    if (d.deviceType2 !== rule.deviceType2) continue;
    const dist = distance(p, [d.position.x, d.position.y]);
    if (dist < min) min = dist;
  }
  return { ok: min >= (rule.spacing || 0), min };
}

function makeDevice(
  rule: PointRule,
  room: Room,
  def: DeviceDef,
  c: Candidate,
  idx: number,
  status: 'placed' | 'fallback',
  notes: string[],
  bomQuantity?: number,
): PlacedDevice {
  const b = bboxOf(room.polygon);
  const maxStrip = Math.max(b.w, b.h) * 1.15;
  const dynamic = ['rect', 'l', 'u'].includes(def.visual) ? dynamicBoxSize(room) : null;
  const rawWidth = dynamic?.width ?? (c.length && (def.glow === 'line') ? Math.min(c.length, maxStrip) : def.size.width);
  const rawDepth = dynamic?.depth ?? def.size.depth;
  const fitted = fitDeviceGeometry(room, c.p, c.angle, Math.max(rawWidth, 60), rawDepth, def.visual);
  const warnings: string[] = [];
  if (dynamic) {
    warnings.push(`灯组尺寸按空间可用面积动态计算：${dynamic.width} × ${dynamic.depth}mm`);
    if (!notes.includes('DYNAMIC_SIZE')) notes.push('DYNAMIC_SIZE');
  }
  if (fitted.clipped) {
    const clippedText = ['line', 'track'].includes(def.visual)
      ? `灯带/轨道按房间边界收口：${Math.round(rawWidth)} → ${Math.round(fitted.width)}mm`
      : `灯组按房间边界收口：${Math.round(rawWidth)} × ${Math.round(rawDepth)} → ${Math.round(fitted.width)} × ${Math.round(fitted.depth)}mm`;
    warnings.push(clippedText);
    if (!notes.includes('LINE_CLIPPED')) notes.push('LINE_CLIPPED');
  }
  const z = heightForRule(rule, room);
  return {
    id: `dev-${room.id}-${rule.pointCode}-${idx}`,
    ruleCode: rule.pointCode,
    deviceKey: def.key,
    deviceType2: def.category2,
    category1: def.category1,
    roomId: room.id,
    roomName: room.name,
    position: { x: Math.round(fitted.center[0]), y: Math.round(fitted.center[1]), z },
    rotation: c.angle,
    mount: rule.mount,
    priority: rule.priority,
    visual: def.visual,
    glow: def.glow,
    size: { width: Math.max(Math.round(fitted.width), 80), depth: Math.max(Math.round(fitted.depth), 60) },
    status,
    source: 'rule',
    locked: false,
    binding: bindingForRule(rule),
    ...(bomQuantity
      ? { quote: { inputQuantity: bomQuantity, moduleQuantity: bomQuantity, placementForm: def.visual } }
      : {}),
    trace: {
      anchor: rule.anchor.kind,
      candidateRank: idx + 1,
      fallbackStep: status === 'fallback' ? 1 : 0,
      confidence: notes.includes('NO_FURNITURE') ? 0.42 : 0.86,
      notes: [...rule.traceFlags, ...notes],
      warnings,
    },
  };
}

function bindingForRule(rule: PointRule): PlacedDevice['binding'] {
  const kind = rule.anchor.kind;
  if (kind === 'windowHead') return { kind: 'window', name: rule.anchor.raw };
  if (kind === 'hostTrack') return { kind: 'track', name: rule.anchor.raw };
  if (kind === 'furnitureCenter' || kind === 'furnitureEdge' || kind === 'furniturePair' || kind === 'cabinetShelf') {
    return { kind: 'furniture', name: rule.anchor.raw };
  }
  if (kind === 'wallOffset' || kind === 'wallEvenDivide' || kind === 'doorSideWall') {
    return { kind: 'wall', name: rule.anchor.raw };
  }
  if (kind === 'pathLine' || kind === 'perimeter' || kind === 'longAxisLine') {
    return { kind: 'path', name: rule.anchor.raw };
  }
  return { kind: 'room', name: rule.anchor.raw };
}

function makePendingDevice(
  rule: PointRule,
  room: Room,
  def: DeviceDef,
  idx: number,
  reason: string,
  source: PlacedDevice['source'] = 'rule',
  pending?: PendingDiagnostic,
): PlacedDevice {
  const c = polygonCentroid(room.polygon);
  return {
    id: `dev-${room.id}-${rule.pointCode}-pending-${idx}`,
    ruleCode: rule.pointCode,
    deviceKey: def.key,
    deviceType2: def.category2,
    category1: def.category1,
    roomId: room.id,
    roomName: room.name,
    position: { x: Math.round(c[0]), y: Math.round(c[1]), z: heightForRule(rule, room) },
    rotation: 0,
    mount: rule.mount,
    priority: rule.priority,
    visual: def.visual,
    glow: def.glow,
    size: { width: def.size.width, depth: def.size.depth },
    status: 'pending',
    source,
    locked: false,
    binding: { kind: 'pending', name: rule.anchor.raw },
    trace: {
      anchor: rule.anchor.kind,
      candidateRank: 0,
      fallbackStep: 99,
      confidence: 0.1,
      notes: [...rule.traceFlags, 'PENDING_PLACEMENT', `RULE:${rule.pointCode}`],
      warnings: [reason],
      ...(pending ? { pending } : {}),
    },
  };
}

const BLOCK_LABELS: Record<string, string> = {
  OUT_OF_ROOM: '落在房间外',
  FUNCTION_ZONE_EXCLUDED: '落在功能分区外',
  DOOR_SWING: '门扇开启区',
  WINDOW: '窗洞',
  WET_ZONE: '湿区',
  TV_SCREEN: '电视屏幕禁射区',
  STOVE: '灶台避让',
  SPACING_CONFLICT: '与同类型设备间距不足',
};

/** 把“规则要求 / 实际生成候选 / 未满足条件 / 建议”整理成待处理诊断。 */
function buildPendingDiagnostic(
  rule: PointRule,
  room: Room,
  project: Project,
  args: { code: string; generated: number; available: number; required: number; blocked?: string[] },
): PendingDiagnostic {
  const types = rule.anchor.furnitureTypes ?? [];
  const furniture = types.length ? furnitureInRoom(project, room.id, types) : [];
  const blocked = [...new Set(args.blocked ?? [])];
  const blockedText = blocked.filter(x => BLOCK_LABELS[x]).map(x => BLOCK_LABELS[x]).join('、');
  const avoid = rule.collision.filter(x => x !== 'NONE');
  const requirement = [
    `锚点：${rule.anchor.raw || rule.anchor.kind}`,
    `数量：${rule.quantity.raw}`,
    types.length ? `目标家具：${types.join('、')}（找到 ${furniture.length} 个）` : '',
    avoid.length ? `避让：${avoid.join('、')}` : '',
    rule.spacing ? `最小间距：${rule.spacing}mm` : '',
  ].filter(Boolean).join('；');
  const found = [
    types.length ? `目标家具 ${types.join('、')}：${furniture.length} 个` : '',
    `锚点生成 ${args.generated} 个候选点，${args.available} 个可用`,
    `规则需要 ${args.required} 台`,
  ].filter(Boolean).join('；');

  let unmet: string;
  if (!args.generated) {
    unmet = types.length && !furniture.length
      ? `缺少目标家具「${types.join('、')}」，无法生成安装锚点`
      : '锚点未生成合法候选点（缺少安装载体或可用路径）';
  } else if (args.required > args.generated) {
    unmet = `规则需要 ${args.required} 台，锚点只生成 ${args.generated} 个候选点，缺口 ${args.required - args.generated} 台`;
  } else if (args.available < args.required) {
    const rejected = args.generated - args.available;
    unmet = blockedText
      ? `生成 ${args.generated} 个候选点，其中 ${rejected} 个被${blockedText}排除，仅 ${args.available} 个可用，少于 ${args.required} 台`
      : `合法候选点只有 ${args.available} 个，少于规则需要的 ${args.required} 台`;
  } else {
    unmet = '候选点不足，无法满足规则数量';
  }

  let suggestion: string;
  if (types.length && !furniture.length) {
    suggestion = `先在空间内补充「${types.join('、')}」，或确认该规则是否适用于当前空间`;
  } else if (blocked.includes('SPACING_CONFLICT')) {
    suggestion = '增大设备间距或减少同类型设备数量，也可以调整家具位置';
  } else if (blocked.some(x => ['DOOR_SWING', 'WINDOW', 'WET_ZONE', 'TV_SCREEN', 'STOVE'].includes(x))) {
    suggestion = `调整${blockedText}相关家具/门窗位置后重新一键布点`;
  } else if (args.required > args.generated) {
    suggestion = '补充该规则需要的候选锚点（如床侧、门口、柜体），或按规则 fallback 减少数量';
  } else {
    suggestion = '人工确认安装位置，或补充安装载体后重新一键布点';
  }

  return {
    reasonCode: args.code || blocked[0] || 'NO_AVAILABLE_CANDIDATE',
    requirement,
    found,
    unmet,
    suggestion,
    required: args.required,
    available: args.available,
  };
}

function heightForRule(rule: PointRule, room: Room): number {
  // 书桌台灯落到桌面高度；规则里的 BL 425 是台灯类通用默认值，不能直接用于书桌。
  if (rule.deviceType2 === '台灯' && /书桌|学习桌/.test(String(rule.anchor.raw || ''))) return 750;
  if (rule.height.base === 'CL') return room.ceilingHeight - (rule.height.offset ?? 0);
  if (rule.height.base === 'FL') return rule.height.offset ?? 0;
  if (rule.height.base === 'WL') return rule.height.offset ?? 2400;
  if (rule.height.base === 'BL') return rule.height.offset ?? 900;
  return rule.height.offset ?? 1300;
}

function modeExcluded(rule: PointRule, room: Room): boolean {
  const isMain = ['吸顶灯', '吊灯', '面板灯'].includes(rule.deviceType2);
  const isCenterGrid = rule.anchor.kind === 'inscribedGrid' && rule.deviceType2 === '筒灯';
  if (room.mode === 'NO_MAIN' && isMain) return true;
  if (room.mode === 'MAIN' && isCenterGrid) return true;
  return false;
}

function executeRule(rule: PointRule, room: Room, project: Project, existing: PlacedDevice[]): {
  devices: PlacedDevice[];
  execution: RuleExecution;
  unplaced?: UnplacedRule;
} {
  const def = deviceForRule(rule);
  if (!def) {
    return {
      devices: [],
      execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: 'skipped', placedCount: 0, reasonCode: 'PRODUCT_MISSING', reason: '设备目录缺少该二级分类', traceFlags: rule.traceFlags },
      unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: 'PRODUCT_MISSING', reason: '设备目录缺少该二级分类', traceFlags: rule.traceFlags },
    };
  }
  if (modeExcluded(rule, room)) {
    return {
      devices: [],
      execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: 'skipped', placedCount: 0, reasonCode: 'MODE_EXCLUDED', reason: `当前空间模式 ${room.mode} 不执行该主灯/中心阵列规则`, traceFlags: rule.traceFlags },
      unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: 'MODE_EXCLUDED', reason: `当前空间模式 ${room.mode} 不执行该规则`, traceFlags: rule.traceFlags },
    };
  }
  const q = quantityFor(rule, room, project);
  if (q.count <= 0) {
    return {
      devices: [],
      execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: 'executed_with_fallback', placedCount: 0, reasonCode: q.note ?? 'NO_TARGET', reason: '数量计算结果为 0', traceFlags: rule.traceFlags },
      unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: q.note ?? 'NO_TARGET', reason: '数量计算结果为 0', traceFlags: rule.traceFlags },
    };
  }
  // 锁定/既有设备已经占用该规则的报价数量，重排时只补差额，避免同一规则重复生成。
  const requested = q.count;
  const already = existing.filter(d =>
    d.roomId === room.id && d.deviceKey === def.key && d.ruleCode === rule.pointCode,
  ).length;
  // 磁吸轨道：报价数量是模块数，效果图只生成一条连续轨道。
  const isTrackRule = rule.deviceType2.includes('磁吸轨道');
  const target = isTrackRule ? (already ? 0 : 1) : Math.max(0, requested - already);
  if (target === 0) {
    return {
      devices: [],
      execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: 'executed', placedCount: isTrackRule ? requested : already, requestedCount: requested, pendingCount: 0, reason: '既有/锁定设备已满足该规则数量', traceFlags: rule.traceFlags },
    };
  }
  const cand = candidatesFor(rule, room, project);
  const zones = collisionZones(project, room);
  const notes = [q.note, cand.note].filter(Boolean) as string[];
  if (!cand.list.length) {
    // 规则绑定的家具/柜体/窗不存在时，不能退到墙面或房间中心伪造落位。
    // 规则声明 REMOVE 的直接取消；其他情况保留为待处理，提示补充安装载体。
    if (rule.fallback?.includes('REMOVE')) {
      return {
        devices: [],
        execution: {
          ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2,
          // REMOVE 表示“该目标不存在时取消此规则”，不计入报价请求量。
          status: 'executed', placedCount: already, requestedCount: 0, pendingCount: 0,
          reasonCode: 'NO_CARRIER', reason: '缺少对应家具/安装载体，按规则 fallback=REMOVE 取消', traceFlags: rule.traceFlags,
        },
      };
    }
    const pending = Array.from({ length: target }, (_, i) =>
      makePendingDevice(rule, room, def, i, '缺少对应家具/安装载体，保留为待处理', 'rule',
        buildPendingDiagnostic(rule, room, project, { code: 'NO_CARRIER', generated: 0, available: 0, required: requested })));
    return {
      devices: pending,
      execution: {
        ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2,
        status: 'executed_with_fallback', placedCount: already, requestedCount: requested, pendingCount: target,
        reasonCode: 'NO_CARRIER', reason: '缺少对应家具/安装载体，设备保留为待处理', traceFlags: rule.traceFlags,
      },
      unplaced: {
        ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2,
        reasonCode: 'NO_CARRIER', reason: '缺少对应家具/安装载体', traceFlags: rule.traceFlags,
        requestedCount: requested, pendingCount: target,
      },
    };
  }
  const accepted: Candidate[] = [];
  for (const c of cand.list) {
    const block = blocked(rule, c.p, room, project, zones);
    if (block) {
      if (!notes.includes(block)) notes.push(block);
      continue;
    }
    const near = nearestExisting(c.p, existing, rule);
    if (!near.ok) {
      if (!notes.includes('SPACING_CONFLICT')) notes.push('SPACING_CONFLICT');
      continue;
    }
    accepted.push(c);
    if (accepted.length >= target) break;
  }
  if (isTrackRule) {
    if (!accepted.length) {
      return {
        devices: [],
        execution: {
          ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2,
          status: 'executed_with_fallback', placedCount: already, requestedCount: requested, pendingCount: 0,
          reasonCode: 'NO_TRACK_PATH', reason: '轨道宿主路径冲突，本次取消；不生成重叠轨道', traceFlags: rule.traceFlags,
        },
      };
    }
    const d = makeDevice(rule, room, def, accepted[0], 0, notes.length ? 'fallback' : 'placed', notes, requested);
    return {
      devices: [d],
      execution: {
        ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2,
        status: 'executed', placedCount: requested + already, requestedCount: requested, pendingCount: 0,
        reason: `一条连续轨道，长度按宿主路径实测，报价按 ${requested} 个模块计价`, traceFlags: rule.traceFlags,
      },
    };
  }
  if (!accepted.length) {
    const fallback = candidatesFor({ ...rule, anchor: { ...rule.anchor, kind: 'roomCenter' } }, room, project).list[0];
    const block = fallback ? blocked(rule, fallback.p, room, project, zones) : 'CONFLICT_P0';
    if (fallback && !block) {
      const d = makeDevice(rule, room, def, fallback, 0, 'fallback', [...notes, 'FALLBACK_ROOM_CENTER']);
      const pendingCount = Math.max(0, target - 1);
      const diag = buildPendingDiagnostic(rule, room, project, { code: 'FALLBACK_ROOM_CENTER', generated: cand.list.length, available: 1, required: requested, blocked: notes });
      const pending = Array.from({ length: pendingCount }, (_, i) => makePendingDevice(rule, room, def, i + 1, '原规则候选点冲突，仅保留一个降级点，其余等待人工处理', 'rule', diag));
      return {
        devices: [d, ...pending],
        execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: 'executed_with_fallback', placedCount: 1 + already, requestedCount: requested, pendingCount, reasonCode: pendingCount ? 'CAPACITY_EXCEEDED' : 'FALLBACK_ROOM_CENTER', reason: pendingCount ? `仅 1 台降级落位，${pendingCount} 台保留为待处理` : '候选点均冲突，降级到房间中心', traceFlags: rule.traceFlags },
        ...(pendingCount ? { unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: 'CAPACITY_EXCEEDED', reason: '降级后仍不足，设备未删除，等待人工处理', traceFlags: rule.traceFlags, requestedCount: requested, pendingCount } } : {}),
      };
    }
    return {
      devices: Array.from({ length: target }, (_, i) => makePendingDevice(rule, room, def, i, '候选点均被禁布区、设备外轮廓或间距约束排除', 'rule',
        buildPendingDiagnostic(rule, room, project, { code: block || 'CONFLICT_P0', generated: cand.list.length, available: 0, required: requested, blocked: notes }))),
      execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status: 'executed_with_fallback', placedCount: already, requestedCount: requested, pendingCount: target, reasonCode: block || 'CONFLICT_P0', reason: '候选点均被禁布区、设备外轮廓或间距约束排除，设备保留在待处理清单', traceFlags: rule.traceFlags },
      unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: block || 'CONFLICT_P0', reason: '候选点均被禁布区、设备外轮廓或间距约束排除', traceFlags: rule.traceFlags, requestedCount: requested, pendingCount: target },
    };
  }
  const out: PlacedDevice[] = [];
  const count = Math.min(target, accepted.length);
  for (let i = 0; i < count; i++) {
    const c = { ...accepted[i] };
    if (q.stripLengthMm && def.glow === 'line' && rule.anchor.kind !== 'perimeter') c.length = q.stripLengthMm / Math.max(count, 1);
    out.push(makeDevice(rule, room, def, c, i, notes.length ? 'fallback' : 'placed', notes));
  }
  const pendingCount = Math.max(0, target - out.length);
  const diag = buildPendingDiagnostic(rule, room, project, { code: pendingCount ? 'CAPACITY_EXCEEDED' : 'NO_AVAILABLE_CANDIDATE', generated: cand.list.length, available: accepted.length, required: requested, blocked: notes });
  const pending = Array.from({ length: pendingCount }, (_, i) => makePendingDevice(rule, room, def, out.length + i, '合法候选点不足，保留为待处理设备', 'rule', diag));
  const status = notes.length || pendingCount ? 'executed_with_fallback' : 'executed';
  return {
    devices: [...out, ...pending],
    execution: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, status, placedCount: out.length + already, requestedCount: requested, pendingCount, reasonCode: pendingCount ? 'CAPACITY_EXCEEDED' : notes[0], reason: pendingCount ? `${pendingCount} 台保留为待处理：合法候选点不足` : (notes.length ? notes.join(',') : undefined), traceFlags: rule.traceFlags },
    ...(pendingCount ? { unplaced: { ruleCode: rule.pointCode, roomId: room.id, roomName: room.name, deviceType2: rule.deviceType2, reasonCode: 'CAPACITY_EXCEEDED', reason: '合法候选点不足，设备未删除，等待人工处理', traceFlags: rule.traceFlags, requestedCount: requested, pendingCount } } : {}),
  };
}

function addCombinationDevices(project: Project, devices: PlacedDevice[]): PlacedDevice[] {
  const out: PlacedDevice[] = [];
  // 只有灯体需要派生共享轨道；轨道本身不再复制一条，避免同一规则重复计数。
  const trackKeys = new Set(['磁吸泛光灯 · 灯体', '磁吸格栅灯 · 灯体']);
  for (const d of devices) {
    if (d.deviceType2 === '窗帘电机') {
      const def = DEVICE_BY_KEY['窗帘电机 · 电动轨道'];
      if (def) {
        out.push({
          ...d, id: `${d.id}-track`, deviceKey: def.key, deviceType2: def.category2,
          priority: 'P3', visual: def.visual, glow: 'line', size: { width: 1800, depth: 60 }, trace: { ...d.trace, notes: [...d.trace.notes, 'CHILD_TRACK'] },
        });
      }
    }
    if (trackKeys.has(d.deviceKey) && d.deviceType2.includes('磁吸')) {
      const def = DEVICE_BY_KEY['磁吸泛光灯 · 磁吸轨道'];
      // 房间已经有规则生成的磁吸轨道（KT-TR-01）时，直接复用，不再派生第三条重叠轨道。
      const hasTrack = [...devices, ...out].some(x => x.roomId === d.roomId && x.deviceKey === def?.key);
      if (def && !hasTrack) {
        out.push({
          ...d, id: `${d.id}-track`, deviceKey: def.key, deviceType2: def.category2,
          priority: 'P3', visual: def.visual, glow: 'line', size: { width: 1200, depth: 60 }, trace: { ...d.trace, notes: [...d.trace.notes, 'SHARED_TRACK'] },
        });
      }
    }
  }
  // Demo expansion: make sure L/U/口字灯带 and 筒灯口字组 appear at least once in the 15-space sample.
  if (project.id === 'demo-15spaces') {
    const living = project.rooms.find(r => r.spaceCode === 'KT');
    const dining = project.rooms.find(r => r.spaceCode === 'CT');
    const mk = (room: Room | undefined, key: string, x: number, y: number, w: number, d: number, angle = 0) => {
      if (!room) return;
      const def = DEVICE_BY_KEY[key];
      if (!def) return;
      const fitted = fitDeviceGeometry(room, [x, y], angle, w, d, def.visual);
      out.push({
        id: `demo-combo-${key}-${room.id}`,
        ruleCode: 'DEMO-COMBO',
        deviceKey: def.key, deviceType2: def.category2, category1: def.category1,
        roomId: room.id, roomName: room.name,
        position: { x: Math.round(fitted.center[0]), y: Math.round(fitted.center[1]), z: room.ceilingHeight - 50 },
        rotation: angle, mount: 'CL', priority: 'P3', visual: def.visual, glow: def.glow,
        size: { width: Math.round(fitted.width), depth: Math.round(fitted.depth) }, status: 'placed', source: 'rule', locked: false,
        trace: {
          anchor: 'perimeter', candidateRank: 0, fallbackStep: 0, confidence: 1,
          notes: ['DEMO_COMBINATION', ...(fitted.clipped ? ['LINE_CLIPPED'] : [])],
          warnings: fitted.clipped ? ['Demo 组合灯形已按房间边界收口'] : [],
        },
      });
    };
    if (living) {
      const b = bboxOf(living.polygon);
      mk(living, 'L 型灯带', b.x + 600, b.y + 600, 1800, 800, 0);
      mk(living, '筒灯口字组', b.x + b.w - 1000, b.y + b.h - 1000, 800, 800, 0);
    }
    if (dining) {
      const b = bboxOf(dining.polygon);
      mk(dining, '口字灯带', b.x + b.w / 2, b.y + b.h / 2, 1600, 1600, 0);
    }
  }
  return out;
}

function wholeHousePass(project: Project): PlacedDevice[] {
  // 全屋网络优先落在玄关/过道/客厅等公共区域，绝不以主卧作为兜底。
  const publicRoom = (code: SpaceCode) => project.rooms.find(r => r.spaceCode === code);
  const nonBedroom = project.rooms.find(r => !['ZW', 'WS', 'LRF', 'XHF'].includes(r.spaceCode));
  const entry = publicRoom('XCW') ?? publicRoom('GDYT') ?? publicRoom('KT') ?? nonBedroom ?? project.rooms[0];
  const hall = project.rooms.find(r => r.spaceCode === 'GDYT') ?? entry;
  const living = project.rooms.find(r => r.spaceCode === 'KT') ?? entry;
  const study = project.rooms.find(r => r.spaceCode === 'SF') ?? hall;
  const out: PlacedDevice[] = [];
  const push = (key: string, room: Room, p: Point2, z: number, binding?: PlacedDevice['binding']) => {
    const def = DEVICE_BY_KEY[key];
    if (!def) return;
    out.push({
      id: `whole-${key}`,
      ruleCode: 'WHOLE-HOUSE',
      deviceKey: def.key, deviceType2: def.category2, category1: def.category1,
      roomId: '__whole',
      roomName: '全屋基础包',
      position: { x: Math.round(p[0]), y: Math.round(p[1]), z },
      rotation: 0, mount: def.mount, priority: 'P2', visual: def.visual, glow: 'none', size: def.size,
      status: 'placed', source: 'wholeHouse', locked: false, binding,
      trace: {
        anchor: 'wholeHouse', candidateRank: 1, fallbackStep: 0, confidence: 0.9,
        notes: [`HOST_ROOM:${room.name}`, 'WHOLE_HOUSE_BASIC'], warnings: [],
      },
    });
  };
  // 弱电箱及箱内设备沿入户/过道墙段展开，高度 FL+1350，避免落在卧室床/房间中心。
  const entryWall = doorSideCandidates(entry, project, 220)[0] ?? { p: polygonCentroid(entry.polygon), angle: 0 };
  const ux = Math.cos(entryWall.angle * Math.PI / 180);
  const uy = Math.sin(entryWall.angle * Math.PI / 180);
  const weakKeys = ['弱电箱 · 箱体', '弱电箱 · PoE 路由', '弱电箱 · Mesh 主路由', '弱电箱 · PoE 交换机', '弱电箱 · 交换机', '交换机'];
  weakKeys.forEach((key, i) => {
    const offset = (i - (weakKeys.length - 1) / 2) * 150;
    let p: Point2 = [entryWall.p[0] + ux * offset, entryWall.p[1] + uy * offset];
    if (!pointInPolygon(p, entry.polygon)) p = entryWall.p;
    push(key, entry, p, 1350, { kind: 'wall', name: `弱电箱 · ${entry.name}` });
  });
  const hallC = polygonCentroid(hall.polygon);
  push('蓝牙 Mesh 网关', hall, hallC, hall.ceilingHeight - 100, { kind: 'room', name: hall.name });
  push('顶装 AP', hall, [hallC[0] + 350, hallC[1]], hall.ceilingHeight - 50, { kind: 'room', name: hall.name });
  push('Mesh 路由器', living, polygonCentroid(living.polygon), 800, { kind: 'furniture', name: '客厅电视柜/设备位' });
  const studyWall = doorSideCandidates(study, project, 175)[0] ?? { p: polygonCentroid(study.polygon), angle: 0 };
  push('面板 AP', study, studyWall.p, 1300, { kind: 'wall', name: study.name });
  return out;
}

export function runLayout(project: Project, options: EngOptions = {}): LayoutResult {
  const rooms = options.mode === 'currentRoom' && options.roomId
    ? project.rooms.filter(r => r.id === options.roomId)
    : project.rooms;
  const devices: PlacedDevice[] = [];
  const unplaced: UnplacedRule[] = [];
  const executions: RuleExecution[] = [];
  const existing = options.preserveLocked === false ? [] : project.devices.filter(d => d.locked);
  const priorityOrder = { P1: 1, P2: 2, P3: 3, P4: 4, P0: 0 } as const;

  for (const room of rooms) {
    const roomRules = rulesForRoom(room.spaceCode)
      .slice()
      .sort((a, b) => (priorityOrder[a.priority] - priorityOrder[b.priority]) || a.deviceType2.localeCompare(b.deviceType2) || a.pointCode.localeCompare(b.pointCode));
    for (const rule of roomRules) {
      const r = executeRule(rule, room, project, [...existing, ...devices]);
      devices.push(...r.devices);
      if (r.unplaced) unplaced.push(r.unplaced);
      executions.push(r.execution);
    }
  }

  const combo = addCombinationDevices(project, devices);
  const allDevices = [...devices, ...combo];
  const locked = options.preserveLocked === false ? [] : project.devices.filter(d => d.locked);
  const manual = options.sources?.length === 0 ? [] : project.devices.filter(d => d.source === 'manual' && !d.locked);
  const lockedIds = new Set(locked.map(d => d.id));
  const manualIds = new Set(manual.map(d => d.id));
  const merged = [
    ...allDevices.filter(d => !lockedIds.has(d.id) && !manualIds.has(d.id)),
    ...manual,
    ...locked,
  ];

  return {
    devices: merged,
    wholeHouseDevices: wholeHousePass(project),
    unplaced,
    executions,
    diagnostics: [
      `规则版本 ${DEMO_DEFAULTS.ruleVersion}`,
      `执行 ${executions.length} 条规则，落位 ${merged.length} 个设备`,
      `未落位 ${unplaced.length} 条`,
      `${project.id === 'demo-15spaces' ? '15 空间演示户型' : '三室两厅示例'} · ${rooms.length} 个空间`,
    ],
    ruleVersion: DEMO_DEFAULTS.ruleVersion,
    engineVersion: DEMO_DEFAULTS.engineVersion,
    seed: project.seed,
  };
}

function genericCandidatesForDevice(room: Room, def: DeviceDef, project: Project): Candidate[] {
  const c = polygonCentroid(room.polygon);
  if (['rect', 'l', 'u', 'array', 'pointRect'].includes(def.visual)) return [{ p: c, angle: 0 }];
  if (def.visual === 'track') return longAxisPoints(room, 3);
  if (def.category1 === '控制') return doorSideCandidates(room, project, 175);
  if (def.category1 === '遮阳') return windowCandidates(project, room);
  if (def.category1 === '暖通') return wallOffsetPoints(room, 350);
  if (def.category1 === '音乐') {
    const sofa = furnitureInRoom(project, room.id, ['sofa', 'teaTable', 'diningTable'])[0];
    if (sofa) return furniturePoints(sofa, 'center', c).map(p => ({ p, angle: sofa.rotation }));
  }
  if (def.category1 === '网络') return [{ p: c, angle: 0 }];
  if (def.glow === 'line') {
    if (def.category2.includes('灯槽') || def.category2.includes('贴墙')) return perimeterPoints(room, 120);
    if (def.category2.includes('窗帘')) return windowCandidates(project, room);
    if (def.category2.includes('柜体')) {
      const fs = furnitureInRoom(project, room.id, ['wardrobe', 'tvCabinet', 'bookshelf', 'displayCabinet', 'upperCabinet']);
      return fs.flatMap(f => furniturePoints(f, 'edge', c).map(p => ({ p, angle: f.rotation, length: Math.max(f.rect[2], f.rect[3]) })));
    }
    return longAxisPoints(room, 3);
  }
  return wallOffsetPoints(room, 250);
}

function deviceRuleMatches(rule: PointRule, def: DeviceDef): boolean {
  // 判定顺序与 shared/placement-rules.mjs 完全一致，改口径只改那一份。
  return ruleMatchesDeviceKey(rule, def.key);
}

/**
 * 反查：某个空间类型下，某台设备可以命中的布置规则。
 * 供「设备面板」和「规则汇总-设备维度」共用，保证解释口径与一键布点一致。
 */
export function rulesForDevice(spaceCode: SpaceCode, deviceKey: string): PointRule[] {
  const def = DEVICE_BY_KEY[deviceKey] ?? findDevice(deviceKey);
  if (!def) return [];
  const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3, P4: 4 } as const;
  const spaceRules = rulesForRoom(spaceCode)
    .filter(r => deviceRuleMatches(r, def))
    .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || a.pointCode.localeCompare(b.pointCode));
  if (spaceRules.length) return spaceRules;
  return CROSS_RULE_TEMPLATES
    .filter(t => t.deviceKey === def.key)
    .map(t => ({
      ...t,
      spaceCode,
      spaceName: SPACE_BY_CODE[spaceCode]?.name ?? spaceCode,
    })) as PointRule[];
}

/** 通过规则编号回查跨空间通用规则，并绑定到指定空间。 */
export function crossRuleForCode(code: string, spaceCode: SpaceCode): PointRule | null {
  const template = CROSS_RULE_BY_CODE.get(code);
  if (!template) return null;
  return {
    ...template,
    spaceCode,
    spaceName: SPACE_BY_CODE[spaceCode]?.name ?? spaceCode,
  } as PointRule;
}

/**
 * 一键布点：只处理当前方案里已经存在的设备。
 * 不新增设备，不删除设备，只按同空间、同设备的已编译规则重新计算位置与 trace。
 */
export function placeExistingDevices(project: Project, options: EngOptions = {}): LayoutResult {
  const rooms = options.mode === 'currentRoom' && options.roomId
    ? project.rooms.filter(r => r.id === options.roomId)
    : project.rooms;
  const devices = project.devices.map(d => ({
    ...d,
    position: { ...d.position },
    trace: { ...d.trace, notes: [...d.trace.notes], warnings: [...d.trace.warnings] },
  }));
  const locked = devices.filter(d => d.locked);
  const occupied: PlacedDevice[] = [...locked];
  const executions: RuleExecution[] = [];
  const unplaced: UnplacedRule[] = [];

  for (const room of rooms) {
    const sources = options.sources ?? ['manual'];
    const roomDevices = devices.filter(d =>
      d.roomId === room.id
      && !d.locked
      && sources.includes(d.source));
    if (!roomDevices.length) continue;
    const groups = new Map<string, PlacedDevice[]>();
    for (const d of roomDevices) {
      // 规则设备按“设备 + 规则”分组，避免同类型但不同规则的设备被互相改归因，
      // 导致报价行数量对不上（例如阅读射灯被算进电视墙射灯）。
      const key = `${d.deviceKey}|${d.category1}|${d.deviceType2}|${d.source === 'rule' ? d.ruleCode : ''}`;
      const arr = groups.get(key) ?? [];
      arr.push(d);
      groups.set(key, arr);
    }
    const zones = collisionZones(project, room);
    for (const group of groups.values()) {
      const first = group[0];
      const def = DEVICE_BY_KEY[first.deviceKey] ?? findDevice(first.deviceType2);
      let matchedRules = def ? rulesForDevice(room.spaceCode, def.key) : [];
      // 一键套餐生成的设备已有明确规则：只在该规则内重新取点，不换规则、不换报价行。
      if (first.source === 'rule' && first.ruleCode) {
        const pinned = matchedRules.filter(r => r.pointCode === first.ruleCode);
        if (pinned.length) matchedRules = pinned;
      }
      const candidates: Array<{ c: Candidate; rule: PointRule }> = [];
      for (const rule of matchedRules) {
        for (const c of candidatesFor(rule, room, project).list) {
          if (blocked(rule, c.p, room, project, zones)) continue;
          candidates.push({ c, rule });
        }
      }
      if (!matchedRules.length && def) {
        const base = def.mount;
        const genericRule: PointRule = {
          pointCode: 'EXISTING-GENERIC',
          spaceCode: room.spaceCode,
          spaceName: room.name,
          deviceType2: def.category2,
          usage: '现有设备通用布点',
          mount: base,
          height: {
            base,
            offset: base === 'SL' ? 1300 : base === 'WL' ? 2400 : base === 'BL' ? 900 : 0,
          },
          anchor: {
            kind: def.visual === 'line' ? 'perimeter' : def.visual === 'track' ? 'longAxisLine' : 'roomCenter',
            raw: '现有设备通用布点',
          },
          quantity: { kind: 'fixed', value: 1, raw: '1' },
          spacing: 220,
          priority: 'P3',
          collision: [],
          fallback: ['REMOVE'],
          sourceText: '现有设备通用布点',
          traceFlags: ['NO_RULE_FALLBACK'],
        };
        for (const c of genericCandidatesForDevice(room, def, project)) {
          if (blocked(genericRule, c.p, room, project, zones)) continue;
          candidates.push({ c, rule: genericRule });
        }
      }
      const seen = new Set<string>();
      const unique = candidates.filter(x => {
        const k = `${Math.round(x.c.p[0])},${Math.round(x.c.p[1])},${Math.round(x.c.angle)}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      const matchedCode = matchedRules[0]?.pointCode ?? (def ? 'EXISTING-GENERIC' : 'EXISTING');
      let fallbackCount = 0;
      let used = 0;
      for (const d of group) {
        const picked = unique.find(x => {
          const near = nearestExisting(x.c.p, occupied, x.rule);
          return near.ok && !occupied.some(o => Math.hypot(o.position.x - x.c.p[0], o.position.y - x.c.p[1]) < 60);
        });
        if (picked) {
          const { c, rule } = picked;
          const b = bboxOf(room.polygon);
          const maxStrip = Math.max(b.w, b.h) * 1.15;
          const visual = def?.visual ?? d.visual;
          const dynamic = ['rect', 'l', 'u'].includes(visual) ? dynamicBoxSize(room) : null;
          const rawWidth = dynamic?.width ?? (c.length && def?.glow === 'line' ? Math.min(c.length, maxStrip) : (def?.size.width ?? d.size.width));
          const rawDepth = dynamic?.depth ?? (def?.size.depth ?? d.size.depth);
          const fitted = fitDeviceGeometry(room, c.p, c.angle, Math.max(rawWidth, 60), rawDepth, visual);
          const clipWarnings = [
            ...(dynamic ? [`灯组尺寸按空间可用面积动态计算：${dynamic.width} × ${dynamic.depth}mm`] : []),
            ...(fitted.clipped ? [`按房间边界收口：${Math.round(rawWidth)} → ${Math.round(fitted.width)}mm`] : []),
          ];
          d.deviceKey = def?.key ?? d.deviceKey;
          d.deviceType2 = def?.category2 ?? d.deviceType2;
          d.category1 = def?.category1 ?? d.category1;
          d.ruleCode = rule.pointCode;
          d.position = { x: Math.round(fitted.center[0]), y: Math.round(fitted.center[1]), z: heightForRule(rule, room) };
          d.rotation = c.angle;
          d.mount = rule.mount;
          d.priority = rule.priority;
          d.visual = visual;
          d.glow = def?.glow ?? d.glow;
          d.size = {
            width: Math.max(Math.round(fitted.width), 80),
            depth: Math.max(Math.round(fitted.depth), 60),
          };
          d.status = 'placed';
          d.trace = {
            anchor: rule.anchor.kind,
            candidateRank: used + 1,
            fallbackStep: 0,
            confidence: 0.9,
            notes: [
              'EXISTING_DEVICE_PLACEMENT',
              `RULE:${rule.pointCode}`,
              ...rule.traceFlags,
              ...(fitted.clipped ? ['LINE_CLIPPED'] : []),
              ...(dynamic ? ['DYNAMIC_SIZE'] : []),
            ],
            warnings: clipWarnings,
          };
          occupied.push(d);
          used++;
        } else {
          fallbackCount++;
          d.ruleCode = matchedCode;
          if (matchedRules[0]) {
            d.mount = matchedRules[0].mount;
            d.priority = matchedRules[0].priority;
          }
          // 真实业务口径：候选点不足时不能把设备伪装成“房间中心已落位”。
          // 保留原坐标、数量和规则归因，进入待处理清单，由人工继续处理。
          d.status = 'pending';
          d.trace = {
            ...d.trace,
            anchor: matchedRules[0]?.anchor.kind ?? 'roomCenter',
            candidateRank: 0,
            fallbackStep: 1,
            confidence: 0.45,
            notes: [
              'EXISTING_DEVICE_PLACEMENT',
              `RULE:${matchedCode}`,
              'NO_AVAILABLE_CANDIDATE',
            ],
            warnings: [
              '候选点不足，设备保留为待处理，不自动移到房间中心',
            ],
          };
        }
      }
      const status = fallbackCount ? 'executed_with_fallback' : 'executed';
      executions.push({
        ruleCode: matchedCode,
        roomId: room.id,
        roomName: room.name,
        deviceType2: first.deviceType2,
        status,
        placedCount: used,
        requestedCount: group.length,
        pendingCount: fallbackCount,
        reasonCode: fallbackCount ? 'NO_AVAILABLE_CANDIDATE' : undefined,
        reason: fallbackCount
          ? `部分设备没有可用候选点，已保留为待处理（规则 ${matchedCode}）`
          : `命中 ${matchedCode}，已按规则锚点布点`,
        traceFlags: ['EXISTING_DEVICE_PLACEMENT'],
      });
    }
  }

  return {
    devices,
    wholeHouseDevices: project.wholeHouseDevices,
    unplaced,
    executions,
    diagnostics: [
      `按现有设备布点：${devices.filter(d => d.status === 'placed' || d.status === 'fallback').length} 个已落位`,
      `待处理 ${devices.filter(d => d.status === 'pending').length} 个，输入数量保持不变`,
      `覆盖 ${executions.length} 个设备组 / ${new Set(executions.map(e => e.roomId)).size} 个空间`,
      `兜底 ${executions.filter(e => e.status === 'executed_with_fallback').length} 组`,
    ],
    ruleVersion: DEMO_DEFAULTS.ruleVersion,
    engineVersion: DEMO_DEFAULTS.engineVersion,
    seed: project.seed,
  };
}

export function rulesForSpace(spaceCode: SpaceCode): PointRule[] {
  return rulesForRoom(spaceCode);
}

export function allRules(): PointRule[] {
  return RULES;
}

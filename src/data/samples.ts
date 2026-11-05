import type {
  Furniture, FurnitureType, Opening, Point2, Project, Room, SchemeMode, SpaceCode, Wall,
} from '../types';
import { bboxOf, distance } from '../core/geometry';

const WALL_T = 180;

function room(id: string, name: string, code: SpaceCode, x: number, y: number, w: number, h: number, mode: SchemeMode): Room {
  return {
    id, name, spaceCode: code,
    polygon: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]],
    mode, tags: [], ceilingHeight: 2800,
  };
}

function wallKey(a: Point2, b: Point2) {
  const p = a[0] < b[0] || (a[0] === b[0] && a[1] < b[1]) ? [a, b] : [b, a];
  return `${Math.round(p[0][0])},${Math.round(p[0][1])}-${Math.round(p[1][0])},${Math.round(p[1][1])}`;
}

function buildWalls(rooms: Room[], maxX: number, maxY: number): Wall[] {
  const map = new Map<string, Wall>();
  for (const r of rooms) {
    for (let i = 0; i < r.polygon.length; i++) {
      const a = r.polygon[i];
      const b = r.polygon[(i + 1) % r.polygon.length];
      const k = wallKey(a, b);
      if (map.has(k)) continue;
      const onEdge = (a[0] === 0 && b[0] === 0) || (a[0] === maxX && b[0] === maxX) ||
        (a[1] === 0 && b[1] === 0) || (a[1] === maxY && b[1] === maxY);
      map.set(k, {
        id: `w${map.size + 1}`,
        a, b,
        thickness: WALL_T,
        height: 2800,
        type: onEdge ? 'exterior' : 'partition',
      });
    }
  }
  return [...map.values()];
}

function findWall(project: Project, a: Point2, b: Point2): Wall | undefined {
  const k = wallKey(a, b);
  return project.walls.find(w => wallKey(w.a, w.b) === k);
}

function addOpening(
  project: Project, type: Opening['type'], a: Point2, b: Point2, t: number, width: number,
  opts: Partial<Opening> = {},
): void {
  const w = findWall(project, a, b);
  if (!w) return;
  const len = distance(w.a, w.b);
  const start = Math.max(0, Math.min(len - width, len * t - width / 2));
  project.openings.push({
    id: `o${project.openings.length + 1}`,
    type,
    wallId: w.id,
    start,
    width,
    height: type === 'window' ? 1500 : type === 'sliding' ? 2400 : 2100,
    sill: type === 'window' ? 900 : undefined,
    hinge: opts.hinge ?? 'start',
    swing: opts.swing ?? 'inside',
    ...opts,
  });
}

function addFurn(
  project: Project,
  room: Room,
  type: FurnitureType,
  relX: number,
  relY: number,
  w: number,
  h: number,
  rotation = 0,
  height = 600,
): Furniture {
  const b = bboxOf(room.polygon);
  const f: Furniture = {
    id: `f${project.furniture.length + 1}`,
    type,
    roomId: room.id,
    rect: [b.x + relX, b.y + relY, w, h],
    rotation,
    height,
  };
  project.furniture.push(f);
  return f;
}

function furnishBedroom(project: Project, room: Room, opts: { wardrobe?: boolean; dresser?: boolean; child?: boolean } = {}): void {
  const b = bboxOf(room.polygon);
  const bedW = Math.min(1800, b.w - 1600);
  const bedH = Math.min(2000, b.h - 1200);
  const bedX = (b.w - bedW) / 2;
  const bedY = b.h - bedH - 350;
  addFurn(project, room, 'bed', bedX, bedY, bedW, bedH, 0, 500);
  addFurn(project, room, 'nightstand', bedX - 450, bedY + bedH - 450, 400, 400, 0, 500);
  addFurn(project, room, 'nightstand', bedX + bedW + 50, bedY + bedH - 450, 400, 400, 0, 500);
  if (opts.wardrobe !== false) addFurn(project, room, 'wardrobe', b.w - 650, 300, 600, Math.min(2000, b.h - 800), 0, 2200);
  if (opts.dresser) addFurn(project, room, 'dresser', 250, 250, 1200, 450, 0, 750);
  if (opts.child) addFurn(project, room, 'desk', 250, b.h - 700, 1200, 550, 0, 750);
  if (opts.child) addFurn(project, room, 'chair', 650, b.h - 1150, 450, 450, 0, 450);
}

function furnishLiving(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'sofa', 600, 500, Math.min(2600, b.w * 0.55), 850, 0, 800);
  addFurn(project, room, 'coffeeTable', b.w * 0.45, b.h * 0.48, 1200, 600, 0, 400);
  addFurn(project, room, 'tvCabinet', b.w - 500, 700, 400, Math.min(2000, b.h * 0.55), 0, 450);
  addFurn(project, room, 'tv', b.w - 540, 900, 80, Math.min(1500, b.h * 0.4), 0, 1100);
  addFurn(project, room, 'rug', b.w * 0.22, b.h * 0.25, b.w * 0.5, b.h * 0.5, 0, 20);
}

function furnishDining(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'diningTable', b.w * 0.22, b.h * 0.28, Math.min(1600, b.w * 0.45), 900, 0, 750);
  for (let i = 0; i < 3; i++) {
    addFurn(project, room, 'chair', b.w * 0.25 + i * 480, b.h * 0.2, 420, 420, 0, 450);
    addFurn(project, room, 'chair', b.w * 0.25 + i * 480, b.h * 0.62, 420, 420, 0, 450);
  }
  addFurn(project, room, 'sideboard', b.w - 500, 400, 400, Math.min(1600, b.h - 900), 0, 850);
}

function furnishKitchen(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'kitchenCounter', 150, b.h - 750, b.w - 300, 600, 0, 850);
  addFurn(project, room, 'kitchenCounter', 150, 150, 600, b.h - 900, 0, 850);
  addFurn(project, room, 'upperCabinet', 150, b.h - 400, b.w - 300, 320, 0, 1600);
  addFurn(project, room, 'sink', b.w * 0.35, b.h - 720, 750, 480, 0, 850);
  addFurn(project, room, 'stove', b.w * 0.68, b.h - 720, 700, 480, 0, 850);
  addFurn(project, room, 'fridge', b.w - 850, 200, 650, 650, 0, 1800);
}

function furnishBath(project: Project, room: Room, dressing = false): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'toilet', b.w - 600, 350, 420, 650, 0, 750);
  addFurn(project, room, 'vanity', 250, b.h - 800, Math.min(1400, b.w - 900), 500, 0, 850);
  addFurn(project, room, 'mirror', 350, b.h - 780, Math.min(1200, b.w - 1100), 60, 0, 1800);
  addFurn(project, room, 'shower', 250, 250, Math.min(1100, b.w - 1400), Math.min(1100, b.h - 1400), 0, 2200);
  if (dressing) addFurn(project, room, 'dresser', b.w - 900, b.h - 750, 700, 450, 0, 750);
}

function furnishStudy(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'desk', 250, b.h - 800, Math.min(1500, b.w - 800), 600, 0, 750);
  addFurn(project, room, 'chair', 650, b.h - 1250, 450, 450, 0, 450);
  addFurn(project, room, 'bookshelf', b.w - 450, 250, 350, Math.min(1800, b.h - 900), 0, 2200);
}

function furnishEntry(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'shoeCabinet', 250, 250, Math.min(1200, b.w - 800), 400, 0, 1100);
  addFurn(project, room, 'bench', 300, b.h - 700, 900, 400, 0, 450);
}

function furnishBalcony(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'washingMachine', b.w - 750, 250, 600, 600, 0, 850);
  addFurn(project, room, 'dryingRack', 300, b.h - 900, 1800, 500, 0, 1800);
  addFurn(project, room, 'chair', 400, 350, 500, 500, 0, 450);
}

function furnishWardrobe(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'wardrobe', 150, 150, 600, b.h - 300, 0, 2200);
  addFurn(project, room, 'wardrobe', b.w - 750, 150, 600, b.h - 300, 0, 2200);
  addFurn(project, room, 'island', b.w * 0.35, b.h * 0.35, 900, 500, 0, 900);
  addFurn(project, room, 'mirror', b.w * 0.45, b.h - 400, 500, 60, 0, 1800);
}

function furnishTea(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'teaTable', b.w * 0.3, b.h * 0.3, 1200, 700, 0, 450);
  addFurn(project, room, 'chair', b.w * 0.15, b.h * 0.3, 450, 450, 0, 450);
  addFurn(project, room, 'chair', b.w * 0.7, b.h * 0.3, 450, 450, 0, 450);
  addFurn(project, room, 'displayCabinet', b.w - 450, 250, 350, Math.min(1800, b.h - 900), 0, 2000);
}

function furnishHall(project: Project, room: Room): void {
  const b = bboxOf(room.polygon);
  addFurn(project, room, 'console', b.w - 400, b.h * 0.35, 350, 900, 0, 800);
}

function furnishBedroomsAll(project: Project, rooms: Record<string, Room>): void {
  if (rooms.zw) { furnishBedroom(project, rooms.zw, { dresser: true }); }
  if (rooms.ws) { furnishBedroom(project, rooms.ws); }
  if (rooms.lrf) { furnishBedroom(project, rooms.lrf, { wardrobe: true }); }
  if (rooms.xhf) { furnishBedroom(project, rooms.xhf, { child: true }); }
}

export function buildDemo15Spaces(): Project {
  const maxX = 19000, maxY = 12000;
  const rooms: Room[] = [
    room('entry', '玄关', 'XCW', 0, 0, 3000, 3600, 'NO_MAIN'),
    room('living', '客厅', 'KT', 3000, 0, 6000, 3600, 'MIXED'),
    room('balcony', '阳台', 'YT', 9000, 0, 6000, 3600, 'NO_MAIN'),
    room('bedroom', '卧室', 'WS', 15000, 0, 4000, 3600, 'MAIN'),
    room('tea', '茶室', 'CS', 0, 3600, 3500, 3600, 'MAIN'),
    room('dining', '餐厅', 'CT', 3500, 3600, 4500, 3600, 'MAIN'),
    room('kitchen', '厨房', 'CF', 8000, 3600, 4000, 3600, 'NO_MAIN'),
    room('bath', '卫生间', 'WSJ', 12000, 3600, 3000, 3600, 'NO_MAIN'),
    room('hall', '过道', 'GDYT', 15000, 3600, 4000, 3600, 'NO_MAIN'),
    room('elder', '老人房', 'LRF', 0, 7200, 3500, 4800, 'MAIN'),
    room('kids', '儿童房', 'XHF', 3500, 7200, 3500, 4800, 'MAIN'),
    room('master', '主卧', 'ZW', 7000, 7200, 4500, 4800, 'MIXED'),
    room('masterBath', '卧室卫生间', 'WSWSJ', 11500, 7200, 2500, 4800, 'NO_MAIN'),
    room('closet', '衣帽间', 'YMJ', 14000, 7200, 2500, 4800, 'NO_MAIN'),
    room('study', '书房', 'SF', 16500, 7200, 2500, 4800, 'MIXED'),
  ];
  const project: Project = {
    id: 'demo-15spaces',
    name: '15 空间演示户型',
    units: 'mm',
    width: maxX,
    height: maxY,
    ceilingHeight: 2800,
    rooms,
    walls: buildWalls(rooms, maxX, maxY),
    openings: [],
    furniture: [],
    devices: [],
    wholeHouseDevices: [],
    ruleVersion: '2026-10-19-V1',
    engineVersion: '0.1.0',
    seed: 'demo-15spaces-001',
  };
  // 门：沿共享墙布置
  addOpening(project, 'door', [3000, 0], [3000, 3600], 0.5, 900); // 玄关-客厅
  addOpening(project, 'sliding', [9000, 0], [9000, 3600], 0.55, 1800); // 客厅-阳台
  addOpening(project, 'door', [15000, 0], [15000, 3600], 0.5, 900); // 阳台-卧室
  addOpening(project, 'sliding', [3000, 3600], [9000, 3600], 0.5, 2200); // 客厅-餐厅
  addOpening(project, 'door', [3500, 3600], [3500, 7200], 0.5, 900); // 茶室-餐厅
  addOpening(project, 'door', [8000, 3600], [8000, 7200], 0.5, 900); // 餐厅-厨房
  addOpening(project, 'door', [12000, 3600], [12000, 7200], 0.5, 850); // 厨房-卫生间
  addOpening(project, 'door', [15000, 3600], [15000, 7200], 0.5, 850); // 卫生间-过道
  addOpening(project, 'door', [15000, 3600], [19000, 3600], 0.5, 900); // 过道-卧室
  addOpening(project, 'door', [15000, 7200], [19000, 7200], 0.25, 900); // 过道-衣帽间
  addOpening(project, 'door', [15000, 7200], [19000, 7200], 0.7, 900); // 过道-书房
  addOpening(project, 'door', [11500, 7200], [11500, 12000], 0.45, 850); // 主卧-主卫
  addOpening(project, 'door', [14000, 7200], [14000, 12000], 0.45, 850); // 主卫-衣帽间
  addOpening(project, 'door', [7000, 7200], [7000, 12000], 0.45, 900); // 儿童房-主卧
  addOpening(project, 'door', [3500, 7200], [3500, 12000], 0.45, 900); // 老人房-儿童房
  addOpening(project, 'door', [0, 7200], [3500, 7200], 0.5, 900); // 茶室-老人房
  addOpening(project, 'door', [3500, 7200], [8000, 7200], 0.5, 900); // 餐厅-主卧
  addOpening(project, 'door', [12000, 7200], [15000, 7200], 0.5, 850); // 卫生间-主卫
  // 窗：外墙
  addOpening(project, 'window', [0, 12000], [3500, 12000], 0.35, 1800);
  addOpening(project, 'window', [3500, 12000], [7000, 12000], 0.5, 1800);
  addOpening(project, 'window', [7000, 12000], [11500, 12000], 0.5, 2000);
  addOpening(project, 'window', [11500, 12000], [14000, 12000], 0.5, 1800);
  addOpening(project, 'window', [14000, 12000], [16500, 12000], 0.5, 1700);
  addOpening(project, 'window', [16500, 12000], [19000, 12000], 0.5, 1500);
  addOpening(project, 'window', [0, 3600], [0, 7200], 0.5, 1800);
  addOpening(project, 'window', [3000, 0], [9000, 0], 0.5, 2400);
  addOpening(project, 'window', [9000, 0], [15000, 0], 0.5, 3000);
  addOpening(project, 'window', [15000, 0], [19000, 0], 0.5, 2200);
  // 家具
  furnishEntry(project, rooms[0]);
  furnishLiving(project, rooms[1]);
  furnishBalcony(project, rooms[2]);
  furnishBedroomsAll(project, { ws: rooms[3], zw: rooms[11], lrf: rooms[9], xhf: rooms[10] });
  furnishTea(project, rooms[4]);
  furnishDining(project, rooms[5]);
  furnishKitchen(project, rooms[6]);
  furnishBath(project, rooms[7]);
  furnishHall(project, rooms[8]);
  furnishBath(project, rooms[12], true);
  furnishWardrobe(project, rooms[13]);
  furnishStudy(project, rooms[14]);
  return project;
}

export function buildDemo3Bed(): Project {
  const maxX = 12000, maxY = 10000;
  const rooms: Room[] = [
    room('entry', '玄关', 'XCW', 0, 0, 2500, 3200, 'NO_MAIN'),
    room('balcony', '阳台', 'YT', 2500, 0, 4000, 3200, 'NO_MAIN'),
    room('bath', '卫生间', 'WSJ', 6500, 0, 2500, 3200, 'NO_MAIN'),
    room('bedroom2', '卧室', 'WS', 9000, 0, 3000, 3200, 'MAIN'),
    room('living', '客厅', 'KT', 0, 3200, 5000, 3300, 'MIXED'),
    room('dining', '餐厅', 'CT', 5000, 3200, 3500, 3300, 'MAIN'),
    room('kitchen', '厨房', 'CF', 8500, 3200, 3500, 3300, 'NO_MAIN'),
    room('master', '主卧', 'ZW', 0, 6500, 4500, 3500, 'MIXED'),
    room('kids', '儿童房', 'XHF', 4500, 6500, 3500, 3500, 'MAIN'),
    room('study', '书房', 'SF', 8000, 6500, 4000, 3500, 'MIXED'),
  ];
  const project: Project = {
    id: 'demo-3bed',
    name: '三室两厅示例户型',
    units: 'mm',
    width: maxX,
    height: maxY,
    ceilingHeight: 2800,
    rooms,
    walls: buildWalls(rooms, maxX, maxY),
    openings: [],
    furniture: [],
    devices: [],
    wholeHouseDevices: [],
    ruleVersion: '2026-10-19-V1',
    engineVersion: '0.1.0',
    seed: 'demo-3bed-001',
  };
  addOpening(project, 'door', [2500, 0], [2500, 3200], 0.5, 900);
  addOpening(project, 'sliding', [2500, 3200], [5000, 3200], 0.5, 2200);
  addOpening(project, 'door', [6500, 0], [6500, 3200], 0.5, 850);
  addOpening(project, 'door', [9000, 0], [9000, 3200], 0.5, 850);
  addOpening(project, 'door', [5000, 3200], [5000, 6500], 0.5, 900);
  addOpening(project, 'door', [8500, 3200], [8500, 6500], 0.5, 900);
  addOpening(project, 'door', [0, 6500], [4500, 6500], 0.25, 900);
  addOpening(project, 'door', [4500, 6500], [8000, 6500], 0.5, 900);
  addOpening(project, 'door', [8000, 6500], [12000, 6500], 0.25, 900);
  addOpening(project, 'window', [0, 10000], [4500, 10000], 0.5, 2200);
  addOpening(project, 'window', [4500, 10000], [8000, 10000], 0.5, 1800);
  addOpening(project, 'window', [8000, 10000], [12000, 10000], 0.5, 2000);
  addOpening(project, 'window', [0, 3200], [0, 6500], 0.5, 1800);
  addOpening(project, 'window', [12000, 3200], [12000, 6500], 0.5, 1600);
  addOpening(project, 'window', [2500, 0], [6500, 0], 0.5, 2600);
  addOpening(project, 'window', [9000, 0], [12000, 0], 0.5, 1800);
  furnishEntry(project, rooms[0]);
  furnishBalcony(project, rooms[1]);
  furnishBath(project, rooms[2]);
  furnishBedroom(project, rooms[3]);
  furnishLiving(project, rooms[4]);
  furnishDining(project, rooms[5]);
  furnishKitchen(project, rooms[6]);
  furnishBedroom(project, rooms[7], { dresser: true });
  furnishBedroom(project, rooms[8], { child: true });
  furnishStudy(project, rooms[9]);
  return project;
}

export const SAMPLE_BUILDERS = {
  'demo-15spaces': buildDemo15Spaces,
  'demo-3bed': buildDemo3Bed,
} as const;

export type SampleId = keyof typeof SAMPLE_BUILDERS;

export type Point2 = [number, number];

export type SpaceCode =
  | 'KT' | 'CT' | 'ZW' | 'SF' | 'WS' | 'LRF' | 'XHF' | 'XCW'
  | 'CF' | 'WSJ' | 'GDYT' | 'YT' | 'YMJ' | 'WSWSJ' | 'CS';

export type SchemeMode = 'MAIN' | 'NO_MAIN' | 'MIXED';

export type Priority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export type GlowShape = 'point' | 'line' | 'area' | 'fan' | 'track' | 'none';

export type DeviceVisual = 'point' | 'line' | 'l' | 'u' | 'rect' | 'track' | 'array' | 'pointRect' | 'none';

export type MountBase = 'FL' | 'CL' | 'SL' | 'WL' | 'BL';

export type FloorMaterial =
  | 'wood' | 'walnut' | 'tile800' | 'tile600'
  | 'antislip' | 'marble' | 'terrazzo' | 'carpet';

export type DeviceCategory1 =
  | '灯光' | '控制' | '环境' | '安防监控' | '网络' | '音乐' | '遮阳' | '暖通';

export interface SpaceDef {
  code: SpaceCode;
  name: string;
  defaultMode: SchemeMode;
  zones: string[];
}

export interface DeviceDef {
  key: string;
  category1: DeviceCategory1;
  category2: string;
  /** V2.2 产品族：同一产品族的不同旧分类通过 layout/route/mount 区分。 */
  productFamily?: string;
  legacyType2?: string;
  mountSurface?: 'ceiling' | 'wall' | 'floor' | 'cove' | 'cabinet' | 'curtain_box' | 'table' | 'track';
  layoutForm?: 'single' | 'line' | 'rectangle';
  routeShape?: 'straight' | 'L' | 'U' | 'rectangle' | 'free';
  application?: 'cove' | 'curtain_box' | 'cabinet' | 'low_position' | 'wash_wall' | 'general';
  salesUnit?: 'piece' | 'meter' | 'group' | 'set';
  aliases: string[];
  icon: string;
  visual: DeviceVisual;
  glow: GlowShape;
  mount: MountBase;
  size: { width: number; depth: number };
  role: string;
  demoExtension?: boolean;
}

export interface Room {
  id: string;
  name: string;
  spaceCode: SpaceCode;
  polygon: Point2[];
  /** 功能分区从父空间中扣除的候选区域（用于避免父子空间重复布点）。 */
  excludePolygons?: Point2[][];
  mode: SchemeMode;
  tags: string[];
  ceilingHeight: number;
  floorMaterial?: FloorMaterial;
}

export interface Wall {
  id: string;
  a: Point2;
  b: Point2;
  thickness: number;
  height: number;
  type: 'exterior' | 'load-bearing' | 'partition';
}

export interface Opening {
  id: string;
  type: 'door' | 'window' | 'sliding';
  wallId: string;
  start: number;
  width: number;
  height: number;
  sill?: number;
  hinge?: 'start' | 'end';
  swing?: 'inside' | 'outside' | 'both';
}

export type FurnitureType =
  | 'bed' | 'nightstand' | 'wardrobe' | 'dresser' | 'mirror'
  | 'sofa' | 'coffeeTable' | 'tvCabinet' | 'tv' | 'rug'
  | 'diningTable' | 'chair' | 'sideboard' | 'desk' | 'bookshelf'
  | 'kitchenCounter' | 'upperCabinet' | 'sink' | 'stove' | 'fridge'
  | 'toilet' | 'vanity' | 'shower' | 'bathtub'
  | 'shoeCabinet' | 'bench' | 'washingMachine' | 'dryer' | 'dryingRack'
  | 'teaTable' | 'displayCabinet' | 'island' | 'curtain' | 'console';

export interface Furniture {
  id: string;
  type: FurnitureType;
  roomId: string;
  rect: [number, number, number, number]; // x, y, width, height, plan Y up
  rotation: number;
  height: number;
  hostWallId?: string;
}

export interface Project {
  id: string;
  name: string;
  units: 'mm';
  width: number;
  height: number;
  ceilingHeight: number;
  rooms: Room[];
  walls: Wall[];
  openings: Opening[];
  furniture: Furniture[];
  devices: PlacedDevice[];
  wholeHouseDevices: PlacedDevice[];
  ruleVersion: string;
  engineVersion: string;
  seed: string;
}

export interface HeightSpec {
  base: MountBase;
  offset: number;
  min?: number;
  max?: number;
}

export type QuantityKind =
  | 'fixed' | 'perArea' | 'perLength' | 'perOpening' | 'perFurniture'
  | 'stripPerimeter' | 'cabinetLength' | 'measuredLength' | 'wholeHouseArea' | 'generic';

export interface QuantitySpec {
  kind: QuantityKind;
  value?: number;
  min?: number;
  max?: number;
  even?: boolean;
  round?: 'ceil' | 'floor' | 'round';
  target?: 'window' | 'door';
  measure?: 'perimeter' | 'window' | 'cabinet' | 'path' | 'wall' | 'track' | 'room';
  furnitureTypes?: FurnitureType[];
  factor?: number;
  raw: string;
}

export type AnchorKind =
  | 'roomCenter' | 'inscribedRectCenter' | 'inscribedGrid' | 'longAxisLine'
  | 'wallOffset' | 'wallEvenDivide' | 'doorSideWall' | 'furnitureCenter'
  | 'furniturePair' | 'furnitureEdge' | 'windowHead' | 'pathLine'
  | 'hostTrack' | 'cabinetShelf' | 'perimeter' | 'wholeHouse';

export interface AnchorSpec {
  kind: AnchorKind;
  rows?: number;
  rowGap?: number;
  colGap?: number;
  offset?: number;
  target?: string;
  furnitureTypes?: FurnitureType[];
  wall?: 'exterior' | 'interior' | 'any';
  raw: string;
}

export interface PointRule {
  pointCode: string;
  spaceCode: SpaceCode;
  spaceName: string;
  deviceType2: string;
  deviceCanonical?: string;
  usage: string;
  mount: MountBase;
  height: HeightSpec;
  anchor: AnchorSpec;
  quantity: QuantitySpec;
  spacing: number;
  priority: Priority;
  collision: string[];
  fallback: string[];
  sourceText: string;
  traceFlags: string[];
}

export interface CrossRuleTemplate extends Omit<PointRule, 'spaceCode' | 'spaceName'> {
  deviceKey: string;
}

export interface DeviceTrace {
  anchor: AnchorKind;
  candidateRank: number;
  fallbackStep: number;
  confidence: number;
  notes: string[];
  warnings: string[];
  /** 待处理设备的规则诊断：哪条要求不满足、检查到了什么、建议怎么处理。 */
  pending?: PendingDiagnostic;
}

export interface PendingDiagnostic {
  reasonCode: string;
  requirement: string;
  found: string;
  unmet: string;
  suggestion: string;
  required: number;
  available: number;
}

export interface LightingMeta {
  layer: 'base' | 'task' | 'accent';
  group: string;
  groupLabel: string;
  cct: number;
  beam: number;
  watt: number;
  specStatus: 'intent';
  productId: string;
  /** 模拟产品型号，仅用于 Demo 展示，不是真实选品。 */
  productName?: string;
  productStatus: 'spec_intent' | 'selected_for_demo' | 'selected';
  productSource: 'simulated' | 'intent' | 'datasheet';
  hasPhotometry: boolean;
  photometryStatus: 'synthetic' | 'missing' | 'verified' | 'not_applicable';
  iesFile?: string | null;
  ldtFile?: string | null;
  lumen: number | null;
  ugr: number | null;
  cri?: number | null;
  efficacy?: number | null;
  protocols: string[];
  protocolStatus: 'simulated' | 'missing' | 'verified' | 'not_applicable';
  circuitId: string | null;
  circuitSource: 'simulated' | 'missing' | 'verified';
  dimmingProtocol: string | null;
  gatewayId?: string | null;
  daliUniverse?: number | null;
  daliAddress?: number | null;
  sceneIds?: string[];
}

export interface PlacedDevice {
  id: string;
  ruleCode: string;
  deviceKey: string;
  deviceType2: string;
  category1: DeviceCategory1;
  roomId: string;
  roomName: string;
  position: { x: number; y: number; z: number };
  rotation: number;
  mount: MountBase;
  priority: Priority;
  visual: DeviceVisual;
  glow: GlowShape;
  size: { width: number; depth: number };
  /**
   * placed: 已按规则落位
   * fallback: 仍落位，但使用了降级策略
   * pending: 设备与数量保留，但当前缺少合法候选点/载体，等待人工处理
   * adjusted: 规则落位后由人工移动/旋转，保留规则归因
   * manual: 尚未执行一键布点
   */
  status: 'placed' | 'fallback' | 'pending' | 'adjusted' | 'manual';
  source: 'rule' | 'manual' | 'wholeHouse';
  locked: boolean;
  trace: DeviceTrace;
  /** 报价行/组信息，Demo 中用于数量对账与业务解释。 */
  quote?: {
    lineId?: string;
    inputQuantity?: number;
    /** 按模块计价的设备（磁吸轨道）单独记录模块数，输入数量 = 模块数，不按实体条数。 */
    moduleQuantity?: number;
    unit?: '件' | '组' | 'm';
    groupId?: string;
    placementForm?: string;
  };
  /** 实际安装关系，避免只保存一个孤立坐标。 */
  binding?: {
    kind: 'room' | 'wall' | 'window' | 'furniture' | 'track' | 'path' | 'pending';
    id?: string;
    name?: string;
    distance?: number;
  };
  /** 照明意图：基础/任务/重点 + 控制组 + 色温/光束/功率意向。 */
  lighting?: LightingMeta;
}

export interface UnplacedRule {
  ruleCode: string;
  roomId: string;
  roomName: string;
  deviceType2: string;
  reasonCode: string;
  reason: string;
  traceFlags: string[];
  requestedCount?: number;
  pendingCount?: number;
}

export interface RuleExecution {
  ruleCode: string;
  roomId: string;
  roomName: string;
  deviceType2: string;
  status: 'executed' | 'executed_with_fallback' | 'skipped';
  placedCount: number;
  requestedCount?: number;
  pendingCount?: number;
  reasonCode?: string;
  reason?: string;
  traceFlags: string[];
}

export interface LayoutResult {
  devices: PlacedDevice[];
  wholeHouseDevices: PlacedDevice[];
  unplaced: UnplacedRule[];
  executions: RuleExecution[];
  diagnostics: string[];
  ruleVersion: string;
  engineVersion: string;
  seed: string;
}

export interface DemoDefaults {
  ruleVersion: string;
  engineVersion: string;
  downlight: { rows: number; rowGap: number; colGap: number; wallClearance: number };
  spotlight: { min: number; noTargetFallback: boolean };
  modes: Record<SpaceCode, SchemeMode>;
  maxDevicesPerRule: number;
  defaultCeilingHeight: number;
}

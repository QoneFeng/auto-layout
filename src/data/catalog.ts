import type { DeviceCategory1, DeviceDef, DeviceVisual, GlowShape, MountBase, SpaceCode, SpaceDef } from '../types';

export const SPACES: SpaceDef[] = [
  { code: 'KT', name: '客厅', defaultMode: 'MIXED', zones: ['沙发区', '茶几区', '电视墙', '通行区', '端景'] },
  { code: 'CT', name: '餐厅', defaultMode: 'MAIN', zones: ['餐桌区', '餐边柜区', '通行区'] },
  { code: 'ZW', name: '主卧', defaultMode: 'MIXED', zones: ['床区', '床头两侧', '衣柜区', '梳妆/飘窗区', '通行区'] },
  { code: 'SF', name: '书房', defaultMode: 'MIXED', zones: ['书桌区', '书柜区', '座椅活动区'] },
  { code: 'WS', name: '卧室', defaultMode: 'MAIN', zones: ['床区', '床头两侧', '衣柜区', '通行区'] },
  { code: 'LRF', name: '老人房', defaultMode: 'MAIN', zones: ['床区', '床头两侧', '起夜路径', '通行区'] },
  { code: 'XHF', name: '儿童房', defaultMode: 'MAIN', zones: ['床区', '学习桌区', '玩耍区', '衣柜区'] },
  { code: 'XCW', name: '玄关', defaultMode: 'NO_MAIN', zones: ['入户门内侧', '换鞋区', '鞋柜区', '端景区'] },
  { code: 'CF', name: '厨房', defaultMode: 'NO_MAIN', zones: ['操作台', '吊柜下', '岛台/吧台', '冰箱位'] },
  { code: 'WSJ', name: '卫生间', defaultMode: 'NO_MAIN', zones: ['马桶', '浴室柜/镜前', '淋浴房/浴缸'] },
  { code: 'GDYT', name: '过道', defaultMode: 'NO_MAIN', zones: ['通行带', '门洞序列', '端景'] },
  { code: 'YT', name: '阳台', defaultMode: 'NO_MAIN', zones: ['晾晒区', '休闲区', '洗衣机柜'] },
  { code: 'YMJ', name: '衣帽间', defaultMode: 'NO_MAIN', zones: ['柜体区', '换衣/中岛区', '镜前'] },
  { code: 'WSWSJ', name: '卧室卫生间', defaultMode: 'NO_MAIN', zones: ['马桶', '浴室柜/镜前', '淋浴/浴缸', '梳妆位'] },
  { code: 'CS', name: '茶室', defaultMode: 'MAIN', zones: ['茶台区', '坐席区', '展示/博古架'] },
];

export const SPACE_BY_CODE = Object.fromEntries(SPACES.map(s => [s.code, s])) as Record<SpaceCode, SpaceDef>;

type RawDevice = [DeviceCategory1, string, boolean?];

const RAW_DEVICES: RawDevice[] = [
  ['灯光', '筒灯'], ['灯光', '射灯'], ['灯光', '吸顶灯'], ['灯光', '吊灯'], ['灯光', '面板灯'],
  ['灯光', '格栅灯'], ['灯光', '壁灯'], ['灯光', '落地灯'], ['灯光', '台灯', true],
  ['灯光', '直线灯带'], ['灯光', '贴墙灯带'], ['灯光', 'L 型灯带'], ['灯光', 'U 型灯带'],
  ['灯光', '口字灯带'], ['灯光', '射灯一字组'], ['灯光', '筒灯一字组'], ['灯光', '筒灯口字组'],
  ['灯光', '轨道射灯 · 灯头'], ['灯光', '轨道射灯 · 轨道'], ['灯光', '磁吸泛光灯 · 灯体'],
  ['灯光', '磁吸泛光灯 · 磁吸轨道'], ['灯光', '磁吸格栅灯 · 灯体'], ['灯光', '磁吸格栅灯 · 磁吸轨道'],
  ['灯光', '灯槽灯带'], ['灯光', '窗帘灯带'], ['灯光', '柜体灯带'],
  ['控制', '开关面板'], ['控制', '情景面板'], ['控制', '无线开关'], ['控制', '调光旋钮'], ['控制', '中控屏'],
  ['环境', '人体传感器'], ['环境', '人在传感器'], ['环境', '温湿度传感器'], ['环境', '光照传感器'],
  ['安防监控', '摄像头'], ['安防监控', '智能门锁'],
  ['网络', '蓝牙 Mesh 网关'], ['网络', 'Mesh 路由器'], ['网络', '顶装 AP'], ['网络', '弱电箱 · 箱体'],
  ['网络', '弱电箱 · PoE 路由'], ['网络', '弱电箱 · Mesh 主路由'], ['网络', '弱电箱 · PoE 交换机'],
  ['网络', '弱电箱 · 交换机'], ['网络', '交换机'], ['网络', '网口面板'], ['网络', '面板 AP'],
  ['音乐', '智能音箱'], ['音乐', '吸顶喇叭'],
  ['遮阳', '窗帘电机'], ['遮阳', '窗帘电机 · 电动轨道'], ['遮阳', '卷帘电机'],
  ['暖通', '挂式空调'], ['暖通', '柜式空调'],
];

function iconFor(cat: DeviceCategory1, name: string): string {
  if (name === '筒灯') return 'downlight';
  if (name === '射灯') return 'spotlight';
  if (name === '吸顶灯') return 'ceiling';
  if (name === '吊灯') return 'pendant';
  if (name === '面板灯') return 'panel';
  if (name === '格栅灯') return 'grille';
  if (name === '壁灯') return 'wallLamp';
  if (name === '落地灯') return 'floorLamp';
  if (name === '台灯') return 'tableLamp';
  if (name.includes('L 型')) return 'stripL';
  if (name.includes('U 型')) return 'stripU';
  if (name.includes('口字')) return 'stripSquare';
  if (name.includes('轨道')) return name.includes('灯头') ? 'trackHead' : 'track';
  if (name.includes('磁吸') && name.includes('灯体')) return 'magneticBody';
  if (name.includes('灯带')) return 'strip';
  if (name.includes('一字组')) return 'array';
  if (name === '开关面板') return 'switch';
  if (name === '情景面板') return 'scenePanel';
  if (name === '无线开关') return 'wirelessSwitch';
  if (name === '调光旋钮') return 'knob';
  if (name === '中控屏') return 'screen';
  if (name === '人体传感器') return 'pir';
  if (name === '人在传感器') return 'presence';
  if (name === '温湿度传感器') return 'temp';
  if (name === '光照传感器') return 'lux';
  if (name === '摄像头') return 'camera';
  if (name === '智能门锁') return 'lock';
  if (name.includes('弱电箱')) return name.includes('PoE') ? 'poeBox' : 'weakBox';
  if (name.includes('交换机')) return 'switchBox';
  if (name.includes('AP')) return 'ap';
  if (name.includes('路由器')) return 'router';
  if (name.includes('网关')) return 'gateway';
  if (name.includes('网口')) return 'ethernet';
  if (name === '智能音箱') return 'speaker';
  if (name === '吸顶喇叭') return 'ceilingSpeaker';
  if (name.includes('卷帘')) return 'roller';
  if (name.includes('窗帘')) return 'curtain';
  if (name.includes('空调')) return name.includes('柜式') ? 'acFloor' : 'acWall';
  return cat === '灯光' ? 'downlight' : 'generic';
}

function glowFor(cat: DeviceCategory1, name: string): GlowShape {
  if (cat !== '灯光') return 'none';
  if (name.includes('灯带') || name.includes('轨道')) return 'line';
  if (name.includes('面板灯') || name.includes('格栅灯') || name.includes('口字')) return 'area';
  if (name.includes('射灯') && !name.includes('一字组')) return 'fan';
  if (name === '壁灯') return 'point';
  return 'point';
}

function visualFor(cat: DeviceCategory1, name: string): DeviceVisual {
  if (name.includes('口字灯带')) return 'rect';
  if (name.includes('L 型灯带')) return 'l';
  if (name.includes('U 型灯带')) return 'u';
  if (name.includes('灯带') || name.includes('灯槽')) return 'line';
  if (name.includes('轨道')) return 'track';
  if (name.includes('一字组')) return 'array';
  if (name.includes('口字组')) return 'pointRect';
  if (cat === '灯光') return 'point';
  return 'none';
}

function mountFor(cat: DeviceCategory1, name: string): MountBase {
  if (name.includes('窗帘') || name.includes('卷帘')) return 'WL';
  if (name.includes('柜体') || name.includes('灯槽')) return 'BL';
  if (name === '落地灯' || name === '柜式空调' || name === '智能音箱') return 'FL';
  if (name === '台灯') return 'BL';
  if (cat === '灯光') return 'CL';
  if (name === '智能门锁') return 'SL';
  if (name === '网口面板' || name === '面板 AP') return 'SL';
  if (name === '挂式空调') return 'SL';
  if (name === '弱电箱 · 箱体') return 'SL';
  if (cat === '环境' || cat === '安防监控' || cat === '控制') return 'SL';
  return 'CL';
}

function sizeFor(name: string): { width: number; depth: number } {
  if (name.includes('口字灯带')) return { width: 1600, depth: 1200 };
  if (name.includes('L 型灯带') || name.includes('U 型灯带')) return { width: 1400, depth: 900 };
  if (name.includes('一字组')) return { width: 1200, depth: 120 };
  if (name.includes('口字组')) return { width: 1000, depth: 1000 };
  if (name.includes('灯带') || name.includes('轨道')) return { width: 1200, depth: 60 };
  if (name === '面板灯') return { width: 600, depth: 600 };
  if (name === '格栅灯') return { width: 240, depth: 120 };
  if (name === '吸顶灯') return { width: 500, depth: 500 };
  if (name === '吊灯') return { width: 500, depth: 500 };
  if (name === '筒灯') return { width: 90, depth: 90 };
  if (name === '射灯') return { width: 75, depth: 75 };
  if (name === '壁灯') return { width: 260, depth: 160 };
  if (name === '落地灯') return { width: 400, depth: 400 };
  if (name === '台灯') return { width: 280, depth: 280 };
  if (name === '开关面板' || name === '情景面板') return { width: 86, depth: 86 };
  if (name === '中控屏') return { width: 220, depth: 120 };
  if (name === '摄像头') return { width: 120, depth: 120 };
  if (name === '智能门锁') return { width: 80, depth: 160 };
  if (name === '窗帘电机') return { width: 120, depth: 120 };
  if (name === '挂式空调') return { width: 900, depth: 250 };
  if (name === '柜式空调') return { width: 500, depth: 500 };
  return { width: 180, depth: 180 };
}

function roleFor(cat: DeviceCategory1, name: string): string {
  if (cat === '灯光') {
    if (name.includes('灯带') || name.includes('灯槽')) return '氛围照明';
    if (name.includes('射灯') || name.includes('轨道') || name.includes('磁吸')) return '重点照明';
    return '基础照明';
  }
  if (cat === '控制') return '交互控制';
  if (cat === '环境') return '环境感知';
  if (cat === '安防监控') return '安防';
  if (cat === '网络') return '网络基础设施';
  if (cat === '音乐') return '背景音乐';
  if (cat === '遮阳') return '遮阳';
  return '暖通';
}

function familyMetaFor(category2: string, mount: MountBase): Pick<DeviceDef, 'productFamily' | 'mountSurface' | 'layoutForm' | 'routeShape' | 'application' | 'salesUnit'> {
  const surface = mount === 'CL' ? 'ceiling' : mount === 'WL' ? 'curtain_box' : mount === 'FL' ? 'floor' : mount === 'BL' ? 'cabinet' : 'wall';
  if (category2 === '直线灯带') return { productFamily: '灯带', mountSurface: surface, routeShape: 'straight', application: 'general', salesUnit: 'meter' };
  if (category2 === '贴墙灯带') return { productFamily: '灯带', mountSurface: 'wall', routeShape: 'straight', application: 'wash_wall', salesUnit: 'meter' };
  if (category2 === 'L 型灯带') return { productFamily: '灯带', mountSurface: surface, routeShape: 'L', application: 'general', salesUnit: 'meter' };
  if (category2 === 'U 型灯带') return { productFamily: '灯带', mountSurface: surface, routeShape: 'U', application: 'general', salesUnit: 'meter' };
  if (category2 === '口字灯带') return { productFamily: '灯带', mountSurface: surface, routeShape: 'rectangle', application: 'general', salesUnit: 'meter' };
  if (category2 === '射灯一字组') return { productFamily: '射灯', mountSurface: surface, layoutForm: 'line', salesUnit: 'group' };
  if (category2 === '筒灯一字组') return { productFamily: '筒灯', mountSurface: surface, layoutForm: 'line', salesUnit: 'group' };
  if (category2 === '筒灯口字组') return { productFamily: '筒灯', mountSurface: surface, layoutForm: 'rectangle', salesUnit: 'group' };
  if (category2 === '灯槽灯带') return { productFamily: '灯槽灯带', mountSurface: 'cove', routeShape: 'free', application: 'cove', salesUnit: 'meter' };
  if (category2 === '窗帘灯带') return { productFamily: '窗帘灯带', mountSurface: 'curtain_box', routeShape: 'straight', application: 'curtain_box', salesUnit: 'meter' };
  if (category2 === '柜体灯带') return { productFamily: '柜体灯带', mountSurface: 'cabinet', routeShape: 'free', application: 'cabinet', salesUnit: 'meter' };
  if (category2.includes('窗帘电机')) return { productFamily: category2, mountSurface: 'curtain_box', layoutForm: 'single', salesUnit: category2.includes('轨道') ? 'meter' : 'piece' };
  if (category2.includes('轨道')) return { productFamily: category2, mountSurface: 'track', layoutForm: 'single', salesUnit: 'meter' };
  return { productFamily: category2, mountSurface: surface, layoutForm: 'single', salesUnit: 'piece' };
}

export const DEVICES: DeviceDef[] = RAW_DEVICES.map(([category1, category2, demoExtension]) => {
  const mount = mountFor(category1, category2);
  return {
  key: category2,
  category1,
  category2,
  legacyType2: category2,
  ...familyMetaFor(category2, mount),
  aliases: [category2],
  icon: iconFor(category1, category2),
  visual: visualFor(category1, category2),
  glow: glowFor(category1, category2),
  mount,
  size: sizeFor(category2),
  role: roleFor(category1, category2),
  demoExtension,
};
});

export const DEVICE_BY_KEY = Object.fromEntries(DEVICES.map(d => [d.key, d])) as Record<string, DeviceDef>;

export const CATEGORY_ORDER: DeviceCategory1[] = ['灯光', '控制', '环境', '安防监控', '网络', '音乐', '遮阳', '暖通'];

export const DEVICES_BY_CATEGORY = CATEGORY_ORDER.map(cat => ({
  category: cat,
  devices: DEVICES.filter(d => d.category1 === cat),
}));

/** 全屋级设备：不进入单空间点位规则，统一走全屋基础包。 */
export const WHOLE_HOUSE_DEVICE_KEYS = new Set([
  '弱电箱 · 箱体',
  '弱电箱 · PoE 路由',
  '弱电箱 · Mesh 主路由',
  '弱电箱 · PoE 交换机',
  '弱电箱 · 交换机',
  '交换机',
  '蓝牙 Mesh 网关',
  'Mesh 路由器',
  '顶装 AP',
  '面板 AP',
]);

export function findDevice(name: string): DeviceDef | undefined {
  return DEVICES.find(d => d.category2 === name || d.aliases.includes(name));
}

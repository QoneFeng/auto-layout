import type {
  AnchorSpec, CrossRuleTemplate, DeviceCategory1, DeviceDef, HeightSpec, Priority, QuantitySpec,
} from '../types';
import { DEVICES } from './catalog';

const CAT_CODE: Record<DeviceCategory1, string> = {
  灯光: 'LT',
  控制: 'CT',
  环境: 'EN',
  安防监控: 'SC',
  网络: 'NW',
  音乐: 'MU',
  遮阳: 'SH',
  暖通: 'HV',
};

function anchorFor(def: DeviceDef): AnchorSpec {
  const n = def.category2;
  if (def.category1 === '控制') {
    return { kind: 'doorSideWall', offset: 175, raw: '门内侧、开门侧墙面，距门套 150~200' };
  }
  if (def.category1 === '遮阳') {
    return { kind: 'windowHead', raw: '窗帘盒内 / 窗顶' };
  }
  if (def.category1 === '暖通') {
    return { kind: 'wallOffset', offset: 350, raw: '沿墙退距 350，避开人员活动区' };
  }
  if (def.category1 === '音乐') {
    return n.includes('吸顶')
      ? { kind: 'roomCenter', raw: '空间中心，避开主灯' }
      : { kind: 'furnitureCenter', furnitureTypes: ['sofa', 'teaTable', 'diningTable'], raw: '主要停留点附近' };
  }
  if (def.category1 === '网络') {
    if (['顶装 AP', 'Mesh 路由器', '面板 AP'].includes(n)) {
      return { kind: 'inscribedRectCenter', raw: '空间几何中心 / 高处，覆盖优先' };
    }
    return { kind: 'wallOffset', offset: n.includes('弱电箱') ? 300 : 200, raw: '玄关/过道弱电箱或墙面网口位' };
  }
  if (def.category1 === '安防监控') {
    return n.includes('门锁')
      ? { kind: 'doorSideWall', offset: 120, raw: '入户门内侧' }
      : { kind: 'wallOffset', offset: 200, raw: '墙角高处，覆盖入口' };
  }
  if (def.category1 === '环境') {
    if (n.includes('人体') || n.includes('人在')) return { kind: 'roomCenter', raw: '主要停留区 / 入口上方' };
    return { kind: 'wallOffset', offset: 1500, raw: '远离热源、窗、灶台、淋浴' };
  }

  // 灯光族
  if (n.includes('灯槽') || n.includes('贴墙') || n.includes('直线灯带')) {
    return { kind: 'perimeter', offset: 120, raw: '沿房间周圈 / 背景墙' };
  }
  if (n.includes('柜体')) {
    return {
      kind: 'cabinetShelf',
      furnitureTypes: ['wardrobe', 'upperCabinet', 'bookshelf', 'displayCabinet', 'shoeCabinet'],
      raw: '柜内层板前沿 / 吊柜底面',
    };
  }
  if (n.includes('窗帘')) {
    return { kind: 'windowHead', raw: '窗帘盒内沿' };
  }
  if (n.includes('轨道') || n.includes('磁吸')) {
    return { kind: 'furnitureEdge', furnitureTypes: ['tvCabinet', 'sofa'], raw: '电视墙 / 沙发长轴平行轴' };
  }
  if (n.includes('L 型') || n.includes('U 型') || n.includes('口字') || n.includes('一字组')) {
    return { kind: 'roomCenter', raw: '组合灯形整体中心' };
  }
  if (['吸顶灯', '吊灯', '面板灯', '格栅灯'].includes(n)) {
    return { kind: 'inscribedRectCenter', raw: '空间几何中心' };
  }
  if (n === '筒灯') {
    return { kind: 'inscribedGrid', rows: 2, rowGap: 500, colGap: 800, raw: '内接矩形双列网格' };
  }
  if (n === '射灯') {
    return { kind: 'wallOffset', offset: 300, raw: '沿墙 / 目标上方' };
  }
  if (n === '壁灯') {
    return { kind: 'furnitureEdge', furnitureTypes: ['bed', 'nightstand'], raw: '床头背景墙两侧' };
  }
  if (n === '台灯' || n === '落地灯') {
    return { kind: 'furnitureCenter', furnitureTypes: ['nightstand', 'desk', 'sofa'], raw: '床头柜 / 书桌 / 沙发侧' };
  }
  return { kind: 'roomCenter', raw: '房间中心' };
}

function quantityFor(def: DeviceDef): QuantitySpec {
  const n = def.category2;
  if (def.category1 === '遮阳') {
    return { kind: 'perOpening', value: 1, target: 'window', raw: 'PER_OPENING: 1/窗' };
  }
  if (def.glow === 'line' || n.includes('灯带') || n.includes('轨道') || n.includes('磁吸')) {
    const measure = n.includes('柜体') ? 'cabinet'
      : n.includes('窗帘') ? 'window'
      : n.includes('轨道') || n.includes('磁吸') ? 'track'
      : 'perimeter';
    return { kind: 'measuredLength', measure, value: measure === 'track' ? 1 : undefined, raw: 'PER_MEASURED_LENGTH: 布置后实测' };
  }
  return { kind: 'fixed', value: 1, raw: 'FIXED(1)' };
}

function heightFor(def: DeviceDef): HeightSpec {
  const n = def.category2;
  if (def.category1 === '控制') return { base: 'SL', offset: 1300 };
  if (def.category1 === '遮阳') return { base: 'WL', offset: 0 };
  if (def.category1 === '暖通') return { base: 'SL', offset: 2200 };
  if (def.category1 === '安防监控') return n.includes('门锁') ? { base: 'SL', offset: 1200 } : { base: 'SL', offset: 2200 };
  if (def.category1 === '环境') {
    return n.includes('人体') || n.includes('人在') ? { base: 'CL', offset: 0 } : { base: 'SL', offset: 1300 };
  }
  if (def.category1 === '音乐') return n.includes('吸顶') ? { base: 'CL', offset: 0 } : { base: 'SL', offset: 800 };
  if (def.category1 === '网络') {
    return n.includes('AP') || n.includes('Mesh') ? { base: 'CL', offset: 0 } : { base: 'SL', offset: 300 };
  }
  if (def.mount === 'CL') return { base: 'CL', offset: 0 };
  if (def.mount === 'BL') return { base: 'BL', offset: 100 };
  if (def.mount === 'FL') return { base: 'FL', offset: 0 };
  if (def.mount === 'WL') return { base: 'WL', offset: 0 };
  return { base: 'SL', offset: 1300 };
}

function priorityFor(def: DeviceDef): Priority {
  if (def.category1 === '控制') return 'P1';
  if (def.category2 === '射灯' || def.category2 === '壁灯') return 'P1';
  if (def.category1 === '环境' || def.category1 === '音乐') return 'P3';
  if (def.category1 === '灯光' && (def.glow === 'line' || def.category2.includes('灯带'))) return 'P3';
  return 'P2';
}

/**
 * 跨空间通用规则：当 183 条空间规则没有覆盖某个设备分类时使用。
 * 每个设备分类都有且只有一条，保证手动拖入的设备也能显示“命中规则”。
 */
export const CROSS_RULE_TEMPLATES: CrossRuleTemplate[] = DEVICES.map(def => {
  const index = DEVICES.filter(d => d.category1 === def.category1).indexOf(def) + 1;
  const height = heightFor(def);
  return {
    pointCode: `GEN-${CAT_CODE[def.category1]}-${String(index).padStart(2, '0')}`,
    deviceKey: def.key,
    deviceType2: def.category2,
    deviceCanonical: def.key,
    usage: def.role || '跨空间通用布点',
    mount: height.base,
    height,
    anchor: anchorFor(def),
    quantity: quantityFor(def),
    spacing: def.category1 === '控制' ? 100 : def.category1 === '环境' ? 0 : 300,
    priority: priorityFor(def),
    collision: ['DOOR_SWING', 'WINDOW'],
    fallback: ['REDUCE', 'REMOVE'],
    sourceText: '跨空间通用规则（按设备类型）',
    traceFlags: ['CROSS_SPACE_RULE'],
  };
});

export const CROSS_RULE_BY_CODE = new Map(CROSS_RULE_TEMPLATES.map(r => [r.pointCode, r]));

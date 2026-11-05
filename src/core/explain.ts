import type {
  AnchorKind, LayoutResult, MountBase, PlacedDevice, PointRule, Priority, Project,
} from '../types';
import { allRules, crossRuleForCode, rulesForDevice } from './engine';
import { SPACE_BY_CODE } from '../data/catalog';

export const ANCHOR_LABELS: Record<AnchorKind, string> = {
  roomCenter: '房间中心',
  inscribedRectCenter: '最大内接矩形中心',
  inscribedGrid: '内接矩形网格阵列',
  longAxisLine: '房间长轴中线',
  wallOffset: '沿墙退距',
  wallEvenDivide: '墙面等分',
  doorSideWall: '门侧墙面',
  furnitureCenter: '家具中心',
  furniturePair: '家具成对（床头柜）',
  furnitureEdge: '家具边缘',
  windowHead: '窗洞 / 窗顶',
  pathLine: '通行路径',
  hostTrack: '宿主轨道',
  cabinetShelf: '柜内层板 / 柜体',
  perimeter: '房间周圈',
  wholeHouse: '全屋级',
};

export const MOUNT_LABELS: Record<MountBase, string> = {
  FL: '完成地面 FL',
  CL: '吊顶完成面 CL',
  SL: '墙面完成面 SL',
  WL: '窗顶 WL',
  BL: '柜底 / 台面 BL',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  P0: '安全与不可布',
  P1: '功能重点位',
  P2: '基础照明 / 基础交互',
  P3: '氛围与增强',
  P4: '装饰补位',
};

export const NOTE_LABELS: Record<string, string> = {
  MANUAL_PLACEMENT: '手动放置，尚未布点',
  EXISTING_DEVICE_PLACEMENT: '现有设备布点',
  NO_AVAILABLE_CANDIDATE: '无可用候选点，已兜底',
  DEMO_COMBINATION: 'Demo 组合灯效',
  CHILD_TRACK: '联动生成电动轨道',
  SHARED_TRACK: '共享磁吸轨道',
  NO_FURNITURE: '未找到家具，已降级',
  NO_TARGET: '未找到目标洞口 / 家具',
  SPACING_CONFLICT: '与已布设备间距不足',
  FALLBACK_ROOM_CENTER: '候选点冲突，降级到房间中心',
  BED_SIDE_FALLBACK: '按床两侧推算',
  HOST_TRACK_FALLBACK: '宿主轨道降级',
  GENERIC_COUNT: '数量取 Demo 默认值',
  GENERIC_ANCHOR: '锚点取 Demo 默认值',
  DEMO_DEFAULT: '参数为 Demo 默认值',
  OPTIONAL_OR_RANGE: '原文为可选 / 区间',
  CABINET_LENGTH: '按柜体长度计算',
  PERIMETER: '按房间周圈布点',
  LINE_CLIPPED: '灯带 / 轨道按房间边界收口',
  MEASURED_AFTER_LAYOUT: '长度按布置后路径实测',
  DYNAMIC_SIZE: '按空间面积动态调整灯组尺寸',
};

export const REASON_LABELS: Record<string, string> = {
  NO_CEILING: '无吊顶',
  NO_WALL: '无可用户墙面',
  NO_TARGET: '无目标洞口 / 家具',
  NO_FURNITURE: '空间内没有目标家具',
  SPACE_TOO_SMALL: '空间尺寸不足',
  CONFLICT_P0: '候选点落在 P0 禁布区',
  CAPACITY_EXCEEDED: '超出单规则设备上限',
  PRODUCT_MISSING: '设备目录缺少该分类',
  MODE_EXCLUDED: '当前方案模式不执行该规则',
  FALLBACK_ROOM_CENTER: '候选点均冲突，降级到房间中心',
  SPACING_CONFLICT: '与已布设备间距不足',
  DOOR_SWING: '落在门扇开启区',
  WINDOW: '落在窗洞避让区',
  WET_ZONE: '落在湿区',
  STOVE: '落在灶台避让区',
  TV_SCREEN: '落在电视屏幕避让区',
  NO_AVAILABLE_CANDIDATE: '没有可用候选点',
};

const GENERIC_ANCHOR_REASON: Array<{ test: (device: PlacedDevice) => boolean; text: string }> = [
  { test: d => ['rect', 'l', 'u', 'array', 'pointRect'].includes(d.visual), text: '组合灯形保持整体轮廓，取房间中心作为整体定位点' },
  { test: d => d.visual === 'track', text: '轨道类沿房间长轴展开，保证灯头有连续安装面' },
  { test: d => d.category1 === '控制', text: '控制面板属于入口交互，取门侧墙面' },
  { test: d => d.category1 === '遮阳', text: '遮阳设备必须贴窗，取窗洞内侧' },
  { test: d => d.category1 === '暖通', text: '暖通设备沿墙退距 350mm，避开人员活动区' },
  { test: d => d.category1 === '音乐', text: '音乐设备靠近沙发 / 茶几 / 餐桌等主要停留点' },
  { test: d => d.glow === 'line' && d.deviceType2.includes('柜体'), text: '柜体灯带沿柜体边缘布置' },
  { test: d => d.glow === 'line' && (d.deviceType2.includes('灯槽') || d.deviceType2.includes('贴墙')), text: '灯槽 / 贴墙灯带沿房间周圈布置' },
  { test: d => d.glow === 'line' && d.deviceType2.includes('窗帘'), text: '窗帘灯带沿窗洞布置' },
  { test: d => d.glow === 'line', text: '线型设备沿房间长轴布置' },
  { test: () => true, text: '其余设备沿墙退距 250mm，优先占用可用墙面' },
];

export interface ExplanationRow {
  label: string;
  value: string;
}

export interface DeviceExplanation {
  kind: 'rule' | 'generic' | 'manual' | 'demo' | 'wholeHouse';
  kindLabel: string;
  code: string;
  title: string;
  subtitle: string;
  rows: ExplanationRow[];
  why: string[];
  warnings: string[];
  rule: PointRule | null;
  candidateRules: PointRule[];
  executionReason?: string;
}

function noteText(note: string): string {
  if (note.startsWith('RULE:')) return `命中规则 ${note.slice(5)}`;
  return NOTE_LABELS[note] ?? note;
}

export function explainNotes(notes: string[]): string[] {
  return notes.map(noteText);
}

function reasonText(reason?: string): string {
  if (!reason) return '';
  return reason
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(code => (REASON_LABELS[code] ? `${REASON_LABELS[code]}（${code}）` : code))
    .join(' → ');
}

function spaceName(device: PlacedDevice, project: Project): string {
  if (device.roomId === '__whole') return device.roomName;
  const room = project.rooms.find(r => r.id === device.roomId);
  if (!room) return device.roomName;
  const typeName = SPACE_BY_CODE[room.spaceCode].name;
  return room.name === typeName ? room.name : `${room.name}（${typeName}）`;
}

function countSameRule(device: PlacedDevice, project: Project): number {
  if (['MANUAL', 'DEMO-COMBO', 'EXISTING-GENERIC', 'WHOLE-HOUSE', 'EXISTING'].includes(device.ruleCode)) {
    return project.devices.filter(d => d.deviceKey === device.deviceKey && d.roomId === device.roomId).length;
  }
  return project.devices.filter(d =>
    d.ruleCode === device.ruleCode
    && d.roomId === device.roomId
    && !d.trace.notes.includes('CHILD_TRACK')
    && !d.trace.notes.includes('SHARED_TRACK'),
  ).length;
}

function quantityText(
  rule: PointRule,
  device: PlacedDevice,
  project: Project,
  execution?: { placedCount: number } | null,
): string {
  const total = countSameRule(device, project);
  const placed = execution?.placedCount ?? total;
  const derived = project.devices.filter(d =>
    d.ruleCode === device.ruleCode
    && d.roomId === device.roomId
    && (d.trace.notes.includes('CHILD_TRACK') || d.trace.notes.includes('SHARED_TRACK')),
  ).length;
  const derivedText = derived ? `，另含 ${derived} 条衍生轨道` : '';
  const widthLabel = rule.quantity.kind === 'measuredLength' ? '实测' : '示意';
  const width = device.size.width > 200 ? `，当前${widthLabel}长度 ${Math.round(device.size.width)}mm` : '';
  return `本规则落位 ${placed} 台${derivedText}${width}`;
}

function anchorText(rule: PointRule, device: PlacedDevice): string {
  const kind = ANCHOR_LABELS[rule.anchor.kind] ?? rule.anchor.kind;
  const label = rule.anchor.raw || kind;
  const raw = rule.anchor.raw && rule.anchor.raw !== rule.anchor.kind ? `（结构锚点：${kind}）` : '';
  const actual = device.trace.anchor !== rule.anchor.kind
    ? `，实际落点为 ${ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor}`
    : '';
  return `${label}${raw}${actual}`;
}

/**
 * 生成一台设备的「命中规则 + 为什么这样布置」解释。
 * 数据来自 183 条规则、该设备 trace 和本次 layout 执行结果。
 */
export function explainDevice(
  device: PlacedDevice,
  project: Project,
  layout: LayoutResult | null,
): DeviceExplanation {
  const room = project.rooms.find(r => r.id === device.roomId);
  const rule = allRules().find(r => r.pointCode === device.ruleCode)
    ?? (room ? crossRuleForCode(device.ruleCode, room.spaceCode) : null);
  const execution = layout?.executions.find(e => e.ruleCode === device.ruleCode && e.roomId === device.roomId);
  const candidateRules = room ? rulesForDevice(room.spaceCode, device.deviceKey) : [];
  const warnings = [
    ...device.trace.warnings,
    ...device.trace.notes
      .filter(n => ['NO_FURNITURE', 'NO_TARGET', 'SPACING_CONFLICT', 'NO_AVAILABLE_CANDIDATE', 'CONFLICT_P0'].includes(n))
      .map(n => NOTE_LABELS[n] ?? n),
  ];

  if (device.source === 'wholeHouse' || device.ruleCode === 'WHOLE-HOUSE') {
    return {
      kind: 'wholeHouse',
      kindLabel: '全屋级',
      code: device.ruleCode,
      title: device.deviceType2,
      subtitle: '全屋基础包 · 不进入空间模板',
      rows: [
        { label: '设备类型', value: `${device.category1} / ${device.deviceType2}` },
        { label: '宿主空间', value: device.roomName },
        { label: '安装位置', value: `x ${device.position.x} · y ${device.position.y} · z ${device.position.z}mm` },
      ],
      why: [
        '该设备属于全屋级基础设施，不按单个空间模板布点。',
        `按全屋基础包放在「${device.roomName}」，与空间点位规则分开统计。`,
        '同一全屋设备只出现一次，不会因空间数量增加而重复。',
      ],
      warnings,
      rule: null,
      candidateRules: [],
      executionReason: execution?.reason,
    };
  }

  if (device.ruleCode === 'MANUAL' || device.ruleCode === 'DEMO-COMBO') {
    const isDemo = device.ruleCode === 'DEMO-COMBO';
    return {
      kind: isDemo ? 'demo' : 'manual',
      kindLabel: isDemo ? 'Demo 灯效' : '未布点',
      code: device.ruleCode,
      title: device.deviceType2,
      subtitle: isDemo ? '用于演示设备类型对应的 2D / 3D 图形' : '手动拖入，尚未执行规则匹配',
      rows: [
        { label: '设备类型', value: `${device.category1} / ${device.deviceType2}` },
        { label: '所在空间', value: spaceName(device, project) },
        { label: '安装位置', value: `x ${device.position.x} · y ${device.position.y} · z ${device.position.z}mm` },
        { label: '可命中规则', value: candidateRules.length ? `${candidateRules.length} 条` : '无专用规则' },
      ],
      why: isDemo
        ? [
            '这是 Demo 组合灯效设备，用来验证口字 / L 型 / U 型灯带等图形示意。',
            '它不参与 183 条规则匹配，也不会计入规则命中统计。',
          ]
        : [
            '这是手动拖入的设备，当前还没有执行规则匹配，所以不会显示规则编号。',
            candidateRules.length
              ? `当前空间有 ${candidateRules.length} 条规则可能命中该设备：${candidateRules.map(r => r.pointCode).join('、')}。`
              : '当前空间的 183 条规则里没有为该设备配置专用规则，一键布点时将走通用布点策略。',
            '点顶部「一键布点」后，会按同空间、同设备的规则重新计算位置，并把命中结果显示在这里。',
          ],
      warnings,
      rule: null,
      candidateRules,
      executionReason: execution?.reason,
    };
  }

  if (!rule) {
    const genericReason = [...GENERIC_ANCHOR_REASON].find(x => x.test(device))?.text ?? '按房间几何取点';
    return {
      kind: 'generic',
      kindLabel: '通用布点',
      code: device.ruleCode,
      title: device.deviceType2,
      subtitle: `未命中专用规则，按「${ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor}」通用策略放置`,
      rows: [
        { label: '设备类型', value: `${device.category1} / ${device.deviceType2}` },
        { label: '所在空间', value: spaceName(device, project) },
        { label: '实际锚点', value: ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor },
        { label: '置信度', value: String(device.trace.confidence) },
        { label: '规则来源', value: device.ruleCode === 'EXISTING' ? '设备目录未匹配' : '现有设备通用布点' },
      ],
      why: [
        `当前空间的 183 条规则里没有为「${device.deviceType2}」配置专用规则，因此走了通用布点。`,
        `通用策略：${genericReason}。`,
        `实际锚点为${ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor}，置信度 ${device.trace.confidence}；这是兜底结果，不是规则命中。`,
        candidateRules.length
          ? `同空间可命中的规则有：${candidateRules.map(r => r.pointCode).join('、')}。`
          : '如需严格按规则布置，请使用「一键套餐」生成该空间的标准设备。',
      ],
      warnings,
      rule: null,
      candidateRules,
      executionReason: execution?.reason,
    };
  }

  const isGeneric = rule.pointCode === 'EXISTING-GENERIC' || device.trace.notes.includes('NO_RULE_FALLBACK');
  const priority = PRIORITY_LABELS[rule.priority];
  const mount = MOUNT_LABELS[rule.mount];
  const statusText = device.status === 'pending'
    ? '待处理（未确认落位）'
    : device.status === 'fallback'
    ? '降级落位'
      : device.status === 'adjusted'
        ? '人工调整（保留规则归因）'
    : device.status === 'manual'
      ? '手动'
      : '正常落位';

  const lighting = device.lighting;
  const circuitText = lighting?.circuitId
    ? `${lighting.circuitId}${lighting.gatewayId ? ` · ${lighting.gatewayId}` : ''}${lighting.daliAddress != null ? ` · DALI ${lighting.daliAddress}` : ''} · ${lighting.dimmingProtocol || '—'}（模拟）`
    : '未分配';
  const photometryText = lighting?.photometryStatus === 'not_applicable'
    ? '不适用（被动载体）'
    : lighting?.iesFile
      ? `${lighting.iesFile}（合成）`
      : '缺失';
  const lightingRows: ExplanationRow[] = lighting
    ? [
        { label: '照明层级', value: { base: '基础照明', task: '任务照明', accent: '重点照明' }[lighting.layer] },
        { label: '控制组', value: lighting.groupLabel },
        { label: '色温 / 光束', value: `${lighting.cct}K / ${lighting.beam}°` },
        { label: '功率 / 光通量', value: `${lighting.watt}W / ${lighting.lumen ?? '—'}lm（模拟）` },
        { label: '产品型号', value: `${lighting.productId}${lighting.productName ? ` · ${lighting.productName}` : ''}` },
        { label: '产品状态', value: lighting.productStatus === 'selected' ? '真实选品' : lighting.photometryStatus === 'not_applicable' ? '被动载体（无独立配光）' : lighting.photometryStatus === 'synthetic' ? '模拟选品（合成 IES，非实测）' : '规格意向（缺 IES）' },
        { label: 'IES / LDT', value: photometryText },
        { label: '回路 / 调光', value: circuitText },
        { label: 'UGR / Ra', value: `${lighting.ugr ?? '—'} / ${lighting.cri ?? '—'}（模拟值，未验证）` },
      ]
    : [];
  const rows: ExplanationRow[] = [
    { label: '规则编号', value: rule.pointCode },
    { label: '设备类型', value: `${device.category1} / ${device.deviceType2}` },
    { label: '用途', value: rule.usage || '基础布点' },
    ...lightingRows,
    { label: '数量公式', value: `${rule.quantity.raw} → ${quantityText(rule, device, project, execution)}` },
    ...(['rect', 'l', 'u'].includes(device.visual)
      ? [{ label: '尺寸依据', value: '按空间可用面积动态计算' }]
      : []),
    { label: '锚点', value: anchorText(rule, device) },
    { label: '安装面 / 高度', value: `${mount} · ${device.position.z}mm` },
    { label: '最小间距', value: rule.spacing ? `${rule.spacing}mm` : '未限制' },
    { label: '优先级', value: `${rule.priority} · ${priority}` },
    { label: '执行状态', value: statusText },
  ];
  if (device.status === 'pending' && device.trace.pending) {
    rows.push(
      { label: '未满足条件', value: device.trace.pending.unmet },
      { label: '处理建议', value: device.trace.pending.suggestion },
    );
  }

  // 待处理设备把诊断放在最前面，用户展开规则卡第一眼就能看到“哪条要求没满足”。
  const pending = device.status === 'pending' ? device.trace.pending : undefined;
  const pendingWhy = pending
    ? [
        `待处理原因：${pending.unmet}。`,
        `规则要求：${pending.requirement}。`,
        `检查结果：${pending.found}。`,
        `处理建议：${pending.suggestion}。`,
      ]
    : [];
  const lightingWhy = lighting
    ? [`照明分组：${lighting.groupLabel}；${({ base: '基础照明', task: '任务照明', accent: '重点照明' } as const)[lighting.layer]} · ${lighting.cct}K · ${lighting.beam}° · ${lighting.watt}W / ${lighting.lumen ?? '—'}lm；型号 ${lighting.productId}；${lighting.photometryStatus === 'not_applicable' ? '被动载体' : lighting.photometryStatus === 'synthetic' ? '模拟选品/合成 IES（非实测）' : '规格意向'}；${circuitText}；UGR ${lighting.ugr ?? '—'} / Ra ${lighting.cri ?? '—'}（模拟）。`]
    : [];
  const why: string[] = [
    ...lightingWhy,
    ...pendingWhy,
    ...(isGeneric
      ? [
          `当前空间没有为「${device.deviceType2}」配置专用规则，因此走了通用布点（${rule.pointCode}）。`,
          `通用策略：${[...GENERIC_ANCHOR_REASON].find(x => x.test(device))?.text ?? '按房间几何取点'}。`,
          `实际锚点为${ANCHOR_LABELS[device.trace.anchor] ?? device.trace.anchor}，置信度 ${device.trace.confidence}，这是兜底结果而非规则命中。`,
        ]
      : [
          `命中 ${rule.pointCode}「${rule.deviceType2}」规则，负责「${rule.usage || '基础布点'}」。`,
          `数量：规则要求 ${rule.quantity.raw}，${quantityText(rule, device, project, execution)}。`,
          `位置：规则要求${rule.anchor.raw || ANCHOR_LABELS[rule.anchor.kind] || rule.anchor.kind}，取第 ${device.trace.candidateRank || 1} 个候选点（置信度 ${device.trace.confidence}）。`,
          `高度：${mount}，落在 ${device.position.z}mm。`,
          `优先级 ${rule.priority}（${priority}）决定冲突时的占位顺序。`,
        ]),
  ];

  if (rule.quantity.kind === 'measuredLength') {
    why.push('该规则长度按布置后实测，当前按实际可布路径收口，不会跨越墙体进入相邻空间。');
  }
  if (device.status === 'pending') {
    if (!pending) {
      why.push('当前设备仍保留在报价数量中，但没有合法候选点或缺少安装载体，不能自动移动到房间中心。');
      why.push(`待处理原因：${device.trace.warnings.join('；') || '候选点不足'}`);
    }
  }
  if (['rect', 'l', 'u'].includes(device.visual)) {
    why.push(`灯组尺寸按空间可用面积动态计算，当前为 ${device.size.width} × ${device.size.depth}mm。`);
  }

  if (device.status === 'fallback' || device.trace.fallbackStep > 0) {
    why.push(`执行时发生降级：${reasonText(execution?.reason) || '候选点不足，已按规则降级链处理'}。`);
  } else if (execution?.reason) {
    why.push(`执行记录：${reasonText(execution.reason)}。`);
  }
  if (rule.traceFlags.includes('DEMO_DEFAULT')) {
    why.push('该规则原文为可选 / 区间参数，当前采用 Demo 默认值，最终口径待业务确认。');
  }

  return {
    kind: isGeneric ? 'generic' : 'rule',
    kindLabel: isGeneric ? '通用布点' : '规则命中',
    code: rule.pointCode,
    title: rule.deviceType2,
    subtitle: `${SPACE_BY_CODE[rule.spaceCode]?.name ?? rule.spaceName} · ${rule.usage || '基础布点'}`,
    rows,
    why,
    warnings,
    rule,
    candidateRules,
    executionReason: execution?.reason,
  };
}

export function ruleFlagText(flag: string): string {
  return NOTE_LABELS[flag] ?? flag;
}

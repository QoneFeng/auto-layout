// Shared by the offline API and Vue form; no network or project-instance state.
export const STATUSES = ['草稿', '在售', '下架', '归档'];
export const UNITS = ['个', '台', '套', '米', '件', '条', '卷', '组', '只', '对', '把', '厘米', '平方米'];
export const PROTOCOLS = ['Wi-Fi', '蓝牙', '蓝牙 Mesh', 'Zigbee', 'Matter', 'Thread', 'KNX', 'DALI', 'RS485', '有线', '无线'];
export const ECOSYSTEMS = ['米家', 'Apple Home', 'Aqara Home', '涂鸦', '华为', '易来', '其他'];
export const DIMMING = ['DALI', '0–10V', 'PWM', '可控硅', '开关控制', '不可调光'];
export const DATA_STATES = [{ label: '未提供', value: 'unknown' }, { label: '原表导入（未复核）', value: 'imported' }, { label: '模拟 / 演示假设', value: 'simulated' }, { label: '厂商资料', value: 'manufacturer' }, { label: '已复核（需报告）', value: 'reviewed' }];
export const SURFACES = [{ label: '顶面', value: 'ceiling' }, { label: '墙面', value: 'wall' }, { label: '地面', value: 'floor' }, { label: '桌面', value: 'table' }, { label: '柜体', value: 'cabinet' }, { label: '灯槽', value: 'cove' }, { label: '窗帘盒', value: 'curtain_box' }, { label: '轨道', value: 'track' }];
export const MOUNT_METHODS = ['明装', '嵌入', '吊装', '轨道安装', '桌面放置', '落地放置'];
export const ROUTES = [{ label: '直线', value: 'straight' }, { label: 'L 型', value: 'L' }, { label: 'U 型', value: 'U' }, { label: '口字', value: 'rectangle' }, { label: '自由路径', value: 'free' }];

const field = (key, label, unit = '', max = 1000000) => ({ key, label, unit, max });
export function specificationFields(kind) {
  const light = [field('watt', '额定功率', 'W'), field('lumen', '光通量', 'lm'), field('cctMin', '最低色温', 'K', 20000), field('cctMax', '最高色温', 'K', 20000), field('beamAngle', '光束角', '°', 360), field('cri', '显色指数 Ra', '', 100)];
  const groups = {
    light,
    strip: [field('voltage', '工作电压', 'V'), field('wattPerMeter', '每米功率', 'W/m'), field('lumenPerMeter', '每米光通量', 'lm/m'), field('cutStepMm', '最小剪切段', 'mm'), field('maxRunMm', '单段允许长度', 'mm')],
    track: [field('voltage', '额定电压', 'V'), field('ratedCurrent', '额定电流', 'A'), field('slotWidthMm', '接口宽度', 'mm')],
    panel: [field('keyCount', '物理按键数', '键', 128), field('outputChannels', '继电器输出通道', '路', 128), field('maxLoadW', '每路最大负载', 'W'), field('totalLoadW', '整机最大负载', 'W')],
    sensor: [field('coverageAngle', '探测角度', '°', 360), field('coverageDistanceMm', '探测距离', 'mm'), field('minHeightMm', '最低安装高度', 'mm'), field('maxHeightMm', '最高安装高度', 'mm')],
    network: [field('ports', '端口数', '口', 1024), field('poeBudgetW', 'PoE 总功率', 'W'), field('capacity', '设备接入容量', '台')],
    curtain: [field('voltage', '工作电压', 'V'), field('maxWeightKg', '最大帘重', 'kg'), field('minLengthMm', '最短适配长度', 'mm'), field('maxLengthMm', '最长适配长度', 'mm')],
    driver: [field('inputVoltage', '输入电压', 'V'), field('voltage', '输出电压', 'V'), field('ratedPowerW', '额定输出功率', 'W'), field('ratedCurrent', '额定输出电流', 'A'), field('outputChannels', '输出通道', '路', 128)],
    general: [field('voltage', '工作电压', 'V'), field('watt', '额定功率', 'W')],
  };
  return groups[kind] || groups.general;
}

export function categoryKind(category1, family) {
  if (/电源|驱动/.test(family)) return 'driver';
  if (/灯带/.test(family)) return 'strip';
  if (/轨道/.test(family) && !/灯头/.test(family)) return 'track';
  if (category1 === '灯光') return 'light';
  if (category1 === '控制') return 'panel';
  if (category1 === '环境') return 'sensor';
  if (category1 === '网络') return 'network';
  if (category1 === '遮阳') return 'curtain';
  return 'general';
}

export function blankProduct() {
  return {
    sku: '', name: '', categoryId: '', brand: '', model: '', series: '', description: '', tags: [],
    status: '草稿', recommended: false, sortOrder: 0, internalNote: '', retailPrice: null, salePrice: null, costPrice: null,
    salesUnit: '个', quantityMode: 'piece', minOrderQty: 1, orderStep: 1, standardLengthMm: null, packQuantity: null,
    canPlace: true, canPrice: true, communicationProtocols: [], ecosystems: [], dimmingInterfaces: [],
    gatewayRequirement: 'unknown', compatibilityNote: '', compatibilityStatus: 'unknown', controlFunctions: [],
    spaceCodes: [], mountMethods: [], mountSurfaces: [], widthMm: null, depthMm: null, heightMm: null, diameterMm: null,
    cutoutMm: null, recessDepthMm: null, installationNote: '', geometryStatus: 'unknown', supportedRouteShapes: [],
    applications: [], interfaceSeries: '', specificationNote: '', specs: {}, parameterStatus: 'unknown',
    photometryStatus: 'missing', geometryEvidence: '', compatibilityEvidence: '', parameterEvidence: '',
    source: '本地录入', isSimulated: false, assets: [],
  };
}

export function productIssues(p, categories) {
  const errors = {};
  const category = categories.find(c => c.id === p.categoryId);
  if (!p.name?.trim()) errors.name = '请填写产品名称';
  if ((p.name || '').length > 100) errors.name = '产品名称不能超过100字';
  if (p.sku && !/^[A-Za-z0-9][A-Za-z0-9_.-]{0,79}$/.test(p.sku)) errors.sku = '编码限80位字母、数字、短横线、下划线或点';
  if (!STATUSES.includes(p.status)) errors.status = '产品状态无效';
  const money = ['retailPrice', 'salePrice', 'costPrice'];
  for (const key of money) if (p[key] !== null && (!Number.isFinite(p[key]) || p[key] < 0 || p[key] > 100000000)) errors[key] = '请输入有效的非负金额（不超过1亿元）';
  const dimensions = ['widthMm', 'depthMm', 'heightMm', 'diameterMm', 'cutoutMm', 'recessDepthMm', 'standardLengthMm', 'packQuantity'];
  for (const key of dimensions) if (p[key] !== null && (!Number.isFinite(p[key]) || p[key] <= 0 || p[key] > 1000000)) errors[key] = '请输入大于0的有效数值';
  for (const key of ['minOrderQty', 'orderStep']) if (!Number.isFinite(p[key]) || p[key] <= 0) errors[key] = '最小数量与递增量必须大于0';
  if (p.quantityMode === 'piece' && (!Number.isInteger(p.minOrderQty) || !Number.isInteger(p.orderStep))) errors.orderStep = '按件计量的数量与步长必须为整数';
  if (p.categoryId && !category) errors.categoryId = '分类不存在，请重新选择';
  for (const f of specificationFields(category?.kind)) {
    const value = p.specs?.[f.key];
    if (value !== null && value !== undefined && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > f.max)) errors[`specs.${f.key}`] = `${f.label}超出有效范围`;
    if (['keyCount', 'outputChannels', 'ports', 'capacity'].includes(f.key) && value != null && !Number.isInteger(value)) errors[`specs.${f.key}`] = `${f.label}必须为整数`;
  }
  for (const [lo, hi] of [['cctMin', 'cctMax'], ['minHeightMm', 'maxHeightMm'], ['minLengthMm', 'maxLengthMm']]) {
    if (p.specs?.[lo] != null && p.specs?.[hi] != null && p.specs[lo] > p.specs[hi]) errors[`specs.${hi}`] = '上限不能小于下限';
  }
  if (p.geometryStatus === 'reviewed' && !p.geometryEvidence?.trim()) errors.geometryEvidence = '复核状态需填写报告或证据说明';
  if (p.parameterStatus === 'reviewed' && !p.parameterEvidence?.trim()) errors.parameterEvidence = '实测状态需填写报告或证据说明';
  if (p.compatibilityStatus === 'reviewed' && !p.compatibilityEvidence?.trim()) errors.compatibilityEvidence = '验证状态需填写证据说明';
  if (p.status === '在售') {
    if (!category) errors.categoryId = '上架前请选择产品分类';
    if (!UNITS.includes(p.salesUnit)) errors.salesUnit = '上架前请选择销售单位';
    if (p.canPrice && p.retailPrice === null) errors.retailPrice = '独立计价产品上架前需填写建议零售价';
    if (p.canPlace && !category?.legacyKeys?.length) errors.categoryId = '该分类尚无布点映射，请关闭可上点位图或补齐映射';
  }
  return errors;
}

// 布置规则 V2.3 的 45 类正式物品编码。
// 产品分类不在这里新增业务分类，只把它与规则侧唯一编码建立可维护映射。
export const RULE_DEVICE_ITEMS = [
  { ruleId: 'DEV-01', ruleCategory1: 'Lighting', label: '筒灯', itemCode: 'DownLight', legacyKeys: ['筒灯', '筒灯一字组', '筒灯口字组'] },
  { ruleId: 'DEV-02', ruleCategory1: 'Lighting', label: '射灯', itemCode: 'SpotLight', legacyKeys: ['射灯', '射灯一字组'] },
  { ruleId: 'DEV-03', ruleCategory1: 'Lighting', label: '吸顶灯', itemCode: 'CeilingLight', legacyKeys: ['吸顶灯'] },
  { ruleId: 'DEV-04', ruleCategory1: 'Lighting', label: '吊灯', itemCode: 'Chandelier', legacyKeys: ['吊灯'] },
  { ruleId: 'DEV-05', ruleCategory1: 'Lighting', label: '面板灯', itemCode: 'PanelLight', legacyKeys: ['面板灯'] },
  { ruleId: 'DEV-06', ruleCategory1: 'Lighting', label: '格栅灯', itemCode: 'GrilleLight', legacyKeys: ['格栅灯'] },
  { ruleId: 'DEV-07', ruleCategory1: 'Lighting', label: '壁灯', itemCode: 'WallLamp', legacyKeys: ['壁灯'] },
  { ruleId: 'DEV-08', ruleCategory1: 'Lighting', label: '落地灯', itemCode: 'GroundLamp', legacyKeys: ['落地灯'] },
  { ruleId: 'DEV-09', ruleCategory1: 'Lighting', label: '台灯', itemCode: 'TableLamp', legacyKeys: ['台灯'] },
  { ruleId: 'DEV-10', ruleCategory1: 'Lighting', label: '灯带', itemCode: 'LightStrip', legacyKeys: ['直线灯带', '贴墙灯带', 'L 型灯带', 'U 型灯带', '口字灯带', '灯槽灯带', '窗帘灯带', '柜体灯带'] },
  { ruleId: 'DEV-11', ruleCategory1: 'Lighting', label: '轨道射灯 · 灯头', itemCode: 'TrackSpotLight', legacyKeys: ['轨道射灯 · 灯头'] },
  { ruleId: 'DEV-12', ruleCategory1: 'Lighting', label: '轨道射灯 · 轨道', itemCode: 'Track', legacyKeys: ['轨道射灯 · 轨道'] },
  { ruleId: 'DEV-13', ruleCategory1: 'Lighting', label: '磁吸泛光灯 · 灯体', itemCode: 'MagneticFloodLight', legacyKeys: ['磁吸泛光灯 · 灯体'] },
  { ruleId: 'DEV-14', ruleCategory1: 'Lighting', label: '磁吸轨道', itemCode: 'MagneticTrack', legacyKeys: ['磁吸泛光灯 · 磁吸轨道', '磁吸格栅灯 · 磁吸轨道'] },
  { ruleId: 'DEV-15', ruleCategory1: 'Lighting', label: '磁吸格栅灯 · 灯体', itemCode: 'MagneticGrilleLight', legacyKeys: ['磁吸格栅灯 · 灯体'] },
  { ruleId: 'DEV-16', ruleCategory1: 'Control', label: '控制面板', itemCode: 'Ctrl', legacyKeys: ['开关面板', '情景面板'] },
  { ruleId: 'DEV-17', ruleCategory1: 'Control', label: '无线开关', itemCode: 'WirelessSwitch', legacyKeys: ['无线开关'] },
  { ruleId: 'DEV-18', ruleCategory1: 'Control', label: '调光旋钮', itemCode: 'DimmerKnob', legacyKeys: ['调光旋钮'] },
  { ruleId: 'DEV-19', ruleCategory1: 'Control', label: '中控屏', itemCode: 'CtrlCenter', legacyKeys: ['中控屏'] },
  { ruleId: 'DEV-20', ruleCategory1: 'Environment', label: '人体传感器', itemCode: 'PIRSensor', legacyKeys: ['人体传感器'] },
  { ruleId: 'DEV-21', ruleCategory1: 'Environment', label: '人在传感器', itemCode: 'PresenceSensor', legacyKeys: ['人在传感器'] },
  { ruleId: 'DEV-22', ruleCategory1: 'Environment', label: '温湿度传感器', itemCode: 'TemperatureHumiditySensor', legacyKeys: ['温湿度传感器'] },
  { ruleId: 'DEV-23', ruleCategory1: 'Environment', label: '光照传感器', itemCode: 'LightSensor', legacyKeys: ['光照传感器'] },
  { ruleId: 'DEV-24', ruleCategory1: 'Security', label: '摄像头', itemCode: 'Camera', legacyKeys: ['摄像头'] },
  { ruleId: 'DEV-25', ruleCategory1: 'Security', label: '智能门锁', itemCode: 'SmartLock', legacyKeys: ['智能门锁'] },
  { ruleId: 'DEV-26', ruleCategory1: 'Network', label: '蓝牙 Mesh 网关', itemCode: 'BluetoothMeshGateway', legacyKeys: ['蓝牙 Mesh 网关'] },
  { ruleId: 'DEV-27', ruleCategory1: 'Network', label: 'Mesh 路由器', itemCode: 'MeshRouter', legacyKeys: ['Mesh 路由器'] },
  { ruleId: 'DEV-28', ruleCategory1: 'Network', label: '顶装 AP', itemCode: 'CeilingAP', legacyKeys: ['顶装 AP'] },
  { ruleId: 'DEV-29', ruleCategory1: 'Network', label: '弱电箱 · 箱体', itemCode: 'WeakCurrentBox', legacyKeys: ['弱电箱 · 箱体'] },
  { ruleId: 'DEV-30', ruleCategory1: 'Network', label: '弱电箱 · PoE 路由', itemCode: 'WeakBoxPoERouter', legacyKeys: ['弱电箱 · PoE 路由'] },
  { ruleId: 'DEV-31', ruleCategory1: 'Network', label: '弱电箱 · Mesh 主路由', itemCode: 'WeakBoxMeshRouter', legacyKeys: ['弱电箱 · Mesh 主路由'] },
  { ruleId: 'DEV-32', ruleCategory1: 'Network', label: '弱电箱 · PoE 交换机', itemCode: 'WeakBoxPoESwitch', legacyKeys: ['弱电箱 · PoE 交换机'] },
  { ruleId: 'DEV-33', ruleCategory1: 'Network', label: '弱电箱 · 交换机', itemCode: 'WeakBoxSwitch', legacyKeys: ['弱电箱 · 交换机'] },
  { ruleId: 'DEV-34', ruleCategory1: 'Network', label: '交换机', itemCode: 'NetworkSwitch', legacyKeys: ['交换机'] },
  { ruleId: 'DEV-35', ruleCategory1: 'Network', label: '网口面板', itemCode: 'NetworkOutlet', legacyKeys: ['网口面板'] },
  { ruleId: 'DEV-36', ruleCategory1: 'Network', label: '面板 AP', itemCode: 'PanelAP', legacyKeys: ['面板 AP'] },
  { ruleId: 'DEV-37', ruleCategory1: 'Audio', label: '智能音箱', itemCode: 'SmartSpeaker', legacyKeys: ['智能音箱'] },
  { ruleId: 'DEV-38', ruleCategory1: 'Audio', label: '吸顶喇叭', itemCode: 'CeilingSpeaker', legacyKeys: ['吸顶喇叭'] },
  { ruleId: 'DEV-39', ruleCategory1: 'Shading', label: '窗帘电机', itemCode: 'CurtainMotor', legacyKeys: ['窗帘电机'] },
  { ruleId: 'DEV-40', ruleCategory1: 'Shading', label: '窗帘电机 · 电动轨道', itemCode: 'CurtainTrack', legacyKeys: ['窗帘电机 · 电动轨道'] },
  { ruleId: 'DEV-41', ruleCategory1: 'Shading', label: '窗帘盒', itemCode: 'CurtainBox', legacyKeys: [] },
  { ruleId: 'DEV-42', ruleCategory1: 'Shading', label: '卷帘电机', itemCode: 'RollerBlindMotor', legacyKeys: ['卷帘电机'] },
  { ruleId: 'DEV-43', ruleCategory1: 'HVAC', label: '挂式空调', itemCode: 'WallMountedAC', legacyKeys: ['挂式空调'] },
  { ruleId: 'DEV-44', ruleCategory1: 'HVAC', label: '柜式空调', itemCode: 'FloorStandingAC', legacyKeys: ['柜式空调'] },
  { ruleId: 'DEV-45', ruleCategory1: 'Accessory', label: '电源 / 驱动适配器', itemCode: 'PowerSupplyDriver', legacyKeys: [] },
];

export const RULE_ITEM_BY_CODE = Object.fromEntries(RULE_DEVICE_ITEMS.map(item => [item.itemCode, item]));

const RULE_CATEGORY_TO_PRODUCT_CATEGORY = {
  Lighting: '灯光',
  Control: '控制',
  Environment: '环境',
  Security: '安防监控',
  Network: '网络',
  Audio: '音乐',
  Shading: '遮阳',
  HVAC: '暖通',
  Accessory: '灯光',
};

const CATEGORY_ID_OVERRIDES = {
  Ctrl: '控制:控制面板',
  MagneticTrack: '灯光:磁吸轨道',
  LightStrip: '灯光:灯带',
  PowerSupplyDriver: '灯光:电源 / 驱动',
};

export function categoryIdForRuleItem(item) {
  return CATEGORY_ID_OVERRIDES[item.itemCode] || `${RULE_CATEGORY_TO_PRODUCT_CATEGORY[item.ruleCategory1]}:${item.label}`;
}

export function ruleItemForCategory(category) {
  if (category.label === '电源 / 驱动') return RULE_ITEM_BY_CODE.PowerSupplyDriver;
  if (category.label === '窗帘盒') return RULE_ITEM_BY_CODE.CurtainBox;
  return RULE_DEVICE_ITEMS.find(item => item.label === category.label) || null;
}

export const RULE_CATEGORY_LABELS = {
  Lighting: '灯光',
  Control: '控制',
  Environment: '环境',
  Security: '安防监控',
  Network: '网络',
  Audio: '音乐',
  Shading: '遮阳',
  HVAC: '暖通',
  Accessory: '配件',
};

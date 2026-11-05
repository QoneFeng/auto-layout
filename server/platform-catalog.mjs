import { blankProduct } from '../shared/product-schema.mjs';
import { productMetadata } from './products.mjs';

// 单机版没有云同步。这里提供随安装包发布、只读可浏览的“平台设备库离线镜像”，
// 用户明确加入门店库后才创建本地草稿，避免把平台参考资料直接当成已审核商品。
const category = pattern => productMetadata.categories.find(item => pattern.test(`${item.category1}/${item.label}`)) || productMetadata.categories[0];
const allSpaces = productMetadata.spaces.map(item => item.code);

const sourceRows = [
  ['PLAT-LIGHT-001', '超薄防眩智能筒灯 7W', /筒灯/, 'Qone Select', 'DL-7W-36D', 299, ['DALI', '无线'], ['米家', 'Apple Home'], ['ceiling']],
  ['PLAT-LIGHT-002', '磁吸轨道射灯 12W', /磁吸.*灯头|磁吸.*射灯|射灯/, 'Qone Select', 'MT-12W-24D', 459, ['DALI'], ['华为', '其他'], ['track']],
  ['PLAT-STRIP-001', '无频闪柔性灯带 24V', /灯带/, 'Qone Select', 'LS-24V-10W', 86, ['PWM', 'DALI'], ['易来', '其他'], ['cove', 'cabinet', 'curtain_box']],
  ['PLAT-PANEL-001', '四键智能场景面板', /控制面板|开关面板|情景面板/, 'Qone Select', 'SP-4K', 399, ['KNX', 'Zigbee'], ['Aqara Home', '其他'], ['wall']],
  ['PLAT-CURTAIN-001', '静音智能窗帘电机', /窗帘电机/, 'Qone Select', 'CM-45', 1299, ['Zigbee', 'RS485'], ['米家', '涂鸦'], ['curtain_box']],
  ['PLAT-SENSOR-001', '毫米波人在传感器', /人在传感器|人体存在/, 'Qone Select', 'PS-24G', 529, ['Zigbee', 'Matter'], ['Aqara Home', 'Apple Home'], ['ceiling']],
  ['PLAT-NET-001', '吸顶式 Wi-Fi 7 AP', /AP|无线接入/, 'Qone Select', 'AP-BE3600', 899, ['有线', 'Wi-Fi'], ['其他'], ['ceiling']],
  ['PLAT-NET-002', '8 口 PoE 千兆交换机', /交换机/, 'Qone Select', 'SW-8P', 1199, ['有线'], ['其他'], ['cabinet']],
  ['PLAT-HVAC-001', '中央空调智能网关', /空调|暖通/, 'Qone Select', 'HVAC-GW', 1599, ['RS485', 'KNX'], ['华为', '其他'], ['wall']],
  ['PLAT-SECURITY-001', '可视智能门锁', /门锁/, 'Qone Select', 'LOCK-V1', 2399, ['Wi-Fi', '蓝牙'], ['米家', '华为'], ['wall']],
];

const catalog = sourceRows.map(([id, name, categoryPattern, brand, model, retailPrice, protocols, ecosystems, surfaces], index) => {
  const c = category(categoryPattern);
  return {
    ...blankProduct(),
    id,
    platformCode: id,
    sku: id,
    name,
    categoryId: c.id,
    category: `${c.category1} / ${c.label}`,
    brand,
    model,
    description: '平台设备库离线镜像中的演示选品资料；加入门店库后需补齐真实厂商资料并审核上架。',
    status: '平台参考',
    recommended: index < 6,
    retailPrice,
    salePrice: retailPrice,
    costPrice: Math.round(retailPrice * 0.62),
    salesUnit: c.unit || '个',
    communicationProtocols: protocols,
    ecosystems,
    spaceCodes: allSpaces,
    mountSurfaces: surfaces,
    mountMethods: surfaces.includes('ceiling') ? ['嵌入', '明装'] : surfaces.includes('wall') ? ['明装'] : ['明装'],
    geometryStatus: 'simulated',
    parameterStatus: 'simulated',
    compatibilityStatus: 'simulated',
    photometryStatus: /LIGHT|STRIP/.test(id) ? 'synthetic' : 'not_applicable',
    source: '平台设备库离线镜像 2026.11',
    isSimulated: true,
    specs: { platformCode: id, catalogVersion: '2026.11-offline', dataBoundary: 'demo_reference_only' },
    price: retailPrice,
  };
});

export function listPlatformProducts(query = {}) {
  const search = String(query.search || '').trim().toLowerCase();
  const filtered = catalog.filter(item =>
    (!search || [item.name, item.sku, item.category, item.brand, item.model].join(' ').toLowerCase().includes(search)) &&
    (!query.category || item.categoryId === query.category || item.category === query.category) &&
    (!query.brand || item.brand === query.brand) &&
    (!query.ecosystem || item.ecosystems.includes(query.ecosystem)));
  const pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize, 10) || 30));
  const page = Math.min(Math.max(1, Math.ceil(filtered.length / pageSize)), Math.max(1, Number.parseInt(query.page, 10) || 1));
  return { products: filtered.slice((page - 1) * pageSize, page * pageSize), total: filtered.length, page, pageSize, catalogVersion: '2026.11-offline' };
}

export function platformProductDraft(id) {
  const source = catalog.find(item => item.id === id);
  if (!source) return null;
  const draft = { ...source, id: undefined, platformCode: undefined, status: '草稿', assets: [], specs: { ...source.specs, copiedAt: new Date().toISOString() } };
  draft.sku = `${source.sku}-${Date.now().toString(36).toUpperCase()}`;
  draft.internalNote = `由${source.source}加入；当前参数、价格和兼容关系均为模拟参考，审核后方可上架。`;
  return draft;
}


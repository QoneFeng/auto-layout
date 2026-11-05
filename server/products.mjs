import fs from 'node:fs';
import path from 'node:path';
import { randomUUID, createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { blankProduct, productIssues, categoryKind, STATUSES, UNITS, PROTOCOLS, ECOSYSTEMS, DIMMING, SURFACES, MOUNT_METHODS, ROUTES } from '../shared/product-schema.mjs';
import { RULE_DEVICE_ITEMS, RULE_ITEM_BY_CODE, categoryIdForRuleItem, ruleItemForCategory } from '../shared/category-catalog.mjs';
import { PRODUCT_STATUSES, productTransitionFor } from '../shared/product-state.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const exported = fs.readFileSync(path.join(root, 'app/devices.js'), 'utf8');
const devices = JSON.parse(exported.match(/window\.SMART_DEVICES = ([\s\S]*?);\s*window\.SMART_SPACES/)[1]);
const spaces = JSON.parse(exported.match(/window\.SMART_SPACES = ([\s\S]*?);\s*$/)[1]).map(s => ({ code: s.code, name: s.name }));
const mergedFamily = d => /灯带/.test(d.category2) ? '灯带' : ['开关面板', '情景面板'].includes(d.category2) ? '控制面板' : /磁吸轨道/.test(d.category2) ? '磁吸轨道' : d.productFamily || d.category2;
const categoryMap = new Map();
for (const d of devices) {
  const family = mergedFamily(d), id = `${d.category1}:${family}`;
  if (!categoryMap.has(id)) categoryMap.set(id, { id, label: family, family, category1: d.category1, kind: categoryKind(d.category1, family), legacyKeys: [], surfaces: [], unit: d.salesUnit === 'meter' ? '米' : '个' });
  const c = categoryMap.get(id);
  c.legacyKeys.push(d.key);
  if (d.mountSurface && !c.surfaces.includes(d.mountSurface)) c.surfaces.push(d.mountSurface);
}
// Approved accessory family; not yet a placement-engine item. The UI exposes this gap.
categoryMap.set('灯光:电源 / 驱动', { id: '灯光:电源 / 驱动', label: '电源 / 驱动', family: '电源 / 驱动', category1: '灯光', kind: 'driver', legacyKeys: [], surfaces: ['cabinet'], unit: '个' });
// DEV-41 窗帘盒是规则正式编码，但当前设备目录把它当障碍物/载体派生，尚无独立设备记录。
// 仍建立一个只读产品分类，保证 45 个正式物品编码都能在产品分类页核对映射。
categoryMap.set('遮阳:窗帘盒', { id: '遮阳:窗帘盒', label: '窗帘盒', family: '窗帘盒', category1: '遮阳', kind: 'curtain', legacyKeys: [], surfaces: ['ceiling'], unit: '米' });
for (const category of categoryMap.values()) {
  const ruleItem = ruleItemForCategory(category);
  category.itemCode = ruleItem?.itemCode || '';
  category.ruleId = ruleItem?.ruleId || '';
  category.ruleLabel = ruleItem?.label || '';
  category.ruleCategory1 = ruleItem?.ruleCategory1 || '';
  category.ruleCategoryLabel = ruleItem?.ruleCategory1 ? ({ Lighting:'灯光', Control:'控制', Environment:'环境', Security:'安防监控', Network:'网络', Audio:'音乐', Shading:'遮阳', HVAC:'暖通', Accessory:'配件' })[ruleItem.ruleCategory1] : '';
  category.defaultItemCode = category.itemCode;
  category.defaultLegacyKeys = [...category.legacyKeys];
}
export const productMetadata = { categories: [...categoryMap.values()], spaces, protocols: PROTOCOLS, ecosystems: ECOSYSTEMS, dimming: DIMMING, surfaces: SURFACES, mountMethods: MOUNT_METHODS, routes: ROUTES };

export const ruleDeviceItems = RULE_DEVICE_ITEMS.map(item => ({
  ...item,
  defaultCategoryId: categoryIdForRuleItem(item),
}));

export class ProductError extends Error {
  constructor(message, statusCode = 400, fields = {}) { super(message); this.statusCode = statusCode; this.fields = fields; }
}
const fail = (message, fields = {}) => { throw new ProductError(message, 400, fields); };
const seedTypes = { 'SKU-LIGHT-001': '磁吸泛光灯 · 灯体', 'SKU-LIGHT-002': '口字灯带', 'SKU-SW-001': '开关面板', 'SKU-CURTAIN-001': '窗帘电机', 'SKU-SENSOR-001': '人在传感器', 'SKU-NET-001': 'Mesh 路由器', 'SKU-NET-002': '弱电箱 · PoE 交换机' };

export function createProductStore(db) {
  const columns = db.prepare('PRAGMA table_info(products)').all().map(c => c.name);
  if (!columns.includes('details_json')) db.exec("ALTER TABLE products ADD COLUMN details_json TEXT NOT NULL DEFAULT '{}'");
  if (!columns.includes('revision')) db.exec('ALTER TABLE products ADD COLUMN revision INTEGER NOT NULL DEFAULT 1');
  db.exec('CREATE TABLE IF NOT EXISTS product_assets (id TEXT PRIMARY KEY, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL, sha256 TEXT NOT NULL, created_at TEXT NOT NULL)');
  // 分类映射只允许在既有分类上改物品编码，不能新增/删除分类。
  db.exec('CREATE TABLE IF NOT EXISTS product_category_mappings (category_id TEXT PRIMARY KEY, item_code TEXT NOT NULL, updated_at TEXT NOT NULL)');
  db.exec(`
    CREATE TABLE IF NOT EXISTS product_status_history (
      id TEXT PRIMARY KEY, product_id TEXT NOT NULL, from_status TEXT NOT NULL DEFAULT '', to_status TEXT NOT NULL,
      action TEXT NOT NULL, actor TEXT NOT NULL DEFAULT '', reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_product_status_history ON product_status_history(product_id, created_at);
  `);
  const asset = id => db.prepare('SELECT id,name,mime,size,sha256 FROM product_assets WHERE id=?').get(id);
  const mapAsset = a => ({ ...a, url: `/api/admin/product-assets/${a.id}` });
  function recordStatus({ productId, from, to, action, actor = '本机用户', reason = '', at = new Date().toISOString() }) {
    db.prepare('INSERT INTO product_status_history (id,product_id,from_status,to_status,action,actor,reason,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(randomUUID(), productId, from || '', to, action, actor, reason, at);
  }
  // 旧产品没有历史表时补一条“初始化”记录，避免详情页把当前状态伪装成完整流转记录。
  const missingHistory = db.prepare(`SELECT p.id, p.status, p.updated_at FROM products p
    WHERE NOT EXISTS (SELECT 1 FROM product_status_history h WHERE h.product_id=p.id)`).all();
  if (missingHistory.length) {
    const insert = db.prepare('INSERT INTO product_status_history (id,product_id,from_status,to_status,action,actor,reason,created_at) VALUES (?,?,?,?,?,?,?,?)');
    db.transaction(rows => rows.forEach(row => insert.run(randomUUID(), row.id, '', row.status, 'initialize', '历史数据', '状态历史初始化', row.updated_at || new Date().toISOString())))(missingHistory);
  }
  function categoryList() {
    const saved = new Map(db.prepare('SELECT category_id,item_code FROM product_category_mappings').all().map(row => [row.category_id, row.item_code]));
    const categories = productMetadata.categories.map(category => {
      const itemCode = saved.get(category.id) || category.defaultItemCode || '';
      const rule = RULE_ITEM_BY_CODE[itemCode];
      return {
        ...category,
        itemCode,
        ruleId: rule?.ruleId || '',
        ruleLabel: rule?.label || '',
        ruleCategory1: rule?.ruleCategory1 || '',
        ruleCategoryLabel: rule?.ruleCategory1 ? ({ Lighting:'灯光', Control:'控制', Environment:'环境', Security:'安防监控', Network:'网络', Audio:'音乐', Shading:'遮阳', HVAC:'暖通', Accessory:'配件' })[rule.ruleCategory1] : '',
        legacyKeys: rule ? [...rule.legacyKeys] : [...category.defaultLegacyKeys],
        mappingSource: saved.has(category.id) ? 'custom' : 'default',
      };
    });
    const usage = new Map();
    for (const category of categories) if (category.itemCode) usage.set(category.itemCode, [...(usage.get(category.itemCode) || []), category.id]);
    return categories.map(category => ({ ...category, mappingConflict: Boolean(category.itemCode && usage.get(category.itemCode)?.length > 1) }));
  }
  function map(row, categories = categoryList()) {
    if (!row) return null;
    const specs = JSON.parse(row.specs_json || '{}'), saved = JSON.parse(row.details_json || '{}');
    const c = categories.find(c => c.id === saved.categoryId) || categories.find(c => c.legacyKeys.includes(seedTypes[row.sku] || specs.legacyType2));
    const defaults = blankProduct();
    const p = { ...defaults, categoryId: c?.id || '', retailPrice: row.price, isSimulated: row.source === '演示产品目录', ...saved,
      id: row.id, sku: row.sku, name: row.name, category: row.category, status: row.status, source: row.source, specs, revision: row.revision, updatedAt: row.updated_at };
    p.productFamily = categories.find(c => c.id === p.categoryId)?.family || categoryMap.get(p.categoryId)?.family || '';
    p.assets = (saved.assets || []).flatMap(a => { const found = asset(a.id); return found ? [{ ...mapAsset(found), role: a.role }] : []; });
    p.price = p.canPrice ? p.salePrice ?? p.retailPrice : null;
    return p;
  }
  const get = id => map(db.prepare('SELECT * FROM products WHERE id=?').get(id), categoryList());
  function list(query = {}) {
    const search = String(query.search || '').trim().toLowerCase();
    const categories = categoryList();
    return db.prepare('SELECT * FROM products ORDER BY updated_at DESC, id').all().map(row => map(row, categories)).filter(p =>
      (!search || [p.name, p.sku, p.category, p.brand, p.model].join(' ').toLowerCase().includes(search)) &&
      (!query.category || p.category === query.category || p.categoryId === query.category) &&
      (!query.status || p.status === query.status) && (!query.brand || p.brand === query.brand) &&
      (!query.ecosystem || p.ecosystems.includes(query.ecosystem)));
  }
  function normalize(input, previous) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) fail('产品必须是对象');
    const result = blankProduct();
    for (const [key, defaultValue] of Object.entries(result)) {
      const value = input[key] ?? previous?.[key] ?? defaultValue;
      if (Array.isArray(defaultValue)) {
        if (!Array.isArray(value) || value.length > (key === 'assets' ? 24 : 80)) fail(`${key}列表无效`);
        result[key] = key === 'assets' ? value.map(a => ({ id: String(a.id || ''), role: String(a.role || 'document') })) : [...new Set(value.map(x => String(x).trim()).filter(Boolean))];
      } else if (typeof defaultValue === 'boolean') {
        if (typeof value !== 'boolean') fail(`${key}必须是布尔值`);
        result[key] = value;
      } else if (defaultValue === null || typeof defaultValue === 'number') {
        // Explicit null clears optional numeric values, rather than restoring the previous value.
        result[key] = Object.hasOwn(input, key) ? input[key] : value;
        if (result[key] !== null && typeof result[key] !== 'number') fail(`${key}必须是数值`);
      } else if (key === 'specs') {
        if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length > 100) fail('规格参数无效');
        result.specs = JSON.parse(JSON.stringify(value));
      } else {
        if (typeof value !== 'string' || value.length > (['description', 'installationNote', 'specificationNote', 'internalNote'].includes(key) ? 3000 : 500)) fail(`${key}内容无效或过长`);
        result[key] = value.trim();
      }
    }
    result.sku ||= `SKU-${randomUUID().slice(0, 18).toUpperCase()}`;
    const enums = { status: STATUSES, salesUnit: UNITS, quantityMode: ['piece', 'length', 'area', 'bundle'], gatewayRequirement: ['none', 'required', 'unknown'], geometryStatus: ['unknown', 'imported', 'simulated', 'manufacturer', 'reviewed'], parameterStatus: ['unknown', 'imported', 'simulated', 'manufacturer', 'reviewed'], compatibilityStatus: ['unknown', 'imported', 'simulated', 'manufacturer', 'reviewed'], photometryStatus: ['missing', 'synthetic', 'manufacturer', 'not_applicable'] };
    for (const [key, choices] of Object.entries(enums)) if (!choices.includes(result[key])) fail(`${key}选项无效`);
    for (const [key, choices] of Object.entries({ spaceCodes: spaces.map(s => s.code), communicationProtocols: PROTOCOLS, ecosystems: ECOSYSTEMS, dimmingInterfaces: DIMMING, mountSurfaces: SURFACES.map(s => s.value), mountMethods: MOUNT_METHODS, supportedRouteShapes: ROUTES.map(s => s.value), applications: ['general', 'cove', 'curtain_box', 'cabinet', 'low_position', 'wash_wall'], controlFunctions: ['开关', '调光', '场景', '窗帘'] })) {
      if (result[key].some(v => !choices.includes(v))) fail(`${key}含无效选项`);
    }
    if (!Number.isInteger(result.sortOrder) || Math.abs(result.sortOrder) > 99999) fail('排序值必须是有效整数');
    for (const a of result.assets) {
      if (!asset(a.id) || !['cover', 'image', 'document', 'photometry', 'model'].includes(a.role)) fail('附件不存在或用途无效');
      const info = asset(a.id);
      if (['cover', 'image'].includes(a.role) && !info.mime.startsWith('image/')) fail('主图和附图必须是图片');
    }
    if (new Set(result.assets.map(a => a.id)).size !== result.assets.length) fail('同一个附件不能重复添加');
    if (result.assets.filter(a => a.role === 'cover').length > 1 || result.assets.filter(a => a.role === 'image').length > 8) fail('主图最多1张，附图最多8张');
    const errors = productIssues(result, categoryList());
    if (Object.keys(errors).length) fail(Object.values(errors)[0], errors);
    return result;
  }
  function save(input, existingId, options = {}) {
    return db.transaction(() => {
      const previous = existingId ? get(existingId) : null;
      if (existingId && !previous) throw new ProductError('产品不存在', 404);
      if (previous && input.revision !== previous.revision) throw new ProductError('产品已被其他页面修改，请重新打开后编辑', 409);
      const p = normalize(input, previous);
      if (!previous && !['草稿', '在售'].includes(p.status)) throw new ProductError('新建产品只能保存为草稿或直接上架', 400);
      // 已有产品的状态只能通过 transition() 流转，编辑保存不得绕过原因、守卫与历史记录。
      if (previous && p.status !== previous.status) throw new ProductError('产品状态变更必须使用状态流转操作', 409, { status: '请使用上架 / 下架 / 归档 / 恢复操作' });
      const same = db.prepare('SELECT id FROM products WHERE sku=? COLLATE NOCASE').get(p.sku);
      if (same && same.id !== existingId) throw new ProductError('产品编码已存在，请使用编辑或更换编码', 409, { sku: '该编码已存在，不会覆盖原产品' });
      const category = categoryMap.get(p.categoryId);
      const id = existingId || `PRD-${randomUUID()}`, timestamp = new Date().toISOString();
      const details = { ...p, createdAt: previous?.createdAt || timestamp };
      delete details.specs;
      const row = { id, sku: p.sku, name: p.name, category: category ? `${category.category1} / ${category.label}` : '未分类', space: p.spaceCodes.length === spaces.length ? '全屋' : p.spaceCodes.map(code => spaces.find(s => s.code === code)?.name).join('/'), price: p.canPrice ? p.salePrice ?? p.retailPrice ?? 0 : 0, status: p.status, source: p.source, specs: JSON.stringify(p.specs), details: JSON.stringify(details), timestamp };
      if (previous) db.prepare('UPDATE products SET sku=@sku,name=@name,category=@category,space=@space,price=@price,status=@status,source=@source,specs_json=@specs,details_json=@details,updated_at=@timestamp,revision=revision+1 WHERE id=@id').run(row);
      else db.prepare('INSERT INTO products (id,sku,name,category,space,price,status,source,specs_json,details_json,updated_at,revision) VALUES (@id,@sku,@name,@category,@space,@price,@status,@source,@specs,@details,@timestamp,1)').run(row);
      const actor = options.actor || '本机用户';
      if (!previous) {
        recordStatus({ productId: id, from: '', to: '草稿', action: 'create', actor, reason: options.reason || '创建产品', at: timestamp });
        if (p.status === '在售') recordStatus({ productId: id, from: '草稿', to: '在售', action: 'publish', actor, reason: options.reason || '创建并上架', at: timestamp });
      }
      return get(id);
    })();
  }
  function importRows(items, updateExisting = false) {
    if (!Array.isArray(items) || !items.length || items.length > 500) fail('每次导入需包含1–500条产品');
    return db.transaction(() => {
      let created = 0, updated = 0;
      const seen = new Set();
      for (const [index, item] of items.entries()) {
        try {
          const sku = String(item?.sku || item?.SKU || '').trim();
          if (!sku) fail('导入行必须有产品编码');
          if (seen.has(sku.toLowerCase())) fail('文件内产品编码重复');
          seen.add(sku.toLowerCase());
          const oldRow = db.prepare('SELECT id FROM products WHERE sku=? COLLATE NOCASE').get(sku);
          if (oldRow && !updateExisting) throw new ProductError('编码已存在；如需更新，请明确勾选更新已有产品', 409);
          const previous = oldRow ? get(oldRow.id) : null;
          const resolved = categoryList().find(c => c.id === item.categoryId || c.label === item.category || `${c.category1} / ${c.label}` === item.category);
          const p = { ...item, sku, name: item.name || item.名称, source: previous?.source || item.source || '本地导入',
            categoryId: item.categoryId || resolved?.id || previous?.categoryId || '',
            // 已有产品的状态只能通过状态操作流转，导入不得静默上架或下架。
            status: previous?.status || item.status || '草稿', revision: previous?.revision };
          if (!Object.hasOwn(item, 'retailPrice') && Object.hasOwn(item, 'price')) p.retailPrice = item.price;
          save(p, oldRow?.id, { actor: '导入任务' });
          if (oldRow) updated++; else created++;
        } catch (e) { throw new ProductError(`第${index + 1}行：${e.message}（本批次未写入）`, e.statusCode || 400, e.fields); }
      }
      return { count: created + updated, created, updated };
    })();
  }
  function designCatalog() {
    const products = list({ status: '在售' }).filter(item => item.canPlace && item.categoryId);
    const categories = categoryList();
    let defaultModels = {};
    try {
      const row = db.prepare("SELECT value_json FROM system_settings WHERE key='defaultDeviceModels'").get();
      defaultModels = JSON.parse(row?.value_json || '{}') || {};
    } catch { defaultModels = {}; }
    const selected = [];
    const timeValue = item => {
      const value = Date.parse(item.updatedAt || '');
      return Number.isFinite(value) ? value : 0;
    };
    for (const base of devices) {
      const category = categories.find(item => item.legacyKeys.includes(base.key));
      const candidates = products.filter(item => item.categoryId === category?.id).sort((a, b) =>
        Number(Boolean(b.recommended)) - Number(Boolean(a.recommended))
        || Number(Boolean(a.isSimulated)) - Number(Boolean(b.isSimulated))
        || Number(a.price ?? Infinity) - Number(b.price ?? Infinity)
        // 推荐、模拟标记和价格都相同的并列产品：最近更新优先，再按 SKU 字典序，保证结果稳定可追溯。
        || timeValue(b) - timeValue(a)
        || String(a.sku || '').localeCompare(String(b.sku || ''), 'zh-CN')
        || String(a.id).localeCompare(String(b.id)));
      // 门店在“系统设置 → 默认设备”指定的型号优先；只指定品牌时优先该品牌，再沿用同分类在售推荐/低价排序。
      const configured = category ? defaultModels[category.id] : null;
      const preferredId = configured?.productId || '';
      const preferredBrand = String(configured?.brand || '').trim();
      const product = candidates.find(item => item.id === preferredId)
        || (preferredBrand ? candidates.find(item => item.brand === preferredBrand) : null)
        || candidates[0];
      const width = Number(product?.diameterMm || product?.widthMm || base.size.width);
      const depth = Number(product?.diameterMm || product?.depthMm || base.size.depth);
      selected.push({
        ...base,
        key: product ? `product:${product.id}:${base.key}` : base.key,
        legacyKey: base.key,
        productId: product?.id || '',
        sku: product?.sku || '',
        productName: product?.name || '',
        price: product?.price ?? null,
        salesUnit: product?.salesUnit || base.salesUnit,
        size: { width: Math.max(20, width || base.size.width), depth: Math.max(20, depth || base.size.depth) },
        dataState: product ? (product.isSimulated ? 'simulated' : 'store_product') : 'catalog_fallback',
      });
    }
    return { devices: selected, productCount: products.length, mappedCount: selected.filter(item => item.productId).length, fallbackCount: selected.filter(item => !item.productId).length };
  }
  function categoryOverview() {
    const categories = categoryList();
    const products = list();
    const rows = categories.map(category => {
      const items = products.filter(product => product.categoryId === category.id);
      return {
        ...category,
        productCount: items.length,
        placeableCount: items.filter(product => product.canPlace).length,
        onSaleCount: items.filter(product => product.status === '在售').length,
      };
    });
    return {
      categories: rows,
      ruleItems: ruleDeviceItems,
      stats: {
        categoryCount: rows.length,
        ruleItemCount: ruleDeviceItems.length,
        mappedCount: rows.filter(row => row.itemCode).length,
        unmappedCount: rows.filter(row => !row.itemCode).length,
        conflictCount: rows.filter(row => row.mappingConflict).length,
        productCount: products.length,
        placeableCount: products.filter(product => product.canPlace).length,
        onSaleCount: products.filter(product => product.status === '在售').length,
      },
    };
  }
  function updateCategoryMapping(categoryId, itemCode) {
    return db.transaction(() => {
      const category = productMetadata.categories.find(item => item.id === categoryId);
      if (!category) throw new ProductError('产品分类不存在', 404);
      const code = String(itemCode || '').trim();
      if (code && !RULE_ITEM_BY_CODE[code]) throw new ProductError('物品编码不存在', 400, { itemCode: '请选择规则正式物品编码' });
      const saved = new Map(db.prepare('SELECT category_id,item_code FROM product_category_mappings').all().map(row => [row.category_id, row.item_code]));
      const currentCode = saved.get(categoryId) || category.defaultItemCode || '';
      if (code) {
        const conflict = productMetadata.categories.find(other => other.id !== categoryId && (saved.get(other.id) || other.defaultItemCode) === code);
        if (conflict) {
          if (!currentCode) throw new ProductError(`该物品编码已映射到「${conflict.category1} / ${conflict.label}」，当前分类没有可互换的编码`, 409, { itemCode: '请先为当前分类选择编码' });
          // 45 个编码与分类是一对一关系，直接改一个编码等同于两个分类互换，必须原子完成。
          if (currentCode === conflict.defaultItemCode) db.prepare('DELETE FROM product_category_mappings WHERE category_id=?').run(conflict.id);
          else db.prepare('INSERT INTO product_category_mappings (category_id,item_code,updated_at) VALUES (?,?,?) ON CONFLICT(category_id) DO UPDATE SET item_code=excluded.item_code,updated_at=excluded.updated_at').run(conflict.id, currentCode, new Date().toISOString());
        }
      }
      if (!code || code === category.defaultItemCode) db.prepare('DELETE FROM product_category_mappings WHERE category_id=?').run(categoryId);
      else db.prepare('INSERT INTO product_category_mappings (category_id,item_code,updated_at) VALUES (?,?,?) ON CONFLICT(category_id) DO UPDATE SET item_code=excluded.item_code,updated_at=excluded.updated_at').run(categoryId, code, new Date().toISOString());
      return categoryOverview();
    })();
  }
  function defaultDeviceOptions() {
    const overview = categoryOverview();
    const productsByCategory = {};
    for (const product of list()) {
      if (!product.categoryId) continue;
      (productsByCategory[product.categoryId] ||= []).push({
        id: product.id, sku: product.sku, name: product.name, brand: product.brand || '', model: product.model || '',
        status: product.status, price: product.price, canPrice: product.canPrice, recommended: product.recommended,
      });
    }
    for (const items of Object.values(productsByCategory)) {
      items.sort((a, b) => Number(b.status === '在售') - Number(a.status === '在售') || Number(Boolean(b.recommended)) - Number(Boolean(a.recommended)) || String(a.model || a.name).localeCompare(String(b.model || b.name), 'zh-CN'));
    }
    return { ...overview, productsByCategory };
  }
  function statusHistory(productId) {
    return db.prepare('SELECT * FROM product_status_history WHERE product_id=? ORDER BY rowid').all(productId).map(row => ({
      id: row.id, productId: row.product_id, fromStatus: row.from_status, toStatus: row.to_status,
      action: row.action, actor: row.actor, reason: row.reason, createdAt: row.created_at,
    }));
  }
  function transition(productId, input = {}) {
    return db.transaction(() => {
      const row = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
      if (!row) throw new ProductError('产品不存在', 404);
      if (input.expectedStatus && input.expectedStatus !== row.status) throw new ProductError('产品状态已变化，请刷新后重试', 409, { status: '状态已变化' });
      const action = String(input.action || '');
      const transition = productTransitionFor(row.status, action);
      if (!transition) throw new ProductError(`当前状态「${row.status}」不支持该操作`, 400);
      const reason = String(input.reason || '').trim();
      if (transition.requiresReason && !reason) throw new ProductError('归档必须填写原因', 400, { reason: '请填写归档原因' });
      if (transition.validatesProduct) {
        const product = get(productId);
        const errors = productIssues({ ...product, status: '在售' }, categoryList());
        if (Object.keys(errors).length) throw new ProductError('产品资料不完整，不能上架', 409, errors);
      }
      const timestamp = new Date().toISOString();
      db.prepare('UPDATE products SET status=?, updated_at=?, revision=revision+1 WHERE id=?').run(transition.to, timestamp, productId);
      recordStatus({ productId, from: row.status, to: transition.to, action: transition.action, actor: input.actor || '本机用户', reason, at: timestamp });
      return get(productId);
    })();
  }
  function statusSummary() {
    const counts = Object.fromEntries(PRODUCT_STATUSES.map(status => [status, 0]));
    for (const row of db.prepare('SELECT status, COUNT(*) AS count FROM products GROUP BY status').all()) counts[row.status] = row.count;
    return counts;
  }
  function batchUpdate(input = {}) {
    const ids = [...new Set((Array.isArray(input.ids) ? input.ids : []).map(value => String(value || '').trim()).filter(Boolean))];
    if (!ids.length || ids.length > 100) throw new ProductError('每次批量操作需选择 1–100 个产品', 400, { ids: '选择数量无效' });
    const action = String(input.action || '');
    const actor = input.actor || '本机用户';
    const reason = String(input.reason || '').trim();
    if (action === 'archive' && !reason) throw new ProductError('批量归档必须填写原因', 400, { reason: '请填写归档原因' });
    const succeeded = [], failed = [];
    const categories = categoryList();
    if (action === 'category') {
      const category = categories.find(item => item.id === input.categoryId);
      if (!category) throw new ProductError('目标产品分类不存在', 400, { categoryId: '请选择产品分类' });
      for (const id of ids) {
        const row = db.prepare('SELECT * FROM products WHERE id=?').get(id);
        if (!row) { failed.push({ id, name: '', error: '产品不存在' }); continue; }
        const product = get(id);
        try {
          if (product.status === '归档') throw new ProductError('归档产品只读，不能修改分类', 409);
          if (product.status === '在售') {
            const errors = productIssues({ ...product, categoryId: category.id, status: '在售' }, categories);
            if (Object.keys(errors).length) throw new ProductError(`不满足在售分类条件：${Object.values(errors)[0]}`, 409, errors);
          }
          const details = JSON.parse(row.details_json || '{}');
          details.categoryId = category.id;
          db.prepare('UPDATE products SET category=?,details_json=?,updated_at=?,revision=revision+1 WHERE id=?')
            .run(`${category.category1} / ${category.label}`, JSON.stringify(details), new Date().toISOString(), id);
          succeeded.push(id);
        } catch (error) { failed.push({ id, name: product.name, error: error.message || '分类修改失败' }); }
      }
      return { total: ids.length, updated: succeeded.length, failed, action };
    }
    for (const id of ids) {
      const product = get(id);
      if (!product) { failed.push({ id, name: '', error: '产品不存在' }); continue; }
      try {
        const definition = productTransitionFor(product.status, action);
        if (!definition) throw new ProductError(`当前状态「${product.status}」不支持该操作`, 400);
        transition(id, {
          action,
          expectedStatus: product.status,
          reason: reason || `批量${definition.label}`,
          actor,
        });
        succeeded.push(id);
      } catch (error) { failed.push({ id, name: product.name, error: error.message || '操作失败' }); }
    }
    return { total: ids.length, updated: succeeded.length, failed, action };
  }
  return { get, list, save, importRows, designCatalog,
    categories: categoryList, categoryOverview, updateCategoryMapping, defaultDeviceOptions,
    transition, statusHistory, statusSummary, batchUpdate,
    page(query = {}) {
      const rows = list(query), pageSize = Math.min(100, Math.max(1, Number.parseInt(query.pageSize, 10) || 30));
      const page = Math.min(Math.max(1, Math.ceil(rows.length / pageSize)), Math.max(1, Number.parseInt(query.page, 10) || 1));
      return { products: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pageSize };
    },
    addAsset(a) { db.prepare('INSERT INTO product_assets(id,name,mime,size,sha256,created_at) VALUES (@id,@name,@mime,@size,@sha256,@createdAt)').run(a); return mapAsset(a); },
    getAsset(id) { const a = asset(id); return a ? mapAsset(a) : null; },
    assetBackup() { const used = new Set(list().flatMap(p => p.assets.map(a => a.id))); return db.prepare('SELECT id,name,mime,size,sha256 FROM product_assets').all().filter(a => used.has(a.id)); },
  };
}

export function decodeAsset(input) {
  const name = path.basename(String(input?.name || '')).replace(/[\x00-\x1f]/g, '').slice(0, 150);
  if (!name || typeof input?.base64 !== 'string' || !/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)) fail('附件内容无效');
  const data = Buffer.from(input.base64, 'base64');
  if (!data.length || data.length > 10 * 1024 * 1024) fail('附件需为1字节至10MB');
  const ext = path.extname(name).toLowerCase();
  const checks = {
    '.png': ['image/png', () => data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))],
    '.jpg': ['image/jpeg', () => data[0] === 255 && data[1] === 216 && data[2] === 255],
    '.jpeg': ['image/jpeg', () => data[0] === 255 && data[1] === 216 && data[2] === 255],
    '.webp': ['image/webp', () => data.toString('ascii',0,4) === 'RIFF' && data.toString('ascii',8,12) === 'WEBP'],
    '.pdf': ['application/pdf', () => data.toString('ascii',0,5) === '%PDF-'],
    '.ies': ['text/plain', () => /IES|TILT=/i.test(data.toString('utf8',0,512))],
    '.ldt': ['text/plain', () => !data.subarray(0,512).includes(0) && data.toString('utf8').split(/\r?\n/).length >= 10],
    '.glb': ['model/gltf-binary', () => data.toString('ascii',0,4) === 'glTF'],
  };
  if (!checks[ext] || !checks[ext][1]()) fail('附件类型或文件头无效，仅支持图片、PDF、IES/LDT、GLB');
  return { data, info: { id: randomUUID(), name, mime: checks[ext][0], size: data.length, sha256: createHash('sha256').update(data).digest('hex'), createdAt: new Date().toISOString() } };
}

import fs from 'node:fs';
import path from 'node:path';
import { gzipSync, gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { createProductStore } from './products.mjs';
import { createProjectPayload, normalizeProjectPayload, projectStatusFromTasks, projectView } from './project-model.mjs';
import { createBusinessStore } from './business.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = process.env.QONE_DATA_DIR ? path.resolve(process.env.QONE_DATA_DIR) : path.join(root, 'data', 'local');
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'smart-home-store.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT DEFAULT '',
    source TEXT DEFAULT '门店录入',
    note TEXT DEFAULT '',
    house_type TEXT DEFAULT '',
    address TEXT DEFAULT '',
    family_members TEXT DEFAULT '',
    wechat TEXT DEFAULT '',
    email TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    customer_id TEXT,
    area REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT '待设计',
    scheme_type TEXT DEFAULT '全屋智能',
    updated_at TEXT NOT NULL,
    payload_json TEXT DEFAULT '{}',
    FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
  );
  CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    space TEXT DEFAULT '全屋',
    price REAL DEFAULT 0,
    status TEXT NOT NULL DEFAULT '在售',
    source TEXT NOT NULL DEFAULT '本地录入',
    specs_json TEXT DEFAULT '{}',
    updated_at TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_projects_updated ON projects(updated_at DESC);
  CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
`);

const customerColumns = db.prepare('PRAGMA table_info(customers)').all().map(column => column.name);
for (const [name, type] of [['house_type','TEXT'],['address','TEXT'],['family_members','TEXT'],['wechat','TEXT'],['email','TEXT']]) {
  if (!customerColumns.includes(name)) db.exec(`ALTER TABLE customers ADD COLUMN ${name} ${type} DEFAULT ''`);
}

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

const seed = db.transaction(() => {
  const customerCount = db.prepare('SELECT COUNT(*) AS count FROM customers').get().count;
  if (!customerCount) {
    const insert = db.prepare('INSERT INTO customers (id,name,phone,source,note,created_at,updated_at) VALUES (@id,@name,@phone,@source,@note,@created_at,@updated_at)');
    const t = now();
    insert.run({ id: 'CUS-DEMO-001', name: '王先生', phone: '138****2601', source: '门店到店', note: '大平层，全屋智能方案咨询', created_at: t, updated_at: t });
    insert.run({ id: 'CUS-DEMO-002', name: '李女士', phone: '139****8412', source: '老客转介绍', note: '重点关注灯光与窗帘', created_at: t, updated_at: t });
  }
  const projectCount = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
  if (!projectCount) {
    const insert = db.prepare('INSERT INTO projects (id,name,customer_id,area,status,scheme_type,updated_at,payload_json) VALUES (@id,@name,@customer_id,@area,@status,@scheme_type,@updated_at,@payload_json)');
    const t = now();
    insert.run({ id: 'PRJ-DEMO-001', name: '王先生 · 226㎡大平层', customer_id: 'CUS-DEMO-001', area: 226, status: '方案设计', scheme_type: '全屋智能', updated_at: t, payload_json: '{}' });
    insert.run({ id: 'PRJ-DEMO-002', name: '李女士 · 三室两厅', customer_id: 'CUS-DEMO-002', area: 128, status: '待报价', scheme_type: '灯光智能化', updated_at: t, payload_json: '{}' });
  }
  const productCount = db.prepare('SELECT COUNT(*) AS count FROM products').get().count;
  if (!productCount) {
    const insert = db.prepare('INSERT INTO products (id,sku,name,category,space,price,status,source,specs_json,updated_at) VALUES (@id,@sku,@name,@category,@space,@price,@status,@source,@specs_json,@updated_at)');
    const t = now();
    const rows = [
      ['SKU-LIGHT-001', '磁吸泛光灯 12W', '智能照明', '客厅/餐厅', 699, { watt: 12, lumen: 950, photometry: 'synthetic' }],
      ['SKU-LIGHT-002', '口字灯带 24V', '智能照明', '全屋', 1280, { wattPerMeter: 14, length: 5.6, form: 'rect' }],
      ['SKU-SW-001', '四键智能开关', '智能电工', '全屋', 399, { protocol: 'KNX / 无线 Demo' }],
      ['SKU-CURTAIN-001', '智能窗帘电机套装', '智能遮阳', '客厅/卧室', 1599, { protocol: '无线' }],
      ['SKU-SENSOR-001', '人体存在传感器', '智能感知', '全屋', 329, { mount: 'ceiling' }],
      ['SKU-NET-001', '全屋 Mesh 主路由', '家庭网络', '全屋', 899, { ports: 4, protocol: 'Wi-Fi 7' }],
      ['SKU-NET-002', 'PoE 交换机 8 口', '家庭网络', '弱电箱', 1299, { ports: 8, poe: true }],
      ['SKU-AIR-001', '智能空调伴侣', '智能暖通', '客厅/卧室', 299, { protocol: '无线' }],
    ];
    for (const [sku, name, category, space, price, specs] of rows) {
      insert.run({ id: id('PRD'), sku, name, category, space, price, status: '在售', source: '演示产品目录', specs_json: JSON.stringify(specs), updated_at: t });
    }
  }
});
seed();

// 旧版项目只有一行基础字段。启动时为它们补齐项目阶段数据，同时保留 payload_json
// 中可能已经存在的自定义字段，避免详情页刷新后退回静态演示状态。
const migrateProjectPayloads = db.transaction(() => {
  const rows = db.prepare('SELECT * FROM projects').all();
  const update = db.prepare('UPDATE projects SET status = ?, payload_json = ? WHERE id = ?');
  for (const row of rows) {
    let source = {};
    try { source = JSON.parse(row.payload_json || '{}'); } catch { source = {}; }
    const payload = normalizeProjectPayload(source, row);
    update.run(projectStatusFromTasks(payload.tasks, payload.stages), JSON.stringify(payload), row.id);
  }
});
migrateProjectPayloads();

// 项目阶段 / 任务模板来自“系统设置”。businessStore 在本文件后面才初始化，
// 这里必须惰性读取，不能在模块加载阶段直接取；读取失败时回退到内置模板。
function projectJourneyTemplate() {
  try { return businessStore?.settings?.().projectJourney || null; }
  catch { return null; }
}

function mapCustomer(row) {
  if (!row) return null;
  return {
    ...row,
    houseType: row.house_type || '',
    address: row.address || '',
    familyMembers: row.family_members || '',
    wechat: row.wechat || '',
    email: row.email || '',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function mapProject(row) {
  if (!row) return null;
  let payload = {};
  try { payload = JSON.parse(row.payload_json || '{}'); } catch { payload = {}; }
  const base = { ...row, customerId: row.customer_id, schemeType: row.scheme_type, updatedAt: row.updated_at };
  return projectView(base, payload, projectJourneyTemplate());
}
export const productStore = createProductStore(db);
export const businessStore = createBusinessStore(db, { dataDir, productStore });

export function overview() {
  return {
    customers: db.prepare('SELECT COUNT(*) AS count FROM customers').get().count,
    projects: db.prepare('SELECT COUNT(*) AS count FROM projects').get().count,
    products: db.prepare("SELECT COUNT(*) AS count FROM products WHERE status = '在售'").get().count,
    pendingProjects: db.prepare("SELECT COUNT(*) AS count FROM projects WHERE status <> '已完成'").get().count,
    quotes: db.prepare('SELECT COUNT(*) AS count FROM quotes').get().count,
    designs: db.prepare('SELECT COUNT(*) AS count FROM designs').get().count,
    designVersions: db.prepare('SELECT COUNT(*) AS count FROM design_versions').get().count,
    deliveryPackages: db.prepare('SELECT COUNT(*) AS count FROM delivery_packages').get().count,
    storage: path.join(dataDir, 'smart-home-store.db'),
  };
}

export function listCustomers(search = '') {
  const q = `%${String(search).trim()}%`;
  return db.prepare('SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR address LIKE ? OR family_members LIKE ? ORDER BY updated_at DESC').all(q, q, q, q).map(mapCustomer);
}

export function listCustomersPage(search = '', page = 1, pageSize = 30) {
  const q = `%${String(search).trim()}%`;
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 30)));
  const rows = db.prepare('SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? OR address LIKE ? OR family_members LIKE ? ORDER BY updated_at DESC LIMIT ? OFFSET ?')
    .all(q, q, q, q, safeSize, (safePage - 1) * safeSize);
  return rows.map(mapCustomer);
}

export function countCustomers(search = '') {
  const q = `%${String(search).trim()}%`;
  return db.prepare('SELECT COUNT(*) AS count FROM customers WHERE name LIKE ? OR phone LIKE ? OR address LIKE ? OR family_members LIKE ?').get(q, q, q, q).count;
}

export function createCustomer(input) {
  const t = now();
  const row = {
    id: id('CUS'), name: String(input.name || '').trim(), phone: String(input.phone || '').trim(), source: String(input.source || '门店录入'), note: String(input.note || ''),
    house_type: String(input.houseType || ''), address: String(input.address || ''), family_members: String(input.familyMembers || ''), wechat: String(input.wechat || ''), email: String(input.email || ''),
    created_at: t, updated_at: t,
  };
  if (!row.name) throw new Error('客户姓名不能为空');
  db.prepare('INSERT INTO customers (id,name,phone,source,note,house_type,address,family_members,wechat,email,created_at,updated_at) VALUES (@id,@name,@phone,@source,@note,@house_type,@address,@family_members,@wechat,@email,@created_at,@updated_at)').run(row);
  return mapCustomer(row);
}

export function updateCustomer(customerId, input = {}) {
  const current = db.prepare('SELECT * FROM customers WHERE id=?').get(customerId);
  if (!current) return null;
  const name = String(input.name ?? current.name).trim();
  if (!name) throw new Error('客户姓名不能为空');
  const t = now();
  db.prepare(`UPDATE customers SET name=?,phone=?,source=?,note=?,house_type=?,address=?,family_members=?,wechat=?,email=?,updated_at=? WHERE id=?`)
    .run(
      name,
      String(input.phone ?? current.phone ?? ''),
      String(input.source ?? current.source ?? '门店录入'),
      String(input.note ?? current.note ?? ''),
      String(input.houseType ?? current.house_type ?? ''),
      String(input.address ?? current.address ?? ''),
      String(input.familyMembers ?? current.family_members ?? ''),
      String(input.wechat ?? current.wechat ?? ''),
      String(input.email ?? current.email ?? ''),
      t,
      customerId,
    );
  return mapCustomer(db.prepare('SELECT * FROM customers WHERE id=?').get(customerId));
}

export function listProjects(search = '') {
  const q = `%${String(search).trim()}%`;
  return db.prepare(`SELECT p.*, c.name AS customer_name FROM projects p LEFT JOIN customers c ON c.id = p.customer_id WHERE p.name LIKE ? OR IFNULL(c.name,'') LIKE ? ORDER BY p.updated_at DESC`).all(q, q).map(row => ({ ...mapProject(row), customerName: row.customer_name || '未关联客户' }));
}

export function listProjectsPage(search = '', page = 1, pageSize = 30) {
  const q = `%${String(search).trim()}%`;
  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const safeSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize) || 30)));
  const rows = db.prepare(`SELECT p.*, c.name AS customer_name FROM projects p LEFT JOIN customers c ON c.id = p.customer_id WHERE p.name LIKE ? OR IFNULL(c.name,'') LIKE ? ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`)
    .all(q, q, safeSize, (safePage - 1) * safeSize);
  return rows.map(row => ({ ...mapProject(row), customerName: row.customer_name || '未关联客户' }));
}

export function countProjects(search = '') {
  const q = `%${String(search).trim()}%`;
  return db.prepare(`SELECT COUNT(*) AS count FROM projects p LEFT JOIN customers c ON c.id = p.customer_id WHERE p.name LIKE ? OR IFNULL(c.name,'') LIKE ?`).get(q, q).count;
}

export function getProject(projectId) {
  const row = db.prepare('SELECT p.*, c.name AS customer_name, c.phone AS customer_phone, c.source AS customer_source, c.note AS customer_note FROM projects p LEFT JOIN customers c ON c.id = p.customer_id WHERE p.id = ?').get(projectId);
  if (!row) return null;
  return {
    ...mapProject(row),
    customerName: row.customer_name || '未关联客户',
    customerPhone: row.customer_phone || '',
    customerSource: row.customer_source || '',
    customerNote: row.customer_note || '',
  };
}

export function createProject(input) {
  const t = now();
  const row = { id: id('PRJ'), name: String(input.name || '').trim(), customer_id: input.customerId || null, area: Number(input.area || 0), status: String(input.status || '待设计'), scheme_type: String(input.schemeType || '全屋智能'), updated_at: t, payload_json: '{}' };
  if (!row.name) throw new Error('项目名称不能为空');
  row.payload_json = JSON.stringify(createProjectPayload({ ...row, ...input }, projectJourneyTemplate()));
  db.prepare('INSERT INTO projects (id,name,customer_id,area,status,scheme_type,updated_at,payload_json) VALUES (@id,@name,@customer_id,@area,@status,@scheme_type,@updated_at,@payload_json)').run(row);
  return getProject(row.id);
}

export function copyProject(projectId, input = {}) {
  const current = getProject(projectId);
  if (!current) return null;
  const created = createProject({
    name: String(input.name || `${current.name} · 复制`),
    customerId: input.customerId === undefined ? current.customerId : input.customerId,
    area: current.area,
    schemeType: current.schemeType,
    status: '待设计',
  });
  const template = createProjectPayload(created, projectJourneyTemplate());
  const payload = normalizeProjectPayload({
    ...current.payload,
    // 复制项目按“当前模板”重开阶段任务，而不是沿用源项目的历史阶段；其余项目资料保留。
    stages: template.stages,
    tasks: template.tasks,
    activities: [{ id: `activity-copy-${Date.now().toString(36)}`, time: now(), operator: input.operator || '系统', operatorAccount: input.operatorAccount || '', action: '项目复制', target: current.name, result: '已复制', title: '由历史项目复制', description: `来源项目：${current.name}` }],
  }, created, projectJourneyTemplate());
  db.prepare('UPDATE projects SET payload_json=?,updated_at=? WHERE id=?').run(JSON.stringify(payload), now(), created.id);
  const latest = businessStore.latestDesign(projectId);
  if (latest && input.copyDesign !== false) businessStore.saveDesign(created.id, { name: '复制的设计基线', ruleVersion: latest.ruleVersion, snapshot: latest.snapshot, status: '复制版本' });
  businessStore.audit('project.copy', 'project', created.id, `复制历史项目 ${current.name}`, { sourceProjectId: projectId });
  return getProject(created.id);
}

export function updateProject(projectId, input = {}) {
  const current = getProject(projectId);
  if (!current) return null;
  const t = now();
  let payload = normalizeProjectPayload(current.payload, current, projectJourneyTemplate());
  if (input.payload && typeof input.payload === 'object') payload = normalizeProjectPayload({ ...payload, ...input.payload }, current, projectJourneyTemplate());
  if (input.task?.id) {
    const task = payload.tasks.find(item => item.id === input.task.id);
    if (!task) throw new Error('项目任务不存在');
    const nextDone = input.task.done === true;
    if (task.done !== nextDone) {
      task.done = nextDone;
      payload.activities = [
        {
          id: `activity-${Date.now().toString(36)}-${task.id}`,
          time: t,
          operator: input.operator || task.owner || '系统',
          operatorAccount: input.operatorAccount || '',
          action: '任务流转',
          target: task.title,
          owner: task.owner || '',
          result: nextDone ? '已完成' : '重新打开',
          title: nextDone ? `已完成：${task.title}` : `重新打开：${task.title}`,
          description: `项目阶段任务状态变更，任务负责人：${task.owner || '未分配'}。`,
        },
        ...payload.activities,
      ].slice(0, 30);
    }
  }
  const name = input.name === undefined ? current.name : String(input.name).trim();
  if (!name) throw new Error('项目名称不能为空');
  const customerId = input.customerId === undefined ? current.customerId : (input.customerId || null);
  const area = input.area === undefined ? current.area : Number(input.area || 0);
  const schemeType = input.schemeType === undefined ? current.schemeType : String(input.schemeType || '全屋智能');
  const status = projectStatusFromTasks(payload.tasks, payload.stages);
  db.prepare('UPDATE projects SET name = ?, customer_id = ?, area = ?, status = ?, scheme_type = ?, updated_at = ?, payload_json = ? WHERE id = ?')
    .run(name, customerId, area, status, schemeType, t, JSON.stringify(payload), projectId);
  return getProject(projectId);
}

export function listProducts(query = {}) { return productStore.list(query); }

export function productCategories() {
  return db.prepare('SELECT category, COUNT(*) AS count FROM products GROUP BY category ORDER BY category').all();
}

export function importProducts(items = [], updateExisting = false) { return productStore.importRows(items, updateExisting); }

export function backup(includeAssetData = false) {
  const business = businessStore.snapshot();
  const storeLogo = businessStore.storeProfile().logo;
  const storeLogoPath = storeLogo ? path.join(dataDir, 'store-assets', storeLogo.id) : '';
  return {
    exportedAt: now(),
    version: 'store-v2',
    schema: 'qone-smart-home-offline-backup-v2',
    overview: overview(),
    customers: listCustomers(),
    projects: listProjects(),
    products: listProducts(),
    productAssets: productStore.assetBackup().map(a => ({
      ...a,
      ...(includeAssetData && fs.existsSync(path.join(dataDir, 'product-assets', a.id)) ? { base64: fs.readFileSync(path.join(dataDir, 'product-assets', a.id)).toString('base64') } : {}),
    })),
    projectAttachments: (business.project_attachments || []).map(item => ({ id:item.id, name:item.name, ...(includeAssetData && fs.existsSync(item.local_path) ? { base64:fs.readFileSync(item.local_path).toString('base64') } : {}) })),
    deliveryFiles: (business.delivery_packages || []).map(item => ({ id:item.id, name:item.name, ...(includeAssetData && fs.existsSync(item.local_path) ? { base64:fs.readFileSync(item.local_path).toString('base64') } : {}) })),
    storeLogo: storeLogo ? { ...storeLogo, ...(includeAssetData && fs.existsSync(storeLogoPath) ? { base64:fs.readFileSync(storeLogoPath).toString('base64') } : {}) } : null,
    raw: {
      customers: db.prepare('SELECT * FROM customers').all(),
      projects: db.prepare('SELECT * FROM projects').all(),
      products: db.prepare('SELECT * FROM products').all(),
      product_assets: db.prepare('SELECT * FROM product_assets').all(),
      business,
    },
  };
}

export function createBackupPackage() {
  return gzipSync(Buffer.from(JSON.stringify(backup(true)), 'utf8'), { level: 9 });
}

export function decodeBackupPackage(input = '') {
  if ((!Buffer.isBuffer(input) && typeof input !== 'string') || !input.length) throw new Error('备份包内容为空');
  const buffer = Buffer.isBuffer(input) ? input : Buffer.from(input, 'base64');
  if (buffer.length < 2 || buffer[0] !== 0x1f || buffer[1] !== 0x8b) throw new Error('不是有效的压缩 .shp 备份包');
  if (buffer.length > 300 * 1024 * 1024) throw new Error('备份包超过 300MB 限制');
  return JSON.parse(gunzipSync(buffer).toString('utf8'));
}

export function previewRestore(payload = {}) {
  if (payload.schema !== 'qone-smart-home-offline-backup-v2' || !payload.raw) throw new Error('不是可识别的 QoneHome·智能家电门店管理系统备份');
  return {
    valid: true,
    exportedAt: payload.exportedAt,
    version: payload.version,
    counts: {
      customers: payload.raw.customers?.length || 0,
      projects: payload.raw.projects?.length || 0,
      products: payload.raw.products?.length || 0,
      productAssets: payload.raw.product_assets?.length || 0,
    designs: payload.raw.business?.designs?.length || 0,
      designVersions: payload.raw.business?.design_versions?.length || 0,
      quotes: payload.raw.business?.quotes?.length || 0,
      deliveryPackages: payload.raw.business?.delivery_packages?.length || 0,
      inventory: payload.raw.business?.inventory_stock?.length || 0,
      purchaseOrders: payload.raw.business?.purchase_orders?.length || 0,
      payments: payload.raw.business?.payments?.length || 0,
      floorplanAssists: payload.raw.business?.floorplan_assists?.length || 0,
    },
  };
}

export function restoreBackup(payload = {}) {
  const preview = previewRestore(payload);
  const raw = payload.raw;
  const restoreCore = db.transaction(() => {
    db.prepare('DELETE FROM product_assets').run();
    db.prepare('DELETE FROM products').run();
    db.prepare('DELETE FROM projects').run();
    db.prepare('DELETE FROM customers').run();
    const insertRows = (table, rows) => {
      for (const row of rows || []) {
        const keys = Object.keys(row);
        if (!keys.length) continue;
        db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map(key => row[key]));
      }
    };
    insertRows('customers', raw.customers);
    insertRows('projects', raw.projects);
    insertRows('products', raw.products);
    insertRows('product_assets', raw.product_assets);
  });
  db.pragma('foreign_keys = OFF');
  try {
    restoreCore();
    businessStore.restoreSnapshot(raw.business || {});
  } finally { db.pragma('foreign_keys = ON'); }
  const assetDir = path.join(dataDir, 'product-assets');
  fs.mkdirSync(assetDir, { recursive: true });
  for (const asset of payload.productAssets || []) if (asset.id && asset.base64) fs.writeFileSync(path.join(assetDir, asset.id), Buffer.from(asset.base64, 'base64'));
  const projectAssetDir = path.join(dataDir, 'project-assets');
  const exportsDir = path.join(dataDir, 'exports');
  fs.mkdirSync(projectAssetDir, { recursive:true }); fs.mkdirSync(exportsDir, { recursive:true });
  for (const asset of payload.projectAttachments || []) if (asset.id && asset.base64) fs.writeFileSync(path.join(projectAssetDir, asset.id), Buffer.from(asset.base64, 'base64'));
  for (const file of payload.deliveryFiles || []) if (file.id && file.base64) fs.writeFileSync(path.join(exportsDir, `${file.id}.shp`), Buffer.from(file.base64, 'base64'));
  const storeAssetDir = path.join(dataDir, 'store-assets');
  fs.mkdirSync(storeAssetDir, { recursive: true });
  if (payload.storeLogo?.id && payload.storeLogo.base64) fs.writeFileSync(path.join(storeAssetDir, payload.storeLogo.id), Buffer.from(payload.storeLogo.base64, 'base64'));
  businessStore.audit('backup.restore', 'system', '', `恢复备份 ${payload.exportedAt || ''}`, preview.counts);
  return { ok: true, ...preview, restoredAt: now(), overview: overview() };
}

export { dataDir };

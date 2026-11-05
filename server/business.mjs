import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { decodeAsset } from './products.mjs';
import { DEFAULT_PROJECT_JOURNEY, normalizeJourneyConfig, PROJECT_STATUS_FLOW } from './project-model.mjs';

const now = () => new Date().toISOString();
const uid = prefix => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
const parse = (value, fallback = {}) => {
  try { return JSON.parse(value || ''); } catch { return fallback; }
};
const json = value => JSON.stringify(value ?? {});
const number = (value, fallback = 0) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const pinHash = (account, pin) => createHash('sha256').update(`qone-offline-v1:${String(account).toLowerCase()}:${pin}`).digest('hex');

export const CAPABILITY_DOMAINS = [
  { key: 'marketing', name: '营销工具', features: ['快速报价', '智能报价', '手动报价', '报价模板库'] },
  { key: 'projects', name: '项目管理', features: ['客户信息', '我的项目', '方案详情', '销售状态', '施工进度'] },
  { key: 'products', name: '设备库', features: ['店铺设备库', '平台设备库（离线镜像）', '本地设备导入/导出', '品牌/平台/类别筛选', '价格与详情'] },
  { key: 'design', name: '方案设计', features: ['户型图', '设备总览', '智能点位', '灯光交底', '水电交底', '网络布线', '木工交底'] },
  { key: 'store', name: '店铺管理', features: ['店铺信息', '员工账号', '角色权限'] },
  { key: 'settings', name: '全部设置', features: ['服务费', '默认设备（按45类物品编码）', '项目阶段与任务', '施工进度', '注意事项', '项目配置', '备份恢复'] },
];

const DEFAULT_SETTINGS = {
  serviceFees: [
    { key: 'design', name: '方案设计费', mode: 'fixed', value: 3000, enabled: true },
    { key: 'construction', name: '施工调试费', mode: 'percent', value: 8, enabled: true },
    { key: 'service', name: '门店服务费', mode: 'percent', value: 3, enabled: true },
  ],
  defaultDevices: {
    lighting: '自动选择同分类在售产品', control: '优先推荐控制面板', network: '自动加入全屋网络基础包', curtain: '按窗帘位选择电机与轨道',
  },
  defaultDeviceModels: {},
  constructionStages: ['方案设计', '水电交底', '水电验收', '木工交底', '木工验收', '设备安装', '入场调试', '服务完成'],
  constructionNotes: [
    '所有点位以设计版本和现场复核结果为准。',
    '模拟尺寸、IES/LDT 和配光数据不得直接用于正式施工验收。',
    '网络、照明和窗帘回路施工前需核对供电、负载和控制协议。',
  ],
  projectConfig: { currency: 'CNY', taxRate: 13, quoteValidityDays: 30, allowNegativeMargin: false, requireDesignVersionBeforeQuote: false },
  // 项目阶段 / 任务 / 负责角色模板，新项目建档时按此生成阶段任务。
  projectJourney: DEFAULT_PROJECT_JOURNEY,
};

function quoteProduct(row) {
  if (!row) return null;
  const data = { ...parse(row.specs_json, {}), ...parse(row.details_json, {}) };
  return {
    id: row.id, sku: row.sku, name: row.name, category: row.category, price: row.price == null ? number(data.salePrice ?? data.retailPrice, 0) : number(row.price),
    unit: data.salesUnit || '件', brand: data.brand || '', model: data.model || '', status: row.status,
    source: row.source, isSimulated: Boolean(data.isSimulated), productSnapshot: data,
  };
}

function extractDesignSummary(snapshot = {}) {
  const furniture = Array.isArray(snapshot.furniture) ? snapshot.furniture : [];
  const devices = furniture.filter(item => String(item.type || '').startsWith('dev:'));
  const placed = devices.filter(item => ['placed', 'fallback', 'adjusted'].includes(item.smart?.status)).length;
  const pending = devices.filter(item => item.smart?.status === 'pending').length;
  const locked = devices.filter(item => item.smart?.locked).length;
  return {
    furniture: furniture.length - devices.length,
    devices: devices.length,
    placed,
    pending,
    locked,
    zones: Array.isArray(snapshot.zones) ? snapshot.zones.length : 0,
    circuits: new Set(devices.map(item => item.smart?.lighting?.circuitId || item.smart?.circuitId).filter(Boolean)).size,
  };
}

function csvCell(value) { return `"${String(value ?? '').replaceAll('"', '""')}"`; }

export function createBusinessStore(db, { dataDir, productStore }) {
  const exportsDir = path.join(dataDir, 'exports');
  const projectAssetDir = path.join(dataDir, 'project-assets');
  const storeAssetDir = path.join(dataDir, 'store-assets');
  fs.mkdirSync(exportsDir, { recursive: true });
  fs.mkdirSync(projectAssetDir, { recursive: true });
  fs.mkdirSync(storeAssetDir, { recursive: true });
  let activeActor = '本机用户 · admin';
  const safeAssetId = id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));

  db.exec(`
    CREATE TABLE IF NOT EXISTS store_profile (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, code TEXT DEFAULT '', phone TEXT DEFAULT '', address TEXT DEFAULT '',
      contact_name TEXT DEFAULT '', license_no TEXT DEFAULT '', payload_json TEXT DEFAULT '{}', updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE, permissions_json TEXT NOT NULL DEFAULT '[]', description TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS store_users (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, account TEXT NOT NULL UNIQUE, phone TEXT DEFAULT '', role_id TEXT,
      status TEXT NOT NULL DEFAULT '启用', pin_hash TEXT DEFAULT '', last_login_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      FOREIGN KEY(role_id) REFERENCES roles(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY, value_json TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, actor TEXT NOT NULL, action TEXT NOT NULL, target_type TEXT DEFAULT '', target_id TEXT DEFAULT '',
      summary TEXT DEFAULT '', payload_json TEXT DEFAULT '{}', created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS designs (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, project_id TEXT, customer_id TEXT,
      status TEXT NOT NULL DEFAULT '设计中', rule_version TEXT NOT NULL DEFAULT '2026-10-21-V1',
      latest_version_no INTEGER NOT NULL DEFAULT 0, summary_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS design_versions (
      id TEXT PRIMARY KEY, design_id TEXT NOT NULL, project_id TEXT, version_no INTEGER NOT NULL, name TEXT NOT NULL, rule_version TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '已保存', snapshot_json TEXT NOT NULL, summary_json TEXT NOT NULL, created_at TEXT NOT NULL,
      UNIQUE(design_id, version_no),
      FOREIGN KEY(design_id) REFERENCES designs(id) ON DELETE CASCADE,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS quote_templates (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, scheme_type TEXT NOT NULL, description TEXT DEFAULT '', lines_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '启用', updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS quotes (
      id TEXT PRIMARY KEY, project_id TEXT, customer_id TEXT, quote_no TEXT NOT NULL UNIQUE, version_no INTEGER NOT NULL, name TEXT NOT NULL, mode TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT '草稿', design_version_id TEXT, subtotal REAL NOT NULL DEFAULT 0, fee_total REAL NOT NULL DEFAULT 0,
      discount REAL NOT NULL DEFAULT 100, total REAL NOT NULL DEFAULT 0, confirmed_by TEXT DEFAULT '', confirmed_at TEXT,
      voided_by TEXT DEFAULT '', voided_at TEXT, void_reason TEXT DEFAULT '', payload_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
      UNIQUE(project_id, version_no), FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
      FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS quote_status_history (
      id TEXT PRIMARY KEY, quote_id TEXT NOT NULL, from_status TEXT NOT NULL, to_status TEXT NOT NULL,
      action TEXT NOT NULL, actor TEXT NOT NULL, reason TEXT DEFAULT '', created_at TEXT NOT NULL,
      FOREIGN KEY(quote_id) REFERENCES quotes(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS project_attachments (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, name TEXT NOT NULL, mime TEXT NOT NULL, size INTEGER NOT NULL,
      local_path TEXT NOT NULL, category TEXT NOT NULL DEFAULT '现场资料', created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS delivery_packages (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, design_version_id TEXT, quote_id TEXT, name TEXT NOT NULL,
      status TEXT NOT NULL, manifest_json TEXT NOT NULL, local_path TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS project_status_history (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, status TEXT NOT NULL, note TEXT DEFAULT '', actor TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS inventory_stock (
      product_id TEXT PRIMARY KEY, quantity REAL NOT NULL DEFAULT 0, safety_stock REAL NOT NULL DEFAULT 2,
      updated_at TEXT NOT NULL, FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS purchase_orders (
      id TEXT PRIMARY KEY, supplier TEXT NOT NULL, status TEXT NOT NULL DEFAULT '草稿', total REAL NOT NULL DEFAULT 0,
      items_json TEXT NOT NULL DEFAULT '[]', note TEXT DEFAULT '', created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, quote_id TEXT, amount REAL NOT NULL, method TEXT NOT NULL,
      note TEXT DEFAULT '', paid_at TEXT NOT NULL, created_at TEXT NOT NULL,
      FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS floorplan_assists (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, file_name TEXT NOT NULL, image_width INTEGER NOT NULL DEFAULT 0,
      image_height INTEGER NOT NULL DEFAULT 0, method TEXT NOT NULL, confidence REAL NOT NULL DEFAULT 0,
      rooms_json TEXT NOT NULL DEFAULT '[]', warnings_json TEXT NOT NULL DEFAULT '[]', status TEXT NOT NULL DEFAULT '待复核',
      created_at TEXT NOT NULL, FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_design_project ON design_versions(project_id, version_no DESC);
    CREATE INDEX IF NOT EXISTS idx_designs_project ON designs(project_id);
    CREATE INDEX IF NOT EXISTS idx_designs_updated ON designs(updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_quote_project ON quotes(project_id, version_no DESC);
    CREATE INDEX IF NOT EXISTS idx_quote_status_history ON quote_status_history(quote_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_payment_project ON payments(project_id, paid_at DESC);
    CREATE INDEX IF NOT EXISTS idx_floorplan_assist_project ON floorplan_assists(project_id, created_at DESC);
  `);
  const userColumns = db.prepare('PRAGMA table_info(store_users)').all().map(column => column.name);
  if (!userColumns.includes('pin_hash')) db.exec("ALTER TABLE store_users ADD COLUMN pin_hash TEXT DEFAULT ''");
  const quoteColumns = db.prepare('PRAGMA table_info(quotes)').all();
  const quoteProjectColumn = quoteColumns.find(column => column.name === 'project_id');
  const needsQuoteMigration = Boolean(quoteProjectColumn?.notnull) || !quoteColumns.some(column => column.name === 'customer_id') || !quoteColumns.some(column => column.name === 'quote_no');
  if (needsQuoteMigration) {
    db.pragma('foreign_keys = OFF');
    db.transaction(() => {
      db.exec(`
        CREATE TABLE quotes_next (
          id TEXT PRIMARY KEY, project_id TEXT, customer_id TEXT, quote_no TEXT NOT NULL UNIQUE, version_no INTEGER NOT NULL, name TEXT NOT NULL, mode TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT '草稿', design_version_id TEXT, subtotal REAL NOT NULL DEFAULT 0, fee_total REAL NOT NULL DEFAULT 0,
          discount REAL NOT NULL DEFAULT 100, total REAL NOT NULL DEFAULT 0, payload_json TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL,
          UNIQUE(project_id, version_no), FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE SET NULL,
          FOREIGN KEY(customer_id) REFERENCES customers(id) ON DELETE SET NULL
        );
        INSERT INTO quotes_next (id,project_id,customer_id,quote_no,version_no,name,mode,status,design_version_id,subtotal,fee_total,discount,total,payload_json,created_at,updated_at)
          SELECT id,NULLIF(project_id,''),NULL,id,version_no,name,mode,status,design_version_id,subtotal,fee_total,discount,total,payload_json,created_at,updated_at FROM quotes;
        DROP TABLE quotes;
        ALTER TABLE quotes_next RENAME TO quotes;
        CREATE INDEX IF NOT EXISTS idx_quote_project ON quotes(project_id, version_no DESC);
      `);
    })();
    db.pragma('foreign_keys = ON');
  }
  const quoteColumnsAfterMigration = db.prepare('PRAGMA table_info(quotes)').all().map(column => column.name);
  for (const [name, type] of [['confirmed_by','TEXT'],['confirmed_at','TEXT'],['voided_by','TEXT'],['voided_at','TEXT'],['void_reason','TEXT']]) {
    if (!quoteColumnsAfterMigration.includes(name)) db.exec(`ALTER TABLE quotes ADD COLUMN ${name} ${type}`);
  }
  db.prepare(`INSERT OR IGNORE INTO quote_status_history (id,quote_id,from_status,to_status,action,actor,reason,created_at)
    SELECT 'QSH-LEGACY-' || id,id,'','草稿','create','系统初始化','历史报价迁移',created_at
    FROM quotes q WHERE NOT EXISTS (SELECT 1 FROM quote_status_history h WHERE h.quote_id=q.id)`).run();

  // 设计方案是独立对象，设计版本归属方案；旧版每个项目只隐式拥有一个方案。
  // 迁移时按项目补齐 designs 行，并把 project_id 从“所有版本共用一个项目”改为“方案可选关联项目”。
  let designSchemaMigrated = false;
  const designVersionColumns = db.prepare('PRAGMA table_info(design_versions)').all();
  const designProjectColumn = designVersionColumns.find(column => column.name === 'project_id');
  if (!designVersionColumns.some(column => column.name === 'design_id') || designProjectColumn?.notnull) {
    designSchemaMigrated = true;
    db.pragma('foreign_keys = OFF');
    try {
      db.transaction(() => {
        db.exec('DROP TABLE IF EXISTS design_versions_next');
        db.exec(`CREATE TABLE design_versions_next (
          id TEXT PRIMARY KEY, design_id TEXT NOT NULL, project_id TEXT, version_no INTEGER NOT NULL,
          name TEXT NOT NULL, rule_version TEXT NOT NULL, status TEXT NOT NULL DEFAULT '已保存',
          snapshot_json TEXT NOT NULL, summary_json TEXT NOT NULL, created_at TEXT NOT NULL,
          UNIQUE(design_id, version_no),
          FOREIGN KEY(design_id) REFERENCES designs(id) ON DELETE CASCADE,
          FOREIGN KEY(project_id) REFERENCES projects(id) ON DELETE CASCADE
        )`);
        const projectIds = db.prepare('SELECT DISTINCT project_id FROM design_versions WHERE project_id IS NOT NULL').all().map(row => row.project_id);
        const insertDesign = db.prepare('INSERT INTO designs (id,name,project_id,customer_id,status,rule_version,latest_version_no,summary_json,created_at,updated_at) VALUES (?,?,?,?,?,?,0,?,?,?)');
        const designIds = new Map();
        for (const projectId of projectIds) {
          const existing = db.prepare('SELECT id FROM designs WHERE project_id=? ORDER BY created_at ASC LIMIT 1').get(projectId);
          let designId = existing?.id;
          if (!designId) {
            const project = db.prepare('SELECT name, customer_id FROM projects WHERE id=?').get(projectId);
            designId = `DSN-${projectId}`;
            const t = now();
            insertDesign.run(designId, `${project?.name || projectId} · 设计方案`, projectId, project?.customer_id || null, '设计中', '2026-10-21-V1', '{}', t, t);
          }
          designIds.set(projectId, designId);
        }
        const rows = db.prepare('SELECT * FROM design_versions').all();
        const insertVersion = db.prepare('INSERT INTO design_versions_next (id,design_id,project_id,version_no,name,rule_version,status,snapshot_json,summary_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
        for (const row of rows) {
          const designId = row.design_id || designIds.get(row.project_id) || `DSN-${row.project_id}`;
          insertVersion.run(row.id, designId, row.project_id || null, row.version_no, row.name, row.rule_version, row.status, row.snapshot_json, row.summary_json, row.created_at);
        }
        db.exec('DROP TABLE design_versions');
        db.exec('ALTER TABLE design_versions_next RENAME TO design_versions');
        db.exec('CREATE INDEX IF NOT EXISTS idx_design_project ON design_versions(project_id, version_no DESC)');
        db.exec('CREATE INDEX IF NOT EXISTS idx_design_version_design ON design_versions(design_id, version_no DESC)');
      })();
    } finally {
      db.pragma('foreign_keys = ON');
    }
  }
  if (designSchemaMigrated) {
    const latestByDesign = db.prepare('SELECT * FROM design_versions WHERE design_id=? ORDER BY version_no DESC LIMIT 1');
    const updateDesign = db.prepare('UPDATE designs SET latest_version_no=?, summary_json=?, rule_version=?, updated_at=? WHERE id=?');
    for (const design of db.prepare('SELECT id FROM designs').all()) {
      const latest = latestByDesign.get(design.id);
      if (latest) updateDesign.run(latest.version_no, latest.summary_json, latest.rule_version, latest.created_at, design.id);
    }
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_design_version_design ON design_versions(design_id, version_no DESC)');

  const seed = db.transaction(() => {
    if (!db.prepare('SELECT 1 FROM store_profile LIMIT 1').get()) {
      db.prepare('INSERT INTO store_profile (id,name,code,phone,address,contact_name,license_no,payload_json,updated_at) VALUES (?,?,?,?,?,?,?,?,?)')
        .run('STORE-001', 'Qone 智能家居体验店', 'QONE-SH-001', '021-6688 8899', '上海市演示路 88 号', '门店负责人', 'DEMO-OFFLINE', json({ businessHours: '09:00-18:00', mode: 'offline-demo' }), now());
    }
    const roles = [
      ['ROLE-ADMIN', '门店管理员', ['*'], '拥有本机全部业务权限'],
      ['ROLE-DESIGNER', '方案设计师', ['project.read', 'project.write', 'design.write', 'quote.read', 'product.read', 'delivery.read', 'operations.read'], '负责方案设计与交付'],
      ['ROLE-SALES', '销售顾问', ['customer.write', 'project.write', 'quote.write', 'product.read', 'operations.read', 'payment.write'], '负责客户、项目、报价和收款登记'],
      ['ROLE-INSTALLER', '施工人员', ['project.read', 'delivery.read'], '只读查看施工交付资料'],
    ];
    const insertRole = db.prepare('INSERT OR IGNORE INTO roles (id,name,permissions_json,description) VALUES (?,?,?,?)');
    roles.forEach(role => insertRole.run(role[0], role[1], json(role[2]), role[3]));
    for (const role of roles) {
      const current = db.prepare('SELECT permissions_json FROM roles WHERE id=?').get(role[0]);
      const permissions = [...new Set([...parse(current?.permissions_json, []), ...role[2]])];
      db.prepare('UPDATE roles SET permissions_json=? WHERE id=?').run(json(permissions), role[0]);
    }
    if (!db.prepare('SELECT 1 FROM store_users LIMIT 1').get()) {
      const t = now();
      const insert = db.prepare('INSERT INTO store_users (id,name,account,phone,role_id,status,pin_hash,last_login_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)');
      insert.run('USR-ADMIN', '门店管理员', 'admin', '13800000001', 'ROLE-ADMIN', '启用', pinHash('admin','0000'), t, t, t);
      insert.run('USR-DESIGN', '演示设计师', 'designer', '13800000002', 'ROLE-DESIGNER', '启用', pinHash('designer','0000'), null, t, t);
      insert.run('USR-SALES', '演示顾问', 'sales', '13800000003', 'ROLE-SALES', '启用', pinHash('sales','0000'), null, t, t);
    }
    db.prepare("UPDATE store_users SET pin_hash=? WHERE account='admin' AND (pin_hash IS NULL OR pin_hash='')").run(pinHash('admin','0000'));
    db.prepare("UPDATE store_users SET pin_hash=? WHERE account='designer' AND (pin_hash IS NULL OR pin_hash='')").run(pinHash('designer','0000'));
    db.prepare("UPDATE store_users SET pin_hash=? WHERE account='sales' AND (pin_hash IS NULL OR pin_hash='')").run(pinHash('sales','0000'));
    const setting = db.prepare('INSERT OR IGNORE INTO system_settings (key,value_json,updated_at) VALUES (?,?,?)');
    Object.entries(DEFAULT_SETTINGS).forEach(([key, value]) => setting.run(key, json(value), now()));
    if (!db.prepare('SELECT 1 FROM quote_templates LIMIT 1').get()) {
      const insert = db.prepare('INSERT INTO quote_templates (id,name,scheme_type,description,lines_json,status,updated_at) VALUES (?,?,?,?,?,?,?)');
      insert.run('TPL-WHOLE', '全屋智能基础模板', '全屋智能', '灯光、控制、窗帘、环境和网络基础包', json([
        { category: '灯光', formula: 'ceil(area/12)', label: '基础照明' },
        { category: '控制', formula: 'ceil(area/25)', label: '控制面板' },
        { category: '窗帘', formula: 'area>=160?6:4', label: '窗帘电机' },
        { category: '传感器', formula: 'ceil(area/35)', label: '环境感知' },
        { category: '网络', formula: 'area>=160?6:4', label: '全屋网络基础包' },
      ]), '启用', now());
      insert.run('TPL-LIGHT', '智能灯光模板', '灯光智能化', '照明、控制面板与传感器', json([
        { category: '灯光', formula: 'ceil(area/10)', label: '灯光设备' },
        { category: '控制', formula: 'ceil(area/22)', label: '控制面板' },
        { category: '传感器', formula: 'ceil(area/40)', label: '环境感知' },
      ]), '启用', now());
    }
  });
  seed();

  function audit(action, targetType = '', targetId = '', summary = '', payload = {}) {
    db.prepare('INSERT INTO audit_logs (id,actor,action,target_type,target_id,summary,payload_json,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(uid('LOG'), activeActor, action, targetType, targetId, summary, json(payload), now());
  }

  function capabilities() {
    return CAPABILITY_DOMAINS.map(domain => ({ ...domain, status: 'available', offline: true }));
  }

  function storeProfile() {
    const row = db.prepare('SELECT * FROM store_profile LIMIT 1').get();
    const payload = parse(row.payload_json);
    const logo = payload.logo?.id && safeAssetId(payload.logo.id) ? {
      id: payload.logo.id,
      name: payload.logo.name || '门店 LOGO',
      mime: payload.logo.mime || '',
      size: number(payload.logo.size),
      updatedAt: payload.logo.updatedAt || '',
      url: `/api/admin/store/logo?v=${encodeURIComponent(payload.logo.id)}`,
    } : null;
    return { ...row, contactName: row.contact_name, licenseNo: row.license_no, payload, logo, logoUrl: logo?.url || '', updatedAt: row.updated_at };
  }

  // 门店 LOGO 会作为系统品牌标识出现在登录页、后台侧栏和浏览器标签。
  // 图片本体放在本机数据目录，store_profile.payload_json 只记录可审计的元数据。
  function saveStoreLogo(input = {}) {
    const { data, info } = decodeAsset(input);
    if (!String(info.mime).startsWith('image/')) throw new Error('门店 LOGO 仅支持 PNG / JPG / WebP 图片');
    if (data.length > 2 * 1024 * 1024) throw new Error('门店 LOGO 图片需小于 2MB');
    fs.mkdirSync(storeAssetDir, { recursive: true });
    fs.writeFileSync(path.join(storeAssetDir, info.id), data, { flag: 'wx' });
    const current = storeProfile();
    const nextPayload = {
      ...current.payload,
      logo: { id: info.id, name: info.name, mime: info.mime, size: info.size, sha256: info.sha256, updatedAt: now() },
    };
    db.prepare('UPDATE store_profile SET payload_json=?, updated_at=? WHERE id=?')
      .run(json(nextPayload), now(), current.id);
    audit('store.logo.update', 'store', current.id, `更新门店 LOGO ${info.name}`, { size: info.size, mime: info.mime, previous: current.logo?.id || '' });
    return storeProfile();
  }

  function removeStoreLogo() {
    const current = storeProfile();
    if (!current.logo) return current;
    const nextPayload = { ...current.payload };
    delete nextPayload.logo;
    db.prepare('UPDATE store_profile SET payload_json=?, updated_at=? WHERE id=?')
      .run(json(nextPayload), now(), current.id);
    audit('store.logo.remove', 'store', current.id, '移除门店 LOGO', { previous: current.logo.id });
    return storeProfile();
  }

  function storeLogoFile() {
    const logo = storeProfile().logo;
    if (!logo) return null;
    const file = path.join(storeAssetDir, logo.id);
    if (path.dirname(file) !== storeAssetDir) return null;
    if (!fs.existsSync(file)) return null;
    return { path: file, mime: logo.mime, name: logo.name };
  }

  function branding() {
    const current = storeProfile();
    return { storeName: current.name, storeCode: current.code, logoUrl: current.logoUrl, logo: current.logo };
  }

  function updateStore(input = {}) {
    const current = storeProfile();
    const incomingPayload = input.payload && typeof input.payload === 'object' ? { ...input.payload } : null;
    // LOGO 元数据只允许由 store.logo 上传/移除接口维护，避免通过普通资料保存写入任意文件 id。
    if (incomingPayload) delete incomingPayload.logo;
    const next = {
      name: String(input.name ?? current.name).trim(), code: String(input.code ?? current.code).trim(), phone: String(input.phone ?? current.phone).trim(),
      address: String(input.address ?? current.address).trim(), contactName: String(input.contactName ?? current.contactName).trim(), licenseNo: String(input.licenseNo ?? current.licenseNo).trim(),
      payload: incomingPayload ? { ...current.payload, ...incomingPayload } : current.payload,
    };
    if (!next.name) throw new Error('门店名称不能为空');
    db.prepare('UPDATE store_profile SET name=?,code=?,phone=?,address=?,contact_name=?,license_no=?,payload_json=?,updated_at=? WHERE id=?')
      .run(next.name, next.code, next.phone, next.address, next.contactName, next.licenseNo, json(next.payload), now(), current.id);
    audit('store.update', 'store', current.id, '更新门店资料');
    return storeProfile();
  }

  function roles() {
    return db.prepare('SELECT * FROM roles ORDER BY name').all().map(row => ({ ...row, permissions: parse(row.permissions_json, []) }));
  }

  function saveRole(input = {}, roleId = '') {
    const current = roleId ? db.prepare('SELECT * FROM roles WHERE id=?').get(roleId) : null;
    if (roleId && !current) throw new Error('角色不存在');
    if (roleId === 'ROLE-ADMIN') throw new Error('门店管理员为系统内置角色，不能修改');
    const name = String(input.name ?? current?.name ?? '').trim();
    const description = String(input.description ?? current?.description ?? '').trim();
    const permissions = Array.isArray(input.permissions) ? [...new Set(input.permissions.map(item => String(item).trim()).filter(Boolean))] : parse(current?.permissions_json, []);
    if (!name) throw new Error('角色名称不能为空');
    if (!permissions.length) throw new Error('角色至少需要一项权限');
    const id = current?.id || uid('ROLE');
    try {
      if (current) db.prepare('UPDATE roles SET name=?,permissions_json=?,description=? WHERE id=?').run(name, json(permissions), description, id);
      else db.prepare('INSERT INTO roles (id,name,permissions_json,description) VALUES (?,?,?,?)').run(id, name, json(permissions), description);
    }
    catch (error) { if (String(error.message).includes('UNIQUE')) throw new Error('角色名称已存在'); throw error; }
    audit(current ? 'role.update' : 'role.create', 'role', id, `${current ? '更新' : '新增'}角色 ${name}`, { permissions });
    return roles().find(item => item.id === id);
  }

  function deleteRole(roleId) {
    const current = db.prepare('SELECT * FROM roles WHERE id=?').get(roleId);
    if (!current) throw new Error('角色不存在');
    if (roleId === 'ROLE-ADMIN') throw new Error('门店管理员角色不能删除');
    const userCount = db.prepare('SELECT COUNT(*) AS count FROM store_users WHERE role_id=?').get(roleId).count;
    if (userCount > 0) throw new Error(`该角色仍被 ${userCount} 个员工使用，不能删除`);
    db.prepare('DELETE FROM roles WHERE id=?').run(roleId);
    audit('role.delete', 'role', roleId, `删除角色 ${current.name}`);
    return { deleted:true, id:roleId };
  }

  function users() {
    return db.prepare('SELECT u.*, r.name AS role_name FROM store_users u LEFT JOIN roles r ON r.id=u.role_id ORDER BY u.created_at').all()
      .map(row => {
        const { pin_hash: _pinHash, ...safe } = row;
        return { ...safe, roleId: row.role_id, roleName: row.role_name || '未分配', lastLoginAt: row.last_login_at, createdAt: row.created_at, updatedAt: row.updated_at };
      });
  }

  function login(account, pin) {
    const row = db.prepare('SELECT u.*,r.name AS role_name,r.permissions_json FROM store_users u LEFT JOIN roles r ON r.id=u.role_id WHERE u.account=? COLLATE NOCASE').get(String(account || '').trim());
    if (!row || row.status !== '启用' || row.pin_hash !== pinHash(row.account, String(pin || ''))) throw new Error('账号或 PIN 不正确，或账号已停用');
    const t = now();
    db.prepare('UPDATE store_users SET last_login_at=?,updated_at=? WHERE id=?').run(t, t, row.id);
    activeActor = `${row.name} · ${row.account}`;
    audit('session.login', 'user', row.id, `${row.name} 登录本机门店系统`);
    return { id: row.id, name: row.name, account: row.account, roleId: row.role_id, roleName: row.role_name, permissions: parse(row.permissions_json, []), loggedInAt: t };
  }

  function saveUser(input = {}, userId = '') {
    const t = now();
    const current = userId ? db.prepare('SELECT * FROM store_users WHERE id=?').get(userId) : null;
    const row = {
      id: current?.id || uid('USR'), name: String(input.name ?? current?.name ?? '').trim(), account: String(input.account ?? current?.account ?? '').trim(),
      phone: String(input.phone ?? current?.phone ?? '').trim(), roleId: input.roleId ?? current?.role_id ?? 'ROLE-SALES', status: input.status ?? current?.status ?? '启用',
      pin: String(input.pin || ''),
    };
    if (!row.name || !row.account) throw new Error('员工姓名和账号不能为空');
    if (row.pin && !/^\d{4}$/.test(row.pin)) throw new Error('PIN 必须是 4 位数字');
    if (!db.prepare('SELECT 1 FROM roles WHERE id=?').get(row.roleId)) throw new Error('角色不存在');
    if (current && current.account.toLowerCase() !== row.account.toLowerCase() && !row.pin) throw new Error('修改登录账号需要同时设置新的 4 位 PIN');
    try {
      if (current) db.prepare('UPDATE store_users SET name=?,account=?,phone=?,role_id=?,status=?,pin_hash=?,updated_at=? WHERE id=?').run(row.name, row.account, row.phone, row.roleId, row.status, row.pin ? pinHash(row.account,row.pin) : current.pin_hash, t, row.id);
      else db.prepare('INSERT INTO store_users (id,name,account,phone,role_id,status,pin_hash,last_login_at,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(row.id, row.name, row.account, row.phone, row.roleId, row.status, pinHash(row.account,row.pin || '0000'), null, t, t);
    } catch (error) {
      if (String(error.message).includes('UNIQUE')) throw new Error('员工账号已存在');
      throw error;
    }
    audit(current ? 'user.update' : 'user.create', 'user', row.id, `${current ? '更新' : '新增'}员工 ${row.name}`);
    return users().find(item => item.id === row.id);
  }

  function deleteUser(userId, actorUserId = '') {
    const current = db.prepare('SELECT * FROM store_users WHERE id=?').get(userId);
    if (!current) throw new Error('员工不存在');
    if (userId === actorUserId) throw new Error('不能删除当前登录账号');
    if (current.role_id === 'ROLE-ADMIN') {
      const adminCount = db.prepare("SELECT COUNT(*) AS count FROM store_users WHERE role_id='ROLE-ADMIN'").get().count;
      if (adminCount <= 1) throw new Error('至少需要保留一个门店管理员账号');
    }
    db.prepare('DELETE FROM store_users WHERE id=?').run(userId);
    audit('user.delete', 'user', userId, `删除员工 ${current.name}`);
    return { deleted:true, id:userId };
  }

  function settings() {
    const result = {};
    for (const row of db.prepare('SELECT * FROM system_settings').all()) result[row.key] = parse(row.value_json, null);
    return {
      ...DEFAULT_SETTINGS,
      ...result,
      projectJourney: normalizeJourneyConfig(result.projectJourney || DEFAULT_SETTINGS.projectJourney),
    };
  }

  function updateSettings(input = {}) {
    const next = { ...input };
    // 阶段任务模板只接受结构化配置，避免把空数组或半截表单写进设置。
    if (Object.prototype.hasOwnProperty.call(next, 'projectJourney')) next.projectJourney = normalizeJourneyConfig(next.projectJourney, { strict: true });
    const upsert = db.prepare('INSERT INTO system_settings (key,value_json,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at');
    const transaction = db.transaction(() => Object.entries(next).forEach(([key, value]) => upsert.run(key, json(value), now())));
    transaction();
    audit('settings.update', 'settings', '', `更新 ${Object.keys(next).join('、')}`);
    return settings();
  }

  // 项目阶段与任务模板单独读写：页面需要同时拿到默认模板、状态字典和受影响的项目数。
  function projectJourney() {
    const row = db.prepare("SELECT value_json FROM system_settings WHERE key='projectJourney'").get();
    const total = db.prepare('SELECT COUNT(*) AS count FROM projects').get().count;
    const active = db.prepare("SELECT COUNT(*) AS count FROM projects WHERE status <> '已完成'").get().count;
    return {
      journey: normalizeJourneyConfig(parse(row?.value_json, null)),
      defaults: normalizeJourneyConfig(null),
      statuses: PROJECT_STATUS_FLOW,
      projects: { total, active },
    };
  }

  function updateProjectJourney(input = {}) {
    const journey = normalizeJourneyConfig(input, { strict: true });
    const taskCount = journey.stages.reduce((sum, stage) => sum + stage.tasks.length, 0);
    db.prepare('INSERT INTO system_settings (key,value_json,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET value_json=excluded.value_json,updated_at=excluded.updated_at')
      .run('projectJourney', json(journey), now());
    audit('settings.update', 'settings', 'projectJourney', `更新项目阶段与任务：${journey.stages.length} 个阶段 / ${taskCount} 项任务`);
    return projectJourney();
  }

  function auditLogs(limit = 100) {
    return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(Math.min(300, Math.max(1, number(limit, 100))))
      .map(row => ({ ...row, payload: parse(row.payload_json), createdAt: row.created_at, targetType: row.target_type, targetId: row.target_id }));
  }

  const DESIGN_STATUSES = ['设计中', '已定稿', '已归档'];
  function mapDesignVersion(row) {
    return {
      id: row.id, designId: row.design_id, designName: row.design_name || '', projectId: row.project_id || '',
      versionNo: row.version_no, name: row.name, ruleVersion: row.rule_version, status: row.status,
      summary: parse(row.summary_json), createdAt: row.created_at,
    };
  }
  function mapDesign(row) {
    if (!row) return null;
    return {
      id: row.id, name: row.name, projectId: row.project_id || '', projectName: row.project_name || '',
      customerId: row.customer_id || '', customerName: row.customer_name || '',
      status: row.status, ruleVersion: row.rule_version, latestVersionNo: number(row.latest_version_no),
      summary: parse(row.summary_json), versionCount: number(row.version_count), createdAt: row.created_at, updatedAt: row.updated_at,
    };
  }
  const designSelect = `SELECT d.*, p.name AS project_name, c.name AS customer_name,
    (SELECT COUNT(*) FROM design_versions v WHERE v.design_id=d.id) AS version_count
    FROM designs d LEFT JOIN projects p ON p.id=d.project_id LEFT JOIN customers c ON c.id=d.customer_id`;

  function designVersionsByDesign(designId) {
    return db.prepare(`SELECT v.*, d.name AS design_name FROM design_versions v LEFT JOIN designs d ON d.id=v.design_id WHERE v.design_id=? ORDER BY v.version_no DESC`).all(designId).map(mapDesignVersion);
  }

  function designVersions(projectId) {
    return db.prepare(`SELECT v.*, d.name AS design_name FROM design_versions v INNER JOIN designs d ON d.id=v.design_id
      WHERE d.project_id=? OR v.project_id=? ORDER BY v.created_at DESC, v.version_no DESC`).all(projectId, projectId).map(mapDesignVersion);
  }

  function designPage(query = {}) {
    const search = String(query.search || '').trim();
    const where = [];
    const params = [];
    if (search) {
      where.push('(d.name LIKE ? OR d.id LIKE ? OR p.name LIKE ? OR c.name LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (query.projectId) { where.push('d.project_id=?'); params.push(String(query.projectId)); }
    if (query.status && query.status !== '全部') { where.push('d.status=?'); params.push(String(query.status)); }
    if (query.linked === 'linked') where.push('d.project_id IS NOT NULL');
    if (query.linked === 'standalone') where.push('d.project_id IS NULL');
    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const page = Math.max(1, Math.floor(number(query.page, 1)));
    const pageSize = Math.min(100, Math.max(1, Math.floor(number(query.pageSize, 30))));
    const total = number(db.prepare(`SELECT COUNT(*) AS count FROM designs d LEFT JOIN projects p ON p.id=d.project_id LEFT JOIN customers c ON c.id=d.customer_id ${whereSql}`).get(...params).count);
    const designs = db.prepare(`${designSelect} ${whereSql} ORDER BY d.updated_at DESC LIMIT ? OFFSET ?`)
      .all(...params, pageSize, (page - 1) * pageSize).map(mapDesign);
    return { designs, total, page, pageSize };
  }

  function getDesign(designId) {
    const row = db.prepare(`${designSelect} WHERE d.id=?`).get(designId);
    return row ? { ...mapDesign(row), versions: designVersionsByDesign(designId) } : null;
  }

  function createDesign(input = {}) {
    const name = String(input.name || '').trim();
    if (!name) throw new Error('方案名称不能为空');
    const projectId = input.projectId ? String(input.projectId) : null;
    const project = projectId ? db.prepare('SELECT * FROM projects WHERE id=?').get(projectId) : null;
    if (projectId && !project) throw new Error('关联项目不存在');
    const customerId = input.customerId ? String(input.customerId) : (project?.customer_id || null);
    if (customerId && !db.prepare('SELECT 1 FROM customers WHERE id=?').get(customerId)) throw new Error('客户不存在');
    const status = DESIGN_STATUSES.includes(input.status) ? input.status : '设计中';
    const row = {
      id: uid('DSN'), name, projectId, customerId, status,
      ruleVersion: String(input.ruleVersion || '2026-10-21-V1'), createdAt: now(),
    };
    db.prepare('INSERT INTO designs (id,name,project_id,customer_id,status,rule_version,latest_version_no,summary_json,created_at,updated_at) VALUES (?,?,?,?,?,?,0,?,?,?)')
      .run(row.id, row.name, row.projectId, row.customerId, row.status, row.ruleVersion, '{}', row.createdAt, row.createdAt);
    audit('design.create', 'design', row.id, `新建设计方案 ${row.name}`, { projectId: row.projectId });
    return getDesign(row.id);
  }

  function updateDesign(designId, input = {}) {
    const current = db.prepare('SELECT * FROM designs WHERE id=?').get(designId);
    if (!current) throw new Error('设计方案不存在');
    const name = String(input.name ?? current.name).trim();
    if (!name) throw new Error('方案名称不能为空');
    const projectId = input.projectId === undefined ? current.project_id : (input.projectId ? String(input.projectId) : null);
    const project = projectId ? db.prepare('SELECT * FROM projects WHERE id=?').get(projectId) : null;
    if (projectId && !project) throw new Error('关联项目不存在');
    let customerId = input.customerId === undefined ? current.customer_id : (input.customerId || null);
    if (project && input.customerId === undefined) customerId = project.customer_id || current.customer_id;
    if (customerId && !db.prepare('SELECT 1 FROM customers WHERE id=?').get(customerId)) throw new Error('客户不存在');
    const status = input.status === undefined ? current.status : (DESIGN_STATUSES.includes(input.status) ? input.status : current.status);
    const t = now();
    db.prepare('UPDATE designs SET name=?,project_id=?,customer_id=?,status=?,rule_version=?,updated_at=? WHERE id=?')
      .run(name, projectId, customerId, status, String(input.ruleVersion || current.rule_version), t, designId);
    if (projectId !== current.project_id) db.prepare('UPDATE design_versions SET project_id=? WHERE design_id=?').run(projectId, designId);
    audit('design.update', 'design', designId, `更新设计方案 ${name}`, { projectId, status });
    return getDesign(designId);
  }

  function getDesignVersion(id) {
    const row = db.prepare('SELECT v.*, d.name AS design_name FROM design_versions v LEFT JOIN designs d ON d.id=v.design_id WHERE v.id=?').get(id);
    if (!row) return null;
    return { ...mapDesignVersion(row), snapshot: parse(row.snapshot_json) };
  }

  function latestDesignVersion(designId) {
    const row = db.prepare('SELECT id FROM design_versions WHERE design_id=? ORDER BY version_no DESC LIMIT 1').get(designId);
    return row ? getDesignVersion(row.id) : null;
  }

  function latestDesign(projectId) {
    const row = db.prepare(`SELECT v.id FROM design_versions v INNER JOIN designs d ON d.id=v.design_id
      WHERE d.project_id=? OR v.project_id=? ORDER BY v.created_at DESC, v.version_no DESC LIMIT 1`).get(projectId, projectId);
    return row ? getDesignVersion(row.id) : null;
  }

  function ensureProjectDesign(projectId, ruleVersion = '') {
    const existing = db.prepare('SELECT * FROM designs WHERE project_id=? ORDER BY created_at ASC LIMIT 1').get(projectId);
    if (existing) return existing;
    const project = db.prepare('SELECT * FROM projects WHERE id=?').get(projectId);
    if (!project) throw new Error('项目不存在');
    const t = now();
    const design = { id: uid('DSN'), name: `${project.name} · 设计方案`, projectId, customerId: project.customer_id || null, ruleVersion: String(ruleVersion || '2026-10-21-V1') };
    db.prepare('INSERT INTO designs (id,name,project_id,customer_id,status,rule_version,latest_version_no,summary_json,created_at,updated_at) VALUES (?,?,?,?,?,?,0,?,?,?)')
      .run(design.id, design.name, design.projectId, design.customerId, '设计中', design.ruleVersion, '{}', t, t);
    audit('design.create', 'design', design.id, `为项目创建设计方案 ${design.name}`, { projectId });
    return db.prepare('SELECT * FROM designs WHERE id=?').get(design.id);
  }

  function saveDesignVersion(designId, input = {}) {
    const design = db.prepare('SELECT * FROM designs WHERE id=?').get(designId);
    if (!design) throw new Error('设计方案不存在');
    if (design.status === '已归档') throw new Error('方案已归档，请先恢复为设计中再保存新版本');
    const snapshot = input.snapshot && typeof input.snapshot === 'object' ? input.snapshot : {};
    if (!Array.isArray(snapshot.furniture)) throw new Error('设计快照缺少家具与设备数据');
    const versionNo = db.prepare('SELECT COALESCE(MAX(version_no),0)+1 AS value FROM design_versions WHERE design_id=?').get(designId).value;
    const row = {
      id: uid('DSV'), designId, projectId: design.project_id || '', versionNo,
      name: String(input.name || `方案版本 V${versionNo}`), ruleVersion: String(input.ruleVersion || design.rule_version || '2026-10-21-V1'),
      status: String(input.status || '已保存'), snapshot, summary: extractDesignSummary(snapshot), createdAt: now(),
    };
    db.prepare('INSERT INTO design_versions (id,design_id,project_id,version_no,name,rule_version,status,snapshot_json,summary_json,created_at) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(row.id, row.designId, row.projectId || null, row.versionNo, row.name, row.ruleVersion, row.status, json(row.snapshot), json(row.summary), row.createdAt);
    db.prepare('UPDATE designs SET latest_version_no=?, summary_json=?, rule_version=?, updated_at=? WHERE id=?')
      .run(row.versionNo, json(row.summary), row.ruleVersion, row.createdAt, designId);
    audit('design.version.create', 'design', designId, `保存设计方案版本 V${versionNo}`, row.summary);
    return { ...row, designName: design.name };
  }

  function saveDesign(projectId, input = {}) {
    const project = db.prepare('SELECT * FROM projects WHERE id=?').get(projectId);
    if (!project) throw new Error('项目不存在');
    const design = ensureProjectDesign(projectId, input.ruleVersion);
    return saveDesignVersion(design.id, input);
  }

  function quoteTemplates() {
    return db.prepare('SELECT * FROM quote_templates ORDER BY updated_at DESC').all().map(row => ({ id: row.id, name: row.name, schemeType: row.scheme_type, description: row.description, lines: parse(row.lines_json, []), status: row.status, updatedAt: row.updated_at }));
  }

  function saveQuoteTemplate(input = {}, templateId = '') {
    const current = templateId ? db.prepare('SELECT * FROM quote_templates WHERE id=?').get(templateId) : null;
    const row = { id: current?.id || uid('TPL'), name: String(input.name ?? current?.name ?? '').trim(), schemeType: String(input.schemeType ?? current?.scheme_type ?? '全屋智能'), description: String(input.description ?? current?.description ?? ''), lines: Array.isArray(input.lines) ? input.lines : parse(current?.lines_json, []), status: String(input.status ?? current?.status ?? '启用'), updatedAt: now() };
    if (!row.name) throw new Error('模板名称不能为空');
    db.prepare('INSERT INTO quote_templates (id,name,scheme_type,description,lines_json,status,updated_at) VALUES (?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET name=excluded.name,scheme_type=excluded.scheme_type,description=excluded.description,lines_json=excluded.lines_json,status=excluded.status,updated_at=excluded.updated_at')
      .run(row.id, row.name, row.schemeType, row.description, json(row.lines), row.status, row.updatedAt);
    audit(current ? 'quote.template.update' : 'quote.template.create', 'quote_template', row.id, `${current ? '更新' : '新增'}报价模板 ${row.name}`);
    return row;
  }

  function findProduct({ categories = [], names = [], excludes = [] }) {
    const rows = db.prepare("SELECT * FROM products WHERE status IN ('在售','草稿') ORDER BY updated_at DESC").all().map(row => ({ row, data:{ ...parse(row.specs_json, {}), ...parse(row.details_json, {}) } }));
    const eligible = rows.filter(({ row, data }) =>
      categories.some(keyword => String(row.category).includes(keyword)) &&
      number(row.price, -1) >= 0 && data.canPrice !== false && data.canPlace !== false &&
      !excludes.some(keyword => String(row.name).includes(keyword)));
    const named = names.length ? eligible.filter(({ row }) => names.some(keyword => String(row.name).toUpperCase().includes(String(keyword).toUpperCase()))) : eligible;
    const source = named.length ? named : eligible;
    source.sort((a,b) => {
      const score = item => (item.row.status === '在售' ? 0 : 100) + (item.data.recommended ? -10 : 0) + (item.data.isSimulated ? 5 : 0) + Math.min(50, number(item.row.price) / 1000);
      return score(a) - score(b) || number(a.row.price) - number(b.row.price);
    });
    return quoteProduct(source[0]?.row);
  }

  function smartLines(project, templateId = '') {
    const area = Math.max(30, number(project.area, 120));
    const template = quoteTemplates().find(item => item.id === templateId) || quoteTemplates().find(item => item.schemeType === project.schemeType) || quoteTemplates()[0];
    const specs = template?.lines?.length ? template.lines : [
      { category: '灯光', formula: 'ceil(area/12)', label: '基础照明' }, { category: '控制', formula: 'ceil(area/25)', label: '控制面板' }, { category: '网络', formula: '4', label: '全屋网络基础包' },
    ];
    const selectors = {
      灯光: { categories:['筒灯','射灯','智能照明'], names:['筒灯','射灯'], excludes:['接头','电源','驱动','轨道'] },
      控制: { categories:['控制面板','智能电工'], names:['开关','面板'], excludes:['空白板','底盒','边框','配件'] },
      窗帘: { categories:['窗帘电机','智能遮阳'], names:['电机'], excludes:['轨道成品','配件','接头'] },
      传感器: { categories:['人在传感器','人体传感器','智能感知'], names:['传感器'], excludes:['支架','底座'] },
    };
    const qty = formula => {
      if (formula === 'ceil(area/12)') return Math.ceil(area / 12);
      if (formula === 'ceil(area/10)') return Math.ceil(area / 10);
      if (formula === 'ceil(area/25)') return Math.ceil(area / 25);
      if (formula === 'ceil(area/22)') return Math.ceil(area / 22);
      if (formula === 'ceil(area/35)') return Math.ceil(area / 35);
      if (formula === 'ceil(area/40)') return Math.ceil(area / 40);
      if (formula === 'area>=160?6:4') return area >= 160 ? 6 : 4;
      return Math.max(1, number(formula, 1));
    };
    const expanded = specs.flatMap(spec => spec.category !== '网络' ? [spec] : [
      { ...spec, category:'网络AP', label:'全屋无线覆盖 PoE AP', selector:{ categories:['面板 AP','顶装 AP'], names:['POE'], excludes:['支架','底盒'] }, formula:spec.formula },
      { ...spec, category:'网络交换机', label:'弱电箱 PoE 交换机', selector:{ categories:['PoE 交换机','家庭网络'], names:['POE'], excludes:['机柜','配件'] }, formula:'1' },
      { ...spec, category:'网络网关', label:'全屋网络网关 / 路由', selector:{ categories:['Mesh 网关','家庭网络','蓝牙 Mesh 网关'], names:['网关','路由'], excludes:['支架','配件'] }, formula:'1' },
    ]);
    return expanded.map((spec, index) => {
      const product = findProduct(spec.selector || selectors[spec.category] || { categories:[spec.category], names:[], excludes:['配件','接头'] });
      const quantity = qty(spec.formula);
      return {
        id: `line-${index + 1}`, productId: product?.id || '', sku: product?.sku || 'PENDING', name: product?.name || `${spec.label}（待选产品）`, category: product?.category || spec.category,
        brand: product?.brand || '', model: product?.model || '', quantity, unit: product?.unit || '件', unitPrice: product?.price || 0, discount: 100,
        amount: Math.round(quantity * (product?.price || 0) * 100) / 100, source: String(spec.category).startsWith('网络') ? '全屋网络基础包' : '智能报价规则',
        ruleCode: `QUOTE-${spec.category}`, space: String(spec.category).startsWith('网络') ? '全屋' : '按设计空间', status: product ? '已匹配' : '待选产品',
        reason: `${spec.label}：按项目面积 ${area}㎡ 和公式 ${spec.formula} 计算为 ${quantity}${product?.unit || '件'}；${product ? `匹配本地产品 ${product.name}` : '本地库没有满足条件的可报价产品'}`,
        productSnapshot: product,
      };
    });
  }

  function designLines(design) {
    const devices = Array.isArray(design?.snapshot?.furniture)
      ? design.snapshot.furniture.filter(item => String(item.type || '').startsWith('dev:')) : [];
    const grouped = new Map();
    for (const item of devices) {
      const smart = item.smart || {}, selected = smart.product || {};
      const legacyKey = selected.legacyKey || String(item.type || '').slice(4);
      const roomId = smart.roomId || '未分配空间';
      const groupKey = [selected.productId || legacyKey, roomId, smart.ruleCode || 'MANUAL', smart.source || 'manual'].join('|');
      const current = grouped.get(groupKey) || { item, smart, selected, legacyKey, roomId, quantity: 0, physical: 0 };
      current.quantity += Math.max(1, number(smart.quote?.moduleQuantity || smart.quote?.inputQuantity, 1));
      current.physical += 1;
      grouped.set(groupKey, current);
    }
    return [...grouped.values()].map((entry, index) => {
      const row = entry.selected.productId ? db.prepare('SELECT * FROM products WHERE id=?').get(entry.selected.productId) : null;
      const product = quoteProduct(row) || findProduct({ categories:[entry.legacyKey], names:[entry.legacyKey], excludes:['配件','接头'] });
      const unit = product?.unit || entry.selected.salesUnit || '件';
      const source = entry.smart.source === 'wholeHouse' ? '全屋网络基础包' : entry.smart.source === 'rule' ? '一键套餐设计快照' : '客户选品设计快照';
      return {
        id: `design-line-${index + 1}`, productId: product?.id || entry.selected.productId || '', sku: product?.sku || entry.selected.sku || 'PENDING',
        name: product?.name || entry.selected.productName || `${entry.legacyKey}（待选产品）`, category: product?.category || entry.legacyKey,
        brand: product?.brand || '', model: product?.model || '', quantity: entry.quantity, unit, unitPrice: product?.price || number(entry.selected.price), discount: 100,
        source, ruleCode: entry.smart.ruleCode || 'MANUAL', space: entry.roomId, status: product ? (entry.smart.status === 'pending' ? '待处理点位' : '已匹配') : '待选产品',
        reason: `来自设计版本 V${design.versionNo}：${entry.physical} 个实体，计价数量 ${entry.quantity}${unit}；规则 ${entry.smart.ruleCode || '人工选品'}，点位状态 ${entry.smart.status || 'manual'}`,
        productSnapshot: product,
      };
    });
  }

  function applyFees(subtotal, selectedFees) {
    const configured = Array.isArray(selectedFees) ? selectedFees : settings().serviceFees;
    return configured.filter(item => item.enabled !== false).map(item => {
      const amount = item.mode === 'percent' ? subtotal * number(item.value) / 100 : number(item.value);
      return { ...item, amount: Math.round(amount * 100) / 100 };
    });
  }

  function saveQuote(input = {}) {
    const projectId = String(input.projectId || '');
    const project = projectId ? db.prepare('SELECT * FROM projects WHERE id=?').get(projectId) : null;
    if (projectId && !project) throw new Error('请选择有效项目');
    const customerId = String(input.customerId || project?.customer_id || '');
    if (customerId && !db.prepare('SELECT 1 FROM customers WHERE id=?').get(customerId)) throw new Error('请选择有效客户');
    const design = projectId ? (input.designVersionId ? getDesignVersion(input.designVersionId) : latestDesign(projectId)) : null;
    const config = settings().projectConfig || {};
    if (project && config.requireDesignVersionBeforeQuote && !design) throw new Error('系统设置要求先保存设计版本，再生成报价');
    const requestedMode = String(input.mode || '快速报价');
    const fromDesign = requestedMode === '智能报价' && design ? designLines(design) : [];
    const area = Math.max(1, number(input.area, project?.area || 120));
    const schemeType = String(input.schemeType || project?.scheme_type || '全屋智能');
    let items = Array.isArray(input.items) && input.items.length
      ? input.items
      : (fromDesign.length ? fromDesign : smartLines({ ...(project || {}), name: project?.name || input.name || '独立报价', area, schemeType }, input.templateId));
    items = items.map((item, index) => {
      const quantity = Math.max(0, number(item.quantity));
      const unitPrice = Math.max(0, number(item.unitPrice));
      const discount = Math.min(100, Math.max(0, number(item.discount, 100)));
      const product = item.productSnapshot || quoteProduct(item.productId ? db.prepare('SELECT * FROM products WHERE id=?').get(item.productId) : null);
      const costPrice = Math.max(0, number(product?.productSnapshot?.costPrice));
      return { ...item, id: item.id || `line-${index + 1}`, quantity, unitPrice, discount, amount: Math.round(quantity * unitPrice * discount) / 100, costPrice, costAmount: Math.round(quantity * costPrice * 100) / 100, productSnapshot: product || item.productSnapshot || null };
    });
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const fees = applyFees(subtotal, input.fees);
    const feeTotal = Math.round(fees.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const overallDiscount = Math.min(100, Math.max(0, number(input.overallDiscount, 100)));
    const total = Math.round((subtotal + feeTotal) * overallDiscount) / 100;
    const costTotal = Math.round(items.reduce((sum, item) => sum + number(item.costAmount), 0) * 100) / 100;
    const grossProfit = Math.round((total - costTotal) * 100) / 100;
    const grossMargin = total > 0 ? Math.round(grossProfit / total * 10000) / 100 : 0;
    if (!config.allowNegativeMargin && grossProfit < 0) throw new Error('报价低于产品成本，当前设置不允许负毛利');
    const versionNo = projectId
      ? db.prepare('SELECT COALESCE(MAX(version_no),0)+1 AS value FROM quotes WHERE project_id=?').get(projectId).value
      : db.prepare('SELECT COALESCE(MAX(version_no),0)+1 AS value FROM quotes WHERE project_id IS NULL').get().value;
    const t = now();
    const quoteId = uid('QTE');
    const row = {
      id: quoteId, projectId: projectId || null, customerId: customerId || null, quoteNo: quoteId, versionNo,
      name: String(input.name || (project ? `${project.name} · 报价 V${versionNo}` : `独立报价单 V${versionNo}`)), mode: requestedMode, status: '草稿',
      designVersionId: design?.id || null, subtotal, feeTotal, overallDiscount, total,
      payload: { items, fees, explanation: input.explanation || '报价以保存时的产品、价格和方案快照为准。', designSummary: design?.summary || null, pricingBasis: fromDesign.length ? 'design_snapshot' : (Array.isArray(input.items) && input.items.length ? 'manual_selection' : 'area_template'), context: input.context || {}, priceStandard: input.priceStandard || '', costTotal, grossProfit, grossMargin, validUntil: new Date(Date.now() + number(config.quoteValidityDays, 30) * 86400000).toISOString().slice(0, 10) },
      createdAt: t, updatedAt: t,
    };
    db.prepare('INSERT INTO quotes (id,project_id,customer_id,quote_no,version_no,name,mode,status,design_version_id,subtotal,fee_total,discount,total,payload_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
      .run(row.id, row.projectId, row.customerId, row.quoteNo, row.versionNo, row.name, row.mode, row.status, row.designVersionId, row.subtotal, row.feeTotal, row.overallDiscount, row.total, json(row.payload), row.createdAt, row.updatedAt);
    db.prepare('INSERT INTO quote_status_history (id,quote_id,from_status,to_status,action,actor,reason,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(uid('QSH'), row.id, '', '草稿', 'create', activeActor, '新建报价', t);
    audit('quote.create', 'quote', row.id, `生成${row.mode} V${versionNo}，总额 ${row.total}`, { projectId: row.projectId, customerId: row.customerId, designVersionId: row.designVersionId });
    return row;
  }

  function updateQuoteAssociation(id, input = {}) {
    const current = getQuote(id);
    if (!current) throw new Error('报价不存在');
    if (current.status !== '草稿') {
      const error = new Error('只有草稿报价可以修改关联信息');
      error.statusCode = 409;
      throw error;
    }
    const projectId = String(input.projectId ?? current.projectId ?? '');
    const project = projectId ? db.prepare('SELECT * FROM projects WHERE id=?').get(projectId) : null;
    if (projectId && !project) throw new Error('请选择有效项目');
    const customerId = String(input.customerId ?? project?.customer_id ?? current.customerId ?? '');
    if (customerId && !db.prepare('SELECT 1 FROM customers WHERE id=?').get(customerId)) throw new Error('请选择有效客户');
    const versionNo = projectId
      ? (current.projectId === projectId ? current.versionNo : db.prepare('SELECT COALESCE(MAX(version_no),0)+1 AS value FROM quotes WHERE project_id=?').get(projectId).value)
      : current.versionNo;
    const name = String(input.name || (project ? current.name.replace(/^独立报价单/, project.name) : current.name));
    db.prepare('UPDATE quotes SET project_id=?,customer_id=?,version_no=?,name=?,payload_json=?,updated_at=? WHERE id=?')
      .run(projectId || null, customerId || null, versionNo, name, json({ ...current.payload, associationUpdatedAt: now() }), now(), id);
    audit('quote.association.update', 'quote', id, project ? `报价已关联项目 ${project.name}` : '报价已解除项目关联', { projectId: projectId || null, customerId: customerId || null });
    return getQuote(id);
  }

  function updateQuoteDraft(id, input = {}) {
    const current = getQuote(id);
    if (!current) throw new Error('报价不存在');
    if (current.status !== '草稿') throw new Error('只有草稿报价可以编辑');
    const projectId = String(input.projectId ?? current.projectId ?? '');
    const project = projectId ? db.prepare('SELECT * FROM projects WHERE id=?').get(projectId) : null;
    if (projectId && !project) throw new Error('请选择有效项目');
    const customerId = String(input.customerId ?? project?.customer_id ?? current.customerId ?? '');
    if (customerId && !db.prepare('SELECT 1 FROM customers WHERE id=?').get(customerId)) throw new Error('请选择有效客户');
    const versionNo = projectId
      ? (current.projectId === projectId ? current.versionNo : db.prepare('SELECT COALESCE(MAX(version_no),0)+1 AS value FROM quotes WHERE project_id=?').get(projectId).value)
      : current.versionNo;
    const sourceItems = Array.isArray(input.items) ? input.items : current.payload.items;
    const items = sourceItems.map((item, index) => {
      const quantity = Math.max(0, number(item.quantity));
      const unitPrice = Math.max(0, number(item.unitPrice));
      const discount = Math.min(100, Math.max(0, number(item.discount, 100)));
      const product = item.productSnapshot || (item.productId ? quoteProduct(db.prepare('SELECT * FROM products WHERE id=?').get(item.productId)) : null);
      const costPrice = Math.max(0, number(product?.productSnapshot?.costPrice ?? item.costPrice));
      return { ...item, id: item.id || `line-${index + 1}`, quantity, unitPrice, discount, amount: Math.round(quantity * unitPrice * discount) / 100, costPrice, costAmount: Math.round(quantity * costPrice * 100) / 100, productSnapshot: product || item.productSnapshot || null };
    });
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const fees = applyFees(subtotal, current.payload.fees || []);
    const feeTotal = Math.round(fees.reduce((sum, item) => sum + item.amount, 0) * 100) / 100;
    const overallDiscount = Math.min(100, Math.max(0, number(input.overallDiscount, current.discount)));
    const total = Math.round((subtotal + feeTotal) * overallDiscount) / 100;
    const costTotal = Math.round(items.reduce((sum, item) => sum + number(item.costAmount), 0) * 100) / 100;
    const grossProfit = Math.round((total - costTotal) * 100) / 100;
    const grossMargin = total > 0 ? Math.round(grossProfit / total * 10000) / 100 : 0;
    const name = String(input.name || current.name);
    const payload = { ...current.payload, items, fees, costTotal, grossProfit, grossMargin, editedAt: now() };
    db.prepare('UPDATE quotes SET project_id=?,customer_id=?,version_no=?,name=?,subtotal=?,fee_total=?,discount=?,total=?,payload_json=?,updated_at=? WHERE id=?')
      .run(projectId || null, customerId || null, versionNo, name, subtotal, feeTotal, overallDiscount, total, json(payload), now(), id);
    audit('quote.draft.update', 'quote', id, `编辑草稿报价 ${name}`, { projectId: projectId || null, customerId: customerId || null });
    return getQuote(id);
  }

  function copyQuote(id) {
    const source = getQuote(id);
    if (!source) throw new Error('报价不存在');
    return saveQuote({
      projectId: source.projectId,
      customerId: source.customerId,
      designVersionId: source.designVersionId,
      mode: '复制报价',
      name: `${source.name} · 复制`,
      items: source.payload.items,
      fees: source.payload.fees,
      overallDiscount: source.discount,
      explanation: `复制自报价 V${source.versionNo}；产品、数量和价格以复制时生成的新快照为准。`,
    });
  }

  function transitionQuote(id, input = {}) {
    const current = getQuote(id);
    if (!current) throw new Error('报价不存在');
    const expectedStatus = String(input.expectedStatus || '');
    if (!expectedStatus) throw new Error('缺少报价当前状态校验值');
    if (current.status !== expectedStatus) {
      const error = new Error(`报价状态已变化：期望 ${expectedStatus}，当前 ${current.status}`);
      error.statusCode = 409;
      throw error;
    }
    const action = String(input.action || '');
    const rules = {
      submit: { from:['草稿'], to:'待确认', permission:'quote.write', reason:false },
      return: { from:['待确认'], to:'草稿', permission:'quote.write', reason:true },
      confirm: { from:['待确认'], to:'已确认', permission:'quote.confirm', reason:false },
      void: { from:['草稿','待确认','已确认'], to:'已作废', permission:'quote.void', reason:true },
    };
    const rule = rules[action];
    if (!rule) throw new Error('不支持的状态操作');
    if (!rule.from.includes(current.status)) throw new Error(`当前状态“${current.status}”不能执行该操作`);
    const permissions = Array.isArray(input._permissions) ? input._permissions : [];
    if (!permissions.includes('*') && !permissions.includes(rule.permission)) {
      const error = new Error(`当前账号缺少 ${rule.permission} 权限`);
      error.statusCode = 403;
      throw error;
    }
    const reason = String(input.reason || '').trim();
    if (rule.reason && !reason) throw new Error('该操作必须填写原因');
    const t = now(), actor = String(input.actor || activeActor);
    if (action === 'confirm') {
      db.prepare('UPDATE quotes SET status=?,confirmed_by=?,confirmed_at=?,updated_at=? WHERE id=?').run(rule.to, actor, t, t, id);
    } else if (action === 'void') {
      db.prepare('UPDATE quotes SET status=?,voided_by=?,voided_at=?,void_reason=?,updated_at=? WHERE id=?').run(rule.to, actor, t, reason, t, id);
    } else {
      db.prepare('UPDATE quotes SET status=?,updated_at=? WHERE id=?').run(rule.to, t, id);
    }
    db.prepare('INSERT INTO quote_status_history (id,quote_id,from_status,to_status,action,actor,reason,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(uid('QSH'), id, current.status, rule.to, action, actor, reason, t);
    audit(`quote.${action}`, 'quote', id, `${current.status} → ${rule.to}`, { action, reason, actor });
    return getQuote(id);
  }

  function mapQuote(row) {
    if (!row) return null;
    return { id: row.id, quoteNo: row.quote_no || row.id, projectId: row.project_id || '', projectName: row.project_name || '', customerId: row.customer_id || '', customerName: row.customer_name || '', versionNo: row.version_no, name: row.name, mode: row.mode, status: row.status, confirmedBy: row.confirmed_by || '', confirmedAt: row.confirmed_at || '', voidedBy: row.voided_by || '', voidedAt: row.voided_at || '', voidReason: row.void_reason || '', designVersionId: row.design_version_id, subtotal: row.subtotal, feeTotal: row.fee_total, discount: row.discount, total: row.total, payload: parse(row.payload_json), createdAt: row.created_at, updatedAt: row.updated_at, statusHistory: quoteStatusHistory(row.id) };
  }

  function quoteStatusHistory(quoteId) {
    return db.prepare('SELECT * FROM quote_status_history WHERE quote_id=? ORDER BY created_at, id').all(quoteId)
      .map(row => ({ id:row.id, quoteId:row.quote_id, fromStatus:row.from_status, toStatus:row.to_status, action:row.action, actor:row.actor, reason:row.reason, createdAt:row.created_at }));
  }

  function quotes(projectId = '') {
    const where = projectId ? 'WHERE q.project_id=?' : '';
    const rows = db.prepare(`SELECT q.*, p.name AS project_name, c.name AS customer_name FROM quotes q LEFT JOIN projects p ON p.id=q.project_id LEFT JOIN customers c ON c.id=q.customer_id ${where} ORDER BY q.updated_at DESC`).all(...(projectId ? [projectId] : []));
    return rows.map(mapQuote);
  }

  function getQuote(id) {
    return mapQuote(db.prepare('SELECT q.*, p.name AS project_name, c.name AS customer_name FROM quotes q LEFT JOIN projects p ON p.id=q.project_id LEFT JOIN customers c ON c.id=q.customer_id WHERE q.id=?').get(id));
  }

  function quoteCsv(id) {
    const quote = getQuote(id);
    if (!quote) return null;
    const lines = [['序号','产品编码','产品名称','分类','空间','来源','数量','单位','单价','折扣','金额','状态','规则/原因']];
    quote.payload.items.forEach((item, index) => lines.push([index + 1,item.sku,item.name,item.category,item.space,item.source,item.quantity,item.unit,item.unitPrice,item.discount,item.amount,item.status,item.reason || item.ruleCode]));
    quote.payload.fees.forEach(fee => lines.push(['','','费用',fee.name,'','服务费',1,'项',fee.amount,100,fee.amount,'已计入',fee.mode === 'percent' ? `${fee.value}%` : '固定金额']));
    lines.push(['','','合计','','','','','','','',quote.total,'','']);
    return '\uFEFF' + lines.map(row => row.map(csvCell).join(',')).join('\r\n');
  }

  function quotePrintHtml(id) {
    const quote = getQuote(id);
    if (!quote) return null;
    const store = storeProfile();
    const logoFile = storeLogoFile();
    const logo = logoFile
      ? `<img class="logo" src="data:${logoFile.mime};base64,${fs.readFileSync(logoFile.path).toString('base64')}" alt="${store.name} LOGO">`
      : '';
    const rows = quote.payload.items.map((item, index) => `<tr><td>${index + 1}</td><td>${item.sku}</td><td>${item.name}</td><td>${item.category}</td><td>${item.quantity}${item.unit}</td><td>¥${item.unitPrice.toFixed(2)}</td><td>¥${item.amount.toFixed(2)}</td></tr>`).join('');
    return `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${quote.name}</title><style>body{font-family:Arial,'Microsoft YaHei';padding:32px;color:#29231f}h1{font-size:24px}header{display:flex;justify-content:space-between;border-bottom:2px solid #9f5a36;padding-bottom:16px}.brand{display:flex;align-items:center;gap:14px}.logo{width:52px;height:52px;object-fit:contain;border-radius:6px;border:1px solid #e2d9ca;background:#fff}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{border:1px solid #d8d0c8;padding:8px;text-align:left}th{background:#f3eee9}.total{text-align:right;font-size:20px;margin-top:24px}.note{color:#735f54;margin-top:20px}@media print{button{display:none}}</style><header><div class="brand">${logo}<div><h1>${quote.name}</h1><p>${store.name} · ${store.phone}</p></div></div><div>报价版本 V${quote.versionNo}<br>有效期至 ${quote.payload.validUntil}</div></header><table><thead><tr><th>#</th><th>编码</th><th>产品</th><th>分类</th><th>数量</th><th>单价</th><th>金额</th></tr></thead><tbody>${rows}</tbody></table><div class="total">报价合计：<b>¥${quote.total.toFixed(2)}</b></div><p class="note">${quote.payload.explanation}</p><button onclick="window.print()">打印 / 另存为 PDF</button></html>`;
  }

  function deliveryPackages(projectId = '') {
    const where = projectId ? 'WHERE d.project_id=?' : '';
    return db.prepare(`SELECT d.*, p.name AS project_name FROM delivery_packages d LEFT JOIN projects p ON p.id=d.project_id ${where} ORDER BY d.created_at DESC`).all(...(projectId ? [projectId] : [])).map(row => ({ id: row.id, projectId: row.project_id, projectName: row.project_name, designVersionId: row.design_version_id, quoteId: row.quote_id, name: row.name, status: row.status, manifest: parse(row.manifest_json), localPath: row.local_path, createdAt: row.created_at }));
  }

  function attachments(projectId) {
    return db.prepare('SELECT * FROM project_attachments WHERE project_id=? ORDER BY created_at DESC').all(projectId).map(row => ({ id: row.id, projectId: row.project_id, name: row.name, mime: row.mime, size: row.size, category: row.category, createdAt: row.created_at, url: `/api/admin/project-attachments/${row.id}` }));
  }

  function addAttachment(projectId, info, data, category = '现场资料') {
    if (!db.prepare('SELECT 1 FROM projects WHERE id=?').get(projectId)) throw new Error('项目不存在');
    const id = uid('ATT'), localPath = path.join(projectAssetDir, id);
    fs.writeFileSync(localPath, data, { flag:'wx' });
    db.prepare('INSERT INTO project_attachments (id,project_id,name,mime,size,local_path,category,created_at) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, projectId, info.name, info.mime, info.size, localPath, category, now());
    audit('project.attachment.create', 'project', projectId, `上传项目附件 ${info.name}`, { category, size:info.size });
    return attachments(projectId).find(item => item.id === id);
  }

  function getAttachmentFile(id) {
    const row = db.prepare('SELECT * FROM project_attachments WHERE id=?').get(id);
    return row && fs.existsSync(row.local_path) ? row : null;
  }

  function createDelivery(projectId, input = {}) {
    const project = db.prepare('SELECT * FROM projects WHERE id=?').get(projectId);
    if (!project) throw new Error('项目不存在');
    const design = input.designVersionId ? getDesignVersion(input.designVersionId) : latestDesign(projectId);
    const quote = input.quoteId ? getQuote(input.quoteId) : quotes(projectId)[0];
    if (!design) throw new Error('请先在设计工作台保存至少一个设计版本');
    const id = uid('DLV');
    const deviceRows = (design.snapshot.furniture || []).filter(item => String(item.type || '').startsWith('dev:')).map((item, index) => {
      const smart = item.smart || {}, lighting = smart.lighting || {}, product = smart.product || {};
      return { index:index + 1, room:smart.roomId || '未分配', product:product.productName || item.name || String(item.type).slice(4), sku:product.sku || '', type:String(item.type).slice(4), x:Math.round(number(item.cx)), y:Math.round(number(item.cy)), z:Math.round(number(smart.z)), rule:smart.ruleCode || 'MANUAL', status:smart.status || 'manual', locked:smart.locked ? '是' : '否', circuit:lighting.circuitId || '', dali:lighting.daliAddress ?? '', mount:smart.mount || '', source:smart.source || 'manual', warning:(smart.trace?.warnings || []).join('；') };
    });
    const makeCsv = (headers, rows) => '\uFEFF' + [headers, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n');
    const files = [
      { key:'device-overview', name:'01-设备总览.csv', mime:'text/csv; charset=utf-8', content:makeCsv(['序号','空间','产品','SKU','设备类型','状态','来源'], deviceRows.map(row => [row.index,row.room,row.product,row.sku,row.type,row.status,row.source])) },
      { key:'smart-points', name:'02-智能点位.csv', mime:'text/csv; charset=utf-8', content:makeCsv(['序号','空间','设备','X(mm)','Y(mm)','Z(mm)','安装面','规则','状态','锁定','待处理原因'], deviceRows.map(row => [row.index,row.room,row.product,row.x,row.y,row.z,row.mount,row.rule,row.status,row.locked,row.warning])) },
      { key:'lighting-circuit', name:'03-灯光回路与控制.csv', mime:'text/csv; charset=utf-8', content:makeCsv(['序号','空间','设备','回路','DALI地址','规则','状态'], deviceRows.filter(row => row.circuit).map(row => [row.index,row.room,row.product,row.circuit,row.dali,row.rule,row.status])) },
      { key:'network', name:'04-网络布线设备表.csv', mime:'text/csv; charset=utf-8', content:makeCsv(['序号','空间','网络设备','SKU','坐标','规则','状态'], deviceRows.filter(row => /路由|网关|交换机|AP|网络|弱电箱/i.test(`${row.product} ${row.type}`)).map(row => [row.index,row.room,row.product,row.sku,`${row.x},${row.y},${row.z}`,row.rule,row.status])) },
      { key:'water-electric', name:'05-水电交底设备表.csv', mime:'text/csv; charset=utf-8', content:makeCsv(['序号','空间','设备','安装高度(mm)','安装面','供电/控制复核','规则'], deviceRows.map(row => [row.index,row.room,row.product,row.z,row.mount,'需按产品资料与现场回路深化',row.rule])) },
      { key:'woodwork', name:'06-木工配合设备表.csv', mime:'text/csv; charset=utf-8', content:makeCsv(['序号','空间','设备','坐标','木作配合事项','状态'], deviceRows.filter(row => /灯带|窗帘|柜|检修口|轨道/.test(`${row.product} ${row.type}`)).map(row => [row.index,row.room,row.product,`${row.x},${row.y},${row.z}`,'复核开槽、收口、检修与电源位置',row.status])) },
      ...(quote ? [{ key:'quote', name:'07-项目报价.csv', mime:'text/csv; charset=utf-8', content:quoteCsv(quote.id) }] : []),
    ];
    const manifest = {
      schema: 'qone-delivery-v1', generatedAt: now(), project: { id: project.id, name: project.name, area: project.area, schemeType: project.scheme_type },
      design: { id: design.id, versionNo: design.versionNo, ruleVersion: design.ruleVersion, summary: design.summary },
      quote: quote ? { id: quote.id, versionNo: quote.versionNo, total: quote.total } : null,
      artifacts: files.map(item => ({ key:item.key, name:item.name, mime:item.mime, size:Buffer.byteLength(item.content || '', 'utf8'), status:'已生成' })),
      warnings: ['本交付包中的模拟产品参数、障碍尺寸和配光数据仅用于 Demo。', '施工前必须完成现场复尺、电气负载和控制协议复核。'],
    };
    const file = path.join(exportsDir, `${id}.shp`);
    fs.writeFileSync(file, JSON.stringify({ manifest, files, design, quote, settings: settings() }, null, 2), 'utf8');
    db.prepare('INSERT INTO delivery_packages (id,project_id,design_version_id,quote_id,name,status,manifest_json,local_path,created_at) VALUES (?,?,?,?,?,?,?,?,?)')
      .run(id, projectId, design.id, quote?.id || null, `${project.name} · 施工交付包`, '已生成', json(manifest), file, now());
    audit('delivery.create', 'delivery', id, `生成项目交付包：${project.name}`);
    return deliveryPackages(projectId).find(item => item.id === id);
  }

  function getDeliveryFile(id) {
    const row = db.prepare('SELECT * FROM delivery_packages WHERE id=?').get(id);
    return row && fs.existsSync(row.local_path) ? row : null;
  }

  function getDeliveryArtifact(id, key) {
    const row = getDeliveryFile(id);
    if (!row) return null;
    const payload = parse(fs.readFileSync(row.local_path, 'utf8'), null);
    const artifact = payload?.files?.find(item => item.key === key);
    return artifact ? { ...artifact, packageName: row.name } : null;
  }

  function productAlternatives(productId, limit = 6) {
    const sourceRow = db.prepare('SELECT * FROM products WHERE id=?').get(productId);
    if (!sourceRow) throw new Error('产品不存在');
    const source = quoteProduct(sourceRow);
    const sourceData = source.productSnapshot || {};
    const sourceProtocols = new Set(sourceData.communicationProtocols || []);
    const sourceSpaces = new Set(sourceData.spaceCodes || []);
    return db.prepare("SELECT * FROM products WHERE id<>? AND category=? AND status='在售' ORDER BY updated_at DESC LIMIT 100").all(productId, sourceRow.category)
      .map(row => {
        const item = quoteProduct(row), data = item.productSnapshot || {};
        const protocolMatches = (data.communicationProtocols || []).filter(value => sourceProtocols.has(value)).length;
        const spaceMatches = (data.spaceCodes || []).filter(value => sourceSpaces.has(value)).length;
        const priceGap = source.price > 0 ? Math.abs(item.price - source.price) / source.price : 0;
        const score = Math.max(0, Math.round(70 + protocolMatches * 8 + spaceMatches * 4 - Math.min(priceGap, 2) * 18 + (data.recommended ? 6 : 0)));
        const reasons = ['同产品分类'];
        if (protocolMatches) reasons.push(`命中 ${protocolMatches} 个相同协议`);
        if (spaceMatches) reasons.push(`命中 ${spaceMatches} 个适用空间`);
        if (item.price < source.price) reasons.push(`价格低 ¥${(source.price - item.price).toFixed(2)}`);
        else if (item.price > source.price) reasons.push(`价格高 ¥${(item.price - source.price).toFixed(2)}`);
        return { ...item, score, reason: reasons.join(' · '), priceGap: Math.round((item.price - source.price) * 100) / 100 };
      })
      .sort((a, b) => b.score - a.score || Math.abs(a.priceGap) - Math.abs(b.priceGap))
      .slice(0, Math.min(20, Math.max(1, number(limit, 6))));
  }

  function mapInventoryRow(row) {
    return {
      id: row.id, sku: row.sku, name: row.name, category: row.category, price: number(row.price), status: row.status,
      quantity: number(row.quantity), safetyStock: number(row.safety_stock, 2), tracked:Boolean(row.tracked), lowStock: Boolean(row.tracked) && number(row.quantity) <= number(row.safety_stock, 2),
      suggestedPurchase: row.tracked ? Math.max(0, Math.ceil(number(row.safety_stock, 2) * 2 - number(row.quantity))) : 0, updatedAt: row.updated_at,
    };
  }

  function inventoryWhere(query = {}) {
    return {
      search: `%${String(query.search || '').trim()}%`,
      lowOnly: query.lowOnly ? 1 : 0,
      clause: `(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?) AND p.status<>'归档'
        AND (? = 0 OR (s.product_id IS NOT NULL AND COALESCE(s.quantity,0) <= COALESCE(s.safety_stock,2)))`,
    };
  }

  function inventory(query = {}) {
    const { search, lowOnly, clause } = inventoryWhere(query);
    const rows = db.prepare(`SELECT p.id,p.sku,p.name,p.category,p.price,p.status,
      COALESCE(s.quantity,0) AS quantity,COALESCE(s.safety_stock,2) AS safety_stock,COALESCE(s.updated_at,p.updated_at) AS updated_at,
      CASE WHEN s.product_id IS NULL THEN 0 ELSE 1 END AS tracked
      FROM products p LEFT JOIN inventory_stock s ON s.product_id=p.id
      WHERE ${clause}
      ORDER BY (COALESCE(s.quantity,0)<=COALESCE(s.safety_stock,2)) DESC,p.updated_at DESC LIMIT 80`).all(search, search, search, lowOnly);
    return rows.map(mapInventoryRow);
  }

  function inventoryPage(query = {}, page = 1, pageSize = 30) {
    const { search, lowOnly, clause } = inventoryWhere(query);
    const safePage = Math.max(1, Math.floor(number(page, 1)));
    const safeSize = Math.min(100, Math.max(1, Math.floor(number(pageSize, 30))));
    const select = `SELECT p.id,p.sku,p.name,p.category,p.price,p.status,
      COALESCE(s.quantity,0) AS quantity,COALESCE(s.safety_stock,2) AS safety_stock,COALESCE(s.updated_at,p.updated_at) AS updated_at,
      CASE WHEN s.product_id IS NULL THEN 0 ELSE 1 END AS tracked
      FROM products p LEFT JOIN inventory_stock s ON s.product_id=p.id`;
    const total = number(db.prepare(`SELECT COUNT(*) AS count FROM products p LEFT JOIN inventory_stock s ON s.product_id=p.id WHERE ${clause}`).get(search, search, search, lowOnly).count);
    const rows = db.prepare(`${select} WHERE ${clause}
      ORDER BY (COALESCE(s.quantity,0)<=COALESCE(s.safety_stock,2)) DESC,p.updated_at DESC LIMIT ? OFFSET ?`)
      .all(search, search, search, lowOnly, safeSize, (safePage - 1) * safeSize);
    return { items: rows.map(mapInventoryRow), total, page: safePage, pageSize: safeSize };
  }

  function updateInventory(productId, input = {}) {
    if (!db.prepare('SELECT 1 FROM products WHERE id=?').get(productId)) throw new Error('产品不存在');
    const current = db.prepare('SELECT * FROM inventory_stock WHERE product_id=?').get(productId) || { quantity: 0, safety_stock: 2 };
    const quantity = input.quantity === undefined ? number(current.quantity) + number(input.delta) : number(input.quantity);
    const safetyStock = input.safetyStock === undefined ? number(current.safety_stock, 2) : number(input.safetyStock, 2);
    if (quantity < 0 || safetyStock < 0) throw new Error('库存与安全库存不能小于 0');
    db.prepare(`INSERT INTO inventory_stock (product_id,quantity,safety_stock,updated_at) VALUES (?,?,?,?)
      ON CONFLICT(product_id) DO UPDATE SET quantity=excluded.quantity,safety_stock=excluded.safety_stock,updated_at=excluded.updated_at`)
      .run(productId, quantity, safetyStock, now());
    audit('inventory.update', 'product', productId, `库存更新为 ${quantity}`, { quantity, safetyStock, reason: input.reason || '人工盘点' });
    return inventory({ search: productId }).find(item => item.id === productId) || { id: productId, quantity, safetyStock };
  }

  function deleteInventory(productId) {
    const current = db.prepare('SELECT * FROM inventory_stock WHERE product_id=?').get(productId);
    if (!current) throw new Error('库存记录不存在');
    db.prepare('DELETE FROM inventory_stock WHERE product_id=?').run(productId);
    audit('inventory.delete', 'product', productId, '清除库存盘点记录');
    return { deleted: true, productId };
  }

  function purchaseOrders() {
    return db.prepare('SELECT * FROM purchase_orders ORDER BY created_at DESC').all().map(row => ({
      id: row.id, supplier: row.supplier, status: row.status, total: number(row.total), items: parse(row.items_json, []), note: row.note,
      createdAt: row.created_at, updatedAt: row.updated_at,
    }));
  }

  function savePurchaseOrder(input = {}, orderId = '') {
    const current = orderId ? db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(orderId) : null;
    if (orderId && !current) throw new Error('采购单不存在');
    const items = Array.isArray(input.items) ? input.items.map(item => {
      const product = db.prepare('SELECT * FROM products WHERE id=?').get(item.productId);
      if (!product) throw new Error('采购产品不存在');
      const quantity = number(item.quantity);
      if (quantity <= 0) throw new Error('采购数量必须大于 0');
      const unitPrice = item.unitPrice === undefined ? number(product.price) : number(item.unitPrice);
      return { productId: product.id, sku: product.sku, name: product.name, quantity, unitPrice, amount: Math.round(quantity * unitPrice * 100) / 100 };
    }) : parse(current?.items_json, []);
    if (!items.length) throw new Error('采购单至少需要一个产品');
    const status = String(input.status || current?.status || '草稿');
    const total = items.reduce((sum, item) => sum + number(item.amount), 0);
    const id = current?.id || uid('PO'), t = now();
    if (current) db.prepare('UPDATE purchase_orders SET supplier=?,status=?,total=?,items_json=?,note=?,updated_at=? WHERE id=?').run(String(input.supplier || current.supplier), status, total, json(items), String(input.note ?? current.note), t, id);
    else db.prepare('INSERT INTO purchase_orders (id,supplier,status,total,items_json,note,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?)').run(id, String(input.supplier || '本地演示供应商'), status, total, json(items), String(input.note || ''), t, t);
    if (status === '已入库' && current?.status !== '已入库') items.forEach(item => updateInventory(item.productId, { delta:item.quantity, reason:`采购单 ${id} 入库` }));
    audit(current ? 'purchase.update' : 'purchase.create', 'purchase_order', id, `${current ? '更新' : '创建'}采购单 ${id}`, { status, total, itemCount:items.length });
    return purchaseOrders().find(item => item.id === id);
  }

  function deletePurchaseOrder(orderId) {
    const current = db.prepare('SELECT * FROM purchase_orders WHERE id=?').get(orderId);
    if (!current) throw new Error('采购单不存在');
    if (current.status === '已入库') throw new Error('已入库采购单不能删除');
    db.prepare('DELETE FROM purchase_orders WHERE id=?').run(orderId);
    audit('purchase.delete', 'purchase_order', orderId, `删除采购单 ${orderId}`);
    return { deleted: true, id: orderId };
  }

  function payments(projectId = '') {
    const where = projectId ? 'WHERE x.project_id=?' : '';
    return db.prepare(`SELECT x.*,p.name AS project_name,q.name AS quote_name FROM payments x
      LEFT JOIN projects p ON p.id=x.project_id LEFT JOIN quotes q ON q.id=x.quote_id ${where} ORDER BY x.paid_at DESC,x.created_at DESC`)
      .all(...(projectId ? [projectId] : [])).map(row => ({ id:row.id, projectId:row.project_id, projectName:row.project_name, quoteId:row.quote_id, quoteName:row.quote_name, amount:number(row.amount), method:row.method, note:row.note, paidAt:row.paid_at, createdAt:row.created_at }));
  }

  function savePayment(input = {}, paymentId = '') {
    const current = paymentId ? db.prepare('SELECT * FROM payments WHERE id=?').get(paymentId) : null;
    if (paymentId && !current) throw new Error('收款记录不存在');
    if (!db.prepare('SELECT 1 FROM projects WHERE id=?').get(input.projectId)) throw new Error('项目不存在');
    if (input.quoteId && !db.prepare('SELECT 1 FROM quotes WHERE id=? AND project_id=?').get(input.quoteId, input.projectId)) throw new Error('报价不属于当前项目');
    const amount = number(input.amount);
    if (amount <= 0) throw new Error('收款金额必须大于 0');
    const id = current?.id || uid('PAY'), t = now();
    if (current) {
      db.prepare('UPDATE payments SET project_id=?,quote_id=?,amount=?,method=?,note=?,paid_at=? WHERE id=?')
        .run(input.projectId, input.quoteId || null, amount, String(input.method || '其他'), String(input.note || ''), String(input.paidAt || current.paid_at), id);
    } else {
      db.prepare('INSERT INTO payments (id,project_id,quote_id,amount,method,note,paid_at,created_at) VALUES (?,?,?,?,?,?,?,?)')
        .run(id, input.projectId, input.quoteId || null, amount, String(input.method || '其他'), String(input.note || ''), String(input.paidAt || t.slice(0,10)), t);
    }
    audit(current ? 'payment.update' : 'payment.create', 'payment', id, `${current ? '更新' : '登记'}收款 ¥${amount.toFixed(2)}`, { projectId:input.projectId, quoteId:input.quoteId || null });
    return payments(input.projectId).find(item => item.id === id);
  }

  function deletePayment(paymentId) {
    const current = db.prepare('SELECT * FROM payments WHERE id=?').get(paymentId);
    if (!current) throw new Error('收款记录不存在');
    db.prepare('DELETE FROM payments WHERE id=?').run(paymentId);
    audit('payment.delete', 'payment', paymentId, `删除收款 ¥${number(current.amount).toFixed(2)}`);
    return { deleted: true, id: paymentId };
  }

  function operationsSummary() {
    const latestQuotes = db.prepare(`SELECT q.* FROM quotes q INNER JOIN (SELECT project_id,MAX(version_no) AS max_version FROM quotes GROUP BY project_id) x ON x.project_id=q.project_id AND x.max_version=q.version_no`).all();
    const quoted = latestQuotes.reduce((sum, row) => sum + number(row.total), 0);
    const received = number(db.prepare('SELECT COALESCE(SUM(amount),0) AS total FROM payments').get().total);
    return {
      lowStock: number(db.prepare('SELECT COUNT(*) AS count FROM inventory_stock WHERE quantity<=safety_stock').get().count),
      openPurchaseOrders: number(db.prepare("SELECT COUNT(*) AS count FROM purchase_orders WHERE status NOT IN ('已入库','已取消')").get().count),
      quoted, received, outstanding: Math.max(0, Math.round((quoted - received) * 100) / 100),
    };
  }

  function floorplanAssists(projectId) {
    return db.prepare('SELECT * FROM floorplan_assists WHERE project_id=? ORDER BY created_at DESC').all(projectId).map(row => ({
      id:row.id, projectId:row.project_id, fileName:row.file_name, imageWidth:row.image_width, imageHeight:row.image_height,
      method:row.method, confidence:number(row.confidence), rooms:parse(row.rooms_json, []), warnings:parse(row.warnings_json, []), status:row.status, createdAt:row.created_at,
    }));
  }

  function assistFloorplan(projectId, input = {}) {
    const project = db.prepare('SELECT * FROM projects WHERE id=?').get(projectId);
    if (!project) throw new Error('项目不存在');
    const projectPayload = parse(project.payload_json, {}), area = number(project.area), houseType = String(projectPayload.houseType || '');
    let rooms;
    if (area >= 180) rooms = ['玄关','客厅','餐厅','厨房','主卧','卧室','儿童房','老人房','书房','卫生间','卧室卫生间','过道','阳台','衣帽间','茶室'];
    else if (/三室/.test(houseType) || area >= 110) rooms = ['玄关','客厅','餐厅','厨房','主卧','卧室','卧室','卫生间','卧室卫生间','过道','阳台'];
    else rooms = ['玄关','客厅','餐厅','厨房','主卧','卧室','卫生间','过道','阳台'];
    const width = Math.max(0, Math.round(number(input.imageWidth))), height = Math.max(0, Math.round(number(input.imageHeight)));
    const aspect = height > 0 ? width / height : 1;
    const confidence = width && height ? Math.max(.45, Math.min(.82, .62 + Math.min(Math.abs(aspect - 1), 1) * .08)) : .45;
    const warnings = ['离线 Demo 使用尺寸、文件名和项目资料生成候选空间，不等同于训练模型识别。','墙体、门窗、比例尺和每个空间边界必须由设计师在户型工作台复核。'];
    const id = uid('FPA'), t = now();
    db.prepare('INSERT INTO floorplan_assists (id,project_id,file_name,image_width,image_height,method,confidence,rooms_json,warnings_json,status,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)')
      .run(id, projectId, String(input.fileName || '未命名户型图'), width, height, 'local_heuristic_demo', confidence, json(rooms.map((name,index) => ({ name, index:index+1, status:'待框选' }))), json(warnings), '待复核', t);
    audit('floorplan.assist', 'project', projectId, `生成户型辅助识别候选：${rooms.length} 个空间`, { method:'local_heuristic_demo', confidence });
    return floorplanAssists(projectId).find(item => item.id === id);
  }

  function snapshot() {
    const tables = ['store_profile','roles','store_users','system_settings','audit_logs','design_versions','designs','quote_templates','quotes','project_attachments','delivery_packages','project_status_history','inventory_stock','purchase_orders','payments','floorplan_assists'];
    return Object.fromEntries(tables.map(table => [table, db.prepare(`SELECT * FROM ${table}`).all()]));
  }

  function restoreSnapshot(data = {}) {
    const tables = ['floorplan_assists','payments','purchase_orders','inventory_stock','project_status_history','delivery_packages','project_attachments','quotes','quote_templates','design_versions','designs','audit_logs','system_settings','store_users','roles','store_profile'];
    const transaction = db.transaction(() => {
      for (const table of tables) db.prepare(`DELETE FROM ${table}`).run();
      for (const table of tables.slice().reverse()) {
        const rows = Array.isArray(data[table]) ? data[table] : [];
        for (const sourceRow of rows) {
          const row = table === 'project_attachments' ? { ...sourceRow, local_path:path.join(projectAssetDir, sourceRow.id) }
            : table === 'delivery_packages' ? { ...sourceRow, local_path:path.join(exportsDir, `${sourceRow.id}.shp`) } : sourceRow;
          const keys = Object.keys(row);
          if (!keys.length) continue;
          db.prepare(`INSERT INTO ${table} (${keys.join(',')}) VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map(key => row[key]));
        }
      }
    });
    transaction();
  }

  return {
    capabilities, storeProfile, updateStore, saveStoreLogo, removeStoreLogo, storeLogoFile, branding, roles, saveRole, deleteRole, users, login, saveUser, deleteUser, settings, updateSettings, projectJourney, updateProjectJourney, auditLogs,
    designPage, createDesign, updateDesign, getDesign,
    designVersions, designVersionsByDesign, getDesignVersion, latestDesign, latestDesignVersion, saveDesign, saveDesignVersion,
    quoteTemplates, saveQuoteTemplate, quotes, getQuote, saveQuote, updateQuoteAssociation, updateQuoteDraft, transitionQuote, quoteStatusHistory, copyQuote, quoteCsv, quotePrintHtml,
    deliveryPackages, createDelivery, getDeliveryFile, getDeliveryArtifact, attachments, addAttachment, getAttachmentFile, snapshot, restoreSnapshot, audit,
    productAlternatives, inventory, inventoryPage, updateInventory, deleteInventory, purchaseOrders, savePurchaseOrder, deletePurchaseOrder, payments, savePayment, deletePayment, operationsSummary,
    floorplanAssists, assistFloorplan,
  };
}

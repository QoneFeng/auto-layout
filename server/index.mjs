import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { backup, businessStore, copyProject, countCustomers, countProjects, createBackupPackage, createCustomer, createProject, decodeBackupPackage, getProject, importProducts, listCustomers, listCustomersPage, listProducts, listProjects, listProjectsPage, overview, previewRestore, productCategories, productStore, restoreBackup, updateCustomer, updateProject, dataDir as storeDataDir } from './db.mjs';
import { productMetadata, decodeAsset } from './products.mjs';
import { listPlatformProducts, platformProductDraft } from './platform-catalog.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const dataDir = path.join(root, 'data', 'projects');
const homeDir = path.join(root, 'home');
const appDir = path.join(root, 'app');
const distDir = path.join(root, 'dist');
const demoLightingDir = path.join(root, 'data', 'demo-lighting');
const rulesPath = path.join(root, 'src', 'data', 'rules.generated.json');

await fsp.mkdir(dataDir, { recursive: true });

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
app.addContentTypeParser('application/octet-stream', { parseAs: 'buffer', bodyLimit: 320 * 1024 * 1024 }, (_req, body, done) => done(null, body));
// DELETE 等无请求体调用仍可能带 application/json 头，空体按“无内容”处理，避免误报 400。
app.addContentTypeParser('application/json', { parseAs: 'string' }, (_req, body, done) => {
  const text = String(body ?? '').trim();
  if (!text) return done(null, undefined);
  try { done(null, JSON.parse(text)); }
  catch (error) { error.statusCode = 400; done(error, undefined); }
});

// 单机版仍然要有真实的接口权限边界，不能只依赖前端隐藏菜单。
// 会话仅保存在本机进程内，重启应用后需重新登录；Cookie 为 HttpOnly，避免前端脚本读取 PIN 或会话标识。
const sessions = new Map();
const sessionCookie = 'qone_session';
const sessionMaxAge = 12 * 60 * 60;
const parseCookies = header => Object.fromEntries(String(header || '').split(';').map(item => item.trim()).filter(Boolean).map(item => {
  const index = item.indexOf('=');
  return index < 0 ? [item, ''] : [item.slice(0, index), decodeURIComponent(item.slice(index + 1))];
}));
const permissionAllows = (permissions, required) => !required || permissions.includes('*') || permissions.includes(required)
  || (required.endsWith('.read') && permissions.includes(required.replace('.read', '.write')));
function requiredPermission(req) {
  const url = req.url.split('?')[0], method = req.method;
  if (!url.startsWith('/api/admin/') || url === '/api/admin/login') return '';
  if (url === '/api/admin/overview') return 'overview';
  // 登录页和浏览器标签需要在登录前读取门店品牌标识，因此只读品牌与 LOGO 文件公开；
  // 上传、移除仍走 store.write 权限。
  if (url === '/api/admin/branding') return '';
  if (url === '/api/admin/store/logo' && method === 'GET') return '';
  if (url.includes('/backup') || url.includes('/restore') || url.includes('/settings') || url.includes('/audit-logs')) return method === 'GET' ? 'settings.read' : 'settings.write';
  if (url.includes('/roles') || url.includes('/users') || url.startsWith('/api/admin/store')) return method === 'GET' ? 'store.read' : 'store.write';
  if (url.includes('/inventory') || url.includes('/purchase-orders') || url.includes('/operations/')) return method === 'GET' ? 'operations.read' : 'operations.write';
  if (url.includes('/payments')) return method === 'GET' ? 'operations.read' : 'payment.write';
  if (url.includes('/quote')) return method === 'GET' ? 'quote.read' : 'quote.write';
  if (url.includes('/delivery') || url.includes('/designs') || url.includes('/design-versions') || url.includes('/floorplan-assists') || url.includes('/attachments')) return method === 'GET' ? 'design.read' : 'design.write';
  if (url.includes('/products') || url.includes('/product-') || url.includes('/design-catalog')) return method === 'GET' ? 'product.read' : 'product.write';
  if (url.includes('/customers')) return method === 'GET' ? 'customer.read' : 'customer.write';
  if (url.includes('/projects')) return method === 'GET' ? 'project.read' : 'project.write';
  if (url.includes('/capabilities')) return 'design.read';
  return '*';
}
app.addHook('preHandler', async (req, reply) => {
  const required = requiredPermission(req);
  if (!required) return;
  const token = parseCookies(req.headers.cookie)[sessionCookie];
  const session = token ? sessions.get(token) : null;
  if (!session || session.expiresAt < Date.now()) {
    if (token) sessions.delete(token);
    return reply.code(401).send({ error: '登录已失效，请重新登录' });
  }
  if (required !== 'overview' && !permissionAllows(session.user.permissions || [], required)) {
    return reply.code(403).send({ error: `当前角色缺少权限：${required}` });
  }
  req.adminSession = session.user;
});
app.setErrorHandler((error, req, reply) => {
  req.log.error({ err: error, url: req.url, method: req.method }, 'request failed');
  if (reply.sent) return;
  reply.code(error.statusCode && error.statusCode < 500 ? error.statusCode : 500).send({ error: error.statusCode && error.statusCode < 500 ? error.message : '本地服务处理失败，请查看日志' });
});

const csvCell = value => `"${String(value ?? '').replaceAll('"', '""')}"`;
function productExportRows(query = {}) {
  return productStore.list(query).map(product => ({
    sku: product.sku,
    name: product.name,
    category: product.category,
    brand: product.brand,
    model: product.model,
    ecosystems: product.ecosystems.join('、'),
    protocols: product.communicationProtocols.join('、'),
    salesUnit: product.salesUnit,
    retailPrice: product.retailPrice ?? '',
    salePrice: product.salePrice ?? '',
    effectivePrice: product.canPrice ? product.price ?? '' : '',
    status: product.status,
    canPrice: product.canPrice ? '是' : '否',
    canPlace: product.canPlace ? '是' : '否',
    dataSource: product.source,
    simulated: product.isSimulated ? '是' : '否',
    geometryStatus: product.geometryStatus,
    parameterStatus: product.parameterStatus,
    compatibilityStatus: product.compatibilityStatus,
    updatedAt: product.updatedAt,
  }));
}
const productExportColumns = [
  ['sku','产品编码'], ['name','产品名称'], ['category','产品分类'], ['brand','品牌'], ['model','型号'],
  ['ecosystems','平台生态'], ['protocols','通信协议'], ['salesUnit','销售单位'], ['retailPrice','建议零售价'],
  ['salePrice','门店售价'], ['effectivePrice','有效售价'], ['status','产品状态'], ['canPrice','独立计价'],
  ['canPlace','可上点位图'], ['dataSource','资料来源'], ['simulated','模拟资料'], ['geometryStatus','几何状态'],
  ['parameterStatus','参数状态'], ['compatibilityStatus','兼容状态'], ['updatedAt','更新时间'],
];
function productCsv(query = {}) {
  const rows = productExportRows(query);
  return `\uFEFF${productExportColumns.map(([,label]) => csvCell(label)).join(',')}\r\n${rows.map(row => productExportColumns.map(([key]) => csvCell(row[key])).join(',')).join('\r\n')}`;
}
function productExcelHtml(query = {}) {
  const rows = productExportRows(query);
  const escape = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
  return `<!doctype html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font:12px Arial}th,td{border:1px solid #999;padding:6px;white-space:nowrap}th{background:#eee}</style></head><body><table><thead><tr>${productExportColumns.map(([,label]) => `<th>${escape(label)}</th>`).join('')}</tr></thead><tbody>${rows.map(row => `<tr>${productExportColumns.map(([key]) => `<td>${escape(row[key])}</td>`).join('')}</tr>`).join('')}</tbody></table></body></html>`;
}

// 版本号由桌面壳传入（app.getVersion()），便于安装后确认“装的是哪一个包”；
// 浏览器/命令行启动时回落到开发版本号。
const appVersion = process.env.QONE_APP_VERSION || '0.1.0';
app.get('/api/health', async () => ({ ok: true, service: 'auto-layout-api', version: appVersion }));

app.get('/api/meta', async () => {
  const rules = JSON.parse(await fsp.readFile(rulesPath, 'utf8'));
  return {
    ruleVersion: '2026-10-21-V1',
    ruleCount: rules.length,
    spaces: [...new Set(rules.map(r => r.spaceCode))],
    devices: [...new Set(rules.map(r => r.deviceType2))],
  };
});

// 单机门店后台：数据落在本地 SQLite，不依赖云端服务。
app.get('/api/admin/overview', async () => overview());
app.get('/api/admin/customers', async (req) => {
  const search = req.query?.search || '';
  // 分页参数只在显式传入 page 时启用，保持工作台/选择器等内部调用继续拿全量列表。
  if (req.query?.page !== undefined) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 30));
    return { customers: listCustomersPage(search, page, pageSize), total: countCustomers(search), page, pageSize };
  }
  return { customers: listCustomers(search) };
});
app.post('/api/admin/customers', async (req, reply) => {
  try { return createCustomer(req.body || {}); }
  catch (error) { return reply.code(400).send({ error: error.message || 'customer_create_failed' }); }
});
app.put('/api/admin/customers/:id', async (req, reply) => {
  try {
    const customer = updateCustomer(req.params.id, req.body || {});
    return customer || reply.code(404).send({ error: '客户不存在' });
  } catch (error) { return reply.code(400).send({ error: error.message || 'customer_update_failed' }); }
});
app.get('/api/admin/projects', async (req) => {
  const search = req.query?.search || '';
  if (req.query?.page !== undefined) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 30));
    return { projects: listProjectsPage(search, page, pageSize), total: countProjects(search), page, pageSize };
  }
  return { projects: listProjects(search) };
});
app.post('/api/admin/projects', async (req, reply) => {
  try { return createProject({ ...(req.body || {}), operator: req.adminSession?.name || '', operatorAccount: req.adminSession?.account || '' }); }
  catch (error) { return reply.code(400).send({ error: error.message || 'project_create_failed' }); }
});
app.get('/api/admin/projects/:id', async (req, reply) => {
  const project = getProject(req.params.id);
  return project || reply.code(404).send({ error: '项目不存在' });
});
app.put('/api/admin/projects/:id', async (req, reply) => {
  try {
    const project = updateProject(req.params.id, { ...(req.body || {}), operator: req.adminSession?.name || '', operatorAccount: req.adminSession?.account || '' });
    return project || reply.code(404).send({ error: '项目不存在' });
  } catch (error) { return reply.code(400).send({ error: error.message || 'project_update_failed' }); }
});
app.post('/api/admin/projects/:id/copy', async (req, reply) => {
  try {
    const project = copyProject(req.params.id, { ...(req.body || {}), operator: req.adminSession?.name || '', operatorAccount: req.adminSession?.account || '' });
    return project || reply.code(404).send({ error: '项目不存在' });
  } catch (error) { return reply.code(400).send({ error: error.message || 'project_copy_failed' }); }
});
app.get('/api/admin/products', async (req) => req.query?.page !== undefined ? productStore.page(req.query) : ({ products: listProducts(req.query || {}) }));
app.get('/api/admin/platform-products', async req => listPlatformProducts(req.query || {}));
app.post('/api/admin/platform-products/:id/copy', async (req, reply) => {
  try {
    const draft = platformProductDraft(req.params.id);
    if (!draft) return reply.code(404).send({ error: '平台产品不存在' });
    const saved = productStore.save(draft);
    businessStore.audit('platform-product.copy', 'product', saved.id, `平台产品加入门店库：${saved.name}`, { platformCode:req.params.id });
    return reply.code(201).send(saved);
  } catch (error) { return reply.code(error.statusCode || 400).send({ error:error.message || 'platform_product_copy_failed', fields:error.fields }); }
});
app.get('/api/admin/products/export.csv', async (req, reply) => {
  const csv = productCsv(req.query || {});
  businessStore.audit('product.export', 'product_catalog', '', `导出产品库 CSV，共 ${productExportRows(req.query || {}).length} 条`);
  reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`Qone产品库-${new Date().toISOString().slice(0, 10)}.csv`)}`);
  return reply.type('text/csv; charset=utf-8').send(csv);
});
app.get('/api/admin/products/export.xls', async (req, reply) => {
  const html = productExcelHtml(req.query || {});
  businessStore.audit('product.export', 'product_catalog', '', `导出产品库 Excel，共 ${productExportRows(req.query || {}).length} 条`);
  reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`Qone产品库-${new Date().toISOString().slice(0, 10)}.xls`)}`);
  return reply.type('application/vnd.ms-excel; charset=utf-8').send(html);
});
app.get('/api/admin/product-metadata', async () => ({ ...productMetadata, categories: productStore.categories() }));
app.get('/api/admin/design-catalog', async () => productStore.designCatalog());
app.get('/api/admin/product-categories', async () => productStore.categoryOverview());
app.put('/api/admin/product-categories/:id', async (req, reply) => {
  try {
    const result = productStore.updateCategoryMapping(req.params.id, req.body?.itemCode || '');
    businessStore.audit('product.category.mapping', 'product_category', req.params.id, `更新产品分类物品编码映射：${req.body?.itemCode || '恢复默认'}`);
    return result;
  } catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message || 'category_mapping_failed', fields: error.fields }); }
});
app.get('/api/admin/settings/default-devices-options', async () => productStore.defaultDeviceOptions());
app.get('/api/admin/product-status-summary', async () => ({ counts: productStore.statusSummary() }));
app.post('/api/admin/products/import', async (req, reply) => {
  try {
    const result = importProducts(req.body?.products || [], req.body?.updateExisting === true);
    businessStore.audit('product.import', 'product_batch', '', `导入产品：新增 ${result.created}，更新 ${result.updated}`, result);
    return result;
  }
  catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message || 'product_import_failed', fields: error.fields }); }
});
app.post('/api/admin/products/batch', async (req, reply) => {
  try {
    const result = productStore.batchUpdate({ ...(req.body || {}), actor: req.adminSession?.account || '本机用户' });
    const label = ({ publish:'上架', withdraw:'下架', archive:'归档', restore:'恢复', category:'修改分类' })[result.action] || result.action;
    businessStore.audit('product.batch', 'product_batch', '', `批量${label}：成功 ${result.updated} 项，失败 ${result.failed.length} 项`, { ids:req.body?.ids, action:result.action, categoryId:req.body?.categoryId });
    return result;
  } catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message || 'product_batch_failed', fields: error.fields }); }
});
app.get('/api/admin/products/:id', async (req, reply) => {
  const p = productStore.get(req.params.id);
  return p || reply.code(404).send({ error: '产品不存在' });
});
app.get('/api/admin/products/:id/alternatives', async (req, reply) => {
  try { return { alternatives: businessStore.productAlternatives(req.params.id, req.query?.limit) }; }
  catch (error) { return reply.code(404).send({ error: error.message || 'product_alternatives_failed' }); }
});
app.get('/api/admin/products/:id/status-history', async (req, reply) => {
  const product = productStore.get(req.params.id);
  if (!product) return reply.code(404).send({ error: '产品不存在' });
  return { productId: product.id, status: product.status, history: productStore.statusHistory(product.id) };
});
app.post('/api/admin/products/:id/transition', async (req, reply) => {
  try {
    const product = productStore.transition(req.params.id, { ...(req.body || {}), actor: req.adminSession?.account || '本机用户' });
    businessStore.audit('product.status', 'product', product.id, `${req.body?.expectedStatus || ''} → ${product.status}（${req.body?.action || ''}）${req.body?.reason ? `：${req.body.reason}` : ''}`);
    return product;
  } catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message || 'product_transition_failed', fields: error.fields }); }
});
app.post('/api/admin/products', async (req, reply) => {
  try { return reply.code(201).send(productStore.save(req.body || {}, undefined, { actor: req.adminSession?.account || '本机用户' })); }
  catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message, fields: error.fields }); }
});
app.put('/api/admin/products/:id', async (req, reply) => {
  try { return productStore.save(req.body || {}, req.params.id, { actor: req.adminSession?.account || '本机用户' }); }
  catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message, fields: error.fields }); }
});
const assetDir = path.join(storeDataDir, 'product-assets');
app.post('/api/admin/product-assets', { bodyLimit: 15 * 1024 * 1024 }, async (req, reply) => {
  try {
    const { data, info } = decodeAsset(req.body);
    await fsp.mkdir(assetDir, { recursive: true });
    await fsp.writeFile(path.join(assetDir, info.id), data, { flag: 'wx' });
    return reply.code(201).send(productStore.addAsset(info));
  } catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message }); }
});
app.get('/api/admin/product-assets/:id', async (req, reply) => {
  const a = productStore.getAsset(req.params.id);
  if (!a) return reply.code(404).send({ error: '附件不存在' });
  const file = path.join(assetDir, a.id);
  if (!fs.existsSync(file)) return reply.code(404).send({ error: '本地附件文件缺失，请恢复备份' });
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Content-Security-Policy', "default-src 'none'; sandbox");
  reply.header('Content-Disposition', `${a.mime.startsWith('image/') ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(a.name)}`);
  return reply.type(a.mime).send(fs.createReadStream(file));
});
app.get('/api/admin/capabilities', async () => ({ capabilities: businessStore.capabilities() }));

app.get('/api/admin/branding', async () => businessStore.branding());
app.get('/api/admin/store/logo', async (_req, reply) => {
  const file = businessStore.storeLogoFile();
  if (!file) return reply.code(404).send({ error: '门店 LOGO 未设置' });
  reply.header('X-Content-Type-Options', 'nosniff');
  reply.header('Content-Security-Policy', "default-src 'none'; sandbox");
  reply.header('Cache-Control', 'public, max-age=3600');
  return reply.type(file.mime).send(fs.createReadStream(file.path));
});
app.post('/api/admin/store/logo', { bodyLimit: 6 * 1024 * 1024 }, async (req, reply) => {
  try { return reply.code(201).send(businessStore.saveStoreLogo(req.body || {})); }
  catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message || 'store_logo_upload_failed' }); }
});
app.delete('/api/admin/store/logo', async (_req, reply) => {
  try { return businessStore.removeStoreLogo(); }
  catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message || 'store_logo_remove_failed' }); }
});
app.get('/api/admin/store', async () => businessStore.storeProfile());
app.post('/api/admin/login', async (req, reply) => {
  try {
    const user = businessStore.login(req.body?.account, req.body?.pin);
    const token = randomUUID();
    sessions.set(token, { user, expiresAt: Date.now() + sessionMaxAge * 1000 });
    reply.header('Set-Cookie', `${sessionCookie}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionMaxAge}`);
    return user;
  }
  catch (error) { return reply.code(401).send({ error: error.message || 'login_failed' }); }
});
app.post('/api/admin/logout', async (_req, reply) => {
  const token = parseCookies(_req.headers.cookie)[sessionCookie];
  if (token) sessions.delete(token);
  reply.header('Set-Cookie', `${sessionCookie}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
  return { ok: true };
});
app.put('/api/admin/store', async (req, reply) => {
  try { return businessStore.updateStore(req.body || {}); }
  catch (error) { return reply.code(400).send({ error: error.message || 'store_update_failed' }); }
});
app.get('/api/admin/roles', async () => ({ roles: businessStore.roles() }));
app.post('/api/admin/roles', async (req, reply) => {
  try { return reply.code(201).send(businessStore.saveRole(req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'role_create_failed' }); }
});
app.put('/api/admin/roles/:id', async (req, reply) => {
  try { return businessStore.saveRole(req.body || {}, req.params.id); }
  catch (error) { return reply.code(400).send({ error: error.message || 'role_update_failed' }); }
});
app.delete('/api/admin/roles/:id', async (req, reply) => {
  try { return businessStore.deleteRole(req.params.id); }
  catch (error) { return reply.code(400).send({ error: error.message || 'role_delete_failed' }); }
});
app.get('/api/admin/users', async () => ({ users: businessStore.users() }));
app.post('/api/admin/users', async (req, reply) => {
  try { return reply.code(201).send(businessStore.saveUser(req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'user_create_failed' }); }
});
app.put('/api/admin/users/:id', async (req, reply) => {
  try { return businessStore.saveUser(req.body || {}, req.params.id); }
  catch (error) { return reply.code(400).send({ error: error.message || 'user_update_failed' }); }
});
app.delete('/api/admin/users/:id', async (req, reply) => {
  try {
    const result = businessStore.deleteUser(req.params.id, req.adminSession?.id || '');
    for (const [token, session] of sessions.entries()) if (session.user?.id === req.params.id) sessions.delete(token);
    return result;
  } catch (error) { return reply.code(400).send({ error: error.message || 'user_delete_failed' }); }
});

app.get('/api/admin/settings', async () => businessStore.settings());
app.put('/api/admin/settings', async (req, reply) => {
  try { return businessStore.updateSettings(req.body || {}); }
  catch (error) { return reply.code(400).send({ error: error.message || 'settings_update_failed' }); }
});
// 项目阶段与任务模板：页面需要默认模板、状态字典与受影响项目数，所以单独提供读写接口。
app.get('/api/admin/settings/project-journey', async () => businessStore.projectJourney());
app.put('/api/admin/settings/project-journey', async (req, reply) => {
  try { return businessStore.updateProjectJourney(req.body?.journey ?? req.body ?? {}); }
  catch (error) { return reply.code(400).send({ error: error.message || 'project_journey_update_failed' }); }
});
app.get('/api/admin/audit-logs', async req => ({ logs: businessStore.auditLogs(req.query?.limit) }));

app.get('/api/admin/operations/summary', async () => businessStore.operationsSummary());
app.get('/api/admin/inventory', async req => {
  const query = { search:req.query?.search || '', lowOnly:req.query?.lowOnly === 'true' };
  if (req.query?.page !== undefined) {
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 30));
    const result = businessStore.inventoryPage(query, page, pageSize);
    return { inventory: result.items, total: result.total, page: result.page, pageSize: result.pageSize };
  }
  return { inventory: businessStore.inventory(query) };
});
app.put('/api/admin/inventory/:productId', async (req, reply) => {
  try { return businessStore.updateInventory(req.params.productId, req.body || {}); }
  catch (error) { return reply.code(400).send({ error: error.message || 'inventory_update_failed' }); }
});
app.delete('/api/admin/inventory/:productId', async (req, reply) => {
  try { return businessStore.deleteInventory(req.params.productId); }
  catch (error) { return reply.code(400).send({ error: error.message || 'inventory_delete_failed' }); }
});
app.get('/api/admin/purchase-orders', async () => ({ purchaseOrders: businessStore.purchaseOrders() }));
app.post('/api/admin/purchase-orders', async (req, reply) => {
  try { return reply.code(201).send(businessStore.savePurchaseOrder(req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'purchase_create_failed' }); }
});
app.put('/api/admin/purchase-orders/:id', async (req, reply) => {
  try { return businessStore.savePurchaseOrder(req.body || {}, req.params.id); }
  catch (error) { return reply.code(400).send({ error: error.message || 'purchase_update_failed' }); }
});
app.delete('/api/admin/purchase-orders/:id', async (req, reply) => {
  try { return businessStore.deletePurchaseOrder(req.params.id); }
  catch (error) { return reply.code(400).send({ error: error.message || 'purchase_delete_failed' }); }
});
app.get('/api/admin/payments', async req => ({ payments: businessStore.payments(req.query?.projectId || '') }));
app.post('/api/admin/payments', async (req, reply) => {
  try { return reply.code(201).send(businessStore.savePayment(req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'payment_create_failed' }); }
});
app.put('/api/admin/payments/:id', async (req, reply) => {
  try { return businessStore.savePayment(req.body || {}, req.params.id); }
  catch (error) { return reply.code(400).send({ error: error.message || 'payment_update_failed' }); }
});
app.delete('/api/admin/payments/:id', async (req, reply) => {
  try { return businessStore.deletePayment(req.params.id); }
  catch (error) { return reply.code(400).send({ error: error.message || 'payment_delete_failed' }); }
});

app.get('/api/admin/designs', async req => businessStore.designPage(req.query || {}));
app.post('/api/admin/designs', async (req, reply) => {
  try { return reply.code(201).send(businessStore.createDesign(req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'design_create_failed' }); }
});
app.get('/api/admin/designs/:id/versions', async (req, reply) => {
  const design = businessStore.getDesign(req.params.id);
  return design ? { versions: design.versions } : reply.code(404).send({ error: '设计方案不存在' });
});
app.get('/api/admin/designs/:id/versions/latest', async (req, reply) => businessStore.latestDesignVersion(req.params.id) || reply.code(404).send({ error: '方案还没有已保存设计版本' }));
app.post('/api/admin/designs/:id/versions', async (req, reply) => {
  try { return reply.code(201).send(businessStore.saveDesignVersion(req.params.id, req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'design_version_save_failed' }); }
});
app.get('/api/admin/designs/:id', async (req, reply) => businessStore.getDesign(req.params.id) || reply.code(404).send({ error: '设计方案不存在' }));
app.put('/api/admin/designs/:id', async (req, reply) => {
  try { return businessStore.updateDesign(req.params.id, req.body || {}); }
  catch (error) { return reply.code(400).send({ error: error.message || 'design_update_failed' }); }
});

app.get('/api/admin/projects/:id/design-versions', async req => ({ versions: businessStore.designVersions(req.params.id) }));
app.get('/api/admin/projects/:id/floorplan-assists', async req => ({ assists: businessStore.floorplanAssists(req.params.id) }));
app.post('/api/admin/projects/:id/floorplan-assists', async (req, reply) => {
  try { return reply.code(201).send(businessStore.assistFloorplan(req.params.id, req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'floorplan_assist_failed' }); }
});
app.get('/api/admin/projects/:id/design-versions/latest', async (req, reply) => businessStore.latestDesign(req.params.id) || reply.code(404).send({ error: '项目还没有已保存设计版本' }));
app.post('/api/admin/projects/:id/design-versions', async (req, reply) => {
  try { return reply.code(201).send(businessStore.saveDesign(req.params.id, req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'design_save_failed' }); }
});
app.get('/api/admin/design-versions/:id', async (req, reply) => businessStore.getDesignVersion(req.params.id) || reply.code(404).send({ error: '设计版本不存在' }));

app.get('/api/admin/quote-templates', async () => ({ templates: businessStore.quoteTemplates() }));
app.post('/api/admin/quote-templates', async (req, reply) => {
  try { return reply.code(201).send(businessStore.saveQuoteTemplate(req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'quote_template_create_failed' }); }
});
app.put('/api/admin/quote-templates/:id', async (req, reply) => {
  try { return businessStore.saveQuoteTemplate(req.body || {}, req.params.id); }
  catch (error) { return reply.code(400).send({ error: error.message || 'quote_template_update_failed' }); }
});
app.get('/api/admin/quotes', async req => ({ quotes: businessStore.quotes(req.query?.projectId || '') }));
app.post('/api/admin/quotes', async (req, reply) => {
  try { return reply.code(201).send(businessStore.saveQuote(req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'quote_create_failed' }); }
});
app.post('/api/admin/quotes/:id/copy', async (req, reply) => {
  try { return reply.code(201).send(businessStore.copyQuote(req.params.id)); }
  catch (error) { return reply.code(400).send({ error: error.message || 'quote_copy_failed' }); }
});
app.get('/api/admin/quotes/:id', async (req, reply) => businessStore.getQuote(req.params.id) || reply.code(404).send({ error: '报价不存在' }));
app.put('/api/admin/quotes/:id', async (req, reply) => {
  try { return businessStore.updateQuoteAssociation(req.params.id, req.body || {}); }
  catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message || 'quote_update_failed' }); }
});
app.put('/api/admin/quotes/:id/draft', async (req, reply) => {
  try { return businessStore.updateQuoteDraft(req.params.id, req.body || {}); }
  catch (error) { return reply.code(error.statusCode || 400).send({ error: error.message || 'quote_draft_update_failed' }); }
});
app.post('/api/admin/quotes/:id/transition', async (req, reply) => {
  try {
    return businessStore.transitionQuote(req.params.id, { ...(req.body || {}), actor: req.adminSession?.account || '本机用户', _permissions: req.adminSession?.permissions || [] });
  } catch (error) {
    return reply.code(error.statusCode || 400).send({ error: error.message || 'quote_transition_failed' });
  }
});
app.get('/api/admin/quotes/:id/export.csv', async (req, reply) => {
  const csv = businessStore.quoteCsv(req.params.id);
  if (!csv) return reply.code(404).send({ error: '报价不存在' });
  reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${req.params.id}-报价.csv`)}`);
  return reply.type('text/csv; charset=utf-8').send(csv);
});
app.get('/api/admin/quotes/:id/export.xls', async (req, reply) => {
  const html = businessStore.quotePrintHtml(req.params.id);
  if (!html) return reply.code(404).send({ error: '报价不存在' });
  reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${req.params.id}-报价.xls`)}`);
  return reply.type('application/vnd.ms-excel; charset=utf-8').send(html);
});
app.get('/api/admin/quotes/:id/print', async (req, reply) => {
  const html = businessStore.quotePrintHtml(req.params.id);
  return html ? reply.type('text/html; charset=utf-8').send(html) : reply.code(404).send({ error: '报价不存在' });
});

app.get('/api/admin/delivery-packages', async req => ({ packages: businessStore.deliveryPackages(req.query?.projectId || '') }));
app.get('/api/admin/projects/:id/attachments', async req => ({ attachments: businessStore.attachments(req.params.id) }));
app.post('/api/admin/projects/:id/attachments', { bodyLimit: 15 * 1024 * 1024 }, async (req, reply) => {
  try {
    const { data, info } = decodeAsset(req.body);
    return reply.code(201).send(businessStore.addAttachment(req.params.id, info, data, req.body?.category || '现场资料'));
  } catch (error) { return reply.code(400).send({ error: error.message || 'attachment_upload_failed' }); }
});
app.get('/api/admin/project-attachments/:id', async (req, reply) => {
  const item = businessStore.getAttachmentFile(req.params.id);
  if (!item) return reply.code(404).send({ error: '项目附件不存在' });
  reply.header('Content-Disposition', `${item.mime.startsWith('image/') ? 'inline' : 'attachment'}; filename*=UTF-8''${encodeURIComponent(item.name)}`);
  return reply.type(item.mime).send(fs.createReadStream(item.local_path));
});
app.post('/api/admin/projects/:id/delivery-packages', async (req, reply) => {
  try { return reply.code(201).send(businessStore.createDelivery(req.params.id, req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'delivery_create_failed' }); }
});
app.get('/api/admin/delivery-packages/:id/download', async (req, reply) => {
  const item = businessStore.getDeliveryFile(req.params.id);
  if (!item) return reply.code(404).send({ error: '交付包不存在或文件缺失' });
  reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`${item.name}.shp`)}`);
  return reply.type('application/json; charset=utf-8').send(fs.createReadStream(item.local_path));
});
app.get('/api/admin/delivery-packages/:id/artifacts/:key', async (req, reply) => {
  const item = businessStore.getDeliveryArtifact(req.params.id, req.params.key);
  if (!item) return reply.code(404).send({ error: '交付成果不存在' });
  reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(item.name)}`);
  return reply.type(item.mime || 'application/octet-stream').send(item.content || '');
});

app.get('/api/admin/backup', async () => backup());
app.get('/api/admin/backup/file', async (req, reply) => {
  const data = createBackupPackage();
  reply.header('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(`Qone门店备份-${new Date().toISOString().slice(0, 10)}.shp`)}`);
  return reply.type('application/octet-stream').send(data);
});
app.post('/api/admin/restore/preview', { bodyLimit: 420 * 1024 * 1024 }, async (req, reply) => {
  try { return previewRestore(Buffer.isBuffer(req.body) ? decodeBackupPackage(req.body) : req.body?.packageBase64 ? decodeBackupPackage(req.body.packageBase64) : (req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'backup_preview_failed' }); }
});
app.post('/api/admin/restore', { bodyLimit: 420 * 1024 * 1024 }, async (req, reply) => {
  try { return restoreBackup(Buffer.isBuffer(req.body) ? decodeBackupPackage(req.body) : req.body?.packageBase64 ? decodeBackupPackage(req.body.packageBase64) : (req.body || {})); }
  catch (error) { return reply.code(400).send({ error: error.message || 'backup_restore_failed' }); }
});

app.get('/api/demo-lighting', async (req, reply) => {
  const file = path.join(demoLightingDir, '20261030-v1', 'combined.json');
  if (!fs.existsSync(file)) return reply.code(404).send({ error: 'demo_lighting_data_missing' });
  return JSON.parse(await fsp.readFile(file, 'utf8'));
});

app.get('/api/projects', async () => {
  const files = await fsp.readdir(dataDir).catch(() => []);
  const projects = [];
  for (const f of files.filter(x => x.endsWith('.json'))) {
    try {
      const p = JSON.parse(await fsp.readFile(path.join(dataDir, f), 'utf8'));
      projects.push({ id: p.id, name: p.name, savedAt: (await fsp.stat(path.join(dataDir, f))).mtimeMs });
    } catch { /* ignore broken local file */ }
  }
  return { projects };
});

app.get('/api/projects/:id', async (req, reply) => {
  const id = String(req.params.id).replace(/[^a-zA-Z0-9_-]/g, '');
  const file = path.join(dataDir, `${id}.json`);
  if (!fs.existsSync(file)) return reply.code(404).send({ error: 'not_found' });
  return JSON.parse(await fsp.readFile(file, 'utf8'));
});

app.put('/api/projects/:id', async (req, reply) => {
  const id = String(req.params.id).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) return reply.code(400).send({ error: 'invalid_id' });
  const file = path.join(dataDir, `${id}.json`);
  await fsp.writeFile(file, JSON.stringify(req.body, null, 2), 'utf8');
  return { ok: true, id, file: path.relative(root, file) };
});

// 首页：统一入口，按目录区分场景，不再用多个端口。
app.get('/', async (req, reply) => {
  const html = await fsp.readFile(path.join(homeDir, 'index.html'), 'utf8');
  return reply.type('text/html; charset=utf-8').send(html);
});
app.get('/home', (req, reply) => reply.redirect('/'));
app.get('/app', (req, reply) => reply.redirect('/app/'));
app.get('/legacy', (req, reply) => reply.redirect('/legacy/'));
app.get('/admin', (req, reply) => reply.redirect('/admin/'));

// /app/：floorplan-3d 底座 + 智能布点层。
await app.register(fastifyStatic, {
  root: appDir,
  prefix: '/app/',
  decorateReply: false,
  index: ['index.html'],
});

// /demo-data/：照明模拟数据包，供 Demo 查看/下载和后续替换真实数据。
if (fs.existsSync(demoLightingDir)) {
  await app.register(fastifyStatic, {
    root: demoLightingDir,
    prefix: '/demo-data/',
    decorateReply: false,
  });
}

// /legacy/：Vue 构建产物（Vite build base=/legacy/）。
if (fs.existsSync(distDir)) {
  await app.register(fastifyStatic, {
    root: distDir,
    prefix: '/legacy/',
    decorateReply: true,
    index: ['index.html'],
  });
}

// /admin/：Vue 门店后台，构建产物为 dist/admin.html。
if (fs.existsSync(distDir)) {
  await app.register(fastifyStatic, {
    root: distDir,
    prefix: '/admin/',
    decorateReply: false,
    index: ['admin.html'],
  });
}

app.setNotFoundHandler((req, reply) => {
  if (req.url.startsWith('/api/')) return reply.code(404).send({ error: 'not_found' });
  // 旧 Vue 版没有前端路由，但保留入口兜底，避免刷新 /legacy/ 下未知路径时 404。
  if (req.url.startsWith('/legacy/') && fs.existsSync(path.join(distDir, 'index.html'))) {
    return reply.type('text/html; charset=utf-8').send(fs.readFileSync(path.join(distDir, 'index.html')));
  }
  return reply.code(404).type('text/plain; charset=utf-8').send('404 not found. 入口：/  后台：/admin/  底座版：/app/  Vue 版：/legacy/');
});

const port = Number(process.env.PORT || 8000);
try {
  await app.listen({ port, host: '127.0.0.1' });
  app.log.info(`统一入口 http://127.0.0.1:${port}/  (app: /app/  legacy: /legacy/  api: /api/)`);
} catch (err) {
  if (err.code === 'EADDRINUSE') {
    console.error(`[server] 端口 ${port} 已被占用。请关闭已运行的服务，或改用：$env:PORT=8002; npm run start`);
    process.exit(1);
  }
  throw err;
}

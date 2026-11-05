import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'qone-offline-acceptance-'));
const port = 9100 + Math.floor(Math.random() * 500);
const base = `http://127.0.0.1:${port}`;
const child = spawn(process.execPath, [path.join(root, 'server', 'index.mjs')], {
  cwd: root,
  env: { ...process.env, PORT:String(port), QONE_DATA_DIR:work },
  stdio: ['ignore', 'pipe', 'pipe'],
  windowsHide: true,
});
let logs = '';
child.stdout.on('data', chunk => { logs += chunk; });
child.stderr.on('data', chunk => { logs += chunk; });

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok:Boolean(ok), detail });
  if (!ok) throw new Error(`${name}：${detail || '未通过'}`);
};
async function waitReady() {
  for (let i = 0; i < 80; i++) {
    try { const response = await fetch(`${base}/api/health`); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`本地服务启动失败\n${logs.slice(-2000)}`);
}

let cookie = '';
async function api(url, options = {}) {
  const headers = { ...(options.body && !(options.body instanceof Uint8Array) ? { 'content-type':'application/json' } : {}), ...(cookie ? { cookie } : {}), ...(options.headers || {}) };
  const response = await fetch(`${base}${url}`, { ...options, headers });
  const type = response.headers.get('content-type') || '';
  const body = type.includes('json') ? await response.json() : new Uint8Array(await response.arrayBuffer());
  return { response, body };
}

try {
  await waitReady();
  const health = await api('/api/health');
  check('本地服务健康检查', health.response.ok && health.body.ok === true);

  const login = await api('/api/admin/login', { method:'POST', body:JSON.stringify({ account:'admin', pin:'0000' }) });
  cookie = String(login.response.headers.get('set-cookie') || '').split(';')[0];
  check('本地账号登录', login.response.ok && cookie.startsWith('qone_session='));

  const capabilities = await api('/api/admin/capabilities');
  const domains = capabilities.body.capabilities || [];
  check('六类竞品能力域', domains.length === 6 && domains.every(item => item.offline && item.status === 'available'), domains.map(item => item.name).join('、'));
  check('平台设备库离线镜像能力', domains.find(item => item.key === 'products')?.features.some(item => item.includes('平台设备库')));

  const platform = await api('/api/admin/platform-products?page=1&pageSize=20');
  check('平台设备库可浏览', platform.response.ok && platform.body.total >= 10);
  const copied = await api(`/api/admin/platform-products/${platform.body.products[0].id}/copy`, { method:'POST', body:'{}' });
  check('平台产品加入门店库草稿', copied.response.status === 201 && copied.body.status === '草稿' && copied.body.isSimulated === true);

  const beforeProducts = await api('/api/admin/products?page=1&pageSize=1');
  const failedImport = await api('/api/admin/products/import', { method:'POST', body:JSON.stringify({ products:[{ sku:'OK-ONE', name:'临时产品' }, { sku:'', name:'错误产品' }] }) });
  const afterProducts = await api('/api/admin/products?page=1&pageSize=1');
  check('产品导入失败整批回滚', failedImport.response.status === 400 && beforeProducts.body.total === afterProducts.body.total);

  const customer = await api('/api/admin/customers', { method:'POST', body:JSON.stringify({ name:'离线验收客户', phone:'13800000000', source:'验收脚本' }) });
  const project = await api('/api/admin/projects', { method:'POST', body:JSON.stringify({ name:'离线验收项目', customerId:customer.body.id, area:138, schemeType:'全屋智能', houseType:'三室两厅' }) });
  check('客户与项目创建', customer.response.ok && project.response.ok && customer.body.id && project.body.id);

  const snapshot = { furniture:[
    { id:'sofa-1', type:'sofa', cx:2000, cy:1600 },
    { id:'dev-1', type:'dev:筒灯', cx:1200, cy:900, smart:{ roomId:'living', status:'placed', source:'rule', ruleCode:'KT-DL-01', lighting:{ circuitId:'C-01', daliAddress:1 } } },
    { id:'dev-2', type:'dev:射灯', cx:2000, cy:900, smart:{ roomId:'living', status:'pending', source:'rule', ruleCode:'KT-SD-01', pendingReason:'演示障碍碰撞' } },
  ], zones:[{ id:'zone-1', name:'沙发区' }] };
  const design = await api(`/api/admin/projects/${project.body.id}/design-versions`, { method:'POST', body:JSON.stringify({ snapshot, ruleVersion:'2026-10-21-V1' }) });
  check('设计版本保存与数量审计', design.response.status === 201 && design.body.summary.devices === design.body.summary.placed + design.body.summary.pending, JSON.stringify(design.body.summary));

  const quote = await api('/api/admin/quotes', { method:'POST', body:JSON.stringify({ projectId:project.body.id, mode:'智能报价', designVersionId:design.body.id }) });
  check('报价版本与设计快照绑定', quote.response.status === 201 && quote.body.designVersionId === design.body.id && quote.body.payload.pricingBasis === 'design_snapshot');
  const exported = await api(`/api/admin/quotes/${quote.body.id}/export.csv`);
  check('报价导出', exported.response.ok && exported.body.byteLength > 50);

  const delivery = await api(`/api/admin/projects/${project.body.id}/delivery-packages`, { method:'POST', body:JSON.stringify({ designVersionId:design.body.id }) });
  check('施工交付包与六类成果', delivery.response.status === 201 && delivery.body.manifest.artifacts.filter(item => item.status === '已生成').length >= 6);

  const backup = await api('/api/admin/backup/file');
  check('完整备份导出', backup.response.ok && backup.body.byteLength > 100);
  const preview = await api('/api/admin/restore/preview', { method:'POST', body:backup.body, headers:{ 'content-type':'application/octet-stream' } });
  check('恢复前数量预览', preview.response.ok && preview.body.counts.projects >= 1 && preview.body.counts.products >= 1);
  const restore = await api('/api/admin/restore', { method:'POST', body:backup.body, headers:{ 'content-type':'application/octet-stream' } });
  check('备份恢复与回读', restore.response.ok && restore.body.overview.projects === preview.body.counts.projects && restore.body.overview.products <= preview.body.counts.products);

  const result = { passed:checks.filter(item => item.ok).length, failed:checks.filter(item => !item.ok).length, port, temporaryDataDir:work, checks };
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  console.error(JSON.stringify({ passed:checks.filter(item => item.ok).length, failed:1, error:error.message, checks, serverLog:logs.slice(-3000) }, null, 2));
  process.exitCode = 1;
} finally {
  if (child.exitCode === null) {
    child.kill();
    await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 2000))]);
  }
  fs.rmSync(work, { recursive:true, force:true });
}


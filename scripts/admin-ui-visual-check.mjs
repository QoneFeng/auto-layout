#!/usr/bin/env node
/**
 * Admin UI 视觉/几何回归检查。
 * 只依赖本机 Chrome 与 Node 22 内置 WebSocket，不引入 Playwright/Puppeteer。
 *
 * 用法：
 *   node scripts/admin-ui-visual-check.mjs [baseUrl] [outputDir]
 *   npm run verify:admin-ui
 *
 * 输出：每个视口每页 PNG + report.json；存在整页横向滚动、嵌套纵向滚动条（双滚动条）或 Console error 时退出码为 1。
 */
import { spawn } from 'node:child_process';
import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const baseUrl = (process.argv[2] || 'http://127.0.0.1:8000').replace(/\/$/, '');
const outputDir = path.resolve(process.argv[3] || path.join('AI doc', '20261031-智能家电门店系统', '证据', '20261104-AdminUI整改-视觉回归'));
const chromePath = process.env.CHROME_PATH || [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].find(candidate => fsSync.existsSync(candidate));

if (!chromePath) {
  console.error('未找到 Chrome，请设置 CHROME_PATH。');
  process.exit(2);
}

const viewports = [
  { name: '1440x900', width: 1440, height: 900, mobile: false },
  { name: '1024x768', width: 1024, height: 768, mobile: false },
  { name: '390x844', width: 390, height: 844, mobile: true },
];

const baseRoutes = [
  ['工作台', '/overview'],
  ['客户项目', '/projects'],
  ['设计方案', '/designs'],
  ['客户管理', '/customers'],
  ['产品库', '/products'],
  ['产品分类', '/products/categories'],
  ['报价单列表', '/quotes'],
  ['报价模板', '/quotes/templates'],
  ['库存管理', '/operations/inventory'],
  ['采购管理', '/operations/purchase'],
  ['收款记录', '/operations/payments'],
  ['门店资料', '/store/profile'],
  ['员工账号', '/store/staff'],
  ['角色权限', '/store/roles'],
  ['系统设置-报价与费用', '/settings/pricing'],
  ['系统设置-项目阶段与任务', '/settings/project-journey'],
  ['系统设置-默认设备', '/settings/devices'],
  ['系统设置-施工模板', '/settings/construction'],
  ['系统设置-数据备份', '/settings/backup'],
  ['系统设置-操作审计', '/settings/audit'],
];

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForJson(url, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return response.json();
    } catch { /* Chrome 尚未就绪 */ }
    await sleep(200);
  }
  throw new Error(`等待 ${url} 超时`);
}

function connectCdp(wsUrl) {
  const socket = new WebSocket(wsUrl);
  const pending = new Map();
  const events = [];
  let nextId = 0;
  socket.onmessage = event => {
    const message = JSON.parse(String(event.data));
    if (message.id && pending.has(message.id)) {
      const { resolve, reject } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) reject(new Error(`${message.error.message} (${message.error.code})`));
      else resolve(message.result);
      return;
    }
    events.push(message);
  };
  const ready = new Promise((resolve, reject) => {
    socket.onopen = resolve;
    socket.onerror = reject;
  });
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
  return { socket, ready, send, events };
}

function slug(value) {
  return value.replace(/[\\/:*?"<>|]+/g, '-').replace(/^-+|-+$/g, '') || 'page';
}

const tempProfile = await fs.mkdtemp(path.join(os.tmpdir(), 'qone-admin-ui-'));
const port = 9333 + Math.floor(Math.random() * 50);
const chrome = spawn(chromePath, [
  '--headless=new',
  '--disable-gpu',
  '--hide-scrollbars',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-extensions',
  `--remote-debugging-port=${port}`,
  `--user-data-dir=${tempProfile}`,
  '--window-size=1440,900',
  'about:blank',
], { stdio: 'ignore' });

let cdp;
const consoleErrors = [];
try {
  await waitForJson(`http://127.0.0.1:${port}/json/version`);
  await fs.mkdir(outputDir, { recursive: true });
  const target = await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent(`${baseUrl}/admin/`)}`, { method: 'PUT' }).then(response => response.json());
  cdp = connectCdp(target.webSocketDebuggerUrl);
  await cdp.ready;
  await cdp.send('Page.enable');
  await cdp.send('Runtime.enable');
  await cdp.send('Log.enable');
  cdp.socket.addEventListener('message', event => {
    const message = JSON.parse(String(event.data));
    if (message.method === 'Runtime.exceptionThrown') consoleErrors.push(message.params.exceptionDetails?.text || 'Runtime.exceptionThrown');
    if (message.method === 'Runtime.consoleAPICalled' && message.params.type === 'error') {
      consoleErrors.push(message.params.args?.map(arg => arg.value ?? arg.description ?? '').join(' '));
    }
    if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') {
      consoleErrors.push(`${message.params.entry.text} ${message.params.entry.url || ''}`.trim());
    }
  });
  await sleep(800);

  const evaluate = async (expression, awaitPromise = true) => {
    const result = await cdp.send('Runtime.evaluate', { expression, awaitPromise, returnByValue: true, userGesture: true });
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || '页面脚本执行失败');
    return result.result?.value;
  };

  for (let index = 0; index < 40; index += 1) {
    if (await evaluate("!!document.querySelector('.admin-shell, .login-screen')")) break;
    await sleep(200);
  }
  if (await evaluate("!!document.querySelector('.login-screen')")) {
    await evaluate("document.querySelector('.login-card').requestSubmit(); true");
    await sleep(1500);
    // 登录前首次请求返回 401 是预期行为，不计入交付页面的 Console error。
    consoleErrors.length = 0;
  }
  for (let index = 0; index < 50; index += 1) {
    if (await evaluate("!!document.querySelector('.admin-shell')")) break;
    await sleep(200);
  }

  const ids = await evaluate(`(async () => {
    const projects = await fetch('/api/admin/projects?page=1&pageSize=1').then(r => r.json());
    const products = await fetch('/api/admin/products?page=1&pageSize=1&status=在售').then(r => r.json());
    const designs = await fetch('/api/admin/designs?page=1&pageSize=1').then(r => r.json());
    const quotes = await fetch('/api/admin/quotes').then(r => r.json());
    return { project: projects.projects?.[0]?.id || '', product: products.products?.[0]?.id || '', design: designs.designs?.[0]?.id || '', quote: quotes.quotes?.[0]?.id || '' };
  })()`);

  const routes = [...baseRoutes, ['新建报价单', '/quotes/new'], ['新建报价单-手选', '/quotes/new/manual'], ['报价模板编辑', '/quotes/templates/new']];
  if (ids.project) routes.push(['项目详情', `/projects/${ids.project}`]);
  if (ids.design) routes.push(['设计方案详情', `/designs/${ids.design}`]);
  if (ids.product) routes.push(['产品详情', `/products/${ids.product}`], ['产品编辑', `/products/${ids.product}/edit`]);
  if (ids.quote) routes.push(['报价单详情', `/quotes/${ids.quote}`], ['报价单编辑', `/quotes/${ids.quote}/edit`]);

  const report = { generatedAt: new Date().toISOString(), baseUrl, viewports: {}, consoleErrors };
  let failures = 0;
  for (const viewport of viewports) {
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: viewport.width,
      height: viewport.height,
      deviceScaleFactor: 1,
      mobile: viewport.mobile,
      screenWidth: viewport.width,
      screenHeight: viewport.height,
    });
    const viewportDir = path.join(outputDir, viewport.name);
    await fs.mkdir(viewportDir, { recursive: true });
    report.viewports[viewport.name] = [];

    for (const [name, route] of routes) {
      await evaluate(`location.hash = ${JSON.stringify(route)}; true`);
      await sleep(1200);
      const metrics = await evaluate(`(() => {
        const de = document.documentElement;
        const content = document.querySelector('.page-content');
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return { route: location.hash, loggedIn: false, overflow: de.scrollWidth - de.clientWidth };
        const h2 = content?.querySelector('h2');
        const panel = content?.querySelector('.panel');
        const bar = document.querySelector('.product-savebar, .admin-savebar');
        const barActions = bar?.querySelector('div');
        // 嵌套纵向滚动条检测：除页面本身、侧栏、弹窗（弹窗内部滚动是允许的）之外，
        // 任何 overflow-y:auto/scroll 且实际产生纵向滚动的容器都算双滚动条回归。
        const nestedScroll = [...document.querySelectorAll('body *')].filter(el => {
          if (el.closest('.sidebar, .modal, .modal-backdrop')) return false;
          const oy = getComputedStyle(el).overflowY;
          if (oy !== 'auto' && oy !== 'scroll') return false;
          return el.clientHeight > 0 && el.scrollHeight - el.clientHeight > 2;
        }).map(el => {
          const cls = typeof el.className === 'string' ? el.className.trim().split(/\\s+/).slice(0, 3).join('.') : '';
          return (el.tagName.toLowerCase() + (cls ? '.' + cls : '')) + ' ' + el.clientHeight + '/' + el.scrollHeight;
        }).slice(0, 8);
        return {
          route: location.hash,
          overflow: de.scrollWidth - de.clientWidth,
          nestedScroll,
          sidebar: getComputedStyle(sidebar).width,
          titleSize: h2 ? getComputedStyle(h2).fontSize : null,
          panelRadius: panel ? getComputedStyle(panel).borderRadius : null,
          topbar: !!document.querySelector('.topbar'),
          pagination: !!content?.querySelector('.page-pagination'),
          savebar: bar ? {
            left: Math.round(bar.getBoundingClientRect().left),
            actionsLeft: Math.round(barActions.getBoundingClientRect().left),
            actionsOrder: getComputedStyle(barActions).order,
            statusOrder: getComputedStyle(bar.querySelector('span')).order,
          } : null,
          statusSteps: content?.querySelectorAll('.status-history__step').length || 0,
        };
      })()`);
      if (metrics.overflow !== 0 || metrics.loggedIn === false || (metrics.nestedScroll?.length || 0) > 0) failures += 1;
      const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', fromSurface: true });
      const file = path.join(viewportDir, `${slug(name)}.png`);
      await fs.writeFile(file, Buffer.from(screenshot.data, 'base64'));
      report.viewports[viewport.name].push({ name, ...metrics, screenshot: path.relative(process.cwd(), file) });
    }
  }

  report.failures = failures + consoleErrors.length;
  await fs.writeFile(path.join(outputDir, 'report.json'), JSON.stringify(report, null, 2), 'utf8');
  console.log(JSON.stringify({ outputDir, viewports: Object.keys(report.viewports), routes: routes.length, failures: report.failures }, null, 2));
  if (report.failures) process.exitCode = 1;
} finally {
  try { cdp?.socket.close(); } catch { /* ignore */ }
  chrome.kill();
  await sleep(400);
  await fs.rm(tempProfile, { recursive: true, force: true }).catch(() => {});
}

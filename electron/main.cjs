const { app, BrowserWindow, shell } = require('electron');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const desktopLogPath = process.env.QONE_DESKTOP_LOG ? path.resolve(process.env.QONE_DESKTOP_LOG) : '';
// 窗口标题带版本号，方便现场判断是否需要升级。
// 命名与交付包保持一致：QoneHome-智能家电门店管理系统-v<版本>
const WINDOW_TITLE = 'QoneHome-智能家电门店管理系统';
function windowTitle() {
  return `${WINDOW_TITLE}-v${app.getVersion()}`;
}
function desktopLog(message, error) {
  if (!desktopLogPath) return;
  try {
    const detail = error ? ` ${error.stack || error.message || String(error)}` : '';
    fs.appendFileSync(desktopLogPath, `${new Date().toISOString()} ${message}${detail}\n`, 'utf8');
  } catch {}
}

// 默认仍使用 Electron 的标准用户目录；离线迁移、便携部署和自动验收时，
// 可以显式指定一个可写目录，避免把业务数据绑定到固定 Windows 账号。
if (process.env.QONE_USER_DATA_DIR) {
  app.setPath('userData', path.resolve(process.env.QONE_USER_DATA_DIR));
}
desktopLog(`main-loaded packaged=${app.isPackaged} userData=${app.getPath('userData')}`);
desktopLog(`main-file-evaluated version=${app.getVersion()} execPath=${process.execPath}`);
process.on('uncaughtException', error => desktopLog('uncaughtException', error));
process.on('unhandledRejection', error => desktopLog('unhandledRejection', error));

const port = Number(process.env.QONE_PORT || 8123);
let serverProcess;

// Windows 10/11 部分显卡与系统安全策略组合会在 Chromium 沙箱或软件光栅器
// 初始化阶段直接崩溃。桌面壳只承载本机 127.0.0.1 页面，因此禁用硬件加速，
// 并保留 Node/Fastify 业务服务的进程隔离；不影响浏览器版运行。
app.disableHardwareAcceleration();
app.commandLine.appendSwitch('no-sandbox');
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-gpu-sandbox');
app.commandLine.appendSwitch('disable-software-rasterizer');
app.commandLine.appendSwitch('disable-features', 'RendererCodeIntegrity,WinSboxDisableExtensionPoints');

function rootDir() {
  if (!app.isPackaged) return path.resolve(__dirname, '..');
  // 兼容三种打包布局：
  //   1) resources/app/            —— 纯目录布局（本机 UES 会拦截 asar 内容写入，故采用）
  //   2) resources/app.asar.unpacked/ —— asar 开启且内容完整时
  //   3) resources/                —— 其余情况
  const candidates = [
    path.join(process.resourcesPath, 'app'),
    path.join(process.resourcesPath, 'app.asar.unpacked'),
    process.resourcesPath,
  ];
  for (const dir of candidates) {
    if (fs.existsSync(path.join(dir, 'server', 'index.mjs'))) return dir;
  }
  return process.resourcesPath;
}

function writableDataDir() {
  if (process.env.QONE_DATA_DIR) return path.resolve(process.env.QONE_DATA_DIR);
  if (!app.isPackaged) return path.join(rootDir(), 'data', 'local');
  const target = path.join(app.getPath('userData'), 'store-data');
  const seed = path.join(rootDir(), 'data', 'local');
  if (!fs.existsSync(path.join(target, 'smart-home-store.db')) && fs.existsSync(seed)) {
    fs.mkdirSync(target, { recursive: true });
    fs.cpSync(seed, target, { recursive: true, force: false });
  }
  return target;
}

async function waitForServer(url, attempts = 40) {
  for (let i = 0; i < attempts; i += 1) {
    try { const response = await fetch(url); if (response.ok) return; } catch {}
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  throw new Error(`本地服务启动超时：${url}`);
}

function startServer() {
  const root = rootDir();
  const server = path.join(root, 'server', 'index.mjs');
  const runtime = app.isPackaged ? path.join(root, 'runtime', 'node.exe') : (process.env.npm_node_execpath || 'node');
  desktopLog(`start-server runtime=${runtime} server=${server} data=${writableDataDir()}`);
  serverProcess = spawn(runtime, [server], {
    cwd: root,
    env: { ...process.env, PORT: String(port), QONE_DATA_DIR: writableDataDir(), QONE_APP_VERSION: app.getVersion() },
    stdio: 'inherit',
    windowsHide: true,
  });
  serverProcess.on('error', (error) => { desktopLog('local-server-spawn-failed', error); console.error('[desktop] local server spawn failed', error); });
  serverProcess.on('exit', (code) => { if (code && !app.isQuitting) { desktopLog(`local-server-exited code=${code}`); console.error(`[desktop] local server exited: ${code}`); } });
}

async function createWindow() {
  startServer();
  await waitForServer(`http://127.0.0.1:${port}/api/health`);
  desktopLog(`local-server-ready port=${port}`);
  const win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1180,
    minHeight: 720,
    backgroundColor: '#f5f6f4',
    // 默认最大化；配合 show:false + did-finish-load 再显示，避免最大化过程露出白屏
    maximized: true,
    show: false,
    title: windowTitle(),
    webPreferences: { contextIsolation: true, sandbox: true },
  });
  // 页面里的 <title> 会同步覆盖 BrowserWindow 的标题，Electron 默认允许。
  // 这里拦截它，保证标题栏始终显示带版本号的自定义标题。
  win.on('page-title-updated', (event) => {
    event.preventDefault();
  });
  // 页面加载完成后再写一次标题并最大化。setTitle 放在 loadURL 之后无效，
  // 因为页面 <title> 会在加载完成时把标题改回去。
  const applyWindowChrome = () => {
    if (win.isDestroyed()) return;
    win.setTitle(windowTitle());
    if (!win.isMaximized()) win.maximize();
    desktopLog(`window-title="${win.getTitle()}" maximized=${win.isMaximized()}`);
  };
  win.on('did-finish-load', () => {
    applyWindowChrome();
    win.show();
  });
  // ready-to-show 是 Electron 推荐的「首屏已渲染、无白屏」时机
  win.once('ready-to-show', () => {
    applyWindowChrome();
    win.show();
  });
  // 兜底：页面加载异常时也要把窗口显示出来，不能让用户对着空桌面等
  setTimeout(() => {
    if (win.isDestroyed()) return;
    applyWindowChrome();
    if (!win.isVisible()) win.show();
  }, 3000);
  await win.loadURL(`http://127.0.0.1:${port}/admin/`);
  desktopLog('window-ready');
  win.webContents.setWindowOpenHandler(({ url }) => { if (!url.startsWith(`http://127.0.0.1:${port}`)) shell.openExternal(url); return { action: 'deny' }; });
}

app.whenReady().then(() => createWindow().catch(error => { desktopLog('create-window-failed', error); console.error(error); app.quit(); }));
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('before-quit', () => { app.isQuitting = true; if (serverProcess && !serverProcess.killed) serverProcess.kill(); });

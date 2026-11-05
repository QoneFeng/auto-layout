/**
 * 把 electron-builder 的 asar 布局转换成 Electron 的纯目录布局。
 *
 * 背景（2026-11-04 实测）：
 *   本机的终端安全软件（安恒 UES）会拦截 electron/asar 写入 asar **内容**，
 *   结果是 app.asar 只有 3.3 MB 的目录索引、真实内容全在 app.asar.unpacked/，
 *   而被标记为「在 asar 内」的 electron/main.cjs 内容为空 —— Electron 启动时
 *   找不到入口，进程会静默退出（表现为双击闪退、无任何日志）。
 *
 *   electron-builder 没有开关能让 files 里显式列出的路径（如 electron/**\/*）
 *   也落到 unpacked，所以这里做一次后处理：
 *     1) 把 app.asar.unpacked/ 的内容复制成 resources/app/；
 *     2) 从源码补齐 electron/ 与 package.json；
 *     3) 删除 app.asar。
 *   Electron 会优先加载 resources/app/ 目录，绕开被拦截的 asar 写入。
 *
 * 用法：node scripts/fix-asar-layout.mjs <appOutDir>
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const appOutDir = process.argv[2];
if (!appOutDir) {
  console.error('用法：node scripts/fix-asar-layout.mjs <appOutDir>');
  process.exit(1);
}

const resources = path.join(appOutDir, 'resources');
const unpacked = path.join(resources, 'app.asar.unpacked');
const appDir = path.join(resources, 'app');
const asarFile = path.join(resources, 'app.asar');

if (!fs.existsSync(unpacked) && !fs.existsSync(appDir)) {
  console.log('[fix-asar] 没有 app.asar.unpacked，跳过。');
  process.exit(0);
}

fs.mkdirSync(appDir, { recursive: true });

// 1) 仅当 resources/app/ 缺少主进程入口时才从 unpacked 复制。
//    electron-builder 在 asarUnpack=["**/*"] 下已经把内容放到位，
//    重复复制 13000+ 文件既慢又容易撞上文件锁。
const hasEntry = fs.existsSync(path.join(appDir, 'electron', 'main.cjs'));
if (!hasEntry && fs.existsSync(unpacked)) {
  const copy = spawnSync('robocopy.exe', [
    unpacked, appDir, '/E', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NP', '/MT:16',
  ], { stdio: 'ignore', shell: false });
  if ((copy.status ?? 1) >= 8) {
    console.error(`[fix-asar] robocopy 失败（退出码 ${copy.status}）`);
    process.exit(copy.status ?? 1);
  }
}

// 2) 补齐主进程入口与 package.json
const electronSrc = path.join(root, 'electron');
const electronDst = path.join(appDir, 'electron');
fs.mkdirSync(electronDst, { recursive: true });
for (const name of fs.readdirSync(electronSrc)) {
  fs.copyFileSync(path.join(electronSrc, name), path.join(electronDst, name));
}
fs.copyFileSync(path.join(root, 'package.json'), path.join(appDir, 'package.json'));

// 3) 让 app.asar 失效。
//    注意：Electron 加载 app 的优先级是 resources/app.asar > resources/app/。
//    本机 asar 的大文件内容写不进去（小文件可以），所以 asar 里的 main.cjs
//    是「能跑但版本旧」的那份 —— 不处理它，改了新代码也不会生效。
//    删除常被安全软件/工具链策略拦下，改名更可靠：Electron 找不到 app.asar
//    就只会用 resources/app/。
const asarDisabled = `${asarFile}.disabled`;
if (fs.existsSync(asarFile)) {
  try {
    fs.rmSync(asarDisabled, { force: true });
  } catch {}
  try {
    fs.renameSync(asarFile, asarDisabled);
    console.log('[fix-asar] app.asar 已改名为 app.asar.disabled（Electron 将改用 resources/app/）。');
  } catch {
    console.log('[fix-asar] app.asar 未能改名，Electron 仍会优先加载它，需人工处理。');
  }
}
// unpacked 副本与 resources/app/ 内容重复，同样排除；删不掉不影响运行。
try {
  fs.rmSync(unpacked, { recursive: true, force: true });
} catch {
  console.log('[fix-asar] unpacked 副本未能删除，将由部署/ZIP 阶段排除。');
}

const count = fs.readdirSync(appDir, { withFileTypes: true }).length;
console.log(`[fix-asar] resources/app/ 布局就绪（顶层 ${count} 项）。`);

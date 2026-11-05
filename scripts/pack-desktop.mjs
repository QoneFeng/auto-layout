/**
 * Windows 桌面安装包打包脚本。
 *
 * 为什么需要它：
 *   electron-builder 在打包前会 `emptyDir(appOutDir)`，也就是先清空
 *   `release\win-unpacked`。如果上一次打包留下的 `.asar` 被终端安全软件
 *   （本机为安恒 UES / DAS-Security）以独占方式持有，删除会直接抛
 *   `EBUSY: resource busy or locked, unlink ...default_app.asar`，
 *   整个打包在「packaging」阶段就中断。
 *
 *   这些 .asar 被安全软件的扫描引擎长时间持有（实测超过一小时不释放），
 *   代码层面无法强行删除。因此这里换一个思路：
 *   每次打包都使用一个**全新的临时输出目录**，目录不存在就不会触发 emptyDir，
 *   从根上避开删除动作；打包完成后把安装包移回 `release/`，临时目录尽力清理，
 *   清理不掉的残骸由 `npm run clean:release` 兜底。
 *
 * 产物落点：安装包统一在 `release/`，中间目录为 `release/.build-<时间戳>`。
 *
 * 用法：node scripts/pack-desktop.mjs [--portable-only|--nsis-only]
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const releaseDir = path.join(root, 'release');
const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/[:T]/g, '').slice(0, 14);
const buildDir = path.join(releaseDir, `.build-${stamp}`);
const builderCli = path.join(root, 'node_modules', 'electron-builder', 'cli.js');

const args = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
};
const targetFilter = args.includes('--portable-only')
  ? ['--win', 'portable']
  : args.includes('--nsis-only')
    ? ['--win', 'nsis']
    : ['--win'];

function step(label, command, commandArgs, options = {}) {
  console.log(`\n=== ${label} ===`);
  console.log(`> ${command} ${commandArgs.join(' ')}`);
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || root,
    stdio: 'inherit',
    shell: false,
    // Windows 下 npx/npm 需要 shell 才能找到 .cmd 包装脚本
    ...(process.platform === 'win32' && /\.(cmd|bat)$/i.test(command) ? { shell: true } : {}),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${label} 失败（退出码 ${result.status}）`);
}

// 1. 打 NSIS 模板补丁（绕过 CopyFiles）
step('修补 NSIS 解压模板', process.execPath, [path.join(root, 'scripts', 'patch-nsis-template.mjs')]);

// 2. 构建前端与规则包
step('构建前端', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build']);
step('构建规则包', process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build:rules']);

// 3. 解包应用到全新临时目录（不触发 emptyDir，避开文件锁）
step('解包应用', process.execPath, [
  builderCli,
  ...targetFilter,
  '--dir',
  `--config.directories.output=${buildDir}`,
]);

// 3.1 把 asar 布局转换为 Electron 的纯目录布局。
// 本机安全软件会拦截 electron/asar 写入内容，导致 app.asar 只有索引、
// 主进程入口为空，Electron 启动即静默退出。详见 scripts/fix-asar-layout.mjs。
step('修正 asar 布局', process.execPath, [
  path.join(root, 'scripts', 'fix-asar-layout.mjs'),
  path.join(buildDir, 'win-unpacked'),
]);

// 3.5 可选：解包完成后立刻把应用铺到目标目录。
// 必须放在生成安装包之前——electron-builder 的 --prepackaged 阶段会把源目录搬空，
// 而本机的终端安全软件还会持续清除解包目录里的文件，时间窗很窄。
const deployTarget = getArg('--deploy', '');
if (deployTarget) {
  step('部署到目标目录', process.execPath, [
    path.join(root, 'scripts', 'deploy-green.mjs'),
    '--source', path.join(buildDir, 'win-unpacked'),
    '--target', deployTarget,
  ]);
}

// 4. 用已解包的内容生成安装包。
// 受管控终端装不了 NSIS 安装包（安装器写入被拦），且它会重复携带 app.asar.unpacked 残留，
// 因此交付以 ZIP 绿色包为主；需要安装包时用 --nsis-only 显式开启。
if (!args.includes('--no-nsis')) {
  step('生成安装包', process.execPath, [
    builderCli,
    ...targetFilter,
    '--prepackaged',
    path.join(buildDir, 'win-unpacked'),
    `--config.directories.output=${buildDir}`,
  ]);
}

// 5. 把安装包移到 release/ 根目录
if (!fs.existsSync(releaseDir)) fs.mkdirSync(releaseDir, { recursive: true });
const artifacts = fs.readdirSync(buildDir).filter(name => name.endsWith('.exe'));
for (const name of artifacts) {
  const from = path.join(buildDir, name);
  const to = path.join(releaseDir, name);
  fs.copyFileSync(from, to);
  console.log(`产物：${path.relative(root, to)}（${(fs.statSync(to).size / 1024 / 1024).toFixed(0)} MB）`);
}

// 5.5 可选：打 ZIP 绿色包（解压双击即用，不经过安装器）
const zipTarget = getArg('--zip', '');
if (zipTarget) {
  const dirName = path.basename(path.resolve(zipTarget));
  const parentDir = path.dirname(path.resolve(zipTarget));
  const appVersion = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;
  // 交付命名：QoneHome-智能家电门店管理系统-v<版本>-绿色版.zip
  // （产品中文名 + v 前缀版本号，客户拿到文件名即可判断版本与形态）
  const zipPath = path.join(releaseDir, `QoneHome-智能家电门店管理系统-v${appVersion}-绿色版.zip`);
  // 用 7z 而非 tar：Windows 自带的是 GNU tar，不支持创建 zip（会生成 tar 格式改扩展名），
  // 且 GNU tar 把带盘符的路径当成远程主机。-mmt=on 多线程、-mx=3 对 760MB 约 13 秒。
  // 排除 app.asar.unpacked（asar 布局残留副本）与 app.asar.disabled（被改名的 asar）：
  // 两者都与 resources/app/ 内容重复，且 Electron 只加载后者。
  // 输出必须用绝对路径：7z 在 cwd 下用相对名会把 archive 当成待压缩的源文件而报
  // 「cannot open file」。
  const sevenZip = path.join(root, 'node_modules', 'electron-winstaller', 'vendor', '7z.exe');
  step('打包 ZIP 绿色版', sevenZip, [
    'a', '-tzip', '-mx=3', '-mmt=on', '-bso0', '-bsp0',
    '-xr!app.asar.unpacked', '-xr!app.asar.disabled', zipPath, dirName,
  ], { cwd: parentDir });
  console.log(`ZIP 产物：${path.relative(root, zipPath)}（${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(0)} MB）`);
}

// 6. 清理临时目录与历史残骸（被安全软件锁住时会失败，留给 clean:release）
const leftovers = [];
function cleanup(dir) {
  if (!fs.existsSync(dir)) return;
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch {
    leftovers.push(dir);
  }
}
cleanup(buildDir);
for (const entry of fs.readdirSync(releaseDir, { withFileTypes: true })) {
  if (entry.isDirectory() && entry.name.startsWith('.build-')) cleanup(path.join(releaseDir, entry.name));
}

console.log('\n=== 打包完成 ===');
console.log(`安装包目录：${path.relative(root, releaseDir)}`);
if (leftovers.length) {
  console.log(`以下临时目录被安全软件占用未能删除，重启后执行 npm run clean:release：`);
  for (const dir of leftovers) console.log(`  ${path.relative(root, dir)}`);
}

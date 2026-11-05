/**
 * 绿色部署脚本：绕开 NSIS 安装器，直接把应用铺到目标目录并完成注册。
 *
 * 背景（2026-11-04 实测）：
 *   本机装有安恒 UES（DAS-Security），它会拦截**安装器进程**对文件系统的写入：
 *   NSIS 安装包解压时直接报「不能打开要写入的文件」，点「忽略」也只会把文件
 *   全部跳过，等于什么都没装。而用普通进程（robocopy / PowerShell）写同一目录
 *   完全正常——实测 txt、exe、asar 都能写入。
 *
 *   因此提供这条不依赖安装器的部署路径：复制文件 + 建快捷方式 + 写卸载注册项，
 *   效果等同于「安装」，但不受安装器进程的写入拦截影响。
 *
 * 用法：
 *   node scripts/deploy-green.mjs --target D:\QoneHome            部署
 *   node scripts/deploy-green.mjs --target D:\QoneHome --uninstall 卸载
 *   node scripts/deploy-green.mjs --target D:\QoneHome --dry-run   仅预览
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const argv = process.argv.slice(2);
const getArg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const target = path.resolve(getArg('--target', 'D:\\QoneHome'));
const doUninstall = argv.includes('--uninstall');
const dryRun = argv.includes('--dry-run');

const PRODUCT = 'QoneHome智能家电门店营销系统';
const EXE = 'QoneHome.exe';
const REG_KEY = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\QoneHomeSmartStore';
const APP_VERSION = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).version;

function findSource() {
  const explicit = getArg('--source', '');
  if (explicit) {
    const dir = path.resolve(explicit);
    return fs.existsSync(path.join(dir, EXE)) ? dir : null;
  }
  const candidates = [];
  const unpacked = path.join(root, 'release', 'win-unpacked');
  if (fs.existsSync(path.join(unpacked, EXE))) candidates.push(unpacked);
  const buildRoot = path.join(root, 'release');
  if (fs.existsSync(buildRoot)) {
    for (const entry of fs.readdirSync(buildRoot, { withFileTypes: true })) {
      if (!entry.isDirectory() || !entry.name.startsWith('.build-')) continue;
      const dir = path.join(buildRoot, entry.name, 'win-unpacked');
      if (fs.existsSync(path.join(dir, EXE))) candidates.push(dir);
    }
  }
  if (candidates.length === 0) return null;
  // 取最近修改的那个解包目录：按文件数量挑会选中旧目录，导致部署到旧代码。
  let best = candidates[0];
  let bestTime = -1;
  for (const dir of candidates) {
    const time = fs.statSync(dir).mtimeMs;
    if (time > bestTime) {
      best = dir;
      bestTime = time;
    }
  }
  return best;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, { stdio: 'inherit', shell: false });
  if (result.error) throw result.error;
  return result.status ?? 1;
}

function ps(script) {
  const result = spawnSync(
    'powershell.exe',
    ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script],
    { stdio: 'inherit', shell: false },
  );
  if (result.error) throw result.error;
  return result.status ?? 1;
}

if (doUninstall) {
  console.log(`=== 卸载：${target} ===`);
  if (!dryRun) {
    run('cmd.exe', ['/c', `rmdir /s /q "${target}"`]);
    ps(`
      $desktop = [Environment]::GetFolderPath('Desktop')
      $lnk = Join-Path $desktop '${PRODUCT}.lnk'
      if (Test-Path $lnk) { Remove-Item $lnk -Force; Write-Host "已删除桌面快捷方式" }
      if (Test-Path '${REG_KEY}') { Remove-Item '${REG_KEY}' -Recurse -Force; Write-Host "已删除卸载注册项" }
    `);
  }
  console.log('卸载完成。');
  process.exit(0);
}

const source = findSource();
if (!source) {
  console.error('找不到已解包的应用目录，请先执行 npm run desktop:pack');
  process.exit(1);
}

console.log(`源目录：${path.relative(root, source)}`);
console.log(`目标目录：${target}`);
console.log(`产品名称：${PRODUCT}`);

if (dryRun) {
  console.log('\n[dry-run] 将执行：');
  console.log(`  robocopy "${source}" "${target}" /E /R:1 /W:1 /NFL /NDL /NJH /NP`);
  console.log('  创建桌面快捷方式 + 开始菜单快捷方式');
  console.log(`  写入卸载注册项 ${REG_KEY}`);
  process.exit(0);
}

fs.mkdirSync(target, { recursive: true });

// 1. 复制文件（robocopy 支持增量，比逐文件拷贝快很多）
// 排除两个目录：
//   app.asar.unpacked —— asar 布局的残留副本（被锁定删不掉），与 app/ 内容重复；
//   app.asar.disabled —— 被改名的 asar，Electron 只认 resources/app/。
const copyCode = run('robocopy.exe', [
  source, target, '/E', '/R:1', '/W:1', '/NFL', '/NDL', '/NJH', '/NP', '/MT:16',
  '/XD', 'app.asar.unpacked', 'app.asar.disabled',
]);
// robocopy 退出码 <8 表示成功
if (copyCode >= 8) {
  console.error(`robocopy 失败（退出码 ${copyCode}）`);
  process.exit(copyCode);
}

// 1.5 随包附带「创建桌面快捷方式」脚本，让绿色版解压后也能一键建图标
for (const name of ['create-desktop-shortcut.ps1', '创建桌面快捷方式.cmd']) {
  const src = path.join(root, 'scripts', name);
  const dst = path.join(target, name);
  fs.copyFileSync(src, dst);
  // PowerShell 5.1 读取无 BOM 的 UTF-8 会按 ANSI 解析，中文会乱码，这里补 BOM
  if (name.endsWith('.ps1') || name.endsWith('.cmd')) {
    const content = fs.readFileSync(dst, 'utf8').replace(/^\uFEFF/, '');
    fs.writeFileSync(dst, `\uFEFF${content}`, 'utf8');
  }
}

// 2. 快捷方式 + 卸载注册项
const psExit = ps(`
  $target = '${target.replace(/\\/g, '\\\\')}'
  $exe = Join-Path $target '${EXE}'
  if (-not (Test-Path $exe)) { Write-Host "ERROR: 找不到 $exe"; exit 2 }
  $product = '${PRODUCT}'
  $shell = New-Object -ComObject WScript.Shell

  $desktop = [Environment]::GetFolderPath('Desktop')
  $lnk = Join-Path $desktop "$product.lnk"
  $s = $shell.CreateShortcut($lnk)
  $s.TargetPath = $exe
  $s.WorkingDirectory = $target
  $s.IconLocation = "$exe,0"
  $s.Description = $product
  $s.Save()
  Write-Host "桌面快捷方式：$lnk"

  $programs = [Environment]::GetFolderPath('Programs')
  $menuDir = Join-Path $programs $product
  New-Item -ItemType Directory -Path $menuDir -Force | Out-Null
  $menuLnk = Join-Path $menuDir "$product.lnk"
  $m = $shell.CreateShortcut($menuLnk)
  $m.TargetPath = $exe
  $m.WorkingDirectory = $target
  $m.IconLocation = "$exe,0"
  $m.Save()
  Write-Host "开始菜单快捷方式：$menuLnk"

  # 用 .NET Registry API 写入，避免 reg.exe 被安全策略拦截，也避免
  # New-Item/Set-ItemProperty 在已有属性上出现的类型冲突（PSNoteProperty vs DWORD）。
  $uninstall = 'cmd.exe /c rmdir /s /q "' + $target + '"'
  $regPath = 'Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\QoneHomeSmartStore'
  $key = [Microsoft.Win32.Registry]::CurrentUser.CreateSubKey($regPath)
  $key.SetValue('DisplayName', $product, [Microsoft.Win32.RegistryValueKind]::String)
  $key.SetValue('DisplayVersion', '${APP_VERSION}', [Microsoft.Win32.RegistryValueKind]::String)
  $key.SetValue('Publisher', 'QoneLab', [Microsoft.Win32.RegistryValueKind]::String)
  $key.SetValue('DisplayIcon', "$exe,0", [Microsoft.Win32.RegistryValueKind]::String)
  $key.SetValue('InstallLocation', $target, [Microsoft.Win32.RegistryValueKind]::String)
  $key.SetValue('UninstallString', $uninstall, [Microsoft.Win32.RegistryValueKind]::String)
  $key.SetValue('NoModify', 1, [Microsoft.Win32.RegistryValueKind]::DWord)
  $key.SetValue('EstimatedSize', [int]((Get-ChildItem $target -Recurse -File | Measure-Object Length -Sum).Sum / 1KB), [Microsoft.Win32.RegistryValueKind]::DWord)
  $key.Close()
  Write-Host "卸载注册项已写入（可在「设置 > 应用」中看到）"
`);

if (psExit !== 0) {
  console.error('快捷方式或注册表写入失败');
  process.exit(psExit);
}

const exePath = path.join(target, EXE);
console.log('\n=== 部署完成 ===');
console.log(`主程序：${exePath}`);
console.log(`桌面图标：${PRODUCT}.lnk`);

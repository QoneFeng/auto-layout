/**
 * 修补 electron-builder 的 NSIS 解压模板。
 *
 * 背景（2026-11-04 实测）：
 *   默认模板把 app-64.7z 解压到 $PLUGINSDIR\7z-out，再用 NSIS 的 `CopyFiles`
 *   搬到 $INSTDIR。`CopyFiles` 底层是 shell 的 SHFileOperation，在装有终端安全
 *   管控软件（本机为安恒 UES / DAS-Security）的 Windows 上会被静默拦截：
 *   复制 0 个文件、1.6 秒内返回失败，安装器因此弹出「无法关闭，请手动关闭后重试」
 *   并中止，最终表现为装完没有快捷方式、注册表里也查不到应用。
 *
 *   这里改为让 7z 插件直接解压到 $INSTDIR，完全绕开 CopyFiles。
 *   代价：失去「先解到临时目录再原子替换」的容错；收益：安装不再被拦截。
 *
 * 该脚本幂等，可重复执行；electron-builder 升级后重跑即可重新打补丁。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const target = path.join(
  root,
  'node_modules',
  'app-builder-lib',
  'templates',
  'nsis',
  'include',
  'extractAppPackage.nsh',
);

const MARKER = '# QONE_PATCH_DIRECT_EXTRACT';
const MACRO_HEAD = '!macro extractUsing7za FILE';

const replacement = `${MACRO_HEAD}
  ${MARKER}
  # 直接解压到安装目录，不经过 CopyFiles（SHFileOperation 会被终端安全软件拦截）。
  SetOutPath $INSTDIR
  Nsis7z::Extract "\${FILE}"
  Pop $R0
!macroend`;

if (!fs.existsSync(target)) {
  console.error(`[patch-nsis] 找不到模板文件：${target}`);
  process.exit(1);
}

const source = fs.readFileSync(target, 'utf8');

if (source.includes(MARKER)) {
  console.log('[patch-nsis] 模板已是补丁状态，跳过。');
  process.exit(0);
}

const start = source.indexOf(MACRO_HEAD);
if (start === -1) {
  console.error('[patch-nsis] 未找到 extractUsing7za 宏，模板结构可能已变化，请人工确认。');
  process.exit(1);
}

const endMarker = '\n!macroend';
const end = source.indexOf(endMarker, start);
if (end === -1) {
  console.error('[patch-nsis] 未找到宏结束标记，模板结构可能已变化，请人工确认。');
  process.exit(1);
}

const patched = source.slice(0, start) + replacement + source.slice(end + endMarker.length);
fs.writeFileSync(target, patched, 'utf8');
console.log('[patch-nsis] 已改为 7z 直接解压到 $INSTDIR（绕过 CopyFiles）。');

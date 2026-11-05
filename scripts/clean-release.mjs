/**
 * 清理 electron-builder 的中间输出目录。
 *
 * 约定：安装包与解包目录统一产出到 `release/`，不再使用 release-xxx 这类并行目录。
 * 本脚本用于收拾历史遗留：
 *   - 删除仓库根目录下所有 `release-*` 目录；
 *   - 删除 `release/win-unpacked` 解包目录；
 *   - 保留 `release/` 下的安装包（*.exe）与 builder 配置文件。
 *
 * 注意：若某个 .asar 正被编辑器索引或安全软件扫描，删除会失败。
 * 脚本会逐个文件尽力删除，并在最后报告仍被占用的路径；重启后再跑一次即可清空。
 *
 * 用法：node scripts/clean-release.mjs [--dry-run]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const locked = [];

/** 逐层删除，单文件失败不中断整体流程（每个目录只遍历一次，不重试，避免死循环） */
function removeTree(target) {
  if (!fs.existsSync(target)) return true;
  if (dryRun) {
    console.log(`[dry-run] 将删除 ${path.relative(root, target)}`);
    return true;
  }

  // 快路径：一次性递归删除
  try {
    fs.rmSync(target, { recursive: true, force: true });
  } catch {
    // 落到下面的兜底逻辑
  }
  if (!fs.existsSync(target)) return true;

  // 兜底：自底向上逐层清空，被占用的文件记录下来后跳过
  const walk = (dir) => {
    let entries = [];
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
        try { fs.rmdirSync(full); } catch {}
      } else {
        try { fs.unlinkSync(full); } catch { locked.push(full); }
      }
    }
  };
  walk(target);
  try { fs.rmdirSync(target); } catch {}
  return !fs.existsSync(target);
}

const removed = [];
const kept = [];

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (!entry.name.startsWith('release-')) continue;
  const full = path.join(root, entry.name);
  if (removeTree(full)) removed.push(entry.name);
  else kept.push(entry.name);
}

const unpacked = path.join(root, 'release', 'win-unpacked');
if (fs.existsSync(unpacked)) {
  if (removeTree(unpacked)) removed.push('release/win-unpacked');
  else kept.push('release/win-unpacked');
}

// 打包脚本留下的临时输出目录：release/.build-<时间戳> 与早期的 release/.tmp
for (const entry of fs.readdirSync(path.join(root, 'release'), { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  if (!entry.name.startsWith('.build-') && entry.name !== '.tmp') continue;
  const full = path.join(root, 'release', entry.name);
  if (removeTree(full)) removed.push(`release/${entry.name}`);
  else kept.push(`release/${entry.name}`);
}

console.log(`已清理：${removed.length ? removed.join('、') : '无'}`);
if (kept.length) {
  console.log(`仍被占用（重启后再执行一次本脚本）：${kept.join('、')}`);
}
if (locked.length) {
  console.log(`被占用的文件（${locked.length} 个）：`);
  for (const file of locked.slice(0, 20)) console.log(`  ${path.relative(root, file)}`);
}

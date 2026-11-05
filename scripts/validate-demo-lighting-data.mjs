import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'data', 'demo-lighting', '20261030-v1');

const errors = [];
const check = (ok, message) => { if (!ok) errors.push(message); };

const data = JSON.parse(await fs.readFile(path.join(DIR, 'combined.json'), 'utf8'));
const { manifest, products, obstacles, circuits, controls, scenes, standard } = data;

check(manifest?.version === '20261030-v1', 'manifest.version 不是 20261030-v1');
check(Object.keys(products).length === 20, `产品数应为 20，实际 ${Object.keys(products).length}`);
check(obstacles.length === 15, `障碍物空间数应为 15，实际 ${obstacles.length}`);
check(circuits.length === 38, `回路数应为 38，实际 ${circuits.length}`);
check(Object.keys(standard.targets).length === 15, '照度目标空间数应为 15');
check(scenes.length === 5, `场景数应为 5，实际 ${scenes.length}`);
check(controls.length === 15, `控制绑定空间数应为 15，实际 ${controls.length}`);

const active = Object.values(products).filter((p) => p.photometryStatus !== 'not_applicable');
check(active.length === 17, `有源产品数应为 17，实际 ${active.length}`);
for (const p of active) {
  for (const rel of [p.iesFile, p.ldtFile]) {
    check(!!rel, `${p.productId} 缺少配光文件路径`);
    if (!rel) continue;
    const stat = await fs.stat(path.join(DIR, rel)).catch(() => null);
    check(!!stat && stat.size > 0, `${p.productId} 配光文件不存在或为空：${rel}`);
  }
}
const passive = Object.values(products).filter((p) => p.photometryStatus === 'not_applicable');
check(passive.length === 3, `被动载体数应为 3，实际 ${passive.length}`);

const circuitLights = circuits.reduce((s, c) => s + c.lightCount, 0);
check(circuitLights === 205, `回路灯位数应为 205，实际 ${circuitLights}`);
const circuitIds = new Set(circuits.map((c) => c.circuitId));
let controlCount = 0;
for (const space of controls) {
  check(space.controls.some((c) => c.role === 'switch'), `${space.spaceCode} 缺少开关绑定`);
  check(space.controls.some((c) => c.role === 'scene'), `${space.spaceCode} 缺少情景面板绑定`);
  for (const c of space.controls) {
    controlCount++;
    check(c.circuitIds.length > 0, `${space.spaceCode}/${c.role} 没有绑定回路`);
    for (const id of c.circuitIds) check(circuitIds.has(id), `${space.spaceCode}/${c.role} 绑定不存在的回路 ${id}`);
  }
}
const byGateway = new Map();
for (const c of circuits) {
  check(!!c.gatewayId, `${c.circuitId} 缺少网关`);
  check(c.daliAddressStart >= 0 && c.daliAddressEnd <= 63, `${c.circuitId} DALI 地址越界`);
  check(c.daliAddressEnd >= c.daliAddressStart, `${c.circuitId} DALI 地址区间非法`);
  const list = byGateway.get(c.gatewayId) || [];
  list.push(c);
  byGateway.set(c.gatewayId, list);
}
for (const [gateway, list] of byGateway) {
  const ranges = list.map((c) => [c.daliAddressStart, c.daliAddressEnd]).sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < ranges.length; i++) {
    check(ranges[i][0] > ranges[i - 1][1], `${gateway} 的 DALI 地址区间重叠`);
  }
}

let sceneRows = 0;
for (const scene of scenes) {
  check(scene.rows.length === 45, `${scene.id} 场景行数应为 45`);
  for (const row of scene.rows) {
    sceneRows++;
    check(row.level >= 0 && row.level <= 100, `${scene.id}/${row.spaceCode}/${row.layer} 亮度越界`);
    check(row.cct >= 2700 && row.cct <= 4000, `${scene.id}/${row.spaceCode}/${row.layer} 色温越界`);
  }
}
check(sceneRows === 225, `场景总行数应为 225，实际 ${sceneRows}`);

const acPresent = obstacles.filter((o) => o.ac?.present).length;
check(acPresent === 8, `空调空间数应为 8，实际 ${acPresent}`);
for (const o of obstacles) {
  if (o.ac?.present) {
    check(o.ac.width > 0 && o.ac.depth > 0 && o.ac.z1 > o.ac.z0, `${o.spaceCode} 空调尺寸/标高非法`);
  }
  if (o.curtainBox?.present) {
    check(o.curtainBox.depth > 0 && o.curtainBox.z1 > o.curtainBox.z0, `${o.spaceCode} 窗帘盒尺寸/标高非法`);
  }
  if (o.accessPanel?.present) {
    check(o.accessPanel.width > 0 && o.accessPanel.depth > 0, `${o.spaceCode} 检修口尺寸非法`);
  }
}

check(standard.acceptance.length >= 4, '验收口径条目不足');
check(standard.standard?.code && standard.project?.location, '标准或项目所在地缺失');

const summary = {
  ok: errors.length === 0,
  counts: {
    products: Object.keys(products).length,
    activeProducts: active.length,
    passiveProducts: passive.length,
    obstacles: obstacles.length,
    acSpaces: acPresent,
    circuits: circuits.length,
    circuitLights,
    controlSpaces: controls.length,
    controls: controlCount,
    controlBindings: controls.reduce((s, x) => s + x.controls.reduce((n, c) => n + c.circuitIds.length, 0), 0),
    gateways: byGateway.size,
    scenes: scenes.length,
    sceneRows,
  },
  errors,
};
console.log(JSON.stringify(summary, null, 2));
if (errors.length) process.exit(1);

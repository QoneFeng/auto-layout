# 照明 Demo 模拟数据包（20261030-v1）

> **全部为模拟数据。** 产品、IES/LDT、现场尺寸、回路、DALI 地址、场景表和标准目标值都只用于跑通 Demo 的数据链路与缺口展示，不得用于真实选品、报价、施工、照度计算或验收。

## 文件清单

| 文件 | 内容 |
| --- | --- |
| `manifest.json` | 数据包版本、数量、完整性校验 |
| `products.json/.csv` | 20 个设备分类（17 个有源灯具 + 3 个被动轨道载体） |
| `ies/` | 17 个合成 IESNA LM-63 配光文件 |
| `ldt/` | 17 个合成 EULUMDAT 配光文件 |
| `obstacles.json/.csv` | 15 类空间的空调、窗帘盒、检修口模拟实测尺寸与相对位置 |
| `circuits.json/.csv` | 38 个照明控制组 → 回路、驱动、网关、DALI 地址 |
| `controls.json/.csv` | 15 空间 × 开关/情景/无线/调光/中控绑定 = 63 条控制定义、113 条回路绑定 |
| `scenes.json/.csv` | 5 套场景 × 15 空间 × 3 照明层级 = 225 行 |
| `standard.json` | 项目所在地、标准版本、15 空间照度/UGR/Ra/LPD 目标与验收口径 |
| `combined.json` | 供接口/工具读取的合并数据 |

浏览器运行时数据在 `app/data/demo-lighting-data.js`（由生成脚本产出，勿手改）。

## 数据口径

- **产品**：`SIM-*` 模拟型号；功率、光通量、光束角、UGR、Ra 均为设计意向值。
- **IES/LDT**：按产品光束角合成，文件头已标注 `SYNTHETIC-DEMO-NOT-MEASURED`；只能验证数据链路，不能用于 Dialux/Relux 正式计算。
- **障碍物**：`simulated_survey`，窗帘盒 160–240mm，检修口 600×600mm，空调按挂机 900×230×280mm 或柜机 520×520×1800mm 预留；位置为相对空间坐标，现场必须复核。
- **回路**：按 2026-10-30 全屋套餐实测的 38 个控制组生成；每个控制组不跨网关，DALI 地址在 0–63 内。
- **开关联动**：`controls.json` 定义每个空间的开关面板、情景面板、无线开关、调光旋钮、中控屏分别绑定哪些回路；开关面板按多联按键绑定本空间全部回路（一个回路一个按键），情景面板/中控屏绑定全部回路。运行时按设备类型匹配，53 台控制设备全部绑定，未绑定 0。
- **场景**：回家/会客/观影/就餐/睡眠，水平为 0–100%，色温 2700–3500K，均为演示值。
- **标准**：项目所在地“上海市”，标准写为 `GB/T 50034-2024` 的演示口径；版本、限值和验收条款必须按项目所在地现行规范与审图口径复核。

## 回路 Tab

Demo 右侧「回路」Tab 可开关 2D 回路连线、按基础/任务/重点筛选、点击 38 个回路高亮。连线用最小生成树连接同一回路的灯位，只表示逻辑归属，不代表穿管/桥架路径；回路、网关、DALI 地址均为模拟数据。选中回路后会显示到开关/情景/中控面板的联动线；选中开关面板后，规则卡里可“试验开关”控制该回路灯具。

## 替换成真实数据

1. 复制本目录为新的版本目录（例如 `20261101-real-v1`），不要覆盖本模拟包。
2. 用真实产品目录替换 `products.json`，并把 `photometryStatus` 改为 `verified`、`source` 改为 `datasheet`。
3. 用厂商 IES/LDT 替换 `ies/`、`ldt/`，保持文件名与 `products.json` 的 `iesFile/ldtFile` 一致。
4. 用现场复核尺寸更新 `obstacles.json`，把 `source` 改为 `site_survey`、`assumption` 改为 `false`。
5. 用电气深化结果更新 `circuits.json` 和 `scenes.json`，校验每个网关地址不超过 63。
6. 更新 `standard.json` 的项目所在地、标准版本、UGR/LPD 限值和验收口径。
7. 修改 `scripts/generate-demo-lighting-data.mjs` 的 `VERSION` 或增加导入脚本，重新生成 `app/data/demo-lighting-data.js`。

## 重新生成

```powershell
cd D:\QoneLab\3weijia_Code\smartHome\auto-layout
npm run demo:lighting-data
```

生成后会输出数量与校验结果；当前校验：15 空间、20 产品、17 组 IES/LDT、38 回路、205 个灯位、4 个 DALI 网关、63 条控制定义/113 条回路绑定、5 场景、225 行场景表。

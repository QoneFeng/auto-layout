# QoneHome·智能家电门店管理系统

> 一套本地优先的全屋智能门店管理系统：**户型布点规则引擎 + 2D/3D 方案 + 客户项目 / 产品 / 报价 / 交付后台**。

![全屋 15 空间 · 一键套餐](docs/screenshots/app-space-all.png)

全屋智能门店的日常工作不是「画一张效果图」，而是把客户需求、户型、设备选品、点位规则、报价和交付串成一条**可解释、可复现、可对账**的链路。这个项目把这条链路做成了一个可以直接跑起来的单机系统：同一个户型数据同时驱动 2D 平面、3D 场景、设备清单、报价行和后台项目进度。

![Vue 3](https://img.shields.io/badge/Vue-3.5-42b883?logo=vue.js&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite&logoColor=white)
![Three.js](https://img.shields.io/badge/Three.js-0.186-000000?logo=three.js&logoColor=white)
![Fastify](https://img.shields.io/badge/Fastify-5-000000?logo=fastify&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003b57?logo=sqlite&logoColor=white)
![Offline](https://img.shields.io/badge/运行方式-本地离线-1687f5)

---

## 目录

- [1. 系统定位](#1-系统定位)
- [2. 一条完整的业务链路](#2-一条完整的业务链路)
- [3. 智能布点工作台](#3-智能布点工作台)
- [4. 门店后台](#4-门店后台)
- [5. Admin UI 设计系统](#5-admin-ui-设计系统)
- [6. 技术架构](#6-技术架构)
- [7. 快速开始](#7-快速开始)
- [8. 数据与演示边界](#8-数据与演示边界)
- [9. 验证状态](#9-验证状态)
- [10. 许可与第三方](#10-许可与第三方)

---

## 1. 系统定位

项目由三个可独立打开、又共享同一份数据的部分构成：

| 入口 | 地址 | 定位 |
| --- | --- | --- |
| **门店后台** | `/admin/` | 客户、项目、设计方案、产品库、报价、经营、店铺与系统设置 |
| **智能布点工作台** | `/app/` | 户型 2D/3D、设备库、183 条点位规则执行与逐台解释 |
| **按空间布置** | `/app/space.html` | 15 类空间单间布置，自带默认家具与独立存档 |
| Vue 工作台（旧版） | `/legacy/` | 早期 15 空间 / 三室两厅对照版，用于规则与清单比对 |
| 统一首页 | `/` | 入口导航与 API 状态 |

一条 `npm run start` 启动同一个 Fastify 服务，用**目录**区分入口，不再用端口区分场景。

---

## 2. 一条完整的业务链路

```mermaid
flowchart LR
  A[客户建档] --> B[客户项目]
  B --> C[户型 / 空间]
  C --> D[智能设备选品]
  D --> E[一键布点 / 一键套餐]
  E --> F[设计方案版本]
  F --> G[报价单]
  G --> H[施工交付]

  E -.-> I[2D 平面]
  E -.-> J[3D 场景]
  E -.-> K[设备清单 / 报价行]
```

后台里每个客户对应一个项目；项目按「需求建档 → 户型设计 → 智能方案 → 报价确认 → 施工交付」五个阶段推进，每个阶段带任务勾选、负责角色、进度重算和操作日志。设计版本、报价单、施工交付都挂在项目下，形成一条可追溯的主线。

---

## 3. 智能布点工作台

工作台以 floorplan-3d 为底座重构：左侧是软装家具 / 智能设备两套库，中间是 2D 平面，右侧是属性、智能布点、功能分区、回路面板，顶部可一键切到 3D。

### 3.1 两个核心动作

| 动作 | 做什么 | 边界 |
| --- | --- | --- |
| **一键布点** | 只处理当前图里已有的设备，按同空间、同设备规则重算位置 | 不新增、不删除；候选不足时保留原坐标与数量，标记 `pending` |
| **一键套餐** | 按规则为整套户型生成演示设备，并并入全屋网络基础包 | 存在客户选品时拒绝执行；重跑不叠加；锁定设备保留 |

### 3.2 规则必须解释到单台设备

设备面板不只要「放在哪」，还要回答**为什么**：

- 命中的规则编号与规则原文；
- 数量公式、锚点、安装面、安装高度、优先级、最小间距；
- 是否降级落位、降级原因、同空间可替代规则；
- 待处理设备的诊断（规则要求 / 实际检查结果 / 未满足条件 / 处理建议）。

报价行遵循同一条对账口径：

> **输入 N = 已落位 P + 待处理 U**

同一空间同一设备归并为一条报价行，客户选品行（`manual:*`）与套餐行（`package:*`）不混为一行。

### 3.3 2D 与 3D 同源

2D 平面与 3D 场景消费同一份 `Project` 数据（房间多边形、旋转后的家具包围盒、门窗、设备点位与高度）。灯带、磁吸轨道、口字/L/U 型灯组在 2D 与 3D 中使用同一套形态定义；待处理设备不会在 2D 伪装成已安装实体，也不会在 3D 生成实体。

### 3.4 按空间布置

15 类空间（客厅、餐厅、主卧、书房、卧室、老人房、儿童房、玄关、厨房、卫生间、过道、阳台、衣帽间、卧室卫生间、茶室）各自带默认家具与独立存档。默认家具走「内区 + 贴墙」约束，自动让开门洞；切换空间不会串家具或设备。

### 截图

*统一首页：一个服务、一个端口，用目录区分后台 / 工作台 / Vue 版 / API*
![统一首页](docs/screenshots/app-home.png)

*三室两厅 · 2D 平面：设备库、尺寸链、房间面积、待处理徽标与报价入口*
![2D 平面](docs/screenshots/app-2d-layout.png)

*三室两厅 · 3D 场景：同一方案的第二视角，墙体剖切、家具、灯光与设备同源*
![3D 场景](docs/screenshots/app-3d-layout.png)

*全屋 15 空间：一键套餐后的规则设备、衍生轨道、照明分组与审计数字*
![全屋 15 空间](docs/screenshots/app-space-all.png)

*单空间 · 客厅：43 件设备，右侧同时给出照明分组、回路、障碍与 P0 口径*
![单空间客厅](docs/screenshots/app-space-single.png)

---

## 4. 门店后台

后台是一套本地优先的门店工作台：左侧 240px 固定导航，按「工作台 / 客户项目 / 设计方案 / 客户管理 / 报价中心 / 产品管理 / 经营管理 / 店铺管理 / 系统设置」组织，二级页面独立成路由，不把多个业务塞进一个页签。

### 4.1 登录与工作台

后台使用本地账号 + 4 位 PIN 登录，数据保存在本机 SQLite。工作台只回答四个问题：**当前有哪些项目、做到哪一步、下一步做什么、什么时候交付**。

![登录](docs/screenshots/admin-login.png)

![工作台](docs/screenshots/admin-overview.png)

### 4.2 客户与项目

- **客户管理**：客户档案、房型地址、家庭成员、来源与关联项目。
- **客户项目**：列表直接给出当前阶段、总体进度、下一步和计划交付。
- **项目详情**：项目摘要 + 五阶段任务看板 + 客户/房屋资料 + 需求重点 + 五类方案成果 + 设计版本 + 操作日志。
- **设计方案**：方案是独立对象，可关联项目，也可独立存在；版本与规则版本、设备数量、待处理数量同列展示。

![客户管理](docs/screenshots/admin-customers.png)

![客户项目](docs/screenshots/admin-projects.png)

![项目详情](docs/screenshots/admin-projects-detail.png)

![设计方案](docs/screenshots/admin-designs.png)

![设计方案详情](docs/screenshots/admin-designs-detail.png)

### 4.3 产品管理

产品库按「基本信息 / 价格与计量 / 协议与控制 / 安装与布点 / 专业规格 / 图片与附件」六组字段维护，支持导入、导出、批量上架/下架/恢复/归档/修改分类。

产品状态固定为 **草稿 / 在售 / 下架 / 归档** 四态，动作固定为上架、下架、归档、恢复：上架前重新校验名称、分类、单位、售价与布点映射；归档必填原因且只读；每次流转写入状态历史与操作审计。

![产品库](docs/screenshots/admin-products.png)

![产品详情](docs/screenshots/admin-products-detail.png)

![产品编辑](docs/screenshots/admin-products-edit.png)

产品分类只维护分类与规则 V2.3 的 **45 个正式物品编码（DEV-01 ~ DEV-45）** 映射，编码冲突按两个分类原子互换，保证一一对应。

![产品分类](docs/screenshots/admin-products-categories.png)

### 4.4 报价中心

报价支持两条路径：

- **快速报价**：选模板，按面积与数量公式生成整单报价；
- **手动选品报价**：按房间数量、平台、场景、品牌和总价标准规划设备再生成报价。

报价单状态为 **草稿 / 待确认 / 已确认 / 已作废** 四态，支持提交、退回、确认、作废流转；每次流转带操作人、时间、原因与 `expectedStatus` 并发校验，确认后锁定并复制新版本，导出支持 CSV / Excel / 打印 PDF。

![报价单列表](docs/screenshots/admin-quotes.png)

![选择报价方式](docs/screenshots/admin-quotes-new.png)

![手动选品报价](docs/screenshots/admin-quotes-new-manual.png)

![报价单详情](docs/screenshots/admin-quotes-detail.png)

![报价单编辑](docs/screenshots/admin-quotes-edit.png)

![报价模板](docs/screenshots/admin-quotes-templates.png)

### 4.5 经营管理

库存、采购、收款拆成三个独立页面，分别记录库存流水、采购单与收款记录，和项目、报价保持可追溯的关联。

![库存管理](docs/screenshots/admin-operations-inventory.png)

![采购管理](docs/screenshots/admin-operations-purchase.png)

![收款记录](docs/screenshots/admin-operations-payments.png)

### 4.6 店铺管理

- **门店资料**：门店名称、联系方式、LOGO（同源用于登录页、侧栏、favicon 与报价打印抬头）。
- **员工账号**：本地账号 + 4 位 PIN，当前登录账号与最后一名门店管理员不可删除。
- **角色权限**：内置 `ROLE-ADMIN` 不可改删；仍被员工使用的角色不可删除；权限以中文标签展示、以权限码存储。

![门店资料](docs/screenshots/admin-store-profile.png)

![员工账号](docs/screenshots/admin-store-staff.png)

![角色权限](docs/screenshots/admin-store-roles.png)

### 4.7 系统设置

六个独立二级页面：报价与费用、项目阶段与任务、默认设备、施工模板、数据备份、操作审计。

其中「项目阶段与任务」是项目模板的唯一入口：阶段、任务、负责角色在这里维护，**只作用于新建项目**，已有项目保留建档时的快照。

![报价与费用](docs/screenshots/admin-settings-pricing.png)

![项目阶段与任务](docs/screenshots/admin-settings-journey.png)

![默认设备](docs/screenshots/admin-settings-devices.png)

![施工模板](docs/screenshots/admin-settings-construction.png)

![数据备份](docs/screenshots/admin-settings-backup.png)

![操作审计](docs/screenshots/admin-settings-audit.png)

---

## 5. Admin UI 设计系统

后台所有页面只用一套蓝色令牌，不引入第二套主色、也不在页面里写死颜色和圆角。规范同时约束骨架、模板、操作位置、状态记录与验收流程。

| 令牌 | 值 |
| --- | --- |
| 主色 / Hover | `#1687F5` / `#0B73DB` |
| 浅蓝底 | `#EAF5FF` |
| 主文字 / 正文 / 次要 | `#243447` / `#526579` / `#7B8794` |
| 成功 / 警告 / 危险 / 金额 | `#388157` / `#B27414` / `#CF5F50` / `#E26B2B` |
| 页面骨架 | 侧栏 240px、内容边距 28px、**无顶部导航** |
| 控件高度 / 面板圆角 | 34px / 6px |
| 间距级差 | 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 / 36 |

页面固定为六种模板：列表、详情、编辑、弹窗、工作台、设置。列表页顺序固定为「标题区 → 筛选区 → 表格面板 → 分页」，新增入口只在标题区右侧，编辑入口在行末操作列；全页只保留一条纵向滚动条。

![设计系统封面](docs/screenshots/design-system-cover.png)

*骨架：没有顶部导航，账号与离线状态固定在侧栏底部*
![设计系统骨架](docs/screenshots/design-system-skeleton.png)

*设计令牌：颜色、字号、间距、圆角与阴影*
![设计令牌](docs/screenshots/design-system-tokens.png)

*六种页面模板*
![页面模板](docs/screenshots/design-system-templates.png)

*高频操作的位置：新增、编辑、保存、分页*
![高频操作](docs/screenshots/design-system-actions.png)

*组件与表单*
![组件与表单](docs/screenshots/design-system-components.png)

*弹窗、空态与反馈*
![弹窗与反馈](docs/screenshots/design-system-dialogs.png)

*状态记录：已到达 / 当前 / 待到达 / 已作废，历史缺失时如实显示「已到达 · 历史未记录」*
![状态记录](docs/screenshots/design-system-status-history.png)

*列表滚动：全页只留一条滚动条*
![列表滚动](docs/screenshots/design-system-list-scroll.png)

---

## 6. 技术架构

| 层 | 技术 | 说明 |
| --- | --- | --- |
| 工作台 UI | Vue 3 + TypeScript + Vite | 2D SVG 平面、面板、设备库 |
| 3D | Three.js | 程序化家具 / 材质 / 建筑 / 灯光，2.0m 剖切墙 |
| 后台 UI | Vue 3 + Naive UI + 自建设计令牌 | 六个一级模块，独立二级路由 |
| 服务 | Fastify 5 | `/`、`/app/`、`/legacy/`、`/api/` 同端口 |
| 存储 | SQLite（better-sqlite3） | 客户 / 项目 / 产品 / 报价 / 员工 / 审计 |
| 构建/校验 | esbuild、Vitest、vue-tsc | 规则 bundle、单测、类型检查 |
| 桌面端 | Electron + electron-builder | 绿色版 ZIP 为主交付形态 |

### 规则数据流

```mermaid
flowchart LR
  S[规则源 V2.3 / CSV] -->|npm run import:rules| G[rules.generated.json]
  G -->|esbuild| B[app/rules.bundle.js]
  B --> E[规则引擎 engine.ts]
  E --> X[explain.ts 解释层]
  X --> P[设备面板 / 规则卡]
  E --> D[2D 平面]
  E --> T[3D 场景]
  E --> Q[报价行 / 设备清单]
```

规则源、生成物与解释层严格分层：`src/data/rules.generated.json` 与 `src/data/rules-coverage.csv` 由脚本生成，不手改；规则歧义与 Demo 默认值集中在 `src/data/defaults.ts`；设备面板与规则汇总共用 `src/core/explain.ts` 的标签和原因码。

### 目录速览

```text
auto-layout/
  home/index.html          统一入口首页
  app/                     智能布点工作台（2D/3D/设备/规则）
  app/space.html           按空间布置
  src/core/                规则引擎、几何、解释层
  src/components/          2D 平面 / 3D 场景
  src/render3d/            程序化家具、建筑、材质、灯光
  src/admin/               门店后台页面
  server/                  Fastify 统一服务 + 业务 API
  shared/                  前后端共享 schema / 校验
  data/                    规则源、照明模拟数据包
  scripts/                 规则导入、数据生成、视觉回归、打包
  electron/                桌面壳
  docs/screenshots/        README 截图
```

---

## 7. 快速开始

环境要求：**Node.js 22+**（Windows / macOS / Linux）。

```powershell
npm install
npm run start
```

`npm run start` 的 `prestart` 会先构建 Vue 产物并重新打包规则 bundle，然后启动统一服务：

| 地址 | 说明 |
| --- | --- |
| <http://127.0.0.1:8000/> | 统一首页 |
| <http://127.0.0.1:8000/admin/> | 门店后台（演示账号 `admin` / `0000`） |
| <http://127.0.0.1:8000/app/> | 智能布点工作台 |
| <http://127.0.0.1:8000/app/space.html> | 按空间布置 |
| <http://127.0.0.1:8000/legacy/> | Vue 工作台 |
| <http://127.0.0.1:8000/api/health> | 服务状态 |

常用命令：

| 命令 | 用途 |
| --- | --- |
| `npm run dev` | Vite 开发模式 + API |
| `npm run app` | 只调试工作台（8001） |
| `npm run import:rules` | 从规则源重新生成规则数据 |
| `npm run demo:lighting-data` | 生成照明模拟数据包 |
| `npm run demo:lighting-data:check` | 校验数据包数量与交叉引用 |
| `npm test` | Vitest 单测 |
| `npm run build` | 构建 `/legacy/` 与 `/admin/` |
| `npm run verify:admin-ui` | 全后台路由视觉/几何回归 |
| `npm run desktop:pack` | 打包桌面端（绿色版 ZIP 为主） |

> 后台是**单机演示系统**：本地 PIN 登录，没有多租户与公网安全加固。不要把 `/admin/` 直接暴露到公网。

---

## 8. 数据与演示边界

这个仓库刻意把「已实现」和「模拟」分开，避免把演示数据当成工程结论：

- **规则**：183 条空间点位规则来自 V2.3 规则源，运行时还会按空间 × 设备生成通用兜底规则（工作台示例为 325 条）。规则文本中的歧义参数冻结在 `src/data/defaults.ts`，界面标注为 Demo 默认值。
- **照明**：`data/demo-lighting/20261030-v1/` 为模拟数据包 —— 20 个产品（17 个有源 + 3 个被动轨道）、17 组合成 IES/LDT、15 个空间的障碍物、38 条回路、205 个灯位、4 个网关、5 套场景（225 行）。合成配光只能验证数据链路，不能用于 Dialux / Relux 正式计算。
- **障碍物**：窗帘盒、检修口、空调均为 `simulated_survey` 演示尺寸；碰撞数用于暴露设计冲突，不替代机电与照明专业深化。
- **产品库**：仓库不包含真实门店数据库。本地 `data/local/` 存放 SQLite、产品图片与导出文件，已加入 `.gitignore`；README 截图中的产品与客户均为演示数据。
- **报价 / 状态机**：产品与报价的状态机、权限、审计、并发校验均已实现；报价金额与设备数量来自规则与产品库，属于演示口径，不构成正式报价承诺。
- **3D**：示意级渲染，不做照片级效果与照度仿真。

---

## 9. 验证状态

截至 2026-11-05：

- `npm test`：**92 项单测全部通过**（门店业务与规则、产品库、项目生命周期、平台目录）。
- `npx vue-tsc --noEmit`：通过。
- `npm run build`：通过。
- `npm run demo:lighting-data:check`：`errors = []`，产品 20 / 有源 17 / 障碍 15 空间 / 回路 38 / 灯位 205 / 场景 225 行。
- 后台 28 个页面 + 登录页已在 1440 × 900 下逐页截图；`verify:admin-ui` 脚本覆盖全部后台路由 × 3 视口（1440 / 1024 / 390）的横向溢出与嵌套滚动检查，最近一次全量整改为 29 路由全 0 失败。

> README 截图由本机 Chrome + CDP 脚本自动采集（固定视口、登录后逐路由切换），可重复生成。

---

## 10. 许可与第三方

- 本项目采用 [Apache License 2.0](LICENSE)。
- 3D 渲染层的家具、建筑、材质与灯光代码改编自 MIT 项目 [`floorplan-3d`](https://github.com/wy51ai/floorplan-3d)（作者 wuyi），改写为 TypeScript 模块，原始版权与许可见 [NOTICE.md](NOTICE.md)。
- `app/` 底座来源于 `floorplan-3d` 的离线版，保留其 2D/3D/家具/尺寸/报价能力。


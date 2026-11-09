# auto-layout 代理约定

适用范围：`D:\QoneLab\3weijia_Code\smartHome\auto-layout`。这是 smartHome 工作区里**允许写代码**的独立 Demo 工程。

## 边界

- 可以修改本目录下的 Vue / TS / Node / Three.js 代码、测试和文档。
- `home-design-admin`、`home-design-static`、`ihomesmart` 仍然只读：不得修改其源码、配置、测试、SQL 迁移脚本。
- AI 任务产生的非业务文档、截图、证据，统一放本工程 `AI doc\YYYYMMDD-任务简称`，不要散落在工程根目录，也不再写到父级 `smartHome\AI doc`。
- 提交、分支等 Git 操作在 `auto-layout` 所在仓库内执行；不要在 smartHome 容器根目录做仓库级 Git 操作。

## AI 任务产物目录（本项目）

- 产物根目录：`D:\QoneLab\3weijia_Code\smartHome\auto-layout\AI doc`，索引为 `AI doc\README.md`。
- `AI doc` 顶层只允许三类：`README.md`、任务目录 `YYYYMMDD-任务简称`、可选 `_公共脚本`。**禁止在顶层直接新建文件。**
- 每个任务一个目录，日期取该任务**首次开始**日期；同日多个**不同**任务加 `-2`、`-3` 后缀；目录一旦创建不再改名。
- **同一任务跨日期续做，一律复用已有目录与原日期前缀**，不按当天日期另建平行目录；判断依据是任务目标与对象（同一需求 / 缺陷 / 方案 / 交付物），不看会话、日期或提问方式。
- 文件名统一 `YYYYMMDD-任务简称-类型.ext`，使用可读中文，前缀与所在目录名一致；禁止 `新建文件夹`、`tmp`、`final2`、`副本`、`未命名`。
- 任务目录默认平铺，靠文件名区分类型；某类文件成堆（一般 ≥5 个）时才建一层 `证据` / `脚本` / `交付` 子目录，不得再嵌套。
- 过程性中间产物放任务目录下的 `_tmp`，收尾时清理；跨任务复用脚本放 `AI doc\_公共脚本` 并在索引登记。
- 新建目录前先查 `AI doc\README.md` 的任务索引与已有目录名：能对应已有任务的一律续用；确认是新任务才新建。
- 收尾时在 `AI doc\README.md` 的「任务索引」登记日期 / 任务目录 / 主要产物 / 一句话说明；续做只追加产物行，沿用原目录。
- 任务开始先读本工程 `AI doc\README.md` 与 Obsidian 项目记忆 `D:\QoneWord\QoneObsidian\99.AI KB\10.项目\smartHome\项目记忆.md`；历史结论只作检索线索，不替代当前代码、页面和运行时验证。
- 重要任务（改代码/配置/文档、做真实浏览器或运行时验证、形成关键决策）收尾时：整理证据 → 检索去重 → 合并项目记忆 → 清理 `_tmp` → 独立回读写入文件；不承诺存在后台自动写回。
- 规则源与 2026-11-03 之前的历史任务仍在父级 `D:\QoneLab\3weijia_Code\smartHome\AI doc`，**只读引用，不搬动、不复制**；本工程 `AI doc` 只承接本项目新产物与已迁移任务。
- 「20261031-智能家电门店系统」已于 2026-11-03 从父级迁入本工程 `AI doc`，后续续做、索引与证据登记一律写在本工程目录。

## 规则源与生成物

- 规则唯一事实来源：`D:\QoneLab\3weijia_Code\smartHome\AI doc\20261026-空间点位规则业务优化\20261026-空间点位规则业务优化-产品开发版-V2.3.md`、`...-客户沟通版-V2.3.md` 与对应 CSV；原始 V1 在同级历史任务目录中只读保留。
- `src/data/rules.generated.json`、`src/data/rules-coverage.csv` 由 `npm run import:rules` 生成，**不要手改**。
- 规则歧义与 Demo 默认值集中在 `src/data/defaults.ts`，不要散落到组件。
- 修改规则解释口径时，优先改 `src/core/explain.ts`，保证设备面板与规则汇总共用同一套标签和原因码。

## 产品语义（容易写错）

- **一键布点**：只处理当前图中已有设备，按同空间、同设备规则重算位置；不新增、不删除；候选不足时保留原坐标和数量，标记 `pending`，不能伪装成“房间中心已落位”。
- **一键套餐**：按 183 条规则生成整套演示设备，并并入全屋网络基础包（弱电箱、网关、路由、AP 等）；当前存在客户选品（`source=manual`）时拒绝执行并提示改用一键布点；套餐可重跑，锁定设备保留且按已锁定数量扣除，避免重复生成。
- 套餐数量必须可审计：规则设备实例数要等于各规则 `requestedCount` 之和；窗帘电动轨道、共享磁吸轨道等衍生载体、Demo 灯组、全屋网络基础包单独统计，不能混入规则设备数。`window.__smartHomeAudit()` 返回 physical / ruleDevices / derivedTracks / wholeHouse / demoGroups / pending / requestedSum / mismatches，改引擎后要保证 mismatches 为空。
- 报价行语义：同一空间同一设备归并为一条报价行，必须满足 `输入 N = 已落位 P + 待处理 U`；客户选品行（`manual:*`）与套餐行（`package:*`）不得混为一行。
- 设备状态：`manual` 待布点、`placed` 已落位、`fallback` 降级落位、`pending` 待处理、`adjusted` 人工调整（保留规则归因）。
- V2.2 产品模型：旧 54/55 分类继续作为 `legacyType2` 兼容规则匹配；设备库按 `productFamily + routeShape/layoutForm/mountSurface` 显示产品族形态，不能因合并显示而丢失安装面、路径形态或计量单位。
- 设备面板必须回答：命中哪条规则、规则原文、数量/锚点/高度/优先级、是否降级、为什么降级。
- 规则 Tab 必须保留两个维度：空间维度（V1 §5）与设备维度（V1 §6 + §4）。
- 灯带 / 轨道按设备类型示意：口字矩形框、L/U 折线、直线、轨道 + 灯头、一字组 / 口字组阵列点；2D 与 3D 同源。
- 2D 灯带描边统一使用细线（`rect/L/U` 约 2.4 屏幕像素，直线内高光 1–2px）；不要改回固定 10px 非缩放描边，否则任何缩放级别下都会变成粗条。

## 交互约定

- 单击设备只选中，不改变位置或 `status`；拖动超过 4px 才触发移动；移动/旋转后标记 `adjusted`，保留规则归因，并将绑定目标改为“待确认”。
- SVG 背景平移不能在 pointerdown 时立即捕获指针，否则房间点击会被吞掉。
- 锁定设备在重排时坐标不变。
- 降级兜底必须回写 `ruleCode` 与 trace，不能只在 trace 里写规则编号。
- 待处理设备不得在 2D 伪装成已安装实体：平面图只显示空间级“待处理 N”徽标，3D 不生成实体，夜景照明不聚合。
- 默认进入 `/app/` 必须清空上次生成的智能设备（家具保留）；`?restore=1` 才恢复上次智能设备。一键布点只处理 `source=manual` 的客户选品，套餐设备不参与并要在状态文案中明确。
- 规则卡 sticky 时必须限高（约 42vh）并提供展开/收起与内部滚动，不能遮住设备清单；“只看待处理”筛选需按空间 + 设备 + 数量列出可点击的待处理明细。
- 功能分区（`state.zones`）：矩形 + `spaceCode`（15 类之一）；分区优先于原始房间参与 `roomOf`、一键布点和一键套餐的规则匹配。`buildProject(true)` 将分区加入 rooms，同时给父房间写入 `excludePolygons`，引擎 `blocked()` 排除分区内候选点，避免同一区域被父子空间重复布点。入口固定在顶部工具栏「功能分区」；在 2D 上按住左键拖出矩形、松开完成，Esc 取消，不再使用多点/双击。
- 设备库轻点必须确定性加入 1 件；拖入按落点加入；底座的轻点逻辑需通过 `skipTap` 让位，避免重复加入。

## 3D 渲染层

- `src/render3d/` 中的材质、家具、建筑、灯光代码改编自 MIT 项目 `floorplan-3d`（作者 wuyi）；保留 `NOTICE.md` 与文件头版权说明。
- 不修改 `D:\QoneLab\open_Code\floorplan-3d` 上游文件，也不在运行时引用该外部路径；代码已复制并改写为 TypeScript。
- 家具/建筑只消费我们的 `Project` 数据，不引入 floorplan-3d 的 `state` / `WALLS` / `ROOMS`。
- 第一版 3D 为示意级：默认 2.0m 剖切墙，不做第一人称漫游；漫游等整体效果确认后再做。
- 新增家具类型时同时更新 `src/types.ts` 的 `FurnitureType` 与 `src/render3d/furniture.ts`，未覆盖类型保留圆角盒 fallback。

## 底座版 app（当前主线）

- `app/` 以 floorplan-3d `index.offline.html` 为底座（MIT，作者 wuyi），保留其 2D/3D/家具/尺寸/报价；`app/vendor` 是本地 Three.js，不要手改。
- `app/smart-home.js` 是设备/选品/规则适配层；`app/devices.js` 由 `scripts/export-demo-devices.ts` 生成；`app/rules.bundle.js` 由 `src/browser/rules-entry.ts` 通过 esbuild 生成。
- 修改规则引擎后重新构建：`npm run build:rules`（`npm run start` 的 prestart 也会自动执行）。
- 修改设备目录后重新生成：`npx --yes tsx scripts/export-demo-devices.ts`。
- 启动：日常用 `npm run start` 启动统一服务 8000（`/` 首页、`/app/` 底座版、`/legacy/` Vue 版、`/api/` 接口）；只调试底座版时用 `npm run app`（8001）。
- 3D 设备模型优先复用 `app/index.html` 中灯光版的灯具几何；非灯光设备用简化几何，保持示意级。

## 统一入口与目录

- `server/index.mjs` 是唯一统一服务：`/` 读 `home/index.html`，`/app/` 静态服务 `app/`，`/legacy/` 静态服务 `dist/`，`/api/*` 提供接口；默认端口 8000，可用 `PORT` 覆盖。
- 不再用端口区分场景；新增入口优先增加目录与首页卡片，不要新增并行端口。`start:all` 已移除。
- Vue 构建必须使用 `base=/legacy/`；`vite.config.ts` 已按 `command === 'build'` 设置，修改构建配置时不要回退到根路径。
- `npm run start` 会通过 `prestart` 自动构建 Vue 版，避免 `/legacy/` 资源过期。

## 打包产物约定

本机装有终端安全软件（安恒 UES / DAS-Security），会按「进程身份」拦截未签名程序的文件写入与 `electron/asar` 的大内容写入。由此形成三条硬约束，改打包配置前务必先读：

1. **NSIS 安装包不可靠**：安装器进程写目标目录时 100% 被拒（「不能打开要写入的文件」），点「忽略」只会跳过全部文件，等于没装。提权（SYSTEM 计划任务、`perMachine`）也无效。因此**交付形态以 ZIP 绿色包为准**，安装包仅供未受管控的机器使用。
2. **asar 不可靠**：`electron/asar` 写**大文件**内容被拦截（小文件可以），`app.asar` 里只剩索引与几 MB 小文件。**Electron 加载 app 的优先级是 `resources/app.asar` > `resources/app/`**，所以 asar 存在时改了新代码也不会生效（asar 里的 `main.cjs` 是旧的那份）。必须用 `asarUnpack: ["**/*"]` + `scripts/fix-asar-layout.mjs`：把内容铺到 `resources/app/`，并把 `app.asar` **改名**为 `app.asar.disabled`（改名比删除可靠，删除常被安全软件与工具链策略拦下）。
3. **`CopyFiles` 不可用**：NSIS 自带的 `CopyFiles`（SHFileOperation）复制 13000+ 文件时静默失败。`scripts/patch-nsis-template.mjs` 把 7z 解压目标改为 `$INSTDIR` 绕过。

命令与产物：

| 命令 | 产物 |
| --- | --- |
| `npm run desktop:pack` | 仅打包安装包（`release/QoneHome-Setup-<版本>.exe`），受管控终端装不了 |
| `npm run desktop:pack -- --no-nsis` | 跳过安装包生成，只做解包与布局修正（约 1 分钟） |
| `npm run desktop:pack -- --no-nsis --deploy D:\QoneHome` | 再绿色部署到指定目录（建桌面/开始菜单快捷方式 + 写卸载注册项） |
| `npm run desktop:pack -- --no-nsis --deploy D:\QoneHome --zip D:\QoneHome` | 再额外生成 `release/QoneHome-<版本>-绿色版.zip` |
| `node scripts/deploy-green.mjs --target D:\QoneHome` | 只做绿色部署（来源取**最近修改**的解包目录） |
| `node scripts/deploy-green.mjs --target D:\QoneHome --uninstall` | 卸载绿色版 |
| `npm run clean:release` | 清理 `release` 里的中间产物 |

- 安装包与绿色包**只允许**产出到 `release/`。打包中间目录为 `release/.build-<时间戳>`，每次用全新目录以避开 `emptyDir` 撞上被安全软件锁死的 `.asar`。
- ZIP 用 `node_modules/electron-winstaller/vendor/7z.exe`（`-tzip -mx=3 -mmt=on`）生成：Windows 自带的是 GNU tar，**不支持创建 zip**（会生成 tar 格式改扩展名），且把带盘符路径当远程主机。**输出必须用绝对路径** —— 相对名会让 7z 把 archive 当成待压缩的源文件而报「cannot open file」。需排除 `app.asar.unpacked` 与 `app.asar.disabled` 两个冗余目录。
- `scripts/deploy-green.mjs` 的 robocopy 要排除 `app.asar.unpacked`、`app.asar.disabled`；取源目录必须按 **mtime 选最新**，按文件数挑会部署到旧代码。
- 绿色包解压后双击 `QoneHome.exe` 即可运行；同目录的 `创建桌面快捷方式.cmd` 用于一键创建桌面与开始菜单图标。
- 打包链路依赖三处非标准处理，重建依赖或升级 electron-builder 后必须重跑：`scripts/patch-nsis-template.mjs`、`scripts/fix-asar-layout.mjs`、`build/installer.nsh`（自定义「创建桌面快捷方式」附加任务页 + 禁用默认进程探测宏）。
- `electron/main.cjs` 的 `rootDir()` 需兼容 `resources/app/`、`resources/app.asar.unpacked/`、`resources/` 三种布局。
- 窗口标题带版本号（`QoneHome·智能家电门店管理系统 v0.1.11`）：页面 `<title>` 会覆盖窗口标题，必须 `win.on('page-title-updated', e => e.preventDefault())` 拦截后再 `setTitle`；默认最大化用 `maximized: true` + `show: false`，并在 `ready-to-show` 与 3 秒兜底时 `win.maximize()`。
- 验证打包产物时，若在 WorkBuddy 工具链内启动 Electron 需先 `Remove-Item Env:ELECTRON_RUN_AS_NODE`，否则会以 Node 模式运行、表现为「双击闪退」，与真实缺陷无关。


## 按空间布置页面

- `app/space.html` 是复用底座的单空间页面：iframe 载入 `index.html?spaceMode=1&space=<code>`，顶部下拉切换 15 类空间。
- `index.html` 的 `SPACE_TYPES` 定义 15 类空间的尺寸、地面材质、窗与默认家具；`applySpaceMode()` 在状态初始化前替换 `ROOMS/WALLS/WINS/DOORS/SLIDES/BOUNDS`，并设置独立 `STORE=huxing-space-<code>`。
- 单空间只保留当前空间规则；`runPackage` 在 `window.__spaceMode.active` 时不并入全屋网络基础包。
- 空间页顶部提供「重置家具」：清空后恢复当前空间类型的默认家具（保留智能设备）；不要在 `clearLayout` 中自动恢复，保持“清空”和“重置”两个动作分离。
- 新增空间类型或调整默认家具时，同步更新 `SPACE_TYPES`、`applySpaceMode()` 与首页/README 的空间清单。
- 默认家具必须走 `spaceFurnitureFactory()` 的“内区 + 贴墙”约束：内区为墙体内侧 + 20mm，`wall()` 负责按上/下/左/右墙设置中心与旋转（背面贴墙、正面朝室内），底边居中门洞（含 900mm 门后区）必须让空。新增/调整后跑父级 `D:\QoneLab\3weijia_Code\smartHome\AI doc\20261027-空间点位规则Demo业务优化\20261029-空间家具边界回归.py`，要求 15 空间 `issueCount=0`（不穿墙、不压门、非地毯家具不重叠）。
- 规则引擎的家具输入必须是**旋转后的 AABB**：`app\smart-home.js` 的 `buildProject()` 不能直接用 `f.w/f.d`，否则 90°/270° 的电视柜、衣柜、橱柜会把碰撞区和锚点算到房间中央。
- `roomCenter` 不代表所有设备叠在圆心：引擎会按规则数量沿房间长轴均匀展开；沙发/窗/电视墙/磁吸轨道等语义锚点必须在 `src\core\engine.ts` 按当前家具几何实时取点，移动软装后一键套餐和一键布点都要重新计算。
- 间距约束只约束同 `deviceType2` 的设备，不能跨类型互抢；`floor` 取整要加浮点容差（如 2.4/0.8）。
- 家具/柜体锚点找不到目标家具时必须返回空候选，不能退回 `wallOffsetPoints` 或房间中心伪装落位；`fallback=REMOVE` 的规则直接取消（如无衣柜时的柜体灯带），其他规则保留待处理。窗帘灯带 `windowHead` 例外：没有独立窗帘盒模型时以窗洞顶线作为安装线。
- 规则语义锚点必须按“规则原文 + 当前家具”落位：落地灯是沙发端部外侧，不是沙发正面中间；光照传感器是距窗 500~800 且避开窗下家具。规则解释卡的位置说明必须优先显示 `anchor.raw`，不能用 `anchor.kind` 的“房间中心”覆盖原文。
- 共享磁吸轨道只派生一次：房间已有 `KT-TR-01` 等轨道设备时，`addCombinationDevices()` 必须复用现有轨道，不能为磁吸灯体再加一条重叠轨道；清单数量必须与报价输入一致。
- 磁吸轨道按“一条实体轨道 + 模块数”计价：效果图只生成一条连续轨道，长度 = 宿主路径实测长度；报价 `inputQuantity/moduleQuantity = ceil(长度/1200)`，清单显示「1 条 · N 模块」，审计按模块数对账。不要再把 N 个模块画成 N 条重叠轨道。
- 待处理设备必须携带 `DeviceTrace.pending` 诊断（规则要求、实际检查结果、未满足条件、建议），并在规则卡最前面显示；不能只用“合法候选点不足”一句泛化原因。
- 3D `buildArch()` 中整户专用的硬编码构件（如飘窗过梁 `10270/10510`）必须在 `window.__spaceMode.active` 时跳过；单空间模式只能生成当前房间的墙体、门窗和家具，避免全屋视角出现户外悬空物。
- 3D 漫游起点在单空间模式必须按当前房间计算（常规房间门内 600mm 朝房间中心；进深 <2200mm 的过道/阳台沿长轴起步），不能复用整户入户门外坐标 `(4200,8755)`，否则会对着外墙进不了室内。
- 3D 设备高度必须优先使用规则/布点算出的 `device.smart.z`；非灯光设备不能用产品目录 `def.mount` 作为第一优先级，否则 CL 吸顶传感器/喇叭会被放到 1.3m/2.4m 悬空。无 `smart.z` 的旧数据才回退目录默认高度。
- 控制面板（开关/情景/中控屏）3D 模型必须是竖直薄板（宽×高×12mm 左右），屏幕朝室内；墙装面板要按最近墙面把背板推到墙内表面，不能建水平台面或离墙悬空。`情景面板` 与开关面板并排 100mm，不能放房间中心。
- 右侧智能布点面板必须允许文本选择复制（`#smart-panel { user-select:text }`），不能继承全局 `user-select:none`；`中控屏` 规则 raw 含“入口”时优先落入口门侧墙，不能锚到沙发前沿。
- 全屋模式（`space=ALL`）用 `w_<code>` 房间 ID，并通过 `window.__spaceMode.roomMap` 映射回 15 类空间；复用 `__buildSpaceFurniture(info,X0,Y0,flipY)`，下排房间必须 `flipY=true` 让门朝中庭/过道。全屋一键套餐包含全屋网络基础包。
- `space.html` 默认 `space=ALL`；`renderDims()` 在 spaceMode 下必须按当前 `ROOMS` 边界动态生成上/下/左/右尺寸链，不能使用整户硬编码 10270/11850 等数值；BOUNDS 要留出 1600mm 标注边距。
- 照明按 `interior-lighting` 口径：灯具必须有基础/任务/重点层级、`roomId::layer` 控制组、示意色温和光束；任务灯围绕书桌/镜前/水槽/备餐/床头，书桌台灯落到桌面 750mm。规格只写“意向”，不得宣称产品选型或照度仿真。
- 照明 P0 的模拟口径必须显式暴露：`DEMO_PRODUCTS` 的功率/光通量/光束/UGR 是模拟值，205 盏灯全部 `selected_for_demo + simulated`；有源灯位为 `photometryStatus='synthetic'`，被动载体为 `not_applicable`。`DEMO-C-*` 回路与 DALI 调光是模拟；面板和 `__lightingAudit()` 必须显示“真实选品 0 / 合成 IES N / 缺真实 IES N / 模拟未验证回路 N”，不能改成通过态。
- 障碍物当前是演示尺寸，统一按 `design_assumption` 处理：窗帘盒从 WINS 派生（窗内侧 220mm、2400–2800mm、净距 50），检修口 600×600mm（2750–2800mm、净距 300），空调**只从已放置暖通设备生成**，没有设备时计入 `acMissingRooms`，不得凭空编造。碰撞分 `BODY`（体块重叠）与 `CLEARANCE`（净距不足）；2D 用 `#gLightObs` 绘制并给碰撞对象描红。
- 碰撞数是设计冲突证据，不是渲染 bug：检修口压书桌、灯槽灯带与窗帘盒体块重叠应保留并提示调整灯位/障碍物，不能用“让检测闭嘴”的方式消除。
- 障碍物渲染必须受顶部「障碍」图层（`ui.layers.obs`）控制；默认浅色长虚线/低透明度小字，碰撞用柔和暖色；选中灯具时只高亮该灯碰撞的障碍物，未选中才展示全屋碰撞集合，不能所有碰撞对象同时标红。
- 规则卡必须完整渲染 `info.rows`（卡片内部滚动），不能只截前 8 行；`产品状态`、`回路 / 调光`、`UGR` 三行是 P0 的验收项。
- 照明模拟数据包统一放在 `data/demo-lighting/<version>/`，浏览器数据 `app/data/demo-lighting-data.js` 由 `npm run demo:lighting-data` 生成，**不要手改生成物**；替换真实数据时新建版本目录，不覆盖 `20261030-v1`。
- 产品/IES/LDT 当前全部是模拟：17 组合成 IES/LDT，`photometryStatus='synthetic'`，面板必须同时显示“合成 IES”和“缺真实 IES”，不能把合成文件当作 `verified`。被动轨道 `photometryStatus='not_applicable'`，不参与缺配光统计。
- 障碍物优先使用数据包 `obstaclesBySpace`（`simulated_survey`），8 个空调空间全部建模；只有数据包没有该空间时才回退到已放置暖通设备。空调未建模数应来自真实缺失，不是凭空编造。
- 回路/网关/DALI 地址来自 `circuitsBySpaceLayer`：38 回路、4 网关、容量 256；每个回路的 `daliAddress` 由 `resetLightingCircuitCursor()` 后在 `lightingMetaFor` 顺序分配，超出 `daliAddressEnd` 必须计入 `daliOverflow` 并在面板暴露。
- 「回路」Tab 只在 `rightTab === 'circuit' && circuitVisible` 时绘制 `#gCircuits`；离开 Tab 或关闭开关必须清空。回路线用“水平/垂直主干 + 灯位支线”的正交布局，只表示逻辑归属，禁止描述为穿管/桥架或施工路径；单灯回路只画色点，不画线段。
- 回路与开关面板的绑定来自 `controlsBySpace`：开关面板按多联按键绑定本空间全部回路（一个回路一个按键），情景面板/中控屏是场景控制、不进入回路主线，无线开关绑定重点，调光旋钮绑定基础；运行时按设备类型匹配，53 台控制设备必须全部绑定，未绑定计入审计。一个回路只能有一个 `byCircuit` 主开关绑定，双控/镜像面板不得重复显示。
- 选中回路时画控制面板联动线并圈出面板位置；回路行电源按钮和开关面板规则卡按钮都调用 `toggleCircuitPower()`。关灯写入灯具 `smart.power='off'`，2D 透明度降到 24%，3D 夜景跳过该回路、灯具自发光降到 12%；一键套餐必须调用 `resetCircuitPowerState()` 清理旧电源状态。
- 场景表与标准值来自 `scenes` / `standard`：5 场景 × 15 空间 × 3 层级；项目所在地、标准版本、UGR/LPD 和验收口径必须显示“演示口径/待复核”。
- 数据包改动后跑 `npm run demo:lighting-data` 与 `npm run demo:lighting-data:check`；要求产品 20、有源 17、IES/LDT 各 17、障碍 15 空间、回路 38、灯位 205、网关 4、场景 5、场景行 225、校验错误 0。

## 门店后台产品页

- `/admin/#/products` 为产品库，新增 `/products/new`，详情 `/products/:id`，编辑 `/products/:id/edit`；新增与批量 JSON 导入分离，导航离开未保存表单要确认。
- `src/admin/ProductWorkspace.vue` 使用 Naive UI 维护产品字段；`shared/product-schema.mjs` 为前后端共享默认值、规格模板和校验，Electron 打包必须包含 `shared/`。
- `server/products.mjs` 对日常新增/编辑只接受显式当前分类/旧 key，不在保存接口里凭商品名称猜分类。特定客户批次可在独立、可审计的导入脚本中按来源分类 + 名称 + 功能/安装形态归属，并逐字段记录依据；分类元数据不等于已接入户型选品。
- SQLite 增量加列保留旧产品；新增 SKU 大小写不敏感判重且不覆盖，编辑校验 revision，批量导入默认禁止覆盖、整批事务回滚。
- SKU 保存标准计量、尺寸和能力，项目实例才记录实际灯带路径、点位高度和回路；模拟/合成资料不升级成真实专业验证。
- 图片与附件保存在 `data/local/product-assets/`，10MB 上限与类型白名单；删除引用不物理删除文件。备份包含被引用附件内容，恢复功能另行实施。
- 单测使用内存 SQLite；真实接口验收仅改清楚标识的演示草稿，不动用户客户/项目及已有产品。
- 一级导航为“产品管理”，下分产品库 `/products` 与产品分类 `/products/categories`。产品分类不新增、不删除分类本体，只维护分类与规则 V2.3 的 45 个正式物品编码（DEV-01~DEV-45）映射；编码冲突按两个分类原子互换，保持 45 个编码一一对应。
- 产品状态机固定为草稿/在售/下架/归档，动作固定为 `publish`（草稿或下架→在售）、`withdraw`（在售→下架）、`archive`（非归档→归档，必填原因）、`restore`（归档→草稿）。编辑保存和导入不得静默改已有产品状态；上架必须重新执行名称/分类/单位/售价/布点映射校验；每次流转写 `product_status_history` 与审计，`expectedStatus` 不匹配返回 409。归档产品只读，不做物理删除。
- 产品列表批量操作（上架/下架/恢复/归档/修改分类）必须复用单产品状态机，逐项执行并返回失败项；支持“已选”和“当前筛选全量”两种范围，筛选模式由后端按当前搜索/分类/状态/品牌/平台条件取全量，不要求前端传全部 ID，单次上限 5000。批量归档必填原因，批量修改分类跳过归档产品、在售产品重新校验分类与布点映射。列表“状态”列只显示状态标签，不再展示导入/模拟/资料补充文案。
- 产品列表行内操作只保留 `详情 / 编辑 / 更多`：低频动作（复制新增、上架/下架、归档、恢复）收进“更多”下拉；操作列固定 150px、文字按钮 13px 主色、不得换行堆叠。批量范围切换使用 `NButton`，不得手写按钮样式。
- 产品详情不渲染大块状态步骤条；状态动作放在标题区工具栏；紧凑的“状态流转记录”审计表属于低频信息，必须放在表单与右侧预览之后、页面最底部。详情左侧分组导航必须同时支持点击跳转和页面滚动联动高亮，不能只靠点击切换。
- “系统设置 → 默认设备”按 45 类设备分类逐项配置品牌/型号，保存到 `system_settings.defaultDeviceModels`；设计目录优先使用指定 `productId`，未配置才回退同分类在售推荐/低价排序。
- 客户导入的产品主分类统一使用当前系统分类；客户原销售一级/二级分类只保存在来源追溯字段，不进入产品列表分类、筛选或正式分类值。按来源类别、产品名称、功能和安装形态确定归属；当前分类体系没有精确专类时归入最接近现有产品族并关闭自动布点，不能把“已归类”伪装成“可套用该分类布点规则”。列表分页默认30条，API每页最多100条。
- 乐归批次 `LEGUI-20261020-DEMO-v1` 使用稳定 SKU `LG-20261020-xxxx`，同SKU不覆盖、同型号不合并。原值和逐字段原表/推断/模拟/未提供依据保存在 `specs._source*`、`_fieldProvenance`；后续人工编辑不自动改写成厂商验证结论。
- 导入必须先备份、事务写入，再独立回读全量产品/图片哈希和既有客户项目；图片缺失不伪造商品照片，有源灯具缺真实IES/LDT标 `missing`，不能因只做分类归属就升级为真实配光或专业验证。

## 门店后台项目页

- `/admin/#/projects` 必须同时回答“当前到哪一步、完成多少、下一步做什么、何时交付”，不能退回只有状态标签和“进入设计”的静态列表。
- 详情路由为 `/admin/#/projects/:id`，统一承载项目摘要、五阶段十任务、客户/房屋资料、需求重点、方案成果和项目动态；“查看详情”与“继续设计”是两个独立动作。
- 项目进度以阶段任务完成数计算，不允许手工写死百分比。任务更新后同步重算 `progress/currentStage/nextTask/status` 并保存到 SQLite；浏览器刷新必须保留。
- 项目扩展数据优先增量存入 `projects.payload_json`，旧项目补默认结构时保留未知字段；没有明确迁移必要时不要为每个演示字段反复加列。
- 项目成果入口当前可复用 `/app/?project=<id>`；报价、施工图、回路表等未形成真实快照/版本前必须显示为进度或入口，不得伪装成已生成文件。
- 项目阶段 / 任务 / 负责角色模板在“系统设置 → 项目阶段与任务”（`/settings/project-journey`）维护，存 `system_settings.projectJourney`，读写走 `GET/PUT /api/admin/settings/project-journey`；服务端 `normalizeJourneyConfig(..., { strict:true })` 校验阶段名、任务名与角色字典。
- 模板只作用于**新建项目**：项目建档时把阶段和任务固化进 `payload_json`，之后改模板不得自动增删已有项目的阶段任务；复制项目按当前模板重开阶段任务。
- 项目详情阶段看板按项目自身 `payload.stages` 动态生成列，不写死 5 列；未配置任务的阶段显示“未配置任务”，不阻塞后续阶段。交付物状态优先按任务 id 判断，任务不存在时回退到阶段完成度。
- 负责角色是任务归属字典（导购 / 方案顾问 / 设计师 / 项目负责人等），不是员工账号的权限角色，不能混用 `roles` 表。

## 门店后台店铺管理

- “店铺管理”是一级分组导航，下分 `/store/profile`（门店资料）、`/store/staff`（员工账号）、`/store/roles`（角色权限）三个独立页面，页面内不得再用 Tab 合并；`BusinessWorkspace.vue` 用路由第三段决定 `storeTab`。
- 门店资料是单例设置页，保存按钮放页面底部；右侧“门店使用概况”只展示真实统计（员工/角色/产品/客户/报价），不要用占位文案凑版面。
- 门店 LOGO 统一通过 `POST/DELETE /api/admin/store/logo` 维护：图片存 `data/local/store-assets/`，元数据存 `store_profile.payload_json.logo`；登录页与后台侧栏读取 `/api/admin/branding`，不要在组件里写死品牌图；上传/更换/移除需 `store.write`，移除只清引用不物理删除；备份/恢复必须包含 LOGO 文件，报价打印抬头使用同一 LOGO（data URL 内嵌）。
- 员工账号：新建必须 4 位数字 PIN，编辑时 PIN 留空表示沿用原 PIN，修改登录账号必须同时重设 PIN（`pin_hash` 与账号绑定）；当前登录账号、最后一名门店管理员不可删除，前端禁用按钮 + 后端二次校验。
- 角色权限：`ROLE-ADMIN` 为系统内置角色，不可修改也不可删除；仍被员工使用的角色不可删除并提示人数；权限项在界面显示中文标签，存储仍是 `quote.confirm` 等权限码。
- 员工使用某角色时要用 `users` 聚合出的使用数做行内禁用，不要只为提示而允许点击。
- 无请求体的 `DELETE` 不能带 `content-type: application/json`：`AdminApp.vue`、`BusinessWorkspace.vue`、`ProductWorkspace.vue` 的 `api()` 只在有 body 时设置 JSON 头；`server/index.mjs` 同时注册空体 JSON 解析器兜底，不要回退。

## 后台 UI 规范（新增页面强制）

- 新增或改造 `/admin/` 页面前，先读 `D:\QoneLab\3weijia_Code\smartHome\auto-layout\AI doc\20261031-智能家电门店系统\20261103-智能家电门店系统-Admin UI设计规范与页面交付标准-V1.0.md`，并按其“6 种页面模板”选型。
- 同一目录提供可视化阅读版：`...-Admin UI设计规范-可视化版.html`、`...-可视化版.pdf`、`...-一页速查.png`；评审优先看 PDF/PNG，条款以 Markdown 为准。
- 可视化 HTML 的屏幕阅读为 100% 宽；PDF 仅保留为可选导出，不作为必需交付；只阅读时直接打开 HTML。
- 页面骨架固定：左侧栏 240px、内容左右边距 28px；**不使用顶部导航**，内容从视口顶部开始；账号/角色/离线状态/退出固定在侧栏底部；内容区不设最大宽度，不允许整页横向滚动。
- 只使用规范令牌（主色 `#1687F5`、面板圆角 6px、控件高 34px）；禁止新页面引入第二套主色或手写 8/10/12px 圆角。
- 列表页固定顺序：标题区 → 筛选区 → 表格面板 → 分页；新增入口只在标题区右侧，编辑入口在行末操作列。
- 侧栏带子项的一级导航默认收起，同一时间只展开一个一级分组；仅当前路由所在分组自动展开；点击其它分组会先收起原分组再展开并默认进入第一个子页，分组内已有选中子页时只展开、不打断当前页，再次点击收起；移动端点击进入首个子页；`aria-expanded` 与箭头状态同步。
- 侧栏图标统一使用 `src/admin/components/AdminNavIcon.vue` 的 18px 线条 SVG，语义固定为工作台/项目/客户/报价/产品/经营/店铺/设置，不再使用 `⌂`、`▣`、`◈` 等字符替代。
- 列表超过一页必须分页，默认每页 30，可选 20/30/50/100；搜索/筛选后回到第 1 页。
- 复杂表单使用独立编辑页 + 底部固定保存栏，**动作组统一靠左**、状态提示靠右，按钮顺序为 `[取消] [次要保存] [主保存]`；弹窗底部动作组仍靠右；保存必须有 loading、防重复和未保存离开拦截。
- 详情页状态记录按规范 §7.10：已完成 `✓`、当前序号、未到达灰色、作废/关闭终态用虚线分隔；历史缺失显示“已到达 · 历史未记录”，不补造操作人和时间。
- 规范没有覆盖的新要求，先提交“规范变更提案”并升版本，再写页面代码；禁止页面先上线、规范后补。
- 旧页面改动时按规范 §14.2 的 R-01~R-26 清单顺带收敛残留样式；不得复制旧选择器、旧棕色/米色或 8/9/10/12px 圆角到新页面，也不得恢复 `.topbar`。
- Admin 面向门店用户，不展示系统搭建/演示阶段的实现说明：导入来源与字段明细、SQLite/本地存储、任务快照、规则排序、数据边界、演示口径等说明性文案应删除；只保留字段提示、校验错误、状态标签、空状态、风险确认和权限提示。
- 交付前至少验证 1440 / 1024 / 390 三个宽度，页面无整页横向滚动、Console 无 error，并在本工程 `AI doc\README.md` 登记页面说明、截图和验收记录。

## 验证命令

```powershell
npm test
npx vue-tsc --noEmit
npm run build
npm run demo:lighting-data:check
```

涉及界面或规则解释的改动，除单测外还要在浏览器里实际验证：加载户型 → 一键套餐 / 一键布点 → 选中设备看命中规则 → 规则 Tab 两维度 → 2D/3D 切换。

## 写入约定

- 文档、JSON、CSV、脚本统一 UTF-8。
- 不写密码、Token、Cookie、Session、私钥。
- 改动后保留可复现的验证证据，区分“已实现 / 已浏览器验证 / 未验证”。

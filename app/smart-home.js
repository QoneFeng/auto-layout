/* Smart-home device layer for the floorplan-3d base.
 * This file is loaded after the base 2D script and before the 3D module.
 * It adds a device catalog, 2D symbols, a placement panel and a rule adapter.
 */
(function () {
  'use strict';

  if (!window.SMART_DEVICES || !window.SmartHomeRules) {
    console.warn('[smart-home] device catalog or rule bundle is missing');
    return;
  }

  const BASE_DEVICES = [...window.SMART_DEVICES];
  let DEVICES = [...BASE_DEVICES];
  const DEVICE_BY_KEY = Object.fromEntries(BASE_DEVICES.map(d => [d.key, d]));
  const SPACES = window.SMART_SPACES || [];
  const SPACE_BY_CODE = Object.fromEntries(SPACES.map(s => [s.code, s]));
  const CATEGORY_ORDER = ['灯光', '控制', '环境', '安防监控', '网络', '音乐', '遮阳', '暖通'];
  const CATEGORY_COLORS = {
    灯光: '#f0b44a', 控制: '#d7d1c6', 环境: '#7fb2c9', 安防监控: '#c97b7b',
    网络: '#8fa3b8', 音乐: '#9fb6a0', 遮阳: '#c9b08a', 暖通: '#b7c4d2',
  };
  const ROOM_SPACE = {
    master: 'ZW', mbath: 'WSWSJ', kid: 'XHF', gbath: 'WSJ', laundry: 'YT',
    child: 'WS', kitchen: 'CF', dining: 'CT', hall: 'GDYT', living: 'KT',
    balcony: 'YT', bay1: 'ZW', bay2: 'WS',
  };
  if (window.__spaceMode?.active) {
    ROOM_SPACE.space = window.__spaceMode.code;
    Object.assign(ROOM_SPACE, window.__spaceMode.roomMap || {});
  }
  const SPACE_MODE = {
    KT: 'MIXED', CT: 'MAIN', ZW: 'MIXED', SF: 'MIXED', WS: 'MAIN',
    LRF: 'MAIN', XHF: 'MAIN', XCW: 'NO_MAIN', CF: 'NO_MAIN', WSJ: 'NO_MAIN',
    GDYT: 'NO_MAIN', YT: 'NO_MAIN', YMJ: 'NO_MAIN', WSWSJ: 'NO_MAIN', CS: 'MAIN',
  };
  const FURN_MAP = {
    bed: 'bed', crib: 'bed', nightstand: 'nightstand', wardrobe: 'wardrobe',
    dresser: 'dresser', desk: 'desk', chair: 'chair', officechair: 'chair',
    barstool: 'chair', bookshelf: 'bookshelf', baycushion: 'bench',
    sofa: 'sofa', cornersofa: 'sofa', armchair: 'sofa', beanbag: 'sofa',
    coffeetable: 'coffeeTable', tvstand: 'tvCabinet', tv: 'tv', rug: 'rug',
    shoecab: 'shoeCabinet', table: 'diningTable', roundtable: 'diningTable',
    island: 'island', counter: 'kitchenCounter', stove: 'stove', ksink: 'sink',
    fridge: 'fridge', cabinet: 'sideboard', toilet: 'toilet', vanity: 'vanity',
    shower: 'shower', bathtub: 'bathtub', washer: 'washingMachine', dryer: 'dryer',
    dishwasher: 'kitchenCounter', ovencol: 'upperCabinet', purifier: 'console',
    waterheater: 'console', piano: 'console', treadmill: 'console',
  };
  const BASE_LIGHT_TYPE = {
    '筒灯': 'spot', '射灯': 'spot', '轨道射灯 · 灯头': 'spot',
    '吸顶灯': 'ceiling', '面板灯': 'panel', '格栅灯': 'grille', '吊灯': 'pendant',
    '壁灯': 'walllamp', '落地灯': 'floorlamp', '台灯': 'tablelamp',
    '直线灯带': 'strip', '贴墙灯带': 'strip', '灯槽灯带': 'strip',
    '窗帘灯带': 'strip', '柜体灯带': 'strip',
    '轨道射灯 · 轨道': 'track', '磁吸泛光灯 · 磁吸轨道': 'track',
    '磁吸格栅灯 · 磁吸轨道': 'track',
    '磁吸泛光灯 · 灯体': 'spot', '磁吸格栅灯 · 灯体': 'spot',
  };

  // 默认进入工作台不携带上次生成的智能设备；需要恢复时显式加 ?restore=1。
  // 家具布置、墙体、地面材料仍按原有 localStorage 逻辑保留。
  const bootParams = new URLSearchParams(location.search);
  if (bootParams.get('restore') !== '1' && !bootParams.get('project')) {
    const hadDevices = state.furniture.some(f => f.type && f.type.startsWith('dev:'));
    if (hadDevices) {
      state.furniture = state.furniture.filter(f => !(f.type && f.type.startsWith('dev:')));
      saveSafe();
      renderAll();
      console.log('[smart-home] cleared persisted smart devices; use ?restore=1 to keep them');
    }
  }

  function centroid(poly) {
    if (!Array.isArray(poly) || !poly.length) return [0, 0];
    let x = 0, y = 0;
    for (const p of poly) { x += p[0]; y += p[1]; }
    return [x / poly.length, y / poly.length];
  }

  function pointInPoly(p, poly) {
    if (!Array.isArray(poly) || poly.length < 3) return false;
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if (((yi > p[1]) !== (yj > p[1])) && (p[0] < ((xj - xi) * (p[1] - yi)) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  function zoneAsRoom(z) {
    return {
      id: z.id, name: z.name, poly: Array.isArray(z.poly) ? z.poly : [],
      spaceCode: z.spaceCode,
      mat: 'tile800',
      zone: true,
    };
  }

  function roomOf(x, y) {
    for (const z of (state.zones || [])) if (Array.isArray(z.poly) && pointInPoly([x, y], z.poly)) return zoneAsRoom(z);
    for (const r of ROOMS) if (pointInPoly([x, y], r.poly)) return r;
    let best = ROOMS[0], bestD = Infinity;
    for (const r of ROOMS) {
      const c = centroid(r.poly), d = Math.hypot(c[0] - x, c[1] - y);
      if (d < bestD) { bestD = d; best = r; }
    }
    return best;
  }

  function deviceItems() {
    return state.furniture.filter(f => f.type && f.type.startsWith('dev:'));
  }

  function deviceKeyOf(f) { return f.type.slice(4); }
  function isDerivedDevice(f) {
    const notes = f.smart?.trace?.notes || [];
    return notes.includes('CHILD_TRACK') || notes.includes('SHARED_TRACK');
  }
  function isDemoDevice(f) {
    return f.smart?.ruleCode === 'DEMO-COMBO';
  }
  function isWholeHouseDevice(f) {
    return f.smart?.source === 'wholeHouse' || f.smart?.ruleCode === 'WHOLE-HOUSE';
  }

  /* ---------------- 照明意图 / 控制组 ---------------- */
  const LAYER_LABELS = { base: '基础照明', task: '任务照明', accent: '重点照明' };
  const WATT_INTENT = {
    '筒灯': 9, '射灯': 7, '吸顶灯': 24, '吊灯': 32, '面板灯': 36, '格栅灯': 24,
    '壁灯': 8, '台灯': 8, '落地灯': 10, '磁吸泛光灯 · 灯体': 12,
    '磁吸格栅灯 · 灯体': 12, '轨道射灯 · 灯头': 9, '磁吸泛光灯 · 磁吸轨道': 0,
    '磁吸格栅灯 · 磁吸轨道': 0, '轨道射灯 · 轨道': 0, '灯槽灯带': 6, '窗帘灯带': 6,
    '柜体灯带': 6, '直线灯带': 6, '贴墙灯带': 6,
  };
  // P0 模拟产品数据：仅用于 Demo 走通产品/回路/协议状态，不是真实选品。
  // app/data/demo-lighting-data.js 由 npm run demo:lighting-data 生成；缺失时回退到内置最小集。
  const DEMO_DATA = window.__DEMO_LIGHTING__ || null;
  const DEMO_DATASET = DEMO_DATA?.manifest || null;
  const DEMO_PRODUCTS_FALLBACK = {
    '筒灯': { id: 'DEMO-DL-9W', watt: 9, lumen: 800, beam: 60, ugr: 19 },
    '射灯': { id: 'DEMO-SP-7W', watt: 7, lumen: 600, beam: 24, ugr: 19 },
    '吸顶灯': { id: 'DEMO-CL-24W', watt: 24, lumen: 2200, beam: 110, ugr: 22 },
    '吊灯': { id: 'DEMO-PD-32W', watt: 32, lumen: 2600, beam: 90, ugr: 19 },
    '面板灯': { id: 'DEMO-PL-36W', watt: 36, lumen: 3200, beam: 110, ugr: 19 },
    '格栅灯': { id: 'DEMO-GR-24W', watt: 24, lumen: 2400, beam: 90, ugr: 19 },
    '壁灯': { id: 'DEMO-WL-8W', watt: 8, lumen: 500, beam: 60, ugr: 19 },
    '台灯': { id: 'DEMO-TL-8W', watt: 8, lumen: 600, beam: 60, ugr: 19 },
    '落地灯': { id: 'DEMO-FL-10W', watt: 10, lumen: 800, beam: 60, ugr: 19 },
    '磁吸泛光灯 · 灯体': { id: 'DEMO-MG-12W', watt: 12, lumen: 1000, beam: 36, ugr: 19 },
    '磁吸格栅灯 · 灯体': { id: 'DEMO-MGG-12W', watt: 12, lumen: 1000, beam: 36, ugr: 19 },
    '灯槽灯带': { id: 'DEMO-LS-6W/M', watt: 6, lumen: 600, beam: 120, ugr: 22 },
    '窗帘灯带': { id: 'DEMO-CLS-6W/M', watt: 6, lumen: 600, beam: 120, ugr: 22 },
    '柜体灯带': { id: 'DEMO-CB-6W/M', watt: 6, lumen: 500, beam: 120, ugr: 22 },
  };
  const DEMO_PRODUCTS = { ...DEMO_PRODUCTS_FALLBACK, ...(DEMO_DATA?.productsByKey || {}) };
  const DEMO_PROTOCOLS = DEMO_DATA?.standard?.protocols || ['DALI', '0-10V', 'KNX', '无线'];
  const DEMO_LIGHT_STANDARD = (() => {
    const fallback = {
      source: 'GB 50034 常用照度/UGR 目标值的 Demo 保守取值，待项目所在地版本校核',
      targetLux: { KT: 150, CT: 200, ZW: 100, SF: 300, WS: 100, LRF: 150, XHF: 200, XCW: 100, CF: 300, WSJ: 200, GDYT: 100, YT: 100, YMJ: 150, WSWSJ: 200, CS: 150 },
      ugr: { KT: 19, CT: 19, ZW: 19, SF: 19, WS: 19, LRF: 19, XHF: 19, XCW: 19, CF: 19, WSJ: 19, GDYT: 22, YT: 22, YMJ: 19, WSWSJ: 19, CS: 19 },
    };
    const raw = DEMO_DATA?.standard;
    if (!raw?.targets) return fallback;
    const targetLux = {}, ugr = {};
    for (const [code, t] of Object.entries(raw.targets)) {
      targetLux[code] = t.targetLux;
      ugr[code] = t.ugr;
    }
    return {
      ...raw,
      targetLux,
      ugr,
      source: `${raw.project?.location || '演示项目'} · ${raw.standard?.code || 'GB/T 50034'}（${raw.standard?.edition || '演示口径'}） · ${raw.standard?.note || ''}`,
    };
  })();
  const DEMO_OBSTACLES = DEMO_DATA?.obstaclesBySpace || {};
  const DEMO_CIRCUITS = DEMO_DATA?.circuitsBySpaceLayer || {};
  const DEMO_CIRCUIT_LIST = DEMO_DATA?.circuits || [];
  const CIRCUIT_META = Object.fromEntries(DEMO_CIRCUIT_LIST.map(c => [c.circuitId, c]));
  const DEMO_CONTROLS = DEMO_DATA?.controlsBySpace || {};
  const CONTROL_KEYS = ['开关面板', '情景面板', '无线开关', '调光旋钮', '中控屏'];
  const DEMO_SCENES = DEMO_DATA?.scenes || [];
  const DEMO_DATA_LOADED = !!DEMO_DATA;

  const _circuitCursor = new Map();
  function resetLightingCircuitCursor() {
    _circuitCursor.clear();
  }
  function nextDaliAddress(circuit) {
    if (!circuit) return null;
    const used = _circuitCursor.get(circuit.circuitId) || 0;
    const address = circuit.daliAddressStart + used;
    _circuitCursor.set(circuit.circuitId, used + 1);
    return address <= circuit.daliAddressEnd ? address : null;
  }
  let _ruleByCode = null;
  function ruleForDevice(f) {
    if (!_ruleByCode) {
      _ruleByCode = new Map((window.SmartHomeRules?.allRules?.() || []).map(r => [r.pointCode, r]));
    }
    return f.smart?.ruleCode ? _ruleByCode.get(f.smart.ruleCode) : null;
  }
  function isLightingDevice(f) {
    return DEVICE_BY_KEY[deviceKeyOf(f)]?.category1 === '灯光';
  }
  function lightingMetaFor(f) {
    const key = deviceKeyOf(f);
    const def = DEVICE_BY_KEY[key];
    if (!def || def.category1 !== '灯光') return null;
    const rule = ruleForDevice(f);
    const type = f.name || rule?.deviceType2 || key;
    const usage = rule?.usage || '';
    let layer = 'base';
    if (['台灯', '落地灯'].includes(type) || /阅读|书桌|镜前|水槽|备餐|吊柜|镜柜|床头|餐吊/.test(usage)) layer = 'task';
    else if (/洗墙|展示|端景|挂画|鞋柜|餐边柜|马桶|淋浴/.test(usage) || type === '壁灯' || (type === '柜体灯带' && !/吊柜|镜柜/.test(usage))) layer = 'accent';
    const room = roomOf(f.cx, f.cy);
    const roomId = f.smart?.roomId || room.id;
    const space = ROOM_SPACE[roomId] || ROOM_SPACE[room.id] || 'KT';
    const baseCct = ['ZW', 'WS', 'LRF', 'XHF'].includes(space) ? 3000 : (['KT', 'CT', 'CS'].includes(space) ? 3500 : 4000);
    const designCct = layer === 'accent' ? 3000 : layer === 'task' ? 4000 : baseCct;
    const line = /灯带|磁吸.*轨道/.test(type);
    const product = DEMO_PRODUCTS[type] || {
      productId: `DEMO-${type}`, model: type, watt: WATT_INTENT[type] ?? 9, lumen: 800,
      beam: line ? 120 : 60, ugr: 22, protocols: DEMO_PROTOCOLS, dimmingProtocols: ['DALI'],
      photometryStatus: 'synthetic', iesFile: null, ldtFile: null,
    };
    // 有模拟产品时以色温型号为准，避免“设计 3500K / 型号 3000K”自相矛盾；无产品数据才用设计意图值。
    const cct = product.cct ?? designCct;
    const passive = product.lumen === 0 || product.photometryStatus === 'not_applicable';
    const beam = product.beam || (line ? 120 : layer === 'accent' ? 24 : layer === 'task' ? 36 : 60);
    const meters = Math.max(.3, f.w / 1000);
    const watt = /灯带/.test(type) ? Math.max(3, Math.round(meters * product.watt)) : (product.watt || 0);
    const lumen = /灯带/.test(type) ? Math.round(meters * (product.lumen || 0)) : (product.lumen || 0);
    const group = `${roomId}::${layer}`;
    const circuit = DEMO_CIRCUITS[`${space}:${layer}`] || null;
    const daliAddress = circuit && !passive ? nextDaliAddress(circuit) : null;
    const protocols = Array.isArray(product.protocols) ? product.protocols : DEMO_PROTOCOLS;
    return {
      layer,
      group,
      groupLabel: `${roomLabel(roomId)} · ${LAYER_LABELS[layer]}`,
      cct, beam, watt,
      specStatus: 'intent',
      productId: product.productId || product.id || `DEMO-${type}`,
      productName: product.model || product.productId || type,
      productStatus: 'selected_for_demo',
      productSource: 'simulated',
      hasPhotometry: !passive && !!product.iesFile,
      photometryStatus: product.photometryStatus || (!passive && product.iesFile ? 'synthetic' : 'missing'),
      iesFile: product.iesFile || null,
      ldtFile: product.ldtFile || null,
      lumen,
      ugr: product.ugr ?? 22,
      cri: product.cri ?? null,
      efficacy: product.efficacy ?? null,
      protocols,
      protocolStatus: passive ? 'not_applicable' : (protocols.length ? 'simulated' : 'missing'),
      circuitId: circuit?.circuitId || `DEMO-C-${roomId}-${layer}`,
      circuitSource: circuit ? 'simulated' : 'missing',
      dimmingProtocol: passive ? null : (product.dimmingProtocols?.[0] || 'DALI'),
      gatewayId: circuit?.gatewayId || null,
      daliUniverse: circuit?.daliUniverse || null,
      daliAddress,
      sceneIds: circuit?.sceneIds || [],
    };
  }
  function lightingOf(f) {
    return f.smart?.lighting || lightingMetaFor(f);
  }

  function roomBox(room) {
    const xs = room.poly.map(p => p[0]), ys = room.poly.map(p => p[1]);
    return { x0: Math.min(...xs), y0: Math.min(...ys), x1: Math.max(...xs), y1: Math.max(...ys) };
  }

  // P0 障碍物：优先使用模拟实测数据包；缺失空间回退到建筑派生。
  // 数据包中的空调/窗帘盒/检修口都是 simulated_survey，仍需现场复核。
  const AC_SPACES = ['KT', 'CT', 'ZW', 'WS', 'LRF', 'XHF', 'SF', 'CS'];
  function spaceCodeOfRoom(room) {
    return room.spaceCode || ROOM_SPACE[room.id] || 'KT';
  }
  function rectOnWall(b, wall, along, width, depth) {
    const bw = b.x1 - b.x0, bh = b.y1 - b.y0;
    const a = Math.max(0, Math.min(1, Number(along) || 0));
    if (wall === 'south') {
      const x0 = b.x0 + a * Math.max(0, bw - width);
      return [x0, b.y1 - depth, x0 + width, b.y1];
    }
    if (wall === 'west') {
      const y0 = b.y0 + a * Math.max(0, bh - width);
      return [b.x0, y0, b.x0 + depth, y0 + width];
    }
    if (wall === 'east') {
      const y0 = b.y0 + a * Math.max(0, bh - width);
      return [b.x1 - depth, y0, b.x1, y0 + width];
    }
    const x0 = b.x0 + a * Math.max(0, bw - width);
    return [x0, b.y0, x0 + width, b.y0 + depth];
  }
  function lightingObstacles() {
    const out = [];
    for (const room of ROOMS) {
      const b = roomBox(room);
      const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
      const spaceCode = spaceCodeOfRoom(room);
      const tpl = DEMO_OBSTACLES[spaceCode];

      if (tpl) {
        const cb = tpl.curtainBox;
        if (cb?.present) {
          WINS.forEach((r, i) => {
            const wx = (r[0] + r[2]) / 2, wy = (r[1] + r[3]) / 2;
            if (wx < b.x0 || wx > b.x1 || wy < b.y0 || wy > b.y1) return;
            const horizontal = (r[2] - r[0]) >= (r[3] - r[1]);
            const depth = cb.depth || 220;
            let rect;
            if (horizontal) {
              const inward = cy > wy ? 1 : -1;
              rect = [r[0], inward > 0 ? r[3] : r[1] - depth, r[2], inward > 0 ? r[3] + depth : r[1]];
            } else {
              const inward = cx > wx ? 1 : -1;
              rect = [inward > 0 ? r[2] : r[0] - depth, r[1], inward > 0 ? r[2] + depth : r[0], r[3]];
            }
            out.push({
              id: `obs-curtain-${room.id}-${i}`, type: 'curtain_box', roomId: room.id,
              rect, z: [cb.z0, cb.z1], clearance: cb.clearance, source: tpl.source, assumption: tpl.assumption,
            });
          });
        }

        const ap = tpl.accessPanel;
        if (ap?.present) {
          const ax = b.x0 + (b.x1 - b.x0) * (ap.rx ?? .5);
          const ay = b.y0 + (b.y1 - b.y0) * (ap.ry ?? .5);
          out.push({
            id: `obs-access-${room.id}`, type: 'access_panel', roomId: room.id,
            rect: [ax - ap.width / 2, ay - ap.depth / 2, ax + ap.width / 2, ay + ap.depth / 2],
            z: [ap.z0, ap.z1], clearance: ap.clearance, source: tpl.source, assumption: tpl.assumption,
          });
        }

        const ac = tpl.ac;
        if (ac?.present) {
          out.push({
            id: `obs-ac-${room.id}`, type: 'ac', roomId: room.id,
            rect: rectOnWall(b, ac.wall || 'north', ac.along, ac.width, ac.depth),
            z: [ac.z0, ac.z1], clearance: ac.clearance, source: tpl.source, assumption: tpl.assumption,
            acType: ac.type,
          });
        }
        continue;
      }

      // 数据包没有该空间时的回退：窗帘盒/检修口按建筑条件派生。
      WINS.forEach((r, i) => {
        const wx = (r[0] + r[2]) / 2, wy = (r[1] + r[3]) / 2;
        if (wx < b.x0 || wx > b.x1 || wy < b.y0 || wy > b.y1) return;
        const horizontal = (r[2] - r[0]) >= (r[3] - r[1]);
        let rect;
        if (horizontal) {
          const inward = cy > wy ? 1 : -1;
          rect = [r[0], inward > 0 ? r[3] : r[1] - 220, r[2], inward > 0 ? r[3] + 220 : r[1]];
        } else {
          const inward = cx > wx ? 1 : -1;
          rect = [inward > 0 ? r[2] : r[0] - 220, r[1], inward > 0 ? r[2] + 220 : r[0], r[3]];
        }
        out.push({ id: `obs-curtain-${room.id}-${i}`, type: 'curtain_box', roomId: room.id, rect, z: [2400, 2800], clearance: 50, source: 'design_assumption' });
      });
      const ax = b.x0 + (b.x1 - b.x0) * .72, ay = b.y0 + (b.y1 - b.y0) * .3;
      out.push({ id: `obs-access-${room.id}`, type: 'access_panel', roomId: room.id, rect: [ax - 300, ay - 300, ax + 300, ay + 300], z: [2750, 2800], clearance: 300, source: 'design_assumption' });
    }

    // 未提供数据包的空间，才从已放置的暖通设备推导空调；避免与模拟实测重复。
    for (const d of state.furniture) {
      if (!d.type?.startsWith('dev:')) continue;
      const def = DEVICE_BY_KEY[deviceKeyOf(d)];
      if (def?.category1 !== '暖通' && !String(d.name || '').includes('空调')) continue;
      const room = roomOf(d.cx, d.cy);
      if (DEMO_OBSTACLES[spaceCodeOfRoom(room)]) continue;
      const rad = (d.rot || 0) * Math.PI / 180;
      const hw = d.w / 2 * Math.abs(Math.cos(rad)) + d.d / 2 * Math.abs(Math.sin(rad));
      const hh = d.w / 2 * Math.abs(Math.sin(rad)) + d.d / 2 * Math.abs(Math.cos(rad));
      const z = d.smart?.z || 0;
      out.push({
        id: `obs-ac-${d.id}`, type: 'ac', roomId: d.smart?.roomId || room.id,
        rect: [d.cx - hw, d.cy - hh, d.cx + hw, d.cy + hh],
        z: [z, z + 1800], clearance: 100, source: 'device',
      });
    }
    return out;
  }

  function lightBody(f) {
    const rad = (f.rot || 0) * Math.PI / 180;
    const hw = f.w / 2 * Math.abs(Math.cos(rad)) + f.d / 2 * Math.abs(Math.sin(rad));
    const hh = f.w / 2 * Math.abs(Math.sin(rad)) + f.d / 2 * Math.abs(Math.cos(rad));
    const z = f.smart?.z || 0;
    return { x0: f.cx - hw, y0: f.cy - hh, x1: f.cx + hw, y1: f.cy + hh, z0: z - 60, z1: z + 60, z };
  }
  function overlap3(a, b, pad = 0) {
    return a.x0 < b.x1 + pad && a.x1 > b.x0 - pad && a.y0 < b.y1 + pad && a.y1 > b.y0 - pad && a.z0 < b.z1 + pad && a.z1 > b.z0 - pad;
  }
  function lightingCollisionsFor(f) {
    if (!isLightingDevice(f) || f.smart?.status === 'pending') return [];
    const body = lightBody(f);
    const roomId = f.smart?.roomId || roomOf(f.cx, f.cy).id;
    const out = [];
    for (const o of lightingObstacles()) {
      if (o.roomId !== roomId) continue;
      const rect = { x0: o.rect[0], y0: o.rect[1], x1: o.rect[2], y1: o.rect[3], z0: o.z[0], z1: o.z[1] };
      if (overlap3(body, rect)) out.push({ obstacle: o, severity: 'BODY' });
      else if (overlap3(body, rect, o.clearance)) out.push({ obstacle: o, severity: 'CLEARANCE' });
    }
    return out;
  }

  function lightingP0Stats() {
    const lights = deviceItems().filter(isLightingDevice);
    const obstacles = lightingObstacles();
    const collisions = [];
    for (const f of lights) {
      for (const c of lightingCollisionsFor(f)) collisions.push({ id: f.id, name: f.name, rule: f.smart?.ruleCode || 'MANUAL', ...c });
    }
    const active = lights.filter(f => lightingOf(f)?.photometryStatus !== 'not_applicable');
    const selected = lights.filter(f => lightingOf(f)?.productStatus === 'selected').length;
    const simulated = lights.filter(f => lightingOf(f)?.productSource === 'simulated').length;
    const syntheticPhotometry = active.filter(f => lightingOf(f)?.photometryStatus === 'synthetic').length;
    const verifiedPhotometry = active.filter(f => lightingOf(f)?.photometryStatus === 'verified').length;
    const missingPhotometry = active.filter(f => lightingOf(f)?.photometryStatus === 'missing').length;
    const missingRealPhotometry = active.filter(f => lightingOf(f)?.photometryStatus !== 'verified').length;
    const notApplicablePhotometry = lights.length - active.length;
    const missingCircuit = lights.filter(f => !lightingOf(f)?.circuitId).length;
    const unverifiedCircuits = lights.filter(f => lightingOf(f)?.circuitSource !== 'verified').length;
    const missingProtocol = active.filter(f => !lightingOf(f)?.dimmingProtocol).length;
    const unverifiedProtocols = active.filter(f => lightingOf(f)?.protocolStatus !== 'verified').length;
    const daliAddressesUsed = lights.filter(f => lightingOf(f)?.daliAddress != null).length;
    const daliCapacity = DEMO_DATASET?.counts?.gateways ? DEMO_DATASET.counts.gateways * 64 : null;
    const daliOverflow = active.filter(f => lightingOf(f)?.circuitId && lightingOf(f)?.daliAddress == null).length;
    const circuitsUsed = new Set(lights.map(f => lightingOf(f)?.circuitId).filter(Boolean)).size;
    const gatewaysUsed = new Set(lights.map(f => lightingOf(f)?.gatewayId).filter(Boolean)).size;
    const modeledAcRooms = new Set(obstacles.filter(o => o.type === 'ac').map(o => o.roomId));
    const acExpected = new Set(AC_SPACES);
    const acMissingRooms = ROOMS.filter(r => acExpected.has(spaceCodeOfRoom(r)) && !modeledAcRooms.has(r.id)).length;
    return {
      obstacles, collisions,
      body: collisions.filter(c => c.severity === 'BODY').length,
      clearance: collisions.filter(c => c.severity === 'CLEARANCE').length,
      selected, simulated, intent: lights.length - simulated - selected,
      syntheticPhotometry, verifiedPhotometry, missingPhotometry, missingRealPhotometry, notApplicablePhotometry,
      missingCircuit, unverifiedCircuits, missingProtocol, unverifiedProtocols,
      daliAddressesUsed, daliCapacity, daliOverflow, circuitsUsed, gatewaysUsed,
      acMissingRooms, acModeledRooms: modeledAcRooms.size,
    };
  }

  /* ---------------- 照明回路视图 ---------------- */
  function circuitColor(circuitId) {
    const idx = DEMO_CIRCUIT_LIST.findIndex(c => c.circuitId === circuitId);
    const hue = idx >= 0 ? Math.round((idx * 137.508) % 360) : 210;
    return `hsl(${hue}, 62%, 42%)`;
  }

  function circuitPowerOn(circuitId) {
    return circuitPower.get(circuitId) !== false;
  }

  function controlBindings() {
    const byDevice = new Map();
    const byCircuit = new Map();
    const fallbackRole = { 开关面板: 'switch', 情景面板: 'scene', 无线开关: 'wireless', 调光旋钮: 'dim', 中控屏: 'master' };
    const rooms = new Map();
    for (const f of deviceItems()) {
      const key = deviceKeyOf(f);
      if (!CONTROL_KEYS.includes(key)) continue;
      const room = roomOf(f.cx, f.cy);
      const space = spaceCodeOfRoom(room);
      const entry = rooms.get(room.id) || { space, devices: [] };
      entry.devices.push(f);
      rooms.set(room.id, entry);
    }
    const candidates = new Map();
    const addCandidate = (circuitId, binding, priority, buttonIndex = null, buttonLabel = '') => {
      const current = candidates.get(circuitId);
      if (!current || priority < current.priority) {
        candidates.set(circuitId, { binding, priority, buttonIndex, buttonLabel });
      }
    };
    for (const { space, devices } of rooms.values()) {
      const defs = DEMO_CONTROLS[space]?.controls || [];
      const roomCircuits = (DEMO_DATA?.circuits || []).filter(c => c.spaceCode === space).map(c => c.circuitId).filter(id => CIRCUIT_META[id]);
      const switchDef = defs.find(c => c.role === 'switch');
      const switchCircuits = (switchDef?.circuitIds || roomCircuits).filter(id => CIRCUIT_META[id]);
      const switches = devices
        .filter(f => deviceKeyOf(f) === '开关面板')
        .sort((a, b) => String(a.smart?.ruleCode || '').localeCompare(String(b.smart?.ruleCode || '')) || a.cx - b.cx);

      switches.forEach((f, idx) => {
        const binding = {
          role: idx === 0 ? 'switch' : 'switch-mirror',
          label: switchDef?.label || '开关面板',
          circuitIds: switchCircuits,
          buttons: switchDef?.buttons || [],
          device: f,
          ruleCode: f.smart?.ruleCode || '开关面板',
        };
        byDevice.set(f.id, binding);
        if (idx === 0) {
          switchCircuits.forEach((circuitId, buttonIndex) => {
            const buttonLabel = switchDef?.buttons?.find(x => x.circuitId === circuitId)?.label || `键${buttonIndex + 1}`;
            addCandidate(circuitId, binding, 10, buttonIndex, buttonLabel);
          });
        }
      });

      for (const role of ['wireless', 'dim']) {
        const roleKey = role === 'wireless' ? '无线开关' : '调光旋钮';
        const roleDevices = devices.filter(x => deviceKeyOf(x) === roleKey);
        if (!roleDevices.length) continue;
        const def = defs.find(c => c.role === role);
        const ids = (def?.circuitIds || []).filter(id => CIRCUIT_META[id]);
        if (!ids.length) continue;
        roleDevices.forEach((f, idx) => {
          const binding = {
            role: idx === 0 ? role : `${role}-mirror`,
            label: def?.label || (role === 'wireless' ? '无线开关' : '调光旋钮'),
            circuitIds: ids,
            device: f,
            ruleCode: f.smart?.ruleCode || deviceKeyOf(f),
          };
          byDevice.set(f.id, binding);
          if (idx === 0) ids.forEach(circuitId => addCandidate(circuitId, binding, role === 'wireless' ? 20 : 30, null, ''));
        });
      }

      for (const [key, role] of [['情景面板', 'scene'], ['中控屏', 'master']]) {
        const roleDevices = devices.filter(x => deviceKeyOf(x) === key);
        if (!roleDevices.length) continue;
        const def = defs.find(c => c.role === role);
        const ids = (def?.circuitIds || roomCircuits).filter(id => CIRCUIT_META[id]);
        roleDevices.forEach(f => {
          byDevice.set(f.id, {
            role,
            label: def?.label || key,
            circuitIds: ids,
            sceneIds: def?.sceneIds || [],
            device: f,
            ruleCode: f.smart?.ruleCode || key,
          });
        });
      }
    }
    for (const [circuitId, item] of candidates) {
      byCircuit.set(circuitId, {
        ...item.binding,
        buttonIndex: item.buttonIndex,
        buttonLabel: item.buttonLabel,
        primary: true,
      });
    }
    return { byDevice, byCircuit };
  }

  function toggleCircuitPower(ids, force) {
    const list = [...new Set(ids || [])].filter(id => CIRCUIT_META[id]);
    if (!list.length) return;
    const anyOn = list.some(id => circuitPowerOn(id));
    const next = force ?? !anyOn;
    for (const id of list) circuitPower.set(id, next);
    for (const f of deviceItems()) {
      const cid = lightingOf(f)?.circuitId;
      if (cid && list.includes(cid)) {
        f.smart = f.smart || {};
        f.smart.power = next ? 'on' : 'off';
      }
    }
    saveSafe();
    renderAll();
    refreshPicked();
    renderCircuitLines();
    toastSafe(`${next ? '已打开' : '已关闭'}：${list.join(' / ')}`);
  }

  // 场景是按“空间 + 照明层级”下发到回路的演示控制，不直接改动设备数量或点位。
  function applyLightingScene(sceneId) {
    const rows = DEMO_SCENES.flatMap(s => Array.isArray(s.rows) ? s.rows : []);
    const sceneRows = rows.filter(r => r.sceneId === sceneId);
    if (!sceneRows.length) {
      toastSafe('当前数据包没有可执行的场景明细');
      return;
    }
    const wanted = new Map(sceneRows.map(r => [`${r.spaceCode}:${r.layer}`, Number(r.level) > 0]));
    for (const circuit of DEMO_DATA?.circuits || []) {
      const key = `${circuit.spaceCode}:${circuit.layer}`;
      if (!wanted.has(key)) continue;
      circuitPower.set(circuit.circuitId, wanted.get(key));
    }
    for (const f of deviceItems()) {
      const meta = lightingOf(f);
      if (!meta?.circuitId || !circuitPower.has(meta.circuitId)) continue;
      f.smart = f.smart || {};
      f.smart.power = circuitPowerOn(meta.circuitId) ? 'on' : 'off';
    }
    saveSafe();
    renderAll();
    refreshPicked();
    renderCircuitLines();
    const scene = DEMO_SCENES.find(s => s.id === sceneId);
    toastSafe(`已执行场景：${scene?.name || sceneId}（${sceneRows.length} 条空间照明指令）`);
  }

  function resetCircuitPowerState() {
    circuitPower.clear();
    for (const f of deviceItems()) {
      if (f.smart) f.smart.power = 'on';
    }
  }

  function circuitGroups() {
    const map = new Map();
    for (const f of deviceItems().filter(isLightingDevice)) {
      const meta = lightingOf(f);
      if (!meta?.circuitId) continue;
      const cm = CIRCUIT_META[meta.circuitId] || {};
      let g = map.get(meta.circuitId);
      if (!g) {
        const room = roomOf(f.cx, f.cy);
        g = {
          circuitId: meta.circuitId,
          layer: meta.layer,
          layerLabel: LAYER_LABELS[meta.layer] || meta.layer,
          spaceName: cm.spaceName || roomLabel(f.smart?.roomId || room.id),
          gatewayId: meta.gatewayId || cm.gatewayId || '—',
          daliStart: cm.daliAddressStart,
          daliEnd: cm.daliAddressEnd,
          driverQty: cm.driverQty,
          lights: [],
        };
        map.set(meta.circuitId, g);
      }
      g.lights.push(f);
    }
    const { byCircuit } = controlBindings();
    return [...map.values()]
      .map(g => {
        const primary = byCircuit.get(g.circuitId);
        return { ...g, controls: primary ? [primary] : [] };
      })
      .sort((a, b) => a.circuitId.localeCompare(b.circuitId));
  }

  function mstEdges(points) {
    const n = points.length;
    if (n < 2) return [];
    const used = new Array(n).fill(false);
    used[0] = true;
    const edges = [];
    for (let k = 1; k < n; k++) {
      let best = null;
      for (let i = 0; i < n; i++) {
        if (!used[i]) continue;
        for (let j = 0; j < n; j++) {
          if (used[j]) continue;
          const d = Math.hypot(points[i][0] - points[j][0], points[i][1] - points[j][1]);
          if (!best || d < best.d) best = { i, j, d };
        }
      }
      if (!best) break;
      used[best.j] = true;
      edges.push([best.i, best.j]);
    }
    return edges;
  }

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length / 2)];
  }

  // 回路走线采用“主干 + 支线”的正交布局，避免 MST 斜线穿房间。
  function circuitGeometry(points) {
    const xs = points.map(p => p[0]), ys = points.map(p => p[1]);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    if ((maxX - minX) >= (maxY - minY)) {
      const trunkY = median(ys);
      const drops = points
        .filter(p => Math.abs(p[1] - trunkY) > 8)
        .map(p => `M${p[0]} ${p[1]}L${p[0]} ${trunkY}`)
        .join('');
      return {
        orientation: 'h', x0: minX, x1: maxX, y0: trunkY, y1: trunkY, trunkY,
        trunk: `M${minX} ${trunkY}L${maxX} ${trunkY}`,
        drops,
        hub: [(minX + maxX) / 2, trunkY],
      };
    }
    const trunkX = median(xs);
    const drops = points
      .filter(p => Math.abs(p[0] - trunkX) > 8)
      .map(p => `M${p[0]} ${p[1]}L${trunkX} ${p[1]}`)
      .join('');
    return {
      orientation: 'v', x0: trunkX, x1: trunkX, y0: minY, y1: maxY, trunkX,
      trunk: `M${trunkX} ${minY}L${trunkX} ${maxY}`,
      drops,
      hub: [trunkX, (minY + maxY) / 2],
    };
  }

  function controlPath(point, geom) {
    if (geom.orientation === 'h') {
      const targetX = Math.max(geom.x0, Math.min(geom.x1, point[0]));
      return `M${point[0]} ${point[1]}L${point[0]} ${geom.trunkY}L${targetX} ${geom.trunkY}`;
    }
    const targetY = Math.max(geom.y0, Math.min(geom.y1, point[1]));
    return `M${point[0]} ${point[1]}L${geom.trunkX} ${point[1]}L${geom.trunkX} ${targetY}`;
  }

  function refreshCircuitPanel() {
    const host = circuitPanel.querySelector('#circuit-list');
    if (!host) return;
    const all = circuitGroups();
    const visible = circuitLayer === 'all' ? all : all.filter(g => g.layer === circuitLayer);
    const totalLights = visible.reduce((s, g) => s + g.lights.length, 0);
    const gateways = new Set(visible.map(g => g.gatewayId).filter(g => g && g !== '—'));
    const addresses = visible.flatMap(g => g.lights.map(f => lightingOf(f)?.daliAddress)).filter(a => a != null);
    const capacity = DEMO_DATASET?.counts?.gateways ? DEMO_DATASET.counts.gateways * 64 : null;
    const allControls = deviceItems().filter(f => CONTROL_KEYS.includes(deviceKeyOf(f)));
    const boundControls = controlBindings().byDevice.size;
    circuitPanel.querySelector('#circuit-count').textContent = `${all.length} 个 · ${all.reduce((s, g) => s + g.lights.length, 0)} 灯位`;
    circuitPanel.querySelector('#circuit-summary').innerHTML = visible.length
      ? `当前显示 <b>${visible.length}</b> 个回路 · <b>${totalLights}</b> 灯位 · 网关 <b>${gateways.size}</b> 个 · DALI 地址 <b>${addresses.length}${capacity ? `/${capacity}` : ''}</b> · 控制 <b>${boundControls}/${allControls.length}</b><br><span style="color:#9a9185">模拟回路 / 模拟地址 / 模拟开关绑定，仅用于 Demo 对账</span>`
      : '当前筛选下没有回路；先生成套餐或添加灯具。';
    circuitPanel.querySelector('#circuit-visible').checked = circuitVisible;
    circuitPanel.querySelector('#circuit-control-links').checked = controlLinksVisible;
    circuitPanel.querySelectorAll('[data-circuit-layer]').forEach(b => b.classList.toggle('on', b.dataset.circuitLayer === circuitLayer));
    const sceneHost = circuitPanel.querySelector('#circuit-scenes');
    if (sceneHost) {
      sceneHost.innerHTML = DEMO_SCENES.length
        ? `<div class="circuit-subtitle">场景试运行</div><div class="circuit-scenes">${DEMO_SCENES.map(s => `<button data-scene-id="${escapeHtml(s.id)}" title="${escapeHtml(s.description || '')}">${escapeHtml(s.name)}</button>`).join('')}</div><div class="circuit-scene-note">场景只切换模拟回路通断与亮度意向，不代表现场调光验收。</div>`
        : '<div class="circuit-scene-note">当前没有场景数据。</div>';
      sceneHost.querySelectorAll('[data-scene-id]').forEach(b => b.onclick = () => applyLightingScene(b.dataset.sceneId));
    }
    if (!visible.length) {
      host.innerHTML = '<div class="circuit-empty">当前没有可显示的回路。<br>点击上方「智能布点 → 一键套餐」生成照明设备后再查看。</div>';
      return;
    }
    host.innerHTML = visible.map(g => {
      const on = circuitPowerOn(g.circuitId);
      const color = on ? circuitColor(g.circuitId) : '#b9b3a9';
      const range = g.daliStart != null && g.daliEnd != null ? `${g.daliStart}–${g.daliEnd}` : '—';
      const primary = (g.controls || [])[0];
      const ctrlText = primary
        ? `开关：${primary.ruleCode}${primary.buttonLabel ? ` / ${primary.buttonLabel}` : ''}`
        : '开关：未绑定';
      return `<div class="circuit-row${circuitSelected === g.circuitId ? ' on' : ''}" data-circuit-id="${escapeHtml(g.circuitId)}">
        <span class="circuit-chip" style="background:${color}"></span>
        <span class="circuit-main"><b>${escapeHtml(g.circuitId)}</b><span>${escapeHtml(g.spaceName)} · ${escapeHtml(g.layerLabel)}</span><em>${g.lights.length}灯 · ${escapeHtml(g.gatewayId)} · ${range} · ${g.driverQty ?? '—'}驱动<br>${escapeHtml(ctrlText)}</em></span>
        <button class="circuit-power" data-circuit-power="${escapeHtml(g.circuitId)}" title="开/关该回路">${on ? '关' : '开'}</button>
      </div>`;
    }).join('');
    host.querySelectorAll('[data-circuit-id]').forEach(b => {
      b.onclick = (e) => {
        if (e.target.closest('[data-circuit-power]')) return;
        const id = b.dataset.circuitId;
        circuitSelected = circuitSelected === id ? null : id;
        circuitVisible = true;
        refreshCircuitPanel();
        renderCircuitLines();
      };
    });
    host.querySelectorAll('[data-circuit-power]').forEach(b => {
      b.onclick = (e) => {
        e.stopPropagation();
        toggleCircuitPower([b.dataset.circuitPower]);
      };
    });
  }

  function renderCircuitLines() {
    const g = document.querySelector('#gCircuits');
    if (!g) return;
    if (!(rightTab === 'circuit' && circuitVisible)) {
      g.innerHTML = '';
      return;
    }
    const groups = circuitGroups().filter(x => circuitLayer === 'all' || x.layer === circuitLayer);
    const { byCircuit } = controlBindings();
    const parts = [];
    for (const grp of groups) {
      const pts = grp.lights
        .filter(f => f.smart?.status !== 'pending')
        .map(f => [f.cx, f.cy]);
      if (!pts.length) continue;
      const on = circuitPowerOn(grp.circuitId);
      const color = on ? circuitColor(grp.circuitId) : '#b9b3a9';
      const selected = circuitSelected === grp.circuitId;
      const geom = circuitGeometry(pts);
      if (geom.x0 !== geom.x1 || geom.y0 !== geom.y1) {
        parts.push(`<path d="${geom.trunk}" fill="none" stroke="${color}" stroke-width="${selected ? 2.4 : 1.2}" stroke-opacity="${selected ? (on ? .95 : .5) : (on ? .42 : .13)}" stroke-dasharray="7 5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`);
        if (geom.drops) {
          parts.push(`<path d="${geom.drops}" fill="none" stroke="${color}" stroke-width="${selected ? 1.2 : .9}" stroke-opacity="${selected ? (on ? .55 : .28) : (on ? .22 : .08)}" stroke-dasharray="4 5" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`);
        }
      }
      const c = geom.hub;
      parts.push(`<circle cx="${c[0]}" cy="${c[1]}" r="${selected ? 95 : 42}" fill="${color}" fill-opacity="${selected ? (on ? .95 : .45) : (on ? .72 : .3)}" stroke="#ffffff" stroke-width="1.5" vector-effect="non-scaling-stroke"/>`);
      if (selected && controlLinksVisible) {
        const primary = byCircuit.get(grp.circuitId);
        if (primary) {
          const p = primary.device;
          // 控制拓扑：主开关 -> 回路汇聚点 -> 各灯具。这里表达的是演示级
          // 控制关系，不代表真实穿管/桥架路径。
          parts.push(`<path d="${controlPath([p.cx, p.cy], geom)}L${c[0]} ${c[1]}" fill="none" stroke="#388157" stroke-width="2.2" stroke-opacity=".95" stroke-dasharray="3 4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`);
          for (const light of grp.lights.filter(f => f.smart?.status !== 'pending')) {
            parts.push(`<path d="M${c[0]} ${c[1]}L${light.cx} ${light.cy}" fill="none" stroke="#388157" stroke-width="1.2" stroke-opacity=".48" stroke-dasharray="2 5" vector-effect="non-scaling-stroke"/>`);
          }
          parts.push(`<circle cx="${p.cx}" cy="${p.cy}" r="90" fill="none" stroke="#388157" stroke-width="3" vector-effect="non-scaling-stroke"/>`);
          parts.push(`<circle cx="${c[0]}" cy="${c[1]}" r="118" fill="none" stroke="#388157" stroke-width="2.4" stroke-dasharray="8 5" vector-effect="non-scaling-stroke"/>`);
        }
      }
      if (selected) {
        const range = grp.daliStart != null && grp.daliEnd != null ? `${grp.daliStart}–${grp.daliEnd}` : '—';
        parts.push(`<g transform="translate(${c[0]} ${c[1]})">
          <rect x="-1300" y="-700" width="2600" height="520" rx="52" fill="#ffffff" fill-opacity=".96" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke"/>
          <text x="0" y="-540" font-size="260" text-anchor="middle" fill="${color}" font-weight="700">${escapeHtml(grp.circuitId)}</text>
          <text x="0" y="-330" font-size="170" text-anchor="middle" fill="#6b6257">${grp.lights.length}灯 · ${escapeHtml(grp.gatewayId)} · DALI ${range} · ${on ? '开' : '关'}</text>
          <text x="0" y="-125" font-size="125" text-anchor="middle" fill="#388157">${byCircuit.has(grp.circuitId) ? '已绑定主开关' : '未绑定主开关'}</text>
        </g>`);
      }
    }
    g.innerHTML = parts.join('');
  }
  window.__renderCircuitLines = renderCircuitLines;
  window.__refreshCircuitPanel = refreshCircuitPanel;

  window.__renderLightObstacles = function () {
    const g = document.querySelector('#gLightObs');
    if (!g) return;
    if (ui.layers?.obs === false) {
      g.innerHTML = '';
      return;
    }
    const obstacles = lightingObstacles();
    const selectedLight = ui.sel?.kind === 'furn' ? getF(ui.sel.id) : null;
    const collide = selectedLight && isLightingDevice(selectedLight)
      ? new Set(lightingCollisionsFor(selectedLight).map(c => c.obstacle.id))
      : new Set(lightingP0Stats().collisions.map(c => c.obstacle.id));
    const color = { ac: '#6f8fa8', curtain_box: '#7a9fc4', access_panel: '#c08a55' };
    const hotColor = '#1687f5';
    g.innerHTML = obstacles.map(o => {
      const [x0, y0, x1, y1] = o.rect, base = color[o.type] || '#8a8175';
      const hot = collide.has(o.id);
      const col = hot ? hotColor : base;
      const label = o.type === 'ac' ? '空调' : o.type === 'curtain_box' ? '窗帘盒' : '检修口';
      return `<rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${col}" fill-opacity="${hot ? '.055' : '.018'}" stroke="${col}" stroke-opacity="${hot ? '.78' : '.30'}" stroke-width="${hot ? 1.6 : 1}" stroke-dasharray="${hot ? '50 35' : '80 60'}" vector-effect="non-scaling-stroke" pointer-events="none"/>
        <text x="${(x0 + x1) / 2}" y="${(y0 + y1) / 2}" font-size="${hot ? 150 : 120}" text-anchor="middle" fill="${col}" opacity="${hot ? '.9' : '.32'}" pointer-events="none">${label}</text>`;
    }).join('');
  };

  function colorFor(key) {
    const d = DEVICE_BY_KEY[key];
    return CATEGORY_COLORS[d?.category1] || '#e8e2d8';
  }
  function catalogProductForLegacy(key) {
    const item = DEVICES.find(device => device.productId && (device.legacyKey || device.key) === key);
    return item ? { productId: item.productId, sku: item.sku, productName: item.productName, price: item.price, salesUnit: item.salesUnit, legacyKey: item.legacyKey || item.key, dataState: item.dataState } : null;
  }

  function distToSeg(px, py, ax, ay, bx, by) {
    const dx = bx - ax, dy = by - ay;
    const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) || 1)));
    return Math.hypot(px - (ax + dx * t), py - (ay + dy * t));
  }

  /* ---------------- 2D symbols ---------------- */
  function deviceSVG(type, w, d, color) {
    const key = type.slice(4);
    const def = DEVICE_BY_KEY[key] || { visual: 'point', category1: '灯光' };
    const v = def.visual;
    const x = -w / 2, y = -d / 2, m = Math.min(w, d);
    const stroke = '#4a443c';
    const fill = color || colorFor(key);
    const S = `stroke="${stroke}" stroke-width="1.2" vector-effect="non-scaling-stroke"`;
    const dot = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" ${S}/><circle cx="${cx}" cy="${cy}" r="${r * .45}" fill="#ffffff" ${S}/>`;
    // 灯带采用细线示意：外轮廓按真实深度，内部高光限制在 1–3px，避免不同缩放下变成粗条。
    if (v === 'line') return `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(d, 20)}" rx="${Math.max(d, 20) / 2}" fill="${fill}" fill-opacity=".72" ${S}/><line x1="${x + 12}" y1="0" x2="${x + w - 12}" y2="0" stroke="#ffffff" stroke-width="${Math.max(1, Math.min(2, d * .035))}" vector-effect="non-scaling-stroke"/>`;
    if (v === 'track') {
      let s = `<rect x="${x}" y="${y}" width="${w}" height="${Math.max(d, 24)}" rx="10" fill="${fill}" fill-opacity=".45" ${S}/>`;
      for (let k = 1; k <= 3; k++) s += dot(x + (w * k) / 4, 0, Math.max(10, m * .12));
      return s;
    }
    if (v === 'rect') return `<rect x="${x + 4}" y="${y + 4}" width="${w - 8}" height="${d - 8}" rx="8" fill="none" stroke="${fill}" stroke-width="2.4" vector-effect="non-scaling-stroke"/>`;
    if (v === 'l') return `<path d="M${x + 4} ${y + 4}H${x + 4}V${y + d - 4}H${x + w - 4}" fill="none" stroke="${fill}" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`;
    if (v === 'u') return `<path d="M${x + 4} ${y + 4}V${y + d - 4}H${x + w - 4}V${y + 4}" fill="none" stroke="${fill}" stroke-width="2.4" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`;
    if (v === 'array') {
      let s = '';
      for (const k of [-1, 0, 1]) s += dot((k * w) / 3.2, 0, Math.max(9, m * .13));
      return s;
    }
    if (v === 'pointRect') {
      let s = '';
      for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) s += dot((sx * w) / 2, (sz * d) / 2, Math.max(9, m * .12));
      return s;
    }
    if (def.category1 === '控制') return `<rect x="${x + w * .12}" y="${y + d * .12}" width="${w * .76}" height="${d * .76}" rx="12" fill="${fill}" ${S}/><rect x="${x + w * .28}" y="${y + d * .3}" width="${w * .44}" height="${d * .4}" rx="6" fill="#2f3a44" ${S}/>`;
    if (def.category1 === '环境') return `<circle r="${m * .42}" fill="${fill}" ${S}/><circle r="${m * .24}" fill="none" stroke="#ffffff" ${S}/><circle r="${m * .09}" fill="#ffffff"/>`;
    if (def.category1 === '安防监控') return `<circle r="${m * .4}" fill="${fill}" ${S}/><circle cx="${m * .12}" cy="${m * .08}" r="${m * .16}" fill="#2f3a44" ${S}/>`;
    if (def.category1 === '音乐') return `<circle r="${m * .42}" fill="${fill}" ${S}/><circle r="${m * .28}" fill="none" stroke="#ffffff" ${S}/><circle r="${m * .1}" fill="#ffffff"/>`;
    if (def.category1 === '暖通') return `<rect x="${x + 4}" y="${y + d * .28}" width="${w - 8}" height="${d * .44}" rx="12" fill="${fill}" ${S}/><line x1="${x + 12}" y1="${d * .5}" x2="${x + w - 12}" y2="${d * .5}" stroke="#ffffff" stroke-width="4" vector-effect="non-scaling-stroke"/>`;
    return dot(0, 0, Math.max(12, m * .34));
  }

  const originalFurnSVG = window.furnSVG;
  function smartFurnSVG(type, w, d, color) {
    if (typeof type === 'string' && type.startsWith('dev:')) return deviceSVG(type, w, d, color);
    return originalFurnSVG(type, w, d, color);
  }
  window.furnSVG = smartFurnSVG;

  /* ---------------- device library ---------------- */
  function productLabel(d) {
    if (d.productName) return d.productName;
    if (!d.productFamily || d.productFamily === d.category2) return d.category2;
    if (d.routeShape === 'rectangle') return `${d.productFamily} · 口字`;
    if (d.routeShape === 'L') return `${d.productFamily} · L 型`;
    if (d.routeShape === 'U') return `${d.productFamily} · U 型`;
    if (d.routeShape === 'straight') return `${d.productFamily} · ${d.mountSurface === 'wall' ? '墙面' : '直线'}`;
    if (d.layoutForm === 'line') return `${d.productFamily} · 一字`;
    if (d.layoutForm === 'rectangle') return `${d.productFamily} · 口字`;
    return d.productFamily;
  }

  let SMART_LIB = [];
  function rebuildSmartCatalog() {
    SMART_LIB = [];
    for (const cat of CATEGORY_ORDER) {
      const items = DEVICES.filter(d => d.category1 === cat).map(d => [
        'dev:' + d.key, productLabel(d), d.size.width, d.size.depth, colorFor(d.key),
      ]);
      if (items.length) SMART_LIB.push({ cat: '智能·' + cat, items });
    }
  }
  rebuildSmartCatalog();

  const libHost = document.querySelector('#lib');
  const libTabs = document.createElement('div');
  libTabs.className = 'lib-tabs';
  libTabs.innerHTML = '<button class="on" data-lib="soft">软装家具</button><button data-lib="smart">智能设备</button>';
  libHost.parentNode.insertBefore(libTabs, libHost);

  function buildSmartLib() {
    libHost.innerHTML = SMART_LIB.map((c, ci) => `<h4>${escapeHtml(c.cat)}</h4><div class="lib-grid">${c.items.map((it, ii) => {
      const [type, name, w, d, col] = it;
      const pad = Math.max(w, d) * .08;
      const legacy = DEVICE_BY_KEY[String(type).slice(4)];
      return `<div class="item" data-skey="${ci}:${ii}" title="点击添加，或拖到平面图中的指定位置｜产品族：${escapeHtml(legacy?.productFamily || name)}｜旧分类：${escapeHtml(legacy?.category2 || name)}"><svg viewBox="${-w / 2 - pad} ${-d / 2 - pad} ${w + 2 * pad} ${d + 2 * pad}">${deviceSVG(type, w, d, col)}</svg><b>${escapeHtml(name)}</b><small>${w}×${d}</small></div>`;
    }).join('')}</div>`).join('') + '<div class="hint">灯带 / 轨道拖入时为示意尺寸，点「一键布点」后按空间实测调整。</div>';
    libHost.querySelectorAll('.item').forEach(el => el.addEventListener('pointerdown', e => {
      if (e.button) return;
      const [ci, ii] = el.dataset.skey.split(':').map(Number);
      libDrag = { el, id: e.pointerId, sx: e.clientX, sy: e.clientY, it: SMART_LIB[ci].items[ii], ghost: null, skipTap: true };
    }));
    // 轻点 = 加入 1 件产品；拖拽仍由底座 endLibDrag 处理（落点由 __smartHomeDropDevice 接收）。
    libHost.querySelectorAll('.item').forEach(el => el.addEventListener('click', e => {
      const [ci, ii] = el.dataset.skey.split(':').map(Number);
      const key = String(SMART_LIB[ci].items[ii][0]).slice(4);
      addDevice(key);
      closeDrawers();
    }));
  }

  function setLibTab(tab) {
    libTabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.lib === tab));
    if (tab === 'smart') buildSmartLib();
    else buildLib();
  }
  libTabs.querySelectorAll('button').forEach(b => b.onclick = () => setLibTab(b.dataset.lib));
  setLibTab('soft');
  fetch('/api/admin/design-catalog').then(async response => response.ok ? response.json() : null).then(payload => {
    if (!payload?.devices?.length) return;
    DEVICES = payload.devices;
    for (const item of payload.devices) DEVICE_BY_KEY[item.key] = item;
    rebuildSmartCatalog();
    if (libTabs.querySelector('[data-lib="smart"]')?.classList.contains('on')) buildSmartLib();
    console.info(`[smart-home] loaded local product catalog: ${payload.mappedCount}/${payload.devices.length} mapped, ${payload.productCount} placeable products`);
  }).catch(error => console.warn('[smart-home] local product catalog unavailable; using bundled fallback', error));

  /* ---------------- device panel ---------------- */
  const style = document.createElement('style');
  style.textContent = `
.lib-tabs{display:flex;gap:4px;padding:8px 10px 0;border-bottom:1px solid #d8cdbd;background:#f1e9dc;position:sticky;top:0;z-index:2}
.lib-tabs button{flex:1;height:30px;border:1px solid #d8cdbd;border-bottom:0;background:#f7f1e7;color:#7d7468;border-radius:8px 8px 0 0;font-size:11px;cursor:pointer}
.lib-tabs button.on{background:#fff;color:#a0642b;font-weight:700}
.right-tabs{display:flex;gap:4px;padding:8px 10px 0;border-bottom:1px solid #d8cdbd;background:#f1e9dc;flex:0 0 auto}
.right-tabs button{flex:1;height:30px;border:1px solid #d8cdbd;border-bottom:0;background:#f7f1e7;color:#7d7468;border-radius:8px 8px 0 0;font-size:11px;cursor:pointer}
.right-tabs button.on{background:#fff;color:#a0642b;font-weight:700}
aside.right{display:flex;flex-direction:column;overflow:hidden}
aside.right>#panel{flex:1;min-height:0;overflow:auto}
#smart-panel{display:none;flex:1;min-height:0;overflow:auto;background:#fbf8f2;color:#3d3a34;font:12px/1.45 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;flex-direction:column}
#smart-panel,#smart-panel *{-webkit-user-select:text;user-select:text}
#smart-panel button{cursor:pointer}
#smart-panel .sh-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#f1e9dc;border-bottom:1px solid #d8cdbd;font-weight:700}
#smart-panel .sh-head small{font-weight:400;color:#8a8175;margin-left:auto}
#smart-panel .sh-body{padding:10px 12px;overflow:auto;flex:1;min-height:0}
#smart-panel .sh-lighting{margin:6px 0 8px;padding:7px 8px;border:1px solid #e7dccb;border-radius:7px;background:#fffdf8}
#smart-panel .sh-light-head{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#6f665a}
#smart-panel .sh-light-head b{color:#3d3a34;font-size:12px}
#smart-panel .sh-light-groups{display:flex;flex-wrap:wrap;gap:4px;margin-top:5px}
#smart-panel .sh-light-group{font-size:10px;color:#6b5c47;background:#f4eadb;border:1px solid #e5d5bf;border-radius:5px;padding:2px 5px}
#smart-panel .sh-light-check{margin-top:5px;font-size:10px;color:#8a8175}
#smart-panel .sh-light-note{margin-top:3px;font-size:10px;color:#9a9185;line-height:1.35}
  #smart-panel .sh-circuit-list{margin-top:6px;padding:5px 7px;border:1px solid #e4d9c8;border-radius:6px;background:#fbf7f0;font-size:10px;color:#6b6257;max-height:190px;overflow:auto}
  #smart-panel .sh-circuit-list summary{cursor:pointer;color:#a0642b;font-weight:600}
  #smart-panel .sh-circuit-row{display:flex;gap:4px;flex-wrap:wrap;padding:3px 0;border-bottom:1px dashed #eee3d4;line-height:1.35}
  #smart-panel .sh-circuit-row:last-child{border-bottom:0}
  #smart-panel .sh-circuit-row b{font-weight:600;color:#4a443c}
  #smart-panel .sh-circuit-row span{color:#8a8175}
  #smart-panel .sh-circuit-row em{margin-left:auto;font-style:normal;color:#9a9185}
#smart-panel .sh-empty{color:#9a9185;font-size:11px;padding:6px 0}
#smart-panel .sh-row{display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid #eee6da}
#smart-panel .sh-row span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#smart-panel .sh-row small{color:#9a9185;font-size:10px}
#smart-panel .sh-actions{display:flex;gap:6px;margin-top:10px}
#smart-panel .sh-actions button{flex:1;height:30px;border:1px solid #c9bda9;background:#fff;border-radius:7px;cursor:pointer;font-size:11px}
#smart-panel .sh-actions button.primary{background:#b9823e;border-color:#b9823e;color:#fff;font-weight:700}
#smart-panel .sh-status{margin-top:8px;color:#8a8175;font-size:10.5px;line-height:1.5}
#smart-panel .sh-rule{position:sticky;top:0;z-index:3;margin:0 0 8px;padding:8px;background:#fff;border:1px solid #e4d9c8;border-radius:7px;font-size:10.5px;line-height:1.55;box-shadow:0 4px 10px rgba(70,55,35,.10);max-height:42vh;display:flex;flex-direction:column;overflow:hidden}
#smart-panel .sh-rule b{color:#a0642b}
#smart-panel .sh-rule ol{margin:5px 0 0 16px;padding:0}
#smart-panel .sh-rule li{margin:2px 0}
#smart-panel .sh-rule-head{display:flex;align-items:flex-start;gap:6px;justify-content:space-between;flex:0 0 auto}
#smart-panel .sh-rule-head>div{min-width:0}
#smart-panel .sh-rule-head button{flex:0 0 auto;border:1px solid #d8cdbd;background:#f7f1e7;border-radius:5px;padding:2px 6px;color:#7a6b58;font:inherit;font-size:10px;cursor:pointer}
#smart-panel .sh-rule-body{overflow:auto;min-height:0;max-height:180px;padding-top:3px}
#smart-panel .sh-rule.expanded .sh-rule-body{max-height:38vh}
  #smart-panel .sh-control-bind{margin:5px 0;padding:5px 7px;border-radius:6px;background:#fff7ea;border:1px solid #f0dfc4;color:#7a6b58;font-size:10px;line-height:1.5}
  #smart-panel .sh-control-bind b{color:#a0642b}
#smart-panel .sh-filters{display:flex;gap:5px;margin:5px 0 7px}
#smart-panel .sh-filters button{flex:1;height:26px;border:1px solid #d8cdbd;background:#fff;border-radius:6px;color:#7d7468;font:inherit;font-size:10.5px;cursor:pointer}
#smart-panel .sh-filters button.on{background:#fff2df;border-color:#d9a05b;color:#a05a16;font-weight:700}
#smart-panel .sh-pending-title{display:flex;justify-content:space-between;gap:8px;margin:6px 0 4px;color:#a05a16;font-size:10.5px;font-weight:700}
#smart-panel .sh-pending-row{display:flex;align-items:center;gap:7px;width:100%;padding:5px 7px;margin-bottom:4px;border:1px solid #f0dfc4;border-radius:6px;background:#fff8ec;color:#6b5a45;font:inherit;font-size:10.5px;text-align:left;cursor:pointer}
#smart-panel .sh-pending-row:hover{border-color:#d9a05b;background:#fff2df}
#smart-panel .sh-pending-row b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
#smart-panel .sh-pending-row em{font-style:normal;color:#a05a16;font-weight:700}
#smart-panel .sh-space{margin-top:8px;border:1px solid #e6dccb;border-radius:8px;background:#fff;overflow:hidden}
#smart-panel .sh-space-head{display:flex;align-items:center;gap:6px;width:100%;padding:7px 9px;border:0;background:#f7f1e7;color:#5b5348;font:inherit;font-size:11.5px;text-align:left;cursor:pointer}
#smart-panel .sh-space-head i{font-style:normal;font-size:9px;color:#a99e8f;transition:transform .15s}
#smart-panel .sh-space.open .sh-space-head i{transform:rotate(90deg)}
#smart-panel .sh-space-head b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
#smart-panel .sh-space-head em{font-style:normal;color:#a0642b;font-weight:700;font-size:10.5px}
#smart-panel .sh-space-body{display:none;padding:2px 9px 6px}
#smart-panel .sh-space.open .sh-space-body{display:block}
#smart-panel .sh-dev{display:flex;align-items:center;gap:6px;width:100%;padding:4px 0;border:0;border-bottom:1px solid #f0e9de;background:none;color:#4a443c;font:inherit;text-align:left;cursor:pointer}
#smart-panel .sh-dev:last-child{border-bottom:0}
#smart-panel .sh-dev:hover{color:#a0642b}
#smart-panel .sh-dev span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#smart-panel .sh-dev small{color:#9a9185;font-size:10px}
#smart-panel .sh-dev code{font-size:9.5px;color:#a99e8f}
#smart-panel .sh-balance{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0 3px}
#smart-panel .sh-balance span{padding:2px 6px;border-radius:10px;background:#f2eee7;color:#6e655a;font-size:10px}
#smart-panel .sh-balance .pending{background:#fff0df;color:#a0642b}
#smart-panel .sh-balance .placed{background:#e8f4ec;color:#35734d}
#smart-panel .sh-balance .fallback{background:#fff7d9;color:#8b6b16}
#smart-panel .sh-rule-actions{display:flex;gap:5px;margin-top:7px}
#smart-panel .sh-rule-actions button{border:1px solid #d8cdbd;background:#fff;border-radius:6px;padding:4px 7px;color:#6b6257;cursor:pointer;font:inherit;font-size:10px}
#smart-panel .sh-rule-actions button.on{background:#e8f4ec;color:#35734d;border-color:#9ac6aa}
#smart-panel .sh-pending{color:#a0642b;font-weight:700}
#smart-panel .sh-legend{display:none;margin:4px 0 8px;padding:7px 8px;border-radius:6px;background:#fff7ea;color:#8a6a3f;font-size:10.5px;line-height:1.55;border:1px solid #f0dfc4}
#zone-panel{display:none;flex:1;min-height:0;overflow:auto;background:#fbf8f2;color:#3d3a34;font:12px/1.45 system-ui,"PingFang SC","Microsoft YaHei",sans-serif;flex-direction:column}
#zone-panel .zone-head{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#f1e9dc;border-bottom:1px solid #d8cdbd;font-weight:700}
#zone-panel .zone-head button{margin-left:auto;height:28px;border:1px solid #b9823e;background:#b9823e;color:#fff;border-radius:6px;font:inherit;font-size:11px;font-weight:700;cursor:pointer;padding:0 9px}
#zone-panel .zone-body{padding:10px 12px;overflow:auto;flex:1;min-height:0}
#zone-panel .zone-tip{color:#8a8175;font-size:10.5px;line-height:1.6;margin-bottom:10px;padding:7px 8px;border-radius:6px;background:#fff7ea;border:1px solid #f0dfc4}
#zone-panel .zone-empty{color:#9a9185;font-size:11px;padding:8px 0}
#zone-panel .zone-row{display:flex;align-items:center;gap:6px;padding:7px 0;border-bottom:1px solid #eee6da}
#zone-panel .zone-row.on{color:#a0642b}
#zone-panel .zone-row b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer}
#zone-panel .zone-row small{color:#9a9185;font-size:10px;white-space:nowrap}
#zone-panel .zone-row select{max-width:104px;height:24px;border:1px solid #d8cdbd;border-radius:5px;background:#fff;color:#5b5348;font:inherit;font-size:10px}
#zone-panel .zone-row button{border:1px solid #e1c8c0;background:#fff;color:#b5653a;border-radius:5px;height:24px;padding:0 6px;font:inherit;font-size:10px;cursor:pointer}
#zone-modal{position:fixed;inset:0;z-index:60;display:none;align-items:center;justify-content:center;background:rgba(35,30,24,.28)}
#zone-modal.show{display:flex}
#zone-modal .zone-card{width:340px;max-width:calc(100vw - 32px);background:#fffdf9;border:1px solid #d8cdbd;border-radius:14px;box-shadow:0 20px 50px rgba(60,45,30,.24);padding:18px}
#zone-modal h3{margin:0 0 6px;font-size:15px;color:#2b2824}
#zone-modal p{margin:0 0 12px;color:#8a8175;font-size:11px}
#zone-modal label{display:block;font-size:11px;color:#6b6257;margin:8px 0 4px}
#zone-modal input,#zone-modal select{width:100%;height:32px;border:1px solid #d8cdbd;border-radius:6px;padding:0 8px;font:inherit;color:#3d3a34;background:#fff}
#zone-modal .zone-actions{display:flex;gap:8px;margin-top:16px}
#zone-modal .zone-actions button{flex:1;height:32px;border:1px solid #d8cdbd;background:#fff;border-radius:7px;font:inherit;cursor:pointer}
#zone-modal .zone-actions button.primary{background:#b9823e;border-color:#b9823e;color:#fff;font-weight:700}
body.zone-drawing #plan{cursor:crosshair}
#circuit-panel{display:none;flex-direction:column;min-height:0;overflow:hidden;background:#fffdf8}
#circuit-panel .circuit-head{padding:10px 11px 6px;font-size:13px;font-weight:700;color:#3d3a34;display:flex;align-items:baseline;gap:6px}
#circuit-panel .circuit-head small{font-size:10px;font-weight:400;color:#9a9185}
#circuit-panel .circuit-body{padding:0 10px 10px;overflow:auto;min-height:0}
#circuit-panel .circuit-toggle{display:flex;align-items:center;gap:6px;padding:7px 8px;margin-bottom:7px;border:1px solid #e7dccb;border-radius:7px;background:#fffdf8;font-size:11px;color:#5b5348;cursor:pointer}
#circuit-panel .circuit-toggle input{accent-color:#b9823e}
#circuit-panel .circuit-filters{display:flex;gap:4px;margin-bottom:7px}
#circuit-panel .circuit-filters button{flex:1;height:25px;border:1px solid #d8cdbd;background:#f7f1e7;color:#7d7468;border-radius:5px;font:inherit;font-size:10px;cursor:pointer}
#circuit-panel .circuit-filters button.on{background:#fff;color:#a0642b;border-color:#c9a878;font-weight:700}
#circuit-panel .circuit-summary{padding:6px 7px;margin-bottom:6px;border-radius:6px;background:#fff7ea;border:1px solid #f0dfc4;color:#7a6b58;font-size:10px;line-height:1.5}
#circuit-panel .circuit-subtitle{font-size:10px;color:#6b6257;font-weight:700;margin:7px 0 4px}
#circuit-panel .circuit-scenes{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:3px}
#circuit-panel .circuit-scenes button{border:1px solid #d8cdbd;background:#fff;color:#7a6b58;border-radius:5px;height:24px;padding:0 8px;font:inherit;font-size:9px;cursor:pointer}
#circuit-panel .circuit-scenes button:hover{color:#a0642b;border-color:#c9a878;background:#fff7ea}
#circuit-panel .circuit-scene-note{color:#9a9185;font-size:9px;line-height:1.4;margin-bottom:6px}
#circuit-panel .circuit-tip{color:#9a9185;font-size:10px;line-height:1.45;margin-bottom:6px}
#circuit-panel .circuit-list{border-top:1px solid #eee6da}
#circuit-panel .circuit-row{display:flex;align-items:flex-start;gap:5px;width:100%;padding:6px 2px;border:0;border-bottom:1px solid #f0e9de;background:none;color:#4a443c;font:inherit;font-size:10px;text-align:left;cursor:pointer}
#circuit-panel .circuit-row:hover{color:#a0642b}
#circuit-panel .circuit-row.on{background:#fbf3e6;color:#a0642b}
#circuit-panel .circuit-chip{flex:0 0 auto;width:8px;height:8px;border-radius:50%;margin-top:3px;box-shadow:0 0 0 1px rgba(0,0,0,.08)}
#circuit-panel .circuit-main{flex:1;min-width:0}
#circuit-panel .circuit-main b{display:block;font-size:10.5px;color:inherit}
#circuit-panel .circuit-main span{display:block;color:#8a8175;font-size:9.5px;line-height:1.35;margin-top:1px}
#circuit-panel .circuit-main em{display:block;color:#9a9185;font-style:normal;font-size:9px;line-height:1.35;margin-top:1px}
  #circuit-panel .circuit-power{flex:0 0 auto;border:1px solid #d8cdbd;background:#fff;color:#7a6b58;border-radius:5px;height:22px;padding:0 6px;font:inherit;font-size:9px;cursor:pointer}
  #circuit-panel .circuit-power:hover{color:#a0642b;border-color:#c9a878}
#circuit-panel .circuit-empty{color:#9a9185;font-size:11px;padding:12px 0;line-height:1.5}
  #plan .furn[data-power="off"]{opacity:.24}
`;
  document.head.appendChild(style);

  /* Admin UI V1.0 主题覆盖：智能布点 / 功能分区 / 回路面板统一到后台视觉语言 */
  const adminStyle = document.createElement('style');
  adminStyle.textContent = `
.lib-tabs,.right-tabs{padding:0 10px;gap:2px;background:var(--surface);border-bottom:1px solid var(--line)}
.lib-tabs button,.right-tabs button{
  height:36px;border:0;border-bottom:2px solid transparent;border-radius:0;background:transparent;
  color:var(--text-body);font-size:12px;
}
.lib-tabs button:hover,.right-tabs button:hover{background:var(--surface-hover);color:var(--accent)}
.lib-tabs button.on,.right-tabs button.on{
  background:transparent;color:var(--accent);border-bottom-color:var(--accent);font-weight:600;
}

#smart-panel,#zone-panel{
  background:var(--surface);color:var(--text-body);
  font:12px/1.55 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;
}
#smart-panel .sh-head,#zone-panel .zone-head{
  padding:12px 14px;background:var(--surface);border-bottom:1px solid var(--line);
  color:var(--text-strong);font-size:13px;font-weight:600;
}
#smart-panel .sh-head small{color:var(--muted);font-size:11px;font-weight:400}
#smart-panel .sh-body,#zone-panel .zone-body{padding:12px 14px}

#smart-panel .sh-lighting{
  margin:8px 0 10px;padding:8px 10px;border:1px solid var(--line);border-radius:var(--radius);
  background:var(--surface-subtle);
}
#smart-panel .sh-light-head{font-size:11px;color:var(--text-body)}
#smart-panel .sh-light-head b{color:var(--text-strong);font-size:12px}
#smart-panel .sh-light-group{
  font-size:10px;color:var(--accent);background:var(--accent-soft);
  border:1px solid #d8ecff;border-radius:var(--radius-sm);padding:2px 6px;
}
#smart-panel .sh-light-check{color:var(--muted);font-size:10px}
#smart-panel .sh-light-note{color:var(--faint);font-size:10px}

#smart-panel .sh-circuit-list{
  margin-top:6px;padding:6px 8px;border:1px solid var(--line);border-radius:var(--radius);
  background:var(--surface-subtle);color:var(--text-body);font-size:10px;
}
#smart-panel .sh-circuit-list summary{color:var(--accent)}
#smart-panel .sh-circuit-row{border-bottom:1px dashed var(--line-soft)}
#smart-panel .sh-circuit-row b{color:var(--text-strong)}
#smart-panel .sh-circuit-row span{color:var(--text-body)}
#smart-panel .sh-circuit-row em{color:var(--muted)}

#smart-panel .sh-empty{color:var(--faint);font-size:11px}
#smart-panel .sh-row{border-bottom:1px solid var(--line-soft)}
#smart-panel .sh-row small{color:var(--muted);font-size:10px}
#smart-panel .sh-actions{gap:8px;margin-top:12px}
#smart-panel .sh-actions button{
  height:32px;border:1px solid var(--line);background:var(--surface);border-radius:var(--radius);
  color:var(--text-body);font-size:12px;
}
#smart-panel .sh-actions button:hover{border-color:var(--accent);color:var(--accent);background:var(--surface-hover)}
#smart-panel .sh-actions button.primary{
  background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600;
}
#smart-panel .sh-actions button.primary:hover{background:var(--accent-hover);border-color:var(--accent-hover);color:#fff}
#smart-panel .sh-status{color:var(--muted);font-size:10.5px}

#smart-panel .sh-rule{
  margin:0 0 10px;padding:10px;background:var(--surface);border:1px solid var(--line);
  border-radius:var(--radius);box-shadow:var(--shadow-card);font-size:10.5px;color:var(--text-body);
}
#smart-panel .sh-rule b{color:var(--accent)}
#smart-panel .sh-rule-head button{
  border:1px solid var(--line);background:var(--surface-subtle);border-radius:var(--radius-sm);
  color:var(--text-body);font-size:10px;
}
#smart-panel .sh-rule-head button:hover{border-color:var(--accent);color:var(--accent)}
#smart-panel .sh-control-bind{
  margin:6px 0;padding:6px 8px;border-radius:var(--radius-sm);
  background:var(--accent-soft-2);border:1px solid #d8ecff;color:var(--text-body);
}
#smart-panel .sh-control-bind b{color:var(--accent)}

#smart-panel .sh-filters{gap:6px;margin:8px 0}
#smart-panel .sh-filters button{
  height:28px;border:1px solid var(--line);background:var(--surface);border-radius:var(--radius-sm);
  color:var(--text-body);font-size:11px;
}
#smart-panel .sh-filters button.on{
  background:var(--accent-soft);border-color:#b8dbfb;color:var(--accent);font-weight:600;
}
#smart-panel .sh-pending-title{color:var(--warning);font-size:11px}
#smart-panel .sh-pending-row{
  padding:7px 8px;border:1px solid #f2dfbb;border-radius:var(--radius-sm);
  background:var(--warning-bg);color:#6b5a45;font-size:11px;
}
#smart-panel .sh-pending-row:hover{border-color:#d9a05b;background:#ffefd1}
#smart-panel .sh-pending-row em{color:var(--warning)}

#smart-panel .sh-space{margin-top:10px;border:1px solid var(--line);border-radius:var(--radius);background:var(--surface)}
#smart-panel .sh-space-head{
  padding:8px 10px;background:var(--surface-subtle);color:var(--text-strong);font-size:12px;
}
#smart-panel .sh-space-head i{color:var(--faint)}
#smart-panel .sh-space-head em{color:var(--accent);font-size:10.5px}
#smart-panel .sh-space-body{padding:4px 10px 8px}
#smart-panel .sh-dev{border-bottom:1px solid var(--line-soft);color:var(--text-body);font-size:11.5px}
#smart-panel .sh-dev:hover{color:var(--accent)}
#smart-panel .sh-dev small{color:var(--muted)}
#smart-panel .sh-dev code{color:var(--faint)}

#smart-panel .sh-balance span{padding:3px 8px;border-radius:999px;background:var(--surface-subtle);color:var(--text-body);font-size:10px}
#smart-panel .sh-balance .pending{background:var(--warning-bg);color:var(--warning)}
#smart-panel .sh-balance .placed{background:var(--success-bg);color:var(--success)}
#smart-panel .sh-balance .fallback{background:#fff7d9;color:#8b6b16}
#smart-panel .sh-rule-actions button{
  border:1px solid var(--line);background:var(--surface);border-radius:var(--radius-sm);
  color:var(--text-body);font-size:10px;
}
#smart-panel .sh-rule-actions button.on{background:var(--accent-soft);color:var(--accent);border-color:#b8dbfb}
#smart-panel .sh-pending{color:var(--warning)}
#smart-panel .sh-legend{
  background:var(--accent-soft-2);color:var(--text-body);border:1px solid #d8ecff;border-radius:var(--radius-sm);
}

#zone-panel .zone-head button{
  height:30px;border:1px solid var(--accent);background:var(--accent);color:#fff;
  border-radius:var(--radius-sm);font-size:11px;font-weight:600;
}
#zone-panel .zone-head button:hover{background:var(--accent-hover);border-color:var(--accent-hover)}
#zone-panel .zone-tip{
  color:var(--text-body);background:var(--accent-soft-2);border:1px solid #d8ecff;
  border-radius:var(--radius-sm);
}
#zone-panel .zone-empty{color:var(--faint)}
#zone-panel .zone-row{border-bottom:1px solid var(--line-soft)}
#zone-panel .zone-row.on{color:var(--accent)}
#zone-panel .zone-row small{color:var(--muted)}
#zone-panel .zone-row select{
  height:26px;border:1px solid var(--line);border-radius:var(--radius-sm);
  background:var(--surface);color:var(--text-body);font-size:10px;
}
#zone-panel .zone-row button{
  height:26px;border:1px solid var(--line);background:var(--surface);
  color:var(--danger);border-radius:var(--radius-sm);font-size:10px;
}
#zone-panel .zone-row button:hover{background:var(--danger-bg);border-color:#e7bfb6}

#zone-modal{background:rgba(36,52,71,.32)}
#zone-modal .zone-card{
  background:var(--surface);border:1px solid var(--line);border-radius:var(--radius);
  box-shadow:var(--shadow-pop);padding:20px;
}
#zone-modal h3{font-size:16px;color:var(--text-strong)}
#zone-modal p{color:var(--muted);font-size:12px}
#zone-modal label{color:var(--text-body);font-size:12px}
#zone-modal input,#zone-modal select{
  height:34px;border:1px solid var(--line);border-radius:var(--radius-sm);
  color:var(--text-body);background:var(--surface);
}
#zone-modal input:focus,#zone-modal select:focus{outline:2px solid var(--accent-soft);border-color:var(--accent)}
#zone-modal .zone-actions button{
  height:34px;border:1px solid var(--line);background:var(--surface);
  border-radius:var(--radius);color:var(--text-body);
}
#zone-modal .zone-actions button.primary{background:var(--accent);border-color:var(--accent);color:#fff;font-weight:600}

#circuit-panel{background:var(--surface);color:var(--text-body)}
#circuit-panel .circuit-head{color:var(--text-strong);font-size:13px;padding:12px 14px 6px}
#circuit-panel .circuit-head small{color:var(--muted)}
#circuit-panel .circuit-body{padding:0 14px 12px}
#circuit-panel .circuit-toggle{
  border:1px solid var(--line);border-radius:var(--radius-sm);background:var(--surface-subtle);
  color:var(--text-body);font-size:11px;
}
#circuit-panel .circuit-toggle input{accent-color:var(--accent)}
#circuit-panel .circuit-filters button{
  height:28px;border:1px solid var(--line);background:var(--surface);color:var(--text-body);
  border-radius:var(--radius-sm);font-size:10.5px;
}
#circuit-panel .circuit-filters button.on{background:var(--accent-soft);color:var(--accent);border-color:#b8dbfb;font-weight:600}
#circuit-panel .circuit-summary{
  background:var(--accent-soft-2);border:1px solid #d8ecff;border-radius:var(--radius-sm);
  color:var(--text-body);font-size:10px;
}
#circuit-panel .circuit-subtitle{color:var(--text-strong);font-size:10.5px}
#circuit-panel .circuit-scenes button{
  border:1px solid var(--line);background:var(--surface);color:var(--text-body);
  border-radius:var(--radius-sm);font-size:9.5px;
}
#circuit-panel .circuit-scenes button:hover{color:var(--accent);border-color:#b8dbfb;background:var(--accent-soft-2)}
#circuit-panel .circuit-scene-note,#circuit-panel .circuit-tip{color:var(--muted)}
#circuit-panel .circuit-list{border-top:1px solid var(--line-soft)}
#circuit-panel .circuit-row{border-bottom:1px solid var(--line-soft);color:var(--text-body);font-size:10.5px}
#circuit-panel .circuit-row:hover{color:var(--accent)}
#circuit-panel .circuit-row.on{background:var(--accent-soft);color:var(--accent)}
#circuit-panel .circuit-chip{box-shadow:0 0 0 1px rgba(36,52,71,.10)}
#circuit-panel .circuit-main span{color:var(--muted)}
#circuit-panel .circuit-main em{color:var(--faint)}
#circuit-panel .circuit-power{
  border:1px solid var(--line);background:var(--surface);color:var(--text-body);
  border-radius:var(--radius-sm);font-size:9.5px;
}
#circuit-panel .circuit-power:hover{color:var(--accent);border-color:#b8dbfb}
#circuit-panel .circuit-empty{color:var(--faint)}
`;
  document.head.appendChild(adminStyle);

  const rightHost = document.querySelector('aside.right');
  const rightTabs = document.createElement('div');
  rightTabs.className = 'right-tabs';
  rightTabs.innerHTML = '<button class="on" data-rtab="attr">属性</button><button data-rtab="smart">智能布点</button><button data-rtab="zone">功能分区</button><button data-rtab="circuit">回路</button>';
  rightHost.insertBefore(rightTabs, rightHost.firstChild);

  const panel = document.createElement('div');
  panel.id = 'smart-panel';
  panel.innerHTML = `
    <div class="sh-head">智能设备布点 <small id="sh-count">0 件</small></div>
    <div class="sh-body">
      <div id="sh-rule" class="sh-rule" style="display:none"></div>
      <div class="sh-actions">
        <button id="sh-place" class="primary">一键布点</button>
        <button id="sh-package">一键套餐</button>
        <button id="sh-clear">清空设备</button>
      </div>
      <div id="sh-summary" class="sh-balance"></div>
      <div id="sh-lighting" class="sh-lighting"></div>
      <div class="sh-filters">
        <button data-filter="all" class="on">全部设备</button>
        <button data-filter="pending">只看待处理</button>
      </div>
      <div id="sh-pending"></div>
      <div id="sh-legend" class="sh-legend">待处理 = 规则要求保留，但缺少窗、柜、轨道等安装条件或合法候选点；设备不会删除，也不会强行放到房间中心，需人工确认或补充条件。</div>
      <div id="sh-status" class="sh-status"></div>
      <div id="sh-spaces"></div>
    </div>`;
  rightHost.appendChild(panel);
  const propPanel = document.querySelector('#panel');
  let zonePanel = null;

  zonePanel = document.createElement('div');
  zonePanel.id = 'zone-panel';
  zonePanel.innerHTML = `<div class="zone-head">功能分区</div>
    <div class="zone-body"><div class="zone-tip">点击顶部工具栏「功能分区」，在 2D 平面按住鼠标左键拖出矩形，松开后选择空间类型（例如入户门附近标记为玄关）。分区内的设备会按所选空间类型匹配规则。</div><div id="zone-list"></div></div>`;
  rightHost.appendChild(zonePanel);

  const circuitPanel = document.createElement('div');
  circuitPanel.id = 'circuit-panel';
  circuitPanel.innerHTML = `<div class="circuit-head">照明回路 <small id="circuit-count">0 个</small></div>
    <div class="circuit-body">
      <label class="circuit-toggle"><input type="checkbox" id="circuit-visible" checked> 在 2D 户型图上显示回路连线</label>
      <label class="circuit-toggle"><input type="checkbox" id="circuit-control-links" checked> 选中回路时显示开关/面板联动线</label>
      <div class="circuit-filters">
        <button class="on" data-circuit-layer="all">全部</button>
        <button data-circuit-layer="base">基础</button>
        <button data-circuit-layer="task">任务</button>
        <button data-circuit-layer="accent">重点</button>
      </div>
      <div class="circuit-summary" id="circuit-summary">先生成套餐或添加灯具后查看回路。</div>
      <div id="circuit-scenes"></div>
      <div class="circuit-tip">连线只表示“同一回路”的逻辑归属，不代表实际穿管/桥架路径；回路、网关、DALI 地址均为模拟数据。选中回路后点击其开关/情景面板，可在规则卡里“试验开关”。</div>
      <div class="circuit-list" id="circuit-list"></div>
    </div>`;
  rightHost.appendChild(circuitPanel);
  circuitPanel.querySelector('#circuit-visible').onchange = (e) => {
    circuitVisible = e.target.checked;
    renderCircuitLines();
  };
  circuitPanel.querySelector('#circuit-control-links').onchange = (e) => {
    controlLinksVisible = e.target.checked;
    renderCircuitLines();
  };
  circuitPanel.querySelectorAll('[data-circuit-layer]').forEach(b => {
    b.onclick = () => {
      circuitLayer = b.dataset.circuitLayer;
      refreshCircuitPanel();
      renderCircuitLines();
    };
  });

  const zoneModal = document.createElement('div');
  zoneModal.id = 'zone-modal';
  zoneModal.innerHTML = `<div class="zone-card"><h3>功能分区</h3><p>给刚绘制的矩形区域选择空间类型；分区名称默认为类型名。</p>
    <label>空间类型<select id="zone-type">${SPACES.map(s => `<option value="${s.code}">${escapeHtml(s.name)}</option>`).join('')}</select></label>
    <label>分区名称<input id="zone-name" placeholder="例如：入户玄关"></label>
    <div class="zone-actions"><button id="zone-cancel">取消</button><button id="zone-save" class="primary">保存分区</button></div></div>`;
  document.body.appendChild(zoneModal);

  /* ---------------- functional zones ---------------- */
  let selectedZoneId = null;
  const svg = document.querySelector('#plan');
  const NS = 'http://www.w3.org/2000/svg';
  const gZones = document.createElementNS(NS, 'g'); gZones.id = 'gZones';
  const gZoneDraft = document.createElementNS(NS, 'g'); gZoneDraft.id = 'gZoneDraft'; gZoneDraft.style.pointerEvents = 'none';
  const gFurn = document.querySelector('#gFurn');
  svg.insertBefore(gZones, gFurn);
  svg.insertBefore(gZoneDraft, gFurn);
  let zoneDrawing = false, zoneDragStart = null, zoneDragCurrent = null, zoneDraft = [];

  const zoneTypeName = code => SPACE_BY_CODE[code]?.name || code;
  const zoneColor = code => {
    const palette = { XCW: '#1687f5', KT: '#0f9b8e', CT: '#3d7ebd', ZW: '#6b8fc4', WS: '#5f9bb5', SF: '#4f9b7e', LRF: '#7a8fb0', XHF: '#8f7fc0', CF: '#4f9cad', WSJ: '#5a8fc0', GDYT: '#7c8fa6', YT: '#5f9b86', YMJ: '#937fae', WSWSJ: '#5d86b4', CS: '#8a7f9e' };
    return palette[code] || '#1687f5';
  };
  function renderZones() {
    const zones = state.zones || [];
    gZones.innerHTML = zones.map(z => {
      const c = centroid(z.poly), col = zoneColor(z.spaceCode), on = z.id === selectedZoneId;
      return `<polygon data-zone-id="${escapeHtml(z.id)}" points="${z.poly.map(p => p.join(',')).join(' ')}" fill="${col}" fill-opacity="${on ? .16 : .08}" stroke="${col}" stroke-width="${on ? 3 : 2}" stroke-dasharray="9 6" vector-effect="non-scaling-stroke" style="cursor:pointer"/>
        <text x="${c[0]}" y="${c[1]}" font-size="190" text-anchor="middle" fill="${col}" font-weight="700" stroke="#ffffff" stroke-width="55" paint-order="stroke" pointer-events="none">${escapeHtml(z.name)} · ${escapeHtml(zoneTypeName(z.spaceCode))}</text>`;
    }).join('');
    gZones.querySelectorAll('[data-zone-id]').forEach(el => el.addEventListener('click', e => {
      e.stopPropagation();
      selectedZoneId = el.dataset.zoneId;
      setRightTab('zone');
      renderZones(); renderZonePanel();
    }));
  }
  function renderZoneDraft() {
    const pts = zoneDraft.length >= 4 ? zoneDraft : (zoneDragStart && zoneDragCurrent ? [zoneDragStart, [zoneDragCurrent[0], zoneDragStart[1]], zoneDragCurrent, [zoneDragStart[0], zoneDragCurrent[1]]] : []);
    if (pts.length < 4) { gZoneDraft.innerHTML = ''; return; }
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys), w = Math.max(...xs) - x, h = Math.max(...ys) - y;
    gZoneDraft.innerHTML = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="rgba(22,135,245,.12)" stroke="#1687f5" stroke-width="2.5" stroke-dasharray="8 5" vector-effect="non-scaling-stroke"/>
      <text x="${x + w / 2}" y="${y - 90}" font-size="150" text-anchor="middle" fill="#075eb8" stroke="#ffffff" stroke-width="40" paint-order="stroke">${Math.round(w)} × ${Math.round(h)} mm</text>`;
  }
  function setZoneDrawing(on) {
    zoneDrawing = on; zoneDragStart = null; zoneDragCurrent = null; zoneDraft = [];
    renderZoneDraft();
    document.body.classList.toggle('zone-drawing', on);
    document.querySelector('#zoneTool')?.classList.toggle('on', on);
    if (on) {
      if (document.body.classList.contains('m3d') && window.setView) window.setView('2d');
      setRightTab('zone');
      toastSafe('功能分区：按住鼠标左键拖出矩形，松开完成；Esc 取消');
    }
  }
  function finishZoneRect() {
    if (!zoneDragStart || !zoneDragCurrent) return;
    const x0 = Math.min(zoneDragStart[0], zoneDragCurrent[0]), x1 = Math.max(zoneDragStart[0], zoneDragCurrent[0]);
    const y0 = Math.min(zoneDragStart[1], zoneDragCurrent[1]), y1 = Math.max(zoneDragStart[1], zoneDragCurrent[1]);
    if (x1 - x0 < 150 || y1 - y0 < 150) {
      toastSafe('拖出的矩形太小，请按住左键拖出至少 150 × 150mm 的区域');
      zoneDragStart = null; zoneDragCurrent = null; renderZoneDraft(); return;
    }
    zoneDraft = [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
    zoneDragStart = null; zoneDragCurrent = null;
    renderZoneDraft();
    const type = 'XCW';
    zoneModal.querySelector('#zone-type').value = type;
    zoneModal.querySelector('#zone-name').value = zoneTypeName(type);
    zoneModal.classList.add('show');
  }
  function closeZoneModal() { zoneModal.classList.remove('show'); }
  function saveZone() {
    const type = zoneModal.querySelector('#zone-type').value;
    const name = zoneModal.querySelector('#zone-name').value.trim() || zoneTypeName(type);
    if (zoneDraft.length < 3) return closeZoneModal();
    const zone = { id: 'z' + Date.now().toString(36), name, spaceCode: type, poly: zoneDraft.map(p => [Math.round(p[0]), Math.round(p[1])]) };
    state.zones = state.zones || [];
    state.zones.push(zone);
    selectedZoneId = zone.id;
    zoneDraft = []; zoneDragStart = null; zoneDragCurrent = null; zoneDrawing = false; document.body.classList.remove('zone-drawing');
    document.querySelector('#zoneTool')?.classList.remove('on');
    renderZoneDraft(); closeZoneModal(); saveSafe(); renderAll(); renderZonePanel(); setRightTab('zone');
    toastSafe(`已添加功能分区「${name}」，分区内设备将按 ${zoneTypeName(type)} 规则布点`);
  }
  zoneModal.querySelector('#zone-cancel').onclick = () => { closeZoneModal(); setZoneDrawing(false); };
  zoneModal.querySelector('#zone-save').onclick = saveZone;
  zoneModal.querySelector('#zone-type').onchange = e => {
    const nameInput = zoneModal.querySelector('#zone-name');
    if (!nameInput.value.trim() || nameInput.value === zoneTypeName('XCW')) nameInput.value = zoneTypeName(e.target.value);
  };
  document.querySelector('#zoneTool').onclick = () => setZoneDrawing(!zoneDrawing);
  document.querySelectorAll('#tools [data-tool]').forEach(b => b.addEventListener('click', () => setZoneDrawing(false), true));
  svg.addEventListener('pointerdown', e => {
    if (!zoneDrawing || e.button !== 0) return;
    e.preventDefault(); e.stopPropagation();
    const p = toMM(e);
    zoneDragStart = [p.x, p.y]; zoneDragCurrent = [p.x, p.y];
    try { svg.setPointerCapture(e.pointerId); } catch (_) {}
    renderZoneDraft();
  }, true);
  window.addEventListener('pointermove', e => {
    if (!zoneDrawing || !zoneDragStart) return;
    e.preventDefault(); e.stopPropagation();
    const p = toMM(e);
    zoneDragCurrent = [p.x, p.y];
    renderZoneDraft();
  }, true);
  window.addEventListener('pointerup', e => {
    if (!zoneDrawing || !zoneDragStart) return;
    e.preventDefault(); e.stopPropagation();
    finishZoneRect();
  }, true);
  window.addEventListener('pointercancel', () => {
    if (!zoneDrawing) return;
    zoneDragStart = null; zoneDragCurrent = null; renderZoneDraft();
  }, true);
  document.addEventListener('keydown', e => {
    if (!zoneDrawing) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); setZoneDrawing(false); }
  }, true);

  function renderZonePanel() {
    const host = zonePanel.querySelector('#zone-list');
    const zones = state.zones || [];
    if (!zones.length) {
      host.innerHTML = '<div class="zone-empty">还没有功能分区。点击「＋ 绘制分区」，在入户门附近画出玄关区域。</div>';
      return;
    }
    host.innerHTML = zones.map(z => `<div class="zone-row${z.id === selectedZoneId ? ' on' : ''}" data-zone-row="${escapeHtml(z.id)}">
      <b data-zone-focus="${escapeHtml(z.id)}">${escapeHtml(z.name)}</b>
      <small>${area(z.poly).toFixed(1)} m²</small>
      <select data-zone-type="${escapeHtml(z.id)}">${SPACES.map(s => `<option value="${s.code}" ${s.code === z.spaceCode ? 'selected' : ''}>${escapeHtml(s.name)}</option>`).join('')}</select>
      <button data-zone-del="${escapeHtml(z.id)}" title="删除分区">删</button></div>`).join('');
    host.querySelectorAll('[data-zone-focus]').forEach(b => b.onclick = () => { selectedZoneId = b.dataset.zoneFocus; renderZones(); renderZonePanel(); });
    host.querySelectorAll('[data-zone-type]').forEach(sel => sel.onchange = () => {
      const z = zones.find(x => x.id === sel.dataset.zoneType); if (!z) return;
      const oldDefault = zoneTypeName(z.spaceCode);
      z.spaceCode = sel.value;
      if (z.name === oldDefault) z.name = zoneTypeName(sel.value);
      saveSafe(); renderAll(); renderZonePanel();
    });
    host.querySelectorAll('[data-zone-del]').forEach(b => b.onclick = () => {
      state.zones = zones.filter(x => x.id !== b.dataset.zoneDel);
      if (selectedZoneId === b.dataset.zoneDel) selectedZoneId = null;
      saveSafe(); renderAll(); renderZonePanel();
    });
  }
  window.__renderZones = renderZones;
  window.__renderZonePanel = renderZonePanel;
  renderZones(); renderZonePanel();

  let rightTab = 'attr';
  let circuitVisible = true;
  let controlLinksVisible = true;
  let circuitLayer = 'all';
  let circuitSelected = null;
  const circuitPower = new Map();

  function setRightTab(tab) {
    rightTab = tab;
    rightTabs.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.rtab === tab));
    if (propPanel) propPanel.style.display = tab === 'attr' ? '' : 'none';
    panel.style.display = tab === 'smart' ? 'flex' : 'none';
    if (zonePanel) zonePanel.style.display = tab === 'zone' ? 'flex' : 'none';
    if (circuitPanel) circuitPanel.style.display = tab === 'circuit' ? 'flex' : 'none';
    if (tab === 'circuit') refreshCircuitPanel();
    renderCircuitLines();
  }
  rightTabs.querySelectorAll('button').forEach(b => b.onclick = () => setRightTab(b.dataset.rtab));
  setRightTab('attr');

  let lastResult = null;
  const $sh = s => panel.querySelector(s);

  // 已展开的空间（默认全部收起）；重绘时保留展开状态。
  const openRooms = new Set();
  let pendingOnly = false;
  let ruleExpanded = false;

  function roomLabel(id) {
    if (id === '__whole') return '全屋网络基础包';
    const r = ROOMS.find(x => x.id === id);
    if (!r) return id;
    return (state.rooms?.[id]?.name) || r.name || id;
  }

  function refreshPicked() {
    refreshCircuitPanel();
    const groups = new Map();
    for (const f of deviceItems()) {
      const room = isWholeHouseDevice(f) ? { id: '__whole', name: '全屋网络基础包' } : roomOf(f.cx, f.cy);
      let g = groups.get(room.id);
      if (!g) { g = { id: room.id, total: 0, byKey: new Map() }; groups.set(room.id, g); }
      g.total += 1;
      const key = deviceKeyOf(f);
      const status = f.smart?.status || 'manual';
      const groupKey = `${key}|${status}`;
      const cur = g.byKey.get(groupKey) || { key, status, qty: 0, placed: 0, pending: 0, fallback: 0, moduleQty: 0, first: f };
      cur.qty += 1;
      cur.moduleQty += f.smart?.quote?.moduleQuantity || 0;
      if (f.smart?.status === 'pending') cur.pending += 1;
      else if (f.smart?.status === 'fallback') cur.fallback += 1;
      else if (f.smart?.status === 'placed') cur.placed += 1;
      g.byKey.set(groupKey, cur);
    }
    const ordered = ROOMS.filter(r => groups.has(r.id)).map(r => groups.get(r.id));
    if (groups.has('__whole')) ordered.push(groups.get('__whole'));
    const total = ordered.reduce((s, g) => s + g.total, 0);
    const counts = { placed: 0, fallback: 0, pending: 0, manual: 0, adjusted: 0 };
    const allDevices = deviceItems();
    for (const f of allDevices) counts[f.smart?.status || 'manual'] = (counts[f.smart?.status || 'manual'] || 0) + 1;
    const derivedCount = allDevices.filter(isDerivedDevice).length;
    const demoCount = allDevices.filter(isDemoDevice).length;
    const wholeCount = allDevices.filter(isWholeHouseDevice).length;
    const ruleDeviceCount = total - derivedCount - demoCount - wholeCount;
    $sh('#sh-count').textContent = `${total} 件 · ${ordered.length} 个空间`;
    $sh('#sh-summary').innerHTML = total
      ? `<span>规则件 ${ruleDeviceCount}</span>${derivedCount ? `<span>衍生轨道 ${derivedCount}</span>` : ''}${wholeCount ? `<span>全屋网络 ${wholeCount}</span>` : ''}${demoCount ? `<span>Demo ${demoCount}</span>` : ''}<span class="placed">已落位 ${counts.placed}</span>${counts.fallback ? `<span class="fallback">降级 ${counts.fallback}</span>` : ''}${counts.adjusted ? `<span>人工调整 ${counts.adjusted}</span>` : ''}${counts.pending ? `<span class="pending">待处理 ${counts.pending}</span>` : ''}${counts.manual ? `<span>待布点 ${counts.manual}</span>` : ''}`
      : '';
    const lights = allDevices.filter(isLightingDevice);
    const lightLayer = { base: 0, task: 0, accent: 0 };
    const lightGroups = new Map();
    let lightUngrouped = 0, taskAnchored = 0;
    for (const f of lights) {
      const meta = lightingOf(f);
      if (!meta) { lightUngrouped++; continue; }
      lightLayer[meta.layer] += 1;
      lightGroups.set(meta.groupLabel, (lightGroups.get(meta.groupLabel) || 0) + 1);
      if (meta.layer === 'task') {
        const rule = ruleForDevice(f);
        if (rule && (['furnitureCenter', 'furnitureEdge', 'furniturePair', 'cabinetShelf'].includes(rule.anchor?.kind)
          || /书桌|学习桌|镜前|水槽|备餐|吊柜|镜柜|床头|阅读/.test(`${rule.usage || ''}${rule.anchor?.raw || ''}`))) taskAnchored++;
      }
    }
    const p0 = lightingP0Stats();
    $sh('#sh-lighting').innerHTML = lights.length
      ? `<div class="sh-light-head"><b>照明分组</b><span>基础 ${lightLayer.base} · 任务 ${lightLayer.task} · 重点 ${lightLayer.accent}</span></div>
        <div class="sh-light-groups">${[...lightGroups].map(([g, n]) => `<span class="sh-light-group">${escapeHtml(g)} ×${n}</span>`).join('')}</div>
        <div class="sh-light-check">控制组 ${lightGroups.size} · 未分组 ${lightUngrouped} · 任务灯有家具/操作面锚点 ${taskAnchored}/${lightLayer.task}</div>
        <div class="sh-light-check">数据包：${DEMO_DATASET ? `${escapeHtml(DEMO_DATASET.version)} · 产品 ${DEMO_DATASET.counts?.products ?? '—'} · IES/LDT ${DEMO_DATASET.counts?.iesFiles ?? '—'} · 障碍 ${DEMO_DATASET.counts?.obstacles ?? '—'} 空间 · 回路 ${DEMO_DATASET.counts?.circuits ?? '—'} · 场景 ${DEMO_DATASET.counts?.scenes ?? '—'} · <a href="/demo-data/${escapeHtml(DEMO_DATASET.version)}/README.md" target="_blank" rel="noopener">查看数据包</a>` : '未加载，使用内置最小集'}</div>
        <div class="sh-light-check">产品：模拟 ${p0.simulated} · 真实选品 ${p0.selected} · 合成 IES ${p0.syntheticPhotometry} · 缺真实 IES ${p0.missingRealPhotometry}${p0.notApplicablePhotometry ? ` · 无配光载体 ${p0.notApplicablePhotometry}` : ''}</div>
        <div class="sh-light-check">回路：${p0.circuitsUsed}/${DEMO_DATASET?.counts?.circuits ?? '—'} 个 · 未分配灯位 ${p0.missingCircuit} · 模拟未验证灯位 ${p0.unverifiedCircuits} · DALI 地址 ${p0.daliAddressesUsed}/${p0.daliCapacity ?? '—'}${p0.daliOverflow ? ` · 溢出 ${p0.daliOverflow}` : ''}</div>
        <div class="sh-light-check">网关 ${p0.gatewaysUsed} 个 · 协议模拟未验证 ${p0.unverifiedProtocols} · 支持 ${DEMO_PROTOCOLS.join(' / ')}</div>
        ${DEMO_SCENES.length ? `<div class="sh-light-check">场景：${DEMO_SCENES.map(s => escapeHtml(s.name)).join(' / ')} · 每场景 15 空间 × 3 层级</div>` : ''}
        ${Array.isArray(DEMO_DATA?.circuits) && DEMO_DATA.circuits.length ? `<details class="sh-circuit-list"><summary>回路清单 ${p0.circuitsUsed} 个 · ${p0.gatewaysUsed} 网关</summary>${DEMO_DATA.circuits.map(c => `<div class="sh-circuit-row"><b>${escapeHtml(c.circuitId)}</b><span>${escapeHtml(c.spaceName)} · ${escapeHtml(c.layerLabel)}</span><em>${c.lightCount}灯 · ${escapeHtml(c.gatewayId)} · ${c.daliAddressStart}–${c.daliAddressEnd} · ${c.driverQty}驱动</em></div>`).join('')}</details>` : ''}
        <div class="sh-light-check">碰撞：体块 ${p0.body} · 净距 ${p0.clearance} · 空调未建模 ${p0.acMissingRooms} 空间</div>
        ${p0.collisions.length ? `<div class="sh-light-note">碰撞示例：${p0.collisions.slice(0, 3).map(c => `${escapeHtml(c.name)} ↔ ${c.obstacle.type === 'ac' ? '空调' : c.obstacle.type === 'curtain_box' ? '窗帘盒' : '检修口'}（${c.severity === 'BODY' ? '体块重叠' : '净距不足'}）`).join('；')}</div>` : ''}
        <div class="sh-light-note">障碍物可在顶部「障碍」图层隐藏；默认只做浅色虚线，发生碰撞时才用暖色描边。</div>
        <div class="sh-light-note">产品/IES/回路/协议/场景均为模拟数据；估算口径为目标照度 × 面积 / (CU 0.6 × MF 0.8)，Demo 示意，不替代配光仿真。空调/窗帘盒/检修口为模拟实测占位，需现场复核。</div>
        <div class="sh-light-note">标准：${escapeHtml(DEMO_LIGHT_STANDARD.source)}</div>`
      : '';
    $sh('#sh-legend').style.display = counts.pending ? 'block' : 'none';
    panel.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('on', (b.dataset.filter === 'pending') === pendingOnly));
    const pendingRows = [];
    for (const g of ordered) for (const x of g.byKey.values()) if (x.pending) pendingRows.push({ roomId: g.id, ...x });
    const totalPending = pendingRows.reduce((s, x) => s + x.pending, 0);
    const pendingHost = $sh('#sh-pending');
    if (pendingOnly && pendingRows.length) {
      pendingHost.innerHTML = `<div class="sh-pending-title"><span>待处理明细</span><span>${totalPending} 台</span></div>`
        + pendingRows.map(x => {
          const def = DEVICE_BY_KEY[x.key];
          return `<button class="sh-pending-row" data-pending-fid="${escapeHtml(x.first.id)}" data-room="${escapeHtml(x.roomId)}" title="定位到该待处理设备">
            <b>${escapeHtml(roomLabel(x.roomId))} · ${escapeHtml(def?.category2 || x.key)}</b>
            <small>${escapeHtml(x.first.smart?.ruleCode || 'MANUAL')}</small><em>${x.pending} 台</em></button>`;
        }).join('');
    } else {
      pendingHost.innerHTML = pendingOnly ? '<div class="sh-empty">当前没有待处理设备。</div>' : '';
    }
    const host = $sh('#sh-spaces');
    if (!ordered.length) {
      host.innerHTML = '<div class="sh-empty">从左侧「智能设备」拖入平面图，或点击设备分类添加，再点「一键布点」。</div>';
      return;
    }
    const visible = ordered.filter(g => !pendingOnly || [...g.byKey.values()].some(x => x.pending));
    if (!visible.length) {
      host.innerHTML = '<div class="sh-empty">当前没有待处理设备。</div>';
      return;
    }
    host.innerHTML = visible.map(g => {
      const items = [...g.byKey.values()].filter(x => !pendingOnly || x.pending).sort((a, b) => {
        const da = DEVICE_BY_KEY[a.key], db = DEVICE_BY_KEY[b.key];
        return (CATEGORY_ORDER.indexOf(da?.category1) - CATEGORY_ORDER.indexOf(db?.category1))
          || String(da?.category2 || a.key).localeCompare(String(db?.category2 || b.key), 'zh');
      });
      const rows = items.map(x => {
        const def = DEVICE_BY_KEY[x.key];
        const code = x.first.smart?.ruleCode;
        const balance = x.pending ? `<small class="sh-pending">待处理 ${x.pending}</small>` : (x.fallback ? `<small>降级 ${x.fallback}</small>` : '');
        const statusLabel = x.status === 'pending' ? '待处理' : x.status === 'fallback' ? '降级' : x.status === 'manual' ? '待布点' : x.status === 'adjusted' ? '人工调整' : '已落位';
        const qtyLabel = x.moduleQty ? `${x.qty} 条 · ${x.moduleQty} 模块` : `×${x.qty}`;
        return `<button class="sh-dev" data-fid="${escapeHtml(x.first.id)}" title="点击查看该设备的规则命中说明">
          <span>${escapeHtml(def?.category2 || x.key)}</span>
          ${code && code !== 'MANUAL' ? `<code>${escapeHtml(code)}</code>` : ''}
          ${balance}<small>${statusLabel} ${qtyLabel}</small>
        </button>`;
      }).join('');
      const pendingCount = [...g.byKey.values()].reduce((s, x) => s + x.pending, 0);
      const open = openRooms.has(g.id) || (pendingOnly && pendingCount) ? ' open' : '';
      return `<div class="sh-space${open}" data-room="${escapeHtml(g.id)}">
        <button class="sh-space-head" data-toggle="${escapeHtml(g.id)}"><i>▶</i><b>${escapeHtml(roomLabel(g.id))}</b><em>${pendingOnly ? `${pendingCount} 待处理 / 共 ${g.total}` : `${g.total} 件`}</em></button>
        <div class="sh-space-body">${rows}</div>
      </div>`;
    }).join('');
    host.querySelectorAll('[data-toggle]').forEach(b => b.onclick = () => {
      const id = b.dataset.toggle;
      const box = b.closest('.sh-space');
      if (openRooms.has(id)) { openRooms.delete(id); box.classList.remove('open'); }
      else { openRooms.add(id); box.classList.add('open'); }
    });
    host.querySelectorAll('[data-fid]').forEach(b => b.onclick = () => select({ kind: 'furn', id: b.dataset.fid }));
    pendingHost.querySelectorAll('[data-pending-fid]').forEach(b => b.onclick = () => {
      openRooms.add(b.dataset.room);
      refreshPicked();
      select({ kind: 'furn', id: b.dataset.pendingFid });
    });
  }

  function currentRoom() {
    if (selectedZoneId) {
      const z = (state.zones || []).find(x => x.id === selectedZoneId);
      if (z) return zoneAsRoom(z);
    }
    if (ui.sel?.kind === 'room') return ROOMS.find(r => r.id === ui.sel.id) || ROOMS[0];
    if (ui.sel?.kind === 'furn') {
      const f = getF(ui.sel.id);
      if (f) return roomOf(f.cx, f.cy);
    }
    return ROOMS.find(r => r.id === 'living') || ROOMS[0];
  }

  function addDevice(key, x, y) {
    const def = DEVICE_BY_KEY[key];
    if (!def) return;
    const room = currentRoom();
    const c = typeof x === 'number' && typeof y === 'number' ? [x, y] : centroid(room.poly);
    const targetRoom = typeof x === 'number' ? roomOf(x, y) : room;
    const item = F('dev:' + key, def.category2, c[0], c[1], def.size.width, def.size.depth, 0, colorFor(key));
    item.smart = {
      ruleCode: 'MANUAL', roomId: targetRoom.id, status: 'manual', locked: false,
      source: 'manual',
      quote: { lineId: quoteLineIdFor(targetRoom.id, def.productId || key, 'manual'), inputQuantity: 1, unit: def.salesUnit || '件', placementForm: def.visual },
      binding: { kind: 'room', name: targetRoom.name },
      product: def.productId ? { productId: def.productId, sku: def.sku, productName: def.productName, price: def.price, salesUnit: def.salesUnit, legacyKey: def.legacyKey || def.key, dataState: def.dataState } : null,
    };
    item.smart.lighting = lightingMetaFor(item);
    state.furniture.push(item);
    recountQuote(item.smart.quote.lineId);
    saveSafe(); renderAll(); refreshPicked();
    toastSafe(`已加入 ${def.category2}，点「一键布点」按规则落位`);
  }
  window.__smartHomeDropDevice = function (key, x, y) { addDevice(key, x, y); };
  window.__smartHomeMarkAdjusted = function (id) {
    const f = getF(id);
    if (!f?.type?.startsWith('dev:') || f.smart?.status === 'pending') return;
    f.smart = f.smart || {};
    f.smart.status = 'adjusted';
    // 人工移动后原墙/窗/家具绑定可能失效，标记为待确认，而不是假装仍然绑定。
    f.smart.binding = { kind: 'pending', name: '人工调整后待确认' };
  };
  // 供浏览器回归、外部面板或后续业务集成读取当前设备快照；不直接暴露可变 state。
  window.__smartHomeSnapshot = function () {
    return deviceItems().map(f => ({
      id: f.id,
      key: deviceKeyOf(f),
      x: Math.round(f.cx),
      y: Math.round(f.cy),
      roomId: roomOf(f.cx, f.cy).id,
      ruleCode: f.smart?.ruleCode || 'MANUAL',
      status: f.smart?.status || 'manual',
      power: f.smart?.power || 'on',
      locked: !!f.smart?.locked,
      quote: f.smart?.quote || null,
      binding: f.smart?.binding || null,
      lighting: lightingOf(f),
      product: f.smart?.product || null,
      warnings: f.smart?.trace?.warnings || [],
    }));
  };
  window.__smartHomePendingByRoom = function () {
    const map = new Map();
    for (const f of deviceItems()) {
      if (f.smart?.status !== 'pending') continue;
      const room = roomOf(f.cx, f.cy);
      const g = map.get(room.id) || { room, count: 0, firstId: f.id };
      g.count += 1;
      map.set(room.id, g);
    }
    return [...map.values()].map(({ room, count, firstId }) => {
      const xs = room.poly.map(p => p[0]), ys = room.poly.map(p => p[1]);
      const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
      const w = Math.max(760, Math.min(1200, (x1 - x0) * .52));
      return {
        roomId: room.id, count, firstId, w,
        x: Math.max(x0 + w / 2 + 120, Math.min(x1 - w / 2 - 120, x0 + w / 2 + 240)),
        y: y0 + 430,
      };
    });
  };
  window.__smartHomeZones = function () {
    return (state.zones || []).map(z => ({ id: z.id, name: z.name, spaceCode: z.spaceCode, points: z.poly.length }));
  };
  // QA / 业务对账：规则生成数量应与规则请求数量逐条一致；衍生轨道和 Demo 件单独统计。
  window.__smartHomeAudit = function () {
    const all = deviceItems();
    const roomIdOf = f => f.smart?.roomId || roomOf(f.cx, f.cy).id;
    const derived = all.filter(isDerivedDevice);
    const demo = all.filter(isDemoDevice);
    const whole = all.filter(isWholeHouseDevice);
    const ruleDevices = all.filter(f => !isDerivedDevice(f) && !isDemoDevice(f) && !isWholeHouseDevice(f) && f.smart?.ruleCode && f.smart.ruleCode !== 'MANUAL');
    const executions = (lastResult?.executions || []).filter(e => e.requestedCount !== undefined && e.status !== 'skipped');
    const requestedSum = executions.reduce((s, e) => s + (e.requestedCount || 0), 0);
    const mismatches = [];
    for (const e of executions) {
      // 轨道按模块数计价：一条实体轨道可能对应多个模块，不能按实体数量对账。
      const count = ruleDevices
        .filter(f => f.smart?.ruleCode === e.ruleCode && roomIdOf(f) === e.roomId)
        .reduce((s, f) => s + (f.smart?.quote?.moduleQuantity || 1), 0);
      if (count !== e.requestedCount) mismatches.push({ ruleCode: e.ruleCode, roomId: e.roomId, requested: e.requestedCount, actual: count });
    }
    return {
      physical: all.length,
      zones: (state.zones || []).length,
      ruleDevices: ruleDevices.length,
      derivedTracks: derived.length,
      wholeHouse: whole.length,
      demoGroups: demo.length,
      pending: all.filter(f => f.smart?.status === 'pending').length,
      requestedSum,
      executions: executions.length,
      mismatches,
    };
  };

  // 照明自检：每个灯具必须有房间、标高、控制组；任务灯尽量绑定家具/操作面。
  window.__lightingAudit = function () {
    const lights = deviceItems().filter(isLightingDevice);
    const p0 = lightingP0Stats();
    const controlDevices = deviceItems().filter(f => CONTROL_KEYS.includes(deviceKeyOf(f)));
    const cb = controlBindings();
    const layers = { base: 0, task: 0, accent: 0 };
    const groups = new Map();
    let ungrouped = 0, taskAnchored = 0, pending = 0;
    for (const f of lights) {
      if (f.smart?.status === 'pending') pending++;
      const meta = lightingOf(f);
      if (!meta) { ungrouped++; continue; }
      layers[meta.layer] += 1;
      groups.set(meta.group, (groups.get(meta.group) || 0) + 1);
      if (meta.layer === 'task') {
        const rule = ruleForDevice(f);
        if (rule && (['furnitureCenter', 'furnitureEdge', 'furniturePair', 'cabinetShelf'].includes(rule.anchor?.kind)
          || /书桌|学习桌|镜前|水槽|备餐|吊柜|镜柜|床头|阅读/.test(`${rule.usage || ''}${rule.anchor?.raw || ''}`))) taskAnchored++;
      }
    }
    return {
      lights: lights.length,
      ...layers,
      groups: groups.size,
      ungrouped,
      taskAnchored,
      pending,
      obstacles: p0.obstacles.length,
      collisions: p0.collisions.map(c => ({ lightId: c.id, light: c.name, rule: c.rule, obstacleId: c.obstacle.id, obstacle: c.obstacle.type, severity: c.severity })),
      bodyCollisions: p0.body,
      clearanceIssues: p0.clearance,
      selectedProducts: p0.selected,
      simulatedProducts: p0.simulated,
      intentProducts: p0.intent,
      syntheticPhotometry: p0.syntheticPhotometry,
      verifiedPhotometry: p0.verifiedPhotometry,
      missingPhotometry: p0.missingPhotometry,
      missingRealPhotometry: p0.missingRealPhotometry,
      notApplicablePhotometry: p0.notApplicablePhotometry,
      missingCircuit: p0.missingCircuit,
      unverifiedCircuits: p0.unverifiedCircuits,
      missingProtocol: p0.missingProtocol,
      unverifiedProtocols: p0.unverifiedProtocols,
      daliAddressesUsed: p0.daliAddressesUsed,
      daliCapacity: p0.daliCapacity,
      daliOverflow: p0.daliOverflow,
      circuitsUsed: p0.circuitsUsed,
      gatewaysUsed: p0.gatewaysUsed,
      acMissingRooms: p0.acMissingRooms,
      acModeledRooms: p0.acModeledRooms,
      controls: {
        total: controlDevices.length,
        bound: cb.byDevice.size,
        unbound: controlDevices.length - cb.byDevice.size,
        unboundList: controlDevices.filter(f => !cb.byDevice.has(f.id)).map(f => ({
          id: f.id, key: deviceKeyOf(f), rule: f.smart?.ruleCode || '', roomId: roomOf(f.cx, f.cy).id,
        })),
      },
      powerOffCircuits: [...circuitPower.entries()].filter(([, on]) => on === false).length,
      controlCircuitMap: [...cb.byCircuit.entries()].map(([circuitId, binding]) => ({
        circuitId,
        controls: [binding.ruleCode],
        button: binding.buttonLabel || null,
      })),
      dataPackage: DEMO_DATASET ? {
        version: DEMO_DATASET.version,
        source: DEMO_DATASET.source,
        disclaimer: DEMO_DATASET.disclaimer,
        counts: DEMO_DATASET.counts,
        checks: DEMO_DATASET.checks,
        scenes: DEMO_SCENES.map(s => ({ id: s.id, name: s.name, description: s.description })),
      } : null,
      standard: DEMO_LIGHT_STANDARD,
      estimateMethod: '目标照度 × 面积 / (CU 0.6 × MF 0.8)；合成 IES/LDT 仅用于链路示意，不作为照度仿真',
      coordination: '碰撞按模拟实测障碍物检查；空调/窗帘盒/检修口为 simulated_survey，需现场复核；DALI 地址与回路为模拟排布',
    };
  };

  // 回归/调试用：按设备实例 id 选中，便于验证单台设备的规则卡与碰撞说明。
  window.__smartHomeSelect = function (id) {
    select({ kind: 'furn', id });
  };

  function removeDevice(key) {
    const list = deviceItems().filter(f => deviceKeyOf(f) === key);
    if (!list.length) return;
    const last = list[list.length - 1];
    const id = last.id;
    const lineId = last.smart?.quote?.lineId;
    state.furniture = state.furniture.filter(f => f.id !== id);
    if (lineId) recountQuote(lineId);
    if (ui.sel?.kind === 'furn' && ui.sel.id === id) select(null);
    saveSafe(); renderAll(); refreshPicked();
  }

  function clearDevices() {
    state.furniture = state.furniture.filter(f => !(f.type && f.type.startsWith('dev:')));
    circuitPower.clear();
    select(null);
    saveSafe(); renderAll(); refreshPicked();
    toastSafe('已清空智能设备');
  }

  // 报价行数量 = 同一报价行的实例数；客户选品与一键套餐不混为同一行，便于“输入 N = 已落位 P + 待处理 U”对账。
  function quoteLineIdFor(roomId, key, source, ruleCode) {
    return source === 'manual' ? `manual:${roomId}:${key}` : `package:${roomId}:${ruleCode || key}:${key}`;
  }
  function recountQuote(lineId) {
    const list = deviceItems().filter(f => (f.smart?.quote?.lineId || '') === lineId);
    // 磁吸轨道按模块计价：一条实体轨道可能对应多个 1200mm 模块。
    const moduleQuantity = list.reduce((s, f) => s + (f.smart?.quote?.moduleQuantity || 0), 0);
    const qty = moduleQuantity || list.length;
    for (const f of list) {
      f.smart = f.smart || {};
      f.smart.quote = { ...(f.smart.quote || {}), lineId, unit: '件', inputQuantity: qty };
    }
  }

  function saveSafe() { try { save(); } catch (_) {} }
  function toastSafe(msg) { try { toast(msg); } catch (_) { console.log('[smart-home]', msg); } }

  /* ---------------- project adapter ---------------- */
  function buildWalls() {
    return WALLS.map((w, i) => {
      const [x0, y0, x1, y1, k] = w;
      const horizontal = (x1 - x0) >= (y1 - y0);
      return {
        id: 'w' + i,
        a: horizontal ? [x0, (y0 + y1) / 2] : [(x0 + x1) / 2, y0],
        b: horizontal ? [x1, (y0 + y1) / 2] : [(x0 + x1) / 2, y1],
        thickness: horizontal ? Math.max(80, y1 - y0) : Math.max(80, x1 - x0),
        height: 2800,
        type: k === 'b' ? 'load-bearing' : k === 'e' ? 'exterior' : 'partition',
      };
    });
  }

  function openingFor(rect, type, height, sill) {
    const cx = (rect[0] + rect[2]) / 2, cy = (rect[1] + rect[3]) / 2;
    let best = null, bestD = Infinity;
    for (const w of buildWalls()) {
      const d = distToSeg(cx, cy, w.a[0], w.a[1], w.b[0], w.b[1]);
      if (d < bestD) { bestD = d; best = w; }
    }
    if (!best) return null;
    const ux = best.b[0] - best.a[0], uy = best.b[1] - best.a[1];
    const len = Math.hypot(ux, uy) || 1;
    const t = Math.max(0, Math.min(len, ((cx - best.a[0]) * ux + (cy - best.a[1]) * uy) / len));
    const width = Math.max(rect[2] - rect[0], rect[3] - rect[1]);
    return { id: 'o' + Math.random().toString(36).slice(2, 8), type, wallId: best.id, start: Math.max(0, t - width / 2), width, height, sill };
  }

  function buildProject(includeZones = true) {
    const walls = buildWalls();
    const wallIds = new Set(walls.map(w => w.id));
    const openings = [];
    WINS.forEach(r => { const o = openingFor(r, 'window', 1500, 900); if (o && wallIds.has(o.wallId)) openings.push(o); });
    DOORS.forEach(d => { const o = openingFor(d.rect, 'door', 2100, 0); if (o && wallIds.has(o.wallId)) openings.push(o); });
    SLIDES.forEach(d => { const o = openingFor(d.rect, 'sliding', 2200, 0); if (o && wallIds.has(o.wallId)) openings.push(o); });
    const zoneRooms = includeZones ? (state.zones || []).map(z => ({
      id: z.id,
      name: z.name,
      spaceCode: z.spaceCode,
      polygon: z.poly,
      excludePolygons: [],
      mode: SPACE_MODE[z.spaceCode] || 'MIXED',
      tags: ['FUNCTION_ZONE'],
      ceilingHeight: 2800,
      floorMaterial: 'tile800',
    })) : [];
    const zonePolys = includeZones ? (state.zones || []).map(z => z.poly) : [];
    const excludeFor = poly => zonePolys.filter(zp => pointInPoly([zp.reduce((s, p) => s + p[0], 0) / zp.length, zp.reduce((s, p) => s + p[1], 0) / zp.length], poly));
    const rooms = [...zoneRooms, ...ROOMS.map(r => ({
      id: r.id,
      name: r.name,
      spaceCode: ROOM_SPACE[r.id] || 'KT',
      polygon: r.poly,
      excludePolygons: excludeFor(r.poly),
      mode: SPACE_MODE[ROOM_SPACE[r.id] || 'KT'] || 'MIXED',
      tags: [],
      ceilingHeight: 2800,
      floorMaterial: r.mat,
    }))];
    const furniture = state.furniture
      .filter(f => !(f.type && f.type.startsWith('dev:')))
      .map(f => {
        // 规则引擎只接受轴对齐矩形；旋转家具必须传入旋转后的包围盒，
        // 否则 90°/270° 的电视柜、衣柜、橱柜会把碰撞区/锚点算到房间中央。
        const rad = (f.rot || 0) * Math.PI / 180;
        const cs = Math.abs(Math.cos(rad)), sn = Math.abs(Math.sin(rad));
        const fw = f.w * cs + f.d * sn, fd = f.w * sn + f.d * cs;
        return {
          id: f.id,
          type: FURN_MAP[f.type] || 'console',
          roomId: roomOf(f.cx, f.cy).id,
          rect: [f.cx - fw / 2, f.cy - fd / 2, fw, fd],
          rotation: f.rot || 0,
          height: 800,
        };
      });
    const devices = deviceItems().map(f => toPlacedDevice(f, rooms));
    const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const r of ROOMS) for (const p of r.poly) {
      b.minX = Math.min(b.minX, p[0]); b.minY = Math.min(b.minY, p[1]);
      b.maxX = Math.max(b.maxX, p[0]); b.maxY = Math.max(b.maxY, p[1]);
    }
    return {
      id: 'floorplan3d-base',
      name: '三室两厅智能布点',
      units: 'mm',
      width: b.maxX - b.minX,
      height: b.maxY - b.minY,
      ceilingHeight: 2800,
      rooms, walls, openings, furniture, devices,
      wholeHouseDevices: [],
      ruleVersion: '2026-10-21-V1',
      engineVersion: '0.3.0-base',
      seed: 'floorplan3d-base',
    };
  }

  function toPlacedDevice(f, rooms) {
    const key = deviceKeyOf(f);
    const def = DEVICE_BY_KEY[key] || {
      category1: '灯光', category2: key, mount: 'CL', visual: 'point', glow: 'point',
      size: { width: f.w, depth: f.d },
    };
    const room = roomOf(f.cx, f.cy);
    const z = f.smart?.z ?? (def.mount === 'CL' ? 2750 : def.mount === 'WL' ? 2400 : def.mount === 'BL' ? 900 : def.mount === 'FL' ? 0 : 1300);
    return {
      id: f.id,
      ruleCode: f.smart?.ruleCode || 'MANUAL',
      deviceKey: key,
      deviceType2: def.category2,
      category1: def.category1,
      roomId: f.smart?.roomId || room.id,
      roomName: f.smart?.roomId === '__whole' ? '全屋基础包' : room.name,
      position: { x: f.cx, y: f.cy, z },
      rotation: f.rot || 0,
      mount: f.smart?.mount || def.mount,
      priority: f.smart?.priority || 'P3',
      visual: def.visual,
      glow: def.glow,
      size: { width: f.w, depth: f.d },
      status: f.smart?.status || 'manual',
      source: f.smart?.source || 'manual',
      locked: !!f.smart?.locked,
      quote: f.smart?.quote || { lineId: quoteLineIdFor(room.id, key, 'manual'), inputQuantity: 1, unit: '件', placementForm: def.visual },
      binding: f.smart?.binding,
      lighting: f.smart?.lighting || lightingMetaFor(f),
      product: f.smart?.product || (def.productId ? { productId: def.productId, sku: def.sku, productName: def.productName, price: def.price, salesUnit: def.salesUnit, legacyKey: def.legacyKey || def.key, dataState: def.dataState } : null),
      trace: f.smart?.trace || { anchor: 'roomCenter', candidateRank: 0, fallbackStep: 0, confidence: 1, notes: ['MANUAL_PLACEMENT'], warnings: [] },
    };
  }

  function applyResult(result) {
    const current = new Map(deviceItems().map(f => [f.id, f]));
    state.furniture = state.furniture.filter(f => !(f.type && f.type.startsWith('dev:')));
    for (const d of result.devices || []) {
      const def = DEVICE_BY_KEY[d.deviceKey];
      if (!def) continue;
      const item = current.get(d.id) || F('dev:' + d.deviceKey, d.deviceType2, d.position.x, d.position.y, d.size.width, d.size.depth, d.rotation, colorFor(d.deviceKey));
      item.type = 'dev:' + d.deviceKey; item.name = d.deviceType2;
      item.cx = d.position.x; item.cy = d.position.y; item.w = d.size.width; item.d = d.size.depth; item.rot = d.rotation;
      const existingLine = item.smart?.quote?.lineId;
      const lineId = d.source === 'manual' && existingLine
        ? existingLine
        : quoteLineIdFor(d.roomId, d.deviceKey, d.source, d.ruleCode);
      item.smart = {
        ruleCode: d.ruleCode,
        roomId: d.roomId,
        status: d.status,
        source: d.source,
        trace: d.trace,
        mount: d.mount,
        z: d.position.z,
        priority: d.priority,
        locked: !!d.locked,
        quote: {
          lineId,
          inputQuantity: d.quote?.inputQuantity || 1,
          moduleQuantity: d.quote?.moduleQuantity,
          unit: '件',
          placementForm: d.quote?.placementForm || d.visual,
        },
        binding: d.binding,
        product: d.product || item.smart?.product || catalogProductForLegacy(d.deviceKey),
      };
      item.smart.lighting = lightingMetaFor(item);
      state.furniture.push(item);
    }
    const lineIds = new Set(state.furniture.filter(f => f.type?.startsWith('dev:')).map(f => f.smart?.quote?.lineId).filter(Boolean));
    for (const lineId of lineIds) recountQuote(lineId);
    lastResult = result;
    saveSafe(); renderAll(); refreshPicked();
  }

  function runPlaceExisting() {
    const movable = deviceItems().filter(f => (f.smart?.source || 'manual') !== 'wholeHouse');
    const manualDevices = movable.filter(f => (f.smart?.source || 'manual') === 'manual');
    const unlockedManual = manualDevices.filter(f => !f.smart?.locked);
    const unlockedPackage = movable.filter(f => f.smart?.source === 'rule' && !f.smart?.locked);
    if (!movable.length) {
      toastSafe('当前没有设备；请从左侧添加，或点击「一键套餐」生成整套演示');
      return;
    }
    // 只有套餐设备时，“一键布点”按当前软装整包重算，等价于重新生成一次套餐：
    // 数量、规则归因和报价行保持不变，只更新坐标/朝向/绑定。
    if (!unlockedManual.length && unlockedPackage.length) {
      runPackage();
      $sh('#sh-status').textContent = '一键布点完成：已按当前软装重新计算套餐点位（数量按规则重算）';
      toastSafe('已按当前软装重新计算套餐点位');
      return;
    }
    if (!unlockedManual.length) {
      toastSafe(manualDevices.length ? '当前设备已全部锁定，无需重新布点' : '当前没有可重新布点的设备');
      return;
    }
    const project = buildProject();
    const result = window.SmartHomeRules.placeExistingDevices(project, { sources: ['manual'], preserveLocked: true });
    console.log('[smart-home] placed ' + JSON.stringify(result.devices.map(d => ({ k: d.deviceKey, w: Math.round(d.size.width), d: Math.round(d.size.depth), rule: d.ruleCode }))));
    resetLightingCircuitCursor();
    applyResult(result);
    const processed = result.devices.filter(d => (d.source || 'manual') === 'manual');
    const pending = processed.filter(d => d.status === 'pending').length;
    $sh('#sh-status').textContent = `一键布点完成：客户选品 ${processed.length} 台，已落位 ${processed.length - pending} 台，待处理 ${pending} 台；套餐设备未改动`;
  }

  function runPackage() {
    resetLightingCircuitCursor();
    resetCircuitPowerState();
    const project = buildProject(true);
    // 套餐是整套演示，不覆盖客户已选产品；客户选品走一键布点。
    const manualSelection = deviceItems().filter(f => (f.smart?.source || 'manual') === 'manual' && !f.smart?.locked);
    if (manualSelection.length) {
      toastSafe(`当前有 ${manualSelection.length} 台客户选品设备，请使用「一键布点」；如需整套演示，请先清空设备`);
      return;
    }
    // 套餐是“整套重算”：不把当前设备作为输入，避免连续点击不断叠加。
    project.devices = project.devices.filter(d => d.locked);
    const result = window.SmartHomeRules.runLayout(project, { mode: 'all' });
    const wholeHouse = result.wholeHouseDevices || [];
    // 全屋网络基础包与空间规则一起进入套餐；右侧单独归组，不混入房间规则设备数。
    const spaceMode = !!window.__spaceMode?.active;
    const includeWhole = !spaceMode || window.__spaceMode?.code === 'ALL';
    result.devices = includeWhole ? [...result.devices, ...wholeHouse] : result.devices;
    applyResult(result);
    console.log('[smart-home] package devices=' + deviceItems().length);
    const all = deviceItems();
    const pending = all.filter(d => d.smart?.status === 'pending').length;
    const derived = all.filter(isDerivedDevice).length;
    const demo = all.filter(isDemoDevice).length;
    const wholeCount = all.filter(isWholeHouseDevice).length;
    const ruleDevices = all.length - derived - demo - wholeCount;
    $sh('#sh-status').textContent = `一键套餐完成：${result.executions.length} 条空间规则 → 规则设备 ${ruleDevices} 台${derived ? ` + 衍生轨道 ${derived} 条` : ''}${demo ? ` + Demo 灯组 ${demo} 台` : ''}${wholeCount ? ` + 全屋网络基础包 ${wholeCount} 台` : ''}，待处理 ${pending} 台（缺少安装条件或候选点）；锁定项保留`;
  }

  function refreshRule() {
    const box = $sh('#sh-rule');
    if (ui.sel?.kind !== 'furn') { box.style.display = 'none'; return; }
    const f = getF(ui.sel.id);
    if (!f || !f.type?.startsWith('dev:')) { box.style.display = 'none'; return; }
    const project = buildProject();
    const device = toPlacedDevice(f, project.rooms);
    const info = window.SmartHomeRules.explainDevice(device, project, lastResult);
    const control = controlBindings().byDevice.get(f.id);
    if (control) {
      info.why = info.why || [];
      info.why.push(`该${control.label}绑定回路：${control.circuitIds.join(' / ')}（模拟绑定，可在下方试验开关）。`);
    }
    const lightCollisions = lightingCollisionsFor(f);
    if (lightCollisions.length) {
      info.why.push(`照明碰撞：${lightCollisions.map(c => `${c.obstacle.type === 'ac' ? '空调' : c.obstacle.type === 'curtain_box' ? '窗帘盒' : '检修口'}（${c.severity === 'BODY' ? '体块重叠' : '净距不足'}）`).join('；')}，需调整灯位或障碍物。`);
    }
    box.style.display = 'block';
    const status = f.smart?.status || 'manual';
    const locked = !!f.smart?.locked;
    const binding = isWholeHouseDevice(f) ? '全屋基础包' : (f.smart?.binding?.name || info.rule?.anchor?.raw || '尚未绑定具体目标');
    const roomId = roomOf(f.cx, f.cy).id;
    const lineId = f.smart?.quote?.lineId;
    const line = lineId ? deviceItems().filter(x => x.smart?.quote?.lineId === lineId) : [f];
    const inputQty = f.smart?.quote?.inputQuantity || line.length || 1;
    const placedQty = line.filter(x => x.smart?.status === 'placed' || x.smart?.status === 'fallback').length;
    const pendingQty = line.filter(x => x.smart?.status === 'pending').length;
    const derivedQty = deviceItems().filter(x =>
      x.smart?.ruleCode === f.smart?.ruleCode && roomOf(x.cx, x.cy).id === roomId && isDerivedDevice(x),
    ).length;
    const controlPower = control ? control.circuitIds.map(id => circuitPowerOn(id) ? '1' : '0').join('') : '';
    const signature = [f.id, status, locked, inputQty, placedQty, pendingQty, derivedQty, info.code, controlPower].join('|');
    if (box.dataset.signature === signature) return;
    box.dataset.signature = signature;
    box.classList.toggle('expanded', ruleExpanded);
    const why = (info.why || []).map(w => `<li>${escapeHtml(w)}</li>`).join('');
    // 规则卡完整展示（容器自身滚动）：P0 的“回路/调光、UGR”等状态不能被截断在 8 行之后。
    const rows = (info.rows || []).map(r => `<div><span>${escapeHtml(r.label)}</span> <b>${escapeHtml(r.value)}</b></div>`).join('');
    box.innerHTML = `<div class="sh-rule-head"><div><b>${escapeHtml(info.kindLabel)} · ${escapeHtml(info.code)}</b><div>${escapeHtml(info.title)} · ${escapeHtml(info.subtitle)}</div>
      <div class="sh-balance"><span>报价输入 ${inputQty} 件</span><span>对账 ${inputQty} = ${placedQty} + ${pendingQty}</span>${derivedQty ? `<span>衍生轨道 ${derivedQty}</span>` : ''}<span class="${status === 'pending' ? 'pending' : status === 'fallback' ? 'fallback' : 'placed'}">${status === 'pending' ? '待处理' : status === 'fallback' ? '降级落位' : status === 'manual' ? '待布点' : status === 'adjusted' ? '人工调整' : '已落位'}</span><span>绑定：${escapeHtml(binding)}</span></div></div>
      <button data-rule-toggle>${ruleExpanded ? '收起' : '展开'}</button></div>
      <div class="sh-rule-body">${why ? `<ol>${why}</ol>` : ''}${rows}${control ? `<div class="sh-control-bind">控制回路：${control.circuitIds.map(id => `<b>${escapeHtml(id)}</b>`).join(' / ')} · ${escapeHtml(control.label)}</div>` : ''}
      <div class="sh-rule-actions"><button data-smart-action="lock" class="${locked ? 'on' : ''}">${locked ? '已锁定（重排保留）' : '锁定此设备'}</button><button data-smart-action="repoint">重新布置此设备</button>${control ? `<button data-smart-action="power">${control.circuitIds.every(id => circuitPowerOn(id)) ? '关闭此开关回路' : '打开此开关回路'}</button>` : ''}</div></div>`;
    const toggleBtn = box.querySelector('[data-rule-toggle]');
    toggleBtn.onclick = () => {
      ruleExpanded = !ruleExpanded;
      box.classList.toggle('expanded', ruleExpanded);
      toggleBtn.textContent = ruleExpanded ? '收起' : '展开';
    };
    const lockBtn = box.querySelector('[data-smart-action="lock"]');
    lockBtn.onclick = () => {
      f.smart = f.smart || {};
      f.smart.locked = !f.smart.locked;
      saveSafe(); renderAll(); refreshPicked(); refreshRule();
      toastSafe(f.smart.locked ? '设备已锁定，后续重排会保留当前位置' : '设备已解锁');
    };
    const repointBtn = box.querySelector('[data-smart-action="repoint"]');
    repointBtn.onclick = () => { f.smart = f.smart || {}; f.smart.locked = false; runPlaceExisting(); select({ kind: 'furn', id: f.id }); };
    const powerBtn = box.querySelector('[data-smart-action="power"]');
    if (powerBtn && control) {
      powerBtn.onclick = () => {
        const allOn = control.circuitIds.every(id => circuitPowerOn(id));
        toggleCircuitPower(control.circuitIds, !allOn);
        box.dataset.signature = '';
        refreshRule();
      };
    }
  }

  function escapeHtml(s) {
    return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  $sh('#sh-place').onclick = runPlaceExisting;
  $sh('#sh-package').onclick = runPackage;
  $sh('#sh-clear').onclick = clearDevices;
  panel.querySelectorAll('[data-filter]').forEach(b => b.onclick = () => {
    pendingOnly = b.dataset.filter === 'pending';
    refreshPicked();
  });

  const originalSelect = window.select;
  window.select = function (sel) {
    originalSelect(sel);
    window.__renderLightObstacles?.();
    const f = sel?.kind === 'furn' ? getF(sel.id) : null;
    // 取消选择（清空设备、点空白）时保持当前 Tab，避免把用户从智能布点工作流踢回属性面板。
    if (f && f.type?.startsWith('dev:')) setRightTab('smart');
    else if (sel?.kind === 'furn' || sel?.kind === 'room') setRightTab('attr');
    ruleExpanded = false;
    const box = $sh('#sh-rule');
    if (box) delete box.dataset.signature;
    setTimeout(refreshRule, 0);
  };

  setInterval(() => { refreshRule(); }, 800);
  refreshPicked();
  window.addEventListener('qone-project-loaded', () => {
    lastResult = null;
    renderAll();
    refreshPicked();
    refreshRule();
    window.__renderLightObstacles?.();
  });

  const demoParams = new URLSearchParams(location.search);
  if (demoParams.get('lib') === 'smart') setLibTab('smart');
  const initialTab = demoParams.get('rtab');
  if (['smart', 'zone', 'circuit'].includes(initialTab)) setRightTab(initialTab);
  if (demoParams.get('smartdemo') === '1') {
    setTimeout(() => {
      ['筒灯', '射灯', '开关面板', '灯槽灯带'].forEach(k => addDevice(k));
      runPlaceExisting();
      setTimeout(() => {
        const first = deviceItems()[0];
        if (first) select({ kind: 'furn', id: first.id });
      }, 300);
    }, 700);
  }
  if (demoParams.get('stripdemo') === '1') {
    setTimeout(() => {
      addDevice('灯槽灯带');
      addDevice('轨道射灯 · 轨道');
      runPlaceExisting();
      setTimeout(() => {
        const strip = deviceItems().find(f => deviceKeyOf(f) === '灯槽灯带');
        if (strip) select({ kind: 'furn', id: strip.id });
      }, 300);
    }, 700);
  }
  if (demoParams.get('rectdemo') === '1') {
    setTimeout(() => {
      addDevice('口字灯带');
      runPlaceExisting();
      setTimeout(() => {
        const rect = deviceItems().find(f => deviceKeyOf(f) === '口字灯带');
        if (rect) select({ kind: 'furn', id: rect.id });
      }, 300);
    }, 700);
  }
  if (demoParams.get('package') === '1') {
    setTimeout(runPackage, 700);
  }
  const pkgRuns = Number(demoParams.get('packagetest') || 0);
  for (let i = 0; i < pkgRuns; i++) setTimeout(runPackage, 700 + i * 500);
  if (demoParams.get('view') === '3d') {
    let tries = 0;
    const timer = setInterval(() => {
      if (window.View3D?.enter) {
        clearInterval(timer);
        if (window.setView) window.setView('3d');
        else window.View3D.enter();
      }
      if (++tries > 30) clearInterval(timer);
    }, 300);
  }

  /* ---------------- 3D device builder ---------------- */
  function buildLamp(g, key, def, w, d, f, fp3d) {
    const { box, rbox, cyl, lathe, rod, tube, blob, ring, mat, glowMat, darker, lighter } = fp3d;
    const c = f.color || colorFor(key);
    const z = f.smart?.z ? f.smart.z / 1000 : null;
    const k = key;
    const cct = f.smart?.lighting?.cct || 3500;
    const glowHex = cct <= 3000 ? '#ffd2a0' : cct >= 4000 ? '#e8f3ff' : '#ffe4c2';
    if (k === '吸顶灯') {
      const r = Math.min(w, d) / 2, CY = z ?? 2.76;
      g.add(cyl(r, r * .98, .035, mat(lighter(c, .15), { roughness: .45 }), 0, CY, 0, 44));
      g.add(cyl(r * .9, r * .7, .12, glowMat('#fffdf6', glowHex, .8), 0, CY - .12, 0, 44));
      g.add(ring(r * .99, .01, mat('#d9d4ca', { metalness: .4, roughness: .4 }), 0, CY + .035, 0));
      g.add(blob(r * .16, .02, r * .16, glowMat('#ffffff', glowHex, 1.5), 0, CY - .085, 0, 16));
      return;
    }
    if (k === '面板灯' || k === '格栅灯') {
      g.add(rbox(w, .022, d, mat('#eeece6', { roughness: .35 }), 0, (z ?? 2.752), 0, .006));
      g.add(box(w * .92, .012, d * .92, glowMat('#fffdf8', glowHex, .95), 0, (z ?? 2.752) - .008, 0));
      return;
    }
    if (k === '吊灯') {
      const lm = mat('#4a4641', { metalness: .5, roughness: .4 }), gr = glowMat('#fffdf6', glowHex, 1.1);
      const top = z ?? 2.8, yb = top - .75;
      const head = (px, pz) => {
        g.add(rod([0, top - .02, 0], [px, yb + .3, pz], .005, lm));
        g.add(lathe([[.235, 0], [.2, .08], [.06, .26], [.02, .3]], mat(darker(c, .25), { metalness: .35, roughness: .45 }), px, yb, pz, 40));
        g.add(blob(.05, .05, .05, gr, px, yb + .2, pz, 16));
      };
      g.add(cyl(.07, .09, .03, lm, 0, top - .03, 0, 24));
      if (w >= .6) {
        const rr = Math.min(w, d) * .3;
        [30, 150, 270].forEach(a => head(Math.cos(a * Math.PI / 180) * rr, Math.sin(a * Math.PI / 180) * rr));
      } else head(0, 0);
      return;
    }
    if (k === '筒灯' || k === '射灯' || k === '轨道射灯 · 灯头' || k.includes('磁吸') && k.includes('灯体')) {
      const r = Math.min(w, d) / 2;
      const y = z ?? 2.755;
      g.add(ring(r, .012, mat('#2e2e30', { roughness: .4 }), 0, y, 0));
      g.add(cyl(r * .86, r * .72, .07, mat('#3a3a3c', { roughness: .45 }), 0, y - .065, 0, 24));
      g.add(cyl(r * .62, r * .62, .01, glowMat('#fffaf0', glowHex, 1.3), 0, y - .07, 0, 24));
      return;
    }
    if (k === '轨道射灯 · 轨道' || k.includes('磁吸轨道')) {
      const mm2 = mat('#1f1f22', { roughness: .45, metalness: .25 }), gr = glowMat('#fffaf0', glowHex, 1.15);
      const y = z ?? 2.75;
      g.add(box(w, .03, Math.max(.05, d * .5), mm2, 0, y, 0));
      const n = Math.max(2, Math.round(w / .45));
      for (let i = 0; i < n; i++) {
        const px = -w / 2 + w / n * (i + .5);
        g.add(box(.045, .16, .045, mm2, px, y - .16, 0));
        const hd = cyl(.05, .055, .14, mm2, px, y - .25, 0, 20);
        hd.rotation.x = .55;
        g.add(hd, blob(.04, .012, .04, gr, px, y - .28, .06, 14));
      }
      return;
    }
    if (k === '壁灯') {
      const mm2 = mat(darker(c, .8), { metalness: .35, roughness: .45 }), gr = glowMat('#fff6e0', glowHex, 1.05);
      const y0 = z ?? 1.75;
      g.add(box(w * .3, .07, d * .28, mm2, 0, y0, -d * .36));
      g.add(lathe([[.02, 0], [.09, .01], [.13, .14]], gr, 0, y0 - .1, -d * .14, 32));
      g.add(blob(.042, .05, .042, glowMat('#ffffff', glowHex, 1.4), 0, y0 - .04, -d * .14, 14));
      return;
    }
    if (k === '落地灯') {
      const r = Math.min(w, d) / 2, lm = mat(c, { roughness: .35, metalness: .5 });
      g.add(lathe([[0, 0], [r * .55, 0], [r * .58, .012], [r * .5, .03], [.02, .035]], lm, 0, 0, 0, 40), rod([0, .03, 0], [0, 1.36, 0], .011, lm));
      g.add(lathe([[r * .85, 0], [r * .55, .36]], glowMat('#f6ecd9', glowHex, .45), 0, 1.22, 0, 48), blob(.035, .035, .035, glowMat('#fff', glowHex, 1.2), 0, 1.36, 0, 12));
      g.add(ring(r * .85, .004, lm, 0, 1.22, 0), ring(r * .55, .004, lm, 0, 1.58, 0));
      return;
    }
    if (k === '台灯') {
      const r = Math.min(w, d) / 2;
      g.add(lathe([[0, 0], [r * .92, 0], [r * .96, .02], [r * .5, .05], [r * .2, .07]], mat('#6b5b46', { roughness: .45 }), 0, 0, 0, 36));
      g.add(cyl(r * .09, r * .11, .32, mat(darker(c, .35), { roughness: .4 }), 0, .07, 0, 20));
      g.add(lathe([[.66 * r, 0], [.62 * r, .08], [.44 * r, .26], [.06 * r, .32]], glowMat('#fffaf0', glowHex, .95), 0, .4, 0, 40));
      g.add(blob(r * .13, .02, r * .13, glowMat('#ffffff', glowHex, 1.5), 0, .5, 0, 14));
      return;
    }
    if (['直线灯带', '贴墙灯带', '灯槽灯带', '窗帘灯带', '柜体灯带'].includes(k)) {
      const th = Math.max(.014, Math.min(w, d)), L = Math.max(w, d), vert = d > w;
      const y = z ?? (k.includes('柜体') ? .95 : k.includes('窗帘') ? 2.42 : k.includes('贴墙') ? 1.8 : 2.3);
      const col = glowMat('#fff7e2', glowHex, 1.1);
      g.add(box(vert ? th : L, .012, vert ? L : th, col, 0, y, 0));
      return;
    }
    const r = Math.min(w, d) / 2;
    const y = z ?? 2.755;
    g.add(ring(r, .012, mat('#2e2e30', { roughness: .4 }), 0, y, 0));
    g.add(cyl(r * .7, r * .6, .06, glowMat('#fffaf0', glowHex, 1.1), 0, y - .065, 0, 24));
  }

  window.__smartHomeBuildDevice = function (g, f, fp3d, buildBase) {
    const key = deviceKeyOf(f);
    const def = DEVICE_BY_KEY[key];
    if (!def || !fp3d) return;
    const w = f.w / 1000, d = f.d / 1000;
    if (def.category1 === '灯光' && BASE_LIGHT_TYPE[key]) {
      buildLamp(g, key, def, w, d, f, fp3d);
      if (f.smart?.power === 'off') {
        g.traverse(o => {
          if (o.material?.emissiveIntensity) {
            o.material = o.material.clone();
            o.material.emissiveIntensity *= .12;
          }
        });
      }
      return;
    }
    const { box, rbox, cyl, mat, glowMat, THREE } = fp3d;
    const isLight = def.category1 === '灯光';
    const body = mat('#2a2f36', { roughness: 0.45, metalness: 0.25 });
    const glow = glowMat('#fff4d6', '#ffd08a', .65);
    const v = def.visual;
    const before = g.children.length;
    if (v === 'line') {
      g.add(box(w, .03, Math.max(.04, d), body, 0, 0, 0));
      g.add(box(w * .98, .012, Math.max(.02, d * .5), glow, 0, -.024, 0));
    } else if (v === 'rect') {
      const h = Math.max(.4, d);
      g.add(box(w, .03, .035, body, 0, 0, -h / 2), box(w, .03, .035, body, 0, 0, h / 2));
      g.add(box(.035, .03, h, body, -w / 2, 0, 0), box(.035, .03, h, body, w / 2, 0, 0));
      g.add(box(w, .012, .02, glow, 0, -.024, -h / 2), box(w, .012, .02, glow, 0, -.024, h / 2));
    } else if (v === 'track') {
      g.add(box(w, .035, Math.max(.06, d), body, 0, 0, 0));
      for (const k of [.2, .4, .6, .8]) g.add(cyl(.055, .055, .07, body, -w / 2 + w * k, -.05, 0, 16));
    } else if (v === 'array' || v === 'pointRect') {
      const pts = v === 'array' ? [[-w / 3.2, 0], [0, 0], [w / 3.2, 0]] : [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]];
      for (const [x, z] of pts) {
        g.add(cyl(.09, .09, .05, body, x, 0, z, 18));
        g.add(cyl(.055, .055, .012, glow, x, -.03, z, 18));
      }
    } else if (def.category1 === '控制') {
      // 开关/情景面板是竖直贴墙的薄板，不是水平凸出的台面。
      const pw = Math.max(w, .06), ph = Math.max(d, .06), pd = .012;
      const plate = mat('#e5dfd4', { roughness: .5 });
      g.add(box(pw, ph, pd, plate, 0, 0, 0));
      g.add(box(pw * .62, ph * .42, .004, mat('#26313a', { emissive: '#6fa8d6', emissiveIntensity: .35 }), 0, ph * .12, -pd / 2 - .002));
      g.add(box(pw * .36, .008, .002, mat('#101214', { emissive: '#7fe08a', emissiveIntensity: .7 }), 0, -ph * .22, -pd / 2 - .003));
    } else if (def.category1 === '环境') {
      g.add(cyl(.08, .1, .045, body, 0, 0, 0, 24));
      g.add(cyl(.035, .035, .01, glow, 0, -.026, 0, 20));
    } else if (def.category1 === '安防监控') {
      g.add(cyl(.06, .08, .09, body, 0, 0, 0, 20));
      g.add(cyl(.028, .028, .012, mat('#1c242c', { emissive: '#6fa8d6', emissiveIntensity: .3 }), 0, -.045, .02, 16));
    } else if (def.category1 === '音乐') {
      g.add(cyl(.12, .12, .035, body, 0, 0, 0, 32));
      for (let i = 0; i < 6; i++) g.add(cyl(.005, .005, .008, glow, -.06 + i * .024, -.02, 0, 8));
    } else if (def.category1 === '暖通') {
      g.add(box(Math.max(.7, w), .22, .25, mat('#f1f1ee', { roughness: .4 }), 0, 0, 0));
      g.add(box(Math.max(.6, w * .9), .012, .02, mat('#4a5058', { roughness: .5 }), 0, -.11, .04));
    } else if (def.category2.includes('吊灯')) {
      g.add(cyl(.012, .012, .55, body, 0, -.55, 0, 8));
      g.add(cyl(.28, .05, .3, glow, 0, -.32, 0, 32));
    } else if (def.category2.includes('面板灯') || def.category2.includes('格栅灯')) {
      g.add(box(.52, .035, .52, body, 0, 0, 0));
      g.add(box(.46, .012, .46, glow, 0, -.024, 0));
    } else {
      g.add(cyl(.09, .09, .06, body, 0, 0, 0, 20));
      g.add(cyl(.055, .055, .012, glow, 0, -.03, 0, 18));
    }
    // 3D 高度必须优先使用规则/布点算出的实际安装高度 f.smart.z；
    // 不能用产品目录的默认 mount 兜底，否则同一台吸顶安装的传感器/喇叭会被放到 1.3m 悬空。
    const mountedY = f.smart?.z != null ? f.smart.z / 1000 : null;
    let baseY = mountedY ?? (def.mount === 'CL' ? 2.6 : def.mount === 'WL' ? 2.4 : def.mount === 'BL' ? .95 : def.mount === 'FL' ? 0 : 1.3);
    if (mountedY == null && def.category1 === '暖通') baseY = 2.2;
    // 墙面控制面板：按最近墙面把面板背板推到墙内表面，避免离墙 2~3cm 悬空。
    if (def.category1 === '控制') {
      const room = roomOf(f.cx, f.cy);
      if (room?.poly?.length) {
        const xs = room.poly.map(p => p[0]), ys = room.poly.map(p => p[1]);
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const edges = [
          { d: f.cy - y0, dx: 0, dz: -1 }, { d: y1 - f.cy, dx: 0, dz: 1 },
          { d: f.cx - x0, dx: -1, dz: 0 }, { d: x1 - f.cx, dx: 1, dz: 0 },
        ].sort((a, b) => a.d - b.d);
        const gap = edges[0].d - 100 - 6;   // 100mm 墙厚 + 6mm 半板厚
        if (gap >= 0 && gap <= 150) g.userData.wallNudge = { x: edges[0].dx * gap / 1000, z: edges[0].dz * gap / 1000 };
      }
    }
    for (let i = before; i < g.children.length; i++) g.children[i].position.y += baseY;
  };

  /* ---------------- night lights: only smart lighting devices ---------------- */
  // 底座不再自带灯具。夜景照明按“空间内已布点的智能灯具”聚合出一个柔和点光源，
  // 数量越多亮度越高；没有灯具的空间保持暗场，避免出现无法解释的幽灵灯。
  window.__smartHomeNightLights = function () {
    const CCT_COLOR = { 3000: '#ffd2a1', 3500: '#ffe2c2', 4000: '#eef6ff' };
    const byGroup = new Map();
    for (const f of deviceItems()) {
      const def = DEVICE_BY_KEY[deviceKeyOf(f)];
      if (def?.category1 !== '灯光') continue;
      if (f.smart?.status === 'pending') continue;   // 待处理设备未确认安装，不参与照明聚合
      if (f.smart?.power === 'off') continue;        // 回路关灯后不再贡献夜景光源
      const meta = lightingOf(f) || { layer: 'base', cct: 3500 };
      const room = roomOf(f.cx, f.cy);
      const key = `${room.id}|${meta.layer}`;
      const g = byGroup.get(key) || { room, layer: meta.layer, cct: meta.cct, n: 0, x: 0, y: 0 };
      g.n += 1; g.x += f.cx; g.y += f.cy;
      // 同一房间同一层以主要色温为准；任务灯优先 4000K，重点灯 3000K。
      if (meta.layer === 'task') g.cct = 4000;
      else if (meta.layer === 'accent') g.cct = 3000;
      byGroup.set(key, g);
    }
    return [...byGroup.values()].map(g => {
      const roomArea = Math.max(1, area(g.room.poly));
      const weight = g.layer === 'task' ? .55 : g.layer === 'accent' ? .7 : .9;
      return {
        roomId: g.room.id,
        layer: g.layer,
        x: g.x / g.n,
        y: g.y / g.n,
        z: g.layer === 'task' ? 1.7 : g.layer === 'accent' ? 2.2 : 2.35,
        count: g.n,
        cct: g.cct,
        color: CCT_COLOR[g.cct] || '#ffe2c2',
        distance: Math.max(3.2, Math.min(9, Math.sqrt(roomArea) * 2.2)),
        intensity: Math.max(1.2, Math.min(8, (2.2 + g.n * .16) * weight)),
      };
    });
  };

  console.log('[smart-home] ready', { devices: DEVICES.length, rules: window.SmartHomeRules.allRules().length });
})();

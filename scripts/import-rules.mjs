import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'data', 'rules.source.csv');
const outJson = path.join(root, 'src', 'data', 'rules.generated.json');
const outCsv = path.join(root, 'src', 'data', 'rules-coverage.csv');

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ',') { row.push(field); field = ''; }
    else if (ch === '\n') { row.push(field); field = ''; rows.push(row); row = []; }
    else if (ch !== '\r') field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.length > 1);
}

function clean(s) {
  return String(s ?? '').replace(/`/g, '').trim();
}

function numbers(text) {
  return [...String(text).matchAll(/-?\d+(?:\.\d+)?/g)].map(m => Number(m[0]));
}

const FURNITURE_WORDS = {
  bed: ['床垫', '床区', '床正上方', '床头', '床两侧', '床侧', '床尾', '床下沿'],
  nightstand: ['床头柜'],
  wardrobe: ['衣柜', '衣帽间', '柜体', '层板', '柜内', '挂衣杆'],
  diningTable: ['餐桌'],
  teaTable: ['茶台'],
  desk: ['书桌'],
  bookshelf: ['书柜'],
  tvCabinet: ['电视柜', '电视墙', '电视'],
  sofa: ['沙发'],
  toilet: ['马桶'],
  vanity: ['浴室柜', '镜柜', '镜面', '梳妆台', '穿衣镜', '镜前'],
  shower: ['淋浴', '浴缸'],
  shoeCabinet: ['鞋柜'],
  kitchenCounter: ['操作台', '台面', '水槽', '灶台', '备餐区', '操作区'],
  upperCabinet: ['吊柜'],
  sideboard: ['餐边柜'],
  displayCabinet: ['博古架'],
  washingMachine: ['洗衣机'],
  dryingRack: ['晾衣'],
};

function furnitureTypesFrom(text) {
  const found = [];
  for (const [type, words] of Object.entries(FURNITURE_WORDS)) {
    if (words.some(w => text.includes(w))) found.push(type);
  }
  return [...new Set(found)];
}

function parseHeight(text, fallbackMount) {
  const s = clean(text);
  let base = fallbackMount;
  if (s.includes('CL')) base = 'CL';
  else if (s.includes('WL')) base = 'WL';
  else if (s.includes('BL') || s.includes('柜底') || s.includes('桌面') || s.includes('台面')) base = 'BL';
  else if (s.includes('FL') || s.includes('距地')) base = 'SL';
  const ns = numbers(s);
  if (!ns.length) return { base, offset: 0 };
  if (s.includes('~')) {
    const lo = Math.min(...ns);
    const hi = Math.max(...ns);
    return { base, offset: Math.round((lo + hi) / 2), min: lo, max: hi };
  }
  return { base, offset: ns[0] };
}

function parseQuantity(text) {
  const s = clean(text);
  const flags = [];
  if (s.includes('~') || s.includes('或') || s.includes('可')) flags.push('OPTIONAL_OR_RANGE');
  if (s.includes('FIXED')) {
    const ns = numbers(s);
    const min = ns.length > 1 ? Math.min(...ns) : ns[0] ?? 1;
    const max = ns.length > 1 ? Math.max(...ns) : ns[0] ?? 1;
    return { spec: { kind: 'fixed', value: max, min, raw: s }, flags };
  }
  if (s.includes('0.8') && s.includes('4√S')) {
    return { spec: { kind: 'stripPerimeter', factor: 0.8, min: 2, raw: s }, flags };
  }
  if (s === 'PER_OPENING' || s.startsWith('PER_OPENING')) {
    return { spec: { kind: 'perOpening', value: 1, target: 'window', raw: s }, flags };
  }
  if (s.startsWith('PER_MEASURED_LENGTH')) {
    const measure = /单条\/双条/.test(s) ? 'track'
      : /窗宽/.test(s) ? 'window'
      : /柜内层板|吊柜|镜柜/.test(s) ? 'cabinet'
      : /背景墙/.test(s) ? 'wall'
      : /布置后路径长/.test(s) ? 'perimeter'
      : /路径|过道长/.test(s) ? 'path'
      : 'room';
    const factorMatch = s.match(/×\s*([\d.]+)/);
    const spec = {
      kind: 'measuredLength',
      measure,
      factor: factorMatch ? Number(factorMatch[1]) : 1,
      raw: s,
    };
    if (measure === 'track') {
      spec.value = 2;
      spec.min = 1;
      spec.max = 2;
    }
    return { spec, flags: [...flags, 'MEASURED_AFTER_LAYOUT'] };
  }
  if (s.includes('层板') || s.includes('挂衣杆')) {
    return { spec: { kind: 'cabinetLength', min: 1, raw: s }, flags: [...flags, 'CABINET_LENGTH'] };
  }
  if (s.includes('建筑面积/60')) {
    return { spec: { kind: 'wholeHouseArea', value: 60, min: 1, raw: s }, flags };
  }
  if (s.includes('建筑面积/80')) {
    return { spec: { kind: 'wholeHouseArea', value: 80, min: 1, raw: s }, flags };
  }
  const isPer = s.startsWith('PER_');
  if (isPer || s.includes('max(') || s.includes('ceil(') || s.includes('floor(')) {
    const even = s.includes('even(');
    const round = s.includes('floor(') ? 'floor' : 'ceil';
    const minMatch = s.match(/max\(\s*(\d+)\s*,/);
    const min = minMatch ? Number(minMatch[1]) : undefined;
    let kind = 'generic';
    let value = 1;
    let target = undefined;
    if (s.includes('窗宽')) {
      kind = 'perLength';
      target = 'window';
      value = 1;
    } else if (s.includes('吊柜')) {
      kind = 'perLength';
      target = 'furniture:upperCabinet';
      value = 1;
    } else if (s.includes('S/')) {
      kind = 'perArea';
      const m = s.match(/S\s*\/\s*(\d+(?:\.\d+)?|\d*\.\d+)/);
      value = m ? Number(m[1]) : 2.5;
    } else if (s.includes('L/') || s.includes('W/')) {
      kind = 'perLength';
      const m = s.match(/[LW]\s*\/\s*(\d+(?:\.\d+)?|\d*\.\d+)/);
      value = m ? Number(m[1]) : 1;
    } else if (s.includes('窗') && s.includes('/窗')) {
      kind = 'perOpening';
      target = 'window';
    } else if (s.includes('床头柜') || s.includes('书桌') || s.includes('浴室柜') || s.includes('马桶') || s.includes('淋浴')) {
      kind = 'perFurniture';
      const fts = furnitureTypesFrom(s);
      if (fts.length) return { spec: { kind, value: 1, max: 2, furnitureTypes: fts, min: 0, raw: s }, flags };
    }
    if (kind !== 'generic') return { spec: { kind, value, min, max: undefined, even, round, target, raw: s }, flags };
  }
  if (s.includes('1/窗') || s.includes('/窗')) {
    return { spec: { kind: 'perOpening', value: 1, target: 'window', raw: s }, flags };
  }
  if (s.includes('1/门') || s.includes('/门')) {
    return { spec: { kind: 'perOpening', value: 1, target: 'door', raw: s }, flags };
  }
  const fts = furnitureTypesFrom(s);
  if (s.includes('/') && fts.length) {
    return { spec: { kind: 'perFurniture', value: 1, max: 4, furnitureTypes: fts, raw: s }, flags };
  }
  const ns = numbers(s);
  if (ns.length) {
    return { spec: { kind: 'fixed', value: Math.max(...ns), min: Math.min(...ns), raw: s }, flags: [...flags, 'GENERIC_COUNT'] };
  }
  return { spec: { kind: 'generic', value: 1, raw: s }, flags: [...flags, 'GENERIC_COUNT'] };
}

function parseAnchor(text, quantityText = '') {
  const s = clean(text);
  const flags = [];
  if (s.includes('轨道上') || s.includes('轨道等距')) {
    return { spec: { kind: 'hostTrack', raw: s }, flags };
  }
  if (s.includes('最大内接矩形') && (s.includes('双列') || s.includes('列间距'))) {
    return { spec: { kind: 'inscribedGrid', rows: 2, rowGap: 500, colGap: 800, offset: 300, raw: s }, flags };
  }
  if (s.includes('最大内接矩形')) {
    return { spec: { kind: 'inscribedRectCenter', raw: s }, flags };
  }
  if (s.includes('四周') || s.includes('回字') || s.includes('四周灯槽')) {
    return { spec: { kind: 'perimeter', offset: 100, raw: s }, flags: [...flags, 'PERIMETER'] };
  }
  if (s.includes('门') && (s.includes('内侧') || s.includes('门旁') || s.includes('门侧') || s.includes('门套'))) {
    return { spec: { kind: 'doorSideWall', offset: 175, raw: s }, flags };
  }
  if (s.includes('窗') && (s.includes('窗帘盒') || s.includes('窗顶') || s.includes('窗宽') || s.includes('每窗'))) {
    return { spec: { kind: 'windowHead', raw: s }, flags };
  }
  if (s.includes('床头柜') || s.includes('床头两侧') || s.includes('双侧床头')) {
    return { spec: { kind: 'furniturePair', furnitureTypes: ['nightstand'], target: 'nightstand', raw: s }, flags };
  }
  const fts = furnitureTypesFrom(s);
  if (fts.length && (s.includes('中心') || s.includes('正上方') || s.includes('上方') || s.includes('覆盖'))) {
    return { spec: { kind: 'furnitureCenter', furnitureTypes: fts, target: fts[0], raw: s }, flags };
  }
  if (fts.length && (s.includes('前沿') || s.includes('层板') || s.includes('柜内') || s.includes('台面') || s.includes('墙面') || s.includes('吊柜下'))) {
    return { spec: { kind: 'furnitureEdge', furnitureTypes: fts, target: fts[0], raw: s }, flags };
  }
  if (s.includes('电视墙')) {
    return { spec: { kind: 'furnitureEdge', furnitureTypes: ['TV'], target: 'tv', raw: s }, flags };
  }
  if (s.includes('墙') && (s.includes('距墙') || s.includes('墙面') || s.includes('墙段') || s.includes('侧墙') || s.includes('外墙') || s.includes('对侧墙'))) {
    return { spec: { kind: 'wallOffset', offset: 300, raw: s }, flags };
  }
  if (s.includes('端景') || s.includes('挂画') || s.includes('装饰画')) {
    return { spec: { kind: 'wallOffset', offset: 250, raw: s }, flags };
  }
  if (s.includes('与开关并排') || s.includes('门扇外侧')) {
    return { spec: { kind: 'doorSideWall', offset: 175, raw: s }, flags };
  }
  if (s.includes('同客厅')) {
    return { spec: { kind: 'wallOffset', offset: 300, raw: s }, flags };
  }
  if (s.includes('长轴') || s.includes('中心线') || s.includes('一字') || s.includes('中轴')) {
    return { spec: { kind: 'longAxisLine', raw: s }, flags };
  }
  if (s.includes('路径')) {
    return { spec: { kind: 'pathLine', raw: s }, flags };
  }
  if (s.includes('全屋')) {
    return { spec: { kind: 'wholeHouse', raw: s }, flags };
  }
  if (s.includes('房间中心') || s.includes('中心')) {
    return { spec: { kind: 'roomCenter', raw: s }, flags };
  }
  if (quantityText.includes('/窗')) {
    return { spec: { kind: 'windowHead', raw: s }, flags };
  }
  return { spec: { kind: 'roomCenter', raw: s }, flags: [...flags, 'GENERIC_ANCHOR'] };
}

function priorityFor(device, usage, anchor) {
  const t = `${device} ${usage} ${anchor}`;
  if (/床头|马桶|浴室柜|淋浴|灶台|水槽|书桌|餐桌|茶台|入户|鞋柜|电视墙/.test(t)) return 'P1';
  if (/筒灯|射灯|吸顶灯|吊灯|面板灯|格栅灯|开关面板|网关/.test(device)) return 'P2';
  if (/灯带|磁吸|轨道|喇叭|摄像头|传感器/.test(device)) return 'P3';
  if (/落地灯|无线开关|智能音箱|壁灯/.test(device)) return 'P4';
  return 'P2';
}

function collisionFor(text) {
  const s = clean(text);
  const out = [];
  if (s.includes('门')) out.push('DOOR_SWING');
  if (s.includes('窗')) out.push('WINDOW');
  if (s.includes('梁') || s.includes('吊顶')) out.push('BEAM');
  if (s.includes('风管') || s.includes('出风口')) out.push('AC_OUTLET');
  if (s.includes('检修') || s.includes('喷淋') || s.includes('烟感')) out.push('CEILING_HATCH');
  if (s.includes('电视') || s.includes('屏幕')) out.push('TV_SCREEN');
  if (s.includes('灶台')) out.push('STOVE');
  if (s.includes('淋浴')) out.push('WET_ZONE');
  if (s.includes('晾衣')) out.push('DRYING_RACK');
  if (s.includes('燃气') || s.includes('等电位')) out.push('GAS_PIPE');
  return out.length ? out : ['NONE'];
}

function parseSpacing(text) {
  const ns = numbers(text);
  return ns.length ? Math.min(...ns) : 0;
}

function fallbackFor(text) {
  const s = clean(text);
  const out = [];
  if (s.includes('减量')) out.push('REDUCE');
  if (s.includes('单列')) out.push('SINGLE_ROW');
  if (s.includes('单边')) out.push('SINGLE_SIDE');
  if (s.includes('取消')) out.push('REMOVE');
  if (s.includes('改')) out.push('ALTERNATE_DEVICE');
  return out.length ? out : ['REDUCE'];
}

const text = fs.readFileSync(source, 'utf8').replace(/^\uFEFF/, '');
const rows = parseCsv(text);
const header = rows.shift();
const idx = Object.fromEntries(header.map((h, i) => [clean(h), i]));
const rules = [];

for (const r of rows) {
  const pointCode = clean(r[idx.point_code]);
  if (!/^[A-Z]{2,5}-[A-Z]{2}-\d{2}$/.test(pointCode)) continue;
  const spaceCode = clean(r[idx.space_code]);
  const spaceName = clean(r[idx.space_name]);
  const deviceType2 = clean(r[idx.device_type2]);
  const deviceCanonical = idx.device_canonical != null ? clean(r[idx.device_canonical]) : '';
  const usage = clean(r[idx.device_usage]);
  const quantityText = clean(r[idx.quantity]);
  const anchorText = clean(r[idx.anchor_offset]);
  const mountText = clean(r[idx.mount_height]);
  const deviceMount = /灯带|灯槽|柜体/.test(deviceType2) ? 'BL'
    : /窗帘|卷帘/.test(deviceType2) ? 'WL'
    : /落地灯|柜式空调|智能音箱/.test(deviceType2) ? 'FL'
    : /面板|开关|传感器|摄像头|门锁|中控屏|空调/.test(deviceType2) ? 'SL'
    : 'CL';
  const q = parseQuantity(quantityText);
  const a = parseAnchor(anchorText, quantityText);
  const height = parseHeight(mountText, deviceMount);
  const flags = [...new Set([...q.flags, ...a.flags])];
  if (q.spec.kind === 'generic') flags.push('GENERIC_COUNT');
  if (a.spec.kind === 'roomCenter' && flags.includes('GENERIC_ANCHOR')) flags.push('GENERIC_ANCHOR');
  if (flags.length) flags.push('DEMO_DEFAULT');
  rules.push({
    pointCode,
    spaceCode,
    spaceName,
    deviceType2,
    deviceCanonical: deviceCanonical || undefined,
    usage,
    mount: height.base,
    height: { base: height.base, offset: height.offset, min: height.min, max: height.max },
    anchor: a.spec,
    quantity: q.spec,
    spacing: parseSpacing(clean(r[idx.spacing])),
    priority: priorityFor(deviceType2, usage, anchorText),
    collision: collisionFor(clean(r[idx.collision])),
    fallback: fallbackFor(clean(r[idx.fallback])),
    sourceText: clean(r[idx.quantity]),
    traceFlags: [...new Set(flags)],
  });
}

fs.mkdirSync(path.dirname(outJson), { recursive: true });
fs.writeFileSync(outJson, JSON.stringify(rules, null, 2), 'utf8');

const csvLines = [
  'point_code,space_code,device_type2,status,anchor_kind,quantity_kind,trace_flags,source_text',
  ...rules.map(r => [
    r.pointCode, r.spaceCode, r.deviceType2, 'executed', r.anchor.kind, r.quantity.kind,
    r.traceFlags.join('|'), r.sourceText,
  ].map(v => `"${String(v).replaceAll('"', '""')}"`).join(',')),
];
fs.writeFileSync(outCsv, `\uFEFF${csvLines.join('\r\n')}`, 'utf8');

console.log(`rules=${rules.length}`);
console.log(`spaces=${new Set(rules.map(r => r.spaceCode)).size}`);
console.log(`devices=${new Set(rules.map(r => r.deviceType2)).size}`);
console.log(`out=${outJson}`);

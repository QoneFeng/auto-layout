/**
 * 生成照明 Demo 的模拟数据包。
 *
 * 重要：这里生成的产品、IES/LDT、现场尺寸、回路、DALI 地址和场景表全部是
 * 模拟数据，只用于把 Demo 的数据链路和缺口展示跑通，不能用于真实选品、
 * 施工、照度计算或验收。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const VERSION = '20261030-v1';
const OUT_DIR = path.join(ROOT, 'data', 'demo-lighting', VERSION);
const IES_DIR = path.join(OUT_DIR, 'ies');
const LDT_DIR = path.join(OUT_DIR, 'ldt');
const BROWSER_DATA = path.join(ROOT, 'app', 'data', 'demo-lighting-data.js');

const SPACES = [
  { code: 'KT', name: '客厅' },
  { code: 'CT', name: '餐厅' },
  { code: 'ZW', name: '主卧' },
  { code: 'SF', name: '书房' },
  { code: 'WS', name: '卧室' },
  { code: 'LRF', name: '老人房' },
  { code: 'XHF', name: '儿童房' },
  { code: 'XCW', name: '玄关' },
  { code: 'CF', name: '厨房' },
  { code: 'WSJ', name: '卫生间' },
  { code: 'GDYT', name: '过道' },
  { code: 'YT', name: '阳台' },
  { code: 'YMJ', name: '衣帽间' },
  { code: 'WSWSJ', name: '卧室卫生间' },
  { code: 'CS', name: '茶室' },
];

const PROTOCOLS = ['DALI', '0-10V', 'KNX', '无线'];

const product = (p) => ({
  brand: 'DEMO Lighting',
  source: 'simulated',
  photometryStatus: 'synthetic',
  protocols: PROTOCOLS,
  dimmingProtocols: ['DALI', '0-10V'],
  cri: 90,
  ip: 'IP20',
  salesUnit: 'piece',
  ...p,
});

const PRODUCTS = [
  product({
    key: '筒灯', productId: 'SIM-DL-9W-3000K', model: 'SIM-DL-9W',
    category: '筒灯', watt: 9, lumen: 810, cct: 3000, beam: 60, ugr: 18,
    notes: '模拟 9W 深防眩筒灯，IES/LDT 为合成配光。',
  }),
  product({
    key: '射灯', productId: 'SIM-SP-7W-3000K', model: 'SIM-SP-7W',
    category: '射灯', watt: 7, lumen: 620, cct: 3000, beam: 24, ugr: 16,
    notes: '模拟 7W 窄光束射灯，用于重点/洗墙示意。',
  }),
  product({
    key: '吸顶灯', productId: 'SIM-CL-24W-3500K', model: 'SIM-CL-24W',
    category: '吸顶灯', watt: 24, lumen: 2200, cct: 3500, beam: 110, ugr: 22,
    notes: '模拟 24W 吸顶灯，宽配光。',
  }),
  product({
    key: '吊灯', productId: 'SIM-PD-32W-3000K', model: 'SIM-PD-32W',
    category: '吊灯', watt: 32, lumen: 2600, cct: 3000, beam: 90, ugr: 19,
    notes: '模拟 32W 餐吊/装饰吊灯。',
  }),
  product({
    key: '面板灯', productId: 'SIM-PL-36W-4000K', model: 'SIM-PL-36W',
    category: '面板灯', watt: 36, lumen: 3200, cct: 4000, beam: 110, ugr: 19,
    notes: '模拟 600×600 面板灯。',
  }),
  product({
    key: '格栅灯', productId: 'SIM-GR-24W-4000K', model: 'SIM-GR-24W',
    category: '格栅灯', watt: 24, lumen: 2400, cct: 4000, beam: 90, ugr: 19,
    notes: '模拟格栅灯，用于厨房/卫生间。',
  }),
  product({
    key: '壁灯', productId: 'SIM-WL-8W-3000K', model: 'SIM-WL-8W',
    category: '壁灯', watt: 8, lumen: 520, cct: 3000, beam: 60, ugr: 19,
    notes: '模拟床头/过道壁灯。',
  }),
  product({
    key: '台灯', productId: 'SIM-TL-8W-4000K', model: 'SIM-TL-8W',
    category: '台灯', watt: 8, lumen: 600, cct: 4000, beam: 60, ugr: 19,
    notes: '模拟阅读台灯，任务照明。',
  }),
  product({
    key: '落地灯', productId: 'SIM-FL-10W-3000K', model: 'SIM-FL-10W',
    category: '落地灯', watt: 10, lumen: 800, cct: 3000, beam: 60, ugr: 19,
    notes: '模拟阅读落地灯，任务照明。',
  }),
  product({
    key: '磁吸泛光灯 · 灯体', productId: 'SIM-MG-12W-3000K', model: 'SIM-MG-12W',
    category: '磁吸泛光灯', watt: 12, lumen: 1000, cct: 3000, beam: 36, ugr: 19,
    notes: '模拟磁吸泛光灯模块。',
  }),
  product({
    key: '磁吸格栅灯 · 灯体', productId: 'SIM-MGG-12W-4000K', model: 'SIM-MGG-12W',
    category: '磁吸格栅灯', watt: 12, lumen: 1000, cct: 4000, beam: 36, ugr: 19,
    notes: '模拟磁吸格栅灯模块。',
  }),
  product({
    key: '轨道射灯 · 灯头', productId: 'SIM-TH-9W-3000K', model: 'SIM-TH-9W',
    category: '轨道射灯灯头', watt: 9, lumen: 850, cct: 3000, beam: 24, ugr: 16,
    notes: '模拟轨道射灯灯头。',
  }),
  product({
    key: '灯槽灯带', productId: 'SIM-LS-6W/M-3000K', model: 'SIM-LS-6W/M',
    category: '灯槽灯带', watt: 6, lumen: 600, cct: 3000, beam: 120, ugr: 22,
    salesUnit: 'meter', notes: '模拟 6W/m 灯槽灯带，按实测米数计量。',
  }),
  product({
    key: '窗帘灯带', productId: 'SIM-CLS-6W/M-3000K', model: 'SIM-CLS-6W/M',
    category: '窗帘灯带', watt: 6, lumen: 600, cct: 3000, beam: 120, ugr: 22,
    salesUnit: 'meter', notes: '模拟 6W/m 窗帘灯带，按窗宽计量。',
  }),
  product({
    key: '柜体灯带', productId: 'SIM-CB-6W/M-3000K', model: 'SIM-CB-6W/M',
    category: '柜体灯带', watt: 6, lumen: 500, cct: 3000, beam: 120, ugr: 22,
    salesUnit: 'meter', notes: '模拟 6W/m 柜体灯带，按柜体长边计量。',
  }),
  product({
    key: '直线灯带', productId: 'SIM-SL-6W/M-3000K', model: 'SIM-SL-6W/M',
    category: '直线灯带', watt: 6, lumen: 600, cct: 3000, beam: 120, ugr: 22,
    salesUnit: 'meter', notes: '模拟 6W/m 直线灯带。',
  }),
  product({
    key: '贴墙灯带', productId: 'SIM-WSL-6W/M-3000K', model: 'SIM-WSL-6W/M',
    category: '贴墙灯带', watt: 6, lumen: 600, cct: 3000, beam: 120, ugr: 22,
    salesUnit: 'meter', notes: '模拟 6W/m 贴墙灯带。',
  }),
  product({
    key: '轨道射灯 · 轨道', productId: 'SIM-TRACK-1M', model: 'SIM-TRACK-1M',
    category: '轨道', watt: 0, lumen: 0, cct: null, beam: null, ugr: null,
    salesUnit: 'meter', photometryStatus: 'not_applicable', protocols: [], dimmingProtocols: [],
    notes: '被动轨道载体，无独立配光；按模块/米计价。',
  }),
  product({
    key: '磁吸泛光灯 · 磁吸轨道', productId: 'SIM-MTRACK-1M', model: 'SIM-MTRACK-1M',
    category: '磁吸轨道', watt: 0, lumen: 0, cct: null, beam: null, ugr: null,
    salesUnit: 'meter', photometryStatus: 'not_applicable', protocols: [], dimmingProtocols: [],
    notes: '被动磁吸轨道载体，无独立配光；按模块/米计价。',
  }),
  product({
    key: '磁吸格栅灯 · 磁吸轨道', productId: 'SIM-MTRACK-1M', model: 'SIM-MTRACK-1M',
    category: '磁吸轨道', watt: 0, lumen: 0, cct: null, beam: null, ugr: null,
    salesUnit: 'meter', photometryStatus: 'not_applicable', protocols: [], dimmingProtocols: [],
    notes: '被动磁吸轨道载体，无独立配光；按模块/米计价。',
  }),
];

// 2026-10-30 全屋套餐实测的照明控制组；规则大改后需要重新采集。
const CIRCUIT_GROUPS = [
  ['KT', 'base', 24], ['KT', 'task', 3], ['KT', 'accent', 6],
  ['CT', 'base', 10], ['CT', 'task', 1], ['CT', 'accent', 5],
  ['ZW', 'base', 12], ['ZW', 'task', 3], ['ZW', 'accent', 3],
  ['SF', 'base', 11], ['SF', 'task', 3], ['SF', 'accent', 4],
  ['WS', 'base', 12], ['WS', 'task', 2], ['WS', 'accent', 3],
  ['LRF', 'base', 12], ['LRF', 'accent', 3],
  ['XHF', 'base', 10], ['XHF', 'task', 1], ['XHF', 'accent', 1],
  ['XCW', 'base', 6], ['XCW', 'accent', 1],
  ['CF', 'base', 5], ['CF', 'task', 2],
  ['WSJ', 'base', 5], ['WSJ', 'task', 2], ['WSJ', 'accent', 2],
  ['GDYT', 'base', 14], ['GDYT', 'accent', 1],
  ['YT', 'base', 4],
  ['YMJ', 'base', 7], ['YMJ', 'task', 1], ['YMJ', 'accent', 6],
  ['WSWSJ', 'base', 3], ['WSWSJ', 'task', 2], ['WSWSJ', 'accent', 1],
  ['CS', 'base', 7], ['CS', 'accent', 7],
];

const OBSTACLE_TEMPLATES = {
  KT: {
    ac: { present: true, type: 'cabinet', width: 520, depth: 520, height: 1800, z0: 0, z1: 1800, wall: 'west', along: 0.82, clearance: 120 },
    curtainBox: { present: true, depth: 240, z0: 2380, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.12, ry: 0.18 },
    note: '演示实测：柜机 520×520×1800，窗帘盒 240mm，检修口靠西侧墙角。',
  },
  CT: {
    ac: { present: true, type: 'wall', width: 900, depth: 230, height: 280, z0: 2300, z1: 2580, wall: 'east', along: 0.18, clearance: 100 },
    curtainBox: { present: true, depth: 240, z0: 2380, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.86, ry: 0.18 },
    note: '演示实测：挂机 900×230×280，窗帘盒 240mm，检修口靠东侧墙角。',
  },
  ZW: {
    ac: { present: true, type: 'wall', width: 900, depth: 230, height: 280, z0: 2300, z1: 2580, wall: 'east', along: 0.78, clearance: 100 },
    curtainBox: { present: true, depth: 220, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: false, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.8, ry: 0.2 },
    note: '演示实测：主卧挂机 900×230×280，窗帘盒 220mm，无独立检修口。',
  },
  SF: {
    ac: { present: true, type: 'wall', width: 900, depth: 230, height: 280, z0: 2300, z1: 2580, wall: 'west', along: 0.16, clearance: 100 },
    curtainBox: { present: true, depth: 220, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: false, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.2, ry: 0.2 },
    note: '演示实测：书房挂机靠西墙，窗帘盒 220mm，无独立检修口。',
  },
  WS: {
    ac: { present: true, type: 'wall', width: 900, depth: 230, height: 280, z0: 2300, z1: 2580, wall: 'east', along: 0.8, clearance: 100 },
    curtainBox: { present: true, depth: 220, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: false, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.8, ry: 0.2 },
    note: '演示实测：卧室挂机靠东墙，窗帘盒 220mm。',
  },
  LRF: {
    ac: { present: true, type: 'wall', width: 900, depth: 230, height: 280, z0: 2300, z1: 2580, wall: 'west', along: 0.8, clearance: 100 },
    curtainBox: { present: true, depth: 220, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: false, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.2, ry: 0.2 },
    note: '演示实测：老人房挂机靠西墙，窗帘盒 220mm。',
  },
  XHF: {
    ac: { present: true, type: 'wall', width: 900, depth: 230, height: 280, z0: 2300, z1: 2580, wall: 'east', along: 0.2, clearance: 100 },
    curtainBox: { present: true, depth: 220, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: false, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.8, ry: 0.2 },
    note: '演示实测：儿童房挂机靠东墙，窗帘盒 220mm。',
  },
  XCW: {
    ac: { present: false, type: null, width: 0, depth: 0, height: 0, z0: 0, z1: 0, wall: null, along: 0, clearance: 100 },
    curtainBox: { present: true, depth: 180, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.18, ry: 0.18 },
    note: '演示实测：玄关窗帘盒 180mm，检修口靠入口墙角；无空调。',
  },
  CF: {
    ac: { present: false, type: null, width: 0, depth: 0, height: 0, z0: 0, z1: 0, wall: null, along: 0, clearance: 100 },
    curtainBox: { present: true, depth: 180, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.84, ry: 0.84 },
    note: '演示实测：厨房窗帘盒 180mm，检修口靠灶台侧墙角；无空调。',
  },
  WSJ: {
    ac: { present: false, type: null, width: 0, depth: 0, height: 0, z0: 0, z1: 0, wall: null, along: 0, clearance: 100 },
    curtainBox: { present: true, depth: 160, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.18, ry: 0.82 },
    note: '演示实测：卫生间窗帘盒 160mm，检修口靠马桶侧；无空调。',
  },
  GDYT: {
    ac: { present: false, type: null, width: 0, depth: 0, height: 0, z0: 0, z1: 0, wall: null, along: 0, clearance: 100 },
    curtainBox: { present: false, depth: 0, z0: 0, z1: 0, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.72, ry: 0.45 },
    note: '演示实测：过道检修口居中偏东；无窗、无空调。',
  },
  YT: {
    ac: { present: false, type: null, width: 0, depth: 0, height: 0, z0: 0, z1: 0, wall: null, along: 0, clearance: 100 },
    curtainBox: { present: true, depth: 200, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.15, ry: 0.5 },
    note: '演示实测：阳台窗帘盒 200mm，检修口靠西侧；无空调。',
  },
  YMJ: {
    ac: { present: false, type: null, width: 0, depth: 0, height: 0, z0: 0, z1: 0, wall: null, along: 0, clearance: 100 },
    curtainBox: { present: true, depth: 180, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.84, ry: 0.18 },
    note: '演示实测：衣帽间窗帘盒 180mm，检修口靠东侧墙角；无空调。',
  },
  WSWSJ: {
    ac: { present: false, type: null, width: 0, depth: 0, height: 0, z0: 0, z1: 0, wall: null, along: 0, clearance: 100 },
    curtainBox: { present: true, depth: 160, z0: 2400, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.18, ry: 0.82 },
    note: '演示实测：主卫窗帘盒 160mm，检修口靠马桶侧；无空调。',
  },
  CS: {
    ac: { present: true, type: 'wall', width: 900, depth: 230, height: 280, z0: 2300, z1: 2580, wall: 'north', along: 0.78, clearance: 100 },
    curtainBox: { present: true, depth: 240, z0: 2380, z1: 2800, clearance: 50 },
    accessPanel: { present: true, width: 600, depth: 600, z0: 2750, z1: 2800, clearance: 300, rx: 0.18, ry: 0.18 },
    note: '演示实测：茶室挂机靠北墙，窗帘盒 240mm，检修口靠西侧墙角。',
  },
};

const SCENE_DEFS = [
  { id: 'S01', name: '回家', description: '入口与主要空间基础照明渐亮', base: 80, task: 60, accent: 40, cct: 3500, fadeSec: 3 },
  { id: 'S02', name: '会客', description: '客厅/餐厅全亮，重点照明增强', base: 100, task: 80, accent: 70, cct: 3500, fadeSec: 2 },
  { id: 'S03', name: '观影', description: '客厅基础压暗，保留低位重点', base: 15, task: 0, accent: 10, cct: 2700, fadeSec: 4 },
  { id: 'S04', name: '就餐', description: '餐厅任务照明为主，周边基础辅助', base: 60, task: 100, accent: 50, cct: 3000, fadeSec: 2 },
  { id: 'S05', name: '睡眠', description: '卧室仅保留夜灯/低位重点', base: 0, task: 0, accent: 5, cct: 2700, fadeSec: 8 },
];

const TARGET_LUX = {
  KT: 150, CT: 200, ZW: 100, SF: 300, WS: 100, LRF: 150, XHF: 200, XCW: 100,
  CF: 300, WSJ: 200, GDYT: 100, YT: 100, YMJ: 150, WSWSJ: 200, CS: 150,
};
const UGR_LIMIT = {
  KT: 19, CT: 19, ZW: 19, SF: 19, WS: 19, LRF: 19, XHF: 19, XCW: 19,
  CF: 19, WSJ: 19, GDYT: 22, YT: 22, YMJ: 19, WSWSJ: 19, CS: 19,
};
const LPD_LIMIT = {
  KT: 6, CT: 6, ZW: 4, SF: 6, WS: 4, LRF: 4, XHF: 4, XCW: 5,
  CF: 7, WSJ: 6, GDYT: 4, YT: 4, YMJ: 4, WSWSJ: 6, CS: 5,
};

const LAYER_LABEL = { base: '基础照明', task: '任务照明', accent: '重点照明' };

function round(n, digits = 2) {
  const p = 10 ** digits;
  return Math.round(n * p) / p;
}

function intensities(product) {
  const beam = product.beam || 60;
  const angles = Array.from({ length: 19 }, (_, i) => i * 5);
  const raw = angles.map((a) => Math.exp(-Math.LN2 * (a / (beam / 2)) ** 2));
  let flux = 0;
  for (let i = 0; i < angles.length - 1; i++) {
    const t0 = (angles[i] * Math.PI) / 180;
    const t1 = (angles[i + 1] * Math.PI) / 180;
    flux += ((raw[i] * Math.sin(t0) + raw[i + 1] * Math.sin(t1)) / 2) * (t1 - t0);
  }
  flux *= 2 * Math.PI;
  const peak = flux > 0 ? product.lumen / flux : 0;
  return { angles, candela: raw.map((v) => Math.max(0, v * peak)) };
}

function iesFor(p) {
  const { angles, candela } = intensities(p);
  return [
    'IESNA:LM-63-2002',
    '[TEST] SYNTHETIC-DEMO-NOT-MEASURED',
    '[TESTLAB] DEMO-LIGHTING',
    '[MANUFAC] DEMO Lighting',
    '[ISSUEDATE] 2026-10-30',
    `[LUMINAIRE] ${p.model}`,
    `[LUMINAIRE CATALOG NUMBER] ${p.productId}`,
    `[DISTRIBUTION] synthetic ${p.beam}deg beam, DEMO ONLY`,
    'TILT=NONE',
    `1 ${p.lumen} 1 ${angles.length} 1 1 2 0.09 0.09 0`,
    `1 1 ${p.watt}`,
    angles.join(' '),
    '0',
    candela.map((v) => v.toFixed(2)).join(' '),
  ].join('\r\n') + '\r\n';
}

function ldtFor(p) {
  const { angles, candela } = intensities(p);
  const symmetry = p.salesUnit === 'meter' ? 2 : 1;
  const cAngles = symmetry === 2 ? [0, 90, 180] : [0];
  const values = [];
  for (const _c of cAngles) values.push(...candela.map((v) => v.toFixed(2)));
  return [
    'DEMO Lighting',
    'DEMO-SYNTHETIC-1.0',
    '2026-10-30',
    'Synthetic demo data - not a measurement',
    p.model,
    p.productId,
    `${p.productId}.ldt`,
    'demo / 2026-10-30',
    '90', '90', '90', '80', '80', '0', '1',
    '1', p.model, String(p.lumen), String(p.cct), String(p.cri), String(p.watt),
    '0', String(symmetry), '1', '0',
    String(cAngles.length), String(angles.length),
    cAngles.join(' '),
    angles.join(' '),
    ...values,
  ].join('\r\n') + '\r\n';
}

function csv(rows) {
  if (!rows.length) return '\uFEFF';
  const headers = Object.keys(rows[0]);
  const esc = (v) => {
    const s = String(v ?? '');
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return '\uFEFF' + [
    headers.join(','),
    ...rows.map((r) => headers.map((h) => esc(r[h])).join(',')),
  ].join('\r\n') + '\r\n';
}

function buildCircuits() {
  const circuits = [];
  let gateway = 1;
  let address = 0;
  let connected = 0;
  for (const [spaceCode, layer, count] of CIRCUIT_GROUPS) {
    if (address + count > 64) {
      gateway += 1;
      address = 0;
    }
    const space = SPACES.find((s) => s.code === spaceCode);
    const circuitId = `C-${spaceCode}-${layer.toUpperCase()}`;
    const loadW = count * (layer === 'base' ? 10 : 8);
    circuits.push({
      circuitId,
      spaceCode,
      spaceName: space.name,
      layer,
      layerLabel: LAYER_LABEL[layer],
      lightCount: count,
      breaker: 'RCBO 16A/30mA',
      phase: ['L1', 'L2', 'L3'][circuits.length % 3],
      driverModel: 'SIM-DALI-DRV-100W',
      driverQty: Math.max(1, Math.ceil(count / 8)),
      gatewayId: `DALI-GW-${String(gateway).padStart(2, '0')}`,
      daliUniverse: gateway,
      daliAddressStart: address,
      daliAddressEnd: address + count - 1,
      protocol: 'DALI',
      dimming: '1–100%（模拟）',
      maxLoadW: Math.max(100, loadW),
      connectedLoadW: loadW,
      sceneIds: SCENE_DEFS.map((s) => s.id),
    });
    address += count;
    connected += loadW;
  }
  return { circuits, gateways: gateway, totalLights: connected };
}

function buildScenes() {
  const scenes = [];
  for (const def of SCENE_DEFS) {
    const rows = [];
    for (const space of SPACES) {
      for (const layer of ['base', 'task', 'accent']) {
        let level = def[layer];
        let cct = def.cct;
        // 餐厅就餐场景提高任务照明；卧室睡眠场景压低基础与任务。
        if (def.id === 'S04' && space.code === 'CT' && layer === 'task') level = 100;
        if (def.id === 'S05' && ['ZW', 'WS', 'LRF', 'XHF'].includes(space.code) && layer === 'base') level = 0;
        if (def.id === 'S03' && space.code === 'KT' && layer === 'accent') level = 15;
        rows.push({
          sceneId: def.id,
          sceneName: def.name,
          spaceCode: space.code,
          spaceName: space.name,
          layer,
          layerLabel: LAYER_LABEL[layer],
          level,
          cct,
          fadeSec: def.fadeSec,
          description: def.description,
        });
      }
    }
    scenes.push({ ...def, rows });
  }
  return scenes;
}

function buildControls(circuits) {
  const bySpace = new Map();
  for (const c of circuits) {
    const list = bySpace.get(c.spaceCode) || [];
    list.push(c);
    bySpace.set(c.spaceCode, list);
  }
  const controls = [];
  for (const space of SPACES) {
    const list = (bySpace.get(space.code) || []).sort((a, b) => {
      const order = { base: 0, task: 1, accent: 2 };
      return (order[a.layer] ?? 9) - (order[b.layer] ?? 9);
    });
    const all = list.map(c => c.circuitId);
    const base = list.filter(c => c.layer === 'base').map(c => c.circuitId);
    const task = list.filter(c => c.layer === 'task').map(c => c.circuitId);
    const accent = list.filter(c => c.layer === 'accent').map(c => c.circuitId);
    // 一个回路对应一个开关按键；同一块多联面板可控制本空间多个回路。
    const switchIds = [...base, ...task, ...accent];
    const items = [
      {
        role: 'switch', label: '开关面板', deviceKey: '开关面板',
        buttonCount: Math.max(1, switchIds.length),
        buttons: switchIds.map((id, i) => ({ label: LAYER_LABEL[list.find(c => c.circuitId === id)?.layer] || `回路${i + 1}`, circuitId: id, action: 'toggle' })),
        circuitIds: switchIds,
      },
      {
        role: 'scene', label: '情景面板', deviceKey: '情景面板',
        buttonCount: SCENE_DEFS.length,
        sceneIds: SCENE_DEFS.map(s => s.id),
        circuitIds: all,
      },
      {
        role: 'wireless', label: '无线开关', deviceKey: '无线开关',
        buttonCount: 1, circuitIds: accent.length ? accent : all.slice(-1),
      },
      {
        role: 'dim', label: '调光旋钮', deviceKey: '调光旋钮',
        buttonCount: 1, circuitIds: base.length ? base : all.slice(0, 1),
      },
    ];
    if (['KT', 'XCW', 'CS'].includes(space.code)) {
      items.push({
        role: 'master', label: '中控屏', deviceKey: '中控屏',
        buttonCount: 1, sceneIds: SCENE_DEFS.map(s => s.id), circuitIds: all,
      });
    }
    controls.push({
      spaceCode: space.code,
      spaceName: space.name,
      controls: items.filter(x => x.circuitIds.length),
    });
  }
  return controls;
}

async function main() {
  await fs.mkdir(IES_DIR, { recursive: true });
  await fs.mkdir(LDT_DIR, { recursive: true });
  await fs.mkdir(path.dirname(BROWSER_DATA), { recursive: true });

  const productsByKey = {};
  const activeProducts = [];
  for (const p of PRODUCTS) {
    const fileBase = p.productId.replace(/[^A-Za-z0-9._-]+/g, '-');
    const item = {
      ...p,
      efficacy: p.lumen > 0 && p.watt > 0 ? round(p.lumen / p.watt, 1) : null,
      fileBase,
      iesFile: p.lumen > 0 ? `ies/${fileBase}.ies` : null,
      ldtFile: p.lumen > 0 ? `ldt/${fileBase}.ldt` : null,
    };
    productsByKey[p.key] = item;
    if (p.lumen > 0) {
      activeProducts.push(item);
      await fs.writeFile(path.join(IES_DIR, `${fileBase}.ies`), iesFor(p), 'utf8');
      await fs.writeFile(path.join(LDT_DIR, `${fileBase}.ldt`), ldtFor(p), 'utf8');
    }
  }

  const { circuits, gateways, totalLights } = buildCircuits();
  const circuitsBySpaceLayer = Object.fromEntries(
    circuits.map((c) => [`${c.spaceCode}:${c.layer}`, c]),
  );
  const scenes = buildScenes();
  const controls = buildControls(circuits);
  const controlsBySpace = Object.fromEntries(controls.map((c) => [c.spaceCode, c]));

  const obstacles = SPACES.map((s) => ({
    spaceCode: s.code,
    spaceName: s.name,
    source: 'simulated_survey',
    assumption: true,
    ...OBSTACLE_TEMPLATES[s.code],
  }));
  const obstaclesBySpace = Object.fromEntries(obstacles.map((o) => [o.spaceCode, o]));

  const standard = {
    project: {
      name: '演示项目 · 上海 226㎡ 大平层',
      location: '上海市',
      buildingType: '住宅',
      areaM2: 226.32,
      source: 'simulated_project_brief',
    },
    standard: {
      code: 'GB/T 50034-2024',
      name: '建筑照明设计标准',
      edition: '演示口径',
      note: '版本与限值需按项目所在地现行规范及审图口径复核，不作为正式设计依据。',
    },
    targets: Object.fromEntries(SPACES.map((s) => [s.code, {
      spaceName: s.name,
      targetLux: TARGET_LUX[s.code],
      ugr: UGR_LIMIT[s.code],
      ra: 80,
      lpd: LPD_LIMIT[s.code],
    }])),
    acceptance: [
      '照度实测值不低于设计值的 90%，且不低于标准值',
      'UGR 不大于本表限值；重点作业面显色指数 Ra≥80',
      '色容差≤5 SDCM，同空间色温偏差≤200K',
      '照明功率密度不高于本表 LPD 限值',
      '调光/场景联动逐回路验收，DALI 地址与场景表一致',
    ],
    protocols: PROTOCOLS,
    dimming: 'DALI 主推，0-10V/KNX/无线按产品与网关能力兼容',
    source: 'simulated_standard_profile',
  };

  const manifest = {
    version: VERSION,
    generatedAt: '2026-10-30',
    source: 'simulated',
    disclaimer: '全部为 Demo 模拟数据，不得用于真实选品、施工、照度计算或验收。',
    counts: {
      spaces: SPACES.length,
      products: PRODUCTS.length,
      activeProducts: activeProducts.length,
      passiveProducts: PRODUCTS.length - activeProducts.length,
      iesFiles: activeProducts.length,
      ldtFiles: activeProducts.length,
      obstacles: obstacles.length,
      circuits: circuits.length,
      circuitLights: CIRCUIT_GROUPS.reduce((s, x) => s + x[2], 0),
      gateways,
      scenes: scenes.length,
      sceneRows: scenes.reduce((s, x) => s + x.rows.length, 0),
      controlSpaces: controls.length,
      controls: controls.reduce((s, x) => s + x.controls.length, 0),
      controlBindings: controls.reduce((s, x) => s + x.controls.reduce((n, c) => n + c.circuitIds.length, 0), 0),
    },
    checks: {
      targetLuxSpaces: Object.keys(standard.targets).length,
      productKeys: Object.keys(productsByKey).length,
      allCircuitsHaveGateway: circuits.every((c) => !!c.gatewayId),
      daliAddressesWithin64: circuits.every((c) => c.daliAddressStart >= 0 && c.daliAddressEnd <= 63),
      circuitLightSum: circuits.reduce((s, c) => s + c.lightCount, 0),
      sceneRows: scenes.reduce((s, x) => s + x.rows.length, 0),
      controlsCoverAllCircuits: controls.every((s) => s.controls.some((c) => c.role === 'scene')),
    },
  };

  const data = { manifest, products: productsByKey, productsByKey, obstacles, obstaclesBySpace, circuits, circuitsBySpaceLayer, controls, controlsBySpace, scenes, standard };

  await fs.writeFile(path.join(OUT_DIR, 'products.json'), JSON.stringify(Object.values(productsByKey), null, 2), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'products.csv'), csv(Object.values(productsByKey).map((p) => ({
    key: p.key, productId: p.productId, model: p.model, watt: p.watt, lumen: p.lumen,
    efficacy: p.efficacy, cct: p.cct, beam: p.beam, ugr: p.ugr, cri: p.cri,
    protocols: p.protocols.join('|'), iesFile: p.iesFile || '', ldtFile: p.ldtFile || '',
    photometryStatus: p.photometryStatus, source: p.source,
  }))), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'obstacles.json'), JSON.stringify(obstacles, null, 2), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'obstacles.csv'), csv(obstacles.map((o) => ({
    spaceCode: o.spaceCode, spaceName: o.spaceName, acType: o.ac.type || '',
    acWidth: o.ac.width, acDepth: o.ac.depth, acHeight: o.ac.height,
    acZ0: o.ac.z0, acZ1: o.ac.z1, acWall: o.ac.wall || '', acAlong: o.ac.along,
    curtainDepth: o.curtainBox.depth, curtainZ0: o.curtainBox.z0, curtainZ1: o.curtainBox.z1,
    accessPanel: o.accessPanel.present ? 'Y' : 'N', accessWidth: o.accessPanel.width,
    accessDepth: o.accessPanel.depth, accessRx: o.accessPanel.rx, accessRy: o.accessPanel.ry,
    source: o.source, note: o.note,
  }))), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'circuits.json'), JSON.stringify(circuits, null, 2), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'circuits.csv'), csv(circuits), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'scenes.json'), JSON.stringify(scenes, null, 2), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'scenes.csv'), csv(scenes.flatMap((s) => s.rows)), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'controls.json'), JSON.stringify(controls, null, 2), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'controls.csv'), csv(controls.flatMap((s) => s.controls.map((c) => ({
    spaceCode: s.spaceCode, spaceName: s.spaceName, role: c.role, label: c.label,
    deviceKey: c.deviceKey, buttonCount: c.buttonCount,
    circuitIds: c.circuitIds.join('|'), sceneIds: (c.sceneIds || []).join('|'),
  })))), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'standard.json'), JSON.stringify(standard, null, 2), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');
  await fs.writeFile(path.join(OUT_DIR, 'combined.json'), JSON.stringify(data, null, 2), 'utf8');
  await fs.writeFile(
    BROWSER_DATA,
    `/* 自动生成：${VERSION}。全部为 Demo 模拟数据，勿手改；重新生成：npm run demo:lighting-data */\n` +
      `window.__DEMO_LIGHTING__ = ${JSON.stringify(data, null, 2)};\n`,
    'utf8',
  );

  console.log(JSON.stringify({
    output: path.relative(ROOT, OUT_DIR),
    browserData: path.relative(ROOT, BROWSER_DATA),
    counts: manifest.counts,
    checks: manifest.checks,
  }, null, 2));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

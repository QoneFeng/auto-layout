<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import DeviceIcon from './components/DeviceIcon.vue';
import PlanCanvas from './components/Plan2D/PlanCanvas.vue';
import RuleDetail from './components/RuleDetail.vue';
import SceneCanvas from './components/Scene3D/SceneCanvas.vue';
import { CATEGORY_ORDER, DEVICES_BY_CATEGORY, DEVICE_BY_KEY, SPACE_BY_CODE, SPACES } from './data/catalog';
import { DEMO_DEFAULTS, PENDING_BUSINESS_CONFIRMATION } from './data/defaults';
import { SAMPLE_BUILDERS, type SampleId } from './data/samples';
import {
  allRules, catalogDevicesForRule, placeExistingDevices, runLayout, rulesForDevice, rulesForSpace,
} from './core/engine';
import { ANCHOR_LABELS, explainDevice, explainNotes, ruleFlagText } from './core/explain';
import type {
  DeviceCategory1, DeviceDef, LayoutResult, PlacedDevice, PointRule, Project, RuleExecution, SpaceCode,
} from './types';
import { polygonArea, polygonCentroid } from './core/geometry';

const project = ref<Project>(SAMPLE_BUILDERS['demo-15spaces']());
const sampleId = ref<SampleId>('demo-15spaces');
const viewMode = ref<'2d' | '3d'>('2d');
const selectedRoomId = ref<string | null>(project.value.rooms[1]?.id ?? null);
const selectedDeviceId = ref<string | null>(null);
const layout = ref<LayoutResult | null>(null);
const running = ref(false);
const lightsOn = ref(false);
const showGrid = ref(true);
const showFurniture = ref(true);
const showDevices = ref(true);
const showGlow = ref(true);
const showLabels = ref(true);
const showWholeHouse = ref(true);
const visiblePriorities = ref<Record<string, boolean>>({ P1: true, P2: true, P3: true, P4: true });
const rightTab = ref<'space' | 'device' | 'rules' | 'summary'>('space');
const search = ref('');
const toast = ref('');
const lastAction = ref<'package' | 'place' | null>(null);
const planRef = ref<InstanceType<typeof PlanCanvas> | null>(null);
interface PickedProduct { deviceKey: string; roomId: string; qty: number }
const pickedProducts = ref<PickedProduct[]>([]);
const ruleDim = ref<'space' | 'device'>('space');
const expandedSpaceCode = ref<string | null>(null);
const expandedDeviceKey = ref<string | null>(null);
const expandedRuleCode = ref<string | null>(null);
const deviceCatFilter = ref<'全部' | DeviceCategory1>('全部');
const categoryFilters: Array<'全部' | DeviceCategory1> = ['全部', ...CATEGORY_ORDER];

const totalRules = allRules().length;
const totalDevices = DEVICES_BY_CATEGORY.reduce((s, g) => s + g.devices.length, 0);
const pickedTotal = computed(() => pickedProducts.value.reduce((s, p) => s + p.qty, 0));
const pickedForRoom = computed(() => pickedProducts.value.filter(p => p.roomId === selectedRoomId.value));
const selectedRoom = computed(() => project.value.rooms.find(r => r.id === selectedRoomId.value) ?? null);
const selectedDevice = computed(() =>
  [...project.value.devices, ...project.value.wholeHouseDevices].find(d => d.id === selectedDeviceId.value) ?? null
);
const roomDevices = computed(() => selectedRoom.value
  ? project.value.devices.filter(d => d.roomId === selectedRoom.value!.id)
  : []);
const roomRules = computed(() => selectedRoom.value ? rulesForSpace(selectedRoom.value.spaceCode) : []);
function executionFor(ruleCode: string, roomId?: string): RuleExecution | null {
  return layout.value?.executions.find(e => e.ruleCode === ruleCode && (!roomId || e.roomId === roomId)) ?? null;
}
const roomExecutions = computed(() => roomRules.value
  .map(r => executionFor(r.pointCode, selectedRoom.value?.id))
  .filter(Boolean) as RuleExecution[]);
const roomUnplaced = computed(() => (layout.value?.unplaced ?? []).filter(u => u.roomId === selectedRoom.value?.id));
const filteredGroups = computed(() => {
  const q = search.value.trim().toLowerCase();
  if (!q) return DEVICES_BY_CATEGORY;
  return DEVICES_BY_CATEGORY
    .map(g => ({ ...g, devices: g.devices.filter(d => d.category2.toLowerCase().includes(q) || d.role.toLowerCase().includes(q)) }))
    .filter(g => g.devices.length);
});
const stats = computed(() => {
  const placed = project.value.devices.length;
  const executed = layout.value?.executions.length ?? 0;
  const unplaced = layout.value?.unplaced.length ?? 0;
  const fallback = layout.value?.executions.filter(e => e.status === 'executed_with_fallback').length ?? 0;
  return { placed, executed, unplaced, fallback };
});
const roomArea = computed(() => selectedRoom.value ? polygonArea(selectedRoom.value.polygon) / 1e6 : 0);
const wholeArea = computed(() => project.value.rooms.reduce((s, r) => s + polygonArea(r.polygon) / 1e6, 0));
const deviceCounts = computed(() => {
  const map = new Map<string, { count: number; category: string }>();
  for (const d of project.value.devices) {
    const cur = map.get(d.deviceType2) ?? { count: 0, category: d.category1 };
    cur.count++;
    map.set(d.deviceType2, cur);
  }
  return [...map.entries()].sort((a, b) => b[1].count - a[1].count);
});
const categoryCounts = computed(() => {
  const map = new Map<string, number>();
  for (const d of project.value.devices) map.set(d.category1, (map.get(d.category1) ?? 0) + 1);
  return CATEGORY_ORDER.map(c => ({ category: c, count: map.get(c) ?? 0 }));
});
const spaceRuleSummary = computed(() => SPACES
  .map(s => {
    const rules = allRules().filter(r => r.spaceCode === s.code);
    const deviceTypes = new Set(rules.map(r => r.deviceType2));
    const rooms = project.value.rooms.filter(r => r.spaceCode === s.code);
    const placed = rooms.reduce((n, room) => n
      + rules.reduce((m, r) => m + (executionFor(r.pointCode, room.id)?.placedCount ?? 0), 0), 0);
    return { ...s, rules, ruleCount: rules.length, deviceTypeCount: deviceTypes.size, roomCount: rooms.length, placed };
  })
  .filter(s => s.rules.length));

interface DeviceRuleGroup {
  key: string;
  category1: DeviceCategory1 | '未匹配';
  category2: string;
  rules: PointRule[];
  spaces: Set<string>;
  placed: number;
}

const deviceRuleSummary = computed(() => {
  const map = new Map<string, DeviceRuleGroup>();
  for (const r of allRules()) {
    const defs = catalogDevicesForRule(r);
    const targets = defs.length
      ? defs
      : [{ key: `raw:${r.deviceType2}`, category1: '未匹配' as const, category2: r.deviceType2 }];
    for (const def of targets) {
      const g = map.get(def.key) ?? {
        key: def.key,
        category1: def.category1,
        category2: def.category2,
        rules: [],
        spaces: new Set<string>(),
        placed: 0,
      };
      if (!g.rules.includes(r)) g.rules.push(r);
      g.spaces.add(r.spaceCode);
      map.set(def.key, g);
    }
  }
  const catIndex = (c: string) => {
    const i = CATEGORY_ORDER.indexOf(c as DeviceCategory1);
    return i < 0 ? 99 : i;
  };
  return [...map.values()]
    .map(g => {
      g.rules.sort((a, b) => a.spaceCode.localeCompare(b.spaceCode) || a.pointCode.localeCompare(b.pointCode));
      g.placed = project.value.devices.filter(d => d.deviceKey === g.key).length;
      return g;
    })
    .filter(g => deviceCatFilter.value === '全部' || g.category1 === deviceCatFilter.value)
    .sort((a, b) => catIndex(a.category1) - catIndex(b.category1)
      || b.rules.length - a.rules.length
      || a.category2.localeCompare(b.category2));
});

const selectedDeviceExplanation = computed(() => selectedDevice.value
  ? explainDevice(selectedDevice.value, project.value, layout.value)
  : null);
const statusLabels: Record<string, string> = { placed: '已落位', fallback: '降级', pending: '待处理', adjusted: '人工调整', manual: '未布点' };
const deviceRuleTypeCount = computed(() => new Set(
  allRules().flatMap(r => catalogDevicesForRule(r).map(d => d.key)),
).size);

function setToast(msg: string) {
  toast.value = msg;
  window.setTimeout(() => { if (toast.value === msg) toast.value = ''; }, 2600);
}

function loadSample(id: SampleId) {
  sampleId.value = id;
  project.value = SAMPLE_BUILDERS[id]();
  layout.value = null;
  selectedDeviceId.value = null;
  selectedRoomId.value = project.value.rooms[1]?.id ?? project.value.rooms[0]?.id ?? null;
  lightsOn.value = false;
  rightTab.value = 'space';
  ruleDim.value = 'space';
  expandedSpaceCode.value = null;
  expandedDeviceKey.value = null;
  expandedRuleCode.value = null;
  setToast(id === 'demo-15spaces' ? '已载入 15 空间演示户型' : '已载入三室两厅示例户型');
}

function runAutoLayout(scope: 'all' | 'current' = 'all') {
  if (running.value) return;
  running.value = true;
  window.setTimeout(() => {
    try {
      const result = runLayout(project.value, {
        mode: scope === 'current' ? 'currentRoom' : 'all',
        roomId: selectedRoomId.value ?? undefined,
        preserveLocked: true,
      });
      layout.value = result;
      lastAction.value = 'package';
      project.value.devices = result.devices;
      project.value.wholeHouseDevices = result.wholeHouseDevices;
      // 套餐已经按规则生成整套设备，清空选品清单，避免后续一键布点重复补设备。
      pickedProducts.value = [];
      setToast(`套餐完成：${result.executions.length} 条规则，${result.devices.length} 个设备，${result.unplaced.length} 条未落位`);
    } finally {
      running.value = false;
    }
  }, 60);
}

function placeExisting(scope: 'all' | 'current' = 'all') {
  if (running.value) return;
  const manualCount = project.value.devices.filter(d => d.source === 'manual').length;
  if (!manualCount && !pickedTotal.value) {
    setToast('当前没有已选产品；请先从左侧点击加入清单，或直接拖入平面图');
    return;
  }
  running.value = true;
  window.setTimeout(() => {
    try {
      materializePicked(scope);
      const result = placeExistingDevices(project.value, {
        mode: scope === 'current' ? 'currentRoom' : 'all',
        roomId: selectedRoomId.value ?? undefined,
        sources: ['manual'],
      });
      layout.value = result;
      lastAction.value = 'place';
      project.value.devices = result.devices;
      setToast(`一键布点完成：${result.executions.reduce((s, e) => s + e.placedCount, 0)} 个已拖入设备，${result.executions.filter(e => e.status === 'executed_with_fallback').length} 组兜底`);
    } finally {
      running.value = false;
    }
  }, 60);
}

function moveDevice(payload: { id: string; x: number; y: number }) {
  const d = project.value.devices.find(x => x.id === payload.id);
  if (!d) return;
  d.position.x = payload.x;
  d.position.y = payload.y;
  d.source = 'manual';
  d.status = 'manual';
  setToast('已移动设备；重新布点时会保留锁定项');
}

function addDevice(payload: { deviceKey: string; x: number; y: number; roomId: string; silent?: boolean }) {
  const def = DEVICE_BY_KEY[payload.deviceKey];
  const room = project.value.rooms.find(r => r.id === payload.roomId);
  if (!def || !room) return;
  const d: PlacedDevice = {
    id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ruleCode: 'MANUAL',
    deviceKey: def.key,
    deviceType2: def.category2,
    category1: def.category1,
    roomId: room.id,
    roomName: room.name,
    position: { x: payload.x, y: payload.y, z: room.ceilingHeight - 50 },
    rotation: 0,
    mount: def.mount,
    priority: 'P4',
    visual: def.visual,
    glow: def.glow,
    size: def.size,
    status: 'manual',
    source: 'manual',
    locked: false,
    trace: { anchor: 'roomCenter', candidateRank: 0, fallbackStep: 0, confidence: 1, notes: ['MANUAL_PLACEMENT'], warnings: [] },
  };
  project.value.devices.push(d);
  if (!payload.silent) {
    selectedDeviceId.value = d.id;
    selectedRoomId.value = room.id;
    rightTab.value = 'device';
    setToast(`已手动添加 ${def.category2}`);
  }
}

function addDeviceFromLib(def: DeviceDef) {
  if (!selectedRoom.value) { setToast('请先选择一个空间'); return; }
  bumpPicked(def.key, selectedRoom.value.id, 1);
  setToast(`已加入清单：${def.category2}，点「一键布点」落位`);
}

function bumpPicked(deviceKey: string, roomId: string, delta: number) {
  const index = pickedProducts.value.findIndex(p => p.deviceKey === deviceKey && p.roomId === roomId);
  if (index >= 0) {
    const next = pickedProducts.value[index].qty + delta;
    if (next <= 0) pickedProducts.value.splice(index, 1);
    else pickedProducts.value[index].qty = next;
    return;
  }
  if (delta > 0) pickedProducts.value.push({ deviceKey, roomId, qty: delta });
}

function changePickedQty(p: PickedProduct, delta: number) {
  bumpPicked(p.deviceKey, p.roomId, delta);
}

function clearPicked() {
  pickedProducts.value = [];
  setToast('已清空选品清单');
}

function onAddDevice(payload: { deviceKey: string; x: number; y: number; roomId: string }) {
  bumpPicked(payload.deviceKey, payload.roomId, 1);
  addDevice(payload);
}

function materializePicked(scope: 'all' | 'current') {
  const rooms = scope === 'current' && selectedRoom.value ? [selectedRoom.value] : project.value.rooms;
  const roomIds = new Set(rooms.map(r => r.id));
  for (const entry of pickedProducts.value.filter(p => roomIds.has(p.roomId))) {
    const room = project.value.rooms.find(r => r.id === entry.roomId);
    if (!room) continue;
    const manual = project.value.devices.filter(d =>
      d.roomId === entry.roomId && d.deviceKey === entry.deviceKey && d.source === 'manual');
    const need = entry.qty - manual.length;
    if (need > 0) {
      const c = polygonCentroid(room.polygon);
      for (let i = 0; i < need; i++) {
        addDevice({
          deviceKey: entry.deviceKey,
          x: Math.round(c[0]),
          y: Math.round(c[1]),
          roomId: entry.roomId,
          silent: true,
        });
      }
    } else if (need < 0) {
      const removable = manual.filter(d => !d.locked).slice(entry.qty);
      const ids = new Set(removable.map(d => d.id));
      project.value.devices = project.value.devices.filter(d => !ids.has(d.id));
    }
  }
}

function onDragStart(e: DragEvent, def: DeviceDef) {
  e.dataTransfer?.setData('application/x-device-key', def.key);
  if (e.dataTransfer) e.dataTransfer.effectAllowed = 'copy';
}

function selectRoom(id: string) {
  selectedRoomId.value = id;
  selectedDeviceId.value = null;
  rightTab.value = 'space';
}
function selectDevice(id: string | null) {
  selectedDeviceId.value = id;
  if (id) {
    const d = [...project.value.devices, ...project.value.wholeHouseDevices].find(x => x.id === id);
    if (d && d.roomId !== '__whole') selectedRoomId.value = d.roomId;
    rightTab.value = 'device';
  }
}

function toggleSpace(code: string) {
  expandedSpaceCode.value = expandedSpaceCode.value === code ? null : code;
  expandedRuleCode.value = null;
  const room = project.value.rooms.find(r => r.spaceCode === code);
  if (room) selectedRoomId.value = room.id;
}

function toggleDeviceGroup(key: string) {
  expandedDeviceKey.value = expandedDeviceKey.value === key ? null : key;
  expandedRuleCode.value = null;
}

function toggleRule(code: string) {
  expandedRuleCode.value = expandedRuleCode.value === code ? null : code;
}

function spaceRulePlaced(rule: PointRule): number {
  return project.value.rooms
    .filter(r => r.spaceCode === rule.spaceCode)
    .reduce((n, room) => n + (executionFor(rule.pointCode, room.id)?.placedCount ?? 0), 0);
}
function spaceRuleStatus(rule: PointRule): string {
  const executions = project.value.rooms
    .filter(r => r.spaceCode === rule.spaceCode)
    .map(room => executionFor(rule.pointCode, room.id))
    .filter(Boolean) as RuleExecution[];
  if (!executions.length) return 'idle';
  if (executions.some(e => e.status === 'executed_with_fallback')) return 'executed_with_fallback';
  if (executions.every(e => e.status === 'skipped')) return 'skipped';
  return 'executed';
}

function openRuleSummary(code: string, kind: string) {
  rightTab.value = 'rules';
  if (kind === 'rule') {
    const rule = allRules().find(r => r.pointCode === code);
    if (rule) {
      ruleDim.value = 'space';
      expandedSpaceCode.value = rule.spaceCode;
      expandedDeviceKey.value = null;
      expandedRuleCode.value = rule.pointCode;
      const room = project.value.rooms.find(r => r.spaceCode === rule.spaceCode);
      if (room) selectedRoomId.value = room.id;
      return;
    }
  }
  ruleDim.value = 'device';
  expandedDeviceKey.value = selectedDevice.value?.deviceKey ?? null;
  expandedSpaceCode.value = null;
  expandedRuleCode.value = null;
}

function focusRule(code: string) {
  openRuleSummary(code, 'rule');
}

function toggleLock() {
  if (!selectedDevice.value) return;
  selectedDevice.value.locked = !selectedDevice.value.locked;
  setToast(selectedDevice.value.locked ? '已锁定，重排时保留' : '已解锁');
}
function deleteSelected() {
  if (!selectedDevice.value) return;
  project.value.devices = project.value.devices.filter(d => d.id !== selectedDevice.value!.id);
  project.value.wholeHouseDevices = project.value.wholeHouseDevices.filter(d => d.id !== selectedDevice.value!.id);
  selectedDeviceId.value = null;
  setToast('设备已删除');
}
function clearRoom() {
  if (!selectedRoom.value) return;
  project.value.devices = project.value.devices.filter(d => d.roomId !== selectedRoom.value!.id);
  setToast(`已清空 ${selectedRoom.value.name} 的设备`);
}
function changeSpaceType(code: SpaceCode) {
  if (!selectedRoom.value) return;
  selectedRoom.value.spaceCode = code;
  selectedRoom.value.name = SPACE_BY_CODE[code].name;
  selectedRoom.value.mode = SPACE_BY_CODE[code].defaultMode;
  setToast(`空间已改为 ${SPACE_BY_CODE[code].name}，请点「当前空间布点」或「当前空间套餐」`);
}
function setMode(mode: 'MAIN' | 'NO_MAIN' | 'MIXED') {
  if (!selectedRoom.value) return;
  selectedRoom.value.mode = mode;
  setToast(`方案模式：${mode}`);
}
async function saveLocal() {
  localStorage.setItem('auto-layout-project-v1', JSON.stringify(project.value));
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(project.value.id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(project.value),
    });
    setToast(res.ok ? '已保存到本地和服务端' : '已保存到浏览器本地（服务端返回异常）');
  } catch {
    setToast('已保存到浏览器本地（服务端未连接）');
  }
}
async function loadLocal() {
  try {
    const res = await fetch(`/api/projects/${encodeURIComponent(project.value.id)}`);
    if (res.ok) {
      project.value = await res.json();
      layout.value = null;
      selectedRoomId.value = project.value.rooms[0]?.id ?? null;
      setToast('已从服务端读取');
      return;
    }
  } catch {
    // fall through to localStorage
  }
  const raw = localStorage.getItem('auto-layout-project-v1');
  if (!raw) { setToast('没有本地保存'); return; }
  try {
    project.value = JSON.parse(raw);
    layout.value = null;
    selectedRoomId.value = project.value.rooms[0]?.id ?? null;
    setToast('已读取本地保存');
  } catch { setToast('本地保存解析失败'); }
}
function download(filename: string, content: string, type = 'application/json') {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
function exportJson() {
  download(`${project.value.id}.json`, JSON.stringify(project.value, null, 2));
  setToast('已导出项目 JSON');
}
function exportCsv() {
  const lines = ['room,device,rule,status,x,y'];
  for (const d of project.value.devices) lines.push([d.roomName, d.deviceType2, d.ruleCode, d.status, d.position.x, d.position.y].map(v => `"${String(v).replaceAll('"', '""')}"`).join(','));
  download(`${project.value.id}-devices.csv`, `\uFEFF${lines.join('\r\n')}`, 'text/csv');
  setToast('已导出设备清单 CSV');
}
function exportPng() {
  if (viewMode.value === '3d') {
    const canvas = document.querySelector('.scene-host canvas') as HTMLCanvasElement | null;
    if (!canvas) return;
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${project.value.id}-3d.png`;
    a.click();
    setToast('已导出 3D 截图');
    return;
  }
  const svg = document.querySelector('.plan') as SVGSVGElement | null;
  if (!svg) return;
  const text = new XMLSerializer().serializeToString(svg);
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 2400;
    canvas.height = Math.round(2400 * (project.value.height / project.value.width));
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = `${project.value.id}-2d.png`;
    a.click();
    setToast('已导出 2D 截图');
  };
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(text)}`;
}
function fitView() { planRef.value?.fit(); }

onMounted(() => {
  selectedRoomId.value = project.value.rooms.find(r => r.spaceCode === 'KT')?.id ?? project.value.rooms[0]?.id ?? null;
  const params = new URLSearchParams(window.location.search);
  if (params.get('view') === '3d') viewMode.value = '3d';
  if (params.get('lights') === '1') lightsOn.value = true;
  if (params.get('package') === '1') runAutoLayout('all');
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="btn home-btn" href="/" title="返回统一首页">⌂ 首页</a>
      <div class="brand">
        <div class="brand-mark">⌂</div>
        <div>
          <strong>全屋智能 · 自动布点</strong>
          <span>规则驱动的空间点位 Demo</span>
        </div>
      </div>
      <div class="topbar-center">
        <select class="sample-select" :value="sampleId" @change="loadSample(($event.target as HTMLSelectElement).value as SampleId)">
          <option value="demo-15spaces">15 空间演示户型</option>
          <option value="demo-3bed">三室两厅示例户型</option>
        </select>
        <div class="segmented">
          <button :class="{ on: viewMode === '2d' }" @click="viewMode = '2d'">2D 平面</button>
          <button :class="{ on: viewMode === '3d' }" @click="viewMode = '3d'">3D 场景</button>
        </div>
      </div>
      <div class="top-actions">
        <button class="btn primary" :disabled="running" title="只对当前图中已拖入的设备按规则计算点位" @click="placeExisting('all')">
          {{ running ? '处理中…' : '一键布点' }}
        </button>
        <button class="btn" :disabled="running" title="按 183 条规则生成整套设备" @click="runAutoLayout('all')">一键套餐</button>
        <button class="btn" :class="{ on: lightsOn }" @click="lightsOn = !lightsOn">{{ lightsOn ? '关闭点亮' : '点亮' }}</button>
        <button class="btn" @click="fitView">适应窗口</button>
        <button class="btn" @click="saveLocal">保存</button>
        <button class="btn" @click="loadLocal">读取</button>
        <button class="btn" @click="exportJson">导出 JSON</button>
        <button class="btn" @click="exportPng">导出 PNG</button>
      </div>
    </header>

    <div class="workspace">
      <aside class="left-panel">
        <div class="panel-head">
          <div>
            <h2>设备库</h2>
            <p>{{ totalDevices }} 个设备 · {{ CATEGORY_ORDER.length }} 个一级分类 · 拖入平面图或点击添加</p>
          </div>
          <span class="pill">{{ totalRules }} 条规则</span>
        </div>
        <div class="picked-box">
          <div class="picked-head">
            <span>已选产品</span>
            <b>{{ pickedTotal }} 件</b>
            <button v-if="pickedProducts.length" class="picked-clear" @click="clearPicked">清空</button>
          </div>
          <div v-if="!pickedProducts.length" class="picked-empty">点击设备库加入清单，或直接拖入平面图</div>
          <div v-else class="picked-list">
            <div v-for="p in pickedProducts" :key="`${p.roomId}-${p.deviceKey}`" class="picked-row">
              <span class="picked-name">{{ DEVICE_BY_KEY[p.deviceKey]?.category2 ?? p.deviceKey }}</span>
              <small>{{ project.rooms.find(r => r.id === p.roomId)?.name ?? p.roomId }}</small>
              <div class="qty">
                <button @click="changePickedQty(p, -1)">−</button>
                <b>{{ p.qty }}</b>
                <button @click="changePickedQty(p, 1)">+</button>
              </div>
            </div>
          </div>
        </div>
        <input v-model="search" class="search" placeholder="搜索设备 / 功能…" />
        <div class="device-groups">
          <section v-for="group in filteredGroups" :key="group.category" class="device-group">
            <div class="group-title">
              <span>{{ group.category }}</span>
              <small>{{ group.devices.length }}</small>
            </div>
            <div class="device-grid">
              <button
                v-for="def in group.devices"
                :key="def.key"
                class="device-item"
                draggable="true"
                :title="`${def.category2} · ${def.role}`"
                @dragstart="onDragStart($event, def)"
                @click="addDeviceFromLib(def)"
              >
                <span class="ico" :class="{ amber: def.category1 === '灯光' }">
                  <DeviceIcon :shape="def.icon" :size="22" />
                </span>
                <span class="name">{{ def.category2 }}</span>
                <span v-if="def.demoExtension" class="ext">扩展</span>
              </button>
            </div>
          </section>
        </div>
      </aside>

      <main class="stage">
        <div class="stage-head">
          <div class="crumbs">
            <span>{{ project.name }}</span>
            <i>/</i>
            <span>{{ selectedRoom?.name ?? '未选择空间' }}</span>
            <i v-if="selectedRoom">/</i>
            <span v-if="selectedRoom">{{ selectedRoom.spaceCode }}</span>
          </div>
          <div class="stage-tools">
            <label><input v-model="showGrid" type="checkbox" /> 网格</label>
            <label><input v-model="showFurniture" type="checkbox" /> 家具</label>
            <label><input v-model="showDevices" type="checkbox" /> 设备</label>
            <label><input v-model="showGlow" type="checkbox" /> 光斑</label>
            <label><input v-model="showLabels" type="checkbox" /> 标签</label>
            <label><input v-model="showWholeHouse" type="checkbox" /> 全屋基础包</label>
            <span class="divider" />
            <label v-for="p in ['P1','P2','P3','P4']" :key="p" class="prio">
              <input v-model="visiblePriorities[p]" type="checkbox" /> {{ p }}
            </label>
          </div>
        </div>
        <div class="canvas-host">
          <PlanCanvas
            v-if="viewMode === '2d'"
            ref="planRef"
            :project="project"
            :selected-room-id="selectedRoomId"
            :selected-device-id="selectedDeviceId"
            :lights-on="lightsOn"
            :show-grid="showGrid"
            :show-furniture="showFurniture"
            :show-devices="showDevices"
            :show-glow="showGlow"
            :show-labels="showLabels"
            :show-whole-house="showWholeHouse"
            :visible-priorities="visiblePriorities"
            @select-room="selectRoom"
            @select-device="selectDevice"
            @move-device="moveDevice"
            @add-device="onAddDevice"
          />
          <SceneCanvas
            v-else
            :project="project"
            :lights-on="lightsOn"
            :show-furniture="showFurniture"
            :show-devices="showDevices"
            :show-glow="showGlow"
            :selected-device-id="selectedDeviceId"
            @select-device="selectDevice"
          />
          <div v-if="viewMode === '2d' && !layout" class="empty-hint">
            <strong>2D 平面已就绪</strong>
            <span>先从左侧拖入设备，再点「一键布点」按规则摆放；点「一键套餐」会按 183 条规则生成整套设备。</span>
          </div>
          <div class="canvas-corner">
            <span>{{ project.width }} × {{ project.height }} mm</span>
            <span>{{ wholeArea.toFixed(1) }} ㎡</span>
          </div>
        </div>
        <div class="statusbar">
          <span v-if="lastAction === 'place'">已布点设备 {{ project.devices.filter(d => d.source === 'manual').length }} · 分组 {{ stats.executed }} · 兜底 {{ stats.fallback }}</span>
          <span v-else>执行链 {{ stats.executed }} / {{ totalRules }}</span>
          <span>设备 {{ project.devices.length }}</span>
          <span>未落位 {{ stats.unplaced }}</span>
          <span>降级 {{ stats.fallback }}</span>
          <span>模式 {{ selectedRoom?.mode ?? '—' }}</span>
          <span class="muted">Demo 默认值 · 规则版本 {{ DEMO_DEFAULTS.ruleVersion }}</span>
        </div>
      </main>

      <aside class="right-panel">
        <div class="tabs">
          <button :class="{ on: rightTab === 'space' }" @click="rightTab = 'space'">空间</button>
          <button :class="{ on: rightTab === 'device' }" @click="rightTab = 'device'">设备</button>
          <button :class="{ on: rightTab === 'rules' }" @click="rightTab = 'rules'">规则</button>
          <button :class="{ on: rightTab === 'summary' }" @click="rightTab = 'summary'">清单</button>
        </div>

        <div v-if="rightTab === 'space'" class="panel-body">
          <template v-if="selectedRoom">
            <div class="panel-title">
              <div>
                <h2>{{ selectedRoom.name }}</h2>
                <p>{{ selectedRoom.spaceCode }} · {{ roomArea.toFixed(1) }} ㎡ · {{ roomDevices.length }} 个设备</p>
              </div>
              <span class="mode-chip">{{ selectedRoom.mode }}</span>
            </div>
            <label class="field">
              <span>空间类型</span>
              <select :value="selectedRoom.spaceCode" @change="changeSpaceType(($event.target as HTMLSelectElement).value as SpaceCode)">
                <option v-for="s in SPACES" :key="s.code" :value="s.code">{{ s.name }} · {{ s.code }}</option>
              </select>
            </label>
            <div class="field">
              <span>方案模式</span>
              <div class="mode-row">
                <button v-for="m in ['MAIN','NO_MAIN','MIXED']" :key="m" :class="{ on: selectedRoom.mode === m }" @click="setMode(m as any)">{{ m }}</button>
              </div>
            </div>
            <div class="field">
              <span>功能分区</span>
              <div class="chip-row">
                <span v-for="z in SPACE_BY_CODE[selectedRoom.spaceCode].zones" :key="z" class="chip">{{ z }}</span>
              </div>
            </div>
            <div class="metric-grid">
              <div><strong>{{ roomDevices.length }}</strong><span>当前设备</span></div>
              <div><strong>{{ roomExecutions.length }}</strong><span>已执行规则</span></div>
              <div><strong>{{ roomUnplaced.length }}</strong><span>未落位</span></div>
            </div>
            <div class="btn-row">
              <button class="btn primary" @click="placeExisting('current')">当前空间布点</button>
              <button class="btn" @click="runAutoLayout('current')">当前空间套餐</button>
              <button class="btn danger" @click="clearRoom">清空当前空间</button>
            </div>
            <div class="info-box">
              <strong>规则提示</strong>
              <p>{{ SPACE_BY_CODE[selectedRoom.spaceCode].defaultMode }} 为默认模式；切换模式后请点「当前空间布点」或「当前空间套餐」。</p>
            </div>
          </template>
          <div v-else class="empty-panel">点击平面图上的房间查看属性</div>
        </div>

        <div v-else-if="rightTab === 'device'" class="panel-body">
          <template v-if="selectedDevice">
            <div class="panel-title">
              <div>
                <h2>{{ selectedDevice.deviceType2 }}</h2>
                <p>{{ selectedDevice.roomName }} · {{ selectedDeviceExplanation?.kindLabel ?? selectedDevice.ruleCode }}</p>
              </div>
              <span class="mode-chip" :class="{ locked: selectedDevice.locked }">{{ selectedDevice.locked ? '已锁定' : (statusLabels[selectedDevice.status] ?? selectedDevice.status) }}</span>
            </div>
            <div class="device-hero">
              <DeviceIcon :shape="DEVICE_BY_KEY[selectedDevice.deviceKey]?.icon ?? 'generic'" :size="42" />
              <div>
                <strong>{{ selectedDevice.category1 }} / {{ selectedDevice.deviceType2 }}</strong>
                <p>{{ selectedDevice.visual }} · {{ selectedDevice.mount }} · P{{ selectedDevice.priority.slice(1) }}</p>
              </div>
            </div>
            <div class="kv">
              <div><span>坐标</span><strong>x {{ selectedDevice.position.x }} · y {{ selectedDevice.position.y }}</strong></div>
              <div><span>高度</span><strong>{{ selectedDevice.position.z }} mm</strong></div>
              <div><span>尺寸</span><strong>{{ selectedDevice.size.width }} × {{ selectedDevice.size.depth }} mm</strong></div>
              <div><span>来源</span><strong>{{ selectedDevice.source }}</strong></div>
            </div>

            <div v-if="selectedDeviceExplanation" class="hit-card" :class="selectedDeviceExplanation.kind">
              <div class="hit-head">
                <span class="hit-badge">{{ selectedDeviceExplanation.kindLabel }}</span>
                <strong>{{ selectedDeviceExplanation.code }}</strong>
              </div>
              <p class="hit-sub">{{ selectedDeviceExplanation.title }} · {{ selectedDeviceExplanation.subtitle }}</p>
              <ol class="why-list">
                <li v-for="(w, i) in selectedDeviceExplanation.why" :key="i">{{ w }}</li>
              </ol>
              <div class="kv compact">
                <div v-for="row in selectedDeviceExplanation.rows" :key="row.label">
                  <span>{{ row.label }}</span><strong>{{ row.value }}</strong>
                </div>
              </div>
              <details v-if="selectedDeviceExplanation.rule" class="rule-source">
                <summary>规则原文 / 降级链</summary>
                <RuleDetail :rule="selectedDeviceExplanation.rule" />
              </details>
              <div v-if="selectedDeviceExplanation.candidateRules.length && selectedDeviceExplanation.kind !== 'rule'" class="candidate-box">
                <span>同空间可命中规则</span>
                <button v-for="r in selectedDeviceExplanation.candidateRules" :key="r.pointCode" @click="focusRule(r.pointCode)">
                  {{ r.pointCode }} · {{ r.deviceType2 }}
                </button>
              </div>
              <div v-if="selectedDeviceExplanation.warnings.length" class="warn-box">
                <strong>降级 / 告警</strong>
                <div v-for="w in selectedDeviceExplanation.warnings" :key="w">{{ w }}</div>
              </div>
              <button class="btn small full" @click="openRuleSummary(selectedDeviceExplanation.code, selectedDeviceExplanation.kind)">
                在规则汇总中查看
              </button>
            </div>

            <div class="field">
              <span>执行 Trace</span>
              <div class="trace-list">
                <span v-for="n in explainNotes(selectedDevice.trace.notes)" :key="n" class="chip">{{ n }}</span>
                <span v-if="!selectedDevice.trace.notes.length" class="muted">无额外标记</span>
              </div>
            </div>
            <div class="btn-row">
              <button class="btn" @click="toggleLock">{{ selectedDevice.locked ? '解锁' : '锁定' }}</button>
              <button class="btn danger" @click="deleteSelected">删除设备</button>
            </div>
          </template>
          <div v-else class="empty-panel">点击平面图上的设备查看属性</div>
        </div>

        <div v-else-if="rightTab === 'rules'" class="panel-body">
          <div class="panel-title">
            <div>
              <h2>规则汇总</h2>
              <p>{{ totalRules }} 条 · {{ spaceRuleSummary.length }} 类空间 · {{ deviceRuleTypeCount }} 类设备</p>
            </div>
            <span class="pill">{{ layout ? `${stats.executed} 执行` : '未运行' }}</span>
          </div>
          <div class="dim-toggle">
            <button :class="{ on: ruleDim === 'space' }" @click="ruleDim = 'space'; expandedRuleCode = null">空间维度</button>
            <button :class="{ on: ruleDim === 'device' }" @click="ruleDim = 'device'; expandedRuleCode = null">设备维度</button>
          </div>
          <div v-if="lastAction === 'place'" class="info-box">
            <strong>当前显示「一键布点」的命中结果</strong>
            <p>点开平面图上的设备，可在「设备」页看到它命中的规则与原因；这里按空间 / 设备两个维度做汇总。</p>
          </div>

          <template v-if="ruleDim === 'space'">
            <p class="dim-hint">按 V1 §5「逐空间点位规则」汇总。点空间展开规则，点规则展开原文与降级链。</p>
            <div class="dim-list">
              <div
                v-for="s in spaceRuleSummary"
                :key="s.code"
                class="dim-group"
                :class="{ open: expandedSpaceCode === s.code, active: selectedRoom?.spaceCode === s.code }"
              >
                <button class="dim-row" @click="toggleSpace(s.code)">
                  <span class="dim-main">
                    <strong>{{ s.name }}</strong>
                    <small>{{ s.code }} · {{ s.ruleCount }} 条 · {{ s.deviceTypeCount }} 类设备</small>
                  </span>
                  <span class="dim-meta">
                    <span v-if="s.roomCount" class="mini">{{ s.roomCount }} 个空间 · {{ s.placed }} 台</span>
                    <span v-else class="mini muted">本户型未使用</span>
                  </span>
                  <span class="chev">{{ expandedSpaceCode === s.code ? '−' : '+' }}</span>
                </button>
                <div v-if="expandedSpaceCode === s.code" class="rule-list nested">
                  <div v-for="r in s.rules" :key="r.pointCode" class="rule-item">
                    <button class="rule-row" :class="{ open: expandedRuleCode === r.pointCode }" @click="toggleRule(r.pointCode)">
                      <span class="dot" :class="spaceRuleStatus(r)" />
                      <span class="rule-main">
                        <span class="rule-top"><strong>{{ r.pointCode }}</strong><span>{{ r.deviceType2 }}</span><em class="prio">{{ r.priority }}</em></span>
                        <span class="rule-sub">{{ r.usage || '基础布点' }} · {{ r.quantity.raw }}</span>
                        <small>{{ ANCHOR_LABELS[r.anchor.kind] }} · {{ spaceRulePlaced(r) }} 台</small>
                      </span>
                    </button>
                    <RuleDetail v-if="expandedRuleCode === r.pointCode" :rule="r" />
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template v-else>
            <p class="dim-hint">按 V1 §6「跨空间通用规则」+ §4 配置矩阵汇总。展开设备，可看到它在各空间命中的规则。</p>
            <div class="chip-row cat-filter">
              <button
                v-for="c in categoryFilters"
                :key="c"
                :class="{ on: deviceCatFilter === c }"
                @click="deviceCatFilter = c"
              >{{ c }}</button>
            </div>
            <div class="dim-list">
              <div
                v-for="g in deviceRuleSummary"
                :key="g.key"
                class="dim-group"
                :class="{ open: expandedDeviceKey === g.key }"
              >
                <button class="dim-row" @click="toggleDeviceGroup(g.key)">
                  <span class="dim-main">
                    <strong>{{ g.category2 }}</strong>
                    <small>{{ g.category1 }} · {{ g.rules.length }} 条 · {{ g.spaces.size }} 个空间</small>
                  </span>
                  <span class="dim-meta"><span class="mini">{{ g.placed }} 台已布</span></span>
                  <span class="chev">{{ expandedDeviceKey === g.key ? '−' : '+' }}</span>
                </button>
                <div v-if="expandedDeviceKey === g.key" class="rule-list nested">
                  <div v-for="r in g.rules" :key="r.pointCode" class="rule-item">
                    <button class="rule-row" :class="{ open: expandedRuleCode === r.pointCode }" @click="toggleRule(r.pointCode)">
                      <span class="dot" :class="spaceRuleStatus(r)" />
                      <span class="rule-main">
                        <span class="rule-top"><strong>{{ r.pointCode }}</strong><span>{{ SPACE_BY_CODE[r.spaceCode]?.name }}</span><em class="prio">{{ r.priority }}</em></span>
                        <span class="rule-sub">{{ r.usage || '基础布点' }} · {{ r.quantity.raw }}</span>
                        <small>{{ ANCHOR_LABELS[r.anchor.kind] }}</small>
                      </span>
                    </button>
                    <RuleDetail v-if="expandedRuleCode === r.pointCode" :rule="r" />
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <div v-else class="panel-body">
          <div class="panel-title">
            <div>
              <h2>设备清单</h2>
              <p>{{ project.devices.length }} 个设备 · {{ categoryCounts.filter(c => c.count).length }} 个分类</p>
            </div>
            <button class="btn small" @click="exportCsv">CSV</button>
          </div>
          <div class="cat-summary">
            <div v-for="c in categoryCounts" :key="c.category">
              <span>{{ c.category }}</span><strong>{{ c.count }}</strong>
            </div>
          </div>
          <div class="device-list">
            <div v-for="[name, info] in deviceCounts" :key="name" class="device-row">
              <span>{{ name }}</span><small>{{ info.category }}</small><strong>{{ info.count }}</strong>
            </div>
          </div>
          <div v-if="layout?.unplaced.length" class="warn-box">
            <strong>未落位 {{ layout.unplaced.length }} 条</strong>
            <div v-for="u in layout.unplaced.slice(0, 8)" :key="u.ruleCode + u.reasonCode">
              {{ u.ruleCode }} · {{ u.reasonCode }} · {{ u.reason }}
            </div>
          </div>
          <details class="pending">
            <summary>Demo 默认值 / 待业务确认</summary>
            <ul><li v-for="p in PENDING_BUSINESS_CONFIRMATION" :key="p">{{ p }}</li></ul>
          </details>
        </div>
      </aside>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<style scoped>
.app-shell { display: flex; flex-direction: column; height: 100vh; min-height: 720px; background: #0b0d10; color: #e8e6e1; }
.topbar { height: 62px; flex: 0 0 62px; display: flex; align-items: center; gap: 18px; padding: 0 18px; border-bottom: 1px solid #242a32; background: #101319; }
.home-btn { display: inline-flex; align-items: center; text-decoration: none; flex: 0 0 auto; }
.brand { display: flex; align-items: center; gap: 12px; min-width: 260px; }
.brand-mark { width: 34px; height: 34px; border-radius: 9px; display: grid; place-items: center; background: #f5b544; color: #1a1208; font-size: 19px; font-weight: 800; }
.brand strong { display: block; font-size: 14px; letter-spacing: .02em; }
.brand span { display: block; color: #8c919a; font-size: 11px; margin-top: 2px; }
.topbar-center { display: flex; align-items: center; gap: 12px; flex: 1; justify-content: center; }
.sample-select, .search, select { background: #171b22; color: #e8e6e1; border: 1px solid #2a3038; border-radius: 8px; outline: none; }
.sample-select { height: 34px; padding: 0 10px; font-size: 12px; min-width: 190px; }
.segmented { display: flex; padding: 3px; background: #171b22; border: 1px solid #2a3038; border-radius: 9px; }
.segmented button { border: 0; background: transparent; color: #8c919a; padding: 5px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; }
.segmented button.on { background: #f5b544; color: #1a1208; font-weight: 700; }
.top-actions { display: flex; gap: 7px; flex-wrap: wrap; justify-content: flex-end; max-width: 630px; }
.btn { border: 1px solid #2a3038; background: #171b22; color: #d8d6d0; border-radius: 8px; height: 32px; padding: 0 11px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.btn:hover { border-color: #46505e; background: #1d232c; }
.btn.primary { background: #f5b544; color: #1a1208; border-color: #f5b544; font-weight: 700; }
.btn.primary:hover { background: #ffd06a; }
.btn.danger { color: #ff8c8c; border-color: #4a2a2a; }
.btn.small { height: 26px; padding: 0 8px; font-size: 11px; }
.btn.on { border-color: #f5b544; color: #f5b544; }
.workspace { flex: 1; display: grid; grid-template-columns: 292px minmax(0, 1fr) 344px; min-height: 0; }
.left-panel, .right-panel { background: #101319; border-color: #242a32; display: flex; flex-direction: column; min-height: 0; }
.left-panel { border-right: 1px solid #242a32; }
.right-panel { border-left: 1px solid #242a32; }
.panel-head { padding: 15px 15px 10px; }
.panel-head h2, .panel-title h2 { margin: 0; font-size: 15px; letter-spacing: .02em; }
.panel-head p, .panel-title p { margin: 4px 0 0; color: #8c919a; font-size: 11px; }
.pill { background: #1d232c; border: 1px solid #2a3038; color: #b9b3a8; border-radius: 99px; padding: 3px 8px; font-size: 10px; white-space: nowrap; }
.search { margin: 0 15px 10px; height: 34px; padding: 0 10px; font-size: 12px; }
.picked-box { margin: 0 12px 8px; border: 1px solid #2a3038; background: #12171e; border-radius: 9px; padding: 8px 9px; }
.picked-head { display: flex; align-items: center; gap: 7px; color: #b9b3a8; font-size: 10.5px; }
.picked-head b { color: #f5b544; font-size: 11px; }
.picked-clear { margin-left: auto; border: 0; background: transparent; color: #7e8691; font-size: 9.5px; cursor: pointer; }
.picked-clear:hover { color: #ff9c9c; }
.picked-empty { margin-top: 5px; color: #5d6570; font-size: 9.5px; line-height: 1.5; }
.picked-list { margin-top: 6px; max-height: 128px; overflow: auto; display: flex; flex-direction: column; gap: 4px; }
.picked-row { display: flex; align-items: center; gap: 6px; font-size: 10px; color: #d8d6d0; }
.picked-name { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.picked-row small { color: #6f7680; font-size: 9px; }
.qty { display: flex; align-items: center; gap: 3px; }
.qty button { width: 18px; height: 18px; border: 1px solid #2a3038; background: #171b22; color: #b9b3a8; border-radius: 4px; cursor: pointer; line-height: 1; padding: 0; }
.qty button:hover { border-color: #f5b544; color: #f5b544; }
.qty b { min-width: 14px; text-align: center; color: #f5b544; font-size: 10px; }
.device-groups { flex: 1; overflow: auto; padding: 0 12px 18px; }
.device-group { margin-bottom: 14px; }
.group-title { display: flex; align-items: center; justify-content: space-between; color: #b9b3a8; font-size: 11px; letter-spacing: .08em; margin: 0 3px 7px; }
.group-title small { color: #626a75; }
.device-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
.device-item { position: relative; display: flex; align-items: center; gap: 8px; min-height: 47px; padding: 7px 8px; background: #151a21; border: 1px solid #242b34; border-radius: 9px; color: #d8d6d0; cursor: grab; text-align: left; }
.device-item:hover { border-color: #4b5564; background: #1b222b; }
.device-item:active { cursor: grabbing; }
.device-item .ico { display: grid; place-items: center; width: 26px; height: 26px; color: #b7c0cc; flex: 0 0 26px; }
.device-item .ico.amber { color: #f5b544; }
.device-item .name { font-size: 10.5px; line-height: 1.2; max-width: 76px; }
.device-item .ext { position: absolute; right: 4px; top: 4px; font-size: 8px; color: #ffcf73; background: #3a2a10; border: 1px solid #6b4c15; border-radius: 4px; padding: 1px 3px; }
.stage { display: flex; flex-direction: column; min-width: 0; min-height: 0; background: #0b0d10; }
.stage-head { height: 40px; flex: 0 0 40px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 0 14px; border-bottom: 1px solid #1f252d; }
.crumbs { display: flex; gap: 8px; align-items: center; font-size: 11px; color: #8c919a; white-space: nowrap; }
.crumbs i { color: #454c57; font-style: normal; }
.stage-tools { display: flex; align-items: center; gap: 9px; font-size: 10px; color: #8c919a; overflow: auto; }
.stage-tools label { display: flex; align-items: center; gap: 4px; white-space: nowrap; }
.stage-tools input { accent-color: #f5b544; }
.stage-tools .divider { width: 1px; height: 16px; background: #2a3038; }
.prio { color: #6f7680; }
.canvas-host { position: relative; flex: 1; min-height: 0; overflow: hidden; }
.empty-hint { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%); display: flex; flex-direction: column; gap: 6px; text-align: center; background: rgba(16,19,25,.9); border: 1px solid #2a3038; border-radius: 12px; padding: 18px 22px; color: #8c919a; pointer-events: none; }
.empty-hint strong { color: #e8e6e1; font-size: 14px; }
.empty-hint span { font-size: 11px; max-width: 330px; line-height: 1.6; }
.canvas-corner { position: absolute; right: 12px; bottom: 10px; display: flex; gap: 10px; color: #626a75; font-size: 10px; background: rgba(11,13,16,.75); padding: 4px 8px; border-radius: 5px; }
.statusbar { height: 30px; flex: 0 0 30px; display: flex; align-items: center; gap: 18px; padding: 0 14px; border-top: 1px solid #1f252d; color: #8c919a; font-size: 10px; }
.statusbar .muted { margin-left: auto; color: #5d6570; }
.tabs { display: flex; gap: 2px; padding: 8px 10px 0; border-bottom: 1px solid #242a32; }
.tabs button { border: 0; background: transparent; color: #7e8691; padding: 9px 12px; font-size: 12px; cursor: pointer; border-bottom: 2px solid transparent; }
.tabs button.on { color: #f5b544; border-bottom-color: #f5b544; }
.panel-body { flex: 1; overflow: auto; padding: 15px; }
.panel-title { display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 14px; }
.mode-chip { font-size: 10px; color: #1a1208; background: #f5b544; border-radius: 5px; padding: 3px 7px; white-space: nowrap; }
.mode-chip.locked { background: #4bd18a; }
.field { display: flex; flex-direction: column; gap: 7px; margin-bottom: 14px; font-size: 11px; color: #8c919a; }
.field select { height: 32px; padding: 0 8px; font-size: 12px; }
.mode-row { display: flex; gap: 5px; }
.mode-row button { flex: 1; height: 28px; border: 1px solid #2a3038; background: #171b22; color: #8c919a; border-radius: 6px; font-size: 10px; cursor: pointer; }
.mode-row button.on { border-color: #f5b544; color: #f5b544; background: #221b0f; }
.chip-row, .trace-list { display: flex; gap: 5px; flex-wrap: wrap; }
.chip { font-size: 10px; color: #b9b3a8; background: #1b2028; border: 1px solid #2a3038; border-radius: 99px; padding: 3px 7px; }
.metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 7px; margin: 16px 0; }
.metric-grid div { background: #151a21; border: 1px solid #242b34; border-radius: 8px; padding: 9px; }
.metric-grid strong { display: block; font-size: 18px; color: #f5b544; }
.metric-grid span { font-size: 10px; color: #7e8691; }
.btn-row { display: flex; gap: 7px; margin-top: 14px; }
.btn-row .btn { flex: 1; }
.info-box { margin-top: 16px; border: 1px solid #2a3038; background: #141920; border-radius: 8px; padding: 10px; font-size: 10.5px; color: #8c919a; }
.info-box strong { color: #d8d6d0; display: block; margin-bottom: 4px; }
.info-box p { margin: 0; line-height: 1.6; }
.device-hero { display: flex; align-items: center; gap: 12px; background: #151a21; border: 1px solid #242b34; border-radius: 10px; padding: 12px; color: #f5b544; margin-bottom: 14px; }
.device-hero strong { display: block; color: #e8e6e1; font-size: 12px; }
.device-hero p { margin: 4px 0 0; color: #8c919a; font-size: 10px; }
.kv { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; }
.kv div { display: flex; justify-content: space-between; gap: 12px; font-size: 11px; color: #8c919a; border-bottom: 1px solid #1f252d; padding-bottom: 7px; }
.kv strong { color: #d8d6d0; font-weight: 500; text-align: right; }
.rule-list { display: flex; flex-direction: column; gap: 6px; }
.rule-row { display: flex; gap: 8px; align-items: flex-start; background: #141920; border: 1px solid #222932; border-radius: 8px; padding: 8px 9px; }
.dot { width: 7px; height: 7px; border-radius: 50%; background: #4bd18a; margin-top: 4px; flex: 0 0 7px; }
.dot.executed_with_fallback { background: #f5b544; }
.dot.skipped { background: #ff6b6b; }
.rule-main { flex: 1; min-width: 0; }
.rule-top { display: flex; gap: 7px; align-items: baseline; }
.rule-top strong { font-size: 10px; color: #f5b544; }
.rule-top span { font-size: 11px; color: #d8d6d0; }
.rule-main p { margin: 3px 0; font-size: 10px; color: #7e8691; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rule-main small { font-size: 9.5px; color: #5d6570; }
.count { font-size: 11px; color: #b9b3a8; }
.cat-summary { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 14px; }
.cat-summary div { display: flex; justify-content: space-between; background: #151a21; border: 1px solid #242b34; border-radius: 7px; padding: 7px 9px; font-size: 10.5px; color: #8c919a; }
.cat-summary strong { color: #f5b544; }
.device-list { display: flex; flex-direction: column; gap: 4px; }
.device-row { display: grid; grid-template-columns: 1fr auto 32px; gap: 8px; align-items: center; font-size: 10.5px; padding: 7px 8px; border-bottom: 1px solid #1f252d; color: #d8d6d0; }
.device-row small { color: #626a75; }
.device-row strong { color: #f5b544; text-align: right; }
.warn-box { margin-top: 14px; border: 1px solid #4a2a2a; background: #1e1414; border-radius: 8px; padding: 9px; font-size: 10px; color: #ff9c9c; line-height: 1.7; }
.warn-box strong { display: block; margin-bottom: 4px; }
.pending { margin-top: 14px; border-top: 1px solid #242b32; padding-top: 10px; color: #8c919a; font-size: 10px; }
.pending summary { cursor: pointer; color: #b9b3a8; }
.pending ul { padding-left: 16px; line-height: 1.7; }
.empty-panel { color: #626a75; font-size: 12px; text-align: center; margin-top: 60px; }
.toast { position: fixed; left: 50%; bottom: 46px; transform: translateX(-50%); background: #f5b544; color: #1a1208; border-radius: 8px; padding: 9px 14px; font-size: 12px; font-weight: 600; box-shadow: 0 8px 24px rgba(0,0,0,.35); z-index: 20; }
.muted { color: #5d6570; }

.hit-card { margin: 4px 0 16px; border: 1px solid #2a3038; background: #12171e; border-radius: 10px; padding: 11px; }
.hit-card.rule { border-color: #4a3d1c; background: #15140f; }
.hit-card.generic { border-color: #3b3320; }
.hit-card.manual, .hit-card.demo { border-color: #2c3542; }
.hit-head { display: flex; align-items: center; gap: 7px; }
.hit-head strong { color: #f5b544; font-size: 12px; letter-spacing: .02em; }
.hit-badge { font-size: 9px; padding: 2px 6px; border-radius: 4px; background: #2a2313; color: #f5b544; border: 1px solid #5a4718; }
.hit-card.manual .hit-badge, .hit-card.demo .hit-badge, .hit-card.generic .hit-badge { background: #1d232c; color: #b9b3a8; border-color: #2f3845; }
.hit-sub { margin: 6px 0 10px; font-size: 10px; color: #8c919a; line-height: 1.5; }
.why-list { margin: 0 0 11px; padding-left: 16px; display: flex; flex-direction: column; gap: 5px; }
.why-list li { font-size: 10.5px; color: #cfc9bd; line-height: 1.55; }
.why-list li::marker { color: #f5b544; }
.kv.compact { gap: 6px; margin-bottom: 10px; }
.kv.compact div { font-size: 10px; padding-bottom: 5px; }
.kv.compact strong { font-size: 10px; }
.rule-source summary { cursor: pointer; color: #b9b3a8; font-size: 10px; padding: 4px 0; }
.candidate-box { margin-top: 8px; display: flex; flex-direction: column; gap: 4px; }
.candidate-box > span { font-size: 9.5px; color: #7e8691; letter-spacing: .04em; }
.candidate-box button { text-align: left; border: 1px dashed #34404f; background: #151b23; color: #b9b3a8; border-radius: 6px; padding: 5px 7px; font-size: 10px; cursor: pointer; }
.candidate-box button:hover { border-color: #f5b544; color: #f5b544; }
.btn.full { width: 100%; margin-top: 9px; }

.dim-toggle { display: flex; gap: 4px; background: #151a21; border: 1px solid #242b34; border-radius: 8px; padding: 3px; margin-bottom: 10px; }
.dim-toggle button { flex: 1; height: 26px; border: 0; border-radius: 6px; background: transparent; color: #8c919a; font-size: 11px; cursor: pointer; }
.dim-toggle button.on { background: #f5b544; color: #1a1208; font-weight: 700; }
.dim-hint { margin: 0 0 10px; font-size: 9.5px; color: #5d6570; line-height: 1.6; }
.dim-list { display: flex; flex-direction: column; gap: 6px; }
.dim-group { border: 1px solid #222932; border-radius: 8px; background: #141920; overflow: hidden; }
.dim-group.active { border-color: #4a3d1c; }
.dim-group.open { border-color: #3a4452; }
.dim-row { width: 100%; display: flex; align-items: center; gap: 8px; padding: 8px 9px; border: 0; background: transparent; color: #d8d6d0; text-align: left; cursor: pointer; }
.dim-row:hover { background: #1a212a; }
.dim-main { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.dim-main strong { font-size: 11px; font-weight: 600; }
.dim-main small { font-size: 9px; color: #6f7680; }
.dim-meta { flex: 0 0 auto; }
.mini { font-size: 9px; color: #b9b3a8; }
.mini.muted { color: #4f5762; }
.chev { width: 14px; text-align: center; color: #6f7680; font-size: 13px; }
.rule-list.nested { padding: 4px 6px 6px; border-top: 1px solid #1f252d; }
.rule-item { display: flex; flex-direction: column; }
.rule-row { width: 100%; border: 0; background: transparent; text-align: left; cursor: pointer; }
.rule-row:hover { background: #1a212a; }
.rule-row.open { background: #1b222b; }
.rule-main { display: flex; flex-direction: column; gap: 2px; }
.rule-top { display: flex; gap: 6px; align-items: baseline; }
.rule-top em.prio { margin-left: auto; font-style: normal; font-size: 9px; color: #6f7680; }
.rule-sub { font-size: 9.5px; color: #7e8691; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.rule-main small { font-size: 9px; color: #5d6570; }
.dot.idle { background: #3a424e; }
.cat-filter { margin-bottom: 10px; }
.cat-filter button { border: 1px solid #2a3038; background: #171b22; color: #8c919a; border-radius: 99px; padding: 3px 7px; font-size: 9.5px; cursor: pointer; }
.cat-filter button.on { border-color: #f5b544; color: #f5b544; }

@media (max-width: 1320px) {
  .workspace { grid-template-columns: 255px minmax(0, 1fr) 310px; }
  .top-actions .btn:nth-child(n+7) { display: none; }
}
@media (max-width: 1080px) {
  .workspace { grid-template-columns: 240px minmax(0, 1fr); }
  .right-panel { display: none; }
  .brand span { display: none; }
  .topbar-center { justify-content: flex-start; }
  .top-actions .btn:nth-child(n+5) { display: none; }
}

/* ===== Admin UI V1.0 主题层：Vue 旧版工作台统一到后台视觉语言 ===== */
.app-shell {
  --ui-bg: #eef6fd;
  --ui-panel: #ffffff;
  --ui-panel-2: #f6f9fc;
  --ui-line: #e4eaf1;
  --ui-line-soft: #edf1f5;
  --ui-text: #243447;
  --ui-body: #526579;
  --ui-muted: #7b8794;
  --ui-faint: #91a0ae;
  --ui-accent: #1687f5;
  --ui-accent-hover: #0b73db;
  --ui-accent-soft: #eaf5ff;
  --ui-success: #388157;
  --ui-success-bg: #eaf8ef;
  --ui-warning: #b27414;
  --ui-warning-bg: #fff5df;
  --ui-danger: #cf5f50;
  --ui-danger-bg: #fff1ee;
  background: var(--ui-bg);
  color: var(--ui-body);
}
.topbar { background: var(--ui-panel); border-bottom: 1px solid var(--ui-line); box-shadow: 0 1px 2px rgba(32, 55, 77, .03); }
.brand-mark { background: var(--ui-accent); color: #fff; }
.brand strong { color: var(--ui-text); }
.brand span { color: var(--ui-muted); }
.sample-select, .search, select { background: var(--ui-panel); color: var(--ui-body); border-color: var(--ui-line); border-radius: 6px; }
.segmented { background: var(--ui-panel-2); border-color: var(--ui-line); border-radius: 6px; }
.segmented button { color: var(--ui-body); border-radius: 4px; }
.segmented button.on { background: var(--ui-accent); color: #fff; }
.btn { background: var(--ui-panel); border-color: var(--ui-line); color: var(--ui-body); border-radius: 6px; }
.btn:hover { border-color: var(--ui-accent); color: var(--ui-accent); background: var(--ui-panel-2); }
.btn.primary { background: var(--ui-accent); border-color: var(--ui-accent); color: #fff; }
.btn.primary:hover { background: var(--ui-accent-hover); border-color: var(--ui-accent-hover); }
.btn.danger { color: var(--ui-danger); border-color: var(--ui-line); }
.btn.danger:hover { background: var(--ui-danger-bg); border-color: #e7bfb6; }
.btn.on { border-color: var(--ui-accent); color: var(--ui-accent); background: var(--ui-accent-soft); }
.left-panel, .right-panel { background: var(--ui-panel); border-color: var(--ui-line); }
.panel-head h2, .panel-title h2 { color: var(--ui-text); }
.panel-head p, .panel-title p { color: var(--ui-muted); }
.pill { background: var(--ui-panel-2); border-color: var(--ui-line); color: var(--ui-body); }
.picked-box { background: var(--ui-panel-2); border-color: var(--ui-line); border-radius: 6px; }
.picked-head { color: var(--ui-body); }
.picked-head b { color: var(--ui-accent); }
.picked-clear { color: var(--ui-muted); }
.picked-empty { color: var(--ui-faint); }
.picked-row { color: var(--ui-body); }
.picked-row small { color: var(--ui-muted); }
.qty button { background: var(--ui-panel); border-color: var(--ui-line); color: var(--ui-body); }
.qty button:hover { border-color: var(--ui-accent); color: var(--ui-accent); }
.qty b { color: var(--ui-accent); }
.group-title { color: var(--ui-text); }
.group-title small { color: var(--ui-muted); }
.device-item { background: var(--ui-panel); border-color: var(--ui-line); border-radius: 6px; color: var(--ui-body); }
.device-item:hover { border-color: var(--ui-accent); background: var(--ui-panel-2); }
.device-item .ico { color: var(--ui-muted); }
.device-item .ico.amber { color: var(--ui-accent); }
.device-item .ext { color: var(--ui-accent); background: var(--ui-accent-soft); border-color: #cfe5f7; }
.stage { background: var(--ui-bg); }
.stage-head { border-bottom-color: var(--ui-line); }
.crumbs, .stage-tools { color: var(--ui-muted); }
.crumbs i { color: var(--ui-faint); }
.stage-tools input { accent-color: var(--ui-accent); }
.stage-tools .divider { background: var(--ui-line); }
.prio { color: var(--ui-muted); }
.empty-hint { background: rgba(255, 255, 255, .94); border-color: var(--ui-line); border-radius: 8px; color: var(--ui-muted); box-shadow: 0 1px 2px rgba(32, 55, 77, .04); }
.empty-hint strong { color: var(--ui-text); }
.canvas-corner { color: var(--ui-muted); background: rgba(255, 255, 255, .82); }
.statusbar { border-top-color: var(--ui-line); color: var(--ui-muted); }
.tabs { border-bottom-color: var(--ui-line); }
.tabs button { color: var(--ui-body); }
.tabs button:hover { color: var(--ui-accent); }
.tabs button.on { color: var(--ui-accent); border-bottom-color: var(--ui-accent); }
.mode-chip { background: var(--ui-accent); color: #fff; }
.mode-chip.locked { background: var(--ui-success); color: #fff; }
.field { color: var(--ui-muted); }
.field select { background: var(--ui-panel); color: var(--ui-body); border-color: var(--ui-line); }
.mode-row button { background: var(--ui-panel); border-color: var(--ui-line); color: var(--ui-body); }
.mode-row button.on { border-color: var(--ui-accent); color: var(--ui-accent); background: var(--ui-accent-soft); }
.chip { background: var(--ui-panel-2); border-color: var(--ui-line); color: var(--ui-body); }
.metric-grid div { background: var(--ui-panel-2); border-color: var(--ui-line); border-radius: 6px; }
.metric-grid strong { color: var(--ui-accent); }
.metric-grid span { color: var(--ui-muted); }
.info-box { background: var(--ui-panel-2); border-color: var(--ui-line); border-radius: 6px; color: var(--ui-muted); }
.info-box strong { color: var(--ui-text); }
.device-hero { background: var(--ui-panel-2); border-color: var(--ui-line); border-radius: 6px; color: var(--ui-accent); }
.device-hero strong { color: var(--ui-text); }
.device-hero p { color: var(--ui-muted); }
.kv div { border-bottom-color: var(--ui-line-soft); color: var(--ui-muted); }
.kv strong { color: var(--ui-text); }
.rule-row { background: var(--ui-panel-2); border-color: var(--ui-line); border-radius: 6px; }
.rule-row:hover { background: var(--ui-panel); border-color: #cfe5f7; }
.dot { background: var(--ui-success); }
.dot.executed_with_fallback { background: var(--ui-warning); }
.dot.skipped { background: var(--ui-danger); }
.dot.idle { background: var(--ui-faint); }
.rule-top strong { color: var(--ui-accent); }
.rule-top span { color: var(--ui-text); }
.rule-top em.prio { color: var(--ui-muted); }
.rule-main p, .rule-sub { color: var(--ui-muted); }
.rule-main small { color: var(--ui-faint); }
.count { color: var(--ui-body); }
.cat-summary div { background: var(--ui-panel-2); border-color: var(--ui-line); color: var(--ui-muted); }
.cat-summary strong { color: var(--ui-accent); }
.device-row { border-bottom-color: var(--ui-line-soft); color: var(--ui-body); }
.device-row small { color: var(--ui-muted); }
.device-row strong { color: var(--ui-accent); }
.warn-box { background: var(--ui-danger-bg); border-color: #e7bfb6; color: var(--ui-danger); }
.pending { border-top-color: var(--ui-line); color: var(--ui-muted); }
.pending summary { color: var(--ui-text); }
.empty-panel { color: var(--ui-faint); }
.toast { background: var(--ui-accent); color: #fff; box-shadow: 0 8px 24px rgba(22, 135, 245, .25); }
.muted { color: var(--ui-faint); }
.hit-card { background: var(--ui-panel-2); border-color: var(--ui-line); border-radius: 6px; }
.hit-card.rule { border-color: #cfe5f7; background: var(--ui-accent-soft); }
.hit-card.generic { border-color: var(--ui-line); }
.hit-card.manual, .hit-card.demo { border-color: var(--ui-line); }
.hit-head strong { color: var(--ui-accent); }
.hit-badge { background: var(--ui-accent-soft); color: var(--ui-accent); border-color: #cfe5f7; }
.hit-card.manual .hit-badge, .hit-card.demo .hit-badge, .hit-card.generic .hit-badge { background: var(--ui-panel-2); color: var(--ui-body); border-color: var(--ui-line); }
.hit-sub { color: var(--ui-muted); }
.why-list li { color: var(--ui-body); }
.why-list li::marker { color: var(--ui-accent); }
.rule-source summary { color: var(--ui-body); }
.candidate-box > span { color: var(--ui-muted); }
.candidate-box button { background: var(--ui-panel); border-color: var(--ui-line); color: var(--ui-body); }
.candidate-box button:hover { border-color: var(--ui-accent); color: var(--ui-accent); }
.dim-toggle { background: var(--ui-panel-2); border-color: var(--ui-line); }
.dim-toggle button { color: var(--ui-muted); }
.dim-toggle button.on { background: var(--ui-accent); color: #fff; }
.dim-hint { color: var(--ui-faint); }
.dim-group { background: var(--ui-panel); border-color: var(--ui-line); }
.dim-group.active { border-color: #cfe5f7; }
.dim-group.open { border-color: var(--ui-line); }
.dim-row { color: var(--ui-body); }
.dim-row:hover { background: var(--ui-panel-2); }
.dim-main small { color: var(--ui-muted); }
.mini { color: var(--ui-body); }
.mini.muted { color: var(--ui-faint); }
.chev { color: var(--ui-muted); }
.rule-list.nested { border-top-color: var(--ui-line); }
.rule-row.open { background: var(--ui-panel-2); }
.cat-filter button { background: var(--ui-panel); border-color: var(--ui-line); color: var(--ui-body); }
.cat-filter button.on { border-color: var(--ui-accent); color: var(--ui-accent); background: var(--ui-accent-soft); }
</style>

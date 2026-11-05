<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import DeviceIcon from '../DeviceIcon.vue';
import { DEVICE_BY_KEY } from '../../data/catalog';
import type { Furniture, Opening, PlacedDevice, Point2, Project, Wall } from '../../types';
import {
  bboxOf, openingEnds, pointInPolygon, polygonArea, polygonCentroid, sideOfLine,
} from '../../core/geometry';

const props = withDefaults(defineProps<{
  project: Project;
  selectedRoomId?: string | null;
  selectedDeviceId?: string | null;
  lightsOn?: boolean;
  showGrid?: boolean;
  showFurniture?: boolean;
  showDevices?: boolean;
  showGlow?: boolean;
  showLabels?: boolean;
  showWholeHouse?: boolean;
  visiblePriorities?: Record<string, boolean>;
}>(), {
  selectedRoomId: null,
  selectedDeviceId: null,
  lightsOn: false,
  showGrid: true,
  showFurniture: true,
  showDevices: true,
  showGlow: true,
  showLabels: true,
  showWholeHouse: true,
  visiblePriorities: () => ({ P1: true, P2: true, P3: true, P4: true }),
});

const emit = defineEmits<{
  (e: 'select-room', id: string): void;
  (e: 'select-device', id: string | null): void;
  (e: 'move-device', payload: { id: string; x: number; y: number }): void;
  (e: 'add-device', payload: { deviceKey: string; x: number; y: number; roomId: string }): void;
}>();

const svg = ref<SVGSVGElement | null>(null);
const vb = ref({ x: 0, y: 0, w: props.project.width, h: props.project.height });
const hoverRoom = ref<string | null>(null);
const drag = ref<{
  id: string; dx: number; dy: number; x: number; y: number;
  sx: number; sy: number; moved: boolean;
} | null>(null);
let pan: { sx: number; sy: number; vx: number; vy: number; captured: boolean } | null = null;

const H = computed(() => props.project.height);
const devices = computed(() => {
  const list = [...props.project.devices];
  if (props.showWholeHouse) list.push(...props.project.wholeHouseDevices);
  return list.filter(d => props.visiblePriorities[d.priority] !== false);
});

function sx(x: number) { return x; }
function sy(y: number) { return H.value - y; }
function poly(points: Point2[]) { return points.map(([x, y]) => `${sx(x)},${sy(y)}`).join(' '); }
function rectY(f: Furniture) { return H.value - (f.rect[1] + f.rect[3]); }
function roomCenter(id: string) {
  const r = props.project.rooms.find(x => x.id === id);
  return r ? polygonCentroid(r.polygon) : [0, 0] as Point2;
}
function roomArea(id: string) {
  const r = props.project.rooms.find(x => x.id === id);
  return r ? polygonArea(r.polygon) / 1e6 : 0;
}
function colorFor(d: PlacedDevice) {
  switch (d.category1) {
    case '灯光': return '#c47f00';
    case '控制': return '#1687f5';
    case '环境': return '#388157';
    case '安防监控': return '#cf5f50';
    case '网络': return '#7c6fd6';
    case '音乐': return '#0f9b8e';
    case '遮阳': return '#d97745';
    case '暖通': return '#5a9bd4';
    default: return '#7b8794';
  }
}
function glowRadius(d: PlacedDevice) {
  const z = Math.max(500, d.position.z);
  const angle = d.deviceType2.includes('射灯') ? 36 : d.deviceType2.includes('吊灯') ? 120 : 70;
  const r = z * Math.tan((angle / 2) * Math.PI / 180) * 1.25;
  return Math.max(350, Math.min(2800, r));
}
function fanPath(d: PlacedDevice) {
  const r = glowRadius(d);
  const a = (30 * Math.PI) / 180;
  const x1 = Math.cos(-a) * r, y1 = Math.sin(-a) * r;
  const x2 = Math.cos(a) * r, y2 = Math.sin(a) * r;
  return `M 0 0 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`;
}
function lineGlowHeight(d: PlacedDevice) {
  return Math.max(120, Math.min(260, d.size.depth * 2));
}
function openingGeometry(o: Opening, w: Wall) {
  const { p0, p1, u, n } = openingEnds(o, w);
  const room = props.project.rooms.find(r => polygonCentroid(r.polygon) && pointInPolygon([(p0[0] + p1[0]) / 2 + n[0] * 100, (p0[1] + p1[1]) / 2 + n[1] * 100], r.polygon))
    ?? props.project.rooms.find(r => pointInPolygon([(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2], r.polygon))
    ?? props.project.rooms[0];
  const centroid = room ? polygonCentroid(room.polygon) : [0, 0] as Point2;
  const side = sideOfLine(centroid, w.a, w.b) >= 0 ? 1 : -1;
  const inward: Point2 = [n[0] * side, n[1] * side];
  const hinge = o.hinge === 'end' ? p1 : p0;
  const other = o.hinge === 'end' ? p0 : p1;
  const r = o.width;
  const openEnd: Point2 = [hinge[0] + inward[0] * r, hinge[1] + inward[1] * r];
  const cross = (other[0] - hinge[0]) * (openEnd[1] - hinge[1]) - (other[1] - hinge[1]) * (openEnd[0] - hinge[0]);
  return { p0, p1, hinge, other, openEnd, inward, u, sweep: cross > 0 ? 1 : 0, r };
}
function isLight(d: PlacedDevice) { return d.category1 === '灯光' && d.glow !== 'none'; }
function deviceIcon(key: string) { return DEVICE_BY_KEY[key]?.icon ?? 'generic'; }
function visualOf(d: PlacedDevice) {
  if (d.visual && d.visual !== 'none') return d.visual;
  const key = d.deviceKey || d.deviceType2;
  if (key.includes('口字灯带')) return 'rect';
  if (key.includes('L 型灯带')) return 'l';
  if (key.includes('U 型灯带')) return 'u';
  if (key.includes('灯带')) return 'line';
  if (key.includes('轨道')) return 'track';
  if (key.includes('一字组')) return 'array';
  if (key.includes('口字组')) return 'pointRect';
  return 'point';
}
function shapeW(d: PlacedDevice) { return Math.max(500, d.size.width); }
function shapeH(d: PlacedDevice) { return Math.max(420, d.size.depth); }
function shapePath(d: PlacedDevice) {
  const w = shapeW(d) / 2;
  const h = shapeH(d) / 2;
  const v = visualOf(d);
  if (v === 'l') return `M ${-w} ${h} L ${-w} ${-h} L ${w} ${-h}`;
  if (v === 'u') return `M ${-w} ${-h} L ${-w} ${h} L ${w} ${h} L ${w} ${-h}`;
  if (v === 'rect') return `M ${-w} ${-h} H ${w} V ${h} H ${-w} Z`;
  return `M ${-w} 0 H ${w}`;
}
function arrayPoints(d: PlacedDevice) {
  const w = shapeW(d);
  return [-1, 0, 1].map(k => ({ x: (k * w) / 3.2, y: 0 }));
}
function pointRectPoints(d: PlacedDevice) {
  const w = shapeW(d) / 2 - 100;
  const h = shapeH(d) / 2 - 100;
  return [{ x: -w, y: -h }, { x: w, y: -h }, { x: w, y: h }, { x: -w, y: h }];
}
function trackHeads(d: PlacedDevice) {
  const w = shapeW(d);
  return [0.2, 0.4, 0.6, 0.8].map(t => ({ x: -w / 2 + w * t, y: 0 }));
}

function clientToPlan(ev: PointerEvent | WheelEvent): Point2 | null {
  const el = svg.value;
  if (!el) return null;
  const pt = el.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;
  const p = pt.matrixTransform(el.getScreenCTM()!.inverse());
  return [p.x, H.value - p.y];
}

function onWheel(e: WheelEvent) {
  e.preventDefault();
  const el = svg.value;
  if (!el) return;
  const p = clientToPlan(e);
  if (!p) return;
  const factor = e.deltaY > 0 ? 1.12 : 0.9;
  const v = vb.value;
  const nw = Math.max(2500, Math.min(props.project.width * 1.6, v.w * factor));
  const nh = nw * (v.h / v.w);
  const px = sx(p[0]), py = sy(p[1]);
  vb.value = {
    x: px - ((px - v.x) / v.w) * nw,
    y: py - ((py - v.y) / v.h) * nh,
    w: nw,
    h: nh,
  };
}

function onBackgroundDown(e: PointerEvent) {
  if (e.button !== 0) return;
  // 先不捕获指针，否则房间/设备的 click 会被 SVG 抢走；移动超过阈值后再进入平移。
  pan = { sx: e.clientX, sy: e.clientY, vx: vb.value.x, vy: vb.value.y, captured: false };
}
function onBackgroundMove(e: PointerEvent) {
  if (!pan) return;
  const el = svg.value;
  if (!el) return;
  if (!pan.captured) {
    if (Math.hypot(e.clientX - pan.sx, e.clientY - pan.sy) <= 4) return;
    pan.captured = true;
    el.setPointerCapture?.(e.pointerId);
  }
  const dx = ((e.clientX - pan.sx) / el.clientWidth) * vb.value.w;
  const dy = ((e.clientY - pan.sy) / el.clientHeight) * vb.value.h;
  vb.value = { ...vb.value, x: pan.vx - dx, y: pan.vy - dy };
}
function onBackgroundUp() { pan = null; }

function onDeviceDown(e: PointerEvent, d: PlacedDevice) {
  e.stopPropagation();
  emit('select-device', d.id);
  if (e.button !== 0) return;
  const p = clientToPlan(e);
  if (!p) return;
  drag.value = {
    id: d.id,
    dx: p[0] - d.position.x,
    dy: p[1] - d.position.y,
    x: d.position.x,
    y: d.position.y,
    sx: e.clientX,
    sy: e.clientY,
    moved: false,
  };
  (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
}
function onDeviceMove(e: PointerEvent) {
  if (!drag.value) return;
  const p = clientToPlan(e);
  if (!p) return;
  const moved = drag.value.moved || Math.hypot(e.clientX - drag.value.sx, e.clientY - drag.value.sy) > 4;
  drag.value = { ...drag.value, x: p[0] - drag.value.dx, y: p[1] - drag.value.dy, moved };
}
function onDeviceUp(e: PointerEvent) {
  if (!drag.value) return;
  const d = drag.value;
  drag.value = null;
  // 单击只选中，不改变设备状态；超过 4px 才视为拖拽。
  if (d.moved) emit('move-device', { id: d.id, x: Math.round(d.x), y: Math.round(d.y) });
  e.stopPropagation();
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const deviceKey = e.dataTransfer?.getData('application/x-device-key');
  if (!deviceKey) return;
  const p = clientToPlan(e as unknown as PointerEvent);
  if (!p) return;
  const room = props.project.rooms.find(r => pointInPolygon(p, r.polygon));
  if (!room) return;
  emit('add-device', { deviceKey, x: Math.round(p[0]), y: Math.round(p[1]), roomId: room.id });
}
function onDragOver(e: DragEvent) { e.preventDefault(); }

function fit() {
  const b = bboxOf(props.project.rooms.flatMap(r => r.polygon));
  vb.value = { x: b.x - 300, y: H.value - (b.y + b.h) - 300, w: b.w + 600, h: b.h + 600 };
}
defineExpose({ fit });

function deviceTransform(d: PlacedDevice) {
  const prev = drag.value?.id === d.id ? drag.value : null;
  const x = prev ? prev.x : d.position.x;
  const y = prev ? prev.y : d.position.y;
  return `translate(${x} ${sy(y)}) rotate(${-d.rotation})`;
}

onBeforeUnmount(() => { pan = null; drag.value = null; });
</script>

<template>
  <div class="plan-wrap">
    <svg
      ref="svg"
      class="plan"
      :viewBox="`${vb.x} ${vb.y} ${vb.w} ${vb.h}`"
      preserveAspectRatio="xMidYMid meet"
      @wheel.prevent="onWheel"
      @pointerdown="onBackgroundDown"
      @pointermove="onBackgroundMove"
      @pointerup="onBackgroundUp"
      @pointerleave="onBackgroundUp"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <defs>
        <pattern id="grid" width="1000" height="1000" patternUnits="userSpaceOnUse">
          <path d="M 1000 0 L 0 0 0 1000" fill="none" stroke="#e4eaf1" stroke-width="14" />
        </pattern>
        <radialGradient id="glowPoint">
          <stop offset="0%" stop-color="#ffd27a" stop-opacity=".62" />
          <stop offset="35%" stop-color="#ffb84d" stop-opacity=".24" />
          <stop offset="100%" stop-color="#ff9e2c" stop-opacity="0" />
        </radialGradient>
        <linearGradient id="glowLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffcf73" stop-opacity="0" />
          <stop offset="45%" stop-color="#ffcf73" stop-opacity=".5" />
          <stop offset="55%" stop-color="#ffcf73" stop-opacity=".5" />
          <stop offset="100%" stop-color="#ffcf73" stop-opacity="0" />
        </linearGradient>
        <radialGradient id="glowArea">
          <stop offset="0%" stop-color="#ffe0a0" stop-opacity=".55" />
          <stop offset="70%" stop-color="#ffc15e" stop-opacity=".18" />
          <stop offset="100%" stop-color="#ffc15e" stop-opacity="0" />
        </radialGradient>
      </defs>

      <rect x="-20000" y="-20000" width="80000" height="80000" fill="#f7fafd" />
      <rect v-if="showGrid" x="-20000" y="-20000" width="80000" height="80000" fill="url(#grid)" opacity=".7" />

      <g>
        <polygon
          v-for="r in project.rooms"
          :key="r.id"
          :points="poly(r.polygon)"
          :fill="selectedRoomId === r.id ? '#eaf5ff' : hoverRoom === r.id ? '#f6f9fc' : '#ffffff'"
          :stroke="selectedRoomId === r.id ? '#1687f5' : '#e4eaf1'"
          stroke-width="18"
          :data-room-id="r.id"
          :data-space="r.spaceCode"
          @click.stop="emit('select-room', r.id)"
          @pointerenter="hoverRoom = r.id"
          @pointerleave="hoverRoom = null"
        />
      </g>

      <g v-if="showFurniture">
        <g v-for="f in project.furniture" :key="f.id" :transform="`translate(${f.rect[0]} ${rectY(f)})`">
          <rect :width="f.rect[2]" :height="f.rect[3]" fill="none" stroke="#94a3b8" stroke-width="16" rx="24" />
          <template v-if="f.type === 'bed'">
            <line :x1="0" :y1="0" :x2="f.rect[2]" :y2="0" stroke="#c3cedb" stroke-width="34" />
            <line :x1="120" :y1="180" :x2="f.rect[2] - 120" :y2="180" stroke="#7b8794" stroke-width="12" />
          </template>
          <template v-else-if="f.type === 'sofa'">
            <line :x1="0" :y1="f.rect[3] * .25" :x2="f.rect[2]" :y2="f.rect[3] * .25" stroke="#7b8794" stroke-width="14" />
            <line :x1="f.rect[2] * .33" :y1="0" :x2="f.rect[2] * .33" :y2="f.rect[3]" stroke="#5c6b7a" stroke-width="10" />
            <line :x1="f.rect[2] * .66" :y1="0" :x2="f.rect[2] * .66" :y2="f.rect[3]" stroke="#5c6b7a" stroke-width="10" />
          </template>
          <template v-else-if="f.type === 'diningTable' || f.type === 'coffeeTable' || f.type === 'teaTable' || f.type === 'desk'">
            <rect x="60" y="60" :width="Math.max(0, f.rect[2] - 120)" :height="Math.max(0, f.rect[3] - 120)" fill="none" stroke="#7b8794" stroke-width="10" rx="18" />
          </template>
          <template v-else-if="f.type === 'toilet'">
            <ellipse :cx="f.rect[2] / 2" :cy="f.rect[3] * .58" :rx="f.rect[2] * .36" :ry="f.rect[3] * .32" fill="none" stroke="#7b8794" stroke-width="12" />
          </template>
          <template v-else-if="f.type === 'wardrobe' || f.type === 'bookshelf' || f.type === 'displayCabinet'">
            <line :x1="f.rect[2] * .5" :y1="0" :x2="f.rect[2] * .5" :y2="f.rect[3]" stroke="#7b8794" stroke-width="8" />
          </template>
        </g>
      </g>

      <g>
        <g v-for="w in project.walls" :key="w.id">
          <line
            :x1="w.a[0]" :y1="sy(w.a[1])" :x2="w.b[0]" :y2="sy(w.b[1])"
            stroke="#94a3b8" :stroke-width="w.thickness" stroke-linecap="square"
          />
        </g>
        <g v-for="o in project.openings" :key="o.id">
          <template v-for="w in [project.walls.find(x => x.id === o.wallId)]" :key="w?.id">
            <template v-if="w">
              <line
                :x1="openingGeometry(o, w).p0[0]" :y1="sy(openingGeometry(o, w).p0[1])"
                :x2="openingGeometry(o, w).p1[0]" :y2="sy(openingGeometry(o, w).p1[1])"
                stroke="#f7fafd" :stroke-width="w.thickness + 20" stroke-linecap="butt"
              />
              <template v-if="o.type === 'window'">
                <line
                  :x1="openingGeometry(o, w).p0[0]" :y1="sy(openingGeometry(o, w).p0[1])"
                  :x2="openingGeometry(o, w).p1[0]" :y2="sy(openingGeometry(o, w).p1[1])"
                  stroke="#9fd6e8" stroke-width="55" opacity=".55"
                />
                <line
                  :x1="openingGeometry(o, w).p0[0]" :y1="sy(openingGeometry(o, w).p0[1])"
                  :x2="openingGeometry(o, w).p1[0]" :y2="sy(openingGeometry(o, w).p1[1])"
                  stroke="#dfe8ec" stroke-width="12"
                />
              </template>
              <template v-else>
                <line
                  :x1="openingGeometry(o, w).hinge[0]" :y1="sy(openingGeometry(o, w).hinge[1])"
                  :x2="openingGeometry(o, w).openEnd[0]" :y2="sy(openingGeometry(o, w).openEnd[1])"
                  stroke="#94a3b8" stroke-width="28" stroke-linecap="round"
                />
                <path
                  :d="`M ${openingGeometry(o, w).other[0]} ${sy(openingGeometry(o, w).other[1])} A ${o.width} ${o.width} 0 0 ${openingGeometry(o, w).sweep} ${openingGeometry(o, w).openEnd[0]} ${sy(openingGeometry(o, w).openEnd[1])}`"
                  fill="none" stroke="#91a0ae" stroke-width="12" stroke-dasharray="40 35"
                />
              </template>
            </template>
          </template>
        </g>
      </g>

      <g v-if="showGlow && lightsOn">
        <g v-for="d in devices.filter(isLight)" :key="`glow-${d.id}`" :transform="deviceTransform(d)">
          <template v-if="d.glow === 'fan'">
            <path :d="fanPath(d)" fill="url(#glowPoint)" />
          </template>
          <template v-else-if="d.glow === 'area'">
            <rect
              :x="-d.size.width / 2" :y="-d.size.depth / 2"
              :width="d.size.width" :height="d.size.depth"
              :rx="Math.min(d.size.width, d.size.depth) * .3"
              fill="url(#glowArea)"
            />
          </template>
          <template v-else-if="visualOf(d) === 'point'">
            <circle :r="glowRadius(d)" fill="url(#glowPoint)" />
          </template>
          <template v-else-if="visualOf(d) === 'line'">
            <line
              :x1="-shapeW(d) / 2" y1="0" :x2="shapeW(d) / 2" y2="0"
              stroke="#ffc46b" :stroke-width="Math.max(220, d.size.depth * 2)" stroke-linecap="round" opacity=".18"
            />
            <line
              :x1="-shapeW(d) / 2" y1="0" :x2="shapeW(d) / 2" y2="0"
              stroke="#ffe0a0" :stroke-width="Math.max(70, d.size.depth)" stroke-linecap="round" opacity=".55"
            />
          </template>
          <template v-else-if="visualOf(d) === 'l' || visualOf(d) === 'u' || visualOf(d) === 'rect'">
            <path
              :d="shapePath(d)" fill="none" stroke="#ffc46b"
              stroke-width="230"
              stroke-linecap="round" stroke-linejoin="round" opacity=".2"
            />
            <path
              :d="shapePath(d)" fill="none" stroke="#ffe0a0"
              stroke-width="72"
              stroke-linecap="round" stroke-linejoin="round" opacity=".62"
            />
          </template>
          <template v-else-if="visualOf(d) === 'track'">
            <line :x1="-shapeW(d) / 2" y1="0" :x2="shapeW(d) / 2" y2="0" stroke="#ffc46b" :stroke-width="Math.max(160, d.size.depth * 2.6)" stroke-linecap="round" opacity=".18" />
            <circle v-for="(p, i) in trackHeads(d)" :key="i" :cx="p.x" cy="0" r="220" fill="url(#glowPoint)" />
          </template>
          <template v-else-if="visualOf(d) === 'array'">
            <circle v-for="(p, i) in arrayPoints(d)" :key="i" :cx="p.x" cy="0" :r="glowRadius(d)" fill="url(#glowPoint)" />
          </template>
          <template v-else-if="visualOf(d) === 'pointRect'">
            <circle v-for="(p, i) in pointRectPoints(d)" :key="i" :cx="p.x" :cy="p.y" :r="glowRadius(d) * .7" fill="url(#glowPoint)" />
          </template>
        </g>
      </g>

      <g v-if="showDevices">
        <g
          v-for="d in devices"
          :key="d.id"
          :transform="deviceTransform(d)"
          class="device-node"
          :class="{ selected: selectedDeviceId === d.id }"
          :style="{ color: colorFor(d) }"
          :data-device-id="d.id"
          :data-rule="d.ruleCode"
          :data-status="d.status"
          @pointerdown="onDeviceDown($event, d)"
          @pointermove="onDeviceMove"
          @pointerup="onDeviceUp"
        >
          <circle
            v-if="selectedDeviceId === d.id && ['point','array','pointRect'].includes(visualOf(d))"
            r="430" fill="none" stroke="#1687f5" stroke-width="34" stroke-dasharray="70 38"
          />
          <rect
            v-if="selectedDeviceId === d.id && ['line','l','u','rect','track'].includes(visualOf(d))"
            :x="-shapeW(d) / 2 - 120" :y="-shapeH(d) / 2 - 120"
            :width="shapeW(d) + 240" :height="shapeH(d) + 240"
            fill="none" stroke="#1687f5" stroke-width="30" stroke-dasharray="70 38"
          />

          <template v-if="['line','track'].includes(visualOf(d))">
            <line
              :x1="-shapeW(d) / 2" y1="0" :x2="shapeW(d) / 2" y2="0"
              stroke="transparent" :stroke-width="Math.max(520, d.size.depth * 3)" stroke-linecap="round"
            />
            <line
              :x1="-shapeW(d) / 2" y1="0" :x2="shapeW(d) / 2" y2="0"
              stroke="currentColor" :stroke-width="Math.max(46, d.size.depth)" stroke-linecap="round" opacity=".92"
            />
            <line
              :x1="-shapeW(d) / 2" y1="0" :x2="shapeW(d) / 2" y2="0"
              stroke="#fff0c8" :stroke-width="Math.max(10, d.size.depth * .22)" stroke-linecap="round" opacity=".8"
            />
            <template v-if="visualOf(d) === 'track'">
              <circle
                v-for="(p, i) in trackHeads(d)" :key="`head-${i}`"
                :cx="p.x" cy="0" r="86" fill="#ffffff" stroke="currentColor" stroke-width="24"
              />
              <circle
                v-for="(p, i) in trackHeads(d)" :key="`head-dot-${i}`"
                :cx="p.x" cy="0" r="28" fill="currentColor"
              />
            </template>
          </template>

          <template v-else-if="['l','u','rect'].includes(visualOf(d))">
            <path
              :d="shapePath(d)" fill="none" stroke="transparent"
              stroke-width="520" stroke-linecap="round" stroke-linejoin="round"
            />
            <path
              :d="shapePath(d)" fill="none" stroke="currentColor"
              :stroke-width="Math.max(58, Math.min(92, d.size.depth * .1))" stroke-linecap="round" stroke-linejoin="round"
            />
            <path
              :d="shapePath(d)" fill="none" stroke="#fff0c8"
              stroke-width="20" stroke-linecap="round" stroke-linejoin="round" opacity=".8"
            />
          </template>

          <template v-else-if="visualOf(d) === 'array'">
            <g v-for="(p, i) in arrayPoints(d)" :key="`arr-${i}`" :transform="`translate(${p.x} ${p.y})`">
              <circle r="168" fill="#ffffff" stroke="currentColor" stroke-width="12" opacity=".94" />
              <g transform="translate(-112 -112)">
                <DeviceIcon :shape="d.deviceKey ? deviceIcon(d.deviceKey) : 'generic'" :size="224" />
              </g>
            </g>
          </template>

          <template v-else-if="visualOf(d) === 'pointRect'">
            <g v-for="(p, i) in pointRectPoints(d)" :key="`pr-${i}`" :transform="`translate(${p.x} ${p.y})`">
              <circle r="158" fill="#ffffff" stroke="currentColor" stroke-width="12" opacity=".94" />
              <g transform="translate(-105 -105)">
                <DeviceIcon :shape="d.deviceKey ? deviceIcon(d.deviceKey) : 'generic'" :size="210" />
              </g>
            </g>
          </template>

          <template v-else>
            <circle r="225" fill="#ffffff" stroke="currentColor" stroke-width="12" opacity=".94" />
            <circle r="255" fill="none" stroke="currentColor" stroke-width="5" opacity=".28" />
            <g transform="translate(-150 -150)">
              <DeviceIcon :shape="d.deviceKey ? deviceIcon(d.deviceKey) : 'generic'" :size="300" />
            </g>
          </template>
        </g>
      </g>

      <g v-if="showLabels">
        <text
          v-for="r in project.rooms"
          :key="`label-${r.id}`"
          :x="roomCenter(r.id)[0]"
          :y="sy(roomCenter(r.id)[1])"
          text-anchor="middle"
          fill="#526579"
          font-size="250"
          font-weight="600"
          style="paint-order: stroke; stroke: #f7fafd; stroke-width: 60px; stroke-linejoin: round"
        >{{ r.name }} · {{ roomArea(r.id).toFixed(1) }}㎡</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.plan-wrap { position: absolute; inset: 0; overflow: hidden; }
.plan { width: 100%; height: 100%; display: block; touch-action: none; cursor: grab; }
.plan:active { cursor: grabbing; }
.device-node { cursor: pointer; }
.device-node:hover { filter: brightness(1.3); }
text { pointer-events: none; user-select: none; }
</style>

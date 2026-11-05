<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import type { Project } from '../../types';
import { bboxOf } from '../../core/geometry';
import { MaterialKit } from '../../render3d/materials';
import { PrimitiveKit } from '../../render3d/primitives';
import { buildArchitecture } from '../../render3d/architecture';
import { buildFurniture } from '../../render3d/furniture';
import { buildDevices, disposeGlowTexture } from '../../render3d/devices';
import { createLighting, type LightingRig } from '../../render3d/lighting';

const props = withDefaults(defineProps<{
  project: Project;
  lightsOn?: boolean;
  showFurniture?: boolean;
  showDevices?: boolean;
  showGlow?: boolean;
  selectedDeviceId?: string | null;
}>(), {
  lightsOn: false,
  showFurniture: true,
  showDevices: true,
  showGlow: true,
  selectedDeviceId: null,
});

const emit = defineEmits<{ (e: 'select-device', id: string | null): void }>();
const host = ref<HTMLDivElement | null>(null);

let renderer: THREE.WebGLRenderer | null = null;
let labelRenderer: CSS2DRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let controls: OrbitControls | null = null;
let root: THREE.Group | null = null;
let floors: THREE.Group | null = null;
let walls: THREE.Group | null = null;
let furniture: THREE.Group | null = null;
let deviceRoot: THREE.Group | null = null;
let labels: THREE.Group | null = null;
let raf = 0;
let resizeObs: ResizeObserver | null = null;
let lighting: LightingRig | null = null;
let mats: MaterialKit | null = null;
let prims: PrimitiveKit | null = null;
let cx = 0, cy = 0;
let size = 12;
const pointer = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

function wx(x: number) { return (x - cx) / 1000; }
function wz(y: number) { return (cy - y) / 1000; }

function disposeGroup(group: THREE.Object3D | null) {
  if (!group) return;
  group.traverse(object => {
    const mesh = object as THREE.Mesh;
    if (mesh.geometry) mesh.geometry.dispose();
    if ((object as THREE.Object3D & { element?: HTMLElement }).element) {
      (object as THREE.Object3D & { element?: HTMLElement }).element?.remove();
    }
  });
  group.clear();
}

function rebuild() {
  if (!scene || !root || !floors || !walls || !furniture || !deviceRoot || !labels || !mats || !prims) return;
  disposeGroup(floors);
  disposeGroup(walls);
  disposeGroup(furniture);
  disposeGroup(deviceRoot);
  disposeGroup(labels);

  const ctx = { mats, prims, wx, wz };
  const archProject = { ...props.project, ceilingHeight: Math.min(props.project.ceilingHeight, 2000) };
  buildArchitecture(archProject, ctx, { floors, walls, labels });
  if (props.showFurniture) {
    for (const item of props.project.furniture) furniture.add(buildFurniture(item, ctx));
  }
  if (props.showDevices) {
    const devices = buildDevices(props.project, ctx, {
      lightsOn: props.lightsOn,
      showGlow: props.showGlow,
      selectedDeviceId: props.selectedDeviceId,
    });
    deviceRoot.add(devices);
  }
  lighting?.apply(props.lightsOn);
}

function fitCamera() {
  if (!camera || !controls) return;
  const b = bboxOf(props.project.rooms.flatMap(r => r.polygon));
  cx = b.x + b.w / 2;
  cy = b.y + b.h / 2;
  size = Math.max(b.w, b.h) / 1000;
  camera.position.set(size * 0.9, size * 1.15, size * 0.95);
  camera.lookAt(0, 0, 0);
  controls.target.set(0, 0, 0);
  controls.maxDistance = size * 4;
  controls.update();
}

function animate() {
  raf = requestAnimationFrame(animate);
  controls?.update();
  if (renderer && scene && camera) renderer.render(scene, camera);
  if (labelRenderer && scene && camera) labelRenderer.render(scene, camera);
}

function onResize() {
  if (!host.value || !renderer || !camera || !labelRenderer) return;
  const w = host.value.clientWidth;
  const h = host.value.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
}

function onClick(e: PointerEvent) {
  if (!host.value || !camera || !deviceRoot) return;
  const rect = host.value.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(deviceRoot.children, true);
  if (!hits.length) {
    emit('select-device', null);
    return;
  }
  let object: THREE.Object3D | null = hits[0].object;
  while (object && !object.userData.deviceId) object = object.parent;
  emit('select-device', object?.userData.deviceId ?? null);
}

onMounted(() => {
  if (!host.value) return;
  const b = bboxOf(props.project.rooms.flatMap(r => r.polygon));
  cx = b.x + b.w / 2;
  cy = b.y + b.h / 2;
  size = Math.max(b.w, b.h) / 1000;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xeef6fd);
  scene.fog = new THREE.Fog(0xeef6fd, size * 3, size * 9);
  camera = new THREE.PerspectiveCamera(42, host.value.clientWidth / host.value.clientHeight, 0.1, 300);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(host.value.clientWidth, host.value.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.value.appendChild(renderer.domElement);

  labelRenderer = new CSS2DRenderer();
  labelRenderer.setSize(host.value.clientWidth, host.value.clientHeight);
  Object.assign(labelRenderer.domElement.style, { position: 'absolute', inset: '0', pointerEvents: 'none' });
  host.value.appendChild(labelRenderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.minDistance = 2;
  controls.target.set(0, 0, 0);

  mats = new MaterialKit(renderer);
  prims = new PrimitiveKit(mats);
  lighting = createLighting(scene, renderer, size, mats);

  root = new THREE.Group();
  floors = new THREE.Group();
  walls = new THREE.Group();
  furniture = new THREE.Group();
  deviceRoot = new THREE.Group();
  labels = new THREE.Group();
  root.add(floors, walls, furniture, deviceRoot, labels);
  scene.add(root);

  rebuild();
  fitCamera();
  lighting.apply(props.lightsOn);
  renderer.domElement.addEventListener('pointerup', onClick);
  resizeObs = new ResizeObserver(onResize);
  resizeObs.observe(host.value);
  animate();
});

watch(
  () => [props.project, props.lightsOn, props.showFurniture, props.showDevices, props.showGlow, props.selectedDeviceId],
  () => rebuild(),
  { deep: true },
);

onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  resizeObs?.disconnect();
  if (renderer?.domElement) renderer.domElement.removeEventListener('pointerup', onClick);
  disposeGroup(floors);
  disposeGroup(walls);
  disposeGroup(furniture);
  disposeGroup(deviceRoot);
  disposeGroup(labels);
  controls?.dispose();
  lighting?.dispose();
  mats?.dispose();
  disposeGlowTexture();
  renderer?.dispose();
  labelRenderer?.domElement.remove();
  renderer?.domElement.remove();
});
</script>

<template>
  <div ref="host" class="scene-host" />
</template>

<style scoped>
.scene-host { position: absolute; inset: 0; }
:deep(.scene-room-label) {
  color: #243447; font-size: 11px; font-weight: 600; letter-spacing: .06em;
  text-shadow: 0 1px 3px rgba(255,255,255,.9); white-space: nowrap;
  padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,.82);
}
</style>

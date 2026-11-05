<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(defineProps<{ shape?: string; size?: number }>(), {
  shape: 'generic',
  size: 22,
});

const ICONS: Record<string, string> = {
  downlight: '<circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/>',
  spotlight: '<circle cx="12" cy="12" r="6"/><path d="M12 6V2M12 22v-4M6 12H2M22 12h-4"/>',
  ceiling: '<circle cx="12" cy="12" r="7"/><path d="M7 7l10 10M17 7L7 17"/>',
  pendant: '<circle cx="12" cy="9" r="5"/><path d="M12 14v8M9 22h6"/>',
  panel: '<rect x="5" y="5" width="14" height="14" rx="1"/><path d="M5 5l14 14M19 5L5 19"/>',
  grille: '<rect x="4" y="7" width="16" height="10" rx="1"/><path d="M8 7v10M12 7v10M16 7v10"/>',
  wallLamp: '<path d="M5 18h14"/><path d="M8 18a4 4 0 0 1 8 0"/><path d="M12 14V8"/><path d="M9 6h6"/>',
  floorLamp: '<path d="M12 3v14"/><path d="M8 21h8"/><path d="M8 3h8l2 6H6z"/>',
  tableLamp: '<path d="M9 3h6l2 6H7z"/><path d="M12 9v9"/><path d="M8 21h8"/>',
  strip: '<path d="M3 12h18"/><path d="M3 9h18" opacity=".35"/>',
  stripL: '<path d="M6 3v14h15"/>',
  stripU: '<path d="M4 3v14h16V3"/>',
  stripSquare: '<rect x="4" y="6" width="16" height="12" rx="1"/>',
  array: '<circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/><path d="M4 8h16"/>',
  trackHead: '<path d="M3 6h18"/><circle cx="8" cy="12" r="2"/><circle cx="16" cy="12" r="2"/>',
  track: '<path d="M3 9h18"/><path d="M3 12h18"/>',
  magneticBody: '<rect x="6" y="7" width="12" height="10" rx="2"/><path d="M9 7v10M15 7v10"/>',
  switch: '<rect x="5" y="3" width="14" height="18" rx="2"/><rect x="9" y="7" width="6" height="4" rx="1"/><circle cx="12" cy="16" r="1.5"/>',
  scenePanel: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 8h3v3H8zM13 8h3v3h-3zM8 13h3v3H8zM13 13h3v3h-3z"/>',
  wirelessSwitch: '<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="8" r="2"/><path d="M9 15h6"/>',
  knob: '<circle cx="12" cy="12" r="7"/><path d="M12 12l4-4"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/>',
  screen: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 20h8M12 17v3"/>',
  pir: '<circle cx="12" cy="12" r="3"/><path d="M5 5a10 10 0 0 1 14 14M19 5A10 10 0 0 0 5 19"/>',
  presence: '<circle cx="12" cy="12" r="2"/><path d="M5 12a7 7 0 0 1 14 0M8 12a4 4 0 0 1 8 0"/>',
  temp: '<path d="M10 4a2 2 0 0 1 4 0v10a4 4 0 1 1-4 0z"/><path d="M12 8v6"/>',
  lux: '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  camera: '<rect x="4" y="7" width="11" height="8" rx="2"/><path d="M15 10l5-3v10l-5-3z"/><circle cx="9" cy="11" r="2"/>',
  lock: '<rect x="6" y="10" width="12" height="10" rx="2"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/><circle cx="12" cy="15" r="1.5"/>',
  gateway: '<rect x="4" y="9" width="16" height="10" rx="2"/><path d="M8 9V6a4 4 0 0 1 8 0v3"/><circle cx="8" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="16" cy="14" r="1"/>',
  router: '<rect x="3" y="10" width="18" height="7" rx="2"/><path d="M7 10V6M17 10V6"/><circle cx="7" cy="14" r="1"/><circle cx="12" cy="14" r="1"/><circle cx="17" cy="14" r="1"/>',
  ap: '<path d="M12 4v8"/><circle cx="12" cy="14" r="3"/><path d="M6 20a8 8 0 0 1 12 0"/>',
  weakBox: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h8M8 17h4"/>',
  poeBox: '<rect x="4" y="5" width="16" height="14" rx="2"/><path d="M8 9h8M8 13h5"/><path d="M15 13h2v4h-2z"/>',
  switchBox: '<rect x="4" y="7" width="16" height="10" rx="2"/><path d="M8 10v4M12 10v4M16 10v4"/>',
  ethernet: '<rect x="5" y="8" width="14" height="10" rx="2"/><path d="M9 8V5h6v3"/><path d="M9 13h6"/>',
  speaker: '<rect x="6" y="3" width="12" height="18" rx="3"/><circle cx="12" cy="9" r="2"/><circle cx="12" cy="15" r="3"/>',
  ceilingSpeaker: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  curtain: '<path d="M3 5h18"/><path d="M6 5v14M12 5v14M18 5v14"/><path d="M4 19h16"/>',
  roller: '<path d="M3 6h18"/><path d="M6 6v12M18 6v12"/><path d="M6 18h12"/>',
  acWall: '<rect x="3" y="8" width="18" height="7" rx="2"/><path d="M6 15v3M18 15v3"/><path d="M6 11h12"/>',
  acFloor: '<rect x="5" y="4" width="14" height="16" rx="2"/><path d="M8 8h8M8 12h8"/><circle cx="12" cy="16" r="2"/>',
  generic: '<rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="12" cy="12" r="2"/>',
};

const inner = computed(() => ICONS[props.shape] ?? ICONS.generic);
</script>

<template>
  <svg
    class="device-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.55"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <g v-html="inner" />
  </svg>
</template>

<style scoped>
.device-icon { display: block; flex: 0 0 auto; }
</style>

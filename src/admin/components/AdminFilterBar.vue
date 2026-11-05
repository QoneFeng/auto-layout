<script setup lang="ts">
withDefaults(defineProps<{ label?: string }>(), { label: '筛选' });
</script>

<template>
  <section class="filter-row" :aria-label="label">
    <slot />
    <span v-if="$slots.summary" class="filter-summary"><slot name="summary" /></span>
  </section>
</template>

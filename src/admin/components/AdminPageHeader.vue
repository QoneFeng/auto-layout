<script setup lang="ts">
withDefaults(defineProps<{
  title: string;
  description?: string;
  count?: string | number;
}>(), {
  description: '',
  count: '',
});
</script>

<template>
  <header class="page-toolbar">
    <div>
      <h2>{{ title }} <span v-if="count !== ''" class="product-count">{{ count }}</span></h2>
      <p v-if="description">{{ description }}</p>
      <slot name="meta" />
    </div>
    <div class="toolbar-buttons"><slot name="actions" /></div>
  </header>
</template>

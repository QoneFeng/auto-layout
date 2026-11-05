<script setup lang="ts">
import { NPagination } from 'naive-ui';

withDefaults(defineProps<{
  page: number;
  pageSize: number;
  total: number;
  currentCount: number;
  label: string;
  disabled?: boolean;
  pageSizes?: number[];
}>(), { disabled: false, pageSizes: () => [20, 30, 50, 100] });

const emit = defineEmits<{
  'update:page': [value: number];
  'update:pageSize': [value: number];
}>();
</script>

<template>
  <div class="page-pagination">
    <span>共 {{ total }} 个{{ label }} · 当前 {{ currentCount }} 条</span>
    <NPagination
      :page="page"
      :page-size="pageSize"
      :item-count="total"
      :page-slot="5"
      show-size-picker
      :page-sizes="pageSizes"
      :disabled="disabled"
      @update:page="value => emit('update:page', value)"
      @update:page-size="value => emit('update:pageSize', value)"
    />
  </div>
</template>

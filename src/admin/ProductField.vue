<script setup lang="ts">
import { NFormItem } from 'naive-ui';
withDefaults(defineProps<{ label: string; field?: string; errors?: Record<string, string>; required?: boolean; hint?: string }>(), { field: '', required: false });
</script>
<template>
  <NFormItem :label="label" :required="required" :show-require-mark="required" :label-props="{ for: `product-${field}` }" :validation-status="errors?.[field] ? 'error' : undefined" :feedback="errors?.[field]" :show-feedback="!!errors?.[field]">
    <div class="product-field-content"><slot /><small v-if="hint" class="product-field-hint">{{ hint }}</small></div>
  </NFormItem>
</template>

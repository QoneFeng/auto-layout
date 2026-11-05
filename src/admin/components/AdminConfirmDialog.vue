<script setup lang="ts">
import { NButton, NModal } from 'naive-ui';

withDefaults(defineProps<{
  show: boolean;
  title: string;
  message: string;
  detail?: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  loading?: boolean;
}>(), {
  detail: '',
  confirmText: '确认删除',
  cancelText: '取消',
  danger: false,
  loading: false,
});

const emit = defineEmits<{
  'update:show': [value: boolean];
  confirm: [];
}>();
</script>

<template>
  <NModal
    :show="show"
    :mask-closable="!loading"
    preset="card"
    class="admin-confirm-modal"
    :title="title"
    :bordered="false"
    @update:show="value => emit('update:show', value)"
  >
    <p class="admin-confirm-message">{{ message }}</p>
    <p v-if="detail" class="admin-confirm-detail">{{ detail }}</p>
    <template #footer>
      <div class="admin-confirm-actions">
        <NButton :disabled="loading" @click="emit('update:show', false)">{{ cancelText }}</NButton>
        <NButton :type="danger ? 'error' : 'primary'" :loading="loading" @click="emit('confirm')">{{ confirmText }}</NButton>
      </div>
    </template>
  </NModal>
</template>

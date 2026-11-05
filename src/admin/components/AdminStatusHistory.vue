<script setup lang="ts">
import { computed } from 'vue';
import { NTag } from 'naive-ui';

type StatusStepState = 'done' | 'current' | 'pending' | 'void';
type StatusStep = {
  key: string;
  label: string;
  state: StatusStepState;
  actor?: string;
  at?: string;
  note?: string;
  terminal?: boolean;
};

const props = withDefaults(defineProps<{
  steps: StatusStep[];
  title?: string;
  badge?: string;
  badgeType?: 'default' | 'success' | 'warning' | 'error' | 'info';
  timeLabel?: string;
}>(), {
  title: '状态记录',
  badge: '',
  badgeType: 'default',
  timeLabel: '',
});

const metaText = (step: StatusStep) => {
  if (step.actor || step.at) return '';
  if (step.state === 'pending') return '未到达';
  if (step.state === 'current') return '当前状态';
  return '已到达 · 历史未记录';
};

const badgeText = computed(() => props.badge);
</script>

<template>
  <div class="status-history">
    <header class="status-history__head">
      <div>
        <span class="panel-kicker">STATUS HISTORY</span>
        <h3>{{ title }}</h3>
      </div>
      <NTag v-if="badgeText" :type="badgeType" :bordered="false">{{ badgeText }}</NTag>
    </header>
    <ol class="status-history__steps" :style="{ '--steps': String(steps.length) }">
      <li
        v-for="(step, index) in steps"
        :key="step.key"
        class="status-history__step"
        :class="[step.state, { terminal: step.terminal }]"
        :aria-current="step.state === 'current' ? 'step' : undefined"
      >
        <span class="status-history__dot" aria-hidden="true">{{ step.state === 'done' ? '✓' : index + 1 }}</span>
        <span class="status-history__label">{{ step.label }}</span>
        <span v-if="step.actor" class="status-history__meta">{{ step.actor }}</span>
        <span v-if="step.at" class="status-history__meta">{{ step.at }}</span>
        <span v-if="step.note" class="status-history__meta status-history__note">{{ step.note }}</span>
        <span v-if="!step.actor && !step.at && !step.note" class="status-history__meta">{{ metaText(step) }}</span>
        <span v-if="timeLabel && step.state === 'current' && !step.at" class="status-history__meta">{{ timeLabel }}</span>
      </li>
    </ol>
  </div>
</template>

<script setup lang="ts">
import type { PointRule } from '../types';
import { ANCHOR_LABELS, MOUNT_LABELS, PRIORITY_LABELS, ruleFlagText } from '../core/explain';

defineProps<{ rule: PointRule }>();
</script>

<template>
  <div class="rule-detail">
    <p class="src"><span>规则原文</span>{{ rule.sourceText }}</p>
    <div class="kv compact">
      <div><span>用途</span><strong>{{ rule.usage || '基础布点' }}</strong></div>
      <div><span>锚点</span><strong>{{ ANCHOR_LABELS[rule.anchor.kind] }}（{{ rule.anchor.raw }}）</strong></div>
      <div><span>安装面 / 高度</span><strong>{{ MOUNT_LABELS[rule.mount] }} · {{ rule.height.base }}{{ rule.height.offset >= 0 ? '+' : '' }}{{ rule.height.offset }}</strong></div>
      <div><span>数量</span><strong>{{ rule.quantity.raw }}</strong></div>
      <div><span>最小间距</span><strong>{{ rule.spacing ? `${rule.spacing}mm` : '未限制' }}</strong></div>
      <div><span>优先级</span><strong>{{ rule.priority }} · {{ PRIORITY_LABELS[rule.priority] }}</strong></div>
      <div><span>避让</span><strong>{{ rule.collision.join('、') || '—' }}</strong></div>
      <div><span>降级链</span><strong>{{ rule.fallback.join(' → ') || '—' }}</strong></div>
    </div>
    <div class="chip-row">
      <span v-for="f in rule.traceFlags" :key="f" class="chip">{{ ruleFlagText(f) }}</span>
      <span v-if="!rule.traceFlags.length" class="muted">无额外标记</span>
    </div>
  </div>
</template>

<style scoped>
.rule-detail { margin: 2px 0 4px 15px; padding: 10px; background: #10151b; border: 1px solid #232b35; border-radius: 8px; }
.src { margin: 0 0 9px; padding: 7px 8px; background: #161c24; border-left: 2px solid #f5b544; border-radius: 4px; color: #cfc9bd; font-size: 10px; line-height: 1.6; }
.src span { display: block; color: #f5b544; font-size: 9px; letter-spacing: .08em; margin-bottom: 3px; }
.kv { display: flex; flex-direction: column; gap: 6px; }
.kv div { display: flex; justify-content: space-between; gap: 10px; font-size: 10px; color: #7e8691; border-bottom: 1px solid #1a2027; padding-bottom: 5px; }
.kv div:last-child { border-bottom: 0; padding-bottom: 0; }
.kv strong { color: #d8d6d0; font-weight: 500; text-align: right; }
.chip-row { display: flex; gap: 5px; flex-wrap: wrap; margin-top: 8px; }
.chip { font-size: 9.5px; color: #b9b3a8; background: #1b2028; border: 1px solid #2a3038; border-radius: 99px; padding: 2px 6px; }
.muted { color: #5d6570; font-size: 10px; }
</style>

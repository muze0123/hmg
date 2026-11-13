<script setup lang="ts">
import { computed } from 'vue';
import profile from '../project.json';
const props = withDefaults(defineProps<{
  text: string;
  for?: string;
  as?: 'label' | 'span';
  context?: 'editable' | 'filter' | 'detail';
}>(), { as: 'span', context: 'editable' });
// 冒号不再由本组件 scoped 的 ::after 渲染：统一挂共享类 .app-field-label，
// 交给 global.css 的 .app-field-label::after 从 --app-field-colon 渲染一次，
// 随 <html lang> 输出 zh-CN「：」/ en-US「:」（DESIGN.md · Field label colon）。
// 是否带冒号仍由 project.json 的标点档位决定，本轮只把 filter 档位打开。
const hasColon = computed(() => ({ editable: profile.editableLabelColon, filter: profile.filterLabelColon, detail: profile.detailLabelColon })[props.context]);
</script>

<template>
  <component :is="props.as" :for="props.as === 'label' ? props.for : undefined" class="mt-field-label" :class="{ 'app-field-label': hasColon }">{{ props.text }}</component>
</template>

<style scoped>
.mt-field-label { color: var(--mt-ds-text-secondary); font-size: var(--mt-ds-font-body); font-weight: var(--mt-ds-weight-body); line-height: var(--mt-ds-line-body); }
</style>

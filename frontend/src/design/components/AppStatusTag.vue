<script setup lang="ts">
/**
 * 平台统一状态标签（DESIGN.md · Tag 标签 / Status roles and domain ownership）。
 *
 * 只负责 `role → 外观`：采用 Tag 的 light 变体（语义浅底 + 对比度达标的深色文字），
 * 颜色全部取自 tokens.project.json 的 --app-status-* 变量，亮/暗主题在 Token 层集中适配，
 * 页面不得再写自己的状态色。业务枚举 → role 由 src/shared/status.ts 与各业务域拥有。
 * 状态始终带文字标签，颜色不是唯一线索（DESIGN.md · Accessibility）。
 */
import { computed } from 'vue';
import type { StatusRole } from '../../shared/status';

const props = withDefaults(defineProps<{
  /** 已由业务域解析好的语义角色；缺省按 neutral 兜底 */
  role?: StatusRole;
  /** 业务状态文案，由调用方用自己的 i18n 命名空间提供 */
  label: string;
}>(), { role: 'neutral' });

const resolved = computed<StatusRole>(() => props.role ?? 'neutral');
</script>

<template>
  <a-tag class="app-status-tag" :class="`app-status-tag--${resolved}`">{{ label }}</a-tag>
</template>

<style scoped>
/* Tag 标签 · medium：24px 高 / 8px 水平内边距 / 14px-400-22 / 2px 圆角。
   列表内的文字统一 400 字重（DESIGN.md · Data-list text weight）。 */
.app-status-tag {
  height: 24px;
  padding: 1px 8px;
  border: 0;
  border-radius: 2px;
  font-size: 14px;
  font-weight: 400;
  line-height: 22px;
  white-space: nowrap;
}
/* 双类选择器只在组件内部提高特异性：Arco 深色主题用
   body[arco-theme="dark"] .arco-tag-checked (0,2,1) 覆盖文字色，
   复合选择器 (0,3,0) 保证亮/暗都落到 --app-status-*-fg 上，无需 !important。 */
.app-status-tag.app-status-tag--neutral { background-color: var(--app-status-neutral-bg); color: var(--app-status-neutral-fg); }
.app-status-tag.app-status-tag--info { background-color: var(--app-status-info-bg); color: var(--app-status-info-fg); }
.app-status-tag.app-status-tag--success { background-color: var(--app-status-success-bg); color: var(--app-status-success-fg); }
.app-status-tag.app-status-tag--warning { background-color: var(--app-status-warning-bg); color: var(--app-status-warning-fg); }
.app-status-tag.app-status-tag--danger { background-color: var(--app-status-danger-bg); color: var(--app-status-danger-fg); }
</style>

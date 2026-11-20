<script setup lang="ts">
import { IconLeft } from '@arco-design/web-vue/es/icon';
const props = withDefaults(defineProps<{
  ancestorTo?: string;
  ancestorLabel: string;
  currentLabel: string;
  /** 面包屑导航的 aria-label；不传时回退为父级模块名。 */
  navAriaLabel?: string;
  /** 当详情子页是页内状态（非独立路由）时，传此回调让「‹ 父级」作为按钮关闭子页而非跳转。 */
  ancestorBack?: () => void;
}>(), { ancestorTo: '', navAriaLabel: '', ancestorBack: undefined });
</script>

<template>
  <header class="detail-toolbar">
    <nav class="detail-breadcrumb" :aria-label="navAriaLabel || ancestorLabel">
      <router-link v-if="!ancestorBack" class="detail-ancestor" :to="ancestorTo">
        <IconLeft />
        <span class="detail-ancestor-text">{{ ancestorLabel }}</span>
      </router-link>
      <button v-else type="button" class="detail-ancestor" @click="ancestorBack">
        <IconLeft />
        <span class="detail-ancestor-text">{{ ancestorLabel }}</span>
      </button>
      <span class="detail-separator" aria-hidden="true">/</span>
      <span class="detail-current" aria-current="page">{{ currentLabel }}</span>
    </nav>
    <div v-if="$slots.actions" class="detail-actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.detail-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--mt-ds-space-4); flex-wrap: wrap; padding: var(--mt-ds-space-4); border-radius: var(--mt-ds-control-radius); background: var(--app-surface); min-width: 0; }
.detail-breadcrumb { display: flex; align-items: center; flex-wrap: wrap; gap: var(--mt-ds-space-2); font-size: var(--mt-ds-font-body); line-height: var(--mt-ds-line-body); }
.detail-ancestor { display: inline-flex; align-items: center; gap: var(--mt-ds-space-2); padding: 4px 8px; margin: -4px -8px; border-radius: var(--mt-ds-control-radius); color: var(--color-text-3); font-weight: var(--mt-ds-weight-body); text-decoration: none; transition: color .12s, background-color .12s; }
.detail-ancestor:hover { color: var(--app-color-primary); background: transparent; }
.detail-ancestor:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
.detail-separator { color: var(--color-text-3); }
.detail-current { color: var(--color-text-1); font-weight: var(--mt-ds-weight-title); }
.detail-actions { display: flex; align-items: center; gap: var(--mt-ds-space-2); flex-wrap: wrap; }
button.detail-ancestor { border: 0; background: transparent; font: inherit; cursor: pointer; }
</style>

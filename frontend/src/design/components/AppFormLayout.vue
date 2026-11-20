<template>
  <div class="mt-form-layout"><slot /></div>
</template>

<style scoped>
/* 详情子页面填写与清空交互（DESIGN.md · 2026-11-13）：详情/编辑子页的可填写控件固定 400px，
   窄屏 max-width:100% 收缩换行。该组件只用于详情子页，故直接采用 400px 而非通用表单的 500px。 */
.mt-form-layout { width: 400px; max-width: 100%; min-width: 0; }
.mt-form-layout :deep(.arco-form-item) { margin-bottom: var(--mt-ds-space-4); }
.mt-form-layout :deep(.arco-form-item-label-col) { text-align: left; }
.mt-form-layout :deep(.arco-form-item-label) { color: var(--mt-ds-text-secondary); font-size: var(--mt-ds-font-body); line-height: var(--mt-ds-line-body); font-weight: var(--mt-ds-weight-body); }
.mt-form-layout :deep(.arco-form-item-wrapper-col) { min-width: 0; }
.mt-form-layout :deep(.arco-form-item-content > *) { max-width: 100%; }
</style>

<script setup lang="ts">
import { recordTaskEvent } from '../../projects/data/history';
import ExecutionTaskList from '../../task-execution/components/ExecutionTaskList.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import { watch, computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { technicalTasks } from '../data/technical';
const { t } = useI18n();
const route = useRoute(); const router = useRouter();
const rows = reactive(technicalTasks);
const current = computed(() => rows.find(row => row.id === route.params.id));
const mode = computed(() => String(route.params.mode || 'view'));
const editable = computed(() => mode.value === 'edit' && !!current.value?.ready && ['pending', 'submitting', 'rejected', 'withdrawn'].includes(current.value.status));
const value = ref(''); const opinion = ref(''); const dirty = ref(false);
watch(() => route.params.id, () => { value.value = current.value?.value || ''; opinion.value = ''; dirty.value = false; }, { immediate: true });
function save(submit = false) {
  const task = current.value;
  if (!task || !editable.value) return;
  if (submit && (!value.value.trim() || !Number.isFinite(Number(value.value)) || Number(value.value) <= 0)) {
    Message.error(t('tech.required'));
    return;
  }
  recordTaskEvent(task.project, 'technical', submit ? 'review' : 'draft', task.owner, '', task.id, submit ? task.reviewer : undefined);
  task.value = value.value;
  task.status = submit ? 'reviewing' : 'submitting';
  if (submit) {
    task.executedAt = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
    task.reviewedAt = '';
  }
  dirty.value = false;
  Message.success(t('tech.saved'));
  void router.push('/tasks/technical');
}
function review(pass: boolean) {
  const task = current.value;
  if (!task || mode.value !== 'review' || task.status !== 'reviewing' || !opinion.value.trim()) {
    Message.error(t('tech.opinionRequired'));
    return;
  }
  recordTaskEvent(task.project, 'technical', pass ? 'approve' : 'reject', task.reviewer, opinion.value, task.id, pass ? undefined : task.owner);
  task.status = pass ? 'completed' : 'rejected';
  task.reviewedAt = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
  task.actual = pass ? task.reviewedAt.slice(0, 10) : '';
  task.opinion = opinion.value;
  dirty.value = false;
  void router.push('/tasks/technical');
}
onBeforeRouteLeave(() => !dirty.value || requestLeave());
const leaveVisible = ref(false);
let resolveLeave: ((allow: boolean) => void) | undefined;
function requestLeave() {
  return new Promise<boolean>(resolve => { resolveLeave = resolve; leaveVisible.value = true; });
}
function finishLeave(allow: boolean) {
  leaveVisible.value = false;
  resolveLeave?.(allow);
  resolveLeave = undefined;
}
</script>
<template>
 <main class="technical-page">
  <header v-if="route.params.id"><a-button @click="router.push('/tasks/technical')">{{ t('tech.back') }}</a-button></header>
  
  <ExecutionTaskList v-if="!route.params.id" module="technical" :rows="rows" />
  <section v-else-if="current" class="detail">
   <h2>{{ t('tech.base') }}</h2><a-descriptions :column="2" bordered><a-descriptions-item v-for="key in (['regulation','project','name','owner','reviewer'] as const)" :key="key" :label="t(`tech.${key}`)">{{ current[key] }}</a-descriptions-item><a-descriptions-item :label="t('tech.status')">{{ t(`projects.${current.status}`) }}</a-descriptions-item></a-descriptions>
   <h2>{{ t('tech.content') }}</h2><a-alert v-if="!current.ready">{{ t('tech.gate') }}</a-alert>
   <a-form :model="{}" layout="vertical"><a-form-item :label="t('tech.mass')" :required="editable"><a-input v-if="editable" v-model="value" :disabled="!current.ready" @input="dirty = true" /><span v-else>{{ current.value || '—' }}</span></a-form-item>
   <a-form-item v-if="mode === 'review' && current.status === 'reviewing'" :label="t('tech.opinion')" required><a-textarea v-model="opinion" @input="dirty = true" /></a-form-item></a-form>
   <a-space v-if="editable"><a-button @click="save()">{{ t('tech.save') }}</a-button><a-button type="primary" @click="save(true)">{{ t('tech.submit') }}</a-button></a-space>
   <a-space v-if="mode === 'review' && current.status === 'reviewing'"><a-button status="danger" @click="review(false)">{{ t('tech.reject') }}</a-button><a-button type="primary" @click="review(true)">{{ t('tech.pass') }}</a-button></a-space>
   <h2>{{ t('tech.history') }}</h2><p>{{ current.opinion || t('tech.noHistory') }}</p>
  </section><a-empty v-else :description="t('tech.empty')" />
 </main>
<ConfirmDialog unsaved :visible="leaveVisible" :title="t('tech.leave')" @update:visible="finishLeave(false)" @confirm="finishLeave(true)" />
</template>
<style scoped>
.technical-page { min-width: 0; color: var(--app-text-primary); font-size: var(--mt-ds-font-body); }
header { display: flex; justify-content: flex-end; margin-bottom: var(--mt-ds-space-3); }
.filters, .list, .detail { min-width: 0; padding: var(--mt-ds-space-4); background: var(--app-surface-container); }
/* 筛选区布局统一走 global.css 的 app-filter-strip / app-filter-unit / app-filter-actions */
.filters { margin-bottom: var(--mt-ds-space-3); }
.detail :deep(.arco-form) { margin-top: var(--mt-ds-space-4); width: var(--mt-ds-form-width); max-width: 100%; }
h2 { margin: var(--mt-ds-space-4) 0; font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
h2:first-child { margin-top: 0; }
:deep(.arco-table-th) { height: 50px; background: var(--app-surface); }
:deep(.arco-table-th), :deep(.arco-table-td), :deep(.arco-tag), :deep(.arco-btn), :deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { height: 50px; border-bottom: 1px solid var(--app-divider); }
/* 窄屏流式布局由 global.css 的 .app-filter-strip 媒体查询统一处理 */
</style>

<script setup lang="ts">
import ExecutionTaskList from "../../task-execution/components/ExecutionTaskList.vue";
import { recordTaskEvent } from '../../projects/data/history';
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import { reports, type ReportStatus } from '../data/reports';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const summary = ref('');
const opinion = ref('');
const confirm = ref(false);
const exporting = ref(false);
const template = ref('');
const filename = ref('');
const error = ref('');
const current = computed(() => reports.find(row => row.id === route.params.id));
const mode = computed(() => String(route.params.mode || 'view'));
const editable = computed(() => !!current.value?.ready && ['pending', 'submitting', 'rejected', 'withdrawn'].includes(current.value.status));
const dirty = computed(() => !!current.value && (summary.value !== current.value.summary || !!opinion.value));
watch(() => route.fullPath, () => { summary.value = current.value?.summary || ''; opinion.value = ''; error.value = ''; }, { immediate: true });
let resolveLeave: ((value: boolean) => void) | undefined;
const leave = ref(false);
function guard() { if (!dirty.value) return true; leave.value = true; return new Promise<boolean>(resolve => { resolveLeave = resolve; }); }
onBeforeRouteLeave(guard);
onBeforeRouteUpdate(guard);
watch(leave, value => { if (!value && resolveLeave) { resolveLeave(false); resolveLeave = undefined; } });
function discard() { const resolve = resolveLeave; resolveLeave = undefined; leave.value = false; resolve?.(true); }
function validate() {
  if (summary.value.trim()) return true;
  error.value = t('reports.required');
  document.querySelector<HTMLTextAreaElement>('#report-summary')?.focus();
  return false;
}
function save(submit = false) {
  if (!current.value || !editable.value) return;
  if (submit && !validate()) { confirm.value = false; return; }
  recordTaskEvent(current.value.project, 'report', submit ? 'review' : 'draft', current.value.owner, '', current.value.id, submit ? current.value.reviewer : undefined);
  current.value.summary = summary.value;
  current.value.status = submit ? 'reviewing' : 'submitting';
  if (submit) { current.value.executedAt = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }); current.value.reviewedAt = ''; }
  confirm.value = false;
  Message.success(t('reports.saved'));
  router.push('/tasks/reports');
}
function review(next: ReportStatus) {
  if (!current.value || current.value.status !== 'reviewing') return;
  if (!opinion.value.trim()) { error.value = t('reports.opinionRequired'); document.querySelector<HTMLTextAreaElement>('#report-opinion')?.focus(); return; }
  recordTaskEvent(current.value.project, 'report', next === 'completed' ? 'approve' : 'reject', current.value.reviewer, opinion.value, current.value.id, next === 'completed' ? undefined : current.value.owner);
  current.value.status = next;
  current.value.reviewedAt = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
  current.value.actual = next === 'completed' ? new Date().toLocaleDateString('en-CA') : '';
  current.value.history.push({ status: next, comment: opinion.value, time: new Date().toLocaleString() });
  opinion.value = '';
  Message.success(t('reports.saved'));
  router.push('/tasks/reports');
}
function printReport() {
  if (!template.value || !filename.value.trim()) return;
  const row = current.value;
  if (!row || row.status !== 'completed') return;
  const popup = window.open('', '_blank');
  if (!popup) { Message.error(t('reports.exportNote')); return; }
  popup.document.title = filename.value;
  const heading = popup.document.createElement('h1'); heading.textContent = t('reports.standard'); popup.document.body.append(heading);
  for (const [label, value] of ['id','project','name','regulation','summary','technical','testing'].map(key => [t(`reports.${key}`), String(row[key as keyof typeof row])])) {
    const line = popup.document.createElement('p'); line.textContent = `${label} ${value}`; popup.document.body.append(line);
  }
  const style = popup.document.createElement('style'); style.textContent = '@page { size: A4 portrait; margin: 20mm; } body { font-family: sans-serif; overflow-wrap: anywhere; }'; popup.document.head.append(style);
  popup.document.close(); popup.focus(); popup.print();
}
</script>
<template>
  <main class="reports-page">
    
    <ExecutionTaskList v-if="!route.params.id" module="reports" :rows="reports" />
    <template v-else-if="current">
      <a-button @click="router.push('/tasks/reports')">{{ t('reports.back') }}</a-button>
      <section class="surface detail">
        <h2>{{ t('reports.base') }}</h2>
        <a-descriptions :column="1" bordered><a-descriptions-item v-for="key in (['id','project','name','regulation','owner','reviewer','start','end','actual'] as const)" :key="key" :label="t(`reports.${key}`)">{{ current[key] || '—' }}</a-descriptions-item><a-descriptions-item :label="t('reports.status')">{{ t(`taskStatus.${current.status}`) }}</a-descriptions-item></a-descriptions>
        <h2>{{ t('reports.content') }}</h2>
        <a-alert v-if="!current.ready">{{ t('reports.gate') }}</a-alert>
        <a-form :model="{}" layout="vertical">
          <a-form-item :validate-status="error && mode === 'edit' ? 'error' : undefined" :help="mode === 'edit' ? error : ''"><template #label><AppFieldLabel as="label" for="report-summary" :text="t('reports.summary')" /></template><a-textarea v-if="mode === 'edit' && editable" :textarea-attrs="{ id: 'report-summary', 'aria-label': t('reports.summary') }" v-model="summary" :max-length="5000" /><p v-else>{{ current.summary || '—' }}</p></a-form-item>
          <a-form-item v-for="key in (['technical','testing'] as const)" :key="key"><template #label><AppFieldLabel :text="t(`reports.${key}`)" /></template><span>{{ current[key] }} · {{ t('reports.reference') }}</span></a-form-item>
          <a-form-item v-if="mode === 'review' && current.status === 'reviewing'" :help="error" :validate-status="error ? 'error' : undefined"><template #label><AppFieldLabel as="label" for="report-opinion" :text="t('reports.opinion')" /></template><a-textarea :textarea-attrs="{ id: 'report-opinion', 'aria-label': t('reports.opinion') }" v-model="opinion" :max-length="1000" /></a-form-item>
        </a-form>
        <a-space v-if="mode === 'edit' && editable"><a-button @click="save()">{{ t('reports.save') }}</a-button><a-button type="primary" @click="validate() && (confirm = true)">{{ t('reports.submit') }}</a-button></a-space>
        <a-space v-if="mode === 'review' && current.status === 'reviewing'"><a-button status="danger" @click="review('rejected')">{{ t('reports.reject') }}</a-button><a-button type="primary" @click="review('completed')">{{ t('reports.approve') }}</a-button></a-space>
        <a-button v-if="current.status === 'completed'" @click="exporting = true; filename = current.id">{{ t('reports.export') }}</a-button>
        <h2>{{ t('reports.history') }}</h2><p v-if="!current.history.length">{{ t('reports.noHistory') }}</p><p v-for="(entry, index) in current.history" :key="index">{{ entry.time }} · {{ t(`taskStatus.${entry.status}`) }} · {{ entry.comment }}</p>
      </section>
    </template>
    <a-empty v-else :description="t('reports.missing')" />
    <ConfirmDialog v-model:visible="confirm" :title="t('reports.confirmSubmit')" @confirm="save(true)" />
    <ConfirmDialog unsaved v-model:visible="leave" :title="t('reports.leave')" @confirm="discard" />
    <a-modal v-model:visible="exporting" :title="t('reports.export')" :mask-closable="false" :width="'min(600px, calc(100vw - 32px))'">
      <a-alert>{{ t('reports.exportNote') }}</a-alert>
      <a-form :model="{}" layout="vertical"><a-form-item :label="t('reports.template')" required><a-select v-model="template" :aria-label="t('reports.template')"><a-option value="standard">{{ t('reports.standard') }}</a-option></a-select></a-form-item><p>{{ t('reports.format') }}</p><a-form-item :label="t('reports.filename')" required><a-input v-model="filename" :aria-label="t('reports.filename')" :max-length="100" /></a-form-item></a-form>
      <template #footer><a-space><a-button @click="exporting = false">{{ t('reports.cancel') }}</a-button><a-button type="primary" :disabled="!template || !filename.trim()" @click="printReport">{{ t('reports.preview') }}</a-button></a-space></template>
    </a-modal>
  </main>
</template>
<style scoped>
.reports-page { width: 100%; max-width: 100%; min-width: 0; color: var(--app-text-primary); }
.filters { padding: var(--mt-ds-space-4); background: var(--app-surface); margin-bottom: var(--mt-ds-space-3); }
.surface { overflow: hidden; background: var(--app-surface); padding: var(--mt-ds-space-4); min-width: 0; }
.detail { margin-top: var(--mt-ds-space-3); overflow-wrap: anywhere; }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); margin: var(--mt-ds-space-6) 0 var(--mt-ds-space-4); }
h2:first-child { margin-top: 0; }
p { white-space: pre-wrap; }
:deep(.arco-table-th) { height: 50px; background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { height: 50px; border-bottom: 1px solid var(--app-divider); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-btn), :deep(.arco-tag), :deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
</style>

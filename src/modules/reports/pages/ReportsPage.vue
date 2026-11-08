<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { IconSearch, IconRefresh } from '@arco-design/web-vue/es/icon';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import { reports, REPORT_STATUSES, type ReportStatus } from '../data/reports';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const keyword = ref('');
const status = ref('');
const applied = ref('');
const appliedStatus = ref('');
const page = ref(1);
const size = ref(10);
const summary = ref('');
const opinion = ref('');
const confirm = ref(false);
const exporting = ref(false);
const template = ref('');
const filename = ref('');
const error = ref('');
const current = computed(() => reports.find(row => row.id === route.params.id));
const mode = computed(() => String(route.params.mode || 'view'));
const editable = computed(() => !!current.value?.ready && ['pending', 'rejected'].includes(current.value.status));
const dirty = computed(() => !!current.value && (summary.value !== current.value.summary || !!opinion.value));
const filtered = computed(() => reports.filter(row => (!appliedStatus.value || row.status === appliedStatus.value) && `${row.id} ${row.project} ${row.name} ${row.regulation}`.toLowerCase().includes(applied.value.toLowerCase())));
const visible = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value));
const keys = ['regulation', 'project', 'name', 'status', 'start', 'end', 'actual', 'actions'] as const;
const columns = computed(() => keys.map(key => ({ title: t(`reports.${key}`), dataIndex: key, slotName: key === 'status' || key === 'actions' ? key : undefined, width: key === 'actions' ? 260 : 160 })));
watch(() => route.fullPath, () => { summary.value = current.value?.summary || ''; opinion.value = ''; error.value = ''; }, { immediate: true });
function search() { applied.value = keyword.value; appliedStatus.value = status.value; page.value = 1; }
function reset() { keyword.value = ''; status.value = ''; search(); }
function open(id: string, action: string) { router.push(`/tasks/reports/${id}/${action}`); }
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
  current.value.summary = summary.value;
  if (submit) current.value.status = 'reviewing';
  confirm.value = false;
  Message.success(t('reports.saved'));
  router.push('/tasks/reports');
}
function review(next: ReportStatus) {
  if (!current.value || current.value.status !== 'reviewing') return;
  if (!opinion.value.trim()) { error.value = t('reports.opinionRequired'); document.querySelector<HTMLTextAreaElement>('#report-opinion')?.focus(); return; }
  current.value.status = next;
  current.value.actual = next === 'completed' ? new Date().toLocaleDateString('en-CA') : '';
  current.value.history.push({ status: next, comment: opinion.value, time: new Date().toLocaleString() });
  opinion.value = '';
  Message.success(t('reports.saved'));
  router.push('/tasks/reports');
}
function startExport(id: string) { open(id, 'export'); template.value = ''; filename.value = id; exporting.value = true; }
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
    
    <template v-if="!route.params.id">
      <form class="filters" @submit.prevent="search">
        <div class="filter"><AppFieldLabel as="label" for="report-keyword" context="filter" :text="t('reports.keyword')" /><a-input id="report-keyword" v-model="keyword" class="app-filter-control" allow-clear /></div>
        <div class="filter"><AppFieldLabel as="label" for="report-status" context="filter" :text="t('reports.status')" /><a-select id="report-status" v-model="status" class="app-filter-control" allow-clear :aria-label="t('reports.status')"><a-option v-for="code in REPORT_STATUSES" :key="code" :value="code">{{ t(`reports.${code}`) }}</a-option></a-select></div>
        <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('reports.search') }}</a-button>
        <a-button @click="reset"><template #icon><IconRefresh /></template>{{ t('reports.reset') }}</a-button>
      </form>
      <section class="surface">
        <a-table :columns="columns" :data="visible" row-key="id" :pagination="false" :scroll="{ x: 1380 }">
          <template #status="{ record }"><a-tag :color="record.status === 'completed' ? 'green' : record.status === 'rejected' ? 'red' : 'arcoblue'">{{ t(`reports.${record.status}`) }}</a-tag></template>
          <template #actions="{ record }"><a-space><a-button type="text" @click="open(record.id, 'view')">{{ t('reports.view') }}</a-button><a-tooltip :content="t('reports.gate')" :disabled="record.ready"><a-button type="text" :disabled="!record.ready || !['pending','rejected'].includes(record.status)" @click="open(record.id, 'edit')">{{ t('reports.edit') }}</a-button></a-tooltip><a-button v-if="record.status === 'reviewing'" type="text" @click="open(record.id, 'review')">{{ t('reports.review') }}</a-button><a-button v-if="record.status === 'completed'" type="text" @click="startExport(record.id)">{{ t('reports.export') }}</a-button></a-space></template>
          <template #empty><a-empty :description="t('reports.empty')" /></template>
        </a-table>
        <AppPagination v-model:current="page" v-model:page-size="size" :total="filtered.length" />
      </section>
    </template>
    <template v-else-if="current">
      <a-button @click="router.push('/tasks/reports')">{{ t('reports.back') }}</a-button>
      <section class="surface detail">
        <h2>{{ t('reports.base') }}</h2>
        <a-descriptions :column="1" bordered><a-descriptions-item v-for="key in (['id','project','name','regulation','owner','reviewer','start','end','actual'] as const)" :key="key" :label="t(`reports.${key}`)">{{ current[key] || '—' }}</a-descriptions-item><a-descriptions-item :label="t('reports.status')">{{ t(`reports.${current.status}`) }}</a-descriptions-item></a-descriptions>
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
        <h2>{{ t('reports.history') }}</h2><p v-if="!current.history.length">{{ t('reports.noHistory') }}</p><p v-for="(entry, index) in current.history" :key="index">{{ entry.time }} · {{ t(`reports.${entry.status}`) }} · {{ entry.comment }}</p>
      </section>
    </template>
    <a-empty v-else :description="t('reports.missing')" />
    <ConfirmDialog v-model:visible="confirm" :title="t('reports.confirmSubmit')" @confirm="save(true)" />
    <ConfirmDialog unsaved v-model:visible="leave" :title="t('reports.leave')" @confirm="discard" />
    <a-modal v-model:visible="exporting" :title="t('reports.export')" :footer="false" :mask-closable="false" :width="'min(600px, calc(100vw - 32px))'">
      <a-alert>{{ t('reports.exportNote') }}</a-alert>
      <a-form :model="{}" layout="vertical"><a-form-item :label="t('reports.template')" required><a-select v-model="template" :aria-label="t('reports.template')"><a-option value="standard">{{ t('reports.standard') }}</a-option></a-select></a-form-item><p>{{ t('reports.format') }}</p><a-form-item :label="t('reports.filename')" required><a-input v-model="filename" :aria-label="t('reports.filename')" :max-length="100" /></a-form-item></a-form>
      <a-space><a-button @click="exporting = false">{{ t('reports.cancel') }}</a-button><a-button type="primary" :disabled="!template || !filename.trim()" @click="printReport">{{ t('reports.preview') }}</a-button></a-space>
    </a-modal>
  </main>
</template>
<style scoped>
.reports-page { padding: var(--mt-ds-space-6); min-width: 0; color: var(--app-text-primary); }
.note { color: var(--app-text-secondary); margin: 0 0 var(--mt-ds-space-4); }
.filters { display: flex; flex-wrap: wrap; gap: var(--mt-ds-space-4); padding: var(--mt-ds-space-6); background: var(--app-surface); margin-bottom: var(--mt-ds-space-4); }
.filter { display: inline-grid; grid-template-columns: max-content minmax(0, 200px); align-items: center; gap: var(--mt-ds-space-2); }
.surface { background: var(--app-surface); padding: var(--mt-ds-space-6); min-width: 0; }
.detail { margin-top: var(--mt-ds-space-4); overflow-wrap: anywhere; }
h2 { font-size: var(--mt-ds-font-body); margin: var(--mt-ds-space-6) 0 var(--mt-ds-space-4); }
p { white-space: pre-wrap; }
@media (max-width: 600px) { .reports-page, .surface, .filters { padding: var(--mt-ds-space-4); } .filter { grid-template-columns: max-content minmax(0, 1fr); width: 100%; } }

.reports-page, .surface, .filters { padding: var(--mt-ds-space-4); }

@media (max-width: 600px) {
 .filters { flex-direction: column; align-items: stretch; }
 .filters > *, .filters > .arco-input-wrapper, .filters > .arco-select { width: 100%; }
 .filters :deep(.arco-form-item) { grid-template-columns: minmax(0, 1fr); width: 100%; }
 .filters :deep(.arco-form-item-label-col) { text-align: left; }
}

:deep(.arco-table-th) { background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
:deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
</style>

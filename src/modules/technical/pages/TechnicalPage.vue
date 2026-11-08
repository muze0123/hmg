<script setup lang="ts">
import { IconMore } from '@arco-design/web-vue/es/icon';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import { watch, computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import { technicalTasks, STATUS_CODES } from '../data/technical';
const { t } = useI18n();
const route = useRoute(); const router = useRouter();
const rows = reactive(technicalTasks);
const keyword = ref(''); const status = ref(''); const applied = ref(''); const appliedStatus = ref('');
const current = computed(() => rows.find(row => row.id === route.params.id));
const mode = computed(() => String(route.params.mode || 'view'));
const value = ref(''); const opinion = ref(''); const dirty = ref(false);
const filtered = computed(() => rows.filter(row => (!appliedStatus.value || row.status === appliedStatus.value) && `${row.regulation} ${row.project} ${row.name}`.toLowerCase().includes(applied.value.toLowerCase())));
const columns = computed(() => ['regulation', 'project', 'name', 'status', 'owner', 'reviewer', 'actions'].map(key => ({ title: t(`tech.${key}`), dataIndex: key, slotName: key === 'status' || key === 'actions' ? key : undefined })));
function open(id: string, action: string) { const row = rows.find(item => item.id === id)!; value.value = row.value; opinion.value = ''; dirty.value = false; router.push(`/tasks/technical/${id}/${action}`); }
function save(submit = false) { if (!current.value) return; if (submit && (!value.value.trim() || !Number.isFinite(Number(value.value)) || Number(value.value) <= 0)) { Message.error(t('tech.required')); return; } current.value.value = value.value; current.value.status = submit ? 'review' : 'active'; dirty.value = false; Message.success(t('tech.saved')); router.push('/tasks/technical'); }
function review(pass: boolean) { if (!current.value || !opinion.value.trim()) { Message.error(t('tech.opinionRequired')); return; } current.value.status = pass ? 'completed' : 'rejected'; current.value.opinion = opinion.value; dirty.value = false; router.push('/tasks/technical'); }
function download(id: string) { const row = rows.find(item => item.id === id)!; const blob = new Blob(['\uFEFF' + [t('tech.regulation'), t('tech.project'), t('tech.mass')].join(',') + '\n' + [row.regulation, row.project, row.value].join(',')], { type: 'text/csv;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${id}.csv`; link.click(); URL.revokeObjectURL(url); }
onBeforeRouteLeave(() => !dirty.value || requestLeave());
const pageSize = ref(10);
const page = ref(1);
watch(filtered, () => { page.value = 1; });
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
  <header><a-button v-if="route.params.id" @click="router.push('/tasks/technical')">{{ t('tech.back') }}</a-button></header>
  
  <template v-if="!route.params.id">
   <a-form :model="{}" layout="inline" class="filters" @submit.prevent="applied = keyword; appliedStatus = status">
    <a-form-item :label="t('tech.keyword')"><a-input v-model="keyword" allow-clear /></a-form-item>
    <a-form-item :label="t('tech.status')"><a-select v-model="status" allow-clear class="app-filter-control"><a-option v-for="code in STATUS_CODES" :key="code" :value="code">{{ t(`projects.${code}`) }}</a-option></a-select></a-form-item>
    <a-space><a-button type="primary" html-type="submit">{{ t('tech.search') }}</a-button><a-button @click="keyword = ''; status = ''; applied = ''; appliedStatus = ''">{{ t('tech.reset') }}</a-button></a-space>
   </a-form>
   <section class="list"><a-table :columns="columns" :data="filtered.slice((page - 1) * pageSize, page * pageSize)" row-key="id" :scroll="{ x: 1100 }" :pagination="false" :bordered="false">
    <template #status="{ record }"><a-tag>{{ t(`projects.${record.status}`) }}</a-tag></template>
    <template #actions="{ record }"><a-space><a-button type="text" @click="open(record.id, 'view')">{{ t('tech.view') }}</a-button><a-tooltip :content="t('tech.gate')" :disabled="record.ready"><a-button type="text" :disabled="!record.ready || !['pending','active','rejected'].includes(record.status)" @click="open(record.id, 'edit')">{{ t('tech.edit') }}</a-button></a-tooltip><a-dropdown trigger="hover" position="br" popup-container="body" content-class="row-more-dropdown"><a-button size="mini" :aria-label="t('testing.more')" :title="t('testing.more')"><IconMore /></a-button><template #content><a-doption :disabled="record.status !== 'review'" @click="open(record.id, 'review')">{{ t('tech.review') }}</a-doption><a-doption @click="download(record.id)">{{ t('tech.export') }}</a-doption></template></a-dropdown></a-space></template>
    <template #empty><a-empty :description="t('tech.empty')" /></template>
   </a-table><AppPagination v-model:current="page" v-model:page-size="pageSize" :total="filtered.length" /></section>
  </template>
  <section v-else-if="current" class="detail">
   <h2>{{ t('tech.base') }}</h2><a-descriptions :column="2" bordered><a-descriptions-item v-for="key in (['regulation','project','name','owner','reviewer'] as const)" :key="key" :label="t(`tech.${key}`)">{{ current[key] }}</a-descriptions-item><a-descriptions-item :label="t('tech.status')">{{ t(`projects.${current.status}`) }}</a-descriptions-item></a-descriptions>
   <h2>{{ t('tech.content') }}</h2><a-alert v-if="!current.ready">{{ t('tech.gate') }}</a-alert>
   <a-form :model="{}" layout="vertical"><a-form-item :label="t('tech.mass')" :required="mode === 'edit'"><a-input v-if="mode === 'edit'" v-model="value" :disabled="!current.ready" @input="dirty = true" /><span v-else>{{ current.value || '—' }}</span></a-form-item>
   <a-form-item v-if="mode === 'review' && current.status === 'review'" :label="t('tech.opinion')" required><a-textarea v-model="opinion" @input="dirty = true" /></a-form-item></a-form>
   <a-space v-if="mode === 'edit' && current.ready"><a-button @click="save()">{{ t('tech.save') }}</a-button><a-button type="primary" @click="save(true)">{{ t('tech.submit') }}</a-button></a-space>
   <a-space v-if="mode === 'review' && current.status === 'review'"><a-button status="danger" @click="review(false)">{{ t('tech.reject') }}</a-button><a-button type="primary" @click="review(true)">{{ t('tech.pass') }}</a-button></a-space>
   <h2>{{ t('tech.history') }}</h2><p>{{ current.opinion || t('tech.noHistory') }}</p>
  </section><a-empty v-else :description="t('tech.empty')" />
 </main>
<ConfirmDialog unsaved :visible="leaveVisible" :title="t('tech.leave')" @update:visible="finishLeave(false)" @confirm="finishLeave(true)" />
</template>
<style scoped>
.technical-page{padding:24px;color:var(--app-text-primary)}header{display:flex;align-items:center;justify-content:space-between}h1{font-size:20px;margin:0}h2{font-size:16px;margin:24px 0 16px}.note{color:var(--app-text-secondary);font-size:12px;margin:12px 0 24px}.filters,.list,.detail{background:var(--app-surface-container);padding:24px}.filters{margin-bottom:16px;display:flex;flex-wrap:wrap;gap:16px}.detail :deep(.arco-form){margin-top:24px;max-width:640px}@media(max-width:760px){.technical-page{padding:16px}.filters,.list,.detail{padding:16px}.filters{flex-direction:column;align-items:stretch}}

.technical-page { padding: var(--mt-ds-space-4); min-width: 0; }
header { justify-content: flex-end; }
.filters, .list, .detail { padding: var(--mt-ds-space-4); min-width: 0; }
.filters > .arco-input-wrapper, .filters > .arco-select { width: var(--mt-ds-filter-width); }
.detail :deep(.arco-form) { width: var(--mt-ds-form-width); max-width: 100%; }
.technical-page :deep(th), .technical-page :deep(td), .technical-page :deep(.arco-tag) { font-weight: var(--mt-ds-weight-body); }

@media (max-width: 600px) {
 .filters { flex-direction: column; align-items: stretch; }
 .filters > *, .filters > .arco-input-wrapper, .filters > .arco-select { width: 100%; }
 .filters :deep(.arco-form-item) { grid-template-columns: minmax(0, 1fr); width: 100%; }
 .filters :deep(.arco-form-item-label-col) { text-align: left; }
}

.filters :deep(.arco-form-item-wrapper-col) { width: var(--mt-ds-filter-width); flex: none; }
.filters :deep(.arco-form-item-label-col) { flex: none; width: auto; }
.filters :deep(.arco-input-wrapper), .filters :deep(.arco-select), .filters :deep(.arco-picker) { width: 100%; }
@media (max-width: 600px) { .filters :deep(.arco-form-item-wrapper-col) { width: 100%; } }

:deep(.arco-table-th) { background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
:deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }

.filters :deep(.arco-form-item) { width: auto; flex: 0 0 auto; margin: 0; }
@media (max-width: 600px) {
 .filters :deep(.arco-form-item) { display: flex; flex-direction: column; align-items: stretch; width: 100%; }
 .filters :deep(.arco-form-item-label-col) { padding: 0; }
 .filters :deep(.arco-space) { flex-wrap: wrap; }
}
</style>

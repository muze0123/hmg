<script setup lang="ts">
import ExecutionTaskList from "../../task-execution/components/ExecutionTaskList.vue";
import { recordTaskEvent } from '../../projects/data/history';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import { IconSearch, IconRefresh } from '@arco-design/web-vue/es/icon';
import AppDetailList from '../../../design/components/AppDetailList.vue';
import AppFormLayout from '../../../design/components/AppFormLayout.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppListToolbar from '../../../design/components/AppListToolbar.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import { statusRole } from '../../../shared/status';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import TestValueEditor from '../components/TestValueEditor.vue';
import { cloneValues, emptyValue, itemValue, testTasks, validValue, type EntryValue, type TestItem, type TestTask } from '../data/testing';
import { useTestingLabels } from '../labels';

const { t } = useI18n();
const { statusLabel, formatLabel, priorityLabel, itemLabel, tagLabel, resultLabel } = useTestingLabels();
const route = useRoute();
const router = useRouter();
const root = ref<HTMLElement>();
const current = computed(() => testTasks.find(task => task.id === route.params.id));
const mode = computed(() => String(route.params.mode || 'view'));
const validMode = computed(() => ['view', 'edit', 'review'].includes(mode.value));
const canEdit = (task: TestTask) => task.vehicleReady && ['pending', 'submitting', 'rejected', 'withdrawn'].includes(task.status);
const editable = computed(() => Boolean(current.value && mode.value === 'edit' && canEdit(current.value)));
const reviewing = computed(() => mode.value === 'review' && current.value?.status === 'reviewing');
function open(task: TestTask, action: string) { void router.push(`/tasks/testing/${task.id}/${action}`); }
const values = ref<TestTask['values']>({});
const baseline = ref('');
const opinion = ref('');
const conclusion = ref('');
const activeModel = ref('');
const tab = ref('individual');
const itemSearch = ref('');
const itemQuery = ref('');
const itemStatus = ref('');
const appliedItemStatus = ref('');
const itemTag = ref('');
const appliedItemTag = ref('');
const itemPage = ref(1);
const itemPageSize = ref(10);
const busy = ref(false);
const error = ref('');
const invalidItem = ref('');
const reviewError = ref(false);
const drawerItem = ref<TestItem>();
const drawerVisible = ref(false);
const drawerValue = ref<EntryValue>(emptyValue());
const drawerBaseline = ref('');
const drawerError = ref(false);
const drawerBody = ref<HTMLElement>();
const dirty = computed(() => editable.value && JSON.stringify(values.value) !== baseline.value || Boolean(opinion.value || conclusion.value));
const drawerDirty = computed(() => drawerVisible.value && JSON.stringify(drawerValue.value) !== drawerBaseline.value);
const confirmVisible = ref(false);
const confirmAction = ref<'leave' | 'drawer' | 'submit' | 'review'>('leave');
let resolveLeave: ((value: boolean) => void) | undefined;
let drawerTrigger: HTMLElement | undefined;
const confirmTitle = computed(() => t(`testing.confirm.${confirmAction.value}`));

watch(() => route.fullPath, () => {
  values.value = current.value ? cloneValues(current.value.values) : {};
  baseline.value = JSON.stringify(values.value);
  opinion.value = ''; conclusion.value = ''; error.value = ''; invalidItem.value = ''; reviewError.value = false;
  activeModel.value = current.value?.models[0] ?? ''; tab.value = 'individual'; itemPage.value = 1;
  itemSearch.value = ''; itemQuery.value = ''; itemStatus.value = ''; appliedItemStatus.value = ''; itemTag.value = ''; appliedItemTag.value = '';
  drawerVisible.value = false;
}, { immediate: true });
watch([activeModel, itemQuery, appliedItemStatus, appliedItemTag], () => { itemPage.value = 1; });
watch(confirmVisible, visible => {
  if (!visible && resolveLeave) { resolveLeave(false); resolveLeave = undefined; }
});
async function guard() {
  if (busy.value) return false;
  if (!dirty.value && !drawerDirty.value) return true;
  if (resolveLeave) return false;
  confirmAction.value = 'leave'; confirmVisible.value = true;
  return new Promise<boolean>(resolve => { resolveLeave = resolve; });
}
onBeforeRouteLeave(guard);
onBeforeRouteUpdate(guard);
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value || drawerDirty.value) { event.preventDefault(); event.returnValue = ''; }
}
onMounted(() => window.addEventListener('beforeunload', beforeUnload));
onBeforeUnmount(() => { window.removeEventListener('beforeunload', beforeUnload); resolveLeave?.(false); });
const readValue = (item: TestItem, model = activeModel.value) => current.value ? itemValue(current.value, values.value, model, item) : emptyValue();
function hasValue(item: TestItem) {
  const value = readValue(item);
  return item.format === 'table' ? value.rows.some(row => row.parameter.trim() || row.result.trim()) : Boolean(value.text.trim());
}
function itemState(item: TestItem) { return hasValue(item) && validValue(item, readValue(item)) ? 'completed' : 'pending'; }
const visibleItems = computed(() => (current.value?.items ?? []).filter(item =>
  `${item.id} ${itemLabel(item.name)}`.toLowerCase().includes(itemQuery.value.toLowerCase())
  && (!appliedItemStatus.value || itemState(item) === appliedItemStatus.value) && (!appliedItemTag.value || item.tag === appliedItemTag.value),
));
const pagedItems = computed(() => visibleItems.value.slice((itemPage.value - 1) * itemPageSize.value, itemPage.value * itemPageSize.value));
const itemColumns = computed<TableColumnData[]>(() => [
  { title: t('testing.number'), dataIndex: 'id', width: 100 },
  { title: t('testing.item'), slotName: 'name', width: 220 },
  { title: t('testing.format'), slotName: 'format', width: 130 },
  { title: t('testing.status'), slotName: 'status', width: 120 },
  { title: t('testing.tag'), slotName: 'tag', width: 130 },
  { title: t('testing.actions'), slotName: 'actions', width: 110 },
]);
function applyItemSearch() { itemQuery.value = itemSearch.value; appliedItemStatus.value = itemStatus.value; appliedItemTag.value = itemTag.value; itemPage.value = 1; }
function resetItemSearch() { itemSearch.value = ''; itemStatus.value = ''; itemTag.value = ''; applyItemSearch(); }
function updateValue(item: TestItem, value: EntryValue) {
  if (!editable.value || item.reference || !values.value[activeModel.value]) return;
  values.value[activeModel.value]![item.id] = value;
  invalidItem.value = ''; error.value = '';
}
function openDrawer(item: TestItem) {
  drawerTrigger = document.activeElement instanceof HTMLElement ? document.activeElement : undefined;
  drawerItem.value = item; drawerValue.value = JSON.parse(JSON.stringify(readValue(item)));
  drawerBaseline.value = JSON.stringify(drawerValue.value); drawerError.value = false; drawerVisible.value = true;
}
function closeDrawer() {
  if (drawerDirty.value) { confirmAction.value = 'drawer'; confirmVisible.value = true; }
  else drawerVisible.value = false;
}
async function focusDrawer() { await nextTick(); drawerBody.value?.querySelector<HTMLElement>('input, textarea, [contenteditable="true"]')?.focus(); }
function saveDrawer() {
  if (!drawerItem.value || !editable.value) return;
  if (!validValue(drawerItem.value, drawerValue.value)) { drawerError.value = true; void focusDrawer(); return; }
  updateValue(drawerItem.value, JSON.parse(JSON.stringify(drawerValue.value))); drawerVisible.value = false;
}
function validate() {
  if (!current.value) return false;
  for (const model of current.value.models) {
    const item = current.value.items.find(entry => !validValue(entry, readValue(entry, model)));
    if (item) {
      activeModel.value = model; invalidItem.value = item.id; error.value = t('testing.required');
      tab.value = 'individual'; resetItemSearch(); itemPage.value = Math.floor(current.value.items.indexOf(item) / itemPageSize.value) + 1;
      void nextTick(() => { root.value?.querySelector<HTMLElement>(`[data-item-id="${item.id}"]`)?.focus(); });
      return false;
    }
  }
  return true;
}
function requestSubmit() {
  if (!editable.value || busy.value || !validate()) return;
  confirmAction.value = 'submit'; confirmVisible.value = true;
}
async function save(submit = false) {
  if (!current.value || !editable.value || busy.value) return;
  if (submit && !validate()) return;
  busy.value = true;
  try {
    // Local session mock. Replace this boundary when a server contract is available.
    await Promise.resolve();
    current.value.values = cloneValues(values.value);
    baseline.value = JSON.stringify(values.value);
    recordTaskEvent(current.value.project, 'testing', submit ? 'review' : 'draft', current.value.owner, '', current.value.id, submit ? current.value.reviewer : undefined);
    current.value.status = submit ? 'reviewing' : 'submitting';
  if (submit) { current.value.executedAt = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }); current.value.reviewedAt = ''; }
    confirmVisible.value = false;
    Message.success(t('testing.saved'));
    if (submit) { busy.value = false; await router.push('/tasks/testing'); }
  } catch {
    error.value = t('testing.saveError');
  } finally { busy.value = false; }
}
function requestReview() {
  if (!reviewing.value || busy.value) return;
  if (!conclusion.value || !opinion.value.trim()) {
    reviewError.value = true;
    void nextTick(() => root.value?.querySelector<HTMLElement>('.review-panel input, .review-panel textarea')?.focus());
    return;
  }
  confirmAction.value = 'review'; confirmVisible.value = true;
}
async function review() {
  if (!current.value || !reviewing.value || busy.value || !opinion.value.trim() || !conclusion.value) return;
  busy.value = true;
  try {
    await Promise.resolve();
    const time = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
    recordTaskEvent(current.value.project, 'testing', conclusion.value === 'passed' ? 'approve' : 'reject', current.value.reviewer, opinion.value, current.value.id, conclusion.value === 'passed' ? undefined : current.value.owner);
    current.value.history.push({ id: `REVIEW-${Date.now()}`, reviewer: current.value.reviewer, result: conclusion.value === 'passed' ? 'passed' : 'rejected', opinion: opinion.value.trim(), time });
    current.value.status = conclusion.value === 'passed' ? 'completed' : 'rejected';
    current.value.reviewedAt = time;
    current.value.actual = conclusion.value === 'passed' ? time.slice(0, 10) : '';
    opinion.value = ''; conclusion.value = ''; confirmVisible.value = false;
    Message.success(t('testing.saved'));
    busy.value = false;
    await router.push(`/tasks/testing/${current.value.id}/view`);
  } catch { error.value = t('testing.saveError'); }
  finally { busy.value = false; }
}
function confirm() {
  if (confirmAction.value === 'leave') {
    const resolve = resolveLeave; resolveLeave = undefined; confirmVisible.value = false; resolve?.(true);
  } else if (confirmAction.value === 'drawer') {
    drawerVisible.value = false; confirmVisible.value = false;
  } else if (confirmAction.value === 'submit') void save(true);
  else void review();
}
</script>

<template>
  <main ref="root" class="testing-page">
    
    <ExecutionTaskList v-if="!route.params.id" module="testing" :rows="testTasks" />
    <template v-else-if="current && validMode">
      <div class="page-actions"><a-button :disabled="busy" @click="router.push('/tasks/testing')">{{ t('testing.back') }}</a-button><a-space v-if="editable" wrap><a-button :loading="busy" @click="save()">{{ t('testing.save') }}</a-button><a-button type="primary" :loading="busy" @click="requestSubmit">{{ t('testing.submit') }}</a-button></a-space></div>
      <a-alert v-if="mode === 'edit' && !editable" type="warning">{{ t(current.vehicleReady ? 'testing.editUnavailable' : 'testing.gate') }}</a-alert>
      <a-alert v-if="mode === 'review' && !reviewing" type="warning">{{ t('testing.reviewUnavailable') }}</a-alert>
      <a-alert v-if="error" type="error" role="alert">{{ error }}</a-alert>
      <section class="surface">
        <h2>{{ t('testing.base') }}</h2>
        <AppDetailList :fields="(['project', 'name', 'regulation', 'priority', 'status', 'start', 'end', 'actual', 'owner', 'reviewer', 'template', 'version'] as const).map(key => ({ key, label: t(`testing.${key}`), value: key === 'status' ? statusLabel(current!.status) : key === 'priority' ? priorityLabel(current!.priority) : current![key] || '—' }))" />
      </section>
      <section class="surface">
        <h2>{{ t('testing.templateInfo') }}</h2>
        <div class="model-field"><AppFieldLabel :text="t('testing.model')" as="label" for="test-model" /><a-select v-model="activeModel" :input-attrs="{ id: 'test-model' }" :aria-label="t('testing.model')"><a-option v-for="model in current.models" :key="model" :value="model">{{ model }}</a-option></a-select></div>
        <a-tabs v-model:active-key="tab">
          <a-tab-pane key="individual" :title="t('testing.individual')">
            <form class="item-filters app-filter-strip" @submit.prevent="applyItemSearch">
              <div class="app-filter-unit"><AppFieldLabel as="label" for="item-search" :text="t('testing.item')" context="filter" /><a-input id="item-search" v-model="itemSearch" class="app-filter-control" :input-attrs="{ 'aria-label': t('testing.item') }" allow-clear /></div>
              <div class="app-filter-unit"><AppFieldLabel as="label" for="item-status" :text="t('testing.itemStatus')" context="filter" /><a-select id="item-status" v-model="itemStatus" class="app-filter-control" :aria-label="t('testing.itemStatus')" allow-clear><a-option v-for="code in (['pending', 'completed'] as const)" :key="code" :value="code">{{ statusLabel(code) }}</a-option></a-select></div>
              <div class="app-filter-unit"><AppFieldLabel as="label" for="item-tag" :text="t('testing.tag')" context="filter" /><a-select id="item-tag" v-model="itemTag" class="app-filter-control" :aria-label="t('testing.tag')" allow-clear><a-option v-for="code in ['required', 'optional']" :key="code" :value="code">{{ tagLabel(code) }}</a-option></a-select></div>
              <div class="app-filter-actions"><a-button html-type="submit" type="primary"><template #icon><IconSearch /></template>{{ t('designSystem.search') }}</a-button><a-button class="app-btn-neutral" @click="resetItemSearch"><template #icon><IconRefresh /></template>{{ t('designSystem.reset') }}</a-button></div>
            </form>
            <a-table :columns="itemColumns" :data="pagedItems" row-key="id" :pagination="false" :bordered="false" :scroll="{ x: 810 }">
              <template #name="{ record }">{{ itemLabel(record.name) }}<p v-if="record.reference" class="reference-note">{{ t('testing.reference') }} {{ record.reference }}</p></template>
              <template #format="{ record }">{{ formatLabel(record.format) }}</template>
              <template #status="{ record }"><AppStatusTag :role="statusRole(itemState(record), 'testing')" :label="statusLabel(itemState(record))"/></template>
              <template #tag="{ record }">{{ tagLabel(record.tag) }}</template>
              <template #actions="{ record }"><a-button type="text" :data-item-id="record.id" :status="invalidItem === record.id ? 'danger' : undefined" @click="openDrawer(record)">{{ t(editable && !record.reference ? 'testing.fill' : 'testing.view') }}</a-button></template>
              <template #empty><a-empty :description="t('testing.emptyItems')" /></template>
            </a-table>
            <AppPagination v-model:current="itemPage" v-model:page-size="itemPageSize" :total="visibleItems.length" />
          </a-tab-pane>
          <a-tab-pane key="batch" :title="t('testing.batch')">
            <div class="batch-items"><section v-for="item in current.items" :key="item.id" class="batch-item">
              <div class="item-heading"><span v-if="editable && item.tag === 'required'" class="required-mark">*</span><AppFieldLabel :text="`${item.id} ${itemLabel(item.name)}`" /><a-tag>{{ formatLabel(item.format) }}</a-tag></div>
              <p v-if="item.reference" class="reference-note">{{ t('testing.referenceHint') }} {{ item.reference }}</p>
              <TestValueEditor :item="item" :model-value="readValue(item)" :readonly="!editable || Boolean(item.reference)" :label="itemLabel(item.name)" @update:model-value="updateValue(item, $event)" />
            </section></div>
          </a-tab-pane>
        </a-tabs>
      </section>
      <section v-if="reviewing" class="surface review-panel">
        <h2>{{ t('testing.review') }}</h2>
        <AppFormLayout><a-form :model="{ conclusion, opinion }" layout="vertical" @submit="requestReview">
          <a-form-item :validate-status="reviewError && !conclusion ? 'error' : undefined" :help="reviewError && !conclusion ? t('testing.reviewRequired') : undefined" required><template #label><AppFieldLabel :text="t('testing.conclusion')" /></template><a-select v-model="conclusion" :aria-label="t('testing.conclusion')"><a-option value="passed">{{ t('testing.results.passed') }}</a-option><a-option value="rejected">{{ t('testing.results.rejected') }}</a-option></a-select></a-form-item>
          <a-form-item :validate-status="reviewError && !opinion.trim() ? 'error' : undefined" :help="reviewError && !opinion.trim() ? t('testing.reviewRequired') : undefined" required><template #label><AppFieldLabel :text="t('testing.opinion')" /></template><a-textarea v-model="opinion" :textarea-attrs="{ 'aria-label': t('testing.opinion') }" :max-length="2000" show-word-limit /></a-form-item>
          <a-button html-type="submit" type="primary" :loading="busy">{{ t('testing.confirmReview') }}</a-button>
        </a-form></AppFormLayout>
      </section>
      <section class="surface">
        <h2>{{ t('testing.history') }} <span class="time-zone">{{ t('testing.timeZone') }}</span></h2>
        <a-empty v-if="!current.history.length" :description="t('testing.noHistory')" />
        <div v-else class="history-list"><article v-for="record in current.history" :key="record.id"><div>{{ record.reviewer }} · {{ resultLabel(record.result) }} · <time>{{ record.time }}</time></div><p>{{ record.opinion }}</p></article></div>
      </section>
    </template>
    <section v-else class="surface"><a-empty :description="t('testing.missing')" /><a-button @click="router.push('/tasks/testing')">{{ t('testing.back') }}</a-button></section>
    <a-drawer :visible="drawerVisible" :width="'min(500px, 100vw)'" :title="drawerItem ? itemLabel(drawerItem.name) : ''" :mask-closable="false" :esc-to-close="!confirmVisible" unmount-on-close @cancel="closeDrawer" @open="focusDrawer" @close="drawerTrigger?.focus()">
      <div v-if="drawerItem" ref="drawerBody" class="drawer-content">
        <p>{{ drawerItem.id }} · {{ formatLabel(drawerItem.format) }}</p>
        <a-alert v-if="drawerItem.reference">{{ t('testing.referenceHint') }} {{ drawerItem.reference }}</a-alert>
        <TestValueEditor :item="drawerItem" v-model="drawerValue" :readonly="!editable || Boolean(drawerItem.reference)" :label="itemLabel(drawerItem.name)" />
        <p v-if="drawerError" role="alert" class="field-error">{{ t('testing.invalidValue') }}</p>
      </div>
      <template #footer><a-space><a-button @click="closeDrawer">{{ t('testing.close') }}</a-button><a-button v-if="editable && !drawerItem?.reference" type="primary" @click="saveDrawer">{{ t('testing.apply') }}</a-button></a-space></template>
    </a-drawer>
    <ConfirmDialog :unsaved="confirmAction === 'leave' || confirmAction === 'drawer'" v-model:visible="confirmVisible" :title="confirmTitle" :ok-loading="busy" :dismissible="!busy" @confirm="confirm" />
  </main>
</template>

<style scoped>
.testing-page { display: grid; gap: var(--mt-ds-space-3); min-width: 0; color: var(--mt-ds-text); }
.surface { background: var(--mt-ds-surface); padding: var(--mt-ds-space-6); min-width: 0; }
/* 列表与逐项填写的筛选区布局统一走 global.css 的 app-filter-strip / app-filter-unit / app-filter-actions */
.row-actions { display: flex; align-items: center; gap: var(--mt-ds-space-3); }
.row-actions :deep(.arco-btn-mini) { width: var(--mt-ds-space-6); height: var(--mt-ds-space-6); }
.row-actions :deep(.arco-btn) { padding: 0; font-weight: var(--mt-ds-weight-body); }
.testing-page :deep(.arco-table-th) { background: var(--mt-ds-surface); }
.list-region :deep(th), .list-region :deep(td), .testing-page :deep(.arco-tag), .testing-page :deep(.arco-table-th) { font-weight: var(--mt-ds-weight-body); }
.page-actions { display: flex; align-items: center; justify-content: space-between; gap: var(--mt-ds-space-4); flex-wrap: wrap; }
h2 { margin: 0 0 var(--mt-ds-space-4); font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
.details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--mt-ds-space-4) var(--mt-ds-space-6); margin: 0; }
.details-grid > div { min-width: 0; }

.model-field { display: flex; align-items: center; gap: var(--mt-ds-space-2); margin-bottom: var(--mt-ds-space-4); }
.model-field :deep(.arco-select) { width: var(--mt-ds-filter-width); }
.item-filters { margin-bottom: var(--mt-ds-space-4); }
.reference-note, .time-zone { font-size: var(--mt-ds-font-caption); font-weight: var(--mt-ds-weight-body); color: var(--mt-ds-text-secondary); }
.reference-note { margin: var(--mt-ds-space-1) 0 0; }
.batch-items { display: grid; gap: var(--mt-ds-space-4); }
.batch-item { display: grid; gap: var(--mt-ds-space-3); width: var(--mt-ds-form-width); max-width: 100%; }
.item-heading { display: flex; align-items: center; flex-wrap: wrap; gap: var(--mt-ds-space-2); }
.required-mark, .field-error { color: rgb(var(--danger-6)); }
.review-panel :deep(.arco-form) { max-width: var(--mt-ds-form-width); }
.history-list { display: grid; gap: var(--mt-ds-space-4); }
.history-list article { border-bottom: 1px solid var(--mt-ds-border); padding-bottom: var(--mt-ds-space-3); overflow-wrap: anywhere; }
.history-list p { margin-bottom: 0; white-space: pre-wrap; }
.drawer-content { display: grid; gap: var(--mt-ds-space-4); }
@media (max-width: 900px) { .details-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) {
  .surface { padding: var(--mt-ds-space-4); }
  .details-grid { grid-template-columns: minmax(0, 1fr); }
  /* 筛选区窄屏流式布局由 global.css 的 .app-filter-strip 媒体查询统一处理 */
}

:deep(.arco-table-th) { background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
:deep(.arco-table-th), :deep(.arco-table-td), :deep(th), :deep(td) { height: 50px; }
:deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
</style>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import { IconMore } from '@arco-design/web-vue/es/icon';
import AppFormLayout from '../../../design/components/AppFormLayout.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppListToolbar from '../../../design/components/AppListToolbar.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import TestValueEditor from '../components/TestValueEditor.vue';
import { cloneValues, emptyValue, itemValue, PRIORITY_CODES, STATUS_CODES, testTasks, validValue, type EntryValue, type TestItem, type TestTask } from '../data/testing';
import { useTestingLabels } from '../labels';

const { t } = useI18n();
const { statusLabel, formatLabel, priorityLabel, itemLabel, tagLabel, resultLabel } = useTestingLabels();
const route = useRoute();
const router = useRouter();
const root = ref<HTMLElement>();
const current = computed(() => testTasks.find(task => task.id === route.params.id));
const mode = computed(() => String(route.params.mode || 'view'));
const validMode = computed(() => ['view', 'edit', 'review'].includes(mode.value));
const canEdit = (task: TestTask) => task.vehicleReady && ['notStarted', 'inProgress', 'pending', 'rejected'].includes(task.status);
const editable = computed(() => Boolean(current.value && mode.value === 'edit' && canEdit(current.value)));
const reviewing = computed(() => mode.value === 'review' && current.value?.status === 'reviewing');
const filters = reactive({ project: '', name: '', regulation: '', priority: '', status: '', start: '', end: '', actual: '' });
const applied = ref({ ...filters });
const page = ref(1);
const pageSize = ref(10);
const filtered = computed(() => testTasks.filter(task => {
  const query = applied.value;
  return task.project.toLowerCase().includes(query.project.toLowerCase()) && task.name.toLowerCase().includes(query.name.toLowerCase())
    && task.regulation.toLowerCase().includes(query.regulation.toLowerCase()) && (!query.priority || task.priority === query.priority)
    && (!query.status || task.status === query.status) && (!query.start || task.start === query.start)
    && (!query.end || task.end === query.end) && (!query.actual || task.actual === query.actual);
}));
const paged = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const listKeys = ['regulation', 'project', 'name', 'priority', 'status', 'start', 'end', 'actual'] as const;
const columns = computed<TableColumnData[]>(() => [
  ...listKeys.map(key => ({ title: t(`testing.${key}`), dataIndex: key, slotName: key, width: key === 'regulation' ? 160 : 140 })),
  { title: t('testing.actions'), slotName: 'actions', width: 190, fixed: 'right' },
]);
function search() { applied.value = { ...filters }; page.value = 1; }
function reset() { Object.assign(filters, { project: '', name: '', regulation: '', priority: '', status: '', start: '', end: '', actual: '' }); search(); }
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
function itemState(item: TestItem) { return hasValue(item) && validValue(item, readValue(item)) ? 'completed' : 'notStarted'; }
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
    current.value.status = submit ? 'reviewing' : 'pending';
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
    current.value.history.push({ id: `REVIEW-${Date.now()}`, reviewer: current.value.reviewer, result: conclusion.value === 'passed' ? 'passed' : 'rejected', opinion: opinion.value.trim(), time });
    current.value.status = conclusion.value === 'passed' ? 'completed' : 'rejected';
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
function exportTask(task: TestTask) {
  const cell = (value: string) => `"${(/^[=+\-@\t\r]/.test(value) ? "'" : '') + value.replaceAll('"', '""')}"`;
  const rows = [[t('testing.regulation'), t('testing.project'), t('testing.model'), t('testing.number'), t('testing.item'), t('testing.format'), t('testing.value')]];
  for (const model of task.models) for (const item of task.items) {
    const value = itemValue(task, task.values, model, item);
    rows.push([task.regulation, task.project, model, item.id, itemLabel(item.name), formatLabel(item.format), item.format === 'table' ? value.rows.map(row => `${row.parameter} = ${row.result}`).join('\n') : value.text]);
  }
  const url = URL.createObjectURL(new Blob(['\uFEFF' + rows.map(row => row.map(cell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a'); link.href = url; link.download = `${task.id}.csv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <main ref="root" class="testing-page">
    
    <template v-if="!route.params.id">
      <form class="filters surface" @submit.prevent="search">
        <div v-for="key in (['project', 'name', 'regulation'] as const)" :key="key" class="filter-field">
          <AppFieldLabel :text="t(`testing.${key}`)" as="label" :for="`test-filter-${key}`" context="filter" />
          <a-input v-model="filters[key]" :input-attrs="{ id: `test-filter-${key}`, name: key }" allow-clear />
        </div>
        <div class="filter-field"><AppFieldLabel :text="t('testing.priority')" as="label" for="test-priority" context="filter" /><a-select v-model="filters.priority" :input-attrs="{ id: 'test-priority' }" :aria-label="t('testing.priority')" allow-clear><a-option v-for="code in PRIORITY_CODES" :key="code" :value="code">{{ priorityLabel(code) }}</a-option></a-select></div>
        <div class="filter-field"><AppFieldLabel :text="t('testing.status')" as="label" for="test-status" context="filter" /><a-select v-model="filters.status" :input-attrs="{ id: 'test-status' }" :aria-label="t('testing.status')" allow-clear><a-option v-for="code in STATUS_CODES" :key="code" :value="code">{{ statusLabel(code) }}</a-option></a-select></div>
        <div v-for="key in (['start', 'end', 'actual'] as const)" :key="key" class="filter-field"><AppFieldLabel :text="t(`testing.${key}`)" as="label" :for="`test-filter-${key}`" context="filter" /><a-date-picker v-model="filters[key]" :id="`test-filter-${key}`" :aria-label="t(`testing.${key}`)" /></div>
        <a-space wrap><a-button html-type="submit" type="primary">{{ t('testing.search') }}</a-button><a-button @click="reset">{{ t('testing.reset') }}</a-button></a-space>
      </form>
      <section class="surface list-region" :aria-label="t('testing.title')">
        <AppListToolbar :title="t('testing.records')" :summary="t('designSystem.total', { count: filtered.length })" />
        <a-table :columns="columns" :data="paged" row-key="id" :pagination="false" :bordered="false" :scroll="{ x: 1330 }">
          <template #regulation="{ record }"><a-button type="text" @click="open(record, 'view')">{{ record.regulation }}</a-button></template>
          <template v-for="key in (['project', 'name', 'start', 'end', 'actual'] as const)" #[key]="{ record }">{{ record[key] || '—' }}</template>
          <template #priority="{ record }">{{ priorityLabel(record.priority) }}</template>
          <template #status="{ record }"><a-tag :color="record.status === 'completed' ? 'green' : record.status === 'rejected' ? 'red' : record.status === 'reviewing' ? 'orange' : undefined">{{ statusLabel(record.status) }}</a-tag></template>
          <template #actions="{ record }"><div class="row-actions">
            <a-button type="text" @click="open(record, 'view')">{{ t('testing.view') }}</a-button>
            <a-tooltip :content="t(record.vehicleReady ? 'testing.editUnavailable' : 'testing.gate')" :disabled="canEdit(record)"><a-button type="text" :disabled="!canEdit(record)" @click="open(record, 'edit')">{{ t('testing.edit') }}</a-button></a-tooltip>
            <a-dropdown trigger="click" position="br" content-class="row-more-dropdown"><a-button type="text" size="mini" :aria-label="t('testing.more')"><IconMore /></a-button><template #content><a-doption :disabled="record.status !== 'reviewing'" @click="open(record, 'review')">{{ t('testing.review') }}</a-doption><a-doption @click="exportTask(record)">{{ t('testing.export') }}</a-doption></template></a-dropdown>
          </div></template>
          <template #empty><a-empty :description="t('testing.empty')" /></template>
        </a-table>
        <AppPagination v-model:current="page" v-model:page-size="pageSize" :total="filtered.length" />
      </section>
    </template>
    <template v-else-if="current && validMode">
      <div class="page-actions"><a-button :disabled="busy" @click="router.push('/tasks/testing')">{{ t('testing.back') }}</a-button><a-space v-if="editable" wrap><a-button :loading="busy" @click="save()">{{ t('testing.save') }}</a-button><a-button type="primary" :loading="busy" @click="requestSubmit">{{ t('testing.submit') }}</a-button></a-space></div>
      <a-alert v-if="mode === 'edit' && !editable" type="warning">{{ t(current.vehicleReady ? 'testing.editUnavailable' : 'testing.gate') }}</a-alert>
      <a-alert v-if="mode === 'review' && !reviewing" type="warning">{{ t('testing.reviewUnavailable') }}</a-alert>
      <a-alert v-if="error" type="error" role="alert">{{ error }}</a-alert>
      <section class="surface">
        <h2>{{ t('testing.base') }}</h2>
        <dl class="details-grid"><div v-for="key in (['project', 'name', 'regulation', 'priority', 'status', 'start', 'end', 'actual', 'owner', 'reviewer', 'template', 'version'] as const)" :key="key"><dt><AppFieldLabel :text="t(`testing.${key}`)" context="detail" /></dt><dd>{{ key === 'status' ? statusLabel(current.status) : key === 'priority' ? priorityLabel(current.priority) : current[key] || '—' }}</dd></div></dl>
      </section>
      <section class="surface">
        <h2>{{ t('testing.templateInfo') }}</h2>
        <div class="model-field"><AppFieldLabel :text="t('testing.model')" as="label" for="test-model" /><a-select v-model="activeModel" :input-attrs="{ id: 'test-model' }" :aria-label="t('testing.model')"><a-option v-for="model in current.models" :key="model" :value="model">{{ model }}</a-option></a-select></div>
        <a-tabs v-model:active-key="tab">
          <a-tab-pane key="individual" :title="t('testing.individual')">
            <form class="item-filters" @submit.prevent="applyItemSearch">
              <a-input v-model="itemSearch" :input-attrs="{ 'aria-label': t('testing.item') }" :placeholder="t('testing.item')" allow-clear />
              <a-select v-model="itemStatus" :aria-label="t('testing.itemStatus')" :placeholder="t('testing.itemStatus')" allow-clear><a-option v-for="code in (['notStarted', 'completed'] as const)" :key="code" :value="code">{{ statusLabel(code) }}</a-option></a-select>
              <a-select v-model="itemTag" :aria-label="t('testing.tag')" :placeholder="t('testing.tag')" allow-clear><a-option v-for="code in ['required', 'optional']" :key="code" :value="code">{{ tagLabel(code) }}</a-option></a-select>
              <a-space><a-button html-type="submit" type="primary">{{ t('testing.search') }}</a-button><a-button @click="resetItemSearch">{{ t('testing.reset') }}</a-button></a-space>
            </form>
            <a-table :columns="itemColumns" :data="pagedItems" row-key="id" :pagination="false" :bordered="false" :scroll="{ x: 810 }">
              <template #name="{ record }">{{ itemLabel(record.name) }}<p v-if="record.reference" class="reference-note">{{ t('testing.reference') }} {{ record.reference }}</p></template>
              <template #format="{ record }">{{ formatLabel(record.format) }}</template>
              <template #status="{ record }"><a-tag>{{ statusLabel(itemState(record)) }}</a-tag></template>
              <template #tag="{ record }">{{ tagLabel(record.tag) }}</template>
              <template #actions="{ record }"><a-button type="text" :data-item-id="record.id" :status="invalidItem === record.id ? 'danger' : undefined" @click="openDrawer(record)">{{ t(editable && !record.reference ? 'testing.fill' : 'testing.view') }}</a-button></template>
              <template #empty><a-empty :description="t('testing.emptyItems')" /></template>
            </a-table>
            <AppPagination v-model:current="itemPage" v-model:page-size="itemPageSize" :total="visibleItems.length" />
          </a-tab-pane>
          <a-tab-pane key="batch" :title="t('testing.batch')">
            <div class="batch-items"><section v-for="item in current.items" :key="item.id" class="batch-item">
              <div class="item-heading"><AppFieldLabel :text="`${item.id} ${itemLabel(item.name)}`" /><a-tag>{{ formatLabel(item.format) }}</a-tag><span v-if="item.tag === 'required'" class="required-mark">*</span></div>
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
    <a-drawer :visible="drawerVisible" :width="'min(640px, 100vw)'" :title="drawerItem ? itemLabel(drawerItem.name) : ''" :mask-closable="false" :esc-to-close="!confirmVisible" unmount-on-close @cancel="closeDrawer" @open="focusDrawer" @close="drawerTrigger?.focus()">
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
.testing-page { display: grid; gap: var(--mt-ds-space-4); min-width: 0; color: var(--mt-ds-text); }
.surface { background: var(--mt-ds-surface); padding: var(--mt-ds-space-6); min-width: 0; }
.session-note { margin: 0; color: var(--mt-ds-text-secondary); font-size: var(--mt-ds-font-caption); }
.filters { display: flex; flex-wrap: wrap; align-items: center; gap: var(--mt-ds-space-4) var(--mt-ds-space-6); }
.filter-field { display: grid; grid-template-columns: auto var(--mt-ds-filter-width); align-items: center; gap: var(--mt-ds-space-2); }
.filter-field :deep(.mt-field-label) { text-align: right; }
.filter-field :deep(.arco-picker) { width: 100%; }
.row-actions { display: flex; align-items: center; gap: var(--mt-ds-space-3); }
.row-actions :deep(.arco-btn) { padding: 0; font-weight: var(--mt-ds-weight-body); }
.testing-page :deep(.arco-table-th) { background: var(--mt-ds-surface); }
.list-region :deep(th), .list-region :deep(td), .testing-page :deep(.arco-tag), .testing-page :deep(.arco-table-th) { font-weight: var(--mt-ds-weight-body); }
.page-actions { display: flex; align-items: center; justify-content: space-between; gap: var(--mt-ds-space-4); flex-wrap: wrap; }
h2 { margin: 0 0 var(--mt-ds-space-4); font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
.details-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--mt-ds-space-4) var(--mt-ds-space-6); margin: 0; }
.details-grid > div { min-width: 0; }
dt { margin-bottom: var(--mt-ds-space-1); } dd { margin: 0; overflow-wrap: anywhere; }
.model-field { display: flex; align-items: center; gap: var(--mt-ds-space-2); margin-bottom: var(--mt-ds-space-4); }
.model-field :deep(.arco-select) { width: var(--mt-ds-filter-width); }
.item-filters { display: flex; flex-wrap: wrap; gap: var(--mt-ds-space-3); margin-bottom: var(--mt-ds-space-4); }
.item-filters > :deep(.arco-input-wrapper), .item-filters > :deep(.arco-select) { width: var(--mt-ds-filter-width); }
.reference-note, .time-zone { font-size: var(--mt-ds-font-caption); font-weight: var(--mt-ds-weight-body); color: var(--mt-ds-text-secondary); }
.reference-note { margin: var(--mt-ds-space-1) 0 0; }
.batch-items { display: grid; gap: var(--mt-ds-space-6); }
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
  .filters, .filter-field { display: grid; grid-template-columns: minmax(0, 1fr); width: 100%; }
  .filter-field :deep(.mt-field-label) { text-align: left; }
  .details-grid { grid-template-columns: minmax(0, 1fr); }
  .item-filters > :deep(.arco-input-wrapper), .item-filters > :deep(.arco-select) { width: 100%; }
}

:deep(.arco-table-th) { background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
:deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
</style>

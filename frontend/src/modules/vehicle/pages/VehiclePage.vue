<script setup lang="ts">
import TaskPauseNotice from '../../projects/components/TaskPauseNotice.vue';
import { taskPaused, displayedTaskStatus } from '../../projects/data/suspension';
import { collaborationReady, assignmentIsMine } from '../data/collaboration';
import VehicleTimeline from '../components/VehicleTimeline.vue';
import VehicleValues from '../components/VehicleValues.vue';
import TaskInformationSection from '../../task-execution/components/TaskInformationSection.vue';
import { vehicleRecords, type Vehicle } from '../data/vehicle';
import { commitVehicleTask, syncConfiguredVehicles } from '../data/execution';
import { TASK_STATUSES, type TaskStatus } from '../../../shared/taskLifecycle';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import { IconSearch, IconRefresh, IconFilter, IconSettings, IconDownload } from '@arco-design/web-vue/es/icon';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import AppDetailHeader from '../../../design/components/AppDetailHeader.vue';
import { statusRole } from '../../../shared/status';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { useProjectLabels } from '../../projects/labels';
import { MOCK_CURRENT_USER, PRIORITY_CODES, type TaskPriority } from '../../projects/data/projects';
import { useTaskCenterStore } from '../../task-center/stores/taskCenter';
import ExcelJS from 'exceljs';
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
const { t } = useI18n();
const projectLabel = useProjectLabels();
const priorityRoles = { urgent: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;
const route = useRoute();
const router = useRouter();
syncConfiguredVehicles();
const records = vehicleRecords;
const FIELD_KEYS = ['id', 'name', 'priority', 'status', 'createdAt', 'end', 'actual', 'executor', 'executedAt', 'reviewer', 'reviewedAt'] as const;
type FieldKey = typeof FIELD_KEYS[number];
const DATE_KEYS: readonly FieldKey[] = ['createdAt', 'end', 'actual', 'executedAt', 'reviewedAt'];
const SELECT_KEYS: readonly FieldKey[] = ['priority', 'status', 'executor', 'reviewer'];
const filterDraft = reactive<Partial<Record<FieldKey, string>>>({});
const applied = ref<Partial<Record<FieldKey, string>>>({});
const defaultFilters = FIELD_KEYS.map(key => ({ key, visible: ['id', 'name', 'status'].includes(key), disabled: key === 'id' }));
const defaultColumns = FIELD_KEYS.map(key => ({ key, visible: !['executor', 'executedAt', 'reviewer', 'reviewedAt'].includes(key), disabled: key === 'id' }));
const filterSettings = ref(defaultFilters.map(item => ({ ...item })));
const columnSettings = ref(defaultColumns.map(item => ({ ...item })));
const filterSettingsOpen = ref(false);
const columnSettingsOpen = ref(false);
const visibleFilters = computed(() => filterSettings.value.filter(item => item.visible).map(item => item.key));
const visibleColumnsKeys = computed(() => columnSettings.value.filter(item => item.visible).map(item => item.key));
const settingsItems = (items: typeof defaultFilters): ColumnSettingsItem[] => items.map(item => ({ ...item, label: t(`vehicle.${item.key}`) }));
function changeFilters(items: ColumnSettingsItem[]) {
  filterSettings.value = items.map(item => ({ key: item.key as FieldKey, visible: item.visible, disabled: item.key === 'id' }));
  for (const key of FIELD_KEYS) if (!visibleFilters.value.includes(key)) { delete filterDraft[key]; delete applied.value[key]; }
}
function changeColumns(items: ColumnSettingsItem[]) {
  columnSettings.value = items.map(item => ({ key: item.key as FieldKey, visible: item.visible, disabled: item.key === 'id' }));
}
function filterOptions(key: FieldKey): string[] {
  if (key === 'status') return [...TASK_STATUSES, 'paused'];
  if (key === 'priority') return [...PRIORITY_CODES];
  return [...new Set(records.value.map(row => String(row[key] ?? '')).filter(Boolean))];
}
function optionLabel(key: FieldKey, value: string) { return key === 'status' ? t(`taskStatus.${value}`) : key === 'priority' ? projectLabel(value) : value; }
function cellText(row: Vehicle, key: FieldKey) { if (key === 'status') return t(`taskStatus.${displayedTaskStatus(row.projectId || '', row.status)}`); const value = String(row[key] ?? ''); return value ? optionLabel(key, value) : '—'; }
function applyFilters() { applied.value = { ...filterDraft }; page.value = 1; }
function resetFilters() { for (const key of FIELD_KEYS) delete filterDraft[key]; applied.value = {}; page.value = 1; }
const hasApplied = computed(() => Object.values(applied.value).some(Boolean));
/** 审批中行的操作由工具栏视角切换控件决定，不按行的 executor/reviewer 字段判定（与证书库 / 模版管理契约一致）。 */
type ViewMode = 'submitter' | 'approver';
const viewMode = ref<ViewMode>('submitter');
function canParticipate(row: Vehicle) { return row.executor === MOCK_CURRENT_USER.name || row.assignments?.some(group => assignmentIsMine(group,MOCK_CURRENT_USER.name,MOCK_CURRENT_USER.accountId)); }
function rowAction(row: Vehicle) {
  if (['pending','active'].includes(row.status) && canParticipate(row)) return 'execute';
  if (canParticipate(row) && ['submitting', 'rejected', 'withdrawn'].includes(row.status)) return 'edit';
  if (row.status === 'reviewing') return viewMode.value === 'submitter' ? 'withdraw' : 'review';
  return '';
}
const withdrawTarget = ref<Vehicle>();
function performAction(row: Vehicle) { if (taskPaused(row.projectId || '', row.status)) return; const action = rowAction(row); if (action === 'withdraw') withdrawTarget.value = row; else if (action) go(row, action); }
function withdraw() {
  const row = withdrawTarget.value;
  if (!row || rowAction(row) !== 'withdraw') return;
  try {
    commitVehicleTask({ ...JSON.parse(JSON.stringify(row)), status: 'withdrawn' }, 'withdraw');
    withdrawTarget.value = undefined; Message.success(t('vehicle.withdrawn'));
  } catch { Message.error(t('vehicle.actionFailed')); }
}
const taskCenter = useTaskCenterStore();
const exportOpen = ref(false);
const exporting = ref(false);
function requestExport() { if (!rows.value.length) { Message.info(t('vehicle.exportEmpty')); return; } exportOpen.value = true; }
// XLSX generation and download registration are local until a server export contract exists.
async function confirmExport() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(t('vehicle.title'));
    const keys = [...visibleColumnsKeys.value];
    sheet.columns = keys.map(key => ({ header: t(`vehicle.${key}`), key, width: 24 }));
    for (const row of rows.value) sheet.addRow(keys.map(key => cellText(row, key)));
    const blob = new Blob([await workbook.xlsx.writeBuffer() as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const now = new Date();
    taskCenter.addDownloadTask({ id: `vehicle-${now.getTime()}`, module: 'vehicle', fileStamp: String(now.getTime()), operator: MOCK_CURRENT_USER.name, time: now.toLocaleString('sv-SE'), status: 'success', fileUrl: URL.createObjectURL(blob), fileName: `${t('vehicle.title')}_${now.toISOString().slice(0, 10)}.xlsx` });
    exportOpen.value = false; taskCenter.open('download'); Message.success(t('sections.exportCreated'));
  } catch { Message.error(t('sections.exportFailed')); } finally { exporting.value = false; }
}
const current = computed(() => records.value.find(r => r.id === route.params.id));
const draft = ref<Vehicle>();
const dirty = ref(false);
function beforeUnload(event: BeforeUnloadEvent) {
  if (!dirty.value && !valuesRef.value?.overlayDirty) return;
  event.preventDefault();
  event.returnValue = '';
}
window.addEventListener('beforeunload', beforeUnload);
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload));
const valuesRef = ref<InstanceType<typeof VehicleValues>>();
const saving = ref(false);
const opinion = ref('');
const approvalResult = ref<'completed' | 'rejected'>();
const approvalError = ref(false);
const approvalLabel = computed(() => t(approvalResult.value === 'completed' ? 'vehicleApproval.opinion' : 'vehicleApproval.reason'));
function closeApproval() {
  if (saving.value) return;
  approvalResult.value = undefined; opinion.value = ''; approvalError.value = false;
}

const isCoordinator = computed(() => draft.value?.executor === MOCK_CURRENT_USER.name);
const canFill = computed(() => !taskPaused(draft.value?.projectId || '', draft.value?.status || '') &&  !!draft.value?.templateSnapshot && (isCoordinator.value || draft.value.assignments?.some(group => assignmentIsMine(group,MOCK_CURRENT_USER.name,MOCK_CURRENT_USER.accountId)))
  && ['pending', 'submitting', 'active', 'rejected', 'withdrawn'].includes(draft.value.status)
  && ['execute', 'edit'].includes(String(route.params.mode)));
const readonly = computed(() => !canFill.value);
/** 审批详情的操作权限由路由审批模式 + 审批中状态决定，不按行的 reviewer 字段判定（与列表视角切换契约一致）。 */
const canReview = computed(() => !taskPaused(draft.value?.projectId || '', draft.value?.status || '') &&  route.params.mode === 'review' && draft.value?.status === 'reviewing');
const basicFields = ['id', 'name', 'priority', 'status', 'brand', 'series', 'model', 'end', 'executor', 'reviewer', 'template', 'version', 'region', 'country', 'type'] as const;
function basicText(key: typeof basicFields[number]) {
  if (!draft.value) return '—';
  if (key === 'template') return draft.value.templateSnapshot?.name || draft.value.template || '—';
  if (key === 'priority') return projectLabel(draft.value.priority);
  if (key === 'status') return t(`taskStatus.${draft.value.status}`);
  if (key === 'brand' || key === 'series' || key === 'model') return draft.value[key] || '—';
  if (['region', 'country', 'type'].includes(key)) {
    const value = draft.value[key as 'region' | 'country' | 'type'];
    const namespace = key === 'region' ? 'regions' : key === 'country' ? 'countries' : 'vehicleTypes';
    // Template enum keys share the dictionary used by template configuration.
    if (namespace === 'regions') return t(`templates.regions.${value}`);
    if (namespace === 'countries') return t(`templates.countries.${value}`);
    return t(`templates.vehicleTypes.${value}`);
  }
  return String(draft.value[key] || '—');
}
type SortDirection = '' | 'ascend' | 'descend';
const sortField = ref<FieldKey | ''>('');
const sortDirection = ref<SortDirection>('');
function compareRows(a: Vehicle, b: Vehicle, key: FieldKey, direction: SortDirection): number {
  const x = String(a[key] ?? '');
  const y = String(b[key] ?? '');
  // Missing dates remain last in either direction; enums follow their business order.
  if (!x && y) return 1;
  if (x && !y) return -1;
  const result = key === 'status' ? TASK_STATUSES.indexOf(a.status) - TASK_STATUSES.indexOf(b.status)
    : key === 'priority' ? PRIORITY_CODES.indexOf(b.priority) - PRIORITY_CODES.indexOf(a.priority)
    : x.localeCompare(y, undefined, { numeric: true });
  return direction === 'descend' ? -result : result;
}
function handleSort(dataIndex: unknown, direction: unknown) {
  if (typeof dataIndex !== 'string' || !FIELD_KEYS.includes(dataIndex as FieldKey)) return;
  sortDirection.value = direction === 'ascend' || direction === 'descend' ? direction : '';
  sortField.value = sortDirection.value ? dataIndex as FieldKey : '';
  page.value = 1;
}
const rows = computed(() => {
  const filtered = records.value.filter(row => (viewMode.value === 'approver' || canParticipate(row)) && FIELD_KEYS.every(key => {
    const value = applied.value[key];
    if (!value) return true;
    const cell = String(key === 'status' ? displayedTaskStatus(row.projectId || '', row.status) : row[key] ?? '');
    return DATE_KEYS.includes(key) ? cell.slice(0, 10) === value : SELECT_KEYS.includes(key) ? cell === value : cell.toLowerCase().includes(value.toLowerCase());
  }));
  const key = sortField.value;
  return key && sortDirection.value ? filtered.sort((a, b) => compareRows(a, b, key, sortDirection.value)) : filtered;
});
watch(() => route.fullPath, () => { draft.value = current.value ? JSON.parse(JSON.stringify(current.value)) : undefined; dirty.value = false; opinion.value = ''; approvalResult.value = undefined; approvalError.value = false; }, { immediate: true });
onBeforeRouteLeave(() => (!dirty.value && !valuesRef.value?.overlayDirty) || requestLeave());
onBeforeRouteUpdate(() => (!dirty.value && !valuesRef.value?.overlayDirty) || requestLeave());
const columns = computed<TableColumnData[]>(() => [
  ...visibleColumnsKeys.value.map((key): TableColumnData => ({
    title: t(`vehicle.${key}`), dataIndex: key, slotName: 'field',
    fixed: key === 'id' ? 'left' : undefined,
    ellipsis: key !== 'id', width: key === 'name' ? 220 : 190,
    // Sort the complete filtered collection before pagination, rather than only this page.
    sortable: { sortDirections: ['ascend', 'descend'], sorter: true, sortOrder: sortField.value === key ? sortDirection.value : '' },
  })),
  { title: t('vehicle.action'), dataIndex: 'action', slotName: 'action', width: 170, fixed: 'right' },
]);
const tableWidth = computed(() => visibleColumnsKeys.value.reduce((sum, key) => sum + (key === 'name' ? 220 : 190), 170));
function go(record: Vehicle, mode: string) { router.push(`/tasks/vehicle/${record.id}/${mode}`); }
async function submitCurrent() { if (!canFill.value || saving.value) return; await valuesRef.value?.submitMine(); }
async function persist(nextStatus?: TaskStatus, submission = false) {
  if (saving.value || !draft.value || (!canFill.value && !canReview.value)) return false;
  if (current.value?.status !== draft.value.status) { Message.error(t('vehicle.actionFailed')); return false; }
  if (nextStatus === 'reviewing') {
    if (!collaborationReady(draft.value)) { Message.error(t('vehicleCollab.notReady')); return false; }
  }
  if (saving.value) return false;
  saving.value = true;
  try {
    const next: Vehicle = JSON.parse(JSON.stringify(draft.value));
    for (const entry of next.entries) if (entry.format === 'ordered') entry.values = next.rowIds!.map((_, index) => String(index + 1));
    next.status = nextStatus ?? (next.status === 'active' || next.assignments?.some(group=>group.status==='submitted') ? 'active' : 'submitting');
    const now = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
    if (nextStatus === 'reviewing') { next.executedAt = now; next.reviewedAt = ''; }
    if (nextStatus === 'completed' || nextStatus === 'rejected') {
      next.reviewedAt = now;
      next.reviews ??= [];
      next.reviews.push({ actor: MOCK_CURRENT_USER.name, opinion: opinion.value.trim(), result: nextStatus, time: now });
    }
    if (nextStatus === 'completed') next.actual = now.slice(0, 10);
    commitVehicleTask(next, nextStatus === 'reviewing' ? 'review' : nextStatus === 'completed' ? 'approve' : nextStatus === 'rejected' ? 'reject' : submission ? 'execute' : 'draft', submission ? t('configurationMatrix.submissionComment') : opinion.value.trim());
    draft.value = JSON.parse(JSON.stringify(next)); dirty.value = false; opinion.value = '';
    Message.success(t(submission ? nextStatus === 'reviewing' ? 'configurationMatrix.sentForReview' : 'configurationMatrix.submitted' : 'vehicle.saved'));
    return true;
  } catch { Message.error(t('vehicle.actionFailed')); return false; } finally { saving.value = false; }
}
function focusApproval() { nextTick(() => document.getElementById('vehicle-approval-input')?.focus()); }
function review(result: 'completed' | 'rejected') {
  if (!canReview.value || saving.value) return;
  approvalResult.value = result; opinion.value = ''; approvalError.value = false;
  nextTick(() => document.getElementById('vehicle-approval-input')?.focus());
}
async function confirmApproval() {
  if (!canReview.value || !approvalResult.value || saving.value) return;
  if (!opinion.value.trim() || Array.from(opinion.value).length > 200) {
    approvalError.value = true;
    nextTick(() => document.getElementById('vehicle-approval-input')?.focus());
    return;
  }
  if (await persist(approvalResult.value)) closeApproval();
}

const pageSize = ref(10);
const page = ref(1);
watch(rows, () => { page.value = 1; });
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
  <section class="vehicle-page">
    
    <template v-if="!route.params.id">
      <form class="filters app-filter-strip" @submit.prevent="applyFilters">
        <div v-for="key in visibleFilters" :key="key" class="app-filter-unit">
          <AppFieldLabel as="label" :for="`vehicle-filter-${key}`" context="filter" :text="t(`vehicle.${key}`)" />
          <a-select v-if="SELECT_KEYS.includes(key)" :id="`vehicle-filter-${key}`" v-model="filterDraft[key]" class="app-filter-control" :aria-label="t(`vehicle.${key}`)" :placeholder="t('sections.all')" allow-clear><a-option v-for="value in filterOptions(key)" :key="value" :value="value">{{ optionLabel(key, value) }}</a-option></a-select>
          <a-date-picker v-else-if="DATE_KEYS.includes(key)" :id="`vehicle-filter-${key}`" v-model="filterDraft[key]" class="app-filter-control" value-format="YYYY-MM-DD" :placeholder="t('sections.selectDate')" :aria-label="t(`vehicle.${key}`)" allow-clear />
          <a-input v-else v-model="filterDraft[key]" :input-attrs="{ id: `vehicle-filter-${key}`, 'aria-label': t(`vehicle.${key}`) }" class="app-filter-control" :placeholder="t('sections.enter')" allow-clear />
        </div>
        <div class="app-filter-actions"><a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('designSystem.search') }}</a-button><a-button class="app-btn-neutral" @click="resetFilters"><template #icon><IconRefresh /></template>{{ t('designSystem.reset') }}</a-button><ColumnSettingsPopover v-model:visible="filterSettingsOpen" :items="settingsItems(filterSettings)" :default-items="settingsItems(defaultFilters)" :title="t('sections.filters.settings')" :list-aria-label="t('sections.filters.settings')" :show-label="t('sections.filters.show')" :restore-label="t('sections.filters.restore')" @change="changeFilters"><a-tooltip :content="t('sections.filters.settings')"><a-button class="app-btn-neutral vehicle-icon-button" :aria-label="t('sections.filters.settings')"><IconFilter /></a-button></a-tooltip></ColumnSettingsPopover></div>
      </form>
      <div class="vehicle-list">
        <div class="vehicle-toolbar"><a-button class="app-btn-neutral" @click="requestExport"><template #icon><IconDownload /></template>{{ t('vehicle.export') }}</a-button><div class="toolbar-settings"><a-select v-model="viewMode" class="view-mode-select" :aria-label="t('executionList.viewMode')"><a-option value="submitter">{{ t('executionList.submitterView') }}</a-option><a-option value="approver">{{ t('executionList.approverView') }}</a-option></a-select><ColumnSettingsPopover v-model:visible="columnSettingsOpen" :items="settingsItems(columnSettings)" :default-items="settingsItems(defaultColumns)" :title="t('sections.columns.settings')" :list-aria-label="t('sections.columns.settings')" :show-label="t('sections.filters.show')" :restore-label="t('sections.filters.restore')" @change="changeColumns"><a-tooltip :content="t('sections.columns.settings')"><a-button class="app-btn-neutral vehicle-icon-button" :aria-label="t('sections.columns.settings')"><IconSettings /></a-button></a-tooltip></ColumnSettingsPopover></div></div>
        <a-table :columns="columns" :data="rows.slice((page - 1) * pageSize, page * pageSize)" :scroll="{ x: tableWidth }" :pagination="false" :bordered="false" row-key="id" @sorter-change="handleSort">
          <template #field="{ record, column }"><AppStatusTag v-if="column.dataIndex === 'status'" :role="statusRole(displayedTaskStatus(record.projectId || '', record.status), 'vehicle')" :label="t(`taskStatus.${displayedTaskStatus(record.projectId || '', record.status)}`)" /><AppStatusTag v-else-if="column.dataIndex === 'priority'" :role="priorityRoles[record.priority as TaskPriority]" :label="projectLabel(record.priority)" /><span v-else class="execution-cell-text" :class="{'is-task-number':column.dataIndex==='id'}" :title="cellText(record, column.dataIndex)">{{ cellText(record, column.dataIndex) }}</span><small v-if="column.dataIndex === 'status' && taskPaused(record.projectId || '', record.status)" :title="`${t('taskPause.previous')}: ${t(`taskStatus.${record.status}`)}`" class="pause-reason">{{ t('taskPause.reason') }}</small></template>
          <template #action="{ record }"><a-space><a-link @click="go(record, 'detail')">{{ t('vehicle.detail') }}</a-link><a-link :disabled="taskPaused(record.projectId || '', record.status)" :title="taskPaused(record.projectId || '', record.status) ? t('taskPause.disabled') : undefined" v-if="rowAction(record)" @click="performAction(record)">{{ t(`vehicle.${rowAction(record)}`) }}</a-link></a-space></template>
          <template #empty><a-empty :description="hasApplied ? t('vehicle.noMatch') : t('vehicle.empty')" /></template>
        </a-table><AppPagination v-model:current="page" v-model:page-size="pageSize" :total="rows.length" />
      </div>
    </template>
    <template v-else-if="draft">
      <AppDetailHeader
        ancestor-to="/tasks/vehicle"
        :ancestor-label="t('vehicle.title')"
        :current-label="route.params.mode === 'execute' ? t('executionWorkspace.execute') : route.params.mode === 'edit' ? t('executionWorkspace.edit') : route.params.mode === 'review' ? t('executionWorkspace.review') : t('executionWorkspace.detail')"
      >
        <template #actions>
          <a-space v-if="!readonly">
            <a-button class="app-btn-neutral" :disabled="saving" @click="router.push('/tasks/vehicle')">{{ t('templates.cancel') }}</a-button>
            <a-button type="outline" class="app-btn-neutral vehicle-draft-button" :loading="saving" :disabled="valuesRef?.imageBusy" @click="persist()">{{ t('vehicle.save') }}</a-button>
            <a-button type="primary" :loading="saving" :disabled="!valuesRef?.hasMineFields || valuesRef?.mineSubmitted || valuesRef?.imageBusy" @click="submitCurrent">{{ t('vehicle.submit') }}</a-button>
          </a-space>
          <a-space v-else-if="canReview">
            <a-button class="app-btn-neutral" :disabled="saving" @click="review('rejected')">{{ t('vehicle.reject') }}</a-button>
            <a-button type="primary" :loading="saving" @click="review('completed')">{{ t('vehicle.pass') }}</a-button>
          </a-space>
        </template>
      </AppDetailHeader><TaskPauseNotice v-if="draft" :project="draft.projectId || ''" :status="draft.status" />
      <TaskInformationSection>
        <dl class="vehicle-facts">
          <div v-for="key in basicFields" :key="key"><dt><AppFieldLabel context="detail" colon :text="['brand', 'series', 'model'].includes(key) ? t(`projects.${key}`) : t(`vehicle.${key}`)" /></dt><dd><AppStatusTag v-if="key === 'status'" :role="statusRole(draft.status, 'vehicle')" :label="basicText(key)" /><template v-else>{{ basicText(key) }}</template></dd></div>
        </dl>
      </TaskInformationSection>
      <div class="detail-block" role="region" :aria-label="t('vehicle.items')">
        <h2 class="section-heading">{{ t('vehicle.items') }}</h2>
        <VehicleValues :key="draft.id" ref="valuesRef" v-model="draft" :readonly="readonly || saving" :manager="isCoordinator" :filling-mode="['execute','edit'].includes(String(route.params.mode)) && ['pending','submitting','active','rejected','withdrawn'].includes(draft.status)" :actor="MOCK_CURRENT_USER.name" :actor-id="MOCK_CURRENT_USER.accountId" @change="dirty = true" @save="(done,review) => persist(review ? 'reviewing' : undefined, true).then(done)" />
        <a-alert v-if="!draft.templateSnapshot" type="warning">{{ t('vehicleFill.missingTemplate') }}</a-alert>
      </div>
      <VehicleTimeline v-if="route.params.mode !== 'execute'" :record="current || draft" />

    </template>
    <a-empty v-else />
  </section>
<a-modal
  :visible="!!approvalResult"
  :width="560"
  role="dialog"
  aria-modal="true"
  :aria-label="approvalLabel"
  :title="t(approvalResult === 'completed' ? 'vehicle.pass' : 'vehicle.reject')"
  :mask-closable="false"
  :esc-to-close="!saving"
  :closable="!saving"
  @cancel="closeApproval"
  @open="focusApproval"
>
  <a-form :model="{ opinion }" layout="vertical" @submit-success="confirmApproval">
    <a-form-item field="opinion" required :validate-status="approvalError ? 'error' : undefined" :help="approvalError ? t('vehicleApproval.required', { field: approvalLabel }) : undefined">
      <template #label><AppFieldLabel as="label" for="vehicle-approval-input" context="editable" :text="approvalLabel" /></template>
      <a-textarea v-model="opinion" :textarea-attrs="{ id: 'vehicle-approval-input', 'aria-label': approvalLabel, 'aria-required': true, 'aria-invalid': approvalError }" :max-length="200" show-word-limit :auto-size="{ minRows: 4, maxRows: 8 }" :disabled="saving" @input="approvalError = false" />
    </a-form-item>
  </a-form>
  <template #footer><a-space><a-button class="app-btn-neutral" :disabled="saving" @click="closeApproval">{{ t('templates.cancel') }}</a-button><a-button type="primary" :loading="saving" @click="confirmApproval">{{ t('designSystem.confirm') }}</a-button></a-space></template>
</a-modal>
<ConfirmDialog plain-title :visible="!!withdrawTarget" :title="t('vehicle.withdrawTitle')" @update:visible="withdrawTarget = undefined" @confirm="withdraw" />
<ConfirmDialog :visible="exportOpen" :title="t('sections.exportNotice.title')" :description="[t('vehicle.exportNotice'), t('sections.exportNotice.line2')]" :ok-loading="exporting" :dismissible="!exporting" @update:visible="value => { if (!exporting) exportOpen = value; }" @confirm="confirmExport" />
<ConfirmDialog unsaved :visible="leaveVisible" :title="t('vehicle.unsaved')" @update:visible="finishLeave(false)" @confirm="finishLeave(true)" />
</template>
<style scoped>
.execution-cell-text.is-task-number { white-space:normal; overflow:visible; overflow-wrap:anywhere; word-break:normal; text-overflow:clip; line-height:22px; }
.execution-cell-text { display:block; min-width:0; max-width:100%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.vehicle-page { display: flex; flex-direction: column; min-width: 0; gap: var(--mt-ds-space-3); color: var(--color-text-1); }
/* 筛选区布局统一走 global.css 的 app-filter-strip / app-filter-unit / app-filter-actions */
.filters { padding: var(--mt-ds-space-4); background: var(--app-surface); }
.vehicle-toolbar { display: flex; justify-content: space-between; gap: var(--mt-ds-space-2); margin-bottom: var(--mt-ds-space-4); }
.toolbar-settings { display: flex; align-items: center; gap: var(--mt-ds-space-2); flex-wrap: nowrap; }
.toolbar-settings :deep(.view-mode-select) { flex: 0 0 160px; width: 160px; }
.vehicle-icon-button { display: inline-grid; flex: 0 0 32px; width: 32px; height: 32px; padding: 0; place-items: center; }
.vehicle-list { min-width: 0; padding: var(--mt-ds-space-4); background: var(--app-surface); }
.vehicle-list :deep(.arco-table-th) { height: 50px; background: var(--app-table-header); }
.vehicle-list :deep(.arco-table-td) { height: 50px; }
.vehicle-draft-button.arco-btn { background-color: transparent; }
.vehicle-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--mt-ds-space-4); margin: 0; }
.vehicle-facts > div { min-width: 0; display: flex; align-items: baseline; gap: var(--mt-ds-space-2); }
.vehicle-facts dt { flex-shrink: 0; color: var(--color-text-3); }
.vehicle-facts dd { margin: 0; overflow-wrap: anywhere; }
@media (max-width: 1000px) { .vehicle-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .vehicle-facts { grid-template-columns: 1fr; } }
.detail-block { min-width: 0; padding: var(--mt-ds-space-4); background: var(--app-surface); }
.section-heading { margin: 0 0 var(--mt-ds-space-4); padding-bottom: var(--mt-ds-space-3); border-bottom: 1px solid var(--app-divider); font-size: var(--mt-ds-font-title); font-weight: var(--mt-ds-weight-title); }
.vehicle-page :deep(th), .vehicle-page :deep(td), .vehicle-page :deep(.arco-tag), .vehicle-page :deep(.arco-link), .vehicle-page :deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
/* 窄屏流式布局由 global.css 的 .app-filter-strip 媒体查询统一处理 */
.pause-reason { display:block; color:var(--color-text-3); }
</style>

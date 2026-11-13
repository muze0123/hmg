<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import { IconDownload, IconFilter, IconRefresh, IconSearch, IconSettings } from '@arco-design/web-vue/es/icon';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import { TASK_STATUSES, type TaskStatus } from '../../../shared/taskLifecycle';
import { statusRole } from '../../../shared/status';
import { MOCK_CURRENT_USER } from '../../projects/data/projects';
import { recordTaskEvent } from '../../projects/data/history';
import { useTaskCenterStore } from '../../task-center/stores/taskCenter';
interface Row {
  id: string; project: string; regulation: string; status: TaskStatus;
  name?: string; priority?: string; createdAt?: string; end?: string; actual?: string;
  owner?: string; executedAt?: string; reviewer?: string; reviewedAt?: string;
}
const props = defineProps<{ module: 'testing' | 'reports' | 'certificates' | 'technical'; rows: Row[] }>();
const { t } = useI18n();
const router = useRouter();
const taskCenter = useTaskCenterStore();
const filterOrder = ['id', 'name', 'regulation', 'priority', 'status', 'createdAt', 'end', 'actual', 'owner', 'executedAt', 'reviewer', 'reviewedAt'] as const;
type Key = typeof filterOrder[number];
const columnOrder: Key[] = ['regulation', 'id', 'name', 'priority', 'status', 'createdAt', 'end', 'actual', 'owner', 'executedAt', 'reviewer', 'reviewedAt'];
const dates: Key[] = ['createdAt', 'end', 'actual', 'executedAt', 'reviewedAt'];
const selects: Key[] = ['priority', 'status', 'owner', 'reviewer'];
const label = (key: Key) => t(`executionList.${key}`);
const defaultFilters = () => filterOrder.map(key => ({ key, visible: ['id', 'name', 'regulation', 'status'].includes(key), disabled: key === 'id' }));
const defaultColumns = () => columnOrder.map(key => ({ key, visible: !['owner', 'executedAt', 'reviewer', 'reviewedAt'].includes(key), disabled: key === 'regulation' }));
const filters = ref<ColumnSettingsItem[]>(defaultFilters().map(item => ({ ...item, label: label(item.key) })));
const columns = ref<ColumnSettingsItem[]>(defaultColumns().map(item => ({ ...item, label: label(item.key) })));
const filterItems = computed(() => filters.value.map(item => ({ ...item, label: label(item.key as Key) })));
const columnItems = computed(() => columns.value.map(item => ({ ...item, label: label(item.key as Key) })));
const filterDefaults = computed(() => defaultFilters().map(item => ({ ...item, label: label(item.key) })));
const columnDefaults = computed(() => defaultColumns().map(item => ({ ...item, label: label(item.key) })));
const filterOpen = ref(false), columnOpen = ref(false);
const draft = reactive<Partial<Record<Key, string>>>({});
const applied = ref<Partial<Record<Key, string>>>({});
const page = ref(1), pageSize = ref(10);
const sortKey = ref<Key>(), direction = ref<'ascend' | 'descend'>();
function search() { applied.value = { ...draft }; page.value = 1; }
function reset() { for (const key of filterOrder) delete draft[key]; applied.value = {}; page.value = 1; }
function changeFilters(items: ColumnSettingsItem[]) {
  filters.value = items;
  for (const item of items) if (!item.visible) { delete draft[item.key as Key]; delete applied.value[item.key as Key]; }
  page.value = 1;
}
function options(key: Key): string[] {
  if (key === 'status') return [...TASK_STATUSES];
  if (key === 'priority') return ['urgent', 'high', 'normal'];
  return [...new Set(props.rows.map(row => row[key] || '').filter(Boolean))];
}
function optionLabel(key: Key, value: string) { return key === 'status' ? t(`taskStatus.${value}`) : key === 'priority' ? t(`sections.${value}`) : value; }
function cell(row: Row, key: Key) { return optionLabel(key, row[key] || '') || '—'; }
function compare(a: Row, b: Row, key: Key, order: string) {
  const x = a[key] || '', y = b[key] || '';
  if (!x || !y) return x ? -1 : y ? 1 : 0;
  return x.localeCompare(y, undefined, { numeric: true }) * (order === 'descend' ? -1 : 1);
}
const results = computed(() => {
  const rows = props.rows.filter(row => filterOrder.every(key => {
    const value = applied.value[key]; if (!value) return true;
    const text = row[key] || '';
    return dates.includes(key) ? text.slice(0, 10) === value : selects.includes(key) ? text === value : text.toLowerCase().includes(value.toLowerCase());
  }));
  return sortKey.value && direction.value ? [...rows].sort((a,b) => compare(a,b,sortKey.value!,direction.value!)) : rows;
});
watch(results, () => { page.value = 1; });
const visibleColumns = computed(() => columns.value.filter(item => item.visible));
const tableColumns = computed<TableColumnData[]>(() => [
  ...visibleColumns.value.map((item): TableColumnData => ({ title: label(item.key as Key), dataIndex: item.key, slotName: 'field', width: item.key === 'name' ? 280 : 180, fixed: item.key === 'regulation' ? 'left' as const : undefined,
    sortable: { sortDirections: ['ascend', 'descend'] as ('ascend' | 'descend')[], sortOrder: sortKey.value === item.key ? direction.value : '', sorter: (a, b, extra) => compare(a as unknown as Row, b as unknown as Row, item.key as Key, extra.direction) } })),
  { title: t('sections.action'), slotName: 'actions', width: 170, fixed: 'right' },
]);
function sort(key: string, order: string) { sortKey.value = filterOrder.includes(key as Key) ? key as Key : undefined; direction.value = order === 'ascend' || order === 'descend' ? order : undefined; page.value = 1; }
function actions(row: Row) {
  if (row.status === 'pending') return ['execute'];
  if (['submitting', 'rejected', 'withdrawn'].includes(row.status)) return ['edit'];
  if (row.status === 'reviewing') {
    if (row.owner === MOCK_CURRENT_USER.name) return ['withdraw'];
    if (row.reviewer === MOCK_CURRENT_USER.name) return ['review'];
  }
  return [];
}
const withdrawing = ref<Row>();
function open(row: Row, action: string) {
  if (action === 'withdraw') { withdrawing.value = row; return; }
  void router.push(`/tasks/${props.module}/${row.id}/${action === 'execute' ? 'edit' : action}`);
}
function withdraw() {
  const row = withdrawing.value;
  if (!row || row.status !== 'reviewing' || row.owner !== MOCK_CURRENT_USER.name) { Message.warning(t('taskWithdrawal.changed')); withdrawing.value = undefined; return; }
  row.status = 'withdrawn';
  recordTaskEvent(row.project, props.module === 'reports' ? 'report' : props.module === 'certificates' ? 'certificate' : props.module, 'withdraw', row.owner, '', row.id);
  withdrawing.value = undefined;
  Message.success(t('taskWithdrawal.success'));
}
const exportOpen = ref(false), exporting = ref(false);
function requestExport() { if (!results.value.length) { Message.info(t('executionList.exportEmpty')); return; } exportOpen.value = true; }
async function exportRows() {
  if (exporting.value) return;
  exporting.value = true;
  try {
    // Typed local fixtures; no server export API is contracted yet.
    const { default: ExcelJS } = await import('exceljs');
    const book = new ExcelJS.Workbook();
    const title = t(`executionList.modules.${props.module}`);
    const sheet = book.addWorksheet(title);
    sheet.addRow(visibleColumns.value.map(item => label(item.key as Key)));
    sheet.columns = visibleColumns.value.map(() => ({ width: 24 }));
    for (const row of results.value) sheet.addRow(visibleColumns.value.map(item => cell(row, item.key as Key)));
    const blob = new Blob([await book.xlsx.writeBuffer() as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const now = new Date();
    taskCenter.addDownloadTask({ id: `dl-${crypto.randomUUID()}`, module: props.module, fileStamp: now.toISOString().replace(/\D/g, '').slice(0,14), operator: MOCK_CURRENT_USER.name, time: now.toLocaleString('sv-SE'), status: 'success', progress: 100, fileUrl: URL.createObjectURL(blob), fileName: `${title}_${now.toLocaleDateString('en-CA')}.xlsx` });
    exportOpen.value = false; Message.success(t('executionList.exportSuccess')); taskCenter.open('download');
  } catch { Message.error(t('sections.exportFailed')); } finally { exporting.value = false; }
}
</script>
<template>
  <div class="execution-list">
    <form class="panel app-filter-strip" @submit.prevent="search">
      <div v-for="item in filterItems.filter(item => item.visible)" :key="item.key" class="app-filter-unit">
        <AppFieldLabel as="label" :for="`${module}-${item.key}`" context="filter" :text="item.label" />
        <a-select v-if="selects.includes(item.key as Key)" :id="`${module}-${item.key}`" v-model="draft[item.key as Key]" class="app-filter-control" :aria-label="item.label" allow-clear :placeholder="t('sections.all')"><a-option v-for="value in options(item.key as Key)" :key="value" :value="value">{{ optionLabel(item.key as Key, value) }}</a-option></a-select>
        <a-date-picker v-else-if="dates.includes(item.key as Key)" :id="`${module}-${item.key}`" v-model="draft[item.key as Key]" class="app-filter-control" value-format="YYYY-MM-DD" :aria-label="item.label" allow-clear />
        <a-input v-else v-model="draft[item.key as Key]" class="app-filter-control" :input-attrs="{ id: `${module}-${item.key}`, 'aria-label': item.label }" :placeholder="t('sections.enter')" allow-clear />
      </div>
      <div class="app-filter-actions">
        <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('designSystem.search') }}</a-button>
        <a-button class="app-btn-neutral" @click="reset"><template #icon><IconRefresh /></template>{{ t('designSystem.reset') }}</a-button>
        <ColumnSettingsPopover v-model:visible="filterOpen" :items="filterItems" :default-items="filterDefaults" :title="t('sections.filters.settings')" :list-aria-label="t('sections.filters.settings')" :show-label="t('sections.filters.show')" :restore-label="t('sections.filters.restore')" @change="changeFilters"><a-tooltip :content="t('sections.filters.settings')"><a-button class="app-btn-neutral icon-button" :aria-label="t('sections.filters.settings')"><IconFilter /></a-button></a-tooltip></ColumnSettingsPopover>
      </div>
    </form>
    <section class="panel list-panel" :aria-label="t(`executionList.modules.${module}`)">
      <div class="toolbar"><a-button class="app-btn-neutral" @click="requestExport"><template #icon><IconDownload /></template>{{ t('sections.export') }}</a-button>
        <ColumnSettingsPopover v-model:visible="columnOpen" :items="columnItems" :default-items="columnDefaults" :title="t('sections.columns.settings')" :list-aria-label="t('sections.columns.settings')" :show-label="t('sections.filters.show')" :restore-label="t('sections.filters.restore')" @change="columns = $event"><a-tooltip :content="t('sections.columns.settings')"><a-button class="app-btn-neutral icon-button" :aria-label="t('sections.columns.settings')"><IconSettings /></a-button></a-tooltip></ColumnSettingsPopover>
      </div>
      <a-table row-key="id" :columns="tableColumns" :data="results.slice((page-1)*pageSize,page*pageSize)" :pagination="false" :bordered="false" :scroll="{ x: visibleColumns.reduce((sum,item) => sum + (item.key === 'name' ? 280 : 180), 170) }" @sorter-change="sort">
        <template #field="{record,column}"><AppStatusTag v-if="column.dataIndex === 'status' || column.dataIndex === 'priority'" :role="column.dataIndex === 'status' ? statusRole(record.status, 'tasks') : record.priority === 'urgent' ? 'danger' : record.priority === 'high' ? 'warning' : 'neutral'" :label="cell(record, column.dataIndex)" /><span v-else>{{ cell(record,column.dataIndex) }}</span></template>
        <template #actions="{record}"><div class="row-actions"><button type="button" @click="open(record,'view')">{{ t('sections.view') }}</button><button v-for="action in actions(record)" :key="action" type="button" @click="open(record,action)">{{ t(`sections.${action}`) }}</button></div></template>
        <template #empty><a-empty :description="t(Object.values(applied).some(Boolean) ? 'executionList.noMatch' : 'executionList.empty')" /></template>
      </a-table>
      <AppPagination v-model:current="page" v-model:page-size="pageSize" :total="results.length" />
    </section>
    <ConfirmDialog :visible="!!withdrawing" :title="t('taskWithdrawal.confirm')" :description="t('taskWithdrawal.description', { name: withdrawing?.name || withdrawing?.id })" @update:visible="!$event && (withdrawing = undefined)" @confirm="withdraw" />
    <ConfirmDialog v-model:visible="exportOpen" icon="info" :title="t('sections.exportNotice.title')" :description="[t('executionList.exportScope'), t('sections.exportNotice.line2')]" :ok-text="t('sections.exportNotice.confirm')" :ok-loading="exporting" :cancel-disabled="exporting" :dismissible="!exporting" @confirm="exportRows" />
  </div>
</template>
<style scoped>
.execution-list { display: flex; flex-direction: column; gap: var(--mt-ds-space-3); min-width: 0; }
.panel { min-width: 0; padding: var(--mt-ds-space-4); border-radius: 2px; background: var(--app-surface); }
.list-panel { overflow: hidden; }
.toolbar { display:flex; align-items:center; justify-content:space-between; gap:var(--mt-ds-space-2); margin-bottom:var(--mt-ds-space-4); }
.icon-button { display:inline-grid; width:32px; height:32px; padding:0; place-items:center; }
.execution-list .list-panel :deep(.arco-table-th) { height:50px; padding:0 12px; background:var(--app-table-header); font-weight:400; white-space:nowrap; }
.execution-list .list-panel :deep(.arco-table-td) { height:50px; padding:8px 12px; border-bottom:1px solid var(--app-divider); background:var(--app-surface); font-weight:400; white-space:nowrap; }
.row-actions { display:flex; gap:var(--mt-ds-space-3); }
.row-actions button { padding:0; border:0; background:transparent; color:var(--app-color-primary); font:inherit; font-weight:400; cursor:pointer; }
.row-actions button:hover { text-decoration:underline; }
.row-actions button:focus-visible { outline:2px solid var(--app-color-primary); outline-offset:2px; }
</style>

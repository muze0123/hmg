<script setup lang="ts">
import { TASK_STATUSES, migrateTaskStatus, type TaskStatus } from '../../../shared/taskLifecycle';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import { IconSearch, IconRefresh, IconFilter, IconSettings, IconDownload } from '@arco-design/web-vue/es/icon';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import { statusRole } from '../../../shared/status';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { useProjectLabels } from '../../projects/labels';
import { MOCK_CURRENT_USER, PRIORITY_CODES, type TaskPriority } from '../../projects/data/projects';
import { useTaskCenterStore } from '../../task-center/stores/taskCenter';
import ExcelJS from 'exceljs';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
const { t } = useI18n();
const projectLabel = useProjectLabels();
const priorityRoles = { urgent: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;
function normalizePriority(value: unknown): TaskPriority {
  return PRIORITY_CODES.includes(value as TaskPriority) ? value as TaskPriority : 'medium';
}
const route = useRoute();
const router = useRouter();
interface Entry { name: string; format: string; tag: string; values: string[] }
interface Vehicle { createdAt?: string; executedAt?: string; reviewedAt?: string; reviews?: { opinion: string; result: string; time: string }[]; id: string; name: string; status: TaskStatus; priority: TaskPriority; start: string; end: string; actual: string; region: string; country: string; type: string; template: string; reviewer: string; executor: string; version: string; note: string; attachment: string; entries: Entry[] }
const seed: Vehicle[] = Array.from({ length: 16 }, (_, i) => ({ id: `HMG-2026-${String(i + 1).padStart(3, '0')}`, name: `DF7 / ${2026 + i}`, status: TASK_STATUSES[i % TASK_STATUSES.length]!, priority: PRIORITY_CODES[i % PRIORITY_CODES.length]!, createdAt: '2026-11-01 09:00:00', executedAt: i % 8 >= 2 ? '2026-11-02 10:00:00' : '', reviewedAt: i % 8 === 4 ? '2026-11-06 15:00:00' : '', start: '2026-11-01', end: '2026-12-30', actual: TASK_STATUSES[i % TASK_STATUSES.length] === 'completed' ? '2026-11-06' : '', region: 'asia', country: 'china', type: 'truck', template: 'DF7 V1.0', reviewer: i < 8 ? '李四' : MOCK_CURRENT_USER.name, executor: i < 8 ? MOCK_CURRENT_USER.name : '张三', version: 'V1.0', note: '', attachment: '', entries: [{ name: 'Y75D', format: 'text', tag: '', values: ['Y75D', 'Z75B'] }] }));
const records = ref<Vehicle[]>(seed);
try { const latest = localStorage.getItem('hmg-vehicle-v2'); const stored = JSON.parse(latest || localStorage.getItem('hmg-vehicle-v1') || 'null'); if (Array.isArray(stored) && stored.every(r => r.id && Array.isArray(r.entries))) records.value = stored.map(r => ({ ...r, priority: normalizePriority(r.priority), status: migrateTaskStatus(!latest && r.status === 'pending' ? 'submitting' : r.status) })); } catch { /* Use demo fixtures when storage is unavailable. */ }
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
  if (key === 'status') return [...TASK_STATUSES];
  if (key === 'priority') return [...PRIORITY_CODES];
  return [...new Set(records.value.map(row => String(row[key] ?? '')).filter(Boolean))];
}
function optionLabel(key: FieldKey, value: string) { return key === 'status' ? t(`taskStatus.${value}`) : key === 'priority' ? projectLabel(value) : value; }
function cellText(row: Vehicle, key: FieldKey) { const value = String(row[key] ?? ''); return value ? optionLabel(key, value) : '—'; }
function applyFilters() { applied.value = { ...filterDraft }; page.value = 1; }
function resetFilters() { for (const key of FIELD_KEYS) delete filterDraft[key]; applied.value = {}; page.value = 1; }
const hasApplied = computed(() => Object.values(applied.value).some(Boolean));
const EDIT_STATUSES: readonly TaskStatus[] = ['pending', 'submitting', 'rejected', 'withdrawn'];
function rowAction(row: Vehicle) {
  if (row.status === 'pending') return 'execute';
  if (['submitting', 'rejected', 'withdrawn'].includes(row.status)) return 'edit';
  if (row.status === 'reviewing') return row.executor === MOCK_CURRENT_USER.name ? 'withdraw' : row.reviewer === MOCK_CURRENT_USER.name ? 'review' : '';
  return '';
}
const withdrawTarget = ref<Vehicle>();
function performAction(row: Vehicle) { const action = rowAction(row); if (action === 'withdraw') withdrawTarget.value = row; else if (action) go(row, action === 'execute' ? 'edit' : action); }
function withdraw() {
  const row = withdrawTarget.value;
  if (!row || rowAction(row) !== 'withdraw') return;
  const updated = records.value.map(item => item.id === row.id ? { ...item, status: 'withdrawn' as const } : item);
  try { localStorage.setItem('hmg-vehicle-v2', JSON.stringify(updated)); records.value = updated; withdrawTarget.value = undefined; Message.success(t('vehicle.withdrawn')); }
  catch { Message.error(t('vehicle.actionFailed')); }
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
const opinion = ref('');
const requiredRules = computed(() => [{ required: true, validator: (value: string, callback: (message?: string) => void) => callback(value?.trim() ? undefined : t('vehicle.required')) }]);
const formRef = ref<{ validate: () => Promise<unknown> }>();
const fileInput = ref<HTMLInputElement>();
const folded = ref(false);
const regions: Record<string,string> = { asia:'china', europe:'germany', northAmerica:'usa', southAmerica:'brazil', africa:'egypt', oceania:'australia' };
function visibleColumns(entry: Entry) {
  return entry.values.map((_, index) => index).filter(index => !folded.value || !entry.values.some((_, earlier) => earlier < index && draft.value?.entries.every(row => row.values[earlier] === row.values[index])));
}
function addEntries(count: number) { if (!draft.value) return; for (let index=0; index<count; index++) draft.value.entries.push({name:'',format:'text',tag:'',values:Array(draft.value.entries[0]?.values.length || 1).fill('')}); dirty.value=true; }
const readonly = computed(() => route.params.mode !== 'edit' || !draft.value || !EDIT_STATUSES.includes(draft.value.status));
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
  const filtered = records.value.filter(row => FIELD_KEYS.every(key => {
    const value = applied.value[key];
    if (!value) return true;
    const cell = String(row[key] ?? '');
    return DATE_KEYS.includes(key) ? cell.slice(0, 10) === value : SELECT_KEYS.includes(key) ? cell === value : cell.toLowerCase().includes(value.toLowerCase());
  }));
  const key = sortField.value;
  return key && sortDirection.value ? filtered.sort((a, b) => compareRows(a, b, key, sortDirection.value)) : filtered;
});
watch(() => route.fullPath, () => { draft.value = current.value ? JSON.parse(JSON.stringify(current.value)) : undefined; dirty.value = false; opinion.value = ''; }, { immediate: true });
onBeforeRouteLeave(() => !dirty.value || requestLeave());
const columns = computed<TableColumnData[]>(() => [
  ...visibleColumnsKeys.value.map((key): TableColumnData => ({
    title: t(`vehicle.${key}`), dataIndex: key, slotName: 'field',
    fixed: key === 'id' ? 'left' : undefined,
    ellipsis: true, width: key === 'name' ? 220 : 190,
    // Sort the complete filtered collection before pagination, rather than only this page.
    sortable: { sortDirections: ['ascend', 'descend'], sorter: true, sortOrder: sortField.value === key ? sortDirection.value : '' },
  })),
  { title: t('vehicle.action'), dataIndex: 'action', slotName: 'action', width: 170, fixed: 'right' },
]);
const tableWidth = computed(() => visibleColumnsKeys.value.reduce((sum, key) => sum + (key === 'name' ? 220 : 190), 170));
function go(record: Vehicle, mode: string) { router.push(`/tasks/vehicle/${record.id}/${mode}`); }
async function persist(nextStatus?: TaskStatus) {
  if (nextStatus && !readonly.value && await formRef.value?.validate()) return;
  if (!draft.value) return;
  if (nextStatus && ['region', 'country', 'type', 'template', 'reviewer', 'executor', 'version'].some(key => !draft.value![key as keyof Vehicle])) { Message.error(t('vehicle.required')); return; }
  const next = JSON.parse(JSON.stringify(draft.value)) as Vehicle;
  next.status = nextStatus ?? 'submitting';
  const now = new Date().toLocaleString('sv-SE');
  if (nextStatus === 'reviewing') next.executedAt = now;
  if (nextStatus === 'completed' || nextStatus === 'rejected') next.reviewedAt = now;
  if (nextStatus === 'completed') next.actual = new Date().toISOString().slice(0, 10);
  const updated = records.value.map(r => r.id === next.id ? next : r);
  try { localStorage.setItem('hmg-vehicle-v2', JSON.stringify(updated)); } catch { Message.error(t('vehicle.required')); return; }
  records.value = updated; draft.value = JSON.parse(JSON.stringify(next)); dirty.value = false; Message.success(t('vehicle.saved'));
}
function review(result: 'completed' | 'rejected') { if (!draft.value || draft.value.status !== 'reviewing' || draft.value.reviewer !== MOCK_CURRENT_USER.name) return; if (!opinion.value.trim()) { Message.error(t('vehicle.reviewRequired')); return; } if (draft.value) { draft.value.reviews ??= []; draft.value.reviews.push({opinion:opinion.value,result,time:new Date().toISOString()}); } persist(result); }
function updateCell(entry: Entry, column: number, row: number, cell: number, value: string) {
  const grid = (entry.values[column] || '\t\n\t').split('\n').map(line => line.split('\t'));
  grid[row]![cell] = value; entry.values[column] = grid.map(line => line.join('\t')).join('\n'); dirty.value = true;
}
function attachment(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file || !draft.value) return; if (!/\.(docx?|pdf)$/i.test(file.name)) { Message.error(t('vehicle.invalidFile')); return; } draft.value.attachment = file.name; dirty.value = true; }
function addColumn() { draft.value?.entries.forEach(entry => entry.values.push('')); dirty.value = true; }
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
        <div class="vehicle-toolbar"><a-button class="app-btn-neutral" @click="requestExport"><template #icon><IconDownload /></template>{{ t('vehicle.export') }}</a-button><ColumnSettingsPopover v-model:visible="columnSettingsOpen" :items="settingsItems(columnSettings)" :default-items="settingsItems(defaultColumns)" :title="t('sections.columns.settings')" :list-aria-label="t('sections.columns.settings')" :show-label="t('sections.filters.show')" :restore-label="t('sections.filters.restore')" @change="changeColumns"><a-tooltip :content="t('sections.columns.settings')"><a-button class="app-btn-neutral vehicle-icon-button" :aria-label="t('sections.columns.settings')"><IconSettings /></a-button></a-tooltip></ColumnSettingsPopover></div>
        <a-table :columns="columns" :data="rows.slice((page - 1) * pageSize, page * pageSize)" :scroll="{ x: tableWidth }" :pagination="false" :bordered="false" row-key="id" @sorter-change="handleSort">
          <template #field="{ record, column }"><AppStatusTag v-if="column.dataIndex === 'status'" :role="statusRole(record.status, 'vehicle')" :label="t(`taskStatus.${record.status}`)" /><AppStatusTag v-else-if="column.dataIndex === 'priority'" :role="priorityRoles[record.priority as TaskPriority]" :label="projectLabel(record.priority)" /><span v-else>{{ cellText(record, column.dataIndex) }}</span></template>
          <template #action="{ record }"><a-space><a-link @click="go(record, 'detail')">{{ t('vehicle.detail') }}</a-link><a-link v-if="rowAction(record)" @click="performAction(record)">{{ t(`vehicle.${rowAction(record)}`) }}</a-link></a-space></template>
          <template #empty><a-empty :description="hasApplied ? t('vehicle.noMatch') : t('vehicle.empty')" /></template>
        </a-table><AppPagination v-model:current="page" v-model:page-size="pageSize" :total="rows.length" />
      </div>
    </template>
    <template v-else-if="draft">
      <a-space><a-button @click="router.push('/tasks/vehicle')">{{ t('vehicle.back') }}</a-button><span>{{ draft.id }} · {{ draft.name }}</span><AppStatusTag :role="statusRole(draft.status, 'vehicle')" :label="t(`taskStatus.${draft.status}`)"/></a-space>
      <a-tabs default-active-key="basic">
        <a-tab-pane key="basic" :title="t('vehicle.basic')">
          <a-form ref="formRef" :model="draft" layout="vertical" scroll-to-first-error class="vehicle-form" :class="{ 'vehicle-form--readonly': readonly }" @input="dirty = true" @change="dirty = true">
            <a-form-item v-for="key in ['region','country','type','template','reviewer','executor','version'] as const" :key="key"  :field="key" :rules="readonly ? [] : requiredRules" :required="!readonly"><template #label><AppFieldLabel :text="t(`vehicle.${key}`)" :context="readonly ? 'detail' : 'editable'" /></template>
              <span v-if="readonly">{{ ['region','country','type'].includes(key) ? t(`vehicle.${draft[key]}`) : draft[key] }}</span>
              <a-select v-else-if="key === 'region'" v-model="draft.region" @change="draft.country = regions[draft.region] || 'china'"><a-option v-for="code in ['asia','europe','northAmerica','southAmerica','africa','oceania']" :key="code" :value="code">{{ t(`vehicle.${code}`) }}</a-option></a-select>
              <a-select v-else-if="key === 'country'" v-model="draft.country"><a-option :value="regions[draft.region] || 'china'">{{ t(`vehicle.${regions[draft.region] || 'china'}`) }}</a-option></a-select>
              <a-select v-else-if="key === 'type'" v-model="draft.type"><a-option v-for="code in ['car','truck']" :key="code" :value="code">{{ t(`vehicle.${code}`) }}</a-option></a-select>
              <a-input v-else v-model="draft[key]" />
            </a-form-item>
            <a-form-item :label="t('vehicle.note')"><span v-if="readonly">{{ draft.note || '—' }}</span><a-textarea v-else v-model="draft.note" /></a-form-item>
            <a-form-item :label="t('vehicle.attachment')"><span>{{ draft.attachment || '—' }}</span><a-button v-if="!readonly" @click="fileInput?.click()">{{ t('vehicle.attachment') }}</a-button><input v-if="!readonly" ref="fileInput" style="display:none" type="file" accept=".doc,.docx,.pdf" :aria-label="t('vehicle.attachment')" @change="attachment" /></a-form-item>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="items" :title="t('vehicle.items')">
          <a-space v-if="!readonly"><a-dropdown trigger="contextMenu" @select="value => addEntries(Number(value))"><a-button @click="addEntries(1)">{{ t('vehicle.add') }}</a-button><template #content><a-doption v-for="count in [10,20,50]" :key="count" :value="String(count)">{{ count }}</a-doption></template></a-dropdown><a-button @click="addColumn">{{ t('vehicle.addColumn') }}</a-button></a-space>
          <a-button @click="folded = !folded">{{ t(folded ? 'vehicle.expand' : 'vehicle.fold') }}</a-button><div class="configuration-scroll"><table class="configuration-table"><thead><tr><th>#</th><th>{{ t('vehicle.item') }}</th><th>{{ t('vehicle.format') }}</th><th>{{ t('vehicle.tag') }}</th><th v-for="index in (draft.entries[0] ? visibleColumns(draft.entries[0]) : [])" :key="index">{{ t('vehicle.value') }} {{ index + 1 }}<a-button v-if="!readonly && index > 0" size="mini" @click="draft.entries.forEach(e => e.values.splice(index,1));dirty=true">{{ t('vehicle.remove') }}</a-button></th><th v-if="!readonly">{{ t('vehicle.action') }}</th></tr></thead><tbody><tr v-for="(entry,index) in draft.entries" :key="index"><td>{{ index+1 }}</td><td><span v-if="readonly">{{ entry.name }}</span><a-input v-else v-model="entry.name" :aria-label="t('vehicle.item')" @input="dirty=true" /></td><td><span v-if="readonly">{{ t(`vehicle.${entry.format}`) }}</span><a-select v-else v-model="entry.format" :aria-label="t('vehicle.format')" @change="dirty=true"><a-option v-for="code in ['text','number','ordered','table','rich']" :key="code" :value="code">{{ t(`vehicle.${code}`) }}</a-option></a-select></td><td><span v-if="readonly">{{ entry.tag }}</span><a-input v-else v-model="entry.tag" :aria-label="t('vehicle.tag')" @input="dirty=true" /></td><td v-for="col in visibleColumns(entry)" :key="col"><span v-if="readonly">{{ entry.values[col] || '—' }}</span><table v-else-if="entry.format === 'table'" class="value-grid"><tbody><tr v-for="(line, rowIndex) in (entry.values[col] || '\t\n\t').split('\n')" :key="rowIndex"><td v-for="(cell, cellIndex) in line.split('\t')" :key="cellIndex"><a-input :model-value="cell" :aria-label="`${t('vehicle.table')} ${rowIndex+1} ${cellIndex+1}`" @update:model-value="value => updateCell(entry,col,rowIndex,cellIndex,value)" /></td></tr></tbody></table><div v-else-if="entry.format === 'rich'" class="rich-editor"><a-button size="mini" @click="entry.values[col] = `**${entry.values[col]}**`;dirty=true">B</a-button><a-button size="mini" @click="entry.values[col] = `*${entry.values[col]}*`;dirty=true">I</a-button><a-textarea v-model="entry.values[col]" :aria-label="t('vehicle.rich')" @input="dirty=true" /></div><a-input v-else v-model="entry.values[col]" :input-attrs="{ inputmode: entry.format === 'number' ? 'decimal' : 'text' }" :aria-label="`${t('vehicle.value')} ${col+1}`" @input="dirty=true" /></td><td v-if="!readonly"><a-button :disabled="draft.entries.length === 1" @click="draft.entries.splice(index,1);dirty=true">{{ t('vehicle.remove') }}</a-button></td></tr></tbody></table></div>
        </a-tab-pane>
      </a-tabs>
      <a-space v-if="!readonly"><a-button @click="persist()">{{ t('vehicle.save') }}</a-button><a-button type="primary" @click="persist('reviewing')">{{ t('vehicle.submit') }}</a-button></a-space>
      <a-list v-if="draft.reviews?.length" :data="draft.reviews"><template #item="{item}"><a-list-item>{{ item.time }} · {{ t(`vehicle.${item.result}`) }} · {{ item.opinion }}</a-list-item></template></a-list><div v-if="route.params.mode === 'review' && draft.status === 'reviewing' && draft.reviewer === MOCK_CURRENT_USER.name" class="review"><label>{{ t('vehicle.opinion') }}</label><a-textarea v-model="opinion" :aria-label="t('vehicle.opinion')" /><a-space><a-button type="primary" @click="review('completed')">{{ t('vehicle.pass') }}</a-button><a-button status="danger" @click="review('rejected')">{{ t('vehicle.reject') }}</a-button></a-space></div>
    </template>
    <a-empty v-else />
  </section>
<ConfirmDialog :visible="!!withdrawTarget" :title="t('vehicle.withdrawTitle')" @update:visible="withdrawTarget = undefined" @confirm="withdraw" />
<ConfirmDialog :visible="exportOpen" :title="t('sections.exportNotice.title')" :description="[t('vehicle.exportNotice'), t('sections.exportNotice.line2')]" :ok-loading="exporting" :dismissible="!exporting" @update:visible="value => { if (!exporting) exportOpen = value; }" @confirm="confirmExport" />
<ConfirmDialog unsaved :visible="leaveVisible" :title="t('vehicle.unsaved')" @update:visible="finishLeave(false)" @confirm="finishLeave(true)" />
</template>
<style scoped>
.vehicle-page { display: flex; flex-direction: column; min-width: 0; gap: var(--mt-ds-space-3); color: var(--color-text-1); }
/* 筛选区布局统一走 global.css 的 app-filter-strip / app-filter-unit / app-filter-actions */
.filters { padding: var(--mt-ds-space-4); background: var(--app-surface); }
.vehicle-toolbar { display: flex; justify-content: space-between; gap: var(--mt-ds-space-2); margin-bottom: var(--mt-ds-space-4); }
.vehicle-icon-button { display: inline-grid; width: 32px; height: 32px; padding: 0; place-items: center; }
.vehicle-list { min-width: 0; padding: var(--mt-ds-space-4); background: var(--app-surface); }
.vehicle-list :deep(.arco-table-th) { height: 50px; background: var(--app-table-header); }
.vehicle-list :deep(.arco-table-td) { height: 50px; }
.vehicle-form { width: var(--mt-ds-form-width); max-width: 100%; }
.vehicle-form--readonly { width: 100%; }
.vehicle-form--readonly :deep(.arco-form-item) { display: grid; grid-template-columns:  max-content minmax(0, 1fr); gap: var(--mt-ds-space-4); margin-bottom: var(--mt-ds-space-3); }
.vehicle-form--readonly :deep(.arco-form-item-label-col) { margin: 0; }
.vehicle-page :deep(.arco-tabs-content) { padding: var(--mt-ds-space-6); background: var(--app-surface); }
.vehicle-page :deep(th), .vehicle-page :deep(td), .vehicle-page :deep(.arco-tag), .vehicle-page :deep(.arco-link), .vehicle-page :deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
.configuration-scroll { max-width: 100%; overflow-x: auto; margin-top: var(--mt-ds-space-4); }
.configuration-table { width: 100%; min-width: 950px; border-collapse: collapse; }
.configuration-table th, .configuration-table td { padding: var(--mt-ds-space-3); border: 1px solid var(--app-divider); min-width: 140px; text-align: left; }
.configuration-table th { background: var(--color-fill-2); }
.review { width: var(--mt-ds-form-width); max-width: 100%; display: grid; gap: var(--mt-ds-space-4); }
/* 窄屏流式布局由 global.css 的 .app-filter-strip 媒体查询统一处理 */
</style>

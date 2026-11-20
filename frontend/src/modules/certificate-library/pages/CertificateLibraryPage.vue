<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import { IconPlus, IconMore, IconDownload, IconUpload, IconSearch, IconRefresh, IconFilter, IconSettings } from '@arco-design/web-vue/es/icon';
import ExcelJS from 'exceljs';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppDetailHeader from '../../../design/components/AppDetailHeader.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { statusRole } from '../../../shared/status';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import { projects, MOCK_CURRENT_USER } from '../../projects/data/projects';
import { reports } from '../../reports/data/reports';
import { testTasks } from '../../testing/data/testing';
import { technicalTasks } from '../../technical/data/technical';
import { libraryRecords as rows, libraryPerspective as perspective, LIBRARY_STATUSES, appendLibraryEvent, libraryTimeline, type LibraryRecord, type LibraryEntry, type LibraryStatus } from '../data/records';
import type { CertificateEntry } from '../../certificates/data/certificates';
const { t, locale } = useI18n();
const route = useRoute(); const router = useRouter(); const base = '/certificate-library';
const emptyFilters = () => ({ number: '', name: '', project: '', taskName: '', regulation: '', regulationName: '', issuer: '', agency: '', issued: '', expires: '', status: '' });
const filters = ref(emptyFilters());
const applied = ref({ ...filters.value }); const page = ref(1); const pageSize = ref(10);
const keys = ['number', 'name', 'project', 'taskName', 'regulation', 'regulationName', 'issuer', 'agency', 'issued', 'expires', 'status'] as const;
function listLabel(key: string) { return label(key === 'project' ? 'relatedTask' : key === 'status' ? 'certificateStatus' : key); }
const entryKeys = ['number', 'name', 'issuer', 'agency', 'issued', 'expires'] as const;
const taskInfoKeys = ['id', 'name', 'brand', 'series', 'model', 'priority', 'owner', 'createdAt', 'deadline'] as const;
function label(key: string) { return t(`certificateLibrary.${key}`); }
function statusLabel(code: string) { return t(`certificateLibrary.statuses.${code}`); }
// Filter and column settings are independent; hiding a filter clears both draft and applied values.
const filterDefaults = keys.map((key, index) => ({ key, visible: true, disabled: index === 0 }));
const filterSettings = ref(filterDefaults.map(item => ({ ...item })));
const filterOpen = ref(false);
const visibleFilters = computed(() => filterSettings.value.filter(item => item.visible).map(item => item.key));
const filterItems = computed<ColumnSettingsItem[]>(() => filterSettings.value.map(item => ({ ...item, label: listLabel(item.key) })));
const defaultFilterItems = computed<ColumnSettingsItem[]>(() => filterDefaults.map(item => ({ ...item, label: listLabel(item.key) })));
function changeFilters(items: ColumnSettingsItem[]) {
  filterSettings.value = items.map(item => ({ key: item.key as typeof keys[number], visible: item.visible, disabled: item.key === keys[0] }));
  for (const key of keys) if (!visibleFilters.value.includes(key)) { filters.value[key] = ''; applied.value[key] = ''; }
  page.value = 1;
}
const fieldKeys = keys;
type FieldKey = typeof fieldKeys[number];
const widths: Record<FieldKey, number> = { number: 200, name: 200, project: 180, taskName: 220, regulation: 180, regulationName: 220, issuer: 180, agency: 180, issued: 160, expires: 160, status: 140 };
const columnDefaults = fieldKeys.map((key, index) => ({ key, visible: true, disabled: index === 0 }));
const columnSettings = ref(columnDefaults.map(item => ({ ...item })));
const columnsOpen = ref(false);
const visibleFields = computed(() => columnSettings.value.filter(item => item.visible).map(item => item.key));
const columnItems = computed<ColumnSettingsItem[]>(() => columnSettings.value.map(item => ({ ...item, label: listLabel(item.key) })));
const defaultColumnItems = computed<ColumnSettingsItem[]>(() => columnDefaults.map(item => ({ ...item, label: listLabel(item.key) })));
const sortField = ref<FieldKey | ''>('');
const sortDirection = ref<'' | 'ascend' | 'descend'>('');
function changeColumns(items: ColumnSettingsItem[]) {
  columnSettings.value = items.map(item => ({ key: item.key as FieldKey, visible: item.visible, disabled: item.key === fieldKeys[0] }));
  if (sortField.value && !visibleFields.value.includes(sortField.value)) { sortField.value = ''; sortDirection.value = ''; }
  page.value = 1;
}
function cellText(row: LibraryRecord, key: FieldKey): string {
  if (key === 'status') return statusLabel(row.status);
  if (key === 'taskName') return projects.value.find(project => project.id === row.project)?.name || '';
  if (key === 'name') return row.entries.map(entry => entry.name || row.name).filter(Boolean).join('、');
  if (key === 'project') return row.project;
  return row.entries.map(entry => entry[key]).filter(Boolean).join('、');
}
const collator = computed(() => new Intl.Collator(locale.value, { numeric: true, sensitivity: 'base' }));
function compareRows(a: LibraryRecord, b: LibraryRecord, key: FieldKey, direction: 'ascend' | 'descend') {
  const x = cellText(a, key); const y = cellText(b, key);
  if (!x && y) return 1; if (x && !y) return -1;
  const result = collator.value.compare(x, y); return direction === 'descend' ? -result : result;
}
function handleSort(key: unknown, direction: unknown) {
  if (typeof key !== 'string' || !fieldKeys.includes(key as FieldKey)) return;
  sortField.value = direction === 'ascend' || direction === 'descend' ? key as FieldKey : '';
  sortDirection.value = direction === 'ascend' || direction === 'descend' ? direction : '';
  page.value = 1;
}
const results = computed(() => {
  const list = rows.value.filter(row => keys.every(key => {
    const value = applied.value[key];
    if (!value) return true;
    if (key === 'status' || key === 'project') return row[key] === value;
    if (key === 'issued' || key === 'expires') return row.entries.some(entry => entry[key] === value);
    return cellText(row, key).toLocaleLowerCase().includes(value.trim().toLocaleLowerCase());
  }));
  return sortField.value && sortDirection.value ? [...list].sort((a, b) => compareRows(a, b, sortField.value as FieldKey, sortDirection.value as 'ascend' | 'descend')) : list;
});
const visible = computed(() => results.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
function search() { applied.value = { ...filters.value }; page.value = 1; }
function reset() { filters.value = emptyFilters(); search(); }
const horizontalWidth = computed(() => visibleFields.value.reduce((sum, key) => sum + widths[key], 200));
const columns = computed<TableColumnData[]>(() => [
  ...visibleFields.value.map((key): TableColumnData => ({
    title: listLabel(key), dataIndex: key, slotName: 'field', width: widths[key], fixed: key === 'number' ? 'left' : undefined,
    sortable: { sortDirections: ['ascend', 'descend'], sortOrder: sortField.value === key ? sortDirection.value : '', sorter: (a, b, extra) => compareRows(a as unknown as LibraryRecord, b as unknown as LibraryRecord, key, extra.direction) },
  })),
  { title: label('actions'), dataIndex: 'actions', slotName: 'actions', width: 200, fixed: 'right' },
]);
type RowAction = 'detail' | 'edit' | 'delete' | 'withdraw' | 'review';
function rowActions(row: LibraryRecord): RowAction[] {
  if (row.status === 'reviewing') return ['detail', perspective.value === 'submitter' ? 'withdraw' : 'review', 'delete'];
  if (row.status === 'completed') return ['detail', 'delete'];
  return ['detail', 'edit', 'delete'];
}
function runAction(action: RowAction, row: LibraryRecord) {
  if (!rowActions(row).includes(action)) return;
  if (action === 'delete') { remove(row); return; }
  if (action === 'withdraw') {
    ask(label('withdrawConfirm'), () => {
      if (row.status !== 'reviewing' || perspective.value !== 'submitter') return;
      row.status = 'withdrawn';
      appendLibraryEvent(row, 'withdraw', MOCK_CURRENT_USER.name);
      Message.success(label('withdrawn'));
    });
    return;
  }
  void router.push(action === 'detail' ? `${base}/${row.id}` : `${base}/${row.id}/${action}`);
}
const current = computed(() => rows.value.find(row => row.id === route.params.id));
const editing = computed(() => route.params.id === 'new' || (route.params.mode === 'edit' && !!current.value && ['submitting', 'rejected', 'withdrawn'].includes(current.value.status)));
const reviewing = computed(() => route.params.mode === 'review' && current.value?.status === 'reviewing');
const errors = ref<string[]>([]);
const draft = ref<LibraryRecord>(); const snapshot = ref(''); const busy = ref(false);
const selectedProject = computed(() => projects.value.find(p => p.id === draft.value?.project));
const viewTitle = computed(() => label(reviewing.value ? 'review' : editing.value ? route.params.id === 'new' ? 'new' : 'edit' : 'detailTitle'));
const timeline = computed(() => draft.value ? libraryTimeline(draft.value) : []);
const priorityRoles = { urgent: 'danger', high: 'warning', medium: 'info', low: 'neutral' } as const;
const basicFields = computed(() => {
  if (!draft.value) return [];
  const fields = [
    { key: 'project', label: t('projects.id'), value: draft.value.project || '—' },
  ];
  if (selectedProject.value) {
    for (const key of ['name', 'brand', 'series', 'model', 'priority', 'owner', 'createdAt', 'deadline'] as const) {
      fields.push({ key: `project-${key}`, label: t(`projects.${key}`), value: key === 'priority' ? t(`projects.${selectedProject.value.priority}`) : selectedProject.value[key] || '—' });
    }
  }
  return fields;
});
const regulationRows = computed(() => {
  if (!draft.value) return [];
  const project = draft.value.project;
  return draft.value.entries.map((entry, index) => ({
    ...entry,
    name: entry.name ?? draft.value!.name,
    key: `${entry.regulation}-${entry.number}-${index}`,
    regulationName: entry.regulationName || rows.value.flatMap(row => row.entries).find(row => row.regulation === entry.regulation && row.regulationName)?.regulationName || '—',
    technical: technicalTasks.filter(task => task.project === project && task.regulation === entry.regulation),
    testing: testTasks.filter(task => task.project === project && task.regulation === entry.regulation),
    report: reports.filter(report => report.project === project && report.regulation === entry.regulation),
  }));
});
const editColumns = computed<TableColumnData[]>(() => [
  { title: label('regulation'), dataIndex: 'regulation', width: 180 },
  { title: label('regulationName'), dataIndex: 'regulationName', width: 220, render: ({ record }) => record.regulationName || '—' },
  ...entryKeys.map(key => ({ title: label(key), dataIndex: key, slotName: key, titleSlotName: `${key}Title`, width: key === 'issued' || key === 'expires' ? 180 : 220 })),
  { title: label('certificateFile'), slotName: 'upload', titleSlotName: 'uploadTitle', width: 300 },
]);
function eventLabel(action: string) { return t(`certificateLibrary.events.${action}`); }
function state() { return JSON.stringify({ draft: draft.value, files: draft.value?.entries.map(e => e.file ? [e.file.name, e.file.size, e.file.lastModified] : null) }); }
watch(() => route.fullPath, () => {
  const row = current.value;
  draft.value = row ? { ...row, entries: row.entries.map(e => ({ ...e, name: e.name ?? row.name })), history: [...row.history], events: row.events?.map(event => ({ ...event })) } : route.params.id === 'new' ? { id: `CL-${Date.now()}`, name: '', project: '', status: 'submitting', entries: [], history: [], events: [] } : undefined;
  errors.value = []; snapshot.value = state();
}, { immediate: true });
const confirm = ref(false); const confirmTitle = ref(''); const unsaved = ref(false); let pending: () => void = () => {};
function ask(title: string, callback: () => void, dirty = false) { confirmTitle.value = title; pending = callback; unsaved.value = dirty; confirm.value = true; }
function guard() { if (state() === snapshot.value) return true; return new Promise<boolean>(resolve => { ask(label('leave'), () => resolve(true), true); const stop = watch(confirm, value => { if (!value) { resolve(false); stop(); } }); }); }
onBeforeRouteLeave(guard); onBeforeRouteUpdate(guard);
function selectProject() {
  if (!draft.value) return;
  draft.value.entries = [...new Set(technicalTasks.filter(task => task.project === draft.value!.project).map(task => task.regulation))].map(regulation => ({ regulation, regulationName: rows.value.flatMap(row => row.entries).find(entry => entry.regulation === regulation)?.regulationName || '', number: '', name: '', issuer: '', agency: '', issued: '', expires: '', file: null }));
}
function invalidEntryField(entry: LibraryEntry, submit: boolean): string {
  for (const key of ['number', 'name', 'issuer', 'agency'] as const) {
    if ((entry[key] || '').length > 50 || (submit && !entry[key]?.trim())) return key;
  }
  if (submit && !entry.issued) return 'issued';
  if (entry.expires && (!entry.issued || entry.expires < entry.issued)) return 'expires';
  if (submit && !entry.file) return 'certificateFile';
  return '';
}
function save(submit: boolean) {
  if (busy.value || !editing.value || !draft.value) return;
  const row = draft.value; errors.value = [];
  if (!row.project || !row.entries.length) errors.value.push(label('required'));
  const invalid = row.entries.findIndex(entry => invalidEntryField(entry, submit));
  if (invalid >= 0) errors.value.push(label('entryRequired'));
  const numbers = row.entries.map(e => e.number.trim()).filter(Boolean);
  if (new Set(numbers).size !== numbers.length || rows.value.some(r => r.id !== row.id && r.entries.some(e => numbers.includes(e.number)))) errors.value.push(label('duplicate'));
  if (errors.value.length) {
    requestAnimationFrame(() => {
      const field = invalid >= 0 ? invalidEntryField(row.entries[invalid]!, submit) : '';
      const control = field ? document.querySelector<HTMLElement>(`.certificate-edit-table [aria-label="${label(field)} ${invalid + 1}"]`) : document.querySelector<HTMLElement>('.editor input');
      control?.scrollIntoView({ block: 'center', inline: 'center' }); control?.focus();
    });
    return;
  }
  busy.value = true;
  if (!current.value) appendLibraryEvent(row, 'create', MOCK_CURRENT_USER.name);
  appendLibraryEvent(row, submit ? 'submit' : 'draft', MOCK_CURRENT_USER.name);
  row.status = submit ? 'reviewing' : 'submitting';
  row.name = row.entries.map(entry => entry.name?.trim()).filter(Boolean).join('、');
  const saved = { ...row, name: row.name, entries: row.entries.map(e => ({ ...e, number: e.number.trim(), name: e.name?.trim(), issuer: e.issuer.trim(), agency: e.agency.trim() })), history: [...row.history] };
  const index = rows.value.findIndex(r => r.id === row.id); if (index < 0) rows.value.unshift(saved); else rows.value[index] = saved;
  snapshot.value = state(); busy.value = false; Message.success(label(submit ? 'submitted' : 'saved')); void router.push(base);
}
function chooseFile(index: number) { document.getElementById(`certificate-upload-${index}`)?.click(); }
function upload(event: Event, entry: CertificateEntry) {
  const input = event.target as HTMLInputElement; const file = input.files?.[0];
  if (file && (file.name.toLowerCase().endsWith('.pdf') && (!file.type || file.type === 'application/pdf')) && file.size <= 20 * 1024 * 1024) entry.file = file;
  else if (file) Message.error(label('fileError')); input.value = '';
}
function download(entry: CertificateEntry) { if (!entry.file) return; downloadBlob(entry.file, entry.file.name); }
function downloadBlob(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
function remove(row: LibraryRecord) { ask(label('deleteConfirm'), () => { rows.value = rows.value.filter(r => r.id !== row.id); page.value = Math.min(page.value, Math.max(1, Math.ceil(results.value.length / pageSize.value))); snapshot.value = state(); Message.success(label('deleted')); if (route.params.id) void router.push(base); }); }
// 审批弹窗：驳回理由必填、审批意见选填，均限 200 字；确认后在弹窗内校验，成功后返回列表。
const approval = ref<'completed' | 'rejected'>(); const approvalOpinion = ref(''); const approvalError = ref(false);
const approvalLabel = computed(() => t(approval.value === 'completed' ? 'certificateLibrary.opinion' : 'vehicleApproval.reason'));
function openApproval(result: 'completed' | 'rejected') { if (!reviewing.value || busy.value) return; approval.value = result; approvalOpinion.value = ''; approvalError.value = false; requestAnimationFrame(() => document.getElementById('certificate-approval-textarea')?.focus()); }
function closeApproval() { if (busy.value) return; approval.value = undefined; approvalOpinion.value = ''; approvalError.value = false; }
function confirmApproval() {
  if (!approval.value || !reviewing.value || !current.value || busy.value) return;
  if (approval.value === 'rejected' && (!approvalOpinion.value.trim() || Array.from(approvalOpinion.value).length > 200)) {
    approvalError.value = true; requestAnimationFrame(() => document.getElementById('certificate-approval-textarea')?.focus()); return;
  }
  const approved = approval.value === 'completed';
  current.value!.status = approved ? 'completed' : 'rejected';
  current.value!.history.push({ reviewer: MOCK_CURRENT_USER.name, approved, opinion: approvalOpinion.value.trim(), time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }) });
  appendLibraryEvent(current.value!, approved ? 'approve' : 'reject', MOCK_CURRENT_USER.name, approvalOpinion.value.trim() || undefined);
  approval.value = undefined; approvalOpinion.value = ''; approvalError.value = false;
  snapshot.value = state(); Message.success(label('reviewed')); void router.push(base);
}
const transferOpen = ref(false); const transferMode = ref<'import' | 'export'>('export'); const transferFile = ref<File>(); const transferError = ref('');
const transferKeys = ['id', 'name', 'project', 'regulation', 'number', 'issuer', 'agency', 'issued', 'expires', 'status'] as const;
async function workbookExport(template = false) {
  const workbook = new ExcelJS.Workbook(); const sheet = workbook.addWorksheet('Certificates'); sheet.addRow(template ? [...transferKeys] : visibleFields.value.map(listLabel));
  if (!template) for (const row of results.value) sheet.addRow(visibleFields.value.map(key => cellText(row, key)));
  const bytes = await workbook.xlsx.writeBuffer(); downloadBlob(new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), template ? 'certificate-template.xlsx' : 'certificates.xlsx');
}
async function transfer() {
  if (busy.value) return; busy.value = true; transferError.value = '';
  try {
    if (transferMode.value === 'export') { if (!results.value.length) throw new Error(); await workbookExport(); }
    else {
      if (!transferFile.value || transferFile.value.size > 20 * 1024 * 1024) throw new Error();
      const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(await transferFile.value.arrayBuffer()); const sheet = workbook.worksheets[0];
      if (!sheet || transferKeys.some((key, i) => sheet.getRow(1).getCell(i + 1).text !== key)) throw new Error();
      const additions = new Map<string, LibraryRecord>(); const numbers = new Set(rows.value.flatMap(r => r.entries.map(e => e.number)));
      sheet.eachRow((line, index) => {
        if (index === 1) return;
        const values = Object.fromEntries(transferKeys.map((key, i) => [key, line.getCell(i + 1).text.trim()])) as Record<typeof transferKeys[number], string>;
        if (!values.id || !values.name || !projects.value.some(p => p.id === values.project) || !technicalTasks.some(task => task.project === values.project && task.regulation === values.regulation) || !values.number || numbers.has(values.number) || rows.value.some(r => r.id === values.id) || !LIBRARY_STATUSES.includes(values.status as LibraryStatus) || !/^\d{4}-\d{2}-\d{2}$/.test(values.issued) || (values.expires && (!/^\d{4}-\d{2}-\d{2}$/.test(values.expires) || values.expires < values.issued)) || !values.issuer || !values.agency) throw new Error();
        let row = additions.get(values.id);
        if (row && (row.project !== values.project || row.name !== values.name || row.status !== values.status)) throw new Error();
        if (!row) { row = { id: values.id, name: values.name, project: values.project, status: values.status as LibraryStatus, entries: [], history: [], events: [] }; appendLibraryEvent(row, 'import', MOCK_CURRENT_USER.name); additions.set(values.id, row); }
        row.entries.push({ regulation: values.regulation, number: values.number, issuer: values.issuer, agency: values.agency, issued: values.issued, expires: values.expires, file: null }); numbers.add(values.number);
      });
      if (!additions.size) throw new Error(); rows.value.unshift(...additions.values()); page.value = 1;
    }
    transferOpen.value = false; Message.success(label(transferMode.value === 'import' ? 'imported' : 'exported'));
  } catch { transferError.value = label('transferError'); } finally { busy.value = false; }
}
function openTransfer(mode: 'import' | 'export') { transferMode.value = mode; transferError.value = ''; transferFile.value = undefined; transferOpen.value = true; }
</script>

<template>
  <main class="library-page">
    <template v-if="!route.params.id">
      <form class="filters app-filter-strip" @submit.prevent="search">
        <div v-for="key in visibleFilters" :key="key" class="app-filter-unit">
          <AppFieldLabel :text="listLabel(key)" :for="`certificate-filter-${key}`" as="label" context="filter" />
          <a-select v-if="key === 'project'" v-model="filters.project" class="app-filter-control" allow-clear :aria-label="listLabel(key)" :placeholder="label('all')"><a-option v-for="p in projects" :key="p.id" :value="p.id">{{ p.id }}</a-option></a-select>
          <a-select v-else-if="key === 'status'" v-model="filters.status" class="app-filter-control" allow-clear :aria-label="listLabel(key)" :placeholder="label('all')"><a-option v-for="status in LIBRARY_STATUSES" :key="status" :value="status">{{ statusLabel(status) }}</a-option></a-select>
          <a-date-picker v-else-if="key === 'issued' || key === 'expires'" :id="`certificate-filter-${key}`" v-model="filters[key]" class="app-filter-control" allow-clear :aria-label="listLabel(key)" :placeholder="label('selectDate')" />
          <a-input v-else v-model="filters[key]" class="app-filter-control" allow-clear :placeholder="t('certificateLibrary.enterField', { field: listLabel(key) })" :input-attrs="{ id: `certificate-filter-${key}`, 'aria-label': listLabel(key) }" />
        </div>
        <div class="app-filter-actions">
          <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ label('search') }}</a-button>
          <a-button class="app-btn-neutral" @click="reset"><template #icon><IconRefresh /></template>{{ label('reset') }}</a-button>
          <ColumnSettingsPopover v-model:visible="filterOpen" :items="filterItems" :default-items="defaultFilterItems" :title="label('filterSettings')" :list-aria-label="label('filterSettings')" :show-label="label('show')" :restore-label="label('restore')" @change="changeFilters">
            <a-tooltip :content="label('filterSettings')"><a-button class="app-btn-neutral settings-trigger" :aria-label="label('filterSettings')" :title="label('filterSettings')"><IconFilter /></a-button></a-tooltip>
          </ColumnSettingsPopover>
        </div>
      </form>
      <section class="list-region" :aria-label="label('list')">
        <div class="list-toolbar">
          <div class="toolbar-actions"><a-button type="primary" @click="router.push(`${base}/new`)"><template #icon><IconPlus /></template>{{ label('new') }}</a-button><a-button class="app-btn-neutral" @click="openTransfer('import')"><template #icon><IconUpload /></template>{{ label('import') }}</a-button><a-button class="app-btn-neutral" :disabled="!results.length" @click="openTransfer('export')"><template #icon><IconDownload /></template>{{ label('export') }}</a-button></div>
          <div class="toolbar-actions toolbar-settings">
            <a-select v-model="perspective" class="perspective-select" :aria-label="label('perspective')"><a-option value="submitter">{{ label('submitterView') }}</a-option><a-option value="approver">{{ label('approverView') }}</a-option></a-select>
            <ColumnSettingsPopover v-model:visible="columnsOpen" :items="columnItems" :default-items="defaultColumnItems" :title="label('columnSettings')" :list-aria-label="label('columnSettings')" :show-label="label('show')" :restore-label="label('restore')" @change="changeColumns">
              <a-tooltip :content="label('columnSettings')"><a-button class="app-btn-neutral settings-trigger" :aria-label="label('columnSettings')" :title="label('columnSettings')"><IconSettings /></a-button></a-tooltip>
            </ColumnSettingsPopover>
          </div>
        </div>
        <a-table :columns="columns" :data="visible" row-key="id" :pagination="false" :bordered="false" :stripe="false" :scroll="{ x: horizontalWidth }" @sorter-change="handleSort">
          <template #field="{ record, column }">
            <button v-if="column.dataIndex === 'number'" type="button" class="identity-link" @click="runAction('detail', record)">{{ cellText(record, 'number') }}</button>
            <AppStatusTag v-else-if="column.dataIndex === 'status'" :label="statusLabel(record.status)" :role="statusRole(record.status)" />
            <span v-else>{{ cellText(record, column.dataIndex as FieldKey) || '—' }}</span>
          </template>
          <template #actions="{ record }"><div class="row-actions">
            <button v-for="action in rowActions(record).slice(0, 2)" :key="action" type="button" class="row-action" :class="{ 'row-action--danger': action === 'delete' }" @click="runAction(action, record)">{{ label(action) }}</button>
            <a-dropdown v-if="rowActions(record).length > 2" position="br" trigger="hover" popup-container="body" content-class="row-more-dropdown"><button type="button" class="row-more" :aria-label="label('more')" :title="label('more')"><IconMore /></button><template #content><a-doption v-for="action in rowActions(record).slice(2)" :key="action" :class="{ 'row-more-danger': action === 'delete' }" @click="runAction(action, record)">{{ label(action) }}</a-doption></template></a-dropdown>
          </div></template>
          <template #empty><a-empty :description="label(rows.length ? 'noMatch' : 'empty')" /></template>
        </a-table>
        <AppPagination v-model:current="page" v-model:page-size="pageSize" :total="results.length" />
      </section>
    </template>
    <template v-else>
      <AppDetailHeader :ancestor-to="base" :ancestor-label="label('title')" :current-label="viewTitle"><template #actions>
        <a-space v-if="editing"><a-button class="app-btn-neutral" :disabled="busy" @click="router.push(base)">{{ label('cancel') }}</a-button><a-button class="app-btn-neutral" :loading="busy" @click="save(false)">{{ label('save') }}</a-button><a-button type="primary" :loading="busy" @click="save(true)">{{ label('submit') }}</a-button></a-space>
        <a-space v-else-if="reviewing"><a-button class="app-btn-neutral" :disabled="busy" @click="router.push(base)">{{ label('cancel') }}</a-button><a-button class="app-btn-neutral" :disabled="busy" @click="openApproval('rejected')">{{ label('reject') }}</a-button><a-button type="primary" :disabled="busy" @click="openApproval('completed')">{{ label('approve') }}</a-button></a-space>
      </template></AppDetailHeader>
      <template v-if="draft">
        <a-alert v-if="errors.length" type="error" role="alert">{{ errors.join('；') }}</a-alert>
        <section class="detail-block editor" :aria-label="label('base')">
          <header class="block-header">
            <h2>{{ label('base') }}</h2>
            <a-button v-if="selectedProject" class="app-btn-neutral" @click="router.push(`/projects/${draft.project}`)">{{ label('projectDetail') }}</a-button>
          </header>
          <dl v-if="!editing" class="app-detail-list certificate-facts">
            <div v-for="field in basicFields" :key="field.key" class="app-detail-row">
              <dt class="app-detail-label">{{ field.label }}</dt>
              <dd class="app-detail-value"><AppStatusTag v-if="field.key === 'project-priority' && selectedProject" :label="field.value" :role="priorityRoles[selectedProject.priority]" /><template v-else>{{ field.value }}</template></dd>
            </div>
          </dl>
          <template v-else>
            <a-form :model="draft" layout="vertical" class="certificate-entry">
              <a-form-item required>
                <template #label><AppFieldLabel as="label" for="certificate-project" :text="label('relatedTask')" colon /></template>
                <a-select id="certificate-project" v-model="draft.project" allow-clear allow-search :placeholder="t('templateEditor.selectHint', { field: label('relatedTask') })" :aria-label="label('relatedTask')" @change="selectProject"><a-option v-for="p in projects" :key="p.id" :value="p.id">{{ p.id }} · {{ p.name }}</a-option></a-select>
              </a-form-item>
              <template v-if="selectedProject">
                <a-form-item v-for="key in taskInfoKeys" :key="key">
                  <template #label><AppFieldLabel as="label" :for="`certificate-task-${key}`" :text="t(`projects.${key}`)" colon /></template>
                  <a-input :id="`certificate-task-${key}`" :model-value="key === 'priority' ? t(`projects.${selectedProject.priority}`) : selectedProject[key]" disabled :input-attrs="{ 'aria-label': t(`projects.${key}`) }" />
                </a-form-item>
              </template>
            </a-form>
          </template>
        </section>
        <section class="detail-block" :aria-label="label('regulations')">
          <header class="block-header"><h2>{{ label('regulations') }}</h2></header>
          <a-empty v-if="!editing && !regulationRows.length" :description="label('emptyRegulations')" />
          <template v-if="!editing">
            <section v-for="(entry, index) in regulationRows" :key="entry.key" class="entry" :class="`entry-${index}`">
              <h3>{{ entry.regulation }}</h3>
              <dl class="app-detail-list certificate-facts">
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('regulationName') }}</dt><dd class="app-detail-value">{{ entry.regulationName || '—' }}</dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('number') }}</dt><dd class="app-detail-value">{{ entry.number || '—' }}</dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('name') }}</dt><dd class="app-detail-value">{{ entry.name || '—' }}</dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('certificateStatus') }}</dt><dd class="app-detail-value"><AppStatusTag :label="statusLabel(draft!.status)" :role="statusRole(draft!.status)" /></dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('issuer') }}</dt><dd class="app-detail-value">{{ entry.issuer || '—' }}</dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('agency') }}</dt><dd class="app-detail-value">{{ entry.agency || '—' }}</dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('issued') }}</dt><dd class="app-detail-value">{{ entry.issued || '—' }}</dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('expires') }}</dt><dd class="app-detail-value">{{ entry.expires || '—' }}</dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('certificateFile') }}</dt><dd class="app-detail-value"><a-link v-if="entry.file" @click="download(entry)">{{ entry.file.name }}</a-link><template v-else>—</template></dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('technical') }}</dt><dd class="app-detail-value"><div v-if="entry.technical.length" class="related-records"><router-link v-for="related in entry.technical" :key="related.id" :to="`/tasks/technical/${related.id}`">{{ related.id }}</router-link></div><template v-else>—</template></dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('testing') }}</dt><dd class="app-detail-value"><div v-if="entry.testing.length" class="related-records"><router-link v-for="related in entry.testing" :key="related.id" :to="`/tasks/testing/${related.id}`">{{ related.id }}</router-link></div><template v-else>—</template></dd></div>
                <div class="app-detail-row"><dt class="app-detail-label">{{ label('report') }}</dt><dd class="app-detail-value"><div v-if="entry.report.length" class="related-records"><router-link v-for="related in entry.report" :key="related.id" :to="`/tasks/reports/${related.id}`">{{ related.id }}</router-link></div><template v-else>—</template></dd></div>
              </dl>
            </section>
          </template>
          <a-table v-else class="regulations-table certificate-edit-table" :columns="editColumns" :data="draft.entries" row-key="regulation" :pagination="false" :bordered="false" :stripe="false" :scroll="{ x: 1940 }">
            <template v-for="key in entryKeys" :key="`${key}-title`" #[`${key}Title`]>
              <span v-if="key !== 'expires'" class="required-marker" aria-hidden="true">*</span>{{ label(key) }}
            </template>
            <template #uploadTitle><span class="required-marker" aria-hidden="true">*</span>{{ label('certificateFile') }}</template>
            <template v-for="key in entryKeys" :key="key" #[key]="{ record, rowIndex }">
              <a-date-picker v-if="key === 'issued' || key === 'expires'" v-model="record[key]" allow-clear :placeholder="label('selectDate')" :aria-label="`${label(key)} ${rowIndex + 1}`" :aria-required="key === 'issued'" />
              <a-input v-else v-model="record[key]" :max-length="50" allow-clear :placeholder="t('templateEditor.inputHint', { field: label(key) })" :input-attrs="{ 'aria-label': `${label(key)} ${rowIndex + 1}`, 'aria-required': 'true' }" />
            </template>
            <template #upload="{ record, rowIndex }">
              <div class="file-field">
                <input :id="`certificate-upload-${rowIndex}`" type="file" accept=".pdf,application/pdf" hidden @change="upload($event, record)" />
                <div v-if="record.file" class="uploaded-file"><a-link @click="download(record)">{{ record.file.name }}</a-link><a-button type="text" status="danger" @click="record.file = null">{{ label('removeFile') }}</a-button></div>
                <a-tooltip v-else :content="label('fileHint')"><a-button class="app-btn-neutral" :aria-label="`${label('certificateFile')} ${rowIndex + 1}`" @click="chooseFile(rowIndex)"><template #icon><IconUpload /></template>{{ label('uploadFile') }}</a-button></a-tooltip>
              </div>
            </template>
            <template #empty><a-empty :description="label('selectProject')" /></template>
          </a-table>
        </section>
        <section v-if="!editing" class="detail-block" :aria-label="label('timeline')">
          <header class="block-header"><h2>{{ label('timeline') }}</h2></header>
          <a-empty v-if="!timeline.length" :description="label('noTimeline')" />
          <a-timeline v-else class="processing-timeline">
            <a-timeline-item v-for="event in timeline" :key="event.id">
              <div class="timeline-heading"><strong>{{ eventLabel(event.action) }}</strong><time>{{ event.time }}</time></div>
              <p>{{ t('certificateLibrary.eventDescription', { actor: event.actor, action: eventLabel(event.action), name: draft.name }) }}</p>
              <p v-if="event.comment" class="event-comment">{{ t('certificateLibrary.eventOpinion', { comment: event.comment }) }}</p>
            </a-timeline-item>
          </a-timeline>
        </section>
      </template>
      <a-empty v-else :description="label('notFound')"><a-button @click="router.push(base)">{{ label('back') }}</a-button></a-empty>
    </template>
    <a-modal :visible="!!approval" :width="560" :title="label(approval === 'completed' ? 'approve' : 'reject')" :aria-label="approvalLabel" :mask-closable="false" :esc-to-close="!busy" :closable="!busy" @cancel="closeApproval">
      <a-form :model="{ approvalOpinion }" layout="vertical">
        <a-form-item :required="approval === 'rejected'" :validate-status="approvalError ? 'error' : undefined" :help="approvalError ? t('vehicleApproval.required', { field: approvalLabel }) : undefined">
          <template #label><AppFieldLabel as="label" for="certificate-approval-textarea" :text="approvalLabel" /></template>
          <a-textarea id="certificate-approval-textarea" v-model="approvalOpinion" :textarea-attrs="{ 'aria-label': approvalLabel, 'aria-required': approval === 'rejected', 'aria-invalid': approvalError }" :max-length="200" show-word-limit :auto-size="{ minRows: 4, maxRows: 8 }" @input="approvalError = false" />
        </a-form-item>
      </a-form>
      <template #footer><a-space><a-button class="app-btn-neutral" :disabled="busy" @click="closeApproval">{{ label('cancel') }}</a-button><a-button type="primary" :loading="busy" @click="confirmApproval">{{ t('designSystem.confirm') }}</a-button></a-space></template>
    </a-modal>
    <ConfirmDialog v-model:visible="confirm" :title="confirmTitle" :unsaved="unsaved" @confirm="pending(); confirm = false" />
    <a-modal :visible="transferOpen" :title="label(transferMode)" :width="'min(560px, calc(100vw - 32px))'" :ok-loading="busy" :mask-closable="!busy" :esc-to-close="!busy" :closable="!busy" :ok-text="label(transferMode)" :cancel-text="t('designSystem.cancel')" @ok="transfer" @cancel="!busy && (transferOpen = false)">
      <a-alert v-if="transferError" type="error">{{ transferError }}</a-alert>
      <template v-if="transferMode === 'import'"><p>{{ label('importHint') }}</p><a-button @click="workbookExport(true)">{{ label('template') }}</a-button><input type="file" accept=".xlsx" :aria-label="label('importFile')" :disabled="busy" @change="transferFile = ($event.target as HTMLInputElement).files?.[0]" /></template>
      <p v-else>{{ label('exportHint') }} ({{ results.length }})</p>
    </a-modal>
  </main>
</template>

<style scoped>
.library-page { display: grid; gap: var(--mt-ds-space-3); min-width: 0; }
.filters { padding: var(--mt-ds-space-4); background: var(--app-surface); border-radius: var(--mt-ds-control-radius); }
.list-region, .detail-block { min-width: 0; padding: var(--mt-ds-space-4); background: var(--app-surface); border-radius: var(--mt-ds-control-radius); }
.list-toolbar { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--mt-ds-space-3); margin-bottom: var(--mt-ds-space-4); }
.toolbar-actions { display: flex; align-items: center; flex-wrap: wrap; gap: var(--mt-ds-space-2); min-width: 0; }
.toolbar-settings { margin-left: auto; flex-wrap: nowrap; }
.toolbar-settings :deep(.perspective-select) { flex: 0 0 180px; width: 180px; }
.settings-trigger { display: inline-grid; width: 32px; height: 32px; padding: 0; place-items: center; }
.row-actions { display: flex; align-items: center; gap: var(--mt-ds-space-3); white-space: nowrap; }
.row-action, .identity-link { padding: 0; border: 0; background: transparent; color: var(--app-color-primary); font: inherit; font-weight: var(--mt-ds-weight-body); cursor: pointer; }
.row-action:hover { text-decoration: underline; }
.row-action--danger { color: rgb(var(--danger-6)); }
.identity-link { color: var(--color-text-1); }
.identity-link:hover, .identity-link:focus-visible { color: var(--app-color-primary); }
.row-action:focus-visible, .identity-link:focus-visible, .row-more:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
.row-more { display: inline-grid; width: 24px; height: 24px; padding: 0; place-items: center; border: 0; border-radius: var(--mt-ds-control-radius); background: transparent; color: var(--app-color-primary); cursor: pointer; font-size: 16px; }
.row-more:hover { background: var(--color-fill-2); }
.list-region :deep(.arco-table), .list-region :deep(.arco-table-container) { border: 0; }
.list-region :deep(.arco-table-cell) { padding: 0; }
.list-region :deep(.arco-table-th) { height: 50px; padding: 0 12px; border-bottom: 1px solid var(--app-divider); background: linear-gradient(var(--app-table-header), var(--app-table-header)), var(--app-surface); font-size: var(--mt-ds-font-body); line-height: var(--mt-ds-line-body); font-weight: var(--mt-ds-weight-body); text-align: left; white-space: nowrap; }
.list-region :deep(.arco-table-td) { height: 50px; padding: 8px 12px; border-bottom: 1px solid var(--app-divider); background: var(--app-surface); font-size: var(--mt-ds-font-body); line-height: var(--mt-ds-line-body); font-weight: var(--mt-ds-weight-body); text-align: left; }
.list-region :deep(.arco-table-tr:hover .arco-table-td) { background: var(--color-fill-1); }
.list-region :deep(.arco-tag) { font-weight: var(--mt-ds-weight-body); }
.entry + .entry { border-top: 1px solid var(--app-divider); margin-top: var(--mt-ds-space-4); padding-top: var(--mt-ds-space-4); }
/* 详情子页可编辑表单契约：a-form 本体（同元素带 .arco-form）直接设 flex 横向换行，表单项固定 400px 基准宽。 */
.certificate-entry { display: flex; flex-direction: row; flex-wrap: wrap; align-items: flex-start; gap: var(--mt-ds-space-4); }
.certificate-entry :deep(.arco-form-item) { flex: 0 1 400px; min-width: 0; max-width: 100%; margin-bottom: 0; }
.certificate-entry :deep(.arco-form-item-label-col) { text-align: left; }
.certificate-entry :deep(.arco-form-item-label) { color: var(--color-text-3); font-size: var(--mt-ds-font-body); font-weight: var(--mt-ds-weight-body); line-height: var(--mt-ds-line-body); }
.certificate-entry :deep(.arco-select), .certificate-entry :deep(.arco-picker), .certificate-entry :deep(.arco-input-wrapper) { width: 100%; max-width: 100%; }
.block-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--mt-ds-space-3); margin-bottom: var(--mt-ds-space-4); padding-bottom: var(--mt-ds-space-3); border-bottom: 1px solid var(--app-divider); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); margin: 0; }
/* 只读基础信息：与其他详情页共享的只读字段信息样式一致——多列网格、标签与值同一基线、8px 列间距。 */
.certificate-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--mt-ds-space-4); margin: 0; text-align: left; }
.certificate-facts .app-detail-row { display: flex; align-items: baseline; gap: var(--mt-ds-space-2); min-width: 0; }
.certificate-facts dt { flex-shrink: 0; }
.certificate-facts dt, .certificate-facts dd { margin: 0; font-size: var(--mt-ds-font-body); font-weight: var(--mt-ds-weight-body); }
@media (max-width: 900px) { .certificate-facts { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 600px) { .certificate-facts { grid-template-columns: minmax(0, 1fr); } }
.regulations-table { min-width: 0; }
.regulations-table :deep(.arco-table-cell) { padding: 0; }
.regulations-table :deep(.arco-table-th), .regulations-table :deep(.arco-table-td) { height: 50px; padding: var(--mt-ds-space-3); border-bottom: 1px solid var(--app-divider); color: var(--color-text-1); font-size: var(--mt-ds-font-body); font-weight: var(--mt-ds-weight-body); line-height: var(--mt-ds-line-body); text-align: left; }
.regulations-table :deep(.arco-table-th) { background: linear-gradient(var(--app-table-header), var(--app-table-header)), var(--app-surface); }
.regulations-table :deep(.arco-table-td) { background: var(--app-surface); }
.related-records { display: grid; gap: var(--mt-ds-space-1); }
.related-records a { color: var(--app-color-primary); text-decoration: none; overflow-wrap: anywhere; }
.related-records a:hover { text-decoration: underline; }
.related-records a:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
.timeline-heading { display: flex; align-items: center; flex-wrap: wrap; gap: var(--mt-ds-space-4); }
.timeline-heading time { color: var(--color-text-3); }
.processing-timeline p { margin: var(--mt-ds-space-2) 0 0; line-height: var(--mt-ds-line-body); overflow-wrap: anywhere; }
.event-comment { color: var(--color-text-2); white-space: pre-wrap; }
.processing-timeline :deep(.arco-timeline-item:not(.arco-timeline-item-last)) { padding-bottom: var(--mt-ds-space-6); }
h3 { font-size: var(--mt-ds-font-body); font-weight: var(--mt-ds-weight-body); margin: 0 0 var(--mt-ds-space-3); }
.file-field { display: grid; gap: var(--mt-ds-space-2); min-width: 0; overflow-wrap: anywhere; }
.file-field input, .editor :deep(.arco-picker) { max-width: 100%; }
.relations a { color: var(--app-color-primary); text-decoration: none; }
.relations a:hover { text-decoration: underline; }
.relations a:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
.relations { display: flex; flex-wrap: wrap; gap: var(--mt-ds-space-2); margin-bottom: var(--mt-ds-space-4); }
.required-marker { color: var(--app-color-danger); margin-right: var(--mt-ds-space-1); }
.uploaded-file { display: flex; align-items: center; gap: var(--mt-ds-space-2); min-width: 0; }
.uploaded-file :deep(.arco-link) { min-width: 0; overflow-wrap: anywhere; }
.uploaded-file :deep(.arco-btn) { flex-shrink: 0; }
.certificate-edit-table :deep(.arco-picker) { width: 100%; }
</style>

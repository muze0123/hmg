<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import {
  IconDownload, IconFilter, IconRefresh, IconSearch, IconSettings,
} from '@arco-design/web-vue/es/icon';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { statusRole } from '../../../shared/status';
import { useTaskCenterStore } from '../../task-center/stores/taskCenter';
import { makeSectionsExport } from '../data/export';
import { MOCK_CURRENT_USER } from '../../projects/data/projects';
import SectionExecutionDrawer from '../components/SectionExecutionDrawer.vue';
import { saveSectionExecution, sectionPeople } from '../data/execution';
import { items, PRIORITY_CODES, STATUS_CODES, TYPE_CODES, type Item } from '../data/items';

/** Execution configuration is local module state until an API contract is available. */
const { t } = useI18n();
const router = useRouter();

/** 业务字段全集：筛选、表格、列设置、导出共用同一套 key 与文案 */
const FIELD_KEYS = ['project', 'name', 'priority', 'law', 'type', 'status', 'createdAt', 'end', 'actual', 'executor', 'executedAt', 'reviewer', 'reviewedAt'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
function fieldLabel(key: FieldKey): string {
  if (key === 'project') return t('projects.id');
  if (key === 'name') return t('projects.name');
  return t(`sections.${key}`);
}
function rowActions(row: Item): string[] {
  if (row.status === 'pending') return ['execute'];
  if (['submitting', 'rejected', 'withdrawn'].includes(row.status)) return ['edit'];
  if (row.status === 'reviewing') {
    if (row.executor === MOCK_CURRENT_USER.accountId) return ['withdraw'];
    if (row.reviewer === MOCK_CURRENT_USER.accountId) return ['review'];
  }
  return [];
}
const executionId = ref('');
const executionOpen = ref(false);
const executionRecord = computed(() => items.find(row => row.id === executionId.value));
let executionTrigger: HTMLElement | null = null;
function openEntry(row: Item, action: string) {
  if (action === 'execute' || action === 'edit') {
    if (row.type === 'vehicle') { saveSectionExecution(row, [], true); return; }
    executionTrigger = document.activeElement as HTMLElement;
    executionId.value = row.id;
    executionOpen.value = true;
    return;
  }
  router.push({ path: `/sections/${row.id}`, query: { action } });
}
watch(executionOpen, async open => { if (!open) { await nextTick(); executionTrigger?.isConnected && executionTrigger.focus(); } });
const relationshipTabs = ['all', 'pending', 'handled', 'created', 'cc'] as const;
type RelationshipTab = typeof relationshipTabs[number];
const activeRelationship = ref<RelationshipTab>('all');
function matchesRelationship(row: Item, tab: RelationshipTab): boolean {
  const user = MOCK_CURRENT_USER.accountId;
  if (tab === 'pending') return (row.executor === user && ['pending', 'submitting', 'rejected', 'withdrawn'].includes(row.status)) || (row.reviewer === user && row.status === 'reviewing');
  if (tab === 'handled') return row.handledBy.includes(user);
  if (tab === 'created') return row.creator === user;
  if (tab === 'cc') return row.ccUsers.includes(user);
  return true;
}
const relationshipCounts = computed(() => Object.fromEntries(relationshipTabs.map(tab => [tab, items.filter(row => matchesRelationship(row, tab)).length])));
watch(activeRelationship, () => { page.value = 1; });

const ENUM_KEYS: readonly FieldKey[] = ['priority', 'type', 'status'];
const SELECT_KEYS: readonly FieldKey[] = [...ENUM_KEYS, 'executor', 'reviewer'];
const DATE_KEYS: readonly FieldKey[] = ['createdAt', 'end', 'actual', 'executedAt', 'reviewedAt'];
const FILTER_OPTIONS: Partial<Record<FieldKey, readonly string[]>> = {
  priority: PRIORITY_CODES, type: TYPE_CODES, status: STATUS_CODES,
};
function filterOptions(key: FieldKey): readonly string[] {
  if (key === 'executor' || key === 'reviewer') return [...new Set(items.map(row => row[key]))];
  return FILTER_OPTIONS[key] ?? [];
}
function filterOptionLabel(key: FieldKey, value: string): string {
  if (key === 'executor' || key === 'reviewer') {
    const row = items.find(row => row[key] === value);
    return row ? sectionPeople(row)[key] : value;
  }
  return t(`sections.${value}`);
}

/* ---------------------------------------------- 筛选条件（DESIGN.md · Filter strip packing / List settings popover）
   13 个可选查询字段，弹层顺序即筛选行顺序；默认显示 4 个业务主字段，其余按需展开。
   勾选 / 拖拽 / 恢复默认即时生效，隐藏字段同时清掉草稿与已应用条件。 */
const FILTER_ORDER: readonly FieldKey[] = ['project', 'name', 'priority', 'law', 'type', 'status', 'createdAt', 'end', 'actual', 'executor', 'executedAt', 'reviewer', 'reviewedAt'];
const DEFAULT_VISIBLE_FILTERS: readonly FieldKey[] = ['project', 'name', 'law', 'status'];
const defaultFilterSettings: { key: FieldKey; visible: boolean }[] = FILTER_ORDER.map(key => ({ key, visible: DEFAULT_VISIBLE_FILTERS.includes(key) }));
const filterSettings = ref(defaultFilterSettings.map(setting => ({ ...setting })));
const filterSettingsOpen = ref(false);
const visibleFilterKeys = computed<FieldKey[]>(() => filterSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const filterSettingsItems = computed<ColumnSettingsItem[]>(() => filterSettings.value.map(setting => ({ ...setting, label: fieldLabel(setting.key) })));
const defaultFilterItems = computed<ColumnSettingsItem[]>(() => defaultFilterSettings.map(setting => ({ ...setting, label: fieldLabel(setting.key) })));

const draft = reactive<Partial<Record<FieldKey, string>>>({});
const applied = ref<Partial<Record<FieldKey, string>>>({});

function applyFilters() { applied.value = { ...draft }; page.value = 1; }
function resetFilters() {
  for (const key of FILTER_ORDER) draft[key] = '';
  applied.value = {};
  page.value = 1;
}
function onFilterSettingsChanged(next: ColumnSettingsItem[]) {
  filterSettings.value = next.map(item => ({ key: item.key as FieldKey, visible: item.visible }));
  const visible = new Set(visibleFilterKeys.value);
  for (const key of FILTER_ORDER) {
    if (visible.has(key)) continue;
    delete draft[key];
    delete applied.value[key];
  }
  page.value = 1;
}
const hasApplied = computed(() => FILTER_ORDER.some(key => Boolean(applied.value[key])));

/* ---------------------------------------------- 列设置（DESIGN.md · List settings popover）
   列序按参考稿；首列「项目编号」是记录标识列，锁定可见且不可被拖拽跨越；操作列不进弹层、恒最后。 */
const COLUMN_ORDER: readonly FieldKey[] = ['project', 'name', 'priority', 'law', 'type', 'status', 'createdAt', 'end', 'actual', 'executor', 'executedAt', 'reviewer', 'reviewedAt'];
const COLUMN_WIDTHS: Record<FieldKey, number> = {
  project: 130, name: 300, priority: 100, law: 150, status: 110,
  type: 150, createdAt: 180, end: 150, actual: 150,
  executor: 120, executedAt: 180, reviewer: 120, reviewedAt: 180,
};
const ACTION_WIDTH = 170;
const DEFAULT_VISIBLE_COLUMNS: readonly FieldKey[] = ['project', 'name', 'priority', 'law', 'type', 'status', 'createdAt', 'end', 'actual'];
const defaultColumnSettings: { key: FieldKey; visible: boolean; disabled: boolean }[] = COLUMN_ORDER.map(key => ({ key, visible: DEFAULT_VISIBLE_COLUMNS.includes(key), disabled: key === 'project' }));
const columnSettings = ref(defaultColumnSettings.map(setting => ({ ...setting })));
const columnSettingsOpen = ref(false);
const visibleColumnKeys = computed<FieldKey[]>(() => columnSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const columnSettingsItems = computed<ColumnSettingsItem[]>(() => columnSettings.value.map(setting => ({ ...setting, label: fieldLabel(setting.key) })));
const defaultColumnItems = computed<ColumnSettingsItem[]>(() => defaultColumnSettings.map(setting => ({ ...setting, label: fieldLabel(setting.key) })));
function onColumnSettingsChanged(next: ColumnSettingsItem[]) {
  columnSettings.value = next.map(item => ({
    key: item.key as FieldKey,
    visible: item.visible,
    disabled: item.key === 'project',
  }));
}

/* ---------------------------------------------- 排序（所有业务列均可升序 / 降序）
   a-table 只会对当前页切片排序，跨页顺序必须在数据层重排；两层共用 compareRows，
   因此 Arco 内置排序与数据层结果完全一致，不会出现翻页错序。sortOrder 受控，
   列设置导致的 columns 重算不会把排序状态重置掉。 */
type SortDirection = '' | 'ascend' | 'descend';
const sortField = ref<FieldKey | ''>('');
const sortDirection = ref<SortDirection>('');

function compareRows(a: Item, b: Item, key: FieldKey, direction: 'ascend' | 'descend'): number {
  const x = key === 'executor' || key === 'reviewer' ? sectionPeople(a)[key] : String(a[key] ?? '');
  const y = key === 'executor' || key === 'reviewer' ? sectionPeople(b)[key] : String(b[key] ?? '');
  // 空值（如未填写的实际结束日期）恒排在末尾，不随升降序翻转
  if (!x && y) return 1;
  if (x && !y) return -1;
  const result = x.localeCompare(y, undefined, { numeric: true });
  return direction === 'descend' ? -result : result;
}
function handleSort(dataIndex: unknown, direction: unknown) {
  if (typeof dataIndex !== 'string' || !FIELD_KEYS.includes(dataIndex as FieldKey)) return;
  const next = dataIndex as FieldKey;
  const active = direction === 'ascend' || direction === 'descend';
  sortField.value = active ? next : '';
  sortDirection.value = active ? direction : '';
  page.value = 1;
}

const tableColumns = computed<TableColumnData[]>(() => [
  ...visibleColumnKeys.value.map((key): TableColumnData => ({
    title: fieldLabel(key),
    dataIndex: key,
    slotName: 'field',
    width: COLUMN_WIDTHS[key],
    sortable: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortField.value === key ? sortDirection.value : '',
      sorter: (a, b, extra) => compareRows(a as unknown as Item, b as unknown as Item, key, extra.direction),
    },
  })),
  { title: t('sections.action'), dataIndex: 'actions', slotName: 'actions', width: ACTION_WIDTH, fixed: 'right' },
]);
const horizontalWidth = computed(() => visibleColumnKeys.value.reduce((sum, key) => sum + COLUMN_WIDTHS[key], ACTION_WIDTH));

/* ---------------------------------------------- 数据、分页 */
const resultRows = computed<Item[]>(() => {
  const rows = items.filter(row => matchesRelationship(row, activeRelationship.value) && FILTER_ORDER.every((key) => {
    const value = applied.value[key];
    if (!value) return true;
    const cell = String(row[key] ?? '');
    return DATE_KEYS.includes(key) ? cell.slice(0, 10) === value
      : SELECT_KEYS.includes(key) ? cell === value
      : cell.toLowerCase().includes(value.toLowerCase());
  }));
  if (!sortField.value || !sortDirection.value) return rows;
  const key = sortField.value;
  const direction = sortDirection.value;
  return [...rows].sort((a, b) => compareRows(a, b, key, direction));
});

const page = ref(1);
const pageSize = ref(10);
const pagedRows = computed(() => resultRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
watch(resultRows, () => { page.value = 1; });

function cellText(row: Item, key: string): string {
  if (key === 'executor' || key === 'reviewer') return sectionPeople(row)[key] || '—';
  const value = String(row[key as keyof Item] ?? '');
  if (ENUM_KEYS.includes(key as FieldKey)) return String(t(`sections.${value}`));
  return value || '—';
}

/* ---------------------------------------------- 导出（DESIGN.md · Batch export baseline）
   只对「已应用筛选结果」导出；确认弹窗 → 生成 xlsx → 登记到导入导出下载任务。 */
const taskCenter = useTaskCenterStore();
const exportOpen = ref(false);
const exporting = ref(false);

function requestExport() {
  if (exporting.value) return;
  if (!resultRows.value.length) { Message.info(t('sections.exportEmpty')); return; }
  exportOpen.value = true;
}
function stamp(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}${part(date.getHours())}${part(date.getMinutes())}${part(date.getSeconds())}`;
}
function clockText(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}
async function confirmExport() {
  if (exporting.value || !resultRows.value.length) return;
  exporting.value = true;
  try {
    const headers = visibleColumnKeys.value.map(key => ({ key, label: fieldLabel(key) }));
    const blob = await makeSectionsExport({
      rows: resultRows.value,
      headers,
      sheetName: t('sections.title'),
      label: code => t(`sections.${code}`),
      display: cellText,
    });
    const now = new Date();
    taskCenter.addDownloadTask({
      id: `dl-${now.getTime()}`,
      module: 'sections',
      fileStamp: stamp(now),
      operator: t('sections.exportOperator'),
      time: clockText(now),
      status: 'processing',
      progress: 92,
      fileUrl: URL.createObjectURL(blob),
      fileName: `${t('sections.title')}_${now.toISOString().slice(0, 10)}.xlsx`,
    });
    exportOpen.value = false;
    Message.success(t('sections.exportCreated'));
    taskCenter.open('download');
  } catch {
    Message.error(t('sections.exportFailed'));
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <main class="sections-page">
    <!-- 筛选条件区：字段名称在上、200px 控件在下；查询 / 重置 / 筛选设置紧跟最后一个组件 -->
    <form class="sections-filters app-filter-strip" @submit.prevent="applyFilters">
      <a-tabs v-model:active-key="activeRelationship" class="relationship-tabs"><a-tab-pane v-for="tab in relationshipTabs" :key="tab" :title="`${t(`projectRelations.${tab}`)} (${relationshipCounts[tab]})`" /></a-tabs>
      <div v-for="key in visibleFilterKeys" :key="key" class="app-filter-unit">
        <AppFieldLabel as="label" :for="`sections-filter-${key}`" :text="fieldLabel(key)" context="filter" />
        <a-select
          v-if="SELECT_KEYS.includes(key)"
          :id="`sections-filter-${key}`"
          v-model="draft[key]"
          class="app-filter-control"
          :placeholder="t('sections.all')"
          :aria-label="fieldLabel(key)"
          allow-clear
        >
          <a-option v-for="code in filterOptions(key)" :key="code" :value="code">{{ filterOptionLabel(key, code) }}</a-option>
        </a-select>
        <a-date-picker
          v-else-if="DATE_KEYS.includes(key)"
          :id="`sections-filter-${key}`"
          v-model="draft[key]"
          class="app-filter-control"
          value-format="YYYY-MM-DD"
          :placeholder="t('sections.selectDate')"
          :aria-label="fieldLabel(key)"
          allow-clear
        />
        <a-input
          v-else
          :input-attrs="{ id: `sections-filter-${key}`, 'aria-label': fieldLabel(key) }"
          v-model="draft[key]"
          class="app-filter-control"
          :placeholder="t('sections.enter')"
          allow-clear
        />
      </div>
      <div class="app-filter-actions">
        <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('designSystem.search') }}</a-button>
        <a-button class="app-btn-neutral" @click="resetFilters"><template #icon><IconRefresh /></template>{{ t('designSystem.reset') }}</a-button>
        <ColumnSettingsPopover
          v-model:visible="filterSettingsOpen"
          :items="filterSettingsItems"
          :default-items="defaultFilterItems"
          :title="t('sections.filters.settings')"
          :list-aria-label="t('sections.filters.settings')"
          :show-label="t('sections.filters.show')"
          :restore-label="t('sections.filters.restore')"
          @change="onFilterSettingsChanged"
        >
          <a-tooltip :content="t('sections.filters.settings')">
            <a-button class="app-btn-neutral sections-icon-button" :aria-label="t('sections.filters.settings')"><IconFilter /></a-button>
          </a-tooltip>
        </ColumnSettingsPopover>
      </div>
    </form>

    <!-- 数据列表区：左上角导出、右上角列设置图标；分页器在右下角 -->
    <section class="sections-list" role="region" :aria-label="t('sections.listTitle')">
      <div class="list-toolbar">
        <div class="list-toolbar__left">
          <a-button class="app-btn-neutral" @click="requestExport">
            <template #icon><IconDownload /></template>{{ t('sections.export') }}
          </a-button>
        </div>
        <div class="list-toolbar__right">
          <ColumnSettingsPopover
            v-model:visible="columnSettingsOpen"
            :items="columnSettingsItems"
            :default-items="defaultColumnItems"
            :title="t('sections.columns.settings')"
            :list-aria-label="t('sections.columns.settings')"
            :show-label="t('sections.filters.show')"
            :restore-label="t('sections.filters.restore')"
            @change="onColumnSettingsChanged"
          >
            <a-tooltip :content="t('sections.columns.settings')">
              <a-button class="app-btn-neutral sections-icon-button" :aria-label="t('sections.columns.settings')" :title="t('sections.columns.settings')"><IconSettings /></a-button>
            </a-tooltip>
          </ColumnSettingsPopover>
        </div>
      </div>

      <a-table
        class="sections-table"
        row-key="id"
        :columns="tableColumns"
        :data="pagedRows"
        :scroll="{ x: horizontalWidth }"
        :pagination="false"
        :bordered="false"
        :stripe="false"
        @sorter-change="handleSort"
      >
        <template #field="{ record, column }">
          <AppStatusTag
            v-if="column.dataIndex === 'status' || column.dataIndex === 'priority'"
            :role="column.dataIndex === 'priority' ? (record.priority === 'urgent' ? 'danger' : record.priority === 'high' ? 'warning' : record.priority === 'medium' ? 'info' : 'neutral') : statusRole(String(record.status), 'sections')"
            :label="cellText(record as Item, String(column.dataIndex))"
          />
          <span v-else>{{ cellText(record as Item, String(column.dataIndex)) }}</span>
        </template>
        <template #actions="{ record }">
          <div class="row-actions">
            <button type="button" class="row-action" @click="router.push(`/sections/${record.id}`)">{{ t('sections.view') }}</button>
            <button v-for="action in rowActions(record as Item)" :key="action" type="button" class="row-action" @click="openEntry(record as Item, action)">{{ t(`sections.${action}`) }}</button>
          </div>
        </template>
        <template #empty>
          <a-empty :description="hasApplied ? t('sections.noMatch') : t('sections.empty')" />
        </template>
      </a-table>

      <AppPagination v-model:current="page" v-model:page-size="pageSize" :total="resultRows.length" />
    </section>

    <SectionExecutionDrawer v-if="executionOpen && executionRecord" :key="executionId" v-model:visible="executionOpen" :item="executionRecord" />
    <ConfirmDialog
      :visible="exportOpen"
      icon="info"
      :title="t('sections.exportNotice.title')"
      :description="[t('sections.exportNotice.line1'), t('sections.exportNotice.line2')]"
      :cancel-text="t('sections.exportNotice.cancel')"
      :ok-text="t('sections.exportNotice.confirm')"
      :ok-loading="exporting"
      :cancel-disabled="exporting"
      :dismissible="!exporting"
      @update:visible="exportOpen = $event"
      @confirm="confirmExport"
    />
  </main>
</template>

<style scoped>
/* 页根为灰画布上的两块白色业务面板，间距 16px（DESIGN.md · Pattern 2） */
.sections-page { display: flex; flex-direction: column; gap: var(--mt-ds-space-3); min-width: 0; color: var(--mt-ds-text); }
.sections-filters { padding: 16px; border-radius: 2px; background: var(--app-surface); }
.sections-list { flex: 1; min-width: 0; padding: 16px; border-radius: 2px; background: var(--app-surface); }

/* 列表工具栏：左导出、右列设置图标（本次裁决），两侧各自成组 */
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 16px; }
.list-toolbar__left, .list-toolbar__right { display: flex; align-items: center; gap: 8px; min-width: 0; }
/* 图标触发器 32×32（DESIGN.md · Icon-only toolbar controls），表面走共享 app-btn-neutral */
.sections-icon-button { display: inline-grid; width: 32px; height: 32px; padding: 0; place-items: center; }

/* 表格：白底、无外框、无斑马纹、行间单线；列表内文字统一 400（DESIGN.md · Data-list text weight） */
.sections-page :deep(.arco-table), .sections-page :deep(.arco-table-container) { border: 0; }
.sections-page :deep(.arco-table-th) {
  height: 50px; padding: 0 12px; border-bottom: 1px solid var(--app-divider);
  color: var(--color-text-1); background: var(--app-table-header);
  font-size: 14px; font-weight: 400; line-height: 22px; white-space: nowrap; text-align: left;
}
.sections-page :deep(.arco-table-td) {
  height: 50px; padding: 8px 12px; border-bottom: 1px solid var(--app-divider);
  background: var(--app-surface); font-size: 14px; font-weight: 400; line-height: 22px;
  white-space: nowrap; text-align: left;
}
.sections-page :deep(.arco-table-tr:hover .arco-table-td) { background: var(--color-fill-1); }
.sections-page :deep(.arco-table .arco-space) { flex-wrap: nowrap; gap: 12px !important; }

/* 筛选区窄屏流式布局由 global.css 的 .app-filter-strip 媒体查询统一处理 */
.row-actions { display: flex; align-items: center; gap: var(--mt-ds-space-3); }
.row-action { padding: 0; border: 0; background: transparent; color: var(--app-color-primary); font: inherit; font-weight: 400; cursor: pointer; }
.row-action:hover { text-decoration: underline; }
.row-action:focus-visible { outline: 2px solid var(--app-color-primary); outline-offset: 2px; }
.relationship-tabs { flex: 0 0 100%; min-width: 0; width: 100%; }
.relationship-tabs :deep(.arco-tabs-content) { display: none; }
</style>

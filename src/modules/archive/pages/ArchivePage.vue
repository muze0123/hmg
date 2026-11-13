<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import { IconFilter, IconRefresh, IconSearch, IconSettings } from '@arco-design/web-vue/es/icon';
import AppListToolbar from '../../../design/components/AppListToolbar.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { useTaskCenterStore } from '../../task-center/stores/taskCenter';
import { archiveProjects, deliverables, type Deliverable } from '../data/archive';
import { createArchiveFile } from '../data/preview';
import DocumentPreviewDialog from '../components/DocumentPreviewDialog.vue';

const { t, locale } = useI18n();

/* ---------------------------------------------- 项目目录 */
const projectSearch = ref('');
const selectedId = ref(archiveProjects[0]!.id);
const projects = computed(() => archiveProjects.filter((project) => `${project.name} ${project.id}`.toLowerCase().includes(projectSearch.value.trim().toLowerCase())));
const selected = computed(() => archiveProjects.find((project) => project.id === selectedId.value)!);
const projectRows = computed(() => deliverables.filter((row) => row.projectId === selectedId.value));
const activities = computed(() => [...new Set(projectRows.value.map((row) => row.activity))]);
const owners = computed(() => [...new Set(projectRows.value.map((row) => row.owner))]);

/* ---------------------------------------------- 业务字段全集
   筛选、表格、列设置、导出共用同一套 key 与文案（DESIGN.md · Filter strip packing）。 */
const FIELD_KEYS = ['name', 'activity', 'date', 'owner'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
function fieldLabel(key: FieldKey): string { return t(`archive.${key}`); }
const SELECT_KEYS: readonly FieldKey[] = ['activity', 'owner'];
function filterOptions(key: FieldKey): string[] { return key === 'activity' ? activities.value : owners.value; }

/* ---------------------------------------------- 筛选条件
   默认显示 交付物名称 / 关联活动 / 交付日期 / 责任人；首项锁定可见。
   隐藏字段同步清掉草稿与已应用条件，避免不可见条件继续过滤。 */
const FILTER_ORDER: readonly FieldKey[] = FIELD_KEYS;
const defaultFilterSettings = FILTER_ORDER.map((key) => ({ key, visible: true, disabled: key === 'name' }));
const filterSettings = ref(defaultFilterSettings.map((setting) => ({ ...setting })));
const filterSettingsOpen = ref(false);
const visibleFilterKeys = computed<FieldKey[]>(() => filterSettings.value.filter((setting) => setting.visible).map((setting) => setting.key));
const filterSettingsItems = computed<ColumnSettingsItem[]>(() => filterSettings.value.map((setting) => ({ ...setting, label: fieldLabel(setting.key) })));
const defaultFilterItems = computed<ColumnSettingsItem[]>(() => defaultFilterSettings.map((setting) => ({ ...setting, label: fieldLabel(setting.key) })));

const draft = reactive<Partial<Record<FieldKey, string>>>({});
const applied = ref<Partial<Record<FieldKey, string>>>({});
const hasApplied = computed(() => FILTER_ORDER.some((key) => Boolean(applied.value[key])));
function applyFilters() { applied.value = { ...draft }; page.value = 1; }
function resetFilters() {
  for (const key of FILTER_ORDER) draft[key] = '';
  applied.value = {};
  page.value = 1;
}
function onFilterSettingsChanged(next: ColumnSettingsItem[]) {
  filterSettings.value = next.map((item) => ({ key: item.key as FieldKey, visible: item.visible, disabled: item.key === 'name' }));
  const visible = new Set(visibleFilterKeys.value);
  for (const key of FILTER_ORDER) {
    if (visible.has(key)) continue;
    delete draft[key];
    delete applied.value[key];
  }
  page.value = 1;
}
function selectProject(id: string) { selectedId.value = id; resetFilters(); }

/* ---------------------------------------------- 列设置
   首列「交付物名称」锁定可见，操作列恒最后且不进弹层；触发器在数据列表右上角。 */
const COLUMN_WIDTHS: Record<FieldKey, number> = { name: 260, activity: 180, date: 160, owner: 140 };
const ACTION_WIDTH = 160;
const defaultColumnSettings = FIELD_KEYS.map((key) => ({ key, visible: true, disabled: key === 'name' }));
const columnSettings = ref(defaultColumnSettings.map((setting) => ({ ...setting })));
const columnSettingsOpen = ref(false);
const visibleColumnKeys = computed<FieldKey[]>(() => columnSettings.value.filter((setting) => setting.visible).map((setting) => setting.key));
const columnSettingsItems = computed<ColumnSettingsItem[]>(() => columnSettings.value.map((setting) => ({ ...setting, label: fieldLabel(setting.key) })));
const defaultColumnItems = computed<ColumnSettingsItem[]>(() => defaultColumnSettings.map((setting) => ({ ...setting, label: fieldLabel(setting.key) })));
function onColumnSettingsChanged(next: ColumnSettingsItem[]) {
  columnSettings.value = next.map((item) => ({ key: item.key as FieldKey, visible: item.visible, disabled: item.key === 'name' }));
  if (sortField.value && !visibleColumnKeys.value.includes(sortField.value)) {
    sortField.value = '';
    sortDirection.value = '';
  }
}

/* ---------------------------------------------- 排序（数据层在分页前完成）
   Arco 的 sorter 恒返回 0：图标与方向由 Arco 负责，顺序完全由数据层决定。 */
type SortDirection = '' | 'ascend' | 'descend';
const sortField = ref<FieldKey | ''>('');
const sortDirection = ref<SortDirection>('');
const collator = computed(() => new Intl.Collator(locale.value, { numeric: true, sensitivity: 'base' }));
function handleSort(dataIndex: unknown, direction: unknown) {
  if (typeof dataIndex !== 'string' || !FIELD_KEYS.includes(dataIndex as FieldKey)) return;
  const active = direction === 'ascend' || direction === 'descend';
  sortField.value = active ? dataIndex as FieldKey : '';
  sortDirection.value = active ? direction : '';
  page.value = 1;
}
const tableColumns = computed<TableColumnData[]>(() => [
  ...visibleColumnKeys.value.map((key): TableColumnData => ({
    title: fieldLabel(key),
    dataIndex: key,
    width: COLUMN_WIDTHS[key],
    sortable: { sortDirections: ['ascend', 'descend'] as ('ascend' | 'descend')[], sorter: () => 0 },
  })),
  { title: t('archive.actions'), dataIndex: 'actions', slotName: 'actions', width: ACTION_WIDTH, fixed: 'right' },
]);
const horizontalWidth = computed(() => visibleColumnKeys.value.reduce((sum, key) => sum + COLUMN_WIDTHS[key], ACTION_WIDTH));

/* ---------------------------------------------- 数据、分页 */
const resultRows = computed<Deliverable[]>(() => {
  const rows = deliverables.filter((row) => row.projectId === selectedId.value && FILTER_ORDER.every((key) => {
    const value = applied.value[key];
    if (!value) return true;
    const cell = String(row[key] ?? '');
    return key === 'date' ? cell.slice(0, 10) === value
      : SELECT_KEYS.includes(key) ? cell === value
        : cell.toLowerCase().includes(value.toLowerCase());
  }));
  if (!sortField.value || !sortDirection.value) return rows;
  const key = sortField.value;
  const direction = sortDirection.value;
  return [...rows].sort((a, b) => {
    const result = collator.value.compare(String(a[key] ?? ''), String(b[key] ?? ''));
    return direction === 'descend' ? -result : result;
  });
});
const page = ref(1);
const pageSize = ref(10);
const pagedRows = computed(() => resultRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
watch(resultRows, () => { page.value = 1; });

/* ---------------------------------------------- 预览与下载
   预览按扩展名交给第三方插件；下载统一登记到「导入导出–导出数据」下载任务。 */
const preview = ref<Deliverable>();
const previewVisible = ref(false);
function openPreview(row: Deliverable) { preview.value = row; previewVisible.value = true; }

const taskCenter = useTaskCenterStore();
function stamp(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}${part(date.getMonth() + 1)}${part(date.getDate())}${part(date.getHours())}${part(date.getMinutes())}${part(date.getSeconds())}`;
}
function clockText(date: Date): string {
  const part = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())} ${part(date.getHours())}:${part(date.getMinutes())}:${part(date.getSeconds())}`;
}
async function download(row: Deliverable) {
  try {
    const blob = await createArchiveFile(row, selected.value);
    const now = new Date();
    taskCenter.addDownloadTask({
      id: `dl-archive-${now.getTime()}-${row.id}`,
      module: 'archive',
      fileStamp: stamp(now),
      operator: t('archive.downloadOperator'),
      time: clockText(now),
      status: 'success',
      fileUrl: URL.createObjectURL(blob),
      fileName: row.name,
    });
    Message.success(t('archive.downloadCreated'));
    taskCenter.open('download');
  } catch {
    Message.error(t('archive.downloadError'));
  }
}
</script>

<template>
  <div class="archive-layout">
    <aside class="directory" :aria-label="t('archive.directory')">
      <div class="directory-head">
        <h2>{{ t('archive.directory') }}</h2>
        <a-input v-model="projectSearch" class="app-filter-control" allow-clear :placeholder="t('archive.projectSearch')" :aria-label="t('archive.projectSearch')"><template #prefix><IconSearch /></template></a-input>
      </div>
      <a-empty v-if="!projects.length" :description="t('archive.noProjects')" />
      <button v-for="project in projects" :key="project.id" type="button" class="project-item" :class="{ active: project.id === selectedId }" :aria-pressed="project.id === selectedId" @click="selectProject(project.id)"><span>{{ project.name }}</span><small>{{ project.id }} · {{ t('archive.count', { count: project.count }) }}</small></button>
    </aside>

    <section class="archive-content" :aria-label="selected.name">
      <AppListToolbar :title="selected.name" :summary="selected.id" />

      <!-- 筛选条件区：字段名称在上、200px 控件在下；查询 / 重置 / 筛选设置紧跟最后一个组件 -->
      <form class="filters app-filter-strip" @submit.prevent="applyFilters">
        <div v-for="key in visibleFilterKeys" :key="key" class="app-filter-unit">
          <AppFieldLabel as="label" :for="`archive-filter-${key}`" :text="fieldLabel(key)" context="filter" />
          <a-select v-if="SELECT_KEYS.includes(key)" :id="`archive-filter-${key}`" v-model="draft[key]" class="app-filter-control" allow-clear :placeholder="t('archive.all')" :aria-label="fieldLabel(key)">
            <a-option v-for="value in filterOptions(key)" :key="value" :value="value">{{ value }}</a-option>
          </a-select>
          <a-date-picker v-else-if="key === 'date'" :id="`archive-filter-${key}`" v-model="draft[key]" class="app-filter-control" value-format="YYYY-MM-DD" :placeholder="t('archive.selectDate')" :aria-label="fieldLabel(key)" allow-clear />
          <a-input v-else :input-attrs="{ id: `archive-filter-${key}`, 'aria-label': fieldLabel(key) }" v-model="draft[key]" class="app-filter-control" :placeholder="t('archive.enter')" allow-clear />
        </div>
        <div class="app-filter-actions">
          <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('designSystem.search') }}</a-button>
          <a-button class="app-btn-neutral" @click="resetFilters"><template #icon><IconRefresh /></template>{{ t('designSystem.reset') }}</a-button>
          <ColumnSettingsPopover v-model:visible="filterSettingsOpen" :items="filterSettingsItems" :default-items="defaultFilterItems" :title="t('archive.filterSettings')" :list-aria-label="t('archive.filterSettings')" :show-label="t('archive.show')" :restore-label="t('archive.restore')" @change="onFilterSettingsChanged">
            <a-tooltip :content="t('archive.filterSettings')">
              <a-button class="app-btn-neutral archive-icon-button" :aria-label="t('archive.filterSettings')" :title="t('archive.filterSettings')"><IconFilter /></a-button>
            </a-tooltip>
          </ColumnSettingsPopover>
        </div>
      </form>

      <!-- 数据列表区：右上角 32×32 列设置图标（DESIGN.md · List settings popover） -->
      <div class="list-toolbar">
        <span class="list-toolbar__title">{{ t('archive.listTitle') }}</span>
        <ColumnSettingsPopover v-model:visible="columnSettingsOpen" :items="columnSettingsItems" :default-items="defaultColumnItems" :title="t('archive.columns')" :list-aria-label="t('archive.columns')" :show-label="t('archive.show')" :restore-label="t('archive.restore')" @change="onColumnSettingsChanged">
          <a-tooltip :content="t('archive.columns')">
            <a-button class="app-btn-neutral archive-icon-button" :aria-label="t('archive.columns')" :title="t('archive.columns')"><IconSettings /></a-button>
          </a-tooltip>
        </ColumnSettingsPopover>
      </div>

      <div class="table-region">
        <a-table class="archive-table" row-key="id" :columns="tableColumns" :data="pagedRows" :pagination="false" :bordered="false" :stripe="false" :scroll="{ x: horizontalWidth }" @sorter-change="handleSort">
          <template #actions="{ record }">
            <div class="row-actions">
              <button type="button" class="row-action" @click="openPreview(record as Deliverable)">{{ t('archive.preview') }}</button>
              <button type="button" class="row-action" @click="download(record as Deliverable)">{{ t('archive.download') }}</button>
            </div>
          </template>
          <template #empty><a-empty :description="hasApplied ? t('archive.noMatch') : t('archive.empty')" /></template>
        </a-table>
      </div>
      <AppPagination v-model:current="page" v-model:page-size="pageSize" :total="resultRows.length" />
    </section>

    <DocumentPreviewDialog v-model:visible="previewVisible" :row="preview" :project="selected" @download="download" />
  </div>
</template>

<style scoped>
/* 2026-11-13 用户裁决：左右两块白色面板直接贴紧（gap 0），仍是各自独立的圆角面板；
   中间 1px 描边分界线参照 OpenData 车型车辆内容区（--color-border-2，HMG 语义别名
   --app-divider）；区块高度撑满 shell 内容区，底边只留 shell 的 16px gutter。 */
.archive-layout {
  display: grid;
  grid-template-columns: 256px minmax(0, 1fr);
  gap: 0;
  min-width: 0;
  height: calc(100dvh - 56px - var(--app-page-gutter) - var(--app-page-gutter));
}
.directory, .archive-content { min-width: 0; min-height: 0; background: var(--app-surface); border-radius: var(--mt-ds-control-radius); }
.directory { display: flex; flex-direction: column; overflow: auto; border-right: 1px solid var(--app-divider); }
.directory-head { padding: var(--mt-ds-space-4); }
.directory h2 { margin: 0 0 var(--mt-ds-space-4); font-size: var(--mt-ds-font-body); font-weight: 400; }
.project-item { display: flex; flex-direction: column; gap: var(--mt-ds-space-1); width: 100%; padding: var(--mt-ds-space-3) var(--mt-ds-space-4); border: 0; border-left: 3px solid transparent; background: transparent; color: var(--app-text-primary); text-align: left; cursor: pointer; font: inherit; font-weight: 400; }
.project-item small { color: var(--mt-ds-text-muted); font-size: var(--mt-ds-font-caption); }
.project-item:hover { background: var(--color-fill-2); }
.project-item.active { background: var(--color-primary-light-1); border-left-color: var(--app-accent); color: var(--app-accent); }
.project-item:focus-visible { outline: 2px solid var(--app-accent); outline-offset: -2px; }
/* 右侧面板在固定高度内纵向排布：工具栏 / 筛选 / 列表工具 / 分页固定，只有表格区滚动。 */
.archive-content { display: flex; flex-direction: column; padding: var(--mt-ds-space-4); overflow: hidden; }
.archive-content > * { flex: none; }
.archive-content > .table-region { flex: 1 1 auto; min-height: 0; overflow: auto; }

/* 筛选区布局统一走 global.css 的 app-filter-strip / app-filter-unit / app-filter-actions */
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin: var(--mt-ds-space-2) 0 var(--mt-ds-space-4); }
.list-toolbar__title { color: var(--color-text-1); font-size: 14px; font-weight: 400; line-height: 22px; }
.archive-icon-button { display: inline-grid; width: 32px; height: 32px; padding: 0; place-items: center; }
.archive-table { min-width: 0; }

/* 表头 Fill-2 背景、50px 行高、400 字重、无外框无斑马纹（DESIGN.md · Table） */
.archive-layout :deep(.arco-table), .archive-layout :deep(.arco-table-container) { border: 0; }
.archive-layout :deep(.arco-table-th) {
  height: 50px; padding: 0 12px; border-bottom: 1px solid var(--app-divider);
  color: var(--color-text-1); background: var(--app-table-header);
  font-size: 14px; font-weight: 400; line-height: 22px; white-space: nowrap; text-align: left;
}
.archive-layout :deep(.arco-table-td) {
  height: 50px; padding: 8px 12px; border-bottom: 1px solid var(--app-divider);
  background: var(--app-surface); font-size: 14px; font-weight: 400; line-height: 22px;
  white-space: nowrap; text-align: left;
}
.archive-layout :deep(.arco-table-tr:hover .arco-table-td) { background: var(--color-fill-1); }

.row-actions { display: flex; align-items: center; gap: var(--mt-ds-space-3); }
.row-action { padding: 0; border: 0; background: transparent; color: var(--app-color-primary); font: inherit; font-weight: 400; cursor: pointer; }
.row-action:hover { text-decoration: underline; }
.row-action:focus-visible { outline: 2px solid var(--app-color-primary); outline-offset: 2px; }

@media (max-width: 900px) {
  .archive-layout { grid-template-columns: minmax(0, 1fr); height: auto; }
  .archive-content { overflow: visible; }
  .archive-content > .table-region { flex: none; overflow: visible; }
  .directory { max-height: 280px; border-right: 0; border-bottom: 1px solid var(--app-divider); }
}
/* 窄屏流式布局由 global.css 的 .app-filter-strip 媒体查询统一处理 */
</style>

<script setup lang="ts">
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import TaskExecutionDrawer from '../components/TaskExecutionDrawer.vue';
import TaskCreateDrawer from '../components/TaskCreateDrawer.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { statusRole, type StatusRole } from '../../../shared/status';
import { computed, nextTick, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import { IconPlus, IconSearch, IconRefresh, IconFilter, IconSettings, IconLeft } from '@arco-design/web-vue/es/icon';
import {
  projects, MOCK_CURRENT_USER, STATUS_CODES, PRIORITY_CODES, TASK_CODES, TASK_ORCHESTRATIONS, projectStatus, withdrawProject,
  type Project, type ProjectStatus,
} from '../data/projects';
import { useProjectLabels } from '../labels';
const { t, locale } = useI18n(); const label = useProjectLabels(); const route = useRoute(); const router = useRouter();

/* ---------------------------------------------- 路由分区
   /projects            → 列表
   /projects/new       → 列表 + 新建任务抽屉
   /projects/:id       → 任务详情（只读）
   /projects/:id/edit  → 列表 + 编辑任务抽屉
   复制为本页内局部态（无路由），打开复制抽屉预填源任务。 */
const creating = computed(() => route.path === '/projects/new');
const editingId = computed(() => (route.path.endsWith('/edit') ? String(route.params.id) : ''));
const copySource = ref<Project | null>(null);
const drawerOpen = ref(false);
const drawerSource = computed(() => copySource.value ?? projects.value.find((p) => p.id === editingId.value) ?? null);
const showList = computed(() => route.path === '/projects' || creating.value || !!editingId.value);
const showDetail = computed(() => !!route.params.id && !editingId.value && !creating.value);
const detailRecord = computed(() => projects.value.find((p) => p.id === route.params.id) ?? null);
const found = computed(() => !route.params.id || !!detailRecord.value);

function openCreate() { router.push('/projects/new'); }
function openEdit(id: string) { router.push(`/projects/${id}/edit`); }
function openCopy(record: Project) { copySource.value = record; }

/* 抽屉开关：路由（/projects/new、/projects/:id/edit）或复制态置 true；关闭后按来源回退路由/清除复制源 */
watch(
  () => [route.fullPath, copySource.value] as const,
  () => { drawerOpen.value = creating.value || !!editingId.value || !!copySource.value; },
  { immediate: true },
);
watch(drawerOpen, (open) => {
  if (open) return;
  if (copySource.value) { copySource.value = null; return; }
  if (creating.value) { router.push('/projects'); return; }
  if (editingId.value) { router.push(`/projects/${editingId.value}`); return; }
});
const executingId = ref('');
const executionOpen = ref(false);
function executeTask(record: Project) {
  executingId.value = record.id;
  executionOpen.value = true;
}

/* 状态驱动的操作（需求4）：详情恒显；执行仅待处理（在复制前）；编辑仅待提交/已撤回（在复制前）；
   审批中可撤回；复制恒置末位，已撤回显示详情、编辑、复制。
   分项类型任务按派生状态（recordStatus）派发操作。 */
function rowActions(record: Project): { key: string; label: string; onClick: () => void }[] {
  const status = recordStatus(record);
  const actions: { key: string; label: string; onClick: () => void }[] = [
    { key: 'view', label: t('projects.view'), onClick: () => router.push(`/projects/${record.id}`) },
  ];
  if (status === 'pending') actions.push({ key: 'execute', label: t('projects.execute'), onClick: () => executeTask(record) });
  if (status === 'submitting' || status === 'withdrawn' || status === 'rejected') actions.push({ key: 'edit', label: t('projects.edit'), onClick: () => openEdit(record.id) });
  if (status === 'reviewing') actions.push({ key: 'withdraw', label: t('taskWithdrawal.action'), onClick: () => requestWithdrawal(record) });
  actions.push({ key: 'copy', label: t('projects.copy'), onClick: () => openCopy(record) });
  return actions;
}

const withdrawalVisible = ref(false);
const withdrawalId = ref('');
const withdrawalRecord = computed(() => projects.value.find(task => task.id === withdrawalId.value));
function requestWithdrawal(record: Project) {
  if (recordStatus(record) !== 'reviewing') return;
  withdrawalId.value = record.id;
  withdrawalVisible.value = true;
}
function confirmWithdrawal() {
  if (!withdrawalVisible.value) return;
  if (!withdrawProject(withdrawalId.value)) {
    Message.warning(t('taskWithdrawal.changed'));
    withdrawalVisible.value = false;
    return;
  }
  withdrawalVisible.value = false;
  Message.success(t('taskWithdrawal.success'));
}
watch(withdrawalVisible, async visible => {
  if (visible) return;
  await nextTick();
  const focusTarget = document.querySelector<HTMLElement>(`.task-id-link[href="/projects/${withdrawalId.value}"]`)
    ?? document.querySelector<HTMLElement>('.filters button[type="submit"]');
  focusTarget?.focus();
});

const priorityRole = (p: string): StatusRole => (p === 'urgent' ? 'danger' : p === 'high' ? 'warning' : p === 'medium' ? 'info' : 'neutral');
// Business task types come from submitted configuration, independently of parent status aggregation.
function taskTypes(record: Project): string[] {
  return TASK_CODES.filter(code => record.subTasks.some(task => task.code === code));
}
function taskTypeText(record: Project): string {
  return taskTypes(record).map(code => label(code)).join(locale.value === 'zh-CN' ? '、' : ' / ') || '- -';
}

/* 分项类型任务：父任务状态由子项审批状态派生（需求4 四条规则）；独立任务直接用自身 status。
   所有展示/排序/筛选/操作均读 recordStatus，保证派生状态在列表、详情、操作列一致生效。 */
function recordStatus(record: Project): ProjectStatus {
  return projectStatus(record);
}

/* ---------------------------------------------- 筛选条件（DESIGN.md · List settings popover）
   15 个可选查询字段，顺序即筛选行顺序；首项（任务编号）锁定不可取消/拖拽；
   车型车辆、优先级、日期及审计字段默认隐藏，由用户按需展开；勾选 / 拖拽 / 恢复默认即时生效。 */
const FILTER_KEYS = ['id', 'name', 'type', 'brand', 'series', 'model', 'priority', 'status', 'owner', 'creator', 'createdAt', 'deadline', 'actualEnd', 'updater', 'updatedAt'] as const;
type FilterKey = (typeof FILTER_KEYS)[number];
const DEFAULT_VISIBLE_FILTERS: readonly FilterKey[] = ['id', 'name', 'type', 'status', 'owner'];
const defaultFilterSettings: { key: FilterKey; visible: boolean; disabled: boolean }[] = FILTER_KEYS.map((key) => ({ key, visible: DEFAULT_VISIBLE_FILTERS.includes(key), disabled: key === FILTER_KEYS[0] }));
const filterSettings = ref(defaultFilterSettings.map((setting) => ({ ...setting })));
const filterSettingsOpen = ref(false);
const visibleFilterKeys = computed<FilterKey[]>(() => filterSettings.value.filter((setting) => setting.visible).map((setting) => setting.key));
const filterSettingsItems = computed<ColumnSettingsItem[]>(() => filterSettings.value.map((setting) => ({ ...setting, label: t(`projects.${setting.key}`) })));
const defaultFilterItems = computed<ColumnSettingsItem[]>(() => defaultFilterSettings.map((setting) => ({ ...setting, label: t(`projects.${setting.key}`) })));

const SELECT_FIELDS = new Set<FilterKey>(['type', 'priority', 'status', 'owner', 'creator', 'updater']);
const DATE_FIELDS = new Set<FilterKey>(['createdAt', 'deadline', 'actualEnd', 'updatedAt']);
const PERSON_OPTIONS = computed(() => Array.from(new Set(projects.value.flatMap((p) => [p.creator, p.updater, p.owner]))).sort());
function filterOptions(key: FilterKey): readonly string[] {
  if (key === 'type') return TASK_CODES;
  if (key === 'priority') return PRIORITY_CODES;
  if (key === 'status') return STATUS_CODES;
  if (key === 'owner' || key === 'creator' || key === 'updater') return PERSON_OPTIONS.value;
  return [];
}
function filterOptionLabel(key: FilterKey, value: string): string {
  if (key === 'type') return label(value);
  if (key === 'priority' || key === 'status') return label(value);
  return value;
}

const draft = reactive<Record<string, string>>({});
const applied = ref<Record<string, string>>({});
const page = ref(1);
function applyFilters() { applied.value = { ...draft }; page.value = 1; }
function resetFilters() { Object.keys(draft).forEach((key) => delete draft[key]); applied.value = {}; page.value = 1; }

function onFilterSettingsChanged(next: ColumnSettingsItem[]) {
  filterSettings.value = next.map((item) => ({ key: item.key as FilterKey, visible: item.visible, disabled: item.key === FILTER_KEYS[0] }));
  const visible = new Set(visibleFilterKeys.value);
  for (const key of FILTER_KEYS) {
    if (visible.has(key)) continue;
    delete draft[key];
    delete applied.value[key];
  }
  page.value = 1;
}

/* ---------------------------------------------- 列设置（DESIGN.md · Column settings popover）
   15 个数据列；任务编号锁定可见且不可移动、恒为首列并冻结；操作列固定末列冻结右、不进列设置。
   创建人 / 更新人 / 更新时间 默认隐藏。 */
const COLUMN_KEYS = ['id', 'name', 'type', 'brand', 'series', 'model', 'priority', 'status', 'owner', 'creator', 'createdAt', 'deadline', 'actualEnd', 'updater', 'updatedAt'] as const;
type ColumnKey = (typeof COLUMN_KEYS)[number];
const COLUMN_WIDTHS: Record<ColumnKey | 'actions', number> = { id: 150, name: 300, type: 240, brand: 120, series: 120, model: 120, priority: 120, status: 120, owner: 120, creator: 120, createdAt: 170, deadline: 140, actualEnd: 160, updater: 120, updatedAt: 170, actions: 168 };
const DEFAULT_VISIBLE_COLUMNS: readonly ColumnKey[] = ['id', 'name', 'type', 'brand', 'series', 'model', 'priority', 'status', 'owner', 'createdAt', 'deadline', 'actualEnd'];
const defaultColumnSettings: { key: ColumnKey; visible: boolean; disabled: boolean }[] = COLUMN_KEYS.map((key) => ({ key, visible: DEFAULT_VISIBLE_COLUMNS.includes(key), disabled: key === 'id' }));
const columnSettings = ref(defaultColumnSettings.map((setting) => ({ ...setting })));
const columnSettingsOpen = ref(false);
const columnSettingsItems = computed<ColumnSettingsItem[]>(() => columnSettings.value.map((setting) => ({ ...setting, label: t(`projects.${setting.key}`) })));
const defaultColumnItems = computed<ColumnSettingsItem[]>(() => defaultColumnSettings.map((setting) => ({ ...setting, label: t(`projects.${setting.key}`) })));

/* ---------------------------------------------- 表头排序（DESIGN.md · Table .sorter）
   排序在「过滤后、分页前」的数据层完成；比较值取列显示文本（枚举列取标签），随语言切换。 */
const sortState = ref<{ key: ColumnKey; direction: 'ascend' | 'descend' } | null>(null);
const collator = computed(() => new Intl.Collator(locale.value === 'en-US' ? 'en' : 'zh-Hans-CN', { numeric: true, sensitivity: 'base' }));
function sortValue(record: Project, key: ColumnKey): string {
  if (key === 'type') return taskTypeText(record);
  if (key === 'priority') return label(record.priority);
  if (key === 'status') return label(recordStatus(record));
  return String(record[key] ?? '');
}
function handleSorterChange(dataIndex: unknown, direction: unknown) {
  const isDataColumn = (COLUMN_KEYS as readonly unknown[]).includes(dataIndex);
  sortState.value = isDataColumn && (direction === 'ascend' || direction === 'descend')
    ? { key: dataIndex as ColumnKey, direction }
    : null;
  page.value = 1;
}
function onColumnSettingsChanged(next: ColumnSettingsItem[]) {
  columnSettings.value = next.map((item) => ({ key: item.key as ColumnKey, visible: item.visible, disabled: item.key === 'id' }));
  if (sortState.value && !columnSettings.value.some((setting) => setting.key === sortState.value!.key && setting.visible)) sortState.value = null;
}

const tableColumns = computed<TableColumnData[]>(() => {
  const dataColumns = columnSettings.value.filter((setting) => setting.visible).map((setting, index): TableColumnData => ({
    title: t(`projects.${setting.key}`),
    dataIndex: setting.key,
    slotName: ['id', 'name', 'type', 'priority', 'status'].includes(setting.key) ? setting.key : undefined,
    width: COLUMN_WIDTHS[setting.key],
    sortable: { sortDirections: ['ascend', 'descend'], sorter: () => 0 },
    ...(index === 0 ? { fixed: 'left' as const } : {}),
  }));
  return [...dataColumns, { title: t('projects.actions'), dataIndex: 'actions', slotName: 'actions', width: COLUMN_WIDTHS.actions, fixed: 'right' as const }];
});
// Compare calendar dates in the user's timezone; completed/withdrawn/voided tasks no longer accrue delay.
function overdueDays(record: Project): number {
  if (!record.deadline || ['completed', 'withdrawn', 'voided'].includes(recordStatus(record))) return 0;
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const due = Date.parse(`${record.deadline.slice(0, 10)}T00:00:00Z`);
  return Math.max(0, Math.floor((Date.parse(`${today}T00:00:00Z`) - due) / 86400000)) || 0;
}
const horizontalWidth = computed(() => tableColumns.value.reduce((total, column) => total + Number(column.width ?? 150), 0));

const relationshipTabs = ['all', 'pending', 'handled', 'created', 'cc'] as const;
type RelationshipTab = typeof relationshipTabs[number];
const activeRelationship = ref<RelationshipTab>('all');
function matchesRelationship(record: Project, tab: RelationshipTab): boolean {
  const user = MOCK_CURRENT_USER.name;
  if (tab === 'pending') return record.owner === user && ['pending', 'submitting', 'active', 'reviewing', 'rejected'].includes(recordStatus(record));
  if (tab === 'handled') return !!record.handledBy?.includes(user);
  if (tab === 'created') return record.creator === user;
  if (tab === 'cc') return !!record.ccUsers?.includes(user);
  return true;
}
const relationshipCounts = computed(() => Object.fromEntries(relationshipTabs.map(tab => [tab, projects.value.filter(record => matchesRelationship(record, tab)).length])));
watch(activeRelationship, () => { page.value = 1; });
const filtered = computed(() => projects.value.filter((p) => matchesRelationship(p, activeRelationship.value) && FILTER_KEYS.every((k) => {
  const v = applied.value[k];
  if (!v) return true;
  if (k === 'type') return taskTypes(p).includes(v);
  if (DATE_FIELDS.has(k)) return String(p[k]).startsWith(v);
  if (SELECT_FIELDS.has(k)) {
    const cell = k === 'status' ? String(recordStatus(p)) : String(p[k]);
    return cell === v;
  }
  return String(p[k]).toLowerCase().includes(v.toLowerCase());
})));
const sortedRows = computed<Project[]>(() => {
  const rows = [...filtered.value];
  if (!sortState.value) return rows;
  const { key, direction } = sortState.value;
  const compare = collator.value.compare;
  return rows.sort((left, right) => (direction === 'ascend' ? 1 : -1) * compare(sortValue(left, key), sortValue(right, key)));
});
const pageSize = ref(10);
const pagedRows = computed(() => sortedRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
const subColumns = computed<TableColumnData[]>(() => [
  { title: t('projects.name'), dataIndex: 'code', slotName: 'code' },
  { title: t('projects.status'), dataIndex: 'status', slotName: 'status' },
  { title: t('projects.executor'), dataIndex: 'executor' },
  { title: t('projects.reviewer'), dataIndex: 'reviewer' },
  { title: t('projects.target'), dataIndex: 'target' },
  { title: t('projects.template'), dataIndex: 'template' },
]);
const detailFields = computed<[string, string][]>(() => {
  const r = detailRecord.value;
  if (!r) return [];
  return [
    ['name', r.name],
    ['type', taskTypeText(r)],
    ['brand', r.brand || '—'],
    ['series', r.series || '—'],
    ['model', r.model || '—'],
    ['priority', label(r.priority)],
    ['status', label(recordStatus(r))],
    ['owner', r.owner],
    ['creator', r.creator],
    ['createdAt', r.createdAt],
    ['deadline', r.deadline || '—'],
    ['actualEnd', r.actualEnd || '—'],
    ['updater', r.updater],
    ['updatedAt', r.updatedAt],
    ['taskCreate.description', r.description || '—'],
    ['taskCreate.orchestration', r.orchestrationId ? (TASK_ORCHESTRATIONS.find((o) => o.id === r.orchestrationId)?.name ?? r.orchestrationId) : '—'],
  ];
});
</script>
<template>
<section class="projects-page">
<!-- 任务列表：筛选 + 数据列表（含工具栏与列设置），新建任务 / 编辑任务通过抽屉承载 -->
<template v-if="showList">
  <form class="filters app-filter-strip" @submit.prevent="applyFilters">
    <a-tabs v-model:active-key="activeRelationship" class="relationship-tabs"><a-tab-pane v-for="tab in relationshipTabs" :key="tab" :title="`${t(`projectRelations.${tab}`)} (${relationshipCounts[tab]})`" /></a-tabs>
    <div v-for="key in visibleFilterKeys" :key="key" class="app-filter-unit">
      <AppFieldLabel as="label" :for="`projects-filter-${key}`" :text="t(`projects.${key}`)" context="filter" />
      <a-select
        v-if="SELECT_FIELDS.has(key)"
        :id="`projects-filter-${key}`"
        v-model="draft[key]"
        class="app-filter-control"
        :placeholder="t('projects.all')"
        :aria-label="t(`projects.${key}`)"
        allow-clear
      >
        <a-option v-for="value in filterOptions(key)" :key="value" :value="value">{{ filterOptionLabel(key, value) }}</a-option>
      </a-select>
      <a-date-picker
        v-else-if="DATE_FIELDS.has(key)"
        :id="`projects-filter-${key}`"
        v-model="draft[key]"
        class="app-filter-control"
        value-format="YYYY-MM-DD"
        :placeholder="t('projects.filters.selectDate')"
        :aria-label="t(`projects.${key}`)"
        allow-clear
      />
      <a-input
        v-else
        :input-attrs="{ id: `projects-filter-${key}`, 'aria-label': t(`projects.${key}`) }"
        v-model="draft[key]"
        class="app-filter-control"
        :placeholder="t('projects.filters.enter')"
        allow-clear
      />
    </div>
    <div class="search-actions app-filter-actions">
      <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('designSystem.search') }}</a-button>
      <a-button class="app-btn-neutral" @click="resetFilters"><template #icon><IconRefresh /></template>{{ t('designSystem.reset') }}</a-button>
      <ColumnSettingsPopover
        v-model:visible="filterSettingsOpen"
        :items="filterSettingsItems"
        :default-items="defaultFilterItems"
        :title="t('projects.filters.settings')"
        :list-aria-label="t('projects.filters.settings')"
        :show-label="t('projects.filters.show')"
        :restore-label="t('projects.filters.restore')"
        @change="onFilterSettingsChanged"
      >
        <a-tooltip :content="t('projects.filters.settings')">
          <a-button class="app-btn-neutral projects-icon-button" :aria-label="t('projects.filters.settings')"><IconFilter /></a-button>
        </a-tooltip>
      </ColumnSettingsPopover>
    </div>
  </form>
  <section class="list-panel" role="region" :aria-label="t('projects.title')">
    <div class="list-toolbar">
      <a-button type="primary" @click="openCreate"><template #icon><IconPlus /></template>{{ t('projects.new') }}</a-button>
      <ColumnSettingsPopover
        v-model:visible="columnSettingsOpen"
        :items="columnSettingsItems"
        :default-items="defaultColumnItems"
        :title="t('projects.columns.settings')"
        :list-aria-label="t('projects.columns.settings')"
        :show-label="t('projects.filters.show')"
        :restore-label="t('projects.filters.restore')"
        @change="onColumnSettingsChanged"
      >
        <a-tooltip :content="t('projects.columns.settings')">
          <a-button class="app-btn-neutral projects-icon-button" :aria-label="t('projects.columns.settings')"><IconSettings /></a-button>
        </a-tooltip>
      </ColumnSettingsPopover>
    </div>
    <div class="table-region">
      <a-table row-key="id" :columns="tableColumns" :data="pagedRows" :scroll="{x:horizontalWidth}" :pagination="false" :bordered="false" :stripe="false" @sorter-change="handleSorterChange">
        <template #id="{record}"><router-link class="task-id-link" :to="`/projects/${record.id}`">{{ record.id }}</router-link></template>
        <template #name="{record}"><div class="task-name-cell"><a-tooltip :content="record.name" position="top" :auto-fix-position="true"><span class="task-name-text" tabindex="0">{{ record.name }}</span></a-tooltip><a-tag v-if="overdueDays(record)" color="red" class="overdue-tag">{{ t('projectList.overdue', { days: overdueDays(record) }) }}</a-tag></div></template>
        <template #type="{record}"><span class="task-type-cell">{{ taskTypeText(record) }}</span></template>
        <template #priority="{record}"><AppStatusTag :role="priorityRole(record.priority)" :label="label(record.priority)"/></template>
        <template #status="{record}"><AppStatusTag :role="statusRole(recordStatus(record), 'projects')" :label="label(recordStatus(record))"/></template>
        <template #actions="{record}"><a-space><a v-for="a in rowActions(record)" :key="a.key" class="row-action" role="button" tabindex="0" @click="a.onClick" @keyup.enter="a.onClick">{{ a.label }}</a></a-space></template>
        <template #empty>{{ t('projects.empty') }}</template>
      </a-table>
    </div>
    <AppPagination v-model:current="page" v-model:page-size="pageSize" :total="sortedRows.length" />
  </section>
</template>

<!-- 任务详情（只读，DESIGN.md · 详情子页面：顶部返回 + 面包屑，基础信息 + 分项任务只读表格） -->
<template v-else-if="showDetail && found">
  <header class="detail-bar">
    <a-button type="text" class="detail-back" @click="router.push('/projects')"><IconLeft />{{ t('projects.back') }}</a-button>
    <a-breadcrumb class="detail-crumb"><a-breadcrumb-item>{{ t('projects.title') }}</a-breadcrumb-item><a-breadcrumb-item class="is-current">{{ detailRecord!.name }}</a-breadcrumb-item></a-breadcrumb>
  </header>
  <div class="detail-card">
    <h2>{{ t('projects.base') }}</h2>
    <dl class="app-detail-list">
      <div v-for="(field, i) in detailFields" :key="i"><dt class="app-detail-label">{{ t(field[0]) }}</dt><dd>{{ field[1] }}</dd></div>
    </dl>
  </div>
  <div v-if="detailRecord!.type === 'section'" class="detail-card">
    <h2>{{ t('projects.content') }}</h2>
    <a-table row-key="code" :columns="subColumns" :data="detailRecord!.subTasks" :pagination="false" :bordered="false" :stripe="false">
      <template #code="{record}">{{ label(record.code) }}</template>
      <template #status="{record}"><AppStatusTag :role="statusRole(record.status, 'projects')" :label="label(record.status)"/></template>
    </a-table>
  </div>
</template>

<a-empty v-else-if="showDetail && !found" :description="t('projects.missing')" />

<ConfirmDialog v-model:visible="withdrawalVisible" :title="t('taskWithdrawal.confirm')" :description="t('taskWithdrawal.description', { name: withdrawalRecord?.name || '' })" :ok-text="t('taskWithdrawal.action')" @confirm="confirmWithdrawal" />
<TaskExecutionDrawer v-if="executionOpen" v-model:visible="executionOpen" :task-id="executingId" />
<TaskCreateDrawer
  v-model:visible="drawerOpen"
  :copy-source="copySource"
  :edit-source="copySource ? null : drawerSource"
/>
</section>
</template>
<style scoped>
.task-type-cell { white-space: normal; overflow-wrap: anywhere; font-weight: var(--mt-ds-weight-body); line-height: var(--mt-ds-line-body); }
.projects-page { min-width: 0; color: var(--mt-ds-text); }
/* 筛选面板：独立白色业务面板 */
.filters { padding: var(--mt-ds-space-4); margin-bottom: var(--mt-ds-space-3); background: var(--mt-ds-surface); border-radius: var(--mt-ds-control-radius); }
/* 数据列表：独立白色业务面板 + 16px 内容 inset */
.list-panel { min-width: 0; padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); border-radius: var(--mt-ds-control-radius); }
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--mt-ds-space-3); margin-bottom: var(--mt-ds-space-4); }
.table-region { min-width: 0; }
.projects-icon-button { display: inline-grid; width: 32px; height: 32px; padding: 0; place-items: center; }
a { color: rgb(var(--primary-6)); text-decoration: none; }
:deep(.arco-table .arco-space) { gap: var(--mt-ds-space-3) !important; flex-wrap: nowrap; }

/* 表格（DESIGN.md · Table / Enterprise list presentation）：白底、无外框、无斑马纹、行间单线分隔，
   表头与数据一律 400 字重；表头 44px、数据行 52px、12px 内边距；横向溢出只在表格区内滚动。
   表头背景 = Fill-2（--app-table-header，DESIGN.md · Color token），数据行白底（面板表面）。 */
.list-panel :deep(.arco-table), .list-panel :deep(.arco-table-container) { border: 0; }
.list-panel :deep(.arco-table-th) { height: 50px; padding: 0 12px; border-bottom: 1px solid var(--app-divider); color: var(--color-text-1); background: var(--app-table-header); font-size: 14px; font-weight: var(--mt-ds-weight-body); line-height: 22px; white-space: nowrap; text-align: left; }
.list-panel :deep(.arco-table-td) { height: 50px; padding: 8px 12px; border-bottom: 1px solid var(--app-divider); background: var(--mt-ds-surface); font-size: 14px; font-weight: var(--mt-ds-weight-body); line-height: 22px; white-space: nowrap; text-align: left; }
.list-panel :deep(.arco-table-tr:hover .arco-table-td) { background: var(--color-fill-1); }
.row-action { color: rgb(var(--primary-6)); cursor: pointer; font-size: 14px; line-height: 22px; }
.row-action:hover { color: rgb(var(--primary-5)); }

/* 详情子页面（DESIGN.md · 详情子页面 + 只读 Summary list） */
.detail-bar { display: flex; align-items: center; gap: var(--mt-ds-space-2); margin-bottom: var(--mt-ds-space-3); }
.detail-back { display: inline-flex; align-items: center; gap: 4px; color: var(--color-text-3); padding: 0; }
.detail-back:hover { color: rgb(var(--primary-6)); }
.detail-crumb { font-size: 14px; line-height: 22px; }
.detail-crumb :deep(.arco-breadcrumb-item) { color: var(--color-text-3); }
.detail-crumb :deep(.arco-breadcrumb-item.is-current) { color: var(--color-text-1); font-weight: 600; }
.detail-card { padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); border-radius: var(--mt-ds-control-radius); margin-bottom: var(--mt-ds-space-3); }
.detail-card h2 { margin: 0 0 var(--mt-ds-space-4); font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
.detail-card :deep(.arco-table-th) { background: var(--app-table-header); }
.detail-card :deep(.arco-table-td) { background: var(--mt-ds-surface); }

.task-id-link { color: var(--color-text-1); font-weight: var(--mt-ds-weight-body); }
.task-id-link:hover, .task-id-link:focus-visible { color: rgb(var(--primary-6)); }
.task-name-cell { display: flex; align-items: center; gap: var(--mt-ds-space-2); min-width: 0; width: 100%; }
.task-name-text { display: block; flex: 0 1 auto; max-width: 100%; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.overdue-tag { flex: 0 0 auto; font-weight: var(--mt-ds-weight-body); }
.relationship-tabs { flex: 0 0 100%; min-width: 0; width: 100%; }
.relationship-tabs :deep(.arco-tabs-content) { display: none; }
</style>

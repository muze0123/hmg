<script setup lang="ts">
import { computed, reactive, ref, watch, toRaw } from 'vue';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { type TableColumnData, Message } from '@arco-design/web-vue';
import {
  IconPlus, IconSearch, IconRefresh, IconDownload, IconFilter, IconSettings,
} from '@arco-design/web-vue/es/icon';
import AppFormLayout from '../../../design/components/AppFormLayout.vue';
import AppDetailList from '../../../design/components/AppDetailList.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import { statusRole } from '../../../shared/status';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { useTaskCenterStore } from '../../task-center/stores/taskCenter';
import { makeUsageExport } from '../data/export';
import { templateRecords as records, type TemplateRecord } from '../data/templates';

const { t, locale } = useI18n();
const route = useRoute();
const usage = computed(() => route.params.section === 'usage');
// 状态外观由 AppStatusTag 统一承载；业务枚举 → 语义角色见 src/shared/status.ts。
const types = ['vehicle', 'technical', 'testing', 'report', 'certificate'];
const STATUS_CODES = ['draft', 'reviewing', 'completed', 'rejected'] as const;

/* 共享列表状态：两个视图的筛选结果 computed 与 watch 都在下方，
   这些 ref 必须先完成初始化，否则 setup 期间 watch 求值会落入暂时性死区。 */
const active = ref('vehicle');
const current = ref(1);
const pageSize = ref(10);
const selected = ref<TemplateRecord>();
const editing = ref(false);
const baseline = ref('');
const discard = ref(false);

/* ---------------------------------------------- 使用记录字段全集
   筛选条件、表格列、列设置、导出共用同一套 key 与文案；显示文本走 usageCellText，
   排序与导出都以显示文本为准，枚举不会被按 code 排序。 */
const USAGE_KEYS = ['name', 'type', 'version', 'project', 'user', 'used'] as const;
type UsageKey = (typeof USAGE_KEYS)[number];
function usageLabel(key: UsageKey): string { return t(`templates.${key}`); }
function usageCellText(row: TemplateRecord, key: string): string {
  if (key === 'type') return t(`templates.${row.type}`);
  return String(row[key as keyof TemplateRecord] ?? '') || '—';
}

// 使用记录独立派生自模板主数据。编辑模板不改变历史版本与使用痕迹。
const USAGE_PEOPLE = ['张三', '李四', '王五', '赵六', '陈静', '刘洋'];
const usageRecords = computed<TemplateRecord[]>(() => records.value
  .filter((_, index) => index % 3 === 0)
  .slice(0, 12)
  .map((row, index) => ({
    ...row,
    project: `HMG-2025-${String(index + 1).padStart(3, '0')}`,
    user: USAGE_PEOPLE[index % USAGE_PEOPLE.length]!,
    used: `2025-12-${String(31 - index).padStart(2, '0')} ${String(9 + (index % 8)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`,
  })));

/* ---------------------------------------------- 筛选条件（DESIGN.md · Filter strip packing / List settings popover）
   6 个可选查询字段，弹层顺序即筛选行顺序；首项「模版名称」锁定可见。
   隐藏字段同时清掉草稿与已应用条件，避免不可见条件继续过滤。 */
const defaultUsageFilterSettings: { key: UsageKey; visible: boolean; disabled: boolean }[] =
  USAGE_KEYS.map((key, index) => ({ key, visible: true, disabled: index === 0 }));
const usageFilterSettings = ref(defaultUsageFilterSettings.map(setting => ({ ...setting })));
const usageFilterSettingsOpen = ref(false);
const visibleUsageFilterKeys = computed<UsageKey[]>(() => usageFilterSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const usageFilterSettingsItems = computed<ColumnSettingsItem[]>(() => usageFilterSettings.value.map(setting => ({ ...setting, label: usageLabel(setting.key) })));
const defaultUsageFilterItems = computed<ColumnSettingsItem[]>(() => defaultUsageFilterSettings.map(setting => ({ ...setting, label: usageLabel(setting.key) })));

const usageDraft = reactive<Partial<Record<UsageKey, string>>>({});
const usageApplied = ref<Partial<Record<UsageKey, string>>>({});
function applyUsageFilters() { usageApplied.value = { ...usageDraft }; current.value = 1; }
function resetUsageFilters() {
  for (const key of USAGE_KEYS) usageDraft[key] = '';
  usageApplied.value = {};
  current.value = 1;
}
function onUsageFilterSettingsChanged(next: ColumnSettingsItem[]) {
  usageFilterSettings.value = next.map(item => ({ key: item.key as UsageKey, visible: item.visible, disabled: item.key === 'name' }));
  const visible = new Set(visibleUsageFilterKeys.value);
  for (const key of USAGE_KEYS) {
    if (visible.has(key)) continue;
    delete usageDraft[key];
    delete usageApplied.value[key];
  }
  current.value = 1;
}

/* ---------------------------------------------- 列设置（DESIGN.md · List settings popover）
   首列「模版名称」锁定可见；操作列不进弹层、恒为最后一列且右侧冻结。 */
const USAGE_WIDTHS: Record<UsageKey, number> = { name: 200, type: 140, version: 130, project: 170, user: 130, used: 180 };
const USAGE_ACTION_WIDTH = 160;
const defaultUsageColumnSettings: { key: UsageKey; visible: boolean; disabled: boolean }[] =
  USAGE_KEYS.map((key, index) => ({ key, visible: true, disabled: index === 0 }));
const usageColumnSettings = ref(defaultUsageColumnSettings.map(setting => ({ ...setting })));
const usageColumnSettingsOpen = ref(false);
const visibleUsageColumnKeys = computed<UsageKey[]>(() => usageColumnSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const usageColumnSettingsItems = computed<ColumnSettingsItem[]>(() => usageColumnSettings.value.map(setting => ({ ...setting, label: usageLabel(setting.key) })));
const defaultUsageColumnItems = computed<ColumnSettingsItem[]>(() => defaultUsageColumnSettings.map(setting => ({ ...setting, label: usageLabel(setting.key) })));
function onUsageColumnSettingsChanged(next: ColumnSettingsItem[]) {
  usageColumnSettings.value = next.map(item => ({ key: item.key as UsageKey, visible: item.visible, disabled: item.key === 'name' }));
  // 隐藏掉当前排序列时同步清除排序，避免不可见排序继续生效
  if (usageSortField.value && !visibleUsageColumnKeys.value.includes(usageSortField.value)) {
    usageSortField.value = '';
    usageSortDirection.value = '';
  }
}

/* ---------------------------------------------- 排序（6 个业务列全部支持升序 / 降序）
   a-table 只会对当前页切片排序，跨页顺序必须在数据层重排；两层共用 compareUsageRows，
   sortOrder 受控，列设置导致的 columns 重算与翻页都不会丢掉排序方向。 */
type SortDirection = '' | 'ascend' | 'descend';
const usageSortField = ref<UsageKey | ''>('');
const usageSortDirection = ref<SortDirection>('');
function compareUsageRows(a: TemplateRecord, b: TemplateRecord, key: UsageKey, direction: 'ascend' | 'descend'): number {
  const x = usageCellText(a, key);
  const y = usageCellText(b, key);
  const result = x.localeCompare(y, String(locale.value), { numeric: true, sensitivity: 'base' });
  return direction === 'descend' ? -result : result;
}
function handleUsageSort(dataIndex: unknown, direction: unknown) {
  if (!usage.value || typeof dataIndex !== 'string' || !USAGE_KEYS.includes(dataIndex as UsageKey)) return;
  const active = direction === 'ascend' || direction === 'descend';
  usageSortField.value = active ? dataIndex as UsageKey : '';
  usageSortDirection.value = active ? direction as SortDirection : '';
  current.value = 1;
}
const usageColumns = computed<TableColumnData[]>(() => [
  ...visibleUsageColumnKeys.value.map((key): TableColumnData => ({
    title: usageLabel(key),
    dataIndex: key,
    slotName: 'usageField',
    width: USAGE_WIDTHS[key],
    sortable: {
      sortDirections: ['ascend', 'descend'] as ('ascend' | 'descend')[],
      sortOrder: usageSortField.value === key ? usageSortDirection.value : '',
      sorter: (a, b, extra) => compareUsageRows(a as unknown as TemplateRecord, b as unknown as TemplateRecord, key, extra.direction),
    },
  })),
  { title: t('templates.actions'), dataIndex: 'actions', slotName: 'actions', width: USAGE_ACTION_WIDTH, fixed: 'right' as const },
]);
const usageHorizontalWidth = computed(() => visibleUsageColumnKeys.value.reduce((sum, key) => sum + USAGE_WIDTHS[key], USAGE_ACTION_WIDTH));

/* ---------------------------------------------- 使用记录结果集：过滤 → 排序 → 分页 */
const usageResultRows = computed<TemplateRecord[]>(() => {
  const rows = usageRecords.value.filter(row => USAGE_KEYS.every((key) => {
    const value = usageApplied.value[key];
    if (!value) return true;
    if (key === 'type') return row.type === value;
    if (key === 'used') return String(row.used ?? '').slice(0, 10) === value;
    return String(row[key] ?? '').toLowerCase().includes(value.toLowerCase());
  }));
  if (!usageSortField.value || !usageSortDirection.value) return rows;
  const key = usageSortField.value;
  const direction = usageSortDirection.value;
  return [...rows].sort((a, b) => compareUsageRows(a, b, key, direction));
});
const usagePagedRows = computed(() => usageResultRows.value.slice((current.value - 1) * pageSize.value, current.value * pageSize.value));
watch(usageResultRows, () => { if (usage.value) current.value = 1; });

/* ---------------------------------------------- 导出（DESIGN.md · Batch export baseline）
   只导出「已应用筛选结果」的当前可见列；确认弹窗 → 生成 xlsx → 登记下载任务。 */
const taskCenter = useTaskCenterStore();
const usageExportOpen = ref(false);
const usageExporting = ref(false);
function requestUsageExport() {
  if (usageExporting.value) return;
  if (!usageResultRows.value.length) { Message.info(t('templates.exportEmpty')); return; }
  usageExportOpen.value = true;
}
function usagePad(value: number): string { return String(value).padStart(2, '0'); }
function usageStamp(date: Date): string {
  return `${date.getFullYear()}${usagePad(date.getMonth() + 1)}${usagePad(date.getDate())}${usagePad(date.getHours())}${usagePad(date.getMinutes())}${usagePad(date.getSeconds())}`;
}
function usageClock(date: Date): string {
  return `${date.getFullYear()}-${usagePad(date.getMonth() + 1)}-${usagePad(date.getDate())} ${usagePad(date.getHours())}:${usagePad(date.getMinutes())}:${usagePad(date.getSeconds())}`;
}
function usageDay(date: Date): string {
  return `${date.getFullYear()}-${usagePad(date.getMonth() + 1)}-${usagePad(date.getDate())}`;
}
async function confirmUsageExport() {
  if (usageExporting.value || !usageResultRows.value.length) return;
  usageExporting.value = true;
  try {
    const headers = visibleUsageColumnKeys.value.map(key => ({ key, label: usageLabel(key) }));
    const blob = await makeUsageExport({
      rows: usageResultRows.value,
      headers,
      sheetName: t('templates.usage'),
      display: usageCellText,
    });
    const now = new Date();
    taskCenter.addDownloadTask({
      id: `dl-${now.getTime()}`,
      module: 'templates',
      fileStamp: usageStamp(now),
      operator: t('templates.exportOperator'),
      time: usageClock(now),
      status: 'processing',
      progress: 92,
      fileUrl: URL.createObjectURL(blob),
      fileName: `${t('templates.usage')}_${usageDay(now)}.xlsx`,
    });
    usageExportOpen.value = false;
    Message.success(t('templates.exportCreated'));
    taskCenter.open('download');
  } catch {
    Message.error(t('templates.exportFailed'));
  } finally {
    usageExporting.value = false;
  }
}

/* ---------------------------------------------- 模版配置（5 个类型 tab 共用一套字段、筛选、列与排序）
   与使用记录视图同构：6 个查询字段 + 6 个业务列，弹层顺序即筛选行顺序；
   首字段 / 首列「模版名称」锁定可见，操作列恒最后且不进列设置。 */
const CONFIG_KEYS = ['name', 'description', 'status', 'version', 'created', 'updated'] as const;
type ConfigKey = (typeof CONFIG_KEYS)[number];
const CONFIG_FILTER_ORDER: readonly ConfigKey[] = ['name', 'status', 'version', 'description', 'created', 'updated'];
const CONFIG_SELECT_KEYS: readonly ConfigKey[] = ['status', 'version'];
const CONFIG_DATE_KEYS: readonly ConfigKey[] = ['created', 'updated'];
const CONFIG_WIDTHS: Record<ConfigKey, number> = { name: 200, description: 240, status: 110, version: 130, created: 180, updated: 180 };
const CONFIG_ACTION_WIDTH = 160;
function configLabel(key: ConfigKey): string { return t(`templates.${key}`); }
function configCellText(row: TemplateRecord, key: ConfigKey): string {
  if (key === 'status') return t(`templates.${row.status}`);
  return String(row[key] ?? '') || '—';
}
function configOptions(key: ConfigKey): readonly string[] {
  if (key === 'status') return STATUS_CODES;
  if (key === 'version') return [...new Set(records.value.map(row => row.version))];
  return [];
}
function configOptionLabel(key: ConfigKey, value: string): string {
  return key === 'version' ? value : t(`templates.${value}`);
}

const defaultConfigFilterSettings: { key: ConfigKey; visible: boolean; disabled: boolean }[] =
  CONFIG_FILTER_ORDER.map((key, index) => ({ key, visible: true, disabled: index === 0 }));
const configFilterSettings = ref(defaultConfigFilterSettings.map(setting => ({ ...setting })));
const configFilterSettingsOpen = ref(false);
const visibleConfigFilterKeys = computed<ConfigKey[]>(() => configFilterSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const configFilterSettingsItems = computed<ColumnSettingsItem[]>(() => configFilterSettings.value.map(setting => ({ ...setting, label: configLabel(setting.key) })));
const defaultConfigFilterItems = computed<ColumnSettingsItem[]>(() => defaultConfigFilterSettings.map(setting => ({ ...setting, label: configLabel(setting.key) })));

const configDraft = reactive<Partial<Record<ConfigKey, string>>>({});
const configApplied = ref<Partial<Record<ConfigKey, string>>>({});
const configHasApplied = computed(() => CONFIG_FILTER_ORDER.some(key => Boolean(configApplied.value[key])));
function applyConfigFilters() { configApplied.value = { ...configDraft }; current.value = 1; }
function resetConfigFilters() {
  for (const key of CONFIG_KEYS) configDraft[key] = '';
  configApplied.value = {};
  current.value = 1;
}
function onConfigFilterSettingsChanged(next: ColumnSettingsItem[]) {
  configFilterSettings.value = next.map(item => ({ key: item.key as ConfigKey, visible: item.visible, disabled: item.key === 'name' }));
  const visible = new Set(visibleConfigFilterKeys.value);
  for (const key of CONFIG_FILTER_ORDER) {
    if (visible.has(key)) continue;
    delete configDraft[key];
    delete configApplied.value[key];
  }
  current.value = 1;
}

const defaultConfigColumnSettings: { key: ConfigKey; visible: boolean; disabled: boolean }[] =
  CONFIG_KEYS.map((key, index) => ({ key, visible: true, disabled: index === 0 }));
const configColumnSettings = ref(defaultConfigColumnSettings.map(setting => ({ ...setting })));
const configColumnSettingsOpen = ref(false);
const visibleConfigColumnKeys = computed<ConfigKey[]>(() => configColumnSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const configColumnSettingsItems = computed<ColumnSettingsItem[]>(() => configColumnSettings.value.map(setting => ({ ...setting, label: configLabel(setting.key) })));
const defaultConfigColumnItems = computed<ColumnSettingsItem[]>(() => defaultConfigColumnSettings.map(setting => ({ ...setting, label: configLabel(setting.key) })));
function onConfigColumnSettingsChanged(next: ColumnSettingsItem[]) {
  configColumnSettings.value = next.map(item => ({ key: item.key as ConfigKey, visible: item.visible, disabled: item.key === 'name' }));
  if (configSortField.value && !visibleConfigColumnKeys.value.includes(configSortField.value)) {
    configSortField.value = '';
    configSortDirection.value = '';
  }
}

/* 排序：比较值取显示文本；数据层在过滤后、分页前重排，Arco 与数据层共用同一比较函数，
   sortOrder 受控，列设置重算与翻页都不丢方向。 */
const configSortField = ref<ConfigKey | ''>('');
const configSortDirection = ref<SortDirection>('');
function compareConfigRows(a: TemplateRecord, b: TemplateRecord, key: ConfigKey, direction: 'ascend' | 'descend'): number {
  const x = configCellText(a, key);
  const y = configCellText(b, key);
  const result = x.localeCompare(y, String(locale.value), { numeric: true, sensitivity: 'base' });
  return direction === 'descend' ? -result : result;
}
function handleConfigSort(dataIndex: unknown, direction: unknown) {
  if (usage.value || typeof dataIndex !== 'string' || !CONFIG_KEYS.includes(dataIndex as ConfigKey)) return;
  const active = direction === 'ascend' || direction === 'descend';
  configSortField.value = active ? dataIndex as ConfigKey : '';
  configSortDirection.value = active ? direction as SortDirection : '';
  current.value = 1;
}
function handleSort(dataIndex: unknown, direction: unknown) {
  handleUsageSort(dataIndex, direction);
  handleConfigSort(dataIndex, direction);
}
const configColumns = computed<TableColumnData[]>(() => [
  ...visibleConfigColumnKeys.value.map((key): TableColumnData => ({
    title: configLabel(key),
    dataIndex: key,
    slotName: 'configField',
    width: CONFIG_WIDTHS[key],
    ellipsis: true,
    sortable: {
      sortDirections: ['ascend', 'descend'] as ('ascend' | 'descend')[],
      sortOrder: configSortField.value === key ? configSortDirection.value : '',
      sorter: (a, b, extra) => compareConfigRows(a as unknown as TemplateRecord, b as unknown as TemplateRecord, key, extra.direction),
    },
  })),
  { title: t('templates.actions'), dataIndex: 'actions', slotName: 'actions', width: CONFIG_ACTION_WIDTH, fixed: 'right' as const },
]);
const configHorizontalWidth = computed(() => visibleConfigColumnKeys.value.reduce((sum, key) => sum + CONFIG_WIDTHS[key], CONFIG_ACTION_WIDTH));

const configResultRows = computed<TemplateRecord[]>(() => {
  const rows = records.value.filter(row => row.type === active.value && CONFIG_FILTER_ORDER.every((key) => {
    const value = configApplied.value[key];
    if (!value) return true;
    const cell = String(row[key] ?? '');
    if (CONFIG_DATE_KEYS.includes(key)) return cell.slice(0, 10) === value;
    if (CONFIG_SELECT_KEYS.includes(key)) return cell === value;
    return cell.toLowerCase().includes(value.toLowerCase());
  }));
  if (!configSortField.value || !configSortDirection.value) return rows;
  const key = configSortField.value;
  const direction = configSortDirection.value;
  return [...rows].sort((a, b) => compareConfigRows(a, b, key, direction));
});
const configPagedRows = computed(() => configResultRows.value.slice((current.value - 1) * pageSize.value, current.value * pageSize.value));
watch(configResultRows, () => { if (!usage.value) current.value = 1; });
const noMatch = computed(() => usage.value
  ? USAGE_KEYS.some(key => Boolean(usageApplied.value[key]))
  : configHasApplied.value);

/* ---------------------------------------------- 新增 / 编辑 / 详情与视图切换 */
// 同一列表页内切换类型 tab 保留已应用筛选（DESIGN.md · Jump-in filter params）；切换业务视图时重置查询。
watch(active, () => { current.value = 1; });
watch(usage, () => { resetConfigFilters(); resetUsageFilters(); current.value = 1; });
function open(row?: TemplateRecord, edit = true) {
 selected.value = row ? structuredClone(toRaw(row)) : { id: `TPL-${Date.now()}`, type: active.value, name: '', description: '', version: 'V1.0.0', status: 'draft', created: new Date().toISOString().slice(0,10), updated: new Date().toISOString().slice(0,10), entries: [] };
 editing.value = edit; baseline.value = JSON.stringify(selected.value);
}
const dirty = computed(() => editing.value && selected.value && JSON.stringify(selected.value) !== baseline.value);
function close() { if (dirty.value) discard.value = true; else selected.value = undefined; }
function save() {
 const row = selected.value;
 if (!row || !row.name.trim() || !row.version.trim() || row.entries.some(entry => !entry.name.trim())) { Message.error(t('templates.required')); document.querySelector<HTMLInputElement>('[data-template-name] input')?.focus(); return; }
 row.updated = new Date().toISOString().slice(0,10);
 const index = records.value.findIndex(item => item.id === row.id);
 if (index < 0) records.value.unshift(structuredClone(toRaw(row))); else records.value[index] = structuredClone(toRaw(row));
 selected.value = undefined; Message.success(t('templates.saved'));
}
onBeforeRouteLeave(() => { if (dirty.value) { discard.value = true; return false; } return true; });
</script>

<template>
  <section class="templates-page">
    <template v-if="!selected">
      <!-- 筛选条件区：类型 tab 归入同一面板；字段名称在上、200px 控件在下，查询组紧跟最后字段 -->
      <form class="filter-panel app-filter-strip" @submit.prevent="usage ? applyUsageFilters() : applyConfigFilters()">
        <a-tabs v-if="!usage" v-model:active-key="active" class="template-tabs">
          <a-tab-pane v-for="type in types" :key="type" :title="t(`templates.${type}`)" />
        </a-tabs>
        <template v-if="usage">
          <div v-for="key in visibleUsageFilterKeys" :key="key" class="app-filter-unit">
            <AppFieldLabel as="label" :for="`usage-filter-${key}`" :text="usageLabel(key)" context="filter" />
            <a-select
              v-if="key === 'type'"
              :id="`usage-filter-${key}`"
              v-model="usageDraft[key]"
              class="app-filter-control"
              :placeholder="t('templates.all')"
              :aria-label="usageLabel(key)"
              allow-clear
            >
              <a-option v-for="code in types" :key="code" :value="code">{{ t(`templates.${code}`) }}</a-option>
            </a-select>
            <a-date-picker
              v-else-if="key === 'used'"
              :id="`usage-filter-${key}`"
              v-model="usageDraft[key]"
              class="app-filter-control"
              value-format="YYYY-MM-DD"
              :placeholder="t('templates.selectDate')"
              :aria-label="usageLabel(key)"
              allow-clear
            />
            <a-input
              v-else
              :input-attrs="{ id: `usage-filter-${key}`, 'aria-label': usageLabel(key) }"
              v-model="usageDraft[key]"
              class="app-filter-control"
              :placeholder="t('templates.enter')"
              :aria-label="usageLabel(key)"
              allow-clear
            />
          </div>
        </template>
        <template v-else>
          <div v-for="key in visibleConfigFilterKeys" :key="key" class="app-filter-unit">
            <AppFieldLabel as="label" :for="`config-filter-${key}`" :text="configLabel(key)" context="filter" />
            <a-select
              v-if="CONFIG_SELECT_KEYS.includes(key)"
              :id="`config-filter-${key}`"
              v-model="configDraft[key]"
              class="app-filter-control"
              :placeholder="t('templates.all')"
              :aria-label="configLabel(key)"
              allow-clear
            >
              <a-option v-for="code in configOptions(key)" :key="code" :value="code">{{ configOptionLabel(key, code) }}</a-option>
            </a-select>
            <a-date-picker
              v-else-if="CONFIG_DATE_KEYS.includes(key)"
              :id="`config-filter-${key}`"
              v-model="configDraft[key]"
              class="app-filter-control"
              value-format="YYYY-MM-DD"
              :placeholder="t('templates.selectDate')"
              :aria-label="configLabel(key)"
              allow-clear
            />
            <a-input
              v-else
              :input-attrs="{ id: `config-filter-${key}`, 'aria-label': configLabel(key) }"
              v-model="configDraft[key]"
              class="app-filter-control"
              :placeholder="t('templates.enter')"
              :aria-label="configLabel(key)"
              allow-clear
            />
          </div>
        </template>
        <div class="filter-actions app-filter-actions">
          <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('designSystem.search') }}</a-button>
          <a-button class="app-btn-neutral" @click="usage ? resetUsageFilters() : resetConfigFilters()"><template #icon><IconRefresh /></template>{{ t('designSystem.reset') }}</a-button>
          <ColumnSettingsPopover
            v-if="usage"
            v-model:visible="usageFilterSettingsOpen"
            :items="usageFilterSettingsItems"
            :default-items="defaultUsageFilterItems"
            :title="t('templates.filters.settings')"
            :list-aria-label="t('templates.filters.settings')"
            :show-label="t('templates.filters.show')"
            :restore-label="t('templates.filters.restore')"
            @change="onUsageFilterSettingsChanged"
          >
            <a-tooltip :content="t('templates.filters.settings')">
              <a-button class="app-btn-neutral templates-icon-button" :aria-label="t('templates.filters.settings')" :title="t('templates.filters.settings')"><IconFilter /></a-button>
            </a-tooltip>
          </ColumnSettingsPopover>
          <ColumnSettingsPopover
            v-else
            v-model:visible="configFilterSettingsOpen"
            :items="configFilterSettingsItems"
            :default-items="defaultConfigFilterItems"
            :title="t('templates.filters.settings')"
            :list-aria-label="t('templates.filters.settings')"
            :show-label="t('templates.filters.show')"
            :restore-label="t('templates.filters.restore')"
            @change="onConfigFilterSettingsChanged"
          >
            <a-tooltip :content="t('templates.filters.settings')">
              <a-button class="app-btn-neutral templates-icon-button" :aria-label="t('templates.filters.settings')" :title="t('templates.filters.settings')"><IconFilter /></a-button>
            </a-tooltip>
          </ColumnSettingsPopover>
        </div>
      </form>

      <!-- 数据列表区：左上操作按钮、右上 32×32 列设置；不渲染标题与总条数 -->
      <section class="list-panel" role="region" :aria-label="t(usage ? 'templates.listTitle' : 'templates.configListTitle')">
        <div class="list-toolbar">
          <div class="list-toolbar__left">
            <a-button v-if="usage" class="app-btn-neutral" @click="requestUsageExport">
              <template #icon><IconDownload /></template>{{ t('templates.export') }}
            </a-button>
            <a-button v-else type="primary" @click="open()"><template #icon><IconPlus /></template>{{ t('templates.new') }}</a-button>
          </div>
          <div class="list-toolbar__right">
            <ColumnSettingsPopover
              v-if="usage"
              v-model:visible="usageColumnSettingsOpen"
              :items="usageColumnSettingsItems"
              :default-items="defaultUsageColumnItems"
              :title="t('templates.columns.settings')"
              :list-aria-label="t('templates.columns.settings')"
              :show-label="t('templates.filters.show')"
              :restore-label="t('templates.filters.restore')"
              @change="onUsageColumnSettingsChanged"
            >
              <a-tooltip :content="t('templates.columns.settings')">
                <a-button class="app-btn-neutral templates-icon-button" :aria-label="t('templates.columns.settings')" :title="t('templates.columns.settings')"><IconSettings /></a-button>
              </a-tooltip>
            </ColumnSettingsPopover>
            <ColumnSettingsPopover
              v-else
              v-model:visible="configColumnSettingsOpen"
              :items="configColumnSettingsItems"
              :default-items="defaultConfigColumnItems"
              :title="t('templates.columns.settings')"
              :list-aria-label="t('templates.columns.settings')"
              :show-label="t('templates.filters.show')"
              :restore-label="t('templates.filters.restore')"
              @change="onConfigColumnSettingsChanged"
            >
              <a-tooltip :content="t('templates.columns.settings')">
                <a-button class="app-btn-neutral templates-icon-button" :aria-label="t('templates.columns.settings')" :title="t('templates.columns.settings')"><IconSettings /></a-button>
              </a-tooltip>
            </ColumnSettingsPopover>
          </div>
        </div>

        <div class="table-region">
          <a-table
            row-key="id"
            :columns="usage ? usageColumns : configColumns"
            :data="usage ? usagePagedRows : configPagedRows"
            :bordered="false"
            :pagination="false"
            :stripe="false"
            :scroll="{ x: usage ? usageHorizontalWidth : configHorizontalWidth }"
            @sorter-change="handleSort"
          >
            <template #empty><a-empty :description="noMatch ? t('templates.noMatch') : t('templates.empty')" /></template>
            <template #usageField="{ record, column }">{{ usageCellText(record as TemplateRecord, String(column.dataIndex)) }}</template>
            <template #configField="{ record, column }">
              <AppStatusTag
                v-if="column.dataIndex === 'status'"
                :role="statusRole(String(record.status), 'templates')"
                :label="configCellText(record as TemplateRecord, 'status')"
              />
              <span v-else>{{ configCellText(record as TemplateRecord, String(column.dataIndex) as ConfigKey) }}</span>
            </template>
            <template #actions="{ record }">
              <div class="row-actions">
                <a-button type="text" @click="open(record as TemplateRecord, false)">{{ t('templates.view') }}</a-button>
                <a-button v-if="!usage && record.status === 'draft'" type="text" @click="open(record as TemplateRecord)">{{ t('templates.edit') }}</a-button>
              </div>
            </template>
          </a-table>
        </div>
        <AppPagination v-model:current="current" v-model:page-size="pageSize" :total="usage ? usageResultRows.length : configResultRows.length" />
      </section>
    </template>
    <section v-else class="editor-panel">
      <div class="editor-actions">
        <a-button class="app-btn-neutral" @click="close">{{ t('templates.back') }}</a-button>
        <a-button v-if="editing" type="primary" @click="save">{{ t('templates.save') }}</a-button>
      </div>

      <template v-if="editing">
        <AppFormLayout>
          <a-form :model="selected" layout="vertical">
            <a-form-item v-for="field in ['name','description','version'] as const" :key="field" :field="field" :required="field !== 'description'" :data-template-name="field === 'name' ? '' : undefined">
              <template #label><AppFieldLabel :text="t(`templates.${field}`)" /></template>
              <a-input v-model="selected[field]" :aria-label="t(`templates.${field}`)" />
            </a-form-item>
            <div class="entry-toolbar">
              <h2>{{ t('templates.entries') }}</h2>
              <a-button @click="selected.entries.push({ id: String(Date.now()), name: '', format: 'text', note: '' })"><template #icon><IconPlus /></template>{{ t('templates.add') }}</a-button>
            </div>
            <div v-for="(entry,index) in selected.entries" :key="entry.id" class="entry-fields">
              <a-form-item><template #label><AppFieldLabel :text="t('templates.item')" /></template><a-input v-model="entry.name" :aria-label="t('templates.item')" /></a-form-item>
              <a-form-item><template #label><AppFieldLabel :text="t('templates.format')" /></template><a-select v-model="entry.format" :aria-label="t('templates.format')"><a-option v-for="format in ['text','number','table','rich']" :key="format" :value="format">{{ t(`templates.${format}`) }}</a-option></a-select></a-form-item>
              <a-form-item><template #label><AppFieldLabel :text="t('templates.note')" /></template><a-input v-model="entry.note" :aria-label="t('templates.note')" /></a-form-item>
              <a-button type="text" status="danger" @click="selected.entries.splice(index,1)">{{ t('templates.remove') }}</a-button>
            </div>
            <a-empty v-if="!selected.entries.length" :description="t('templates.empty')" />
          </a-form>
        </AppFormLayout>
      </template>
      <template v-else>
        <AppDetailList :fields="(usage ? ['name','type','version','project','user','used'] as const : ['name','description','version'] as const).map(key => ({ key, label: t(`templates.${key}`), value: key === 'type' ? t(`templates.${selected!.type}`) : selected![key] || '—' }))" />
        <h2 v-if="!usage" class="entry-heading">{{ t('templates.entries') }}</h2>
        <div v-for="entry in selected.entries" :key="entry.id" class="entry-fields">
          <AppDetailList :fields="[{ key: 'name', label: t('templates.item'), value: entry.name || '—' }, { key: 'format', label: t('templates.format'), value: t(`templates.${entry.format}`) }, { key: 'note', label: t('templates.note'), value: entry.note || '—' }]" />
        </div>
        <a-empty v-if="!usage && !selected.entries.length" :description="t('templates.empty')" />
      </template>
    </section>
    <ConfirmDialog unsaved v-model:visible="discard" :title="t('templates.leave')" @confirm="selected = undefined; discard = false" />
    <ConfirmDialog
      :visible="usageExportOpen"
      icon="info"
      :title="t('templates.exportNotice.title')"
      :description="[t('templates.exportNotice.line1'), t('templates.exportNotice.line2')]"
      :cancel-text="t('templates.exportNotice.cancel')"
      :ok-text="t('templates.exportNotice.confirm')"
      :ok-loading="usageExporting"
      :cancel-disabled="usageExporting"
      :dismissible="!usageExporting"
      @update:visible="usageExportOpen = $event"
      @confirm="confirmUsageExport"
    />
  </section>
</template>

<style scoped>
.templates-page { display: flex; flex-direction: column; gap: var(--mt-ds-space-3); min-width: 0; padding: 0; color: var(--mt-ds-text); }
/* 类型 tab 是筛选面板内的首行，不再单独占一块白面板 */
.template-tabs { flex: 0 0 100%; width: 100%; min-width: 0; }
.template-tabs :deep(.arco-tabs-content) { display: none; }
.template-tabs :deep(.arco-tabs-nav) { margin-bottom: 0; }
/* 筛选区布局统一走 global.css 的 app-filter-strip / app-filter-unit / app-filter-actions */
.filter-panel { padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); border-radius: var(--mt-ds-control-radius); }
.editor-actions { display: flex; flex-wrap: wrap; gap: var(--mt-ds-space-2); }
.list-panel, .editor-panel { min-width: 0; padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); border-radius: var(--mt-ds-control-radius); }
.table-region { min-width: 0; overflow-x: auto; }
.row-actions { display: flex; gap: var(--mt-ds-space-3); }
.row-actions :deep(.arco-btn) { padding: 0; color: var(--app-color-primary); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-th), :deep(.arco-table-td), :deep(.arco-tag) { font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
.editor-actions { justify-content: flex-end; margin-bottom: var(--mt-ds-space-4); }
.entry-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--mt-ds-space-3); margin: var(--mt-ds-space-6) 0 var(--mt-ds-space-4); }
h2 { margin: 0; font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
.entry-heading { margin: var(--mt-ds-space-6) 0 var(--mt-ds-space-4); }
.entry-fields { padding: var(--mt-ds-space-4) 0; border-top: 1px solid var(--app-divider); }
/* 窄屏流式布局由 global.css 的 .app-filter-strip 媒体查询统一处理 */

/* 列表工具栏：左上操作按钮、右上列设置（DESIGN.md · 分项管理列表 / Icon-only toolbar controls） */
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: var(--mt-ds-space-4); }
.list-toolbar__left, .list-toolbar__right { display: flex; align-items: center; gap: 8px; min-width: 0; }
.templates-icon-button { display: inline-grid; width: 32px; height: 32px; padding: 0; place-items: center; }

/* 表格：白底、无外框、无斑马纹、行间单线；表头与数据均 400 字重，两视图共用 */
.list-panel :deep(.arco-table), .list-panel :deep(.arco-table-container) { border: 0; }
.list-panel :deep(.arco-table-th) {
  height: 50px; padding: 0; border-bottom: 1px solid var(--app-divider);
  color: var(--color-text-1); background: var(--app-table-header);
  font-size: 14px; font-weight: 400; line-height: 22px; white-space: nowrap; text-align: left;
}
.list-panel :deep(.arco-table-td) {
  height: 50px; padding: 0; border-bottom: 1px solid var(--app-divider);
  background: var(--app-surface); font-size: 14px; font-weight: 400; line-height: 22px;
  white-space: nowrap; text-align: left;
}
/* 单元格内边距只由内层 .arco-table-cell 提供 12px：Arco 默认的 7px/16px 会与 td 的 padding 叠加，
   把 52px 行高撑到 63px。表头与数据行共用 12px 左内边距，文字左缘对齐。 */
.list-panel :deep(.arco-table-th .arco-table-cell),
.list-panel :deep(.arco-table-td .arco-table-cell) { padding: 0 12px; align-items: center; }
.list-panel :deep(.arco-table-tr:hover .arco-table-td) { background: var(--color-fill-1); }
.list-panel :deep(.arco-table .arco-space) { flex-wrap: nowrap; gap: var(--mt-ds-space-3) !important; }
</style>

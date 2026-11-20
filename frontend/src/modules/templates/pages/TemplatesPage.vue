<script setup lang="ts">
import { useSamePageNavigation } from '../../../shared/composables/samePageNavigation';
import { computed, reactive, ref, watch, toRaw } from 'vue';
import { useRoute, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { type TableColumnData, type FileItem, Message } from '@arco-design/web-vue';
import {
  IconFolder, IconPlus, IconSearch, IconRefresh, IconDownload, IconUpload, IconFilter, IconSettings, IconMore,
} from '@arco-design/web-vue/es/icon';
import TemplateDetail from '../components/TemplateDetail.vue';
import VehicleTemplateEditor from '../components/VehicleTemplateEditor.vue';
import TemplateUsageDetail from '../components/TemplateUsageDetail.vue';
import { USAGE_KEYS, usageRecords, type UsageKey, type TemplateUsageRecord } from '../data/usage';
import AppDetailHeader from '../../../design/components/AppDetailHeader.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import { statusRole } from '../../../shared/status';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { useTaskCenterStore } from '../../task-center/stores/taskCenter';
import { useUserProfileStore } from '../../../app/stores/userProfile';
import { makeTemplateExport } from '../data/export';
import { makeTemplateImportTemplate, parseTemplateImportFile } from '../data/import';
import {
  TEMPLATE_STATUS_CODES, TEMPLATE_REGION_CODES, TEMPLATE_COUNTRY_CODES, TEMPLATE_VEHICLE_TYPE_CODES,
  templateRecords as records, type TemplateRecord,
} from '../data/templates';

const { t, te, locale } = useI18n();
const route = useRoute();
const usage = computed(() => route.params.section === 'usage');
const usageDetailId = computed(() => usage.value && typeof route.query.record === 'string' ? route.query.record : '');
const usageDetail = computed(() => usageRecords.find(row => row.id === usageDetailId.value));

function usageDetailLocation(id: string) {
  return { name: 'templates', params: { section: 'usage' }, query: { record: id } };
}
const taskCenter = useTaskCenterStore();
const userProfile = useUserProfileStore();
const currentUser = computed(() => userProfile.profile.displayName);
// 状态外观由 AppStatusTag 统一承载；业务枚举 → 语义角色见 src/shared/status.ts。
const types = ['vehicle', 'technical', 'testing', 'report', 'certificate'];

/* 共享列表状态：两个视图的筛选结果 computed 与 watch 都在下方，
   这些 ref 必须先完成初始化，否则 setup 期间 watch 求值会落入暂时性死区。 */
const active = ref('vehicle');
const current = ref(1);
const pageSize = ref(10);
const selected = ref<TemplateRecord>();
const editing = ref(false);
const copying = ref(false);
const baseline = ref('');
const discard = ref(false);

/** 2026-11-16 用户裁决：5 个类型 tab 统一一套列 / 筛选 / 状态机 / 行操作 / 工具栏。 */
type ViewMode = 'submitter' | 'approver';
/** 审批中行的可见操作由工具栏视角切换控件决定，不按行的提交人字段判定。 */
const viewMode = ref<ViewMode>('submitter');

/* 时间口径：导出任务时间戳精确到秒，导入任务与文件名按客户端日历日期。 */
function pad2(value: number): string { return String(value).padStart(2, '0'); }
function dateStamp(date: Date): string {
  return `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}${pad2(date.getHours())}${pad2(date.getMinutes())}${pad2(date.getSeconds())}`;
}
function clockText(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
}
function dayText(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/* ---------------------------------------------- 使用记录字段全集
   筛选条件、表格列、列设置、导出共用同一套 key 与文案；显示文本走 usageCellText，
   排序与导出都以显示文本为准，枚举不会被按 code 排序。 */
function usageLabel(key: UsageKey): string {
  if (key === 'version') return t('templates.versionShort');
  if (key === 'taskId') return t('executionList.id');
  if (key === 'templateId') return t('templateUsage.templateId');
  if (key === 'type') return t('templateUsage.type');
  return t(`templates.${key}`);
}
function usageCellText(row: TemplateUsageRecord, key: string): string {
  if (key === 'type') return t(`templates.${row.type}`);
  return row[key as UsageKey] || '—';
}

/* ---------------------------------------------- 使用记录筛选 / 列 / 排序 */
const defaultUsageFilterSettings: { key: UsageKey; visible: boolean; disabled: boolean }[] =
  USAGE_KEYS.map(key => ({ key, visible: key !== 'user' && key !== 'used', disabled: key === 'name' }));
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

const USAGE_WIDTHS: Record<UsageKey, number> = { templateId: 145, name: 200, type: 160, version: 128, taskId: 150, user: 120, used: 180 };
const USAGE_ACTION_WIDTH = 160;
const defaultUsageColumnSettings: { key: UsageKey; visible: boolean; disabled: boolean }[] =
  USAGE_KEYS.map(key => ({ key, visible: true, disabled: key === 'name' }));
const usageColumnSettings = ref(defaultUsageColumnSettings.map(setting => ({ ...setting })));
const usageColumnSettingsOpen = ref(false);
const visibleUsageColumnKeys = computed<UsageKey[]>(() => usageColumnSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const usageColumnSettingsItems = computed<ColumnSettingsItem[]>(() => usageColumnSettings.value.map(setting => ({ ...setting, label: usageLabel(setting.key) })));
const defaultUsageColumnItems = computed<ColumnSettingsItem[]>(() => defaultUsageColumnSettings.map(setting => ({ ...setting, label: usageLabel(setting.key) })));
function onUsageColumnSettingsChanged(next: ColumnSettingsItem[]) {
  usageColumnSettings.value = next.map(item => ({ key: item.key as UsageKey, visible: item.visible, disabled: item.key === 'name' }));
  if (usageSortField.value && !visibleUsageColumnKeys.value.includes(usageSortField.value)) {
    usageSortField.value = '';
    usageSortDirection.value = '';
  }
}

type SortDirection = '' | 'ascend' | 'descend';
const usageSortField = ref<UsageKey | ''>('');
const usageSortDirection = ref<SortDirection>('');
function compareUsageRows(a: TemplateUsageRecord, b: TemplateUsageRecord, key: UsageKey, direction: 'ascend' | 'descend'): number {
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
      sorter: true,
    },
  })),
  { title: t('templates.actions'), dataIndex: 'actions', slotName: 'actions', width: USAGE_ACTION_WIDTH, fixed: 'right' as const },
]);
const usageHorizontalWidth = computed(() => visibleUsageColumnKeys.value.reduce((sum, key) => sum + USAGE_WIDTHS[key], USAGE_ACTION_WIDTH));

const usageResultRows = computed<TemplateUsageRecord[]>(() => {
  const rows = usageRecords.filter(row => USAGE_KEYS.every((key) => {
    const value = usageApplied.value[key]?.trim();
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

/* ---------------------------------------------- 使用记录导出（DESIGN.md · Batch export baseline） */
const usageExportOpen = ref(false);
const usageExporting = ref(false);
function requestUsageExport() {
  if (usageExporting.value) return;
  if (!usageResultRows.value.length) { Message.info(t('templates.exportEmpty')); return; }
  usageExportOpen.value = true;
}
async function confirmUsageExport() {
  if (usageExporting.value || !usageResultRows.value.length) return;
  usageExporting.value = true;
  try {
    const headers = visibleUsageColumnKeys.value.map(key => ({ key, label: usageLabel(key) }));
    const blob = await makeTemplateExport({
      rows: usageResultRows.value,
      headers,
      sheetName: t('templates.usage'),
      display: usageCellText,
    });
    const now = new Date();
    taskCenter.addDownloadTask({
      id: `dl-${now.getTime()}`,
      module: 'templates',
      fileStamp: dateStamp(now),
      operator: t('templates.exportOperator'),
      time: clockText(now),
      status: 'processing',
      progress: 92,
      fileUrl: URL.createObjectURL(blob),
      fileName: `${t('templates.usage')}_${dayText(now)}.xlsx`,
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

/* ---------------------------------------------- 模版配置（2026-11-16 user decision）
   筛选 / 状态 / 行操作为 5 个 tab 统一契约；列表列按 tab 决定：
   车型配置不显示「模版类型 / 法规编号」，技术资料两者都显示，测试记录 / 报告 / 证书只显示法规编号。
   基础列含 适用区域 / 适用国家 / 适用车辆类型、人员字段（创建人 / 更新人默认隐藏），
   版本号为「最新版本号」、状态为「模版状态」。 */
type ConfigColumnKey = string;
type ConfigFilterKey = string;
const BASE_COLUMN_KEYS: readonly string[] = [
  'name', 'description', 'region', 'country', 'vehicleType',
  'status', 'version', 'createdBy', 'created', 'updatedBy', 'updated',
];
const AFTER_DESCRIPTION = BASE_COLUMN_KEYS.slice(2);
const COLUMN_KEYS_BY_TYPE: Record<string, readonly string[]> = {
  vehicle: BASE_COLUMN_KEYS,
  technical: ['name', 'description', 'type', 'regulation', ...AFTER_DESCRIPTION],
  testing: ['name', 'description', 'regulation', ...AFTER_DESCRIPTION],
  report: ['name', 'description', 'regulation', ...AFTER_DESCRIPTION],
  certificate: ['name', 'description', 'regulation', ...AFTER_DESCRIPTION],
};
const activeColumnKeys = computed<readonly string[]>(() => COLUMN_KEYS_BY_TYPE[active.value] ?? BASE_COLUMN_KEYS);
const CONFIG_FILTER_KEYS: readonly string[] = [
  'search', 'status', 'region', 'country', 'vehicleType',
  'version', 'createdBy', 'created', 'updatedBy', 'updated',
];
const CONFIG_SELECT_KEYS: readonly string[] = ['status', 'region', 'country', 'vehicleType', 'version'];
const CONFIG_DATE_KEYS: readonly string[] = ['created', 'updated'];
const CONFIG_WIDTHS: Record<ConfigColumnKey, number> = {
  name: 200, description: 240, type: 140, regulation: 160, region: 130, country: 130, vehicleType: 150,
  status: 120, version: 140, createdBy: 120, created: 180, updatedBy: 120, updated: 180,
};
const CONFIG_ACTION_WIDTH = 200;

/** 字段名与 i18n key 一一对应；使用记录视图的「版本号」由 usageLabel 单独隔离。 */
function configLabel(key: string): string { return t(`templates.${key}`); }
/** 枚举 code → 当前语言文案；未登记的 code 原样呈现，不把 i18n key 泄漏到单元格。 */
function optionText(group: 'regions' | 'countries' | 'vehicleTypes', code: string): string {
  if (!code) return '—';
  const key = `templates.${group}.${code}`;
  return te(key) ? t(key) : code;
}
function configCellText(row: TemplateRecord, key: string): string {
  if (key === 'type') return t(`templates.${row.type}`);
  if (key === 'status') return t(`templates.${row.status}`);
  if (key === 'region') return optionText('regions', row.region);
  if (key === 'country') return optionText('countries', row.country);
  if (key === 'vehicleType') return optionText('vehicleTypes', row.vehicleType);
  return String(row[key as keyof TemplateRecord] ?? '') || '—';
}
function configOptions(key: ConfigFilterKey): readonly string[] {
  if (key === 'status') return TEMPLATE_STATUS_CODES;
  if (key === 'region') return TEMPLATE_REGION_CODES;
  if (key === 'country') return TEMPLATE_COUNTRY_CODES;
  if (key === 'vehicleType') return TEMPLATE_VEHICLE_TYPE_CODES;
  if (key === 'version') return [...new Set(records.value.map(row => row.version))];
  return [];
}
function configOptionLabel(key: ConfigFilterKey, value: string): string {
  if (key === 'region') return optionText('regions', value);
  if (key === 'country') return optionText('countries', value);
  if (key === 'vehicleType') return optionText('vehicleTypes', value);
  if (key === 'version') return value;
  return t(`templates.${value}`);
}

/* 筛选 / 列设置：前 5 个筛选默认可见、后 5 个默认隐藏，列默认隐藏创建人 / 更新人，首项均锁定。
   隐藏筛选字段时同步清掉草稿与已应用条件；隐藏当前排序列时清空排序状态。 */
type ConfigSetting = { key: string; visible: boolean; disabled: boolean };
const defaultConfigFilterSettings: ConfigSetting[] = CONFIG_FILTER_KEYS.map((key, index) => ({ key, visible: index < 5, disabled: index === 0 }));
function buildColumnDefaults(keys: readonly string[]): ConfigSetting[] {
  return keys.map((key, index) => ({ key, visible: key !== 'createdBy' && key !== 'updatedBy', disabled: index === 0 }));
}
// 各 tab 列集合不同，设置按 tab 独立保存；隐藏创建人 / 更新人、首列锁定对所有 tab 一致。
const columnSettingsByType = ref<Record<string, ConfigSetting[]>>(
  Object.fromEntries(Object.entries(COLUMN_KEYS_BY_TYPE).map(([type, keys]) => [type, buildColumnDefaults(keys)])),
);
const configFilterSettings = ref(defaultConfigFilterSettings.map(item => ({ ...item })));
const configColumnSettings = computed<ConfigSetting[]>(() => columnSettingsByType.value[active.value] ?? buildColumnDefaults(BASE_COLUMN_KEYS));
const configFilterSettingsOpen = ref(false);
const configColumnSettingsOpen = ref(false);
const visibleConfigFilterKeys = computed<string[]>(() => configFilterSettings.value.filter(item => item.visible).map(item => item.key));
const visibleConfigColumnKeys = computed<string[]>(() => configColumnSettings.value.filter(item => item.visible).map(item => item.key));
const configFilterSettingsItems = computed<ColumnSettingsItem[]>(() => configFilterSettings.value.map(item => ({ ...item, label: configLabel(item.key) })));
const configColumnSettingsItems = computed<ColumnSettingsItem[]>(() => configColumnSettings.value.map(item => ({ ...item, label: configLabel(item.key) })));
const defaultConfigFilterItems = computed<ColumnSettingsItem[]>(() => defaultConfigFilterSettings.map(item => ({ ...item, label: configLabel(item.key) })));
const defaultConfigColumnItems = computed<ColumnSettingsItem[]>(() => buildColumnDefaults(activeColumnKeys.value).map(item => ({ ...item, label: configLabel(item.key) })));

const configDraft = reactive<Partial<Record<string, string>>>({});
const configApplied = ref<Partial<Record<string, string>>>({});
const configHasApplied = computed(() => CONFIG_FILTER_KEYS.some(key => Boolean(configApplied.value[key])));
function applyConfigFilters() { configApplied.value = { ...configDraft }; current.value = 1; }
function resetConfigFilters() {
  for (const key of CONFIG_FILTER_KEYS) configDraft[key] = '';
  configApplied.value = {};
  current.value = 1;
}
function onConfigFilterSettingsChanged(next: ColumnSettingsItem[]) {
  const locked = CONFIG_FILTER_KEYS[0];
  configFilterSettings.value = next.map(item => ({ key: item.key, visible: item.visible, disabled: item.key === locked }));
  const visible = new Set(visibleConfigFilterKeys.value);
  for (const key of CONFIG_FILTER_KEYS) {
    if (visible.has(key)) continue;
    delete configDraft[key];
    delete configApplied.value[key];
  }
  current.value = 1;
}
function onConfigColumnSettingsChanged(next: ColumnSettingsItem[]) {
  const locked = activeColumnKeys.value[0];
  columnSettingsByType.value[active.value] = next.map(item => ({ key: item.key, visible: item.visible, disabled: item.key === locked }));
  if (configSortField.value && !visibleConfigColumnKeys.value.includes(configSortField.value)) {
    configSortField.value = '';
    configSortDirection.value = '';
  }
}

/* 排序：比较值取显示文本；数据层在过滤后、分页前重排，Arco 与数据层共用同一比较函数，
   sortOrder 受控，列设置重算与翻页都不丢方向。 */
const configSortField = ref<ConfigColumnKey | ''>('');
const configSortDirection = ref<SortDirection>('');
function compareConfigRows(a: TemplateRecord, b: TemplateRecord, key: ConfigColumnKey, direction: 'ascend' | 'descend'): number {
  const x = configCellText(a, key);
  const y = configCellText(b, key);
  const result = x.localeCompare(y, String(locale.value), { numeric: true, sensitivity: 'base' });
  return direction === 'descend' ? -result : result;
}
function handleConfigSort(dataIndex: unknown, direction: unknown) {
  if (usage.value || typeof dataIndex !== 'string' || !activeColumnKeys.value.includes(dataIndex)) return;
  const active = direction === 'ascend' || direction === 'descend';
  configSortField.value = active ? dataIndex : '';
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
  const rows = records.value.filter(row => row.type === active.value && CONFIG_FILTER_KEYS.every((key) => {
    const value = configApplied.value[key];
    if (!value) return true;
    if (key === 'search') return `${row.name} ${row.description}`.toLowerCase().includes(value.toLowerCase());
    const cell = String(row[key as keyof TemplateRecord] ?? '');
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

/* ---------------------------------------------- 配置态导出（DESIGN.md · Batch export baseline） */
const configExportOpen = ref(false);
const configExporting = ref(false);
function requestConfigExport() {
  if (configExporting.value) return;
  if (!configResultRows.value.length) { Message.info(t('templates.configExportEmpty')); return; }
  configExportOpen.value = true;
}
async function confirmConfigExport() {
  if (configExporting.value || !configResultRows.value.length) return;
  configExporting.value = true;
  try {
    const headers = visibleConfigColumnKeys.value.map(key => ({ key, label: configLabel(key) }));
    const blob = await makeTemplateExport({
      rows: configResultRows.value,
      headers,
      sheetName: t('templates.config'),
      display: (row, key) => configCellText(row, key),
    });
    const now = new Date();
    taskCenter.addDownloadTask({
      id: `dl-${now.getTime()}`,
      module: 'templates',
      fileStamp: dateStamp(now),
      operator: t('templates.exportOperator'),
      time: clockText(now),
      status: 'processing',
      progress: 92,
      fileUrl: URL.createObjectURL(blob),
      fileName: `${t('templates.config')}_${dayText(now)}.xlsx`,
    });
    configExportOpen.value = false;
    Message.success(t('templates.exportCreated'));
    taskCenter.open('download');
  } catch {
    Message.error(t('templates.exportFailed'));
  } finally {
    configExporting.value = false;
  }
}

/* ---------------------------------------------- 配置态导入（DESIGN.md · Batch import baseline）
   打开弹窗即预生成 4 列导入模版，下载动作从用户点击同步发起；提交后按当前类型 tab
   补齐系统字段、写入主数据，并登记到「导入导出–导入数据」。 */
const importOpen = ref(false);
const importing = ref(false);
const importFiles = ref<FileItem[]>([]);
const importTemplateBlob = ref<Blob | null>(null);
const importLabels = computed(() => [`${t('templates.name')} *`, t('templates.description'), t('templates.regulation'), t('templates.version')]);
function openImport() {
  importOpen.value = true;
  importFiles.value = [];
  importTemplateBlob.value = null;
  void makeTemplateImportTemplate(importLabels.value).then(blob => { importTemplateBlob.value = blob; });
}
function onImportFilesChange(fileList: FileItem[]) { importFiles.value = fileList.slice(-1); }
function downloadImportTemplate() {
  if (!importTemplateBlob.value) { Message.error(t('templates.importFailed')); return; }
  const url = URL.createObjectURL(importTemplateBlob.value);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${t('templates.importTemplate')}.xlsx`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
async function confirmImport() {
  if (importing.value) return;
  const file = importFiles.value[0]?.file;
  if (!file) { Message.warning(t('templates.importEmpty')); return; }
  if (!file.name.toLowerCase().endsWith('.xlsx')) { Message.error(t('templates.importInvalid')); return; }
  if (file.size > 20 * 1024 * 1024) { Message.error(t('templateImport.size')); return; }
  importing.value = true;
  try {
    const rows = await parseTemplateImportFile(file);
    if (!rows.length) { Message.error(t('templates.importNoRows')); return; }
    const now = new Date();
    const created: TemplateRecord[] = rows.map((entry, index) => ({
      id: `TPL-IMP-${now.getTime()}-${index}`,
      type: active.value,
      name: entry.name,
      description: entry.description || '—',
      regulation: entry.regulation || '—',
      region: TEMPLATE_REGION_CODES[0],
      country: TEMPLATE_COUNTRY_CODES[0],
      vehicleType: TEMPLATE_VEHICLE_TYPE_CODES[0],
      version: entry.version,
      status: 'submitting',
      createdBy: currentUser.value,
      created: dayText(now),
      updatedBy: currentUser.value,
      updated: dayText(now),
      submitter: currentUser.value,
      entries: [],
    }));
    records.value.unshift(...created);
    taskCenter.addImportTask({
      id: `imp-${now.getTime()}`,
      module: 'templates',
      fileStamp: `${now.getFullYear()}${pad2(now.getMonth() + 1)}${pad2(now.getDate())}`,
      operator: currentUser.value,
      time: clockText(now),
      status: 'processing',
      progress: 60,
      total: rows.length,
      ok: rows.length,
      fail: 0,
    });
    importOpen.value = false;
    current.value = 1;
    Message.success(t('templates.importSuccess'));
    taskCenter.open('import');
  } catch {
    Message.error(t('templates.importFailed'));
  } finally {
    importing.value = false;
  }
}

/* ---------------------------------------------- 状态机与行操作（2026-11-16 user decision）
   5 个类型 tab 统一：5 态对应固定操作集；审批中的提交人 / 审批人视角由工具栏切换控件决定
   （提交人：详情 / 撤回 / 复制；审批人：详情 / 审批 / 复制）。
   超过两个动作时按 DESIGN.md · Row action overflow，前两个直显，其余收进 hover 触发的「…」下拉，
   删除项为 danger 语义色。 */
type RowAction = 'view' | 'edit' | 'copy' | 'delete' | 'withdraw' | 'approve';
function configRowActions(row: TemplateRecord): RowAction[] {
  switch (row.status) {
    case 'submitting': return ['view', 'edit', 'copy', 'delete'];
    // 审批中两种视角都额外支持删除：前 2 个动作直显，复制 / 删除进「…」溢出（删除为 danger）。
    case 'reviewing': return viewMode.value === 'submitter'
      ? ['view', 'withdraw', 'copy', 'delete']
      : ['view', 'approve', 'copy', 'delete'];
    case 'completed': return ['view', 'copy', 'delete'];
    case 'rejected': return ['view', 'edit', 'copy', 'delete'];
    case 'withdrawn': return ['view', 'edit', 'copy', 'delete'];
    default: return ['view'];
  }
}
function directActions(row: TemplateRecord): RowAction[] { return configRowActions(row).slice(0, 2); }
function overflowActions(row: TemplateRecord): RowAction[] { return configRowActions(row).slice(2); }
function actionLabel(action: RowAction): string { return t(`templates.${action}`); }

const deleteTarget = ref<TemplateRecord>();
const withdrawTarget = ref<TemplateRecord>();
const approveTarget = ref<TemplateRecord>();
const approveResult = ref('');
const approveOpinion = ref('');

function copyRow(row: TemplateRecord) {
  const now = new Date();
  const copy: TemplateRecord = {
    ...structuredClone(toRaw(row)),
    id: `TPL-${now.getTime()}`,
    name: row.name,
    history: [],
    events: [],
    status: 'submitting',
    createdBy: currentUser.value,
    created: dayText(now),
    updatedBy: currentUser.value,
    updated: dayText(now),
    submitter: currentUser.value,
  };
  selected.value = copy;
  editing.value = true;
  copying.value = true;
  baseline.value = JSON.stringify(copy);
}
function runAction(action: RowAction, row: TemplateRecord) {
  if (action === 'view') { open(row, false); return; }
  if (action === 'edit') { open(row, true); return; }
  if (action === 'copy') { copyRow(row); return; }
  if (action === 'delete') { deleteTarget.value = row; return; }
  if (action === 'withdraw') { withdrawTarget.value = row; return; }
  approveResult.value = '';
  approveOpinion.value = '';
  approveTarget.value = row;
}
function onRowMoreSelect(value: unknown, row: TemplateRecord) {
  if (typeof value === 'string') runAction(value as RowAction, row);
}
function closeDelete(open: boolean) { if (!open) deleteTarget.value = undefined; }
function closeWithdraw(open: boolean) { if (!open) withdrawTarget.value = undefined; }
function confirmDelete() {
  const target = deleteTarget.value;
  if (!target) return;
  records.value = records.value.filter(row => row.id !== target.id);
  deleteTarget.value = undefined;
  Message.success(t('templates.deleted'));
}
function confirmWithdraw() {
  const target = withdrawTarget.value;
  const row = target && records.value.find(item => item.id === target.id);
  if (row) {
    (row.events ||= []).push({ action: 'withdraw', actor: currentUser.value, time: clockText(new Date()) });
    row.status = 'withdrawn';
    row.updatedBy = currentUser.value;
    row.updated = dayText(new Date());
  }
  withdrawTarget.value = undefined;
  Message.success(t('templates.withdrawnMsg'));
}
function confirmApprove() {
  if (!approveResult.value || !approveOpinion.value.trim()) { Message.error(t('templates.approveRequired')); return; }
  const target = approveTarget.value;
  const row = target && records.value.find(item => item.id === target.id);
  if (row) {
    (row.events ||= []).push({ action: approveResult.value === 'pass' ? 'approved' : 'rejected', actor: currentUser.value, time: clockText(new Date()), opinion: approveOpinion.value });
    row.status = approveResult.value === 'pass' ? 'completed' : 'rejected';
    row.updatedBy = currentUser.value;
    row.updated = dayText(new Date());
  }
  approveTarget.value = undefined;
  Message.success(t('templates.approveDone'));
}

/* ---------------------------------------------- 新增 / 编辑 / 详情与视图切换 */
// 同一列表页内切换类型 tab 保留已应用筛选（DESIGN.md · Jump-in filter params），仅重置页码；
// 切换到使用记录是另一个业务视图，重置两侧查询。
watch(active, () => {
  current.value = 1;
  // 列集合按 tab 不同：跨 tab 后若排序列已不存在则清掉排序，避免不可见列继续生效。
  if (configSortField.value && !activeColumnKeys.value.includes(configSortField.value)) {
    configSortField.value = '';
    configSortDirection.value = '';
  }
});
watch(usage, () => { resetConfigFilters(); resetUsageFilters(); current.value = 1; });
function open(row?: TemplateRecord, edit = true) {
  copying.value = false;
  const now = new Date();
  selected.value = row ? structuredClone(toRaw(row)) : {
    id: `TPL-${now.getTime()}`,
    type: active.value,
    name: '', description: '', regulation: '',
    region: '', country: '', vehicleType: '',
    version: '', status: 'submitting',
    createdBy: currentUser.value, created: dayText(now),
    updatedBy: currentUser.value, updated: dayText(now),
    submitter: currentUser.value,
    entries: [],
  };
  editing.value = edit;
  baseline.value = JSON.stringify(selected.value);
}
const dirty = computed(() => editing.value && selected.value && JSON.stringify(selected.value) !== baseline.value);
let resolveLeave: ((allow: boolean) => void) | undefined;
function requestLeave(): Promise<boolean> {
  if (!dirty.value) return Promise.resolve(true);
  return new Promise(resolve => { resolveLeave = resolve; discard.value = true; });
}
function finishLeave(allow: boolean) {
  const resolve = resolveLeave;
  resolveLeave = undefined;
  discard.value = false;
  resolve?.(allow);
}
async function close() { if (await requestLeave()) selected.value = undefined; }
useSamePageNavigation(close);
const vehicleEditor = ref<{ validate: () => Promise<boolean> }>();
async function save(submit = false) {
  if (submit && vehicleEditor.value && !await vehicleEditor.value.validate()) return;
  const row = selected.value;
  if (submit && row && (!row.region || !row.country || !row.vehicleType.trim() || row.entries.length === 0 || row.entries.some(e => !e.name.trim() || !e.format || (e.format === 'table' && !e.columns?.length)))) { Message.error(t('templates.required')); return; }
  if (!row || (submit && (!row.name.trim() || !row.version.trim() || row.entries.some(entry => !entry.name.trim())))) {
    Message.error(t('templates.required'));
    document.querySelector<HTMLInputElement>('[data-template-name] input')?.focus();
    return;
  }
  const previous = records.value.find(item => item.id === row.id);
  if (previous && previous.version !== row.version) { const snapshot = structuredClone(toRaw(previous)); delete snapshot.history; row.history = [...(previous.history || []), snapshot]; }
  const now = clockText(new Date());
  (row.events ||= []).push({ action: previous ? (submit ? 'submitted' : 'draft') : 'created', actor: currentUser.value, time: now });
  if (!previous && submit) row.events.push({ action: 'submitted', actor: currentUser.value, time: now });
  row.updated = dayText(new Date());
  row.updatedBy = currentUser.value;
  row.status = submit ? 'reviewing' : 'submitting';
  const index = records.value.findIndex(item => item.id === row.id);
  if (index < 0) records.value.unshift(structuredClone(toRaw(row)));
  else records.value[index] = structuredClone(toRaw(row));
  selected.value = undefined;
  Message.success(t(submit ? 'templateEditor.submitted' : 'templates.saved'));
}
onBeforeRouteLeave(requestLeave);
onBeforeRouteUpdate(async () => {
  const allow = await requestLeave();
  if (allow) selected.value = undefined;
  return allow;
});
</script>

<template>
  <section class="templates-page">
    <TemplateUsageDetail v-if="usageDetailId" :record="usageDetail" />
    <template v-else-if="!selected">
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
              :placeholder="key === 'search' ? t('templates.searchPlaceholder') : t('templates.enter')"
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
            <template v-else>
              <a-button type="primary" @click="open()"><template #icon><IconPlus /></template>{{ t('templates.new') }}</a-button>
              <a-button class="app-btn-neutral" @click="openImport"><template #icon><IconUpload /></template>{{ t('templates.import') }}</a-button>
              <a-button class="app-btn-neutral" @click="requestConfigExport"><template #icon><IconDownload /></template>{{ t('templates.export') }}</a-button>
            </template>
          </div>
          <div class="list-toolbar__right">
            <template v-if="!usage">
              <a-select v-model="viewMode" class="view-mode-select" :aria-label="t('templates.viewMode')">
                <a-option value="submitter">{{ t('templates.submitterView') }}</a-option>
                <a-option value="approver">{{ t('templates.approverView') }}</a-option>
              </a-select>
            </template>
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
            <template #empty><a-empty :description="t(!usage && configHasApplied ? 'templates.noMatch' : 'templates.empty')" /></template>
            <template #usageField="{ record, column }">{{ usageCellText(record as TemplateUsageRecord, String(column.dataIndex)) }}</template>
            <template #configField="{ record, column }">
              <AppStatusTag
                v-if="column.dataIndex === 'status'"
                :role="statusRole(String(record.status), 'templates')"
                :label="configCellText(record as TemplateRecord, 'status')"
              />
              <span v-else>{{ configCellText(record as TemplateRecord, String(column.dataIndex)) }}</span>
            </template>
            <template #actions="{ record }">
              <div class="row-actions">
                <template v-if="usage">
                  <RouterLink class="usage-link" :to="usageDetailLocation(record.id)">{{ t('templates.view') }}</RouterLink>
                </template>
                <template v-else>
                  <a-button
                    v-for="action in directActions(record as TemplateRecord)"
                    :key="action"
                    type="text"
                    @click="runAction(action, record as TemplateRecord)"
                  >{{ actionLabel(action) }}</a-button>
                  <a-dropdown
                    v-if="overflowActions(record as TemplateRecord).length"
                    trigger="hover"
                    position="br"
                    popup-container="body"
                    content-class="row-more-dropdown"
                    @select="(value: unknown) => onRowMoreSelect(value, record as TemplateRecord)"
                  >
                    <button type="button" class="row-more" :aria-label="t('templates.more')" :title="t('templates.more')"><IconMore /></button>
                    <template #content>
                      <a-doption
                        v-for="action in overflowActions(record as TemplateRecord)"
                        :key="action"
                        :value="action"
                        :class="{ 'row-more-danger': action === 'delete' }"
                      >{{ actionLabel(action) }}</a-doption>
                    </template>
                  </a-dropdown>
                </template>
              </div>
            </template>
          </a-table>
        </div>
        <AppPagination v-model:current="current" v-model:page-size="pageSize" :total="usage ? usageResultRows.length : configResultRows.length" />
      </section>
    </template>
    <template v-else>
      <AppDetailHeader
        :ancestor-back="close"
        :ancestor-label="t('templates.title')"
        :current-label="editing ? (copying ? t('templateEditor.copyTitle') : records.some(r => r.id === selected!.id) ? t('templates.edit') : t('templates.new')) : t('templates.view')"
      >
        <template #actions>
          <a-button v-if="editing" class="template-outline" @click="close">{{ t('templates.cancel') }}</a-button>
          <a-button v-if="editing" class="template-outline" @click="save(false)">{{ t('templates.save') }}</a-button>
          <a-button v-if="editing" type="primary" @click="save(true)">{{ t('templateEditor.submit') }}</a-button>
        </template>
      </AppDetailHeader>
      <section class="editor-panel" :class="{ 'vehicle-editor-panel': editing || !usage }">
        <template v-if="editing">
          <VehicleTemplateEditor ref="vehicleEditor" :record="selected" :history="records" />

        </template>
        <template v-else>
          <TemplateDetail :record="selected" :records="records" />
        </template>
      </section>
    </template>

    <ConfirmDialog unsaved :visible="discard" :title="t('templates.leave')" @update:visible="!$event && finishLeave(false)" @confirm="finishLeave(true)" />
    <ConfirmDialog
      class="templates-export-dialog"
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
    <ConfirmDialog
      class="templates-export-dialog"
      :visible="configExportOpen"
      icon="info"
      :title="t('templates.configExportNotice.title')"
      :description="[t('templates.configExportNotice.line1'), t('templates.configExportNotice.line2')]"
      :cancel-text="t('templates.configExportNotice.cancel')"
      :ok-text="t('templates.configExportNotice.confirm')"
      :ok-loading="configExporting"
      :cancel-disabled="configExporting"
      :dismissible="!configExporting"
      @update:visible="configExportOpen = $event"
      @confirm="confirmConfigExport"
    />
    <ConfirmDialog
      :visible="Boolean(deleteTarget)"
      icon="warning"
      :title="t('templates.deleteTitle')"
      :description="t('templates.deleteWarning')"
      :cancel-text="t('templates.cancel')"
      :ok-text="t('templates.confirm')"
      @update:visible="closeDelete"
      @confirm="confirmDelete"
    />
    <ConfirmDialog
      :visible="Boolean(withdrawTarget)"
      icon="warning"
      :title="t('templates.withdrawTitle')"
      :description="t('templates.withdrawWarning')"
      :cancel-text="t('templates.cancel')"
      :ok-text="t('templates.confirm')"
      @update:visible="closeWithdraw"
      @confirm="confirmWithdraw"
    />

    <!-- 导入：4 列模版 round-trip，提交后登记到「导入导出–导入数据」 -->
    <a-drawer :visible="importOpen" :title="t('templateImport.title')" :width="560" :mask-closable="!importing" :esc-to-close="!importing" :closable="!importing" class="template-import-drawer" @cancel="!importing && (importOpen = false)">
      <div class="template-import-block">
        <a-upload draggable :disabled="importing" :auto-upload="false" :limit="1" :file-list="importFiles" :show-file-list="false" accept=".xlsx" @change="onImportFilesChange">
          <template #upload-button><div class="template-import-target"><IconFolder class="import-folder" /><p v-if="importFiles.length" class="selected-filename">{{ importFiles[0]?.name }}</p><p>{{ t('templateImport.hint') }}</p><a-button type="primary" :disabled="importing">{{ t(importFiles.length ? 'templateImport.reupload' : 'templateImport.upload') }}</a-button></div></template>
        </a-upload>
        <div class="template-import-notes"><h3>{{ t('templateImport.notes') }}</h3><ol><li v-for="key in ['format','size','required','fields','duplicates','errors']" :key="key">{{ t(`templateImport.${key}`) }}</li></ol></div>
        <a-button type="text" :disabled="!importTemplateBlob || importing" @click="downloadImportTemplate"><template #icon><IconDownload /></template>{{ t('templates.importTemplate') }}</a-button>
      </div>
      <template #footer><a-button class="app-btn-neutral" :disabled="importing" @click="importOpen = false">{{ t('templates.cancel') }}</a-button><a-button type="primary" :loading="importing" @click="confirmImport">{{ t('templates.import') }}</a-button></template>
    </a-drawer>

    <!-- 审批：结论 + 意见，确认后写入状态（不伪造服务端结果，动作发生在前端主数据） -->
    <a-modal
      :visible="Boolean(approveTarget)"
      :title="t('templates.approveTitle')"
      :width="'min(560px, calc(100vw - 32px))'"
      :ok-text="t('templates.confirm')"
      :cancel-text="t('templates.cancel')"
      @ok="confirmApprove"
      @cancel="approveTarget = undefined"
    >
      <div class="approve-field">
        <AppFieldLabel as="label" :text="t('templates.approveResult')" :colon="true" />
        <a-radio-group v-model="approveResult">
          <a-radio value="pass">{{ t('templates.approvePass') }}</a-radio>
          <a-radio value="reject">{{ t('templates.approveReject') }}</a-radio>
        </a-radio-group>
      </div>
      <div class="approve-field">
        <AppFieldLabel as="label" :text="t('templates.approveOpinion')" :colon="true" />
        <a-textarea
          v-model="approveOpinion"
          :placeholder="t('templates.approveOpinionPlaceholder')"
          :max-length="200"
          :auto-size="{ minRows: 3, maxRows: 5 }"
          show-word-limit
          allow-clear
        />
      </div>
    </a-modal>
  </section>
</template>

<style scoped>
:global(.template-import-drawer .arco-drawer) { max-width:100vw; }
:global(.template-import-drawer .arco-drawer-header) { height:56px; flex:none; padding:0 16px; background:var(--app-surface); }
:global(.template-import-drawer .arco-drawer-title) { font-size:var(--mt-ds-font-title); line-height:var(--mt-ds-line-title); font-weight:var(--mt-ds-weight-title); }
:global(.template-import-drawer .arco-drawer-body) { background:var(--app-fill-1); padding:16px; overflow-y:auto; min-height:0; }
:global(.template-import-drawer .arco-drawer-footer) { background:var(--app-surface); padding:16px; display:flex; justify-content:flex-end; gap:8px; flex:none; }
:global(.template-import-drawer .arco-drawer-footer .app-btn-neutral) { background:transparent; border:1px solid var(--app-control-border); }
:global(.template-import-drawer .slide-right-drawer-leave-active) { transition-timing-function:linear; }
.template-import-block { background:var(--app-surface); padding:16px; display:flex; flex-direction:column; gap:16px; border-radius:var(--mt-ds-control-radius); min-width:0; }
.template-import-block :deep(.arco-upload) { width:100%; }
.template-import-target { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; padding:32px 16px; border:1px dashed var(--app-control-border); background:var(--app-surface); cursor:pointer; }
.template-import-target p { margin:0; overflow-wrap:anywhere; }
.import-folder { font-size:32px; color:var(--app-color-primary); }
.selected-filename { max-width:100%; overflow-wrap:anywhere; }
.template-import-target :deep(.arco-btn) { width:auto; }
.template-import-block > :deep(.arco-btn) { align-self:flex-start; padding-left:0; }
.template-import-notes { padding:16px; background:var(--app-primary-light-bg); }
.template-import-notes h3 { margin:0 0 8px; font-size:var(--mt-ds-font-body); }
.template-import-notes ol { margin:0; padding-left:20px; line-height:var(--mt-ds-line-body); }

.template-outline { background: transparent; border: 1px solid var(--app-control-border); }
.editor-panel.vehicle-editor-panel { background: transparent; padding: 0; min-width:0; }

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
.row-actions { display: flex; align-items: center; gap: var(--mt-ds-space-3); }
.usage-link { color: var(--app-color-primary); font-weight: var(--mt-ds-weight-body); }
.usage-link, .usage-link:hover, .usage-link:focus-visible { text-decoration: none; }
.usage-link:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
.row-actions :deep(.arco-btn) { padding: 0; color: var(--app-color-primary); font-weight: var(--mt-ds-weight-body); }
/* 行操作溢出：24px IconMore 迷你按钮，hover 触发，弹层挂 body 走 global.css 的 .row-more-dropdown */
.row-more {
  display: inline-grid; width: 24px; height: 24px; padding: 0; place-items: center;
  border: 0; border-radius: 2px; background: transparent;
  color: var(--app-color-primary); cursor: pointer; font-size: 16px;
}
.row-more:hover { background: var(--color-fill-2); }
.row-more:focus-visible { outline: 2px solid var(--app-color-primary); outline-offset: 2px; }
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
/* flex: 0 0 32px 防止右上视角切换下拉把图标按钮挤窄（实测曾被压到 20.59px）。 */
.templates-icon-button { display: inline-grid; flex: 0 0 32px; width: 32px; height: 32px; padding: 0; place-items: center; }
/* 审批视角切换下拉：配置态 5 个 tab 都渲染，位于列设置图标左侧，不显示前置文字标签
   （名称通过 aria-label 提供）。a-select 根节点不带 scoped data-v，宽度规则需用 :deep()。 */
.list-toolbar__right :deep(.view-mode-select) { flex: 0 0 160px; width: 160px; }

/* 导入弹窗：拖拽上传目标 + 模版下载命令 */
.import-body { display: flex; flex-direction: column; gap: var(--mt-ds-space-3); }
.import-body :deep(.arco-upload) { width: 100%; }
.import-drop { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: var(--mt-ds-space-2); min-height: 140px; padding: var(--mt-ds-space-4); border: 1px dashed var(--color-border-3); border-radius: var(--mt-ds-control-radius); text-align: center; cursor: pointer; }
.import-drop p { margin: 0; }
.import-file { color: var(--app-color-primary); }
.import-template-link { align-self: flex-start; padding: 0; }
.approve-field { display: flex; flex-direction: column; gap: var(--mt-ds-space-2); margin-bottom: var(--mt-ds-space-4); }

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

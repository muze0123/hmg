<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import {
  IconFilter, IconPlus, IconRefresh, IconSearch, IconSettings,
} from '@arco-design/web-vue/es/icon';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppFormLayout from '../../../design/components/AppFormLayout.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { MOCK_CURRENT_USER } from '../../projects/data/projects';

/**
 * 标签管理（DESIGN.md · Filter strip packing / List settings popover / Table /
 * Row action overflow / Dialog / Confirmation dialogs）。
 * 列表记录是模块内 typed 数据，接入标签 API 契约后替换 rows 的数据源即可；
 * 创建人、创建日期由系统在写入时补齐，不在表单中编辑。
 */
const { t, locale } = useI18n();

/* ---------------------------------------------- 标签颜色：唯一枚举源
   色值只在 src/design/tokens.project.json 定义（亮/暗各一套），页面只引用语义变量。 */
const COLOR_CODES = ['blue', 'green', 'orange', 'red', 'purple', 'teal'] as const;
type ColorCode = (typeof COLOR_CODES)[number];
const DEFAULT_COLOR: ColorCode = 'blue';

interface Tag {
  id: string;
  name: string;
  description: string;
  color: ColorCode;
  creator: string;
  date: string;
}

const TAG_NAMES = [
  '数据合规', '高风险项', '需复核', '已归档', '跨境传输', '敏感个人信息',
  '车联网数据', '型式试验', '法规变更', '内部评审', '待补充材料', '软件升级',
  '外部审核', '整改跟踪', '试验记录', '证书有效', '临时标签',
];
const PEOPLE = ['王建国', '李思远', '张明'];
const rows = ref<Tag[]>(TAG_NAMES.map((name, index) => ({
  id: `TAG-${String(index + 1).padStart(4, '0')}`,
  name,
  description: index % 3 === 0 ? `${name}相关的项目与任务标记，用于筛选与归档。` : index % 3 === 1 ? '' : `${name}专用标记`,
  color: COLOR_CODES[index % COLOR_CODES.length],
  creator: PEOPLE[index % PEOPLE.length],
  date: `2026-${String((index % 10) + 1).padStart(2, '0')}-${String(((index * 3) % 27) + 1).padStart(2, '0')}`,
})));
const creatorOptions = computed(() => [...new Set(rows.value.map(row => row.creator))]);

/* ---------------------------------------------- 业务字段全集：筛选、表格、列设置共用 */
const FIELD_KEYS = ['name', 'description', 'creator', 'date'] as const;
type FieldKey = (typeof FIELD_KEYS)[number];
const SELECT_KEYS: readonly FieldKey[] = ['creator'];
const DATE_KEYS: readonly FieldKey[] = ['date'];
function fieldLabel(key: FieldKey): string { return t(`tags.${key}`); }

const page = ref(1);
const pageSize = ref(10);

/* ---------------------------------------------- 筛选条件（Filter strip packing）
   4 个可选查询字段；首项「标签名称」锁定可见，隐藏字段同时清掉草稿与已应用条件。 */
const defaultFilterSettings = FIELD_KEYS.map((key, index) => ({ key, visible: true, disabled: index === 0 }));
const filterSettings = ref(defaultFilterSettings.map(setting => ({ ...setting })));
const filterSettingsOpen = ref(false);
const visibleFilterKeys = computed<FieldKey[]>(() => filterSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const filterSettingsItems = computed<ColumnSettingsItem[]>(() => filterSettings.value.map(setting => ({ ...setting, label: fieldLabel(setting.key) })));
const defaultFilterItems = computed<ColumnSettingsItem[]>(() => defaultFilterSettings.map(setting => ({ ...setting, label: fieldLabel(setting.key) })));

const draft = reactive<Partial<Record<FieldKey, string>>>({});
const applied = ref<Partial<Record<FieldKey, string>>>({});
function applyFilters() { applied.value = { ...draft }; page.value = 1; }
function resetFilters() {
  for (const key of FIELD_KEYS) draft[key] = '';
  applied.value = {};
  page.value = 1;
}
function onFilterSettingsChanged(next: ColumnSettingsItem[]) {
  filterSettings.value = next.map(item => ({ key: item.key as FieldKey, visible: item.visible, disabled: item.key === 'name' }));
  const visible = new Set(visibleFilterKeys.value);
  for (const key of FIELD_KEYS) {
    if (visible.has(key)) continue;
    delete draft[key];
    delete applied.value[key];
  }
  page.value = 1;
}
const hasApplied = computed(() => FIELD_KEYS.some(key => Boolean(applied.value[key])));

/* ---------------------------------------------- 列设置（List settings popover）
   4 个业务列，首列「标签名称」锁定可见；操作列固定末列、不进弹层。 */
const COLUMN_WIDTHS: Record<FieldKey, number> = { name: 200, description: 360, creator: 140, date: 180 };
const ACTION_WIDTH = 170;
const defaultColumnSettings = FIELD_KEYS.map((key, index) => ({ key, visible: true, disabled: index === 0 }));
const columnSettings = ref(defaultColumnSettings.map(setting => ({ ...setting })));
const columnSettingsOpen = ref(false);
const visibleColumnKeys = computed<FieldKey[]>(() => columnSettings.value.filter(setting => setting.visible).map(setting => setting.key));
const columnSettingsItems = computed<ColumnSettingsItem[]>(() => columnSettings.value.map(setting => ({ ...setting, label: fieldLabel(setting.key) })));
const defaultColumnItems = computed<ColumnSettingsItem[]>(() => defaultColumnSettings.map(setting => ({ ...setting, label: fieldLabel(setting.key) })));
function onColumnSettingsChanged(next: ColumnSettingsItem[]) {
  columnSettings.value = next.map(item => ({ key: item.key as FieldKey, visible: item.visible, disabled: item.key === 'name' }));
  if (sortField.value && !visibleColumnKeys.value.includes(sortField.value)) {
    sortField.value = '';
    sortDirection.value = '';
  }
  page.value = 1;
}

/* ---------------------------------------------- 排序（数据层在分页前完成）
   受控 sortOrder + 数据层与 Arco 共用 compareRows，列设置重算不会丢失排序方向。 */
type SortDirection = '' | 'ascend' | 'descend';
const sortField = ref<FieldKey | ''>('');
const sortDirection = ref<SortDirection>('');
const collator = computed(() => new Intl.Collator(locale.value, { numeric: true, sensitivity: 'base' }));
function compareRows(a: Tag, b: Tag, key: FieldKey, direction: 'ascend' | 'descend'): number {
  const x = String(a[key] ?? '');
  const y = String(b[key] ?? '');
  if (!x && y) return 1;
  if (x && !y) return -1;
  const result = collator.value.compare(x, y);
  return direction === 'descend' ? -result : result;
}
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
    slotName: 'field',
    width: COLUMN_WIDTHS[key],
    sortable: {
      sortDirections: ['ascend', 'descend'],
      sortOrder: sortField.value === key ? sortDirection.value : '',
      sorter: (a, b, extra) => compareRows(a as unknown as Tag, b as unknown as Tag, key, extra.direction),
    },
  })),
  { title: t('tags.actions'), dataIndex: 'actions', slotName: 'actions', width: ACTION_WIDTH, fixed: 'right' },
]);
const horizontalWidth = computed(() => visibleColumnKeys.value.reduce((sum, key) => sum + COLUMN_WIDTHS[key], ACTION_WIDTH));

/* ---------------------------------------------- 数据、分页 */
const resultRows = computed<Tag[]>(() => {
  const list = rows.value.filter(row => FIELD_KEYS.every((key) => {
    const value = applied.value[key];
    if (!value) return true;
    const cell = String(row[key] ?? '');
    return DATE_KEYS.includes(key) ? cell.slice(0, 10) === value
      : SELECT_KEYS.includes(key) ? cell === value
        : cell.toLowerCase().includes(value.toLowerCase());
  }));
  if (!sortField.value || !sortDirection.value) return list;
  const key = sortField.value;
  const direction = sortDirection.value;
  return [...list].sort((a, b) => compareRows(a, b, key, direction));
});
const pagedRows = computed(() => resultRows.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
function cellText(row: Tag, key: string): string { return String(row[key as keyof Tag] ?? '') || '—'; }

/* ---------------------------------------------- 新建 / 编辑 / 详情弹窗
   表单弹窗按 Dialog 规范在 X / 取消 / Escape 时立即关闭，不做二次放弃确认。 */
type DialogMode = 'create' | 'edit' | 'view';
const dialogOpen = ref(false);
const dialogMode = ref<DialogMode>('create');
const dialogTitle = computed(() => (
  dialogMode.value === 'create' ? t('tags.new')
    : dialogMode.value === 'edit' ? t('tags.edit') : t('tags.detailTitle')
));
const form = reactive<Tag>({ id: '', name: '', description: '', color: DEFAULT_COLOR, creator: '', date: '' });
const error = ref('');
const nameInput = ref<{ focus: () => void }>();
function openDialog(mode: DialogMode, row?: Tag) {
  dialogMode.value = mode;
  Object.assign(form, row ?? { id: '', name: '', description: '', color: DEFAULT_COLOR, creator: '', date: '' });
  error.value = '';
  dialogOpen.value = true;
}
function save() {
  const name = form.name.trim();
  error.value = !name ? 'tags.required'
    : rows.value.some(row => row.id !== form.id && row.name === name) ? 'tags.duplicate' : '';
  if (error.value) { nameInput.value?.focus(); return; }
  const record: Tag = {
    ...form,
    name,
    id: form.id || crypto.randomUUID(),
    creator: form.creator || MOCK_CURRENT_USER.name,
    date: form.date || new Date().toISOString().slice(0, 10),
  };
  const index = rows.value.findIndex(row => row.id === record.id);
  if (index < 0) rows.value.unshift(record); else rows.value[index] = record;
  dialogOpen.value = false;
  page.value = 1;
  Message.success(t('tags.saved'));
}
function handleDialogOk() {
  if (dialogMode.value === 'view') { dialogOpen.value = false; return; }
  save();
}

/* ---------------------------------------------- 删除：第三个直显操作 + 二次确认
   本页三个行操作全部直显、不渲染「…」溢出按钮（2026-11-13 用户裁决，本页不采用 Row action overflow）。 */
const deleteOpen = ref(false);
const deleteId = ref('');
function requestDelete(row: Tag) {
  deleteId.value = row.id;
  deleteOpen.value = true;
}
function confirmDelete() {
  rows.value = rows.value.filter(row => row.id !== deleteId.value);
  deleteOpen.value = false;
  deleteId.value = '';
  Message.success(t('tags.deleted'));
  page.value = Math.min(page.value, Math.max(1, Math.ceil(resultRows.value.length / pageSize.value)));
}
</script>

<template>
  <main class="tags-page">
    <!-- 筛选条件区：字段名称在上、200px 控件在下；查询 / 重置 / 筛选设置紧跟最后一个组件 -->
    <form class="tags-filters app-filter-strip" @submit.prevent="applyFilters">
      <div v-for="key in visibleFilterKeys" :key="key" class="app-filter-unit">
        <AppFieldLabel as="label" :for="`tags-filter-${key}`" :text="fieldLabel(key)" context="filter" />
        <a-select
          v-if="SELECT_KEYS.includes(key)"
          :id="`tags-filter-${key}`"
          v-model="draft[key]"
          class="app-filter-control"
          :placeholder="t('tags.all')"
          :aria-label="fieldLabel(key)"
          allow-clear
        >
          <a-option v-for="name in creatorOptions" :key="name" :value="name">{{ name }}</a-option>
        </a-select>
        <a-date-picker
          v-else-if="DATE_KEYS.includes(key)"
          :id="`tags-filter-${key}`"
          v-model="draft[key]"
          class="app-filter-control"
          value-format="YYYY-MM-DD"
          :placeholder="t('tags.selectDate')"
          :aria-label="fieldLabel(key)"
          allow-clear
        />
        <a-input
          v-else
          v-model="draft[key]"
          class="app-filter-control"
          :input-attrs="{ id: `tags-filter-${key}`, 'aria-label': fieldLabel(key) }"
          :placeholder="t('tags.enter')"
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
          :title="t('tags.filters.settings')"
          :list-aria-label="t('tags.filters.settings')"
          :show-label="t('tags.filters.show')"
          :restore-label="t('tags.filters.restore')"
          @change="onFilterSettingsChanged"
        >
          <a-tooltip :content="t('tags.filters.settings')">
            <a-button class="app-btn-neutral tags-icon-button" :aria-label="t('tags.filters.settings')" :title="t('tags.filters.settings')"><IconFilter /></a-button>
          </a-tooltip>
        </ColumnSettingsPopover>
      </div>
    </form>

    <!-- 数据列表区：左上新建、右上 32×32 列设置；分页器在右下角 -->
    <section class="tags-list" role="region" :aria-label="t('tags.listTitle')">
      <div class="list-toolbar">
        <div class="list-toolbar__left">
          <a-button type="primary" @click="openDialog('create')"><template #icon><IconPlus /></template>{{ t('tags.new') }}</a-button>
        </div>
        <div class="list-toolbar__right">
          <ColumnSettingsPopover
            v-model:visible="columnSettingsOpen"
            :items="columnSettingsItems"
            :default-items="defaultColumnItems"
            :title="t('tags.columns.settings')"
            :list-aria-label="t('tags.columns.settings')"
            :show-label="t('tags.filters.show')"
            :restore-label="t('tags.filters.restore')"
            @change="onColumnSettingsChanged"
          >
            <a-tooltip :content="t('tags.columns.settings')">
              <a-button class="app-btn-neutral tags-icon-button" :aria-label="t('tags.columns.settings')" :title="t('tags.columns.settings')"><IconSettings /></a-button>
            </a-tooltip>
          </ColumnSettingsPopover>
        </div>
      </div>

      <a-table
        class="tags-table"
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
          <span v-if="column.dataIndex === 'name'" class="tag-name-chip" :class="`tag-color--${record.color}`">{{ (record as Tag).name }}</span>
          <span v-else>{{ cellText(record as Tag, String(column.dataIndex)) }}</span>
        </template>
        <template #actions="{ record }">
          <div class="row-actions">
            <button type="button" class="row-action" @click="openDialog('view', record as Tag)">{{ t('tags.detail') }}</button>
            <button type="button" class="row-action" @click="openDialog('edit', record as Tag)">{{ t('designSystem.edit') }}</button>
            <button type="button" class="row-action row-action--danger" @click="requestDelete(record as Tag)">{{ t('tags.delete') }}</button>
          </div>
        </template>
        <template #empty>
          <a-empty :description="hasApplied ? t('tags.noMatch') : t('tags.empty')" />
        </template>
      </a-table>

      <AppPagination v-model:current="page" v-model:page-size="pageSize" :total="resultRows.length" />
    </section>

    <!-- 新建 / 编辑 / 详情共用一个居中表单弹窗：内容 560px，字段标签在上、控件 500px -->
    <a-modal
      :visible="dialogOpen"
      :title="dialogTitle"
      :width="'min(560px, calc(100vw - 32px))'"
      :ok-text="dialogMode === 'view' ? t('designSystem.close') : t('designSystem.confirm')"
      :cancel-text="t('designSystem.cancel')"
      :hide-cancel="dialogMode === 'view'"
      class="tags-dialog"
      @ok="handleDialogOk"
      @cancel="dialogOpen = false"
    >
      <div v-if="dialogMode === 'view'" class="app-detail-list">
        <div class="app-detail-row"><span class="app-detail-label">{{ t('tags.name') }}</span><span class="app-detail-value"><span class="tag-name-chip" :class="`tag-color--${form.color}`">{{ form.name }}</span></span></div>
        <div class="app-detail-row">
          <span class="app-detail-label">{{ t('tags.color') }}</span>
          <span class="app-detail-value tag-color-value">
            <span class="tag-color-dot" :class="`tag-color--${form.color}`" aria-hidden="true" />{{ t(`tags.colors.${form.color}`) }}
          </span>
        </div>
        <div class="app-detail-row"><span class="app-detail-label">{{ t('tags.description') }}</span><span class="app-detail-value">{{ form.description || '—' }}</span></div>
      </div>
      <AppFormLayout v-else>
        <a-form :model="form" layout="vertical">
          <a-form-item required :validate-status="error ? 'error' : undefined" :help="error ? t(error) : ''">
            <template #label><AppFieldLabel :text="t('tags.name')" /></template>
            <a-input
              ref="nameInput"
              v-model="form.name"
              :max-length="20"
              :show-word-limit="true"
              :placeholder="t('tags.enter')"
              :input-attrs="{ 'aria-label': t('tags.name') }"
              allow-clear
            />
          </a-form-item>
          <a-form-item>
            <template #label><AppFieldLabel :text="t('tags.color')" /></template>
            <div class="tag-color-picker" role="group" :aria-label="t('tags.color')">
              <button
                v-for="code in COLOR_CODES"
                :key="code"
                type="button"
                class="tag-color-swatch"
                :class="[`tag-color--${code}`, { 'is-selected': form.color === code }]"
                :aria-pressed="form.color === code"
                :aria-label="t(`tags.colors.${code}`)"
                :title="t(`tags.colors.${code}`)"
                @click="form.color = code"
              />
            </div>
          </a-form-item>
          <a-form-item>
            <template #label><AppFieldLabel :text="t('tags.description')" /></template>
            <a-textarea
              v-model="form.description"
              :max-length="200"
              :show-word-limit="true"
              :auto-size="{ minRows: 3, maxRows: 5 }"
              :placeholder="t('tags.enter')"
              :textarea-attrs="{ 'aria-label': t('tags.description') }"
            />
          </a-form-item>
        </a-form>
      </AppFormLayout>
    </a-modal>

    <ConfirmDialog
      :visible="deleteOpen"
      icon="warning"
      :title="t('tags.remove')"
      :description="t('tags.warning')"
      @update:visible="deleteOpen = $event"
      @confirm="confirmDelete"
    />
  </main>
</template>

<style scoped>
/* 两块白色业务面板，纵向间距 12px（DESIGN.md · Spacing & Layout） */
.tags-page { display: flex; flex-direction: column; gap: var(--mt-ds-space-3); min-width: 0; color: var(--mt-ds-text); }
.tags-filters, .tags-list { min-width: 0; padding: 16px; border-radius: 2px; background: var(--app-surface); }

/* 列表工具栏：左新建、右列设置，两侧各自成组 */
.list-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 16px; }
.list-toolbar__left, .list-toolbar__right { display: flex; align-items: center; gap: 8px; min-width: 0; }
.tags-icon-button { display: inline-grid; width: 32px; height: 32px; padding: 0; place-items: center; }

/* 表格：白底、无外框、无斑马纹、行间单线；表头与数据均 400 字重 */
.tags-page :deep(.arco-table), .tags-page :deep(.arco-table-container) { border: 0; }
.tags-page :deep(.arco-table-th) {
  height: 50px; padding: 0 12px; border-bottom: 1px solid var(--app-divider);
  color: var(--color-text-1); background: var(--app-table-header);
  font-size: 14px; font-weight: 400; line-height: 22px; white-space: nowrap; text-align: left;
}
.tags-page :deep(.arco-table-td) {
  height: 50px; padding: 8px 12px; border-bottom: 1px solid var(--app-divider);
  background: var(--app-surface); font-size: 14px; font-weight: 400; line-height: 22px;
  white-space: nowrap; text-align: left;
}
.tags-page :deep(.arco-table-tr:hover .arco-table-td) { background: var(--color-fill-1); }

/* 行操作：详情 / 编辑 / 删除三个文字链接全部直显，删除用 danger 语义色 */
.row-actions { display: flex; align-items: center; gap: var(--mt-ds-space-3); }
.row-action { padding: 0; border: 0; background: transparent; color: var(--app-color-primary); font: inherit; font-weight: 400; cursor: pointer; }
.row-action:hover { text-decoration: underline; }
.row-action:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
.row-action--danger { color: rgb(var(--danger-6)); }
.row-action--danger:hover { text-decoration: underline; }

/* 标签颜色：色值来自 tokens.project.json 的亮/暗两套语义变量；颜色永远与文字标签同时出现 */
.tag-color--blue { --tag-fill: var(--app-tag-color-blue); --tag-fg: var(--app-tag-color-blue-fg); --tag-bg: var(--app-tag-color-blue-bg); }
.tag-color--green { --tag-fill: var(--app-tag-color-green); --tag-fg: var(--app-tag-color-green-fg); --tag-bg: var(--app-tag-color-green-bg); }
.tag-color--orange { --tag-fill: var(--app-tag-color-orange); --tag-fg: var(--app-tag-color-orange-fg); --tag-bg: var(--app-tag-color-orange-bg); }
.tag-color--red { --tag-fill: var(--app-tag-color-red); --tag-fg: var(--app-tag-color-red-fg); --tag-bg: var(--app-tag-color-red-bg); }
.tag-color--purple { --tag-fill: var(--app-tag-color-purple); --tag-fg: var(--app-tag-color-purple-fg); --tag-bg: var(--app-tag-color-purple-bg); }
.tag-color--teal { --tag-fill: var(--app-tag-color-teal); --tag-fg: var(--app-tag-color-teal-fg); --tag-bg: var(--app-tag-color-teal-bg); }
/* 标签名称 chip：文字取所选色的可读阶、背景取该色的淡阶（2026-11-13 参考稿裁决） */
.tag-name-chip {
  display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 2px;
  color: var(--tag-fg); background: var(--tag-bg);
  font-size: 14px; font-weight: 400; line-height: 22px;
}
.tag-color-dot { display: inline-block; flex: none; width: 10px; height: 10px; border-radius: 2px; background: var(--tag-fill); }
.tag-color-value { display: inline-flex; align-items: center; gap: 8px; }
.tag-color-picker { display: flex; flex-wrap: wrap; align-items: center; gap: 16px; }
.tag-color-swatch { width: 40px; height: 40px; padding: 0; border: 0; border-radius: 6px; background: var(--tag-fill); cursor: pointer; }
.tag-color-swatch.is-selected {
  box-shadow: 0 0 0 2px var(--app-surface), 0 0 0 4px var(--app-tag-selected-ring), 0 0 0 7px var(--app-tag-selected-halo);
}
.tag-color-swatch:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 8px; }
@media (prefers-reduced-motion: reduce) { .row-action, .tag-color-swatch { transition: none; } }
</style>

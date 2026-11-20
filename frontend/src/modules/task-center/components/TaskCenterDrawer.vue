<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message, type TableColumnData } from '@arco-design/web-vue';
import { IconRefresh, IconSearch } from '@arco-design/web-vue/es/icon';
import { TASK_MODULE_KEYS, type DownloadTaskRecord, type ImportTaskRecord, type TaskModuleKey } from '../data/taskCenter';
import { useTaskCenterStore } from '../stores/taskCenter';

const { t } = useI18n({ useScope: 'global' });
const store = useTaskCenterStore();

type AnyTask = ImportTaskRecord | DownloadTaskRecord;

interface TaskFilters {
  module: TaskModuleKey | undefined;
  operator: string;
  range: string[];
}

const createDefaultFilters = (): TaskFilters => ({ module: undefined, operator: '', range: [] });

/** 草稿筛选与已应用筛选分离：点击【查询】才生效 */
const draftFilters = ref<TaskFilters>(createDefaultFilters());
const appliedFilters = ref<TaskFilters>(createDefaultFilters());
const page = ref(1);
const pageSize = ref(10);
const jumpPage = ref(1);

/* 抽屉内不提供筛选条件设置 / 列设置（DESIGN.md · Drawer 抽屉样式无此设计）：
   三个筛选字段恒显，表格列固定，设置入口只保留给业务列表页。 */
const FILTER_KEYS = ['module', 'operator', 'time'] as const;
const COLUMN_KEYS = ['module', 'file', 'operator', 'time', 'stage'] as const;
type ColumnKey = (typeof COLUMN_KEYS)[number];
const COLUMN_DEFS: Record<ColumnKey, Pick<TableColumnData, 'slotName' | 'dataIndex' | 'width' | 'ellipsis'>> = {
  module: { slotName: 'module', width: 120 },
  file: { slotName: 'file', width: 240, ellipsis: true },
  operator: { dataIndex: 'operator', width: 90 },
  time: { slotName: 'time', width: 160 },
  stage: { slotName: 'stage', width: 280 },
};
const ACTION_COLUMN_WIDTH = 120;

/** 固定列：五个数据列 + 恒在最后的操作列（computed 保持语言切换即时更新表头） */
const tableColumns = computed<TableColumnData[]>(() => [
  ...COLUMN_KEYS.map((key): TableColumnData => ({
    title: t(`taskCenter.columns.${key}`),
    ...COLUMN_DEFS[key],
  })),
  { title: t('taskCenter.columns.actions'), slotName: 'actions', width: ACTION_COLUMN_WIDTH },
]);
/** 横向溢出归表格区所有，不让列被压碎（DESIGN.md · Table） */
const horizontalWidth = computed(() => tableColumns.value.reduce((total, column) => total + (Number(column.width) || 200), 0));

const moduleOptions = computed(() =>
  TASK_MODULE_KEYS.map((value) => ({ value, label: t(`taskCenter.modules.${value}`) })),
);
const operatorOptions = computed(() =>
  Array.from(new Set([...store.importTasks, ...store.downloadTasks].map((task) => task.operator))).map((value) => ({
    value,
    label: value,
  })),
);

const hasAppliedFilters = computed(() =>
  Boolean(appliedFilters.value.module || appliedFilters.value.operator || appliedFilters.value.range.length),
);

const filteredTasks = computed<AnyTask[]>(() => {
  const { module, operator, range } = appliedFilters.value;
  const [from, to] = range;
  const source: AnyTask[] = store.activeTab === 'import' ? store.importTasks : store.downloadTasks;
  return source
    .filter((task) => {
      if (module && task.module !== module) return false;
      if (operator && task.operator !== operator) return false;
      const day = task.time.slice(0, 10);
      if (from && day < from) return false;
      if (to && day > to) return false;
      return true;
    })
    .sort((left, right) => (left.time < right.time ? 1 : -1));
});

const totalPages = computed(() => Math.max(1, Math.ceil(filteredTasks.value.length / pageSize.value)));
const pagedTasks = computed(() => filteredTasks.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));

/** 页码 >7 页时首末页恒显 + 当前页 ±1 + 省略号折叠 */
const pageNumbers = computed<(number | 'ellipsis')[]>(() => {
  const total = totalPages.value;
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);
  const pages: (number | 'ellipsis')[] = [1];
  if (page.value > 3) pages.push('ellipsis');
  for (let number = Math.max(2, page.value - 1); number <= Math.min(total - 1, page.value + 1); number += 1) pages.push(number);
  if (page.value < total - 2) pages.push('ellipsis');
  pages.push(total);
  return pages;
});

// 切换 Tab：筛选条件重置为默认值，列表回到第 1 页
watch(
  () => store.activeTab,
  () => {
    draftFilters.value = createDefaultFilters();
    appliedFilters.value = createDefaultFilters();
    setPage(1);
  },
);

watch(pageSize, () => {
  setPage(1);
});

/** 处理中任务每 10 秒轮询一次，仅抽屉打开期间运行；打开时先推进一次，新任务不必空等首个周期 */
let pollTimer: ReturnType<typeof setInterval> | undefined;
watch(
  () => store.visible,
  (visible) => {
    if (visible && !pollTimer) {
      store.tick();
      pollTimer = setInterval(() => store.tick(), 10_000);
    } else if (!visible && pollTimer) {
      clearInterval(pollTimer);
      pollTimer = undefined;
    }
  },
);
onBeforeUnmount(() => {
  if (pollTimer) clearInterval(pollTimer);
});

function applyFilters() {
  appliedFilters.value = {
    module: draftFilters.value.module,
    operator: draftFilters.value.operator.trim(),
    range: [...draftFilters.value.range],
  };
  setPage(1);
}

function resetFilters() {
  draftFilters.value = createDefaultFilters();
  appliedFilters.value = createDefaultFilters();
  setPage(1);
}

function setPage(target: number) {
  if (target < 1 || target > totalPages.value) return;
  page.value = target;
  jumpPage.value = target;
}

function goToJumpPage() {
  const target = Number(jumpPage.value);
  if (!Number.isInteger(target) || target < 1 || target > totalPages.value) {
    Message.warning(t('taskCenter.pagination.invalidPage'));
    return;
  }
  setPage(target);
}

/** a-tabs 的 change 事件 key 是 string | number，收窄为任务 Tab 枚举 */
function onTabChange(key: string | number) {
  store.switchTab(key === 'download' ? 'download' : 'import');
}

function moduleLabel(module: TaskModuleKey) {
  return t(`taskCenter.modules.${module}`);
}

/** 文件命名：导入 {模块名}导入数据_{YYYYMMDD}.xlsx；导出 {模块名}导出_{YYYYMMDDHHMMSS}.xlsx。
 *  业务页创建的任务携带实际文件名，优先展示。 */
function taskFileName(task: AnyTask) {
  if (store.activeTab === 'download' && (task as DownloadTaskRecord).fileName) return (task as DownloadTaskRecord).fileName as string;
  const label = moduleLabel(task.module);
  if (store.activeTab === 'import') return `${label}${t('taskCenter.fileNames.import')}_${task.fileStamp}.xlsx`;
  return `${label}${t('taskCenter.fileNames.export')}_${task.fileStamp}.xlsx`;
}

/** 错误数据文件：{模块名}导入错误数据_{YYYYMMDDHHMMSS}.xlsx；业务页任务优先用实际文件名 */
function errorFileName(task: ImportTaskRecord) {
  if (task.errorName) return task.errorName;
  return `${moduleLabel(task.module)}${t('taskCenter.fileNames.importError')}_${task.fileStamp}000000.xlsx`;
}

/** 演示扩展：业务页任务携带真实 Blob URL，直接触发浏览器下载 */
function triggerDownload(url: string, fileName: string) {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

function downloadFile(task: DownloadTaskRecord) {
  const name = taskFileName(task);
  if (task.fileUrl) { triggerDownload(task.fileUrl, name); return; }
  Message.success(`${t('taskCenter.feedback.startDownload')}：${name}`);
}

function downloadErrorData(task: ImportTaskRecord) {
  const name = errorFileName(task);
  if (task.errorUrl) { triggerDownload(task.errorUrl, name); return; }
  Message.success(`${t('taskCenter.feedback.startDownload')}：${name}`);
}
</script>

<template>
  <a-drawer
    class="tc-drawer"
    :visible="store.visible"
    :width="'min(1000px, 100vw)'"
    :title="t('taskCenter.title')"
    :footer="false"
    @cancel="store.close()"
  >
    <div class="tc-body">
      <!-- Tab 切换栏 -->
      <a-tabs :active-key="store.activeTab" @change="onTabChange">
        <a-tab-pane key="import" :title="t('taskCenter.tabs.import')" />
        <a-tab-pane key="download" :title="t('taskCenter.tabs.download')" />
      </a-tabs>

      <!-- 筛选栅栏（DESIGN.md · Filter strip packing）：字段名称在上、200px 控件在下，
           4px 内间距、16px 行列间距；查询/重置紧跟最后一个筛选组件右侧。 -->
      <form class="tc-filters app-filter-strip" @submit.prevent="applyFilters">
        <div v-for="key in FILTER_KEYS" :key="key" class="tc-filter-field app-filter-unit">
          <label class="tc-filter-label app-field-label" :for="`tc-filter-${key}`">{{ t(`taskCenter.filters.${key}`) }}</label>
          <a-select
            v-if="key === 'module'"
            :id="`tc-filter-${key}`"
            v-model="draftFilters.module"
            class="app-filter-control tc-filter-control"
            :options="moduleOptions"
            :aria-label="t('taskCenter.filters.module')"
            :placeholder="t('taskCenter.filters.all')"
            allow-clear
          />
          <a-select
            v-else-if="key === 'operator'"
            :id="`tc-filter-${key}`"
            v-model="draftFilters.operator"
            class="app-filter-control tc-filter-control"
            :options="operatorOptions"
            :aria-label="t('taskCenter.filters.operator')"
            :placeholder="t('taskCenter.filters.all')"
            allow-clear
            allow-search
          />
          <a-range-picker
            v-else
            :id="`tc-filter-${key}`"
            v-model="draftFilters.range"
            class="app-filter-control tc-date-filter"
            :aria-label="t('taskCenter.filters.time')"
            :placeholder="[t('taskCenter.filters.startDate'), t('taskCenter.filters.endDate')]"
            value-format="YYYY-MM-DD"
          />
        </div>
        <div class="tc-filter-actions app-filter-actions">
          <a-button type="primary" html-type="submit">
            <template #icon><IconSearch /></template>
            {{ t('designSystem.search') }}
          </a-button>
          <a-button class="app-btn-neutral" html-type="button" @click="resetFilters">
            <template #icon><IconRefresh /></template>
            {{ t('designSystem.reset') }}
          </a-button>
        </div>
      </form>

      <!-- 下载任务说明：静态 in-flow 提示（DESIGN.md · Alert info） -->
      <a-alert v-if="store.activeTab === 'download'" class="tc-note" type="info">
        {{ t('taskCenter.note') }}
      </a-alert>

      <!-- 表格：数据区是唯一的垂直滚动 owner；横向溢出由 Arco 表格内容区自行承载。 -->
      <div class="tc-table-wrap">
        <a-table
          :columns="tableColumns"
          :data="pagedTasks"
          :pagination="false"
          :bordered="{ wrapper: false, cell: false }"
          :scroll="{ x: horizontalWidth }"
          row-key="id"
        >
          <template #module="{ record }">{{ moduleLabel(record.module) }}</template>
          <template #file="{ record }">
            <span class="tc-file" :title="taskFileName(record)">{{ taskFileName(record) }}</span>
          </template>
          <template #time="{ record }"><span class="tc-time">{{ record.time }}</span></template>
          <template #stage="{ record }">
            <div v-if="record.status === 'processing'" class="tc-stage-processing">
              <span class="tc-text-primary">{{ t('taskCenter.stages.processing', { progress: record.progress ?? 0 }) }}</span>
              <div
                class="tc-progress"
                role="progressbar"
                :aria-valuenow="record.progress ?? 0"
                aria-valuemin="0"
                aria-valuemax="100"
              >
                <div class="tc-progress-fill" :style="{ width: `${record.progress ?? 0}%` }"></div>
              </div>
            </div>
            <template v-else-if="store.activeTab === 'import'">
              <span v-if="record.status === 'success'" class="tc-stage-value tc-text-success">
                {{ t('taskCenter.stages.importSuccess', { total: record.total ?? 0, ok: record.ok ?? 0, fail: record.fail ?? 0 }) }}
              </span>
              <span v-else-if="record.status === 'partial_fail'" class="tc-stage-value">
                {{ t('taskCenter.stages.partialFailPrefix', { total: record.total ?? 0, ok: record.ok ?? 0 }) }}<span class="tc-text-danger tc-strong">{{ t('taskCenter.stages.partialFailCount', { fail: record.fail ?? 0 }) }}</span>
              </span>
              <span v-else class="tc-stage-value tc-text-danger">{{ t('taskCenter.stages.importFailed') }}</span>
            </template>
            <template v-else>
              <span v-if="record.status === 'success'" class="tc-stage-value tc-text-success">{{ t('taskCenter.stages.exportSuccess') }}</span>
              <span v-else class="tc-stage-value tc-text-danger">{{ t('taskCenter.stages.exportFailed') }}</span>
            </template>
          </template>
          <template #actions="{ record }">
            <span class="tc-nowrap">
              <template v-if="store.activeTab === 'import'">
                <a-link v-if="record.status === 'partial_fail'" @click="downloadErrorData(record)">
                  {{ t('taskCenter.actions.downloadErrorData') }}
                </a-link>
                <span v-else class="tc-noop">{{ t('taskCenter.actions.noOperation') }}</span>
              </template>
              <template v-else>
                <a-tooltip v-if="record.status === 'success' && record.expired" :content="t('taskCenter.stages.expired')">
                  <span class="tc-link-disabled" tabindex="-1">{{ t('taskCenter.actions.downloadFile') }}</span>
                </a-tooltip>
                <a-link v-else-if="record.status === 'success'" @click="downloadFile(record)">
                  {{ t('taskCenter.actions.downloadFile') }}
                </a-link>
                <span v-else class="tc-noop">{{ t('taskCenter.actions.noOperation') }}</span>
              </template>
            </span>
          </template>
          <template #empty>
            <a-empty :description="hasAppliedFilters ? t('taskCenter.empty.noMatch') : t('taskCenter.empty.noRecord')" />
          </template>
        </a-table>
      </div>

      <!-- 分页器紧随数据列表，保持在独立滚动区外（DESIGN.md · List footer contract） -->
      <nav class="tc-pagination app-pagination" :aria-label="t('taskCenter.pagination.navigation')">
        <span class="pagination-total">{{ t('taskCenter.pagination.total', { count: filteredTasks.length }) }}</span>
        <div class="pagination-pages">
          <a-select
            class="app-page-size"
            :model-value="pageSize"
            :aria-label="t('taskCenter.pagination.pageSizeAria')"
            @update:model-value="pageSize = Number($event)"
          >
            <a-option v-for="size in [10, 20, 50, 100, 200]" :key="size" :value="size">{{ t('taskCenter.pagination.perPage', { count: size }) }}</a-option>
          </a-select>
          <button class="pagination-arrow" type="button" :disabled="page === 1" :aria-label="t('taskCenter.pagination.previous')" @click="setPage(page - 1)">
            <icon-left />
          </button>
          <template v-for="(number, index) in pageNumbers" :key="`${number}-${index}`">
            <span v-if="number === 'ellipsis'" class="pagination-ellipsis" aria-hidden="true">…</span>
            <button
              v-else
              class="pagination-number"
              :class="{ active: page === number }"
              type="button"
              :aria-current="page === number ? 'page' : undefined"
              @click="setPage(number)"
            >{{ number }}</button>
          </template>
          <button class="pagination-arrow" type="button" :disabled="page === totalPages" :aria-label="t('taskCenter.pagination.next')" @click="setPage(page + 1)">
            <icon-right />
          </button>
        </div>
        <span class="pagination-jump-label">{{ t('taskCenter.pagination.jumpTo') }}</span>
        <!-- 不做 min/max 钳位：跳页超出范围时按契约提示「请输入有效页码」 -->
        <a-input-number v-model="jumpPage" class="app-page-jump" :input-attrs="{ 'aria-label': t('taskCenter.pagination.jumpTo') }" hide-button @press-enter="goToJumpPage" />
        <span class="pagination-total-pages">{{ t('taskCenter.pagination.totalPages', { count: totalPages }) }}</span>
      </nav>
    </div>
  </a-drawer>
</template>

<style scoped>
/* 抽屉骨架中涉及 Arco 内部结构的覆盖统一放在 global.css（.tc-drawer 前缀隔离）；
   此处只保留自有元素样式。 */
.tc-body { display: flex; flex: 1; flex-direction: column; min-height: 0; }

/* 筛选栅栏布局统一走 global.css 的 app-filter-strip / app-filter-unit / app-filter-actions；
   抽屉内筛选条只保留上下留白，不带底部分割线 */
.tc-filters { padding: 16px 0; }

/* 静态说明条：info 面、4px 圆角、无阴影（DESIGN.md · Alert） */
.tc-note { margin-top: 16px; border-radius: 4px; }

/* 表格区：白底、无外框、行分割线，表头/单元格样式统一在 global.css。
   不撑满抽屉（flex: 0 1 auto）：行数少时容器随内容收高，分页器紧随数据列表；
   行数多时容器按可用高度收缩并内部滚动，是唯一的垂直滚动 owner；
   横向溢出由 Arco 的表格内容区自行承载，不外溢到抽屉壳。 */
.tc-table-wrap {
  flex: 0 1 auto;
  min-height: 0;
  margin-top: 8px;
  overflow: auto;
}

.tc-file {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tc-time { font-variant-numeric: tabular-nums; }

/* 任务阶段：处理中蓝色 + 4px 线形进度条 */
.tc-stage-processing { min-width: 110px; white-space: nowrap; }
.tc-stage-value { white-space: nowrap; }
.tc-progress {
  max-width: 130px;
  height: 4px;
  margin-top: 4px;
  border-radius: 2px;
  background: var(--app-primary-light-bg);
  overflow: hidden;
}
.tc-progress-fill {
  height: 100%;
  border-radius: 2px;
  background: var(--app-color-primary);
  transition: width 0.3s;
}

.tc-text-primary { color: var(--app-color-primary); }
.tc-text-success { color: var(--app-color-success); }
.tc-text-danger { color: var(--app-color-danger); }
.tc-strong { font-weight: 700; }

.tc-noop { color: var(--color-text-4); }
.tc-link-disabled { color: var(--color-text-4); cursor: not-allowed; }
/* 操作列文本不换行（下载错误数据等长文案保持单行） */
.tc-nowrap { display: inline-block; white-space: nowrap; }

/* 列表页脚：总数 → 每页条数 → 页码 → 跳至，右对齐；控件表面复用 global.css 的 app-pagination。
   total 与分页组之间 16px（gap 8px + margin-right 8px），不加容器边框。 */
.tc-pagination {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
  padding-top: 16px;
  color: var(--color-text-2);
}
.pagination-total { margin-right: 8px; color: var(--color-text-3); font-size: 14px; line-height: 22px; }
.pagination-pages { display: flex; align-items: center; gap: 8px; margin-right: 8px; }
.pagination-ellipsis {
  min-width: 32px;
  color: var(--color-text-3);
  font-size: 13px;
  text-align: center;
}
.pagination-jump-label, .pagination-total-pages { color: var(--color-text-3); font-size: 14px; line-height: 22px; }

/* 窄屏流式布局由 global.css 的 .app-filter-strip 媒体查询统一处理 */
</style>

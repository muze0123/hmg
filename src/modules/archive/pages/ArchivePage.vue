<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { IconSearch, IconRefresh, IconSettings, IconLineHeight } from '@arco-design/web-vue/es/icon';
import AppListToolbar from '../../../design/components/AppListToolbar.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import ColumnSettingsPopover, { type ColumnSettingsItem } from '../../../shared/components/ColumnSettingsPopover.vue';
import { archiveProjects, deliverables, type Deliverable } from '../data/archive';
const { t } = useI18n();
const projectSearch = ref('');
const selectedId = ref(archiveProjects[0]!.id);
const projects = computed(() => archiveProjects.filter(p => `${p.name} ${p.id}`.toLowerCase().includes(projectSearch.value.trim().toLowerCase())));
const selected = computed(() => archiveProjects.find(p => p.id === selectedId.value)!);
const draft = reactive({ name: '', activity: '' });
const applied = reactive({ name: '', activity: '' });
const current = ref(1);
const pageSize = ref(10);
const compact = ref(false);
const settingsVisible = ref(false);
const columnState = ref(['name', 'activity', 'date', 'owner'].map(key => ({ key, visible: true })));
const defaultColumns = computed<ColumnSettingsItem[]>(() => ['name', 'activity', 'date', 'owner'].map(key => ({ key, label: t(`archive.${key}`), visible: true })));
const settings = computed(() => columnState.value.map(item => ({ ...item, label: t(`archive.${item.key}`) })));
const columns = computed(() => settings.value.filter(item => item.visible).map(item => ({ title: item.label, dataIndex: item.key, width: item.key === 'name' ? 260 : 180, sortable: { sortDirections: ['ascend', 'descend'] as ('ascend' | 'descend')[] } })).concat([{ title: t('archive.actions'), dataIndex: 'actions', width: 200, sortable: undefined! }]));
const activities = computed(() => [...new Set(deliverables.filter(row => row.projectId === selectedId.value).map(row => row.activity))]);
const filtered = computed(() => deliverables.filter(row => row.projectId === selectedId.value && row.name.toLowerCase().includes(applied.name.trim().toLowerCase()) && (!applied.activity || row.activity === applied.activity)));
const preview = ref<Deliverable>();
const previewVisible = ref(false);
function search() { Object.assign(applied, draft); current.value = 1; }
function reset() { Object.assign(draft, { name: '', activity: '' }); search(); }
function selectProject(id: string) { selectedId.value = id; reset(); }
function openPreview(row: Deliverable) { preview.value = row; previewVisible.value = true; }
function sampleContent(row: Deliverable) { return `${selected.value.name}\n${selected.value.id}\n${row.name}\n${row.activity}\n${row.date}\n${row.owner}`; }
function download(row: Deliverable) {
  try {
    const url = URL.createObjectURL(new Blob([sampleContent(row)], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `${row.name}.sample.txt`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { Message.error(t('archive.downloadError')); }
}
</script>

<template>
  <div class="archive-layout">
    <aside class="directory" :aria-label="t('archive.directory')">
      <div class="directory-head"><h2>{{ t('archive.directory') }}</h2><a-input v-model="projectSearch" class="app-filter-control" allow-clear :placeholder="t('archive.projectSearch')" :aria-label="t('archive.projectSearch')"><template #prefix><IconSearch /></template></a-input></div>
      <a-empty v-if="!projects.length" :description="t('archive.noProjects')" />
      <button v-for="project in projects" :key="project.id" type="button" class="project-item" :class="{ active: project.id === selectedId }" :aria-pressed="project.id === selectedId" @click="selectProject(project.id)"><span>{{ project.name }}</span><small>{{ project.id }} · {{ t('archive.count', { count: project.count }) }}</small></button>
    </aside>
    <main class="archive-content">
      <AppListToolbar :title="selected.name" :summary="selected.id" />
      
      <form class="filters" @submit.prevent="search">
        <label class="filter-field"><AppFieldLabel :text="t('archive.name')" context="filter" /><a-input v-model="draft.name" class="app-filter-control" allow-clear :aria-label="t('archive.name')" /></label>
        <label class="filter-field"><AppFieldLabel :text="t('archive.activity')" context="filter" /><a-select v-model="draft.activity" class="app-filter-control" allow-clear :placeholder="t('archive.all')" :aria-label="t('archive.activity')"><a-option v-for="activity in activities" :key="activity" :value="activity">{{ activity }}</a-option></a-select></label>
        <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('archive.search') }}</a-button>
        <a-button @click="reset"><template #icon><IconRefresh /></template>{{ t('archive.reset') }}</a-button>
        <ColumnSettingsPopover v-model:visible="settingsVisible" :items="settings" :default-items="defaultColumns" :title="t('archive.columns')" :list-aria-label="t('archive.columns')" :show-label="t('archive.show')" :restore-label="t('archive.restore')" @change="columnState = $event"><a-button :aria-label="t('archive.columns')" :title="t('archive.columns')"><IconSettings /></a-button></ColumnSettingsPopover>
      </form>
      <div class="table-tools"><a-tooltip :content="t('archive.density')"><a-button :aria-label="t('archive.density')" :aria-pressed="compact" @click="compact = !compact"><IconLineHeight /></a-button></a-tooltip></div>
      <div class="table-region"><a-table row-key="id" :data="filtered.slice((current - 1) * pageSize, current * pageSize)" :columns="columns" :size="compact ? 'small' : 'medium'" :bordered="false" :pagination="false" :scroll="{ x: 900 }" @page-change="current = $event"><template #empty><a-empty :description="t('archive.empty')" /></template><template #cell="{ column, record }"><template v-if="column.dataIndex === 'actions'"><a-button type="text" @click="openPreview(record)">{{ t('archive.preview') }}</a-button><a-button type="text" @click="download(record)">{{ t('archive.download') }}</a-button></template></template></a-table></div>
      <AppPagination v-model:current="current" v-model:page-size="pageSize" :total="filtered.length" />
    </main>
    <a-modal v-model:visible="previewVisible" :title="preview?.name" :footer="false" :mask-closable="true" :esc-to-close="true" :width="720"><template v-if="preview"><pre class="preview-content">{{ sampleContent(preview) }}</pre><a-space><a-button type="primary" @click="download(preview)">{{ t('archive.download') }}</a-button><a-button @click="previewVisible = false">{{ t('archive.close') }}</a-button></a-space></template></a-modal>
  </div>
</template>

<style scoped>
.archive-layout { display: grid; grid-template-columns: 256px minmax(0, 1fr); gap: var(--mt-ds-space-4); min-height: calc(100vh - 120px); }
.directory, .archive-content { background: var(--app-surface); border-radius: var(--mt-ds-control-radius); min-width: 0; }
.directory-head { padding: var(--mt-ds-space-4); }
.directory h2 { margin: 0 0 var(--mt-ds-space-4); font-size: var(--mt-ds-font-body); font-weight: 400; }
.project-item { display: flex; flex-direction: column; gap: var(--mt-ds-space-1); width: 100%; padding: var(--mt-ds-space-3) var(--mt-ds-space-4); border: 0; border-left: 3px solid transparent; background: transparent; color: var(--app-text-primary); text-align: left; cursor: pointer; font: inherit; font-weight: 400; }
.project-item small, .mock-note { color: var(--mt-ds-text-muted); font-size: var(--mt-ds-font-caption); }
.project-item:hover { background: var(--color-fill-2); }
.project-item.active { background: var(--color-primary-light-1); border-left-color: var(--app-accent); color: var(--app-accent); }
.project-item:focus-visible { outline: 2px solid var(--app-accent); outline-offset: -2px; }
.archive-content { padding: var(--mt-ds-space-6); }
.mock-note { margin: 0 0 var(--mt-ds-space-4); }
.filters { display: flex; align-items: center; flex-wrap: wrap; gap: var(--mt-ds-space-4); }
.filter-field { display: inline-grid; grid-template-columns: max-content 200px; gap: var(--mt-ds-space-2); align-items: center; }
.table-tools { display: flex; justify-content: flex-end; margin: var(--mt-ds-space-2) 0 var(--mt-ds-space-4); }
.table-region { min-width: 0; overflow: auto; }
.table-region :deep(.arco-pagination) { display: none; }
.table-region :deep(th), .table-region :deep(td), .table-region :deep(button) { font-weight: 400; }
.preview-content { white-space: pre-wrap; overflow-wrap: anywhere; padding: var(--mt-ds-space-4); color: var(--app-text-primary); }
@media (max-width: 900px) { .archive-layout { grid-template-columns: minmax(0, 1fr); } .directory { max-height: 280px; overflow: auto; } .archive-content { padding: var(--mt-ds-space-4); } }
@media (max-width: 520px) { .filter-field { width: 100%; grid-template-columns: max-content minmax(0, 1fr); } }

:deep(.arco-table-th) { background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
:deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
</style>

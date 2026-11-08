<script setup lang="ts">
import { computed, reactive, ref, watch, toRaw } from 'vue';
import { useRoute, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { type TableColumnData, Message } from '@arco-design/web-vue';
import { IconPlus, IconSearch } from '@arco-design/web-vue/es/icon';
import AppListToolbar from '../../../design/components/AppListToolbar.vue';
import AppFormLayout from '../../../design/components/AppFormLayout.vue';
import AppDetailList from '../../../design/components/AppDetailList.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
const { t } = useI18n();
const route = useRoute();
const types = ['vehicle', 'technical', 'testing', 'report', 'certificate'];
interface Entry { id: string; name: string; format: string; note: string }
interface TemplateRecord { id: string; type: string; name: string; description: string; version: string; status: string; created: string; updated: string; entries: Entry[] }
const records = ref<TemplateRecord[]>(types.flatMap((type, index) => Array.from({ length: 7 }, (_, n) => ({ id: `TPL-${index + 1}-${n + 1}`, type, name: `TPL-${index + 1}-${n + 1}`, description: '', version: n % 2 ? 'V1.2.0' : 'V1.0.0', status: ['draft','reviewing','completed','rejected'][n % 4]!, created: '2025-12-31', updated: '2025-12-31', entries: [] }))));
const usage = computed(() => route.params.section === 'usage');
const active = ref('vehicle');
const keyword = ref('');
const status = ref('');
const applied = reactive({ keyword: '', status: '' });
const current = ref(1);
const pageSize = ref(10);
const selected = ref<TemplateRecord>();
const editing = ref(false);
const baseline = ref('');
const discard = ref(false);
const filtered = computed(() => records.value.filter(row => (usage.value || row.type === active.value) && `${row.name} ${row.id}`.toLowerCase().includes(applied.keyword.toLowerCase()) && (!applied.status || row.status === applied.status)));
const columns = computed<TableColumnData[]>(() => (usage.value ? ['name','type','version','project','user','used'] : ['name','description','status','version','created','updated']).map(key => ({ title: t(`templates.${key}`), dataIndex: key, slotName: key === 'status' || key === 'type' ? key : undefined, width: key === 'description' ? 240 : 180, fixed: undefined as 'right' | undefined })).concat([{ title: t('templates.actions'), dataIndex: 'actions', slotName: 'actions', width: 160, fixed: 'right' as const }]));
// Usage is independently seeded. Editing a template must preserve its historical version.
const usageRecords = records.value.slice(0, 12).map((row, index) => ({ ...row, project: `HMG-2025-${String(index + 1).padStart(3,'0')}`, user: 'Demo User', used: '2025-12-31 10:00' }));
const displayed = computed(() => usage.value ? usageRecords.filter(row => `${row.name} ${row.project}`.toLowerCase().includes(applied.keyword.toLowerCase())) : filtered.value);
function search() { Object.assign(applied, { keyword: keyword.value.trim(), status: status.value }); current.value = 1; }
function reset() { keyword.value = ''; status.value = ''; search(); }
watch([active, usage], reset);
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
      <a-tabs v-if="!usage" v-model:active-key="active" class="template-tabs">
        <a-tab-pane v-for="type in types" :key="type" :title="t(`templates.${type}`)" />
      </a-tabs>
      <form class="filter-panel" @submit.prevent="search">
        <div class="filter-field">
          <AppFieldLabel :text="t('templates.name')" for="template-search" context="filter" />
          <a-input id="template-search" v-model="keyword" class="app-filter-control" :aria-label="t('templates.name')" allow-clear />
        </div>
        <div v-if="!usage" class="filter-field">
          <AppFieldLabel :text="t('templates.status')" for="template-status" context="filter" />
          <a-select id="template-status" v-model="status" class="app-filter-control" :aria-label="t('templates.status')" :placeholder="t('templates.all')" allow-clear>
            <a-option value="">{{ t('templates.all') }}</a-option>
            <a-option v-for="state in ['draft','reviewing','completed','rejected']" :key="state" :value="state">{{ t(`templates.${state}`) }}</a-option>
          </a-select>
        </div>
        <div class="filter-actions">
          <a-button class="app-btn-neutral" @click="reset">{{ t('templates.reset') }}</a-button>
          <a-button type="primary" html-type="submit"><template #icon><IconSearch /></template>{{ t('templates.search') }}</a-button>
        </div>
      </form>
      <section class="list-panel">
        <AppListToolbar :title="t(usage ? 'templates.usage' : 'templates.config')" :summary="t('designSystem.total', { count: displayed.length })">
          <template v-if="!usage" #actions>
            <a-button type="primary" @click="open()"><template #icon><IconPlus /></template>{{ t('templates.new') }}</a-button>
          </template>
        </AppListToolbar>
        
        <div class="table-region">
          <a-table row-key="id" :columns="columns" :data="displayed.slice((current - 1) * pageSize, current * pageSize)" :bordered="false" :pagination="false" :scroll="{ x: 1300 }">
            <template #empty><a-empty :description="t('templates.empty')" /></template>
            <template #actions="{ record }">
              <div class="row-actions">
                <a-button type="text" @click="open(record, false)">{{ t('templates.view') }}</a-button>
                <a-button v-if="!usage && record.status === 'draft'" type="text" @click="open(record)">{{ t('templates.edit') }}</a-button>
              </div>
            </template>
            <template #status="{ record }"><a-tag>{{ t(`templates.${record.status}`) }}</a-tag></template>
            <template #type="{ record }">{{ t(`templates.${record.type}`) }}</template>
          </a-table>
        </div>
        <AppPagination v-model:current="current" v-model:page-size="pageSize" :total="displayed.length" />
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
              <a-form-item :label="t('templates.item')"><a-input v-model="entry.name" :aria-label="t('templates.item')" /></a-form-item>
              <a-form-item :label="t('templates.format')"><a-select v-model="entry.format" :aria-label="t('templates.format')"><a-option v-for="format in ['text','number','table','rich']" :key="format" :value="format">{{ t(`templates.${format}`) }}</a-option></a-select></a-form-item>
              <a-form-item :label="t('templates.note')"><a-input v-model="entry.note" :aria-label="t('templates.note')" /></a-form-item>
              <a-button type="text" status="danger" @click="selected.entries.splice(index,1)">{{ t('templates.remove') }}</a-button>
            </div>
            <a-empty v-if="!selected.entries.length" :description="t('templates.empty')" />
          </a-form>
        </AppFormLayout>
      </template>
      <template v-else>
        <AppDetailList :fields="(['name','description','version'] as const).map(key => ({ key, label: t(`templates.${key}`), value: selected![key] || '—' }))" />
        <h2 class="entry-heading">{{ t('templates.entries') }}</h2>
        <div v-for="entry in selected.entries" :key="entry.id" class="entry-fields">
          <AppDetailList :fields="[{ key: 'name', label: t('templates.item'), value: entry.name || '—' }, { key: 'format', label: t('templates.format'), value: t(`templates.${entry.format}`) }, { key: 'note', label: t('templates.note'), value: entry.note || '—' }]" />
        </div>
        <a-empty v-if="!selected.entries.length" :description="t('templates.empty')" />
      </template>
    </section>
    <ConfirmDialog unsaved v-model:visible="discard" :title="t('templates.leave')" @confirm="selected = undefined; discard = false" />
  </section>
</template>

<style scoped>
.templates-page { display: flex; flex-direction: column; gap: var(--mt-ds-space-4); min-width: 0; padding: var(--mt-ds-space-4); color: var(--mt-ds-text); }
.template-tabs { background: var(--mt-ds-surface); padding: 0 var(--mt-ds-space-4); }
.template-tabs :deep(.arco-tabs-content) { display: none; }
.template-tabs :deep(.arco-tabs-nav) { margin-bottom: 0; }
.filter-panel { display: flex; flex-wrap: wrap; align-items: center; gap: var(--mt-ds-space-4); padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); border-radius: var(--mt-ds-control-radius); }
.filter-field { display: grid; grid-template-columns: max-content var(--mt-ds-filter-width); align-items: center; gap: var(--mt-ds-space-2); min-width: 0; }
.filter-field :deep(.mt-field-label) { text-align: right; }
.filter-field :deep(.app-filter-control) { width: 100%; }
.filter-actions, .editor-actions { display: flex; flex-wrap: wrap; gap: var(--mt-ds-space-2); }
.list-panel, .editor-panel { min-width: 0; padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); border-radius: var(--mt-ds-control-radius); }
.table-region { min-width: 0; }
.demo-note { margin: 0 0 var(--mt-ds-space-4); color: var(--mt-ds-text-muted); font-size: var(--mt-ds-font-caption); line-height: var(--mt-ds-line-caption); }
.row-actions { display: flex; gap: var(--mt-ds-space-3); }
.row-actions :deep(.arco-btn) { padding: 0; font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-th), :deep(.arco-table-td), :deep(.arco-tag) { font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-th) { background: var(--app-surface); }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
.editor-actions { justify-content: flex-end; margin-bottom: var(--mt-ds-space-4); }
.entry-toolbar { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: var(--mt-ds-space-3); margin: var(--mt-ds-space-6) 0 var(--mt-ds-space-4); }
h2 { margin: 0; font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
.entry-heading { margin: var(--mt-ds-space-6) 0 var(--mt-ds-space-4); }
.entry-fields { padding: var(--mt-ds-space-4) 0; border-top: 1px solid var(--app-divider); }
@media (max-width: 600px) {
 .filter-panel { align-items: stretch; flex-direction: column; }
 .filter-field { grid-template-columns: minmax(0, 1fr); }
 .filter-field :deep(.mt-field-label) { text-align: left; }
 .filter-actions { justify-content: flex-end; }
}
</style>

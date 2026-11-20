<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { IconPlus } from '@arco-design/web-vue/es/icon';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppFormLayout from '../../../design/components/AppFormLayout.vue';
import AppListToolbar from '../../../design/components/AppListToolbar.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import ApiSession from '../../../shared/components/ApiSession.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import { currentApiUser, request, kinds, formats, type Schema, type TemplateVersion, type Field } from '../../../shared/api/hmg';
import { usePendingChanges } from '../../../shared/api/usePendingChanges';
const { t } = useI18n();
const rows = ref<TemplateVersion[]>([]); const loading = ref(false); const failure = ref(false); const busy = ref(false);
const keyword = ref(''); const applied = ref(''); const page = ref(1); const size = ref(10);
const draft = ref<Schema>(); const initial = ref(''); const selected = ref<TemplateVersion>();
const dirty = computed(() => !!draft.value && JSON.stringify(draft.value) !== initial.value);
const leave = usePendingChanges(dirty, busy);
const publish = ref<TemplateVersion>();
const filtered = computed(() => rows.value.filter(row => `${row.schema.name} ${row.schema.templateId} ${row.schema.revision}`.toLowerCase().includes(applied.value.toLowerCase())));
async function load() { loading.value=true; failure.value=false; try { rows.value=await request<TemplateVersion[]>('/template-versions'); } catch { failure.value=true; } finally { loading.value=false; } }
watch(currentApiUser, user => { if (user) void load(); }, { immediate:true });
function create(source?: TemplateVersion) {
  draft.value=source ? structuredClone(source.schema) : { templateId:'', revision:'1', name:'', kind:'VEHICLE', regulationId:'', fields:[] };
  if (source) draft.value.revision='';
  initial.value=JSON.stringify(draft.value); selected.value=undefined;
}
function addColumn(field: Field) { field.columns?.push({id:crypto.randomUUID(),label:'',format:'TEXT',required:false}); }
function addField() { draft.value?.fields.push({ id:crypto.randomUUID(), label:'', format:'TEXT', required:false }); }
function setFormat(field: Field) { field.columns=field.format==='TABLE' ? [{ id:'value', label:'', format:'TEXT', required:false }] : undefined; }
async function cancel() { if (await leave.check()) { draft.value=undefined; selected.value=undefined; } }
async function save() {
  if (!draft.value || busy.value) return;
  if (!draft.value.templateId.trim() || !draft.value.revision.trim() || !draft.value.name.trim() || !draft.value.fields.length || draft.value.fields.some(field => !field.label.trim() || field.format==='TABLE' && field.columns?.some(column=>!column.label.trim()))) { Message.error(t('connected.required')); document.querySelector<HTMLInputElement>('.template-editor input')?.focus(); return; }
  busy.value=true;
  try { await request('/template-versions',draft.value,'POST'); draft.value=undefined; await load(); Message.success(t('connected.created')); }
  catch { Message.error(t('connected.saveFailed')); }
  finally { busy.value=false; }
}
async function publishVersion() {
  if (!publish.value || busy.value) return;
  busy.value=true; try { await request(`/template-versions/${publish.value.id}/publish`,{},'POST'); publish.value=undefined; await load(); } catch { Message.error(t('connected.saveFailed')); } finally { busy.value=false; }
}
</script>
<template>
  <ApiSession><section class="connected-templates">
    <template v-if="!draft && !selected">
      <form class="filter-panel" @submit.prevent="applied=keyword.trim();page=1"><div class="filter-field"><AppFieldLabel :text="t('connected.name')" context="filter" for="connected-template-search" /><a-input id="connected-template-search" v-model="keyword" class="app-filter-control" allow-clear /></div><a-button @click="keyword='';applied='';page=1">{{ t('connected.reset') }}</a-button><a-button type="primary" html-type="submit">{{ t('connected.search') }}</a-button></form>
      <section class="surface"><AppListToolbar :title="t('connected.templates')"><template #actions><a-button type="primary" @click="create()"><template #icon><IconPlus /></template>{{ t('connected.newVersion') }}</a-button></template></AppListToolbar>
        <a-alert v-if="failure" type="error">{{ t('connected.loadFailed') }} <a-button type="text" @click="load">{{ t('connected.retry') }}</a-button></a-alert>
        <a-table :data="filtered.slice((page-1)*size,page*size)" row-key="id" :pagination="false" :bordered="false" :loading="loading" :scroll="{x:900}"><template #columns>
          <a-table-column :title="t('connected.name')" :width="200"><template #cell="{record}">{{ record.schema.name }}</template></a-table-column>
          <a-table-column :title="t('connected.templateId')" :width="180"><template #cell="{record}">{{ record.schema.templateId }}</template></a-table-column>
          <a-table-column :title="t('connected.revision')" :width="100"><template #cell="{record}">{{ record.schema.revision }}</template></a-table-column>
          <a-table-column :title="t('connected.kind')" :width="120"><template #cell="{record}">{{ t(`connected.kinds.${record.schema.kind}`) }}</template></a-table-column>
          <a-table-column :title="t('connected.status')" :width="120"><template #cell="{record}">{{ t(record.published?'connected.published':'connected.unpublished') }}</template></a-table-column>
          <a-table-column :title="t('connected.actions')" :width="260" fixed="right"><template #cell="{record}"><div class="row-actions"><a-button type="text" @click="selected=record">{{ t('connected.detail') }}</a-button><a-button type="text" @click="create(record)">{{ t('connected.newVersion') }}</a-button><a-button v-if="!record.published" type="text" @click="publish=record">{{ t('connected.publish') }}</a-button></div></template></a-table-column>
        </template><template #empty><a-empty :description="t('connected.empty')" /></template></a-table>
        <AppPagination v-model:current="page" v-model:page-size="size" :total="filtered.length" />
      </section>
    </template>
    <section v-else class="surface template-editor">
      <div class="toolbar"><a-button :disabled="busy" @click="cancel">{{ t('connected.back') }}</a-button><a-button v-if="draft" type="primary" :loading="busy" @click="save">{{ t('connected.save') }}</a-button></div>
      <AppFormLayout v-if="draft"><a-form :model="draft" layout="vertical">
        <a-form-item v-for="key in ['templateId','revision','name'] as const" :key="key" required><template #label><AppFieldLabel :text="t(`connected.${key}`)" /></template><a-input v-model="draft[key]" :aria-label="t(`connected.${key}`)" /></a-form-item>
        <a-form-item required><template #label><AppFieldLabel :text="t('connected.kind')" /></template><a-select v-model="draft.kind" :aria-label="t('connected.kind')"><a-option v-for="kind in kinds" :key="kind">{{ t(`connected.kinds.${kind}`) }}</a-option></a-select></a-form-item>
        <a-form-item v-if="draft.kind!=='VEHICLE'" required><template #label><AppFieldLabel :text="t('connected.regulationId')" /></template><a-input v-model="draft.regulationId" :aria-label="t('connected.regulationId')" /></a-form-item>
        <div v-for="(field,index) in draft.fields" :key="field.id" class="field-editor">
          <a-form-item required><template #label><AppFieldLabel :text="t('connected.fieldName')" /></template><a-input v-model="field.label" :aria-label="t('connected.fieldName')" /></a-form-item>
          <a-form-item><template #label><AppFieldLabel :text="t('connected.format')" /></template><a-select v-model="field.format" :aria-label="t('connected.format')" @change="setFormat(field)"><a-option v-for="format in formats" :key="format">{{ t(`connected.formats.${format}`) }}</a-option></a-select></a-form-item>
          <a-checkbox v-model="field.required">{{ t('connected.mandatory') }}</a-checkbox>
          <template v-if="field.format==='NUMBER'"><a-form-item :label="t('connected.minimum')"><a-input-number v-model="field.minimum" :aria-label="t('connected.minimum')" /></a-form-item><a-form-item :label="t('connected.maximum')"><a-input-number v-model="field.maximum" :aria-label="t('connected.maximum')" /></a-form-item></template>
          <a-form-item v-if="field.format==='TEXT'||field.format==='RICH'" :label="t('connected.maxLength')"><a-input-number v-model="field.maxLength" :min="1" :max="100000" :aria-label="t('connected.maxLength')" /></a-form-item>
          <template v-if="field.format==='TABLE'"><div v-for="(column,columnIndex) in field.columns" :key="column.id" class="column-editor"><a-input v-model="column.label" :aria-label="t('connected.columnName')" :placeholder="t('connected.columnName')" /><a-select v-model="column.format" :aria-label="t('connected.format')"><a-option value="TEXT">{{ t('connected.formats.TEXT') }}</a-option><a-option value="NUMBER">{{ t('connected.formats.NUMBER') }}</a-option></a-select><a-checkbox v-model="column.required">{{ t('connected.mandatory') }}</a-checkbox><a-button status="danger" @click="field.columns?.splice(columnIndex,1)">{{ t('connected.remove') }}</a-button></div><a-button @click="addColumn(field)">{{ t('connected.addColumn') }}</a-button></template>
          <a-button type="text" status="danger" @click="draft.fields.splice(index,1)">{{ t('connected.remove') }}</a-button>
        </div>
        <a-button @click="addField">{{ t('connected.addField') }}</a-button>
      </a-form></AppFormLayout>
      <template v-else-if="selected"><p>{{ selected.schema.name }} · {{ selected.schema.revision }} · {{ t(`connected.kinds.${selected.schema.kind}`) }}</p><dl><div v-for="field in selected.schema.fields" :key="field.id"><dt>{{ field.label }}</dt><dd>{{ t(`connected.formats.${field.format}`) }} · {{ t(field.required?'connected.mandatory':'connected.optional') }}</dd></div></dl></template>
    </section>
    <ConfirmDialog :visible="leave.visible.value" unsaved :title="t('connected.unsaved')" @update:visible="leave.finish(false)" @confirm="leave.finish(true)" />
    <ConfirmDialog :visible="!!publish" :title="t('connected.publishConfirm')" :ok-loading="busy" :dismissible="!busy" @update:visible="publish=undefined" @confirm="publishVersion" />
  </section></ApiSession>
</template>
<style scoped>
.connected-templates { display:grid; gap:var(--mt-ds-space-4); min-width:0; }
.surface,.filter-panel { background:var(--mt-ds-surface); padding:var(--mt-ds-space-4); min-width:0; }
.filter-panel,.toolbar,.row-actions { display:flex; flex-wrap:wrap; align-items:center; gap:var(--mt-ds-space-3); }
.filter-field { display:grid; grid-template-columns:max-content var(--mt-ds-filter-width); gap:var(--mt-ds-space-2); align-items:center; }
.toolbar { justify-content:flex-end; margin-bottom:var(--mt-ds-space-4); }
.field-editor { border-top:1px solid var(--mt-ds-border); padding:var(--mt-ds-space-4) 0; }
.column-editor { display:grid; gap:var(--mt-ds-space-2); margin:var(--mt-ds-space-3) 0; }
:deep(th),:deep(td),:deep(.arco-btn),:deep(.arco-form-item-label) { font-weight:var(--mt-ds-weight-body); }
:deep(.arco-table-th) { background:var(--mt-ds-surface); }
dl>div { display:flex; flex-wrap:wrap; gap:var(--mt-ds-space-4); margin-bottom:var(--mt-ds-space-3); } dd { margin:0; }
@media(max-width:600px) { .filter-field { width:100%; grid-template-columns:minmax(0,1fr); } }
</style>

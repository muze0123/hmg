<script setup lang="ts">
import { IconMore } from '@arco-design/web-vue/es/icon';
import AppPagination from '../../../design/components/AppPagination.vue';
import { watch, computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { items, STATUS_CODES, TYPE_CODES, PRIORITY_CODES, type Item } from '../data/items';
const { t } = useI18n();
const rows = ref(items.map(x=>({...x})));
const initial = { project:'', name:'', law:'', priority:'', type:'', status:'', start:'', end:'', actual:'' };
const draft = reactive({...initial}); const applied = ref({...initial});
const filtered = computed(()=>rows.value.filter(row=>Object.entries(applied.value).every(([key,value])=>!value||String(row[key as keyof Item]).includes(value))));
const page = ref(1);
function search(){applied.value={...draft};page.value=1;}
function reset(){Object.assign(draft,initial);search();}
const selected = ref<Item>(); const mode=ref('view'); const visible=ref(false);const comment=ref('');const error=ref(false);
function open(row:Item, action:string){selected.value={...row};mode.value=action;comment.value='';error.value=false;visible.value=true;}
function save(status?:Item['status']) { if(!selected.value)return;if(mode.value==='review'&&!comment.value.trim()){error.value=true;return;}const index=rows.value.findIndex(x=>x.id===selected.value!.id);rows.value[index]={...selected.value,status:status??selected.value.status};visible.value=false;Message.success(t('sections.saved')); }
function download(row:Item){const fields=['project','name','law','priority','type','status','start','end','actual'] as const;const cell=(v:string)=>'"'+v.replaceAll('"','""')+'"';const csv=[fields.map(k=>cell(t(`sections.${k}`))).join(','),fields.map(k=>cell(['priority','type','status'].includes(k)?t(`sections.${row[k]}`):row[k])).join(',')].join('\r\n');const url=URL.createObjectURL(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=row.id+'.csv';a.click();URL.revokeObjectURL(url);}
const pageSize = ref(10);
watch(filtered, () => { page.value = 1; });
</script>
<template>
<main class="sections">

<a-form :model="draft" layout="inline" class="filters" @submit-success="search">
<a-form-item v-for="field in ['project','name','law'] as const" :key="field" :label="t(`sections.${field}`)"><a-input v-model="draft[field]" allow-clear @press-enter="search" /></a-form-item>
<a-form-item v-for="field in ['priority','type','status'] as const" :key="field" :label="t(`sections.${field}`)"><a-select v-model="draft[field]" allow-clear :placeholder="t('sections.all')"><a-option v-for="code in field==='priority'?PRIORITY_CODES:field==='type'?TYPE_CODES:STATUS_CODES" :key="code" :value="code">{{t(`sections.${code}`)}}</a-option></a-select></a-form-item>
<a-form-item v-for="field in ['start','end','actual'] as const" :key="field" :label="t(`sections.${field}`)"><a-date-picker v-model="draft[field]" /></a-form-item>
<div class="filter-actions"><a-button @click="reset">{{t('sections.reset')}}</a-button><a-button type="primary" @click="search">{{t('sections.search')}}</a-button></div>
</a-form>
<a-table :data="filtered.slice((page - 1) * pageSize, page * pageSize)" row-key="id" :scroll="{x:1500}" :pagination="false" :bordered="false" @page-change="page=$event">
<template #columns>
<a-table-column v-for="field in ['project','name','priority','law','status','type','start','end','actual'] as const" :key="field" :title="t(`sections.${field}`)" :width="field==='law'?160:130"><template #cell="{record}"><a-tag v-if="field==='status'" :color="record.status==='completed'?'green':record.status==='rejected'?'red':undefined">{{t(`sections.${record.status}`)}}</a-tag><span v-else>{{['type','priority'].includes(field)?t(`sections.${record[field]}`):record[field]||'—'}}</span></template></a-table-column>
<a-table-column :title="t('sections.action')" :width="300" fixed="right"><template #cell="{record}"><a-space><a-button type="text" size="small" @click="open(record,'view')">{{t('sections.view')}}</a-button><a-button type="text" size="small" @click="open(record,'edit')">{{t('sections.edit')}}</a-button><a-dropdown trigger="hover" position="br" popup-container="body" content-class="row-more-dropdown"><a-button size="mini" :aria-label="t('testing.more')" :title="t('testing.more')"><IconMore /></a-button><template #content><a-doption :disabled="record.status!=='reviewing'" @click="open(record,'review')">{{t('sections.review')}}</a-doption><a-doption @click="download(record)">{{t('sections.export')}}</a-doption></template></a-dropdown></a-space></template></a-table-column>
</template><template #empty><a-empty :description="t('sections.empty')" /></template></a-table><AppPagination v-model:current="page" v-model:page-size="pageSize" :total="filtered.length" />
<a-drawer v-model:visible="visible" :width="600" :title="t(`sections.${mode==='view'?'detail':mode}`)" :mask-closable="mode==='view'" :esc-to-close="mode==='view'">
<template v-if="selected"><a-descriptions :column="1" bordered><a-descriptions-item v-for="field in ['project','name','law','type','status'] as const" :key="field" :label="t(`sections.${field}`)">{{['type','status'].includes(field)?t(`sections.${selected[field]}`):selected[field]}}</a-descriptions-item></a-descriptions>
<a-form :model="selected" layout="vertical" class="editor" v-if="mode==='edit'"><a-form-item :label="t('sections.priority')"><a-select v-model="selected.priority"><a-option v-for="code in PRIORITY_CODES" :key="code" :value="code">{{t(`sections.${code}`)}}</a-option></a-select></a-form-item><a-form-item :label="t('sections.end')"><a-date-picker v-model="selected.end" :allow-clear="false" /></a-form-item></a-form>
<a-form v-if="mode==='review'" :model="{comment}" layout="vertical" class="editor"><a-form-item :label="t('sections.note')" required :error="error" :help="error?t('sections.required'):''"><a-textarea v-model="comment" :max-length="500" /></a-form-item></a-form></template>
<template #footer><a-space><a-button @click="visible=false">{{t('sections.cancel')}}</a-button><template v-if="mode==='review'"><a-button status="danger" @click="save('rejected')">{{t('sections.reject')}}</a-button><a-button type="primary" @click="save('completed')">{{t('sections.pass')}}</a-button></template><a-button v-if="mode==='edit'" type="primary" @click="save()">{{t('sections.save')}}</a-button></a-space></template>
</a-drawer>
</main>
</template>
<style scoped>
.sections{padding:24px;min-width:0;color:var(--color-text-1)}h1{font-size:20px;margin:0 0 8px}header p{color:var(--color-text-3);margin:0 0 24px}.filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0 24px;padding-bottom:24px;border-bottom:1px solid var(--color-border-2);margin-bottom:24px}.filter-actions{grid-column:1/-1;display:flex;justify-content:flex-end;gap:12px}.filters :deep(.arco-picker){width:100%}.editor{margin-top:24px}@media(max-width:900px){.filters{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.sections{padding:16px}.filters{grid-template-columns:1fr}}

.sections { padding: var(--mt-ds-space-4); }
.filters { display: flex; flex-wrap: wrap; gap: var(--mt-ds-space-4); padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); border: 0; margin-bottom: var(--mt-ds-space-4); }
.filters :deep(.arco-form-item) { display: grid; grid-template-columns: max-content var(--mt-ds-filter-width); gap: var(--mt-ds-space-2); align-items: center; margin: 0; width: auto; flex: 0 0 auto; }
.filters :deep(.arco-form-item-label-col) { padding: 0; text-align: right; }
.filter-actions { margin-left: auto; }
.sections :deep(th), .sections :deep(td), .sections :deep(.arco-tag) { font-weight: var(--mt-ds-weight-body); }
.editor { width: var(--mt-ds-form-width); max-width: 100%; }

@media (max-width: 600px) {
 .filters { flex-direction: column; align-items: stretch; }
 .filters > *, .filters > .arco-input-wrapper, .filters > .arco-select { width: 100%; }
 .filters :deep(.arco-form-item) { grid-template-columns: minmax(0, 1fr); width: 100%; }
 .filters :deep(.arco-form-item-label-col) { text-align: left; }
}

.filters :deep(.arco-form-item-wrapper-col) { width: var(--mt-ds-filter-width); flex: none; }
.filters :deep(.arco-form-item-label-col) { flex: none; width: auto; }
.filters :deep(.arco-input-wrapper), .filters :deep(.arco-select), .filters :deep(.arco-picker) { width: 100%; }
@media (max-width: 600px) { .filters :deep(.arco-form-item-wrapper-col) { width: 100%; } }

:deep(.arco-table-th) { background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
:deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
</style>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import ExcelJS from 'exceljs';
import { Message } from '@arco-design/web-vue';
import { IconDownload } from '@arco-design/web-vue/es/icon';
import AppDetailList from '../../../design/components/AppDetailList.vue';
import { tagRecords } from '../../tags/data/tags';
import type { TemplateRecord, Entry } from '../data/templates';
const props = defineProps<{ record: TemplateRecord; records: TemplateRecord[] }>();
const { t, te, locale } = useI18n();
const checked = ref<string[]>([]); const exporting = ref(false);
const fields = computed(() => ['name','type', ...(props.record.type === 'technical' ? ['regulationType'] : []), ...(props.record.type !== 'vehicle' ? ['regulation'] : []), 'region','country','vehicleType','version','baseVersion','description','versionNote','status','createdBy','created','updatedBy','updated']);
function label(key: string) { return t(['regulationType','version','baseVersion','versionNote'].includes(key) ? `templateEditor.${key}` : `templates.${key}`); }
function value(row: TemplateRecord, key: string): string {
 const raw = row[key as keyof TemplateRecord]; if (raw === undefined || raw === '') return '—';
 const text = String(raw);
 if (key === 'type') return t(`templates.${text}`);
 if (key === 'status') return t(`templates.${text}`);
 if (key === 'regulationType') return t(text === 'basic' ? 'templateEditor.basicRegulation' : 'templateEditor.single');
 if (key === 'baseVersion') return props.records.find(r => r.id === text)?.name || text;
 const prefix = ({region:'regions',country:'countries',vehicleType:'vehicleTypes'} as Record<string,string>)[key];
 if (prefix && te(`templates.${prefix}.${text}`)) return t(`templates.${prefix}.${text}`);
 if (key === 'country' && /^[A-Z]{2}$/.test(text)) return new Intl.DisplayNames([locale.value],{type:'region'}).of(text) || text;
 return text;
}
const configKeys = computed(() => props.record.type === 'vehicle' ? ['number','name','format','tag','columns'] : ['number','name','format','columns', ...(props.record.type === 'technical' ? ['tag','partsCertificate'] : ['technical', ...(['report','certificate'].includes(props.record.type) ? ['testing'] : []), ...(props.record.type === 'certificate' ? ['report'] : []), 'note'])]);
function configLabel(key: string) { const suffix = ({name: 'configItem', format: 'configFormat'} as Record<string,string>)[key] || key; return t(`templateEditor.${suffix}`); }
function cell(entry: Entry, key: string): string { const raw = entry[key as keyof Entry]; if (!raw || (Array.isArray(raw) && !raw.length)) return '—'; if (key === 'format') return t(raw === 'ordered' ? 'templateEditor.ordered' : `templates.${raw}`); if (key === 'columns') return (entry.columns || []).join(' / ') || '—'; if (key === 'tag') return tagRecords.value.find(r=>r.id===raw)?.name || String(raw); if (key === 'partsCertificate') return t(`templateEditor.${raw}`); if (['technical','testing','report'].includes(key)) return props.records.find(r=>r.id===raw)?.name || String(raw); return String(raw); }
const versions = computed(() => {
 const siblings = props.records.filter(r=>r.type===props.record.type && r.name===props.record.name);
 const rows = siblings.flatMap(r=>[...(r.history || []),r]);
 if (!rows.some(r=>r.id===props.record.id && r.version===props.record.version)) rows.push(props.record);
 return [...new Map(rows.filter(r=>r.name===props.record.name && r.type===props.record.type).map(r=>[`${r.id}:${r.version}`,r])).values()].sort((a,b)=>b.updated.localeCompare(a.updated));
});
const keyOf = (row: TemplateRecord) => `${row.id}:${row.version}`;
const events = computed(() => [...(props.record.events || [])].reverse());
async function exportVersions() {
 if (exporting.value || !checked.value.length) return; exporting.value = true;
 try {
  const book = new ExcelJS.Workbook();
  for (const [index,row] of versions.value.filter(r=>checked.value.includes(keyOf(r))).entries()) {
   const sheet = book.addWorksheet(`${index+1}`);
   sheet.addRow([t('templateEditor.basic')]);
   for (const field of fields.value) sheet.addRow([label(field),value(row,field)]);
   sheet.addRow([]);sheet.addRow([t('templates.entries')]);sheet.addRow(configKeys.value.map(configLabel));
   for (const entry of row.entries) sheet.addRow(configKeys.value.map(key=>cell(entry,key)));
   sheet.columns.forEach(column=>{column.width=28;});
  }
  const blob = new Blob([await book.xlsx.writeBuffer() as BlobPart],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'});
  const url = URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download=`${props.record.id}.xlsx`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 } catch { Message.error(t('templates.exportFailed')); } finally { exporting.value=false; }
}
</script>
<template>
 <div class="template-detail">
  <div class="detail-block"><h2>{{ t('templateEditor.basic') }}</h2><AppDetailList :colon="true" :fields="fields.map(key=>({key,label:label(key),value:value(record,key)}))" /></div>
  <div class="detail-block"><h2>{{ t('templates.entries') }}</h2><div class="table-scroll"><table><thead><tr><th v-for="key in configKeys" :key="key">{{ configLabel(key) }}</th></tr></thead><tbody><tr v-for="entry in record.entries" :key="entry.id"><td v-for="key in configKeys" :key="key">{{ cell(entry,key) }}</td></tr></tbody></table></div><a-empty v-if="!record.entries.length" /></div>
  <div class="detail-block"><h2>{{ t('templateDetail.versions') }}</h2>
   <div v-if="checked.length" class="selection-toolbar"><a-button type="text" :loading="exporting" @click="exportVersions"><template #icon><IconDownload /></template>{{ t('templates.export') }}</a-button><span>{{ t('templateDetail.selected',{count:checked.length}) }}</span><a-button type="text" :disabled="exporting" @click="checked=[]">{{ t('templateDetail.clear') }}</a-button></div>
   <div class="table-scroll"><table><thead><tr><th><a-checkbox :model-value="checked.length === versions.length && !!versions.length" :indeterminate="!!checked.length && checked.length < versions.length" :aria-label="t('templateDetail.selectAll')" @change="v=>checked=v ? versions.map(keyOf) : []" /></th><th v-for="key in ['version','versionNote','updatedBy','updated']" :key="key">{{ label(key) }}</th></tr></thead><tbody><tr v-for="row in versions" :key="keyOf(row)"><td><a-checkbox :model-value="checked.includes(keyOf(row))" :aria-label="row.version" @change="v=>checked=v ? [...checked,keyOf(row)] : checked.filter(k=>k!==keyOf(row))" /></td><td>{{ row.version || '—' }}</td><td>{{ row.versionNote || '—' }}</td><td>{{ row.updatedBy }}</td><td>{{ row.updated }}</td></tr></tbody></table></div>
  </div>
  <div class="detail-block"><h2>{{ t('templateDetail.timeline') }}</h2><a-timeline v-if="events.length" class="processing-timeline"><a-timeline-item v-for="(event,index) in events" :key="index"><div class="timeline-heading"><span>{{ t(`templateDetail.${event.action}`) }}</span><span>{{ event.actor }}</span><time>{{ event.time }}</time></div><p v-if="event.opinion">{{ event.opinion }}</p></a-timeline-item></a-timeline><a-empty v-else :description="t('templateDetail.noEvents')" /></div>
 </div>
</template>
<style scoped>
.template-detail { display:grid; grid-template-columns:minmax(0,1fr); gap:var(--mt-ds-space-3); }
.detail-block { padding:var(--mt-ds-space-4); background:var(--app-surface); border-radius:var(--mt-ds-control-radius); min-width:0; }
h2 { margin:0 0 var(--mt-ds-space-3); padding-bottom:var(--mt-ds-space-3); border-bottom:1px solid var(--app-divider); font-size:var(--mt-ds-font-title); line-height:var(--mt-ds-line-title); font-weight:var(--mt-ds-weight-title); }
:deep(.mt-detail-list) { grid-template-columns:repeat(3,minmax(0,1fr)); gap:var(--mt-ds-space-4); }
:deep(.mt-detail-list__row) { display:flex; align-items:baseline; gap:var(--mt-ds-space-2); min-width:0; }
:deep(.mt-detail-list dt) { flex-shrink:0; }
@media(max-width:900px) { :deep(.mt-detail-list) { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media(max-width:600px) { :deep(.mt-detail-list) { grid-template-columns:minmax(0,1fr); } }
.table-scroll { overflow-x:auto; min-width:0; }
table { width:100%; min-width:640px; border-collapse:collapse; }
th,td { text-align:left; padding:var(--mt-ds-space-3); border-bottom:1px solid var(--app-divider); font-weight:400; height:50px; overflow-wrap:anywhere; }
th { background:var(--app-table-header); }
.selection-toolbar { display:flex; align-items:center; gap:var(--mt-ds-space-2); margin-bottom:var(--mt-ds-space-3); background:var(--color-primary-light-1); border:1px solid var(--app-color-primary); border-radius:var(--mt-ds-control-radius); }
.selection-toolbar span { margin-left:auto; }
.timeline-heading { display:flex; flex-wrap:wrap; gap:var(--mt-ds-space-4); }
time { color:var(--color-text-3); }
p { white-space:pre-wrap; overflow-wrap:anywhere; }
:deep(.processing-timeline .arco-timeline-item:not(.arco-timeline-item-last)) { padding-bottom:var(--mt-ds-space-6); }
</style>

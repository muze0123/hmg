<script setup lang="ts">
import { computed, ref, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconPlus, IconDelete, IconArrowUp, IconArrowDown, IconDragDotVertical } from '@arco-design/web-vue/es/icon';
import { Message } from '@arco-design/web-vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import { TEMPLATE_REGULATIONS, TEMPLATE_REGION_CODES, type TemplateRecord, type Entry } from '../data/templates';
import { tagRecords } from '../../tags/data/tags';
import { regionCountries } from '../data/countries';
const props = defineProps<{ record: TemplateRecord; history: TemplateRecord[] }>();
const { t, locale } = useI18n();
const attempted = ref(false);
const form = ref<{ validate: () => Promise<unknown> }>();
function entryValid(e: Entry) { return !!(e.name.trim() && e.format && (e.format !== 'table' || (e.columns?.length && e.columns.every(c => c.trim()))) && ((props.record.type === 'vehicle' && !!e.tag && !!e.number?.trim()) || (props.record.type !== 'vehicle' && e.number?.trim() && (props.record.type !== 'technical' || (e.tag && e.partsCertificate)) && (props.record.type === 'technical' || e.technical) && (!['report','certificate'].includes(props.record.type) || e.testing) && (props.record.type !== 'certificate' || e.report)))); }
const basicKeys = computed(() => ['name', ...(props.record.type === 'technical' ? ['regulationType'] : []), ...(props.record.type !== 'vehicle' ? ['regulation'] : []), 'region','country','vehicleType','version','baseVersion','description','versionNote'] as (keyof Pick<TemplateRecord,'name'|'regulationType'|'regulation'|'region'|'country'|'vehicleType'|'version'|'baseVersion'|'description'|'versionNote'>)[]);
const extraKeys = computed(() => props.record.type === 'technical' ? ['tag','partsCertificate'] as const : props.record.type === 'vehicle' ? ['tag'] as const : ['technical', ...(['report','certificate'].includes(props.record.type) ? ['testing'] : []), ...(props.record.type === 'certificate' ? ['report'] : []), 'note'] as ('technical'|'testing'|'report'|'note')[]);
function references(type: string) { return props.history.filter(r => r.type === type && r.status === 'completed'); }
async function validate() { attempted.value = true; const errors = await form.value?.validate(); return !errors && props.record.entries.length > 0 && props.record.entries.every(entryValid); }
defineExpose({ validate });
const countries = computed(() => regionCountries[props.record.region] || []);
const names = computed(() => new Intl.DisplayNames([locale.value], { type: 'region' }));
const historical = computed(() => props.history.filter(r => r.type === props.record.type && r.status === 'completed' && r.id !== props.record.id));
function inherit(id: string) { const base = historical.value.find(r => r.id === id); if (base) props.record.entries = structuredClone(toRaw(base.entries)); }
function add(index = props.record.entries.length) { props.record.entries.splice(index, 0, { id: crypto.randomUUID(), name: '', format: 'text', note: '' }); }
function move(index: number, target: number) { if (target < 0 || target >= props.record.entries.length) return; const [entry] = props.record.entries.splice(index, 1); if (entry) props.record.entries.splice(target, 0, entry); }
const source = ref(-1); const destination = ref(-1); const after = ref(false);
function resetDrag() { source.value = destination.value = -1; }
function start(event: DragEvent, index: number) { const row = (event.target as HTMLElement).closest('tr')!; const rect = row.getBoundingClientRect(); source.value = index; event.dataTransfer?.setData('text/plain', String(index)); event.dataTransfer?.setDragImage(row, event.clientX - rect.left, event.clientY - rect.top); }
function over(event: DragEvent, index: number) { event.preventDefault(); const rect = (event.currentTarget as HTMLElement).getBoundingClientRect(); after.value = event.clientY > rect.top + rect.height / 2; const insertion = index + Number(after.value); const target = insertion > source.value ? insertion - 1 : insertion; destination.value = source.value >= 0 && target !== source.value ? index : -1; }
function drop() { if (destination.value >= 0) { const insertion = destination.value + Number(after.value); move(source.value, insertion > source.value ? insertion - 1 : insertion); } resetDrag(); }
const columnDrag = ref<{ entry: Entry; source: number; destination: number; after: boolean }>();
function startColumn(event: DragEvent, entry: Entry, index: number) {
  resetDrag();
  const row = (event.currentTarget as HTMLElement).closest('.column-row')!;
  const rect = row.getBoundingClientRect();
  columnDrag.value = { entry, source: index, destination: -1, after: false };
  event.dataTransfer?.setData('text/plain', String(index));
  event.dataTransfer?.setDragImage(row, event.clientX - rect.left, event.clientY - rect.top);
}
function overColumn(event: DragEvent, entry: Entry, index: number) {
  const drag = columnDrag.value;
  if (!drag || drag.entry !== entry) return;
  event.preventDefault();
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  drag.after = event.clientY > rect.top + rect.height / 2;
  const insertion = index + Number(drag.after);
  drag.destination = (insertion > drag.source ? insertion - 1 : insertion) === drag.source ? -1 : index;
}
function dropColumn() {
  const drag = columnDrag.value;
  if (drag && drag.destination >= 0) {
    const insertion = drag.destination + Number(drag.after);
    const target = insertion > drag.source ? insertion - 1 : insertion;
    shiftColumn(drag.entry, drag.source, target - drag.source);
  }
  columnDrag.value = undefined;
}
const columnEntry = ref<Entry>(); const batch = ref('');
function configure(entry: Entry) { columnEntry.value = entry; batch.value = (entry.columns || []).join('\n'); }
function applyColumns() { const values = batch.value.split('\n').map(v => v.trim()).filter(Boolean); if (!values.length || new Set(values).size !== values.length) { Message.error(t('templateEditor.columnError')); return; } if (columnEntry.value) columnEntry.value.columns = values; columnEntry.value = undefined; }
function shiftColumn(entry: Entry, index: number, offset: number) { const list = entry.columns || []; const target = index + offset; if (target < 0 || target >= list.length) return; const [value] = list.splice(index,1); list.splice(target,0,value!); }
function placeholder(key: string, select = false) { const label = ['versionNote','baseVersion','version','regulationType'].includes(key) ? t(`templateEditor.${key}`) : t(`templates.${key}`); return t(select ? 'templateEditor.selectHint' : 'templateEditor.inputHint', { field: label }); }
</script>
<template>
  <div class="vehicle-template-editor">
    <div class="editor-block"><h2>{{ t('templateEditor.basic') }}</h2>
    <a-form ref="form" :model="record" layout="vertical" class="basic-fields">
      <template v-for="key in basicKeys" :key="key">
      <div v-if="key === 'description' && ['testing','report','certificate'].includes(record.type)" class="form-row-break" aria-hidden="true" />
      <a-form-item :field="key" :rules="['description','versionNote','baseVersion'].includes(key) ? [] : [{ required: true, message: t('templateEditor.required') }]" :required="!['description','versionNote','baseVersion'].includes(key)" :data-template-name="key === 'name' ? '' : undefined">
        <template #label><AppFieldLabel :text="['versionNote','baseVersion','version','regulationType'].includes(key) ? t(`templateEditor.${key}`) : t(`templates.${key}`)" :colon="true" /></template>
        <a-select v-if="key === 'regulationType'" v-model="record.regulationType" :placeholder="placeholder(key,true)" allow-clear :aria-label="t('templateEditor.regulationType')"><a-option v-for="code in ['basic','single']" :key="code" :value="code">{{ t(code === 'basic' ? 'templateEditor.basicRegulation' : 'templateEditor.single') }}</a-option></a-select>
        <a-select v-else-if="key === 'regulation'" v-model="record.regulation" :placeholder="placeholder(key,true)" allow-clear allow-search :aria-label="t('templates.regulation')"><a-option v-for="code in TEMPLATE_REGULATIONS" :key="code" :value="code">{{ code }}</a-option></a-select>
        <a-textarea v-else-if="key === 'description' || key === 'versionNote'" v-model="record[key]" :placeholder="placeholder(key)" :max-length="200" show-word-limit allow-clear :aria-label="t(key === 'description' ? 'templates.description' : 'templateEditor.versionNote')" />
        <a-select v-else-if="key === 'region'" v-model="record.region" :placeholder="placeholder('region', true)" allow-clear :aria-label="t('templates.region')" @change="record.country = ''"><a-option v-for="region in TEMPLATE_REGION_CODES" :key="region" :value="region">{{ t(`templates.regions.${region}`) }}</a-option></a-select>
        <a-select v-else-if="key === 'country'" v-model="record.country" :placeholder="placeholder('country', true)" :disabled="!record.region" allow-search allow-clear :aria-label="t('templates.country')"><a-option v-for="country in countries" :key="country" :value="country">{{ names.of(country) }}</a-option></a-select>
        <a-select v-else-if="key === 'baseVersion'" v-model="record.baseVersion" :placeholder="placeholder('baseVersion', true)" allow-clear :aria-label="t('templateEditor.baseVersion')" @change="value => inherit(String(value))"><a-option v-for="item in historical" :key="item.id" :value="item.id">{{ item.name }}</a-option></a-select>
        <a-input v-else v-model="record[key]" :placeholder="placeholder(key)" :max-length="20" show-word-limit allow-clear :aria-label="t(key === 'version' ? 'templateEditor.version' : `templates.${key}`)" />
      </a-form-item></template>
    </a-form></div><div class="editor-block">
    <div class="configuration-heading"><h2>{{ t('templates.entries') }}</h2><a-button class="add-outline" @click="add()"><template #icon><IconPlus /></template>{{ t('templates.add') }}</a-button></div>
    <a-alert v-if="attempted && (!record.entries.length || record.entries.some(e => !entryValid(e)))" type="error">{{ t('templateEditor.fieldError') }}</a-alert><div class="fields-scroll"><table class="field-table" :class="{ 'extended-table': record.type !== 'vehicle' }"><thead><tr><th></th><th>{{ t('templateEditor.number') }}</th><th>{{ t('templateEditor.configItem') }}</th><th>{{ t('templateEditor.configFormat') }}</th><th v-for="key in extraKeys" :key="key">{{ t(`templateEditor.${key}`) }}</th><th>{{ t('templates.actions') }}</th></tr></thead><tbody>
      <tr v-for="(entry,index) in record.entries" :key="entry.id" :class="{ dragging: source === index, destination: destination === index, before: destination === index && !after, after: destination === index && after }" @dragover="over($event,index)" @dragleave="destination = -1" @drop.prevent="drop">
        <td><button class="drag-handle" draggable="true" :aria-label="t('templateEditor.reorder')" @dragstart="start($event,index)" @dragend="resetDrag" @keydown.alt.up.prevent="move(index,index-1)" @keydown.alt.down.prevent="move(index,index+1)"><IconDragDotVertical /></button></td>
        <td><a-input v-model="entry.number" :max-length="50" allow-clear :placeholder="t('templateEditor.numberHint')" :aria-label="t('templateEditor.number')" /></td><td><a-input v-model="entry.name" :placeholder="t('templateEditor.configItemHint')" :max-length="20" allow-clear :aria-label="t('templateEditor.configItem')" /></td>
        <td><a-select class="format-select" v-model="entry.format" :placeholder="t('templateEditor.selectHint', { field: t('templateEditor.configFormat') })" :aria-label="t('templateEditor.configFormat')"><a-option v-for="format in ['number','ordered','table','rich','text']" :key="format" :value="format">{{ format === 'ordered' ? t('templateEditor.ordered') : t(`templates.${format}`) }}</a-option></a-select><div v-if="entry.format === 'table'" class="inline-columns">
          <div v-for="(_,columnIndex) in entry.columns || []" :key="columnIndex" class="column-row" :class="{ dragging: columnDrag?.entry === entry && columnDrag.source === columnIndex, destination: columnDrag?.entry === entry && columnDrag.destination === columnIndex, before: columnDrag?.entry === entry && columnDrag.destination === columnIndex && !columnDrag.after, after: columnDrag?.entry === entry && columnDrag.destination === columnIndex && columnDrag.after }" @dragover.stop="overColumn($event,entry,columnIndex)" @dragleave.stop="columnDrag && (columnDrag.destination = -1)" @drop.stop.prevent="dropColumn">
            <button type="button" class="drag-handle" draggable="true" :aria-label="t('templateEditor.reorder')" @dragstart.stop="startColumn($event,entry,columnIndex)" @dragend.stop="columnDrag = undefined" @keydown.alt.up.prevent="shiftColumn(entry,columnIndex,-1)" @keydown.alt.down.prevent="shiftColumn(entry,columnIndex,1)"><IconDragDotVertical /></button>
            <a-input v-model="entry.columns![columnIndex]" :placeholder="t('templateEditor.columnHint')" :aria-label="t('templateEditor.columnName')" />
            <a-button type="text" :aria-label="t('templates.remove')" @click="entry.columns!.splice(columnIndex,1)"><IconDelete /></a-button>
            <a-button type="text" :disabled="columnIndex === 0" :aria-label="t('templateEditor.up')" @click="shiftColumn(entry,columnIndex,-1)"><IconArrowUp /></a-button>
            <a-button type="text" :disabled="columnIndex === entry.columns!.length-1" :aria-label="t('templateEditor.down')" @click="shiftColumn(entry,columnIndex,1)"><IconArrowDown /></a-button>
          </div>
          <a-button type="text" @click="configure(entry)">{{ t('templateEditor.batch') }}</a-button>
          <a-button type="text" @click="(entry.columns ||= []).push('')"><IconPlus />{{ t('templateEditor.addColumn') }}</a-button>
        </div></td>
        <td v-for="key in extraKeys" :key="key">
          <a-input v-if="key === 'note'" v-model="entry.note" :max-length="100" allow-clear :placeholder="t('templateEditor.inputHint',{field:t('templateEditor.note')})" :aria-label="t('templateEditor.note')" />
          <a-select v-else v-model="entry[key]" allow-clear allow-search :placeholder="t('templateEditor.selectHint',{field:t(`templateEditor.${key}`)})" :aria-label="t(`templateEditor.${key}`)">
            <template v-if="key === 'tag'"><a-option v-for="tag in tagRecords" :key="tag.id" :value="tag.id">{{ tag.name }}</a-option></template>
            <template v-else-if="key === 'partsCertificate'"><a-option v-for="code in ['yes','no']" :key="code" :value="code">{{ t(`templateEditor.${code}`) }}</a-option></template>
            <template v-else><a-option v-for="item in references(key)" :key="item.id" :value="item.id">{{ item.name }}</a-option></template>
          </a-select>
        </td><td class="actions-cell"><div class="row-actions"><a-button :aria-label="t('templates.remove')" type="text" status="danger" @click="record.entries.splice(index,1)"><IconDelete /></a-button><a-button :aria-label="t('templates.add')" type="text" @click="add(index+1)"><IconPlus /></a-button><a-button :aria-label="t('templateEditor.up')" type="text" :disabled="index === 0" @click="move(index,index-1)"><IconArrowUp /></a-button><a-button :aria-label="t('templateEditor.down')" type="text" :disabled="index === record.entries.length-1" @click="move(index,index+1)"><IconArrowDown /></a-button></div></td>
      </tr>
    </tbody></table></div><a-empty v-if="!record.entries.length" :description="t('templateEditor.empty')" />
    </div><a-modal :visible="!!columnEntry" :title="t('templateEditor.columns')" :mask-closable="false" @cancel="columnEntry = undefined" @ok="applyColumns">
      <p>{{ t('templateEditor.batchHint') }}</p>
      <a-textarea v-model="batch" :auto-size="{ minRows: 7, maxRows: 12 }" :placeholder="t('templateEditor.batchHint')" :aria-label="t('templateEditor.batch')" />
    </a-modal>
  </div>
</template>
<style scoped>
.vehicle-template-editor { min-width: 0; display:grid; grid-template-columns:minmax(0,1fr); gap:12px; }
.editor-block { padding:16px; background:var(--app-surface); border-radius:var(--mt-ds-control-radius); min-width:0; }
.add-outline { background:transparent; color:var(--app-color-primary); border:1px solid var(--app-color-primary); }
.field-table .format-select { width:240px; max-width:100%; }
.inline-columns { margin-top:12px; }
td { vertical-align:top; }
.field-table { table-layout:fixed; }
.field-table:not(.extended-table) th:nth-child(2) { width:30%; }
h2 { font-size: var(--mt-ds-font-body); margin: 0 0 16px; }
.basic-fields.arco-form { display:flex; flex-direction:row; flex-wrap:wrap; gap: 16px; align-items:flex-start; }
.basic-fields :deep(.arco-form-item) { flex: 0 1 400px; max-width:100%; margin-bottom:0; }
.form-row-break { flex-basis:100%; height:0; margin-top:-16px; }
.configuration-heading { display:flex; justify-content:space-between; align-items:center; margin-top:0; margin-bottom:16px; }
.configuration-heading h2 { margin:0; }
.fields-scroll { overflow-x:auto; }
.field-table { width:100%; border-collapse:collapse; min-width:1200px; }
th { background:var(--app-table-header); font-weight:400; text-align:left; }
th, td { padding:12px; border-bottom:1px solid var(--app-divider); }
th:first-child { width:40px; } th:last-child { width:184px; }
.drag-handle { border:0; background:transparent; color:var(--color-text-3); cursor:grab; width:20px; height:28px; }
.dragging { opacity:.55; cursor:grabbing; }
.destination { background:var(--color-primary-light-1); }
.before { box-shadow:0 -3px var(--app-accent); }
.after { box-shadow:0 3px var(--app-accent); }
.field-table.extended-table { min-width:1600px; }
.extended-table th:not(:first-child):not(:last-child) { width:240px; }
.row-actions { display:flex; align-items:center; gap:var(--mt-ds-space-2); flex-wrap:nowrap; }
.row-actions :deep(.arco-btn), .column-row :deep(.arco-btn) { flex:0 0 32px; width:32px; height:32px; padding:0; display:inline-flex; align-items:center; justify-content:center; }
.column-row { display:flex; align-items:center; gap:8px; margin-bottom:8px; }
.column-row :deep(.arco-input-wrapper) { flex:1 1 0; min-width:0; }
.column-row .drag-handle { flex:0 0 20px; }

</style>

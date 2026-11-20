<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { IconPlus, IconDelete, IconArrowUp, IconArrowDown, IconLeft, IconRight, IconMenuFold, IconMenuUnfold } from '@arco-design/web-vue/es/icon';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import RichValue from './RichValue.vue';
import { richHasContent } from '../../task-execution/utils/richText';
import { partCatalogSeed, partLabel } from '../../task-execution/data/parts';
import { people } from '../../projects/data/projects';
import { collaborationReady } from '../data/collaboration';
import type { Entry, Vehicle, FillingAssignment } from '../data/vehicle';
const props = defineProps<{ readonly: boolean; manager: boolean; actor: string; tableLabel?: string; positiveEntryId?: string; positiveMessage?: string }>();
const task = defineModel<Vehicle>({ required: true });
const emit = defineEmits<{ change: []; save: [done: (success: boolean) => void] }>();
const { t, locale } = useI18n();
const root = ref<HTMLElement>();
const mine = ref(false);
const errors = ref<string[]>([]);
const deleting = ref<number>();
const owners = computed(() => [...new Set([props.actor, task.value.executor, ...people, ...(task.value.assignments || []).map(group => group.owner)])].filter(Boolean));
const groups = computed(() => task.value.assignments || []);
const visibleEntries = computed(() => [...task.value.entries].filter(entry => !mine.value || groupFor(entry)?.owner === props.actor).sort((a,b) => groups.value.findIndex(group => group.tag === a.tag) - groups.value.findIndex(group => group.tag === b.tag)));
const ready = computed(() => collaborationReady(task.value));
function label(group?: FillingAssignment) { return group?.label || t('vehicleCollab.unclassified'); }
function groupFor(entry: Entry) { return groups.value.find(group => group.tag === entry.tag); }
function editable(entry: Entry) { const group = groupFor(entry); return !props.readonly && group?.owner === props.actor && group.status !== 'submitted' && entry.format !== 'ordered' && !entry.referenceTaskId; }
function changed() { errors.value = []; emit('change'); }
function setValue(entry: Entry, row: number, value: string) {
  if (!editable(entry)) return;
  entry.values[row] = value;
  const group = groupFor(entry); if (group) group.status = 'filling';
  changed();
}
function assign(group: FillingAssignment, owner: string) {
  if (!props.manager || props.readonly || group.status === 'submitted') return;
  group.owner = owner; group.status = 'pending'; group.reason = ''; group.submittedAt = undefined; changed();
}
function key(entry: Entry, row: number) { return `${entry.id || entry.name}-${task.value.rowIds?.[row]}`; }
function invalid(entry: Entry, row: number) {
  const value = entry.values[row]?.trim() || '';
  if (entry.format === 'ordered') return false;
  if (entry.format === 'rich') return !richHasContent(value);
  if (entry.format === 'table') return !value || value.split('\n').some(line => { const cells = line.split('\t'); return (entry.columns || []).some((_,index) => !cells[index]?.trim()); });
  return !value || entry.format === 'number' && (!Number.isFinite(Number(value)) || !!props.positiveEntryId && entry.id === props.positiveEntryId && Number(value) <= 0);
}
function partEditable(entry: Entry) { const group = groupFor(entry); return !props.readonly && group?.owner === props.actor && group.status !== 'submitted'; }
function setPart(entry: Entry, value?: string) { if (!partEditable(entry)) return; entry.partId = value || ''; const group = groupFor(entry); if(group) group.status = 'filling'; changed(); }
function partInvalid(entry: Entry) { return entry.partsCertificate === 'yes' && !partCatalogSeed.some(part => part.id === entry.partId); }
function validate(tag?: string) {
  mine.value = false;
  errors.value = task.value.entries.filter(entry => !tag || entry.tag === tag).flatMap(entry => (task.value.rowIds || []).flatMap((_,row) => invalid(entry,row) ? [key(entry,row)] : []));
  errors.value.push(...task.value.entries.filter(entry => (!tag || entry.tag === tag) && partInvalid(entry)).map(entry => `part-${entry.id || entry.name}`));
  if (!task.value.rowIds?.length || !task.value.entries.length) { Message.error(t('vehicleFill.empty')); return false; }
  if (errors.value.length) {
    const next = new Set(collapsedColumns.value);
    for(const entry of task.value.entries) for(const [index,id] of (task.value.rowIds || []).entries()) if(errors.value.includes(key(entry,index))) next.delete(id);
    collapsedColumns.value = next;
    nextTick(() => { const cell = root.value?.querySelector<HTMLElement>('[data-invalid="true"]'); cell?.scrollIntoView({ block: 'center', inline: 'center' }); cell?.querySelector<HTMLElement>('input,button,[tabindex]')?.focus(); }); return false;
  }
  return true;
}
async function submit(group: FillingAssignment) {
  if (props.readonly || group.owner !== props.actor || group.status === 'submitted' || !validate(group.tag)) return;
  const previous = { ...group };
  group.status = 'submitted'; group.submittedAt = new Date().toISOString(); group.reason = ''; changed();
  const saved = await new Promise<boolean>(done => emit('save', done));
  if (!saved) Object.assign(group, previous);
}
function resetSubmissions() { for (const group of groups.value) { group.status = group.status === 'submitted' ? 'pending' : group.status; group.submittedAt = undefined; } }
/** 参数值列：行式存储（rowIds × entries）保持不变，仅在展示层转置为「配置项为行、参数值为列」。 */
function addValueColumn() {
  if (!props.manager || props.readonly) return;
  task.value.rowIds!.push(crypto.randomUUID()); for (const entry of task.value.entries) entry.values.push(''); resetSubmissions(); changed();
}
function removeValueColumn() {
  const index = deleting.value;
  if (index === undefined || !props.manager || props.readonly || task.value.rowIds!.length <= 1) return;
  const removedId = task.value.rowIds![index]!;
  task.value.rowIds!.splice(index,1); for (const entry of task.value.entries) entry.values.splice(index,1);
  const next = new Set(collapsedColumns.value); next.delete(removedId); collapsedColumns.value = next;
  deleting.value = undefined; resetSubmissions(); changed();
}
function moveValueColumn(col: number, offset: number) {
  if (!props.manager || props.readonly) return;
  const target = col + offset; if (target < 0 || target >= task.value.rowIds!.length) return;
  for (const list of [task.value.rowIds!, ...task.value.entries.map(entry => entry.values)]) { const [value] = list.splice(col,1); list.splice(target,0,value!); } changed();
}
/** 单列 / 全部参数值列的收起与展开，纯展示态不触发脏数据。 */
const collapsedColumns = ref<Set<string>>(new Set());
const allCollapsed = computed(() => !!task.value.rowIds?.length && task.value.rowIds.every(id => collapsedColumns.value.has(id)));
function toggleColumn(id: string) {
  const next = new Set(collapsedColumns.value);
  if (next.has(id)) next.delete(id); else next.add(id);
  collapsedColumns.value = next;
}
function toggleAllColumns() {
  collapsedColumns.value = allCollapsed.value ? new Set() : new Set(task.value.rowIds || []);
}
function entryDone(entry: Entry) { return groupFor(entry)?.status === 'submitted'; }
const editor = ref<{ entry: Entry; row: number; value: string; original: string; writable: boolean }>();
const editorLeave = ref(false);
function openEditor(entry: Entry,row: number) { editor.value = { entry, row, value: entry.values[row] || '', original: entry.values[row] || '', writable: editable(entry) }; }
function closeEditor() { if (editor.value?.value !== editor.value?.original) editorLeave.value = true; else editor.value = undefined; }
function saveEditor() { if (!editor.value) return; setValue(editor.value.entry,editor.value.row,editor.value.value); editor.value = undefined; }
function tableRows() { if (!editor.value) return []; const width = editor.value.entry.columns?.length || 1; return (editor.value.value || Array(width).fill('').join('\t')).split('\n').map(line => Array.from({length:width},(_,index) => line.split('\t')[index] || '')); }
function editTable(row: number, column: number, value: string) { if (!editor.value?.writable) return; const rows = tableRows(); rows[row]![column] = value; editor.value.value = rows.map(row => row.join('\t')).join('\n'); }
function tableRow(index?: number) { if (!editor.value?.writable) return; const rows = tableRows(); if(index === undefined) rows.push(Array(editor.value.entry.columns?.length || 1).fill('')); else if(rows.length > 1) rows.splice(index,1); editor.value.value = rows.map(row => row.join('\t')).join('\n'); }
function moveTableRow(row: number, offset: number) { if (!editor.value?.writable) return; const rows = tableRows(); const target = row + offset; if (target < 0 || target >= rows.length) return; [rows[row], rows[target]] = [rows[target]!, rows[row]!]; editor.value.value = rows.map(line => line.join('\t')).join('\n'); }
const returning = ref<FillingAssignment>();
const reason = ref('');
const reasonError = ref(false);
const returnLeave = ref(false);
function closeReturn() { if (actionBusy.value) return; if (reason.value.trim()) returnLeave.value = true; else returning.value = undefined; }
const actionBusy = ref(false);
async function returnGroup() {
  if (!returning.value || !props.manager || props.readonly || actionBusy.value) return;
  if (!reason.value.trim()) { reasonError.value = true; nextTick(() => document.getElementById('return-reason')?.focus()); return; }
  const group = returning.value; const previous = { ...group };
  group.status = 'returned'; group.reason = reason.value.trim(); group.submittedAt = undefined; changed(); actionBusy.value = true;
  const saved = await new Promise<boolean>(done => emit('save', done));
  actionBusy.value = false;
  if (saved) returning.value = undefined; else Object.assign(group, previous);
}
function plainText(value: string) { const div = typeof document !== 'undefined' ? document.createElement('div') : undefined; if (div) div.innerHTML = value; return ((div?.textContent || div?.innerText) || value.replace(/<[^>]*>/g, '')).replace(/\*\*/g, '').replace(/\*/g, ''); }
function summary(entry: Entry,row: number) { const value = entry.values[row] || ''; return entry.format === 'table' ? value.trim() ? t('vehicleCollab.tableRows',{count:value.split('\n').length}) : t('vehicleCollab.open') : plainText(value).trim().slice(0,40) || t('vehicleCollab.open'); }
const overlayDirty = computed(() => !!editor.value && editor.value.value !== editor.value.original || !!reason.value.trim() && !!returning.value);
defineExpose({ validate, ready, overlayDirty });
</script>
<template>
  <div ref="root" class="vehicle-values">
    <div class="assignment-list">
      <div v-for="group in groups" :key="group.tag" class="assignment">
        <div class="assignment-summary"><span>{{ label(group) }}</span><AppStatusTag :role="group.status === 'submitted' ? 'success' : group.status === 'returned' ? 'danger' : 'info'" :label="t(`vehicleCollab.${group.status}`)" /><span class="muted">{{ t('vehicleCollab.fields', {count: task.entries.filter(entry => entry.tag === group.tag).length}) }}</span></div>
        <div class="assignment-actions"><a-select v-if="manager && !readonly" :model-value="group.owner" :disabled="group.status === 'submitted'" :aria-label="t('vehicleCollab.owner', {tag:label(group)})" :placeholder="t('vehicleCollab.unassigned')" @update:model-value="value => assign(group,String(value))"><a-option v-for="owner in owners" :key="owner" :value="owner">{{ owner }}</a-option></a-select><span v-else>{{ group.owner || t('vehicleCollab.unassigned') }}</span><a-button v-if="!readonly && group.owner === actor && group.status !== 'submitted'" class="app-btn-neutral" size="small" @click="submit(group)">{{ t('vehicleCollab.submitMine') }}</a-button><a-button v-if="manager && !readonly && group.status === 'submitted'" class="app-btn-neutral" size="small" @click="returning = group; reason = ''; reasonError = false">{{ t('vehicleCollab.return') }}</a-button></div>
        <p v-if="group.reason" class="return-note"><AppFieldLabel context="detail" :text="t('vehicleCollab.reason')" /> {{ group.reason }}</p>
      </div>
    </div>
    <div class="grid-toolbar">
      <span class="muted">{{ t('vehicleCollab.progress', {done:groups.filter(group => group.status === 'submitted').length,total:groups.length}) }}</span>
      <a-space>
        <a-checkbox v-model="mine">{{ t('vehicleCollab.onlyMine') }}</a-checkbox>
        <a-button class="app-btn-neutral" @click="toggleAllColumns">{{ allCollapsed ? t('vehicleFill.expandAll') : t('vehicleFill.collapseAll') }}</a-button>
        <a-button v-if="manager && !readonly" type="outline" class="add-column-button" @click="addValueColumn"><template #icon><IconPlus /></template>{{ t('vehicleFill.addColumn') }}</a-button>
      </a-space>
    </div>
    <div v-if="visibleEntries.length" class="table-scroll" tabindex="0" :aria-label="tableLabel || t('vehicle.items')">
      <table class="parameter-table">
        <thead><tr>
          <th scope="col" class="col-no">{{ t('vehicleFill.no') }}</th>
          <th scope="col" class="col-item">{{ t('vehicleFill.item') }}</th>
          <th scope="col" class="col-format">{{ t('vehicleFill.format') }}</th>
          <th scope="col" class="col-status">{{ t('vehicleFill.status') }}</th>
          <th scope="col" class="col-tag">{{ t('vehicleFill.tag') }}</th>
          <th scope="col" class="col-part">{{ t('executionWorkspace.part') }}</th>
          <th v-for="(id,col) in task.rowIds" :key="id" scope="col" class="col-value" :class="{ 'is-collapsed': collapsedColumns.has(id) }">
            <div class="value-col-head">
              <span v-if="!collapsedColumns.has(id)" class="value-col-title">{{ t('vehicleFill.valueColumn', {n: col + 1}) }}</span>
              <a-button class="app-btn-neutral col-icon" :aria-label="`${collapsedColumns.has(id) ? t('vehicleFill.expand') : t('vehicleFill.collapse')} ${t('vehicleFill.valueColumn', {n: col + 1})}`" @click="toggleColumn(id)">
                <IconMenuUnfold v-if="collapsedColumns.has(id)" /><IconMenuFold v-else />
              </a-button>
              <template v-if="manager && !readonly && !collapsedColumns.has(id)">
                <a-button class="app-btn-neutral col-icon" :aria-label="t('vehicleFill.moveLeft', {n: col + 1})" :disabled="col === 0" @click="moveValueColumn(col, -1)"><IconLeft /></a-button>
                <a-button class="app-btn-neutral col-icon" :aria-label="t('vehicleFill.moveRight', {n: col + 1})" :disabled="col === task.rowIds!.length - 1" @click="moveValueColumn(col, 1)"><IconRight /></a-button>
                <a-button class="app-btn-neutral col-icon" :aria-label="t('vehicleFill.removeColumn', {n: col + 1})" :disabled="task.rowIds!.length <= 1" @click="deleting = col"><IconDelete /></a-button>
              </template>
            </div>
          </th>
        </tr></thead>
        <tbody>
          <tr v-for="(entry,index) in visibleEntries" :key="entry.id || entry.name">
            <td class="col-no">{{ index + 1 }}</td>
            <td class="col-item">
              <div>{{ entry.name }}</div>

            </td>
            <td class="col-format">{{ t(`vehicle.${entry.format}`) }}</td>
            <td class="col-status">{{ entryDone(entry) ? t('vehicleFill.done') : t('vehicleFill.toFill') }}</td>
            <td class="col-tag">{{ label(groupFor(entry)) }}</td>
            <td class="col-part" :data-invalid="errors.includes(`part-${entry.id || entry.name}`)">
              <a-select v-if="partEditable(entry)" :model-value="entry.partId" allow-search allow-clear :aria-label="`${t('executionWorkspace.part')} ${entry.name}`" :placeholder="t('executionWorkspace.selectPart')" @update:model-value="value => setPart(entry,value ? String(value) : '')">
                <a-option v-for="part in partCatalogSeed" :key="part.id" :value="part.id">{{ partLabel(part.id) }}</a-option>
                <a-option v-if="entry.partId && !partCatalogSeed.some(part => part.id === entry.partId)" :value="entry.partId" disabled>{{ entry.partId }} · {{ t('executionWorkspace.partUnavailable') }}</a-option>
              </a-select>
              <span v-else>{{ partLabel(entry.partId) }}</span>
              <p v-if="errors.includes(`part-${entry.id || entry.name}`)" role="alert" class="field-error">{{ t('executionWorkspace.partRequired') }}</p>
            </td>
            <td v-for="(id,col) in task.rowIds" :key="id" class="col-value" :data-invalid="errors.includes(key(entry,col))" :class="{ 'readonly-cell': !editable(entry), 'is-collapsed': collapsedColumns.has(id) }">
              <template v-if="collapsedColumns.has(id)"><span class="collapsed-hint">…</span></template>
              <template v-else>
                <span v-if="entry.format === 'ordered'">{{ col + 1 }}</span>
                <a-button v-else-if="['rich','table'].includes(entry.format)" type="text" class="cell-open" :aria-label="`${entry.name} ${col + 1}`" @click="openEditor(entry,col)">{{ summary(entry,col) }}</a-button>
                <a-input v-else-if="editable(entry)" :model-value="entry.values[col]" :input-attrs="{'aria-label': `${entry.name} ${col + 1}`, inputmode: entry.format === 'number' ? 'decimal' : 'text'}" @update:model-value="value => setValue(entry,col,value)" />
                <span v-else>{{ entry.values[col] || '—' }}</span>
                <p v-if="errors.includes(key(entry,col))" role="alert" class="field-error">{{ entry.id === positiveEntryId && positiveMessage ? positiveMessage : t(entry.format === 'number' ? 'vehicleFill.numberRequired' : 'vehicleFill.required') }}</p>
              </template>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <a-empty v-else :description="t('vehicleCollab.noFields')" />
  </div>
  <a-drawer class="value-drawer" :visible="!!editor" :width="'min(900px, 100vw)'" :title="editor?.entry.name" :footer="true" :mask-closable="false" @cancel="closeEditor">
    <template v-if="editor"><div class="value-drawer-group"><RichValue :key="locale" v-if="editor.entry.format === 'rich'" v-model="editor.value" :readonly="!editor.writable" input-id="cell-rich" :label="editor.entry.name" /><div v-else class="table-scroll"><table class="sub-table"><thead><tr><th v-for="(column,index) in editor.entry.columns" :key="index">{{ column }}</th><th v-if="editor.writable">{{ t('vehicle.action') }}</th></tr></thead><tbody><tr v-for="(line,row) in tableRows()" :key="row"><td v-for="(value,column) in line" :key="column"><a-input v-if="editor.writable" :model-value="value" :input-attrs="{'aria-label': `${editor.entry.name} ${row+1} ${editor.entry.columns?.[column]}`}" @update:model-value="value => editTable(row,column,value)" /><span v-else>{{ value || '—' }}</span></td><td v-if="editor.writable"><a-space size="mini"><a-button class="app-btn-neutral table-row-icon" :disabled="row === 0" :aria-label="t('vehicleCollab.up',{row:row+1})" @click="moveTableRow(row,-1)"><IconArrowUp /></a-button><a-button class="app-btn-neutral table-row-icon" :disabled="row === tableRows().length - 1" :aria-label="t('vehicleCollab.down',{row:row+1})" @click="moveTableRow(row,1)"><IconArrowDown /></a-button><a-button class="app-btn-neutral table-row-icon" :disabled="tableRows().length <= 1" :aria-label="t('vehicleFill.removeRow',{row:row+1})" @click="tableRow(row)"><IconDelete /></a-button></a-space></td></tr></tbody></table><a-button v-if="editor.writable" type="outline" class="add-row-button" @click="tableRow()">{{ t('vehicleFill.addRow') }}</a-button></div></div></template>
    <template #footer><a-space><a-button class="app-btn-neutral" @click="closeEditor">{{ t('templates.cancel') }}</a-button><a-button v-if="editor?.writable" type="primary" @click="saveEditor">{{ t('vehicleCollab.apply') }}</a-button></a-space></template>
  </a-drawer>
  <a-modal role="dialog" aria-modal="true" :aria-label="t('vehicleCollab.returnTitle', {tag:label(returning)})" :visible="!!returning" :title="t('vehicleCollab.returnTitle', {tag:label(returning)})" :mask-closable="false" @cancel="closeReturn"><AppFieldLabel as="label" for="return-reason" context="editable" :text="t('vehicleCollab.reason')" /><a-textarea v-model="reason" :textarea-attrs="{id:'return-reason'}" :error="reasonError" /><p v-if="reasonError" role="alert" class="field-error">{{ t('vehicleCollab.reasonRequired') }}</p><template #footer><a-space><a-button class="app-btn-neutral" @click="closeReturn">{{ t('templates.cancel') }}</a-button><a-button type="primary" :loading="actionBusy" @click="returnGroup">{{ t('vehicleCollab.return') }}</a-button></a-space></template></a-modal>
  <ConfirmDialog :visible="deleting !== undefined" :title="t('vehicleCollab.deleteTitle')" :description="t('vehicleCollab.deleteDescription')" @update:visible="deleting = undefined" @confirm="removeValueColumn" />
  <ConfirmDialog unsaved :visible="editorLeave" :title="t('vehicle.unsaved')" @update:visible="editorLeave = false" @confirm="editorLeave = false; editor = undefined" />
  <ConfirmDialog unsaved :visible="returnLeave" :title="t('vehicle.unsaved')" @update:visible="returnLeave = false" @confirm="returnLeave = false; returning = undefined" />
</template>
<style scoped>
.vehicle-values { min-width: 0; display: flex; flex-direction: column; gap: var(--mt-ds-space-4); }
.assignment-list { display: flex; flex-wrap: wrap; gap: var(--mt-ds-space-3); }
.assignment { flex: 1 1 320px; min-width: 0; border: 1px solid var(--app-divider); padding: var(--mt-ds-space-4); }
.assignment-summary, .assignment-actions { display: flex; flex-wrap: wrap; align-items: center; gap: var(--mt-ds-space-3); }
.assignment-actions { margin-top: var(--mt-ds-space-3); }
.assignment-actions :deep(.arco-select) { width: 160px; }
.muted { color: var(--color-text-3); }
.return-note { margin-bottom: 0; color: var(--app-color-danger); overflow-wrap: anywhere; }
.grid-toolbar { display: flex; align-items: center; justify-content: space-between; gap: var(--mt-ds-space-3); flex-wrap: wrap; }
.grid-toolbar :deep(.arco-space) { flex-wrap: wrap; }
.table-scroll { max-width: 100%; overflow: auto; }
.parameter-table, .sub-table { width: 100%; border-collapse: separate; border-spacing: 0; }
/* 纵向矩阵：配置项为行、参数值为列；固定元信息列 + 可增删调序的动态参数值列。 */
.parameter-table { width: max-content; min-width: 100%; }
.parameter-table th, .parameter-table td, .sub-table th, .sub-table td { min-width: 160px; border-right: 1px solid var(--app-divider); border-bottom: 1px solid var(--app-divider); padding: var(--mt-ds-space-3); text-align: left; font-weight: var(--mt-ds-weight-body); vertical-align: top; }
.parameter-table th, .sub-table th { border-top: 1px solid var(--app-divider); background: var(--app-table-header); }
.parameter-table th:first-child, .parameter-table td:first-child, .sub-table th:first-child, .sub-table td:first-child { border-left: 1px solid var(--app-divider); }
.parameter-table .col-no { min-width: 56px; width: 56px; text-align: center; }
.parameter-table .col-item { min-width: 180px; }
.parameter-table .col-format { min-width: 100px; }
.parameter-table .col-status { min-width: 90px; }
.parameter-table .col-part { min-width: 240px; max-width: 280px; }
.parameter-table .col-part :deep(.arco-select) { width: 240px; }
.parameter-table .col-tag { min-width: 100px; }
.parameter-table .col-value { min-width: 180px; }
/* 收起的列收窄到刚好容纳一个展开按钮，表头与单元格内容居中。 */
.parameter-table .col-value.is-collapsed { min-width: 44px; width: 44px; padding-left: var(--mt-ds-space-2); padding-right: var(--mt-ds-space-2); }
.value-col-head { display: flex; align-items: center; gap: var(--mt-ds-space-1); flex-wrap: wrap; }
.parameter-table .col-value.is-collapsed .value-col-head { justify-content: center; }
.parameter-table td.col-value.is-collapsed { text-align: center; }
.value-col-title { font-weight: var(--mt-ds-weight-body); }
.col-icon.arco-btn, .sub-table .table-row-icon.arco-btn { display: inline-grid; flex: 0 0 24px; width: 24px; height: 24px; padding: 0; place-items: center; }
.collapsed-hint { color: var(--color-text-3); letter-spacing: 2px; }
.cell-open { max-width: 100%; white-space: normal; height: auto; text-align: left; }
.readonly-cell { background: var(--app-fill-1); overflow-wrap: anywhere; }
.field-error { margin: var(--mt-ds-space-2) 0 0; color: var(--app-color-danger); }
.sub-table { margin-bottom: var(--mt-ds-space-3); }
/* 新增参数值列 / 新增数据行：outline primary，透明底 + 主色高亮描边与文字，不叠加 app-btn-neutral（否则会被覆盖成灰描边）。 */
.add-column-button.arco-btn, .add-row-button.arco-btn { background-color: transparent; }
/* 抽屉内容分组白卡（灰画布由 global.css 的 .value-drawer 规则提供）；
   富文本与表格区块统一 100% 填满白卡内容区，左右与卡片 16px 内边距对齐。 */
.value-drawer-group { width: 100%; padding: 16px; border-radius: 2px; background: var(--app-surface); }
.value-drawer-group .rich-value, .value-drawer-group .table-scroll { width: 100%; max-width: 100%; }
</style>

<script setup lang="ts">
import { computed, nextTick, ref, shallowReactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { IconPlusCircle, IconMinusCircle, IconQuestionCircle, IconInfoCircle, IconCheckCircleFill, IconExclamationCircleFill } from '@arco-design/web-vue/es/icon';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import RichValue from './RichValue.vue';
import ParameterTableValue from './ParameterTableValue.vue';
import { richHasContent } from '../../task-execution/utils/richText';
import { partCatalogSeed, partLabel } from '../../task-execution/data/parts';
import { tagRecords, tagOwnerName } from '../../tags/data/tags';
import { assignmentIsMine, collaborationReady } from '../data/collaboration';
import type { Entry, Vehicle, FillingAssignment } from '../data/vehicle';
const props = withDefaults(defineProps<{ readonly: boolean; manager: boolean; actor: string; actorId?: string; fillingMode?: boolean; showParts?: boolean; tableLabel?: string; positiveEntryId?: string; positiveMessage?: string }>(), { showParts: false, actorId: '' });
const task = defineModel<Vehicle>({ required: true });
const emit = defineEmits<{ change: []; save: [done: (success: boolean) => void, review: boolean] }>();
const { t, locale } = useI18n();
const root = ref<HTMLElement>();
const selectedTag = ref('__all__');
const errors = ref<string[]>([]);
const deleting = ref<number>();
const submitting = ref(false);
const groups = computed(() => task.value.assignments || []);
const mineGroups = computed(() => groups.value.filter(isMine));
const ownEntries = computed(() => task.value.entries.filter(entry => isMine(groupFor(entry))));
const orderedGroups = computed(() => [...groups.value].sort((a,b) => Number(isMine(b))-Number(isMine(a))));
const visibleEntries = computed(() => task.value.entries.filter(entry => selectedTag.value === '__all__' || entry.tag === selectedTag.value));
const progressEntries = computed(() => visibleEntries.value);
const missingOwners = computed(() => groups.value.filter(group => !group.owner?.trim()).map(label).join('、'));
const notice = computed(() => {
  if (!props.fillingMode) return '';
  if (!hasMineFields.value) return t(props.manager ? 'configurationMatrix.managerView' : 'configurationMatrix.noPermission');
  if (mineSubmitted.value && !ready.value) return t('configurationMatrix.waitingOthers');
  return '';
});
function groupState(group: FillingAssignment) {
  if (group.status === 'submitted') return 'submitted';
  return group.status === 'filling' || task.value.entries.some(entry => entry.tag === group.tag && entry.format !== 'ordered' && entry.values.some((_,row) => hasValue(entry,row))) ? 'filling' : 'pending';
}
function selectTag(tag: string) { if (!imageBusy.value) selectedTag.value = tag; }
function navigateTag(offset: number, edge?: 'first'|'last') {
  const tags = ['__all__', ...orderedGroups.value.map(group => group.tag)];
  selectTag(tags[edge === 'first' ? 0 : edge === 'last' ? tags.length-1 : (tags.indexOf(selectedTag.value)+offset+tags.length)%tags.length]!);
  nextTick(() => root.value?.querySelector<HTMLElement>('.assignment-tab[aria-selected="true"]')?.focus());
}
const ready = computed(() => collaborationReady(task.value));
const hasMineFields = computed(() => ownEntries.value.length > 0);
const mineSubmitted = computed(() => !!mineGroups.value.length && mineGroups.value.every(group => group.status === 'submitted'));
const activeId = ref(task.value.rowIds?.[0] || '');
const activeIndex = computed(() => Math.max(0, task.value.rowIds?.indexOf(activeId.value) ?? 0));
const richRefs = shallowReactive(new Map<string, { imageBusy?: boolean }>());
const imageBusy = computed(() => [...richRefs.values()].some(instance => instance.imageBusy));
const overlayDirty = computed(() => imageBusy.value);
watch(() => task.value.rowIds?.join('|'), () => { if (!task.value.rowIds?.includes(activeId.value)) activeId.value = task.value.rowIds?.[0] || ''; });
function isMine(group?: FillingAssignment) { return !!group && assignmentIsMine(group,props.actor,props.actorId); }
function groupFor(entry: Entry) { return groups.value.find(group => group.tag === entry.tag); }
function entryId(entry: Entry) { return entry.id || entry.name; }
function key(entry: Entry, row: number) { return `${entryId(entry)}-${task.value.rowIds?.[row]}`; }
function label(group?: FillingAssignment) { return group?.label || t('vehicleCollab.unclassified'); }
function tagColor(tag: string) { const color = tagRecords.value.find(item => item.id === tag)?.color || 'blue'; return {'--matrix-tag-fg':`var(--app-tag-color-${color}-fg)`,'--matrix-tag-bg':`var(--app-tag-color-${color}-bg)`}; }
function entryNumber(entry: Entry) { return entry.number || task.value.templateSnapshot?.entries.find(field => field.id === entry.id)?.number || '—'; }
function entryNote(entry: Entry) { return entry.note || task.value.templateSnapshot?.entries.find(field => field.id === entry.id)?.note || ''; }
function entryEditable(entry: Entry) { return !props.readonly && !submitting.value && isMine(groupFor(entry)) && groupFor(entry)?.status !== 'submitted' && entry.format !== 'ordered' && !entry.referenceTaskId; }
function partEditable(entry: Entry) { return !props.readonly && !submitting.value && isMine(groupFor(entry)) && groupFor(entry)?.status !== 'submitted'; }
function changed() { emit('change'); }
function setValue(entry: Entry, row: number, value: string) {
  if (!entryEditable(entry) || entry.values[row] === value) return;
  if (entry.format === 'rich' && !richHasContent(entry.values[row] || '') && !richHasContent(value)) return;
  entry.values[row] = value;
  const group = groupFor(entry); if (group) group.status = 'filling';
  errors.value = errors.value.filter(error => error !== key(entry,row)); changed();
}
function setPart(entry: Entry, value?: string) {
  if (!partEditable(entry)) return;
  entry.partId = value || ''; const group = groupFor(entry); if (group) group.status = 'filling';
  errors.value = errors.value.filter(error => error !== `part-${entryId(entry)}`); changed();
}
function hasValue(entry: Entry, row: number) { const value = entry.values[row] || ''; return entry.format === 'ordered' || (entry.format === 'rich' ? richHasContent(value) : !!value.replace(/[\s\t\n]/g,'')); }
function invalid(entry: Entry, row: number) {
  const value = entry.values[row]?.trim() || '';
  if (entry.format === 'ordered' || entry.referenceTaskId) return false;
  if (entry.format === 'rich') return !richHasContent(value);
  if (entry.format === 'table') return !value || value.split('\n').some(line => (entry.columns || []).some((_,index) => !line.split('\t')[index]?.trim()));
  return !value || entry.format === 'number' && (!Number.isFinite(Number(value)) || !!props.positiveEntryId && entry.id === props.positiveEntryId && Number(value) <= 0);
}
function partInvalid(entry: Entry) { return props.showParts && entry.partsCertificate === 'yes' && !partCatalogSeed.some(part => part.id === entry.partId); }
const legendStates = ['empty','partial','complete','invalid'] as const;
type Progress = typeof legendStates[number];
function parameterState(row: number): Progress {
  if (progressEntries.value.some(entry => errors.value.includes(key(entry,row)) || errors.value.includes(`part-${entryId(entry)}`))) return 'invalid';
  if (progressEntries.value.length && progressEntries.value.every(entry => !invalid(entry,row) && !partInvalid(entry))) return 'complete';
  return progressEntries.value.some(entry => entry.format !== 'ordered' && hasValue(entry,row)) ? 'partial' : 'empty';
}
function progressCount(row: number) { return progressEntries.value.filter(entry => !invalid(entry,row) && !partInvalid(entry)).length; }
function selectParameter(id: string, focus = false) { if (imageBusy.value) return; activeId.value = id; if(focus)nextTick(()=>root.value?.querySelector<HTMLElement>('.parameter-tab[aria-selected="true"]')?.focus()); }
function navigateParameter(index: number, offset: number) { const ids = task.value.rowIds || []; if(ids.length) selectParameter(ids[(index+offset+ids.length)%ids.length]!,true); }
function numberValue(entry: Entry) { const value = entry.values[activeIndex.value]; return value?.trim() && Number.isFinite(Number(value)) ? Number(value) : undefined; }
function invalidMessage(entry: Entry) { return entry.id === props.positiveEntryId && props.positiveMessage ? props.positiveMessage : t(entry.format === 'number' ? 'vehicleFill.numberRequired' : 'vehicleFill.required'); }
function validate(tag?: string) {
  const entries = tag ? task.value.entries.filter(entry => entry.tag === tag) : ownEntries.value;
  errors.value = entries.flatMap(entry => (task.value.rowIds || []).flatMap((_,row) => invalid(entry,row) ? [key(entry,row)] : []));
  errors.value.push(...entries.filter(partInvalid).map(entry => `part-${entryId(entry)}`));
  if (!task.value.rowIds?.length || !entries.length) { Message.error(t('vehicleFill.empty')); return false; }
  if (errors.value.length) {
    const row = task.value.rowIds.findIndex((_,row) => entries.some(entry => errors.value.includes(key(entry,row))));
    activeId.value = task.value.rowIds[Math.max(0,row)]!;
    selectedTag.value = entries.find(entry => errors.value.includes(key(entry,Math.max(0,row))) || errors.value.includes(`part-${entryId(entry)}`))?.tag || '__all__';
    nextTick(() => { const cell = root.value?.querySelector<HTMLElement>('[data-invalid="true"]'); cell?.scrollIntoView({block:'center',inline:'nearest'}); cell?.querySelector<HTMLElement>('input,button,[contenteditable="true"],[tabindex]')?.focus(); });
    return false;
  }
  return true;
}
async function submitMine() {
  if (props.readonly || submitting.value || imageBusy.value || !hasMineFields.value || mineSubmitted.value || !validate()) return false;
  const previous = groups.value.map(group => ({...group}));
  for (const group of mineGroups.value) { group.status = 'submitted'; group.submittedAt = new Date().toISOString(); group.reason = ''; }
  submitting.value = true; changed();
  try {
    const saved = await new Promise<boolean>(done => emit('save',done,collaborationReady(task.value)));
    if (!saved) task.value.assignments = previous;
    return saved;
  } finally { submitting.value = false; }
}
function resetSubmissions() { for (const group of groups.value) { if(group.status === 'submitted') group.status = 'pending'; group.submittedAt = undefined; } }
function addValueColumn(after: number) {
  if (!props.manager || props.readonly || imageBusy.value || submitting.value) return;
  const id = crypto.randomUUID();
  task.value.rowIds!.splice(after+1,0,id); for (const entry of task.value.entries) entry.values.splice(after+1,0,'');
  activeId.value = id; resetSubmissions(); errors.value = []; changed();
  nextTick(() => root.value?.querySelector<HTMLElement>('.parameter-tab[aria-selected="true"]')?.scrollIntoView({block:'nearest',inline:'nearest'}));
}
function removeValueColumn(index = deleting.value) {
  if(index === undefined || !props.manager || props.readonly || imageBusy.value || submitting.value || task.value.rowIds!.length <= 1) return;
  const removedId = task.value.rowIds![index];
  task.value.rowIds!.splice(index,1); for(const entry of task.value.entries) entry.values.splice(index,1);
  if(activeId.value === removedId) activeId.value = task.value.rowIds![Math.min(index,task.value.rowIds!.length-1)]!;
  deleting.value = undefined; resetSubmissions(); errors.value = []; changed();
}
function requestDelete(index: number) {
  if (!props.manager || props.readonly || imageBusy.value || task.value.rowIds!.length<=1) return;
  if (task.value.entries.some(entry => entry.format !== 'ordered' && hasValue(entry,index))) deleting.value = index;
  else removeValueColumn(index);
}
function richRef(entry: Entry, instance: unknown) { if(instance) richRefs.set(entryId(entry),instance as {imageBusy?:boolean}); else richRefs.delete(entryId(entry)); }
defineExpose({ validate, submitMine, ready, overlayDirty, hasMineFields, mineSubmitted, imageBusy });
</script>
<template>
  <div ref="root" class="vehicle-values configuration-matrix">
    <div class="matrix-toolbar">
      <div class="assignment-list" role="tablist" :aria-label="t('configurationMatrix.assignments')" @keydown.right.prevent="navigateTag(1)" @keydown.left.prevent="navigateTag(-1)" @keydown.home.prevent="navigateTag(0,'first')" @keydown.end.prevent="navigateTag(0,'last')">
        <button type="button" role="tab" class="assignment-tab" :aria-selected="selectedTag==='__all__'" :tabindex="selectedTag==='__all__'?0:-1" :disabled="imageBusy" aria-controls="configuration-fields" @click="selectTag('__all__')"><span>{{ t('configurationMatrix.all') }}</span><span class="assignment-count">（{{ task.entries.length }}）</span></button>
        <button v-for="group in orderedGroups" :key="group.tag" type="button" role="tab" class="assignment-tab" :aria-selected="selectedTag===group.tag" :tabindex="selectedTag===group.tag?0:-1" :disabled="imageBusy" aria-controls="configuration-fields" :data-tag="group.tag" @click="selectTag(group.tag)">
          <span class="matrix-tag" :style="tagColor(group.tag)">{{ label(group) }}</span><span class="assignment-owner">{{ tagOwnerName(group.owner) }}<span v-if="isMine(group)">（{{ t('configurationMatrix.me') }}）</span></span>
          <span class="assignment-count">（{{ task.entries.filter(entry=>entry.tag===group.tag).length }}）</span>
          <span class="assignment-state" :class="`is-${groupState(group)}`"><span class="assignment-dot" />{{ t(`vehicleCollab.${groupState(group)}`) }}</span>
          <a-tooltip v-if="group.reason" :content="group.reason"><IconInfoCircle class="return-indicator" :aria-label="group.reason" /></a-tooltip>
        </button>
      </div>
      <div class="matrix-tools">
        <a-popover trigger="hover" position="bottom" :content-class="'matrix-help'">
          <a-button type="text" class="instructions-button"><IconQuestionCircle /><span>{{ t('configurationMatrix.instructions') }}</span></a-button>
          <template #content><div class="matrix-help-content"><p>{{ t('configurationMatrix.help') }}</p><div class="legend-item"><span class="legend-dot state-current" />{{ t('configurationMatrix.current') }}</div><div v-for="state in legendStates" :key="state" class="legend-item"><span class="legend-dot" :class="`state-${state}`" />{{ t(`configurationMatrix.states.${state}`) }}</div></div></template>
        </a-popover>
      </div>
    </div>
    <a-alert v-if="fillingMode && missingOwners" type="warning">{{ t('configurationMatrix.missingOwners',{tags:missingOwners}) }}</a-alert>
    <a-alert v-if="notice" type="info">{{ notice }}</a-alert>
    <div id="configuration-fields" role="tabpanel" class="configuration-fields">
    <div v-if="visibleEntries.length" class="table-scroll" tabindex="0" :aria-label="tableLabel || t('vehicle.items')">
      <table class="parameter-table" :class="{'has-parts':showParts}">
        <colgroup><col class="no-column"><col class="item-column"><col v-if="showParts" class="part-column"><col></colgroup>
        <thead><tr>
          <th scope="col" class="col-no">{{ t('vehicleFill.no') }}</th>
          <th scope="col" class="col-item">{{ t('vehicleFill.item') }}</th>
          <th v-if="showParts" scope="col" class="col-part">{{ t('executionWorkspace.part') }}</th>
          <th scope="col" class="col-value">
            <div class="parameter-nav-scroll" tabindex="0" :aria-label="t('configurationMatrix.parameters')">
              <div class="parameter-nav" role="tablist" :aria-label="t('configurationMatrix.parameters')">
                <div v-for="(id,index) in task.rowIds" :key="id" class="parameter-nav-item">
                  <a-tooltip :content="`${t('configurationMatrix.states.'+parameterState(index))} · ${t('configurationMatrix.progress',{done:progressCount(index),total:progressEntries.length})}`">
                    <button type="button" role="tab" class="parameter-tab" :class="[`state-${parameterState(index)}`,{'is-current':id===activeId}]" :aria-selected="id===activeId" :tabindex="id===activeId?0:-1" @keydown.right.prevent="navigateParameter(index,1)" @keydown.left.prevent="navigateParameter(index,-1)" @keydown.home.prevent="selectParameter(task.rowIds![0]!,true)" @keydown.end.prevent="selectParameter(task.rowIds![task.rowIds!.length-1]!,true)" :aria-controls="`parameter-panel-${id}`" :disabled="imageBusy" @click="selectParameter(id)">
                      <span>{{ t('vehicleFill.valueColumn',{n:index+1}) }}</span><IconCheckCircleFill v-if="parameterState(index)==='complete'" /><IconExclamationCircleFill v-else-if="parameterState(index)==='invalid'" /><span v-else class="parameter-dot" />
                      <span class="parameter-state">{{ t(`configurationMatrix.states.${parameterState(index)}`) }}</span><span v-if="id===activeId" class="sr-only">{{ t('configurationMatrix.current') }}</span>
                    </button>
                  </a-tooltip>
                  <template v-if="manager && !readonly">
                    <a-tooltip :content="t('vehicleFill.addColumn')"><a-button type="text" class="parameter-action" :disabled="imageBusy || submitting" :aria-label="t('configurationMatrix.addParameterAfter',{n:index+1})" @click="addValueColumn(index)"><IconPlusCircle /></a-button></a-tooltip>
                    <a-tooltip v-if="task.rowIds!.length>1" :content="t('configurationMatrix.removeParameter')"><a-button type="text" class="parameter-action" :disabled="imageBusy || submitting" :aria-label="t('vehicleFill.removeColumn',{n:index+1})" @click="requestDelete(index)"><IconMinusCircle /></a-button></a-tooltip>
                  </template>
                </div>
              </div>
            </div>
          </th>
        </tr></thead>
        <tbody :id="`parameter-panel-${activeId}`">
          <tr v-for="entry in visibleEntries" :key="entryId(entry)">
            <td class="col-no">{{ entryNumber(entry) }}</td>
            <td class="col-item"><div class="item-heading"><span>{{ entry.name }}</span><span class="matrix-tag" :style="tagColor(entry.tag)">{{ label(groupFor(entry)) }}</span><a-tooltip v-if="entryNote(entry)" :content="entryNote(entry)"><a-button type="text" class="item-help" :aria-label="`${entry.name} ${t('configurationMatrix.instructions')}`"><IconInfoCircle /></a-button></a-tooltip></div></td>
            <td v-if="showParts" class="col-part" :data-invalid="errors.includes(`part-${entryId(entry)}`)">
              <a-select :model-value="entry.partId" :disabled="!partEditable(entry)" allow-search allow-clear :aria-label="`${t('executionWorkspace.part')} ${entry.name}`" :placeholder="t('executionWorkspace.selectPart')" @update:model-value="value=>setPart(entry,value?String(value):'')"><a-option v-for="part in partCatalogSeed" :key="part.id" :value="part.id">{{ partLabel(part.id) }}</a-option><a-option v-if="entry.partId && !partCatalogSeed.some(part=>part.id===entry.partId)" :value="entry.partId" disabled>{{ entry.partId }}</a-option></a-select>
              <p v-if="errors.includes(`part-${entryId(entry)}`)" role="alert" class="field-error">{{ t('executionWorkspace.partRequired') }}</p>
            </td>
            <td class="col-value" :data-invalid="errors.includes(key(entry,activeIndex))">
              <div class="value-control" :class="{'is-readonly':!entryEditable(entry),'is-invalid':errors.includes(key(entry,activeIndex))}">
                <a-input v-if="entry.format==='ordered'" :model-value="String(activeIndex+1)" disabled :input-attrs="{'aria-label':`${entry.name} ${activeIndex+1}`}" />
                <RichValue readonly-as-editor v-else-if="entry.format==='rich'" :key="`${entryId(entry)}-${activeId}-${locale}`" :ref="instance=>richRef(entry,instance)" :model-value="entry.values[activeIndex] || ''" :readonly="!entryEditable(entry)" :input-id="`rich-${entryId(entry)}-${activeId}`" :label="`${entry.name} ${activeIndex+1}`" @update:model-value="value=>setValue(entry,activeIndex,value)" />
                <ParameterTableValue v-else-if="entry.format==='table'" :model-value="entry.values[activeIndex] || ''" :columns="entry.columns || []" :readonly="!entryEditable(entry)" :label="`${entry.name} ${activeIndex+1}`" :input-prefix="`${entryId(entry)}-${activeId}`" @update:model-value="value=>setValue(entry,activeIndex,value)" />
                <a-input-number v-else-if="entry.format==='number'" :model-value="numberValue(entry)" :disabled="!entryEditable(entry)" :placeholder="t('configurationMatrix.enter')" :input-attrs="{'aria-label':`${entry.name} ${activeIndex+1}`,'aria-invalid':errors.includes(key(entry,activeIndex))}" @update:model-value="value=>setValue(entry,activeIndex,value===undefined?'':String(value))" />
                <a-input v-else :model-value="entry.values[activeIndex] || ''" :disabled="!entryEditable(entry)" :placeholder="t('configurationMatrix.enter')" :input-attrs="{'aria-label':`${entry.name} ${activeIndex+1}`,inputmode:entry.format==='number'?'decimal':'text','aria-invalid':errors.includes(key(entry,activeIndex))}" @update:model-value="value=>setValue(entry,activeIndex,value)" />
              </div>
              <p v-if="errors.includes(key(entry,activeIndex))" role="alert" class="field-error">{{ invalidMessage(entry) }}</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <a-empty v-else :description="t('configurationMatrix.noFields')" />
    </div>
  </div>
  <ConfirmDialog plain-title :visible="deleting!==undefined" :title="t('vehicleCollab.deleteTitle')" :description="t('vehicleCollab.deleteDescription')" @update:visible="deleting=undefined" @confirm="removeValueColumn()" />
</template>
<style scoped>
.vehicle-values { min-width:0; display:flex; flex-direction:column; gap:var(--mt-ds-space-4); }
.matrix-toolbar { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:var(--mt-ds-space-4); }
.assignment-list { display:flex; align-items:center; flex:1; gap:var(--mt-ds-space-3); overflow-x:auto; min-width:0; padding:2px; }
.assignment-tab { display:flex; align-items:center; flex-shrink:0; gap:var(--mt-ds-space-2); min-height:36px; padding:4px var(--mt-ds-space-4); border:1px solid var(--app-divider); border-radius:999px; background:var(--app-surface); color:var(--color-text-1); font:inherit; cursor:pointer; white-space:nowrap; }
.assignment-tab[aria-selected="true"] { color:var(--app-color-primary); border-color:var(--app-color-primary); }
.assignment-tab:hover { background:var(--app-fill-1); }.assignment-tab:focus-visible { outline:2px solid var(--app-color-primary); outline-offset:-3px; }
.assignment-owner { color:var(--color-text-1); }.assignment-count { color:inherit; }.assignment-tab .matrix-tag { padding:2px 8px; }
.assignment-state { display:inline-flex; align-items:center; gap:4px; font-size:var(--mt-ds-font-caption); }.assignment-dot { width:5px; height:5px; background:currentColor; border-radius:50%; }
.assignment-state.is-submitted { color:var(--app-color-success); }.assignment-state.is-filling { color:var(--app-color-warning); }.configuration-fields { min-width:0; width:100%; }
.assignment-summary { display:flex; align-items:center; flex-wrap:wrap; gap:var(--mt-ds-space-2); font-weight:var(--mt-ds-weight-body); }
.assignment-separator,.assignment-state { color:var(--color-text-3); }.assignment-state.is-complete { color:var(--app-color-success); }
.matrix-tag { display:inline-flex; align-items:center; padding:2px 8px; border-radius:var(--mt-ds-radius-sm,2px); color:var(--matrix-tag-fg); background:var(--matrix-tag-bg); font-size:var(--mt-ds-font-caption); font-weight:var(--mt-ds-weight-body); white-space:nowrap; }
.return-indicator { color:var(--app-color-danger); }
.matrix-tools { display:flex; align-items:center; flex-wrap:wrap; gap:var(--mt-ds-space-4); margin-left:auto; }
.instructions-button.arco-btn { display:inline-flex; align-items:center; gap:var(--mt-ds-space-2); padding:0; color:var(--color-text-2); }
.matrix-help-content { max-width:340px; }.matrix-help-content p { margin:0 0 var(--mt-ds-space-3); }.legend-item { display:flex; align-items:center; gap:var(--mt-ds-space-2); margin-top:var(--mt-ds-space-2); }
.legend-dot { width:12px; height:12px; flex-shrink:0; border:2px solid currentColor; border-radius:50%; }.state-current { color:var(--app-color-primary); }
.state-empty { color:var(--color-text-3); }.state-partial { color:var(--app-color-warning); }.state-complete { color:var(--app-color-success); }.state-invalid { color:var(--app-color-danger); }
.table-scroll { width:100%; min-width:0; overflow-x:auto; }
.parameter-table { width:100%; min-width:720px; border-collapse:collapse; table-layout:fixed; }.parameter-table.has-parts { min-width:980px; }
.no-column { width:120px; }.item-column { width:220px; }.part-column { width:240px; }
.parameter-table th,.parameter-table td { padding:var(--mt-ds-space-4); border-bottom:1px solid var(--app-divider); font-size:var(--mt-ds-font-body); font-weight:var(--mt-ds-weight-body); text-align:left; vertical-align:top; }
.parameter-table th { background:var(--app-table-header); vertical-align:middle; }
.parameter-table .col-no { white-space:nowrap; }.item-heading { display:flex; align-items:center; flex-wrap:wrap; gap:var(--mt-ds-space-2); }
.item-help.arco-btn { display:inline-grid; place-items:center; width:24px; height:24px; padding:0; color:var(--color-text-3); }
.col-part :deep(.arco-select) { width:100%; }.parameter-nav-scroll { overflow-x:auto; max-width:100%; padding:3px; }
.parameter-nav { display:flex; align-items:center; gap:var(--mt-ds-space-4); width:max-content; min-width:100%; }.parameter-nav-item { display:flex; align-items:center; flex-shrink:0; gap:var(--mt-ds-space-1); }
.parameter-tab { display:inline-flex; align-items:center; gap:var(--mt-ds-space-2); padding:6px 12px; border:1px solid var(--app-divider); border-radius:18px; background:var(--app-surface); font:inherit; font-weight:var(--mt-ds-weight-body); cursor:pointer; white-space:nowrap; }
.parameter-tab.is-current { border-color:var(--app-color-primary); box-shadow:0 0 0 1px var(--app-color-primary); }.parameter-tab:focus-visible { outline:2px solid var(--app-color-primary); outline-offset:3px; }.parameter-tab:disabled { cursor:wait; }
.parameter-tab>span:first-child { color:var(--color-text-1); }.parameter-tab.is-current>span:first-child { color:var(--app-color-primary); }.parameter-state { font-size:var(--mt-ds-font-caption); }.parameter-dot { width:6px; height:6px; border-radius:50%; background:currentColor; }
.parameter-action.arco-btn { display:inline-grid; place-items:center; width:28px; height:28px; padding:0; color:var(--color-text-3); }.parameter-action.arco-btn:hover { color:var(--app-color-primary); }.parameter-action :deep(.arco-icon) { font-size:18px; }
.value-control { min-width:0; }.value-control :deep(.arco-input-number) { width:100%; }.value-control.is-readonly { background:transparent; color:var(--color-text-1); }.value-control.is-readonly :deep(.rich-preview) { min-height:var(--mt-ds-control-height); padding:var(--mt-ds-space-2); }
.value-control :deep(.arco-input-wrapper.arco-input-disabled),
.value-control :deep(.arco-input-wrapper.arco-input-disabled:hover),
.value-control :deep(.arco-input-number.arco-input-number-disabled) { background-color:var(--app-surface); border-color:var(--app-control-border); color:var(--color-text-1); }
.value-control :deep(.arco-input[disabled]) { color:var(--color-text-1); -webkit-text-fill-color:var(--color-text-1); opacity:1; }
.value-control :deep(.arco-input[disabled]::placeholder) { color:var(--color-text-3); -webkit-text-fill-color:var(--color-text-3); }
.value-control.is-invalid { outline:1px solid var(--app-color-danger); outline-offset:2px; }.field-error { margin:var(--mt-ds-space-2) 0 0; color:var(--app-color-danger); }
.sr-only { position:absolute; width:1px; height:1px; overflow:hidden; clip-path:inset(50%); white-space:nowrap; }
</style>

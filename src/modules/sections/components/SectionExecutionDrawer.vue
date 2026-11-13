<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { IconDragDotVertical, IconDelete, IconPlus, IconArrowUp, IconArrowDown } from '@arco-design/web-vue/es/icon';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import { templateRecords } from '../../templates/data/templates';
import { regulationOptions, saveSectionExecution, sectionPeople, taskCode } from '../data/execution';
import type { Item, SectionEntry } from '../data/items';
const props = defineProps<{ item: Item }>();
const visible = defineModel<boolean>('visible');
const emit = defineEmits<{ saved: [] }>();
const { t } = useI18n();
const blank = (): SectionEntry => ({ id: crypto.randomUUID(), law: '', template: '', externalReview: undefined, approval: 'pending' });
const rows = ref<SectionEntry[]>(props.item.entries?.length ? props.item.entries.map(row => ({ ...row })) : [{ ...blank(), law: props.item.law }]);
const initial = ref(JSON.stringify(rows.value));
const dirty = computed(() => JSON.stringify(rows.value) !== initial.value);
const people = computed(() => sectionPeople(props.item));
const laws = computed(regulationOptions);
const templates = computed(() => templateRecords.value.filter(row => row.type === taskCode(props.item.type) && row.status === 'completed'));
const templateLabel = computed(() => t(`sectionExecution.templates.${props.item.type}`));
const busy = ref(false);
const leaveVisible = ref(false);
const formRef = ref();
const form = computed(() => ({ rows: rows.value }));
const dragged = ref<string>();
const dropTarget = ref<{ id: string; edge: 'before' | 'after'; finalIndex: number }>();
const announce = ref('');
const bodyRef = ref<HTMLElement>();
function requestClose() { if (busy.value) return; if (dirty.value) leaveVisible.value = true; else visible.value = false; }
function discard() { leaveVisible.value = false; visible.value = false; }
onBeforeRouteLeave(() => { if (!visible.value) return true; requestClose(); return !dirty.value; });
function add(index: number) { rows.value.splice(index + 1, 0, blank()); formRef.value?.clearValidate(); }
function remove(index: number) { if (rows.value.length > 1) rows.value.splice(index, 1); formRef.value?.clearValidate(); }
function move(index: number, target: number) {
  if (target < 0 || target >= rows.value.length || target === index) return;
  const [row] = rows.value.splice(index, 1); if (!row) return;
  rows.value.splice(target, 0, row); formRef.value?.clearValidate();
  announce.value = t('sectionExecution.moved', { position: target + 1 });
}
function clearDrag() { dragged.value = undefined; dropTarget.value = undefined; }
function startDrag(event: DragEvent, id: string) {
  if (busy.value || rows.value.length < 2) { event.preventDefault(); return; }
  const element = (event.currentTarget as HTMLElement).closest('tr');
  if (!element || !event.dataTransfer) return;
  const bounds = element.getBoundingClientRect();
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', id);
  event.dataTransfer.setDragImage(element, event.clientX - bounds.left, event.clientY - bounds.top);
  dragged.value = id;
  dropTarget.value = undefined;
}
function insertionAt(event: DragEvent, index: number) {
  const from = rows.value.findIndex(row => row.id === dragged.value);
  if (busy.value || from < 0 || !rows.value[index]) return undefined;
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const edge = event.clientY < bounds.top + bounds.height / 2 ? 'before' : 'after';
  const insertion = index + (edge === 'after' ? 1 : 0);
  const finalIndex = insertion > from ? insertion - 1 : insertion;
  if (finalIndex === from) return undefined;
  return { id: rows.value[index]!.id, edge: edge as 'before' | 'after', finalIndex };
}
function overRow(event: DragEvent, index: number) {
  dropTarget.value = insertionAt(event, index);
  if (!dropTarget.value) return;
  event.preventDefault();
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
}
function leaveTable(event: DragEvent) {
  const bounds = (event.currentTarget as HTMLElement).getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dropTarget.value = undefined;
}
function drop(event: DragEvent, index: number) {
  const target = insertionAt(event, index);
  if (target) {
    event.preventDefault();
    move(rows.value.findIndex(row => row.id === dragged.value), target.finalIndex);
  }
  clearDrag();
}
function rules(field: 'law' | 'template' | 'externalReview') {
  return [{ validator: (value: unknown, callback: (message?: string) => void) => {
    if (value === '' || value === undefined || value === null) return callback(t('sectionExecution.required'));
    if (field === 'law' && (!laws.value.includes(String(value)) || rows.value.filter(row => row.law === value).length > 1)) return callback(t('sectionExecution.duplicateLaw'));
    if (field === 'template' && !templates.value.some(row => row.id === value)) return callback(t('sectionExecution.invalidTemplate'));
    callback();
  } }];
}
async function save(submit: boolean) {
  if (busy.value) return;
  if (submit) {
    const errors = await formRef.value?.validate();
    if (errors) { formRef.value?.scrollToField(Object.keys(errors)[0]); await nextTick(); bodyRef.value?.querySelector<HTMLElement>('.arco-form-item-status-error [tabindex], .arco-form-item-status-error input')?.focus(); return; }
  }
  busy.value = true;
  try {
    if (!saveSectionExecution(props.item, rows.value, submit)) { Message.error(t('sectionExecution.changed')); return; }
    initial.value = JSON.stringify(rows.value);
    Message.success(t(submit ? 'sectionExecution.submitted' : 'sectionExecution.saved'));
    visible.value = false; emit('saved');
  } catch { Message.error(t('sectionExecution.failed')); }
  finally { busy.value = false; }
}
</script>

<template>
  <a-drawer :visible="visible" :title="t('sectionExecution.title')" width="min(1200px, 100vw)" :mask-closable="true" :esc-to-close="!leaveVisible && !busy" :closable="!busy" unmount-on-close @cancel="requestClose">
    <div ref="bodyRef" class="section-execution">
      <section class="execution-panel">
        <h2>{{ t('sectionExecution.content') }}</h2>
        <a-descriptions :column="{ xs: 1, sm: 2, md: 2, lg: 4 }" layout="horizontal">
          <a-descriptions-item><template #label><AppFieldLabel class="app-detail-label" :text="t('sections.type')" context="detail" /></template>{{ t(`sections.${item.type}`) }}</a-descriptions-item>
          <a-descriptions-item><template #label><AppFieldLabel class="app-detail-label" :text="t('sections.end')" context="detail" /></template>{{ item.end || '—' }}</a-descriptions-item>
          <a-descriptions-item><template #label><AppFieldLabel class="app-detail-label" :text="t('sections.executor')" context="detail" /></template>{{ people.executor || '—' }}</a-descriptions-item>
          <a-descriptions-item><template #label><AppFieldLabel class="app-detail-label" :text="t('sectionExecution.reviewer')" context="detail" /></template>{{ people.reviewer || '—' }}</a-descriptions-item>
        </a-descriptions>
      </section>
      <section class="execution-panel">
        <h2>{{ t('sectionExecution.info') }}</h2>
        <a-form ref="formRef" :model="form" :disabled="busy" class="entry-form">
          <div class="entry-scroll"><table class="entry-table" @dragleave="leaveTable"><thead><tr>
            <th scope="col">{{ t('sections.law') }}</th><th scope="col">{{ templateLabel }}</th>
            <th v-if="item.type === 'technical'" scope="col">{{ t('sectionExecution.externalReview') }}</th><th scope="col">{{ t('sections.action') }}</th>
          </tr></thead><tbody>
            <tr v-for="(row, index) in rows" :key="row.id" :class="{ 'is-dragging': dragged === row.id, 'is-drop-before': dropTarget?.id === row.id && dropTarget.edge === 'before', 'is-drop-after': dropTarget?.id === row.id && dropTarget.edge === 'after' }" @dragover="overRow($event, index)" @drop="drop($event, index)">
              <td><div class="law-cell"><button type="button" class="drag-handle" :disabled="busy || rows.length < 2" :draggable="!busy && rows.length > 1" :aria-label="t('sectionExecution.drag', { row: index + 1 })" :title="t('sectionExecution.drag', { row: index + 1 })" @dragstart="startDrag($event, row.id)" @dragend="clearDrag" @keydown.up.prevent="move(index, index - 1)" @keydown.down.prevent="move(index, index + 1)"><IconDragDotVertical /></button>
                <a-form-item :field="`rows.${index}.law`" hide-label :rules="rules('law')"><a-select v-model="row.law" allow-search allow-clear :placeholder="t('sectionExecution.select')" :aria-label="`${t('sections.law')} ${index + 1}`"><a-option v-for="law in laws" :key="law" :value="law" :disabled="rows.some(other => other.id !== row.id && other.law === law)">{{ law }}</a-option></a-select></a-form-item>
              </div></td>
              <td><a-form-item :field="`rows.${index}.template`" hide-label :rules="rules('template')"><a-select v-model="row.template" allow-search allow-clear :placeholder="t('sectionExecution.select')" :aria-label="`${templateLabel} ${index + 1}`"><a-option v-for="template in templates" :key="template.id" :value="template.id">{{ template.name }} · {{ template.version }}</a-option></a-select></a-form-item></td>
              <td v-if="item.type === 'technical'"><a-form-item :field="`rows.${index}.externalReview`" hide-label :rules="rules('externalReview')"><a-select v-model="row.externalReview" :placeholder="t('sectionExecution.select')" :aria-label="`${t('sectionExecution.externalReview')} ${index + 1}`"><a-option :value="true">{{ t('sections.yes') }}</a-option><a-option :value="false">{{ t('sections.no') }}</a-option></a-select></a-form-item></td>
              <td><div class="entry-actions">
                <a-button :disabled="busy || rows.length === 1" :aria-label="t('sectionExecution.remove', { row: index + 1 })" :title="t('sectionExecution.remove', { row: index + 1 })" @click="remove(index)"><IconDelete /></a-button>
                <a-button :disabled="busy" :aria-label="t('sectionExecution.add', { row: index + 1 })" :title="t('sectionExecution.add', { row: index + 1 })" @click="add(index)"><IconPlus /></a-button>
                <a-button :disabled="busy || index === 0" :aria-label="t('sectionExecution.up', { row: index + 1 })" :title="t('sectionExecution.up', { row: index + 1 })" @click="move(index, index - 1)"><IconArrowUp /></a-button>
                <a-button :disabled="busy || index === rows.length - 1" :aria-label="t('sectionExecution.down', { row: index + 1 })" :title="t('sectionExecution.down', { row: index + 1 })" @click="move(index, index + 1)"><IconArrowDown /></a-button>
              </div></td>
            </tr>
          </tbody></table></div>
        </a-form>
        <span class="sr-only" aria-live="polite">{{ announce }}</span>
      </section>
    </div>
    <template #footer><div class="execution-footer"><a-button class="app-btn-neutral" :disabled="busy" @click="requestClose">{{ t('sections.cancel') }}</a-button><a-button :loading="busy" @click="save(false)">{{ t('taskExecution.draft') }}</a-button><a-button type="primary" :loading="busy" @click="save(true)">{{ t('taskExecution.submit') }}</a-button></div></template>
  </a-drawer>
  <ConfirmDialog :visible="leaveVisible" unsaved :title="t('projects.taskCreate.unsaved')" @update:visible="leaveVisible = $event" @confirm="discard" />
</template>

<style scoped>
.section-execution { display: flex; flex-direction: column; gap: var(--mt-ds-space-4); min-width: 0; }
.execution-panel { padding: var(--mt-ds-space-4); background: var(--app-surface); border-radius: var(--mt-ds-control-radius); min-width: 0; }
h2 { margin: 0 0 var(--mt-ds-space-3); font-size: var(--mt-ds-font-title); font-weight: var(--mt-ds-weight-title); line-height: var(--mt-ds-line-title); }
.entry-scroll { overflow-x: auto; }
.entry-table { width: 100%; min-width: 760px; table-layout: fixed; border-collapse: collapse; }
.entry-table th,.entry-table td { padding: var(--mt-ds-space-3); text-align: left; font-weight: var(--mt-ds-weight-body); border-bottom: 1px solid var(--app-divider); vertical-align: top; }
.entry-table th { background: var(--app-table-header); }
.entry-table th:first-child { width: 30%; }
.entry-table th:last-child { width: 180px; }
.entry-table :deep(.arco-form-item) { margin: 0; min-width: 0; width: 100%; }
.entry-table :deep(.arco-select) { width: 100%; }
.law-cell { display: flex; align-items: flex-start; gap: var(--mt-ds-space-2); }
.drag-handle { display: grid; place-items: center; flex-shrink: 0; height: var(--mt-ds-control-height); padding: 0; border: 0; background: transparent; color: var(--color-text-3); cursor: grab; }
.drag-handle:focus-visible { outline: 2px solid var(--app-color-primary); }
.entry-actions { display: flex; gap: var(--mt-ds-space-2); }
.entry-actions :deep(.arco-btn) { width: var(--mt-ds-control-height); height: var(--mt-ds-control-height); padding: 0; }
.execution-footer { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: var(--mt-ds-space-3); }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip-path: inset(50%); }
:global(.arco-drawer:has(.section-execution) .arco-drawer-body) { padding: var(--mt-ds-space-4); background: var(--app-fill-1); overflow-x: hidden; }
:global(.arco-drawer:has(.section-execution).slide-right-drawer-leave-active) { transition-timing-function: linear; }
.entry-table .is-dragging { opacity: .55; cursor: grabbing; }
.entry-table .is-dragging .drag-handle { cursor: grabbing; }
.entry-table .is-drop-before td, .entry-table .is-drop-after td { background: var(--color-primary-light-1); }
.entry-table .is-drop-before td::before, .entry-table .is-drop-after td::before { position: absolute; z-index: 1; left: 0; right: 0; height: 3px; border-radius: 2px; background: var(--app-accent); content: ''; pointer-events: none; }
.entry-table .is-drop-before td, .entry-table .is-drop-after td { position: relative; }
.entry-table .is-drop-before td::before { top: 0; }
.entry-table .is-drop-after td::before { bottom: 0; }
</style>

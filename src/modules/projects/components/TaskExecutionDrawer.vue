<script setup lang="ts">
import { computed, reactive, ref } from 'vue';

import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { IconLeft } from '@arco-design/web-vue/es/icon';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import { projects, TASK_CODES, MOCK_CURRENT_USER, people, type SubTask } from '../data/projects';
import { useProjectLabels } from '../labels';
const { t } = useI18n();
const label = useProjectLabels();
const props = defineProps<{ taskId: string }>();
const visible = defineModel<boolean>('visible');
const emit = defineEmits<{ saved: [] }>();
const record = computed(() => projects.value.find(item => item.id === props.taskId));
// Local task configuration uses the existing module records until an API contract is available.
const vehicleOptions = [
  { brand: '品牌1', series: [{ name: 'S1', models: ['M1', 'M2'] }, { name: 'S2', models: ['M3'] }] },
  { brand: '品牌2', series: [{ name: 'S3', models: ['M4', 'M5'] }] },
];
const savedDraft = record.value?.executionDraft;
const form = reactive({ brand: savedDraft?.brand || '', series: savedDraft?.series || '', model: savedDraft?.model || '', tasks: TASK_CODES.map(code => {
  const draftTask = savedDraft?.tasks.find(item => item.code === code);
  if (draftTask) return { ...draftTask, executor: draftTask.executor || '', reviewer: draftTask.reviewer || '', template: code === 'vehicle' ? draftTask.template : '' };
  const existing = record.value?.subTasks.find(item => item.code === code);
  return { code, enabled: !!existing, executor: existing?.executor || '', reviewer: existing?.reviewer || '', target: existing?.target || '', template: code === 'vehicle' ? existing?.template || '' : '' };
}) });
const personOptions = computed(() => Array.from(new Set([...people, MOCK_CURRENT_USER.name, ...projects.value.flatMap(task => [task.owner, ...task.subTasks.flatMap(item => [item.executor, item.reviewer])])])).filter(Boolean));
const seriesOptions = computed(() => vehicleOptions.find(item => item.brand === form.brand)?.series || []);
const modelOptions = computed(() => seriesOptions.value.find(item => item.name === form.series)?.models || []);
const initial = ref(JSON.stringify(form));
const formRef = ref();
const busy = ref(false);
const submitted = ref(false);
const leaveVisible = ref(false);

function requestClose() {
  if (busy.value) return;
  if (JSON.stringify(form) === initial.value) { visible.value = false; return; }
  leaveVisible.value = true;
}
function leave(allow: boolean) {
  leaveVisible.value = false;
  if (allow) visible.value = false;
}
function changeBrand() { form.series = ''; form.model = ''; }
function changeSeries() { form.model = ''; }
const required = (field: string) => [{ required: true, message: t('taskExecution.selectRequired', { field }) }];
async function save(submit: boolean) {
  if (busy.value || !record.value) return;
  if (submit) {
    const errors = await formRef.value?.validate();
    if (errors) { formRef.value?.scrollToField(Object.keys(errors)[0]); return; }
    if (!form.tasks.some(item => item.enabled)) { Message.error(t('taskExecution.typesRequired')); return; }
  }
  busy.value = true;
  try {
    // Preserve all draft fields, including unchecked rows, independently from submitted subtasks.
    record.value.executionDraft = {
      brand: form.brand,
      series: form.series,
      model: form.model,
      tasks: form.tasks.map(item => ({ ...item })),
    };
    const selected: SubTask[] = form.tasks.filter(item => item.enabled).map(item => ({ code: item.code, target: item.target, template: item.code === 'vehicle' ? item.template : '', status: 'pending', executor: item.executor, reviewer: item.reviewer }));
    Object.assign(record.value, { brand: form.brand, series: form.series, model: form.model, subTasks: selected, updater: MOCK_CURRENT_USER.name, updatedAt: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium' }).format(new Date()) });
    if (submit) {
      record.value.status = 'active';
      record.value.subTasks.forEach(task => { task.status = task.code === 'vehicle' ? 'active' : 'pending'; });
    }
    record.value.history = [...(record.value.history || []), {
      id: `${Date.now()}`, action: submit ? 'execute' : 'draft',
      actor: MOCK_CURRENT_USER.name, time: record.value.updatedAt,
      taskCodes: submit ? [] : selected.map(task => task.code), taskName: record.value.name,
      vehicle: { brand: form.brand, series: form.series, model: form.model },
      taskConfigs: selected.map(({ code, target, template }) => ({ code, target, template })),
    }];
    if (submit) {
      record.value.history.push(...selected.map(task => ({
        id: `${Date.now()}-${task.code}`, action: task.code === 'vehicle' ? 'execute' as const : 'create' as const,
        actor: MOCK_CURRENT_USER.name, time: record.value!.updatedAt, taskCodes: [task.code], taskName: record.value!.name,
      })));
    }
    initial.value = JSON.stringify(form);
    submitted.value = submit;
    Message.success(t(submit ? 'taskExecution.submitted' : 'taskExecution.saved'));
    emit('saved');
    visible.value = false;
  } finally { busy.value = false; }
}
</script>
<template>
<a-drawer :visible="visible" :title="t('executionDetail.execute')" width="min(1200px, 100vw)" :mask-closable="false" :esc-to-close="false" :closable="!busy" unmount-on-close @cancel="requestClose">
  <a-form ref="formRef" :model="form" layout="vertical" :disabled="busy" class="execution-form">
    <section class="execution-panel"><h2>{{ t('taskExecution.vehicles') }}</h2><div class="vehicle-fields">
      <a-form-item field="brand" :rules="required(t('projects.brand'))"><template #label><AppFieldLabel class="app-field-label" :text="t('projects.brand')" /></template><a-select allow-clear v-model="form.brand" :placeholder="t('taskExecution.select')" @change="changeBrand"><a-option v-for="item in vehicleOptions" :key="item.brand" :value="item.brand">{{ item.brand }}</a-option></a-select></a-form-item>
      <a-form-item field="series" :rules="required(t('projects.series'))"><template #label><AppFieldLabel class="app-field-label" :text="t('projects.series')" /></template><a-select allow-clear v-model="form.series" :disabled="!form.brand" :placeholder="t('taskExecution.select')" @change="changeSeries"><a-option v-for="item in seriesOptions" :key="item.name" :value="item.name">{{ item.name }}</a-option></a-select></a-form-item>
      <a-form-item field="model" :rules="required(t('projects.model'))"><template #label><AppFieldLabel class="app-field-label" :text="t('projects.model')" /></template><a-select allow-clear v-model="form.model" :disabled="!form.series" :placeholder="t('taskExecution.select')"><a-option v-for="item in modelOptions" :key="item" :value="item">{{ item }}</a-option></a-select></a-form-item>
    </div>
    </section>
    <section class="execution-panel"><h2>{{ t('executionDetail.subtaskInfo') }}</h2>
      <div class="task-table-scroll"><table class="task-table"><thead><tr><th v-for="title in [t('taskExecution.types'), t('taskExecution.date'), t('projects.executor'), t('projects.reviewer'), t('executionTable.template')]" :key="title" scope="col"><span class="required-mark" aria-hidden="true">*</span> {{ title }}</th></tr></thead><tbody>
        <tr v-for="(task,index) in form.tasks" :key="task.code">
          <td><a-checkbox v-model="task.enabled" @change="formRef?.clearValidate([`tasks.${index}.target`, `tasks.${index}.template`, `tasks.${index}.executor`, `tasks.${index}.reviewer`])">{{ label(task.code) }}</a-checkbox></td>
          <td><a-form-item :field="`tasks.${index}.target`" hide-label :hide-asterisk="true" :rules="task.enabled ? required(t('taskExecution.date')) : []"><a-date-picker allow-clear v-model="task.target" :aria-label="`${label(task.code)} ${t('taskExecution.date')}`" :aria-required="task.enabled" :disabled="!task.enabled" /></a-form-item></td>
          <td v-for="personField in (['executor', 'reviewer'] as const)" :key="personField"><a-form-item :field="`tasks.${index}.${personField}`" hide-label :hide-asterisk="true" :rules="task.enabled ? required(t(`projects.${personField}`)) : []"><a-select v-model="task[personField]" allow-search allow-clear :aria-label="`${label(task.code)} ${t(`projects.${personField}`)}`" :aria-required="task.enabled" :disabled="!task.enabled" :placeholder="t('taskExecution.select')"><a-option v-for="person in personOptions" :key="person" :value="person">{{ person }}</a-option></a-select></a-form-item></td>
          <td><a-form-item v-if="task.code === 'vehicle'" :field="`tasks.${index}.template`" hide-label :hide-asterisk="true" :rules="task.enabled ? required(t('executionTable.template')) : []"><a-select allow-clear v-model="task.template" :aria-label="`${label(task.code)} ${t('executionTable.template')}`" :aria-required="task.enabled" :disabled="!task.enabled" :placeholder="t('taskExecution.select')"><a-option v-for="n in 3" :key="n" :value="`${task.code}-TPL-${n}`">{{ `${task.code}-TPL-${n}` }}</a-option></a-select></a-form-item><span v-else>- -</span></td>
        </tr>
      </tbody></table></div>
    </section>
  </a-form>
<template #footer><a-space class="execution-footer"><a-button class="app-btn-neutral" :disabled="busy" @click="requestClose">{{ t('taskExecution.cancel') }}</a-button><a-button :loading="busy" @click="save(false)">{{ t('taskExecution.draft') }}</a-button><a-button type="primary" :loading="busy" @click="save(true)">{{ t('taskExecution.submit') }}</a-button></a-space></template>
</a-drawer>
<ConfirmDialog :visible="leaveVisible" unsaved :title="t('projects.taskCreate.unsaved')" @update:visible="leave(false)" @confirm="leave(true)" />
</template>
<style scoped>
:global(.arco-drawer:has(.execution-form)) { background: var(--app-fill-1); }
:global(.arco-drawer:has(.execution-form) .arco-drawer-header) { box-sizing: border-box; height: 56px; background: var(--app-surface); flex: none; }
:global(.arco-drawer:has(.execution-form) .arco-drawer-title) { font-size: var(--mt-ds-font-title); font-weight: var(--mt-ds-weight-title); line-height: var(--mt-ds-line-title); }
:global(.arco-drawer:has(.execution-form) .arco-drawer-body) { padding: var(--mt-ds-space-4); background: var(--app-fill-1); overflow-y: auto; overflow-x: hidden; }
:global(.arco-drawer:has(.execution-form) .arco-drawer-footer) { background: var(--app-surface); flex: none; }
:global(.arco-drawer:has(.execution-form).slide-right-drawer-leave-active) { transition-timing-function: linear; }
.execution-form { display: flex; flex-direction: column; gap: var(--mt-ds-space-3); min-width: 0; }
.execution-panel { background: var(--app-surface); padding: var(--mt-ds-space-4); border-radius: var(--mt-ds-control-radius); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); margin: 0 0 var(--mt-ds-space-3); }
.vehicle-fields { display: flex; flex-wrap: wrap; align-items: flex-start; gap: var(--mt-ds-space-4) var(--mt-ds-space-6); }
.vehicle-fields :deep(.arco-form-item) { display: grid; grid-template-columns: max-content minmax(0, 400px); column-gap: var(--mt-ds-space-2); width: auto; max-width: 100%; }
.vehicle-fields :deep(.arco-form-item-label-col) { margin: 0; line-height: var(--mt-ds-control-height); }
.vehicle-fields :deep(.arco-form-item-wrapper-col) { width: 400px; max-width: 100%; }
.task-types-label { display: flex; align-items: baseline; gap: 4px; margin-top: var(--mt-ds-space-4); }
.required-mark { color: var(--app-color-danger); }
.task-options { margin-top: var(--mt-ds-space-3); }
.task-option { display: grid; grid-template-columns: 100px minmax(0, 1fr) minmax(0, 1fr); align-items: center; gap: var(--mt-ds-space-4); padding: var(--mt-ds-space-4) 0; border-top: 1px solid var(--app-divider); }
:deep(.arco-form-item) { width: 400px; max-width: 100%; min-width: 0; margin: 0; }
:deep(.arco-form-item-content-flex), :deep(.arco-form-item-wrapper-col) { min-width: 0; }
:deep(.arco-select), :deep(.arco-picker) { width: 100%; }
.execution-footer { display: flex; justify-content: flex-end; width: 100%; }

.task-option :deep(.arco-form-item) { width: 100%; max-width: 100%; }
@media (max-width: 600px) {
  .task-option { grid-template-columns: 1fr; align-items: start; }
}

.task-table-scroll { overflow-x: auto; }
.task-table { width: 100%; min-width: 1000px; table-layout: fixed; border-collapse: separate; border-spacing: 0; }
.task-table th, .task-table td { padding: 8px 12px; text-align: left; font-weight: var(--mt-ds-weight-body); border-bottom: 1px solid var(--app-divider); }
.task-table th { height: 50px; background: var(--app-table-header); }
.task-table td { height: 50px; vertical-align: top; }
.task-table th:first-child { width: 120px; }
.task-table th:nth-child(2) { width: 180px; }
.task-table td:first-child :deep(.arco-checkbox) { min-height: var(--mt-ds-control-height); align-items: center; }
.task-table td>span { display: inline-flex; align-items: center; min-height: var(--mt-ds-control-height); }
.task-table :deep(.arco-form-item) { width: 100%; }
</style>

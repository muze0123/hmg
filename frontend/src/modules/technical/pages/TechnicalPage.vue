<script setup lang="ts">
import TaskPauseNotice from '../../projects/components/TaskPauseNotice.vue';
import { taskPaused, displayedTaskStatus } from '../../projects/data/suspension';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { Message } from '@arco-design/web-vue';
import ExecutionTaskList from '../../task-execution/components/ExecutionTaskList.vue';
import AppDetailHeader from '../../../design/components/AppDetailHeader.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import VehicleValues from '../../vehicle/components/VehicleValues.vue';
import TaskInformationSection from '../../task-execution/components/TaskInformationSection.vue';
import VehicleTimeline from '../../vehicle/components/VehicleTimeline.vue';
import { collaborationReady, assignmentIsMine } from '../../vehicle/data/collaboration';
import { MOCK_CURRENT_USER } from '../../projects/data/projects';
import { statusRole } from '../../../shared/status';
import { technicalTasks, technicalVehicleReady, saveTechnicalTask, syncTechnicalSections, withdrawTechnicalTask, type TechnicalTask } from '../data/technical';
const { t } = useI18n();
const route = useRoute(); const router = useRouter();
syncTechnicalSections();
const current = computed(() => technicalTasks.find(task => task.id === route.params.id));
const draft = ref<TechnicalTask>();
const dirty = ref(false);
const saving = ref(false);
const valuesRef = ref<InstanceType<typeof VehicleValues>>();
const coordinator = computed(() => draft.value?.owner === MOCK_CURRENT_USER.name);
const ready = computed(() => !!draft.value && technicalVehicleReady(draft.value));
const participant = computed(() => !taskPaused(draft.value?.project || '', draft.value?.status || '') &&  !!draft.value && (coordinator.value || draft.value.assignments?.some(group => assignmentIsMine(group,MOCK_CURRENT_USER.name,MOCK_CURRENT_USER.accountId)))
  && ['pending','submitting','active','rejected','withdrawn'].includes(draft.value.status) && ['execute','edit'].includes(String(route.params.mode)));
const editable = computed(() => participant.value && ready.value);
/** 审批详情的操作权限由路由审批模式 + 审批中状态决定，不按行的 reviewer 字段判定（与列表视角切换契约一致）。 */
const canReview = computed(() => !taskPaused(draft.value?.project || '', draft.value?.status || '') &&  route.params.mode === 'review' && draft.value?.status === 'reviewing');
const approvalResult = ref<'completed' | 'rejected'>();
const opinion = ref('');
const approvalError = ref(false);
const approvalLabel = computed(() => t(approvalResult.value === 'completed' ? 'vehicleApproval.opinion' : 'vehicleApproval.reason'));
const basics = ['id','name','regulation','priority','status','brand','series','model','end','owner','reviewer','template','version','region','country','type'] as const;
function fieldLabel(key: typeof basics[number]) {
  if (key === 'owner') return t('executionList.owner');
  if (key === 'regulation') return t(`tech.${key}`);
  if (key === 'brand' || key === 'series' || key === 'model') return t(`projects.${key}`);
  return t(`vehicle.${key}`);
}
function fieldValue(key: typeof basics[number]) {
  if (!draft.value) return '—';
  if (key === 'priority') return t(`projects.${draft.value.priority}`);
  if (key === 'status') return t(`taskStatus.${draft.value.status}`);
  if (key === 'template') return draft.value.templateSnapshot?.name || '—';
  if (key === 'region') return t(`templates.regions.${draft.value.region}`);
  if (key === 'country') return t(`templates.countries.${draft.value.country}`);
  if (key === 'type') return t(`templates.vehicleTypes.${draft.value.type}`);
  return draft.value[key] || '—';
}
watch(() => route.fullPath, () => {
  draft.value = current.value ? JSON.parse(JSON.stringify(current.value)) : undefined;
  dirty.value = false; opinion.value = ''; approvalResult.value = undefined; approvalError.value = false;
}, { immediate:true });
async function submitCurrent() { if (!editable.value || saving.value) return; await valuesRef.value?.submitMine(); }
async function persist(status?: TechnicalTask['status'], submission = false) {
  if (saving.value || !draft.value || (!editable.value && !canReview.value)) return false;
  if (current.value?.status !== draft.value.status) { Message.error(t('techExecution.changed')); return false; }
  if (status === 'reviewing') {
    if (!collaborationReady(draft.value)) { Message.error(t('vehicleCollab.notReady')); return false; }
  }
  saving.value = true;
  try {
    const next: TechnicalTask = JSON.parse(JSON.stringify(draft.value));
    next.status = status ?? (next.status === 'active' || next.assignments?.some(group=>group.status==='submitted') ? 'active' : 'submitting');
    const time = new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium'}).format(new Date());
    for(const entry of next.entries) if(entry.format === 'ordered') entry.values = next.rowIds!.map((_,index)=>String(index+1));
    if(status === 'reviewing') { next.executedAt=time; next.reviewedAt=''; }
    if(status === 'completed' || status === 'rejected') {
      next.reviewedAt=time; next.actual=status === 'completed'?time.slice(0,10):''; next.opinion=opinion.value.trim();
      next.reviews ??= []; next.reviews.push({actor:MOCK_CURRENT_USER.name,result:status,opinion:next.opinion,time});
    }
    saveTechnicalTask(next,status === 'reviewing'?'review':status === 'completed'?'approve':status === 'rejected'?'reject':submission?'execute':'draft',submission?t('configurationMatrix.submissionComment'):status === 'completed' || status === 'rejected'?opinion.value:'');
    draft.value=JSON.parse(JSON.stringify(next));dirty.value=false;opinion.value='';Message.success(t(submission ? status === 'reviewing' ? 'configurationMatrix.sentForReview' : 'configurationMatrix.submitted' : 'tech.saved'));return true;
  } catch { Message.error(t('techExecution.failed'));return false; } finally { saving.value=false; }
}
function focusApproval() { nextTick(()=>document.getElementById('technical-approval-input')?.focus()); }
function review(result:'completed'|'rejected') { if(!canReview.value || saving.value)return;approvalResult.value=result;opinion.value='';approvalError.value=false;focusApproval(); }
function closeApproval() { if(saving.value)return;approvalResult.value=undefined;opinion.value='';approvalError.value=false; }
async function confirmApproval() {
  if(!canReview.value || !approvalResult.value || saving.value)return;
  if(!opinion.value.trim() || Array.from(opinion.value).length>200) {approvalError.value=true;focusApproval();return;}
  if(await persist(approvalResult.value))closeApproval();
}
const leaveVisible=ref(false);
let resolveLeave:((allow:boolean)=>void)|undefined;
function requestLeave() { return new Promise<boolean>(resolve=>{resolveLeave=resolve;leaveVisible.value=true;}); }
function finishLeave(allow:boolean) {leaveVisible.value=false;resolveLeave?.(allow);resolveLeave=undefined;}
onBeforeRouteLeave(()=>!dirty.value && !valuesRef.value?.overlayDirty || requestLeave());
onBeforeRouteUpdate(()=>!dirty.value && !valuesRef.value?.overlayDirty || requestLeave());
function beforeUnload(event:BeforeUnloadEvent) {if(!dirty.value && !valuesRef.value?.overlayDirty)return;event.preventDefault();event.returnValue='';}
window.addEventListener('beforeunload',beforeUnload);
onBeforeUnmount(()=>window.removeEventListener('beforeunload',beforeUnload));
</script>
<template>
  <main class="technical-page">
    <ExecutionTaskList v-if="!route.params.id" module="technical" :rows="technicalTasks" :withdraw-task="withdrawTechnicalTask" />
    <template v-else-if="draft">
      <AppDetailHeader ancestor-to="/tasks/technical" :ancestor-label="t('tech.title')" :current-label="route.params.mode === 'execute' ? t('executionWorkspace.execute') : route.params.mode === 'edit' ? t('executionWorkspace.edit') : route.params.mode === 'review' ? t('executionWorkspace.review') : t('executionWorkspace.detail')">
        <template #actions><a-space v-if="participant"><a-button class="app-btn-neutral" :disabled="saving" @click="router.push('/tasks/technical')">{{ t('templates.cancel') }}</a-button><a-button type="outline" class="app-btn-neutral technical-draft-button" :loading="saving" :disabled="!ready || valuesRef?.imageBusy" @click="persist()">{{ t('vehicle.save') }}</a-button><a-button type="primary" :loading="saving" :disabled="!ready || !valuesRef?.hasMineFields || valuesRef?.mineSubmitted || valuesRef?.imageBusy" @click="submitCurrent">{{ t('vehicle.submit') }}</a-button></a-space><a-space v-else-if="canReview"><a-button class="app-btn-neutral" :disabled="saving" @click="review('rejected')">{{ t('vehicle.reject') }}</a-button><a-button type="primary" :loading="saving" @click="review('completed')">{{ t('vehicle.pass') }}</a-button></a-space></template>
      </AppDetailHeader><TaskPauseNotice v-if="draft" :project="draft.project" :status="draft.status" />
      <TaskInformationSection><dl class="technical-facts"><div v-for="key in basics" :key="key"><dt><AppFieldLabel context="detail" colon :text="fieldLabel(key)" /></dt><dd><AppStatusTag v-if="key === 'status'" :role="statusRole(draft.status,'tasks')" :label="fieldValue(key)" /><template v-else>{{ fieldValue(key) }}</template></dd></div></dl></TaskInformationSection>
      <div class="detail-block" role="region" :aria-label="t('executionWorkspace.configuration')"><h2>{{ t('executionWorkspace.configuration') }}</h2><a-alert v-if="!ready && participant" type="warning" class="gate-warning">{{ t('tech.gate') }}</a-alert><VehicleValues :key="draft.id" ref="valuesRef" :model-value="draft" :readonly="!editable || saving" :manager="coordinator" :actor="MOCK_CURRENT_USER.name" :actor-id="MOCK_CURRENT_USER.accountId" :filling-mode="['execute','edit'].includes(String(route.params.mode)) && ['pending','submitting','active','rejected','withdrawn'].includes(draft.status)" show-parts :table-label="t('executionWorkspace.configuration')" :positive-entry-id="draft.referenceEntryId" :positive-message="t('tech.required')" @change="dirty=true" @save="(done,review)=>persist(review ? 'reviewing' : undefined, true).then(done)" /></div>
      <VehicleTimeline v-if="route.params.mode !== 'execute'" class="technical-timeline" :record="current || draft" module-code="technical" :include-unscoped="false" />
    </template>
    <a-empty v-else :description="t('tech.empty')" />
  </main>
  <a-modal :visible="!!approvalResult" :width="560" role="dialog" aria-modal="true" :aria-label="approvalLabel" :title="t(approvalResult === 'completed'?'vehicle.pass':'vehicle.reject')" :mask-closable="false" :esc-to-close="!saving" :closable="!saving" @cancel="closeApproval" @open="focusApproval">
    <a-form :model="{opinion}" layout="vertical" @submit-success="confirmApproval"><a-form-item field="opinion" required :validate-status="approvalError?'error':undefined" :help="approvalError?t('vehicleApproval.required',{field:approvalLabel}):undefined"><template #label><AppFieldLabel as="label" for="technical-approval-input" context="editable" :text="approvalLabel" /></template><a-textarea v-model="opinion" :textarea-attrs="{id:'technical-approval-input','aria-label':approvalLabel,'aria-required':true,'aria-invalid':approvalError}" :max-length="200" show-word-limit :auto-size="{minRows:4,maxRows:8}" :disabled="saving" @input="approvalError=false" /></a-form-item></a-form>
    <template #footer><a-space><a-button class="app-btn-neutral" :disabled="saving" @click="closeApproval">{{ t('templates.cancel') }}</a-button><a-button type="primary" :loading="saving" @click="confirmApproval">{{ t('designSystem.confirm') }}</a-button></a-space></template>
  </a-modal>
  <ConfirmDialog unsaved :visible="leaveVisible" :title="t('tech.leave')" @update:visible="finishLeave(false)" @confirm="finishLeave(true)" />
</template>
<style scoped>
.technical-page { min-width:0;display:flex;flex-direction:column;gap:var(--mt-ds-space-3);color:var(--color-text-1); }
.detail-block { min-width:0;padding:var(--mt-ds-space-4);background:var(--app-surface); }
h2 {margin:0 0 var(--mt-ds-space-4);padding-bottom:var(--mt-ds-space-3);border-bottom:1px solid var(--app-divider);font-size:var(--mt-ds-font-title);font-weight:var(--mt-ds-weight-title);}
.technical-facts {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--mt-ds-space-4);margin:0;}
.technical-facts>div {display:flex;align-items:baseline;gap:var(--mt-ds-space-2);min-width:0;}
.technical-facts dt {flex-shrink:0;color:var(--color-text-3);}
.technical-facts dd {margin:0;overflow-wrap:anywhere;}
.technical-draft-button.arco-btn {background-color:transparent;}
.gate-warning {margin-bottom:var(--mt-ds-space-4);}
@media(max-width:1000px){.technical-facts{grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:600px){.technical-facts{grid-template-columns:1fr;}}
</style>

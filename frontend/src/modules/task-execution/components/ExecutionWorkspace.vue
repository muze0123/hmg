<script setup lang="ts">
import TaskPauseNotice from '../../projects/components/TaskPauseNotice.vue';
import { taskPaused, displayedTaskStatus } from '../../projects/data/suspension';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import ExecutionTaskList from './ExecutionTaskList.vue';
import TaskInformationSection from './TaskInformationSection.vue';
import AppDetailHeader from '../../../design/components/AppDetailHeader.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import VehicleValues from '../../vehicle/components/VehicleValues.vue';
import VehicleTimeline from '../../vehicle/components/VehicleTimeline.vue';
import { collaborationReady, assignmentIsMine } from '../../vehicle/data/collaboration';
import { MOCK_CURRENT_USER, projects } from '../../projects/data/projects';
import { EDITABLE_TASK_STATUSES } from '../../../shared/taskLifecycle';
import { statusRole } from '../../../shared/status';
import { safeRichHtml } from '../utils/richText';
import { executionRecords, executionReady, moduleCode, saveExecution, syncExecutionSections, withdrawExecution, createCertificateDraft, type ExecutionModule, type ExecutionRecord } from '../data/workspace';
const props=defineProps<{module: ExecutionModule}>();
const {t}=useI18n();const route=useRoute();const router=useRouter();
syncExecutionSections(props.module);
const base=computed(()=>`/tasks/${props.module}`);
const moduleLabel=computed(()=>t(`executionWorkspace.modules.${props.module}`));
const current=computed(()=>executionRecords[props.module].find(row=>row.id===route.params.id));
const draft=ref<ExecutionRecord>();const dirty=ref(false);const busy=ref(false);
const valuesRef=ref<InstanceType<typeof VehicleValues>>();
const mode=computed(()=>String(route.params.mode || 'view'));
const validMode=computed(()=>['execute','edit','view','review'].includes(mode.value));
const fillingMode=computed(()=>mode.value==='execute' || mode.value==='edit' || certificateNew.value);
const pageLabel=computed(()=>certificateNew.value?t('cert.new'):mode.value==='execute'?t('executionWorkspace.execute'):mode.value==='edit'?t('executionWorkspace.edit'):mode.value==='review'?t('executionWorkspace.review'):t('executionWorkspace.detail'));
const coordinator=computed(()=>draft.value?.owner===MOCK_CURRENT_USER.name);
const ready=computed(()=>!!draft.value && executionReady(draft.value));
const assigned=computed(()=>!!draft.value && (coordinator.value || draft.value.assignments?.some(group=>assignmentIsMine(group,MOCK_CURRENT_USER.name,MOCK_CURRENT_USER.accountId))));
const fillableStatus=computed(()=>!!draft.value && EDITABLE_TASK_STATUSES.includes(draft.value.status));
const participant=computed(()=>!taskPaused(draft.value?.project || '', draft.value?.status || '') && fillingMode.value && fillableStatus.value && assigned.value);
const editable=computed(()=>participant.value && ready.value && !busy.value);
// The route's approval perspective follows the existing list perspective switch.
const reviewing=computed(()=>!taskPaused(draft.value?.project || '', draft.value?.status || '') && route.params.mode==='review' && draft.value?.status==='reviewing');
const certificateNew=computed(()=>props.module==='certificates' && route.params.id==='new');
const basics=['id','name','regulation','priority','status','brand','series','model','end','owner','reviewer','template','version','region','country','type'] as const;
function fieldLabel(key: typeof basics[number]) {
  if(key==='regulation')return t('tech.regulation');if(key==='owner')return t('executionList.owner');
  if(['brand','series','model'].includes(key))return t(`projects.${key}`);return t(`vehicle.${key}`);
}
function fieldValue(key: typeof basics[number]) {
  const record=draft.value;if(!record)return '—';
  if(key==='template')return record.templateSnapshot?.name || '—';if(key==='priority')return t(`projects.${record.priority}`);if(key==='status')return t(`taskStatus.${displayedTaskStatus(record.project || '', record.status)}`);
  if(key==='region')return t(`templates.regions.${record.region}`);if(key==='country')return t(`templates.countries.${record.country}`);if(key==='type')return t(`templates.vehicleTypes.${record.type}`);
  return record[key] || '—';
}
function changed(){dirty.value=true;}
async function submitCurrent() { if(!editable.value || busy.value)return; await valuesRef.value?.submitMine(); }
async function persist(status?: ExecutionRecord['status'], submission = false) {
  if(busy.value || !draft.value || (!editable.value && !reviewing.value))return false;
  if(current.value && current.value.status!==draft.value.status){Message.error(t('techExecution.changed'));return false;}
  if(status==='reviewing' && !collaborationReady(draft.value))return false;
  busy.value=true;
  try {
    const next:ExecutionRecord=JSON.parse(JSON.stringify(draft.value));const time=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium'}).format(new Date());
    next.status=status ?? (next.status==='active' || next.assignments?.some(group=>group.status==='submitted')?'active':'submitting');
    for(const entry of next.entries)if(entry.format==='ordered')entry.values=(next.rowIds || []).map((_,index)=>String(index+1));
    if(status==='reviewing'){next.executedAt=time;next.reviewedAt='';}
    if(status==='completed' || status==='rejected'){next.reviewedAt=time;next.actual=status==='completed'?time.slice(0,10):'';next.reviews ??=[];next.reviews.push({actor:MOCK_CURRENT_USER.name,result:status,opinion:opinion.value.trim(),time});}
    saveExecution(props.module,next,status==='reviewing'?'review':status==='completed'?'approve':status==='rejected'?'reject':submission?'execute':'draft',submission?t('configurationMatrix.submissionComment'):status==='completed' || status==='rejected'?opinion.value:'');
    draft.value=JSON.parse(JSON.stringify(next));dirty.value=false;Message.success(t(submission ? status==='reviewing' ? 'configurationMatrix.sentForReview' : 'configurationMatrix.submitted' : 'tech.saved'));if(certificateNew.value){busy.value=false;await router.replace(`${base.value}/${next.id}/edit`);}return true;
  }catch{Message.error(t('techExecution.failed'));return false;}finally{busy.value=false;}
}
const approval=ref<'completed'|'rejected'>();const opinion=ref('');const approvalError=ref(false);
const approvalLabel=computed(()=>t(approval.value==='completed'?'vehicleApproval.opinion':'vehicleApproval.reason'));
function openApproval(result:'completed'|'rejected'){if(!reviewing.value || busy.value)return;approval.value=result;opinion.value='';approvalError.value=false;nextTick(()=>document.getElementById('execution-approval')?.focus());}
function closeApproval(){if(busy.value)return;approval.value=undefined;opinion.value='';approvalError.value=false;}
watch(()=>route.fullPath,()=>{draft.value=current.value?JSON.parse(JSON.stringify(current.value)):undefined;dirty.value=false;closeApproval();},{immediate:true});
async function confirmApproval(){if(!approval.value || !reviewing.value || busy.value)return;if(!opinion.value.trim() || Array.from(opinion.value).length>200){approvalError.value=true;nextTick(()=>document.getElementById('execution-approval')?.focus());return;}if(await persist(approval.value))closeApproval();}
const leave=ref(false);let resolveLeave:((allow:boolean)=>void)|undefined;
function guard(){if(busy.value)return false;if(!dirty.value && !valuesRef.value?.overlayDirty)return true;leave.value=true;return new Promise<boolean>(resolve=>{resolveLeave=resolve;});}
function finishLeave(allow:boolean){leave.value=false;resolveLeave?.(allow);resolveLeave=undefined;}
onBeforeRouteLeave(guard);onBeforeRouteUpdate(guard);
function beforeUnload(event:BeforeUnloadEvent){if(dirty.value || valuesRef.value?.overlayDirty){event.preventDefault();event.returnValue='';}}
window.addEventListener('beforeunload',beforeUnload);onBeforeUnmount(()=>window.removeEventListener('beforeunload',beforeUnload));
const newProject=ref('');
function startCertificate(){const record=createCertificateDraft(newProject.value);if(record){draft.value=record;dirty.value=true;}}
const exporting=ref(false);const exportTemplate=ref('');const filename=ref('');
function printReport(){if(!draft.value || !exportTemplate.value || !filename.value.trim())return;const popup=window.open('','_blank');if(!popup){Message.error(t('reports.exportNote'));return;}popup.document.title=filename.value;const heading=popup.document.createElement('h1');heading.textContent=t('reports.standard');popup.document.body.append(heading);for(const text of [draft.value.id,draft.value.name,draft.value.regulation]){const p=popup.document.createElement('p');p.textContent=text;popup.document.body.append(p);}for(const entry of draft.value.entries){const title=popup.document.createElement('h2');title.textContent=entry.name;popup.document.body.append(title);for(const value of entry.values){const p=popup.document.createElement('div');if(entry.format==='rich')p.innerHTML=safeRichHtml(value);else p.textContent=value;popup.document.body.append(p);}}const style=popup.document.createElement('style');style.textContent='@page { size:A4 portrait; margin:20mm; } body { font-family:sans-serif; overflow-wrap:anywhere; } img { max-width:100%; }';popup.document.head.append(style);popup.document.close();popup.focus();popup.print();}
</script>
<template>
  <main class="execution-workspace">
    <ExecutionTaskList v-if="!route.params.id" :module="module" :rows="executionRecords[module]" :withdraw-task="(id,perspective)=>withdrawExecution(module,id,perspective)" />
    <template v-else-if="draft && validMode">
      <AppDetailHeader :ancestor-to="base" :ancestor-label="moduleLabel" :current-label="pageLabel">
        <template #actions>
          <a-space v-if="fillingMode"><a-button class="app-btn-neutral" :disabled="busy" @click="router.push(base)">{{ t('templates.cancel') }}</a-button><a-button type="outline" class="app-btn-neutral draft-button" :disabled="!ready || !participant || valuesRef?.imageBusy" :loading="busy" @click="persist()">{{ t('vehicle.save') }}</a-button><a-button type="primary" :disabled="!participant || !ready || !valuesRef?.hasMineFields || valuesRef?.mineSubmitted || valuesRef?.imageBusy" :loading="busy" @click="submitCurrent">{{ t('vehicle.submit') }}</a-button></a-space>
          <a-space v-else-if="reviewing"><a-button class="app-btn-neutral" :disabled="busy" @click="openApproval('rejected')">{{ t('vehicle.reject') }}</a-button><a-button type="primary" :loading="busy" @click="openApproval('completed')">{{ t('vehicle.pass') }}</a-button></a-space>
          <a-button v-if="module==='reports' && draft.status==='completed'" class="app-btn-neutral" @click="exporting=true; filename=draft.id">{{ t('reports.export') }}</a-button>
        </template>
      </AppDetailHeader><TaskPauseNotice v-if="draft" :project="draft.project" :status="draft.status" />
      <TaskInformationSection><dl class="execution-facts"><div v-for="key in basics" :key="key"><dt><AppFieldLabel context="detail" colon :text="fieldLabel(key)" /></dt><dd><AppStatusTag v-if="key==='status'" :role="statusRole(draft.status,'tasks')" :label="fieldValue(key)" /><template v-else>{{ fieldValue(key) }}</template></dd></div></dl></TaskInformationSection>
      <section class="detail-block" :aria-label="t('executionWorkspace.configuration')"><h2>{{ t('executionWorkspace.configuration') }}</h2><a-alert v-if="fillingMode && !fillableStatus" type="warning">{{ t('executionWorkspace.statusChanged') }}</a-alert><a-alert v-if="!ready && participant" type="warning">{{ t('tech.gate') }}</a-alert><VehicleValues :key="`${draft.id}-${mode}`" ref="valuesRef" v-model="draft" :readonly="!editable" :manager="coordinator" :actor="MOCK_CURRENT_USER.name" :actor-id="MOCK_CURRENT_USER.accountId" :filling-mode="fillingMode && fillableStatus" :show-parts="module==='reports' || module==='certificates'" :table-label="t('executionWorkspace.configuration')" @change="changed" @save="(done,review)=>persist(review ? 'reviewing' : undefined, true).then(done)" /></section>
      <VehicleTimeline v-if="route.params.mode !== 'execute'" :record="current || draft" :module-code="moduleCode(module)" :include-unscoped="false" />
    </template>
    <section v-else-if="certificateNew" class="detail-block"><AppDetailHeader :ancestor-to="base" :ancestor-label="moduleLabel" :current-label="t('cert.new')" /><a-select v-model="newProject" :aria-label="t('executionWorkspace.selectProject')" allow-search :placeholder="t('executionWorkspace.selectProject')"><a-option v-for="project in projects" :key="project.id" :value="project.id">{{ project.id }} · {{ project.name }}</a-option></a-select><a-button type="primary" :disabled="!newProject" @click="startCertificate">{{ t('executionWorkspace.create') }}</a-button></section>
    <a-empty v-else :description="t('projects.missing')" />
  </main>
  <a-modal :visible="!!approval" :width="560" :title="t(approval==='completed'?'vehicle.pass':'vehicle.reject')" :aria-label="approvalLabel" :mask-closable="false" :esc-to-close="!busy" :closable="!busy" @cancel="closeApproval"><a-form :model="{opinion}" layout="vertical"><a-form-item required :validate-status="approvalError?'error':undefined" :help="approvalError?t('vehicleApproval.required',{field:approvalLabel}):undefined"><template #label><AppFieldLabel as="label" for="execution-approval" :text="approvalLabel" /></template><a-textarea v-model="opinion" :textarea-attrs="{id:'execution-approval','aria-label':approvalLabel,'aria-required':true,'aria-invalid':approvalError}" :max-length="200" show-word-limit :disabled="busy" :auto-size="{minRows:4,maxRows:8}" @input="approvalError=false" /></a-form-item></a-form><template #footer><a-space><a-button class="app-btn-neutral" :disabled="busy" @click="closeApproval">{{ t('templates.cancel') }}</a-button><a-button type="primary" :loading="busy" @click="confirmApproval">{{ t('designSystem.confirm') }}</a-button></a-space></template></a-modal>
  <ConfirmDialog unsaved :visible="leave" :title="t('vehicle.unsaved')" @update:visible="finishLeave(false)" @confirm="finishLeave(true)" />
  <a-modal v-model:visible="exporting" :title="t('reports.export')" :mask-closable="false"><a-form :model="{exportTemplate,filename}" layout="vertical"><a-form-item :label="t('reports.template')" required><a-select v-model="exportTemplate" :aria-label="t('reports.template')"><a-option value="standard">{{ t('reports.standard') }}</a-option></a-select></a-form-item><a-form-item :label="t('reports.filename')" required><a-input v-model="filename" :input-attrs="{'aria-label':t('reports.filename')}" :max-length="100" /></a-form-item><p>{{ t('reports.format') }}</p></a-form><template #footer><a-space><a-button class="app-btn-neutral" @click="exporting=false">{{ t('templates.cancel') }}</a-button><a-button type="primary" :disabled="!exportTemplate || !filename.trim()" @click="printReport">{{ t('reports.preview') }}</a-button></a-space></template></a-modal>
</template>
<style scoped>
.execution-workspace {min-width:0;display:flex;flex-direction:column;gap:var(--mt-ds-space-3);color:var(--color-text-1);}
.detail-block {min-width:0;padding:var(--mt-ds-space-4);background:var(--app-surface);}
h2 {margin:0 0 var(--mt-ds-space-4);padding-bottom:var(--mt-ds-space-3);border-bottom:1px solid var(--app-divider);font-size:var(--mt-ds-font-title);font-weight:var(--mt-ds-weight-title);}
.execution-facts {display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:var(--mt-ds-space-4);margin:0;}
.execution-facts>div {display:flex;align-items:baseline;gap:var(--mt-ds-space-2);min-width:0;}
.execution-facts dt {flex-shrink:0;color:var(--color-text-3);}.execution-facts dd {margin:0;overflow-wrap:anywhere;}
.draft-button.arco-btn {background:transparent;}
.detail-block>.arco-alert {margin-bottom:var(--mt-ds-space-4);}
@media(max-width:1000px){.execution-facts {grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:600px){.execution-facts {grid-template-columns:1fr;}}
</style>

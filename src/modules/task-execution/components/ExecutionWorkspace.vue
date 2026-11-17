<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import ExecutionTaskList from './ExecutionTaskList.vue';
import AppDetailHeader from '../../../design/components/AppDetailHeader.vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import VehicleValues from '../../vehicle/components/VehicleValues.vue';
import VehicleTimeline from '../../vehicle/components/VehicleTimeline.vue';
import { collaborationReady } from '../../vehicle/data/collaboration';
import { MOCK_CURRENT_USER, projects } from '../../projects/data/projects';
import { EDITABLE_TASK_STATUSES } from '../../../shared/taskLifecycle';
import { statusRole } from '../../../shared/status';
import { safeRichHtml } from '../utils/richText';
import { executionRecords, executionReady, moduleCode, saveExecution, syncExecutionSections, technicalReference, upstreamReferences, withdrawExecution, createCertificateDraft, type ExecutionModule, type ExecutionRecord, type CertificateFields } from '../data/workspace';
const props=defineProps<{module: ExecutionModule}>();
const {t}=useI18n();const route=useRoute();const router=useRouter();
syncExecutionSections(props.module);
const base=computed(()=>`/tasks/${props.module}`);
const moduleLabel=computed(()=>t(`executionWorkspace.modules.${props.module}`));
const current=computed(()=>executionRecords[props.module].find(row=>row.id===route.params.id));
const draft=ref<ExecutionRecord>();const dirty=ref(false);const busy=ref(false);const businessError=ref(false);
const valuesRef=ref<InstanceType<typeof VehicleValues>>();
const mode=computed(()=>String(route.params.mode || 'view'));
const validMode=computed(()=>['execute','edit','view','review'].includes(mode.value));
const fillingMode=computed(()=>mode.value==='execute' || mode.value==='edit' || certificateNew.value);
const pageLabel=computed(()=>certificateNew.value?t('cert.new'):mode.value==='execute'?t('executionWorkspace.execute'):mode.value==='edit'?t('executionWorkspace.edit'):mode.value==='review'?t('executionWorkspace.review'):t('executionWorkspace.detail'));
const coordinator=computed(()=>draft.value?.owner===MOCK_CURRENT_USER.name);
const ready=computed(()=>!!draft.value && executionReady(draft.value));
const assigned=computed(()=>!!draft.value && (coordinator.value || draft.value.assignments?.some(group=>group.owner===MOCK_CURRENT_USER.name)));
const fillableStatus=computed(()=>!!draft.value && EDITABLE_TASK_STATUSES.includes(draft.value.status));
const participant=computed(()=>fillingMode.value && fillableStatus.value && assigned.value);
const editable=computed(()=>participant.value && ready.value && !busy.value);
const businessEditable=computed(()=>participant.value && ready.value && coordinator.value);
// The route's approval perspective follows the existing list perspective switch.
const reviewing=computed(()=>route.params.mode==='review' && draft.value?.status==='reviewing');
const certificateNew=computed(()=>props.module==='certificates' && route.params.id==='new');
const basics=['id','name','regulation','priority','status','brand','series','model','end','owner','reviewer','template','version','region','country','type'] as const;
function fieldLabel(key: typeof basics[number]) {
  if(key==='regulation')return t('tech.regulation');if(key==='owner')return t('executionList.owner');
  if(['brand','series','model'].includes(key))return t(`projects.${key}`);return t(`vehicle.${key}`);
}
function fieldValue(key: typeof basics[number]) {
  const record=draft.value;if(!record)return '—';
  if(key==='template')return record.templateSnapshot?.name || '—';if(key==='priority')return t(`projects.${record.priority}`);if(key==='status')return t(`taskStatus.${record.status}`);
  if(key==='region')return t(`templates.regions.${record.region}`);if(key==='country')return t(`templates.countries.${record.country}`);if(key==='type')return t(`templates.vehicleTypes.${record.type}`);
  return record[key] || '—';
}
function changed(){dirty.value=true;businessError.value=false;}
function validateBusiness() {
  const record=draft.value;if(!record)return false;
  const valid=props.module==='reports'?!!record.business.summary.trim():props.module==='testing'?!!record.business.conclusion:
    record.business.certificates.length>0 && record.business.certificates.every(entry=>entry.number.trim() && entry.issuer.trim() && entry.agency.trim() && entry.issued && entry.file && (!entry.expires || entry.expires>=entry.issued));
  businessError.value=!valid;
  if(!valid)nextTick(()=>{const region=document.querySelector<HTMLElement>('.execution-business');region?.scrollIntoView({block:'center'});region?.querySelector<HTMLElement>('input,textarea,[tabindex]')?.focus();});
  return valid;
}
async function persist(status?: ExecutionRecord['status']) {
  if(busy.value || !draft.value || (!editable.value && !reviewing.value))return false;
  if(current.value && current.value.status!==draft.value.status){Message.error(t('techExecution.changed'));return false;}
  if(status==='reviewing' && (!coordinator.value || !collaborationReady(draft.value) || !valuesRef.value?.validate() || !validateBusiness()))return false;
  busy.value=true;
  try {
    const next:ExecutionRecord=JSON.parse(JSON.stringify(draft.value));const time=new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium'}).format(new Date());
    next.status=status ?? (next.status==='active'?'active':'submitting');
    for(const entry of next.entries)if(entry.format==='ordered')entry.values=(next.rowIds || []).map((_,index)=>String(index+1));
    if(status==='reviewing'){next.executedAt=time;next.reviewedAt='';}
    if(status==='completed' || status==='rejected'){next.reviewedAt=time;next.actual=status==='completed'?time.slice(0,10):'';next.reviews ??=[];next.reviews.push({actor:MOCK_CURRENT_USER.name,result:status,opinion:opinion.value.trim(),time});}
    saveExecution(props.module,next,status==='reviewing'?'review':status==='completed'?'approve':status==='rejected'?'reject':'draft',status==='completed' || status==='rejected'?opinion.value:'');
    draft.value=JSON.parse(JSON.stringify(next));dirty.value=false;Message.success(t('tech.saved'));if(certificateNew.value){busy.value=false;await router.replace(`${base.value}/${next.id}/edit`);}return true;
  }catch{Message.error(t('techExecution.failed'));return false;}finally{busy.value=false;}
}
const approval=ref<'completed'|'rejected'>();const opinion=ref('');const approvalError=ref(false);
const approvalLabel=computed(()=>t(approval.value==='completed'?'vehicleApproval.opinion':'vehicleApproval.reason'));
function openApproval(result:'completed'|'rejected'){if(!reviewing.value || busy.value)return;approval.value=result;opinion.value='';approvalError.value=false;nextTick(()=>document.getElementById('execution-approval')?.focus());}
function closeApproval(){if(busy.value)return;approval.value=undefined;opinion.value='';approvalError.value=false;}
watch(()=>route.fullPath,()=>{draft.value=current.value?JSON.parse(JSON.stringify(current.value)):undefined;dirty.value=false;businessError.value=false;closeApproval();},{immediate:true});
async function confirmApproval(){if(!approval.value || !reviewing.value || busy.value)return;if(!opinion.value.trim() || Array.from(opinion.value).length>200){approvalError.value=true;nextTick(()=>document.getElementById('execution-approval')?.focus());return;}if(await persist(approval.value))closeApproval();}
const leave=ref(false);let resolveLeave:((allow:boolean)=>void)|undefined;
function guard(){if(busy.value)return false;if(!dirty.value && !valuesRef.value?.overlayDirty)return true;leave.value=true;return new Promise<boolean>(resolve=>{resolveLeave=resolve;});}
function finishLeave(allow:boolean){leave.value=false;resolveLeave?.(allow);resolveLeave=undefined;}
onBeforeRouteLeave(guard);onBeforeRouteUpdate(guard);
function beforeUnload(event:BeforeUnloadEvent){if(dirty.value || valuesRef.value?.overlayDirty){event.preventDefault();event.returnValue='';}}
window.addEventListener('beforeunload',beforeUnload);onBeforeUnmount(()=>window.removeEventListener('beforeunload',beforeUnload));
async function upload(event:Event,entry:CertificateFields){const input=event.target as HTMLInputElement;const file=input.files?.[0];if(!file || !editable.value || !coordinator.value)return;if(!file.name.toLowerCase().endsWith('.pdf') || file.size>20*1024*1024){Message.error(t('cert.fileError'));input.value='';return;}busy.value=true;try{const data=await new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=reject;reader.readAsDataURL(file);});entry.file={name:file.name,size:file.size,type:'application/pdf',data};changed();}catch{Message.error(t('techExecution.failed'));}finally{busy.value=false;}}
function chooseFile(index:number){if(!businessEditable.value || busy.value)return;document.getElementById(`certificate-file-${index}`)?.click();}
function download(entry:CertificateFields){if(!entry.file)return;const anchor=document.createElement('a');anchor.href=entry.file.data;anchor.download=entry.file.name;anchor.click();}
const newProject=ref('');
function startCertificate(){const record=createCertificateDraft(newProject.value);if(record){draft.value=record;dirty.value=true;}}
const exporting=ref(false);const exportTemplate=ref('');const filename=ref('');
function printReport(){if(!draft.value || !exportTemplate.value || !filename.value.trim())return;const popup=window.open('','_blank');if(!popup){Message.error(t('reports.exportNote'));return;}popup.document.title=filename.value;const heading=popup.document.createElement('h1');heading.textContent=t('reports.standard');popup.document.body.append(heading);for(const text of [draft.value.id,draft.value.name,draft.value.regulation,draft.value.business.summary,draft.value.business.technical,draft.value.business.testing]){const p=popup.document.createElement('p');p.textContent=text;popup.document.body.append(p);}for(const entry of draft.value.entries){const title=popup.document.createElement('h2');title.textContent=entry.name;popup.document.body.append(title);for(const value of entry.values){const p=popup.document.createElement('div');if(entry.format==='rich')p.innerHTML=safeRichHtml(value);else p.textContent=value;popup.document.body.append(p);}}const style=popup.document.createElement('style');style.textContent='@page { size:A4 portrait; margin:20mm; } body { font-family:sans-serif; overflow-wrap:anywhere; } img { max-width:100%; }';popup.document.head.append(style);popup.document.close();popup.focus();popup.print();}
</script>
<template>
  <main class="execution-workspace">
    <ExecutionTaskList v-if="!route.params.id" :module="module" :rows="executionRecords[module]" :withdraw-task="(id,perspective)=>withdrawExecution(module,id,perspective)" />
    <template v-else-if="draft && validMode">
      <AppDetailHeader :ancestor-to="base" :ancestor-label="moduleLabel" :current-label="pageLabel">
        <template #actions>
          <a-space v-if="fillingMode"><a-button class="app-btn-neutral" :disabled="busy" @click="router.push(base)">{{ t('templates.cancel') }}</a-button><a-button type="outline" class="app-btn-neutral draft-button" :disabled="!ready || !participant" :loading="busy" @click="persist()">{{ t('vehicle.save') }}</a-button><a-button v-if="coordinator" type="primary" :disabled="!participant || !ready || !collaborationReady(draft)" :loading="busy" @click="persist('reviewing')">{{ t('vehicle.submit') }}</a-button></a-space>
          <a-space v-else-if="reviewing"><a-button class="app-btn-neutral" :disabled="busy" @click="openApproval('rejected')">{{ t('vehicle.reject') }}</a-button><a-button type="primary" :loading="busy" @click="openApproval('completed')">{{ t('vehicle.pass') }}</a-button></a-space>
          <a-button v-if="module==='reports' && draft.status==='completed'" class="app-btn-neutral" @click="exporting=true; filename=draft.id">{{ t('reports.export') }}</a-button>
        </template>
      </AppDetailHeader>
      <section class="detail-block" :aria-label="t('executionWorkspace.info')"><h2>{{ t('executionWorkspace.info') }}</h2><dl class="execution-facts"><div v-for="key in basics" :key="key"><dt><AppFieldLabel context="detail" colon :text="fieldLabel(key)" /></dt><dd><AppStatusTag v-if="key==='status'" :role="statusRole(draft.status,'tasks')" :label="fieldValue(key)" /><template v-else>{{ fieldValue(key) }}</template></dd></div></dl></section>
      <section class="detail-block" :aria-label="t('executionWorkspace.configuration')"><h2>{{ t('executionWorkspace.configuration') }}</h2><a-alert v-if="fillingMode && !assigned" type="warning">{{ t('executionWorkspace.notAssigned') }}</a-alert><a-alert v-else-if="fillingMode && !fillableStatus" type="warning">{{ t('executionWorkspace.statusChanged') }}</a-alert><a-alert v-if="!ready && participant" type="warning">{{ t('tech.gate') }}</a-alert><VehicleValues :key="`${draft.id}-${mode}`" ref="valuesRef" v-model="draft" :readonly="!editable" :manager="coordinator" :actor="MOCK_CURRENT_USER.name" :table-label="t('executionWorkspace.configuration')" @change="changed" @save="done=>persist().then(done)" /></section>
      <section class="detail-block execution-business" :aria-label="t('executionWorkspace.business')"><h2>{{ t('executionWorkspace.business') }}</h2><a-alert v-if="businessError" type="error">{{ t('executionWorkspace.businessRequired') }}</a-alert>
        <a-form v-if="businessEditable && module==='testing'" :model="draft.business" layout="vertical" class="business-form">
          <a-form-item required><template #label><AppFieldLabel as="label" for="execution-conclusion" :text="t('executionWorkspace.testConclusion')" colon /></template><a-select v-model="draft.business.conclusion" id="execution-conclusion" :disabled="busy" allow-clear :aria-label="t('executionWorkspace.testConclusion')" :placeholder="t('templateEditor.selectHint',{field:t('executionWorkspace.testConclusion')})" @change="changed"><a-option value="passed">{{ t('executionWorkspace.passed') }}</a-option><a-option value="failed">{{ t('executionWorkspace.failed') }}</a-option></a-select></a-form-item>
          <a-form-item><template #label><AppFieldLabel :text="t('executionWorkspace.technicalMass')" colon /></template><span class="business-value">{{ draft.business.technical || '—' }} · {{ technicalReference(draft.business.technical) || '—' }} kg</span></a-form-item>
        </a-form>
        <a-form v-else-if="businessEditable && module==='reports'" :model="draft.business" layout="vertical" class="business-form">
          <a-form-item required><template #label><AppFieldLabel as="label" for="execution-summary" :text="t('reports.summary')" colon /></template><a-textarea v-model="draft.business.summary" allow-clear :disabled="busy" :max-length="5000" :auto-size="{minRows:3,maxRows:8}" :textarea-attrs="{id:'execution-summary','aria-label':t('reports.summary')}" @input="changed" /></a-form-item>
          <a-form-item v-for="key in (['technical','testing'] as const)" :key="key"><template #label><AppFieldLabel :text="t(`reports.${key}`)" colon /></template><span class="business-value">{{ draft.business[key] || '—' }}</span></a-form-item>
        </a-form>
        <dl v-else-if="module==='testing'" class="execution-facts business-facts">
          <div><dt><AppFieldLabel context="detail" :text="t('executionWorkspace.testConclusion')" colon /></dt><dd>{{ draft.business.conclusion?t(`executionWorkspace.${draft.business.conclusion}`):'—' }}</dd></div>
          <div><dt><AppFieldLabel context="detail" :text="t('executionWorkspace.technicalMass')" colon /></dt><dd>{{ draft.business.technical || '—' }} · {{ technicalReference(draft.business.technical) || '—' }} kg</dd></div>
        </dl>
        <dl v-else-if="module==='reports'" class="execution-facts business-facts">
          <div class="business-wide"><dt><AppFieldLabel context="detail" :text="t('reports.summary')" colon /></dt><dd>{{ draft.business.summary || '—' }}</dd></div>
          <div v-for="key in (['technical','testing'] as const)" :key="key"><dt><AppFieldLabel context="detail" :text="t(`reports.${key}`)" colon /></dt><dd>{{ draft.business[key] || '—' }}</dd></div>
        </dl>
        <template v-else>
          <div v-for="(entry,index) in draft.business.certificates" :key="index" class="certificate-group">
            <a-form v-if="businessEditable" :model="entry" layout="vertical" class="business-form certificate-entry">
              <a-form-item><template #label><AppFieldLabel :text="t('tech.regulation')" colon /></template><span class="business-value">{{ entry.regulation }}</span></a-form-item>
              <a-form-item v-for="key in (['number','issuer','agency','issued','expires'] as const)" :key="key" :required="key!=='expires'">
                <template #label><AppFieldLabel as="label" :for="`certificate-${index}-${key}`" :text="t(`cert.${key}`)" colon /></template>
                <a-date-picker v-if="key==='issued' || key==='expires'" :id="`certificate-${index}-${key}`" v-model="entry[key]" :disabled="busy" allow-clear :aria-label="`${t(`cert.${key}`)} ${index+1}`" @change="changed" />
                <a-input v-else v-model="entry[key]" allow-clear :disabled="busy" :input-attrs="{id:`certificate-${index}-${key}`,'aria-label':`${t(`cert.${key}`)} ${index+1}`}" @input="changed" />
              </a-form-item>
              <a-form-item required><template #label><AppFieldLabel :text="t('cert.file')" colon /></template><div class="certificate-file-control"><input :id="`certificate-file-${index}`" hidden type="file" accept=".pdf" :aria-label="`${t('cert.upload')} ${index+1}`" :disabled="busy" @change="upload($event,entry)"><a-button class="app-btn-neutral" :disabled="busy" @click="chooseFile(index)">{{ t('cert.upload') }}</a-button><a-button v-if="entry.file" type="text" class="file-name" @click="download(entry)">{{ entry.file.name }}</a-button></div></a-form-item>
            </a-form>
            <dl v-else class="execution-facts business-facts">
              <div><dt><AppFieldLabel context="detail" :text="t('tech.regulation')" colon /></dt><dd>{{ entry.regulation || '—' }}</dd></div>
              <div v-for="key in (['number','issuer','agency','issued','expires'] as const)" :key="key"><dt><AppFieldLabel context="detail" :text="t(`cert.${key}`)" colon /></dt><dd>{{ entry[key] || '—' }}</dd></div>
              <div class="business-wide"><dt><AppFieldLabel context="detail" :text="t('cert.file')" colon /></dt><dd><a-button v-if="entry.file" type="text" class="file-name" @click="download(entry)">{{ entry.file.name }}</a-button><span v-else>—</span></dd></div>
            </dl>
          </div>
        </template>
        <dl v-if="upstreamReferences(draft).length" class="source-references">
          <div v-for="reference in upstreamReferences(draft)" :key="`${reference.type}-${reference.templateId}`" class="source-reference"><dt><AppFieldLabel context="detail" :text="t(`executionWorkspace.sources.${reference.type}`)" colon /></dt><dd><span>{{ reference.templateName }} · {{ reference.taskId || '—' }}</span><p>{{ reference.values || t('executionWorkspace.sourcePending') }}</p></dd></div>
        </dl>
      </section>
      <VehicleTimeline :record="current || draft" :module-code="moduleCode(module)" :include-unscoped="false" />
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
.business-form {display:flex;flex-direction:row;flex-wrap:wrap;align-items:flex-start;gap:var(--mt-ds-space-4);}
.business-form :deep(.arco-form-item) {flex:0 1 400px;min-width:0;max-width:100%;margin-bottom:0;}
.business-form :deep(.arco-form-item-label-col) {text-align:left;}
.business-form :deep(.arco-form-item-label) {color:var(--color-text-3);font-size:var(--mt-ds-font-body);font-weight:var(--mt-ds-weight-body);line-height:var(--mt-ds-line-body);}
.business-form :deep(.arco-form-item-wrapper-col), .business-form :deep(.arco-form-item-content) {min-width:0;}
.business-form :deep(.arco-select),.business-form :deep(.arco-picker),.business-form :deep(.arco-input-wrapper),.business-form :deep(.arco-textarea-wrapper) {width:100%;max-width:100%;}
.business-value {min-height:var(--mt-ds-control-height);overflow-wrap:anywhere;white-space:pre-wrap;}
.business-wide {grid-column:1 / -1;}
.business-facts dd {white-space:pre-wrap;}
.certificate-group+.certificate-group {border-top:1px solid var(--app-divider);padding-top:var(--mt-ds-space-4);margin-top:var(--mt-ds-space-4);}
.certificate-file-control {display:flex;flex-wrap:wrap;align-items:center;gap:var(--mt-ds-space-2);min-width:0;max-width:100%;}
.file-name.arco-btn {max-width:100%;height:auto;min-height:var(--mt-ds-control-height);padding:0;white-space:normal;overflow-wrap:anywhere;text-align:left;font-weight:var(--mt-ds-weight-body);}
.source-references {display:grid;grid-template-columns:minmax(112px,max-content) minmax(0,1fr);align-items:baseline;gap:var(--mt-ds-space-4);margin:var(--mt-ds-space-4) 0 0;padding-top:var(--mt-ds-space-4);border-top:1px solid var(--app-divider);}
.source-reference {display:contents;}
.source-reference dt {color:var(--color-text-3);}
.source-reference dd {min-width:0;margin:0;overflow-wrap:anywhere;}
.source-reference p {margin:var(--mt-ds-space-2) 0 0;white-space:pre-wrap;}
@media(max-width:600px){.source-references {grid-template-columns:1fr;gap:var(--mt-ds-space-2);}}
@media(max-width:1000px){.execution-facts {grid-template-columns:repeat(2,minmax(0,1fr));}}
@media(max-width:600px){.execution-facts {grid-template-columns:1fr;}}
</style>

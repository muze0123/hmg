<script setup lang="ts">
import { isSuspended } from '../../../shared/taskSuspension';
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppFormLayout from '../../../design/components/AppFormLayout.vue';
import AppListToolbar from '../../../design/components/AppListToolbar.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import ApiSession from '../../../shared/components/ApiSession.vue';
import ConnectedField from '../../task-execution/components/ConnectedField.vue';
import TaskInformationSection from '../../task-execution/components/TaskInformationSection.vue';
import { ApiError,currentApiUser,request,kinds,type Kind,type TaskView,type TaskNode,type TemplateVersion } from '../../../shared/api/hmg';
import { usePendingChanges } from '../../../shared/api/usePendingChanges';
const { t }=useI18n(); const route=useRoute(); const router=useRouter();
const tasks=ref<TaskView[]>([]); const versions=ref<TemplateVersion[]>([]); const task=ref<TaskView>();
const busy=ref(false); const loading=ref(false); const failure=ref(false); const creating=ref(false);
const name=ref(''); const workflow=ref(''); const reviewer=ref(''); const vehicle=ref('');
const statusFilter=ref('');
const statusCodes=['PENDING','SUBMITTING','ACTIVE','REVIEWING','COMPLETED','REJECTED','WITHDRAWN','VOIDED','PAUSED'];
function paused(view:TaskView,node:TaskNode) { return node.level!=='MAIN' && isSuspended(node.state, !!view.task.descendantsPaused || view.task.root.state==='WITHDRAWN'); }
const nodePaused=computed(()=>!!task.value&&!!node.value&&paused(task.value,node.value));
const keyword=ref(''); const applied=ref(''); const page=ref(1); const size=ref(10);
const values=ref<Record<string,unknown>>({}); const initial=ref(''); const errors=ref<{path:string;code:string}[]>([]);
interface Config {kind:Kind;regulationId:string;templateVersionId:string;executor:string;reviewer:string}
const configs=ref<Config[]>([]);
const initialConfig=ref('');
const node=computed(()=>{
  if (!task.value) return undefined;
  function find(current:TaskNode):TaskNode|undefined { if(current.id===route.query.node)return current; for(const child of current.children){const found=find(child);if(found)return found;} }
  return find(task.value.task.root)||task.value.task.root;
});
const dirty=computed(()=>creating.value ? !!name.value||!!workflow.value||!!reviewer.value : !!node.value&&(JSON.stringify(values.value)!==initial.value || JSON.stringify({vehicle:vehicle.value,configs:configs.value})!==initialConfig.value));
const leave=usePendingChanges(dirty,busy);
const withdrawVisible=ref(false);
const confirmation=ref<'submit'|'approve'|'reject'>(); const opinion=ref('');
const scope=computed(()=>route.path.startsWith('/sections')?'SECTION':route.path.startsWith('/tasks/')?'SUBTASK':'MAIN');
const kindFilter=computed(()=>({vehicle:'VEHICLE',technical:'TECHNICAL',testing:'TESTING',reports:'REPORT',certificates:'CERTIFICATE'} as Record<string,Kind>)[route.path.split('/')[2]||'']);
const rows=computed(()=>tasks.value.flatMap(view=>{
 const nodes=scope.value==='MAIN'?[view.task.root]:scope.value==='SECTION'?view.task.root.children:view.task.root.children.flatMap(section=>section.children);
 return nodes.filter(node=>!kindFilter.value||node.kind===kindFilter.value).map(node=>({id:node.id,taskId:view.id,name:view.task.name,node,paused:paused(view,node)}));
}).filter(row=>(!statusFilter.value || (row.paused?'PAUSED':row.node.state)===statusFilter.value)&&`${row.name} ${row.id} ${row.node.regulationId||''}`.toLowerCase().includes(applied.value.toLowerCase())));
const executor=computed(()=>node.value?.executor===currentApiUser.value);
const mayFill=computed(()=>!nodePaused.value&&executor.value&&node.value?.level==='SUBTASK'&&['ACTIVE','REJECTED'].includes(node.value.state));
const mayConfigure=computed(()=>!nodePaused.value&&executor.value&&node.value?.level!=='SUBTASK'&&(node.value?.state==='PENDING'||node.value?.level==='MAIN'&&node.value?.state==='WITHDRAWN'));
const mayReview=computed(()=>!nodePaused.value&&node.value?.state==='REVIEWING'&&node.value.reviewers[node.value.reviewStep]===currentApiUser.value);
function resetNode() {
  values.value=JSON.parse(node.value?.valuesJson||'{}'); initial.value=JSON.stringify(values.value); errors.value=[];
  configs.value=node.value?.level==='MAIN'?node.value.children.map(child=>({kind:child.kind!,regulationId:child.regulationId||'',templateVersionId:child.templateVersionId||'',executor:child.executor,reviewer:child.reviewers.join(',')})):[]; vehicle.value=task.value?.task.vehicleId||''; initialConfig.value=JSON.stringify({vehicle:vehicle.value,configs:configs.value});
}
watch(node,resetNode);
let loadGeneration=0;
let loadedUser='';
async function load() {
  const generation=++loadGeneration;
  if(loadedUser!==currentApiUser.value){task.value=undefined;tasks.value=[];versions.value=[];loadedUser=currentApiUser.value;}
  loading.value=true;failure.value=false;
  try {
    const templates=(await request<TemplateVersion[]>('/template-versions')).filter(row=>row.published);
    const id=route.params.id;
    const detail=id&&id!=='new'?await request<TaskView>(`/tasks/${id}`):undefined;
    const list=detail?[]:await request<TaskView[]>('/tasks');
    if(generation!==loadGeneration)return;
    versions.value=templates;task.value=detail;tasks.value=list;creating.value=id==='new';resetNode();
  }catch{if(generation===loadGeneration){task.value=undefined;tasks.value=[];failure.value=true;}}
  finally{if(generation===loadGeneration)loading.value=false;}
}
watch([()=>route.fullPath,currentApiUser],()=>{if(currentApiUser.value)void load();},{immediate:true});
// Refresh only the inherited gate, keeping unsaved field values and node selection intact.
let checkingGate = false;
const gateTimer = window.setInterval(async () => {
  if (!task.value || !currentApiUser.value || checkingGate || busy.value) return;
  const id = task.value.id; checkingGate = true;
  try {
    const latest = await request<TaskView>(`/tasks/${id}`);
    if (task.value?.id === id) {
      task.value.task.descendantsPaused = latest.task.descendantsPaused;
      task.value.task.root.state = latest.task.root.state;
    }
  } catch { /* Existing values stay intact; the server still guards every write. */ }
  finally { checkingGate = false; }
}, 10000);
onBeforeUnmount(() => window.clearInterval(gateTimer));

function addConfig() { configs.value.push({kind:node.value?.kind||'VEHICLE',regulationId:'',templateVersionId:'',executor:currentApiUser.value,reviewer:''}); }
function candidates(config:Config) { return versions.value.filter(row=>row.schema.kind===config.kind && (node.value?.level==='MAIN'||config.kind==='VEHICLE'||row.schema.regulationId===config.regulationId)); }
async function selectNode(id:string) { if(id===node.value?.id)return;if(await leave.check()) { initial.value=JSON.stringify(values.value);initialConfig.value=JSON.stringify({vehicle:vehicle.value,configs:configs.value});await router.push({path:route.path,query:{node:id}}); } }
async function cancelCreate() { if(await leave.check()) {creating.value=false;name.value='';workflow.value='';reviewer.value='';if(route.params.id==='new')await router.push('/projects');} }
async function handle(error:unknown) {
  if(error instanceof ApiError&&error.status===422){errors.value=error.body.errors||[];await nextTick();document.querySelector<HTMLInputElement>('.field-error input,.field-error textarea')?.focus();Message.error(t('connected.invalidFields'));}
  else Message.error(t(error instanceof ApiError&&error.status===409?'connected.conflict':'connected.saveFailed'));
}
const createKey=ref(crypto.randomUUID());
async function createTask() {
  if(busy.value)return;
  if(!name.value.trim()||!workflow.value.trim()||!reviewer.value.trim()){Message.error(t('connected.required'));return;}
  busy.value=true;
  try {const result=await request<TaskView>('/tasks',{name:name.value.trim(),workflowVersion:workflow.value.trim(),reviewers:reviewer.value.split(',').map(x=>x.trim()).filter(Boolean)},'POST',{'Idempotency-Key':createKey.value});
    creating.value=false;name.value='';workflow.value='';reviewer.value='';createKey.value=crypto.randomUUID();busy.value=false;await router.push(`/projects/${result.id}`);
  }catch(error){handle(error);}finally{busy.value=false;}
}
async function configure() {
  if(busy.value||!task.value||!node.value)return;
  if(!configs.value.length||configs.value.some(row=>!row.executor.trim()||!row.reviewer.trim()||(node.value!.level==='SECTION'||row.kind==='VEHICLE')&&!row.templateVersionId)||node.value.level==='MAIN'&&!vehicle.value.trim()){Message.error(t('connected.required'));return;}
  busy.value=true;
  try {task.value=await request<TaskView>(`/tasks/${task.value.id}/nodes/${node.value.id}/configure`,{version:task.value.version,vehicleId:vehicle.value,children:configs.value.map(row=>({...row,reviewers:[row.reviewer]}))},'POST');resetNode();Message.success(t('connected.saved'));}
  catch(error){handle(error);}finally{busy.value=false;}
}
async function action(action:'save'|'submit'|'approve'|'reject'|'withdraw') {
  if(busy.value||!task.value||!node.value)return;
  if(nodePaused.value) { Message.warning(t('taskPause.disabled')); return; }
  if(action==='reject'&&!opinion.value.trim()){Message.error(t('connected.required'));return;}
  busy.value=true;errors.value=[];
  try {
    if(action==='submit'&&mayFill.value){task.value=await request<TaskView>(`/tasks/${task.value.id}/nodes/${node.value.id}/actions/save`,{version:task.value.version,values:values.value},'POST');}
    const result=await request<TaskView>(`/tasks/${task.value.id}/nodes/${node.value.id}/actions/${action}`,{version:task.value.version,values:values.value,comment:opinion.value},'POST');
    task.value=result;resetNode();withdrawVisible.value=false;confirmation.value=undefined;opinion.value='';Message.success(t('connected.saved'));
  }catch(error){handle(error);}finally{busy.value=false;}
}
function fieldErrors(id:string) { return errors.value.filter(error=>error.path===id||error.path.startsWith(id+'.')).map(error=>t(`connected.validation.${error.code}`)).join(' / '); }
</script>
<template>
<ApiSession><section class="connected-tasks">
  <a-alert v-if="failure" type="error">{{ t('connected.loadFailed') }} <a-button type="text" @click="load">{{ t('connected.retry') }}</a-button></a-alert>
  <a-spin :loading="loading" class="task-loading">
  <template v-if="!task">
    <template v-if="!creating">
      <form class="filter-panel" @submit.prevent="applied=keyword.trim();page=1"><a-select v-if="scope!=='MAIN'" v-model="statusFilter" :aria-label="t('connected.status')" :placeholder="t('sections.all')" allow-clear><a-option v-for="state in statusCodes" :key="state" :value="state">{{ state==='PAUSED'?t('taskPause.status'):t(`connected.states.${state}`) }}</a-option></a-select><div class="filter-field"><AppFieldLabel :text="t('connected.name')" for="api-task-search-input" context="filter" /><a-input id="api-task-search" :input-attrs="{id: 'api-task-search-input'}" v-model="keyword" class="app-filter-control" allow-clear /></div><a-button @click="keyword='';applied='';page=1">{{ t('connected.reset') }}</a-button><a-button type="primary" html-type="submit">{{ t('connected.search') }}</a-button></form>
      <section class="surface"><AppListToolbar :title="t('connected.tasks')"><template v-if="scope==='MAIN'" #actions><a-button type="primary" @click="creating=true">{{ t('connected.newTask') }}</a-button></template></AppListToolbar>
        <a-table :data="rows.slice((page-1)*size,page*size)" row-key="id" :pagination="false" :bordered="false" :scroll="{x:750}"><template #columns><a-table-column :title="t('connected.name')" :width="240"><template #cell="{record}">{{ record.name }}</template></a-table-column><a-table-column :title="t('connected.status')" :width="120"><template #cell="{record}">{{ record.paused ? t('taskPause.status') : t(`connected.states.${record.node.state}`) }}<small v-if="record.paused" class="pause-reason">{{ t('taskPause.reason') }}</small></template></a-table-column><a-table-column :title="t('connected.actions')" :width="180"><template #cell="{record}"><a-button type="text" @click="router.push({path:`/projects/${record.taskId}`,query:{node:record.node.id}})">{{ t('sections.view') }}</a-button></template></a-table-column></template><template #empty><a-empty :description="t('connected.empty')" /></template></a-table>
        <AppPagination v-model:current="page" v-model:page-size="size" :total="rows.length" />
      </section>
    </template>
    <section v-else class="surface"><div class="toolbar"><a-button @click="cancelCreate">{{ t('connected.back') }}</a-button><a-button type="primary" :loading="busy" @click="createTask">{{ t('connected.create') }}</a-button></div><AppFormLayout><a-form :model="{name,workflow,reviewer}" layout="vertical"><a-form-item required><template #label><AppFieldLabel :text="t('connected.name')" /></template><a-input v-model="name" :input-attrs="{'aria-label': t('connected.name')}" /></a-form-item><a-form-item required><template #label><AppFieldLabel :text="t('connected.workflow')" /></template><a-input v-model="workflow" :input-attrs="{'aria-label': t('connected.workflow')}" /></a-form-item><a-form-item required><template #label><AppFieldLabel :text="t('connected.reviewers')" /></template><a-input v-model="reviewer" :input-attrs="{'aria-label': t('connected.reviewers')}" /></a-form-item></a-form></AppFormLayout></section>
  </template>
  <section v-else-if="node" class="surface"><a-alert v-if="nodePaused" type="warning">{{ t('taskPause.notice') }} <router-link :to="`/projects/${task.id}`">{{ t('taskPause.parent') }}</router-link></a-alert>
    <div class="toolbar"><a-button :disabled="busy" @click="router.push('/projects')">{{ t('connected.back') }}</a-button><a-button :disabled="busy||dirty" @click="load">{{ t('connected.refresh') }}</a-button></div>
    <AppListToolbar :title="task.task.name" :summary="nodePaused ? t('taskPause.status') : t(`connected.states.${node.state}`)" />
    <nav class="node-navigation"><a-button :type="node.id===task.id?'primary':'secondary'" @click="selectNode(task.id)">{{ t('connected.main') }}</a-button><template v-for="section in task.task.root.children" :key="section.id"><a-button @click="selectNode(section.id)">{{ t(`connected.kinds.${section.kind}`) }}</a-button><a-button v-for="child in section.children" :key="child.id" @click="selectNode(child.id)">{{ child.regulationId||t('connected.kinds.VEHICLE') }} · {{ child.templateSnapshot?.name }}</a-button></template></nav>
    <TaskInformationSection v-if="scope==='SUBTASK'"><dl class="summary"><div><dt>{{ t('connected.executor') }}</dt><dd>{{ node.executor }}</dd></div><div><dt>{{ t('connected.reviewers') }}</dt><dd>{{ node.reviewers.join(' / ') }}</dd></div><div v-if="node.templateSnapshot"><dt>{{ t('connected.revision') }}</dt><dd>{{ node.templateSnapshot.name }} · {{ node.templateSnapshot.revision }}</dd></div></dl></TaskInformationSection>
    <dl v-else class="summary"><div><dt>{{ t('connected.executor') }}</dt><dd>{{ node.executor }}</dd></div><div><dt>{{ t('connected.reviewers') }}</dt><dd>{{ node.reviewers.join(' / ') }}</dd></div><div v-if="node.templateSnapshot"><dt>{{ t('connected.revision') }}</dt><dd>{{ node.templateSnapshot.name }} · {{ node.templateSnapshot.revision }}</dd></div></dl>
    <AppFormLayout v-if="mayConfigure"><a-form :model="{vehicle,configs}" layout="vertical"><a-form-item v-if="node.level==='MAIN'" required><template #label><AppFieldLabel :text="t('connected.vehicle')" /></template><a-input v-model="vehicle" :input-attrs="{'aria-label': t('connected.vehicle')}" /></a-form-item>
      <div v-for="(config,index) in configs" :key="index" class="configuration-row">
        <a-form-item v-if="node.level==='MAIN'" :label="t('connected.kind')"><a-select v-model="config.kind" :aria-label="t('connected.kind')" @change="config.templateVersionId=''"><a-option v-for="kind in kinds" :key="kind" :value="kind">{{ t(`connected.kinds.${kind}`) }}</a-option></a-select></a-form-item>
        <a-form-item v-if="node.level==='SECTION'&&node.kind!=='VEHICLE'" :label="t('connected.regulationId')" required><a-input v-model="config.regulationId" :input-attrs="{'aria-label': t('connected.regulationId')}" @input="config.templateVersionId=''" /></a-form-item>
        <a-form-item v-if="node.level==='SECTION'||config.kind==='VEHICLE'" :label="t('connected.templates')" required><a-select v-model="config.templateVersionId" :aria-label="t('connected.templates')"><a-option v-for="version in candidates(config).filter(row=>node!.level==='MAIN'||node!.kind!=='VEHICLE'||row.id===node!.templateVersionId)" :key="version.id" :value="version.id">{{ version.schema.name }} · {{ version.schema.revision }}</a-option></a-select></a-form-item>
        <a-form-item :label="t('connected.executor')" required><a-input v-model="config.executor" :input-attrs="{'aria-label': t('connected.executor')}" /></a-form-item><a-form-item :label="t('connected.reviewers')" required><a-input v-model="config.reviewer" :input-attrs="{'aria-label': t('connected.reviewers')}" /></a-form-item><a-button type="text" status="danger" @click="configs.splice(index,1)">{{ t('connected.remove') }}</a-button>
      </div><div class="toolbar"><a-button @click="addConfig">{{ t('connected.addTask') }}</a-button><a-button type="primary" :loading="busy" @click="configure">{{ t('connected.execute') }}</a-button></div>
    </a-form></AppFormLayout>
    <AppFormLayout v-if="node.level==='SUBTASK'&&node.templateSnapshot"><a-form :model="values" layout="vertical"><a-form-item v-for="field in node.templateSnapshot.fields" :key="field.id" :class="{'field-error':!!fieldErrors(field.id)}" :required="field.required&&mayFill" :validate-status="fieldErrors(field.id)?'error':undefined" :help="fieldErrors(field.id)"><template #label><AppFieldLabel :text="field.label" /></template><ConnectedField :field="field" v-model="values[field.id]" :disabled="!mayFill||busy" /></a-form-item></a-form></AppFormLayout>
    <div class="toolbar"><a-button v-if="executor && node.state==='REVIEWING' && !nodePaused" :disabled="busy" @click="withdrawVisible=true">{{ t('taskWithdrawal.action') }}</a-button><template v-if="mayFill"><a-button :loading="busy" @click="action('save')">{{ t('connected.save') }}</a-button><a-button type="primary" :disabled="busy" @click="confirmation='submit'">{{ t('connected.submit') }}</a-button></template><a-button v-if="executor&&node.state==='REJECTED'&&node.level!=='SUBTASK'" type="primary" @click="confirmation='submit'">{{ t('connected.submit') }}</a-button><template v-if="mayReview"><a-button status="danger" @click="confirmation='reject'">{{ t('connected.reject') }}</a-button><a-button type="primary" @click="confirmation='approve'">{{ t('connected.approve') }}</a-button></template></div>
    <template v-if="scope!=='SUBTASK' || route.params.mode!=='execute'"><h2>{{ t('connected.history') }}</h2><ol><li v-for="(event,index) in task.task.history.filter(item=>item.nodeId===node!.id)" :key="index">{{ event.time }} · {{ event.actor }} · {{ t(`connected.events.${event.action}`) }} <span v-if="event.comment">· {{ event.comment }}</span></li></ol></template>
  </section>
  </a-spin>
  <ConfirmDialog :visible="leave.visible.value" unsaved :title="t('connected.unsaved')" @update:visible="leave.finish(false)" @confirm="leave.finish(true)" />
  <ConfirmDialog plain-title v-model:visible="withdrawVisible" :title="t('taskWithdrawal.confirm')" :ok-loading="busy" @confirm="action('withdraw')" />
  <a-modal :visible="!!confirmation" :title="t('connected.confirmAction')" :mask-closable="!busy" :esc-to-close="!busy" :closable="!busy" :ok-loading="busy" :on-before-ok="async()=>{if(confirmation)await action(confirmation);return false;}" @cancel="confirmation=undefined;opinion=''"><a-form :model="{opinion}" layout="vertical"><a-form-item :label="t('connected.opinion')" :required="confirmation==='reject'"><a-textarea v-model="opinion" :aria-label="t('connected.opinion')" /></a-form-item></a-form></a-modal>
</section></ApiSession>
</template>
<style scoped>
.connected-tasks { min-width:0; }.task-loading { display:block; width:100%; }.surface,.filter-panel { min-width:0; padding:var(--mt-ds-space-4); background:var(--mt-ds-surface); margin-bottom:var(--mt-ds-space-4); }
.filter-panel,.toolbar,.node-navigation { display:flex; flex-wrap:wrap; align-items:center; gap:var(--mt-ds-space-3); }.filter-field { display:grid; grid-template-columns:max-content var(--mt-ds-filter-width); gap:var(--mt-ds-space-2); align-items:center; }.toolbar { justify-content:flex-end; margin-bottom:var(--mt-ds-space-4); }.node-navigation { margin-bottom:var(--mt-ds-space-4); }.configuration-row { border-top:1px solid var(--mt-ds-border); padding:var(--mt-ds-space-4) 0; }
.summary>div { display:flex; gap:var(--mt-ds-space-4); margin-bottom:var(--mt-ds-space-2); }dt { color:var(--mt-ds-text-muted); }dd { margin:0; overflow-wrap:anywhere; }h2 { font-size:var(--mt-ds-font-title); }li { overflow-wrap:anywhere; margin-bottom:var(--mt-ds-space-2); }:deep(th),:deep(td),:deep(.arco-btn) { font-weight:400; }:deep(.arco-table-th) { background:var(--mt-ds-surface); }
@media(max-width:600px){.filter-field{width:100%;grid-template-columns:minmax(0,1fr);}}
.node-navigation :deep(.arco-btn) { max-width:100%; height:auto; min-height:var(--mt-ds-control-height); white-space:normal; overflow-wrap:anywhere; }
.pause-reason { display:block; color:var(--color-text-3); }
</style>

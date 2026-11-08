<script setup lang="ts">
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave, onBeforeRouteUpdate } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { IconPlus, IconSearch } from '@arco-design/web-vue/es/icon';
import { projects, people, STATUS_CODES, PRIORITY_CODES, TASK_CODES, type Project } from '../data/projects';
import { useProjectLabels } from '../labels';
const { t } = useI18n(); const label = useProjectLabels(); const route=useRoute(); const router=useRouter();
const list=computed(()=>route.path==='/projects'); const creating=computed(()=>route.path==='/projects/new'); const editing=computed(()=>creating.value||route.path.endsWith('/edit'));
const fields=['id','name','brand','series','model','priority','owner','status','begin','end','actual'] as const;
const blank=():Project=>({id:`PROJ-${String(Math.max(...projects.value.map(p=>Number(p.id.split('-')[1])))+1).padStart(4,'0')}`,name:'',brand:'',series:'',model:'',priority:'normal',owner:'',status:'pending',begin:'',end:'',actual:'',tasks:[]});
const form=reactive<Project>(blank()); const baseline=ref(''); const error=ref(false); const found=ref(true);
watch(()=>route.fullPath,()=>{const record=projects.value.find(p=>p.id===route.params.id);found.value=creating.value||list.value||!!record;Object.assign(form,structuredClone(record||blank()));baseline.value=JSON.stringify(form);error.value=false;},{immediate:true});
const guard=()=>!editing.value||JSON.stringify(form)===baseline.value||requestLeave();
onBeforeRouteLeave(guard);onBeforeRouteUpdate(guard);
const draft=reactive<Record<string,string>>({});const applied=ref<Record<string,string>>({}); const page=ref(1);
const filtered=computed(()=>projects.value.filter(p=>fields.every(k=>!applied.value[k]||String(p[k]).toLowerCase().includes(applied.value[k]!.toLowerCase()))&&(!applied.value.tasks||p.tasks.some(task=>task.code===applied.value.tasks))));
const columns=computed(()=>[...fields.map(k=>({title:t(`projects.${k}`),dataIndex:k,slotName:k,width:k==='name'?180:145})),{title:t('projects.tasks'),slotName:'tasks',width:260},{title:t('projects.actions'),slotName:'actions',width:150,fixed:'right' as const}]);
function toggle(code:string,checked:boolean){form.tasks=checked?[...form.tasks,{code,target:'',executor:'',reviewer:'',template:''}]:form.tasks.filter(x=>x.code!==code);}
function save(start=false){error.value=!form.name.trim()||!form.owner||!form.begin||!form.end||form.begin>form.end||!form.tasks.length||form.tasks.some(x=>!x.executor||!x.reviewer||(x.code==='vehicle'&&!x.template)||(x.target&&(x.target<form.begin||x.target>form.end)));if(error.value)return;if(start)form.status='active';const value=structuredClone({...form,tasks:form.tasks.map(x=>({...x}))});const idx=projects.value.findIndex(p=>p.id===form.id);if(idx<0)projects.value.unshift(value);else projects.value[idx]=value;baseline.value=JSON.stringify(form);Message.success(t('projects.saved'));router.push('/projects');}
const pageSize = ref(10);
watch(filtered, () => { page.value = 1; });
const leaveVisible = ref(false);
let resolveLeave: ((allow: boolean) => void) | undefined;
function requestLeave() {
  return new Promise<boolean>(resolve => { resolveLeave = resolve; leaveVisible.value = true; });
}
function finishLeave(allow: boolean) {
  leaveVisible.value = false;
  resolveLeave?.(allow);
  resolveLeave = undefined;
}
</script>
<template>
<section class="projects-page">
<header><a-space><template v-if="!list"><a-button @click="router.push('/projects')">{{ t('projects.back') }}</a-button><a-button v-if="editing" type="primary" @click="save()">{{ t('projects.save') }}</a-button><a-button v-if="editing&&!creating&&form.status==='pending'" @click="save(true)">{{ t('projects.start') }}</a-button></template><a-button v-else type="primary" @click="router.push('/projects/new')"><template #icon><IconPlus /></template>{{ t('projects.new') }}</a-button></a-space></header>

<template v-if="list">
<a-form :model="draft" layout="inline" class="filters"><a-form-item v-for="key in fields" :key="key" :label="t(`projects.${key}`)"><a-select v-if="key==='status'||key==='priority'||key==='owner'" v-model="draft[key]" allow-clear :aria-label="t(`projects.${key}`)"><a-option v-for="v in key==='status'?STATUS_CODES:key==='priority'?PRIORITY_CODES:people" :key="v" :value="v">{{ key==='owner'?v:label(v) }}</a-option></a-select><a-date-picker v-else-if="['begin','end','actual'].includes(key)" v-model="draft[key]"/><a-input v-else v-model="draft[key]" allow-clear /></a-form-item><a-form-item :label="t('projects.tasks')"><a-select v-model="draft.tasks" allow-clear><a-option v-for="v in TASK_CODES" :key="v" :value="v">{{ label(v) }}</a-option></a-select></a-form-item></a-form>
<div class="search-actions"><a-button @click="Object.keys(draft).forEach(k=>delete draft[k]);applied={};page=1">{{ t('projects.reset') }}</a-button><a-button type="primary" @click="applied={...draft};page=1"><template #icon><IconSearch /></template>{{ t('projects.search') }}</a-button></div>
<a-table row-key="id" :columns="columns" :data="filtered.slice((page - 1) * pageSize, page * pageSize)" :scroll="{x:2050}" :pagination="false" :bordered="false" @page-change="page=$event"><template #priority="{record}"><a-tag :color="record.priority==='urgent'?'red':record.priority==='preferred'?'orange':'gray'">{{ label(record.priority) }}</a-tag></template><template #status="{record}"><a-tag :color="record.status==='completed'?'green':record.status==='rejected'?'red':record.status==='active'?'blue':'gray'">{{ label(record.status) }}</a-tag></template><template #tasks="{record}"><a-space wrap><a-tag v-for="task in record.tasks" :key="task.code">{{ label(task.code) }}</a-tag></a-space></template><template #actions="{record}"><a-space><router-link :to="`/projects/${record.id}`">{{ t('projects.view') }}</router-link><router-link :to="`/projects/${record.id}/edit`">{{ t('projects.edit') }}</router-link></a-space></template><template #empty>{{ t('projects.empty') }}</template></a-table><AppPagination v-model:current="page" v-model:page-size="pageSize" :total="filtered.length" />
</template>
<a-empty v-else-if="!found" :description="t('projects.missing')" />
<a-form v-else :model="form" layout="vertical" class="editor" :disabled="!editing">
<h2>{{ t('projects.base') }}</h2><div class="form-grid"><a-form-item v-for="key in fields.filter(k=>k!=='actual')" :key="key" :label="t(`projects.${key}`)" :required="['id','name','owner','priority','begin','end'].includes(key)"><a-select v-if="['priority','status','owner'].includes(key)" v-model="form[key]"><a-option v-for="v in key==='priority'?PRIORITY_CODES:key==='status'?STATUS_CODES:people" :key="v" :value="v">{{ key==='owner'?v:label(v) }}</a-option></a-select><a-date-picker v-else-if="key==='begin'||key==='end'" v-model="form[key]"/><a-input v-else v-model="form[key]" :disabled="key==='id'" :max-length="100" /></a-form-item></div>
<h2>{{ t('projects.content') }}</h2><div v-for="code in TASK_CODES" :key="code" class="task-row"><a-checkbox :model-value="form.tasks.some(x=>x.code===code)" @change="toggle(code,!!$event)">{{ label(code) }}</a-checkbox><template v-for="task in form.tasks.filter(x=>x.code===code)" :key="task.code"><a-form-item :label="t('projects.target')"><a-date-picker v-model="task.target" /></a-form-item><a-form-item v-for="key in (['executor','reviewer'] as const)" :key="key" :label="t(`projects.${key}`)" required><a-select v-model="task[key]"><a-option v-for="person in people" :key="person">{{ person }}</a-option></a-select></a-form-item><a-form-item v-if="code==='vehicle'" :label="t('projects.template')" required><a-select v-model="task.template"><a-option v-for="n in 7" :key="n" :value="`TPL-000${n}`">{{ `TPL-000${n}` }}</a-option></a-select></a-form-item></template></div>
<a-alert v-if="error" type="error" role="alert">{{ t('projects.required') }}</a-alert>
</a-form>
</section>
<ConfirmDialog unsaved :visible="leaveVisible" :title="t('projects.leave')" @update:visible="finishLeave(false)" @confirm="finishLeave(true)" />
</template>
<style scoped>
.projects-page{padding:24px;background:var(--color-bg-2);min-width:0}header{display:flex;justify-content:space-between;align-items:center;gap:16px}h1{margin:0;font-size:20px;color:var(--color-text-1)}h2{font-size:16px;margin:24px 0 20px}.hint{color:var(--color-text-3);margin:8px 0 24px}.filters,.form-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:0 24px}.search-actions{display:flex;justify-content:flex-end;gap:12px;margin:0 0 24px}.task-row{display:grid;grid-template-columns:160px repeat(4,minmax(0,1fr));gap:20px;align-items:center;padding:16px 0;border-top:1px solid var(--color-border-2)}.task-row :deep(.arco-form-item){margin-bottom:0}.editor{max-width:1400px}a{color:rgb(var(--primary-6))}:deep(.arco-picker){width:100%}@media(max-width:1100px){.filters,.form-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.task-row{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.projects-page{padding:16px}.filters,.form-grid,.task-row{grid-template-columns:1fr}header{align-items:flex-start;flex-wrap:wrap}}

.projects-page { padding: var(--mt-ds-space-4); background: transparent; color: var(--mt-ds-text); }
header { justify-content: flex-end; flex-wrap: wrap; }
.filters { display: flex; flex-wrap: wrap; gap: var(--mt-ds-space-4); background: var(--mt-ds-surface); padding: var(--mt-ds-space-4); margin-bottom: 0; }
.filters :deep(.arco-form-item) { display: grid; grid-template-columns: max-content var(--mt-ds-filter-width); align-items: center; gap: var(--mt-ds-space-2); width: auto; flex: 0 0 auto; margin: 0; }
.filters :deep(.arco-form-item-label-col) { padding: 0; text-align: right; }
.search-actions { padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); margin-bottom: var(--mt-ds-space-4); }
.editor { background: var(--mt-ds-surface); padding: var(--mt-ds-space-4); }
.form-grid, .task-row { display: flex; flex-direction: column; align-items: stretch; width: var(--mt-ds-form-width); max-width: 100%; gap: var(--mt-ds-space-4); }
.form-grid :deep(.arco-form-item), .task-row :deep(.arco-form-item) { margin: 0; }
.projects-page :deep(.arco-table) { background: var(--mt-ds-surface); }
.projects-page :deep(th), .projects-page :deep(td), .projects-page :deep(.arco-tag), .projects-page :deep(a) { font-weight: var(--mt-ds-weight-body); }

@media (max-width: 600px) {
 .filters { flex-direction: column; align-items: stretch; }
 .filters > *, .filters > .arco-input-wrapper, .filters > .arco-select { width: 100%; }
 .filters :deep(.arco-form-item) { grid-template-columns: minmax(0, 1fr); width: 100%; }
 .filters :deep(.arco-form-item-label-col) { text-align: left; }
}

.filters :deep(.arco-form-item-wrapper-col) { width: var(--mt-ds-filter-width); flex: none; }
.filters :deep(.arco-form-item-label-col) { flex: none; width: auto; }
.filters :deep(.arco-input-wrapper), .filters :deep(.arco-select), .filters :deep(.arco-picker) { width: 100%; }
@media (max-width: 600px) { .filters :deep(.arco-form-item-wrapper-col) { width: 100%; } }

:deep(.arco-table-th) { background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
:deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }

:deep(.arco-table .arco-space) { gap: var(--mt-ds-space-3) !important; }
:deep(.arco-table a) { text-decoration: none; }
</style>

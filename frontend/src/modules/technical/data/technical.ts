import { reactive } from 'vue';
import { projects, MOCK_CURRENT_USER, type Project, type TaskHistoryEvent } from '../../projects/data/projects';
import { TASK_STATUSES } from '../../../shared/taskLifecycle';
import { templateRecords, type TemplateRecord } from '../../templates/data/templates';
import { items } from '../../sections/data/items';
import { ensureCollaboration } from '../../vehicle/data/collaboration';
import { vehicleRecords } from '../../vehicle/data/vehicle';
import type { Vehicle } from '../../vehicle/data/vehicle';
export const STATUS_CODES = TASK_STATUSES;
export interface TechnicalTask extends Vehicle {
  regulation: string; project: string; owner: string; ready: boolean; value: string; opinion: string;
  executedAt: string; reviewedAt: string; createdAt: string; sectionItemId?: string; sectionEntryId?: string;
  referenceEntryId?: string;
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
const storageKey = 'hmg-technical-execution-v1';
const clock = () => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium'}).format(new Date());
function buildTask(id: string, parent: Project, template: TemplateRecord, status: TechnicalTask['status'], regulation: string, owner: string, reviewer: string): TechnicalTask {
  const snapshot = clone(template);
  const task: TechnicalTask = {
    id, project: parent.id, projectId: parent.id, name: parent.name, regulation, priority: parent.priority,
    status, createdAt: '2026-11-06 09:00:00', start: '2026-11-06', end: parent.deadline, actual: '',
    owner, executor: owner, reviewer, ready: true, value: '', opinion: '', executedAt: '', reviewedAt: '',
    brand: parent.brand, series: parent.series, model: parent.model,
    template: template.id, version: template.version, templateSnapshot: snapshot, sourceProject: clone(parent),
    region: template.region, country: template.country, type: template.vehicleType, note: '', attachment: '',
    entries: snapshot.entries.map(entry => ({ ...clone(entry), tag: entry.tag || '', values: [''] })),
  };
  task.referenceEntryId = task.entries.find(entry => /mass/.test(entry.id || '') || /整备质量/.test(entry.name))?.id;
  ensureCollaboration(task);
  return task;
}
const templates = templateRecords.value.filter(template => template.type === 'technical' && template.status === 'completed');
// Authored local fixtures retain existing TECH IDs and reference values used by tests/certificate modules.
export const technicalTasks = reactive<TechnicalTask[]>(Array.from({length:19}, (_, index) => {
  const parent = projects.value[index === 18 ? 3 : index % 18]!;
  const status = index === 18 ? 'active' : STATUS_CODES[index % STATUS_CODES.length]!;
  const owner = [0,1,3,5,6,13,18].includes(index) ? MOCK_CURRENT_USER.name : '张三';
  const task = buildTask(`TECH-${String(index+1).padStart(4,'0')}`,parent,templates[index % templates.length]!,status,`EU-2024-${String(index+1).padStart(3,'0')}`,owner,index === 11 ? MOCK_CURRENT_USER.name : '李四');
  task.ready = index !== 0;
  const submitted = ['reviewing','completed','rejected','withdrawn'].includes(status);
  for (const entry of task.entries) {
    if (!submitted && status !== 'active' && status !== 'submitting') continue;
    if (entry.format === 'number') entry.values = ['1800'];
    if (entry.format === 'text') entry.values = [parent.model || 'M1'];
    if (entry.format === 'table') entry.values = ['长\t4850\n宽\t1900\n高\t1680'];
    if (entry.format === 'rich') entry.values = [submitted ? '技术参数已按产品参数表核对。' : ''];
  }
  task.value = task.entries.find(entry => entry.id === task.referenceEntryId)?.values[0] || '';
  if (task.assignments) for (const group of task.assignments) {
    group.owner = group.tag === 'TAG-SALES' && status === 'active' ? '李四' : owner;
    if (status === 'active' && group.tag === 'TAG-SALES') group.status = 'submitted';
  }
  const history: TaskHistoryEvent[] = [{id:`${task.id}-create`,action:'create',actor:parent.owner,time:task.createdAt,taskCodes:['technical'],sourceId:task.id,taskName:task.name}];
  if (status !== 'pending') history.push({id:`${task.id}-draft`,action:'draft',actor:owner,time:'2026-11-07 09:00:00',taskCodes:['technical'],sourceId:task.id,taskName:task.name});
  if(submitted) {task.executedAt='2026-11-08 09:00:00';history.push({id:`${task.id}-review`,action:'review',actor:owner,time:task.executedAt,taskCodes:['technical'],sourceId:task.id,taskName:task.name,nextActor:task.reviewer});}
  if(status === 'completed' || status === 'rejected') {
    task.reviewedAt='2026-11-09 09:00:00'; task.actual=status === 'completed' ? '2026-11-09' : '';
    task.opinion=status === 'completed' ? '技术资料核对通过' : '请补充技术参数依据';
    task.reviews=[{actor:task.reviewer,opinion:task.opinion,result:status,time:task.reviewedAt}];
    history.push({id:`${task.id}-decision`,action:status === 'completed'?'approve':'reject',actor:task.reviewer,time:task.reviewedAt,taskCodes:['technical'],sourceId:task.id,taskName:task.name,comment:task.opinion});
  }
  if(status === 'withdrawn' || status === 'voided') history.push({id:`${task.id}-end`,action:status === 'withdrawn'?'withdraw':'void',actor:owner,time:'2026-11-09 09:00:00',taskCodes:['technical'],sourceId:task.id,taskName:task.name});
  task.sourceProject!.history = [...(task.sourceProject!.history || []),...history];
  return task;
}));
try {
  const stored: unknown = JSON.parse(localStorage.getItem(storageKey) || 'null');
  if(Array.isArray(stored)) for(const record of stored) {
    if(!record?.id || record.templateSnapshot?.type !== 'technical' || !Array.isArray(record.entries) || !record.sourceProject) continue;
    ensureCollaboration(record);
    const index=technicalTasks.findIndex(task=>task.id===record.id);
    if(index<0)technicalTasks.push(record);else technicalTasks[index]=record;
    const parent=projects.value.find(task=>task.id===record.project);
    if(parent) {
      const known=new Set(parent.history?.map(event=>event.id));
      parent.history=[...(parent.history || []),...(record.sourceProject.history || []).filter((event:TaskHistoryEvent)=>!known.has(event.id))].sort((a,b)=>a.time.localeCompare(b.time));
    }
  }
} catch { /* Local fixtures remain available when persistence cannot be read. */ }
export function technicalVehicleReady(task: Pick<TechnicalTask, 'project' | 'ready'>) {
  const vehicle=projects.value.find(parent=>parent.id===task.project)?.subTasks.find(child=>child.code==='vehicle');
  const executed = vehicleRecords.value.find(record=>record.projectId===task.project);
  return executed ? executed.status==='completed' : vehicle ? vehicle.status==='completed' : task.ready;
}
function writeTask(task: TechnicalTask) {
  const next=technicalTasks.some(row=>row.id===task.id)?technicalTasks.map(row=>row.id===task.id?task:row):[...technicalTasks,task];
  localStorage.setItem(storageKey,JSON.stringify(next));
  const index=technicalTasks.findIndex(row=>row.id===task.id);
  if(index<0)technicalTasks.push(task);else technicalTasks[index]=task;
}
export function syncTechnicalSections() {
  for(const section of items.filter(section=>section.type==='technical' && section.executionSubmitted)) for(const entry of section.entries || []) {
    if(technicalTasks.some(task=>task.sectionItemId===section.id && task.sectionEntryId===entry.id))continue;
    const template=templateRecords.value.find(template=>template.id===entry.template && template.type==='technical' && template.status==='completed');
    const parent=projects.value.find(parent=>parent.id===section.project);
    if(!template?.entries.length || !parent)continue;
    const child=parent.subTasks.find(child=>child.code==='technical');
    const task=buildTask(`${section.id}-${entry.id}-technical`,parent,template,entry.approval==='completed'?'completed':entry.approval==='rejected'?'rejected':'active',entry.law,child?.executor || MOCK_CURRENT_USER.name,child?.reviewer || '李四');
    task.sectionItemId=section.id;task.sectionEntryId=entry.id;task.end=section.end;
    task.createdAt=section.executedAt || parent.updatedAt;task.start=task.createdAt.slice(0,10);
    task.sourceProject!.history=[...(task.sourceProject!.history || []),{id:crypto.randomUUID(),action:'create',actor:parent.updater,time:task.createdAt,taskCodes:['technical'],sourceId:task.id,taskName:task.name}];
    if(entry.approval==='completed' || entry.approval==='rejected') {
      // These authored section fixtures already contain a recorded entry decision.
      task.executedAt=task.createdAt; task.reviewedAt=section.reviewedAt || '2026-11-10 09:00:00';
      task.actual=entry.approval==='completed'?task.reviewedAt.slice(0,10):'';
      task.opinion=entry.approval==='completed'?'技术资料核对通过':'请补充技术参数依据';
      for(const field of task.entries) field.values=[field.format==='number'?'1800':field.format==='table'?(field.columns || []).map(()=> '已核对').join('\t'):parent.model || '已核对'];
      task.value=task.entries.find(field=>field.id===task.referenceEntryId)?.values[0] || '';
      for(const group of task.assignments || []) group.status='submitted';
      task.reviews=[{actor:task.reviewer,opinion:task.opinion,result:task.status,time:task.reviewedAt}];
      task.sourceProject!.history!.push({id:crypto.randomUUID(),action:entry.approval==='completed'?'approve':'reject',actor:task.reviewer,time:task.reviewedAt,taskCodes:['technical'],sourceId:task.id,taskName:task.name,comment:task.opinion});
    }
    try{writeTask(task);}catch{technicalTasks.push(task);}
  }
}
export function saveTechnicalTask(next: TechnicalTask, action: TaskHistoryEvent['action'], comment='') {
  const parent=projects.value.find(parent=>parent.id===next.project);
  const updated=parent?clone(parent):undefined;
  if(updated) {
    const previous=[...(updated.history || [])].reverse().find(event=>event.sourceId===next.id && event.action!=='draft');
    const event:TaskHistoryEvent={id:crypto.randomUUID(),action:action==='review' && previous?.action==='reject'?'resubmit':action,actor:MOCK_CURRENT_USER.name,time:clock(),taskCodes:['technical'],sourceId:next.id,taskName:next.name,comment:comment.trim() || undefined};
    const existing=new Set(updated.history?.map(event=>event.id));
    updated.history=[...(updated.history || []),...(next.sourceProject?.history || []).filter(event=>event.sourceId===next.id && !existing.has(event.id)),event];
    updated.updater=MOCK_CURRENT_USER.name;updated.updatedAt=event.time;next.sourceProject=updated;
  }
  next.executor=next.owner;
  next.value=next.entries.find(entry=>entry.id===next.referenceEntryId)?.values[0] || '';
  writeTask(next); // Persist first; storage errors preserve the draft and all upstream records.
  if(parent && updated)Object.assign(parent,updated);
  syncTechnicalApproval(next);
}
function syncTechnicalApproval(task: TechnicalTask) {
  const section=items.find(section=>section.id===task.sectionItemId);
  const entry=section?.entries?.find(entry=>entry.id===task.sectionEntryId);
  if(!section || !entry || !section.executionSubmitted)return;
  entry.approval=task.status==='completed'?'completed':task.status==='rejected'?'rejected':'pending';
  if(section.status==='completed')return;
  const all=section.entries!.every(entry=>entry.approval==='completed');
  section.status=all?'reviewing':'active';
  const child=projects.value.find(parent=>parent.id===task.project)?.subTasks.find(child=>child.code==='technical');
  if(child)child.status=section.status;
}
for(const task of technicalTasks)syncTechnicalApproval(task);
export function withdrawTechnicalTask(id:string, perspective:'submitter'|'approver'='submitter') {
  const task=technicalTasks.find(task=>task.id===id);
  if(!task || task.status!=='reviewing' || perspective!=='submitter')return false;
  saveTechnicalTask({...clone(task),status:'withdrawn'},'withdraw');return true;
}

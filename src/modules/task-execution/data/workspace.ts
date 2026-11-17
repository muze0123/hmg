import { reactive } from 'vue';
import { projects, MOCK_CURRENT_USER, type Project, type TaskHistoryEvent } from '../../projects/data/projects';
import { templateRecords, type TemplateRecord } from '../../templates/data/templates';
import { items } from '../../sections/data/items';
import { ensureCollaboration } from '../../vehicle/data/collaboration';
import type { Vehicle } from '../../vehicle/data/vehicle';
import { technicalVehicleReady, technicalTasks } from '../../technical/data/technical';
import { testTasks } from '../../testing/data/testing';
import { reports } from '../../reports/data/reports';
import { certificates, type CertificateEntry } from '../../certificates/data/certificates';
export type ExecutionModule = 'testing' | 'reports' | 'certificates';
export interface StoredFile { name: string; size: number; type: string; data: string }
export interface CertificateFields { regulation: string; number: string; issuer: string; agency: string; issued: string; expires: string; file: StoredFile | null }
export interface ExecutionRecord extends Vehicle {
  project: string; regulation: string; owner: string; ready: boolean;
  sectionItemId?: string; sectionEntryId?: string;
  business: { summary: string; technical: string; testing: string; conclusion: string; certificates: CertificateFields[] };
}
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export const moduleCode = (module: ExecutionModule) => module === 'reports' ? 'report' : module === 'certificates' ? 'certificate' : 'testing';
const storageKey = 'hmg-execution-workspaces-v1';
const clock = () => new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Shanghai',dateStyle:'short',timeStyle:'medium'}).format(new Date());
function build(module: ExecutionModule, parent: Project, id: string, regulation: string, template: TemplateRecord): ExecutionRecord {
  const child = parent.subTasks.find(child => child.code === moduleCode(module));
  const snapshot = clone(template);
  const record: ExecutionRecord = {
    id,project:parent.id,projectId:parent.id,name:parent.name,regulation,priority:parent.priority,status:'active',
    owner:child?.executor || MOCK_CURRENT_USER.name,executor:child?.executor || MOCK_CURRENT_USER.name,reviewer:child?.reviewer || '李四',
    ready:true,start:'2026-11-01',end:parent.deadline,actual:'',createdAt:'2026-11-01 09:00:00',executedAt:'',reviewedAt:'',
    brand:parent.brand,series:parent.series,model:parent.model,template:template.id,version:template.version,templateSnapshot:snapshot,sourceProject:clone(parent),
    region:template.region,country:template.country,type:template.vehicleType,note:'',attachment:'',
    entries:snapshot.entries.map(entry => ({...clone(entry),tag:entry.tag || '__unclassified',values:['']})),
    business:{summary:'',technical:'',testing:'',conclusion:'',certificates:[]},
  };
  ensureCollaboration(record); return record;
}
export const executionRecords = reactive<Record<ExecutionModule,ExecutionRecord[]>>({testing:[],reports:[],certificates:[]});
for(const module of ['testing','reports','certificates'] as const) {
  const templates = templateRecords.value.filter(template => template.type===moduleCode(module) && template.status==='completed');
  const rows = module==='testing'?testTasks:module==='reports'?reports:certificates.value;
  rows.forEach((source,index) => {
    const parent = projects.value.find(parent=>parent.id===source.project);if(!parent || !templates.length)return;
    const record=build(module,parent,source.id,source.regulation,templates[index%templates.length]!);
    record.status=source.status;record.createdAt=source.createdAt;record.executedAt=source.executedAt;record.reviewedAt=source.reviewedAt;
    record.end=source.end || parent.deadline;record.actual=source.actual || '';record.owner=source.owner || parent.owner;record.executor=record.owner;record.reviewer=source.reviewer || '李四';
    const submitted=['reviewing','completed','rejected','withdrawn'].includes(record.status);
    if(module==='testing') {
      const original=testTasks.find(row=>row.id===source.id)!;
      record.rowIds=clone(original.models);
      record.entries.forEach((entry,index)=>{ const item=original.items[index];entry.values=original.models.map(model=>{
        const value=item?original.values[model]?.[item.id]:undefined;
        return value?entry.format==='table'?value.rows.map(row=>`${row.parameter}\t${row.result}`).join('\n'):value.text:'';
      }); });
      record.business.conclusion=submitted?'passed':'';
      record.business.technical=original.items.find(item=>item.reference)?.reference || '';
      record.reviews=original.history.map(review=>({actor:review.reviewer,result:review.result==='passed'?'completed':'rejected',opinion:review.opinion,time:review.time}));
    } else if(module==='reports') {
      const original=reports.find(row=>row.id===source.id)!;
      Object.assign(record.business,{summary:original.summary,technical:original.technical,testing:original.testing});
      record.reviews=original.history.filter(review=>['completed','rejected'].includes(review.status)).map(review=>({result:review.status,opinion:review.comment,time:review.time}));
    } else {
      const original=certificates.value.find(row=>row.id===source.id)!;
      record.business.certificates=(original.entries || [original]).map(entry=>({regulation:entry.regulation,number:entry.number,issuer:entry.issuer,agency:entry.agency,issued:entry.issued,expires:entry.expires,file:null}));
      record.reviews=(original.history || []).map(review=>({result:review.approved?'completed':'rejected',opinion:review.opinion,time:review.time}));
    }
    if(module!=='testing' && submitted) for(const entry of record.entries) entry.values=[entry.format==='table'?'适用范围\t已核对':entry.format==='number'?'1800':'已按法规要求核对'];
    for(const entry of record.entries) if(submitted && entry.partsCertificate==='yes') entry.partId='PN-DCU-A01';
    for(const group of record.assignments || []) {group.owner=record.owner;group.status=submitted?'submitted':'pending';}
    record.sourceProject!.history=[...(record.sourceProject!.history || []),{id:`${record.id}-created`,action:'create',actor:parent.owner,time:record.createdAt!,taskCodes:[moduleCode(module)],sourceId:record.id,taskName:record.name}];
    executionRecords[module].push(record);
  });
}
// Keep the original domain records (IDs and dependent reference contracts); persist workspace snapshots separately.
try {
  const stored=JSON.parse(localStorage.getItem(storageKey) || 'null');
  for(const module of ['testing','reports','certificates'] as const) if(Array.isArray(stored?.[module])) for(const record of stored[module]) {
    if(!record?.business || record.templateSnapshot?.type!==moduleCode(module) || !record.sourceProject || !Array.isArray(record.entries))continue;
    ensureCollaboration(record);const index=executionRecords[module].findIndex(row=>row.id===record.id);
    if(index<0)executionRecords[module].push(record);else executionRecords[module][index]=record;
    const parent=projects.value.find(parent=>parent.id===record.project);
    if(parent){const known=new Set(parent.history?.map(event=>event.id));parent.history=[...(parent.history || []),...(record.sourceProject.history || []).filter((event:TaskHistoryEvent)=>event.sourceId===record.id && !known.has(event.id))];}
    syncDomain(module,record);
  }
} catch { /* Authored fixtures remain usable if local persistence is unavailable. */ }
export function executionReady(record: ExecutionRecord) { return technicalVehicleReady({...record,ready:record.ready}); }
export function technicalReference(id: string) { const row=technicalTasks.find(row=>row.id===id); return row?.status==='completed'?row.value:''; }
function syncDomain(module: ExecutionModule,record: ExecutionRecord) {
  const rows=module==='testing'?testTasks:module==='reports'?reports:certificates.value;
  const row=rows.find(row=>row.id===record.id);
  if(row) Object.assign(row,{status:record.status,executedAt:record.executedAt,reviewedAt:record.reviewedAt,actual:record.actual,owner:record.owner,reviewer:record.reviewer,priority:record.priority});
  if(module==='reports') { const row=reports.find(row=>row.id===record.id);if(row)Object.assign(row,{summary:record.business.summary,technical:record.business.technical,testing:record.business.testing}); }
  if(module==='certificates') {
    const entries:CertificateEntry[]=record.business.certificates.map(entry=>{
      let file:File|null=null;
      if(entry.file){try{const binary=atob(entry.file.data.split(',')[1] || '');file=new File([Uint8Array.from(binary,char=>char.charCodeAt(0))],entry.file.name,{type:entry.file.type});}catch{/* Keep the rest of the certificate fields readable if an attachment is damaged. */}}
      return {...entry,file};
    });
    const first=entries[0];
    if(first){const fields={...first,id:record.id,project:record.project,name:record.name,regulation:entries.map(entry=>entry.regulation).join(', '),entries,status:record.status,opinion:record.reviews?.at(-1)?.opinion || '',priority:record.priority,owner:record.owner,reviewer:record.reviewer,createdAt:record.createdAt,end:record.end,actual:record.actual,executedAt:record.executedAt,reviewedAt:record.reviewedAt};const existing=certificates.value.find(row=>row.id===record.id);if(existing)Object.assign(existing,fields);else certificates.value.push(fields);}
  }
  if(module==='testing') {
    const row=testTasks.find(row=>row.id===record.id);if(row) {
      row.models=clone(record.rowIds || []);
      row.values=Object.fromEntries(row.models.map((model,index)=>[model,Object.fromEntries(row.items.filter(item=>!item.reference).map((item,itemIndex)=>{
        const entry=record.entries[itemIndex];const value=entry?.format==='ordered'?String(index+1):entry?.values[index] || '';
        return [item.id,{text:value,rows:entry?.format==='table'?value.split('\n').map(line=>{const [parameter='',result='']=line.split('\t');return {parameter,result};}):[]}];
      }))]));
    }
  }
}
export function syncExecutionSections(module: ExecutionModule) {
  const sectionType=module==='testing'?'test':moduleCode(module);
  for(const section of items.filter(section=>section.type===sectionType && section.executionSubmitted))for(const entry of section.entries || []) {
    if(executionRecords[module].some(row=>row.sectionItemId===section.id && row.sectionEntryId===entry.id))continue;
    const parent=projects.value.find(parent=>parent.id===section.project);
    const template=templateRecords.value.find(template=>template.id===entry.template && template.type===moduleCode(module) && template.status==='completed');
    if(!parent || !template)continue;
    const record=build(module,parent,`${section.id}-${entry.id}-${moduleCode(module)}`,entry.law,template);
    record.sectionItemId=section.id;record.sectionEntryId=entry.id;record.end=section.end;record.createdAt=section.executedAt || section.createdAt;
    record.sourceProject!.history=[...(record.sourceProject!.history || []),{id:`${record.id}-create`,action:'create',actor:section.creator,time:record.createdAt!,taskCodes:[moduleCode(module)],sourceId:record.id,taskName:record.name}];
    if(module==='certificates')record.business.certificates=[{regulation:entry.law,number:'',issuer:'',agency:'',issued:'',expires:'',file:null}];
    if(entry.approval==='completed' || entry.approval==='rejected') {
      // These section fixtures already declare a template-level decision; no audit opinion is inferred.
      record.status=entry.approval;record.executedAt=section.executedAt;record.reviewedAt=section.reviewedAt;
      for(const field of record.entries){field.values=[field.format==='number'?'1800':field.format==='table'?(field.columns || []).map(()=> '已核对').join('\t'):'已按法规要求核对'];if(field.partsCertificate==='yes')field.partId='PN-DCU-A01';}
      for(const group of record.assignments || [])group.status='submitted';
      if(module==='testing')record.business.conclusion='passed';
    }
    executionRecords[module].push(record);
  }
}
function syncSection(module: ExecutionModule,record: ExecutionRecord) {
  const section=items.find(section=>section.id===record.sectionItemId);const entry=section?.entries?.find(entry=>entry.id===record.sectionEntryId);
  if(section && entry) {
    entry.approval=record.status==='completed'?'completed':record.status==='rejected'?'rejected':'pending';
    if(section.status==='completed')return;
    section.status=section.entries!.every(entry=>entry.approval==='completed')?'reviewing':'active';
    const child=projects.value.find(parent=>parent.id===record.project)?.subTasks.find(child=>child.code===moduleCode(module));if(child)child.status=section.status;
  }
}
export function saveExecution(module: ExecutionModule,record: ExecutionRecord,action: TaskHistoryEvent['action'],comment='') {
  const parent=projects.value.find(parent=>parent.id===record.project);const source=clone(parent || record.sourceProject!);
  const previous=[...(record.sourceProject?.history || [])].reverse().find(event=>event.sourceId===record.id && event.action!=='draft');
  const event: TaskHistoryEvent={id:crypto.randomUUID(),action:action==='review' && previous?.action==='reject'?'resubmit':action,actor:MOCK_CURRENT_USER.name,time:clock(),taskCodes:[moduleCode(module)],sourceId:record.id,taskName:record.name,comment:comment.trim() || undefined};
  const known=new Set(source.history?.map(event=>event.id));source.history=[...(source.history || []),...(record.sourceProject?.history || []).filter(event=>event.sourceId===record.id && !known.has(event.id)),event];
  source.updater=MOCK_CURRENT_USER.name;source.updatedAt=event.time;
  record.sourceProject=source;
  const next={...executionRecords,[module]:executionRecords[module].some(row=>row.id===record.id)?executionRecords[module].map(row=>row.id===record.id?record:row):[...executionRecords[module],record]};
  localStorage.setItem(storageKey,JSON.stringify(next)); // Storage succeeds before any upstream status mutation.
  executionRecords[module]=next[module];if(parent)Object.assign(parent,source);syncDomain(module,record);syncSection(module,record);
}
export function withdrawExecution(module: ExecutionModule,id: string,perspective: 'submitter'|'approver') {
  const row=executionRecords[module].find(row=>row.id===id);if(!row || row.status!=='reviewing' || perspective!=='submitter')return false;
  saveExecution(module,{...clone(row),status:'withdrawn'},'withdraw');return true;
}
for(const module of ['testing','reports','certificates'] as const)for(const record of executionRecords[module])syncSection(module,record);

export function createCertificateDraft(projectId: string) {
  const parent=projects.value.find(project=>project.id===projectId);
  const template=templateRecords.value.find(template=>template.type==='certificate' && template.status==='completed');
  if(!parent || !template)return;
  const record=build('certificates',parent,`CERT-${crypto.randomUUID()}`,'UN R155',template);
  record.owner=MOCK_CURRENT_USER.name;record.executor=record.owner;for(const group of record.assignments || [])group.owner=record.owner;
  record.business.certificates=[...new Set(technicalTasks.filter(task=>task.project===projectId).map(task=>task.regulation))].map(regulation=>({regulation,number:'',issuer:'',agency:'',issued:'',expires:'',file:null}));
  if(!record.business.certificates.length)record.business.certificates=[{regulation:record.regulation,number:'',issuer:'',agency:'',issued:'',expires:'',file:null}];
  record.regulation=record.business.certificates.map(entry=>entry.regulation).join(', ');
  record.createdAt=clock();record.start=record.createdAt.slice(0,10);
  record.sourceProject!.history=[...(record.sourceProject!.history || []),{id:crypto.randomUUID(),action:'create',actor:record.owner,time:record.createdAt,taskCodes:['certificate'],sourceId:record.id,taskName:record.name}];return record;
}

for(const module of ['testing','reports','certificates'] as const) {
  const id=`${moduleCode(module).toUpperCase()}-EXEC-0022`;
  if(executionRecords[module].some(row=>row.id===id))continue;
  const parent=projects.value[3]!;const template=templateRecords.value.find(template=>template.type===moduleCode(module) && template.status==='completed');if(!template)continue;
  const record=build(module,parent,id,'UN R155',template);record.owner=MOCK_CURRENT_USER.name;record.executor=record.owner;
  for(const group of record.assignments || [])group.owner=record.owner;
  if(module==='testing')record.business.technical=technicalTasks.find(task=>task.project===parent.id && task.status==='completed')?.id || technicalTasks.find(task=>task.project===parent.id)?.id || '';
  if(module==='certificates')record.business.certificates=[{regulation:record.regulation,number:'',issuer:'',agency:'',issued:'',expires:'',file:null}];
  record.sourceProject!.history=[...(record.sourceProject!.history || []),{id:`${id}-create`,action:'create',actor:parent.owner,time:record.createdAt!,taskCodes:[moduleCode(module)],sourceId:id,taskName:record.name}];
  executionRecords[module].push(record);
}

export function upstreamReferences(record: ExecutionRecord) {
  const fields=record.templateSnapshot?.entries || [];
  return (['technical','testing','report'] as const).flatMap(type=>[...new Set(fields.map(entry=>entry[type]).filter((id): id is string=>!!id))].map(templateId=>{
    const template=templateRecords.value.find(template=>template.id===templateId);
    const rows=type==='technical'?technicalTasks:type==='testing'?executionRecords.testing:executionRecords.reports;
    const source=rows.find(row=>row.project===record.project && row.template===templateId && row.status==='completed');
    return {type,templateId,templateName:template?.name || templateId,taskId:source?.id || '',values:source?.entries.map(entry=>`${entry.name}: ${entry.values.join(' / ')}`).join(' · ') || ''};
  }));
}

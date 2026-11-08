export const STATUS_CODES = ['notStarted', 'inProgress', 'completed', 'overdue', 'pending', 'reviewing', 'rejected', 'paused'] as const;
export type Status = typeof STATUS_CODES[number];
export interface Metric { code: string; value: number; tone: string }
export const projects: Metric[] = [{code:'notStarted',value:2,tone:'neutral'},{code:'inProgress',value:14,tone:'primary'},{code:'completed',value:23,tone:'success'},{code:'overdue',value:2,tone:'danger'}];
export const tasks: Metric[] = STATUS_CODES.filter(c=>c!=='overdue').map((code,index)=>({code,value:1,tone:['neutral','primary','success','warning','accent','danger','neutral'][index]!}));
export const audits: Metric[] = [{code:'notStarted',value:2,tone:'neutral'},{code:'inProgress',value:3,tone:'primary'},{code:'completed',value:1,tone:'success'},{code:'rejected',value:1,tone:'danger'}];
export const materials = [{code:'technical',ready:72,pass:70},{code:'test',ready:89,pass:70},{code:'certificate',ready:30,pass:70},{code:'report',ready:12,pass:70}];
export const groups = [{code:'types',rows:[{code:'technical',value:3,tone:'primary'},{code:'report',value:2,tone:'success'},{code:'testRecord',value:1,tone:'warning'},{code:'certificate',value:1,tone:'danger'}]},{code:'priority',rows:[{code:'normal',value:3,tone:'neutral'},{code:'urgent',value:2,tone:'danger'},{code:'high',value:2,tone:'warning'}]},{code:'regions',rows:[{code:'europe',value:2,tone:'primary'},{code:'asia',value:1,tone:'success'}]}];
export interface WorkItem { id:string; projectId:string; name:string; regulation:string; status:Status; date:string }
export const workItems: WorkItem[] = ['notStarted','inProgress','notStarted','inProgress','completed','inProgress','rejected'].map((status,index)=>({id:`WI-${index+1}`,projectId:['PROJ-0001','PROJ-0001','PROJ-0012','PROJ-0012','PROJ-0012','PROJ-0014','PROJ-0003'][index]!,name:`项目${[1,1,2,2,2,3,4][index]}`,regulation:index===0?'GB-2024-001':index===1?'GB-2024-002':'EU-2024-001',status:status as Status,date:index===0?'2024-01-01':'2025-12-31'}));
export const activities = ['started','template','filled','submitted'] as const;

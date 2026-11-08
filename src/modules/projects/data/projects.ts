import { ref } from 'vue';
export const STATUS_CODES = ['pending','active','review','rejected','completed','paused'] as const;
export const PRIORITY_CODES = ['urgent','preferred','normal'] as const;
export const TASK_CODES = ['vehicle','technical','testing','certificate','report'] as const;
export const people = ['张三','李四','王五'];
export interface Task { code: string; target: string; executor: string; reviewer: string; template: string }
export interface Project { id: string; name: string; brand: string; series: string; model: string; priority: string; owner: string; status: string; begin: string; end: string; actual: string; tasks: Task[] }
export const projects = ref<Project[]>(Array.from({length:17},(_,i)=>({id:`PROJ-${String(i+1).padStart(4,'0')}`,name:`项目${i+1}`,brand:`品牌${i%2+1}`,series:`S${i%2+1}`,model:`M${i%2+1}`,priority:PRIORITY_CODES[i%3]!,owner:people[i%3]!,status:STATUS_CODES[i%6]!,begin:'2026-11-01',end:'2026-12-31',actual:i%6===4?'2026-11-06':'',tasks:TASK_CODES.slice(0,i%4+1).map(code=>({code,target:'2026-12-15',executor:'张三',reviewer:'李四',template:'TPL-0001'}))})));

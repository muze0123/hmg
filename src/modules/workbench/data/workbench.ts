import { computed } from 'vue';
import { TASK_STATUSES, type TaskStatus } from '../../../shared/taskLifecycle';
import { projects as mainTasks, projectStatus } from '../../projects/data/projects';
import { items as sections } from '../../sections/data/items';
export const STATUS_CODES = TASK_STATUSES;
export type Status = TaskStatus;
export interface Metric { code: string; value: number; tone: string }
const tones: Record<TaskStatus, string> = { pending: 'neutral', submitting: 'neutral', active: 'primary', reviewing: 'primary', completed: 'success', rejected: 'danger', withdrawn: 'neutral', voided: 'danger' };
const metrics = (statuses: TaskStatus[]): Metric[] => TASK_STATUSES.map(code => ({ code, value: statuses.filter(status => status === code).length, tone: tones[code] }));
export const projects = computed(() => metrics(mainTasks.value.map(projectStatus)));
export const tasks = computed(() => metrics(sections.map(row => row.status)));
export const audits: Metric[] = [{code:'pending',value:2,tone:'neutral'},{code:'active',value:3,tone:'primary'},{code:'completed',value:1,tone:'success'},{code:'rejected',value:1,tone:'danger'}];
export const materials = [{code:'technical',ready:72,pass:70},{code:'test',ready:89,pass:70},{code:'certificate',ready:30,pass:70},{code:'report',ready:12,pass:70}];
export const groups = [{code:'types',rows:[{code:'technical',value:3,tone:'primary'},{code:'report',value:2,tone:'success'},{code:'testRecord',value:1,tone:'warning'},{code:'certificate',value:1,tone:'danger'}]},{code:'priority',rows:[{code:'normal',value:3,tone:'neutral'},{code:'urgent',value:2,tone:'danger'},{code:'high',value:2,tone:'warning'}]},{code:'regions',rows:[{code:'europe',value:2,tone:'primary'},{code:'asia',value:1,tone:'success'}]}];
export interface WorkItem { id:string; projectId:string; name:string; regulation:string; status:Status; date:string }
export const workItems = computed<WorkItem[]>(() => sections.map(row => ({ id: row.id, projectId: row.project, name: row.name, regulation: row.law, status: row.status, date: row.end })));

/** 动态动作是系统枚举，记录只存 code，文案走 wb.<code>；内容动词走 wb.activityVerb.<code>（DESIGN.md / FRONTEND-RULES §6）。 */
export const ACTIVITY_ACTION_CODES = ['started', 'template', 'filled', 'submitted'] as const;
export type ActivityAction = typeof ACTIVITY_ACTION_CODES[number];
/** 功能模块枚举，复用各模块 i18n 标题键（与 navigation.ts 同源），避免重复录入文案。 */
export type ActivityModule = 'workbench' | 'projects' | 'sections' | 'vehicle' | 'technical' | 'testing' | 'reports' | 'certificates' | 'templates' | 'archive' | 'tags';
export const ACTIVITY_MODULE_KEYS: Record<ActivityModule, string> = {
  workbench: 'wb.title',
  projects: 'projects.title',
  sections: 'sections.title',
  vehicle: 'vehicle.title',
  technical: 'tech.title',
  testing: 'testing.title',
  reports: 'reports.title',
  certificates: 'cert.title',
  templates: 'templates.title',
  archive: 'archive.title',
  tags: 'tags.title',
};
export interface Activity {
  id: string;
  /** 功能模块（决定【XXX】第一列）。 */
  module: ActivityModule;
  /** 操作功能（第二列，系统枚举，文案走 wb.<code>）。 */
  action: ActivityAction;
  /** 操作人名称，专有名词，各语言原样显示（§112）。 */
  actor: string;
  /** 操作内容对象（ID / 业务名称等专有名词，原样显示）。 */
  target: string;
  /** 完整年月日时分秒，时间戳原样显示。 */
  time: string;
}
/** 工作台最近动态，按时间倒序；页面只展示前 10 条。
 *  结构：【功能模块】操作功能  操作内容（操作人名称 + 动作 + 内容）  时间。
 *  说明：数据来自模块内的类型化业务记录，接入动态接口时替换本数组即可。 */
export const activities: Activity[] = [
  { id: 'ACT-0010', module: 'projects', action: 'started', actor: '张三', target: 'PROJ-0001 智能网联汽车数据安全合规自评项目', time: '2026-11-12 14:22:08' },
  { id: 'ACT-0009', module: 'testing', action: 'filled', actor: '李四', target: 'TEST-0003 排放测试记录', time: '2026-11-12 11:06:42' },
  { id: 'ACT-0008', module: 'templates', action: 'template', actor: '王五', target: 'TPL-0001 车型配置模板', time: '2026-11-12 09:41:15' },
  { id: 'ACT-0007', module: 'projects', action: 'started', actor: '张三', target: 'PROJ-0012 动力电池合规项目', time: '2026-11-11 17:33:50' },
  { id: 'ACT-0006', module: 'reports', action: 'submitted', actor: '李四', target: 'RPT-0002 数据安全合规报告', time: '2026-11-11 15:18:07' },
];

import { projects, MOCK_CURRENT_USER } from '../../projects/data/projects';
import { TASK_STATUSES } from '../../../shared/taskLifecycle';
import { reactive } from 'vue';
export const REPORT_STATUSES = TASK_STATUSES;
export type ReportStatus = typeof REPORT_STATUSES[number];
export interface ReportRecord {
  priority: string; createdAt: string; executedAt: string; reviewedAt: string;
  id: string; project: string; name: string; regulation: string;
  owner: string; reviewer: string; status: ReportStatus; ready: boolean;
  summary: string; technical: string; testing: string;
  start: string; end: string; actual: string;
  history: { status: ReportStatus; comment: string; time: string }[];
}
// Session-only fixtures shared by the list and directly loaded detail routes.
export const reports = reactive<ReportRecord[]>(REPORT_STATUSES.map((status, index) => ({
  priority: ['urgent', 'high', 'normal'][index % 3]!, createdAt: '2026-11-01 09:00:00', executedAt: status === 'pending' ? '' : '2026-11-02 10:00:00', reviewedAt: status === 'completed' ? '2026-11-07 16:00:00' : '',
  id: `RPT-00${index + 1}`, project: projects.value[index % projects.value.length]!.id, name: projects.value[index % projects.value.length]!.name,
  regulation: 'UN R155', owner: '张三', reviewer: MOCK_CURRENT_USER.name, status, ready: index !== 0,
  summary: index ? 'HMG / UN R155' : '', technical: 'TD-001 · 2100 kg', testing: 'TR-001 · 2026-11-06',
  start: '2026-11-01', end: '2026-11-20', actual: status === 'completed' ? '2026-11-07' : '', history: [],
})));

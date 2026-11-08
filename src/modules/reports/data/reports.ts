import { reactive } from 'vue';
export const REPORT_STATUSES = ['pending', 'reviewing', 'completed', 'rejected'] as const;
export type ReportStatus = typeof REPORT_STATUSES[number];
export interface ReportRecord {
  id: string; project: string; name: string; regulation: string;
  owner: string; reviewer: string; status: ReportStatus; ready: boolean;
  summary: string; technical: string; testing: string;
  start: string; end: string; actual: string;
  history: { status: ReportStatus; comment: string; time: string }[];
}
// Session-only fixtures shared by the list and directly loaded detail routes.
export const reports = reactive<ReportRecord[]>(REPORT_STATUSES.map((status, index) => ({
  id: `RPT-00${index + 1}`, project: `HMG-2026-00${index + 1}`, name: `HMG P${index + 1}`,
  regulation: 'UN R155', owner: '张三', reviewer: '李四', status, ready: index !== 0,
  summary: index ? 'HMG / UN R155' : '', technical: 'TD-001 · 2100 kg', testing: 'TR-001 · 2026-11-06',
  start: '2026-11-01', end: '2026-11-20', actual: status === 'completed' ? '2026-11-07' : '', history: [],
})));

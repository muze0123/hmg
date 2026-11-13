import { projects, MOCK_CURRENT_USER } from '../../projects/data/projects';
import { TASK_STATUSES, type TaskStatus } from '../../../shared/taskLifecycle';
export const STATUS_CODES = TASK_STATUSES;
import { ref } from 'vue';
export interface CertificateEntry {
  regulation: string; number: string; issuer: string; agency: string; issued: string; expires: string; file: File | null;
}
export interface Certificate {
  name?: string; priority?: string; createdAt?: string; end?: string; actual?: string; owner?: string; reviewer?: string; executedAt?: string; reviewedAt?: string;
  entries?: CertificateEntry[];
  history?: { opinion: string; approved: boolean; time: string }[];
  id: string; project: string; regulation: string; number: string;
  issuer: string; agency: string; issued: string; expires: string;
  status: TaskStatus;
  file: File | null; opinion: string;
}
export const certificates = ref<Certificate[]>(Array.from({ length: 8 }, (_, index) => ({
  name: projects.value[index % projects.value.length]!.name, priority: ['urgent', 'high', 'normal'][index % 3], createdAt: '2026-11-01 09:00:00', end: '2026-11-30', actual: index === 4 ? '2026-11-07' : '', owner: '张三', reviewer: MOCK_CURRENT_USER.name, executedAt: index ? '2026-11-02 10:00:00' : '', reviewedAt: index === 4 ? '2026-11-07 16:00:00' : '',
  id: `CERT-${String(index + 1).padStart(4, '0')}`, project: projects.value[index % projects.value.length]!.id,
  regulation: `EU-2024-${String(index + 1).padStart(3, '0')}`, number: `CERT-2024-00${index + 1}`,
  issuer: '中汽研', agency: 'TÜV', issued: '2024-01-10', expires: '2027-01-09',
  status: STATUS_CODES[index % STATUS_CODES.length]!, file: null, opinion: '',
})));

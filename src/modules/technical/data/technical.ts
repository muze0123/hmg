import { projects, MOCK_CURRENT_USER } from '../../projects/data/projects';
import { TASK_STATUSES } from '../../../shared/taskLifecycle';
export const STATUS_CODES = TASK_STATUSES;
export interface TechnicalTask {
  id: string;
  regulation: string;
  project: string;
  name: string;
  priority: 'urgent' | 'high' | 'normal';
  status: typeof STATUS_CODES[number];
  createdAt: string;
  end: string;
  actual: string;
  owner: string;
  executedAt: string;
  reviewer: string;
  reviewedAt: string;
  ready: boolean;
  value: string;
  opinion: string;
}
// Local execution fixtures shared by the list and existing technical detail flow.
export const technicalTasks: TechnicalTask[] = Array.from({ length: 18 }, (_, index) => {
  const status = STATUS_CODES[index % STATUS_CODES.length]!;
  const project = projects.value[index % projects.value.length]!;
  return {
    id: `TECH-${String(index + 1).padStart(4, '0')}`,
    regulation: `EU-2024-${String(index + 1).padStart(3, '0')}`,
    project: project.id,
    name: project.name,
    priority: (['urgent', 'high', 'normal'] as const)[index % 3]!,
    status,
    createdAt: '2026-11-01 09:00:00',
    end: '2026-11-30',
    actual: status === 'completed' ? '2026-11-07' : '',
    owner: index % 16 === 3 ? MOCK_CURRENT_USER.name : '张三',
    executedAt: status === 'pending' ? '' : '2026-11-02 10:00:00',
    reviewer: index % 16 === 11 ? MOCK_CURRENT_USER.name : '李四',
    reviewedAt: status === 'completed' ? '2026-11-07 16:00:00' : '',
    ready: index !== 0,
    value: ['reviewing', 'completed', 'rejected'].includes(status) ? '1800' : '',
    opinion: '',
  };
});

import { ref } from 'vue';
import { type TaskStatus } from '../../../shared/taskLifecycle';
import type { Project, TaskPriority } from '../../projects/data/projects';
import type { TemplateRecord } from '../../templates/data/templates';
const PRIORITY_CODES = ['urgent', 'high', 'medium', 'low'] as const;
function normalizePriority(value: unknown): TaskPriority {
  return PRIORITY_CODES.includes(value as TaskPriority) ? value as TaskPriority : 'medium';
}
/** Local task storage until the vehicle execution API contract is available. */
export interface Entry { partId?: string; referenceTaskId?: string; number?: string; partsCertificate?: string; id?: string; note?: string; columns?: string[]; name: string; format: string; tag: string; values: string[] }
export interface FillingAssignment { tag: string; label: string; owner: string; status: 'pending' | 'filling' | 'submitted' | 'returned'; reason: string; submittedAt?: string }
export interface Vehicle { assignments?: FillingAssignment[]; rowIds?: string[]; projectId?: string; brand?: string; series?: string; model?: string; templateSnapshot?: TemplateRecord; sourceProject?: Project; createdAt?: string; executedAt?: string; reviewedAt?: string; reviews?: { actor?: string; opinion: string; result: string; time: string }[]; id: string; name: string; status: TaskStatus; priority: TaskPriority; start: string; end: string; actual: string; region: string; country: string; type: string; template: string; reviewer: string; executor: string; version: string; note: string; attachment: string; entries: Entry[] }
const STORAGE_KEY = 'hmg-vehicle-v3';
export const vehicleRecords = ref<Vehicle[]>([]);
try {
  // The old independent fixtures are intentionally reset for the linked business dataset.
  localStorage.removeItem('hmg-vehicle-v1');
  localStorage.removeItem('hmg-vehicle-v2');
  const stored: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (Array.isArray(stored)) vehicleRecords.value = stored.filter((record): record is Vehicle =>
    !!record?.projectId && !!record?.templateSnapshot && !!record?.sourceProject && Array.isArray(record?.entries)
  ).map(record => ({ ...record, priority: normalizePriority(record.priority) }));
} catch { /* Start from linked fixtures when local storage is unavailable. */ }

export function saveVehicle(record: Vehicle) {
  const exists = vehicleRecords.value.some(item => item.id === record.id);
  const next = exists ? vehicleRecords.value.map(item => item.id === record.id ? record : item) : [record, ...vehicleRecords.value];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  vehicleRecords.value = next;
}

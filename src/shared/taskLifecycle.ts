/** Canonical business lifecycle shared by main, section and execution tasks. */
export const TASK_STATUSES = ['pending', 'submitting', 'active', 'reviewing', 'completed', 'rejected', 'withdrawn', 'voided'] as const;
export type TaskStatus = typeof TASK_STATUSES[number];
export const EDITABLE_TASK_STATUSES: readonly TaskStatus[] = ['pending', 'submitting', 'active', 'rejected', 'withdrawn'];
export function isTaskStatus(value: unknown): value is TaskStatus {
  return typeof value === 'string' && (TASK_STATUSES as readonly string[]).includes(value);
}
/** Retain old locally saved records without retaining retired lifecycle codes. */
export function migrateTaskStatus(value: unknown): TaskStatus {
  if (value === 'notStarted') return 'pending';
  if (value === 'inProgress') return 'active';
  if (value === 'review') return 'reviewing';
  if (value === 'paused') return 'submitting';
  return isTaskStatus(value) ? value : 'pending';
}

export function aggregateTaskStatus(statuses: readonly TaskStatus[]): TaskStatus {
  if (!statuses.length) return 'pending';
  for (const status of ['completed', 'reviewing', 'pending', 'submitting', 'withdrawn', 'voided'] as const) {
    if (statuses.every(value => value === status)) return status;
  }
  // Individual rejections need corrective work; they do not reject the parent approval.
  return 'active';
}

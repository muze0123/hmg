import { projects } from './projects';
import { effectiveTaskStatus, isSuspended } from '../../../shared/taskSuspension';
export function mainTaskPaused(projectId: string): boolean {
  const task = projects.value.find(task => task.id === projectId);
  return !!task && (task.status === 'withdrawn' || !!task.descendantsPaused);
}
export function taskPaused(projectId: string, status: string): boolean {
  return isSuspended(status, mainTaskPaused(projectId));
}
export function displayedTaskStatus(projectId: string, status: string): string {
  return effectiveTaskStatus(status, mainTaskPaused(projectId));
}
export function requireTaskAvailable(projectId: string, status: string) {
  if (mainTaskPaused(projectId)) throw new Error('Parent task has suspended this task');
}

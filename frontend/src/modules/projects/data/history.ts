import { projects, MOCK_CURRENT_USER } from './projects';
export function recordTaskEvent(projectId: string, code: string, action: 'draft' | 'review' | 'approve' | 'reject' | 'withdraw', actor = MOCK_CURRENT_USER.name, comment = '', sourceId?: string, nextActor?: string) {
  const task = projects.value.find(item => item.id === projectId);
  if (!task) return;
  const time = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
  task.history ??= [];
  const previous = [...task.history].reverse().find(event => event.sourceId === sourceId && event.taskCodes.includes(code) && event.action !== 'draft');
  const recordedAction = action === 'review' && previous?.action === 'reject' ? 'resubmit' : action;
  task.history.push({ id: crypto.randomUUID(), action: recordedAction, actor, time, taskCodes: [code], comment: comment.trim(), sourceId, taskName: task.name, nextActor });
  task.updater = actor;
  task.updatedAt = time;
}

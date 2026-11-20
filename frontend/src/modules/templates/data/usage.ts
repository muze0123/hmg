import { projects } from '../../projects/data/projects';
import { items } from '../../sections/data/items';
import { templateRecords } from './templates';

export const USAGE_KEYS = ['templateId', 'name', 'type', 'version', 'taskId', 'user', 'used'] as const;
export type UsageKey = (typeof USAGE_KEYS)[number];

export interface TemplateUsageRecord extends Record<UsageKey, string> {
  id: string;
  taskName: string;
  section?: { id: string; law: string };
}

function snapshot(
  templateId: string,
  task: { id: string; name: string },
  id: string,
  event: { actor: string; time: string },
  section?: TemplateUsageRecord['section'],
): TemplateUsageRecord[] {
  const template = templateRecords.value.find(row => row.id === templateId);
  if (!template) return [];
  return [{
    id, templateId, name: template.name, type: template.type, version: template.version,
    taskId: task.id, taskName: task.name, user: event.actor, used: event.time, section,
  }];
}

// Seed usage snapshots from the local execution fixtures. A usage API should return
// the recorded template version and actor directly, independent of current configuration.
export const usageRecords = projects.value.flatMap(task => {
  const history = task.history ?? [];
  const mainUsages = history.flatMap(event => {
    if (event.action !== 'execute' || event.taskCodes.length) return [];
    const vehicle = event.taskConfigs?.find(config => config.code === 'vehicle' && config.template);
    return vehicle ? snapshot(vehicle.template, task, event.id, event) : [];
  });
  const sectionUsages = items.filter(item => item.project === task.id && item.executionSubmitted).flatMap(item => {
    const code = item.type === 'test' ? 'testing' : item.type;
    const execution = history.find(event => event.action === 'execute' && (event.sourceId === item.id || event.id === `${task.id}-${item.id}-execute`) && event.taskCodes.includes(code));
    if (!execution) return [];
    return (item.entries ?? []).flatMap(entry => snapshot(entry.template, task, entry.id, execution, { id: item.id, law: entry.law }));
  });
  return [...mainUsages, ...sectionUsages];
}).sort((a, b) => b.used.localeCompare(a.used));

import { projects, MOCK_CURRENT_USER, type Project, type SubTask, type TaskHistoryEvent } from '../../projects/data/projects';
import { templateRecords, type TemplateRecord } from '../../templates/data/templates';
import { items } from '../../sections/data/items';
import { saveVehicle, vehicleRecords, type Vehicle } from './vehicle';

import { ensureCollaboration } from './collaboration';

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value));
export function vehicleTemplateValid(template: TemplateRecord | undefined): template is TemplateRecord {
  return !!template && template.type === 'vehicle' && template.status === 'completed' && template.entries.length > 0
    && template.entries.every(entry => entry.name.trim() && !!entry.tag && ['number', 'ordered', 'table', 'rich', 'text'].includes(entry.format)
      && (entry.format !== 'table' || !!entry.columns?.length && entry.columns.every(column => column.trim())));
}

export function createVehicleTask(project: Project, child: SubTask, template: TemplateRecord): Vehicle {
  const snapshot = clone(template);
  const record: Vehicle = {
    id: `${project.id}-vehicle`, projectId: project.id, name: project.name, priority: project.priority,
    status: child.status, createdAt: project.createdAt, start: project.updatedAt.slice(0, 10), end: child.target,
    actual: '', brand: project.brand, series: project.series, model: project.model,
    region: snapshot.region, country: snapshot.country, type: snapshot.vehicleType,
    template: snapshot.id, version: snapshot.version, templateSnapshot: snapshot,
    executor: child.executor, reviewer: child.reviewer, note: '', attachment: '',
    sourceProject: clone(project),
    entries: snapshot.entries.map((entry, index) => ({
      id: entry.id, name: entry.name, format: entry.format, note: entry.note, tag: entry.tag || '',
      columns: entry.columns ? [...entry.columns] : undefined,
      values: [entry.format === 'ordered' ? String(index + 1) : ''],
    })),
  };
  ensureCollaboration(record);
  return record;
}

function syncVehicleSection(next: Vehicle) {
  for (const section of items.filter(section => section.project === next.projectId && section.type === 'vehicle')) {
    section.status = next.status;
    section.executedAt = next.executedAt || '';
    section.reviewedAt = next.reviewedAt || '';
    section.actual = next.actual;
  }
}

// Restore task context alongside the local filling snapshot after a direct load or refresh.
for (const record of vehicleRecords.value) {
  ensureCollaboration(record);
  if (!record.projectId || !record.sourceProject) continue;
  const index = projects.value.findIndex(project => project.id === record.projectId);
  if (index >= 0) projects.value[index] = clone(record.sourceProject);
  else projects.value.push(clone(record.sourceProject));
  syncVehicleSection(record);
}

export function syncConfiguredVehicles() {
  for (const project of projects.value) {
    const child = project.subTasks.find(task => task.code === 'vehicle');
    if (!child || vehicleRecords.value.some(record => record.projectId === project.id)) continue;
    const template = templateRecords.value.find(record => record.id === child.template && record.type === 'vehicle' && record.status === 'completed');
    if (!vehicleTemplateValid(template)) continue;
    const record = createVehicleTask(project, child, template);
    // Authored fixtures follow the same template schema; dates come from their task events.
    const events = (project.history || []).filter(event => event.taskCodes.includes('vehicle'));
    const created = events.find(event => event.action === 'create' || event.action === 'execute');
    record.createdAt = created?.time || project.createdAt;
    record.start = record.createdAt.slice(0, 10);
    const submitted = ['reviewing', 'completed', 'rejected', 'withdrawn'].includes(child.status);
    const reviewEvent = [...events].reverse().find(event => event.action === 'review');
    const decision = [...events].reverse().find(event => event.action === 'approve' || event.action === 'reject');
    record.executedAt = submitted ? reviewEvent?.time || '' : '';
    record.reviewedAt = ['completed', 'rejected'].includes(child.status) ? decision?.time || '' : '';
    record.actual = child.status === 'completed' ? record.reviewedAt.slice(0, 10) : '';
    if (decision && ['completed', 'rejected'].includes(child.status)) record.reviews = [{
      opinion: decision.comment || (child.status === 'completed' ? '车型配置核对通过' : '请核对外廓尺寸与车辆配置说明'),
      result: child.status, time: decision.time,
    }];
    for (const entry of record.entries) {
      if (!submitted && child.status !== 'active' && child.status !== 'submitting') continue;
      if (entry.format === 'text') entry.values = [entry.id?.endsWith('-market') ? template.region === 'northAmerica' ? '北美' : '国内' : project.model];
      if (!submitted && !(child.status === 'active' && entry.tag === 'TAG-PROJECT')) continue;
      if (entry.format === 'number') entry.values = [template.vehicleType === 'truck' ? '6800' : '1850'];
      if (entry.format === 'table') entry.values = [(entry.columns || []).length === 2
        ? '长\t4850\n宽\t1900\n高\t1680' : (entry.columns || []).map(() => '已核对').join('\t')];
      if (entry.format === 'rich') entry.values = [`**${project.model}** 车辆配置已按产品参数表核对。`];
    }
    if (record.assignments) for (const group of record.assignments) {
      group.owner = group.tag === 'TAG-PROJECT' ? '李四' : child.executor;
      if (child.status === 'active' && group.tag === 'TAG-PROJECT') group.status = 'submitted';
    }
    try { saveVehicle(record); } catch { vehicleRecords.value.unshift(record); }
  }
}

export function commitVehicleTask(next: Vehicle, action: TaskHistoryEvent['action'], opinion = '') {
  const parent = projects.value.find(project => project.id === next.projectId);
  if (parent) {
    const updated = clone(parent);
    const child = updated.subTasks.find(task => task.code === 'vehicle');
    if (child) child.status = next.status;
    const now = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
    updated.updater = MOCK_CURRENT_USER.name;
    updated.updatedAt = now;
    updated.history ??= [];
    updated.history.push({ id: crypto.randomUUID(), action, actor: MOCK_CURRENT_USER.name, time: now,
      taskCodes: ['vehicle'], taskName: updated.name, sourceId: next.id, comment: opinion || undefined });
    if (updated.subTasks.length && updated.subTasks.every(task => task.status === 'completed')) {
      updated.sectionApprovalReady = true;
      updated.status = 'reviewing';
    }
    next.sourceProject = updated;
  }
  // Persist before changing any related reactive state so storage failures leave all views intact.
  saveVehicle(next);
  if (parent && next.sourceProject) Object.assign(parent, clone(next.sourceProject));
  syncVehicleSection(next);
}

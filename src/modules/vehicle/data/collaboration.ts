import { tagRecords } from '../../tags/data/tags';
import type { Vehicle } from './vehicle';

/** Local collaboration contract; a server must enforce cell permissions and concurrent revisions. */
export function ensureCollaboration(task: Vehicle) {
  for (const entry of task.entries) {
    const field = task.templateSnapshot?.entries.find(field => field.id === entry.id);
    // Upgrade the authored pre-collaboration fixture metadata without discarding saved values.
    if (!entry.tag && field && /^vehicle-\d+-/.test(entry.id || '')) {
      field.tag ||= /-(model|market|sales)$/.test(entry.id!) ? 'TAG-SALES' : 'TAG-PROJECT';
    }
    entry.tag ||= field?.tag || '__unclassified';
  }
  const count = Math.max(1, ...task.entries.map(entry => entry.values.length));
  task.rowIds ??= Array.from({ length: count }, () => crypto.randomUUID());
  for (const entry of task.entries) entry.values = Array.from({ length: task.rowIds.length }, (_, index) => entry.values[index] || '');
  task.assignments ??= [...new Set(task.entries.map(entry => entry.tag))].map(tag => ({
    tag, label: tagRecords.value.find(item => item.id === tag)?.name || '', owner: tag === 'TAG-PROJECT' && /^PROJ-\d+-vehicle$/.test(task.id) ? '李四' : task.executor,
    status: ['reviewing', 'completed', 'rejected', 'withdrawn'].includes(task.status) ? 'submitted' : 'pending', reason: '',
  }));
}
export function collaborationReady(task: Vehicle) {
  return !!task.rowIds?.length && !!task.assignments?.length && task.assignments.every(group => group.owner && group.status === 'submitted');
}

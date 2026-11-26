import { configurationProgress, submittedFieldCount, sumConfigurationProgress } from '../../../shared/configurationProgress';
import { items } from '../../sections/data/items';
import { technicalTasks } from '../../technical/data/technical';
import { templateRecords } from '../../templates/data/templates';
import { vehicleRecords } from '../../vehicle/data/vehicle';
import type { Project, SubTask } from './projects';

/** Linked local execution data; a future API must supply the same field-level submission facts. */
export function subtaskConfigurationProgress(project: Project, child: SubTask) {
  if (child.code === 'vehicle') {
    const execution = vehicleRecords.value.find(row => row.projectId === project.id);
    const fields = execution?.templateSnapshot?.entries ?? templateRecords.value.find(row => row.id === child.template)?.entries ?? [];
    return configurationProgress(execution ? submittedFieldCount(execution.entries, execution.assignments, execution.status) : 0, fields.length);
  }
  const sections = items.filter(row => row.project === project.id && (row.type === 'test' ? 'testing' : row.type) === child.code);
  return sumConfigurationProgress(sections.flatMap(section => (section.entries ?? []).map(entry => {
    const execution = child.code === 'technical' ? technicalTasks.find(row => row.sectionItemId === section.id && row.sectionEntryId === entry.id) : undefined;
    const template = execution?.templateSnapshot ?? templateRecords.value.find(row => row.id === entry.template);
    const total = template?.entries.length ?? 0;
    // Configuration submission alone is not field submission. Approved regulation entries are complete.
    const completed = !section.executionSubmitted ? 0 : execution
      ? submittedFieldCount(execution.entries, execution.assignments, execution.status)
      : entry.approval === 'completed' ? total : 0;
    return configurationProgress(completed, total);
  })));
}

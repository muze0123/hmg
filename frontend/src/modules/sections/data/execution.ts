import { items, type Item, type SectionEntry } from './items';
import { MOCK_CURRENT_USER, people, projects } from '../../projects/data/projects';
import { technicalTasks } from '../../technical/data/technical';
import { testTasks } from '../../testing/data/testing';
import { reports } from '../../reports/data/reports';
import { certificates } from '../../certificates/data/certificates';

// Existing module records provide selectable regulation IDs until a regulation-library API exists.
export function regulationOptions(): string[] {
  return [...new Set([...items.map(row => row.law), ...technicalTasks.map(row => row.regulation),
    ...testTasks.map(row => row.regulation), ...reports.map(row => row.regulation),
    ...certificates.value.map(row => row.regulation)])].filter(Boolean).sort();
}
export const taskCode = (type: Item['type']) => type === 'test' ? 'testing' : type;
export function sectionPeople(item: Item) {
  const task = projects.value.find(task => task.id === item.project)?.subTasks.find(task => task.code === taskCode(item.type));
  const accounts = [MOCK_CURRENT_USER, { accountId: 'section-executor', name: people[0]! }, { accountId: 'section-reviewer', name: people[1]! }];
  const name = (id: string) => accounts.find(account => account.accountId === id)?.name ?? id;
  return { executor: task?.executor || name(item.executor), reviewer: task?.reviewer || name(item.reviewer) };
}
export function saveSectionExecution(item: Item, entries: SectionEntry[], submit: boolean) {
  if (!['pending', 'submitting', 'rejected', 'withdrawn'].includes(item.status)) return false;
  const time = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
  item.entries = entries.map(row => ({ ...row }));
  item.executionSubmitted = submit;
  item.status = submit ? 'active' : 'submitting';
  if (submit) { item.executedAt = time; item.reviewedAt = ''; }
  if (submit && !item.handledBy.includes(MOCK_CURRENT_USER.accountId)) item.handledBy.push(MOCK_CURRENT_USER.accountId);
  const parent = projects.value.find(task => task.id === item.project);
  const child = parent?.subTasks.find(task => task.code === taskCode(item.type));
  if (child) child.status = item.status;
  if (parent) {
    parent.history ??= [];
    parent.history.push({ id: crypto.randomUUID(), action: submit ? 'execute' : 'draft', actor: MOCK_CURRENT_USER.name, time, taskCodes: [taskCode(item.type)], taskName: parent.name });
    parent.updater = MOCK_CURRENT_USER.name;
    parent.updatedAt = time;
  }
  return true;
}
// Called by the template-filling approval integration, never by configuration submission.
export function updateSectionEntryApproval(itemId: string, entryId: string, approval: SectionEntry['approval']) {
  const item = items.find(row => row.id === itemId);
  const entry = item?.entries?.find(row => row.id === entryId);
  if (!item || !entry || !item.executionSubmitted || item.status !== 'active') return;
  entry.approval = approval;
  if (item.entries?.length && item.entries.every(row => row.approval === 'completed')) {
    item.status = 'reviewing';
    const child = projects.value.find(task => task.id === item.project)?.subTasks.find(task => task.code === taskCode(item.type));
    if (child) child.status = 'reviewing';
  }
}
// Section-level approvals are separate from each regulation template's approval.
export function approveSection(itemId: string) {
  const item = items.find(row => row.id === itemId);
  if (!item || item.status !== 'reviewing') return false;
  item.status = 'completed';
  item.reviewedAt = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', dateStyle: 'short', timeStyle: 'medium' }).format(new Date());
  item.actual = item.reviewedAt.slice(0, 10);
  const parent = projects.value.find(task => task.id === item.project);
  if (!parent) return true;
  const child = parent.subTasks.find(task => task.code === taskCode(item.type));
  if (child) child.status = 'completed';
  const siblings = items.filter(row => row.project === item.project);
  if (siblings.length && siblings.every(row => row.status === 'completed')) {
    parent.sectionApprovalReady = true;
    parent.status = 'reviewing';
  }
  return true;
}

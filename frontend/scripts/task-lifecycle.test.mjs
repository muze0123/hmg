import assert from 'node:assert/strict';
import test from 'node:test';
import { TASK_STATUSES, aggregateTaskStatus, migrateTaskStatus, EDITABLE_TASK_STATUSES } from '../src/shared/taskLifecycle.ts';
test('task, section and execution statuses share the approved order', () => {
  assert.deepEqual(TASK_STATUSES, ['pending', 'submitting', 'active', 'reviewing', 'completed', 'rejected', 'withdrawn', 'voided']);
});
test('legacy saved records migrate without reviving retired status codes', () => {
  assert.equal(migrateTaskStatus('review'), 'reviewing');
  assert.equal(migrateTaskStatus('inProgress'), 'active');
  assert.equal(migrateTaskStatus('notStarted'), 'pending');
  assert.equal(migrateTaskStatus('paused'), 'submitting');
  for (const status of TASK_STATUSES) assert.equal(migrateTaskStatus(status), status);
});
test('aggregation handles draft, terminal and mixed child task states', () => {
  for (const status of ['pending', 'submitting', 'reviewing', 'completed', 'withdrawn', 'voided']) assert.equal(aggregateTaskStatus([status, status]), status);
  assert.equal(aggregateTaskStatus(['rejected', 'completed']), 'active');
  assert.equal(aggregateTaskStatus(['pending', 'submitting']), 'active');
  assert.equal(aggregateTaskStatus(['pending', 'active']), 'active');
  assert.equal(aggregateTaskStatus([]), 'pending');
});
test('finished and review tasks cannot be edited', () => {
  for (const status of ['reviewing', 'completed', 'voided']) assert.equal(EDITABLE_TASK_STATUSES.includes(status), false);
  for (const status of ['submitting', 'rejected', 'withdrawn']) assert.equal(EDITABLE_TASK_STATUSES.includes(status), true);
});

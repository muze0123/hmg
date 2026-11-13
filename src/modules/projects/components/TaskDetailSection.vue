<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import { statusRole } from '../../../shared/status';
import { projectStatus, type Project, type TaskHistoryEvent } from '../data/projects';
import { useProjectLabels } from '../labels';
const props = defineProps<{ record: Project; block: 'task' | 'sections' | 'timeline' }>();
const record = computed(() => props.record);
const { t } = useI18n();
const label = useProjectLabels();
const status = computed(() => projectStatus(record.value));
// Vehicle facts remain visible after execution even if a legacy record lacks child rows.
const executed = computed(() => !['pending', 'submitting'].includes(status.value));
const completed = computed(() => record.value?.subTasks.filter(task => task.status === 'completed').length || 0);
const progress = computed(() => Math.round(completed.value / (record.value?.subTasks.length || 1) * 100));
const sourceModules: Record<string, string> = { technical: 'technical', testing: 'testing', certificate: 'certificates', report: 'reports' };
function eventSourceRoute(event: { taskCodes: string[]; sourceId?: string }) {
  const module = sourceModules[event.taskCodes[0] || ''];
  return module && event.sourceId ? `/tasks/${module}/${encodeURIComponent(event.sourceId)}/view` : '';
}
function eventDescription(event: TaskHistoryEvent) {
  const name = event.taskName || record.value?.name || '';
  let subject = event.taskCodes.length ? t('timelineContent.subject', { name, types: event.taskCodes.map(code => label(code)).join(' / ') }) : name;
  if (event.sourceId) subject = t('timelineContent.source', { subject, id: event.sourceId });
  let content = t(`timelineContent.${event.action}`, { actor: event.actor, subject });
  if (event.nextActor) {
    const actor = event.nextActor;
    if (event.action === 'create' || event.action === 'review' || event.action === 'resubmit') content += ' ' + t('timelineContent.waitReview', { actor });
    if (event.action === 'approve') content += ' ' + t('timelineContent.waitExecute', { actor });
    if (event.action === 'reject') content += ' ' + t('timelineContent.waitRevise', { actor });
  }
  return content;
}
const timeline = computed<TaskHistoryEvent[]>(() => {
  if (!record.value) return [];
  const events = record.value.history || [];
  const creation: TaskHistoryEvent = { id: 'creation', action: 'create', actor: record.value.creator, time: record.value.createdAt, taskCodes: [], taskName: record.value.name };
  return [...(events.some(event => event.action === 'create') ? [] : [creation]), ...events].sort((a,b) => a.time.localeCompare(b.time));
});
</script>
<template>
  <section v-if="block === 'task'" class="detail-panel"><h2>{{ t('taskExecution.info') }} <AppStatusTag :role="statusRole(status, 'projects')" :label="label(status)" /></h2><dl class="summary"><div v-for="key in (['id','name','priority','creator','createdAt','deadline','updater','updatedAt'] as const)" :key="key"><dt><AppFieldLabel class="app-field-label" :text="t(`projects.${key}`)" /></dt><dd>{{ key==='priority' ? label(record.priority) : record[key] || '- -' }}</dd></div><div class="description"><dt><AppFieldLabel class="app-field-label" :text="t('projects.taskCreate.description')" /></dt><dd>{{ record.description || '- -' }}</dd></div></dl></section>
  <section v-if="block === 'sections'" class="detail-panel"><h2>{{ t('executionDetail.subtaskInfo') }}</h2><dl class="summary vehicle-summary"><div v-for="key in (['brand','series','model'] as const)" :key="key"><dt><AppFieldLabel class="app-field-label" :text="t(`projects.${key}`)" /></dt><dd>{{ executed ? record[key] || '- -' : '- -' }}</dd></div></dl>
    <div v-if="!executed || !record.subTasks.length" class="empty-types"><AppFieldLabel class="app-field-label" :text="t('taskExecution.types')" /> <span>- -</span></div>
    <div v-else class="task-breakdown">
      <AppFieldLabel class="app-field-label task-type-label" :text="t('taskExecution.types')" />
      <div class="task-type-content">
        <div class="completion-overview"><span>{{ t('executionDetail.progress', { done: completed, total: record.subTasks.length }) }}</span><a-progress :percent="progress / 100" :stroke-width="12" :show-text="false" :aria-label="t('executionDetail.progress', { done: completed, total: record.subTasks.length })" /></div>
        <div class="subtask-table-scroll"><table class="subtask-table"><thead><tr><th scope="col">{{ t('taskExecution.types') }}</th><th scope="col">{{ t('taskExecution.date') }}</th><th scope="col">{{ t('projects.executor') }}</th><th scope="col">{{ t('sectionExecution.reviewer') }}</th><th scope="col">{{ t('executionTable.template') }}</th><th scope="col">{{ t('executionProgress.status') }}</th></tr></thead><tbody>
          <tr v-for="task in record.subTasks" :key="task.code"><td>{{ label(task.code) }}</td><td>{{ task.target || '- -' }}</td><td>{{ task.executor || '- -' }}</td><td>{{ task.reviewer || '- -' }}</td><td>{{ task.code === 'vehicle' ? task.template || '- -' : '- -' }}</td><td><AppStatusTag :role="statusRole(task.status, 'projects')" :label="t(`taskStatus.${task.status}`)" /></td></tr>
        </tbody></table></div>
      </div>
    </div>
  </section>
  <section v-if="block === 'timeline'" class="detail-panel"><h2>{{ t('executionDetail.timeline') }}</h2><a-timeline class="processing-timeline"><a-timeline-item v-for="event in timeline" :key="event.id"><div class="timeline-heading"><strong>{{ t(`executionDetail.events.${event.action}`) }}</strong><a-space v-if="event.taskCodes.length" wrap><a-tag v-for="code in event.taskCodes" :key="code">{{ label(code) }}</a-tag></a-space><time>{{ event.time }}</time></div><p class="event-description">{{ eventDescription(event) }}</p><p v-if="event.vehicle">{{ t('timelineContent.vehicle', { brand: event.vehicle.brand || '- -', series: event.vehicle.series || '- -', model: event.vehicle.model || '- -' }) }}</p><p v-for="config in event.taskConfigs" :key="config.code">{{ t(config.code === 'vehicle' ? 'timelineContent.config' : 'timelineContent.sectionConfig', { type: label(config.code), date: config.target || '- -', template: config.template || '- -' }) }}</p><p v-if="event.sourceId"><router-link class="event-source" v-if="eventSourceRoute(event)" :to="eventSourceRoute(event)">{{ event.sourceId }}</router-link><span v-else>{{ event.sourceId }}</span></p><p v-if="event.comment" class="event-comment">{{ t('timelineContent.opinion', { comment: event.comment }) }}</p></a-timeline-item></a-timeline></section>
</template>
<style scoped>
.detail-panel{padding:var(--mt-ds-space-4);background:var(--app-surface);min-width:0}h2{display:flex;align-items:center;gap:var(--mt-ds-space-2);margin:0 0 var(--mt-ds-space-3);padding-bottom:var(--mt-ds-space-3);border-bottom:1px solid var(--app-divider);font-size:var(--mt-ds-font-title);font-weight:var(--mt-ds-weight-title)}.summary{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:var(--mt-ds-space-4);margin:0}.summary>div{display:flex;align-items:baseline;line-height:var(--mt-ds-line-body);font-size:var(--mt-ds-font-body);gap:var(--mt-ds-space-2);min-width:0}.summary dt{flex-shrink:0}.summary dd{margin:0;overflow-wrap:anywhere}.description{grid-column:1/-1}.vehicle-summary{grid-template-columns:repeat(3,minmax(0,1fr))}.empty-types,.progress-summary{display:flex;align-items:center;flex-wrap:wrap;gap:var(--mt-ds-space-2);margin-top:var(--mt-ds-space-4)}.subtask-row{display:flex;align-items:center;flex-wrap:wrap;gap:var(--mt-ds-space-4);padding:var(--mt-ds-space-4) 0;border-bottom:1px solid var(--app-divider)}.subtask-row .summary{flex:1;grid-template-columns:repeat(2,minmax(0,1fr))}.timeline-heading{display:flex;align-items:center;flex-wrap:wrap;gap:var(--mt-ds-space-4)}time,.detail-panel p{color:var(--color-text-3)}.detail-panel .event-description{color:var(--color-text-1);line-height:var(--mt-ds-line-body);overflow-wrap:anywhere}.event-source{color:var(--app-color-primary);text-decoration:none}.event-source:hover{text-decoration:underline}.event-comment{white-space:pre-wrap;overflow-wrap:anywhere}@media(max-width:900px){.summary,.vehicle-summary{grid-template-columns:repeat(2,minmax(0,1fr))}.subtask-row .summary{flex-basis:100%}}@media(max-width:600px){.summary,.vehicle-summary,.subtask-row .summary{grid-template-columns:1fr}}


.summary dt,.summary dd{line-height:var(--mt-ds-line-body);font-size:var(--mt-ds-font-body)}
.summary dt :deep(.mt-field-label){vertical-align:baseline}
.vehicle-summary{grid-template-columns:1fr;gap:var(--mt-ds-space-3)}
.task-breakdown{display:grid;grid-template-columns:max-content minmax(0,1fr);align-items:baseline;gap:var(--mt-ds-space-2);margin-top:var(--mt-ds-space-4)}
.task-type-content{min-width:0}
.completion-overview{display:flex;align-items:center;gap:var(--mt-ds-space-6);min-height:var(--mt-ds-line-body);margin-bottom:var(--mt-ds-space-3)}
.completion-overview>span{flex-shrink:0;line-height:var(--mt-ds-line-body)}
.completion-overview :deep(.arco-progress){width:440px;max-width:60%;flex-shrink:1}
.subtask-table-scroll{overflow-x:auto}
.subtask-table{width:100%;min-width:900px;table-layout:fixed;border-collapse:collapse}
.subtask-table th,.subtask-table td{text-align:left;font-weight:var(--mt-ds-weight-body);line-height:var(--mt-ds-line-body);padding:var(--mt-ds-space-3) var(--mt-ds-space-4);border-bottom:1px solid var(--app-divider);overflow-wrap:anywhere}
.subtask-table th{background:var(--app-table-header);color:var(--color-text-1)}
@media(max-width:768px){.task-breakdown{grid-template-columns:1fr}.completion-overview{flex-wrap:wrap;gap:var(--mt-ds-space-3)}.completion-overview :deep(.arco-progress){max-width:100%;width:100%}.subtask-table{min-width:900px}}
:deep(.processing-timeline .arco-timeline-item:not(.arco-timeline-item-last)){padding-bottom:var(--mt-ds-space-6)}
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import TaskDetailSection from '../../projects/components/TaskDetailSection.vue';
import type { Project, TaskHistoryEvent } from '../../projects/data/projects';
import type { Vehicle } from '../data/vehicle';
const props = withDefaults(defineProps<{ record: Vehicle; moduleCode?: 'vehicle' | 'technical' | 'testing' | 'report' | 'certificate'; includeUnscoped?: boolean }>(), { moduleCode: 'vehicle', includeUnscoped: true });
const { t } = useI18n();
const timelineRecord = computed<Project | undefined>(() => {
  const source = props.record.sourceProject;
  if (!source) return undefined;
  // Show only events belonging to this execution task, never its parent's approval or sibling tasks.
  const events: TaskHistoryEvent[] = (source.history || []).filter(event =>
    event.sourceId ? event.sourceId === props.record.id : props.includeUnscoped && event.taskCodes.includes(props.moduleCode)
  ).map(event => ({ ...event }));
  const reviews = props.record.reviews || [];
  const consumed = new Set<number>();
  for (const event of events) {
    if (event.action !== 'approve' && event.action !== 'reject') continue;
    const result = event.action === 'approve' ? 'completed' : 'rejected';
    const index = reviews.findIndex((review, index) => !consumed.has(index) && review.result === result && review.time === event.time);
    if (index < 0) continue;
    consumed.add(index);
    event.comment ||= reviews[index]!.opinion;
  }
  // Older local records can contain a review without the corresponding parent event.
  // Preserve that real review; an unavailable historical actor stays unspecified.
  reviews.forEach((review, index) => {
    if (consumed.has(index) || !['completed', 'rejected'].includes(review.result)) return;
    events.push({ id: `${props.record.id}-review-${index}`, action: review.result === 'completed' ? 'approve' : 'reject',
      actor: review.actor || '—', time: review.time, taskCodes: [props.moduleCode], sourceId: props.record.id,
      taskName: props.record.name, comment: review.opinion });
  });
  return { ...source, id: props.record.id, name: props.record.name, history: events };
});
</script>
<template>
  <div class="vehicle-timeline" role="region" :aria-label="t('executionDetail.timeline')">
    <TaskDetailSection v-if="timelineRecord" :record="timelineRecord" block="timeline" :infer-creation="false" :show-source-reference="false" :decision-labels="{ approve: t('vehicleApproval.opinion'), reject: t('vehicleApproval.reason') }" />
    <div v-else class="timeline-empty"><h2>{{ t('executionDetail.timeline') }}</h2><a-empty /></div>
  </div>
</template>
<style scoped>
.vehicle-timeline { min-width: 0; }
.vehicle-timeline :deep(.event-comment) { overflow-wrap: anywhere; }
.timeline-empty { padding: var(--mt-ds-space-4); background: var(--app-surface); }
.timeline-empty h2 { margin: 0 0 var(--mt-ds-space-3); padding-bottom: var(--mt-ds-space-3); border-bottom: 1px solid var(--app-divider); font-size: var(--mt-ds-font-title); font-weight: var(--mt-ds-weight-title); }
</style>

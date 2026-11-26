<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import AppDetailHeader from '../../../design/components/AppDetailHeader.vue';
import AppDetailList from '../../../design/components/AppDetailList.vue';
import type { TemplateUsageRecord } from '../data/usage';

const props = defineProps<{ record?: TemplateUsageRecord }>();
const { t } = useI18n();
const templateFields = computed(() => {
  const record = props.record;
  if (!record) return [];
  return [
    { key: 'templateId', label: t('templateUsage.templateId'), value: record.templateId },
    { key: 'name', label: t('templates.name'), value: record.name },
    { key: 'type', label: t('templateUsage.type'), value: t(`templates.${record.type}`) },
    { key: 'version', label: t('templates.versionShort'), value: record.version },
    { key: 'user', label: t('templates.user'), value: record.user },
    { key: 'used', label: t('templates.used'), value: record.used },
  ];
});
const taskFields = computed(() => {
  const record = props.record;
  if (!record) return [];
  return [
    { key: 'taskId', label: t('executionList.id'), value: record.taskId },
    { key: 'taskName', label: t('executionList.name'), value: record.taskName },
    ...(record.section ? [
      { key: 'sectionId', label: t('templateUsage.sectionId'), value: record.section.id },
      { key: 'law', label: t('sections.law'), value: record.section.law },
    ] : []),
  ];
});
</script>

<template>
  <AppDetailHeader
    ancestor-to="/templates/usage"
    :ancestor-label="t('templates.usage')"
    :current-label="t('templateUsage.detail')"
  />
  <template v-if="record">
    <section class="usage-block">
      <h2>{{ t('templateUsage.templateInfo') }}</h2>
      <AppDetailList :fields="templateFields" />
    </section>
    <section class="usage-block">
      <header class="task-header">
        <h2>{{ t('templateUsage.taskInfo') }}</h2>
        <div class="task-links">
          <RouterLink :to="`/projects/${record.taskId}`">{{ t('templateUsage.openTask') }}</RouterLink>
          <RouterLink v-if="record.section" :to="`/sections/${record.section.id}`">{{ t('templateUsage.openSection') }}</RouterLink>
        </div>
      </header>
      <AppDetailList :fields="taskFields" />
    </section>
  </template>
  <section v-else class="usage-block">
    <a-empty :description="t('templateUsage.missing')" />
  </section>
</template>

<style scoped>
.usage-block { min-width: 0; padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); border-radius: var(--mt-ds-control-radius); }
.usage-block > h2, .task-header { margin: 0 0 var(--mt-ds-space-3); padding-bottom: var(--mt-ds-space-3); border-bottom: 1px solid var(--app-divider); }
h2 { margin: 0; font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
.task-header, .task-links { display: flex; align-items: center; flex-wrap: wrap; gap: var(--mt-ds-space-3); }
.task-header { justify-content: space-between; }
.task-links a { color: var(--app-color-primary); text-decoration: none; }
.task-links a:focus-visible { outline: 2px solid var(--app-accent); outline-offset: 2px; }
</style>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppDetailHeader from '../../../design/components/AppDetailHeader.vue';
import TaskDetailSection from '../../projects/components/TaskDetailSection.vue';
import { projects } from '../../projects/data/projects';
import { items } from '../data/items';
import { templateRecords } from '../../templates/data/templates';
const route = useRoute();
const { t } = useI18n();
const item = computed(() => items.find(row => row.id === String(route.params.id)));
const parent = computed(() => projects.value.find(row => row.id === item.value?.project));
const entries = computed(() => item.value?.entries ?? []);
const templateLabel = computed(() => item.value ? t(`sectionExecution.templates.${item.value.type}`) : '');
function templateName(id: string) {
  const template = templateRecords.value.find(row => row.id === id);
  return template ? `${template.name} · ${template.version}` : id || '—';
}
</script>

<template>
  <main class="section-detail">
    <AppDetailHeader
      ancestor-to="/sections"
      :ancestor-label="t('sections.title')"
      :current-label="t('sections.detail')"
      :nav-aria-label="t('sections.detailBreadcrumb')"
    />
    <template v-if="item && parent">
      <TaskDetailSection :record="parent" block="task" />
      <TaskDetailSection :record="parent" block="sections" />
      <section class="detail-block" :aria-label="t('sectionExecution.info')">
        <h2>{{ t('sectionExecution.info') }}</h2>
        <div class="table-scroll">
          <table class="readonly-table">
            <thead><tr><th scope="col">{{ t('sections.law') }}</th><th scope="col">{{ templateLabel }}</th><th v-if="item.type === 'technical'" scope="col">{{ t('sectionExecution.externalReview') }}</th></tr></thead>
            <tbody><tr v-for="entry in entries" :key="entry.id"><td>{{ entry.law || '—' }}</td><td>{{ templateName(entry.template) }}</td><td v-if="item.type === 'technical'">{{ entry.externalReview === undefined ? '—' : entry.externalReview ? t('sections.yes') : t('sections.no') }}</td></tr></tbody>
          </table>
          <a-empty v-if="!entries.length" :description="t('sectionDetail.noExecution')" />
        </div>
      </section>
      <TaskDetailSection :record="parent" block="timeline" />
    </template>
    <section v-else class="detail-block"><a-empty :description="t('sections.missing')" /></section>
  </main>
</template>

<style scoped>
.section-detail { display: flex; flex-direction: column; gap: var(--mt-ds-space-3); min-width: 0; color: var(--mt-ds-text); }
.section-detail :deep(.detail-ancestor:hover) { background: transparent; }
.detail-block { padding: var(--mt-ds-space-4); border-radius: var(--mt-ds-control-radius); background: var(--app-surface); min-width: 0; }
h2 { margin: 0 0 var(--mt-ds-space-3); padding-bottom: var(--mt-ds-space-3); border-bottom: 1px solid var(--app-divider); font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
.table-scroll { min-width: 0; overflow-x: auto; }
.readonly-table { width: 100%; min-width: 600px; border-collapse: separate; border-spacing: 0; font-size: var(--mt-ds-font-body); line-height: var(--mt-ds-line-body); }
.readonly-table tr { height: 50px; }
.readonly-table th { height: 50px; background: var(--app-table-header); }
.readonly-table td { height: 50px; }
.readonly-table th,.readonly-table td { padding: var(--mt-ds-space-3); border-bottom: 1px solid var(--app-divider); color: var(--color-text-1); font-weight: var(--mt-ds-weight-body); text-align: left; overflow-wrap: anywhere; }
</style>

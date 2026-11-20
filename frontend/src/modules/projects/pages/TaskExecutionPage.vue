<script setup lang="ts">
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IconLeft } from '@arco-design/web-vue/es/icon';
import { projects, projectStatus } from '../data/projects';
import TaskDetailSection from '../components/TaskDetailSection.vue';
import TaskExecutionDrawer from '../components/TaskExecutionDrawer.vue';
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const record = computed(() => projects.value.find(item => item.id === route.params.id));
const drawerOpen = ref(route.path.endsWith('/execute'));
const status = computed(() => record.value ? projectStatus(record.value) : 'pending');
</script>
<template>
<main v-if="record" class="task-detail">
  <header class="detail-toolbar"><nav class="detail-crumb" :aria-label="t('taskExecution.title')"><router-link to="/projects"><IconLeft />{{ t('projects.title') }}</router-link><span>/</span><strong aria-current="page">{{ t('taskExecution.title') }}</strong></nav><a-space v-if="status === 'pending'"><a-button @click="router.push('/projects')">{{ t('taskExecution.cancel') }}</a-button><a-button type="primary" @click="drawerOpen=true">{{ t('projects.execute') }}</a-button></a-space></header>
  <TaskDetailSection v-for="block in (['task', 'sections', 'timeline'] as const)" :key="block" :record="record" :block="block" />
  <TaskExecutionDrawer v-if="drawerOpen" v-model:visible="drawerOpen" :task-id="record.id" />
</main>
<a-empty v-else :description="t('projects.missing')" />
</template>
<style scoped>

.task-detail{display:flex;flex-direction:column;gap:var(--mt-ds-space-3);min-width:0}.detail-toolbar{display:flex;align-items:center;justify-content:space-between;gap:var(--mt-ds-space-4);background:var(--app-surface);padding:var(--mt-ds-space-4);flex-wrap:wrap}.detail-crumb{display:flex;align-items:center;gap:var(--mt-ds-space-2);font-size:var(--mt-ds-font-body)}.detail-crumb a{display:flex;align-items:center;gap:var(--mt-ds-space-2);color:var(--color-text-3);text-decoration:none}.detail-crumb a:hover,.detail-crumb a:focus-visible{color:rgb(var(--primary-6))}.detail-crumb>span{color:var(--color-text-3)}.detail-crumb strong{font-weight:600;color:var(--color-text-1)}
</style>

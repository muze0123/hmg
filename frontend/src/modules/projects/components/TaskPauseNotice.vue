<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { taskPaused } from '../data/suspension';
defineProps<{ project: string; status: string }>();
const { t } = useI18n();
</script>
<template>
  <a-alert v-if="taskPaused(project, status)" type="warning" role="status">
    {{ t('taskPause.notice') }} <router-link :to="`/projects/${project}`">{{ t('taskPause.parent') }}</router-link>
  </a-alert>
</template>

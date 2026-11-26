<script setup lang="ts">
import { ref, useId, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { IconDown, IconUp } from '@arco-design/web-vue/es/icon';
const { t } = useI18n();
const route = useRoute();
const expanded = ref(false);
const id = useId();
watch(() => route.fullPath, () => { expanded.value = false; });
</script>
<template>
  <section class="task-information" :aria-labelledby="`${id}-heading`">
    <header class="task-information-header" :class="{ 'is-expanded': expanded }">
      <h2 :id="`${id}-heading`">{{ t('executionWorkspace.info') }}</h2>
      <a-button type="text" class="task-information-toggle" :aria-expanded="expanded" :aria-controls="`${id}-content`" @click="expanded = !expanded"><span>{{ t(expanded ? 'vehicleFill.collapse' : 'vehicleFill.expand') }}</span><IconUp v-if="expanded" aria-hidden="true" /><IconDown v-else aria-hidden="true" /></a-button>
    </header>
    <div v-show="expanded" :id="`${id}-content`" class="task-information-content"><slot /></div>
  </section>
</template>
<style scoped>
.task-information { min-width: 0; padding: var(--mt-ds-space-4); background: var(--app-surface); }
.task-information-header { display: flex; align-items: center; justify-content: space-between; gap: var(--mt-ds-space-4); }
.task-information-header.is-expanded { margin-bottom: var(--mt-ds-space-4); padding-bottom: var(--mt-ds-space-3); border-bottom: 1px solid var(--app-divider); }
h2 { margin: 0; font-size: var(--mt-ds-font-title); font-weight: var(--mt-ds-weight-title); line-height: var(--mt-ds-line-title); }
.task-information-toggle { flex-shrink: 0; display: inline-flex; align-items: center; gap: var(--mt-ds-space-1); }
.task-information-content { min-width: 0; }
</style>

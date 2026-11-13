<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from 'vue-i18n';

interface NoticeRecord {
  id: string;
  type: "system" | "overdue" | "alert";
  source: string;
  time: string;
}

const notices: NoticeRecord[] = [
  { id: "N-001", type: "system", source: "System", time: "2025/10/12 12:00:00" },
  { id: "N-002", type: "overdue", source: "System", time: "2025/10/12 12:00:00" },
  { id: "N-003", type: "alert", source: "System", time: "2025/10/12 12:00:00" },
];

const { t } = useI18n({ useScope: 'global' });
const filter = ref("all");
const filteredNotices = computed(() =>
  filter.value === "all"
    ? notices
    : notices.filter((item) => item.type === filter.value)
);
</script>

<template>
  <main class="message-center">
    <div class="message-content">
      <header class="message-header">
        <div>
          <router-link to="/audit">HMG</router-link>
        </div>
        <a-select
          v-model="filter"
          class="message-filter"
          :aria-label="t('messageCenter.filter')"
          ><a-option value="all">{{ t('messageCenter.all') }}</a-option
          ><a-option value="system">{{ t('overview.notices.system.title') }}</a-option
          ><a-option value="overdue">{{ t('overview.notices.overdue.title') }}</a-option
          ><a-option value="alert">{{ t('overview.notices.alert.title') }}</a-option></a-select
        >
      </header>
      <div class="message-list">
        <article
          v-for="notice in filteredNotices"
          :key="notice.id"
          class="message-item"
        >
          <div>
            <h2>{{ t(`overview.notices.${notice.type}.title`) }}</h2>
            <p>{{ t(`overview.notices.${notice.type}.description`) }}</p>
            <span>{{ notice.source }}</span>
          </div>
          <time>{{ notice.time }}</time>
        </article>
      </div>
      <a-empty
        v-if="!filteredNotices.length"
        :description="t('messageCenter.empty')"
      />
    </div>
  </main>
</template>

<style scoped>
.message-center {
  min-height: calc(100dvh - 88px);
  padding: 0;
  background: var(--app-fill-1);
}
.message-content {
  min-width: 0;
}
.message-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--mt-ds-space-4);
  margin-bottom: var(--mt-ds-space-3);
}
.message-header a {
  color: var(--app-accent);
  font-size: 14px;
}
.message-filter {
  width: var(--mt-ds-filter-width);
}
.message-list {
  background: var(--app-surface);
}
.message-item {
  display: flex;
  justify-content: space-between;
  gap: var(--mt-ds-space-4);
  padding: var(--mt-ds-space-4);
  border-bottom: 1px solid var(--app-divider);
}
.message-item h2 {
  margin: 0;
  font-size: var(--mt-ds-font-body);
  font-weight: var(--mt-ds-weight-body);
  line-height: 24px;
}
.message-item p {
  margin: 8px 0;
  color: var(--color-text-2);
}
.message-item span,
.message-item time {
  color: var(--color-text-3);
  font-size: 12px;
}
@media (max-width: 600px) {
  .message-header {
    align-items: stretch;
    flex-direction: column;
  }
  .message-item {
    flex-direction: column;
    gap: 4px;
  }
}
</style>

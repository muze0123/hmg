<script setup lang="ts">
import ExecutionTaskList from "../../task-execution/components/ExecutionTaskList.vue";
import { recordTaskEvent } from '../../projects/data/history';
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import { Message } from '@arco-design/web-vue';
import { certificates, type Certificate, type CertificateEntry } from '../data/certificates';
import { projects } from '../../projects/data/projects';
import { technicalTasks } from '../../technical/data/technical';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const base = '/tasks/certificates';
const current = computed(() => certificates.value.find(row => row.id === route.params.id));
const editing = computed(() => route.params.id === 'new' || (route.params.mode === 'edit' && !!current.value && ['pending', 'submitting', 'rejected', 'withdrawn'].includes(current.value.status)));
const entries = ref<CertificateEntry[]>([]);
const reviewing = computed(() => route.params.mode === 'review' && current.value?.status === 'reviewing');
const draft = ref<Certificate>();
const snapshot = ref('');
const opinion = ref('');
const initialOpinion = ref('');
const confirmation = ref(false);
const action = ref<() => void>(() => {});
const confirmTitle = ref('');
const unsavedConfirmation = ref(false);
const busy = ref(false);
const selectedProject = computed(() => projects.value.find(row => row.id === draft.value?.project));
watch(() => route.fullPath, () => {
  draft.value = current.value ? { ...current.value } : route.params.id === 'new' ? { id: `CERT-${Date.now()}`, project: '', regulation: '', number: '', issuer: '', agency: '', issued: '', expires: '', status: 'pending', file: null, opinion: '' } : undefined;
  entries.value = draft.value ? (draft.value.entries || (route.params.id === 'new' ? [] : [draft.value])).map(entry => ({ regulation: entry.regulation, number: entry.number, issuer: entry.issuer, agency: entry.agency, issued: entry.issued, expires: entry.expires, file: entry.file })) : [];
  snapshot.value = draftState();
  opinion.value = '';
  initialOpinion.value = '';
}, { immediate: true });
function draftState() { return JSON.stringify({ draft: draft.value, entries: entries.value.map(entry => ({ ...entry, file: entry.file ? [entry.file.name, entry.file.size, entry.file.lastModified] : null })) }); }
const dirty = computed(() => draftState() !== snapshot.value || opinion.value !== initialOpinion.value);
function ask(title: string, callback: () => void, unsaved = false) {
  unsavedConfirmation.value = unsaved;
  confirmTitle.value = title;
  action.value = callback;
  confirmation.value = true;
}
function guard() {
  if (!dirty.value) return true;
  return new Promise<boolean>(resolve => {
    ask(t('cert.leave'), () => resolve(true), true);
    const stop = watch(confirmation, value => { if (!value) { resolve(false); stop(); } });
  });
}
onBeforeRouteLeave(guard);
onBeforeRouteUpdate(guard);
function selectProject() {
  if (!draft.value) return;
  entries.value = [...new Set(technicalTasks.filter(row => row.project === draft.value?.project).map(row => row.regulation))].map(regulation => ({ regulation, number: '', issuer: '', agency: '', issued: '', expires: '', file: null }));
  draft.value.regulation = entries.value.map(entry => entry.regulation).join(', ');
}
function upload(event: Event, entry: CertificateEntry) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file || !draft.value) return;
  if (!file.name.toLowerCase().endsWith('.pdf') || file.size > 20 * 1024 * 1024) { Message.error(t('cert.fileError')); return; }
  entry.file = file;
}
function save(submit = false) {
  const row = draft.value;
  if (!row || busy.value) return;
  if (!editing.value) return;
  const invalid = entries.value.findIndex(entry => (submit && (!entry.number.trim() || !entry.issuer.trim() || !entry.agency.trim() || !entry.issued || !entry.file)) || !!(entry.expires && entry.expires < entry.issued));
  if (!row.project || !entries.value.length || invalid >= 0) {
    Message.error(t('cert.reviewRequired'));
    document.querySelectorAll<HTMLElement>('.certificate-entry')[Math.max(0, invalid)]?.querySelector<HTMLElement>('input')?.focus();
    return;
  }
  Object.assign(row, entries.value[0]);
  row.regulation = entries.value.map(entry => entry.regulation).join(', ');
  row.entries = entries.value.map(entry => ({ ...entry }));
  busy.value = true;
  recordTaskEvent(row.project, 'certificate', submit ? 'review' : 'draft', undefined, '', row.id);
  row.status = submit ? 'reviewing' : 'submitting';
  if (submit) { row.executedAt = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }); row.reviewedAt = ''; }
  const index = certificates.value.findIndex(item => item.id === row.id);
  if (index < 0) certificates.value.push({ ...row });
  else certificates.value[index] = { ...row };
  snapshot.value = draftState();
  busy.value = false;
  Message.success(t('cert.saved'));
  router.push(base);
}
function review(approved: boolean) {
  if (!current.value || !reviewing.value || !opinion.value.trim()) { Message.error(t('cert.reviewRequired')); return; }
  recordTaskEvent(current.value.project, 'certificate', approved ? 'approve' : 'reject', undefined, opinion.value, current.value.id);
  current.value.status = approved ? 'completed' : 'rejected';
  current.value.reviewedAt = new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' });
  current.value.actual = approved ? current.value.reviewedAt.slice(0, 10) : '';
  current.value.opinion = opinion.value.trim();
  current.value.history = [...(current.value.history || []), { opinion: opinion.value.trim(), approved, time: new Date().toISOString() }];
  initialOpinion.value = opinion.value;
  Message.success(t('cert.saved'));
  router.push(base);
}
function remove() {
  ask(t('cert.deleteConfirm'), () => {
    certificates.value = certificates.value.filter(row => row.id !== current.value?.id);
    snapshot.value = draftState();
    router.push(base);
  });
}
function download(entry: CertificateEntry) {
  if (!entry.file) { Message.info(t('cert.unavailable')); return; }
  const url = URL.createObjectURL(entry.file);
  const anchor = document.createElement('a');
  anchor.href = url; anchor.download = entry.file.name; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
</script>

<template>
  <main class="cert-page">
    
    <ExecutionTaskList v-if="!route.params.id" module="certificates" :rows="certificates" />
    <section v-else class="content editor">
      <a-button @click="router.push(base)">{{ t('projects.back') }}</a-button>
      <template v-if="draft">
        <h2>{{ t('projects.base') }}</h2>
        <a-select v-if="editing" v-model="draft.project" :aria-label="t('cert.project')" :placeholder="t('cert.project')" @change="selectProject">
          <a-option v-for="project in projects" :key="project.id" :value="project.id">{{ project.id }} · {{ project.name }}</a-option>
        </a-select>
        <a-descriptions v-if="selectedProject" :column="{ xs: 1, sm: 2, lg: 3 }">
          <a-descriptions-item v-for="key in ['id','name','brand','series','model','owner','createdAt','deadline'] as const" :key="key" :label="t('projects.' + key)">{{ selectedProject[key] }}</a-descriptions-item>
        </a-descriptions>
        <h2>{{ t('cert.regulations') }}</h2>
        <a-empty v-if="!entries.length" :description="t('cert.project')" />
        <a-form v-for="(entry, index) in entries" :key="entry.regulation" class="certificate-entry" :model="entry" layout="vertical">
          <a-form-item :label="t('wb.regulation')">{{ entry.regulation || '—' }}</a-form-item>
          <a-form-item v-for="key in ['number','issuer','agency','issued','expires'] as const" :key="key" :required="editing && key !== 'expires'">
            <template #label><AppFieldLabel :text="t('cert.' + key)" /></template>
            <a-date-picker v-if="editing && (key === 'issued' || key === 'expires')" v-model="entry[key]" :aria-label="`${t('cert.' + key)} ${index + 1}`" />
            <a-input v-else-if="editing" v-model="entry[key]" :input-attrs="{ 'aria-label': `${t('cert.' + key)} ${index + 1}` }" />
            <span v-else>{{ entry[key] || '—' }}</span>
          </a-form-item>
          <a-form-item :label="t('cert.file')"><input v-if="editing" type="file" accept=".pdf" :aria-label="t('cert.upload')" @change="upload($event, entry)"><a-button v-else @click="download(entry)">{{ entry.file?.name || t('cert.unavailable') }}</a-button><span v-if="editing">{{ entry.file?.name }}</span></a-form-item>
        </a-form>
        <a-space v-if="editing"><a-button :loading="busy" @click="save()">{{ t('projects.save') }}</a-button><a-button type="primary" :loading="busy" @click="save(true)">{{ t('tech.submit') }}</a-button><a-button v-if="current" status="danger" @click="remove">{{ t('cert.delete') }}</a-button></a-space>
        <template v-if="reviewing"><a-textarea v-model="opinion" :aria-label="t('tech.opinion')" :placeholder="t('tech.opinion')" /><a-space><a-button status="danger" @click="review(false)">{{ t('sections.reject') }}</a-button><a-button type="primary" @click="review(true)">{{ t('sections.pass') }}</a-button></a-space></template>
        <h2>{{ t('cert.history') }}</h2><p v-for="item in current?.history" :key="item.time">{{ item.time }} · {{ item.approved ? t('sections.pass') : t('sections.reject') }} · {{ item.opinion }}</p><p v-if="!current?.history?.length">{{ current?.opinion || t('tech.noHistory') }}</p>
      </template>
      <a-empty v-else :description="t('projects.missing')" />
    </section>
    <ConfirmDialog :unsaved="unsavedConfirmation" v-model:visible="confirmation" :title="confirmTitle" @confirm="action(); confirmation = false" />
  </main>
</template>

<style scoped>
.cert-page { min-width: 0; color: var(--app-text-primary); }
.filters, .content { background: var(--app-surface-container); padding: var(--mt-ds-space-4); min-width: 0; }
/* 筛选区布局统一走 global.css 的 app-filter-strip / app-filter-unit / app-filter-actions */
.filters { margin-bottom: var(--mt-ds-space-3); }
.content :deep(.arco-table-cell) { white-space: nowrap; }
.content :deep(th), .content :deep(td), .content :deep(.arco-btn-text) { font-weight: var(--mt-ds-weight-body); }
.content :deep(th), .content :deep(td) { height: 50px; }
.content :deep(.mt-pagination) { justify-content: flex-end; margin-top: var(--mt-ds-space-4); }
.editor > .arco-select { width: var(--mt-ds-form-width); max-width: 100%; margin-bottom: var(--mt-ds-space-4); }
.certificate-entry { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: var(--mt-ds-space-6); padding-top: var(--mt-ds-space-4); border-top: 1px solid var(--app-divider); margin-bottom: var(--mt-ds-space-4); }
.certificate-entry :deep(.arco-picker) { width: 100%; }
.certificate-entry :deep(.arco-form-item) { min-width: 0; }
.editor > .arco-textarea-wrapper { margin-bottom: var(--mt-ds-space-4); }
h2 { margin: var(--mt-ds-space-6) 0 var(--mt-ds-space-4); font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
@media (max-width: 600px) {
  .certificate-entry { grid-template-columns: minmax(0, 1fr); }
  .content :deep(.arco-space) { flex-wrap: wrap; }
}
</style>

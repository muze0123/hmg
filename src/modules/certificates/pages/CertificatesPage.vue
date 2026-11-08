<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { certificates, type Certificate, type CertificateEntry } from '../data/certificates';
import { projects } from '../../projects/data/projects';
import { technicalTasks } from '../../technical/data/technical';
import AppPagination from '../../../design/components/AppPagination.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const base = '/tasks/certificates';
const query = ref('');
const status = ref('');
const applied = ref('');
const appliedStatus = ref('');
const page = ref(1);
const size = ref(10);
const filtered = computed(() => certificates.value.filter(row => (!appliedStatus.value || row.status === appliedStatus.value) && `${row.number} ${row.project} ${row.regulation}`.toLowerCase().includes(applied.value.toLowerCase())));
const visibleRows = computed(() => filtered.value.slice((page.value - 1) * size.value, page.value * size.value));
const current = computed(() => certificates.value.find(row => row.id === route.params.id));
const editing = computed(() => route.params.id === 'new' || (route.params.mode === 'edit' && !!current.value && !['review', 'completed'].includes(current.value.status)));
const entries = ref<CertificateEntry[]>([]);
const reviewing = computed(() => route.params.mode === 'review' && current.value?.status === 'review');
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
function search() { applied.value = query.value.trim(); appliedStatus.value = status.value; page.value = 1; }
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
    Message.error(t('cert.required'));
    document.querySelectorAll<HTMLElement>('.certificate-entry')[Math.max(0, invalid)]?.querySelector<HTMLElement>('input')?.focus();
    return;
  }
  Object.assign(row, entries.value[0]);
  row.regulation = entries.value.map(entry => entry.regulation).join(', ');
  row.entries = entries.value.map(entry => ({ ...entry }));
  busy.value = true;
  row.status = submit ? 'review' : 'pending';
  const index = certificates.value.findIndex(item => item.id === row.id);
  if (index < 0) certificates.value.push({ ...row });
  else certificates.value[index] = { ...row };
  snapshot.value = draftState();
  busy.value = false;
  Message.success(t('cert.saved'));
  router.push(base);
}
function review(approved: boolean) {
  if (!current.value || !reviewing.value || !opinion.value.trim()) { Message.error(t('sections.required')); return; }
  current.value.status = approved ? 'completed' : 'rejected';
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
    
    <template v-if="!route.params.id">
      <section class="filters">
        <a-input v-model="query" :input-attrs="{ 'aria-label': t('cert.number') }" :placeholder="t('cert.number')" allow-clear @press-enter="search" />
        <a-select v-model="status" :aria-label="t('projects.status')" :placeholder="t('projects.status')" allow-clear>
          <a-option v-for="code in ['pending', 'active', 'review', 'rejected', 'completed', 'paused']" :key="code" :value="code">{{ t('projects.' + code) }}</a-option>
        </a-select>
        <a-button @click="query = ''; status = ''; search()">{{ t('projects.reset') }}</a-button>
        <a-button type="primary" @click="search">{{ t('projects.search') }}</a-button>
      </section>
      <section class="content">
        <a-button type="primary" @click="router.push(`${base}/new`)">{{ t('cert.new') }}</a-button>
        <a-table :data="visibleRows" :pagination="false" row-key="id" :scroll="{ x: 1300 }">
          <template #columns>
            <a-table-column v-for="key in ['number', 'project', 'regulation', 'issuer', 'agency', 'issued', 'expires']" :key="key" :data-index="key" :title="key === 'project' ? t('projects.id') : key === 'regulation' ? t('wb.regulation') : t('cert.' + key)" />
            <a-table-column :title="t('projects.status')"><template #cell="{ record }">{{ t('projects.' + record.status) }}</template></a-table-column>
            <a-table-column :title="t('projects.actions')" :width="220"><template #cell="{ record }">
              <a-button type="text" @click="router.push(`${base}/${record.id}/view`)">{{ t('projects.view') }}</a-button>
              <a-button type="text" :disabled="['review','completed'].includes(record.status)" @click="router.push(`${base}/${record.id}/edit`)">{{ t('projects.edit') }}</a-button>
              <a-button type="text" :disabled="record.status !== 'review'" @click="router.push(`${base}/${record.id}/review`)">{{ t('sections.review') }}</a-button>
            </template></a-table-column>
          </template>
          <template #empty><a-empty :description="t('sections.empty')" /></template>
        </a-table>
        <AppPagination v-model:current="page" v-model:page-size="size" :total="filtered.length" />
      </section>
    </template>
    <section v-else class="content editor">
      <a-button @click="router.push(base)">{{ t('projects.back') }}</a-button>
      <template v-if="draft">
        <h2>{{ t('projects.base') }}</h2>
        <a-select v-if="editing" v-model="draft.project" :aria-label="t('cert.project')" :placeholder="t('cert.project')" @change="selectProject">
          <a-option v-for="project in projects" :key="project.id" :value="project.id">{{ project.id }} · {{ project.name }}</a-option>
        </a-select>
        <a-descriptions v-if="selectedProject" :column="1">
          <a-descriptions-item v-for="key in ['id','name','brand','series','model','owner','begin','end'] as const" :key="key" :label="t('projects.' + key)">{{ selectedProject[key] }}</a-descriptions-item>
        </a-descriptions>
        <h2>{{ t('cert.regulations') }}</h2>
        <a-empty v-if="!entries.length" :description="t('cert.project')" />
        <a-form v-for="(entry, index) in entries" :key="entry.regulation" class="certificate-entry" :model="entry" layout="vertical">
          <a-form-item :label="t('wb.regulation')">{{ entry.regulation || '—' }}</a-form-item>
          <a-form-item v-for="key in ['number','issuer','agency','issued','expires'] as const" :key="key" :label="t('cert.' + key)" :required="editing && key !== 'expires'">
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
.cert-page{padding:var(--mt-ds-space-6);color:var(--app-text-primary);min-width:0}.note{color:var(--app-text-secondary)}.filters{display:flex;gap:var(--mt-ds-space-4);flex-wrap:wrap;margin-bottom:var(--mt-ds-space-4)}.filters>.arco-input-wrapper,.filters>.arco-select{width:var(--mt-filter-control-width,240px)}.content{background:var(--app-surface-container);padding:var(--mt-ds-space-6);min-width:0}.content :deep(.arco-table){margin-top:var(--mt-ds-space-4)}.content :deep(th),.content :deep(td){font-weight:400}.editor :deep(.arco-form){max-width:var(--mt-form-width,640px)}h2{font-size:var(--app-font-size-lg,16px)}@media(max-width:760px){.cert-page,.content{padding:var(--mt-ds-space-4)}.filters>*{width:100%!important}}

.cert-page, .content { padding: var(--mt-ds-space-4); }
.filters > .arco-input-wrapper, .filters > .arco-select { width: var(--mt-ds-filter-width); }
.editor :deep(.arco-form) { width: var(--mt-ds-form-width); max-width: 100%; }

@media (max-width: 600px) {
 .filters { flex-direction: column; align-items: stretch; }
 .filters > *, .filters > .arco-input-wrapper, .filters > .arco-select { width: 100%; }
 .filters :deep(.arco-form-item) { grid-template-columns: minmax(0, 1fr); width: 100%; }
 .filters :deep(.arco-form-item-label-col) { text-align: left; }
}

:deep(.arco-table-th) { background: var(--app-surface); font-weight: var(--mt-ds-weight-body); }
:deep(.arco-table-container) { border: 0; }
:deep(.arco-table-td) { border-bottom: 1px solid var(--app-divider); }
:deep(.arco-form-item-label) { font-weight: var(--mt-ds-weight-body); }
h2 { font-size: var(--mt-ds-font-title); line-height: var(--mt-ds-line-title); font-weight: var(--mt-ds-weight-title); }
</style>

<script setup lang="ts">
import AppPagination from '../../../design/components/AppPagination.vue';
import { watch, computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { projects, tasks, audits, materials, groups, workItems, activities, type WorkItem } from '../data/workbench';
const { t } = useI18n();
const search = ref('');
const status = ref('');
const selected = ref<WorkItem>();
const visible = ref(false);
const filtered = computed(()=>workItems.filter(r=>(!status.value||r.status===status.value)&&`${r.projectId} ${r.name} ${r.regulation}`.toLowerCase().includes(search.value.trim().toLowerCase())));
const distributions = computed(()=>[{code:'distribution',rows:projects},{code:'tasks',rows:tasks},{code:'audits',rows:audits}]);
const columns = computed(()=>['projectId','name','regulation','status','date','action'].map(key=>({title:t(`wb.${key}`),dataIndex:key,slotName:key==='status'||key==='action'?key:undefined,width:key==='action'?110:undefined})));
function open(row:WorkItem) { selected.value=row; visible.value=true; }
const pageSize = ref(10);
const page = ref(1);
watch(filtered, () => { page.value = 1; });
</script>
<template>
  <main class="workbench" :aria-label="t('wb.title')">
    
    <section class="summary" :aria-label="t('wb.projects')">
      <div class="summary-total"><span>{{ t('wb.projects') }}</span><strong>41</strong><span>{{ t('wb.completion') }} <b>56%</b></span></div>
      <div v-for="item in projects" :key="item.code" class="summary-stat" :class="item.tone"><span>{{ t(`wb.${item.code}`) }}</span><strong>{{ item.value }}</strong><a-progress :percent="item.value / 41" :show-text="false" :color="`var(--wb-${item.tone})`" /></div>
    </section>
    <div class="analytics">
      <section class="panel material-panel"><h2>{{ t('wb.materials') }}</h2><p class="muted">{{ t('wb.basis') }}</p><div class="materials"><div v-for="item in materials" :key="item.code"><h3>{{ t(`wb.${item.code}`) }}</h3><div v-for="kind in (['ready','pass'] as const)" :key="kind" class="measure"><span>{{ t(`wb.${kind}`) }}</span><a-progress :percent="item[kind]/100" :color="kind==='ready'?'var(--wb-primary)':'var(--wb-accent)'" /></div></div></div></section>
      <section v-for="group in distributions" :key="group.code" class="panel"><h2>{{ t(`wb.${group.code}`) }}</h2><div class="distribution"><a-progress type="circle" :percent="group.rows.filter(r=>r.code==='completed').reduce((n,r)=>n+r.value,0)/group.rows.reduce((n,r)=>n+r.value,0)" :color="'var(--wb-success)'" :width="112"><template #text><strong class="ring-total">{{ group.rows.reduce((n,r)=>n+r.value,0) }}</strong><span class="muted">{{ t('wb.total') }}</span></template></a-progress><dl><div v-for="item in group.rows" :key="item.code"><dt><i :class="item.tone" />{{ t(`wb.${item.code}`) }}</dt><dd>{{ item.value }}</dd></div></dl></div></section>
      <section v-for="group in groups" :key="group.code" class="panel"><h2>{{ t(`wb.${group.code}`) }}</h2><div v-for="item in group.rows" :key="item.code" class="bar-row"><span>{{ t(`wb.${item.code}`) }}</span><a-progress :percent="item.value / Math.max(...group.rows.map(r=>r.value))" :show-text="false" :color="`var(--wb-${item.tone})`"/><b>{{ item.value }}</b></div><p v-if="group.code==='regions'" class="muted roles">{{ t('wb.roles') }}</p></section>
      <section class="panel"><h2>{{ t('wb.certificates') }}</h2><div class="certificates"><div v-for="kind in ['vehicle','part']" :key="kind"><h3>{{ t(`wb.${kind}`) }}</h3><a-empty :description="t('wb.noCertificate')" /></div></div></section>
    </div>
    <div class="bottom-grid"><section class="panel queue"><h2>{{ t('wb.todo') }}</h2><div class="filters"><a-input-search v-model="search" allow-clear :placeholder="t('wb.search')" :aria-label="t('wb.search')"/><a-select v-model="status" :aria-label="t('wb.status')"><a-option value="">{{ t('wb.all') }}</a-option><a-option v-for="code in ['notStarted','inProgress','completed','rejected']" :key="code" :value="code">{{ t(`wb.${code}`) }}</a-option></a-select></div><a-table :columns="columns" :data="filtered.slice((page - 1) * pageSize, page * pageSize)" row-key="id" :pagination="false" :bordered="false" :scroll="{x:760}"><template #status="{record}"><a-tag>{{ t(`wb.${record.status}`) }}</a-tag></template><template #action="{record}"><a-button type="text" @click="open(record)">{{ t('wb.review') }}</a-button></template><template #empty><a-empty :description="t('wb.empty')"/></template></a-table><AppPagination v-model:current="page" v-model:page-size="pageSize" :total="filtered.length" /></section><section class="panel"><h2>{{ t('wb.activity') }}</h2><a-timeline><a-timeline-item v-for="(action,index) in activities" :key="action" :label="`2017-04-01 12:0${index}:00`"><strong>XXX</strong> · {{ t(`wb.${action}`) }}</a-timeline-item></a-timeline></section></div>
    <a-drawer v-model:visible="visible" :title="t('wb.detail')" :width="560" :footer="false"><template v-if="selected"><a-alert>{{ t('wb.notice') }}</a-alert><dl class="detail"><div v-for="key in (['projectId','name','regulation','status','date'] as const)" :key="key"><dt>{{ t(`wb.${key}`) }}</dt><dd>{{ key==='status'?t(`wb.${selected.status}`):selected[key] }}</dd></div></dl></template></a-drawer>
  </main>
</template>
<style scoped>
.workbench{--wb-primary:var(--app-color-primary);--wb-success:var(--app-color-success);--wb-danger:var(--app-color-danger);--wb-warning:var(--app-color-warning);--wb-neutral:var(--app-text-muted);--wb-accent:var(--chart-series-2);padding:24px;display:grid;gap:16px;color:var(--app-text-primary);font-variant-numeric:tabular-nums}.data-note{color:var(--app-text-secondary);font-size:12px}.summary{display:grid;grid-template-columns:1.4fr repeat(4,1fr);background:var(--app-surface-container);padding:24px;gap:32px}.summary-total,.summary-stat{display:flex;flex-direction:column;gap:12px}.summary-total{border-right:1px solid var(--app-divider)}.summary strong{font-size:32px;line-height:40px;font-weight:600}.summary-total>span:last-child{font-size:12px;color:var(--app-text-secondary)}.analytics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.panel{background:var(--app-surface-container);padding:24px;min-width:0}.panel h2{font-size:16px;line-height:24px;font-weight:600;margin:0 0 24px}.panel h3{font-size:14px;font-weight:500;margin:0 0 16px}.material-panel{grid-column:span 2}.material-panel h2{margin-bottom:4px}.muted{font-size:12px;color:var(--app-text-secondary)}.materials{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px 32px;margin-top:24px}.measure{display:flex;align-items:center;gap:12px;margin:12px 0}.measure>span{min-width:64px;font-size:12px}.distribution{display:flex;align-items:center;gap:24px;flex-wrap:wrap}.ring-total{display:block;font-size:26px;line-height:34px}.distribution dl{flex:1;min-width:120px;margin:0}.distribution dl>div,.detail>div{display:flex;justify-content:space-between;gap:16px;margin:10px 0}dt{display:flex;align-items:center;gap:8px}dd{margin:0}dt i{width:8px;height:8px;background:var(--wb-neutral);border-radius:50%}i.primary{background:var(--wb-primary)}i.success{background:var(--wb-success)}i.danger{background:var(--wb-danger)}i.warning{background:var(--wb-warning)}i.accent{background:var(--wb-accent)}.bar-row{display:grid;grid-template-columns:110px 1fr 24px;align-items:center;gap:12px;margin:22px 0}.roles{line-height:22px;margin-top:24px}.certificates{display:grid;grid-template-columns:1fr 1fr;gap:16px}.certificates :deep(.arco-empty){padding:10px 0}.bottom-grid{display:grid;grid-template-columns:minmax(0,3fr) minmax(260px,1fr);gap:16px}.filters{display:flex;gap:16px;margin-bottom:20px}.filters>.arco-input-wrapper{flex:1}.filters>.arco-select{width:180px}.detail{margin-top:24px}.detail dt{color:var(--app-text-secondary)}@media(max-width:1200px){.analytics{grid-template-columns:repeat(2,minmax(0,1fr))}.bottom-grid{grid-template-columns:1fr}.summary{gap:20px}}@media(max-width:760px){.workbench{padding:16px}.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.summary-total{grid-column:span 2;border-right:0;border-bottom:1px solid var(--app-divider);padding-bottom:16px}.analytics{grid-template-columns:1fr}.material-panel{grid-column:auto}.materials{grid-template-columns:1fr}.filters{flex-direction:column}.filters>.arco-select{width:100%}.panel{padding:16px}.certificates{grid-template-columns:1fr}}

.workbench, .panel, .summary { padding: var(--mt-ds-space-4); min-width: 0; }
.filters > .arco-input-wrapper { flex: none; width: var(--mt-ds-filter-width); }
.filters > .arco-select { width: var(--mt-ds-filter-width); }
.filters { flex-wrap: wrap; }
.queue :deep(th), .queue :deep(td), .queue :deep(.arco-tag) { font-weight: var(--mt-ds-weight-body); }

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

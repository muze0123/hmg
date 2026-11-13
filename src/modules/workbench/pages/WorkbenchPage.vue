<script setup lang="ts">
import { isTaskStatus } from '../../../shared/taskLifecycle';
import AppPagination from '../../../design/components/AppPagination.vue';
import { watch, computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { IconPlus, IconFolder, IconFile, IconStorage, IconArrowRight } from '@arco-design/web-vue/es/icon';
import AppListToolbar from '../../../design/components/AppListToolbar.vue';
import WorkbenchChart from '../components/WorkbenchChart.vue';
import { donut, bars, type ChartPalette } from '../data/charts';
import { useI18n } from 'vue-i18n';
import { projects, tasks, audits, materials, groups, workItems, activities, STATUS_CODES, ACTIVITY_MODULE_KEYS } from '../data/workbench';
import AppStatusTag from '../../../design/components/AppStatusTag.vue';
import { statusRole } from '../../../shared/status';
const { t, locale } = useI18n();

const themeVersion = ref(0);
let observer: MutationObserver;
onMounted(()=>{ observer=new MutationObserver(()=>themeVersion.value++); observer.observe(document.body,{attributes:true,attributeFilter:['arco-theme']}); themeVersion.value++; });
onBeforeUnmount(()=>observer?.disconnect());
const palette = computed(()=>{ void themeVersion.value; const read=(key:string)=>{ const probe=document.createElement('span'); probe.style.color=`var(${key})`; document.body.append(probe); const color=getComputedStyle(probe).color; probe.remove(); return color; }; return {text:read('--app-text-primary'),muted:read('--app-text-secondary'),surface:read('--app-surface-container'),track:read('--app-fill-1'),border:read('--app-divider'),primary:read('--app-color-primary'),success:read('--app-color-success'),danger:read('--app-color-danger'),warning:read('--app-color-warning'),neutral:read('--app-text-muted'),accent:read('--chart-series-4')} as ChartPalette; });
const label=(code:string)=>isTaskStatus(code) ? t(`taskStatus.${code}`) : t(`wb.${code}`);
const chartSummary=(rows: typeof projects.value)=>rows.map(r=>`${label(r.code)} ${r.value}`).join(', ');
const materialOption = computed(() => {
  const values = materials.flatMap(row => [row.ready, row.pass]);
  const names = materials.flatMap(row => [ `${label(row.code)} / ${label('ready')}`, `${label(row.code)} / ${label('pass')}` ]);
  return {
    animation: !matchMedia('(prefers-reduced-motion: reduce)').matches,
    aria: { enabled: true },
    grid: { left: 0, right: 42, top: 8, bottom: 8 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: palette.value.surface, borderColor: palette.value.border, textStyle: { color: palette.value.text }, formatter: (params: { dataIndex: number }[]) => { const index = params[0]?.dataIndex ?? 0; return `${names[index]}: ${values[index]}%`; } },
    xAxis: { type: 'value', min: 0, max: 100, show: false },
    yAxis: { type: 'category', inverse: true, data: names, show: false },
    series: [
      { type: 'bar', barWidth: 8, showBackground: true, backgroundStyle: { color: palette.value.track, borderRadius: 4 }, data: values.map((value,index) => ({ value, itemStyle: { color: index % 2 ? palette.value.success : palette.value.primary, borderRadius: 4 } })) },
      { type: 'bar', barWidth: 8, barGap: '-100%', silent: true, tooltip: { show: false }, itemStyle: { color: 'transparent' }, data: values.map(() => 100), label: { show: true, position: 'right', distance: 12, color: palette.value.muted, formatter: (params: { dataIndex: number }) => `${values[params.dataIndex]}%` } },
    ],
  };
});
const shortcuts=[{key:'newProject',path:'/projects/new',icon:IconPlus},{key:'projectList',path:'/projects',icon:IconFolder},{key:'technicalEntry',path:'/tasks/technical',icon:IconFile},{key:'archiveEntry',path:'/archive',icon:IconStorage}];
const search = ref('');
const status = ref('');
const filtered = computed(()=>workItems.value.filter(r=>(!status.value||r.status===status.value)&&`${r.projectId} ${r.name} ${r.regulation}`.toLowerCase().includes(search.value.trim().toLowerCase())));

const columns = computed(()=>['projectId','name','regulation','status','date','action'].map(key=>({title:t(`wb.${key}`),dataIndex:key,slotName:key==='status'||key==='action'?key:undefined,width:key==='action'?120:undefined,fixed:key==='action'?('right' as const):undefined})));
/** 最近动态最多展示 5 行（2026-11-12 用户裁决）。 */
const ACTIVITY_LIMIT = 5;
const pageSize = ref(10);
const page = ref(1);
watch(filtered, () => { page.value = 1; });
</script>
<template>
  <main class="workbench" :aria-label="t('wb.title')">
    
    <section class="summary" :aria-label="t('wb.projects')">
      <div class="summary-total"><div class="total-copy"><span>{{ t('wb.projects') }}</span><strong>{{ projects.reduce((sum, row) => sum + row.value, 0) }}</strong><span>{{ t('wb.completion') }} <b>{{ Math.round((projects.find(row => row.code === 'completed')?.value || 0) / (projects.reduce((sum, row) => sum + row.value, 0) || 1) * 100) }}%</b></span></div><div class="total-distribution"><div class="stack"><span v-for="item in projects" :key="item.code" :style="{flex:item.value,background:palette[item.tone as keyof ChartPalette]}" :title="`${label(item.code)} ${item.value}`"/></div><div class="stack-labels"><span v-for="item in projects" :key="item.code">{{ label(item.code) }} <b>{{ item.value }}</b></span></div></div></div>
      <div v-for="item in projects" :key="item.code" class="summary-stat" :style="{borderTopColor:palette[item.tone as keyof ChartPalette]}"><span>{{ label(item.code) }}</span><strong>{{ item.value }}</strong></div>
    </section>
    <section class="panel shortcuts"><h2>{{ t('wb.shortcuts') }}</h2><div class="shortcut-links"><router-link v-for="entry in shortcuts" :key="entry.key" :to="entry.path"><component :is="entry.icon"/><span>{{ t(`wb.${entry.key}`) }}</span><IconArrowRight/></router-link></div></section>
    <div class="analytics">
      <section class="panel project-chart"><h2>{{ t('wb.distribution') }}</h2><WorkbenchChart :option="donut(projects,label,t('wb.total'),palette)" :summary="chartSummary(projects)"/></section>
      <section class="panel material-panel"><h2>{{ t('wb.materials') }}</h2><div class="material-comparison"><div class="material-labels"><div v-for="item in materials" :key="item.code" class="material-label-group"><span class="material-category">{{ label(item.code) }}</span><div class="material-metric-labels"><span>{{ label('ready') }}</span><span>{{ label('pass') }}</span></div></div></div><WorkbenchChart :option="materialOption" :summary="materials.map(r=>`${label(r.code)} ${label('ready')} ${r.ready}%, ${label('pass')} ${r.pass}%`).join('; ')"/></div></section>
      <section class="panel"><h2>{{ t('wb.tasks') }}</h2><WorkbenchChart :option="donut(tasks,label,t('wb.total'),palette)" :summary="chartSummary(tasks)"/></section>
      <section v-for="group in groups.slice(0,2)" :key="group.code" class="panel"><h2>{{ label(group.code) }}</h2><WorkbenchChart :option="bars(group.rows,label,palette,t('wb.items'))" :summary="chartSummary(group.rows)"/></section>
      <section class="panel"><h2>{{ t('wb.audits') }}</h2><WorkbenchChart :option="donut(audits,label,t('wb.total'),palette)" :summary="chartSummary(audits)"/></section>
      <section class="panel"><h2>{{ t('wb.regions') }}</h2><WorkbenchChart :option="bars(groups[2]!.rows,label,palette,t('wb.regulationsUnit'))" :summary="chartSummary(groups[2]!.rows)"/></section>
      <section class="panel"><h2>{{ t('wb.certificates') }}</h2><div class="certificates"><div v-for="kind in ['vehicle','part']" :key="kind"><h3>{{ label(kind) }}</h3><a-empty :description="t('wb.noCertificate')" /></div></div></section>
    </div>
    <div class="bottom-grid"><section class="panel queue"><AppListToolbar :title="t('wb.todo')" :summary="t('wb.queueCount', {count: filtered.length})"/><div class="filters"><label class="filter-field"><a-input-search v-model="search" allow-clear :placeholder="t('wb.search')" :aria-label="t('wb.search')"/></label><label class="filter-field"><a-select v-model="status" :aria-label="t('wb.status')"><a-option value="">{{ t('wb.all') }}</a-option><a-option v-for="code in STATUS_CODES" :key="code" :value="code">{{ t(`taskStatus.${code}`) }}</a-option></a-select></label></div><a-table :columns="columns" :data="filtered.slice((page - 1) * pageSize, page * pageSize)" row-key="id" :pagination="false" :bordered="false" :scroll="{x:760}"><template #status="{record}"><AppStatusTag :role="statusRole(record.status, 'workbench')" :label="t(`taskStatus.${record.status}`)"/></template><!-- 待项目状态与权限规则确认后接入对应操作。 --><template #action><span>- -</span></template><template #empty><a-empty :description="t('wb.empty')"/></template></a-table><AppPagination v-model:current="page" v-model:page-size="pageSize" :total="filtered.length" /></section><section class="panel activity-panel"><h2>{{ t('wb.activity') }}</h2><ul v-if="activities.length" class="activity-list" :aria-label="t('wb.activity')"><li v-for="item in activities.slice(0, ACTIVITY_LIMIT)" :key="item.id" class="activity-row"><span class="activity-main"><span class="activity-module">【{{ t(ACTIVITY_MODULE_KEYS[item.module]) }}】</span><span class="activity-action">{{ t(`wb.${item.action}`) }}</span><span class="activity-content"><span class="activity-actor">{{ item.actor }}</span> <span class="activity-verb">{{ t(`wb.activityVerb.${item.action}`) }}</span> <span class="activity-target">{{ item.target }}</span></span></span><time class="activity-time" :datetime="item.time.replace(' ', 'T')">{{ item.time }}</time></li></ul><a-empty v-else :description="t('designSystem.empty')" /></section></div>
  </main>
</template>
<style scoped>
/* 最近动态：逐行列表，结构为【功能模块】操作功能  操作内容（操作人名称 + 动作 + 内容）  时间。
   文字统一 400 字重（DESIGN.md · Data-list text weight），颜色全部走语义 Token。 */
.activity-list{list-style:none;margin:0;padding:0}
.activity-row{display:flex;align-items:baseline;gap:16px;padding:8px 0;border-bottom:1px solid var(--app-divider);font-size:var(--mt-ds-font-body);line-height:var(--mt-ds-line-body);font-weight:var(--mt-ds-weight-body);color:var(--app-text-primary)}
.activity-row:last-child{border-bottom:0;padding-bottom:0}
.activity-main{display:flex;flex-wrap:wrap;align-items:baseline;gap:0 8px;min-width:0;flex:1 1 160px}
.activity-module{white-space:nowrap;font-weight:500}
.activity-action{white-space:nowrap;color:var(--app-color-primary);font-weight:400}
.activity-content{min-width:0}
.activity-actor{color:var(--app-text-primary);font-weight:500}
.activity-verb{white-space:nowrap}
.activity-target{color:var(--app-text-secondary);overflow-wrap:anywhere}
.activity-time{flex-shrink:0;margin-left:auto;white-space:nowrap;font-size:var(--mt-ds-font-caption);line-height:var(--mt-ds-line-caption);color:var(--app-text-muted)}
@media(max-width:480px){.activity-row{flex-wrap:wrap;gap:4px 8px}.activity-main{flex-basis:100%}.activity-time{margin-left:0}}
.material-comparison{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px}.material-labels{display:grid;grid-template-rows:repeat(4,1fr);padding:8px 0}.material-label-group{display:grid;grid-template-columns:minmax(56px, max-content) max-content;gap:16px;align-items:center;font-size:12px;color:var(--app-text-secondary)}.material-category{text-align:right;max-width:140px;overflow-wrap:anywhere}.material-metric-labels{height:100%;display:grid;grid-template-rows:1fr 1fr;align-items:center;text-align:right}.material-metric-labels span{white-space:nowrap}@media(max-width:1200px){.material-panel{grid-column:1 / -1}}@media(max-width:480px){.material-comparison{gap:8px}.material-label-group{grid-template-columns:72px max-content;gap:8px}.material-category{max-width:72px}}

.workbench{display:grid;gap:12px;min-width:0;color:var(--app-text-primary);font-variant-numeric:tabular-nums}.summary{display:grid;grid-template-columns:minmax(340px,2.8fr) repeat(4,minmax(100px,1fr));gap:12px}.summary-total,.summary-stat,.panel{background:var(--app-surface-container);border-radius:var(--mt-ds-radius-card,4px);min-width:0}.summary-total{display:flex;gap:24px;padding:24px;background:linear-gradient(115deg,var(--app-primary-light-bg),var(--app-surface-container))}.total-copy{display:grid;gap:8px;flex-shrink:0}.total-copy>span:last-child{font-size:12px;color:var(--app-text-secondary)}.summary strong{font-size:32px;line-height:40px;font-weight:600}.total-distribution{flex:1;align-self:center;min-width:0}.stack{display:flex;height:12px;border-radius:6px;overflow:hidden}.stack-labels{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:16px;font-size:12px;color:var(--app-text-secondary)}.stack-labels b{font-weight:400;color:var(--app-text-primary);margin-left:4px}.summary-stat{border-top:3px solid;padding:20px;display:flex;flex-direction:column;justify-content:center;gap:12px}.summary-stat>span{color:var(--app-text-secondary)}.panel{padding:var(--mt-ds-space-4)}h2{font-size:var(--mt-ds-font-title);line-height:var(--mt-ds-line-title);font-weight:var(--mt-ds-weight-title);margin:0 0 12px}h3{font-size:14px;font-weight:400;margin:0 0 16px}.analytics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.material-panel{grid-column:span 2}.shortcuts{display:flex;gap:24px;align-items:center}.shortcuts h2{margin:0;flex-shrink:0}.shortcut-links{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;flex:1}.shortcut-links a{display:flex;align-items:center;gap:12px;color:var(--app-text-primary);text-decoration:none;padding:12px;background:var(--app-fill-1);border-radius:var(--mt-ds-radius-control,4px)}.shortcut-links a:hover{background:var(--app-primary-light-bg);color:var(--app-color-primary)}.shortcut-links a>svg:first-child{color:var(--app-color-primary);font-size:20px}.shortcut-links a>svg:last-child{margin-left:auto}.bottom-grid{display:grid;grid-template-columns:minmax(0,2fr) minmax(360px,1fr);gap:12px}.filters{display:flex;flex-wrap:wrap;gap:12px;margin-bottom:16px}.filter-field{flex-shrink:0;display:flex;align-items:center;gap:12px}.filter-field>.arco-input-wrapper{width:260px}.filter-field>.arco-select{width:160px}.queue :deep(th),.queue :deep(td),.queue :deep(.arco-tag){font-weight:400}.certificates{display:grid;grid-template-columns:1fr 1fr;gap:12px;height:240px;align-items:center}.certificates>div{padding:16px;background:var(--app-fill-1);border:1px solid var(--app-divider);min-width:0}.certificates :deep(.arco-empty){padding:20px 0}a:focus-visible{outline:2px solid var(--app-color-primary);outline-offset:2px}@media(max-width:1200px){.summary{grid-template-columns:repeat(4,minmax(0,1fr))}.summary-total{grid-column:span 4}.analytics{grid-template-columns:repeat(2,minmax(0,1fr))}.material-panel{grid-column:span 1}.bottom-grid{grid-template-columns:1fr}.shortcuts{align-items:stretch;flex-direction:column;gap:12px}.shortcut-links{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:760px){.summary{grid-template-columns:repeat(2,minmax(0,1fr))}.summary-total{grid-column:span 2;flex-direction:column;gap:16px}.total-distribution{align-self:stretch}.analytics{grid-template-columns:1fr}.filter-field{width:100%;flex-direction:column;align-items:stretch}.filter-field>.arco-input-wrapper,.filter-field>.arco-select{width:100%}.shortcut-links{grid-template-columns:1fr}.certificates{height:auto}.summary-stat{padding:16px}}
@media(min-width:761px) and (max-width:1200px){.material-panel{grid-column:1 / -1}}
</style>

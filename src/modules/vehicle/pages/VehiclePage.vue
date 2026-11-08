<script setup lang="ts">
import { IconMore } from '@arco-design/web-vue/es/icon';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import { computed, ref, watch } from 'vue';
import { useRoute, useRouter, onBeforeRouteLeave } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
interface Entry { name: string; format: string; tag: string; values: string[] }
interface Vehicle { reviews?: { opinion: string; result: string; time: string }[]; id: string; name: string; status: string; priority: string; start: string; end: string; actual: string; region: string; country: string; type: string; template: string; reviewer: string; executor: string; version: string; note: string; attachment: string; entries: Entry[] }
const seed: Vehicle[] = Array.from({ length: 16 }, (_, i) => ({ id: `HMG-2026-${String(i + 1).padStart(3, '0')}`, name: `DF7 / ${2026 + i}`, status: ['pending', 'reviewing', 'completed', 'rejected'][i % 4]!, priority: i % 3 ? 'normal' : 'high', start: '2026-11-01', end: '2026-12-30', actual: i % 4 === 2 ? '2026-11-06' : '', region: 'asia', country: 'china', type: 'truck', template: 'DF7 V1.0', reviewer: '李四', executor: '张三', version: 'V1.0', note: '', attachment: '', entries: [{ name: 'Y75D', format: 'text', tag: '', values: ['Y75D', 'Z75B'] }] }));
const records = ref<Vehicle[]>(seed);
try { const stored = JSON.parse(localStorage.getItem('hmg-vehicle-v1') || 'null'); if (Array.isArray(stored) && stored.every(r => r.id && Array.isArray(r.entries))) records.value = stored; } catch { /* Use demo fixtures when storage is unavailable. */ }
const keyword = ref('');
const status = ref('');
const current = computed(() => records.value.find(r => r.id === route.params.id));
const draft = ref<Vehicle>();
const dirty = ref(false);
const opinion = ref('');
const requiredRules = computed(() => [{ required: true, validator: (value: string, callback: (message?: string) => void) => callback(value?.trim() ? undefined : t('vehicle.required')) }]);
const formRef = ref<{ validate: () => Promise<unknown> }>();
const fileInput = ref<HTMLInputElement>();
const folded = ref(false);
const regions: Record<string,string> = { asia:'china', europe:'germany', northAmerica:'usa', southAmerica:'brazil', africa:'egypt', oceania:'australia' };
function visibleColumns(entry: Entry) {
  return entry.values.map((_, index) => index).filter(index => !folded.value || !entry.values.some((_, earlier) => earlier < index && draft.value?.entries.every(row => row.values[earlier] === row.values[index])));
}
function addEntries(count: number) { if (!draft.value) return; for (let index=0; index<count; index++) draft.value.entries.push({name:'',format:'text',tag:'',values:Array(draft.value.entries[0]?.values.length || 1).fill('')}); dirty.value=true; }
const readonly = computed(() => route.params.mode !== 'edit');
const rows = computed(() => records.value.filter(r => (!status.value || r.status === status.value) && `${r.id} ${r.name}`.toLowerCase().includes(keyword.value.toLowerCase())));
watch(() => route.fullPath, () => { draft.value = current.value ? JSON.parse(JSON.stringify(current.value)) : undefined; dirty.value = false; opinion.value = ''; }, { immediate: true });
onBeforeRouteLeave(() => !dirty.value || requestLeave());
const columns = computed(() => ['id', 'name', 'priority', 'status', 'start', 'end', 'actual', 'action'].map(key => ({ title: t(`vehicle.${key === 'status' ? 'all' : key}`), dataIndex: key, slotName: key, width: key === 'action' ? 250 : 155 })));
function go(record: Vehicle, mode: string) { router.push(`/tasks/vehicle/${record.id}/${mode}`); }
async function persist(nextStatus?: string) {
  if (nextStatus && !readonly.value && await formRef.value?.validate()) return;
  if (!draft.value) return;
  if (nextStatus && ['region', 'country', 'type', 'template', 'reviewer', 'executor', 'version'].some(key => !draft.value![key as keyof Vehicle])) { Message.error(t('vehicle.required')); return; }
  const next = JSON.parse(JSON.stringify(draft.value)) as Vehicle;
  if (nextStatus) next.status = nextStatus;
  if (nextStatus === 'completed') next.actual = new Date().toISOString().slice(0, 10);
  const updated = records.value.map(r => r.id === next.id ? next : r);
  try { localStorage.setItem('hmg-vehicle-v1', JSON.stringify(updated)); } catch { Message.error(t('vehicle.required')); return; }
  records.value = updated; draft.value = JSON.parse(JSON.stringify(next)); dirty.value = false; Message.success(t('vehicle.saved'));
}
function review(result: string) { if (!opinion.value.trim()) { Message.error(t('vehicle.reviewRequired')); return; } if (draft.value) { draft.value.reviews ??= []; draft.value.reviews.push({opinion:opinion.value,result,time:new Date().toISOString()}); } persist(result); }
function exportRecord(record: Vehicle) {
  const blob = new Blob(['\ufeff' + JSON.stringify(record, null, 2)], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${record.id}.json`; link.click(); URL.revokeObjectURL(url);
}
function updateCell(entry: Entry, column: number, row: number, cell: number, value: string) {
  const grid = (entry.values[column] || '\t\n\t').split('\n').map(line => line.split('\t'));
  grid[row]![cell] = value; entry.values[column] = grid.map(line => line.join('\t')).join('\n'); dirty.value = true;
}
function attachment(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file || !draft.value) return; if (!/\.(docx?|pdf)$/i.test(file.name)) { Message.error(t('vehicle.invalidFile')); return; } draft.value.attachment = file.name; dirty.value = true; }
function addColumn() { draft.value?.entries.forEach(entry => entry.values.push('')); dirty.value = true; }
const pageSize = ref(10);
const page = ref(1);
watch(rows, () => { page.value = 1; });
const leaveVisible = ref(false);
let resolveLeave: ((allow: boolean) => void) | undefined;
function requestLeave() {
  return new Promise<boolean>(resolve => { resolveLeave = resolve; leaveVisible.value = true; });
}
function finishLeave(allow: boolean) {
  leaveVisible.value = false;
  resolveLeave?.(allow);
  resolveLeave = undefined;
}
</script>
<template>
  <section class="vehicle-page">
    
    <template v-if="!route.params.id">
      <div class="filters"><a-input-search v-model="keyword" :placeholder="t('vehicle.search')" :aria-label="t('vehicle.search')" allow-clear /><a-select v-model="status" :placeholder="t('vehicle.all')" allow-clear><a-option v-for="code in ['pending','reviewing','completed','rejected']" :key="code" :value="code">{{ t(`vehicle.${code}`) }}</a-option></a-select></div>
      <a-table :columns="columns" :data="rows.slice((page - 1) * pageSize, page * pageSize)" :scroll="{ x: 1300 }" :pagination="false" :bordered="false" row-key="id">
        <template #priority="{ record }">{{ t(`vehicle.${record.priority}`) }}</template><template #status="{ record }"><a-tag :color="record.status === 'completed' ? 'green' : record.status === 'rejected' ? 'red' : 'arcoblue'">{{ t(`vehicle.${record.status}`) }}</a-tag></template>
        <template #action="{ record }"><a-space><a-link @click="go(record, 'detail')">{{ t('vehicle.detail') }}</a-link><a-link v-if="['pending','rejected'].includes(record.status)" @click="go(record, 'edit')">{{ t('vehicle.edit') }}</a-link><a-link v-if="record.status === 'reviewing'" @click="go(record, 'review')">{{ t('vehicle.review') }}</a-link><a-dropdown trigger="hover" position="br" popup-container="body" content-class="row-more-dropdown"><a-button size="mini" :aria-label="t('testing.more')" :title="t('testing.more')"><IconMore /></a-button><template #content><a-doption @click="exportRecord(record)">{{ t('vehicle.export') }}</a-doption></template></a-dropdown></a-space></template>
      </a-table><AppPagination v-model:current="page" v-model:page-size="pageSize" :total="rows.length" />
    </template>
    <template v-else-if="draft">
      <a-space><a-button @click="router.push('/tasks/vehicle')">{{ t('vehicle.back') }}</a-button><span>{{ draft.id }} · {{ draft.name }}</span><a-tag>{{ t(`vehicle.${draft.status}`) }}</a-tag></a-space>
      <a-tabs default-active-key="basic">
        <a-tab-pane key="basic" :title="t('vehicle.basic')">
          <a-form ref="formRef" :model="draft" layout="vertical" scroll-to-first-error class="vehicle-form" @input="dirty = true" @change="dirty = true">
            <a-form-item v-for="key in ['region','country','type','template','reviewer','executor','version'] as const" :key="key" :label="t(`vehicle.${key}`)" :field="key" :rules="readonly ? [] : requiredRules" :required="!readonly">
              <span v-if="readonly">{{ ['region','country','type'].includes(key) ? t(`vehicle.${draft[key]}`) : draft[key] }}</span>
              <a-select v-else-if="key === 'region'" v-model="draft.region" @change="draft.country = regions[draft.region] || 'china'"><a-option v-for="code in ['asia','europe','northAmerica','southAmerica','africa','oceania']" :key="code" :value="code">{{ t(`vehicle.${code}`) }}</a-option></a-select>
              <a-select v-else-if="key === 'country'" v-model="draft.country"><a-option :value="regions[draft.region] || 'china'">{{ t(`vehicle.${regions[draft.region] || 'china'}`) }}</a-option></a-select>
              <a-select v-else-if="key === 'type'" v-model="draft.type"><a-option v-for="code in ['car','truck']" :key="code" :value="code">{{ t(`vehicle.${code}`) }}</a-option></a-select>
              <a-input v-else v-model="draft[key]" />
            </a-form-item>
            <a-form-item :label="t('vehicle.note')"><span v-if="readonly">{{ draft.note || '—' }}</span><a-textarea v-else v-model="draft.note" /></a-form-item>
            <a-form-item :label="t('vehicle.attachment')"><span>{{ draft.attachment || '—' }}</span><a-button v-if="!readonly" @click="fileInput?.click()">{{ t('vehicle.attachment') }}</a-button><input v-if="!readonly" ref="fileInput" style="display:none" type="file" accept=".doc,.docx,.pdf" :aria-label="t('vehicle.attachment')" @change="attachment" /></a-form-item>
          </a-form>
        </a-tab-pane>
        <a-tab-pane key="items" :title="t('vehicle.items')">
          <a-space v-if="!readonly"><a-dropdown trigger="contextMenu" @select="value => addEntries(Number(value))"><a-button @click="addEntries(1)">{{ t('vehicle.add') }}</a-button><template #content><a-doption v-for="count in [10,20,50]" :key="count" :value="String(count)">{{ count }}</a-doption></template></a-dropdown><a-button @click="addColumn">{{ t('vehicle.addColumn') }}</a-button></a-space>
          <a-button @click="folded = !folded">{{ t(folded ? 'vehicle.expand' : 'vehicle.fold') }}</a-button><div class="configuration-scroll"><table class="configuration-table"><thead><tr><th>#</th><th>{{ t('vehicle.item') }}</th><th>{{ t('vehicle.format') }}</th><th>{{ t('vehicle.tag') }}</th><th v-for="index in (draft.entries[0] ? visibleColumns(draft.entries[0]) : [])" :key="index">{{ t('vehicle.value') }} {{ index + 1 }}<a-button v-if="!readonly && index > 0" size="mini" @click="draft.entries.forEach(e => e.values.splice(index,1));dirty=true">{{ t('vehicle.remove') }}</a-button></th><th v-if="!readonly">{{ t('vehicle.action') }}</th></tr></thead><tbody><tr v-for="(entry,index) in draft.entries" :key="index"><td>{{ index+1 }}</td><td><span v-if="readonly">{{ entry.name }}</span><a-input v-else v-model="entry.name" :aria-label="t('vehicle.item')" @input="dirty=true" /></td><td><span v-if="readonly">{{ t(`vehicle.${entry.format}`) }}</span><a-select v-else v-model="entry.format" :aria-label="t('vehicle.format')" @change="dirty=true"><a-option v-for="code in ['text','number','ordered','table','rich']" :key="code" :value="code">{{ t(`vehicle.${code}`) }}</a-option></a-select></td><td><span v-if="readonly">{{ entry.tag }}</span><a-input v-else v-model="entry.tag" :aria-label="t('vehicle.tag')" @input="dirty=true" /></td><td v-for="col in visibleColumns(entry)" :key="col"><span v-if="readonly">{{ entry.values[col] || '—' }}</span><table v-else-if="entry.format === 'table'" class="value-grid"><tbody><tr v-for="(line, rowIndex) in (entry.values[col] || '\t\n\t').split('\n')" :key="rowIndex"><td v-for="(cell, cellIndex) in line.split('\t')" :key="cellIndex"><a-input :model-value="cell" :aria-label="`${t('vehicle.table')} ${rowIndex+1} ${cellIndex+1}`" @update:model-value="value => updateCell(entry,col,rowIndex,cellIndex,value)" /></td></tr></tbody></table><div v-else-if="entry.format === 'rich'" class="rich-editor"><a-button size="mini" @click="entry.values[col] = `**${entry.values[col]}**`;dirty=true">B</a-button><a-button size="mini" @click="entry.values[col] = `*${entry.values[col]}*`;dirty=true">I</a-button><a-textarea v-model="entry.values[col]" :aria-label="t('vehicle.rich')" @input="dirty=true" /></div><a-input v-else v-model="entry.values[col]" :input-attrs="{ inputmode: entry.format === 'number' ? 'decimal' : 'text' }" :aria-label="`${t('vehicle.value')} ${col+1}`" @input="dirty=true" /></td><td v-if="!readonly"><a-button :disabled="draft.entries.length === 1" @click="draft.entries.splice(index,1);dirty=true">{{ t('vehicle.remove') }}</a-button></td></tr></tbody></table></div>
        </a-tab-pane>
      </a-tabs>
      <a-space v-if="!readonly"><a-button @click="persist()">{{ t('vehicle.save') }}</a-button><a-button type="primary" @click="persist('reviewing')">{{ t('vehicle.submit') }}</a-button></a-space>
      <a-list v-if="draft.reviews?.length" :data="draft.reviews"><template #item="{item}"><a-list-item>{{ item.time }} · {{ t(`vehicle.${item.result}`) }} · {{ item.opinion }}</a-list-item></template></a-list><div v-if="route.params.mode === 'review' && draft.status === 'reviewing'" class="review"><label>{{ t('vehicle.opinion') }}</label><a-textarea v-model="opinion" :aria-label="t('vehicle.opinion')" /><a-space><a-button type="primary" @click="review('completed')">{{ t('vehicle.pass') }}</a-button><a-button status="danger" @click="review('rejected')">{{ t('vehicle.reject') }}</a-button></a-space></div>
    </template>
    <a-empty v-else />
  </section>
<ConfirmDialog unsaved :visible="leaveVisible" :title="t('vehicle.unsaved')" @update:visible="finishLeave(false)" @confirm="finishLeave(true)" />
</template>
<style scoped>
.vehicle-page{display:flex;flex-direction:column;gap:20px;padding:24px;background:var(--color-bg-2);min-height:100%;color:var(--color-text-1)}.filters{display:flex;gap:16px;flex-wrap:wrap}.filters>*{width:260px}.vehicle-form{max-width:500px}.configuration-scroll{overflow:auto;margin-top:16px}.configuration-table{width:100%;min-width:950px;border-collapse:collapse}.configuration-table th,.configuration-table td{padding:12px;border:1px solid var(--color-border-2);min-width:140px;text-align:left}.configuration-table th{background:var(--color-fill-2)}.review{max-width:500px;display:grid;gap:16px}@media(max-width:768px){.vehicle-page{padding:16px}.filters>*{width:100%}}

.vehicle-page { padding: var(--mt-ds-space-4); gap: var(--mt-ds-space-4); background: transparent; min-width: 0; }
.filters { padding: var(--mt-ds-space-4); background: var(--mt-ds-surface); }
.filters > * { width: var(--mt-ds-filter-width); }
.vehicle-page :deep(th), .vehicle-page :deep(td), .vehicle-page :deep(.arco-tag) { font-weight: var(--mt-ds-weight-body); }

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

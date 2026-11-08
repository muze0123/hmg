<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
import AppPagination from '../../../design/components/AppPagination.vue';
import ConfirmDialog from '../../../shared/components/ConfirmDialog.vue';
const { t } = useI18n();
interface Tag { id: string; name: string; description: string; date: string; creator: string }
const rows = ref<Tag[]>(Array.from({ length: 17 }, (_, i) => ({ id: `tag-${i + 1}`, name: `标签${i + 1}`, description: '', date: i ? '2025-12-31' : '2024-01-01', creator: '张三' })));
const query = reactive({ name: '', date: '' });
const applied = reactive({ name: '', date: '' });
const page = ref(1);
const pageSize = ref(10);
const filtered = computed(() => rows.value.filter(row => row.name.includes(applied.name) && (!applied.date || row.date === applied.date)));
const visibleRows = computed(() => filtered.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value));
function search() { Object.assign(applied, query); page.value = 1; }
function reset() { Object.assign(query, { name: '', date: '' }); search(); }
const open = ref(false);
const readonly = ref(false);
const form = reactive<Tag>({ id: '', name: '', description: '', date: '', creator: '' });
let snapshot = '';
const error = ref('');
const nameInput = ref<{ focus: () => void }>();
const discard = ref(false);
const deleting = ref(false);
function edit(row?: Tag, view = false) {
  Object.assign(form, row ?? { id: '', name: '', description: '', date: new Date().toISOString().slice(0, 10), creator: '张三' });
  snapshot = JSON.stringify(form); readonly.value = view; error.value = ''; open.value = true;
}
function close() { if (!readonly.value && JSON.stringify(form) !== snapshot) discard.value = true; else open.value = false; }
function save() {
  error.value = !form.name.trim() ? 'tags.required' : rows.value.some(row => row.id !== form.id && row.name === form.name.trim()) ? 'tags.duplicate' : '';
  if (error.value) { nameInput.value?.focus(); return; }
  const record = { ...form, name: form.name.trim(), id: form.id || crypto.randomUUID() };
  const index = rows.value.findIndex(row => row.id === record.id);
  if (index < 0) rows.value.unshift(record); else rows.value[index] = record;
  open.value = false; search(); Message.success(t('tags.saved'));
}
function remove() { rows.value = rows.value.filter(row => row.id !== form.id); deleting.value = false; open.value = false; page.value = Math.min(page.value, Math.max(1, Math.ceil(filtered.value.length / pageSize.value))); }
</script>
<template>
  <section class="tags-page">
    <a-space wrap>
      <label><AppFieldLabel :text="t('tags.name')" context="filter" /><a-input v-model="query.name" :input-attrs="{ 'aria-label': t('tags.name') }" allow-clear @press-enter="search" /></label>
      <label><AppFieldLabel :text="t('tags.date')" context="filter" /><a-date-picker v-model="query.date" :aria-label="t('tags.date')" /></label>
      <a-button @click="reset">{{ t('tags.reset') }}</a-button><a-button type="primary" @click="search">{{ t('tags.search') }}</a-button>
    </a-space>
    <a-space><a-button type="primary" @click="edit()">{{ t('tags.new') }}</a-button></a-space>
    <a-table :data="visibleRows" row-key="id" :pagination="false" :scroll="{ x: 800 }">
      <template #columns>
        <a-table-column :title="t('tags.name')" data-index="name" />
        <a-table-column :title="t('tags.description')" data-index="description" />
        <a-table-column :title="t('tags.date')" data-index="date" />
        <a-table-column :title="t('tags.actions')"><template #cell="{ record }"><a-button type="text" @click="edit(record, true)">{{ t('tags.view') }}</a-button><a-button type="text" @click="edit(record)">{{ t('tags.edit') }}</a-button></template></a-table-column>
      </template><template #empty>{{ t('tags.empty') }}</template>
    </a-table>
    <AppPagination v-model:current="page" v-model:page-size="pageSize" :total="filtered.length" />
    <a-drawer :visible="open" :width="480" :title="t(readonly ? 'tags.view' : form.id ? 'tags.edit' : 'tags.new')" :mask-closable="false" @cancel="close">
      <a-form :model="form" layout="vertical">
        <a-form-item :validate-status="error ? 'error' : undefined" :help="error ? t(error) : ''" required><template #label><AppFieldLabel :text="t('tags.name')" /></template><a-input ref="nameInput" v-model="form.name" :readonly="readonly" :input-attrs="{ 'aria-label': t('tags.name') }" /></a-form-item>
        <a-form-item><template #label><AppFieldLabel :text="t('tags.description')" /></template><a-textarea v-model="form.description" :readonly="readonly" :input-attrs="{ 'aria-label': t('tags.description') }" /></a-form-item>
        <a-form-item :label="t('tags.creator')">{{ form.creator }}</a-form-item><a-form-item :label="t('tags.date')">{{ form.date }}</a-form-item>
      </a-form>
      <template #footer><a-space><a-button v-if="form.id" status="danger" @click="deleting = true">{{ t('tags.delete') }}</a-button><a-button @click="close">{{ t('tags.cancel') }}</a-button><a-button v-if="!readonly" type="primary" @click="save">{{ t('tags.save') }}</a-button></a-space></template>
    </a-drawer>
    <ConfirmDialog :visible="discard" :title="t('tags.leave')" @cancel="discard = false" @confirm="discard = false; open = false" />
    <ConfirmDialog :visible="deleting" icon="warning" :title="t('tags.remove')" :description="t('tags.warning')" @cancel="deleting = false" @confirm="remove" />
  </section>
</template>
<style scoped>
.tags-page { display: flex; flex-direction: column; gap: var(--mt-ds-space-4); min-width: 0; }
.hint { color: var(--mt-ds-text-secondary); }
label { display: inline-flex; align-items: center; gap: var(--mt-ds-space-2); }
.tags-page :deep(th), .tags-page :deep(td) { font-weight: 400; }
</style>

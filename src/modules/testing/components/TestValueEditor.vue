<script setup lang="ts">
import { computed, nextTick, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import type { EntryValue, TestItem } from '../data/testing';
const props = defineProps<{ item: TestItem; modelValue: EntryValue; readonly?: boolean; label: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: EntryValue] }>();
const { t } = useI18n();
const editor = ref<HTMLElement>();
const richParts = computed(() => props.modelValue.text.split(/(\*\*[^*]+\*\*|_[^_]+_)/g));
async function wrapSelection(marker: string) {
  const input = editor.value?.querySelector('textarea');
  if (!input) return;
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const text = props.modelValue.text;
  setText(text.slice(0, start) + marker + text.slice(start, end) + marker + text.slice(end));
  await nextTick();
  input.focus();
  input.setSelectionRange(start + marker.length, end + marker.length);
}
function setText(text: string) { emit('update:modelValue', { ...props.modelValue, text }); }
function setCell(index: number, field: 'parameter' | 'result', value: string) {
  emit('update:modelValue', { ...props.modelValue, rows: props.modelValue.rows.map((row, rowIndex) => rowIndex === index ? { ...row, [field]: value } : row) });
}
function addRow() { emit('update:modelValue', { ...props.modelValue, rows: [...props.modelValue.rows, { parameter: '', result: '' }] }); }
function removeRow(index: number) { emit('update:modelValue', { ...props.modelValue, rows: props.modelValue.rows.filter((_, rowIndex) => rowIndex !== index) }); }
</script>

<template>
  <div ref="editor" class="value-editor">
    <template v-if="item.format === 'table'">
      <div class="value-table-scroll">
        <table class="value-table">
          <thead><tr><th>{{ t('testing.parameter') }}</th><th>{{ t('testing.result') }}</th><th v-if="!readonly">{{ t('testing.actions') }}</th></tr></thead>
          <tbody><tr v-for="(row, index) in modelValue.rows" :key="index">
            <td><span v-if="readonly">{{ row.parameter || '—' }}</span><a-input v-else :model-value="row.parameter" :input-attrs="{ 'aria-label': `${label} ${t('testing.parameter')} ${index + 1}` }" @update:model-value="setCell(index, 'parameter', $event)" /></td>
            <td><span v-if="readonly">{{ row.result || '—' }}</span><a-input v-else :model-value="row.result" :input-attrs="{ 'aria-label': `${label} ${t('testing.result')} ${index + 1}` }" @update:model-value="setCell(index, 'result', $event)" /></td>
            <td v-if="!readonly"><a-button type="text" status="danger" :disabled="modelValue.rows.length <= 1" :aria-label="`${t('testing.removeRow')} ${index + 1}`" @click="removeRow(index)">{{ t('testing.removeRow') }}</a-button></td>
          </tr></tbody>
        </table>
      </div>
      <a-button v-if="!readonly" @click="addRow">{{ t('testing.addRow') }}</a-button>
    </template>
    <p v-else-if="readonly && item.format === 'rich'" class="read-value"><template v-for="(part, index) in richParts" :key="index"><strong v-if="part.startsWith('**') && part.endsWith('**')">{{ part.slice(2, -2) }}</strong><em v-else-if="part.startsWith('_') && part.endsWith('_')">{{ part.slice(1, -1) }}</em><template v-else>{{ part }}</template></template></p>
    <p v-else-if="readonly" class="read-value">{{ modelValue.text || '—' }}</p>
    <a-input v-else-if="item.format === 'number'" :model-value="modelValue.text" :input-attrs="{ inputmode: 'decimal', 'aria-label': label }" @update:model-value="setText" />
    <template v-else>
      <a-space v-if="item.format === 'rich'"><a-button size="small" @mousedown.prevent @click="wrapSelection('**')">{{ t('testing.bold') }}</a-button><a-button size="small" @mousedown.prevent @click="wrapSelection('_')">{{ t('testing.italic') }}</a-button></a-space>
      <a-textarea :model-value="modelValue.text" :textarea-attrs="{ 'aria-label': label }" :auto-size="{ minRows: item.format === 'text' ? 2 : 4, maxRows: 12 }" @update:model-value="setText" />
      <p v-if="item.format === 'ordered'" class="hint">{{ t('testing.orderedHint') }}</p>
      <p v-if="item.format === 'rich'" class="hint">{{ t('testing.richHint') }}</p>
    </template>
  </div>
</template>

<style scoped>
.value-editor { display: grid; gap: var(--mt-ds-space-3); min-width: 0; }
.value-table-scroll { overflow-x: auto; }
.value-table { border-collapse: collapse; width: 100%; min-width: 380px; }
.value-table th, .value-table td { text-align: left; font-weight: var(--mt-ds-weight-body); padding: var(--mt-ds-space-2); border-bottom: 1px solid var(--mt-ds-border); }
.value-table td { min-width: 120px; }
.read-value { margin: 0; white-space: pre-wrap; overflow-wrap: anywhere; }
.hint { margin: 0; color: var(--mt-ds-text-secondary); font-size: var(--mt-ds-font-caption); }
</style>

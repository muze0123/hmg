<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconPlusCircle, IconMinusCircle } from '@arco-design/web-vue/es/icon';
import AppFieldLabel from '../../../design/components/AppFieldLabel.vue';
const props = defineProps<{ modelValue: string; columns: string[]; readonly: boolean; label: string; inputPrefix: string }>();
const emit = defineEmits<{ 'update:modelValue': [string] }>();
const { t } = useI18n();
const names = computed(() => props.columns.length ? props.columns : [props.label]);
const lines = computed(() => (props.modelValue || Array(names.value.length).fill('').join('\t')).split('\n').map(line => names.value.map((_, index) => line.split('\t')[index] || '')));
function write(rows: string[][]) { if (!props.readonly) emit('update:modelValue', rows.map(row => row.join('\t')).join('\n')); }
function change(row: number, column: number, value: string) { const rows = lines.value.map(line => [...line]); rows[row]![column] = value; write(rows); }
function add(after: number) { const rows = lines.value.map(line => [...line]); rows.splice(after + 1, 0, names.value.map(() => '')); write(rows); }
function remove(index: number) { if (lines.value.length <= 1) return; write(lines.value.filter((_, row) => row !== index)); }
</script>
<template>
  <div class="table-value-scroll">
    <div class="table-value" :style="{'--table-columns': names.length}" role="group" :aria-label="label">
      <div v-for="(line,row) in lines" :key="row" class="table-value-row">
        <div v-for="(column,index) in names" :key="index" class="table-value-field">
          <AppFieldLabel v-if="row === 0" as="label" :for="`${inputPrefix}-${row}-${index}`" :text="column" />
          <a-input :model-value="line[index]" :disabled="readonly" :placeholder="t('configurationMatrix.enter')" :input-attrs="{id:`${inputPrefix}-${row}-${index}`,'aria-label':`${label} ${row + 1} ${column}`}" @update:model-value="value => change(row,index,value)" />
        </div>
        <div v-if="!readonly" class="table-value-actions">
          <a-tooltip :content="t('configurationMatrix.addTableRow')"><a-button type="text" :aria-label="t('configurationMatrix.addTableRowAt',{row:row+1,field:label})" @click="add(row)"><IconPlusCircle /></a-button></a-tooltip>
          <a-tooltip v-if="lines.length > 1" :content="t('configurationMatrix.removeTableRow')"><a-button type="text" :aria-label="t('configurationMatrix.removeTableRowAt',{row:row+1,field:label})" @click="remove(row)"><IconMinusCircle /></a-button></a-tooltip>
        </div>
      </div>
    </div>
  </div>
</template>
<style scoped>
.table-value-scroll { min-width: 0; max-width: 100%; overflow-x: auto; }
.table-value { min-width: calc(var(--table-columns) * 160px + 64px); }
.table-value-row { display: grid; grid-template-columns: repeat(var(--table-columns), minmax(0,1fr)) 64px; align-items: end; gap: var(--mt-ds-space-3); margin-bottom: var(--mt-ds-space-3); }
.table-value-row:last-child { margin-bottom: 0; }
.table-value-field :deep(.arco-input-wrapper.arco-input-disabled),
.table-value-field :deep(.arco-input-wrapper.arco-input-disabled:hover) { background-color:var(--app-surface); border-color:var(--app-control-border); color:var(--color-text-1); }
.table-value-field :deep(.arco-input[disabled]) { color:var(--color-text-1); -webkit-text-fill-color:var(--color-text-1); opacity:1; }
.table-value-field :deep(.arco-input[disabled]::placeholder) { color:var(--color-text-3); -webkit-text-fill-color:var(--color-text-3); }
.table-value-field { min-width: 0; display: grid; gap: var(--mt-ds-space-2); }
.table-value-actions { display: flex; align-items: center; min-height: var(--mt-ds-control-height); }
.table-value-actions .arco-btn { display: inline-grid; place-items: center; width: 28px; height: 28px; padding: 0; color: var(--color-text-3); }
.table-value-actions :deep(.arco-icon) { font-size:18px; }
.table-value-actions .arco-btn:hover { color: var(--app-color-primary); }
</style>

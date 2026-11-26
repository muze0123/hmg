<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import RichValue from '../../vehicle/components/RichValue.vue';
import type { Field } from '../../../shared/api/hmg';
const props=defineProps<{ field:Field; modelValue:unknown; disabled?:boolean }>();
const emit=defineEmits<{ 'update:modelValue':[unknown] }>();
const { t, locale }=useI18n();
const rows=computed<Record<string,unknown>[]>(()=>Array.isArray(props.modelValue)?props.modelValue:[]);
function cell(index:number,key:string,value:unknown) { emit('update:modelValue',rows.value.map((row,i)=>i===index?{...row,[key]:value}:row)); }
</script>
<template>
  <div v-if="field.format==='TABLE'" class="table-field"><div class="table-scroll"><table><thead><tr><th v-for="column in field.columns" :key="column.id">{{ column.label }}</th><th v-if="!disabled">{{ t('connected.actions') }}</th></tr></thead><tbody><tr v-for="(row,index) in rows" :key="index"><td v-for="column in field.columns" :key="column.id"><span v-if="disabled">{{ row[column.id] ?? '—' }}</span><a-input-number v-else-if="column.format==='NUMBER'" :model-value="typeof row[column.id]==='number'?row[column.id] as number:undefined" :disabled="disabled" :input-attrs="{'aria-label': column.label}" @update:model-value="cell(index,column.id,$event)" /><a-input v-else :model-value="String(row[column.id]??'')" :disabled="disabled" :input-attrs="{'aria-label': column.label}" @update:model-value="cell(index,column.id,$event)" /></td><td v-if="!disabled"><a-button type="text" status="danger" @click="emit('update:modelValue',rows.filter((_,i)=>i!==index))">{{ t('connected.remove') }}</a-button></td></tr></tbody></table></div><a-button v-if="!disabled" @click="emit('update:modelValue',[...rows,{}])">{{ t('connected.addRow') }}</a-button></div>
  <RichValue :key="`${field.id}-${locale}-${!!disabled}`" v-else-if="field.format==='RICH'" :model-value="String(modelValue??'')" :readonly="!!disabled" :input-id="`connected-rich-${field.id}`" :label="field.label" @update:model-value="emit('update:modelValue',$event)" />
  <p v-else-if="disabled" class="readonly-value">{{ modelValue ?? '—' }}</p>
  <a-input-number v-else-if="field.format==='NUMBER'||field.format==='ORDERED'" :model-value="typeof modelValue==='number'?modelValue:undefined" :disabled="disabled" :input-attrs="{'aria-label': field.label}" @update:model-value="emit('update:modelValue',$event)" />
  <a-input v-else :model-value="String(modelValue??'')" :disabled="disabled" :input-attrs="{'aria-label': field.label}" @update:model-value="emit('update:modelValue',$event)" />
</template>
<style scoped>
.table-field { width:100%; min-width:0; }.table-scroll { overflow-x:auto; margin-bottom:var(--mt-ds-space-2); }table { width:100%; border-collapse:collapse; }th,td { padding:var(--mt-ds-space-2); border-bottom:1px solid var(--mt-ds-border); text-align:left; font-weight:400; }td { min-width:160px; }
.readonly-value { margin:0; white-space:pre-wrap; overflow-wrap:anywhere; }
</style>

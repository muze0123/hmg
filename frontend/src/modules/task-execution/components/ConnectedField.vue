<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import type { Field } from '../../../shared/api/hmg';
const props=defineProps<{ field:Field; modelValue:unknown; disabled?:boolean }>();
const emit=defineEmits<{ 'update:modelValue':[unknown] }>();
const { t }=useI18n();
const rows=computed<Record<string,unknown>[]>(()=>Array.isArray(props.modelValue)?props.modelValue:[]);
function cell(index:number,key:string,value:unknown) { emit('update:modelValue',rows.value.map((row,i)=>i===index?{...row,[key]:value}:row)); }
</script>
<template>
  <div v-if="field.format==='TABLE'" class="table-field"><div class="table-scroll"><table><thead><tr><th v-for="column in field.columns" :key="column.id">{{ column.label }}</th><th v-if="!disabled">{{ t('connected.actions') }}</th></tr></thead><tbody><tr v-for="(row,index) in rows" :key="index"><td v-for="column in field.columns" :key="column.id"><a-input-number v-if="column.format==='NUMBER'" :model-value="typeof row[column.id]==='number'?row[column.id] as number:undefined" :disabled="disabled" :aria-label="column.label" @update:model-value="cell(index,column.id,$event)" /><a-input v-else :model-value="String(row[column.id]??'')" :disabled="disabled" :aria-label="column.label" @update:model-value="cell(index,column.id,$event)" /></td><td v-if="!disabled"><a-button type="text" status="danger" @click="emit('update:modelValue',rows.filter((_,i)=>i!==index))">{{ t('connected.remove') }}</a-button></td></tr></tbody></table></div><a-button v-if="!disabled" @click="emit('update:modelValue',[...rows,{}])">{{ t('connected.addRow') }}</a-button></div>
  <a-input-number v-else-if="field.format==='NUMBER'||field.format==='ORDERED'" :model-value="typeof modelValue==='number'?modelValue:undefined" :disabled="disabled" :aria-label="field.label" @update:model-value="emit('update:modelValue',$event)" />
  <a-textarea v-else-if="field.format==='RICH'" :model-value="String(modelValue??'')" :disabled="disabled" :aria-label="field.label" @update:model-value="emit('update:modelValue',$event)" />
  <a-input v-else :model-value="String(modelValue??'')" :disabled="disabled" :aria-label="field.label" @update:model-value="emit('update:modelValue',$event)" />
</template>
<style scoped>
.table-field { width:100%; min-width:0; }.table-scroll { overflow-x:auto; margin-bottom:var(--mt-ds-space-2); }table { width:100%; border-collapse:collapse; }th,td { padding:var(--mt-ds-space-2); border-bottom:1px solid var(--mt-ds-border); text-align:left; font-weight:400; }td { min-width:160px; }
</style>

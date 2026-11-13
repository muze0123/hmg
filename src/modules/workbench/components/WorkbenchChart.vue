<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { init, use, registerTheme, type ECharts, type EChartsCoreOption } from 'echarts/core';
import { PieChart, BarChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent, GridComponent, GraphicComponent, AriaComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
use([PieChart, BarChart, TooltipComponent, LegendComponent, GridComponent, GraphicComponent, AriaComponent, CanvasRenderer]);
registerTheme('metritag-workbench', { textStyle: { fontFamily: 'inherit' } });
const props = defineProps<{ option: EChartsCoreOption; summary: string }>();
const host = ref<HTMLDivElement>();
let chart: ECharts | undefined;
let resize: ResizeObserver | undefined;
function render() { chart?.setOption(props.option, { notMerge: true }); }
onMounted(() => { if (!host.value) return; chart = init(host.value, 'metritag-workbench'); render(); resize = new ResizeObserver(()=>chart?.resize()); resize.observe(host.value); });
watch(()=>props.option, render, { deep: true });
onBeforeUnmount(()=>{ resize?.disconnect(); chart?.dispose(); });
</script>
<template><div ref="host" class="wb-chart" role="img" tabindex="0" :aria-label="summary"/><span class="sr-only">{{ summary }}</span></template>
<style scoped>.wb-chart{width:100%;height:240px;min-width:0}.wb-chart:focus-visible{outline:2px solid var(--app-color-primary);outline-offset:2px}.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%)}</style>

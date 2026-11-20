<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, ref, watch, type Component } from 'vue';
import { useI18n } from 'vue-i18n';
import { IconDownload } from '@arco-design/web-vue/es/icon';
import '@vue-office/docx/lib/v3/index.css';
import '@vue-office/excel/lib/v3/index.css';
import type { ArchiveProject, Deliverable } from '../data/archive';
import { createArchiveFile, fileExtension, previewKind } from '../data/preview';

/**
 * 交付物在线预览（DESIGN.md · 项目归档，2026-11-13 用户裁决）。
 *
 * 第三方插件按扩展名分派：@vue-office/pdf → PDF，@vue-office/docx → Word，
 * @vue-office/excel → Excel；txt / json 等纯文本走原生渲染。每个插件按需异步加载，
 * 不进入首屏包。文件内容由 createArchiveFile 生成，接入档案服务后换成后端地址即可。
 */
const props = defineProps<{
  visible: boolean;
  row?: Deliverable;
  project: ArchiveProject;
}>();
const emit = defineEmits<{
  'update:visible': [value: boolean];
  download: [row: Deliverable];
}>();

const { t } = useI18n();
const asComponent = (loader: () => Promise<{ default: unknown }>) =>
  defineAsyncComponent(() => loader().then((module) => module.default as unknown as Component));
const OfficePdf = asComponent(() => import('@vue-office/pdf'));
const OfficeDocx = asComponent(() => import('@vue-office/docx'));
const OfficeExcel = asComponent(() => import('@vue-office/excel'));

const TEXT_EXTENSIONS = new Set(['txt', 'json', 'md', 'csv', 'log', 'xml']);
const name = computed(() => props.row?.name ?? '');
const kind = computed(() => previewKind(name.value));
const unsupported = computed(() => kind.value === 'text' && !TEXT_EXTENSIONS.has(fileExtension(name.value)));

const src = ref('');
const textContent = ref('');
const loading = ref(false);
const failed = ref(false);
const rendered = ref(false);
let objectUrl = '';

function revoke() {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  objectUrl = '';
  src.value = '';
}
async function generate() {
  if (!props.visible || !props.row) return;
  const row = props.row;
  loading.value = true;
  failed.value = false;
  rendered.value = false;
  textContent.value = '';
  revoke();
  try {
    const blob = await createArchiveFile(row, props.project);
    if (!props.visible) return;
    if (kind.value === 'text') textContent.value = await blob.text();
    objectUrl = URL.createObjectURL(blob);
    src.value = objectUrl;
    loading.value = false;
  } catch {
    failed.value = true;
    loading.value = false;
  }
}
function close() { emit('update:visible', false); }
function onRendered() { rendered.value = true; }
function onError() { failed.value = true; loading.value = false; }

watch(() => [props.visible, props.row] as const, ([visible]) => {
  if (visible) void generate();
  else revoke();
}, { immediate: true });
onBeforeUnmount(revoke);
</script>

<template>
  <a-modal
    :visible="visible"
    :title="name || t('archive.previewTitle')"
    :width="880"
    :mask-closable="true"
    :esc-to-close="true"
    class="archive-preview-modal"
    @update:visible="emit('update:visible', $event)"
    @close="close"
  >
    <div class="preview-body" :data-preview-kind="kind" :data-rendered="rendered">
      <div v-if="loading" class="preview-state">{{ t('archive.previewLoading') }}</div>
      <div v-else-if="failed" class="preview-state">
        <span>{{ t('archive.previewError') }}</span>
        <a-button type="text" @click="generate">{{ t('archive.retry') }}</a-button>
      </div>
      <div v-else-if="unsupported" class="preview-state">{{ t('archive.previewUnsupported') }}</div>
      <pre v-else-if="kind === 'text' && src" class="preview-text">{{ textContent }}</pre>
      <div v-else-if="src" class="preview-frame">
        <component :is="OfficePdf" v-if="kind === 'pdf'" :src="src" @rendered="onRendered" @error="onError" />
        <component :is="OfficeDocx" v-else-if="kind === 'docx'" :src="src" @rendered="onRendered" @error="onError" />
        <component :is="OfficeExcel" v-else-if="kind === 'excel'" :src="src" @rendered="onRendered" @error="onError" />
      </div>
    </div>
    <template #footer>
      <a-button @click="close">{{ t('archive.close') }}</a-button>
      <a-button v-if="row" type="primary" @click="emit('download', row)">
        <template #icon><IconDownload /></template>{{ t('archive.download') }}
      </a-button>
    </template>
  </a-modal>
</template>

<style scoped>
/* 预览器需要确定的高度；横向溢出留在预览区内，不外溢到弹窗壳。 */
.preview-body { height: min(62vh, 620px); padding: 0; overflow: auto; background: var(--app-surface); }
.preview-frame { height: 100%; min-height: 420px; }
.preview-state { display: flex; align-items: center; justify-content: center; gap: 8px; height: 100%; color: var(--color-text-3); font-size: 14px; }
.preview-text { margin: 0; padding: 16px; white-space: pre-wrap; overflow-wrap: anywhere; color: var(--app-text-primary); font-size: 14px; line-height: 22px; }
.preview-body :deep(.vue-office-docx), .preview-body :deep(.vue-office-excel), .preview-body :deep(.vue-office-pdf) { height: 100%; }
</style>

<script setup lang="ts">
/**
 * 富文本字段值编辑器（所见即所得）。
 *
 * 基于 wangEditor，工具栏仿平台富文本样式，并按 2026-11-17 用户裁决移除
 * 加粗（bold）与斜体（italic）按钮——其余字体 / 字号 / 下划线 / 删除线 /
 * 颜色 / 背景色 / 对齐 / 列表 / 缩进 / 链接 / 图片 / 表格均保留。
 *
 * 数据兼容：历史富文本值是纯文本（如「技术参数已按产品参数表核对。」），
 * wangEditor 以 HTML 为内容模型；纯文本能被编辑器直接当作文本节点加载，
 * 只读态使用安全标签白名单保留正文、图片、链接和表格。
 */
import { computed, onBeforeUnmount, ref, shallowRef, watch, type ShallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { Message } from '@arco-design/web-vue';
import { DomEditor, i18nChangeLanguage, type IDomEditor } from '@wangeditor/editor';
import { Editor, Toolbar } from '@wangeditor/editor-for-vue';
import '@wangeditor/editor/dist/css/style.css';
import { isRichImage, readRichImage, RICH_IMAGE_MAX_BYTES, RICH_IMAGE_TYPES, safeRichHtml } from '../../task-execution/utils/richText';
const props = defineProps<{ readonly: boolean; readonlyAsEditor?: boolean; label: string; inputId: string }>();
const value = defineModel<string>({ default: '' });
const { t, locale } = useI18n();
i18nChangeLanguage(locale.value === 'en-US' ? 'en' : 'zh-CN');

/** 选择器选项与文案走 i18n，编辑器本身的工具栏使用 wangEditor 内置图标。 */
const toolbarConfig = {
  toolbarKeys: [
    'fontFamily', 'fontSize',
    // bold / italic 按用户裁决移除（wangEditor 内建 key 为 bold / italic）
    'underline', 'through',
    'color', 'bgColor',
    // 对齐在此版本无 'justify' 组合键，展开为四个独立键
    'justifyLeft', 'justifyCenter', 'justifyRight', 'justifyJustify',
    'bulletedList', 'numberedList',
    'indent', 'delIndent',
    'insertLink', 'unLink', 'insertImage', 'uploadImage', 'insertTable',
  ],
};
interface WangEditor { destroy?: () => void; isDestroyed?: boolean; getHtml?: () => string; enable?: () => void; disable?: () => void }
type InsertImage = (url: string, alt: string, href: string) => void;
const editorRef: ShallowRef<WangEditor | null> = shallowRef<WangEditor | null>(null);
const pendingImages = ref(0);
const imageBusy = computed(() => pendingImages.value > 0);
let disposed = false;
/** wangEditor's upload, paste and file-drop paths share this callback. */
async function uploadRichImage(file: File, insert: InsertImage) {
  if (props.readonly || disposed) return;
  if (!isRichImage(file)) { Message.error(t('richImages.unsupported')); return; }
  if (file.size > RICH_IMAGE_MAX_BYTES) { Message.error(t('richImages.tooLarge')); return; }
  const editor = editorRef.value;
  if (!editor || editor.isDestroyed) return;
  pendingImages.value++;
  try {
    const url = await readRichImage(file);
    if (!disposed && !editor.isDestroyed && editorRef.value === editor) insert(url, file.name, '');
  } catch {
    if (!disposed) Message.error(t('richImages.failed'));
  } finally { pendingImages.value--; }
}
defineExpose({ imageBusy });
const editorConfig = computed(() => ({
  placeholder: t('vehicleFill.richPlaceholder'),
  readOnly: props.readonly,
  autoFocus: false,
  MENU_CONF: {
    uploadImage: {
      allowedFileTypes: [...RICH_IMAGE_TYPES],
      maxFileSize: RICH_IMAGE_MAX_BYTES,
      base64LimitSize: 0,
      customUpload: uploadRichImage,
    },
  } as Record<string, unknown>,
}));

const preview = computed(() => safeRichHtml(value.value || ''));

let initialHtml = '';
let initialModel = value.value;
let firstChange = true;
function handleCreated(editor: WangEditor) { editorRef.value = editor; initialHtml = editor.getHtml?.() || ''; initialModel = value.value; firstChange = true; }
function updateHtml(html: string) {
  if (props.readonly) return;
  // Opening an inline editor may normalize plain text/empty HTML; that is not a user edit.
  if (firstChange) { firstChange = false; if (html === initialHtml && value.value === initialModel) return; }
  value.value = html;
}
function destroyEditor() {
  const editor = editorRef.value;
  editorRef.value = null;
  if (editor && !editor.isDestroyed) {
    // wangEditor 5.1.x removes the listener but leaves its queued selection debounce alive.
    // Cancel it before destroying an inline editor during a parameter switch.
    const textarea = DomEditor.getTextarea(editor as IDomEditor) as unknown as { onDOMSelectionChange?: { cancel?: () => void } };
    textarea.onDOMSelectionChange?.cancel?.();
    editor.destroy?.();
  }
}
watch(() => props.readonly, readonly => {
  if (props.readonlyAsEditor) { if (readonly) editorRef.value?.disable?.(); else editorRef.value?.enable?.(); }
  else if (readonly) destroyEditor();
});
onBeforeUnmount(() => { disposed = true; destroyEditor(); });
</script>
<template>
  <div class="rich-value">
    <div v-if="readonly && !readonlyAsEditor" class="rich-preview" v-html="preview || '—'" />
    <template v-else>
      <div class="rich-toolbar-host">
        <Toolbar :editor="editorRef" :default-config="toolbarConfig" mode="default" />
      </div>
      <div :id="inputId" class="rich-editor-host" :aria-label="label">
        <Editor :model-value="value" @update:model-value="updateHtml" :default-config="editorConfig" :mode="'default'" @on-created="handleCreated" />
      </div>
    </template>
  </div>
</template>
<style scoped>
/* 宽度由外层抽屉白卡 .value-drawer-group 统一控制，这里填满容器即可，
   保证富文本区块与表格 div 左右间距一致（均为卡片 16px 内边距）。 */
.rich-value { width: 100%; max-width: 100%; min-width: 0; }
.rich-toolbar-host { border: 1px solid var(--app-control-border); border-bottom: 0; background: var(--app-surface); }
/* 编辑输入区调高调大：宿主与 wangEditor 文本容器同步给足最小高度，内容多时继续自然增高。 */
.rich-editor-host { border: 1px solid var(--app-control-border); background: var(--app-surface); min-height: 340px; }
.rich-preview { overflow-wrap: anywhere; overflow-x: auto; }
.rich-preview :deep(img) { max-width: 100%; height: auto; }
.rich-preview :deep(table) { border-collapse: collapse; }
.rich-preview :deep(td), .rich-preview :deep(th) { border: 1px solid var(--app-divider); padding: var(--mt-ds-space-2); }
.rich-value :deep(.w-e-text-container) { background: var(--app-surface); min-height: 340px; }
.rich-value :deep(.w-e-text-placeholder) { color: var(--color-text-4); }
/* 主题色适配：wangEditor 默认蓝色，覆盖为项目主色（亮 #0DB9C6 / 暗随之）。 */
.rich-value :deep(.w-e-toolbar .w-e-bar-item button:hover),
.rich-value :deep(.w-e-toolbar .w-e-bar-item button.active) { color: var(--app-color-primary); }
.rich-value :deep(.w-e-toolbar .w-e-bar-item .w-e-dropdown-panel .w-e-panel-content a:hover) { color: var(--app-color-primary); }
</style>

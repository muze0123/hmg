<script setup lang="ts">
import { computed, useId } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  IconCheckCircle,
  IconClose,
  IconCloseCircle,
  IconExclamationCircle,
  IconInfoCircle,
  IconQuestionCircle,
} from '@arco-design/web-vue/es/icon';

/**
 * 全站统一的「提示 / 问号确认 / 告警 / 成功」类居中弹窗（DESIGN.md · Confirmation dialogs）。
 * 参考稿四段式结构：状态图标 → 标题 → 可选副标题 → 底部操作区；
 * 标题栏不放文字，只保留右上角 X；按钮渲染在 Arco 的独立 footer 区块里。
 *
 * 按钮文案默认走 i18n 的 common.*，调用方应传入业务文案 t(...)。
 * 组件只做模板挂载（不命令式挂载），保证 useI18n() 的注入上下文可用。
 */
type IconKind = 'question' | 'info' | 'warning' | 'success' | 'danger';

const props = withDefaults(
  defineProps<{
    visible: boolean;
    unsaved?: boolean;
    /** 状态图标语义：question 问号确认 / info 提示 / warning 告警 / success 成功 / danger 危险。 */
    icon?: IconKind;
    /** 标题不加粗（2026-11-24 用户裁决）：撤回类二次确认弹窗标题用常规字重（400）。 */
    plainTitle?: boolean;
    title: string;
    /** 副标题：单段文本或多行文本（多行逐行渲染、统一左对齐）。 */
    description?: string | string[];
    /** 单按钮模式（纯提示）：只显示一个「我知道了」。 */
    single?: boolean;
    okText?: string;
    cancelText?: string;
    ackText?: string;
    okLoading?: boolean;
    cancelDisabled?: boolean;
    /** false 时 X / Esc / 遮罩 / 取消都不允许关闭，用于进行中的异步操作。 */
    dismissible?: boolean;
    width?: number | string;
  }>(),
  {
    icon: 'question',
    plainTitle: false,
    unsaved: false,
    description: '',
    single: false,
    okLoading: false,
    cancelDisabled: false,
    dismissible: true,
    width: 'var(--mt-ds-confirm-width)',
  },
);

const emit = defineEmits<{
  (event: 'update:visible', value: boolean): void;
  (event: 'confirm'): void;
}>();

const { t } = useI18n();
const titleId = useId();

const iconComponents = {
  question: IconQuestionCircle,
  info: IconInfoCircle,
  warning: IconExclamationCircle,
  success: IconCheckCircle,
  danger: IconCloseCircle,
};
const iconComponent = computed(() => iconComponents[props.icon]);
/** 取消按钮加粗（2026-11-24 用户裁决）：删除 / 未保存等确认类弹窗加粗；info 提示类（导出等）与单按钮模式不加粗。 */
const strongCancel = computed(() => !props.single && props.icon !== 'info');
const descriptionLines = computed(() =>
  Array.isArray(props.description)
    ? props.description.filter(Boolean)
    : props.description
      ? [props.description]
      : [],
);

function close() {
  if (!props.dismissible) return;
  emit('update:visible', false);
}
function onCancel() {
  if (props.cancelDisabled) return;
  close();
}
</script>

<template>
  <a-modal
    :visible="visible"
    :width="width"
    :title="''"
    :closable="false"
    role="dialog"
    aria-modal="true"
    :esc-to-close="dismissible"
    :aria-labelledby="titleId"
    :mask-closable="dismissible"
    class="app-confirm-dialog"
    :class="{ 'app-confirm-unsaved': unsaved }"
    @cancel="close"
  >
    <template #title>
      <a-button v-if="dismissible" type="text" class="mt-confirm-close" :aria-label="t('designSystem.close')" @click="close"><IconClose /></a-button>
    </template>
    <div class="app-confirm-main">
      <span class="app-confirm-icon-slot" aria-hidden="true"><component
        :is="iconComponent"
        class="app-confirm-icon"
        :class="`app-confirm-icon-${icon}`"
      /></span>
      <div class="app-confirm-copy">
        <p :id="titleId" class="app-confirm-title" :class="{ 'app-confirm-title-plain': plainTitle }">{{ unsaved ? t('designSystem.unsaved') : title }}</p>
        <p v-for="(line, index) in descriptionLines" :key="index" class="app-confirm-desc">{{ line }}</p>
      </div>
    </div>

    <template #footer>
      <a-button v-if="single" type="primary" @click="close">{{ ackText ?? t('designSystem.acknowledge') }}</a-button>
      <template v-else>
        <a-button class="app-btn-neutral" :class="{ 'app-confirm-cancel-strong': strongCancel }" :disabled="cancelDisabled" @click="onCancel">
          {{ cancelText ?? t('designSystem.cancel') }}
        </a-button>
        <a-button type="primary" :loading="okLoading" @click="!okLoading && emit('confirm')">
          {{ okText ?? t(unsaved ? 'designSystem.abandon' : 'designSystem.confirm') }}
        </a-button>
      </template>
    </template>
  </a-modal>
</template>

<style scoped>
/* The shell styles below follow the teleported Arco container. */
/* 图标与标题间距 10px、图标与弹窗左边 20px（2026-11-24 用户裁决，全局统一，含 unsaved 变体）。 */
.app-confirm-main { display: flex; align-items: flex-start; gap: var(--mt-ds-confirm-icon-gap); width: 100%; min-width: 0; }
.app-confirm-icon-slot { display:flex; align-items:center; justify-content:center; flex:none; width:var(--mt-ds-confirm-icon); height:var(--mt-ds-line-title); }
.app-confirm-icon { font-size:var(--mt-ds-confirm-icon); flex: none; color: var(--app-confirm-icon); }
.app-confirm-icon-success { color: rgb(var(--success-6)); }
.app-confirm-icon-danger { color: rgb(var(--danger-6)); }
.app-confirm-copy { min-width: 0; }
.mt-confirm-close { position: absolute; top: var(--mt-ds-space-2); right: var(--mt-ds-space-2); padding: 0; width: var(--mt-ds-control-height); height: var(--mt-ds-control-height); color: var(--mt-ds-text-secondary); }
.app-confirm-title {
  margin: 0;
  font-size: var(--mt-ds-font-title);
  font-weight: var(--mt-ds-weight-title);
  line-height: var(--mt-ds-line-title);
  color: var(--color-text-1);
  overflow-wrap: anywhere;
}
.app-confirm-desc {
  margin: var(--mt-ds-space-2) 0 0;
  font-size: var(--mt-ds-font-body);
  font-weight: var(--mt-ds-weight-body);
  line-height: var(--mt-ds-line-body);
  color: var(--app-confirm-desc);
  overflow-wrap: anywhere;
}
.app-confirm-desc + .app-confirm-desc { margin-top: var(--mt-ds-space-1); }

.app-confirm-unsaved .app-confirm-title { font-size: var(--mt-ds-font-body); line-height: var(--mt-ds-line-body); font-weight: var(--mt-ds-weight-body); }
/* unsaved 变体的主行间距不再放宽：间距统一 10px（2026-11-24）。 */
/* 取消按钮加粗：确认类（非 info）弹窗的取消文本 600。 */
.app-confirm-cancel-strong { font-weight: var(--mt-ds-weight-title); }
/* 撤回类弹窗标题不加粗（2026-11-24）：常规字重 400，尺寸与行高不变。 */
.app-confirm-title-plain { font-weight: var(--mt-ds-weight-body); }
</style>

<style>
.app-confirm-dialog .arco-modal {
  display: inline-flex;
  flex-direction: column;
  position: relative;
  height: var(--mt-ds-confirm-min-height);
  min-height: var(--mt-ds-confirm-min-height);
  max-height: calc(100dvh - var(--mt-ds-space-5) * 2);
  max-width: calc(100vw - var(--mt-ds-space-5) * 2);
}
.app-confirm-dialog .arco-modal-header {
  flex: none;
  height: var(--mt-ds-dialog-header-height);
  padding: 0 var(--mt-ds-space-5);
  justify-content: flex-end;
  border-bottom: 0;
}
.app-confirm-dialog .arco-modal-title { display: flex; justify-content: flex-end; }
.app-confirm-dialog .arco-modal-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  align-items: center;
  padding: var(--mt-ds-space-6) var(--mt-ds-space-5);
}
/* 与「表单弹窗 footer 带 1px 上描边」相对：确认类弹窗的 footer 不描边，靠留白分区 */
body .app-confirm-dialog .arco-modal-footer {
  flex: none;
  padding: var(--mt-ds-space-4) var(--mt-ds-space-5) var(--mt-ds-space-5);
  border-top: 0;
  text-align: right;
}
/* Unsaved-change composition follows the supplied reference. */
/* 左内边距与普通确认弹窗一致 20px（2026-11-24 间距统一裁决）。 */
.app-confirm-unsaved .arco-modal-body { padding-left: var(--mt-ds-space-5); padding-right: var(--mt-ds-space-5); }
.app-confirm-unsaved .arco-modal-footer .arco-btn { min-width: 90px; }
.app-confirm-unsaved .arco-modal-footer .app-btn-neutral { background: var(--app-surface); border: 1px solid var(--mt-ds-border); color: var(--mt-ds-text); }
.app-confirm-unsaved .arco-modal-footer .arco-btn-primary { background: var(--app-color-primary); border-color: var(--app-color-primary); }
.app-confirm-unsaved .arco-modal-footer .arco-btn-primary:hover { background: rgb(var(--primary-5)); border-color: rgb(var(--primary-5)); }
@media (prefers-reduced-motion: reduce) {
  .app-confirm-dialog .arco-modal, .app-confirm-dialog .arco-modal-mask { animation: none !important; transition: none !important; }
}
</style>

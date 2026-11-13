<script setup lang="ts">
/**
 * 新建 / 编辑 / 复制任务抽屉（2026-11-12 用户裁决，1:1 复刻「功能数据安全合规自评」工作台-新建任务抽屉）。
 * 任务名称（必填 ≤50，全局唯一）/ 任务描述（≤200）/ 优先级单选（默认中）/
 * 截止时间（到日）/ 附件（≤5 个、单文件 ≤20MB、Word/Excel/PDF/PNG/JPEG）/
 * 任务编排（必选，选中后展示缩略流程预览 + 编辑编排入口）。
 * 确定 → 新建任务进入列表且状态为「待处理」；编辑 → 更新基础字段；复制 → 以源任务预填并加「（副本）」。
 * copySource（复制）/ editSource（编辑）二选一；都不传则为纯新建。
 */
import { computed, reactive, ref, watch } from 'vue';
import { Message, type FileItem } from '@arco-design/web-vue';
import { IconEdit } from '@arco-design/web-vue/es/icon';
import { useI18n } from 'vue-i18n';
import {
  createProject, updateProject, MOCK_CURRENT_USER, projects, TASK_ORCHESTRATIONS,
  type Project, type TaskPriority, type Attachment,
} from '../data/projects';

const visible = defineModel<boolean>('visible');
const props = withDefaults(defineProps<{ copySource?: Project | null; editSource?: Project | null }>(), { copySource: null, editSource: null });
const emit = defineEmits<{ created: []; editOrchestration: [orchestrationId: string] }>();
const { t } = useI18n({ useScope: 'global' });

const mode = computed<'create' | 'edit'>(() => (props.editSource ? 'edit' : 'create'));
const saving = ref(false);
const formRef = ref<{ validate: () => Promise<unknown>; scrollToField: (field: string) => void } | null>(null);
const form = reactive({
  taskName: '', taskDescription: '', priority: 'medium' as TaskPriority, deadline: '', orchestrationId: '',
});
const initial = ref('');
const dirty = computed(() => JSON.stringify({ ...form }) !== initial.value);

/** 附件：仅保留文件名与大小（mock 不落真实文件），上限 5 个、单文件 20MB */
const MAX_FILES = 5;
const MAX_FILE_SIZE = 20 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.doc', '.docx', '.xls', '.xlsx', '.pdf', '.png', '.jpg', '.jpeg'];
const fileItems = ref<FileItem[]>([]);
const copiedSizes = ref<Map<string, number>>(new Map());

const orchestrationOptions = computed(() => TASK_ORCHESTRATIONS.map((item) => ({ value: item.id, label: item.name })));
const selectedOrchestration = computed(() => TASK_ORCHESTRATIONS.find((item) => item.id === form.orchestrationId) ?? null);

const rules = computed(() => ({
  taskName: [
    { required: true, message: t('projects.taskCreate.nameRequired') },
    {
      validator: (_value: string, callback: (error?: string) => void) => {
        const name = form.taskName.trim();
        const duplicated = projects.value.some((record) => record.name === name && record.id !== props.editSource?.id);
        if (name && duplicated) callback(t('projects.taskCreate.nameDuplicated'));
        else callback();
      },
    },
  ],
  orchestrationId: [{ required: true, message: t('projects.taskCreate.orchestrationRequired') }],
}));

function resetForm() {
  const src = props.copySource ?? props.editSource;
  form.taskName = props.copySource ? `${src?.name ?? ''}（副本）` : (props.editSource?.name ?? '');
  form.taskDescription = src?.description ?? '';
  form.priority = (src?.priority ?? 'medium') as TaskPriority;
  form.deadline = src?.deadline ?? '';
  form.orchestrationId = src?.orchestrationId ?? '';
  copiedSizes.value = new Map();
  fileItems.value = (src?.attachments ?? []).map((item, index) => {
    const uid = `copy-${index}`;
    copiedSizes.value.set(uid, item.size);
    return { uid, name: item.name } as FileItem;
  });
  initial.value = JSON.stringify({ ...form });
}

watch(visible, (open) => { if (open) resetForm(); });

function onFilesChange(fileList: FileItem[]) {
  if (fileList.length > MAX_FILES) {
    Message.warning(t('projects.taskCreate.tooManyFiles', { count: MAX_FILES }));
    return;
  }
  const accepted: FileItem[] = [];
  for (const file of fileList) {
    const name = file.file?.name ?? file.name ?? '';
    const size = file.file?.size ?? 0;
    const extension = name.slice(name.lastIndexOf('.')).toLowerCase();
    if (extension && !ACCEPTED_EXTENSIONS.includes(extension)) {
      Message.error(t('projects.taskCreate.fileTypeUnsupported', { name }));
      continue;
    }
    if (size > MAX_FILE_SIZE) {
      Message.error(t('projects.taskCreate.fileTooLarge', { name }));
      continue;
    }
    accepted.push(file);
  }
  fileItems.value = accepted;
}

function removeFile(uid: string | number) {
  fileItems.value = fileItems.value.filter((item) => item.uid !== uid);
}

/** 编辑编排：跳转天枢平台「任务编排」编辑页（预留接口，事件触发 + 引导提示） */
function editOrchestration() {
  if (!form.orchestrationId) return;
  emit('editOrchestration', form.orchestrationId);
  Message.info(t('projects.taskCreate.orchestrationTodo'));
}

async function confirmSave() {
  if (saving.value) return;
  const errors = await formRef.value?.validate();
  if (errors) {
    formRef.value?.scrollToField(Object.keys(errors as Record<string, unknown>)[0]);
    return;
  }
  saving.value = true;
  try {
    const attachments: Attachment[] | undefined = fileItems.value.length
      ? fileItems.value.map((item) => ({
          name: item.file?.name ?? item.name ?? '',
          size: item.file?.size ?? copiedSizes.value.get(String(item.uid)) ?? 0,
        }))
      : undefined;
    if (mode.value === 'edit' && props.editSource) {
      updateProject(props.editSource.id, {
        name: form.taskName.trim(),
        ...(form.taskDescription.trim() ? { description: form.taskDescription.trim() } : {}),
        priority: form.priority,
        ...(form.deadline ? { deadline: form.deadline } : {}),
        orchestrationId: form.orchestrationId,
        ...(attachments ? { attachments } : {}),
      });
      Message.success(t('projects.taskCreate.updated'));
    } else {
      createProject({
        name: form.taskName.trim(),
        ...(form.taskDescription.trim() ? { description: form.taskDescription.trim() } : {}),
        priority: form.priority,
        ...(form.deadline ? { deadline: form.deadline } : {}),
        orchestrationId: form.orchestrationId,
        ...(attachments ? { attachments } : {}),
      });
      Message.success(t('projects.taskCreate.success', { user: MOCK_CURRENT_USER.name }));
    }
    emit('created');
    visible.value = false;
  } finally {
    saving.value = false;
  }
}

function cancelSave() {
  if (saving.value) return;
  if (dirty.value && !window.confirm(t('projects.taskCreate.unsaved'))) return;
  visible.value = false;
}
</script>

<template>
  <a-drawer
    v-model:visible="visible"
    width="min(500px, 100vw)"
    unmount-on-close
    :mask-closable="!saving && !dirty"
    :header="true"
    :footer="true"
    class="task-create-drawer"
  >
    <template #title>
      {{ mode === 'edit' ? t('projects.editTitle') : (copySource ? t('projects.copyTitle') : t('projects.new')) }}
    </template>

    <a-form ref="formRef" :model="form" :rules="rules" layout="vertical" class="task-create-form">
      <!-- 区块A 基本信息（DESIGN.md · Drawer：业务抽屉按白卡分区块，画布 --app-fill-1） -->
      <div class="task-drawer-group">
        <h2 class="task-section-heading">{{ t('projects.taskCreate.sectionBasics') }}</h2>
        <a-form-item field="taskName" required>
          <template #label><span class="task-field-label app-field-label">{{ t('projects.taskCreate.name') }}</span></template>
          <a-input
            v-model="form.taskName"
            :max-length="50"
            :placeholder="t('projects.taskCreate.namePlaceholder')"
            :show-word-limit="true"
          />
        </a-form-item>

        <a-form-item field="taskDescription">
          <template #label><span class="task-field-label app-field-label">{{ t('projects.taskCreate.description') }}</span></template>
          <a-textarea
            v-model="form.taskDescription"
            :max-length="200"
            :placeholder="t('projects.taskCreate.descriptionPlaceholder')"
            :auto-size="{ minRows: 3, maxRows: 6 }"
            :show-word-limit="true"
          />
        </a-form-item>

        <a-form-item field="priority" required>
          <template #label><span class="task-field-label app-field-label">{{ t('projects.taskCreate.priority') }}</span></template>
          <a-radio-group v-model="form.priority">
            <a-radio value="urgent">{{ t('projects.urgent') }}</a-radio>
            <a-radio value="high">{{ t('projects.high') }}</a-radio>
            <a-radio value="medium">{{ t('projects.medium') }}</a-radio>
            <a-radio value="low">{{ t('projects.low') }}</a-radio>
          </a-radio-group>
        </a-form-item>

        <a-form-item field="deadline">
          <template #label><span class="task-field-label app-field-label">{{ t('projects.taskCreate.deadline') }}</span></template>
          <a-date-picker
            v-model="form.deadline"
            value-format="YYYY-MM-DD"
            :placeholder="t('projects.taskCreate.deadlinePlaceholder')"
            class="task-deadline-picker"
          />
        </a-form-item>

        <a-form-item field="attachments">
          <template #label><span class="task-field-label app-field-label">{{ t('projects.taskCreate.attachments') }}</span></template>
          <div class="task-upload">
            <a-upload
              draggable
              :auto-upload="false"
              :limit="MAX_FILES"
              :file-list="fileItems"
              :show-file-list="false"
              :show-upload-button="true"
              accept=".doc,.docx,.xls,.xlsx,.pdf,.png,.jpg,.jpeg"
              @change="onFilesChange"
            >
              <template #upload-button>
                <div class="task-upload-area">
                  <span class="task-upload-plus" aria-hidden="true">+</span>
                  <p class="task-upload-hint">{{ t('projects.taskCreate.uploadHint') }}</p>
                  <p class="task-upload-meta">{{ t('projects.taskCreate.uploadMeta') }}</p>
                </div>
              </template>
            </a-upload>
            <ul v-if="fileItems.length" class="task-file-list">
              <li v-for="file in fileItems" :key="file.uid" class="task-file-row">
                <span class="task-file-name" :title="file.file?.name ?? file.name">{{ file.file?.name ?? file.name }}</span>
                <button class="task-file-remove" type="button" :aria-label="t('projects.taskCreate.removeFile')" @click="removeFile(file.uid)">×</button>
              </li>
            </ul>
          </div>
        </a-form-item>
      </div>

      <!-- 区块B 任务编排：选择后按所选编排的审批流程节点展示缩略预览 -->
      <div class="task-drawer-group">
        <h2 class="task-section-heading">{{ t('projects.taskCreate.sectionOrchestration') }}</h2>
        <a-form-item field="orchestrationId" required hide-label class="task-orchestration-item">
          <a-select
            v-model="form.orchestrationId"
            :placeholder="t('projects.taskCreate.orchestrationPlaceholder')"
            :options="orchestrationOptions"
            allow-clear
          />
          <div v-if="selectedOrchestration" class="task-flow">
            <div class="task-flow-nodes">
              <template v-for="(node, index) in selectedOrchestration.nodes" :key="index">
                <div v-if="index > 0" class="task-flow-connector" aria-hidden="true"></div>
                <div class="task-flow-node" :class="`is-${node.kind}`">
                  <p class="task-flow-header">{{ node.label }}</p>
                  <p class="task-flow-detail">{{ node.detail }}</p>
                </div>
              </template>
            </div>
            <button class="task-flow-edit" type="button" @click="editOrchestration">
              <IconEdit :size="14" aria-hidden="true" />
              <span>{{ t('projects.taskCreate.editOrchestration') }}</span>
            </button>
          </div>
        </a-form-item>
      </div>
    </a-form>

    <template #footer>
      <div class="task-create-footer">
        <a-button class="app-btn-neutral" :disabled="saving" @click="cancelSave">{{ t('projects.taskCreate.cancel') }}</a-button>
        <a-button type="primary" :loading="saving" @click="confirmSave">
          {{ mode === 'edit' ? t('projects.save') : t('projects.taskCreate.confirm') }}
        </a-button>
      </div>
    </template>
  </a-drawer>
</template>

<style scoped>
/* 抽屉画布灰底（DESIGN.md · Drawer）：头尾白底、画布 --app-fill-1 */
:global(.arco-drawer:has(.task-create-form)) { background: var(--app-fill-1); }
:global(.arco-drawer:has(.task-create-form) .arco-drawer-header) { height: 56px; background: var(--app-surface); }
:global(.arco-drawer:has(.task-create-form) .arco-drawer-footer) { background: var(--app-surface); flex: none; }
:global(.arco-drawer:has(.task-create-form) .arco-drawer-body) { padding: 16px; background: var(--app-fill-1); overflow-y: auto; overflow-x: hidden; }
.task-create-form { min-width: 0; }
.task-create-form :deep(.arco-form-item-content-flex) { min-width: 0; }
.task-create-form :deep(.arco-radio-group) { display: flex; flex-wrap: wrap; gap: 8px; }
.task-create-form :deep(.arco-input-wrapper:not(.arco-input-disabled)),
.task-create-form :deep(.arco-textarea-wrapper:not(.arco-textarea-disabled)),
.task-create-form :deep(.arco-select-view:not(.arco-select-view-disabled)),
.task-create-form :deep(.arco-picker:not(.arco-picker-disabled)) { background: var(--app-surface); border: 1px solid var(--app-control-border); }
.task-create-form :deep(.arco-input-focus),
.task-create-form :deep(.arco-textarea-focus),
.task-create-form :deep(.arco-select-view-focus),
.task-create-form :deep(.arco-picker-focused) { border-color: var(--app-accent); }
.task-upload-area { box-sizing: border-box; }
.task-upload-hint, .task-upload-meta { text-align: center; overflow-wrap: anywhere; }
.task-create-form :deep(.arco-form-item-wrapper-col) { min-width: 0; }
.task-field-label { color: var(--color-text-1); }

/* 业务抽屉分区块：白卡 + 2px 圆角，区块间 16px（由 body 的 gap 提供） */
.task-create-form { display: flex; flex-direction: column; gap: 16px; }
.task-create-form :deep(.arco-form-item) { margin-bottom: 0; }
.task-drawer-group { display: flex; flex-direction: column; gap: 16px; padding: 16px; border-radius: 2px; background: var(--app-surface); }
.task-section-heading { margin: 0; color: var(--color-text-1); font-size: 16px; font-weight: 600; line-height: 24px; }
.task-drawer-group :deep(.task-deadline-picker) { width: 100%; }

/* 上传虚线区 + 已传文件行 */
.task-upload { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.task-upload :deep(.arco-upload) { width: 100%; }
.task-upload-area { display: flex; flex-direction: column; align-items: center; gap: 4px; width: 100%; padding: 20px 16px; border: 1px dashed var(--app-control-border); border-radius: 4px; background: var(--app-surface); color: var(--color-text-3); cursor: pointer; }
.task-upload-area:hover { border-color: var(--app-accent); color: var(--app-accent); }
.task-upload-plus { font-size: 20px; line-height: 24px; }
.task-upload-hint { margin: 0; color: var(--color-text-2); font-size: 14px; line-height: 22px; }
.task-upload-meta { margin: 0; color: var(--color-text-3); font-size: 12px; line-height: 20px; }
.task-upload :deep(.arco-upload-tip) { display: none; }

.task-file-list { display: flex; flex-direction: column; gap: 4px; margin: 0; padding: 0; list-style: none; }
.task-file-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; min-height: 36px; padding: 0 12px; border-radius: 2px; background: var(--color-fill-1); }
.task-file-name { overflow: hidden; color: var(--color-text-1); font-size: 14px; line-height: 22px; text-overflow: ellipsis; white-space: nowrap; }
.task-file-remove { display: inline-flex; align-items: center; justify-content: center; flex: none; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 2px; color: var(--color-text-3); background: transparent; cursor: pointer; font-size: 16px; }
.task-file-remove:hover { color: rgb(var(--danger-6)); background: var(--color-fill-2); }

/* 缩略流程预览：节点卡片（头部=节点名浅蓝底，主体=审批人说明白底），审核节点橙色头部 + 描边；节点间竖向连接线 */
.task-flow { display: flex; flex-direction: column; gap: 12px; width: 100%; margin-top: 4px; }
.task-flow-nodes { display: flex; flex-direction: column; width: 100%; max-width: 440px; margin: 0 auto; }
.task-flow-node { overflow: hidden; border: 1px solid var(--color-primary-light-2); border-radius: 4px; background: var(--app-surface); }
.task-flow-node.is-review { border: 2px solid rgb(var(--warning-6)); }
.task-flow-header { margin: 0; padding: 6px 12px; background: var(--color-primary-light-1); color: var(--color-text-1); font-size: 14px; font-weight: 600; line-height: 22px; }
.task-flow-node.is-review .task-flow-header { background: rgb(var(--warning-6)); color: var(--app-on-accent); }
.task-flow-detail { margin: 0; padding: 8px 12px; background: var(--app-surface); color: var(--color-text-1); font-size: 14px; line-height: 22px; }
.task-flow-connector { flex: none; width: 2px; height: 16px; margin: 0 auto; background: var(--color-primary-light-2); }
.task-flow-edit { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; min-height: 40px; margin-top: 4px; padding: 0 12px; border: 0; border-radius: 2px; color: var(--color-text-2); background: var(--color-fill-1); cursor: pointer; font: inherit; font-size: 14px; line-height: 22px; }
.task-flow-edit:hover { color: var(--app-accent); background: var(--color-fill-2); }

.task-create-footer { display: flex; align-items: center; justify-content: flex-end; gap: 8px; }
.task-orchestration-item :deep(.arco-form-item-content) { flex-direction: column; align-items: stretch; }
</style>

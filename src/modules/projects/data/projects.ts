import { TASK_STATUSES, aggregateTaskStatus, type TaskStatus } from '../../../shared/taskLifecycle';
import { ref } from 'vue';
import { sectionSeeds } from '../../sections/data/fixtures';

/** 任务类型：分项任务（由子项审批状态派生父任务状态）/ 独立任务（状态手动维护） */
export type ProjectType = 'section' | 'standalone';

/** 任务状态机（需求4）：待处理 / 待提交 / 进行中 / 审批中 / 已驳回 / 已完成 / 已撤回 / 已作废 */
export type ProjectStatus = TaskStatus;

/** 任务优先级（与自评「新建任务」抽屉一致：紧急 / 高 / 中 / 低） */
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export const STATUS_CODES = TASK_STATUSES;
export const PRIORITY_CODES = ['urgent', 'high', 'medium', 'low'] as const;
export const TASK_CODES = ['vehicle', 'technical', 'testing', 'certificate', 'report'] as const;
export const people = ['张三', '李四', '王五'];

/**
 * 分项任务的子项审批状态（与父任务状态机区分：子项含「审批驳回 rejected」）。
 * rejected=审批驳回 / completed=审批通过 / active=进行中 / reviewing=审批中 / pending=待处理。
 */
export type SubTaskStatus = TaskStatus;

/** 分项任务的子项（审批节点）：其审批状态 drive 父分项任务的派生状态（需求4） */
export interface SubTask {
  code: string;
  status: SubTaskStatus;
  target: string;
  executor: string;
  reviewer: string;
  template: string;
}

export interface Attachment { name: string; size: number }

export interface TaskExecutionDraft {
  brand: string;
  series: string;
  model: string;
  tasks: { code: string; enabled: boolean; target: string; template: string; executor?: string; reviewer?: string }[];
}

export interface TaskHistoryEvent {
  id: string;
  action: 'create' | 'draft' | 'execute' | 'review' | 'resubmit' | 'approve' | 'reject' | 'complete' | 'pause' | 'withdraw' | 'void';
  actor: string; time: string; taskCodes: string[];
  comment?: string; sourceId?: string;
  // Snapshot event context; later task edits must not rewrite historical content.
  taskName?: string; nextActor?: string;
  vehicle?: { brand: string; series: string; model: string };
  taskConfigs?: { code: string; target: string; template: string }[];
}

export interface Project {
  /** All section approvals finished; the main task awaits its own approval. */
  sectionApprovalReady?: boolean;
  executionDraft?: TaskExecutionDraft;
  history?: TaskHistoryEvent[];
  handledBy?: string[];
  ccUsers?: string[];
  id: string;
  name: string;
  /** 任务类型：分项任务 / 独立任务（任务执行阶段设置，需求2/3） */
  type: ProjectType;
  brand: string;
  series: string;
  model: string;
  priority: TaskPriority;
  status: ProjectStatus;
  owner: string;
  /** 审计字段：系统自动填充且只读（需求3） */
  creator: string;
  createdAt: string;
  deadline: string;
  actualEnd: string;
  updater: string;
  updatedAt: string;
  /** 分项任务的子项集合，驱动派生状态 */
  subTasks: SubTask[];
  description?: string;
  orchestrationId?: string;
  attachments?: Attachment[];
}

/** 当前登录用户（mock，待接入权限接口）：新建 / 编辑自动记入创建人、更新人 */
export const MOCK_CURRENT_USER = { accountId: 'demo-wang', name: '王建国', role: 'compliance' as const };

/** 系统设置「任务编排」演示数据（暂无系统设置模块，内置 mock 供新建任务选择） */
export interface TaskOrchestrationNode { kind: 'submit' | 'review' | 'end'; label: string; detail: string }
export interface TaskOrchestration { id: string; name: string; nodes: TaskOrchestrationNode[] }
export const TASK_ORCHESTRATIONS: TaskOrchestration[] = [
  {
    id: 'ORC-001', name: '合规自评标准编排',
    nodes: [
      { kind: 'submit', label: '提交', detail: '提交人：全部成员' },
      { kind: 'review', label: '审核', detail: '指定成员：合规专员' },
      { kind: 'end', label: '结束', detail: '流程已结束' },
    ],
  },
  {
    id: 'ORC-002', name: '量产前快速评估编排',
    nodes: [
      { kind: 'submit', label: '提交', detail: '提交人：功能负责人' },
      { kind: 'review', label: '审核', detail: '指定成员：数据安全委员会' },
      { kind: 'review', label: '复核', detail: '指定成员：合规专员' },
      { kind: 'end', label: '结束', detail: '流程已结束' },
    ],
  },
];

function nowText(): string {
  const date = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function nextProjectId(records: Project[] = projects.value): string {
  const max = records.reduce((current, record) => Math.max(current, Number(record.id.split('-')[1]) || 0), 0);
  return `PROJ-${String(max + 1).padStart(4, '0')}`;
}

/**
 * 分项类型任务：由子项审批状态派生父任务状态（需求4 四条规则）。
 * - 子项都审批通过 → 已完成
 * - 有审批驳回、有审批通过（不论是否还有进行中）→ 进行中
 * - 没有审批驳回、都在审批中、没有进行中 → 审批中
 * - 其余（如全未开始）→ 待处理
 */
export function deriveSectionStatus(subTasks: SubTask[]): ProjectStatus {
  return aggregateTaskStatus(subTasks.map(task => task.status));
}

/** Terminal workflow states override child-derived progress states. */
export function projectStatus(record: Project): ProjectStatus {
  if (record.status === 'withdrawn' || record.status === 'voided' || record.status === 'rejected') return record.status;
  if (record.sectionApprovalReady) return 'reviewing';
  if (record.type !== 'section') return record.status;
  const derived = deriveSectionStatus(record.subTasks);
  // A submitted parent remains active while child tasks await their own configuration.
  return derived === 'pending' && record.status === 'active' ? 'active' : derived;
}

/** Local transition until the task API contract is available. Guard again at confirmation. */
export function withdrawProject(id: string): boolean {
  const record = projects.value.find(task => task.id === id);
  if (!record || projectStatus(record) !== 'reviewing') return false;
  const time = nowText();
  record.status = 'withdrawn';
  record.updater = MOCK_CURRENT_USER.name;
  record.updatedAt = time;
  record.history ??= [];
  record.history.push({ id: crypto.randomUUID(), action: 'withdraw', actor: MOCK_CURRENT_USER.name, time, taskCodes: [], taskName: record.name });
  return true;
}

export interface CreateProjectInput {
  name: string;
  description?: string;
  priority: TaskPriority;
  deadline?: string;
  orchestrationId: string;
  attachments?: Attachment[];
  type?: ProjectType;
}

/** 新建任务（需求2/3）：初始状态「待处理」，系统自动写入创建人 / 创建时间 / 更新人 / 更新时间，置顶写入列表 */
export function createProject(input: CreateProjectInput): Project {
  const now = nowText();
  const record: Project = {
    id: nextProjectId(),
    name: input.name,
    type: input.type ?? 'standalone',
    brand: '', series: '', model: '',
    priority: input.priority,
    status: 'pending',
    owner: MOCK_CURRENT_USER.name,
    creator: MOCK_CURRENT_USER.name,
    createdAt: now.slice(0, 16),
    deadline: input.deadline ?? '',
    actualEnd: '',
    updater: MOCK_CURRENT_USER.name,
    updatedAt: now,
    subTasks: [],
    ...(input.description ? { description: input.description } : {}),
    orchestrationId: input.orchestrationId,
    ...(input.attachments?.length ? { attachments: input.attachments.map((item) => ({ ...item })) } : {}),
  };
  record.history = [{ id: crypto.randomUUID(), action: 'create', actor: record.creator, time: now, taskCodes: [], taskName: record.name }];
  projects.value.unshift(record);
  return record;
}

/** 编辑任务（需求2）：仅更新抽屉内的基础字段，系统自动刷新更新人 / 更新时间 */
export function updateProject(id: string, patch: Partial<Pick<Project, 'name' | 'description' | 'priority' | 'deadline' | 'orchestrationId' | 'attachments'>>): void {
  const record = projects.value.find((item) => item.id === id);
  if (!record) return;
  Object.assign(record, patch, { updater: MOCK_CURRENT_USER.name, updatedAt: nowText() });
}

/** 执行任务（需求4）：待处理 → 进行中，系统自动刷新更新人 / 更新时间 */
export function executeProject(id: string): void {
  const record = projects.value.find((item) => item.id === id);
  if (!record || record.status !== 'pending') return;
  record.status = 'active';
  record.updatedAt = nowText();
  record.updater = MOCK_CURRENT_USER.name;
}

function sub(code: string, status: SubTaskStatus, executor = '张三', reviewer = '李四'): SubTask {
  return { code, status, target: '2026-12-15', executor, reviewer, template: 'TPL-0001' };
}

function build(seedIndex: number, overrides: Partial<Project>): Project {
  const status = (overrides.status ?? 'pending') as ProjectStatus;
  const type = (overrides.type ?? 'standalone') as ProjectType;
  const base: Project = {
    id: `PROJ-${String(seedIndex + 1).padStart(4, '0')}`,
    name: overrides.name ?? `任务${seedIndex + 1}`,
    type,
    brand: overrides.brand ?? (['pending', 'submitting'].includes(status) ? '' : `品牌${(seedIndex % 2) + 1}`),
    series: overrides.series ?? (['pending', 'submitting'].includes(status) ? '' : seedIndex % 2 ? 'S3' : 'S1'),
    model: overrides.model ?? (['pending', 'submitting'].includes(status) ? '' : seedIndex % 2 ? 'M4' : 'M1'),
    priority: (overrides.priority ?? PRIORITY_CODES[seedIndex % 4]) as TaskPriority,
    status,
    owner: overrides.owner ?? people[seedIndex % 3]!,
    creator: overrides.creator ?? '王建国',
    createdAt: overrides.createdAt ?? '2026-11-01 09:00',
    deadline: overrides.deadline ?? '2026-12-31',
    actualEnd: overrides.actualEnd ?? '',
    updater: overrides.updater ?? '王建国',
    updatedAt: overrides.updatedAt ?? '2026-11-10 18:30:00',
    subTasks: overrides.subTasks ?? [],
    ...(overrides.description ? { description: overrides.description } : {}),
    ...(overrides.orchestrationId ? { orchestrationId: overrides.orchestrationId } : {}),
    ...(overrides.attachments ? { attachments: overrides.attachments } : {}),
  };
  return base;
}

/* 种子数据：覆盖 8 态 + 分项任务四条派生规则演示 */
const seeds: Project[] = [
  build(0, { name: '智能网联汽车数据安全合规自评', status: 'pending', priority: 'urgent', type: 'standalone', owner: '张三' }),
  build(1, { name: '动力电池合规自评', status: 'submitting', priority: 'high', type: 'standalone', owner: '李四' }),
  build(2, { name: '车机系统隐私合规评估', status: 'active', priority: 'medium', type: 'standalone', owner: '王五', brand: '品牌1', series: 'S1', model: 'M1', subTasks: TASK_CODES.map(code => ({ ...sub(code, code === 'vehicle' ? 'active' : 'pending', '王五'), target: '2026-11-30', template: code === 'vehicle' ? 'vehicle-TPL-1' : '' })) }),
  build(3, { name: 'OTA 升级安全评估', status: 'reviewing', priority: 'high', type: 'standalone', owner: '张三', brand: '品牌2', series: 'S3', model: 'M4', subTasks: TASK_CODES.map(code => ({ ...sub(code, 'reviewing'), target: '2026-11-30', template: code === 'vehicle' ? 'vehicle-TPL-1' : '' })) }),
  build(4, { name: '数据出境安全评估', status: 'completed', priority: 'urgent', type: 'standalone', owner: '李四', actualEnd: '2026-11-06', brand: '品牌1', series: 'S1', model: 'M1', subTasks: TASK_CODES.map(code => ({ ...sub(code, 'completed'), target: '2026-11-05' })) }),
  build(5, { name: '用户画像合规整改', status: 'withdrawn', priority: 'low', type: 'standalone', owner: '王五' }),
  build(6, { name: '座舱摄像头合规评估', status: 'voided', priority: 'medium', type: 'standalone', owner: '张三' }),
  // 分项任务：子项都审批通过 → 已完成
  build(7, { name: '整车合规分项任务', type: 'section', status: 'completed', brand: '品牌2', series: 'S3', model: 'M4', subTasks: [sub('vehicle', 'completed'), sub('technical', 'completed'), sub('testing', 'completed')] }),
  // 分项任务：有驳回、有通过、有进行中 → 进行中
  build(8, { name: '三电系统分项任务', type: 'section', status: 'active', subTasks: [sub('vehicle', 'rejected'), sub('technical', 'completed'), sub('testing', 'active')] }),
  // 分项任务：有驳回、有通过（无进行中）→ 进行中
  build(9, { name: '智能驾驶分项任务', type: 'section', status: 'active', subTasks: [sub('certificate', 'rejected'), sub('report', 'completed')] }),
  // 分项任务：无驳回、都在审批中、无进行中 → 审批中
  build(10, { name: '座舱娱乐分项任务', type: 'section', status: 'reviewing', subTasks: [sub('vehicle', 'reviewing'), sub('technical', 'reviewing')] }),
  build(11, { name: '充电接口合规评估', status: 'pending', priority: 'low', type: 'standalone', owner: '李四' }),
  build(12, { name: '定位数据采集合规', status: 'submitting', priority: 'medium', type: 'standalone', owner: '王五' }),
  build(13, { name: '云端服务数据合规', status: 'active', priority: 'high', type: 'standalone', owner: '张三', brand: '品牌2', series: 'S3', model: 'M4', subTasks: TASK_CODES.map(code => ({ ...sub(code, code === 'vehicle' ? 'completed' : code === 'technical' ? 'active' : 'pending'), target: '2026-11-30', template: code === 'vehicle' ? 'vehicle-TPL-2' : code === 'technical' ? 'technical-TPL-1' : '' })) }),
  build(14, { name: '车联网通信安全评估', status: 'reviewing', priority: 'urgent', type: 'standalone', owner: '李四', brand: '品牌1', series: 'S1', model: 'M2', subTasks: ['vehicle', 'testing', 'report'].map(code => ({ ...sub(code, 'reviewing', '李四', '王五'), target: '2026-11-30', template: code === 'vehicle' ? 'vehicle-TPL-2' : '' })) }),
  build(15, { name: '供应商数据合规审计', status: 'completed', priority: 'medium', type: 'standalone', owner: '王五', actualEnd: '2026-11-09', brand: '品牌2', series: 'S3', model: 'M5', subTasks: ['technical', 'certificate', 'report'].map(code => ({ ...sub(code, 'completed'), target: '2026-11-08' })) }),
  build(16, { name: '历史数据清理专项', status: 'withdrawn', priority: 'low', type: 'standalone', owner: '张三' }),
  build(17, { name: '车辆数据分类分级评估', status: 'rejected', priority: 'high', owner: MOCK_CURRENT_USER.name, brand: '', series: '', model: '' }),
];

// Templates for non-vehicle types belong to section execution entries, not main task configuration.
for (const task of seeds) for (const child of task.subTasks) if (child.code !== 'vehicle') child.template = '';

// Local historical fixtures exercise the lifecycle. These are not recovered server audit records.
for (const task of seeds) {
  const stage = task.type === 'section' ? deriveSectionStatus(task.subTasks) : task.status;
  const event = (action: NonNullable<Project['history']>[number]['action'], hour: string, code?: string): NonNullable<Project['history']>[number] => ({
    id: `${task.id}-${action}-${code || 'task'}-${hour}`, action,
    actor: action === 'approve' || action === 'reject' ? '李四' : task.owner,
    time: `2026-11-05 ${hour}:00:00`, taskCodes: code ? [code] : [], taskName: task.name,
    nextActor: action === 'review' ? '李四' : action === 'approve' && hour === '10' ? task.owner : undefined,
  });
  task.history = [{ id: `${task.id}-create`, action: 'create', actor: task.creator, time: task.createdAt, taskCodes: [], taskName: task.name, nextActor: '李四' }, event('review', '09')];
  if (stage === 'submitting') continue;
  if (stage === 'rejected') {
    task.history.push({ ...event('reject', '10'), nextActor: task.creator, comment: '请补充任务范围及评估依据。' });
    continue;
  }
  task.history.push(event('approve', '10'));
  if (stage === 'pending') continue;
  if (stage === 'withdrawn' || stage === 'voided') {
    task.history.push(event(stage === 'withdrawn' ? 'withdraw' : 'void', '11'));
    continue;
  }
  task.history.push(event('execute', '11'));
  for (const subtask of task.subTasks) {
    task.history.push(event(subtask.status === 'pending' ? 'create' : 'execute', '12', subtask.code));
    if (['reviewing', 'completed', 'rejected'].includes(subtask.status)) task.history.push(event('review', '13', subtask.code));
    if (subtask.status === 'rejected') task.history.push(event('reject', '14', subtask.code));
    if (subtask.status === 'completed') task.history.push(event('approve', '14', subtask.code));

  }
  if (stage === 'reviewing' || stage === 'completed') task.history.push(event('review', '15'));
  if (stage === 'completed') task.history.push(event('approve', '16'), event('complete', '17'));
}

// Section fixtures are linked before exporting task state, so direct loads of either module agree.
for (const task of seeds) {
  const sections = sectionSeeds.filter(row => row.project === task.id);
  if (!sections.length) continue;
  const personName = (id: string) => id === MOCK_CURRENT_USER.accountId ? MOCK_CURRENT_USER.name : id === 'section-executor' ? people[0]! : people[1]!;
  for (const section of sections) {
    const code = section.type === 'test' ? 'testing' : section.type;
    const child = task.subTasks.find(child => child.code === code);
    const configured = { code, status: section.status, target: section.end, executor: personName(section.executor), reviewer: personName(section.reviewer), template: code === 'vehicle' ? child?.template ?? 'vehicle-TPL-1' : '' };
    if (child) Object.assign(child, configured); else task.subTasks.push(configured);
  }
  if (task.id === 'PROJ-0004' || task.id === 'PROJ-0010') {
    const vehicle = { code: 'vehicle', status: 'completed' as const, target: '2026-11-05', executor: people[0]!, reviewer: people[1]!, template: 'TPL-1-3' };
    const configured = task.subTasks.find(child => child.code === 'vehicle');
    if (configured) Object.assign(configured, vehicle); else task.subTasks.unshift(vehicle);
  }
  if (task.brand === '品牌2' && task.series !== 'S3') { task.series = 'S3'; task.model = 'M4'; }
  for (const child of task.subTasks) child.template = child.code === 'vehicle' ? 'TPL-1-3' : '';
  task.status = task.status === 'completed' ? 'completed' : 'active';
  if (task.status === 'completed') task.actualEnd = '2026-11-12';
  const history: TaskHistoryEvent[] = [];
  const event = (id: string, action: TaskHistoryEvent['action'], time: string, actor: string, taskCodes: string[] = [], nextActor?: string) => {
    const entry: TaskHistoryEvent = { id: `${task.id}-${id}`, action, time, actor, taskCodes, taskName: task.name, nextActor };
    history.push(entry);
    return entry;
  };
  event('create', 'create', task.createdAt, task.creator, [], people[1]);
  event('review', 'review', '2026-11-02 09:00:00', task.creator, [], people[1]);
  event('approve', 'approve', '2026-11-02 10:00:00', people[1]!, [], task.owner);
  const execution = event('execute', 'execute', '2026-11-05 09:00:00', task.owner);
  execution.vehicle = { brand: task.brand, series: task.series, model: task.model };
  execution.taskConfigs = task.subTasks.map(({ code, target, template }) => ({ code, target, template }));
  for (const section of sections) {
    const code = section.type === 'test' ? 'testing' : section.type;
    const executor = personName(section.executor);
    const reviewer = personName(section.reviewer);
    event(`${section.id}-create`, 'create', '2026-11-06 09:00:00', task.owner, [code]);
    if (section.status === 'pending') continue;
    event(`${section.id}-draft`, 'draft', '2026-11-07 09:00:00', executor, [code]);
    if (section.status === 'submitting') continue;
    event(`${section.id}-execute`, 'execute', '2026-11-08 09:00:00', executor, [code]);
    if (['reviewing', 'completed', 'rejected', 'withdrawn'].includes(section.status)) event(`${section.id}-review`, 'review', '2026-11-09 09:00:00', executor, [code], reviewer);
    if (section.status === 'completed') event(`${section.id}-approve`, 'approve', '2026-11-10 09:00:00', reviewer, [code]);
    if (section.status === 'rejected') event(`${section.id}-reject`, 'reject', '2026-11-10 09:00:00', reviewer, [code], executor);
    if (section.status === 'withdrawn') event(`${section.id}-withdraw`, 'withdraw', '2026-11-10 09:00:00', executor, [code]);
    if (section.status === 'voided') event(`${section.id}-void`, 'void', '2026-11-10 09:00:00', task.owner, [code]);
  }
  for (const child of task.subTasks.filter(child => !sections.some(section => (section.type === 'test' ? 'testing' : section.type) === child.code))) {
    const day = child.code === 'vehicle' ? '2026-11-05' : '2026-11-08';
    event(`${child.code}-create`, 'create', `${day} 10:00:00`, task.owner, [child.code]);
    if (child.status === 'pending') continue;
    event(`${child.code}-execute`, 'execute', `${day} 11:00:00`, child.executor, [child.code]);
    if (['reviewing', 'completed', 'rejected'].includes(child.status)) event(`${child.code}-review`, 'review', `${day} 12:00:00`, child.executor, [child.code], child.reviewer);
    if (child.status === 'completed') event(`${child.code}-approve`, 'approve', `${day} 13:00:00`, child.reviewer, [child.code]);
    if (child.status === 'rejected') event(`${child.code}-reject`, 'reject', `${day} 13:00:00`, child.reviewer, [child.code], child.executor);
  }
  if (task.status === 'completed') {
    event('final-review', 'review', '2026-11-11 09:00:00', task.owner, [], people[1]);
    event('final-approve', 'approve', '2026-11-12 09:00:00', people[1]!);
    event('complete', 'complete', '2026-11-12 10:00:00', task.owner);
  }
  task.history = history.sort((a, b) => a.time.localeCompare(b.time));
  task.updatedAt = task.history[task.history.length - 1]!.time;
  task.updater = task.history[task.history.length - 1]!.actor;
}

// Relationship fixtures for the current account, pending backend task/CC contracts.
seeds[4]!.handledBy = [MOCK_CURRENT_USER.name];
seeds[7]!.handledBy = [MOCK_CURRENT_USER.name];
seeds[15]!.handledBy = [MOCK_CURRENT_USER.name];
seeds[2]!.ccUsers = [MOCK_CURRENT_USER.name];
seeds[8]!.ccUsers = [MOCK_CURRENT_USER.name];
export const projects = ref<Project[]>(seeds);

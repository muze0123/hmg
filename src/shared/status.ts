/**
 * 平台状态语义角色（DESIGN.md · Tag 标签 / Status roles and domain ownership）。
 *
 * 所有权边界：设计系统只拥有 `role → 外观`（见 AppStatusTag.vue 与 --app-status-* Token）；
 * 业务域拥有「状态枚举 / 中文文案 / 允许的状态流转 / code → role」。因此这里不把互不相关的
 * 业务域合并成一份全局状态字典：COMMON 只是同义状态码的共享语义，差异由 DOMAIN_OVERRIDES
 * 按域登记。可见文案仍由各模块自己的 i18n 命名空间提供，绝不从颜色反推文案。
 */
export type StatusRole = 'neutral' | 'info' | 'success' | 'warning' | 'danger';

export type StatusDomain =
  | 'workbench'
  | 'projects'
  | 'tasks'
  | 'sections'
  | 'templates'
  | 'reports'
  | 'vehicle'
  | 'technical'
  | 'testing';

/**
 * 同义状态码的共享语义。依据各域现有状态字典归纳，属于前端实现默认值；
 * 产品确认正式状态字典后应复核，而不是把某个页面的 Arco 色名当作规范。
 */
const COMMON: Readonly<Record<string, StatusRole>> = {
  // 未启动 / 挂起：不需要强调
  notStarted: 'neutral',
  pending: 'neutral',
  draft: 'neutral',
  paused: 'neutral',
  normal: 'neutral',
  // 进行态：品牌信息色，与完成/异常区分
  inProgress: 'info',
  active: 'info',
  reviewing: 'info',
  review: 'info',
  submitted: 'info',
  // 终态·正常
  completed: 'success',
  passed: 'success',
  pass: 'success',
  approved: 'success',
  // 需关注但不代表失败
  overdue: 'warning',
  high: 'warning',
  preferred: 'warning',
  // 终态·异常
  rejected: 'danger',
  failed: 'danger',
  urgent: 'danger',
  // 任务管理（HMG projects）：已作废为只读负向终态
  voided: 'danger',
  // 待提交 / 已撤回：非强调的中间或负向终态
  submitting: 'neutral',
  withdrawn: 'neutral',
};

/** 域级差异登记处。当前各域语义一致；产品确认后按域覆盖，不改其它域。 */
const DOMAIN_OVERRIDES: Partial<Record<StatusDomain, Readonly<Record<string, StatusRole>>>> = {};

/**
 * 把业务状态码解析为语义角色。未登记的状态码返回 neutral 兜底，
 * 并在开发环境输出诊断（不向终端用户展示原始码，避免泄漏敏感值）。
 */
export function statusRole(code: string, domain: StatusDomain = 'workbench'): StatusRole {
  const role = DOMAIN_OVERRIDES[domain]?.[code] ?? COMMON[code];
  if (!role && import.meta.env.DEV) {
    console.warn(`[status] unmapped status code in ${domain}: ${code}`);
  }
  return role ?? 'neutral';
}

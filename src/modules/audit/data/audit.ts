/**
 * 审计管理 — 领域类型与模块级静态 mock 数据。
 *
 * 平台初始框架口径：留痕对象只覆盖仍在平台内的能力
 * （账号与角色 / 功能授权 / 审计管理 / 消息中心 / 系统设置），
 * 不再引用已下线的业务模块。当前无后端：全部记录为前端 mock，
 * 接入服务端后本文件替换为 API 适配层，页面与导出不需改动。
 */

export type AuditActionType =
  | 'login'
  | 'view'
  | 'create'
  | 'update'
  | 'delete'
  | 'import'
  | 'export'
  | 'review'
  | 'grant'
  | 'config';

export type AuditModuleKey = 'account' | 'grant' | 'audit' | 'message' | 'system';

export type AuditRole = 'admin' | 'officer' | 'owner';

export type AuditResult = 'success' | 'failure';

export interface AuditRecord {
  /** 审计编号，形如 AUD-2026-0001 */
  id: string;
  /** 操作时间，固定 `YYYY-MM-DD HH:mm:ss`，字符串比较即时间比较 */
  time: string;
  actor: string;
  role: AuditRole;
  actionType: AuditActionType;
  module: AuditModuleKey;
  /** 关联对象类型，mock 业务数据原文（账号 / 授权 / 消息…） */
  targetType: string;
  targetName: string;
  /** 变更摘要：做了什么、影响什么 */
  summary: string;
  result: AuditResult;
}

/** [time, actor, role, actionType, module, targetType, targetName, summary, result] */
type AuditRow = readonly [
  string, string, AuditRole, AuditActionType, AuditModuleKey, string, string, string, AuditResult,
];

const ROWS: readonly AuditRow[] = [
  ['2026-10-24 09:32:15', '张三', 'admin', 'login', 'account', '账号', '张三', '管理员登录成功，会话有效期 8 小时。', 'success'],
  ['2026-10-24 09:35:02', '张三', 'admin', 'view', 'audit', '审计记录', 'AUD-2026-0031', '查看审计记录详情与变更摘要。', 'success'],
  ['2026-10-24 09:41:47', '王五', 'officer', 'review', 'grant', '授权申请', 'REQ-2026-0088', '复核功能授权申请，确认为单条绑定。', 'success'],
  ['2026-10-24 10:02:33', '赵六', 'owner', 'update', 'account', '账号', '陈静', '更新账号所属部门与显示名。', 'success'],
  ['2026-10-24 10:15:20', '李四', 'admin', 'config', 'system', '系统参数', '会话超时', '会话超时由 30 分钟调整为 60 分钟。', 'success'],
  ['2026-10-23 18:26:09', '孙七', 'owner', 'export', 'audit', '审计报告', '审计报告 2026-10-23', '按当前筛选导出审计记录 32 条。', 'success'],
  ['2026-10-23 17:48:55', '张三', 'admin', 'import', 'account', '账号清单', '账号批量导入_202610.xlsx', '导入 120 条账号，覆盖更新 6 条重复工号。', 'success'],
  ['2026-10-23 16:30:41', '王五', 'officer', 'view', 'message', '消息', 'N-2026-0102', '查看系统消息详情与送达范围。', 'success'],
  ['2026-10-23 15:12:08', '李四', 'admin', 'grant', 'grant', '授权', '赵六 → 审计管理', '开通审计管理只读权限。', 'success'],
  ['2026-10-23 14:05:37', '周八', 'owner', 'update', 'system', '系统参数', '默认语言', '默认语言设置为简体中文。', 'success'],
  ['2026-10-23 11:20:14', '陈静', 'officer', 'review', 'grant', '授权申请', 'REQ-2026-0085', '退回授权申请：缺少有效期字段。', 'success'],
  ['2026-10-23 09:58:02', '赵六', 'owner', 'login', 'account', '账号', '赵六', '登录成功。', 'success'],
  ['2026-10-22 19:40:27', '李四', 'admin', 'config', 'system', '系统参数', '安全策略', '启用导出文件安全策略占位配置。', 'success'],
  ['2026-10-22 17:22:46', '孙七', 'owner', 'import', 'grant', '授权清单', '批量授权_10月.xlsx', '导入失败：缺少「功能授权」工作表，未写入任何行。', 'failure'],
  ['2026-10-22 16:05:19', '王五', 'officer', 'export', 'audit', '审计报告', '审计报告 2026-10-22', '导出失败：报告模板渲染异常，已可重试。', 'failure'],
  ['2026-10-22 15:31:52', '张三', 'admin', 'view', 'account', '账号', '账号列表', '查看全部账号与会话状态。', 'success'],
  ['2026-10-22 14:18:33', '李四', 'admin', 'create', 'account', '账号', '陈静', '新建账号并分配角色，首次登录需改密。', 'success'],
  ['2026-10-21 18:44:09', '周八', 'owner', 'view', 'message', '消息', '消息中心', '查看未读消息与筛选结果。', 'success'],
  ['2026-10-21 17:03:25', '王五', 'officer', 'update', 'grant', '授权', '赵六 → 消息中心', '授权有效期延长至 2026-12-31。', 'success'],
  ['2026-10-21 15:47:10', '赵六', 'owner', 'create', 'message', '消息模板', '系统维护通知', '新建系统消息模板并设为草稿。', 'success'],
  ['2026-10-21 14:29:57', '张三', 'admin', 'import', 'account', '账号清单', '批量授权_10月批次.xlsx', '批量导入授权 20 条：成功 17 条，失败 3 条。', 'failure'],
  ['2026-10-20 19:12:44', '陈静', 'officer', 'view', 'audit', '审计记录', '审计记录列表', '按操作人筛选审计记录并核对时间范围。', 'success'],
  ['2026-10-20 17:55:31', '孙七', 'owner', 'delete', 'message', '消息模板', '旧版提醒模板', '删除已停用模板，保留删除留痕。', 'success'],
  ['2026-10-20 16:38:18', '李四', 'admin', 'update', 'account', '账号', 'F-1024 工号', '修正工号录入错误，历史留痕不变。', 'success'],
  ['2026-10-20 15:21:06', '王五', 'officer', 'export', 'audit', '审计报告', '审计报告 2026-10-20', '导出全量审计记录 216 条。', 'success'],
  ['2026-10-19 18:09:53', '周八', 'owner', 'update', 'system', '系统参数', '分页条数', '列表默认每页条数由 20 调整为 10。', 'success'],
  ['2026-10-19 16:52:40', '张三', 'admin', 'delete', 'grant', '授权', '测试授权 A-003', '删除未生效的测试授权记录。', 'success'],
  ['2026-10-19 15:35:27', '赵六', 'owner', 'view', 'audit', '审计记录', 'AUD-2026-0015', '查看登录失败记录的失败原因。', 'success'],
  ['2026-10-18 17:47:14', '李四', 'admin', 'config', 'system', '系统参数', '字典项', '维护部门枚举，合并重复项。', 'success'],
  ['2026-10-18 16:00:01', '孙七', 'owner', 'import', 'account', '账号清单', '账号清单_10月.xlsx', '导入并覆盖更新 86 条既有账号，保留创建人。', 'success'],
  ['2026-10-17 18:33:35', '陈静', 'officer', 'review', 'grant', '授权申请', 'REQ-2026-0079', '复核通过，授权即时生效。', 'success'],
  ['2026-10-17 15:19:09', '张三', 'admin', 'login', 'account', '账号', '张三', '登录成功。', 'success'],
  ['2026-10-16 19:25:52', '孙七', 'owner', 'view', 'message', '消息', '消息列表', '查看「系统消息」类型消息。', 'success'],
  ['2026-10-16 17:08:45', '李四', 'admin', 'grant', 'grant', '授权', '赵六 → 账号与角色', '解绑授权（人员转岗）。', 'success'],
  ['2026-10-13 18:37:26', '孙七', 'owner', 'login', 'account', '账号', '孙七', '登录失败：密码连续错误 5 次，账号临时锁定 15 分钟。', 'failure'],
  ['2026-10-12 14:02:58', '李四', 'admin', 'create', 'system', '系统参数', '审计保留期', '新建审计日志保留期配置，取值 180 天。', 'success'],
];

export const auditRecords: AuditRecord[] = ROWS.map((row, index) => ({
  id: `AUD-2026-${String(index + 1).padStart(4, '0')}`,
  time: row[0],
  actor: row[1],
  role: row[2],
  actionType: row[3],
  module: row[4],
  targetType: row[5],
  targetName: row[6],
  summary: row[7],
  result: row[8],
}));

/** 筛选下拉里的操作人（按姓名去重） */
export const auditActors: string[] = [...new Set(auditRecords.map((record) => record.actor))];

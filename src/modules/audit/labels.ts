import { useI18n } from 'vue-i18n';
import type { AuditActionType, AuditModuleKey, AuditRole, AuditResult } from './data/audit';

/**
 * 审计模块的枚举渲染。
 *
 * key 前缀以行内模板字面量写出，scripts/i18n.mjs 才能把它识别成
 * `audit.actionTypes.<code>` 这样的动态 key 模式；字典缺项时返回 code 本身。
 */

/** 动作类型 → Arco 语义色（DESIGN.md 语义层）：查看/登录中性、新建成功、修改警告、删除危险、导入导出信息、审核/授权/配置专属色。 */
export const auditActionColors: Record<AuditActionType, string> = {
  login: 'gray',
  view: 'gray',
  create: 'green',
  update: 'orange',
  delete: 'red',
  import: 'arcoblue',
  export: 'arcoblue',
  review: 'purple',
  grant: 'cyan',
  config: 'gold',
};

export function auditActionColor(actionType: AuditActionType): string {
  return auditActionColors[actionType] ?? 'gray';
}

export function useAuditLabels() {
  const { t, te } = useI18n({ useScope: 'global' });

  function actionLabel(code: AuditActionType): string {
    const key = `audit.actionTypes.${code}`;
    return te(key) ? t(key) : code;
  }

  function moduleLabel(code: AuditModuleKey): string {
    const key = `audit.modules.${code}`;
    return te(key) ? t(key) : code;
  }

  function roleLabel(code: AuditRole): string {
    const key = `audit.roles.${code}`;
    return te(key) ? t(key) : code;
  }

  function resultLabel(code: AuditResult): string {
    const key = `audit.results.${code}`;
    return te(key) ? t(key) : code;
  }

  return { actionLabel, moduleLabel, roleLabel, resultLabel };
}

import { ref } from 'vue';
const types = ['vehicle', 'technical', 'testing', 'report', 'certificate'];
const descriptions: Record<string, string> = {
  vehicle: '车型配置字段结构',
  technical: '技术资料字段结构',
  testing: '测试记录字段结构',
  report: '报告字段结构',
  certificate: '证书字段结构',
};
export interface Entry { id: string; name: string; format: string; note: string }
export interface TemplateRecord { project?: string; user?: string; used?: string; id: string; type: string; name: string; description: string; version: string; status: string; created: string; updated: string; entries: Entry[] }
/**
 * 模块级 typed mock，接入 API 前由前端持有。
 * 记录存枚举 code，展示文案由页面层用 `templates.<code>` 翻译；编号 / 描述 / 日期为业务原文。
 * 每个类型 7 条，描述、版本号、状态与创建 / 更新时间各有差异，供筛选、排序与分页验收。
 */
export const templateRecords = ref<TemplateRecord[]>(types.flatMap((type, index) => Array.from({ length: 7 }, (_, n) => {
  const day = String(2 + n * 3).padStart(2, '0');
  return {
    id: `TPL-${index + 1}-${n + 1}`,
    type,
    name: `TPL-${index + 1}-${n + 1}`,
    description: `${descriptions[type]} ${String(n + 1).padStart(2, '0')}`,
    version: n % 2 ? 'V1.2.0' : 'V1.0.0',
    status: ['draft', 'reviewing', 'completed', 'rejected'][n % 4]!,
    created: `2025-11-${day}`,
    updated: `2025-12-${day}`,
    entries: [],
  };
})));

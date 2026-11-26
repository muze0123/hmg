import { sectionRegulations } from './regulations';
import { reactive } from 'vue';
import { sectionSeeds } from './fixtures';
import { MOCK_CURRENT_USER, projects } from '../../projects/data/projects';

/**
 * 分项管理列表数据（模块级 typed mock，接入 API 前由前端持有）。
 *
 * 记录存枚举 code，展示文案统一由页面层用 `sections.<code>` 翻译；
 * 任务编号 / 任务名称 / 法规编号 / 日期为业务原文，不进翻译字典。
 * 数据覆盖全部状态与任务类型，方便筛选、排序、分页的交互验收。
 */
export const STATUS_CODES = ['pending', 'active', 'reviewing', 'completed', 'rejected', 'withdrawn', 'voided'] as const;
export const TYPE_CODES = ['technical', 'test', 'certificate', 'report', 'vehicle'] as const;
export const PRIORITY_CODES = ['urgent', 'high', 'medium', 'low'] as const;

export interface SectionEntry {
  id: string;
  law: string;
  template: string;
  externalReview: boolean | undefined;
  approval: 'pending' | 'completed' | 'rejected';
}

export interface Item {
  creator: string;
  handledBy: string[];
  ccUsers: string[];
  entries?: SectionEntry[];
  executionSubmitted?: boolean;

  id: string;
  project: string;
  name: string;
  readonly law: string;
  priority: (typeof PRIORITY_CODES)[number];
  type: (typeof TYPE_CODES)[number];
  status: (typeof STATUS_CODES)[number];
  createdAt: string;
  executor: string;
  executedAt: string;
  reviewer: string;
  reviewedAt: string;
  start: string;
  end: string;
  actual: string;
}

/** Local records retain their IDs and cover all seven section lifecycle states. */
export const items = reactive<Item[]>(sectionSeeds.map(row => {
  const task = projects.value.find(task => task.id === row.project)!;
  const code = row.type === 'test' ? 'testing' : row.type;
  const history = [...(task.history ?? [])].reverse().filter(event => event.taskCodes.includes(code));
  return {
    ...row,
    // Compatibility field for filters/workbench/export; never a separately stored value.
    get law(): string { return sectionRegulations(this).join('、'); },
    // Assignment does not imply execution/approval has occurred.
    executedAt: row.executionSubmitted ? history.find(event => event.action === 'execute')?.time ?? '' : '',
    reviewedAt: ['completed', 'rejected'].includes(row.status) ? history.find(event => event.action === 'approve' || event.action === 'reject')?.time ?? '' : '',
    entries: row.entries?.map(entry => ({ ...entry })),
    creator: MOCK_CURRENT_USER.accountId,
    handledBy: ['ITEM-03', 'ITEM-04', 'ITEM-10'].includes(row.id) ? [MOCK_CURRENT_USER.accountId] : [],
    ccUsers: ['ITEM-05', 'ITEM-09'].includes(row.id) ? [MOCK_CURRENT_USER.accountId] : [],
    name: task.name,
    priority: task.priority,
    createdAt: task.createdAt,
  };
}));

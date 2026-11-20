import { people, projects, TASK_CODES } from '../../projects/data/projects';
import { items, type Item } from './items';

/**
 * 分项详情的模块级 typed mock（接入 API 前由前端持有）。
 *
 * 项目维度字段（品牌 / 车系 / 车型 / 负责人 / 任务节点）从项目管理主数据按项目编号关联，
 * 不在这里复制第二份；分项自身字段来自 items.ts。这样在项目管理页调整主数据后，
 * 详情子页面直接读取到的就是同一份业务数据。
 */

/** 项目内容里的任务类型全集，顺序与「项目内容」表单一致 */
export const DETAIL_TASK_CODES = TASK_CODES;

export interface SectionTask {
  code: string;
  target: string;
  executor: string;
  reviewer: string;
  template: string;
}

export interface SectionTaskRow {
  law: string;
  technicalTemplate: string;
  externalReview: boolean;
  testTemplate: string;
}

export interface SectionDetail {
  id: string;
  project: string;
  name: string;
  brand: string;
  series: string;
  model: string;
  priority: string;
  owner: string;
  start: string;
  end: string;
  tasks: SectionTask[];
  taskRows: SectionTaskRow[];
}

const REGULATIONS = ['GB-2024-001', 'GB-2024-002', 'EU-2024-001', 'EU-2024-002', 'EU-2024-003'];

/**
 * 任务类型只读参数：参考稿把 5 类任务节点逐行列出，每类都要呈现
 * 目标时间 / 执行人 / 审核人 / 模板。项目主数据里已配置的节点优先取真值；
 * 尚未配置的节点用分项计划结束日期与人员字典补齐（模块级 mock，待 API 契约接入）。
 * 模板参数只挂在车型配置上，与「项目内容」表单的字段结构一致，其余行留空由页面渲染「—」。
 */
function buildTasks(item: Item): SectionTask[] {
  const project = projects.value.find((row) => row.id === item.project);
  return DETAIL_TASK_CODES.map((code, index) => {
    const configured = project?.subTasks.find((task) => task.code === code);
    return {
      code,
      target: configured?.target ?? item.end,
      executor: configured?.executor ?? people[index % people.length]!,
      reviewer: configured?.reviewer ?? people[(index + 1) % people.length]!,
      template: code === 'vehicle' ? configured?.template ?? 'TPL-0001' : '',
    };
  });
}

/** 「任务信息」列表：以本分项法规编号为首行，其余为该项目的法规任务行（mock） */
function buildTaskRows(item: Item): SectionTaskRow[] {
  const laws = [item.law, ...REGULATIONS.filter((code) => code !== item.law).slice(0, 2)];
  return laws.map((law, index) => ({
    law,
    technicalTemplate: `TPL-T${String(index + 1).padStart(4, '0')}`,
    externalReview: index % 2 === 0,
    testTemplate: `TPL-R${String(index + 1).padStart(4, '0')}`,
  }));
}

export function findSectionDetail(id: string): SectionDetail | undefined {
  const item = items.find((row) => row.id === id);
  if (!item) return undefined;
  const project = projects.value.find((row) => row.id === item.project);
  return {
    id: item.id,
    project: item.project,
    name: item.name,
    brand: project?.brand ?? '',
    series: project?.series ?? '',
    model: project?.model ?? '',
    priority: item.priority,
    owner: project?.owner ?? '',
    start: item.start,
    end: item.end,
    tasks: buildTasks(item),
    taskRows: buildTaskRows(item),
  };
}

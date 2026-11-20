import { ref } from 'vue';

const types = ['vehicle', 'technical', 'testing', 'report', 'certificate'];
const descriptions: Record<string, string> = {
  vehicle: '车型配置字段结构',
  technical: '技术资料字段结构',
  testing: '测试记录字段结构',
  report: '报告字段结构',
  certificate: '证书字段结构',
};

/**
 * 2026-11-16 用户裁决：5 个类型 tab 统一一套契约
 * （13 列、11 筛选、5 态模版状态、状态化行操作、导入 / 导出、视角切换）。
 */
/** 模版状态机（5 态）：待提交 → 审批中 → 已完成 / 已驳回 → 已撤回。code → 外观由 statusRole 解析。 */
export const TEMPLATE_STATUS_CODES = ['submitting', 'reviewing', 'completed', 'rejected', 'withdrawn'] as const;
/** 适用区域 / 国家 / 车辆类型枚举。记录只存 code，显示文案由 templates.regions / countries / vehicleTypes 提供。 */
export const TEMPLATE_REGION_CODES = ['asia', 'europe', 'northAmerica', 'southAmerica', 'africa', 'oceania'] as const;
export const TEMPLATE_COUNTRY_CODES = ['china', 'germany', 'usa', 'brazil', 'egypt', 'australia'] as const;
export const TEMPLATE_VEHICLE_TYPE_CODES = ['car', 'truck'] as const;
/** 法规编号为业务原文，不进翻译字典。 */
export const TEMPLATE_REGULATIONS = ['UN R155', 'UN R156', 'GB 44464-2024', 'ISO/SAE 21434', 'UNECE R100', 'GB/T 40429-2021'];
/** 与 user profile 的当前用户一致，用于导入 / 复制 / 编辑时写入创建人与更新人。 */
export const MOCK_CURRENT_USER = '张三';
const PEOPLE = ['张三', '李四', '王五', '赵六'];
/** 每个类型 7 条：覆盖 5 态，保留 2 条 completed 供分项执行抽屉引用，2 条 reviewing 覆盖两种审批视角。 */
const STATUS_CYCLE = ['submitting', 'reviewing', 'completed', 'rejected', 'withdrawn', 'reviewing', 'completed'] as const;

export interface Entry { id: string; name: string; format: string; note: string; columns?: string[]; number?: string; tag?: string; partsCertificate?: string; technical?: string; testing?: string; report?: string }
export interface TemplateRecord {
  // 使用记录视图派生字段
  project?: string; user?: string; used?: string;
  id: string;
  type: string;             // 模版类型 code（车型配置 / 技术资料 / 测试记录 / 报告 / 证书）
  name: string;
  description: string;
  regulation: string;       // 法规编号
  region: string;           // 适用区域 code
  country: string;          // 适用国家 code
  vehicleType: string;      // 适用车辆类型 code
  history?: TemplateRecord[];
  events?: { action: string; actor: string; time: string; opinion?: string }[];
  regulationType?: string;
  baseVersion?: string;
  versionNote?: string;
  version: string;          // 最新版本号
  status: string;           // 模版状态 code
  createdBy: string;        // 创建人
  created: string;          // 创建时间
  updatedBy: string;        // 更新人
  updated: string;          // 更新时间
  submitter: string;        // 提交人（业务原文）；审批视角由页面切换控件决定
  entries: Entry[];
}

/** Only preloaded fixtures receive these authored example histories. Never infer API audit events
 * from a terminal status: a future server contract must supply its own actor/time/opinion records. */
function fixtureEvents(status: string, day: string, creator: string, updater: string, submitter: string): NonNullable<TemplateRecord['events']> {
  const events: NonNullable<TemplateRecord['events']> = [
    { action: 'created', actor: creator, time: `2025-11-${day} 09:00:00` },
    { action: 'draft', actor: creator, time: `2025-11-${day} 09:30:00` },
  ];
  if (status === 'submitting') return events;
  events.push({ action: 'submitted', actor: submitter, time: `2025-11-${day} 10:00:00` });
  if (status === 'completed' || status === 'rejected') {
    events.push({ action: status === 'completed' ? 'approved' : 'rejected', actor: updater,
      time: `2025-12-${day} 15:00:00`,
      opinion: status === 'completed' ? '配置项及适用范围已核对，审批通过。' : '请完善配置项及版本说明后重新提交。' });
  } else if (status === 'withdrawn') {
    events.push({ action: 'withdraw', actor: updater, time: `2025-12-${day} 15:00:00` });
  }
  return events;
}

/**
 * 模块级 typed mock，接入 API 前由前端持有。
 * 记录存枚举 code（状态 / 类型 / 区域 / 国家 / 车辆类型），展示文案由页面层翻译；
 * 编号、名称、描述、版本号、人名与日期为业务原文。
 * 状态 → 行操作、审批视角、筛选与排序均以这里的字段为唯一数据源。
 */
export const templateRecords = ref<TemplateRecord[]>(types.flatMap((type, index) =>
  Array.from({ length: 7 }, (_, n) => {
    const day = String(2 + n * 3).padStart(2, '0');
    return {
      id: `TPL-${index + 1}-${n + 1}`,
      type,
      name: type === 'vehicle' ? ['乘用车基础配置填写模版', '商用车参数填写模版', '乘用车量产参数填写模版', '商用车变更配置填写模版', '乘用车选装配置填写模版', '商用车选装配置填写模版', '乘用车变更参数填写模版'][n]! : `TPL-${index + 1}-${n + 1}`,
      description: `${descriptions[type]} ${String(n + 1).padStart(2, '0')}`,
      regulation: TEMPLATE_REGULATIONS[n % TEMPLATE_REGULATIONS.length]!,
      region: TEMPLATE_REGION_CODES[n % TEMPLATE_REGION_CODES.length]!,
      country: TEMPLATE_COUNTRY_CODES[n % TEMPLATE_COUNTRY_CODES.length]!,
      vehicleType: TEMPLATE_VEHICLE_TYPE_CODES[n % TEMPLATE_VEHICLE_TYPE_CODES.length]!,
      version: ['V1.0.0', 'V1.2.0', 'V2.0.0'][n % 3]!,
      status: STATUS_CYCLE[n]!,
      createdBy: PEOPLE[n % PEOPLE.length]!,
      created: `2025-11-${day}`,
      updatedBy: PEOPLE[(n + 1) % PEOPLE.length]!,
      updated: `2025-12-${day}`,
      // 提交人为业务原文；审批中行的可见操作由工具栏视角切换控件决定
      submitter: n === 1 ? '李四' : MOCK_CURRENT_USER,
      events: fixtureEvents(STATUS_CYCLE[n]!, day, PEOPLE[n % PEOPLE.length]!, PEOPLE[(n + 1) % PEOPLE.length]!, n === 1 ? '李四' : MOCK_CURRENT_USER),
      entries: type === 'vehicle' ? [
        { id: `vehicle-${n}-model`, name: '销售版本', format: 'text', note: '', tag: 'TAG-SALES' },
        { id: `vehicle-${n}-market`, name: '销售区域', format: 'text', note: '', tag: 'TAG-SALES' },
        { id: `vehicle-${n}-sales`, name: '销售说明', format: 'rich', note: '', tag: 'TAG-SALES' },
        { id: `vehicle-${n}-mass`, name: '整备质量（kg）', format: 'number', note: '', tag: 'TAG-PROJECT' },
        { id: `vehicle-${n}-dimensions`, name: '外廓尺寸', format: 'table', note: '', tag: 'TAG-PROJECT', columns: ['尺寸项目', '数值（mm）'] },
        { id: `vehicle-${n}-description`, name: '项目说明', format: 'rich', note: '', tag: 'TAG-PROJECT' },
      ] : type === 'technical' ? [
        { id: `technical-${n}-mass`, number: '01', name: '整备质量（kg）', format: 'number', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
        { id: `technical-${n}-dimensions`, number: '02', name: '外廓尺寸', format: 'table', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no', columns: ['尺寸项目', '数值（mm）'] },
        { id: `technical-${n}-description`, number: '03', name: '技术说明', format: 'rich', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
        { id: `technical-${n}-version`, number: '04', name: '产品版本', format: 'text', note: '', tag: 'TAG-SALES', partsCertificate: 'no' },
      ] : type === 'testing' ? [
        { id: `testing-${n}-project`, number: '01', name: '试验项目', format: 'text', technical: 'TPL-2-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
        { id: `testing-${n}-method`, number: '02', name: '试验方法', format: 'rich', technical: 'TPL-2-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
        { id: `testing-${n}-measurement`, number: '03', name: '测量值', format: 'number', technical: 'TPL-2-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'yes' },
        { id: `testing-${n}-conditions`, number: '04', name: '试验条件', format: 'table', columns: ['参数', '结果'], technical: 'TPL-2-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
        { id: `testing-${n}-sequence`, number: '05', name: '有序编号', format: 'ordered', technical: 'TPL-2-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
      ] : type === 'report' ? [
        { id: `report-${n}-scope`, number: '01', name: '报告范围', format: 'text', technical: 'TPL-2-3', testing: 'TPL-3-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
        { id: `report-${n}-analysis`, number: '02', name: '分析说明', format: 'rich', technical: 'TPL-2-3', testing: 'TPL-3-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
        { id: `report-${n}-result`, number: '03', name: '结果明细', format: 'table', columns: ['项目', '结果'], technical: 'TPL-2-3', testing: 'TPL-3-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
      ] : type === 'certificate' ? [
        { id: `certificate-${n}-scope`, number: '01', name: '认证范围', format: 'text', technical: 'TPL-2-3', testing: 'TPL-3-3', report: 'TPL-4-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'yes' },
        { id: `certificate-${n}-description`, number: '02', name: '认证说明', format: 'rich', technical: 'TPL-2-3', testing: 'TPL-3-3', report: 'TPL-4-3', note: '', tag: 'TAG-PROJECT', partsCertificate: 'no' },
      ] : [],
    };
  })));

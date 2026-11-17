import { ref } from 'vue';
export const COLOR_CODES = ['blue', 'green', 'orange', 'red', 'purple', 'teal'] as const;
export type ColorCode = (typeof COLOR_CODES)[number];
const DEFAULT_COLOR: ColorCode = 'blue';

export interface Tag {
  id: string;
  name: string;
  description: string;
  color: ColorCode;
  creator: string;
  date: string;
}

const TAG_NAMES = [
  '数据合规', '高风险项', '需复核', '已归档', '跨境传输', '敏感个人信息',
  '车联网数据', '型式试验', '法规变更', '内部评审', '待补充材料', '软件升级',
  '外部审核', '整改跟踪', '试验记录', '证书有效', '临时标签',
];
const PEOPLE = ['王建国', '李思远', '张明'];
export const tagRecords = ref<Tag[]>(TAG_NAMES.map((name, index) => ({
  id: `TAG-${String(index + 1).padStart(4, '0')}`,
  name,
  description: index % 3 === 0 ? `${name}相关的项目与任务标记，用于筛选与归档。` : index % 3 === 1 ? '' : `${name}专用标记`,
  color: COLOR_CODES[index % COLOR_CODES.length],
  creator: PEOPLE[index % PEOPLE.length],
  date: `2026-${String((index % 10) + 1).padStart(2, '0')}-${String(((index * 3) % 27) + 1).padStart(2, '0')}`,
})));

// Responsibility tags shared by vehicle template configuration and task filling.
tagRecords.value.push(
  { id: 'TAG-SALES', name: '销售', description: '车型销售参数填写职责', color: 'blue', creator: '王建国', date: '2026-11-17' },
  { id: 'TAG-PROJECT', name: '项目经理', description: '车型项目参数填写职责', color: 'teal', creator: '王建国', date: '2026-11-17' },
);

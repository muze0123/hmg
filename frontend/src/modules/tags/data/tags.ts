import { ref } from 'vue';
import { MOCK_CURRENT_USER } from '../../projects/data/projects';
export const COLOR_CODES = ['blue', 'green', 'orange', 'red', 'purple', 'teal'] as const;
export type ColorCode = (typeof COLOR_CODES)[number];
/** Local account options until a tenant-scoped personnel-directory API is supplied. */
export const TAG_OWNER_OPTIONS: readonly { accountId: string; name: string }[] = [
  { accountId: MOCK_CURRENT_USER.accountId, name: MOCK_CURRENT_USER.name },
  { accountId: 'tag-user-lisy', name: '李思远' },
  { accountId: 'tag-user-zhangm', name: '张明' },
  { accountId: 'tag-user-zhangs', name: '张三' },
  { accountId: 'tag-user-lis', name: '李四' },
  { accountId: 'tag-user-wangw', name: '王五' },
];
export function tagOwnerName(accountId: string): string {
  return TAG_OWNER_OPTIONS.find(owner => owner.accountId === accountId)?.name || accountId || '—';
}
const STORAGE_KEY = 'hmg-tags-v1';

export interface Tag {
  id: string;
  name: string;
  /** Responsible account ID; display names are resolved through the personnel options. */
  owner: string;
  description: string;
  color: ColorCode;
  creator: string;
  date: string;
  updater?: string;
  updatedAt?: string;
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
  owner: TAG_OWNER_OPTIONS[index % 3]!.accountId,
  description: index % 3 === 0 ? `${name}相关的项目与任务标记，用于筛选与归档。` : index % 3 === 1 ? '' : `${name}专用标记`,
  color: COLOR_CODES[index % COLOR_CODES.length],
  creator: PEOPLE[index % PEOPLE.length],
  updater: PEOPLE[(index + 1) % PEOPLE.length],
  updatedAt: `2026-11-${String(index + 1).padStart(2, '0')} 10:00:00`,
  date: `2026-${String((index % 10) + 1).padStart(2, '0')}-${String(((index * 3) % 27) + 1).padStart(2, '0')}`,
})));

// Responsibility tags shared by vehicle template configuration and task filling.
tagRecords.value.push(
  { id: 'TAG-SALES', name: '销售', owner: 'tag-user-zhangs', description: '车型销售参数填写职责', color: 'blue', creator: '王建国', date: '2026-11-17' },
  { id: 'TAG-PROJECT', name: '项目经理', owner: 'tag-user-lis', description: '车型项目参数填写职责', color: 'teal', creator: '王建国', date: '2026-11-17' },
);

// Persist tag maintenance only. This does not rewrite assignments on previously issued tasks.
try {
  const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
  if (Array.isArray(saved)) {
    tagRecords.value = saved.filter((row): row is Tag => !!row && typeof row.id === 'string' && typeof row.name === 'string'
      && typeof row.description === 'string' && typeof row.creator === 'string' && typeof row.date === 'string'
      && COLOR_CODES.includes(row.color)).map(row => ({ ...row, owner: typeof row.owner === 'string' ? row.owner : '' }));
  }
} catch { /* Existing authored records remain available when storage cannot be read. */ }
export function saveTagRecord(record: Tag) {
  const exists = tagRecords.value.some(row => row.id === record.id);
  const next = exists ? tagRecords.value.map(row => row.id === record.id ? { ...record } : row) : [{ ...record }, ...tagRecords.value];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  tagRecords.value = next;
}
export function deleteTagRecord(id: string) {
  const next = tagRecords.value.filter(row => row.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  tagRecords.value = next;
}

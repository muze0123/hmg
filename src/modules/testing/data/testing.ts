import { reactive } from 'vue';
import { technicalTasks } from '../../technical/data/technical';

export const STATUS_CODES = ['notStarted', 'inProgress', 'pending', 'reviewing', 'rejected', 'completed', 'paused'] as const;
export const FORMAT_CODES = ['number', 'ordered', 'table', 'rich', 'text'] as const;
export const PRIORITY_CODES = ['urgent', 'high', 'normal'] as const;
export type Status = typeof STATUS_CODES[number];
export type Format = typeof FORMAT_CODES[number];
export interface TableRow { parameter: string; result: string }
export interface EntryValue { text: string; rows: TableRow[] }
export interface TestItem { id: string; name: string; format: Format; tag: 'required' | 'optional'; reference?: string }
export interface ReviewRecord { id: string; reviewer: string; result: 'passed' | 'rejected'; opinion: string; time: string }
export interface TestTask {
  id: string; regulation: string; project: string; name: string;
  priority: typeof PRIORITY_CODES[number]; status: Status;
  start: string; end: string; actual: string; owner: string; reviewer: string;
  vehicleReady: boolean; template: string; version: string; models: string[];
  items: TestItem[]; values: Record<string, Record<string, EntryValue>>; history: ReviewRecord[];
}
export const emptyValue = (): EntryValue => ({ text: '', rows: [{ parameter: '', result: '' }] });
export const cloneValues = (values: TestTask['values']): TestTask['values'] => JSON.parse(JSON.stringify(values));

export const testTasks = reactive<TestTask[]>(Array.from({ length: 21 }, (_, index) => {
  const number = String(index + 1).padStart(4, '0');
  const status = STATUS_CODES[index % STATUS_CODES.length]!;
  const filled = ['reviewing', 'completed', 'rejected'].includes(status);
  const models = ['CAR-0001', 'CAR-0002'];
  const items: TestItem[] = [
    { id: '1.1', name: 'testProject', format: 'text', tag: 'required' },
    { id: '1.2', name: 'testMethod', format: 'rich', tag: 'required' },
    { id: '1.3', name: 'measurement', format: 'number', tag: 'required' },
    { id: '1.4', name: 'conditions', format: 'table', tag: 'required' },
    { id: '1.5', name: 'sequence', format: 'ordered', tag: 'optional' },
    { id: '1.6', name: 'technicalMass', format: 'number', tag: 'optional', reference: `TECH-${number}` },
  ];
  const values = Object.fromEntries(models.map(model => [model, Object.fromEntries(items.map(item => [item.id, filled ? {
    text: item.format === 'number' ? '1800' : item.format === 'ordered' ? '1. Preparation\n2. Measurement' : 'GB-2024-001',
    rows: [{ parameter: 'T (°C)', result: '23' }],
  } : emptyValue()]))]));
  return {
    id: `TEST-${number}`, regulation: `${index < 2 ? 'GB' : 'EU'}-2024-${String(index + 1).padStart(3, '0')}`,
    project: `PROJ-${number}`, name: `项目${index + 1}`, priority: PRIORITY_CODES[index % 3]!, status,
    start: '2026-11-01', end: '2026-11-30', actual: status === 'completed' ? '2026-11-07' : '',
    owner: '张三', reviewer: '李四', vehicleReady: index !== 0, template: 'TPL-TEST-0001', version: 'V1.0',
    models, items, values, history: status === 'rejected' ? [{ id: `REVIEW-${number}`, reviewer: '李四', result: 'rejected', opinion: '请补充试验条件', time: '2026-11-06 10:00:00' }] : [],
  };
}));

const sourceTechnicalTasks = reactive(technicalTasks);

export function referenceValue(item: TestItem): EntryValue {
  const source = sourceTechnicalTasks.find(task => task.id === item.reference);
  return { text: source?.status === 'completed' ? source.value : '', rows: [] };
}
export function itemValue(task: TestTask, values: TestTask['values'], model: string, item: TestItem): EntryValue {
  return item.reference ? referenceValue(item) : values[model]?.[item.id] ?? emptyValue();
}
export function validValue(item: TestItem, value: EntryValue): boolean {
  if (item.reference) return true;
  if (item.format === 'table' && item.tag === 'optional' && !value.rows.some(row => row.parameter.trim() || row.result.trim())) return true;
  if (item.format === 'table') return value.rows.length > 0 && value.rows.every(row => row.parameter.trim() && row.result.trim());
  if (!value.text.trim()) return item.tag === 'optional';
  if (item.format === 'number') return Number.isFinite(Number(value.text));
  if (item.format === 'ordered') return value.text.split('\n').filter(line => line.trim()).every(line => /^\d+(?:\.\d+)*\.\s*\S/.test(line));
  return true;
}

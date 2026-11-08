export const STATUS_CODES = ['notStarted','inProgress','pending','reviewing','completed','rejected','paused'] as const;
export const TYPE_CODES = ['technical','test','certificate','report'] as const;
export const PRIORITY_CODES = ['urgent','high','normal'] as const;
export interface Item { id: string; project: string; name: string; law: string; priority: typeof PRIORITY_CODES[number]; type: typeof TYPE_CODES[number]; status: typeof STATUS_CODES[number]; start: string; end: string; actual: string; }
export const items: Item[] = Array.from({ length: 15 }, (_, i) => ({id: `ITEM-${i+1}`,project: `PROJ-${String([1,1,1,1,12,12,12,12,12,12,12,14,14,3,3][i]).padStart(4,'0')}`,name: `项目${i<4?1:i<11?2:i<13?3:4}`,law: i<2?'GB-2024-001':i<4?'GB-2024-002':`EU-2024-00${1+Math.floor((i-4)/4)}`,priority: PRIORITY_CODES[i<4?0:i<11?1:2]!,type: TYPE_CODES[i%4]!,status: STATUS_CODES[Math.min(6,Math.floor(i/2))]!,start:'2025-12-31',end:'2026-12-31',actual:i===8||i===9?'2026-10-31':''}));

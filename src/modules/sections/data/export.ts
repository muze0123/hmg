import ExcelJS from 'exceljs';
import type { Item } from './items';

/**
 * 分项管理导出（DESIGN.md · Batch export baseline）。
 *
 * 只把「已应用筛选结果」按当前可见列写成 xlsx；表头与枚举文案由页面层翻译好后传入，
 * 本文件不依赖 i18n，也不决定列集。文件名与下载任务登记由页面层负责。
 */
export interface SectionsExportHeader {
  key: string;
  label: string;
}

export interface SectionsExportInput {
  rows: Item[];
  display?: (row: Item, key: string) => string;
  headers: SectionsExportHeader[];
  sheetName: string;
  /** 枚举 code → 当前语言的展示文案 */
  label: (code: string) => string;
}

const ENUM_KEYS = new Set(['priority', 'type', 'status']);
const COLUMN_WIDTHS: Record<string, number> = {
  project: 18,
  name: 14,
  priority: 12,
  law: 18,
  status: 14,
  type: 16,
  start: 16,
  end: 18,
  actual: 18,
  executor: 16, executedAt: 24, reviewer: 16, reviewedAt: 24,
};

export async function makeSectionsExport(input: SectionsExportInput): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'app';
  const sheet = workbook.addWorksheet(input.sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.addRow(input.headers.map((header) => header.label));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 26;
  sheet.columns = input.headers.map((header) => ({ width: COLUMN_WIDTHS[header.key] ?? 18 }));

  for (const row of input.rows) {
    sheet.addRow(input.headers.map((header) => {
      if (input.display) return input.display(row, header.key);
      const value = String(row[header.key as keyof Item] ?? '');
      if (ENUM_KEYS.has(header.key)) return input.label(value);
      return value || '—';
    }));
  }

  return new Blob([await workbook.xlsx.writeBuffer() as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

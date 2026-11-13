import ExcelJS from 'exceljs';
import type { TemplateRecord } from './templates';

/**
 * 模版使用记录导出（DESIGN.md · Batch export baseline）。
 *
 * 只把「已应用筛选结果」按当前可见列写成 xlsx；表头与枚举文案由页面层翻译好后传入，
 * 本文件不依赖 i18n，也不决定列集。文件名与下载任务登记由页面层负责。
 */
export interface UsageExportHeader {
  key: string;
  label: string;
}

export interface UsageExportInput {
  rows: TemplateRecord[];
  headers: UsageExportHeader[];
  sheetName: string;
  /** 单元格展示文本：枚举走当前语言文案，空值统一「—」 */
  display: (row: TemplateRecord, key: string) => string;
}

const COLUMN_WIDTHS: Record<string, number> = {
  name: 24,
  type: 18,
  version: 14,
  project: 22,
  user: 16,
  used: 22,
};

export async function makeUsageExport(input: UsageExportInput): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'app';
  const sheet = workbook.addWorksheet(input.sheetName, { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.addRow(input.headers.map((header) => header.label));
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 26;
  sheet.columns = input.headers.map((header) => ({ width: COLUMN_WIDTHS[header.key] ?? 18 }));

  for (const row of input.rows) {
    sheet.addRow(input.headers.map((header) => input.display(row, header.key)));
  }

  return new Blob([await workbook.xlsx.writeBuffer() as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

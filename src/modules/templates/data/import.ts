import ExcelJS from 'exceljs';

/**
 * 模版配置批量导入（DESIGN.md · Batch import baseline）。
 *
 * 导入模版固定 4 列自由文本：模版名称 / 模版描述 / 法规编号 / 最新版本号；
 * 其余系统字段（模版类型、适用区域 / 国家 / 车辆类型、状态、创建人与时间）由页面层
 * 按当前类型 tab 与当前用户补齐，因此导入模版与下方解析器可以完整 round-trip。
 * 本文件不依赖 i18n，也不决定文件名与任务登记。
 */
export interface TemplateImportRow {
  name: string;
  description: string;
  regulation: string;
  version: string;
}

const SHEET_NAME = 'templates';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function makeTemplateImportTemplate(labels: readonly string[]): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'app';
  const sheet = workbook.addWorksheet(SHEET_NAME);
  sheet.addRow([...labels]);
  sheet.getRow(1).font = { bold: true };
  sheet.getRow(1).height = 26;
  sheet.columns = labels.map(() => ({ width: 26 }));
  return new Blob([await workbook.xlsx.writeBuffer() as BlobPart], { type: XLSX_MIME });
}

export async function parseTemplateImportFile(file: File): Promise<TemplateImportRow[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.worksheets[0];
  if (!sheet) return [];
  const rows: TemplateImportRow[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const cell = (index: number) => String(row.getCell(index).text ?? '').trim();
    const name = cell(1);
    if (!name) return;
    rows.push({ name, description: cell(2), regulation: cell(3), version: cell(4) || 'V1.0.0' });
  });
  return rows;
}

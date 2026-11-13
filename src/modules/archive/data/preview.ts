import type { ArchiveProject, Deliverable } from './archive';

/**
 * 归档交付物的在线预览 / 下载内容层。
 *
 * 集成边界（开发者说明，不进入页面文案）：归档档案服务尚未接入，交付物没有后端
 * 文件地址。这里按交付物的真实扩展名在浏览器内生成相应格式的可读文档，使第三方
 * 预览组件拿到的是合法文件而非伪造的文本替身；接入档案服务后，只需把
 * createArchiveFile / previewKind 的调用替换为服务返回的文件地址即可，
 * 页面与预览组件的分派逻辑无需改动。
 */

export type PreviewKind = 'pdf' | 'docx' | 'excel' | 'text';

export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf('.');
  return dot < 0 ? '' : fileName.slice(dot + 1).toLowerCase();
}

/** 扩展名 → 预览器。docx / xlsx / pdf 交给第三方组件，其余按纯文本呈现。 */
export function previewKind(fileName: string): PreviewKind {
  const ext = fileExtension(fileName);
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  if (ext === 'xlsx' || ext === 'xls') return 'excel';
  return 'text';
}

export function previewMime(fileName: string): string {
  switch (previewKind(fileName)) {
    case 'pdf': return 'application/pdf';
    case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    case 'excel': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    default: return fileExtension(fileName) === 'json' ? 'application/json;charset=utf-8' : 'text/plain;charset=utf-8';
  }
}

function archiveLines(project: ArchiveProject, row: Deliverable): string[] {
  return [
    `Project: ${project.name}`,
    `Project ID: ${project.id}`,
    `Deliverable: ${row.name}`,
    `Activity: ${row.activity}`,
    `Delivery date: ${row.date}`,
    `Owner: ${row.owner}`,
  ];
}

/** PDF 内置 Helvetica 只覆盖 ASCII，中文值以 Unicode 转义呈现，避免生成乱码字节。 */
function asciiText(value: string): string {
  return [...value]
    .map((char) => (char.charCodeAt(0) < 128 ? char : `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`))
    .join('');
}
function pdfString(value: string): string {
  return asciiText(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** 生成单页、Type1 Helvetica 的最小合法 PDF（含 xref 表，PDF.js 可直接解析）。 */
function makePdf(lines: string[]): Blob {
  const stream = [
    'BT', '/F1 12 Tf', '16 TL', '48 780 Td',
    ...lines.map((line) => `(${pdfString(line)}) Tj T*`),
    'ET',
  ].join('\n');
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n',
    `4 0 obj\n<< /Length ${stream.length} >>\nstream\n${stream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n',
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  for (const object of objects) {
    offsets.push(pdf.length);
    pdf += object;
  }
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: previewMime('file.pdf') });
}

function xmlText(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** 生成最小 OOXML 文档：docx-preview 只要求内容类型、包关系与 document.xml。 */
async function makeDocx(lines: string[]): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);
  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"/>`);
  const paragraphs = lines
    .map((line) => `<w:p><w:r><w:t xml:space="preserve">${xmlText(line)}</w:t></w:r></w:p>`)
    .join('');
  zip.file('word/document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${paragraphs}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/></w:sectPr></w:body></w:document>`);
  return zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

async function makeXlsx(project: ArchiveProject, row: Deliverable): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Archive');
  sheet.addRow(['Field', 'Value']);
  sheet.getRow(1).font = { bold: true };
  sheet.columns = [{ width: 22 }, { width: 40 }];
  for (const line of archiveLines(project, row)) {
    const split = line.indexOf(': ');
    sheet.addRow([line.slice(0, split), line.slice(split + 2)]);
  }
  return new Blob([await workbook.xlsx.writeBuffer() as BlobPart], {
    type: previewMime('file.xlsx'),
  });
}

/** 生成与交付物扩展名一致的可读文件，供预览组件与下载任务共用。 */
export async function createArchiveFile(row: Deliverable, project: ArchiveProject): Promise<Blob> {
  const lines = archiveLines(project, row);
  switch (previewKind(row.name)) {
    case 'pdf': return makePdf(lines);
    case 'docx': return makeDocx(lines);
    case 'excel': return makeXlsx(project, row);
    default: return new Blob([lines.join('\n')], { type: previewMime(row.name) });
  }
}

import { ref } from 'vue';
import { technicalTasks } from '../../technical/data/technical';
import type { CertificateEntry } from '../../certificates/data/certificates';

export const LIBRARY_STATUSES = ['submitting', 'reviewing', 'completed', 'rejected', 'withdrawn'] as const;
export const libraryPerspective = ref<'submitter' | 'approver'>('submitter');
export type LibraryStatus = typeof LIBRARY_STATUSES[number];
export const LIBRARY_EVENT_ACTIONS = ['create', 'draft', 'submit', 'approve', 'reject', 'withdraw', 'import'] as const;
export interface LibraryEvent {
  id: string;
  action: typeof LIBRARY_EVENT_ACTIONS[number];
  actor: string;
  time: string;
  comment?: string;
}
export interface LibraryEntry extends CertificateEntry {
  name?: string;
  regulationName?: string;
}

export interface LibraryRecord {
  id: string;
  name: string;
  project: string;
  status: LibraryStatus;
  entries: LibraryEntry[];
  history: { reviewer: string; approved: boolean; opinion: string; time: string }[];
  events?: LibraryEvent[];
}

export function appendLibraryEvent(record: LibraryRecord, action: LibraryEvent['action'], actor: string, comment?: string) {
  record.events ??= [];
  record.events.push({
    id: crypto.randomUUID(),
    action,
    actor,
    time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Shanghai' }),
    comment,
  });
}

// Preserve existing approval history when rendering records created before event tracking.
export function libraryTimeline(record: LibraryRecord): LibraryEvent[] {
  const approvals = record.history.map((event, index): LibraryEvent => ({
    id: `approval-${index}`,
    action: event.approved ? 'approve' : 'reject',
    actor: event.reviewer,
    time: event.time,
    comment: event.opinion,
  }));
  return [...(record.events ?? []), ...approvals].sort((a, b) => a.time.localeCompare(b.time));
}

// Independent library fixtures; no API or persistence contract has been established.
// Seed events follow each certificate's status and its related technical task's people and dates.
// CL-0003（已完成）附带示例 PDF 附件，供详情页「预览文件 / 下载」链路联调；接入后端后由真实附件替换。
function sampleCertificatePdf(): File | null {
  if (typeof File === 'undefined') return null;
  const pdf = '%PDF-1.4\n'
    + '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n'
    + '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n'
    + '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 595 842]/Resources<</Font<</F1 4 0 R>>>>/Contents 5 0 R>>endobj\n'
    + '4 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n'
    + '5 0 obj<</Length 96>>stream\nBT /F1 24 Tf 72 770 Td (CERT-2026-003 sample certificate) Tj ET\nBT /F1 14 Tf 72 730 Td (HMG certificate library preview demo) Tj ET\nendstream\nendobj\n'
    + 'xref\n0 6\ntrailer<</Size 6/Root 1 0 R>>\nstartxref\n9\n%%EOF';
  return new File([pdf], 'CERT-2026-003.pdf', { type: 'application/pdf' });
}
export const libraryRecords = ref<LibraryRecord[]>(technicalTasks.slice(0, 16).map((task, index) => {
  const status = LIBRARY_STATUSES[index % LIBRARY_STATUSES.length]!;
  const events: LibraryEvent[] = [
    { id: 'created', action: 'create', actor: task.owner, time: task.createdAt },
    { id: 'draft', action: 'draft', actor: task.owner, time: '2026-11-02 09:00:00' },
  ];
  if (status !== 'submitting') {
    events.push({ id: 'submitted', action: 'submit', actor: task.owner, time: '2026-11-02 10:00:00' });
  }
  if (status === 'withdrawn') {
    events.push({ id: 'withdrawn', action: 'withdraw', actor: task.owner, time: '2026-11-03 09:00:00' });
  }
  const history = status === 'completed' || status === 'rejected'
    ? [{ reviewer: task.reviewer, approved: status === 'completed', opinion: '', time: '2026-11-03 10:00:00' }]
    : [];
  return {
    id: `CL-${String(index + 1).padStart(4, '0')}`,
    name: `CERT-2026-${String(index + 1).padStart(3, '0')}`,
    project: task.project,
    status,
    entries: [{ regulation: task.regulation, regulationName: ['车辆排放标准', '整车安全要求', '车辆电磁兼容要求', '车辆制动性能要求'][index % 4], number: `CERT-2026-${String(index + 1).padStart(3, '0')}`, issuer: '中汽研', agency: 'TÜV', issued: '2026-01-10', expires: '2029-01-09', file: index === 2 ? sampleCertificatePdf() : null }],
    events,
    history,
  };
}));

import { ref } from 'vue';
export interface CertificateEntry {
  regulation: string; number: string; issuer: string; agency: string; issued: string; expires: string; file: File | null;
}
export interface Certificate {
  entries?: CertificateEntry[];
  history?: { opinion: string; approved: boolean; time: string }[];
  id: string; project: string; regulation: string; number: string;
  issuer: string; agency: string; issued: string; expires: string;
  status: 'pending' | 'active' | 'review' | 'rejected' | 'completed' | 'paused';
  file: File | null; opinion: string;
}
export const certificates = ref<Certificate[]>(Array.from({ length: 8 }, (_, index) => ({
  id: `CERT-${String(index + 1).padStart(4, '0')}`, project: `PROJ-${String(index % 3 + 1).padStart(4, '0')}`,
  regulation: `EU-2024-${String(index + 1).padStart(3, '0')}`, number: `CERT-2024-00${index + 1}`,
  issuer: '中汽研', agency: 'TÜV', issued: '2024-01-10', expires: '2027-01-09',
  status: index === 1 ? 'review' : 'active', file: null, opinion: '',
})));

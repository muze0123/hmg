import { ref } from 'vue';
export const currentApiUser = ref('');
let authorization = '';
export class ApiError extends Error {
  constructor(public status: number, public body: { code?: string; errors?: { path: string; code: string }[] }) { super(body.code || String(status)); }
}
export async function request<T>(path: string, body?: unknown, method = 'GET', headers: Record<string,string> = {}): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { method, headers: { 'Content-Type': 'application/json', ...(authorization ? { Authorization: authorization } : {}), ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401) { currentApiUser.value = ''; authorization = ''; }
    throw new ApiError(response.status, payload);
  }
  return payload as T;
}
export async function signIn(username: string, password: string) {
  const previous = authorization;
  authorization = `Basic ${btoa(unescape(encodeURIComponent(`${username}:${password}`)))}`;
  try { await request<TemplateVersion[]>('/template-versions'); currentApiUser.value = username; }
  catch (error) { authorization = previous; throw error; }
}
export function disconnect() { currentApiUser.value = ''; authorization = ''; }
export const kinds = ['VEHICLE','TECHNICAL','TESTING','REPORT','CERTIFICATE'] as const;
export type Kind = typeof kinds[number];
export const formats = ['TEXT','NUMBER','ORDERED','RICH','TABLE'] as const;
export type Format = typeof formats[number];
export interface Column { id: string; label: string; format: 'TEXT' | 'NUMBER'; required: boolean }
export interface Field { id: string; label: string; format: Format; required: boolean; minimum?: number; maximum?: number; maxLength?: number; columns?: Column[] }
export interface Schema { templateId: string; revision: string; name: string; kind: Kind; regulationId?: string; fields: Field[] }
export interface TemplateVersion { id: string; published: boolean; schema: Schema }
export interface TaskNode { id: string; level: 'MAIN'|'SECTION'|'SUBTASK'; kind?: Kind; regulationId?: string; templateVersionId?: string; templateSnapshot?: Schema; executor: string; reviewers: string[]; reviewStep: number; state: string; valuesJson: string; children: TaskNode[] }
export interface TaskView { id: string; version: number; task: { name: string; vehicleId: string; workflowVersion: string; root: TaskNode; history: { nodeId: string; action: string; actor: string; comment: string; time: string }[] } }

import { ref } from 'vue';
import { useUserProfileStore } from '../../app/stores/userProfile';
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
export interface MeProfile { account: string; tenantId: string; tenantName: string | null; displayName: string | null; department: string | null; roles: string[] }
export async function signIn(username: string, password: string) {
  const previous = authorization;
  const bytes = new TextEncoder().encode(`${username}:${password}`);
  const credentials = Array.from(bytes, byte => String.fromCharCode(byte)).join('');
  authorization = `Basic ${btoa(credentials)}`;
  try {
    await request<TemplateVersion[]>('/template-versions');
    currentApiUser.value = username;
    // 身份摘要来自服务端；拉取失败不阻断登录，弹层显示账号与占位。
    const me = await request<MeProfile>('/me').catch(() => null);
    useUserProfileStore().setUserCenterProfile({
      account: me?.account ?? username,
      tenantName: me?.tenantName ?? null,
      displayName: me?.displayName ?? null,
      department: me?.department ?? null,
      roles: me?.roles ?? [],
      avatarUrl: null,
    });
  }
  catch (error) { authorization = previous; throw error; }
}
export const kinds = ['VEHICLE','TECHNICAL','TESTING','REPORT','CERTIFICATE'] as const;
export type Kind = typeof kinds[number];
export const formats = ['TEXT','NUMBER','ORDERED','RICH','TABLE'] as const;
export type Format = typeof formats[number];
export interface Column { id: string; label: string; format: 'TEXT' | 'NUMBER'; required: boolean }
export interface Field { id: string; label: string; format: Format; required: boolean; minimum?: number; maximum?: number; maxLength?: number; columns?: Column[] }
export interface Schema { templateId: string; revision: string; name: string; kind: Kind; regulationId?: string; fields: Field[] }
export interface TemplateVersion { id: string; published: boolean; schema: Schema }
export interface TaskNode { id: string; level: 'MAIN'|'SECTION'|'SUBTASK'; kind?: Kind; regulationId?: string; templateVersionId?: string; templateSnapshot?: Schema; executor: string; reviewers: string[]; reviewStep: number; state: string; valuesJson: string; children: TaskNode[] }
export interface TaskView { id: string; version: number; task: { descendantsPaused?: boolean; name: string; vehicleId: string; workflowVersion: string; root: TaskNode; history: { nodeId: string; action: string; actor: string; comment: string; time: string }[] } }

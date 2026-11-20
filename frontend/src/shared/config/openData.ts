const baseUrl = import.meta.env.VITE_OPENDATA_BASE_URL || 'http://127.0.0.1:5173';

export const openDataAccountUrl = new URL('/settings/account', baseUrl).href;
export const openDataAuditUrl = new URL('/settings/audit', baseUrl).href;
export const openDataLoginUrl = import.meta.env.VITE_OPENDATA_LOGIN_URL || new URL('/login', baseUrl).href;

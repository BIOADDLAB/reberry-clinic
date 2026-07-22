import { createHash } from 'crypto';

export const ADMIN_COOKIE_NAME = 'reberry_admin_session';

export const ADMIN_ID = 'admin';
const ADMIN_PASSWORD = 'admin123!@';

// 쿠키에 저장할 값 — 비밀번호를 그대로 저장하지 않고 SHA-256 해시로 한번 감싸서 저장
export const getAdminAuthToken = () => createHash('sha256').update(ADMIN_PASSWORD).digest('hex');

export const verifyAdminCredentials = (id: string, password: string) => id === ADMIN_ID && password === ADMIN_PASSWORD;

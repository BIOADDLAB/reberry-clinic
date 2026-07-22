export const ADMIN_COOKIE_NAME = 'reberry_admin_session';

export const getAdminAuthToken = () => process.env.ADMIN_SESSION_SECRET || 'reberry-admin-session-token-v1';

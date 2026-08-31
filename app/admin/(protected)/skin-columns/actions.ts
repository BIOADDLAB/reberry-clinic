'use server';

import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, getAdminAuthToken } from '@/app/admin/auth';
import { syncNaverBlogSkinColumns } from '@/components/lib/skinColumnBlogSync';

export async function syncBlogSkinColumnsAction() {
    const cookieStore = await cookies();
    if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== getAdminAuthToken()) {
        throw new Error('관리자 권한이 필요합니다.');
    }

    return syncNaverBlogSkinColumns();
}

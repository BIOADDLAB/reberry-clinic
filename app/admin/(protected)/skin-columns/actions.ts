'use server';

import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, getAdminAuthToken } from '@/app/admin/auth';
import { syncNaverBlogSkinColumns } from '@/components/lib/skinColumnBlogSync';

/* #ISSUE: 2026.09.17 병원 문의 — [블로그에서 가져오기] 를 누르면 "An error occurred in the
   Server Components render. The specific message is omitted in production builds…" 만 떴다.
   Next 는 배포판에서 서버 오류 내용을 지우고 digest 만 남긴다. 그래서 관리자 화면에는
   원인을 알 수 없는 영어 문구가 나오고, 서버 쪽에도 아무 기록이 남지 않아 무엇이 막혔는지
   (네이버가 막았는지 · 시간이 초과됐는지) 알 수 없었다. 9월 8일 뒤로 수집이 멈춘 것도
   모르고 지나갔다.
   → 원인은 서버 기록으로 남기고, 화면에는 사람이 읽고 판단할 수 있는 한국어 문구를 준다. */
export async function syncBlogSkinColumnsAction() {
    const cookieStore = await cookies();
    if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== getAdminAuthToken()) {
        throw new Error('관리자 권한이 필요합니다. 다시 로그인한 뒤 눌러 주세요.');
    }

    try {
        return await syncNaverBlogSkinColumns();
    } catch (error) {
        console.error('[skin-columns/sync] failed', error);
        throw new Error(adminSyncMessage(error));
    }
}

/** 배포판에서도 지워지지 않게, 원인별로 미리 만들어 둔 문구를 돌려준다. */
function adminSyncMessage(error: unknown): string {
    const detail = error instanceof Error ? error.message : String(error);

    if (/RSS를 불러오지 못했습니다|글목록을 불러오지 못했습니다/.test(detail)) {
        return `${detail} 네이버 쪽에서 접속을 막은 것일 수 있습니다. 몇 분 뒤 다시 눌러 주세요.`;
    }
    if (/timeout|aborted|ETIMEDOUT|ENOTFOUND|fetch failed/i.test(detail)) {
        return '네이버 블로그에 연결하지 못했습니다. 잠시 뒤 다시 눌러 주세요.';
    }
    if (/permission|PERMISSION_DENIED|unauthorized/i.test(detail)) {
        return '저장 권한이 거부됐습니다. 관리자에게 알려 주세요. (Firebase 권한 설정)';
    }
    return `블로그 글을 가져오지 못했습니다. (${detail})`;
}

'use server';

import { cookies } from 'next/headers';
import { ADMIN_COOKIE_NAME, getAdminAuthToken } from '@/app/admin/auth';
import { syncNaverBlogSkinColumns } from '@/components/lib/skinColumnBlogSync';
import type { BlogImportResult } from '@/components/lib/skinColumnBlogImport';

export type SyncBlogSkinColumnsResponse =
    | { ok: true; result: BlogImportResult }
    | { ok: false; message: string };

/* #ISSUE: 2026.09.17 병원 문의 — [블로그에서 가져오기] 를 누르면 "An error occurred in the
   Server Components render. The specific message is omitted in production builds…" 만 떴다.
   Next 는 배포판에서 서버 오류 내용을 지우고 digest 만 남긴다. 그래서 관리자 화면에는
   원인을 알 수 없는 영어 문구가 나오고, 서버 쪽에도 아무 기록이 남지 않아 무엇이 막혔는지
   (네이버가 막았는지 · 시간이 초과됐는지) 알 수 없었다. 9월 8일 뒤로 수집이 멈춘 것도
   모르고 지나갔다.
   → 원인은 서버 기록으로 남기고, 화면에는 사람이 읽고 판단할 수 있는 한국어 문구를 준다.
   배포판에서는 throw 한 Error 의 문장도 지워지고 digest 영어만 남는다.
   → 실패도 값으로 돌려줘서 그 문장이 관리자 화면에 그대로 나오게 한다. */
export async function syncBlogSkinColumnsAction(): Promise<SyncBlogSkinColumnsResponse> {
    const cookieStore = await cookies();
    if (cookieStore.get(ADMIN_COOKIE_NAME)?.value !== getAdminAuthToken()) {
        return { ok: false, message: '관리자 권한이 필요합니다. 다시 로그인한 뒤 눌러 주세요.' };
    }

    try {
        return { ok: true, result: await syncNaverBlogSkinColumns() };
    } catch (error) {
        console.error('[skin-columns/sync] failed', error);
        return { ok: false, message: '블로그 글을 가져오지 못했습니다. 관리자에게 문의하세요.' };
    }
}

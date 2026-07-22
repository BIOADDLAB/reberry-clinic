// #ISSUE: /admin/* 접근 가드. Next 16 부터 middleware.ts 대신 proxy.ts 컨벤션 사용!!
// proxy.ts는 항상 Node.js 런타임에서 실행되므로(Edge 아님) auth.ts의 Node crypto 모듈을 그대로 써도 안전함
import { NextResponse, type NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, getAdminAuthToken } from '@/app/admin/auth';

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // 로그인 화면(/admin) 자체는 항상 통과 — 그 외 /admin/* 하위 페이지만 가드
    if (pathname === '/admin') return NextResponse.next();

    const isAuthed = req.cookies.get(ADMIN_COOKIE_NAME)?.value === getAdminAuthToken();
    if (!isAuthed) {
        return NextResponse.redirect(new URL('/admin?error=1', req.url));
    }
    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*'],
};

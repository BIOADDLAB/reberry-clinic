/* #ISSUE: 관리자 공통 셸. 실제 접근 차단은 proxy.ts 가 처리하고 여기는 화면(네비+본문)만 담당
    반응형: 모바일에서는 사이드바가 위쪽 가로 메뉴로 바뀜 (md 이상에서만 왼쪽 세로 사이드바) */

import Link from 'next/link';
import { logoutAdmin } from '../actions';

const NAV = [
    { href: '/admin/ba', label: '전후사진 관리' },
    { href: '/admin/columns', label: '칼럼 관리' },
];

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-[#F5F2EC] md:flex-row">
            {/* 사이드바 (모바일에서는 상단 바) */}
            <aside className="flex shrink-0 flex-col bg-cocoa text-cream md:sticky md:top-0 md:h-dvh md:w-60">
                <div className="flex items-center justify-between px-5 py-4 md:block md:px-6 md:py-7">
                    <div>
                        <p className="font-display text-caption tracking-[0.2em] text-cream/60">RE:BERRY</p>
                        <p className="mt-0.5 text-lead font-bold md:mt-1">관리자</p>
                    </div>
                    {/* 모바일에서는 로그아웃을 상단 오른쪽에 */}
                    <form action={logoutAdmin} className="md:hidden">
                        <button type="submit" className="text-small text-cream/60">
                            로그아웃
                        </button>
                    </form>
                </div>

                <nav className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0">
                    {NAV.map((n) => (
                        <Link
                            key={n.href}
                            href={n.href}
                            className="shrink-0 rounded-lg px-3 py-2.5 text-small text-cream/85 transition-colors hover:bg-cream/10 hover:text-cream"
                        >
                            {n.label}
                        </Link>
                    ))}
                </nav>

                {/* 데스크탑에서만 하단 로그아웃 */}
                <form action={logoutAdmin} className="hidden px-3 pb-6 md:block">
                    <button
                        type="submit"
                        className="w-full rounded-lg px-3 py-2.5 text-left text-small text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream"
                    >
                        로그아웃
                    </button>
                </form>
            </aside>

            <main className="flex-1 px-4 py-6 md:px-10 md:py-9">{children}</main>
        </div>
    );
}

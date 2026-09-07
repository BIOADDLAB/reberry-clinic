/* #ISSUE: 관리자 공통 셸. 실제 접근 차단은 proxy.ts 가 처리하고 여기는 화면(네비+본문)만 담당
   #ISSUE: 예전 셸은 현재 페이지 표시가 없어 어디에 있는지 알기 어렵고, 모바일에서는
           세로 메뉴가 그대로 눌려 들어가 좁았다.
   → 데스크탑: 아이콘 + 설명이 붙은 사이드바(현재 메뉴 강조)
     모바일: 상단 브랜드바 + 가로 스크롤 알약 메뉴
     본문은 max-w 를 잡아 넓은 화면에서도 줄 길이가 늘어지지 않게 한다. */

import AdminNav from '@/components/admin/AdminNav';
import { logoutAdmin } from '../actions';

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-[#F5F2EC] md:flex-row">
            <aside className="flex shrink-0 flex-col bg-cocoa text-cream md:sticky md:top-0 md:h-dvh md:w-64">
                <div className="flex items-center justify-between px-4 py-4 md:px-5 md:py-7">
                    <div>
                        <p className="notranslate font-display text-caption tracking-[0.2em] text-cream/55">RE:BERRY</p>
                        <p className="mt-0.5 text-lead font-bold md:mt-1">관리자</p>
                    </div>
                    <form action={logoutAdmin} className="md:hidden">
                        <button type="submit" className="rounded-full bg-cream/10 px-3 py-1.5 text-caption text-cream/80">
                            로그아웃
                        </button>
                    </form>
                </div>

                {/* 모바일 = 가로 알약 / 데스크탑 = 세로 사이드바 */}
                <div className="md:hidden">
                    <AdminNav variant="mobile" />
                </div>
                <div className="hidden md:flex md:flex-1 md:flex-col">
                    <AdminNav />
                </div>

                <div className="hidden px-3 pb-6 md:block">
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="mb-1 block rounded-xl px-3 py-2.5 text-small text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream"
                    >
                        홈페이지 열기 ↗
                    </a>
                    <form action={logoutAdmin}>
                        <button
                            type="submit"
                            className="w-full rounded-xl px-3 py-2.5 text-left text-small text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream"
                        >
                            로그아웃
                        </button>
                    </form>
                </div>
            </aside>

            <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-9 lg:px-10">
                <div className="mx-auto w-full max-w-6xl">{children}</div>
            </main>
        </div>
    );
}

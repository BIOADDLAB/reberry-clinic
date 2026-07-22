// #LINK: /app/admin/(protected)/layout.tsx
// #ISSUE: 실제 접근 차단은 proxy.ts 가 처리 — 여기는 로그인 후 대시보드 셸(사이드바+본문)만 담당
import Link from 'next/link';
import { logoutAdmin } from '../actions';

const NAV = [
    { href: '/admin/ba', label: '전후사진 관리' },
    { href: '/admin/columns', label: '칼럼 관리' },
];

export default function AdminProtectedLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen bg-[#F5F2EC]">
            {/* 사이드바 */}
            <aside className="flex w-60 shrink-0 flex-col bg-cocoa text-cream">
                <div className="px-6 py-7">
                    <p className="font-display text-caption tracking-[0.2em] text-cream/60">RE:BERRY</p>
                    <p className="mt-1 text-lead font-bold">관리자</p>
                </div>
                <nav className="flex flex-1 flex-col gap-1 px-3">
                    {NAV.map((n) => (
                        <Link
                            key={n.href}
                            href={n.href}
                            className="rounded-lg px-3 py-2.5 text-medium text-cream/85 transition-colors hover:bg-cream/10 hover:text-cream"
                        >
                            {n.label}
                        </Link>
                    ))}
                </nav>
                <form action={logoutAdmin} className="px-3 pb-6">
                    <button
                        type="submit"
                        className="w-full rounded-lg px-3 py-2.5 text-left text-small text-cream/60 transition-colors hover:bg-cream/10 hover:text-cream"
                    >
                        로그아웃
                    </button>
                </form>
            </aside>

            {/* 본문 */}
            <main className="flex-1 px-10 py-9">{children}</main>
        </div>
    );
}

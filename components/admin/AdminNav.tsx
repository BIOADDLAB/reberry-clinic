/* 관리자 사이드바 내비 — 현재 페이지 표시가 필요해 클라이언트 컴포넌트로 분리 */
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface AdminNavItem {
    href: string;
    label: string;
    hint: string;
    icon: string;
}

export const ADMIN_NAV: AdminNavItem[] = [
    { href: '/admin/price-list', label: '수가표 관리', hint: '가격·카테고리', icon: '₩' },
    { href: '/admin/events', label: '이벤트 관리', hint: '프로모션', icon: '%' },
    { href: '/admin/ba', label: '전후사진 관리', hint: '시술 결과', icon: '◫' },
    { href: '/admin/columns', label: '블로그 연결 관리', hint: '시술 칼럼', icon: '↗' },
    { href: '/admin/skin-columns', label: '피부칼럼 관리', hint: '자체 발행글', icon: '✎' },
    { href: '/admin/popups', label: '팝업 관리', hint: '메인 노출', icon: '▣' },
];

export default function AdminNav({ variant = 'sidebar' }: { variant?: 'sidebar' | 'mobile' }) {
    const pathname = usePathname();
    const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

    if (variant === 'mobile') {
        return (
            <nav className="no-scrollbar flex gap-1.5 overflow-x-auto px-4 pb-3">
                {ADMIN_NAV.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={`shrink-0 rounded-full px-3.5 py-2 text-caption font-semibold transition-colors ${
                            isActive(item.href) ? 'bg-cream text-cocoa' : 'bg-cream/10 text-cream/80 hover:bg-cream/20'
                        }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>
        );
    }

    return (
        <nav className="flex flex-1 flex-col gap-1 px-3">
            {ADMIN_NAV.map((item) => {
                const active = isActive(item.href);
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors ${
                            active ? 'bg-cream text-cocoa' : 'text-cream/80 hover:bg-cream/10 hover:text-cream'
                        }`}
                    >
                        <span
                            aria-hidden
                            className={`grid size-7 shrink-0 place-items-center rounded-lg text-caption font-bold ${
                                active ? 'bg-cocoa text-cream' : 'bg-cream/10 text-cream/70 group-hover:bg-cream/20'
                            }`}
                        >
                            {item.icon}
                        </span>
                        <span className="min-w-0">
                            <span className="block truncate text-small font-semibold">{item.label}</span>
                            <span className={`block truncate text-caption-sm ${active ? 'text-latte' : 'text-cream/45'}`}>
                                {item.hint}
                            </span>
                        </span>
                    </Link>
                );
            })}
        </nav>
    );
}

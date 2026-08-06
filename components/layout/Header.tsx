'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { nav } from '@/components/lib/site';
import { cn } from '@/components/lib/cn';
import LanguageToggle from '@/components/lang/LanguageToggle';
import { useLang } from '@/components/lib/useLang';

const subscribeScroll = (cb: () => void) => {
    window.addEventListener('scroll', cb, { passive: true });
    return () => window.removeEventListener('scroll', cb);
};

export default function Header() {
    const scrolled = useSyncExternalStore(
        subscribeScroll,
        () => window.scrollY > 40,
        () => false,
    );
    const [open, setOpen] = useState(false);
    const [navHovered, setNavHovered] = useState(false);
    const close = () => setOpen(false);
    const lang = useLang();
    const t = useTranslations('common');
    const reservationT = useTranslations('reservation');
    const pathname = usePathname();

    // #STYLE: 스크롤되었거나, 모바일 메뉴가 열렸거나, PC 메뉴에 호버했을 때 solid 상태(배경색 활성화)로 변경
    const solid = scrolled || open || navHovered;

    return (
        <header
            className={cn(
                'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
                solid
                    ? 'bg-cream text-cocoa shadow-[0_1px_0_rgba(69,54,45,0.08)] backdrop-blur'
                    : 'bg-transparent text-cream',
            )}
        >
            <div className="container-site relative flex h-16 items-center justify-between lg:h-25">
                <Link href="/" aria-label={t('homeAria')} className="notranslate relative z-10 shrink-0">
                    <Image
                        src="/images/logo.svg"
                        alt="RE:BERRY"
                        width={132}
                        height={24}
                        priority
                        className={cn('h-3.75 w-auto transition lg:h-4', solid && 'to-cocoa')}
                    />
                </Link>

                {/* GNB — 시안: 화면 정중앙 정렬, 항목 간 넉넉한 간격 */}
                <nav
                    onMouseEnter={() => setNavHovered(true)}
                    onMouseLeave={() => setNavHovered(false)}
                    className="notranslate absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 xl:flex 2xl:gap-11"
                >
                    {nav.map((item) => (
                        <div key={item.label} className="group relative">
                            <Link
                                href={item.href}
                                className="whitespace-nowrap py-7 text-small font-medium transition-opacity hover:opacity-60"
                            >
                                {lang === 'ko' ? item.label : item.en}
                            </Link>

                            {item.children && (
                                <div className="invisible absolute left-1/2 top-full z-50 mt-9.5 min-w-44 -translate-x-1/2 rounded-b-[20px] bg-cream/85 py-2 shadow-lg ring-1 ring-cocoa/10 backdrop-blur-md opacity-0 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                                    <ul className="py-3">
                                        {item.children.map((c) => {
                                            const isActive = pathname === c.href;

                                            return (
                                                <li key={c.label}>
                                                    <Link
                                                        href={c.href}
                                                        // #STYLE: 기존 포맷 유지, 활성 시 bg-sand/50 및 font-semibold 적용, 호버 시 bg-sand/30으로 세부 조정
                                                        className={cn(
                                                            'block whitespace-nowrap px-6 py-2 text-center text-caption text-latte transition-colors hover:bg-sand/30 hover:text-cocoa',
                                                            isActive && 'bg-sand/50 font-semibold text-cocoa',
                                                        )}
                                                    >
                                                        {lang === 'ko' ? c.label : c.en}
                                                    </Link>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="relative z-10 flex shrink-0 items-center gap-2">
                    <div className="relative">
                        <LanguageToggle solid={solid} />
                        {pathname === '/' && (
                            <Link
                                href="/reservation"
                                className="absolute right-0 top-full mt-3 flex w-max items-center gap-2 rounded-full border border-cocoa/15 bg-cream px-4 py-2.5 text-caption font-semibold text-cocoa shadow-[0_5px_20px_rgba(69,54,45,0.16)] transition-transform hover:-translate-y-0.5"
                            >
                                <span
                                    className="grid size-5 place-items-center rounded-full bg-cocoa text-[11px] text-cream"
                                    aria-hidden="true"
                                >
                                    R
                                </span>
                                {reservationT('title')}
                            </Link>
                        )}
                    </div>
                    <button
                        onClick={() => setOpen(!open)}
                        aria-label={t('openMenu')}
                        aria-expanded={open}
                        className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 xl:hidden"
                    >
                        <span
                            className={cn(
                                'h-px w-6 bg-current transition-transform',
                                open && 'translate-y-[3.5px] rotate-45',
                            )}
                        />
                        <span
                            className={cn(
                                'h-px w-6 bg-current transition-transform',
                                open && '-translate-y-[3.5px] -rotate-45',
                            )}
                        />
                    </button>
                </div>
            </div>

            {open && (
                <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-cocoa/10 bg-cream text-cocoa xl:hidden">
                    <nav className="container-site py-6">
                        {nav.map((item) => (
                            <div key={item.label} className="border-b border-cocoa/10 py-4">
                                <Link href={item.href} onClick={close} className="notranslate text-h3 font-medium">
                                    {lang === 'ko' ? item.label : item.en}
                                </Link>
                                {item.children && (
                                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                                        {item.children.map((c) => (
                                            <li key={c.label}>
                                                <Link
                                                    href={c.href}
                                                    onClick={close}
                                                    className="notranslate font-medium text-caption text-latte"
                                                >
                                                    {lang === 'ko' ? c.label : c.en}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </nav>
                </div>
            )}
        </header>
    );
}

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { nav } from '@/components/lib/site';
import { cn } from '@/components/lib/cn';
import LanguageToggle from '@/components/lang/LanguageToggle';
import { useLang } from '@/components/lib/useLang';

export default function Header() {
    const [scrolled, setScrolled] = useState(false);
    const [open, setOpen] = useState(false);
    const pathname = usePathname();
    const lang = useLang();

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    useEffect(() => setOpen(false), [pathname]);

    const solid = scrolled || open;

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
                {/* 로고 svg가 흰색이므로 solid 상태에서 to-cocoa 필터로 변환 */}
                <Link href="/" aria-label="리베리의원 홈" className="notranslate relative z-10 shrink-0">
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
                {/* GNB는 notranslate: 구글 번역이 메뉴를 엉뚱하게 번역/줄바꿈시키는 것을 막고
                    영문은 nav 데이터의 en 라벨로 직접 스왑 */}
                <nav className="notranslate absolute left-1/2 hidden -translate-x-1/2 items-center gap-9 xl:flex 2xl:gap-11">
                    {nav.map((item) => (
                        <div key={item.label} className="group relative">
                            <Link
                                href={item.href}
                                className="whitespace-nowrap py-7 text-small font-bold transition-opacity hover:opacity-60"
                            >
                                {lang === 'ko' ? item.label : item.en}
                            </Link>
                            {item.children && (
                                <div className="invisible absolute left-1/2 top-full min-w-44 -translate-x-1/2 bg-cream text-cocoa opacity-0 shadow-lg ring-1 ring-cocoa/5 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                                    <ul className="py-3">
                                        {item.children.map((c) => (
                                            <li key={c.label}>
                                                <Link
                                                    href={c.href}
                                                    className="block whitespace-nowrap px-6 py-2 text-center text-caption text-latte transition-colors hover:bg-sand/30 hover:text-cocoa"
                                                >
                                                    {lang === 'ko' ? c.label : c.en}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="relative z-10 hidden shrink-0 xl:block">
                    <LanguageToggle solid={solid} />
                </div>

                <button
                    onClick={() => setOpen(!open)}
                    aria-label="메뉴 열기"
                    aria-expanded={open}
                    className="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-1.5 xl:hidden"
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

            {open && (
                <div className="max-h-[calc(100dvh-4rem)] overflow-y-auto border-t border-cocoa/10 bg-cream text-cocoa xl:hidden">
                    <nav className="container-site py-6">
                        {nav.map((item) => (
                            <div key={item.label} className="border-b border-cocoa/10 py-4">
                                <Link href={item.href} className="notranslate text-h3 font-medium">
                                    {lang === 'ko' ? item.label : item.en}
                                </Link>
                                {item.children && (
                                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
                                        {item.children.map((c) => (
                                            <li key={c.label}>
                                                <Link href={c.href} className="notranslate text-caption text-latte">
                                                    {lang === 'ko' ? c.label : c.en}
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                        <div className="mt-6">
                            <LanguageToggle solid />
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}

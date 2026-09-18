'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState, useSyncExternalStore, type PointerEvent as ReactPointerEvent } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { nav } from '@/components/lib/site';
import { cn } from '@/components/lib/cn';
import { getSignatureContent, signatureSlugFromRoute } from '@/components/lib/signaturePages';
import LanguageToggle from '@/components/lang/LanguageToggle';
import { useLang } from '@/components/lib/useLang';

/* #ISSUE: 시그니처 시술 페이지(2026.09 리뉴얼)는 히어로 배경이 밝아서 크림색 글자·로고가 묻힌다.
   → 이 주소에서는 스크롤 전(투명) 상태에서도 글자·로고·언어 버튼을 코코아색으로 둔다. 배경은 그대로 투명.
   /treatments/signature/{slug} 만 해당 — 그 아래 기기 상세(/{slug}/{item})는 어두운 히어로라 제외 */
const LIGHT_HERO_PATH = /^\/treatments\/signature\/[^/]+\/?$/;

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
    /* #ISSUE: 호버 감지를 가운데 메뉴(nav)에만 걸어 놨더니, 헤더 줄 위에 마우스를 올려도
       가운데 좁은 메뉴 박스를 정확히 지나지 않으면 배경이 안 들어왔다. 히어로가 밝은
       시그니처 페이지에서는 글자가 배경에 묻혀 읽기 어려웠다.
       → 헤더 전체를 감지 범위로 둔다. 마우스가 헤더를 벗어나면 다시 투명으로 돌아간다. */
    const [hovered, setHovered] = useState(false);
    /* #ISSUE: 새로고침·첫 진입 직후 맨 위에서 헤더에 마우스를 올려도 흰 배경이 안 들어왔다.
       화면(서버 HTML)은 먼저 그려지고 React 는 그 뒤에 연결(하이드레이션)되는데, 그 사이에 커서가
       이미 헤더 위에 있으면 브라우저가 보낸 mouseenter 를 React 가 놓친다. 그 뒤로는 헤더 안에서
       아무리 움직여도 "들어왔다" 이벤트가 다시 오지 않아서, 헤더 밖으로 나갔다 들어와야만 켜졌다.
       → ① React 연결 직후 실제 호버 상태(:hover)를 한 번 읽어 맞추고
         ② enter 뿐 아니라 헤더 안에서 마우스가 움직이기만 해도 호버로 본다(놓친 enter 보정)
         ③ 터치 탭은 호버로 치지 않는다(마우스일 때만) — 휴대폰은 지금처럼 스크롤·메뉴 열림만 배경을 정한다 */
    const headerRef = useRef<HTMLElement>(null);
    useEffect(() => {
        if (window.matchMedia('(hover: hover)').matches && headerRef.current?.matches(':hover')) setHovered(true);
    }, []);
    const onHeaderPointer = (e: ReactPointerEvent) => {
        if (e.pointerType === 'mouse' && !hovered) setHovered(true);
    };
    const onHeaderLeave = (e: ReactPointerEvent) => {
        if (e.pointerType === 'mouse') setHovered(false);
    };
    const close = () => setOpen(false);
    const lang = useLang();
    const t = useTranslations('common');
    const navText = (label: string, en: string, href: string) => {
        const route = href.match(/^\/treatments\/signature\/([^/]+)$/)?.[1];
        const slug = route ? signatureSlugFromRoute(route) : undefined;
        return slug ? getSignatureContent(slug, lang).heroTitle : lang === 'ko' ? label : en;
    };
    const reservationT = useTranslations('reservation');
    const pathname = usePathname();

    // #STYLE: 스크롤되었거나, 모바일 메뉴가 열렸거나, 헤더에 마우스를 올렸을 때 solid 상태(배경색 활성화)로 변경
    const solid = scrolled || open || hovered;
    const lightHero = LIGHT_HERO_PATH.test(pathname ?? '');
    const dark = solid || lightHero;

    return (
        <header
            ref={headerRef}
            onPointerEnter={onHeaderPointer}
            onPointerMove={onHeaderPointer}
            onPointerLeave={onHeaderLeave}
            className={cn(
                'fixed inset-x-0 top-0 z-50 transition-colors duration-300',
                solid
                    ? 'bg-cream text-cocoa shadow-[0_1px_0_rgba(69,54,45,0.08)] backdrop-blur'
                    : cn('bg-transparent', lightHero ? 'text-cocoa' : 'text-cream'),
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
                        className={cn('h-3.75 w-auto transition lg:h-4', dark && 'to-cocoa')}
                    />
                </Link>

                {/* GNB — 시안: 화면 정중앙 정렬, 항목 간 넉넉한 간격 */}
                <nav className="notranslate absolute left-1/2 hidden -translate-x-1/2 items-center gap-6 xl:flex 2xl:gap-8">
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
                                                        {navText(c.label, c.en, c.href)}
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
                        <LanguageToggle solid={dark} />
                        <Link
                            href="/reservation"
                            onClick={close}
                            className={cn(
                                /* #ISSUE: xl 전용이라 모바일·태블릿에는 헤더 줄 안에 작은 예약 버튼이 따로 하나 더 있었다.
                                   → 이 알약 하나로 합친다. 모바일은 오른쪽에 햄버거(40px)+gap(8px)이 더 붙으므로
                                     그만큼(-48px) 밀어야 알약 오른쪽 끝이 컨테이너 오른쪽 끝과 맞는다. */
                                'absolute -right-12 top-full mt-3 flex w-max items-center gap-2 rounded-full border border-cocoa/15 bg-cream px-3.5 py-2 text-caption-sm font-semibold text-cocoa shadow-[0_5px_20px_rgba(69,54,45,0.16)] transition-transform hover:-translate-y-0.5 xl:right-0 xl:px-4 xl:py-2.5 xl:text-caption',
                                /* 모바일 메뉴가 펼쳐지면 메뉴 첫 항목 위에 겹쳐 앉는다 → 열려 있는 동안만 감춘다 */
                                open && 'hidden xl:flex',
                            )}
                        >
                            {/* #STYLE: 카카오 노랑 K → 브랜드 R 로 교체. 헤더 톤(코코아/크림)에 맞춘 원형 뱃지 */}
                            <span
                                className="notranslate font-display grid size-5 place-items-center rounded-full bg-cocoa text-[11px] font-bold leading-none text-cream"
                                aria-hidden="true"
                            >
                                R
                            </span>
                            {reservationT('title')}
                        </Link>
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
                                                    {navText(c.label, c.en, c.href)}
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

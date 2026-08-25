// #COMPONENTS: 메인 진입 팝업 (관리자 > 팝업 관리에서 켜고 끈다)
// #ISSUE: 기존 좌/우 사이드 이미지 팝업(MainSidePopups)을 대체한다.
//   · 왼쪽 = 팝업 이미지(4:5 통짜, 잘리지 않음) / 오른쪽 = 탭 목록 / 아래 = 오늘 하루 그만 보기 · 닫기
//   · 탭이 둘 이상이면 5초마다 자동으로 넘어간다(탭을 직접 누르면 타이머 재시작)
//   · 색상은 리베리 팔레트(cream / cocoa / sand), 로딩 자리표시자는 globals.css 의 .skeleton

'use client';

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type MouseEvent } from 'react';
import { useTranslations } from 'next-intl';
import T from '@/components/lang/T';
import { cn } from '@/components/lib/cn';
import { EASE } from '@/components/lib/motion';
import { getPopupSetting, POPUP_IMAGE_HEIGHT, POPUP_IMAGE_WIDTH, type PopupTab } from '@/components/lib/popup';
import { site } from '@/components/lib/site';

/** '오늘 하루 그만 보기' 를 누른 날짜를 담아둔다. 날이 바뀌면 다시 뜬다 */
const HIDE_KEY = 'reberry_popup_hidden_until';

/** 탭이 둘 이상이면 이 간격으로 자동으로 넘어간다 */
const AUTO_MS = 5000;

const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function hiddenToday() {
    try {
        return window.localStorage.getItem(HIDE_KEY) === todayKey();
    } catch {
        return false;
    }
}

export default function PopupModal() {
    const t = useTranslations('popup');
    const tCommon = useTranslations('common');
    const reduced = useReducedMotion();
    const [tabs, setTabs] = useState<PopupTab[]>([]);
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        if (hiddenToday()) return;

        let alive = true;
        getPopupSetting().then((setting) => {
            if (!alive || !setting?.enabled) return;
            const usable = setting.tabs.filter((tab) => tab.imageUrl);
            if (usable.length === 0) return;
            setTabs(usable);
            setOpen(true);
        });

        return () => {
            alive = false;
        };
    }, []);

    // 배너처럼 5초마다 다음 탭으로. 탭을 직접 누르면 index 가 바뀌며 타이머도 다시 시작된다
    useEffect(() => {
        if (!open || reduced || tabs.length < 2) return;
        const timer = setTimeout(() => setIndex((i) => (i + 1) % tabs.length), AUTO_MS);
        return () => clearTimeout(timer);
    }, [open, reduced, tabs.length, index]);

    // 팝업이 떠 있는 동안에는 뒤 배경이 스크롤되지 않게 (BAPhotoModal 과 같은 방식)
    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [open]);

    const close = () => setOpen(false);

    const hideToday = () => {
        try {
            window.localStorage.setItem(HIDE_KEY, todayKey());
        } catch {}
        setOpen(false);
    };

    const current = tabs[index];

    return (
        <AnimatePresence>
            {open && current && (
                <motion.div
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: EASE }}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('label')}
                    className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-deep/70 px-5 py-10 backdrop-blur-[2px]"
                >
                    <button type="button" tabIndex={-1} aria-hidden onClick={close} className="absolute inset-0" />

                    <motion.div
                        initial={reduced ? false : { opacity: 0, y: 20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.98 }}
                        transition={{ duration: 0.6, ease: EASE }}
                        // 부모에 배경을 깔면 둥근 모서리 안티에일리어싱 틈으로 그 색이 비친다.
                        // 배경은 아래 크림 영역들이 각자 갖는다
                        className="relative flex max-h-[calc(100dvh-5rem)] w-full max-w-[720px] flex-col overflow-hidden rounded-[10px] shadow-[0_28px_70px_rgba(56,43,34,0.45)]"
                    >
                        <div className="grid min-h-0 grid-cols-[minmax(0,1.55fr)_minmax(7.5rem,0.7fr)] items-stretch">
                            {/* 인스타 4:5. 옆 목록이 라벨을 세로로 받으니 좌우가 잘리지 않는다 */}
                            <div className="relative aspect-[4/5] overflow-hidden bg-cream">
                                {/* key 를 주소로 잡아 탭이 바뀌면 스켈레톤부터 다시 시작한다 */}
                                <PopupImage key={current.imageUrl} tab={current} onInternalNavigate={close} />
                            </div>

                            {/* 탭은 하나여도 그린다. 긴 이름도 줄바꿈해서 통째로 보여준다 */}
                            <nav
                                aria-label={t('label')}
                                className="flex min-h-0 flex-col overflow-y-auto border-l border-cocoa/10 bg-cream [scrollbar-width:thin]"
                            >
                                {tabs.map((tab, i) => (
                                    <button
                                        key={`${tab.imageUrl}-${i}`}
                                        type="button"
                                        onClick={() => setIndex(i)}
                                        aria-current={i === index ? 'true' : undefined}
                                        className={cn(
                                            'w-full break-keep px-3 py-3.5 text-center text-caption leading-snug whitespace-pre-line transition-colors duration-300 sm:px-5',
                                            i === index
                                                ? 'bg-sand/45 font-semibold text-cocoa'
                                                : 'text-cocoa/45 hover:bg-sand/25 hover:text-cocoa/70',
                                            i < tabs.length - 1 && 'border-b border-cocoa/10',
                                        )}
                                    >
                                        <T ko={tab.label || t('tab', { n: i + 1 })} />
                                    </button>
                                ))}
                            </nav>
                        </div>

                        <div className="flex shrink-0 border-t border-cocoa/10 bg-cream">
                            <button
                                type="button"
                                onClick={hideToday}
                                className="flex flex-1 items-center justify-center border-r border-cocoa/10 py-4 text-center text-caption leading-none text-cocoa/55 transition-colors duration-300 hover:text-cocoa"
                            >
                                {t('hideToday')}
                            </button>
                            <button
                                type="button"
                                onClick={close}
                                className=" flex flex-1 items-center justify-center py-4 pl-[0.08em] text-center text-caption leading-none tracking-[0.08em] text-cocoa/70 transition-colors duration-300 hover:text-cocoa"
                            >
                                {tCommon('close')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

/**
 * 4:5 박스 안에 통째로 넣는다. 비율이 달라도 자르지 않는다.
 * 받아오는 동안에는 스켈레톤을 덮어둔다. 다 받으면 스켈레톤은 아예 사라진다.
 */
function PopupImage({ tab, onInternalNavigate }: { tab: PopupTab; onInternalNavigate: () => void }) {
    const [loaded, setLoaded] = useState(false);
    const router = useRouter();
    const href = tab.linkUrl ? internalSiteHref(tab.linkUrl) : null;

    const img = (
        <Image
            src={tab.imageUrl}
            alt={tab.label}
            width={POPUP_IMAGE_WIDTH}
            height={POPUP_IMAGE_HEIGHT}
            unoptimized
            onLoad={() => setLoaded(true)}
            onError={() => setLoaded(true)}
            className="h-full w-full object-contain"
        />
    );

    const goInternal = (e: MouseEvent<HTMLAnchorElement>) => {
        if (!href || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        onInternalNavigate();
        router.push(href);
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    };

    return (
        <>
            {tab.linkUrl ? (
                href ? (
                    <a href={href} onClick={goInternal} className="block h-full w-full">
                        {img}
                    </a>
                ) : (
                    <a href={tab.linkUrl} target="_blank" rel="noopener noreferrer" className="block h-full w-full">
                        {img}
                    </a>
                )
            ) : (
                img
            )}

            {!loaded && <span aria-hidden className="skeleton absolute inset-0" />}
        </>
    );
}

/** 같은 사이트 주소면 경로만 돌려준다(= next/router 로 이동). 외부 주소면 null → 새 탭 */
function internalSiteHref(linkUrl: string) {
    const raw = linkUrl.trim();
    if (!raw) return null;
    if (raw.startsWith('/')) return raw;

    try {
        const url = new URL(raw);
        const own = new Set<string>([new URL(site.url).origin]);
        if (typeof window !== 'undefined') own.add(window.location.origin);
        return own.has(url.origin) ? `${url.pathname}${url.search}${url.hash}` : null;
    } catch {
        return null;
    }
}

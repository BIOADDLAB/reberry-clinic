// #COMPONENTS: 메인 진입 팝업 (관리자 > 팝업 관리에서 켜고 끈다)
// #ISSUE: 기존 좌/우 사이드 이미지 팝업(MainSidePopups)을 대체한다.
//   · 왼쪽 = 팝업 이미지(4:5 통짜, 잘리지 않음) / 오른쪽 = 탭 목록 / 아래 = 오늘 하루 그만 보기 · 닫기
//   · 탭이 둘 이상이면 5초마다 자동으로 넘어간다(탭을 직접 누르면 타이머 재시작)
//   · 색상은 리베리 팔레트(cream / cocoa / sand)
// #ISSUE: 휴대폰에서 팝업 사진이 5초마다 "사라졌다가 다시 생기는" 것처럼 깜빡여 고장처럼 보였다.
//   탭이 넘어갈 때마다 사진 칸을 통째로 새로 만들어서(key 교체) 새 사진이 올 때까지 멈춘 회색 칸만 보였기 때문.
//   (PC 는 오른쪽 탭 목록이 같이 바뀌어 넘어간 걸 알 수 있지만, 휴대폰은 작은 점뿐이라 깜빡임만 보였다)
//   → ① 팝업은 첫 사진을 미리 받아 둔 뒤 연다(최대 1.5초 기다림, 그래도 늦으면 스켈레톤을 깔고 연다)
//     ② 탭 사진을 전부 겹쳐 두고 미리 받아서, 넘어갈 때는 다음 사진이 준비된 뒤 부드럽게 겹쳐 바꾼다(크로스페이드)
//     ③ 첫 사진이 오기 전에만 은은하게 깜빡이는 스켈레톤을 보여 준다. 자동 넘김 5초는 사진이 뜬 뒤부터 센다

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
    /** 고른 탭 (점·목록 표시) */
    const [index, setIndex] = useState(0);
    /** 받아 둔 사진 주소 */
    const [loaded, setLoaded] = useState<Record<string, true>>({});
    /** 탭을 바꾸기 직전까지 떠 있던 사진 — 새 사진이 다 받아질 때까지 이걸 그대로 보여 준다 */
    const [previous, setPrevious] = useState(-1);
    const [open, setOpen] = useState(false);

    /** 지금 화면에 띄울 사진: 고른 탭 사진이 준비됐으면 그것, 아니면 앞 사진(없으면 -1 = 스켈레톤) */
    const shown = tabs[index] && loaded[tabs[index].imageUrl] ? index : previous;
    const goTo = (next: number) => {
        setPrevious(shown);
        setIndex(next);
    };

    useEffect(() => {
        if (hiddenToday()) return;

        let alive = true;
        let waitTimer: ReturnType<typeof setTimeout> | undefined;
        getPopupSetting().then((setting) => {
            if (!alive || !setting?.enabled) return;
            const usable = setting.tabs.filter((tab) => tab.imageUrl);
            if (usable.length === 0) return;
            setTabs(usable);

            // 첫 사진을 미리 받아 두고 연다 → 빈 칸이 먼저 뜨지 않는다. 늦으면 1.5초 뒤 스켈레톤을 깔고 연다
            let opened = false;
            const openNow = () => {
                if (!alive || opened) return;
                opened = true;
                setOpen(true);
            };
            const first = new window.Image();
            first.onload = openNow;
            first.onerror = openNow;
            first.src = usable[0].imageUrl;
            waitTimer = setTimeout(openNow, 1500);
        });

        return () => {
            alive = false;
            if (waitTimer) clearTimeout(waitTimer);
        };
    }, []);

    // 배너처럼 5초마다 다음 탭으로. 사진이 실제로 뜬 뒤부터 센다.
    // 탭을 직접 누르면 index 가 바뀌며 타이머도 다시 시작된다
    useEffect(() => {
        if (!open || reduced || tabs.length < 2 || shown !== index) return;
        const timer = setTimeout(() => {
            setPrevious(index);
            setIndex((index + 1) % tabs.length);
        }, AUTO_MS);
        return () => clearTimeout(timer);
    }, [open, reduced, tabs.length, index, shown]);

    const markLoaded = (url: string) => setLoaded((map) => (map[url] ? map : { ...map, [url]: true }));

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
                        {/* #ISSUE: 모바일에서 좌우 2단이면 이미지가 팝업 폭의 60%밖에 못 써서 글씨가 안 보였다.
                            → 모바일(640px 미만)은 오른쪽 탭 목록을 감추고 이미지가 폭을 통째로 쓴다(4:5 비율 유지).
                              탭 이동은 이미지 아래쪽 점(●●●)으로 한다. 640px 이상은 기존 좌우 2단 그대로 */}
                        <div className="grid min-h-0 grid-cols-1 items-stretch sm:grid-cols-[minmax(0,1.55fr)_minmax(7.5rem,0.7fr)]">
                            {/* 인스타 4:5 — 화면 높이가 넉넉하면 4:5 그대로.
                                #ISSUE: 아이폰 사파리처럼 보이는 높이가 짧으면, 4:5 를 지키려고 사진 칸 폭이 줄어들어
                                        오른쪽에 뒤 배경이 비치는 빈틈이 생겼다(팝업 아래 점·버튼 줄보다 사진 칸이 좁아짐).
                                → 폭은 항상 꽉 채우고(w-full), 높이만 화면 안에 들어오게 줄인다(max-h).
                                  모바일 10.5rem = 바깥 위아래 여백 5rem + 점 줄 2rem + 버튼 줄 3rem + 여유 / PC 는 점 줄이 없다.
                                  사진은 object-contain 이라 칸이 조금 납작해져도 비율 그대로 가운데에 선다 */}
                            <div className="relative aspect-[4/5] max-h-[calc(100dvh-10.5rem)] w-full overflow-hidden bg-cream sm:max-h-[calc(100dvh-8.5rem)]">
                                {/* #ISSUE: 탭 사진을 전부 absolute 로 겹친 뒤, 아이폰 사파리에서 이 칸 높이가 0 이 돼
                                    사진 칸이 통째로 사라지고 점·버튼만 남았다. 사파리는 안이 전부 absolute 인 칸을
                                    grid·flex 높이 계산에서 aspect-ratio 로 못 잡고 0 으로 계산하는 경우가 있다.
                                    (예전에는 사진(img) 자체가 칸 안에 흐름대로 들어 있어서 그 높이로 버텼다)
                                    → 예전 img 자리에 보이지 않는 4:5 받침을 하나 깔아 어느 브라우저에서도 높이를 잡는다 */}
                                <svg aria-hidden viewBox="0 0 4 5" className="pointer-events-none block h-full w-full" />
                                {/* 첫 사진이 오기 전에만 — 은은하게 깜빡이는 스켈레톤 */}
                                {shown === -1 && (
                                    <span
                                        aria-hidden
                                        className="absolute inset-0 bg-sand/45 motion-safe:animate-pulse"
                                    />
                                )}
                                {/* 탭 사진을 전부 겹쳐 두고(= 미리 받아 두고) 떠 있는 것만 보이게 한다.
                                    바뀔 때는 서로 겹쳐 흐려졌다 나타난다(크로스페이드) */}
                                {tabs.map((tab, i) => (
                                    <div
                                        key={`${tab.imageUrl}-${i}`}
                                        inert={i !== shown}
                                        className={cn(
                                            'absolute inset-0 transition-opacity duration-500 ease-out',
                                            i === shown ? 'z-10 opacity-100' : 'pointer-events-none opacity-0',
                                        )}
                                    >
                                        <PopupImage
                                            tab={tab}
                                            onReady={() => markLoaded(tab.imageUrl)}
                                            onInternalNavigate={close}
                                        />
                                    </div>
                                ))}
                            </div>

                            {/* 모바일 전용 점 인디케이터 — 탭 개수만큼 찍히고 현재 탭에 불이 들어온다.
                                #ISSUE: 이미지 위에 얹었더니 팝업 하단의 주소·전화번호를 가렸다 → 이미지 아래 띠로 뺐다 */}
                            {tabs.length > 1 && (
                                <div className="flex items-center justify-center border-t border-cocoa/10 bg-cream py-1 sm:hidden">
                                    {tabs.map((tab, i) => (
                                        <button
                                            key={`dot-${tab.imageUrl}-${i}`}
                                            type="button"
                                            onClick={() => goTo(i)}
                                            aria-current={i === index ? 'true' : undefined}
                                            aria-label={tab.label || t('tab', { n: i + 1 })}
                                            // 점은 작아도 누르는 영역은 24px 확보
                                            className="flex h-6 w-6 items-center justify-center"
                                        >
                                            <span
                                                aria-hidden
                                                className={cn(
                                                    'block rounded-full transition-all duration-300',
                                                    i === index ? 'h-2 w-2 bg-cocoa' : 'h-1.5 w-1.5 bg-cocoa/25',
                                                )}
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* 탭은 하나여도 그린다. 긴 이름도 줄바꿈해서 통째로 보여준다 (640px 이상에서만 노출) */}
                            <nav
                                aria-label={t('label')}
                                className="hidden min-h-0 flex-col overflow-y-auto border-l border-cocoa/10 bg-cream sm:flex sm:[scrollbar-width:thin]"
                            >
                                {tabs.map((tab, i) => (
                                    <button
                                        key={`${tab.imageUrl}-${i}`}
                                        type="button"
                                        onClick={() => goTo(i)}
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
                                className="flex flex-1 items-center justify-center py-4 pl-[0.08em] text-center text-caption leading-none tracking-[0.08em] text-cocoa/70 transition-colors duration-300 hover:text-cocoa"
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
 * 받는 중 표시(스켈레톤)와 언제 보일지는 바깥(PopupModal)이 정한다 — 여기서는 다 받았다고만 알린다.
 */
function PopupImage({
    tab,
    onReady,
    onInternalNavigate,
}: {
    tab: PopupTab;
    onReady: () => void;
    onInternalNavigate: () => void;
}) {
    const router = useRouter();
    const href = tab.linkUrl ? internalSiteHref(tab.linkUrl) : null;

    const img = (
        <Image
            src={tab.imageUrl}
            alt={tab.label}
            width={POPUP_IMAGE_WIDTH}
            height={POPUP_IMAGE_HEIGHT}
            unoptimized
            loading="eager"
            onLoad={onReady}
            onError={onReady}
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

/* #COMPONENTS: 스와이프 힌트 — 사이트의 모든 가로 스와이퍼가 같이 쓴다.
   흔히 쓰는 "손가락 + 좌우 화살표" 안내를 사이트 톤(코코아 반투명 원 · 크림 선 아이콘 · Belleza 대문자)으로 만든 것.

   쓰는 법 (2줄)
     const hint = useSwipeHint(scrollerRef, 넘길게있는지);      ← Swiper 는 컨테이너 ref + !isLocked
     <div className="relative"> …스와이퍼… <SwipeHint show={hint.show} touch={hint.touch} /> </div>

   규칙
   - 넘길 게 있는 줄이 화면에 충분히(60%) 들어오면 한 번만 뜬다. 가만히 두면 3.6초 뒤, 누르거나 넘기면 바로 사라진다.
   - 휴대폰·태블릿(손가락)은 SWIPE, 창을 줄인 PC(1024px 미만)는 DRAG. 넓은 PC 는 화살표가 있으니 띄우지 않는다.
   - 사진 위에 떠 있어도 터치를 가로막지 않는다(pointer-events: none). '동작 줄이기' 설정이면 손이 움직이지 않는다. */

'use client';

import { useCallback, useEffect, useState, type RefObject } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { cn } from '@/components/lib/cn';
import { EASE } from '@/components/lib/motion';

/** 줄이 화면에 들어온 뒤 힌트가 뜨기까지 (카드 등장 모션이 먼저 보이도록) */
const HINT_DELAY = 900;
/** 힌트가 떠 있는 시간 */
const HINT_DURATION = 3600;
/** 마우스라도 이 폭보다 좁으면(창을 줄인 PC) 힌트를 띄운다 */
const NARROW = 1024;

type HintState = 'idle' | 'show' | 'done';

export function useSwipeHint(targetRef: RefObject<HTMLElement | null>, active: boolean) {
    const [state, setState] = useState<HintState>('idle');
    const [touch, setTouch] = useState(true);
    const dismiss = useCallback(() => setState((s) => (s === 'done' ? s : 'done')), []);

    /* 한 번이라도 만지면(누르기 · 가로로 넘기기 · 가로 휠) 다시는 띄우지 않는다 */
    useEffect(() => {
        const el = targetRef.current;
        if (!el || !active) return;
        let lastLeft = el.scrollLeft;
        const onScroll = () => {
            if (Math.abs(el.scrollLeft - lastLeft) > 2) dismiss();
            lastLeft = el.scrollLeft;
        };
        const onWheel = (e: WheelEvent) => {
            if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) dismiss();
        };
        el.addEventListener('pointerdown', dismiss);
        el.addEventListener('scroll', onScroll, { passive: true });
        el.addEventListener('wheel', onWheel, { passive: true });
        return () => {
            el.removeEventListener('pointerdown', dismiss);
            el.removeEventListener('scroll', onScroll);
            el.removeEventListener('wheel', onWheel);
        };
    }, [targetRef, active, dismiss]);

    /* 넘길 게 있는 줄이 화면에 충분히 들어오면 한 번 띄운다 */
    useEffect(() => {
        if (!active || state !== 'idle') return;
        const el = targetRef.current;
        if (!el) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry) return;
                // 60% 이상 보이거나, 줄이 화면보다 커서 60% 가 안 되면 화면 절반 이상을 채웠을 때
                const viewH = entry.rootBounds?.height ?? window.innerHeight;
                const enough =
                    entry.isIntersecting &&
                    (entry.intersectionRatio >= 0.6 || entry.intersectionRect.height >= viewH * 0.5);
                // 빠르게 스크롤하며 지나가기만 한 줄에는 띄우지 않는다 — 머무는 동안에만 시간을 잰다
                if (!enough) {
                    if (timer) clearTimeout(timer);
                    timer = undefined;
                    return;
                }
                if (timer) return;
                timer = setTimeout(() => {
                    io.disconnect();
                    const coarse = window.matchMedia('(pointer: coarse)').matches;
                    if (!coarse && window.innerWidth >= NARROW) {
                        setState('done'); // 넓은 PC — 화살표·드래그 커서로 충분하다
                        return;
                    }
                    setTouch(coarse);
                    setState((s) => (s === 'idle' ? 'show' : s));
                }, HINT_DELAY);
            },
            { threshold: [0, 0.3, 0.6, 1] },
        );
        io.observe(el);
        return () => {
            io.disconnect();
            if (timer) clearTimeout(timer);
        };
    }, [targetRef, active, state]);

    useEffect(() => {
        if (state !== 'show') return;
        const timer = setTimeout(() => setState('done'), HINT_DURATION);
        return () => clearTimeout(timer);
    }, [state]);

    return { show: state === 'show' && active, touch, dismiss };
}

/** 스와이퍼를 감싼 relative 상자 안에 넣는다 — 그 상자의 가운데에 뜬다 */
export default function SwipeHint({ show, touch, className }: { show: boolean; touch: boolean; className?: string }) {
    const reduced = useReducedMotion();

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    key="swipe-hint"
                    aria-hidden
                    data-swipe-hint
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: EASE }}
                    className={cn(
                        'pointer-events-none absolute inset-0 z-30 flex items-center justify-center',
                        className,
                    )}
                >
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.9, ease: EASE }}
                        className="flex size-[92px] flex-col items-center justify-center rounded-full bg-cocoa/55 text-cream shadow-[0_10px_28px_rgba(56,43,34,0.2)] ring-1 ring-cream/30 backdrop-blur-[3px]"
                    >
                        <SwipeArrows className="w-[26px] opacity-80" />
                        <motion.span
                            className="mt-[3px] block"
                            animate={reduced ? undefined : { x: [7, -7, 7], rotate: [4, -6, 4] }}
                            transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
                        >
                            <SwipeHand className="w-[27px]" />
                        </motion.span>
                        <span className="notranslate mt-[5px] font-title text-[10px] leading-none tracking-[0.24em]">
                            {touch ? 'SWIPE' : 'DRAG'}
                        </span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

function SwipeArrows({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 28 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={className}
        >
            <path d="M5 4h18M7.5 1.5 5 4l2.5 2.5M20.5 1.5 23 4l-2.5 2.5" />
        </svg>
    );
}

/** 검지를 편 손 — 히어로의 스크롤 마우스처럼 얇은 선 · 둥근 끝의 선 아이콘 */
function SwipeHand({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={className}
        >
            <path d="M9 14.6V4.6a1.5 1.5 0 0 1 3 0V10" />
            <path d="M12 10V9.1a1.5 1.5 0 0 1 3 0v1.6" />
            <path d="M15 10.7a1.5 1.5 0 0 1 3 0v1" />
            <path d="M18 11.7a1.5 1.5 0 0 1 3 0v3.4a6.9 6.9 0 0 1-6.9 6.9h-1.2a6.4 6.4 0 0 1-5-2.4l-3.2-4a1.55 1.55 0 0 1 2.4-2l2 2" />
        </svg>
    );
}

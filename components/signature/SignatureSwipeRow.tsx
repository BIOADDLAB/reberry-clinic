/* #COMPONENTS: 시그니처 가로 줄 — 사진 3장(인물 / 전후사진)을 "자리가 있으면 격자, 모자라면 스와이프"로 보여 준다.
   서버 페이지에서는 카드(RevealItem)만 넘긴다. 줄 레이아웃은 여기서 RevealGroup 에 직접 붙인다.
   (함수 children 은 RSC 가 못하고, display:contents 는 fill 이미지 높이를 0 으로 만든다.)

   ── 동작 순서 (화면을 줄여 갈 때) ────────────────────────────────────
   ① 넓은 화면: 시안 줄 폭(maxWidth)으로 가운데 정렬 → 좌우 여백만 줄어든다
   ② 여백이 다 사라지면 카드가 조금씩 줄어든다 (최소 280)
   ③ 카드 3장 + 간격이 더는 안 들어가면(줄 폭 880 미만) 그 순간 스와이프로 바뀐다
   → 전환은 CSS 컨테이너 쿼리(@container / @min-[880px]:)가 맡는다. 서버 HTML 부터 맞는 모양이고,
     개발자도구에서 창만 줄여도 JS 없이 바로 따라간다. (880 = 최소 카드 280 × 3 + 간격 20 × 2)

   #ISSUE: 스와이프 영역 안에서 손가락으로 위아래로 쓸면 페이지가 안 내려가고 좌우로만 움직였다.
           → touch-pan-x(가로 터치만 허용)가 원인. 기본값으로 되돌려 브라우저가 첫 움직임 방향을 보고
             세로면 페이지 스크롤, 가로면 사진 넘김으로 나누게 했다(앱·쇼핑몰 캐러셀과 같은 네이티브 방식).
   #ISSUE: 개발자도구에서 기기를 지정해야만 넘어가고, 창만 줄이면 마우스로 끌어도 안 넘어갔다.
           ① snap-mandatory 가 드래그 중 바꾼 scrollLeft 를 매번 원래 카드로 되돌렸고
           ② 사진을 잡고 끌면 브라우저 기본 "이미지 끌어다 놓기"가 시작돼 포인터 이벤트가 끊겼다.
           → 끄는 동안만 스냅을 끄고, 놓으면 가까운 카드(빠르게 튕기면 다음 카드)로 부드럽게 붙인 뒤 스냅을 되돌린다.
             이미지 기본 드래그는 막고, 끌고 난 직후의 클릭(전후사진 크게 보기)은 무시한다. 터치는 브라우저에 맡긴다.
   오른쪽 끝이 잘리던 이유(예전 메모): overflow 상자의 padding-right 는 스크롤 폭에 안 잡힌다.
           → 패딩은 스크롤 상자가 아니라 안쪽 줄(w-max)에 준다. */

'use client';

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/components/lib/cn';
import { EASE } from '@/components/lib/motion';
import { RevealGroup } from '@/components/motion/RevealGroup';

/** 이만큼(px) 움직여야 드래그로 본다. 그 전에 떼면 그냥 클릭 */
const DRAG_THRESHOLD = 6;
/** 줄이 화면에 들어온 뒤 힌트가 뜨기까지(카드 등장 모션이 먼저 보이도록) */
const HINT_DELAY = 900;
/** 힌트가 떠 있는 시간. 그 전에 한 번이라도 넘기면 바로 사라진다 */
const HINT_DURATION = 3600;

type HintState = 'idle' | 'show' | 'done';

export default function SignatureSwipeRow({
    children,
    count,
    maxWidth,
    gapClassName,
    className,
}: {
    children: ReactNode;
    /** 카드 장수 — 1장이면 넘길 게 없으니 힌트·진행 막대를 그리지 않는다 */
    count: number;
    /** 시안 줄 폭(카드 3장 + 간격 2개). 넓은 화면에서는 이 폭으로 가운데에 선다 */
    maxWidth: number;
    /** 카드 간격을 CSS 변수로 — 예) '[--gap:16px] md:[--gap:20px] xl:[--gap:34px]'
        (격자일 때 카드 폭 계산에도 같은 값을 쓰려고 gap-* 대신 변수로 받는다) */
    gapClassName: string;
    className?: string;
}) {
    const stageRef = useRef<HTMLDivElement>(null);
    const scrollerRef = useRef<HTMLDivElement>(null);
    const thumbRef = useRef<HTMLSpanElement>(null);
    const drag = useRef({ id: -1, startX: 0, startLeft: 0, lastX: 0, lastT: 0, v: 0, moved: false });
    const suppressClick = useRef(false);
    const lastLeft = useRef(0);

    /** 지금 실제로 넘길 게 있는지 (격자 모양이면 false) */
    const [scrollable, setScrollable] = useState(false);
    const [dragging, setDragging] = useState(false);
    const [hint, setHint] = useState<HintState>('idle');
    const [coarse, setCoarse] = useState(true);

    const multi = count > 1;
    const dismissHint = useCallback(() => setHint((h) => (h === 'done' ? h : 'done')), []);

    /* 진행 막대 — 스크롤마다 React 렌더 없이 스타일만 바꾼다 */
    const paintProgress = useCallback(() => {
        const el = scrollerRef.current;
        const thumb = thumbRef.current;
        if (!el || !thumb) return;
        const max = el.scrollWidth - el.clientWidth;
        const ratio = el.scrollWidth > 0 ? Math.min(1, el.clientWidth / el.scrollWidth) : 1;
        const progress = max > 0 ? Math.min(1, Math.max(0, el.scrollLeft / max)) : 0;
        thumb.style.width = `${ratio * 100}%`;
        thumb.style.transform = `translateX(${(1 / ratio - 1) * progress * 100}%)`;
    }, []);

    /* 격자 ↔ 스와이프 여부는 CSS 가 정하고, 여기서는 "지금 넘길 게 있나"만 읽는다 */
    useEffect(() => {
        const el = scrollerRef.current;
        if (!el) return;
        const measure = () => {
            // 오른쪽 안쪽 여백(24px)만 살짝 잘리는 정도면 카드는 다 보이는 것 → 넘길 게 없다고 본다
            const track = el.firstElementChild as HTMLElement | null;
            const slack = track ? parseFloat(getComputedStyle(track).paddingRight) || 0 : 0;
            const canScroll =
                getComputedStyle(el).overflowX !== 'visible' && el.scrollWidth - el.clientWidth > slack + 1;
            setScrollable(canScroll);
            paintProgress();
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        if (el.firstElementChild) ro.observe(el.firstElementChild);
        return () => ro.disconnect();
    }, [paintProgress]);

    /* 스와이프 힌트 — 넘길 수 있는 줄이 화면에 60% 이상 들어오면 한 번 띄운다 */
    useEffect(() => {
        if (!multi || !scrollable || hint !== 'idle') return;
        const stage = stageRef.current;
        if (!stage) return;
        let timer: ReturnType<typeof setTimeout> | undefined;
        const io = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) return;
                // 60% 이상 보이거나, 줄이 화면보다 커서 60% 가 안 되면 화면 절반 이상을 채웠을 때
                const viewH = entry.rootBounds?.height ?? window.innerHeight;
                if (entry.intersectionRatio < 0.6 && entry.intersectionRect.height < viewH * 0.5) return;
                io.disconnect();
                timer = setTimeout(() => {
                    setCoarse(window.matchMedia('(pointer: coarse)').matches);
                    setHint((h) => (h === 'idle' ? 'show' : h));
                }, HINT_DELAY);
            },
            { threshold: [0.3, 0.6, 1] },
        );
        io.observe(stage);
        return () => {
            io.disconnect();
            if (timer) clearTimeout(timer);
        };
    }, [multi, scrollable, hint]);

    useEffect(() => {
        if (hint !== 'show') return;
        const timer = setTimeout(() => setHint('done'), HINT_DURATION);
        return () => clearTimeout(timer);
    }, [hint]);

    const onScroll = () => {
        const el = scrollerRef.current;
        if (!el) return;
        if (Math.abs(el.scrollLeft - lastLeft.current) > 2) dismissHint();
        lastLeft.current = el.scrollLeft;
        paintProgress();
    };

    /* ── 마우스 드래그 (터치는 브라우저 기본 스크롤이 처리) ── */
    const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
        suppressClick.current = false;
        if (!scrollable) return;
        dismissHint();
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const el = e.currentTarget;
        drag.current = {
            id: e.pointerId,
            startX: e.clientX,
            startLeft: el.scrollLeft,
            lastX: e.clientX,
            lastT: e.timeStamp,
            v: 0,
            moved: false,
        };
    };

    const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (d.id !== e.pointerId) return;
        const el = e.currentTarget;
        const dx = e.clientX - d.startX;
        if (!d.moved) {
            if (Math.abs(dx) < DRAG_THRESHOLD) return;
            d.moved = true;
            try {
                el.setPointerCapture(e.pointerId); // 카드 밖·창 밖으로 끌고 나가도 계속 따라오게
            } catch {
                /* 이미 끝난 포인터면 무시 */
            }
            // 드래그 중에는 스냅이 scrollLeft 를 되돌리지 않게 잠깐 끈다
            el.style.scrollSnapType = 'none';
            el.style.scrollBehavior = 'auto';
            setDragging(true);
        }
        el.scrollLeft = d.startLeft - dx;
        const dt = e.timeStamp - d.lastT;
        if (dt > 0) {
            d.v = 0.7 * ((e.clientX - d.lastX) / dt) + 0.3 * d.v;
            d.lastX = e.clientX;
            d.lastT = e.timeStamp;
        }
    };

    const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
        const d = drag.current;
        if (d.id !== e.pointerId) return;
        d.id = -1;
        if (!d.moved) return;
        const el = e.currentTarget;
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        // 손을 뗄 때 따라오는 클릭 한 번만 막는다 (클릭이 안 따라오는 경우를 대비해 곧바로 풀어 둔다)
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 60);
        setDragging(false);
        // 멈춘 채로 잠깐 있다가 놓았으면 튕긴 게 아니다
        const velocity = e.timeStamp - d.lastT > 120 ? 0 : d.v;
        settleToCard(el, d.startLeft, velocity, () => drag.current.id === -1);
    };

    return (
        <div className={cn('@container mx-auto w-full', className)} style={{ maxWidth }}>
            <div ref={stageRef} className="relative">
                <div
                    ref={scrollerRef}
                    onScroll={onScroll}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerEnd}
                    onPointerCancel={onPointerEnd}
                    onDragStart={(e) => e.preventDefault()}
                    onClickCapture={(e) => {
                        if (!suppressClick.current) return;
                        suppressClick.current = false;
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    className={cn(
                        /* 스와이프(기본): 화면 끝까지 넘어가도록 컨테이너 여백(24px)만큼 좌우로 편다.
                           위아래 -my-3 / py-3 은 카드 그림자·호버 이동이 스크롤 상자에 잘리지 않게 주는 여유 */
                        'no-scrollbar -mx-6 -my-3 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-px-6',
                        /* 격자: 넘길 게 없으니 스크롤 상자를 풀어 준다 */
                        '@min-[880px]:m-0 @min-[880px]:overflow-visible',
                        scrollable && 'cursor-grab select-none',
                        dragging && 'cursor-grabbing [&_*]:cursor-grabbing',
                    )}
                >
                    <RevealGroup
                        className={cn(
                            'mx-auto flex w-max gap-[var(--gap)] px-6 py-3',
                            gapClassName,
                            '[&>*]:w-[min(78vw,320px)] [&>*]:max-w-none [&>*]:shrink-0 [&>*]:snap-start',
                            /* 격자: 줄 폭을 3등분 (1~2장이어도 같은 크기로 가운데) */
                            '@min-[880px]:w-full @min-[880px]:justify-center @min-[880px]:p-0',
                            '@min-[880px]:[&>*]:w-[calc((100cqw-2*var(--gap))/3)]',
                        )}
                    >
                        {children}
                    </RevealGroup>
                </div>

                <AnimatePresence>
                    {hint === 'show' && scrollable && <SwipeHint key="hint" touch={coarse} />}
                </AnimatePresence>
            </div>

            {/* 진행 막대 — 스와이프일 때만. 자리는 미리 잡아 두고(invisible) 넘길 게 있을 때만 보인다 */}
            {multi && (
                <div
                    aria-hidden
                    className={cn(
                        'mx-auto mt-6 h-[2px] w-[120px] overflow-hidden rounded-full bg-cocoa/15 @min-[880px]:hidden',
                        !scrollable && 'invisible',
                    )}
                >
                    <span ref={thumbRef} className="block h-full w-1/3 rounded-full bg-cocoa/70" />
                </div>
            )}
        </div>
    );
}

/* 손을 놓은 자리에서 가장 가까운 카드로 붙인다.
   빠르게 튕겼으면 그 방향으로 한 장, 천천히 40px 넘게 끌었으면 적어도 한 장은 넘긴다. */
function settleToCard(el: HTMLElement, startLeft: number, velocity: number, canRestore: () => boolean) {
    const max = el.scrollWidth - el.clientWidth;
    const padLeft = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const originX = el.getBoundingClientRect().left - el.scrollLeft;
    const cards = Array.from(el.firstElementChild?.children ?? []);
    const points = [
        ...new Set(
            cards.map((card) =>
                Math.round(Math.min(max, Math.max(0, card.getBoundingClientRect().left - originX - padLeft))),
            ),
        ),
    ].sort((a, b) => a - b);

    const restore = () => {
        if (!canRestore()) return;
        el.style.scrollSnapType = '';
        el.style.scrollBehavior = '';
    };

    if (points.length === 0) {
        restore();
        return;
    }

    const nearestIndex = (x: number) =>
        points.reduce((best, p, i) => (Math.abs(p - x) < Math.abs(points[best] - x) ? i : best), 0);

    const moved = el.scrollLeft - startLeft;
    // 마우스가 오른쪽(+)으로 빠르게 움직였으면 앞쪽 카드로 — 스크롤은 반대 방향
    let index = nearestIndex(el.scrollLeft - velocity * 220);
    const startIndex = nearestIndex(startLeft);
    if (index === startIndex && Math.abs(moved) > 40) {
        index = Math.min(points.length - 1, Math.max(0, startIndex + Math.sign(moved)));
    }

    el.scrollTo({ left: points[index], behavior: 'smooth' });
    // 부드러운 이동이 끝난 뒤 스냅을 되돌린다 (scrollend 미지원 브라우저는 시간으로)
    el.addEventListener('scrollend', restore, { once: true });
    setTimeout(restore, 800);
}

/* ───────── 스와이프 힌트 ─────────
   흔히 쓰는 "손가락 + 좌우 화살표" 안내를 사이트 톤(코코아 반투명 원 · 크림 선 아이콘 · Belleza 대문자)으로.
   터치 기기는 SWIPE, 마우스는 DRAG. 누르거나 넘기면 바로 사라지고, 가만히 두면 몇 초 뒤 스스로 사라진다.
   사진 위에 떠 있어도 터치를 가로막지 않는다(pointer-events: none). 동작 줄이기 설정이면 손이 움직이지 않는다. */
function SwipeHint({ touch }: { touch: boolean }) {
    return (
        <motion.div
            aria-hidden
            data-swipe-hint
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: EASE }}
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
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
                    animate={{ x: [7, -7, 7], rotate: [4, -6, 4] }}
                    transition={{ duration: 1.8, ease: 'easeInOut', repeat: Infinity }}
                >
                    <SwipeHand className="w-[27px]" />
                </motion.span>
                <span className="notranslate mt-[5px] font-title text-[10px] leading-none tracking-[0.24em]">
                    {touch ? 'SWIPE' : 'DRAG'}
                </span>
            </motion.div>
        </motion.div>
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

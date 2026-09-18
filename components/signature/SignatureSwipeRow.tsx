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
           → 마우스 드래그는 사이트 공용 useDragScroll 이 맡는다(스냅 잠깐 끄기 · 이미지 기본 드래그 막기 ·
             놓으면 가까운 카드로 붙이기 · 끈 직후 클릭 무시). 터치는 브라우저에 맡긴다.
   스와이프 힌트는 사이트 공용 SwipeHint(모든 스와이퍼가 같은 모양).
   오른쪽 끝이 잘리던 이유(예전 메모): overflow 상자의 padding-right 는 스크롤 폭에 안 잡힌다.
           → 패딩은 스크롤 상자가 아니라 안쪽 줄(w-max)에 준다. */

'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/components/lib/cn';
import { useDragScroll } from '@/components/lib/useDragScroll';
import { RevealGroup } from '@/components/motion/RevealGroup';
import SwipeHint, { useSwipeHint } from '@/components/ui/SwipeHint';

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
    const { ref: scrollerRef, dragProps, dragClass } = useDragScroll<HTMLDivElement>();
    const thumbRef = useRef<HTMLSpanElement>(null);

    /** 지금 실제로 넘길 게 있는지 (격자 모양이면 false) */
    const [scrollable, setScrollable] = useState(false);
    const multi = count > 1;
    const hint = useSwipeHint(scrollerRef, multi && scrollable);

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
    }, [scrollerRef]);

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
    }, [scrollerRef, paintProgress]);

    return (
        <div className={cn('@container mx-auto w-full', className)} style={{ maxWidth }}>
            <div className="relative">
                <div
                    ref={scrollerRef}
                    onScroll={paintProgress}
                    {...(scrollable ? dragProps : {})}
                    className={cn(
                        /* 스와이프(기본): 화면 끝까지 넘어가도록 컨테이너 여백(24px)만큼 좌우로 편다.
                           위아래 -my-3 / py-3 은 카드 그림자·호버 이동이 스크롤 상자에 잘리지 않게 주는 여유 */
                        'no-scrollbar -mx-6 -my-3 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-px-6',
                        /* 격자: 넘길 게 없으니 스크롤 상자를 풀어 준다 */
                        '@min-[880px]:m-0 @min-[880px]:overflow-visible',
                        scrollable && dragClass,
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

                <SwipeHint show={hint.show} touch={hint.touch} />
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

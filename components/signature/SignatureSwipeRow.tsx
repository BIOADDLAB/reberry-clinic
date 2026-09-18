/* #COMPONENTS: 시그니처 가로 줄 — 3장이 컨테이너에 들어가면 격자, 안 들어가면 스와이프.
   서버 페이지에서는 카드(RevealItem)만 넘긴다. 줄 레이아웃은 여기서 RevealGroup 에 직접 붙인다.
   (함수 children 은 RSC 가 못하고, display:contents 는 fill 이미지 높이를 0 으로 만든다.)
   오른쪽 끝이 잘리던 이유: overflow 상자의 padding-right 는 스크롤 폭에 안 잡힌다.
   → 왼쪽 pl-6, 오른쪽은 마지막 카드 mr-6. */

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/components/lib/cn';
import { useDragScroll } from '@/components/lib/useDragScroll';
import { RevealGroup } from '@/components/motion/RevealGroup';

export default function SignatureSwipeRow({
    children,
    count,
    itemMin = 280,
    gap = 20,
    fitGapClassName,
    className,
}: {
    children: ReactNode;
    count: number;
    itemMin?: number;
    gap?: number;
    fitGapClassName: string;
    className?: string;
}) {
    const hostRef = useRef<HTMLDivElement>(null);
    const { ref, dragProps, dragClass } = useDragScroll<HTMLDivElement>();
    const [over, setOver] = useState(true);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) return;
        const measure = () => {
            const need = count * itemMin + (count - 1) * gap;
            setOver(need > host.clientWidth + 2);
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(host);
        return () => ro.disconnect();
    }, [count, gap, itemMin]);

    const row = (
        <RevealGroup
            className={
                over
                    ? 'flex w-max gap-4 pb-3 pl-6 md:gap-5 [&>*]:w-[min(78vw,320px)] [&>*]:max-w-none [&>*]:shrink-0 [&>*]:snap-start [&>*:last-child]:mr-6'
                    : cn('grid w-full grid-cols-3 [&>*]:min-w-0 [&>*]:w-full [&>*]:max-w-none', fitGapClassName)
            }
        >
            {children}
        </RevealGroup>
    );

    return (
        <div ref={hostRef} className={className}>
            {over ? (
                <div
                    ref={ref}
                    {...dragProps}
                    className={cn(
                        'no-scrollbar -mx-6 snap-x snap-mandatory overflow-x-auto overscroll-x-contain scroll-px-6 touch-pan-x',
                        dragClass,
                    )}
                >
                    {row}
                </div>
            ) : (
                row
            )}
        </div>
    );
}

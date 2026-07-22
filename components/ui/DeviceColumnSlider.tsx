// #LINK: /components/ui/DeviceColumnSlider.tsx
// #STYLE: 기기상세 전용 칼럼 — 시안: 의사사진X, 페이지네이션X, 좌측 정렬, 영역 안에서만 스와이프(우측 풀블리드 아님)
// #ISSUE: 카드 마크업은 시그니처 ColumnSlider와 동일. 1개여도 좌측, 3개까지 그대로, 넘치면 영역 내 가로 스크롤

'use client';

import Image from 'next/image';
import { site } from '@/components/lib/site';
import { useDragScroll } from '@/components/lib/useDragScroll';
import { cn } from '@/components/lib/cn';
import type { Col } from '@/components/lib/columns';

export default function DeviceColumnSlider({ items }: { items: Col[] }) {
    const { ref, dragProps, dragClass } = useDragScroll<HTMLDivElement>();

    if (items.length === 0) return null;

    return (
        // 영역 안에서만 스크롤 — 좌측 정렬 고정(justify-start), 넘치면 가로 스와이프
        <div
            ref={ref}
            {...dragProps}
            className={cn('no-scrollbar flex snap-x justify-start gap-6 overflow-x-auto scroll-smooth pb-1', dragClass)}
        >
            {items.map((c, i) => (
                <article
                    key={`${c.title}-${i}`}
                    className="flex h-[239px] w-[344px] shrink-0 snap-start flex-col border border-cocoa bg-transparent"
                >
                    <div className="flex flex-1 flex-col px-7.5 pt-9 pb-6">
                        <div className="flex items-baseline justify-between gap-3 border-t-[2px] border-b border-cocoa p-2.5">
                            <h3 className="min-w-0 text-h3 font-bold">{c.title}</h3>
                            <span className="font-display text-h3">{c.en}</span>
                        </div>
                        <p className="mt-4 line-clamp-2 min-h-[3em] whitespace-pre-line text-lead leading-[30px]!">
                            {c.text}
                        </p>
                        <a
                            href={c.link ?? site.blog}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-auto flex items-center justify-end gap-1.25 pt-2.5 text-medium font-bold transition-opacity duration-500 hover:opacity-60"
                        >
                            더보기
                            <Image src="/images/i-plus-02.svg" alt="" width={10} height={10} className="pb-4" />
                        </a>
                    </div>
                </article>
            ))}
        </div>
    );
}

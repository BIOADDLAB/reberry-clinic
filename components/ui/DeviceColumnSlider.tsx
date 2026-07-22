// #LINK: /components/ui/DeviceColumnSlider.tsx
// #STYLE: 기기상세 전용 — 시안: 의사사진X / 라벨은 카드 위 좌측 / 페이저(← → n/m)는 카드 아래 우측
// #ISSUE: 좌측 정렬 고정(1개여도 왼쪽), 영역 안에서만 스와이프(우측 풀블리드 아님), 폭이 모자라면 자동 슬라이더

'use client';

import Image from 'next/image';
import { site } from '@/components/lib/site';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import type { Col } from '@/components/lib/columns';

export default function DeviceColumnSlider({ items }: { items: Col[] }) {
    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(items.length, 344, 24);

    if (items.length === 0) return null;

    return (
        <div>
            {/* 라벨 — 카드 위 좌측 */}
            <p className="text-small font-bold text-cocoa lg:text-medium lg:font-normal">
                닥터 파이톤 <span className="font-display">Pytone</span>
                <span className="ml-1.5 inline-block align-middle text-[0.7em]">▶</span>
            </p>

            {/* 카드 — 좌측 정렬, 영역 안에서만 스크롤 */}
            <div
                ref={ref}
                {...dragProps}
                onScroll={onScroll}
                className={cn(
                    'no-scrollbar mt-3 flex snap-x justify-start gap-6 overflow-x-auto scroll-smooth pb-1',
                    dragClass,
                )}
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

            {/* 페이저 — 카드 아래 우측 (넘칠 때만) */}
            {over && (
                <div className="mt-4 flex items-center justify-end gap-3 text-small text-latte">
                    <button
                        onClick={() => move(-1)}
                        aria-label="이전"
                        className={cn('transition-opacity duration-500 hover:opacity-60', !canPrev && 'opacity-30')}
                    >
                        ←
                    </button>
                    <button
                        onClick={() => move(1)}
                        aria-label="다음"
                        className={cn('transition-opacity duration-500 hover:opacity-60', !canNext && 'opacity-30')}
                    >
                        →
                    </button>
                    <span className="h-3.5 w-px bg-cocoa/30" aria-hidden />
                    <span className="font-display notranslate">
                        {page} / {total}
                    </span>
                </div>
            )}
        </div>
    );
}

'use client';

import Image from 'next/image';
import { site } from '@/components/lib/site';
import { cn } from '@/components/lib/cn';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import type { Col } from '@/components/lib/columns';
import { useColumnsBySlug } from '@/components/lib/useColumns';

export default function ColumnSlider({ items, slug }: { items: Col[]; slug: string }) {
    const resolvedItems = useColumnsBySlug(slug, items);

    // 카드 344 + 간격 24 기준으로 "안 들어가면 슬라이더" 자동 판단 (개수로 고정하지 않음)
    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(resolvedItems.length, 344, 24);

    const Card = ({ c }: { c: Col }) => (
        <article className="flex h-[239px] w-[344px] shrink-0 snap-start flex-col border border-cocoa bg-transparent">
            <div className="flex flex-1 flex-col px-7.5 pt-9 pb-6">
                <div className="flex items-baseline justify-between gap-3 border-t-[2px] border-b border-cocoa p-2.5">
                    <h3 className="min-w-0 text-h3 font-bold">{c.title}</h3>
                    <span className="font-display text-h3">{c.en}</span>
                </div>
                <p className="mt-4 line-clamp-2 min-h-[3em] whitespace-pre-line text-lead leading-[30px]!">{c.text}</p>
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
    );

    // ref 필수: 정적일 때도 폭을 계속 재야 창을 줄였을 때 슬라이더로 전환됨
    const renderStatic = () => (
        <div ref={ref} className="flex shrink-0 justify-center gap-6">
            {resolvedItems.map((c, i) => (
                <Card key={`${c.title}-${i}`} c={c} />
            ))}
        </div>
    );

    const renderSlider = () => (
        <div
            ref={ref}
            {...dragProps}
            onScroll={onScroll}
            className={cn(
                'no-scrollbar flex min-w-0 flex-1 snap-x gap-6 overflow-x-auto scroll-smooth pb-1',
                'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)]',
                dragClass,
            )}
        >
            {resolvedItems.map((c, i) => (
                <Card key={`${c.title}-${i}`} c={c} />
            ))}
        </div>
    );

    return (
        <div className={cn('flex flex-col lg:flex-row lg:items-start lg:gap-5', !over && 'lg:justify-center')}>
            {/* 왼쪽 — 의사 사진 + 라벨 */}
            <div className="mb-3 flex w-full shrink-0 flex-col lg:mx-0 lg:mb-0 lg:w-[210px] lg:text-left">
                <div className="relative hidden h-[239px] w-[210px] overflow-hidden lg:block">
                    <Image
                        src="/images/img-doc-01.jpg"
                        alt="닥터 파이톤"
                        fill
                        quality={85}
                        sizes="210px"
                        className="object-cover object-top"
                    />
                </div>

                <p className="mt-0 text-small font-bold text-cocoa lg:mt-3 lg:text-medium lg:font-normal">
                    닥터 파이톤 <span className="font-display">Pytone</span>
                    <span className="ml-1.5 inline-block align-middle text-[0.7em]">▶</span>
                </p>
            </div>

            {/* 오른쪽 — 카드 + 그 아래 좌측 페이저 */}
            <div className={cn('w-full min-w-0', over ? 'lg:flex-1' : 'lg:w-auto')}>
                {over ? renderSlider() : renderStatic()}

                {/* 페이저 — 카드 아래 좌측 (← → 1 / 3) */}
                {over && (
                    <div className="mt-4 hidden items-center gap-3 text-small text-latte lg:flex">
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

            {over && (
                <div className="mt-3 block font-display text-small lg:hidden">
                    {page} / {total}
                </div>
            )}
        </div>
    );
}

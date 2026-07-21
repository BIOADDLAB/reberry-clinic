'use client';

import Image from 'next/image';
import { useEffect, useState, useRef } from 'react';
import { site } from '@/components/lib/site';
import { cn } from '@/components/lib/cn';
import { useDragScroll } from '@/components/lib/useDragScroll';
import type { Col } from '@/components/lib/columns';

export default function ColumnSlider({ items }: { items: Col[] }) {
    const { ref, dragProps, dragClass } = useDragScroll<HTMLDivElement>();
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(1);

    const measure = () => {
        const el = ref.current;
        if (!el) return { step: 1 };
        const card = el.querySelector('article');
        return { step: (card?.clientWidth ?? 344) + 24, max: el.scrollWidth - el.clientWidth };
    };

    useEffect(() => {
        const update = () => {
            const el = ref.current;
            if (!el) return;
            const { step } = measure();
            setTotal(Math.max(1, Math.round((el.scrollWidth - el.clientWidth) / step) + 1));
        };
        setTimeout(update, 50);
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [items]);

    const move = (dir: -1 | 1) => {
        const { step } = measure();
        ref.current?.scrollBy({ left: dir * step, behavior: 'smooth' });
    };

    const onScroll = () => {
        const el = ref.current;
        if (!el) return;
        const { step } = measure();
        setPage(Math.min(total, Math.round(el.scrollLeft / step) + 1));
    };

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

    const renderStatic = (className?: string) => (
        <div className={cn('flex shrink-0 flex-wrap justify-center gap-6', className)}>
            {items.map((c, i) => (
                <Card key={`${c.title}-${i}`} c={c} />
            ))}
        </div>
    );

    const renderSlider = (className?: string) => (
        <div
            ref={ref}
            {...dragProps}
            onScroll={onScroll}
            className={cn(
                'no-scrollbar flex min-w-0 flex-1 snap-x gap-6 overflow-x-auto scroll-smooth pb-1',
                'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)]',
                dragClass,
                className,
            )}
        >
            {items.map((c, i) => (
                <Card key={`${c.title}-${i}`} c={c} />
            ))}
        </div>
    );

    const showSliderDesktop = items.length >= 4;
    const showSliderMobile = items.length >= 2;

    return (
        <div
            className={cn(
                'flex flex-col lg:flex-row lg:items-start lg:gap-5',
                !showSliderDesktop && 'lg:justify-center',
            )}
        >
            <div className="mb-3 flex w-full shrink-0 flex-col lg:mb-0 lg:mx-0 lg:w-[210px] lg:text-left">
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
                    <span className="ml-1.5 inline-block align-middle text-[0.7em]">▼</span>
                </p>

                {showSliderDesktop && (
                    <div className="mt-4 hidden items-center gap-3 text-small text-latte lg:flex">
                        <button
                            onClick={() => move(-1)}
                            aria-label="이전"
                            className="transition-opacity duration-500 hover:opacity-60"
                        >
                            ←
                        </button>
                        <button
                            onClick={() => move(1)}
                            aria-label="다음"
                            className="transition-opacity duration-500 hover:opacity-60"
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

            <div className={cn('w-full min-w-0', showSliderDesktop ? 'lg:flex-1' : 'lg:w-auto')}>
                {items.length <= 1 && renderStatic()}

                {(items.length === 2 || items.length === 3) && (
                    <>
                        {renderSlider('block lg:hidden')}
                        {renderStatic('hidden lg:flex')}
                    </>
                )}

                {items.length >= 4 && renderSlider()}
            </div>

            {showSliderMobile && (
                <div className="mt-3 block font-display text-small lg:hidden">
                    {page} / {total}
                </div>
            )}
        </div>
    );
}

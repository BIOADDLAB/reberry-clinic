'use client';

import Image from 'next/image';
import Link from 'next/link';
import { getSolutionsBySlugs } from '@/components/lib/solutions';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';

// 카테고리별 카드 톤 — 단일 진실 공급원. 페이지(템플릿)는 category만 넘기면 됨
type Category = 'signature' | 'skin' | 'aging';
const TONES: Record<Category, { pointClass: string; panelClass: string }> = {
    signature: { pointClass: 'bg-latte text-cream', panelClass: 'bg-sand' },
    skin: { pointClass: 'bg-latte text-cream', panelClass: 'bg-latte/10' },
    aging: { pointClass: 'bg-latte text-cream', panelClass: 'bg-sand' },
};

interface Props {
    slugs: string[];
    baseHref: string;
    className?: string;
    category?: Category;
    pointClass?: string;
    panelClass?: string;
}

const CARD_W = 262;
const GAP = 24;

export default function SolutionSlider({ slugs, baseHref, className, category, pointClass, panelClass }: Props) {
    const list = getSolutionsBySlugs(slugs);
    const { ref, dragProps, dragClass, over, wide, canPrev, canNext, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(list.length, CARD_W, GAP, true);

    // category 우선 → 없으면 개별 prop → 그것도 없으면 시그니처 기본값 (기존 호출부 하위 호환)
    const resolvedPanel = panelClass ?? (category ? TONES[category].panelClass : 'bg-sand');
    const resolvedPoint = pointClass ?? (category ? TONES[category].pointClass : 'bg-latte text-cream');

    if (list.length === 0) return null;

    const Card = ({ item }: { item: (typeof list)[number] }) => (
        <article className="group flex w-[240px] shrink-0 snap-start flex-col overflow-hidden rounded-[15px] bg-cream text-cocoa md:w-[262px]">
            <div className="relative w-full aspect-[262/253] overflow-hidden">
                <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    quality={85}
                    sizes="(max-width: 768px) 240px, 262px"
                    className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-105"
                />
            </div>
            <div className={cn('flex flex-1 flex-col px-4 pb-8 pt-6.5 shadow-sm', resolvedPanel)}>
                <Link
                    href={`${baseHref}/${item.slug}`}
                    className="flex w-fit items-center gap-2.75 rounded-full bg-cocoa px-5 pr-4 py-1.25 text-[15px] tracking-wide text-cream transition-colors hover:bg-deep"
                >
                    More View{' '}
                    <span className="relative flex h-1.75 w-1.75 items-center justify-center rounded-full bg-white/25 animate-pulse-slow">
                        <span className="relative block h-0.75 w-0.75 rounded-full bg-white"></span>
                    </span>
                </Link>
                <h3 className="ml-2 mt-6 font-bold text-lead">{item.name}</h3>
                <ul className="mt-2 flex-1 space-y-1 font-medium tracking-tighter text-small">
                    {item.desc.map((line) => (
                        <li key={line} className="flex items-start gap-1 break-keep">
                            <span className="shrink-0 select-none">-</span>
                            <span>{line}</span>
                        </li>
                    ))}
                </ul>
                <p className="mt-5 flex items-center gap-2 font-medium text-small">
                    <span className={cn('rounded-full px-2.5 font-bold text-small', resolvedPoint)}>POINT</span>
                    {item.point}
                </p>
            </div>
        </article>
    );

    return (
        <div className={cn('relative', className)}>
            {over && (
                <>
                    <button
                        onClick={() => move(-1)}
                        aria-label="이전"
                        className={cn(
                            'absolute -left-2 top-[30%] z-20 hidden transition-all duration-500 hover:scale-105 md:block lg:-left-16 min-[1170px]:-left-6',
                            canPrev ? 'opacity-100' : 'opacity-30',
                        )}
                    >
                        <Image src="/images/i-arr-left-01.png" alt="" width={44} height={44} />
                    </button>
                    <button
                        onClick={() => move(1)}
                        aria-label="다음"
                        className={cn(
                            'absolute -right-2 top-[30%] z-20 hidden transition-all duration-500 hover:scale-105 md:block lg:-right-16 min-[1170px]:-right-6',
                            canNext ? 'opacity-100' : 'opacity-30',
                        )}
                    >
                        <Image src="/images/i-arr-left-01.png" alt="" width={44} height={44} className="-scale-x-100" />
                    </button>
                </>
            )}

            {over ? (
                <div
                    ref={ref}
                    {...dragProps}
                    onScroll={onScroll}
                    className={cn(
                        'no-scrollbar flex items-stretch snap-x gap-6 overflow-x-auto scroll-smooth pb-1',
                        'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)]',
                        dragClass,
                    )}
                >
                    {list.map((item) => (
                        <Card key={item.slug} item={item} />
                    ))}
                </div>
            ) : (
                <div
                    ref={ref}
                    className={cn('flex items-stretch justify-center gap-6', wide && 'mx-[calc(50%-50vw)] px-6')}
                >
                    {list.map((item) => (
                        <Card key={item.slug} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

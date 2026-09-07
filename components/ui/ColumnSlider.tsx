/* #COMPONENTS: 블로그 연결 칼럼 목록
   #ISSUE 1: 왼쪽 원장님 사진이 칼럼마다 반복돼 자리만 먹었다 → 제거.
   #ISSUE 2: 가로 카드 슬라이더는 "가격/내용이 한눈에 안 들어오고 보기 힘들다" 는 지적이 있었다.
             → 기본을 세로로 쌓이는 카드 그리드로 바꾸고, 나머지 안도 코드로 남겨 비교할 수 있게 한다.

   ═══════════════════════════════════════════════════════════════════════
   ▼ 레이아웃 바꾸는 법: 바로 아래 COLUMN_LAYOUT 값만 'A' | 'B' | 'C' 로 고치면 끝.
        A = 카드 그리드   (기본값 · 2~3열로 쌓임. 글이 몇 개든 안 깨지고 제일 읽기 쉽다)
        B = 가로 슬라이더 (기존 카드형에서 원장님 사진만 뺀 것)
        C = 목록형        (한 줄에 제목 하나. 글이 아주 많을 때)
   3안 모두 살아 있는 코드라 값만 바꿔서 바로 비교할 수 있다.
   ═══════════════════════════════════════════════════════════════════════ */

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { site } from '@/components/lib/site';
import { cn } from '@/components/lib/cn';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { useIsKo } from '@/components/lib/useLang';
import type { Col, FirestoreCol } from '@/components/lib/columns';
import { useColumnsBySlug } from '@/components/lib/useColumns';
import { useLocalizedColumnText } from '@/components/lib/useColumnTextTranslation';

const COLUMN_LAYOUT: 'A' | 'B' | 'C' = 'A';

/** 모든 시술 페이지의 칼럼 목록이 이 한 곳을 지난다. */
export function ColumnListContent({ items }: { items: FirestoreCol[] }) {
    if (COLUMN_LAYOUT === 'B') return <ColumnLayoutB items={items} />;
    if (COLUMN_LAYOUT === 'C') return <ColumnLayoutC items={items} />;
    return <ColumnLayoutA items={items} />;
}

/* 시그니처 페이지도 같은 레이아웃을 쓰도록 이름만 유지 (기존 import 호환) */
export function ColumnSliderContent({ items }: { items: FirestoreCol[] }) {
    return <ColumnListContent items={items} />;
}

/* ── A안 · 카드 그리드 (기본) ───────────────────────────────────────── */
function ColumnLayoutA({ items }: { items: FirestoreCol[] }) {
    const t = useTranslations('common');
    const isKo = useIsKo();

    return (
        <div className="mx-auto grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
            {items.map((item, index) => (
                <ColumnGridCard
                    key={`${item.docId}-${index}`}
                    item={item}
                    index={index}
                    isKo={isKo}
                    moreLabel={t('more')}
                />
            ))}
        </div>
    );
}

function ColumnGridCard({
    item,
    index,
    isKo,
    moreLabel,
}: {
    item: FirestoreCol;
    index: number;
    isKo: boolean;
    moreLabel: string;
}) {
    const { text } = useLocalizedColumnText(item);
    const heading = isKo ? item.title : item.en || item.title;

    return (
        <a
            href={item.link ?? site.blog}
            target="_blank"
            rel="noreferrer"
            className="group flex min-h-[186px] flex-col rounded-[16px] border border-cocoa/[0.1] bg-cream p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cocoa/25 hover:shadow-[0_12px_30px_rgba(69,54,45,0.08)]"
        >
            <div className="flex items-center justify-between gap-3">
                <h3
                    className={cn('min-w-0 truncate text-medium font-bold text-cocoa', (isKo || item.en) && 'notranslate')}
                    title={heading}
                >
                    {heading}
                </h3>
                <span className="notranslate font-display shrink-0 text-caption text-cocoa/25">
                    {String(index + 1).padStart(2, '0')}
                </span>
            </div>

            <p className="mt-4 line-clamp-3 whitespace-pre-line text-small leading-7 text-cocoa/75">{text}</p>

            <span className="mt-auto flex items-center justify-end gap-2 pt-5 text-caption font-semibold text-latte transition-colors group-hover:text-cocoa">
                {moreLabel}
                <span aria-hidden className="text-small">↗</span>
            </span>
        </a>
    );
}

/* ── B안 · 가로 슬라이더 (원장님 사진 없이) ─────────────────────────── */
function ColumnLayoutB({ items }: { items: FirestoreCol[] }) {
    const t = useTranslations('common');
    const isKo = useIsKo();
    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(items.length, 344, 24);

    const Card = ({ c }: { c: FirestoreCol }) => {
        const { text } = useLocalizedColumnText(c);

        return (
            <article
                className="card-fixed-h t-tight flex h-[239px] w-[344px] shrink-0 snap-start flex-col border border-cocoa bg-transparent"
                style={{ '--card-h': '239px' } as React.CSSProperties}
            >
                <div className="flex flex-1 flex-col px-7.5 pt-9 pb-6">
                    <div className="flex items-baseline gap-3 border-t-[2px] border-b border-cocoa p-2.5">
                        <h3
                            className={cn('min-w-0 flex-1 truncate text-h3 font-bold', (isKo || c.en) && 'notranslate')}
                            title={isKo ? c.title : c.en || c.title}
                        >
                            {isKo ? c.title : c.en || c.title}
                        </h3>
                        {isKo && c.en && (
                            <span className="notranslate font-display max-w-[45%] shrink-0 truncate text-h3" title={c.en}>
                                {c.en}
                            </span>
                        )}
                    </div>
                    <p className="mt-4 line-clamp-2 min-h-[3em] whitespace-pre-line text-lead leading-[30px]!">{text}</p>
                    <a
                        href={c.link ?? site.blog}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-auto flex items-center justify-end gap-1.25 pt-2.5 text-medium font-bold transition-opacity duration-500 hover:opacity-60"
                    >
                        {t('more')}
                        <Image src="/images/i-plus-02.svg" alt="" width={10} height={10} className="pb-4" />
                    </a>
                </div>
            </article>
        );
    };

    return (
        <div className="mx-auto w-full max-w-5xl">
            <div
                ref={ref}
                {...(over ? dragProps : {})}
                onScroll={onScroll}
                className={cn(
                    'flex gap-6',
                    over && 'no-scrollbar min-w-0 snap-x overflow-x-auto scroll-smooth pb-1',
                    over && 'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)]',
                    over && dragClass,
                    !over && 'justify-center',
                )}
            >
                {items.map((c, i) => (
                    <Card key={`${c.docId}-${i}`} c={c} />
                ))}
            </div>

            {over && (
                <div className="mt-4 flex items-center gap-3 text-small text-latte">
                    <button
                        onClick={() => move(-1)}
                        aria-label={t('prev')}
                        className={cn('transition-opacity duration-500 hover:opacity-60', !canPrev && 'opacity-30')}
                    >
                        ←
                    </button>
                    <button
                        onClick={() => move(1)}
                        aria-label={t('next')}
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

/* ── C안 · 목록형 ───────────────────────────────────────────────────── */
function ColumnLayoutC({ items }: { items: FirestoreCol[] }) {
    const t = useTranslations('common');

    return (
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[20px] border border-cocoa/[0.1] bg-cream px-5 md:px-8">
            {items.map((item, index) => (
                <ColumnListItem key={`${item.docId}-${index}`} item={item} moreLabel={t('more')} />
            ))}
        </div>
    );
}

function ColumnListItem({ item, moreLabel }: { item: FirestoreCol; moreLabel: string }) {
    const { text } = useLocalizedColumnText(item);

    return (
        <a
            href={item.link ?? site.blog}
            target="_blank"
            rel="noreferrer"
            className="group flex min-h-24 items-center justify-between gap-5 border-b border-cocoa/[0.08] py-6 last:border-b-0 md:min-h-28"
        >
            <h3 className="min-w-0 whitespace-pre-line text-small font-bold leading-7 text-cocoa md:text-lead">{text}</h3>
            <span className="flex shrink-0 items-center gap-3 text-caption font-semibold text-latte transition-colors group-hover:text-cocoa">
                <span className="hidden sm:inline">{moreLabel}</span>
                <span aria-hidden className="text-lead">↗</span>
            </span>
        </a>
    );
}

export default function ColumnSlider({ items, slug }: { items: Col[]; slug: string }) {
    const resolvedItems = useColumnsBySlug(slug, items);
    return <ColumnListContent items={resolvedItems} />;
}

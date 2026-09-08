/* #COMPONENTS: 블로그 연결 칼럼 목록
   #ISSUE 1: 왼쪽 원장님 사진이 칼럼마다 반복돼 자리만 먹었다 → 제거.
   #ISSUE 2: 가로 카드 슬라이더는 "가격/내용이 한눈에 안 들어오고 보기 힘들다" 는 지적이 있었다.
             → 기본을 세로로 쌓이는 카드 그리드로 바꾸고, 나머지 안도 코드로 남겨 비교할 수 있게 한다.

   ═══════════════════════════════════════════════════════════════════════
   ▼ 레이아웃 바꾸는 법: 바로 아래 COLUMN_LAYOUT 값만 'A' | 'B' | 'C' | 'D' 로 고치면 끝.
        A = 카드 그리드     (2~3열로 쌓임. 글이 몇 개든 안 깨지고 제일 읽기 쉽다)
        B = 가로 슬라이더   (기존 카드형에서 원장님 사진만 뺀 것)
        C = 목록형          (한 줄에 제목 하나. 설명 없이 가장 단출하다)
        D = 인덱스 리스트   (기본값 · 큰 번호 + 구분선 + 제목/설명 + 원형 화살표.
             이미지 없는 칼럼 목록에서 매거진·에이전시 사이트가 흔히 쓰는 조합.
             C처럼 세로로 쌓이지만 번호·설명·호버 인터랙션이 있어 더 잘 만든 느낌을 준다)
   4안 모두 살아 있는 코드라 값만 바꿔서 바로 비교할 수 있다.
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
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';

const COLUMN_LAYOUT: 'A' | 'B' | 'C' | 'D' = 'D';

/** 모든 시술 페이지의 칼럼 목록이 이 한 곳을 지난다. */
export function ColumnListContent({ items }: { items: FirestoreCol[] }) {
    if (COLUMN_LAYOUT === 'B') return <ColumnLayoutB items={items} />;
    if (COLUMN_LAYOUT === 'C') return <ColumnLayoutC items={items} />;
    if (COLUMN_LAYOUT === 'D') return <ColumnLayoutD items={items} />;
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
    /* #ISSUE: title(+en) 은 "시술·기기 이름" 용 짧은 이름표(최대 7~12자)일 뿐인데
       카드 큰 제목 자리에 넣어서, 같은 탭 안 카드마다 "색소"·"온다리프팅" 처럼
       이름표만 반복돼 보였다. 실제 카드 제목은 text(최대 34자, 관리자에도
       "카드에 보이는 제목"이라 적혀 있음) → 큰 제목은 text, 이름표는 작게 위로. */
    const { text } = useLocalizedColumnText(item);
    const tag = isKo ? item.title : item.en || item.title;

    return (
        <a
            href={item.link ?? site.blog}
            target="_blank"
            rel="noreferrer"
            className="group flex min-h-[186px] flex-col rounded-[16px] border border-cocoa/[0.1] bg-cream p-6 transition-all duration-300 hover:-translate-y-1 hover:border-cocoa/25 hover:shadow-[0_12px_30px_rgba(69,54,45,0.08)]"
        >
            <div className="flex items-center justify-between gap-3">
                {tag && (
                    <span
                        className={cn('notranslate font-display min-w-0 truncate text-caption-sm tracking-[0.08em] text-latte/70 uppercase', (isKo || item.en) && 'notranslate')}
                    >
                        {tag}
                    </span>
                )}
                <span className="notranslate font-display shrink-0 text-caption text-cocoa/25">
                    {String(index + 1).padStart(2, '0')}
                </span>
            </div>

            <h3 className="mt-2 line-clamp-3 whitespace-pre-line text-medium font-bold leading-7 text-cocoa">{text}</h3>

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

/* ── D안 · 인덱스 리스트 (기본) ─────────────────────────────────────────
   #ISSUE 1: 구분선(border-t)만 있고 감싸는 배경이 없어서 섹션 배경과 안 구분됐다.
             → 목록 전체를 카드 하나(테두리+배경+그림자)로 감싸서 "박스" 느낌을 준다.
             (행 하나하나를 카드로 만드는 건 아님 — 그건 A안 몫)
   #ISSUE 2: 번호가 크고 세로 패딩이 넉넉해서 한 줄 높이가 너무 컸다.
             → 패딩을 줄이고 제목을 1줄로 고정(말줄임)해서 목록을 더 촘촘하게 뺐다. */
function ColumnLayoutD({ items }: { items: FirestoreCol[] }) {
    const t = useTranslations('common');

    return (
        <div className="mx-auto max-w-4xl overflow-hidden rounded-[24px] border border-cocoa/[0.1] bg-cream px-5 shadow-[0_10px_34px_rgba(69,54,45,0.06)] md:px-8">
            <RevealGroup>
                {items.map((item, index) => (
                    <ColumnIndexRow
                        key={`${item.docId}-${index}`}
                        item={item}
                        index={index}
                        moreLabel={t('more')}
                    />
                ))}
            </RevealGroup>
        </div>
    );
}

function ColumnIndexRow({
    item,
    index,
    moreLabel,
}: {
    item: FirestoreCol;
    index: number;
    moreLabel: string;
}) {
    /* 제목은 text(관리자의 "카드에 보이는 제목") 하나만 쓴다.
       위에 작게 붙이던 시술 이름표(title)는 목록 전체가 같은 시술이라 줄마다 "여드름"만 반복돼 지웠다. */
    const { text } = useLocalizedColumnText(item);

    return (
        <RevealItem>
            <a
                href={item.link ?? site.blog}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center gap-4 border-t border-cocoa/[0.08] py-5 first:border-t-0 md:gap-6 md:py-5.5"
            >
                <span className="notranslate font-display w-8 shrink-0 text-lead text-cocoa/25 transition-colors duration-300 group-hover:text-cocoa/60 md:w-10 md:text-h3">
                    {String(index + 1).padStart(2, '0')}
                </span>
                <span className="hidden h-8 w-px shrink-0 bg-cocoa/15 md:block" aria-hidden />
                <span className="min-w-0 flex-1">
                    <h3 className="truncate text-small font-bold leading-6 text-cocoa md:text-medium" title={text}>
                        {text}
                    </h3>
                </span>
                <span className="flex shrink-0 items-center gap-2.5">
                    <span className="hidden text-caption font-semibold text-latte transition-colors group-hover:text-cocoa sm:inline">
                        {moreLabel}
                    </span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cocoa/15 text-cocoa transition-colors duration-300 group-hover:border-cocoa group-hover:bg-cocoa group-hover:text-cream md:h-9 md:w-9">
                        <span
                            aria-hidden
                            className="text-caption-sm transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        >
                            ↗
                        </span>
                    </span>
                </span>
            </a>
        </RevealItem>
    );
}

export default function ColumnSlider({ items, slug }: { items: Col[]; slug: string }) {
    const resolvedItems = useColumnsBySlug(slug, items);
    return <ColumnListContent items={resolvedItems} />;
}

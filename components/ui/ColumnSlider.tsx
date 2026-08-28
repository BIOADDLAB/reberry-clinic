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
import DoctorLabel from '@/components/ui/DoctorLabel';

export function ColumnSliderContent({ items: resolvedItems }: { items: FirestoreCol[] }) {
    const t = useTranslations('common');
    const isKo = useIsKo();

    // 카드 344 + 간격 24 기준으로 "안 들어가면 슬라이더" 자동 판단 (개수로 고정하지 않음)
    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(resolvedItems.length, 344, 24);

    const Card = ({ c }: { c: FirestoreCol }) => {
        const { text } = useLocalizedColumnText(c);

        return (
        <article
            className="card-fixed-h t-tight flex h-[239px] w-[344px] shrink-0 snap-start flex-col border border-cocoa bg-transparent"
            style={{ '--card-h': '239px' } as React.CSSProperties}
        >
            <div className="flex flex-1 flex-col px-7.5 pt-9 pb-6">
                {/* #ISSUE 1: 한글 제목과 영문 제목을 나란히 두니 번역 모드에서 둘 다 번역돼
                    "ピコトーニング Pico Toning" 처럼 같은 말이 두 번 나왔음.
                    한국어일 때만 두 개, 그 외에는 영문 제목 하나만 (양쪽 다 번역 금지)

                    #ISSUE 2: 관리자가 긴 이름을 넣으면 제목이 2~3줄로 늘어나면서
                    카드(높이 239px 고정) 아래쪽 '더보기'가 밖으로 밀려 사라졌다.
                    글자수 제한을 실측값으로 낮췄지만(adminConfig.ts), 기존에 등록된 데이터도 있고
                    제한을 다시 늘릴 수도 있으므로 여기서 한 줄 말줄임으로 막아둔다.
                    → truncate 가 먹으려면 flex 자식에 min-w-0 이 반드시 필요하다.
                    title 속성을 줘서 잘린 전체 문구는 마우스를 올리면 보이게 함 */}
                {/* #ISSUE: 관리자가 영문명을 비워두면 번역 모드에서 제목 자리가 통째로 비었다.
                    → 영문명이 없으면 한국어 제목으로 폴백하고, 이때만 notranslate 를 빼서 구글 번역에 맡긴다 */}
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

    // ref 필수: 정적일 때도 폭을 계속 재야 창을 줄였을 때 슬라이더로 전환됨
    const renderStatic = () => (
        <div ref={ref} className="flex shrink-0 justify-center gap-6">
            {resolvedItems.map((c, i) => (
                <Card key={`${c.docId}-${i}`} c={c} />
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
                <Card key={`${c.docId}-${i}`} c={c} />
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
                        alt={t('doctorPhotoAlt')}
                        fill
                        quality={85}
                        sizes="210px"
                        className="object-cover object-top"
                    />
                </div>

                <DoctorLabel className="mt-0 lg:mt-3" />
            </div>

            {/* 오른쪽 — 카드 + 그 아래 좌측 페이저 */}
            <div className={cn('w-full min-w-0', over ? 'lg:flex-1' : 'lg:w-auto')}>
                {over ? renderSlider() : renderStatic()}

                {/* 페이저 — 카드 아래 좌측 (← → 1 / 3) */}
                {over && (
                    <div className="mt-4 hidden items-center gap-3 text-small text-latte lg:flex">
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

            {over && (
                <div className="notranslate mt-3 block font-display text-small lg:hidden">
                    {page} / {total}
                </div>
            )}
        </div>
    );
}

export default function ColumnSlider({ items, slug }: { items: Col[]; slug: string }) {
    const resolvedItems = useColumnsBySlug(slug, items);
    return <ColumnSliderContent items={resolvedItems} />;
}

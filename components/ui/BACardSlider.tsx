// #COMPONENTS: 시그니처 전후 카드 슬라이더
// #STYLE: 화살표/도트 = 메인 BASlider 것을 그대로 (화살표는 배경색 없음 버전) / 트랙 = 컬럼 방식 풀블리드
// #ISSUE: 넘치면 우측 풀블리드 슬라이드 + 화살표 활성상태(넘길 게 있으면 진해짐), 안 넘치면 중앙
// #ISSUE: 넘칠 때/안 넘칠 때 카드 JSX 가 통째로 복붙돼 있어 한쪽만 고치는 사고가 있었음 → Card 하나로 통합

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { BAPhoto } from '@/components/lib/ba';
import { useBAPhotos, useBAPhotosLoading, filterBAPhotosBySlug } from '@/components/lib/useBAPhotos';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import T from '@/components/lang/T';
import Skeleton from '@/components/ui/Skeleton';

const CARD_W = 244;
const GAP = 23;
const SKELETON_COUNT = 4;

function Card({ b, overflow }: { b: BAPhoto; overflow: boolean }) {
    const t = useTranslations('common');

    return (
        <article
            className="card-fixed-h t-tight flex h-[439px] w-[244px] shrink-0 snap-start flex-col rounded-[10px] bg-cream text-cocoa"
            style={{ '--card-h': '439px' } as React.CSSProperties}
        >
            {/* 시술명은 messages/*.json 의 labels 네임스페이스로 교체, "전후 사진"은 common 네임스페이스로 교체.
                번역문이 길어 제목이 3줄로 터지면 카드(439px)를 넘기므로 t-2line 으로 두 줄 고정 */}
            <h3 className="t-2line px-3 py-5 text-center text-lead font-bold leading-snug">
                <T ko={b.label} /> {t('beforeAfter')}
            </h3>

            <div className="skeleton relative h-[147px] w-full overflow-hidden">
                <Image
                    src={b.before}
                    alt={t('beforeAltWithLabel', { label: b.label })}
                    fill
                    quality={85}
                    sizes="244px"
                    className="object-cover"
                />
            </div>

            <div className="relative z-10 flex h-0 justify-center">
                <span
                    className={cn(
                        'flex -translate-y-1/2 items-center justify-center rounded-full',
                        overflow ? 'h-[32px] w-[32px] bg-cream/50' : 'h-[34px] w-[34px] bg-cocoa',
                    )}
                >
                    <span
                        aria-hidden
                        className={cn(
                            'mt-[-3px] block rotate-45 border-b-2 border-r-2',
                            overflow ? 'h-3 w-3 border-cocoa!' : 'h-2 w-2 border-cream',
                        )}
                    />
                </span>
            </div>

            <div className="skeleton relative h-[147px] w-full overflow-hidden">
                <Image src={b.after} alt={t('afterAlt')} fill quality={85} sizes="244px" className="object-cover" />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-3 pb-3.5 pt-4">
                <p className="t-1line max-w-full rounded-full bg-cocoa px-4 text-center text-lead font-bold text-cream">
                    <T ko={b.label} />
                </p>
                <span className="notranslate font-display text-caption mt-1 text-cocoa/30">RE:BERRY</span>
            </div>
        </article>
    );
}

// slug 를 받아서 컴포넌트가 직접 Firestore 를 확인 — 서버 페이지(page.tsx)는 slug 문자열만 넘기면 됨
export default function BACardSlider({ slug }: { slug: string }) {
    const t = useTranslations('common');
    const allPhotos = useBAPhotos();
    const loading = useBAPhotosLoading();
    const photos = filterBAPhotosBySlug(allPhotos, slug);

    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(photos.length, CARD_W, GAP);

    if (loading) {
        return (
            <div className="relative mx-auto max-w-[1045px]">
                <div className="flex justify-center gap-[23px] overflow-hidden">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <Skeleton key={i} className="h-[439px] w-[244px] shrink-0 rounded-[10px]" />
                    ))}
                </div>
                <div className="mt-6 flex justify-center gap-2 lg:mt-[58px]">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-1.5 w-1.5 rounded-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (photos.length === 0) return null;

    return (
        <div className="relative mx-auto max-w-[1045px]">
            {/* 메인 BASlider 화살표 그대로 — 배경 없음(border만), 넘길 방향이 있으면 진하게 */}
            {over && (
                <>
                    <button
                        onClick={() => move(-1)}
                        aria-label={t('prev')}
                        className={cn(
                            'absolute -left-16 top-[219px] z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border border-cream bg-transparent transition-all duration-500 hover:scale-105 min-[1240px]:flex min-[1440px]:-left-24',
                            canPrev ? 'opacity-100' : 'opacity-30',
                        )}
                    >
                        <span
                            aria-hidden
                            className="mr-[-3px] block h-3 w-3 rotate-45 border-b-2 border-l-2 border-cream"
                        />
                    </button>
                    <button
                        onClick={() => move(1)}
                        aria-label={t('next')}
                        className={cn(
                            'absolute -right-16 top-[219px] z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border border-cream bg-transparent transition-all duration-500 hover:scale-105 min-[1240px]:flex min-[1440px]:-right-24',
                            canNext ? 'opacity-100' : 'opacity-30',
                        )}
                    >
                        <span
                            aria-hidden
                            className="ml-[-3px] block h-3 w-3 rotate-45 border-r-2 border-t-2 border-cream"
                        />
                    </button>
                </>
            )}

            <div
                ref={ref}
                {...(over ? dragProps : {})}
                onScroll={onScroll}
                className={cn(
                    'flex gap-[23px]',
                    over && 'no-scrollbar snap-x overflow-x-auto scroll-smooth pb-1',
                    // 풀블리드는 창(1045)이 화면에 안 들어가는 반응형 구간에서만 — 1140 이상은 창 안 스크롤(시안: 4개 노출)
                    over && 'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)] min-[1140px]:mr-0 min-[1140px]:pr-0',
                    over && dragClass,
                    !over && 'justify-center',
                )}
            >
                {photos.map((b) => (
                    <Card key={b.id} b={b} overflow={over} />
                ))}
            </div>

            {/* 메인 BASlider 도트 그대로 (다크 섹션 → 크림) */}
            <div className="mt-6 flex justify-center gap-2 lg:mt-[58px]">
                {Array.from({ length: total }).map((_, d) => (
                    <span
                        key={d}
                        className={cn(
                            'h-1.5 w-1.5 rounded-full transition-colors',
                            page === d + 1 ? 'bg-cream' : 'bg-cream/30',
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

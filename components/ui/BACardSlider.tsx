// #COMPONENTS: 시그니처 전후 카드 슬라이더
// #STYLE: 화살표/도트 = 메인 BASlider 것을 그대로 (화살표는 배경색 없음 버전) / 트랙 = 컬럼 방식 풀블리드
// #ISSUE: 넘치면 우측 풀블리드 슬라이드 + 화살표 활성상태(넘길 게 있으면 진해짐), 안 넘치면 중앙
// #ISSUE: 넘칠 때/안 넘칠 때 카드 JSX 가 통째로 복붙돼 있어 한쪽만 고치는 사고가 있었음 → Card 하나로 통합

'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { BAPhoto } from '@/components/lib/ba';
import { useBAPhotos, useBAPhotosLoading, filterBAPhotosBySlug } from '@/components/lib/useBAPhotos';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import Skeleton from '@/components/ui/Skeleton';
import BAPhotoModal from '@/components/ui/BAPhotoModal';
import BAPhotoCard, { BAPhotoCardEmpty, BAPhotoCardSkeleton } from '@/components/ui/BAPhotoCard';

const CARD_W = 320;
const GAP = 20;
const SKELETON_COUNT = 3;

// 카드 모양은 전후사진 페이지와 같은 BAPhotoCard 를 쓰고, 여기서는 슬라이더에 필요한 폭만 정한다
// #ISSUE: 244px 카드에 전·후가 나란히 붙은 합성본을 넣으니 사진 한 장이 110px 남짓이라 너무 작았다.
//         → 카드를 320px 로 키웠다. 4장을 유지하면 창이 1269px 이 돼 화살표가 화면 밖으로 나가므로
//           노출은 3장으로 줄이고 창을 320*3 + 20*2 = 1000px 로 다시 계산했다(기존 1045px 보다 오히려 좁다).
const CARD = 'w-[280px] shrink-0 snap-start md:w-[300px] lg:w-[320px]';
const CARD_SIZES = '(max-width: 768px) 280px, (max-width: 1024px) 300px, 320px';
const TRACK = 'md:max-w-[940px] lg:max-w-[1000px]'; // md 는 카드 300 기준, lg 부터 320 기준

// slug 를 받아서 컴포넌트가 직접 Firestore 를 확인 — 서버 페이지(page.tsx)는 slug 문자열만 넘기면 됨
export default function BACardSlider({
    slug,
    emptyPlaceholder = false,
    emptyLabel,
}: {
    slug: string;
    emptyPlaceholder?: boolean;
    emptyLabel?: string;
}) {
    const t = useTranslations('common');
    const allPhotos = useBAPhotos();
    const loading = useBAPhotosLoading();
    const photos = filterBAPhotosBySlug(allPhotos, slug);
    const showEmpty = !loading && photos.length === 0 && emptyPlaceholder && Boolean(emptyLabel);
    const [selectedPhoto, setSelectedPhoto] = useState<BAPhoto | null>(null);

    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(showEmpty ? 1 : photos.length, CARD_W, GAP);

    if (loading) {
        return (
            <div className={cn('relative mx-auto w-full', TRACK)}>
                <div className="flex justify-center gap-4 overflow-hidden md:gap-5">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <BAPhotoCardSkeleton key={i} className={CARD} />
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

    if (photos.length === 0 && !showEmpty) return null;

    return (
        <div className={cn('relative mx-auto w-full', TRACK)}>
            {/* #ISSUE: 화살표 위치가 옛 카드 높이(438px)의 절반인 top-[219px] 로 박혀 있어 카드 모양을 바꾸면 같이 틀어졌다.
                → 화살표와 트랙을 한 상자로 묶고 세로 가운데(top-1/2)로 잡아 카드 높이와 무관하게 만든다 */}
            <div className="relative">
                {/* 메인 BASlider 화살표 그대로 — 배경 없음(border만), 넘길 방향이 있으면 진하게 */}
                {over && (
                    <>
                        <button
                            onClick={() => move(-1)}
                            aria-label={t('prev')}
                            className={cn(
                                'absolute -left-16 top-1/2 z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border border-cream bg-transparent transition-all duration-500 hover:scale-105 min-[1240px]:flex min-[1440px]:-left-24',
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
                                'absolute -right-16 top-1/2 z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border border-cream bg-transparent transition-all duration-500 hover:scale-105 min-[1240px]:flex min-[1440px]:-right-24',
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
                        'flex gap-4 md:gap-5',
                        over && 'no-scrollbar snap-x overflow-x-auto scroll-smooth pb-1',
                        // 풀블리드는 창(1000)이 화면에 안 들어가는 반응형 구간에서만 — 1080 이상은 창 안 스크롤(3개 노출)
                        over && 'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)] min-[1080px]:mr-0 min-[1080px]:pr-0',
                        over && dragClass,
                        !over && 'justify-center',
                    )}
                >
                    {showEmpty ? (
                        <BAPhotoCardEmpty label={emptyLabel!} className={CARD} />
                    ) : (
                        photos.map((b) => (
                            <BAPhotoCard
                                key={b.id}
                                photo={b}
                                sizes={CARD_SIZES}
                                className={CARD}
                                onSelect={setSelectedPhoto}
                            />
                        ))
                    )}
                </div>
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

            <BAPhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
        </div>
    );
}

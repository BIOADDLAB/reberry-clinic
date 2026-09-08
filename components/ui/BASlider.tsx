'use client';

import Image from 'next/image';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import { useBAPhotos, useBAPhotosLoading, filterMainBAPhotos } from '@/components/lib/useBAPhotos';
import Skeleton from '@/components/ui/Skeleton';
import BAPhotoModal from '@/components/ui/BAPhotoModal';
import BAPhotoCard, { BAPhotoCardSkeleton } from '@/components/ui/BAPhotoCard';
import type { BAPhoto } from '@/components/lib/ba';

interface Props {
    light?: boolean;
}

const SKELETON_COUNT = 3;

// 카드 모양은 전후사진 페이지와 같은 BAPhotoCard 를 쓰고, 여기서는 슬라이더에 필요한 폭만 정한다
const CARD = 'w-[240px] shrink-0 snap-start md:w-[244px]';
const CARD_SIZES = '(max-width: 768px) 240px, 244px';

// #PAGE: 메인페이지 - 전,후 슬라이더
export default function BASlider({ light }: Props) {
    const t = useTranslations('common');
    const allPhotos = useBAPhotos();
    const loading = useBAPhotosLoading();
    const photos = filterMainBAPhotos(allPhotos); // main 숫자 있는 것만, 순서대로
    const [selectedPhoto, setSelectedPhoto] = useState<BAPhoto | null>(null);

    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(photos.length, 244, 20);

    // Firestore 응답 대기 중 — 카드 자리를 스켈레톤으로 잡아둔다 (레이아웃 점프 방지)
    if (loading) {
        return (
            <div className="relative mx-auto w-full px-0 md:max-w-[772px]">
                <div className="no-scrollbar flex justify-center gap-4 overflow-hidden md:gap-5">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <BAPhotoCardSkeleton key={i} className={CARD} />
                    ))}
                </div>
                <div className="mt-6 flex justify-center gap-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-1.5 w-1.5 rounded-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (photos.length === 0) return null;

    return (
        <div className="relative w-full md:max-w-[772px] mx-auto px-0">
            <button
                onClick={() => move(-1)}
                aria-label={t('prev')}
                className={cn(
                    'absolute -left-28 top-1/2 z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-500 hover:scale-105 min-[1040px]:flex',
                    canPrev ? 'opacity-100' : 'opacity-30',
                    light ? 'border-cocoa bg-cream' : 'border-cream/20 bg-deep/40 backdrop-blur-sm',
                )}
            >
                <Image
                    src="/images/i-arr-left-01.svg"
                    alt=""
                    width={14}
                    height={28}
                    className={cn('relative left-[-1px]', light ? 'brightness-0' : 'filter-none')}
                />
            </button>

            <div
                ref={ref}
                {...dragProps}
                onScroll={onScroll}
                className={cn(
                    'no-scrollbar flex snap-x gap-4 overflow-x-auto scroll-smooth md:gap-5',
                    over ? 'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)] md:mr-0 md:pr-0' : 'justify-center',
                    dragClass,
                )}
            >
                {photos.map((p) => (
                    <BAPhotoCard key={p.id} photo={p} sizes={CARD_SIZES} className={CARD} onSelect={setSelectedPhoto} />
                ))}
            </div>

            <button
                onClick={() => move(1)}
                aria-label={t('next')}
                className={cn(
                    'absolute -right-28 top-1/2 z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-500 hover:scale-105 min-[1040px]:flex',
                    canNext ? 'opacity-100' : 'opacity-30',
                    light ? 'border-cocoa bg-cream' : 'border-cream bg-deep/40 backdrop-blur-sm',
                )}
            >
                <Image
                    src="/images/i-arr-left-01.svg"
                    alt=""
                    width={14}
                    height={28}
                    className={cn('-scale-x-100 relative right-[-1px]', light ? 'brightness-0' : 'filter-none')}
                />
            </button>

            <div className="mt-6 flex justify-center gap-2">
                {Array.from({ length: total }).map((_, d) => (
                    <span
                        key={d}
                        className={cn(
                            'h-1.5 w-1.5 rounded-full transition-colors',
                            page === d + 1 ? (light ? 'bg-cocoa' : 'bg-cream') : light ? 'bg-cocoa/25' : 'bg-cream/30',
                        )}
                    />
                ))}
            </div>

            <BAPhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
        </div>
    );
}

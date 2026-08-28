'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import { useBAPhotos, useBAPhotosLoading, filterMainBAPhotos } from '@/components/lib/useBAPhotos';
import T from '@/components/lang/T';
import Skeleton from '@/components/ui/Skeleton';
import { resolveBALabel } from '@/components/lib/ba';

interface Props {
    light?: boolean;
}

const SKELETON_COUNT = 3;

// #PAGE: 메인페이지 - 전,후 슬라이더
export default function BASlider({ light }: Props) {
    const t = useTranslations('common');
    const allPhotos = useBAPhotos();
    const loading = useBAPhotosLoading();
    const photos = filterMainBAPhotos(allPhotos); // main 숫자 있는 것만, 순서대로

    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(photos.length, 244, 20);

    // Firestore 응답 대기 중 — 카드 자리를 스켈레톤으로 잡아둔다 (레이아웃 점프 방지)
    if (loading) {
        return (
            <div className="relative mx-auto w-full px-0 md:max-w-[772px]">
                <div className="no-scrollbar flex justify-center gap-4 overflow-hidden md:gap-5">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <Skeleton key={i} className="h-[420px] w-[240px] shrink-0 rounded-[10px] md:w-[244px]" />
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
                {photos.map((p) => {
                    const label = resolveBALabel(p);
                    return (
                    <article
                        key={p.id}
                        className="t-tight w-[240px] rounded-[10px] shrink-0 snap-start bg-deep text-center text-cream md:w-[244px]"
                    >
                        {/* #ISSUE: 시술명(p.label)은 구글 번역이 오역해서 notranslate 로 막아뒀는데,
                            그 탓에 번역 모드에서 한국어로 남아 있었다 → 사전(dict.ts) 기반 <T /> 로 교체.
                            #ISSUE: "시술명 전후 사진" 한 줄로 흘리니 이름 길이에 따라 1~2줄로 갈려
                                    카드마다 사진 시작 위치가 어긋났다 → 시술명 / 전후 사진 두 덩이로 쪼개고
                                    헤더를 3줄 높이(min-h-[3lh])로 고정해 모든 카드의 헤더 높이를 맞춘다.
                                    시술명은 line-clamp-2 로 최대 두 줄, break-keep 으로 한글 단어 중간 끊김 방지 */}
                        <p className="flex min-h-[3lh] flex-col justify-center px-3 py-2.5 text-lead font-bold leading-snug lg:pt-[26px] lg:pb-[23px]">
                            <span className="line-clamp-2 break-keep">
                                <T ko={label} />
                            </span>
                            <span>{t('beforeAfter')}</span>
                        </p>
                        <div className="relative">
                            <div className="skeleton skeleton-dark relative aspect-[8/5] overflow-hidden">
                                <Image
                                    src={p.before}
                                    alt={t('beforeAlt')}
                                    fill
                                    quality={85}
                                    sizes="(max-width: 768px) 240px, 244px"
                                    className="object-cover"
                                />
                            </div>

                            <div className="skeleton skeleton-dark relative aspect-[8/5]">
                                <Image
                                    src={p.after}
                                    alt={t('afterAlt')}
                                    fill
                                    quality={85}
                                    sizes="(max-width: 768px) 240px, 244px"
                                    className="pointer-events-none object-cover"
                                />
                            </div>
                            <Image
                                src="/images/i-arr-down-01.svg"
                                alt=""
                                width={30}
                                height={30}
                                className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2"
                                aria-hidden
                            />
                        </div>
                        <p className="mx-auto mt-4.25 line-clamp-2 w-fit max-w-[88%] min-w-[100px] rounded-[16px] border border-cream bg-cream px-3 py-0.5 text-small font-bold leading-snug text-cocoa">
                            <T ko={label} />
                        </p>
                        <p className="notranslate font-display text-caption-sm mb-[15px] mt-1 text-[11px] tracking-[0.2em] text-cream">
                            RE:BERRY
                        </p>
                    </article>
                    );
                })}
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
        </div>
    );
}

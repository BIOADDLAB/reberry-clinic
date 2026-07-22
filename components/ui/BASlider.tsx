'use client';

import Image from 'next/image';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import { getMainBAPhotos } from '@/components/lib/ba';

interface Props {
    light?: boolean;
}

// #PAGE: 메인페이지 - 전,후 슬라이더
export default function BASlider({ light }: Props) {
    // 넘침 계산 + 화살표 활성 상태 + 진행 도트 — 공통 훅
    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(getMainBAPhotos().length, 244, 20);

    // #ISSUE: slugs prop 방식 제거 → ba.ts의 main 숫자 필드 기준으로 정렬된 목록 사용
    const photos = getMainBAPhotos();

    if (photos.length === 0) return null;

    return (
        <div className="relative w-full md:max-w-[772px] mx-auto px-0">
            <button
                onClick={() => move(-1)}
                aria-label="이전"
                className={cn(
                    'absolute -left-28 top-1/2 z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-500 hover:scale-105 min-[1040px]:flex',
                    canPrev ? 'opacity-100' : 'opacity-30',
                    light ? 'border-cocoa bg-cream' : 'border-cream/20 bg-deep/40 backdrop-blur-sm',
                )}
            >
                <Image
                    src="/images/i-arr-left-01.svg"
                    alt="이전"
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
                    <article
                        key={p.id}
                        className="w-[240px] rounded-[10px] shrink-0 snap-start bg-deep text-center text-cream md:w-[244px]"
                    >
                        <p className="py-2.5 text-lead font-bold lg:pt-[26px] lg:pb-[23px]">{p.label} 전후 사진</p>
                        <div className="relative">
                            {/* #ISSUE: 의료법 대응 - 가림 처리를 After에서 Before(시술 전) 영역으로 이동 */}
                            <div className="relative aspect-[8/5] overflow-hidden">
                                <Image
                                    src={p.before}
                                    alt="시술 전"
                                    fill
                                    quality={85}
                                    sizes="(max-width: 768px) 240px, 244px"
                                    className="scale-110 object-cover blur-[6px]"
                                />
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="rounded-full border border-cream/70 bg-deep/40 px-3 py-1 text-[11px] backdrop-blur-sm text-caption">
                                        로그인
                                    </span>
                                </span>
                            </div>

                            <div className="relative aspect-[8/5]">
                                <Image
                                    src={p.after}
                                    alt="시술 후"
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
                        <p className="mt-4.25 inline-block rounded-full border border-cream leading-6.75! bg-cream w-[100px] px-1 text-cocoa font-bold text-lead">
                            {p.label}
                        </p>
                        <p className="font-display text-caption-sm mb-[15px] mt-1 text-[11px] tracking-[0.2em] text-cream">
                            RE:BERRY
                        </p>
                    </article>
                ))}
            </div>

            <button
                onClick={() => move(1)}
                aria-label="다음"
                className={cn(
                    'absolute -right-28 top-1/2 z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border transition-all duration-500 hover:scale-105 min-[1040px]:flex',
                    canNext ? 'opacity-100' : 'opacity-30',
                    light ? 'border-cocoa bg-cream' : 'border-cream bg-deep/40 backdrop-blur-sm',
                )}
            >
                <Image
                    src="/images/i-arr-left-01.svg"
                    alt="다음"
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

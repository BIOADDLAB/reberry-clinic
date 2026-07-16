// #LINK: /components/ui/SolutionSlider.tsx
// #STYLE: 카드 호버 시 이미지 확대 효과(group-hover:scale-105) 및 트랜지션 추가
// #ISSUE: 카드 hover 시 비주얼 피드백이 심심하던 부분을 트렌디한 줌인 모션으로 개선

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRef } from 'react';
import { getSolutionsBySlugs } from '@/components/lib/solutions';
import { cn } from '@/components/lib/cn';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

interface Props {
    slugs: string[];
    baseHref: string;
    className?: string;
}

export default function SolutionSlider({ slugs, baseHref, className }: Props) {
    const list = getSolutionsBySlugs(slugs);
    const isSlider = list.length > 5;

    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    if (list.length === 0) return null;

    return (
        <div className={cn('relative', className)}>
            {isSlider && (
                <>
                    <button
                        ref={prevRef}
                        aria-label="이전"
                        className="absolute -left-2 top-[30%] z-20 hidden transition-transform duration-500 hover:scale-105 md:block lg:-left-16 min-[1170px]:-left-6"
                    >
                        <Image src="/images/i-arr-left-01.png" alt="" width={44} height={44} />
                    </button>
                    <button
                        ref={nextRef}
                        aria-label="다음"
                        className="absolute -right-2 top-[30%] z-20 hidden transition-transform duration-500 hover:scale-105 md:block lg:-right-16 min-[1170px]:-right-6"
                    >
                        <Image src="/images/i-arr-left-01.png" alt="" width={44} height={44} className="-scale-x-100" />
                    </button>
                </>
            )}

            <Swiper
                modules={[Navigation]}
                slidesPerView="auto"
                spaceBetween={16}
                breakpoints={{
                    768: {
                        spaceBetween: 24,
                    },
                }}
                onInit={(swiper: SwiperType) => {
                    if (typeof swiper.params.navigation !== 'boolean' && swiper.params.navigation) {
                        swiper.params.navigation.prevEl = prevRef.current;
                        swiper.params.navigation.nextEl = nextRef.current;
                        swiper.navigation.init();
                        swiper.navigation.update();
                    }
                }}
                className={cn('!overflow-visible', !isSlider && '[&>.swiper-wrapper]:lg:justify-center')}
            >
                {list.map((item) => (
                    <SwiperSlide key={item.slug} className="!w-auto !h-auto flex">
                        <article className="group flex h-full w-[240px] shrink-0 flex-col overflow-hidden rounded-[15px] bg-cream ring-1 ring-cocoa/10 md:w-[262px]">
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
                            <div className="flex flex-1 flex-col bg-sand px-4 pb-8 pt-6.5">
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
                                    <span className="rounded-full bg-latte px-2.5 font-bold text-cream text-small">
                                        POINT
                                    </span>
                                    {item.point}
                                </p>
                            </div>
                        </article>
                    </SwiperSlide>
                ))}
            </Swiper>
        </div>
    );
}

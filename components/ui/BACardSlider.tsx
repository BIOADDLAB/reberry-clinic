'use client';

import Image from 'next/image';
import { useRef } from 'react';
import { baPhotos, type BAPhoto } from '@/components/lib/ba';
import { cn } from '@/components/lib/cn';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

const VISIBLE = 4;

interface Props {
    photos?: BAPhoto[];
}

// #PAGE: 시그니처 페이지에서 쓰는 전,후 슬라이더
export default function BACardSlider({ photos = baPhotos }: Props) {
    const isSlider = photos.length > VISIBLE;

    const prevRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);

    if (photos.length === 0) return null;

    return (
        <div className="relative mx-auto max-w-[1045px]">
            {isSlider && (
                <>
                    <button
                        ref={prevRef}
                        aria-label="이전"
                        className="absolute top-[194px] z-10 hidden h-[52px] w-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-cream text-cocoa transition-transform hover:scale-105 xl:-left-[92px] xl:flex"
                    >
                        <span aria-hidden className="text-xl leading-none">
                            ←
                        </span>
                    </button>
                    <button
                        ref={nextRef}
                        aria-label="다음"
                        className="absolute top-[194px] z-10 hidden h-[52px] w-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-cream text-cocoa transition-transform hover:scale-105 xl:-right-[92px] xl:flex"
                    >
                        <span aria-hidden className="text-xl leading-none">
                            →
                        </span>
                    </button>
                </>
            )}

            <div className="overflow-hidden">
                <Swiper
                    modules={[Navigation]}
                    slidesPerView="auto"
                    spaceBetween={23}
                    onInit={(swiper: SwiperType) => {
                        if (typeof swiper.params.navigation !== 'boolean' && swiper.params.navigation) {
                            swiper.params.navigation.prevEl = prevRef.current;
                            swiper.params.navigation.nextEl = nextRef.current;
                            swiper.navigation.init();
                            swiper.navigation.update();
                        }
                    }}
                    className={cn('-mx-6 px-6 md:mx-0 md:px-0', !isSlider && '[&>.swiper-wrapper]:lg:justify-center')}
                >
                    {photos.map((b) => (
                        <SwiperSlide key={b.id} className="!w-[70%] !h-auto sm:!w-[38%] md:!w-[244px]">
                            <article className="flex h-[439px] w-full flex-col rounded-[10px] bg-cream text-cocoa">
                                <h3 className="notranslate py-5 text-center text-lead font-bold leading-none">
                                    {b.label} 전후 사진
                                </h3>

                                <div className="relative h-[147px] w-full overflow-hidden">
                                    <Image
                                        src={b.before}
                                        alt={`${b.label}시술 전`}
                                        fill
                                        quality={85}
                                        sizes="244px"
                                        className="scale-110 object-cover blur-[6px]"
                                    />
                                    <span className="absolute inset-0 flex items-center justify-center">
                                        <span className="rounded-full bg-deep/70 px-3.5 py-1.5 text-caption-sm text-cream">
                                            로그인
                                        </span>
                                    </span>
                                </div>

                                <div className="relative z-10 flex h-0 justify-center">
                                    <Image
                                        src="/images/i-arr-down-01.png"
                                        alt=""
                                        width={34}
                                        height={34}
                                        className="-translate-y-1/2"
                                    />
                                </div>

                                <div className="relative h-[147px] w-full overflow-hidden">
                                    <Image
                                        src={b.after}
                                        alt="시술 후"
                                        fill
                                        quality={85}
                                        sizes="244px"
                                        className="object-cover"
                                    />
                                </div>

                                <div className="flex flex-col flex-1 items-center justify-center pb-3.5 pt-4">
                                    <p className="rounded-full bg-cocoa px-4 text-lead font-bold text-cream">
                                        {b.label}
                                    </p>
                                    <span className="font-display text-caption mt-1 text-cocoa/30">RE:BERRY</span>
                                </div>
                            </article>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>
        </div>
    );
}

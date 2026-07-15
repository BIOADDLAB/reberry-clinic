'use client';

import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useRef, useState } from 'react';
import type { Swiper as SwiperType } from 'swiper';
import 'swiper/css';

// #TODO: 맞는 인테리어 사진들로 변경 & 보내주는 사진 보고 배열 변경
const images = [1, 2, 3, 4, 5, 6].map((n) => `/images/bg-tour-${String(n).padStart(2, '0')}.jpg`);

export default function TourSwiper() {
    const swiperRef = useRef<SwiperType | null>(null);
    const [i, setI] = useState(0);

    return (
        <section className="relative">
            <Swiper
                modules={[Navigation]}
                loop
                onSwiper={(s) => (swiperRef.current = s)}
                onSlideChange={(s) => setI(s.realIndex)}
                className="h-[60vh] min-h-[400px] w-full md:min-h-0 md:h-[43.125vw]"
            >
                {images.map((src, k) => (
                    <SwiperSlide key={src} className="h-full">
                        <div className="relative h-full w-full">
                            <Image
                                src={src}
                                alt={`리베리의원 공간 ${k + 1}`}
                                fill
                                quality={85}
                                sizes="100vw"
                                className="pointer-events-none object-cover"
                                priority={k === 0}
                            />
                        </div>
                    </SwiperSlide>
                ))}
            </Swiper>

            {/* 모바일 텍스트 가독성을 위해 모바일에서만 그라데이션 농도를 살짝 높임 */}
            <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-deep/40 via-transparent to-transparent md:from-deep/15" />

            <div className="absolute inset-x-0 bottom-6 z-10 border-y border-cream/50 text-cream md:bottom-18">
                <div className="container-site flex items-center justify-between py-3 px-5! md:py-4 md:px-10!">
                    <p className="font-display text-[18px] md:text-[30px]">RE:BERRY Mood</p>
                    <div className="notranslate flex items-center gap-4 md:gap-6.5">
                        <div className="flex gap-2 md:gap-2">
                            <button
                                onClick={() => swiperRef.current?.slidePrev()}
                                aria-label="이전"
                                className="flex items-center justify-center p-1 transition-opacity duration-500 hover:opacity-60 md:p-0"
                            >
                                <img
                                    src="/images/i-arr-left-03.svg"
                                    alt="이전"
                                    className="h-3.5 w-3.5 md:h-4 md:w-4 object-contain"
                                />
                            </button>
                            <button
                                onClick={() => swiperRef.current?.slideNext()}
                                aria-label="다음"
                                className="flex items-center justify-center p-1 transition-opacity duration-500 hover:opacity-60 md:p-0"
                            >
                                <img
                                    src="/images/i-arr-left-03.svg"
                                    alt="다음"
                                    className="h-3.5 w-3.5 md:h-4 md:w-4 rotate-180 object-contain"
                                />
                            </button>
                        </div>
                        <span className="font-display text-sm md:text-lead tracking-[0.3em]">
                            {i + 1} / {images.length}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

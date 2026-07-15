'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import 'swiper/css';

interface EventItem {
    image: string;
    title: string;
}

export default function EventModal({ events }: { events: EventItem[] }) {
    const [active, setActive] = useState<EventItem | null>(null);

    return (
        <>
            <div className="mx-auto mt-12 max-w-5xl lg:mt-16">
                <Swiper
                    modules={[Navigation]}
                    slidesPerView={1}
                    spaceBetween={24}
                    breakpoints={{
                        640: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 },
                    }}
                    navigation={{ prevEl: '.event-prev', nextEl: '.event-next' }}
                >
                    {events.map((e, i) => (
                        <SwiperSlide key={`${e.title}-${i}`}>
                            <button
                                type="button"
                                onClick={() => setActive(e)}
                                className="group relative block aspect-[7/10] w-full overflow-hidden shadow-sm"
                            >
                                <Image
                                    src={e.image}
                                    alt={e.title}
                                    fill
                                    quality={88}
                                    sizes="(max-width: 768px) 100vw, 360px"
                                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                />
                            </button>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <div className="mt-12.5 flex items-center justify-center gap-4">
                <button
                    type="button"
                    aria-label="이전"
                    className="event-prev flex h-10 w-10 items-center justify-center rounded-full border border-cocoa/30"
                >
                    <Image src="/images/i-arr-left-01.svg" alt="" width={11} height={24} className="mr-1" />
                </button>
                <button
                    type="button"
                    aria-label="다음"
                    className="event-next flex h-10 w-10 items-center justify-center rounded-full border border-cocoa/30"
                >
                    <Image src="/images/i-arr-left-01.svg" alt="" width={11} height={24} className="rotate-180 ml-1" />
                </button>
            </div>

            {active && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-deep/80 p-6"
                    onClick={() => setActive(null)}
                >
                    <div className="relative aspect-[7/10] w-full max-w-md" onClick={(e) => e.stopPropagation()}>
                        <button
                            type="button"
                            aria-label="닫기"
                            onClick={() => setActive(null)}
                            className="absolute -top-10 right-0 text-3xl text-cream"
                        >
                            ×
                        </button>
                        <Image src={active.image} alt={active.title} fill quality={90} className="object-contain" />
                    </div>
                </div>
            )}
        </>
    );
}

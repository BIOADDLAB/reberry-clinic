'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation } from 'swiper/modules';
import { useTranslations } from 'next-intl';
import 'swiper/css';

interface EventItem {
    image: string;
    title: string;
}

export default function EventModal({ events }: { events: EventItem[] }) {
    const [active, setActive] = useState<EventItem | null>(null);
    const t = useTranslations('common');

    // 모달이 떠 있는 동안 뒤 배경 스크롤 잠금 + ESC 로 닫기 (BAPhotoModal 과 같은 방식)
    useEffect(() => {
        if (!active) return;
        const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && setActive(null);
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [active]);

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
                    aria-label={t('prev')}
                    className="event-prev flex h-10 w-10 items-center justify-center rounded-full border border-cocoa/30"
                >
                    <Image src="/images/i-arr-left-01.svg" alt="" width={11} height={24} className="mr-1" />
                </button>
                <button
                    type="button"
                    aria-label={t('next')}
                    className="event-next flex h-10 w-10 items-center justify-center rounded-full border border-cocoa/30"
                >
                    <Image src="/images/i-arr-left-01.svg" alt="" width={11} height={24} className="rotate-180 ml-1" />
                </button>
            </div>

            {/* ── 상세 모달 : A4(210×297) 비율 · 최대 794px(A4 96dpi 가로폭)
                #ISSUE: 화면이 짧으면 세로로 길어져 잘리던 것을 오버레이 자체를 스크롤시켜 해결.
                        모바일은 좌우 여백만 남기고 화면 폭을 꽉 채운다(비율은 그대로 A4). */}
            {active && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={active.title}
                    className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-deep/80"
                    onClick={() => setActive(null)}
                >
                    <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:p-8">
                        <div
                            className="relative w-full max-w-[794px]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="skeleton relative aspect-[210/297] w-full overflow-hidden rounded-[4px] bg-cream">
                                <Image
                                    src={active.image}
                                    alt={active.title}
                                    fill
                                    quality={90}
                                    sizes="(max-width: 860px) 100vw, 794px"
                                    className="object-contain"
                                />
                            </div>
                        </div>
                    </div>

                    {/* 세로로 길어져 스크롤이 생겨도 닫기 버튼은 항상 같은 자리에 있어야 한다 → fixed */}
                    <button
                        type="button"
                        aria-label={t('close')}
                        onClick={() => setActive(null)}
                        className="fixed right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-cocoa/80 text-2xl leading-none text-cream transition-colors hover:bg-cocoa sm:right-6 sm:top-6"
                    >
                        <span aria-hidden>×</span>
                    </button>
                </div>
            )}
        </>
    );
}

/* 이벤트 포스터 슬라이드 + 크게 보기 창.
   관리자에서 올린 포스터를 가로로 넘겨 보고, 누르면 A4 비율로 크게 뜬다.

   #ISSUE: 포스터가 1~2장일 때 왼쪽으로 쏠려 붙었다 (한 화면에 3장 기준이라 빈자리가 오른쪽에 남음)
           → centerInsufficientSlides 로 모자랄 때는 가운데로 모은다.
   #ISSUE: 마지막 장에서 더 안 넘어가 끝인지 고장인지 알기 어려웠다 → rewind 로 첫 장으로 이어 돈다.
           loop 도 써 봤지만 breakpoints 로 slidesPerView 가 바뀌는 구성에서는 Swiper 가 슬라이드를
           재배치하지 않아(loopedSlides 만 계산되고 loopFix 가 안 돎) 마지막 장에서 그냥 멈췄다.
           rewind 는 슬라이드를 건드리지 않아 이 구성에서도 확실히 돈다.
   #ISSUE: 아래 점을 포스터 장수만큼 찍었더니 PC 에서 4장 중 3장이 한 화면에 보이는데도 점이 4개였다.
           넘길 수 있는 자리는 2칸뿐이라 뒤쪽 점 두 개는 눌러도 아무 일이 없었다.
           → 점 개수는 Swiper 가 계산한 "멈출 자리" 수(snapGrid)를 그대로 쓴다.
             그래서 휴대폰(1장씩)에서는 4개, PC(3장씩)에서는 2개로 화면에 맞게 달라진다. */

'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Swiper as SwiperType } from 'swiper';
import { useTranslations } from 'next-intl';
import 'swiper/css';

export interface PosterItem {
    image: string;
    title: string;
}

export default function EventModal({ events }: { events: PosterItem[] }) {
    const [active, setActive] = useState<PosterItem | null>(null);
    const [swiper, setSwiper] = useState<SwiperType | null>(null);
    /* 지금 몇 번째 자리에 멈춰 있는지 / 멈출 자리가 몇 곳인지 (= 아래 점 개수) */
    const [at, setAt] = useState(0);
    const [stops, setStops] = useState(0);
    /* 슬라이드가 화면에 다 들어오면 Swiper 가 스스로 잠근다(isLocked) → 화살표·점을 감춘다 */
    const [locked, setLocked] = useState(true);
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

    const sync = (instance: SwiperType) => {
        setAt(instance.snapIndex);
        setStops(instance.snapGrid.length);
        setLocked(instance.isLocked);
    };

    /* rewind 라서 처음·끝에서도 막히지 않는다 → 화살표를 흐리게 만들 일이 없다 */
    const showNav = !locked && stops > 1;

    return (
        <>
            <div className="relative mx-auto mt-12 max-w-5xl lg:mt-16">
                <Swiper
                    onSwiper={(instance) => {
                        setSwiper(instance);
                        sync(instance);
                    }}
                    onSlideChange={sync}
                    onResize={sync}
                    /* 화면 폭이 바뀌면 한 번에 보이는 장수가 달라져 멈출 자리 수도 달라진다 */
                    onBreakpoint={sync}
                    onSnapGridLengthChange={sync}
                    onLock={() => setLocked(true)}
                    onUnlock={() => setLocked(false)}
                    /* 마지막 다음은 첫 장, 첫 장 이전은 마지막 장 */
                    rewind
                    grabCursor
                    /* 1~2장이면 남는 자리를 양쪽으로 나눠 가운데에 모은다 */
                    centerInsufficientSlides
                    slidesPerView={1}
                    spaceBetween={24}
                    breakpoints={{
                        640: { slidesPerView: 2 },
                        1024: { slidesPerView: 3 },
                    }}
                >
                    {events.map((e, i) => (
                        <SwiperSlide key={`${e.title}-${i}`}>
                            <figure>
                                <button
                                    type="button"
                                    onClick={() => setActive(e)}
                                    className="group relative block aspect-[7/10] w-full overflow-hidden rounded-[4px] shadow-sm"
                                >
                                    <Image
                                        src={e.image}
                                        /* 캡션은 비워 둘 수 있다 → 대체글까지 비면 사진을 못 보는
                                           사람에게 아무 설명이 없다. 그럴 때만 일반 이름을 쓴다 */
                                        alt={e.title || t('eventPoster')}
                                        fill
                                        quality={88}
                                        sizes="(max-width: 768px) 100vw, 360px"
                                        className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                                    />
                                    {/* 마우스를 올리면 "눌러서 크게 볼 수 있다" 를 알려 준다.
                                        휴대폰에는 마우스가 없으니 제목은 아래에 따로 적는다. */}
                                    <span className="pointer-events-none absolute inset-0 hidden items-center justify-center bg-deep/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
                                        <span className="rounded-full border border-cream/70 px-4 py-2 text-caption font-semibold text-cream">
                                            {t('viewLarger')}
                                        </span>
                                    </span>
                                </button>
                                {e.title && (
                                    <figcaption className="mt-3 text-center text-caption font-semibold leading-6 text-cocoa md:text-small">
                                        {e.title}
                                    </figcaption>
                                )}
                            </figure>
                        </SwiperSlide>
                    ))}
                </Swiper>

                {/* 포스터 좌우에 얹는 화살표. 좁은 화면에서는 감추고 끌어서 넘기게 한다 */}
                {showNav && (
                    <>
                        <SideArrow dir="prev" label={t('prev')} onClick={() => swiper?.slidePrev()} />
                        <SideArrow dir="next" label={t('next')} onClick={() => swiper?.slideNext()} />
                    </>
                )}
            </div>

            {showNav && <Dots count={stops} current={at} onPick={(to) => swiper?.slideTo(to)} className="mt-8" />}

            {/* ── 상세 모달 : A4(210×297) 비율 · 최대 794px(A4 96dpi 가로폭)
                #ISSUE: 화면이 짧으면 세로로 길어져 잘리던 것을 오버레이 자체를 스크롤시켜 해결.
                        모바일은 좌우 여백만 남기고 화면 폭을 꽉 채운다(비율은 그대로 A4). */}
            {active && (
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label={active.title || t('eventPoster')}
                    className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-deep/80"
                    onClick={() => setActive(null)}
                >
                    {/* #ISSUE: items-center 로 가운데 정렬하면 내용이 화면보다 길 때 위쪽이 잘려서 스크롤로도 못 본다.
                        → 자식에 m-auto 를 주면 들어갈 땐 정가운데, 넘칠 땐 auto 여백이 0 이 되어 정상 스크롤된다 */}
                    <div className="flex min-h-full justify-center p-4 sm:p-8">
                        <div className="relative m-auto w-full max-w-[794px]" onClick={(e) => e.stopPropagation()}>
                            <div className="skeleton relative aspect-[210/297] w-full overflow-hidden rounded-[4px] bg-cream">
                                <Image
                                    src={active.image}
                                    alt={active.title || t('eventPoster')}
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

/** 포스터 좌우에 얹는 화살표. 좁은 화면에서는 포스터를 가리니 숨기고 끌어서 넘기게 한다 */
function SideArrow({
    dir,
    label,
    onClick,
}: {
    dir: 'prev' | 'next';
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            onClick={onClick}
            className={`absolute top-1/2 z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-cream/85 text-cocoa shadow-[0_6px_20px_rgba(69,54,45,0.18)] backdrop-blur transition hover:bg-cream md:flex ${
                dir === 'prev' ? '-left-5 lg:-left-7' : '-right-5 lg:-right-7'
            }`}
        >
            <Chevron dir={dir} />
        </button>
    );
}

function Chevron({ dir }: { dir: 'prev' | 'next' }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" aria-hidden className="h-4 w-4">
            <path
                d={dir === 'prev' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'}
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

/** 지금 어디쯤 보고 있는지 알려 주는 점. 눌러서 그 자리로 바로 간다.
    count 는 포스터 장수가 아니라 "멈출 자리" 수다 — 한 화면에 여러 장 보이면 그만큼 줄어든다. */
function Dots({
    count,
    current,
    onPick,
    className = '',
}: {
    count: number;
    current: number;
    onPick: (to: number) => void;
    className?: string;
}) {
    return (
        <div className={`flex items-center justify-center gap-2 ${className}`}>
            {Array.from({ length: count }, (_, i) => (
                <button
                    key={i}
                    type="button"
                    aria-label={`${i + 1}번째 자리로 이동`}
                    aria-current={i === current ? 'true' : undefined}
                    onClick={() => onPick(i)}
                    className={`h-2 rounded-full transition-all ${
                        i === current ? 'w-6 bg-cocoa' : 'w-2 bg-cocoa/25 hover:bg-cocoa/45'
                    }`}
                />
            ))}
        </div>
    );
}

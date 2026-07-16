'use client';

import { useState } from 'react';
import Image from 'next/image';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';
import Reveal from '@/components/motion/Reveal';

const results = [1, 2, 3, 4, 1, 2, 3, 4].map((n, i) => ({
    id: i,
    before: `/images/img-be-0${n}.jpg`,
    after: `/images/img-af-0${n}.jpg`,
}));


// #TODO: 메타데이터 넣기 + 모바일 반응형 작업
export default function ReviewsPage() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <>
            <SubHero en="Before &amp; After" image="/images/bg-sub-06.jpg" />

            <section className="relative py-20 lg:py-37.5">
                <Image
                    src="/images/bg-texture-06.jpg"
                    alt=""
                    fill
                    priority
                    quality={88}
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="container-site relative">
                    <Reveal className="text-center">
                        <h2 className="font-display text-h2 tracking-[0.06em]">Before &amp; After</h2>
                    </Reveal>

                    <RevealGroup className="mt-12 grid grid-cols-2 gap-4 md:gap-6 lg:mt-21 lg:grid-cols-4">
                        {results.map((r) => (
                            <RevealItem key={r.id} className="bg-sand p-2.5 rounded-[4px] shadow-sm">
                                <div className="grid grid-cols-2 gap-1">
                                    <div className="relative aspect-[4/3]">
                                        <Image
                                            src={r.before}
                                            alt="시술 전"
                                            fill
                                            quality={85}
                                            sizes="(max-width: 768px) 160px, 220px"
                                            className="object-cover"
                                        />
                                    </div>
                                    <div className="relative aspect-[4/3] overflow-hidden">
                                        <Image
                                            src={r.after}
                                            alt="시술 후 (로그인 후 공개)"
                                            fill
                                            quality={85}
                                            sizes="(max-width: 768px) 160px, 220px"
                                            className="scale-110 object-cover blur-[7px]"
                                        />
                                        {/* #TODO: 로그인 버튼 클릭시 모달 열리게 연결 해야함 */}
                                        <button className="absolute inset-0 flex items-center justify-center bg-deep/5 transition-colors hover:bg-deep/15">
                                            <span className="rounded-[2px] bg-cream px-3 py-1 text-[11px] font-bold text-cocoa shadow-sm transition-transform hover:scale-105">
                                                로그인
                                            </span>
                                        </button>
                                    </div>
                                </div>
                                <p className="font-display flex items-center justify-center gap-6 pt-3 text-lead text-cream/90">
                                    Before <span aria-hidden>→</span> After
                                </p>
                                <p className="font-display text-center text-small tracking-[0.2em] text-cream/40">
                                    RE:BERRY
                                </p>
                            </RevealItem>
                        ))}
                    </RevealGroup>

                    <Reveal className="mt-21 flex items-center justify-center gap-6">
                        <button
                            className="text-cocoa/60 mt-1 hover:text-cocoa transition-colors"
                            aria-label="이전 페이지"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <span className="font-display text-lead tracking-[0.15em] text-cocoa">1 / 15</span>
                        <button
                            className="text-cocoa/60 mt-1 hover:text-cocoa transition-colors"
                            aria-label="다음 페이지"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </Reveal>
                </div>
            </section>

            <LocationSection />
        </>
    );
}

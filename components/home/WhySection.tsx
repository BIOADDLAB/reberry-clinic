'use client';

import Image from 'next/image';
import { useRef, useState } from 'react';
import { AnimatePresence, motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { EASE } from '@/components/lib/motion';
import { cn } from '@/components/lib/cn';

const slides: string[][] = [
    [
        '책임감있는 원장 1:1 지정제',
        '“상담”이 아닌 “진료”',
        '라이프비즈 AI 기반 3D분석\n카메라로 객관적인 얼굴형 진단',
        '오직 리베리에서만, 과학적인\n피부타입 분류체계를 통한 진료',
    ],
    ['정품·정량 원칙의 투명한 시술', '시술 전 과정, 원장이 직접', '진단 데이터로 이어지는\n체계적인 사후 관리'],
];

export default function WhySection() {
    const ref = useRef<HTMLElement>(null);
    const [slide, setSlide] = useState(0);

    const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

    useMotionValueEvent(scrollYProgress, 'change', (v) => {
        setSlide((prev) => {
            if (prev === 0 && v > 0.55) return 1;
            if (prev === 1 && v < 0.45) return 0;
            return prev;
        });
    });

    return (
        <section ref={ref} className="relative bg-sand h-[200svh]">
            <div className="sticky top-[100px] container-site flex flex-col h-[calc(100svh-100px)] lg:grid lg:grid-cols-[1fr_1.6fr]">
                {/* 타이틀 영역 */}
                <div className="flex shrink-0 items-center justify-center py-8 lg:py-0">
                    <h2 className="font-display text-center text-h2 leading-10 lg:leading-12">
                        WHY
                        <br />
                        RE:BERRY
                    </h2>
                </div>

                {/* 콘텐츠 영역 */}
                <div className="relative flex flex-1 items-center overflow-hidden -mx-6 rounded-t-[40px] px-6 py-12 lg:mx-0 lg:-mr-6 lg:rounded-none lg:rounded-l-[24px] lg:px-35 min-[1560px]:mr-0 min-[1560px]:rounded-2xl">
                    <Image
                        src="/images/bg-texture-02.jpg"
                        alt=""
                        fill
                        quality={88}
                        sizes="(max-width: 1024px) 100vw, 800px"
                        className="object-cover"
                    />

                    <div className="relative w-full">
                        <AnimatePresence mode="wait">
                            <motion.ul
                                key={slide}
                                initial={{ opacity: 0, y: 32 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -32 }}
                                transition={{ duration: 0.4, ease: EASE }}
                                className="relative w-full space-y-6 sm:space-y-7 lg:space-y-10"
                            >
                                {slides[slide].map((text, i) => {
                                    const no = slide === 0 ? i + 1 : i + 5;
                                    return (
                                        <li key={text} className="flex items-center gap-5 lg:gap-13.75">
                                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-cream p-1 lg:h-13.5 lg:w-13.5 lg:p-1.5">
                                                <span className="flex h-full w-full items-center justify-center rounded-full bg-cream text-center font-display leading-none text-medium lg:text-lead">
                                                    {String(no).padStart(2, '0')}
                                                </span>
                                            </span>
                                            <p className="whitespace-pre-line font-semibold text-medium lg:text-lead">
                                                {text}
                                            </p>
                                        </li>
                                    );
                                })}
                            </motion.ul>
                        </AnimatePresence>
                    </div>

                    {/* 인디케이터 도트 */}
                    <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-row gap-2 rounded-full bg-deep/85 px-3 py-2 lg:bottom-auto lg:left-auto lg:right-10 lg:top-1/2 lg:flex-col lg:-translate-y-1/2 lg:translate-x-0 lg:px-2 lg:py-3">
                        {[0, 1].map((d) => (
                            <span
                                key={d}
                                className={cn(
                                    'h-2 w-2 rounded-full transition-colors duration-500 lg:h-2.5 lg:w-2.5',
                                    slide === d ? 'bg-cream' : 'bg-cream/30',
                                )}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

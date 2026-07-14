'use client';

import { useRef, useState } from 'react';
import { motion, useScroll, useMotionValueEvent } from 'framer-motion';
import { EASE } from '@/components/lib/motion';
import { cn } from '@/components/lib/cn';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';

const slides: string[][] = [
    [
        '책임감있는 원장 1:1 지정제',
        '“상담”이 아닌 “진료”',
        '라이프비즈 AI 기반 3D분석\n카메라로 객관적인 얼굴형 진단',
        '오직 리베리에서만, 과학적인\n피부타입 분류체계를 통한 진료',
    ],
    ['정품·정량 원칙의 투명한 시술', '시술 전 과정, 원장이 직접', '진단 데이터로 이어지는\n체계적인 사후 관리'],
];

// 모바일: 슬라이드 구분 없이 하나의 리스트로 펼쳐서 보여줌
const allItems = slides.flat();

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
        <section ref={ref} className="relative bg-sand lg:h-[200dvh]">
            {/* 모바일 영역 */}
            <div className="container-site pb-28 pt-24 lg:hidden">
                <span className="mb-6 block text-center font-display text-[11px] uppercase tracking-[0.4em] text-deep/40">
                    Core Value
                </span>
                <h2 className="mb-20 text-center font-display text-h2 leading-10 text-deep">
                    WHY
                    <br />
                    RE:BERRY
                </h2>

                <ul className="border-y border-deep/15">
                    {allItems.map((text, i) => (
                        <motion.li
                            key={text}
                            initial={{ opacity: 0, y: 24 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: '-60px' }}
                            transition={{ duration: 0.6, ease: EASE }}
                            className="relative overflow-hidden border-b border-deep/10 py-12 last:border-none"
                        >
                            {/* #STYLE: 배경에 깔리는 거대한 이탤릭 워터마크 숫자 (에디토리얼 기법) */}
                            <span className="pointer-events-none absolute -top-4 right-0 select-none font-display text-[120px] italic leading-none text-deep/5">
                                {String(i + 1).padStart(2, '0')}
                            </span>

                            {/* #STYLE: 좌측 얇은 실선(Hairline)과 함께 텍스트를 들여쓰기하여 타이포그래피의 시각적 안정감 확보 */}
                            <div className="relative z-10 ml-2 border-l border-deep/20 pl-6">
                                <span className="mb-3 block font-display text-xs font-medium tracking-[0.2em] text-deep/40">
                                    POINT {String(i + 1).padStart(2, '0')}
                                </span>
                                <p className="whitespace-pre-line text-lg font-medium leading-[1.6] text-deep">
                                    {text}
                                </p>
                            </div>
                        </motion.li>
                    ))}
                </ul>
            </div>

            {/* pc 영역 */}
            <div className="hidden lg:sticky lg:top-[100px] lg:grid lg:h-[calc(100dvh-100px)] container-site lg:grid-cols-[1fr_1.6fr]">
                <div className="flex items-center justify-center">
                    <h2 className="font-display text-center text-h2 leading-12">
                        WHY
                        <br />
                        RE:BERRY
                    </h2>
                </div>

                <div className="relative flex items-center overflow-hidden -mr-6  px-35 min-[1560px]:mr-0 min-[1560px]:rounded-2xl">
                    <Image
                        src="/images/bg-texture-02.jpg"
                        alt=""
                        fill
                        quality={88}
                        sizes="800px"
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
                                className="relative w-full space-y-10"
                            >
                                {slides[slide].map((text, i) => {
                                    const no = slide === 0 ? i + 1 : i + 5;
                                    return (
                                        <li key={text} className="flex items-center gap-13.75">
                                            <span className="flex h-13.5 w-13.5 shrink-0 items-center justify-center rounded-full border border-cream p-1.5">
                                                <span className="flex h-full w-full items-center justify-center rounded-full bg-cream text-center font-display leading-none text-lead">
                                                    {String(no).padStart(2, '0')}
                                                </span>
                                            </span>
                                            <p className="whitespace-pre-line font-semibold text-lead">{text}</p>
                                        </li>
                                    );
                                })}
                            </motion.ul>
                        </AnimatePresence>
                    </div>

                    <div className="absolute right-10 top-1/2 flex -translate-y-1/2 flex-col gap-2 rounded-full bg-deep/85 px-2 py-3">
                        {[0, 1].map((d) => (
                            <span
                                key={d}
                                className={cn(
                                    'h-2.5 w-2.5 rounded-full transition-colors duration-500',
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

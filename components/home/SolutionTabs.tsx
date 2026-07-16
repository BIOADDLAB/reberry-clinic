'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SolutionSlider from '@/components/ui/SolutionSlider';
import Reveal from '@/components/motion/Reveal';
import { mainSolutionTabs } from '@/components/lib/solutions';
import { cn } from '@/components/lib/cn';

export default function SolutionTabs() {
    const [active, setActive] = useState(mainSolutionTabs[0].key);
    const current = mainSolutionTabs.find((t) => t.key === active)!;

    return (
        <section className="bg-cream overflow-hidden py-28 lg:pt-35.5 lg:pb-37.5">
            <div className="container-site">
                <Reveal className="text-center">
                    <h2 className="font-display text-h2 tracking-[1em] mr-[-1em]">RE:BERRY SOLUTION</h2>
                </Reveal>

                <div
                    className="mt-11.5 flex w-full items-center justify-center border-b border-cocoa/10 pb-0 md:justify-center md:gap-3 md:border-none md:px-0 md:pb-0"
                    role="tablist"
                >
                    {mainSolutionTabs.map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={active === t.key}
                            onClick={() => setActive(t.key)}
                            className={cn(
                                'relative shrink-0 font-bold transition-colors duration-300 text-center',
                                'flex-1 pb-3.5 text-[15px] sm:text-medium',
                                'md:flex-none md:rounded-full md:px-7 md:py-1 md:text-lead',
                                active === t.key
                                    ? 'text-cocoa md:bg-cocoa md:text-cream'
                                    : 'text-latte hover:text-cocoa md:bg-transparent',
                            )}
                        >
                            {t.label}
                            {/* 모바일 하단 언더라인 바 */}
                            {active === t.key && (
                                <motion.div
                                    layoutId="activeTabBorder"
                                    className="absolute bottom-0 left-0 h-[2px] w-full bg-cocoa md:hidden"
                                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                />
                            )}
                        </button>
                    ))}
                </div>

                <motion.div
                    key={active}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-16 lg:mt-20"
                >
                    <SolutionSlider slugs={current.slugs} baseHref={`/treatments/signature/${current.key}`} />
                </motion.div>
            </div>
        </section>
    );
}

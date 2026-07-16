'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import SolutionSlider from '@/components/ui/SolutionSlider';
import Reveal from '@/components/motion/Reveal';
import { mainSolutionTabs } from '@/components/lib/solutions';
import { cn } from '@/components/lib/cn';

// 메인 - 솔루션 탭 영역
export default function SolutionTabs() {
    const [active, setActive] = useState(mainSolutionTabs[0].key);
    const current = mainSolutionTabs.find((t) => t.key === active)!;

    return (
        <section className="bg-cream py-28 lg:pt-35.5 lg:pb-37.5">
            <div className="container-site">
                <Reveal className="text-center">
                    <h2 className="font-display text-h2 tracking-[1em] mr-[-1em]">RE:BERRY SOLUTION</h2>
                </Reveal>

                <div className="mt-11.5 grid grid-cols-2 gap-2 md:flex md:justify-center md:gap-3" role="tablist">
                    {mainSolutionTabs.map((t) => (
                        <button
                            key={t.key}
                            role="tab"
                            aria-selected={active === t.key}
                            onClick={() => setActive(t.key)}
                            className={cn(
                                'rounded-full font-bold transition-colors duration-300',
                                'py-2 text-small',
                                'md:px-7 md:py-1 md:text-lead',
                                active === t.key ? 'bg-cocoa text-cream' : 'text-latte hover:text-cocoa',
                            )}
                        >
                            {t.label}
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

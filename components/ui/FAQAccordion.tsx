'use client';

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/components/lib/cn';

interface Item {
    q: string;
    a: string;
}

export default function FAQAccordion({ items }: { items: Item[] }) {
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    return (
        <ul className="mx-auto max-w-[855px] border-t-[5px] border-b-[1px] border-cream">
            {items.map((item, i) => {
                const open = openIdx === i;
                return (
                    <li key={item.q} className={cn(i > 0 && 'border-t border-cream')}>
                        <button
                            onClick={() => setOpenIdx(open ? null : i)}
                            aria-expanded={open}
                            className="flex w-full items-center justify-between gap-4 py-5 pl-7 text-left pr-3.75"
                        >
                            <span className="flex items-baseline gap-3 text-lead font-semibold break-keep">
                                <span className="font-display shrink-0">Q.</span>
                                {item.q}
                            </span>
                            <span aria-hidden className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                                <span
                                    className={cn(
                                        'absolute h-px w-4 bg-cream transition-transform duration-300',
                                        open && 'rotate-180',
                                    )}
                                />
                                <span
                                    className={cn(
                                        'absolute h-4 w-px bg-cream transition-all duration-300',
                                        open && 'scale-y-0 opacity-0',
                                    )}
                                />
                            </span>
                        </button>
                        <AnimatePresence initial={false}>
                            {open && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                    className="overflow-hidden"
                                >
                                    <p className="pb-6 pl-15 pr-2 text-medium leading-relaxed text-cream break-keep">
                                        {item.a}
                                    </p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </li>
                );
            })}
        </ul>
    );
}

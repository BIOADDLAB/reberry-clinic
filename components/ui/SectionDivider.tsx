'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { EASE } from '@/components/lib/motion';
import { cn } from '@/components/lib/cn';

interface Props {
    variant?: 'emblem' | 'line';
    light?: boolean;
    className?: string;
}

export default function SectionDivider({ variant = 'line', light, className }: Props) {
    if (variant === 'emblem') {
        return (
            <div className={cn('flex justify-center', className)}>
                <motion.div
                    initial={{ opacity: 0, rotate: -180, scale: 0.85 }}
                    whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-60px' }}
                    transition={{ duration: 1.6, ease: EASE }}
                >
                    <Image src="/images/logo-s.svg" alt="" width={52} height={52} aria-hidden />
                </motion.div>
            </div>
        );
    }

    return (
        <div className={cn('flex justify-center', className)} aria-hidden>
            <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-60px' }}
                className="relative flex h-12 justify-center"
            >
                <motion.span
                    variants={{ hidden: { scaleY: 0 }, show: { scaleY: 1, transition: { duration: 1.3, ease: EASE } } }}
                    className={cn('h-full w-px origin-top', light ? 'bg-cream/70' : 'bg-cocoa/50')}
                />
                <motion.span
                    variants={{
                        hidden: { x: '-50%', y: 0, opacity: 0 },
                        show: {
                            x: '-50%',
                            y: 44,
                            opacity: 1,
                            transition: { duration: 1.5, ease: EASE, delay: 0.5 },
                        },
                    }}
                    className={cn(
                        'absolute left-1/2 top-0 h-[4px] w-[4px] rounded-full ring-[1px]',
                        light ? 'bg-cream ring-cream/40' : 'bg-cocoa ring-cocoa/25',
                    )}
                />
            </motion.div>
        </div>
    );
}

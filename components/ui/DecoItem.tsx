'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';

// 리베리 가운데 로고
export function SpinEmblem() {
    return (
        <motion.span
            className="absolute left-1/2 top-1/2 hidden h-20 w-20 -translate-x-1/2 -translate-y-1/2 min-[1100px]:block"
            animate={{ rotate: [0, 180, 0] }}
            transition={{ duration: 9, ease: 'easeInOut', repeat: Infinity, repeatDelay: 2.5 }}
        >
            <Image src="/images/logo-s.svg" alt="" fill className="drop-shadow" aria-hidden />
        </motion.span>
    );
}

// 크림 장식
export function FloatingCream() {
    return (
        <motion.span
            className="absolute hidden origin-bottom-right transition-transform min-[1230px]:-bottom-12 min-[1230px]:-right-16 min-[1230px]:block"
            animate={{ y: [0, -10, 0], rotate: [0, -4, 0] }}
            transition={{ duration: 6.5, ease: 'easeInOut', repeat: Infinity }}
        >
            <Image src="/images/i-cream.png" alt="" width={170} height={220} aria-hidden />
        </motion.span>
    );
}
export function TwoDots({ light }: { light?: boolean } = {}) {
    return (
        <div className="flex flex-col items-center gap-2" aria-hidden>
            {[0, 1].map((i) => (
                <motion.span
                    key={i}
                    className={light ? 'h-1.5 w-1.5 rounded-full bg-cream/70' : 'h-1.5 w-1.5 rounded-full bg-cocoa/50'}
                    initial={{ opacity: 0, y: -6 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 1, delay: 0.3 + i * 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
            ))}
        </div>
    );
}

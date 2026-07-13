'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { stagger, fadeUp } from '@/components/lib/motion';

// 자식 카드들을 0.12s 간격으로 순차 등장시키는 그룹
export function RevealGroup({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

export function RevealItem({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <motion.div variants={fadeUp} className={className}>
            {children}
        </motion.div>
    );
}

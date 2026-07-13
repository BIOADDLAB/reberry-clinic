'use client';

import { motion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';
import { fadeUp } from '@/components/lib/motion';

interface Props {
    children: ReactNode;
    className?: string;
    variants?: Variants;
    delay?: number;
}

// 스크롤 진입 시 1회 페이드업 — 사이트 애니메이션의 90%는 이걸로 처리
// margin -80px: 화면에 80px 들어온 뒤 발동 (가장자리에서 어색하게 터지는 것 방지)
export default function Reveal({ children, className, variants = fadeUp, delay = 0 }: Props) {
    return (
        <motion.div
            variants={variants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay }}
            className={className}
        >
            {children}
        </motion.div>
    );
}

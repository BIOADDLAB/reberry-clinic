'use client';

import Image from 'next/image';
import type { ReactNode } from 'react';
import { MotionConfig, motion } from 'framer-motion';
import { EASE } from '@/components/lib/motion';

/** 동작 줄이기를 켠 기기에서는 이동·회전 없이 투명도만 바뀌게 한다 */
export function SignatureMotion({ children }: { children: ReactNode }) {
    return <MotionConfig reducedMotion="user">{children}</MotionConfig>;
}

/** 마무리 섹션 RB 엠블럼 — 사이트 공통 SectionDivider(emblem)와 같은 회전 등장, 시안 크기(80px) */
export function SignatureEmblem() {
    return (
        <div className="flex justify-center">
            <motion.div
                initial={{ opacity: 0, rotate: -180, scale: 0.85 }}
                whileInView={{ opacity: 1, rotate: 0, scale: 1 }}
                viewport={{ once: true, margin: '-60px' }}
                transition={{ duration: 1.6, ease: EASE }}
                className="size-16 md:size-20"
            >
                <Image src="/images/logo-s.svg" alt="" width={80} height={80} className="size-full" aria-hidden />
            </motion.div>
        </div>
    );
}

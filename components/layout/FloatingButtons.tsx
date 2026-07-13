'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { site } from '@/components/lib/site';
import { EASE } from '@/components/lib/motion';

// 시안: 우측 세로 스택 — 상담예약 / 유투브 / 문의하기
const buttons = [
    { icon: '/images/i-flo-01.svg', label: '상담예약', href: site.naver },
    { icon: '/images/i-flo-02.svg', label: '유투브', href: site.youtube },
    { icon: '/images/i-flo-03.svg', label: '문의하기', href: site.kakao },
];

export default function FloatingButtons() {
    return (
        <div className="fixed bottom-6 right-4 z-40 flex w-14 flex-col items-center gap-3 lg:bottom-10 lg:right-8 lg:w-16">
            {buttons.map((b, i) => (
                <motion.a
                    key={b.label}
                    href={b.href}
                    target="_blank"
                    rel="noreferrer"
                    initial={{ opacity: 0, x: 70 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1, ease: EASE, delay: 1 + i * 0.15 }}
                    whileHover={{ y: -4 }}
                    className="flex h-14 w-14 flex-col items-center justify-center rounded-full bg-cream shadow-[0_4px_16px_rgba(69,54,45,0.18)] ring-1 ring-cocoa/10 lg:h-16 lg:w-16"
                >
                    <Image src={b.icon} alt="" width={22} height={22} />
                    <span className="mt-0.5 text-[10px] leading-none text-cocoa">{b.label}</span>
                </motion.a>
            ))}
        </div>
    );
}

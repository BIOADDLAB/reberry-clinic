'use client';

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import T from '@/components/lang/T';
import { site } from '@/components/lib/site';
import { EASE } from '@/components/lib/motion';

const buttons = [
    { icon: '/images/i-flo-01.svg', label: '상담예약', href: site.reservationPhone },
    { icon: '/images/i-flo-02.svg', label: '유투브', href: site.youtube },
    { icon: '/images/i-flo-03.svg', label: '문의하기', href: site.kakao },
    { icon: '/images/i-flo-04.svg', label: '네이버', href: site.naver },
];

export default function FloatingButtons() {
    const [mounted, setMounted] = useState(false);
    const [isVertical, setIsVertical] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsVertical(window.innerWidth < 1280);
        };
        handleResize();
        window.addEventListener('resize', handleResize);

        const rafId = requestAnimationFrame(() => {
            setMounted(true);
        });

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(rafId);
        };
    }, []);

    if (!mounted) {
        return (
            <div className="fixed bottom-6 right-4 z-40 flex w-14 flex-col items-center gap-3 lg:w-16 xl:bottom-10 xl:right-8 xl:w-auto xl:flex-row opacity-0">
                {buttons.map((b) => (
                    <div
                        key={b.label}
                        className="flex h-14 w-14 flex-col items-center pt-2 rounded-full bg-cream lg:h-16 lg:w-16 lg:pt-2.5 xl:h-[70px] xl:w-[70px] xl:pt-2.5"
                    >
                        <Image
                            src={b.icon}
                            alt=""
                            width={34}
                            height={34}
                            className="w-6 h-6 lg:w-7 lg:h-7 xl:w-[34px] xl:h-[34px]"
                        />
                        <span className="t-1line mt-0.5 w-full px-0.5 text-center text-[10px] leading-none font-semibold text-cocoa">
                            <T ko={b.label} />
                        </span>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-4 z-40 flex w-14 flex-col items-center gap-3 lg:w-16 xl:bottom-10 xl:right-8 xl:w-auto xl:flex-row">
            {buttons.map((b, i) => (
                <motion.a
                    key={b.label}
                    href={b.href}
                    target={b.href.startsWith('tel:') ? undefined : '_blank'}
                    rel="noreferrer"
                    initial={isVertical ? { opacity: 0, x: 70, y: 0 } : { opacity: 0, x: 0, y: 50 }}
                    animate={{ opacity: 1, x: 0, y: 0 }}
                    transition={{ duration: 1, ease: EASE, delay: 1 + i * 0.15 }}
                    whileHover={{ y: -4 }}
                    className="flex h-14 w-14 flex-col items-center pt-2 rounded-full bg-cream shadow-[0_4px_16px_rgba(69,54,45,0.18)] ring-1 ring-cocoa/10 lg:h-16 lg:w-16 lg:pt-2.5 xl:h-[70px] xl:w-[70px] xl:pt-2.5"
                >
                    <Image
                        src={b.icon}
                        alt=""
                        width={34}
                        height={34}
                        className="w-6 h-6 lg:w-7 lg:h-7 xl:w-[34px] xl:h-[34px]"
                    />
                    {/* #ISSUE: 지름 56px 원 안에 들어가야 하는 자리다.
                        구글 번역이 "상담예약 → Consultation Reservation" 처럼 풀어버리면 원 밖으로 넘친다.
                        → 사전(dict.ts)에서 짧은 표기로 고정하고 t-1line 으로 한 줄 보장 */}
                    <span className="t-1line mt-0.5 w-full px-0.5 text-center text-[10px] font-semibold leading-none text-cocoa">
                        <T ko={b.label} />
                    </span>
                </motion.a>
            ))}
        </div>
    );
}

'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/components/lib/cn';
import { LANGS, useLang, setLangCookie, type Lang } from '@/components/lib/useLang';

// 시안 헤더 우측: (지구) 언어 — 클릭 시 드롭다운으로 5개 언어 선택
export default function LanguageToggle({ solid }: { solid: boolean }) {
    const lang = useLang();
    const [open, setOpen] = useState(false);
    const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

    const select = (code: Lang) => {
        setLangCookie(code);
        location.reload(); // 구글 번역이 쿠키를 읽어 전체 페이지 재번역
    };

    return (
        <div className="notranslate relative">
            <button
                onClick={() => setOpen(!open)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="언어 선택"
                className={cn(
                    'flex items-center gap-1.25 rounded-full border border-white px-3 py-1 text-caption-sm transition-colors duration-300 font-bold',
                    solid ? '!border-cocoa/60 text-cocoa hover:bg-cocoa hover:text-cream' : 'text-cream hover:bg-cream',
                )}
            >
                <Image
                    src="/images/i-earth.svg"
                    alt=""
                    width={13}
                    height={13}
                    className={cn('transition', solid && 'to-cocoa')}
                />
                {current.short}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.ul
                        role="listbox"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 8 }}
                        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute right-0 top-full z-50 mt-2 min-w-36 bg-cream py-2 text-cocoa shadow-lg ring-1 ring-cocoa/10"
                    >
                        {LANGS.map((l) => (
                            <li key={l.code}>
                                <button
                                    role="option"
                                    aria-selected={l.code === lang}
                                    onClick={() => select(l.code)}
                                    className={cn(
                                        'flex w-full items-center justify-between gap-4 px-4 py-2 text-caption transition-colors hover:bg-sand/30',
                                        l.code === lang && 'font-semibold',
                                    )}
                                >
                                    <span>{l.label}</span>
                                    <span className="text-[11px] tracking-wider text-latte">{l.short}</span>
                                </button>
                            </li>
                        ))}
                    </motion.ul>
                )}
            </AnimatePresence>
        </div>
    );
}

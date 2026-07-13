'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/components/lib/cn';
import { LANGS, useLang, setLangCookie, type Lang } from '@/components/lib/useLang';

/* 헤더 우측 언어 드롭다운
   상태 4가지가 전부 일관되게 바뀌도록 정리:
   - 투명 헤더(기본): 크림 보더/글자, 흰 아이콘
   - 투명 + hover/열림: 크림 배경 → 글자·아이콘 코코아
   - solid 헤더(스크롤): 코코아 보더/글자, 아이콘 to-cocoa
   - solid + hover/열림: 코코아 배경 → 글자 크림, 아이콘 다시 흰색(필터 해제) */
export default function LanguageToggle({ solid }: { solid: boolean }) {
    const lang = useLang();
    const [open, setOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

    const select = (code: Lang) => {
        setLangCookie(code);
        location.reload();
    };

    // #STYLE: 호버 중이거나 드롭다운이 열려 있는 활성화 상태 정의
    const isActive = isHovered || open;
    // 버튼 배경이 크림색이 되는 타이밍 계산
    const isCreamBg = solid ? !isActive : isActive;

    return (
        <div className="notranslate relative">
            <button
                onClick={() => setOpen(!open)}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                aria-haspopup="listbox"
                aria-expanded={open}
                aria-label="언어 선택"
                className={cn(
                    'group flex items-center gap-1.5 rounded-full border px-3.25 py-1 text-caption-sm transition-colors duration-300',
                    solid
                        ? isActive
                            ? 'border-cocoa bg-cocoa text-cream'
                            : 'border-cocoa/40 text-cocoa bg-transparent'
                        : isActive
                          ? 'border-cream bg-cream text-cocoa'
                          : 'border-cream/60 text-cream bg-transparent',
                )}
            >
                <Image
                    src="/images/i-earth.svg"
                    alt=""
                    width={14}
                    height={14}
                    className={cn('transition duration-300', isCreamBg ? 'to-cocoa' : 'filter-none')}
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
                                        'flex w-full items-center justify-between gap-4 px-4 py-2 text-caption text-cocoa transition-colors duration-300 hover:bg-sand/30',
                                        l.code === lang && 'bg-sand/20 font-semibold',
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

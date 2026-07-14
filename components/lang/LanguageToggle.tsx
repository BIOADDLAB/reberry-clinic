'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react'; // #ISSUE: 외부 클릭 액션 감지를 위해 useEffect, useRef 추가
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/components/lib/cn';
import { LANGS, useLang, setLangCookie, type Lang } from '@/components/lib/useLang';

export default function LanguageToggle({ solid }: { solid: boolean }) {
    const lang = useLang();
    const [open, setOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    // #ISSUE: 토글 컨테이너 바깥 영역 감지를 위한 레프 바인딩
    const dropdownRef = useRef<HTMLDivElement>(null);
    const current = LANGS.find((l) => l.code === lang) ?? LANGS[0];

    const select = (code: Lang) => {
        setLangCookie(code);
        location.reload();
    };

    // #ISSUE: 드롭다운 외부 영역 및 헤더 컴포넌트 클릭 시 메뉴가 자동으로 닫히도록 글로벌 이벤트 처리
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // #STYLE: 호버 중이거나 드롭다운이 열려 있는 활성화 상태 정의
    const isActive = isHovered || open;
    // 버튼 배경이 크림색이 되는 타이밍 계산
    const isCreamBg = solid ? !isActive : isActive;

    return (
        /* #STYLE: 최외각 영역 계산을 위해 ref 속성 연결 */
        <div ref={dropdownRef} className="notranslate relative">
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

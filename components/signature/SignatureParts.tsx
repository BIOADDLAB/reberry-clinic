/* 시그니처 페이지 공용 조각 — 문구 렌더러와 시안에서 뽑은 아이콘.
   훅을 쓰지 않으므로 서버/클라이언트 어디서나 import 할 수 있다. */

import { Fragment } from 'react';
import { cn } from '@/components/lib/cn';

const BREAK_CLASS = { md: 'hidden md:block', lg: 'hidden lg:block', xl: 'hidden xl:block' } as const;

/* ───────── 글자 크기 ─────────
   #ISSUE: 사이트 타입 스케일(.text-h2 · .text-h3)은 globals.css 의 일반 클래스라
           md: 같은 반응형 접두사가 만들어지지 않고, 같은 요소의 leading-* 보다도 우선한다.
   → 시그니처 페이지는 같은 방식(clamp)의 값을 Tailwind 임의값으로 직접 쓴다. 최대값 = 1920 시안 */
export const SIG_TYPE = {
    h2: 'text-[clamp(24px,2.7vw,36px)]', // 섹션 제목 36
    h2Sm: 'text-[clamp(22px,2.5vw,34px)]', // 추천 제목 · 마무리 34
    display: 'text-[clamp(28px,2.7vw,36px)]', // Reberry Signature · 스토리 제목 36
    eyebrow: 'text-[clamp(20px,1.8vw,24px)]', // Why Reberry? · Recommendation 24
    h3: 'text-[clamp(16px,1.8vw,24px)]', // Why 항목 · 추천 알약 · 마무리 보조 24
    quote: 'text-[clamp(17px,1.8vw,24px)]', // 인용문 · 스토리 부제 24
    body: 'text-[15px] md:text-[16px] lg:text-[17px]', // 본문 17
} as const;

/** 24px 문장 자간 — 시안 -1.5px(-6.25%). 번역문은 글자가 붙어 보여서 한국어에만 건다 */
export const TRACK_24 = 'tracking-[-0.0625em]';

/* ───────── 문구 렌더러 ─────────
   "**굵게**" → <strong>, "\n" → <br />
   breakFrom 을 주면 그 폭 이상에서만 줄을 바꾸고, 그보다 좁은 화면에서는 문장이 자연스럽게 이어진다.
   중국어·일본어는 띄어쓰기가 없으므로 줄을 이을 때 공백을 넣지 않는다. */
export function Rich({
    text,
    strongClassName = 'font-semibold',
    breakFrom,
    locale = 'ko',
}: {
    text: string;
    strongClassName?: string;
    breakFrom?: 'md' | 'lg' | 'xl';
    locale?: string;
}) {
    const joiner = locale === 'ja' || locale === 'zh' ? '' : ' ';
    const lines = text.split('\n');

    return (
        <>
            {lines.map((line, lineIndex) => (
                <Fragment key={lineIndex}>
                    {line.split('**').map((part, partIndex) =>
                        partIndex % 2 === 1 ? (
                            <strong key={partIndex} className={strongClassName}>
                                {part}
                            </strong>
                        ) : (
                            <Fragment key={partIndex}>{part}</Fragment>
                        ),
                    )}
                    {lineIndex < lines.length - 1 &&
                        (breakFrom ? (
                            <>
                                {joiner}
                                <br className={BREAK_CLASS[breakFrom]} />
                            </>
                        ) : (
                            <br />
                        ))}
                </Fragment>
            ))}
        </>
    );
}

/** "{name}" 자리에 시술명을 넣는다 */
export const fillName = (template: string, name: string) => template.replace('{name}', name);

/* ───────── 장식 ───────── */

/** 가운데 점이 있는 반투명 원 — 히어로 제목(lg)과 RE:BERRY 아이브로우(sm) 양옆 */
export function DotOrnament({ size = 'sm', className }: { size?: 'sm' | 'lg'; className?: string }) {
    return (
        <span
            aria-hidden
            className={cn(
                'relative inline-flex shrink-0 items-center justify-center rounded-full bg-cocoa/50',
                size === 'lg' ? 'size-2.5 md:size-[13.8px]' : 'size-2.75',
                className,
            )}
        >
            <span
                className={cn(
                    'block rounded-full bg-cocoa/50',
                    size === 'lg' ? 'size-[4.5px] md:size-[6.3px]' : 'size-1.25',
                )}
            />
        </span>
    );
}

/** 시안 체크 아이콘 — why: 굵은 선(34 캔버스 안 30), recommend: 얇은 선(26) */
export function CheckCircleIcon({ variant, className }: { variant: 'why' | 'recommend'; className?: string }) {
    if (variant === 'why') {
        return (
            <svg viewBox="0 0 30 30" fill="currentColor" aria-hidden className={className}>
                <path d="M14.63 0.17C15 0.16 15.38 0.17 15.75 0.2L16.26 0.24C23.46 0.8 29.2 6.61 29.78 13.81L29.83 14.13L29.83 15.87L29.78 16.21C29.26 23.43 23.42 29.2 16.2 29.78L15.88 29.83H14.14L13.81 29.78C6.61 29.21 0.8 23.46 0.24 16.26L0.2 15.76C0.16 15.26 0.16 14.76 0.2 14.26L0.24 13.75C0.8 6.58 6.58 0.8 13.75 0.24L14.26 0.2L14.63 0.17ZM15 2.8C8.26 2.8 2.8 8.27 2.8 15.01C2.8 21.75 8.26 27.21 15.01 27.21C21.75 27.21 27.21 21.75 27.21 15.01C27.21 8.27 21.75 2.8 15 2.8Z" />
                <path d="M21.3 9.29C21.83 8.76 22.64 8.78 23.15 9.29C23.64 9.78 23.68 10.6 23.15 11.14L13.55 20.73C13.03 21.25 12.21 21.23 11.7 20.72L6.84 15.85C6.29 15.31 6.4 14.48 6.87 14.03L6.96 13.94C7.46 13.54 8.21 13.53 8.69 14.02L12.64 17.95L21.3 9.29Z" />
            </svg>
        );
    }

    return (
        <svg viewBox="0 0 26 26" fill="currentColor" aria-hidden className={className}>
            <path d="M26 12.25L26 13.77L25.96 14.05C25.5 20.39 20.38 25.45 14.05 25.96L13.77 26L12.24 26L11.96 25.96C5.65 25.45 0.55 20.41 0.06 14.1L0.03 13.66C-0.01 13.23-0.01 12.79 0.03 12.35L0.06 11.91C0.55 5.62 5.62 0.55 11.91 0.06L12.35 0.03C12.79-0.01 13.23-0.01 13.66 0.03L14.11 0.06C20.41 0.55 25.45 5.65 25.96 11.96L26 12.25ZM23.86 13.01C23.86 7.01 19 2.15 13 2.15C7.01 2.15 2.15 7.01 2.15 13.01C2.15 19 7.01 23.86 13.01 23.86C19 23.86 23.86 19 23.86 13.01Z" />
            <path d="M5.86 13.69C5.42 13.25 5.51 12.57 5.89 12.2C6.29 11.81 6.95 11.77 7.37 12.2L10.91 15.73L18.62 8.02C19.05 7.59 19.72 7.61 20.13 8.02C20.53 8.42 20.57 9.09 20.13 9.53L11.66 17.99C11.24 18.42 10.57 18.4 10.15 17.99L5.86 13.69Z" />
        </svg>
    );
}

export function QuoteMark({ close, className }: { close?: boolean; className?: string }) {
    return (
        <svg
            viewBox="0 0 26 20"
            fill="currentColor"
            aria-hidden
            className={cn('h-auto w-5 md:w-[26px]', close && 'rotate-180', className)}
        >
            <path d="M25.85 13.1C26.25 14.75 25.83 16.48 24.68 17.72C24.23 18.21 23.69 18.6 23.09 18.88C21.71 19.54 20.15 19.67 18.68 19.29C17.21 18.92 15.95 17.98 15.15 16.67C13.74 14.34 13.92 11.05 14.8 8.53C14.99 7.99 15.2 7.48 15.46 6.97C17.03 3.86 19.6 1.6 22.65 0L24.36 2.75C22.94 3.63 21.71 4.73 20.76 6.1C20.02 7.18 19.49 8.41 19.25 9.72C20.63 9.13 22.24 9.31 23.52 10.03C24.68 10.68 25.53 11.79 25.85 13.1Z" />
            <path d="M11.73 14.11C11.81 15.92 10.98 17.56 9.47 18.53C7.24 19.98 4.19 19.8 2.2 18.01C1.14 17.07 0.5 15.78 0.21 14.38C-0.25 12.21 0.07 9.91 0.9 7.87C1.65 6.05 2.84 4.34 4.23 2.97C4.93 2.28 5.67 1.66 6.47 1.1C7.04 0.7 7.62 0.34 8.23 0L10.04 2.75C9.04 3.37 8.14 4.11 7.36 4.98C6.17 6.3 5.29 7.94 5 9.72C5.63 9.45 6.28 9.34 6.95 9.37C7.87 9.42 8.75 9.7 9.52 10.2C10.86 11.06 11.66 12.5 11.73 14.11Z" />
        </svg>
    );
}

/** 히어로 스크롤 마우스 — 밝은 배경용(코코아 선) */
export function ScrollMouse({ className }: { className?: string }) {
    return (
        <div aria-hidden className={cn('flex flex-col items-center gap-1.5 text-cocoa md:gap-[5px]', className)}>
            <div className="flex h-8 w-5 items-start justify-center rounded-full border-[1.5px] border-current pt-1.5 md:h-[38.5px] md:w-[23px] md:border-[1.7px] md:pt-[6px]">
                <div className="h-1.5 w-[1.5px] animate-wheel rounded-full bg-current md:h-[7px] md:w-[1.75px]" />
            </div>
            <svg viewBox="0 0 9 6" fill="currentColor" className="w-2 md:w-[8.5px]">
                <path d="M8.14844 1.5291L4.19131 5.28884L0.144242 1.35378C-0.108907 1.10703 -0.00564909 0.142739 0.274148 0.04209C0.553945 -0.0585594 1.2168 0.0258578 1.44996 0.246637L4.21463 2.87326L7.07589 0.175208C7.3357 -0.0682984 8.15843 -0.0488151 8.34497 0.188198C8.5315 0.425211 8.42491 1.26287 8.14844 1.52586V1.5291Z" />
            </svg>
        </div>
    );
}

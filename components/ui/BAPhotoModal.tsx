/* #COMPONENTS: 전후사진 상세 팝업
   #ISSUE 1: 사진 안에 이미 시술일이 들어가 있는데 팝업에도 또 찍혀 중복이었다 → 시술일 표기 제거
   #ISSUE 2: 내용이 길어 팝업 안에 세로 스크롤바가 생겼다(기존 홈페이지는 안 생김)
             → 패널을 flex 컬럼으로 잡고 [헤더 고정 / 사진 flex-1 / 안내문 고정] 3단으로 나눠
               화면 높이에 맞춰 사진이 줄어들게 했다. overflow-y-auto 를 쓰지 않으므로 스크롤바가 아예 안 생긴다. */

'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { baCategoryLabel, baPhotoUrl, resolveBACategory, resolveBALabel, type BAPhoto } from '@/components/lib/ba';
import T from '@/components/lang/T';

interface Props {
    photo: BAPhoto | null;
    onClose: () => void;
}

export default function BAPhotoModal({ photo, onClose }: Props) {
    const t = useTranslations('common');
    const tReviews = useTranslations('reviews');

    useEffect(() => {
        if (!photo) return;
        const onKeyDown = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKeyDown);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = '';
        };
    }, [photo, onClose]);

    if (!photo) return null;

    const label = resolveBALabel(photo);
    const categoryKey = resolveBACategory(photo);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-deep/70 p-4"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <div
                /* #ISSUE: max-h 만 주면 flex 컨테이너에 확정 높이가 없어서
                   가운데 사진 영역(flex-1 + min-h-0)이 0px 로 접혀 사진이 아예 안 보였다.
                   → 높이를 확정값으로 준다. 화면이 크면 720px, 작으면 화면 높이에 맞춘다. */
                className="flex h-[min(calc(100dvh-2rem),720px)] w-full max-w-[640px] flex-col overflow-hidden rounded-[10px] bg-white shadow-[0_24px_60px_rgba(28,20,16,0.35)]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* 헤더 — 고정 */}
                <div className="flex shrink-0 items-start justify-between gap-3 border-b border-cocoa/[0.08] px-5 py-4">
                    <div className="min-w-0">
                        {categoryKey && (
                            <span className="inline-block rounded-full bg-sand/70 px-2.5 py-1 text-caption-sm font-semibold text-cocoa/70">
                                <T ko={baCategoryLabel(categoryKey)} />
                            </span>
                        )}
                        <h3 className="mt-1.5 truncate text-lead font-bold text-cocoa">
                            <T ko={label} />
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label={t('close')}
                        className="-mr-1 shrink-0 rounded-full p-1.5 text-cocoa/50 transition-colors hover:bg-cocoa/5 hover:text-cocoa"
                    >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* 사진 — 남는 높이를 다 쓰되 넘치지 않게(min-h-0 필수) */}
                <div className="relative min-h-0 flex-1 bg-white">
                    <Image
                        src={baPhotoUrl(photo)}
                        alt={t('beforeAltWithLabel', { label })}
                        fill
                        quality={90}
                        sizes="(max-width: 640px) 92vw, 640px"
                        className="object-contain p-3"
                    />
                    <span className="notranslate font-display pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 text-caption-sm tracking-[0.2em] text-cocoa/25">
                        RE:BERRY
                    </span>
                </div>

                {/* 안내문 — 고정, 한 화면에 들어가도록 압축 */}
                <div className="shrink-0 border-t border-cocoa/[0.08] bg-sand/30 px-5 py-3.5">
                    <p className="break-keep text-caption-sm leading-5 text-cocoa/70">{tReviews('consent')}</p>
                    <p className="mt-1 break-keep text-caption-sm leading-5 text-cocoa/60">{tReviews('consentDetail')}</p>
                    <p className="mt-2 break-keep text-caption-sm leading-5 text-cocoa/60">
                        <span className="font-bold text-cocoa">{tReviews('precautionsTitle')}</span>{' '}
                        {tReviews('precautionPetit')} · {tReviews('precautionSkin')}
                    </p>
                </div>
            </div>
        </div>
    );
}

'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { BAPhoto } from '@/components/lib/ba';
import T from '@/components/lang/T';

interface Props {
    photo: BAPhoto | null;
    onClose: () => void;
    onLoginRequired: () => void;
}

export default function BAPhotoModal({ photo, onClose, onLoginRequired }: Props) {
    const t = useTranslations('common');

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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/70 p-4" onClick={onClose}>
            <div
                className="relative w-full max-w-[720px] rounded-[8px] bg-sand p-6 sm:p-8"
                onClick={(e) => e.stopPropagation()}
            >
                <button
                    onClick={onClose}
                    aria-label={t('close')}
                    className="absolute right-4 top-4 text-cocoa/70 hover:text-cocoa transition-colors"
                >
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <h3 className="t-2line px-8 text-center text-h3 font-bold text-cream/90 text-shadow-2xs">
                    <T ko={photo.label} />
                </h3>

                <div className="mt-6 grid grid-cols-2 gap-2 sm:gap-4">
                    {/* skeleton 클래스를 컨테이너에 두면 이미지가 늦게 와도 빈 칸 대신 샌드 박스가 깜빡인다 */}
                    <div className="skeleton relative aspect-[4/3] overflow-hidden rounded-[4px]">
                        <Image
                            src={photo.before}
                            alt={t('beforeAltWithLabel', { label: photo.label })}
                            fill
                            quality={90}
                            sizes="(max-width: 640px) 45vw, 320px"
                            className="scale-110 object-cover blur-[7px]"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onLoginRequired();
                            }}
                            className="absolute inset-0 flex items-center justify-center bg-deep/5 transition-colors hover:bg-deep/15"
                        >
                            <span className="badge-fixed rounded-full border border-cream px-3 py-1 text-caption font-bold text-cream shadow-sm transition-transform hover:scale-105">
                                {t('login')}
                            </span>
                        </button>
                    </div>
                    <div className="skeleton relative aspect-[4/3] overflow-hidden rounded-[4px]">
                        <Image
                            src={photo.after}
                            alt={t('afterAltWithLabel', { label: photo.label })}
                            fill
                            quality={90}
                            sizes="(max-width: 640px) 45vw, 320px"
                            className="object-cover"
                        />
                    </div>
                </div>

                <p className="notranslate font-display mt-5 flex items-center justify-center gap-4 text-lead text-cream text-shadow-2xs">
                    Before <span aria-hidden>→</span> After
                </p>
                <p className="notranslate font-display text-center text-small text-shadow-2xs tracking-[0.2em] text-cream">
                    RE:BERRY
                </p>
            </div>
        </div>
    );
}

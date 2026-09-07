'use client';

import Image from 'next/image';
import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { baPhotoUrl, formatTreatmentDate, resolveBALabel, type BAPhoto } from '@/components/lib/ba';
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

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-deep/70 p-4" onClick={onClose}>
            <div
                className="relative max-h-[calc(100dvh-2rem)] w-full max-w-[720px] overflow-y-auto rounded-[8px] bg-sand p-6 sm:p-8"
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
                    <T ko={label} />
                </h3>

                <div className="skeleton relative mt-6 aspect-square overflow-hidden rounded-[4px]">
                    <Image
                        src={baPhotoUrl(photo)}
                        alt={t('beforeAltWithLabel', { label })}
                        fill
                        quality={90}
                        sizes="(max-width: 720px) 90vw, 640px"
                        className="object-contain"
                    />
                </div>
                {photo.treatmentDate && (
                    <p className="mt-5 text-center text-caption text-cocoa/65">
                        {t('treatmentDate')}{' '}
                        <time dateTime={photo.treatmentDate} className="notranslate">
                            {formatTreatmentDate(photo.treatmentDate)}
                        </time>
                    </p>
                )}
                <p className="notranslate font-display text-center text-small text-shadow-2xs tracking-[0.2em] text-cream">
                    RE:BERRY
                </p>
                <div className="mt-6 border-t border-cocoa/15 pt-5 text-left">
                    <p className="break-keep text-caption leading-[22px] text-cocoa/80">{tReviews('consent')}</p>
                    <p className="mt-2 break-keep text-caption leading-[22px] text-cocoa/80">
                        {tReviews('consentDetail')}
                    </p>
                    <p className="mt-4 text-caption font-bold text-cocoa">{tReviews('precautionsTitle')}</p>
                    <ul className="mt-1.5 list-disc space-y-1 pl-5 text-caption leading-[22px] text-cocoa/80">
                        <li className="break-keep">{tReviews('precautionPetit')}</li>
                        <li className="break-keep">{tReviews('precautionSkin')}</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

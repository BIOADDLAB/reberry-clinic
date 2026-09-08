/* #COMPONENTS: 전후사진 카드 한 장 — 전후사진 페이지(/reviews) 모양을 메인·시술 페이지 슬라이더까지 같이 쓴다.
   #ISSUE: 곳곳에 카드를 따로 짜 두니 한쪽만 고쳐지는 사고가 반복됐다.
           (전·후가 한 장에 붙은 합성본 대응이 메인 슬라이더에만 빠져 있어 같은 사진이 두 번 나온 것도 이 탓)
   폭은 쓰는 쪽이 정한다 — 격자는 칸 폭에 맞추고, 슬라이더는 className 으로 카드 폭을 넘긴다. */

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import T from '@/components/lang/T';
import { cn } from '@/components/lib/cn';
import Skeleton from '@/components/ui/Skeleton';
import {
    baCategoryLabel,
    baPhotoUrl,
    isCombinedBAPhoto,
    resolveBACategory,
    resolveBALabel,
    type BAPhoto,
} from '@/components/lib/ba';

const FRAME = 'overflow-hidden rounded-[6px] bg-white shadow-[0_4px_18px_rgba(69,54,45,0.06)] ring-1 ring-cocoa/[0.06]';
const PILL = 'line-clamp-1 max-w-full rounded-full bg-cocoa px-4 py-1 text-center text-caption-sm font-bold leading-snug text-cream';

export default function BAPhotoCard({
    photo,
    sizes,
    className,
    onSelect,
}: {
    photo: BAPhoto;
    sizes: string;
    className?: string;
    onSelect: (photo: BAPhoto) => void;
}) {
    const t = useTranslations('common');
    const label = resolveBALabel(photo);
    const categoryKey = resolveBACategory(photo);
    const combined = isCombinedBAPhoto(photo);

    return (
        <button
            type="button"
            onClick={() => onSelect(photo)}
            aria-label={`${label} ${t('beforeAfter')}`}
            className={cn('group block cursor-pointer text-left transition-transform duration-300', FRAME, className)}
        >
            <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
                {categoryKey ? (
                    <span className="rounded-full bg-sand/70 px-2.5 py-1 text-caption-sm font-semibold text-cocoa/70">
                        <T ko={baCategoryLabel(categoryKey)} />
                    </span>
                ) : (
                    <span aria-hidden />
                )}
                <span className="notranslate font-display text-caption-sm tracking-[0.2em] text-cocoa/30">RE:BERRY</span>
            </div>

            {/* 합성본은 한 칸 그대로, 예전 두 장짜리는 같은 정사각을 위아래로 반씩 나눠 쓴다.
                → 두 방식이 섞여 있어도 카드 높이가 같아 슬라이더에서 줄이 어긋나지 않는다. */}
            {combined ? (
                <div className="skeleton relative aspect-square overflow-hidden bg-white">
                    <Image
                        src={baPhotoUrl(photo)}
                        alt={t('beforeAltWithLabel', { label })}
                        fill
                        quality={85}
                        sizes={sizes}
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                </div>
            ) : (
                <div className="relative flex aspect-square flex-col overflow-hidden bg-white">
                    <div className="skeleton relative min-h-0 flex-1 overflow-hidden">
                        <Image
                            src={photo.before}
                            alt={t('beforeAltWithLabel', { label })}
                            fill
                            quality={85}
                            sizes={sizes}
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                    </div>
                    <div className="skeleton relative min-h-0 flex-1 overflow-hidden">
                        <Image
                            src={photo.after}
                            alt={t('afterAlt')}
                            fill
                            quality={85}
                            sizes={sizes}
                            className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                    </div>
                    {/* 합성본 가운데 들어 있는 화살표와 같은 자리 — 두 장짜리에도 전 → 후 방향을 표시한다 */}
                    <span className="absolute left-1/2 top-1/2 z-10 flex h-[34px] w-[34px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-cocoa">
                        <span aria-hidden className="mt-[-3px] block h-2 w-2 rotate-45 border-b-2 border-r-2 border-cream" />
                    </span>
                </div>
            )}

            <div className="flex justify-center px-3.5 py-3">
                <span className={PILL}>
                    <T ko={label} />
                </span>
            </div>
        </button>
    );
}

/* 사진을 기다리는 동안의 자리. 실제 카드와 같은 상자·여백을 써서 사진이 도착해도 높이가 튀지 않는다. */
export function BAPhotoCardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn(FRAME, className)}>
            <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
                <Skeleton className="h-[26px] w-20 rounded-full" />
                <Skeleton className="h-[18px] w-16 rounded-full" />
            </div>
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="flex justify-center px-3.5 py-3">
                <Skeleton className="h-[26px] w-32 rounded-full" />
            </div>
        </div>
    );
}

/* 아직 등록된 사진이 없는 시술 페이지에 세워 두는 준비중 카드 */
export function BAPhotoCardEmpty({ label, className }: { label: string; className?: string }) {
    const t = useTranslations('common');

    return (
        <div className={cn(FRAME, className)}>
            <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
                <span aria-hidden />
                <span className="notranslate font-display text-caption-sm tracking-[0.2em] text-cocoa/30">RE:BERRY</span>
            </div>
            <div className="flex aspect-square items-center justify-center bg-sand">
                <p className="text-small font-semibold text-cream">{t('comingSoon')}</p>
            </div>
            <div className="flex justify-center px-3.5 py-3">
                <span className={PILL}>
                    <T ko={label} />
                </span>
            </div>
        </div>
    );
}

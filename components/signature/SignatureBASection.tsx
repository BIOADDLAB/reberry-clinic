/* #COMPONENTS: 시그니처 전후사진 — 시안(정사각 카드 3장 + More View)
   - 화면에는 3장만 나온다(확정 규칙). 어느 3장인지는 관리자 → 전후사진 관리의 순서로 정한다.
   - 사진은 관리자에서 이 페이지(slug)에 연결한 것을 쓰고, 나머지는 More View(전후사진 페이지)에서 본다.
   - 조회가 끝났는데 연결된 사진이 0장이면 섹션 전체를 그리지 않는다(빈 제목만 남지 않게). */

'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/components/lib/cn';
import {
    baPhotoUrl,
    formatTreatmentDate,
    isCombinedBAPhoto,
    resolveBALabel,
    type BAPhoto,
} from '@/components/lib/ba';
import { filterBAPhotosBySlug, useBAPhotos, useBAPhotosLoading } from '@/components/lib/useBAPhotos';
import { SIGNATURE_BA_MORE_HREF, SIGNATURE_BA_VISIBLE } from '@/components/lib/signaturePages';
import Reveal from '@/components/motion/Reveal';
import { RevealItem } from '@/components/motion/RevealGroup';
import BAPhotoModal from '@/components/ui/BAPhotoModal';
import { Rich, SIG_TYPE } from '@/components/signature/SignatureParts';
import SignatureSwipeRow from '@/components/signature/SignatureSwipeRow';

const VISIBLE = SIGNATURE_BA_VISIBLE;

const CELL = 'relative';
const SIZES = '(max-width: 768px) 78vw, (max-width: 1024px) 320px, 369px';
const CARD =
    'relative block aspect-square w-full overflow-hidden rounded-[10px] bg-white shadow-[0_4px_8px_rgba(0,0,0,0.15)]';

export default function SignatureBASection({ slug, title, locale }: { slug: string; title: string; locale: string }) {
    const t = useTranslations('common');
    const loading = useBAPhotosLoading();
    const photos = filterBAPhotosBySlug(useBAPhotos(), slug).slice(0, VISIBLE);
    const [selected, setSelected] = useState<BAPhoto | null>(null);

    if (!loading && photos.length === 0) return null;

    return (
        <section className="bg-[#FAF7F1] py-20 lg:pt-[134px] lg:pb-[141px]">
            <div className="container-site">
                <Reveal className="text-center">
                    <h2 className={cn('text-balance font-normal leading-[1.4] tracking-tighter', SIG_TYPE.h2)}>
                        <Rich text={title} strongClassName="font-bold" locale={locale} />
                    </h2>
                </Reveal>

                {loading ? (
                    <SignatureSwipeRow
                        count={VISIBLE}
                        itemMin={280}
                        fitGapClassName="gap-4 md:gap-5 xl:gap-[37.5px]"
                        className="mt-10 lg:mt-[48px]"
                    >
                        {Array.from({ length: VISIBLE }).map((_, i) => (
                            <div key={i} className={cn(CELL, 'skeleton aspect-square rounded-[10px]')} aria-hidden />
                        ))}
                    </SignatureSwipeRow>
                ) : (
                    <SignatureSwipeRow
                        count={photos.length}
                        itemMin={280}
                        fitGapClassName="gap-4 md:gap-5 xl:gap-[37.5px]"
                        className="mt-10 lg:mt-[48px]"
                    >
                        {photos.map((photo) => (
                            <RevealItem key={photo.id} className={CELL}>
                                <button
                                    type="button"
                                    onClick={() => setSelected(photo)}
                                    aria-label={`${resolveBALabel(photo)} ${t('beforeAfter')}`}
                                    className={cn(
                                        CARD,
                                        'group cursor-pointer transition-transform duration-500 hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cocoa',
                                    )}
                                >
                                    <SignatureBAPhoto photo={photo} />
                                    {/* 눌러야 사진이 크게 열리는데 표시가 없어 지나치기 쉬웠다 →
                                        이벤트 포스터·다른 시술 페이지와 같은 "크게 보기" 덮개.
                                        마우스가 없는 휴대폰(md 미만)에는 띄우지 않는다 */}
                                    <span className="pointer-events-none absolute inset-0 z-10 hidden items-center justify-center rounded-[10px] bg-deep/35 opacity-0 transition-opacity duration-300 group-hover:opacity-100 md:flex">
                                        <span className="rounded-full border border-cream/70 px-4 py-2 text-caption font-semibold text-cream">
                                            {t('viewLarger')}
                                        </span>
                                    </span>
                                    {/* 시안: 사진 위 1px 흰 테두리 */}
                                    <span
                                        aria-hidden
                                        className="pointer-events-none absolute inset-0 z-10 rounded-[10px] ring-1 ring-inset ring-white"
                                    />
                                </button>
                            </RevealItem>
                        ))}
                    </SignatureSwipeRow>
                )}

                <Reveal className="mt-10 text-center lg:mt-[53px]">
                    {/* 사이트 공용 MoreView(dark)와 같은 모양, 크기만 시안(122×36) */}
                    <Link
                        href={SIGNATURE_BA_MORE_HREF}
                        className="group inline-flex h-9 items-center gap-[13px] rounded-full bg-cocoa pl-5 pr-[17px] text-caption leading-none tracking-normal text-cream transition-colors hover:bg-deep"
                    >
                        More View
                        <span
                            aria-hidden
                            className="animate-pulse-slow relative flex size-[7px] items-center justify-center rounded-full bg-white/25"
                        >
                            <span className="block size-[3px] rounded-full bg-white" />
                        </span>
                    </Link>
                </Reveal>
            </div>

            <BAPhotoModal photo={selected} onClose={() => setSelected(null)} />
        </section>
    );
}

/* 합성본(전·후 + 로고 + 날짜가 한 장에 들어간 정사각 이미지)은 그대로 채우고,
   예전 두 장짜리는 합성본과 같은 배치(로고 / 전·후 나란히 / Before·After)로 그린다. */
function SignatureBAPhoto({ photo }: { photo: BAPhoto }) {
    const t = useTranslations('common');
    const label = resolveBALabel(photo);

    if (isCombinedBAPhoto(photo)) {
        return (
            <Image
                src={baPhotoUrl(photo)}
                alt={`${label} ${t('beforeAfter')}`}
                fill
                quality={88}
                sizes={SIZES}
                className="object-cover transition-transform duration-700 group-hover:scale-[1.02]"
            />
        );
    }

    const date = formatTreatmentDate(photo.treatmentDate);

    return (
        <span className="absolute inset-0 flex flex-col bg-white">
            <span className="flex h-[26%] items-center justify-center">
                <Image
                    src="/images/logo.svg"
                    alt=""
                    width={176}
                    height={19}
                    unoptimized
                    className="to-cocoa h-auto w-[36%] opacity-70"
                />
            </span>
            <span className="relative flex h-[42%] border-y border-cocoa/10">
                <span className="skeleton relative flex-1 overflow-hidden border-r border-white">
                    <Image
                        src={photo.before}
                        alt={t('beforeAltWithLabel', { label })}
                        fill
                        quality={85}
                        sizes="(max-width: 1280px) 180px, 185px"
                        className="object-cover"
                    />
                </span>
                <span className="skeleton relative flex-1 overflow-hidden">
                    <Image
                        src={photo.after}
                        alt={t('afterAltWithLabel', { label })}
                        fill
                        quality={85}
                        sizes="(max-width: 1280px) 180px, 185px"
                        className="object-cover"
                    />
                </span>
                <span className="absolute left-1/2 top-1/2 flex size-[14px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-sm">
                    <span aria-hidden className="ml-[-1.5px] block size-[5px] rotate-45 border-r border-t border-cocoa" />
                </span>
            </span>
            <span className="notranslate flex flex-1 font-display">
                <span className="flex flex-1 flex-col items-center pt-[5%] text-cocoa/60">
                    <span className="text-[15px] italic">Before</span>
                    {date && <span className="mt-0.5 text-[9px] tracking-wide">{date}</span>}
                </span>
                <span aria-hidden className="my-[4%] w-px bg-cocoa/25" />
                <span className="flex flex-1 flex-col items-center pt-[5%] text-[#b8733f]">
                    <span className="text-[15px] italic">After</span>
                </span>
            </span>
        </span>
    );
}

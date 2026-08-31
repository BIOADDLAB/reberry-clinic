'use client';

import { useTranslations } from 'next-intl';
import Eyebrow from '@/components/ui/Eyebrow';
import BASlider from '@/components/ui/BASlider';
import MoreView from '@/components/ui/MoreView';
import Reveal from '@/components/motion/Reveal';
import { filterMainBAPhotos, useBAPhotos, useBAPhotosLoading } from '@/components/lib/useBAPhotos';

/** 메인 노출 사진이 한 장도 없으면 제목과 배경까지 포함한 섹션 전체를 숨긴다. */
export default function HomeBASection() {
    const t = useTranslations('home');
    const photos = filterMainBAPhotos(useBAPhotos());
    const loading = useBAPhotosLoading();

    if (loading || photos.length === 0) return null;

    return (
        <section className="relative bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-top py-20 lg:py-28">
            <div className="container-site relative">
                <Reveal className="text-center">
                    <Eyebrow>RE:BERRY</Eyebrow>
                    <div className="mt-7 flex items-center justify-center">
                        <span className="mr-2 font-display text-[90px] leading-[10px] text-latte" aria-hidden>
                            “
                        </span>
                        <h2 className="text-h2 font-medium tracking-tighter">
                            {t.rich('heroHeadline', {
                                mob: () => <br className="block md:hidden" />,
                                hl: (chunks) => <strong className="hl-down font-bold">{chunks}</strong>,
                            })}
                        </h2>
                        <span className="ml-2 font-display text-[90px] leading-[10px] text-latte" aria-hidden>
                            ”
                        </span>
                    </div>
                    <p className="mt-9 text-lead font-medium tracking-tight">
                        {t.rich('heroSubline', { br: () => <br /> })}
                    </p>
                    <div className="mt-7">
                        <MoreView href="/reviews" dark />
                    </div>
                </Reveal>
                <Reveal className="mx-auto mt-14 max-w-4xl lg:mt-16">
                    <BASlider light />
                </Reveal>
            </div>
        </section>
    );
}

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import Reveal from '@/components/motion/Reveal';
import { useColumnsBySlug } from '@/components/lib/useColumns';
import { ColumnSliderContent } from '@/components/ui/ColumnSlider';

interface Props {
    slug: string;
    name: string;
    heading?: string;
}

export default function TreatmentColumnSection({ slug, name, heading }: Props) {
    const t = useTranslations('treatments');
    const items = useColumnsBySlug(slug, []);
    const headingParts = heading?.match(/^(.+?[,、，])\s*(.+)$/);

    if (items.length === 0) return null;

    return (
        <section className="relative overflow-x-clip bg-cream py-20 lg:pt-32.5 lg:pb-37.5">
            <Image
                src="/images/bg-texture-08.jpg"
                alt=""
                fill
                quality={80}
                sizes="100vw"
                className="object-cover"
            />
            <div className="container-site relative">
                <Reveal className="text-center">
                    <h2 className="font-display text-h2">Column</h2>
                    {heading ? (
                        <p className="mt-10 text-h2 leading-9 tracking-tighter">
                            {headingParts ? (
                                <>
                                    {headingParts[1]} <strong className="font-bold">{headingParts[2]}</strong>
                                </>
                            ) : (
                                <strong className="font-bold">{heading}</strong>
                            )}
                        </p>
                    ) : (
                        <p className="mt-10 text-h2 leading-9 tracking-tighter">
                            {t.rich('chrome.columnIntro', {
                                name,
                                hl: (chunks) => <strong className="font-bold">{chunks}</strong>,
                            })}
                        </p>
                    )}
                </Reveal>
                <Reveal className="mt-19.5">
                    <ColumnSliderContent items={items} />
                </Reveal>
            </div>
        </section>
    );
}

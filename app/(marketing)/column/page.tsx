import SkinColumnList from '@/components/column/SkinColumnList';
import LocationSection from '@/components/ui/LocationSection';
import SubHero from '@/components/ui/SubHero';
import JsonLd from '@/components/seo/JsonLd';
import { collectionPageJsonLd } from '@/components/lib/jsonLd';
import Image from 'next/image';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
    const t = await getTranslations('column');
    return { title: t('title'), description: t('subtitle') };
}

export default async function ColumnPage() {
    const t = await getTranslations('column');

    return (
        <>
            <JsonLd
                data={collectionPageJsonLd({
                    name: t('title'),
                    description: t('subtitle'),
                    path: '/column',
                })}
            />
            <SubHero en="Column" image="/images/bg-sub-07.jpg" />
            <section className="relative">
                <Image
                    src="/images/bg-texture-08.jpg"
                    alt=""
                    fill
                    quality={80}
                    sizes="100vw"
                    className="object-cover"
                />
                <SkinColumnList />
            </section>
            <LocationSection />
        </>
    );
}

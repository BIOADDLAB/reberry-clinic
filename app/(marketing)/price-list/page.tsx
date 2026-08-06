import { getTranslations } from 'next-intl/server';
import PriceListClient from '@/components/pricing/PriceListClient';
import LocationSection from '@/components/ui/LocationSection';
import SubHero from '@/components/ui/SubHero';

export async function generateMetadata() {
    const t = await getTranslations('priceList');
    return { title: t('metaTitle'), description: t('description') };
}

export default async function PriceListPage() {
    const t = await getTranslations('priceList');
    return (
        <>
            <SubHero en="PRICE LIST" title={t('title')} image="/images/bg-sub-06.jpg" />
            <section className="bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-top py-20 lg:py-28">
                <div className="container-site">
                    <div className="mb-12 text-center">
                        <h1 className="text-h2 font-bold text-cocoa">{t('title')}</h1>
                        <p className="mx-auto mt-4 max-w-2xl text-small leading-7 text-latte">{t('description')}</p>
                    </div>
                    <PriceListClient />
                </div>
            </section>
            <LocationSection />
        </>
    );
}

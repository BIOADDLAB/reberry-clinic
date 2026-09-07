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
            <section className="overflow-x-clip bg-[#F5F1EA] py-16 lg:py-24">
                <div className="container-site">
                    <div className="mb-10 text-center">
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

import { getTranslations } from 'next-intl/server';
import ReservationForm from '@/components/reservation/ReservationForm';
import LocationSection from '@/components/ui/LocationSection';
import SubHero from '@/components/ui/SubHero';

export async function generateMetadata() {
    const t = await getTranslations('reservation');
    return { title: t('metaTitle'), description: t('description') };
}

export default async function ReservationPage({
    searchParams,
}: {
    searchParams: Promise<{ from?: string }>;
}) {
    const t = await getTranslations('reservation');
    const { from } = await searchParams;

    return (
        <>
            <SubHero en="RESERVATION" title={t('title')} image="/images/bg-sub-06.jpg" />
            <section className="relative bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-top py-20 lg:py-32">
                <div className="container-site relative">
                    <div className="mb-12 text-center">
                        <h1 className="text-h2 font-bold text-cocoa">{t('title')}</h1>
                        <p className="mx-auto mt-4 max-w-2xl text-small leading-7 text-latte">{t('description')}</p>
                    </div>
                    <ReservationForm fromPriceList={from === 'price-list'} />
                </div>
            </section>
            <LocationSection />
        </>
    );
}

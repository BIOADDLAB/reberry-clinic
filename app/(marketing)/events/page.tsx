import { getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import Reveal from '@/components/motion/Reveal';
import PriceListClient from '@/components/pricing/PriceListClient';
import ManagedEventList from '@/components/events/ManagedEventList';

export async function generateMetadata() {
    const t = await getTranslations('events');
    return { title: t('metaTitle') };
}

export default async function EventsPage() {
    const tp = await getTranslations('priceList');

    return (
        <>
            <SubHero en="RE:BERRY EVENT" image="/images/bg-sub-06.jpg" />

            <section className="texture-paper py-20 lg:py-33 bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-top bg-cream">
                <div className="container-site">
                    <Reveal className="text-center">
                        <h2 className="font-display text-h2 tracking-[0.06em]">RE:BERRY Event</h2>
                    </Reveal>
                    <ManagedEventList />

                    <div className="mt-20 border-t border-cocoa/10 pt-20 lg:mt-28 lg:pt-28">
                        <Reveal className="mb-12 text-center">
                            <h2 className="text-h2 font-bold text-cocoa">{tp('title')}</h2>
                            <p className="mx-auto mt-4 max-w-2xl text-small leading-7 text-latte">
                                {tp('description')}
                            </p>
                        </Reveal>
                        <PriceListClient />
                    </div>
                </div>
            </section>

            <LocationSection />
        </>
    );
}

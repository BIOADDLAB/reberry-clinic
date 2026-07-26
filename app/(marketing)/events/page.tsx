import { getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import Reveal from '@/components/motion/Reveal';
import EventModal from '@/components/ui/EventModal';

export async function generateMetadata() {
    const t = await getTranslations('events');
    return { title: t('metaTitle') };
}

export default async function EventsPage() {
    const t = await getTranslations('events');
    const titles = t.raw('titles') as string[];
    const events = [
        { image: '/images/ev-01.jpg', title: titles[0] },
        { image: '/images/ev-02.jpg', title: titles[1] },
        { image: '/images/ev-03.jpg', title: titles[2] },
        { image: '/images/ev-01.jpg', title: titles[0] },
        { image: '/images/ev-02.jpg', title: titles[1] },
        { image: '/images/ev-03.jpg', title: titles[2] },
    ];

    return (
        <>
            <SubHero en="RE:BERRY EVENT" image="/images/bg-sub-06.jpg" />

            <section className="texture-paper py-20 lg:py-33 bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-top bg-cream">
                <div className="container-site">
                    <Reveal className="text-center">
                        <h2 className="font-display text-h2 tracking-[0.06em]">RE:BERRY Event</h2>
                    </Reveal>
                    <EventModal events={events} />
                </div>
            </section>

            <LocationSection />
        </>
    );
}

import { getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import ManagedEventList from '@/components/events/ManagedEventList';

export async function generateMetadata() {
    const t = await getTranslations('events');
    return { title: t('metaTitle') };
}

export default async function EventsPage() {
    const t = await getTranslations('events');

    return (
        <>
            <SubHero en="EVENT" title={t('pageTitle')} image="/images/bg-sub-06.jpg" />

            <section className="overflow-x-clip bg-[#F5F1EA] py-16 lg:py-24">
                <div className="container-site">
                    <ManagedEventList />
                </div>
            </section>

            <LocationSection />
        </>
    );
}

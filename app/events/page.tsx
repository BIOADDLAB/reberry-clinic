// app/events/page.tsx
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import Reveal from '@/components/motion/Reveal';
import EventModal from '@/components/ui/EventModal';

export const metadata = { title: '이벤트' };

const events = [
    { image: '/images/ev-01.jpg', title: '리베리의원 마포점 첫방문 Open Event' },
    { image: '/images/ev-02.jpg', title: '리베리의원 마포점 너를 위해 June 비했어' },
    { image: '/images/ev-03.jpg', title: '리베리의원 마포점 5세대 스킨부스터 리투오 런칭 특가' },
    { image: '/images/ev-01.jpg', title: '리베리의원 마포점 첫방문 Open Event' },
    { image: '/images/ev-02.jpg', title: '리베리의원 마포점 너를 위해 June 비했어' },
    { image: '/images/ev-03.jpg', title: '리베리의원 마포점 5세대 스킨부스터 리투오 런칭 특가' },
];

export default function EventsPage() {
    return (
        <>
            <SubHero en="RE:BERRY EVENT" image="/images/bg-sub-06.jpg" />

            <section className="texture-paper py-20 lg:py-33 bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-center lg:bg-repeat bg-cream">
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

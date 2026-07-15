import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';

export const metadata = { title: '시술결과' };

export default function ReviewsPage() {
    return (
        <>
            <SubHero en="Before &amp; After" image="/images/bg-sub-05.jpg" />

            <LocationSection />
        </>
    );
}

import SkinColumnDetail from '@/components/column/SkinColumnDetail';
import LocationSection from '@/components/ui/LocationSection';
import SubHero from '@/components/ui/SubHero';

interface SkinColumnDetailPageProps {
    params: Promise<{ id: string }>;
}

export default async function SkinColumnDetailPage({ params }: SkinColumnDetailPageProps) {
    const { id } = await params;

    return (
        <main>
            <SubHero en="Column" title="피부칼럼" image="/images/bg-sub-07.jpg" />
            <SkinColumnDetail docId={id} />
            <LocationSection />
        </main>
    );
}

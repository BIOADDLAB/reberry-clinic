import { notFound } from 'next/navigation';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import { treatments, findTreatment, categoryLabel } from '@/components/lib/treatments';

interface Params {
    params: Promise<{ category: string; slug: string }>;
}

// treatments.ts 데이터에서 18개 주소를 자동 생성
export function generateStaticParams() {
    return treatments.map((t) => ({ category: t.category, slug: t.slug }));
}

export async function generateMetadata({ params }: Params) {
    const { category, slug } = await params;
    const t = findTreatment(category, slug);
    if (!t) return {};
    return {
        title: `${t.name} | ${categoryLabel[t.category]}`,
        description: `${t.definition.title} — ${t.definition.text}`,
    };
}

// 서브 히어로 배경: 카테고리별 (bg-sub-)
const heroImage: Record<string, string> = {
    signature: '/images/bg-sub-02.jpg',
    skin: '/images/bg-sub-03.jpg',
    aging: '/images/bg-sub-04.jpg',
};

export default async function TreatmentPage({ params }: Params) {
    const { category, slug } = await params;
    const t = findTreatment(category, slug);
    if (!t) notFound();

    return (
        <>
            <SubHero en={t.en} title={t.name} image={heroImage[t.category]} />

            <LocationSection />
        </>
    );
}

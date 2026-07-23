import SkinColumnList from '@/components/column/SkinColumnList';
import LocationSection from '@/components/ui/LocationSection';
import SubHero from '@/components/ui/SubHero';
import Image from 'next/image';

export default function ColumnPage() {
    return (
        <main>
            <SubHero en="Column" image="/images/bg-sub-07.jpg" />
            <section className="relative">
                <Image
                    src="/images/bg-texture-08.jpg"
                    alt=""
                    fill
                    quality={80}
                    sizes="100vw"
                    className="object-cover"
                />
                <SkinColumnList />
            </section>
            <LocationSection />
        </main>
    );
}

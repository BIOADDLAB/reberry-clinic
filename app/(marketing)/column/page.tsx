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
                <div className="container-site h-220  relative">
                    <h2 className="text-center pt-40 text-h2 font-bold tracking-tight">닥터파이톤의 피부칼럼</h2>
                </div>
            </section>
            <LocationSection />
        </main>
    );
}

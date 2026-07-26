import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import Reveal from '@/components/motion/Reveal';
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';

const images = ['/images/img-step-01.jpg', '/images/img-step-02.jpg', '/images/img-step-03.jpg'];

export default async function StepPlan() {
    const t = await getTranslations('stepPlan');
    const steps = (t.raw('steps') as { title: string; desc: string }[]).map((s, i) => ({
        ...s,
        no: String(i + 1).padStart(2, '0'),
        image: images[i],
    }));

    return (
        <section className="relative texture-paper py-20 lg:pt-35 lg:pb-30">
            <Image src="/images/bg-texture-06.jpg" alt="" fill quality={85} sizes="100vw" className="object-cover" />
            <div className="container-site relative">
                <Reveal className="text-center">
                    <p className="font-display text-h2">3 Step Plan</p>
                    <h2 className="mt-6.75 tracking-tighter text-h2">
                        {t.rich('headline', {
                            hl: (chunks) => <strong className="font-bold">{chunks}</strong>,
                            mob: () => <br className="block md:hidden" />,
                        })}
                    </h2>
                </Reveal>
                <RevealGroup className="mx-auto mt-12 grid max-w-md gap-7.25 lg:mt-18 lg:max-w-5xl lg:grid-cols-3">
                    {steps.map((s) => (
                        <RevealItem key={s.no} className="overflow-hidden bg-cocoa text-cream">
                            <div className="relative aspect-[4/3]">
                                <Image
                                    src={s.image}
                                    alt={s.title}
                                    fill
                                    quality={85}
                                    sizes="(max-width: 1024px) 100vw, 300px"
                                    className="object-cover"
                                />
                            </div>
                            <div className="p-10">
                                <p className="font-display text-h3">Step {s.no}</p>
                                <h3 className="mt-3.75 text-medium font-bold">{s.title}</h3>
                                <p className="mt-3 whitespace-pre-line text-small font-medium leading-6">{s.desc}</p>
                            </div>
                        </RevealItem>
                    ))}
                </RevealGroup>
            </div>
        </section>
    );
}

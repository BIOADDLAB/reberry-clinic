import Image from 'next/image';
import Reveal from '@/components/motion/Reveal';
import type { Treatment } from '@/components/lib/treatments';
import TextureBackground from '@/components/ui/TextureBackground';

interface Props {
    treatment: Treatment;
    name: string;
}

const pad = (number: number) => String(number).padStart(2, '0');
const backgroundImage = (treatment: Treatment) => `/images/bg-ex-${pad(treatment.visual)}.jpg`;

export default function TreatmentIntroSection({ treatment, name }: Props) {
    return (
        <section className="relative overflow-hidden py-20 lg:py-28">
            <Image
                src={backgroundImage(treatment)}
                alt=""
                fill
                unoptimized
                sizes="100vw"
                className="object-cover"
            />
            <div className="absolute inset-0 bg-cream/35" />

            <div className="container-site relative">
                <div className="mx-auto max-w-5xl">
                    <Reveal className="text-center">
                        <p className="font-display text-h2 tracking-[0.08em] text-cocoa">{treatment.en}</p>
                        {treatment.headline && (
                            <h2 className="mt-3 text-h2 font-light leading-snug text-cocoa">
                                {treatment.headline.light}
                                <br className="md:hidden" />
                                <strong className="font-bold">{treatment.headline.strong}</strong>
                            </h2>
                        )}
                    </Reveal>

                    <Reveal
                        className="relative mx-auto mt-12 max-w-[494px] overflow-hidden rounded-[18px] shadow-md lg:mt-16"
                        delay={0.08}
                    >
                        <TextureBackground src="/images/bg-texture-05.jpg" sizes="560px" />
                        <article className="relative px-8 py-10 md:px-11 md:py-12">
                            <span className="font-display block border-y border-cocoa/35 py-2 text-small tracking-[0.12em] text-cocoa">
                                {name}
                            </span>
                            <h3 className="mt-7 text-h2 font-bold leading-snug text-cocoa">
                                {treatment.definition.title}
                            </h3>
                            <span className="mt-5 block h-8 w-px bg-cocoa" aria-hidden />
                            <p className="mt-5 whitespace-pre-line text-small font-medium leading-7 text-cocoa">
                                {treatment.definition.text}
                            </p>
                        </article>
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

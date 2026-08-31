import type { CSSProperties } from 'react';
import Image from 'next/image';
import Reveal from '@/components/motion/Reveal';
import { zoom } from '@/components/lib/motion';
import { cn } from '@/components/lib/cn';
import type { Treatment } from '@/components/lib/treatments';
import TextureBackground from '@/components/ui/TextureBackground';

interface Props {
    treatment: Treatment;
    name: string;
    modelAlt: string;
    isKo: boolean;
}

const pad = (number: number) => String(number).padStart(2, '0');
const modelImage = (treatment: Treatment) => `/images/img-ex-${pad(treatment.visual)}.png`;
const modelBackground = (treatment: Treatment) => `/images/bg-ex-${pad(treatment.visual)}.jpg`;

export default function TreatmentIntroSection({ treatment, name, modelAlt, isKo }: Props) {
    return (
        <section className="relative overflow-hidden">
            <Image
                src={modelBackground(treatment)}
                alt=""
                fill
                unoptimized
                sizes="100vw"
                className="object-cover [backface-visibility:hidden]"
            />
            <div className="absolute inset-0 bg-cream/25" />
            <div className="container-site relative py-20 lg:pt-26.25 lg:pb-0">
                <Reveal className="text-center">
                    <p className="font-display text-h2 tracking-[0.08em]">{treatment.en}</p>
                    {treatment.headline && (
                        <h2 className="mt-3 font-light text-h2">
                            {treatment.headline.light}
                            <br className="block md:hidden" />
                            <strong className="font-bold">{treatment.headline.strong}</strong>
                        </h2>
                    )}
                </Reveal>

                <div className="relative -mx-6 mt-8 h-80 min-[1100px]:hidden">
                    <Image
                        src={modelImage(treatment)}
                        alt={modelAlt}
                        fill
                        quality={88}
                        sizes="100vw"
                        className="object-contain object-bottom"
                    />
                </div>

                <div
                    className="relative mx-auto mt-12 w-full max-w-(--gw) min-[1100px]:h-(--gh) lg:mt-17"
                    style={
                        {
                            '--gw': `${treatment.visualW}px`,
                            '--gh': `${treatment.visualH}px`,
                        } as CSSProperties
                    }
                >
                    <Reveal
                        className={cn(
                            'relative z-10 mx-auto -mt-20 w-full max-w-[494px] shadow-md min-[1100px]:z-0 min-[1100px]:mx-0 min-[1100px]:mt-3',
                            isKo ? 'overflow-hidden min-[1100px]:h-[432px]' : 'min-[1100px]:min-h-[432px]',
                        )}
                    >
                        <TextureBackground
                            src="/images/bg-texture-05.jpg"
                            sizes="494px"
                            className="rounded-[10px]"
                        />
                        <div
                            className={cn(
                                'relative px-9 py-11 lg:pl-22 lg:pt-13',
                                isKo ? 'lg:pb-0 lg:pr-2' : 'lg:pb-11 lg:pr-8',
                            )}
                        >
                            <span className="font-display block border-t border-b border-cocoa/40 px-4 py-1 text-small tracking-[0.15em]">
                                RE:BERRY
                            </span>
                            <p className="font-display mt-7 pl-2.5 text-small text-latte">{treatment.en}</p>
                            <h3
                                className={cn(
                                    'pl-2.5 font-bold',
                                    isKo ? 'max-w-[13em] text-h2' : 'max-w-[11em] text-h3',
                                )}
                            >
                                {treatment.definition.title}
                            </h3>
                            <span className="mt-5 ml-5 block h-8 w-px bg-cocoa" aria-hidden />
                            <p
                                className={cn(
                                    'mt-5 pl-2.5 whitespace-pre-line font-medium tracking-tight',
                                    isKo
                                        ? 'max-w-[15em] text-lead leading-[30px]!'
                                        : 'max-w-[12em] text-medium leading-[26px]!',
                                )}
                            >
                                {treatment.definition.text}
                            </p>
                        </div>
                    </Reveal>

                    <Reveal variants={zoom} className="pointer-events-none absolute inset-0 z-10 hidden min-[1100px]:block">
                        <Image
                            src={modelImage(treatment)}
                            alt={modelAlt || name}
                            fill
                            quality={90}
                            sizes="(max-width: 768px) 100vw, 950px"
                            className="object-contain object-right-bottom"
                        />
                    </Reveal>
                </div>
            </div>
        </section>
    );
}

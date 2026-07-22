'use client';

import Image from 'next/image';
import SubHero from '../../components/ui/SubHero';
import Reveal from '@/components/motion/Reveal';
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';
import LocationSection from '@/components/ui/LocationSection';
import Eyebrow from '@/components/ui/Eyebrow';

const promises = [
    {
        no: '01',
        image: '/images/bg-texture-03.jpg',
        text: '우리는 시술의 순간보다 \n변화의 시간을 더 중요하게 생각합니다. \n한 번의 만족으로 끝나는 진료가 아닌, \n오래도록 신뢰할 수 있는 결과를 약속합니다. \n처음 진단부터 사후관리까지, \n한 사람의 아름다움을 끝까지 함께하겠습니다.',
    },
    {
        no: '02',
        image: '/images/bg-texture-04.jpg',
        text: '우리는 더 많은 시술보다 \n더 정확한 진단을 먼저 생각합니다. \n눈에 보이는 변화보다 당신에게 가장 필요한 변화를 고민합니다. \n객관적인 데이터와 의료진의 경험으로, \n당신만의 아름다움을 책임 있게 설계하겠습니다.',
    },
];

export default function AboutPage() {
    return (
        <>
            <SubHero en="WE ARE RE:BERRY" image="/images/bg-sub-01.jpg" />

            <section className="bg-cream py-20 lg:py-33 bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-center bg-fixed">
                <div className="container-site">
                    <Reveal className="mx-auto max-w-249.5 flex flex-col justify-between items-start gap-10 mb-10 lg:flex-row lg:items-end lg:gap-0 lg:mb-[26px]">
                        <div>
                            <div className="flex w-fit flex-col">
                                <div className="h-[2px] w-full bg-cocoa rounded-[50%]" />
                                <Eyebrow className="inline-flex py-1 px-4.5 text-h2 tracking-[0.15em]">
                                    RE:BERRY
                                </Eyebrow>
                                <div className="h-[2px] w-full bg-cocoa rounded-[50%]" />
                            </div>

                            <h2 className="mt-6 text-[28px] leading-tight font-bold lg:text-h2">
                                당신의 아름다움을
                                <br />
                                <span className="font-light">가장</span>{' '}
                                <strong className="hl-down font-bold">과학적으로 설계합니다</strong>
                            </h2>
                            <p className="mt-8 text-base font-semibold mb-0 lg:mt-[55px] lg:text-medium lg:mb-[26px]">
                                리베리의원은 단순히 시술을 권하는 병원이 아닙니다.
                                <br />
                                객관적인 데이터와 의료진의 경험을 바탕으로
                                <br />한 사람만을 위한 맞춤 진료를 설계합니다.
                            </p>
                        </div>
                        <div className="relative w-[180px] self-end lg:w-[380px] lg:self-auto">
                            {/* #ISSUE SVG는 최적화 불필요, img 태그 유지 */}
                            <img src="/images/i-sig-01.svg" alt="" className="w-full h-auto" />
                        </div>
                    </Reveal>

                    <Reveal delay={0.1} className="relative mx-auto mt-12 max-w-249.5">
                        <div className="relative aspect-[16/10] w-full h-[280px] overflow-hidden rounded-[10px] lg:h-[469px]">
                            <Image
                                src="/images/bg-tour-01.jpg"
                                alt="리베리의원 내부"
                                fill
                                quality={88}
                                sizes="(max-width: 1024px) 100vw, 900px"
                                className="object-cover rounded-[10px]"
                            />
                            {/* #ISSUE SVG 로고, img 태그 유지 */}
                            <img
                                src="/images/logo.svg"
                                alt=""
                                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[120px] lg:w-auto lg:bottom-10"
                            />
                        </div>
                    </Reveal>
                </div>
            </section>

            <section className="py-20 text-cream bg-[url('/images/bg-about-card.jpg')] bg-cover bg-center bg-fixed lg:py-28 lg:py-50">
                <div className="container-site">
                    <Reveal className="text-center">
                        <h2 className="font-display text-h2 tracking-[0.08em] ">RE:BERRY PROMISE</h2>
                    </Reveal>
                    <RevealGroup className="mx-auto mt-12 grid max-w-[957px] gap-6 md:grid-cols-2 lg:gap-[37px] lg:mt-18.75">
                        {promises.map((p) => (
                            <RevealItem key={p.no} className="bg-sand/90 text-cocoa rounded-[10px] overflow-hidden">
                                <p className="font-display py-2 text-center  tracking-[0.2em] text-lead">
                                    PROMISE {p.no}
                                </p>
                                <div className="relative aspect-[5/4] w-full h-[240px] lg:h-[318px]">
                                    <Image
                                        src={p.image}
                                        alt={`리베리의원 약속 ${p.no}`}
                                        fill
                                        sizes="(max-width: 768px) 100vw, 50vw"
                                        className="object-cover object-right"
                                    />
                                </div>
                                <p className="whitespace-pre-line flex h-auto items-center  text-center px-6 py-8 text-medium leading-[30px] tracking-tighter lg:text-left lg:h-[228px] lg:py-2 break-keep">
                                    {p.text}
                                </p>
                            </RevealItem>
                        ))}
                    </RevealGroup>
                </div>
            </section>

            <LocationSection />
        </>
    );
}

import Image from 'next/image';
import { getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import Reveal from '@/components/motion/Reveal';
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';
import LocationSection from '@/components/ui/LocationSection';
import Eyebrow from '@/components/ui/Eyebrow';

export default async function AboutPage() {
    const t = await getTranslations('about');
    const promises = [
        { no: '01', image: '/images/bg-texture-03.jpg', text: t('promise1') },
        { no: '02', image: '/images/bg-texture-04.jpg', text: t('promise2') },
    ];

    return (
        <>
            <SubHero en="WE ARE RE:BERRY" image="/images/bg-sub-01.jpg" />

            <section className="bg-cream py-20 lg:py-33 bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-top">
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

                            {/* #ISSUE: hl-down 하이라이트가 걸린 헤드라인은 어순이 바뀌면 하이라이트 위치가 깨진다.
                                (영어에서 "We design" 뒤에 빈 회색 조각만 남던 문제) → 언어별로 직접 작성 */}
                            <h2 className="mt-6 text-[28px] leading-tight font-bold lg:text-h2">
                                {t.rich('designHeadline', {
                                    br: () => <br />,
                                    light: (chunks) => <span className="font-light">{chunks}</span>,
                                    hl: (chunks) => <strong className="hl-down font-bold">{chunks}</strong>,
                                })}
                            </h2>
                            <p className="mt-8 text-base font-semibold mb-0 lg:mt-[55px] lg:text-medium lg:mb-[26px]">
                                {t.rich('designSub', { br: () => <br /> })}
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
                                alt={t('interiorAlt')}
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

            <section className="py-20 text-cream bg-[url('/images/bg-about-card.jpg')] bg-cover bg-top lg:py-28 lg:py-50">
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
                                        alt={t('promiseAlt', { no: p.no })}
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

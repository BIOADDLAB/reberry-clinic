import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import Reveal from '@/components/motion/Reveal';
import { site } from '@/components/lib/site';
import DoctorMore from '@/components/ui/DoctorMore';

export async function generateMetadata() {
    const t = await getTranslations('doctors');
    return { title: t('metaTitle') };
}

export default async function DoctorsPage() {
    const t = await getTranslations('doctors');
    const locale = await getLocale();
    const tLabels = await getTranslations('labels');
    const directorName = locale !== 'ko' && tLabels.has(site.director) ? tLabels(site.director) : site.director;
    const career = t.raw('career') as string[];
    const certification = t.raw('certification') as string[];

    return (
        <>
            <SubHero en="RE:BERRY Specialist" image="/images/bg-sub-01.jpg" />

            <section className="bg-cream py-30 lg:py-24">
                <div className="container-site text-center">
                    <Reveal>
                        <h2 className="font-display text-h2 tracking-[0.06em]">RE:BERRY Specialist</h2>
                        <div className="flex w-fit flex-col mx-auto mt-8">
                            <div className="h-[2px] w-full bg-cocoa rounded-[50%]" />
                            <p className="font-display mx-auto px-6 py-2 text-h3 tracking-tight!">
                                Academic Background &amp; License
                            </p>
                            <div className="h-[2px] w-full bg-cocoa rounded-[50%]" />
                        </div>

                        <p className="mt-8 text-medium leading-[30px]">
                            {t.rich('bio', {
                                br: () => <br />,
                                brMobile: () => <br className="block lg:hidden" />,
                            })}
                        </p>
                    </Reveal>
                </div>
            </section>

            <section className="texture-paper py-33 lg:py-28 bg-[url('/images/bg-texture-07.jpg')] bg-cover bg-center bg-fixed bg-cream">
                <div className="container-site grid items-start gap-12 lg:grid-cols-[356px_575px] lg:justify-center lg:gap-[100px]">
                    <Reveal className="mx-auto w-full max-w-xs lg:max-w-full">
                        <div className="relative aspect-[356/576] w-full overflow-hidden rounded-full">
                            <Image
                                src="/images/img-doc-02.jpg"
                                alt={t('directorImgAlt')}
                                fill
                                quality={90}
                                sizes="(max-width: 1024px) 320px, 356px"
                                className="object-cover object-top"
                            />
                        </div>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="flex flex-wrap items-center ml-4">
                            <span className="text-h2 font-extrabold mr-[10px]">{directorName}</span>
                            <span className="text-lead mr-[15px]">{t('directorTitle')}</span>
                            <Image
                                src="/images/i-sig-02.svg"
                                alt={t('signatureAlt')}
                                width={180}
                                height={64}
                                className="h-[64px] w-auto"
                            />
                        </p>
                        <p className="mt-4.25 text-[20px]/[30px] font-bold leading-relaxed ml-4">
                            {t.rich('education', { br: () => <br /> })}
                        </p>
                        <p className="font-display mt-6 inline-block w-fit px-1.5 text-small bg-gradient-to-b from-transparent from-[50%] to-[#CDC5B6] to-[50%] ml-4">
                            Career
                        </p>
                        <ul className="mt-3 space-y-1 text-small leading-[24px]">
                            {career.map((c) => (
                                <li key={c} className="flex items-start">
                                    <span className="mr-1.5 mt-[2px] shrink-0 text-lg font-bold leading-[24px]">·</span>
                                    <span>{c}</span>
                                </li>
                            ))}
                        </ul>
                        <p className="font-display mt-5.5 inline-block w-fit px-1.5 text-small bg-gradient-to-b from-transparent from-[50%] to-[#CDC5B6] to-[50%] ml-4">
                            Certification · Key Doctor
                        </p>
                        <ul className="mt-3 space-y-1 text-small leading-[24px]">
                            {certification.map((c) => (
                                <li key={c} className="flex items-start">
                                    <span className="mr-1.5 mt-[2px] shrink-0 text-lg font-bold leading-[24px]">·</span>
                                    <span>{c}</span>
                                </li>
                            ))}
                        </ul>
                        <DoctorMore />
                    </Reveal>
                </div>
            </section>

            <section className="relative overflow-hidden bg-cocoa text-cream">
                <div className="container-site lg:px-0! text-center border-r-0 lg:border-r border-cream py-20 lg:py-30">
                    <Reveal>
                        <h2 className="font-display text-h2 leading-[48px] text-cream tracking-[3.24em]">
                            RE:BERRY PROMISE
                        </h2>
                        <p className="mt-2.25 text-h2 leading-[51px] font-light ">
                            {t.rich('promiseHeadline', {
                                br: () => <br className="block lg:hidden" />,
                                hl: (chunks) => <strong className="font-bold">{chunks}</strong>,
                            })}
                        </p>
                    </Reveal>
                    <div className="relative pt-4 mt-12 lg:pt-12">
                        <div className="absolute top-0 right-0 hidden w-[200vw] border-t border-cream lg:block" />
                        <Reveal className="mx-auto max-w-2xl">
                            <video
                                className="aspect-video w-full bg-deep object-cover rounded-[10px]"
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="metadata"
                            >
                                <source src="/videos/video-pc.mp4" type="video/mp4" />
                                {t('videoFallback')}
                            </video>
                            <p className="mt-4 text-small text-cream/80">{t('conferenceCaption')}</p>
                        </Reveal>
                    </div>
                </div>
            </section>

            <LocationSection />
        </>
    );
}

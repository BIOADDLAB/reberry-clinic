import Image from 'next/image';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getLocale, getTranslations } from 'next-intl/server';
import Eyebrow from '@/components/ui/Eyebrow';
import BASlider from '@/components/ui/BASlider';
import MoreView from '@/components/ui/MoreView';
import { zoom } from '@/components/lib/motion';
import { site } from '@/components/lib/site';
import LocationSection from '@/components/ui/LocationSection';
import WhySection from '@/components/home/WhySection';
import Reveal from '@/components/motion/Reveal';
import TourSwiper from '@/components/ui/TourSwioer';
import MainSidePopups from '@/components/home/MainSidePopups';
import ManagedEventList from '@/components/events/ManagedEventList';

const HERO_IMG = '/images/bg-main-hiro.jpg';

export const metadata: Metadata = {
    alternates: {
        canonical: '/',
    },
};

export default async function Home() {
    const t = await getTranslations('home');
    const tEvents = await getTranslations('events');
    const locale = await getLocale();
    const tLabels = await getTranslations('labels');
    const directorName = locale !== 'ko' && tLabels.has(site.director) ? tLabels(site.director) : site.director;

    return (
        <>
            <MainSidePopups />

            {/* 메인 히어로 영역 */}
            {/* #ISSUE: 배경 높이 디자인팀 의견 반영 100vh로 변경 - 기존코드는 임시로 주석처리 */}
            {/* <section className="relative flex h-[70vh] min-h-[600px] max-h-[850px] w-full items-center justify-center overflow-hidden text-center text-cream"> */}
            <section className="relative flex h-dvh w-full items-center justify-center overflow-hidden text-center text-cream">
                <Image
                    src={HERO_IMG}
                    alt={t('heroImgAlt')}
                    fill
                    priority
                    unoptimized
                    quality={90}
                    sizes="100vw"
                    className="object-cover"
                />
                <Reveal className="relative px-6">
                    <p className="text-h1-sm">{t('heroTagline')}</p>
                    <h1 className="notranslate mt-3 flex justify-center">
                        <Image
                            src="/images/logo-main.svg"
                            alt="마포 리베리의원 RE:BERRY"
                            width={352}
                            height={38}
                            priority
                            className="h-auto w-[240px] md:w-[300px]"
                        />
                    </h1>
                    <div className="mt-11 flex justify-center">
                        <Link
                            href="/treatments/signature/pigment"
                            className="text-lead min-w-[150px] border border-cream/70 px-3.75 py-1.25  transition-colors hover:bg-cocoa/50 hover:text-white hover:shadow-sm"
                        >
                            SIGNATURE
                        </Link>
                    </div>
                </Reveal>

                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 md:hidden">
                    <div className="flex flex-col items-center gap-1.5">
                        <div className="flex h-8 w-5 items-start justify-center rounded-full border-[1.5px] border-white p-1">
                            <div className="h-1.5 w-0.5 rounded-full bg-white animate-wheel" />
                        </div>
                        <img src="/images/i-arr-down-03.svg" alt="" className="w-2" aria-hidden />
                    </div>
                </div>

                {/* 태블릿·PC — 기존 scroll-mouse 그대로 */}
                <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 md:block">
                    <div className="scroll-mouse" aria-hidden />
                </div>
            </section>

            {/* 전 후 사진 영역 */}
            <section className="relative py-20 lg:py-28 bg-[url('/images/bg-texture-06.jpg')] bg-cover bg-top">
                <div className="container-site relative">
                    <Reveal className="text-center">
                        <Eyebrow>RE:BERRY</Eyebrow>
                        <div className="flex items-center justify-center mt-7">
                            <span className="font-display leading-[10px] text-[90px] mr-2 text-latte" aria-hidden>
                                “
                            </span>
                            {/* #ISSUE: 자동 번역에 맡기면 어순이 바뀌면서 <strong class="hl-down"> 위치가 흐트러진다.
                                → 하이라이트가 걸린 헤드라인은 messages/*.json 에 언어별로 직접 작성해둔다 */}
                            <h2 className=" text-h2  font-medium  tracking-tighter">
                                {t.rich('heroHeadline', {
                                    mob: () => <br className="block md:hidden" />,
                                    hl: (chunks) => <strong className="hl-down font-bold">{chunks}</strong>,
                                })}
                            </h2>
                            <span className="font-display leading-[10px] ml-2 text-[90px] text-latte" aria-hidden>
                                ”
                            </span>
                        </div>
                        <p className="mt-9 text-lead font-medium tracking-tight">
                            {t.rich('heroSubline', { br: () => <br /> })}
                        </p>
                        {/* #TODO: 시그니처-볼륨리프팅 페이지로 이동 */}
                        <div className="mt-7">
                            <MoreView href="/reviews" dark />
                        </div>
                    </Reveal>
                    <Reveal className="mx-auto mt-14 max-w-4xl lg:mt-16">
                        <BASlider light />
                    </Reveal>
                </div>
            </section>

            {/* 진행 중인 이벤트 영역 */}
            <section className="overflow-hidden bg-cream py-20 lg:py-32">
                <div className="container-site">
                    <Reveal className="text-center">
                        <h2 className="font-display text-h2 tracking-[0.08em]">RE:BERRY EVENT</h2>
                        <p className="mt-3 text-lead font-semibold text-cocoa">{tEvents('currentTitle')}</p>
                    </Reveal>
                    <ManagedEventList limit={3} />
                    <div className="mt-10 text-center">
                        <MoreView href="/events" dark />
                    </div>
                </div>
            </section>

            {/* 의사소개 영역 */}
            <section className="texture-paper py-16 lg:py-28 bg-[url('/images/bg-texture-07.jpg')] bg-cover bg-top bg-cream">
                {/* #STYLE: PC에서 사진 영역이 과하게 넓어 보이지 않도록 그리드 비율 최적화 (2fr_3fr -> 1fr_1.3fr) */}
                <div className="container-site grid items-center gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
                    {/* #STYLE: PC 해상도 진입 시 사진을 오른쪽(lg:ml-auto lg:mr-0)으로 밀어 텍스트와의 중앙 균형을 맞춤 */}
                    <Reveal
                        variants={zoom}
                        className="mx-auto w-full max-w-[260px] sm:max-w-xs lg:max-w-sm lg:ml-auto lg:mr-0"
                    >
                        <div className="arch-full relative aspect-[3/4]">
                            <Image
                                src="/images/img-doc-02.jpg"
                                alt={t('directorImgAlt', { name: directorName })}
                                fill
                                quality={88}
                                sizes="(max-width: 1024px) 320px, 400px"
                                className="object-cover object-center rounded-full"
                            />
                        </div>
                    </Reveal>

                    <Reveal delay={0.1} className="flex flex-col text-center lg:text-left">
                        <p className="font-display text-h2 order-1">RE:BERRY</p>

                        <p className="order-2 mt-2 text-[22px] font-extrabold lg:order-3 lg:mt-9 lg:!text-[30px]">
                            {directorName} <span className="ml-1 text-lead font-normal">{t('directorTitle')}</span>
                        </p>

                        {/* #ISSUE: <br /> 이 한국어 어절 기준으로 촘촘히 박혀 있어 번역 모드에서
                            문장 한가운데가 끊겼음 → br-ko 를 붙여 한국어에서만 적용되게 함 */}
                        <p className="order-3 mt-6 text-small font-medium leading-relaxed break-keep px-2 sm:px-0 lg:order-2 lg:mt-8 lg:text-medium lg:leading-loose">
                            {t.rich('directorBio', {
                                brD: () => <br className="br-ko hidden lg:block" />,
                                brM: () => <br className="br-ko block lg:hidden max-[340px]:hidden" />,
                                br: () => <br />,
                            })}
                        </p>

                        <div className="order-4 mt-6 flex justify-center lg:justify-start">
                            <MoreView href="/doctors" dark />
                        </div>
                    </Reveal>
                </div>
            </section>

            {/* 이유 영역 */}
            <WhySection />

            {/* 케어 영역 */}
            <section className="flex justify-center bg-cocoa text-cream">
                <div className="flex w-full max-w-[1366px] flex-col lg:flex-row min-[1580px]:w-[1366px]">
                    {/* 왼쪽 영역 */}
                    <div className="relative hidden shrink-0 lg:block lg:aspect-auto lg:w-[36%] min-[1580px]:w-[497px]">
                        <Reveal variants={zoom} className="absolute inset-0">
                            <Image src="/images/bg-texture-01.jpg" alt="" fill quality={88} className="object-cover" />
                        </Reveal>
                    </div>

                    {/* 오른쪽 영역 */}
                    <div className="flex w-full flex-col lg:w-[64%] lg:border-r lg:border-cream min-[1580px]:w-[869px]">
                        <div className="flex flex-1 flex-col justify-center lg:border-b lg:border-cream px-6 text-center lg:px-16 lg:pl-[160px] lg:text-left [padding-top:clamp(48px,_4px_+_11.7vw,_189px)] [padding-bottom:clamp(32px,_19px_+_3.49vw,_74px)]">
                            <Reveal>
                                <h2 className="font-display text-h2 leading-11.5">
                                    Attentive Care,
                                    <br />
                                    Responsible Results
                                </h2>
                            </Reveal>

                            <Reveal
                                variants={zoom}
                                className="relative mx-auto mt-8 aspect-[3/4] w-[50%] max-w-[220px] overflow-hidden rounded-full lg:hidden"
                            >
                                <Image
                                    src="/images/bg-texture-01.jpg"
                                    alt=""
                                    fill
                                    quality={88}
                                    className="object-cover"
                                />
                            </Reveal>

                            <Reveal delay={0.07}>
                                <span className="block mx-auto w-px h-8.5 bg-cream/80 mt-8 lg:hidden"></span>
                            </Reveal>

                            <Reveal delay={0.1}>
                                <p className="text-small mt-8 leading-6.5 lg:mt-10">
                                    {t.rich('careText', { br: () => <br /> })}
                                </p>
                            </Reveal>
                        </div>

                        {/* 하단 버튼 영역 */}
                        <div className="flex items-center justify-center px-6 pt-2.5 pb-14 lg:justify-start lg:px-16 lg:pl-[160px] lg:[padding-top:clamp(32px,_21px_+_2.99vw,_68px)] lg:[padding-bottom:clamp(40px,_14px_+_6.97vw,_124px)]">
                            {/* #LINK /about */}
                            {/* #STYLE flex, border, transition */}
                            {/* #ISSUE 모바일 padding-top: 40px(pt-10), padding-bottom: 56px(pb-[14px]) 적용 */}
                            <Reveal delay={0.15}>
                                <Link
                                    href="/about"
                                    className="text-small flex h-[46px] w-[147px] items-center justify-center border border-cream tracking-wide transition-colors hover:bg-cream hover:text-cocoa"
                                >
                                    VISIT RE:BERRY
                                </Link>
                            </Reveal>
                        </div>
                    </div>
                </div>
            </section>

            <TourSwiper />

            <LocationSection />
        </>
    );
}

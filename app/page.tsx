import Image from 'next/image';
import Link from 'next/link';
import Eyebrow from '@/components/ui/Eyebrow';
import BASlider from '@/components/ui/BASlider';
import MoreView from '@/components/ui/MoreView';
import { zoom } from '@/components/lib/motion';
import { site } from '@/components/lib/site';
import LocationSection from '@/components/ui/LocationSection';
import WhySection from '../components/home/WhySection';
import Reveal from '../components/motion/Reveal';
import TourSwiper from '../components/ui/TourSwioer';

const HERO_IMG = '/images/bg-main-hiro.jpg';

export default function Home() {
    return (
        <>
            {/* 메인 히어로 영역 */}
            <section className="relative flex h-[70vh] min-h-[600px] max-h-[850px] w-full items-center justify-center overflow-hidden text-center text-cream">
                {/* #TODO: 이미지 최적화 개선 */}
                <Image
                    src={HERO_IMG}
                    alt="리베리의원 메인 비주얼"
                    fill
                    priority
                    unoptimized
                    quality={90}
                    sizes="100vw"
                    className="object-cover"
                />
                <Reveal className="relative px-6">
                    <p className="text-h1-sm">당신의 뷰티 주치의</p>
                    {/* #ISSUE: 카페24클래식타입 폰트 -> Belleza 벨자 폰트로 변경함 */}
                    <h1 className="font-display font-normal text-h1-sm notranslate mt-1 text-h1 tracking-[-2%] ">
                        RE:BERRY
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
                <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
                    <div className="scroll-mouse" aria-hidden />
                </div>
            </section>

            {/* 전 후 사진 영역 */}
            <section className="relative py-20 lg:py-28 bg-[url('/images/bg-texture-06.jpg')] bg-repeat">
                <div className="container-site relative">
                    <Reveal className="text-center">
                        <Eyebrow>RE:BERRY</Eyebrow>
                        <div className="flex items-center justify-center mt-7">
                            <span className="font-display leading-[10px] text-[90px] mr-2 text-latte" aria-hidden>
                                “
                            </span>
                            <h2 className=" text-h2  font-medium  tracking-tighter">
                                한사람, 한 사람의 <br className="block md:hidden" />
                                <strong className="hl-down font-bold">고민에 집중한 결과</strong>
                            </h2>
                            <span className="font-display leading-[10px] ml-2 text-[90px] text-latte" aria-hidden>
                                ”
                            </span>
                        </div>
                        <p className="mt-9 text-lead font-medium tracking-tight">
                            상업적이지 않은, 진심 어린 치료로
                            <br />
                            여러분의 아름다움을 설계하겠습니다.
                        </p>
                        {/* #TODO: 시그니처-볼륨리프팅 페이지로 이동 */}
                        <div className="mt-7">
                            <MoreView href="/reviews" dark />
                        </div>
                    </Reveal>
                    <Reveal className="mx-auto mt-14 max-w-4xl lg:mt-16">
                        <BASlider label="피부" tags={['색소', '리프팅', '주사/홍조', '색소']} light />
                    </Reveal>
                </div>
            </section>

            {/* 의사소개 영역 */}
            <section className="texture-paper py-16 lg:py-28 bg-[url('/images/bg-texture-07.jpg')] bg-cover bg-center lg:bg-repeat bg-cream">
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
                                alt="유선민 대표원장"
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
                            {site.director} <span className="ml-1 text-lead font-normal">대표원장</span>
                        </p>

                        <p className="order-3 mt-6 text-small font-medium leading-relaxed break-keep px-2 sm:px-0 lg:order-2 lg:mt-8 lg:text-medium lg:leading-loose">
                            한 분 한 분의 이야기를 듣고,
                            <br className="hidden lg:block" />
                            그분의 아름다움을
                            <br className="block lg:hidden max-[340px]:hidden" />
                            빛나게 하는 시술을 제안하는 공간이 될 것입니다.
                            <br className="hidden lg:block" />
                            <br className="block lg:hidden max-[340px]:hidden" />
                            상담부터 시술, 사후관리까지 모든 과정을 제 손을 거쳐
                            <br className="block lg:hidden max-[340px]:hidden" />
                            직접, 세심하게 책임지는 곳.
                            <br className="hidden lg:block" />
                            상업적이지 않은, 진심
                            <br className="block lg:hidden max-[340px]:hidden" />
                            어린 치료로 여러분의 아름다움을 설계하겠습니다.
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
                                    리베리의원은 한 사람 한 사람의 피부에 맞춘 진료. <br />
                                    유행하는 시술보다 필요한 치료를, <br />
                                    과잉 진료보다 진심 어린 상담을, <br />
                                    일시적인 변화보다 오래 지속되는 만족을 추구합니다.
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

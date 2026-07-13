import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/motion/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';
import BASlider from '@/components/ui/BASlider';
import MoreView from '@/components/ui/MoreView';
import { zoom } from '@/components/lib/motion';
import { site } from '@/components/lib/site';

const HERO_IMG = '/images/bg-main-hiro.jpg';

export default function Home() {
    return (
        <main>
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

            <section className="relative py-20 lg:py-28 bg-[url('/images/bg-texture-06.jpg')] bg-repeat">
                <div className="container-site relative">
                    <Reveal className="text-center">
                        <Eyebrow>RE:BERRY</Eyebrow>
                        <div className="flex items-center justify-center mt-7">
                            <span className="font-display leading-[10px] text-[90px] mr-2 text-latte" aria-hidden>
                                “
                            </span>
                            <h2 className=" text-h2  font-medium  tracking-tighter">
                                한사람, 한 사람의 <strong className="hl-down font-bold">고민에 집중한 결과</strong>
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

            <section className="texture-paper py-20 lg:py-28 bg-[url('/images/bg-texture-07.jpg')] bg-repeat">
                <div className="container-site grid items-center gap-12 lg:grid-cols-[2fr_3fr] lg:gap-20">
                    <Reveal variants={zoom} className="mx-auto w-full max-w-xs lg:max-w-sm">
                        <div className="arch-full relative  aspect-[3/4]">
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
                    <Reveal delay={0.1}>
                        <p className="font-display text-h2">RE:BERRY</p>
                        <p className="mt-8 text-medium font-medium leading-loose">
                            한 분 한 분의 이야기를 듣고,
                            <br className="hidden lg:block" /> 그분의 아름다움을 빛나게 하는 시술을 제안하는 공간이 될
                            것입니다.
                            <br className="hidden lg:block" /> 상담부터 시술, 사후관리까지 모든 과정을 제 손을 거쳐
                            직접, 세심하게 책임지는 곳.
                            <br className="hidden lg:block" /> 상업적이지 않은, 진심 어린 치료로 여러분의 아름다움을
                            설계하겠습니다.
                        </p>
                        <p className="mt-9 text-[24px]  font-extrabold lg:text-[30px]">
                            {site.director} <span className="ml-1 text-lead font-normal">대표원장</span>
                        </p>
                        <div className="mt-6">
                            <MoreView href="/doctors" dark />
                        </div>
                    </Reveal>
                </div>
            </section>
        </main>
    );
}

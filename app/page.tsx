import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/motion/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';
import BASlider from '@/components/ui/BASlider';
import MoreView from '@/components/ui/MoreView';

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
                {/* <Image src="/images/bg-texture-06.jpg" alt="" fill quality={80} sizes="100vw" className="" /> */}
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
                        <div className="mt-7">
                            <MoreView href="/reviews" dark />
                        </div>
                    </Reveal>
                    <Reveal className="mx-auto mt-14 max-w-4xl lg:mt-16">
                        <BASlider label="피부" tags={['색소', '리프팅', '주사/홍조', '색소']} light />
                    </Reveal>
                </div>
            </section>
        </main>
    );
}

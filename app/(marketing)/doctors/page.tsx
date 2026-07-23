import Image from 'next/image';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import Reveal from '@/components/motion/Reveal';
import { site } from '@/components/lib/site';
import DoctorMore from '@/components/ui/DoctorMore';

export const metadata = { title: '의료진 소개' };

const career = ['현) 리베리의원 마포점 대표원장', '전) 리베리의원 화성병점점 원장', '전) 메이퓨어의원 왕십리점 원장'];
const certification = ['쥬베룩 마이스터', '레비나스 키닥터 브이로', '어드밴스 키닥터'];

export default function DoctorsPage() {
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
                            한 분 한 분의 이야기를 듣고,
                            <br className="" />
                            그분의 아름다움을 빛나게 하는 시술을 <br className="block lg:hidden" />
                            제안하는 공간이 될 것입니다.
                            <br />
                            <br className="block lg:hidden" />
                            상담부터 시술, 사후관리까지 모든 과정을
                            <br className="block lg:hidden" />
                            제 손을 거쳐 직접, 세심하게 책임지는 곳.
                            <br />
                            <br className="block lg:hidden" />
                            상업적이지 않은, 진심 어린 치료로
                            <br className="block lg:hidden" />
                            여러분의 아름다움을 설계하겠습니다.
                        </p>
                    </Reveal>
                </div>
            </section>

            <section className="texture-paper py-33 lg:py-28 bg-[url('/images/bg-texture-07.jpg')] bg-cover bg-top bg-cream">
                <div className="container-site grid items-start gap-12 lg:grid-cols-[356px_575px] lg:justify-center lg:gap-[100px]">
                    <Reveal className="mx-auto w-full max-w-xs lg:max-w-full">
                        <div className="relative aspect-[356/576] w-full overflow-hidden rounded-full">
                            <Image
                                src="/images/img-doc-02.jpg"
                                alt="유선민 대표원장"
                                fill
                                quality={90}
                                sizes="(max-width: 1024px) 320px, 356px"
                                className="object-cover object-top"
                            />
                        </div>
                    </Reveal>
                    <Reveal delay={0.1}>
                        <p className="flex flex-wrap items-center ml-4">
                            <span className="text-h2 font-extrabold mr-[10px]">유선민</span>
                            <span className="text-lead mr-[15px]">대표원장</span>
                            <Image
                                src="/images/i-sig-02.svg"
                                alt="서명"
                                width={180}
                                height={64}
                                className="h-[64px] w-auto"
                            />
                        </p>
                        <p className="mt-4.25 text-[20px]/[30px] font-bold leading-relaxed ml-4">
                            경희대학교 의과대학 졸업, 의사 (MD)
                            <br />
                            경희대학교 약학대학 졸업, 약사 (B.Pharm.)
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
                            경험을 넘어
                            <br className="block lg:hidden" />
                            <strong className="font-bold">근거를 이야기합니다</strong>
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
                                브라우저가 비디오 태그를 지원하지 않습니다.
                            </video>
                            <p className="mt-4 text-small text-cream/80">
                                2026년 대한비만미용학회(KOAT) 춘계학술대회 ▴
                            </p>
                        </Reveal>
                    </div>
                </div>
            </section>

            <LocationSection />
        </>
    );
}

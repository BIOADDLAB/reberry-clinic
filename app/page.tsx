import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/motion/Reveal';

const HERO_IMG = '/images/bg-main-hiro.jpg';

export default function Home() {
    return (
        <main>
            {/* #STYLE: 이미지 세로 해상도 한계를 고려해 h-[100svh]를 제거하고 반응형 높이 및 max-h 설정 */}
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
                    {/* #TODO: 카페24클래식타입 폰트 굵기 지원이 한가지만 가능해서 변경할듯 */}
                    <h1 className="font-title font-normal text-h1-sm notranslate mt-1 text-h1 ">RE:BERRY</h1>
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
        </main>
    );
}

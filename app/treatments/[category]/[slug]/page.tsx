import { notFound } from 'next/navigation';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import { treatments, findTreatment, categoryLabel } from '@/components/lib/treatments';
import Image from 'next/image';
import Reveal from '@/components/motion/Reveal';
import { zoom } from '@/components/lib/motion';

interface Params {
    params: Promise<{ category: string; slug: string }>;
}

// treatments.ts 데이터에서 18개 주소를 자동 생성
export function generateStaticParams() {
    return treatments.map((t) => ({ category: t.category, slug: t.slug }));
}

export async function generateMetadata({ params }: Params) {
    const { category, slug } = await params;
    const t = findTreatment(category, slug);
    if (!t) return {};
    return {
        title: `${t.name} | ${categoryLabel[t.category]}`,
        description: `${t.definition.title} — ${t.definition.text}`,
    };
}

// 서브 히어로 배경: 카테고리별 (bg-sub-)
const heroImage: Record<string, string> = {
    signature: '/images/bg-sub-02.jpg',
    skin: '/images/bg-sub-03.jpg',
    aging: '/images/bg-sub-04.jpg',
};

// 배경/인물 세트 이미지
const pad = (n: number) => String(n).padStart(2, '0');
const modelImage = (t: { visual: number }) => `/images/img-ex-${pad(t.visual)}.png`;
const modelBg = (t: { visual: number }) => `/images/bg-ex-${pad(t.visual)}.jpg`;

export default async function TreatmentPage({ params }: Params) {
    const { category, slug } = await params;
    const t = findTreatment(category, slug);
    if (!t) notFound();

    // 시그니처 여부
    const sig = t.signature;

    return (
        <>
            <SubHero en={t.en} title={t.name} image={heroImage[t.category]} />

            {/* 피부교정, 안티에이징 페이지 - 시술 소개 영역 */}
            {/* #TODO: 반응형 작업 조금 더 해야함/ 1050 정도가 어색함 */}
            {!sig && (
                <section className="relative overflow-hidden">
                    <Image src={modelBg(t)} alt="" fill quality={85} sizes="100vw" className="object-cover" />
                    <div className="absolute inset-0 bg-cream/25" />
                    <div className="container-site relative py-20 lg:pt-26.25 lg:pb-0">
                        <Reveal className="text-center">
                            <p className="font-display text-h2 tracking-[0.08em]">{t.en}</p>
                            {t.headline && (
                                <h2 className="mt-3 font-light text-h2">
                                    {t.headline.light}
                                    <br className="block md:hidden" />
                                    <strong className="font-bold">{t.headline.strong}</strong>
                                </h2>
                            )}
                        </Reveal>

                        {/* 모바일 인물 — 시안: 인물이 배경 위 상단, 카드가 아래에서 겹침 */}
                        <div className="relative -mx-6 mt-8 h-80 min-[1100px]:hidden">
                            <Image
                                src={modelImage(t)}
                                alt={`${t.name} 시술 모델`}
                                fill
                                quality={88}
                                sizes="100vw"
                                className="object-contain object-bottom"
                            />
                        </div>

                        <div
                            className="relative mx-auto mt-12 w-full max-w-(--gw) min-[1100px]:h-(--gh) lg:mt-17"
                            style={{ '--gw': `${t.visualW}px`, '--gh': `${t.visualH}px` } as React.CSSProperties}
                        >
                            <Reveal className="relative z-10 mx-auto -mt-20 w-full max-w-[494px] overflow-hidden shadow-md min-[1100px]:z-0 min-[1100px]:mx-0 min-[1100px]:mt-3 min-[1100px]:h-[432px]">
                                <Image
                                    src="/images/bg-texture-05.jpg"
                                    alt=""
                                    fill
                                    quality={82}
                                    sizes="494px"
                                    className="object-cover rounded-[10px]"
                                />
                                <div className="relative px-9 py-11 lg:pl-22 lg:pt-13 lg:pb-0 lg:pr-2">
                                    <span className="font-display block border-t border-b border-cocoa/40 px-4 py-1 text-small tracking-[0.15em]">
                                        RE:BERRY
                                    </span>
                                    <p className="font-display pl-2.5 mt-7 text-small text-latte">{t.en}</p>
                                    <h3 className=" pl-2.5 text-h2 font-bold">{t.definition.title}</h3>
                                    <span className="mt-5 ml-5 block h-8 w-px bg-cocoa" aria-hidden />
                                    <p className="mt-5 pl-2.5 whitespace-pre-line max-w-[15em] text-lead font-medium tracking-tight leading-[30px]!">
                                        {t.definition.text}
                                    </p>
                                </div>
                            </Reveal>

                            <Reveal
                                variants={zoom}
                                className="pointer-events-none absolute inset-0 z-10 hidden min-[1100px]:block"
                            >
                                <Image
                                    src={modelImage(t)}
                                    alt={`${t.name} 시술 모델`}
                                    fill
                                    quality={90}
                                    sizes="(max-width: 768px) 100vw, 950px"
                                    className="object-contain object-right-bottom"
                                />
                            </Reveal>
                        </div>
                    </div>
                </section>
            )}

            <LocationSection />
        </>
    );
}

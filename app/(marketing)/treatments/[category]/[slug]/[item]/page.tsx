import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import DeviceColumnSlider from '@/components/ui/DeviceColumnSlider';
import { columns } from '@/components/lib/columns';
import Reveal from '@/components/motion/Reveal';
import { zoom } from '@/components/lib/motion';
import { treatments, findTreatment } from '@/components/lib/treatments';
import { getSolutionBySlug, localizeSolution } from '@/components/lib/solutions';

interface Params {
    params: Promise<{ category: string; slug: string; item: string }>;
}

// 시술 × 그 시술의 items 조합으로 상세 주소 자동 생성 (예: /treatments/signature/lifting/ulthera)
export function generateStaticParams() {
    return treatments.flatMap((t) => t.items.map((item) => ({ category: t.category, slug: t.slug, item })));
}

export async function generateMetadata({ params }: Params) {
    const { item } = await params;
    const rawSolution = getSolutionBySlug(item);
    if (!rawSolution) return {};

    const locale = await getLocale();
    const tSolutions = await getTranslations('solutions');
    const s = localizeSolution(rawSolution, locale === 'ko' ? undefined : tSolutions.raw(rawSolution.slug));
    return { title: `${locale === 'ko' ? s.name : s.engName} | RE:BERRY`, description: s.desc.join(', ') };
}

const heroImage: Record<string, string> = {
    signature: '/images/bg-sub-03.jpg',
    skin: '/images/bg-sub-04.jpg',
    aging: '/images/bg-sub-05.jpg',
};

export default async function SolutionDetailPage({ params }: Params) {
    const { category, slug, item } = await params;
    const t = findTreatment(category, slug);
    const rawSolution = getSolutionBySlug(item);
    if (!t || !rawSolution) notFound();

    const locale = await getLocale();
    const tSolutions = await getTranslations('solutions');
    const s = localizeSolution(rawSolution, locale === 'ko' ? undefined : tSolutions.raw(rawSolution.slug));
    const itemColumns = columns.filter((c) => c.slugs.includes(item));

    return (
        <>
            <SubHero en={t.en} title={t.name} image={heroImage[t.category]} />

            {/* 소개 영역 좌: 영문/이름+서브타이틀/설명, 우: 기기·제품 사진 */}
            <section className="relative texture-paper py-20 lg:pt-40 lg:pb-25">
                <Image
                    src="/images/bg-texture-06.jpg"
                    alt=""
                    fill
                    quality={80}
                    sizes="100vw"
                    className="object-cover "
                />
                <div className="container-site relative">
                    <div className="grid items-start gap-10 lg:grid-cols-[1fr_430px] lg:gap-20">
                        <Reveal>
                            <p className="font-display text-h1-sm -tracking-[2em]">{s.engName}</p>
                            <h2 className="mt-6 whitespace-pre-line text-h2 font-bold leading-[46px] lg:mt-7.5">
                                {locale === 'ko' ? s.name : s.engName}
                                {s.subTitle && (
                                    <>
                                        {'\n'}
                                        {s.subTitle}
                                    </>
                                )}
                            </h2>
                            <span className="mt-8 block h-[2px] w-7.5 bg-cocoa/50" aria-hidden />
                            <p className="mt-8 whitespace-pre-line text-lead font-medium">
                                {s.introDescription || `${s.desc[0]}\n${s.desc[1]}`}
                            </p>
                        </Reveal>
                        <Reveal
                            variants={zoom}
                            className="relative order-first self-start mx-auto aspect-430/414 w-full max-w-107.5 overflow-hidden lg:order-0 lg:mx-0 lg:w-107.5 rounded-[14px]"
                        >
                            <Image
                                src={s.detailImage}
                                alt={s.name}
                                fill
                                quality={90}
                                sizes="(max-width: 1024px) 100vw, 430px"
                                className="object-contain p-0 "
                            />
                        </Reveal>
                    </div>

                    {/* #ISSUE: 예전에는 정적 데이터(itemColumns)가 있을 때만 이 영역을 그렸는데,
    그러면 정적 데이터에 없는 기기(예: 쥬베룩)는 관리자에 칼럼을 등록해도
    컴포넌트 자체가 안 만들어져서 Firestore 를 읽어볼 기회조차 없었음.
    → 항상 렌더하고, 보여줄 게 하나도 없으면 컴포넌트 안에서 스스로 사라지게 함 */}
                    <DeviceColumnSlider items={itemColumns} slug={item} />
                </div>
            </section>

            {/* 원리/원칙 — principles 배열만 채우면 단락이 늘어남 */}
            {s.principles.length > 0 && (
                <section className="relative py-20 lg:py-30">
                    <Image
                        src="/images/bg-texture-08.jpg"
                        alt=""
                        fill
                        quality={80}
                        sizes="100vw"
                        className="object-cover"
                    />
                    <div className="container-site relative mx-auto max-w-4xl space-y-14 lg:space-y-17.5">
                        {s.principles.map((p) => (
                            <Reveal key={p.title}>
                                <h3 className="flex items-center gap-2 text-h3 font-bold">
                                    <span
                                        aria-hidden
                                        className=" inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-cocoa"
                                    />
                                    {p.title}
                                </h3>
                                <p className="mt-5 whitespace-pre-line pl-3 text-small leading-[30px] lg:mt-8">
                                    {p.content}
                                </p>
                            </Reveal>
                        ))}
                    </div>
                </section>
            )}

            <LocationSection />
        </>
    );
}

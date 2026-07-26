import { notFound } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import { treatments, findTreatment, categoryLabel, localizeTreatment, type Category } from '@/components/lib/treatments';
import Image from 'next/image';
import Reveal from '@/components/motion/Reveal';
import { zoom } from '@/components/lib/motion';
import { cn } from '@/components/lib/cn';
import BACardSlider from '@/components/ui/BACardSlider';
import { SpinEmblem, FloatingCream } from '@/components/ui/DecoItem';
import SectionDivider from '@/components/ui/SectionDivider';
import Eyebrow from '@/components/ui/Eyebrow';
import HashtagChips from '@/components/ui/HashtagChips';
import SolutionSlider from '@/components/ui/SolutionSlider';
import IvTagBox from '@/components/ui/IvTagBox';
import { TwoDots } from '@/components/ui/DecoItem';
import StepPlan from '@/components/ui/StepPlan';
import { getColumnsBySlug } from '@/components/lib/columns';
import ColumnSlider from '@/components/ui/ColumnSlider';
import FAQAccordion from '@/components/ui/FAQAccordion';

interface Params {
    params: Promise<{ category: string; slug: string }>;
}

// treatments.ts 데이터에서 18개 주소를 자동 생성
export function generateStaticParams() {
    return treatments.map((t) => ({ category: t.category, slug: t.slug }));
}

// faq.sharedSignatureExtra / faq.boosterExtra 를 faq.common 과 합쳐 원본 treatments.ts 의
// sharedSignatureFaq / boosterFaq 순서 그대로 재조립한다.
type FaqItem = { q: string; a: string };
function buildFaq(faqRaw: { common: FaqItem[]; sharedSignatureExtra: FaqItem[]; boosterExtra: FaqItem[] }, kind: 'shared' | 'booster') {
    if (kind === 'shared') {
        const [first, last] = faqRaw.sharedSignatureExtra;
        return [first, ...faqRaw.common, last];
    }
    return [...faqRaw.boosterExtra, faqRaw.common[2], faqRaw.common[3]];
}

export async function generateMetadata({ params }: Params) {
    const { category, slug } = await params;
    const rawTreatment = findTreatment(category, slug);
    if (!rawTreatment) return {};

    const locale = await getLocale();
    const tTreatments = await getTranslations('treatments');
    const localizedCategoryLabel: Record<Category, string> =
        locale === 'ko' ? categoryLabel : (tTreatments.raw('categoryLabel') as Record<Category, string>);
    const t = localizeTreatment(
        rawTreatment,
        locale === 'ko' ? undefined : tTreatments.raw(`${rawTreatment.category}.${rawTreatment.slug}`),
    );

    return {
        title: `${locale === 'ko' ? t.name : t.en} | ${localizedCategoryLabel[t.category]}`,
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

const sigCard: Record<string, string> = {
    lifting: '01',
    pigment: '02',
    redness: '03',
    acne: '04',
    booster: '05',
};

export default async function TreatmentPage({ params }: Params) {
    const { category, slug } = await params;
    const rawTreatment = findTreatment(category, slug);
    if (!rawTreatment) notFound();

    const locale = await getLocale();
    const tTreatments = await getTranslations('treatments');
    const isKo = locale === 'ko';
    const localizedCategoryLabel: Record<Category, string> = isKo
        ? categoryLabel
        : (tTreatments.raw('categoryLabel') as Record<Category, string>);
    const t = localizeTreatment(
        rawTreatment,
        isKo ? undefined : tTreatments.raw(`${rawTreatment.category}.${rawTreatment.slug}`),
    );
    const name = isKo ? t.name : t.en;
    const ivItems = isKo ? t.ivItems : t.ivItems?.length ? (tTreatments.raw('ivItems') as string[]) : undefined;

    // 시그니처 여부
    const sig = t.signature;
    const faq = sig && !isKo ? buildFaq(tTreatments.raw('faq'), sig.faqSet) : sig?.faq;

    return (
        <>
            <SubHero en={t.en} title={isKo ? t.name : undefined} image={heroImage[t.category]} />

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

                        {/* 모바일 인물 조정 */}
                        <div className="relative -mx-6 mt-8 h-80 min-[1100px]:hidden">
                            <Image
                                src={modelImage(t)}
                                alt={tTreatments('chrome.modelAlt', { name })}
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
                            <Reveal
                                className={cn(
                                    'relative z-10 mx-auto -mt-20 w-full max-w-[494px] shadow-md min-[1100px]:z-0 min-[1100px]:mx-0 min-[1100px]:mt-3',
                                    isKo ? 'overflow-hidden min-[1100px]:h-[432px]' : 'min-[1100px]:min-h-[432px]',
                                )}
                            >
                                <Image
                                    src="/images/bg-texture-05.jpg"
                                    alt=""
                                    fill
                                    quality={82}
                                    sizes="494px"
                                    className="object-cover rounded-[10px]"
                                />
                                <div
                                    className={cn(
                                        'relative px-9 py-11 lg:pl-22 lg:pt-13',
                                        isKo ? 'lg:pb-0 lg:pr-2' : 'lg:pb-11 lg:pr-8',
                                    )}
                                >
                                    <span className="font-display block border-t border-b border-cocoa/40 px-4 py-1 text-small tracking-[0.15em]">
                                        RE:BERRY
                                    </span>
                                    <p className="font-display pl-2.5 mt-7 text-small text-latte">{t.en}</p>
                                    {/* #ISSUE: 번역문이 길어지면 카드 폭(494px)을 뚫고 나가 잘렸음
                                        (일본어 "色素（ジャブティ）治療とは？").
                                        아래 설명문과 같은 max-w 를 줘서 카드 안에서 줄바꿈되게 함 */}
                                    <h3
                                        className={cn(
                                            'pl-2.5 font-bold',
                                            isKo ? 'max-w-[13em] text-h2' : 'max-w-[11em] text-h3',
                                        )}
                                    >
                                        {t.definition.title}
                                    </h3>
                                    <span className="mt-5 ml-5 block h-8 w-px bg-cocoa" aria-hidden />
                                    <p
                                        className={cn(
                                            'mt-5 pl-2.5 whitespace-pre-line font-medium tracking-tight',
                                            isKo
                                                ? 'max-w-[15em] text-lead leading-[30px]!'
                                                : 'max-w-[12em] text-medium leading-[26px]!',
                                        )}
                                    >
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
                                    alt={tTreatments('chrome.modelAlt', { name })}
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

            {/* 시그니처 — 스토리 카드 */}
            {/* #TODO: 반응형 작업 조금 더 들어가야함 크림이 어색하게 떠있는 부분들이 있음 */}
            {sig && (
                <section className="relative texture-paper py-20 lg:pt-35 lg:pb-42.5">
                    <Image
                        src="/images/bg-texture-06.jpg"
                        alt=""
                        fill
                        quality={85}
                        sizes="100vw"
                        className="object-cover"
                    />
                    <div className="container-site relative">
                        <Reveal className="text-center">
                            <p className="font-display text-h2 tracking-tight">{t.en}</p>
                            {t.headline && (
                                <h2 className="text-h2 font-light">
                                    {t.headline.light}
                                    <br className="bolck md:hidden" />
                                    <strong className="font-bold">{t.headline.strong}</strong>
                                </h2>
                            )}
                        </Reveal>

                        <Reveal className="relative mx-auto mt-12 max-w-257 lg:mt-16">
                            <div className="grid min-[1100px]:grid-cols-2">
                                <div className="-tracking-[5%] texture-dark flex flex-col items-center justify-center px-8 py-12 lg:py-[120px] bg-cocoa text-center text-cream md:px-2">
                                    <p className="text-h3 leading-[35px] tracking-tighter">
                                        {sig.story.hook[0]}
                                        <br />
                                        <strong className="mt-1 inline-block bg-cream px-2 py-0.5 font-bold text-cocoa">
                                            {sig.story.hook[1]}
                                        </strong>
                                        <br />
                                        {sig.story.hook[2]}
                                    </p>
                                    {/* 라인 + 점 하강 커넥터 */}
                                    <SectionDivider light className="my-4" />
                                    <p className="whitespace-pre-line text-lead  text-cream">{sig.story.body}</p>
                                </div>
                                <div className="relative order-first aspect-[4/3] w-full min-[1100px]:order-none min-[1100px]:aspect-auto min-[1100px]:min-h-[340px]">
                                    <Image
                                        src={`/images/img-card-${sigCard[t.slug]}.jpg`}
                                        alt=""
                                        fill
                                        quality={88}
                                        sizes="(max-width: 768px) 100vw, 480px"
                                        className="object-cover"
                                    />
                                </div>
                            </div>
                            <SpinEmblem />
                            <FloatingCream />
                        </Reveal>
                    </div>
                </section>
            )}

            {/* 전 후 슬라이더 — 시그니처 전용 */}
            {sig && (
                <section className="texture-dark py-20 bg-cocoa! text-cream lg:py-30">
                    <div className="container-site">
                        <Reveal className="text-center">
                            <h2 className="font-display text-h2 tracking-[0.06em]">Your Beauty Physician</h2>
                        </Reveal>
                        <Reveal className="mt-12">
                            <BACardSlider slug={t.slug} />
                        </Reveal>
                    </div>
                </section>
            )}

            {/* 솔루션 영역 - 시그니처, 안티에이징, 피부교정 공통 */}
            {/* #FIX: 반응형 좀 더 다듬기 */}
            <section
                className={cn(
                    'relative overflow-hidden py-20 lg:pt-[180px] lg:pb-[170px]',
                    t.category === 'signature' && 'bg-[#e8e2d6]',
                    t.category === 'skin' && 'bg-sand',
                    t.category === 'aging' && 'bg-cocoa text-cream',
                )}
            >
                {t.category === 'signature' && (
                    <Image
                        src="/images/bg-texture-06.jpg"
                        alt=""
                        fill
                        quality={80}
                        sizes="100vw"
                        className="scale-[1.02] object-cover"
                    />
                )}
                <div className="container-site relative">
                    {sig && (
                        <Reveal className="text-center">
                            <Eyebrow light={t.category === 'aging'}>RE:BERRY</Eyebrow>
                            <h2 className="mt-5 text-h2">
                                {tTreatments.rich('chrome.sameConcernHeading', {
                                    hl: (chunks) => <strong className="font-bold">{chunks}</strong>,
                                })}
                            </h2>
                        </Reveal>
                    )}
                    <div className="mt-10 lg:mt-12">
                        <HashtagChips
                            items={t.hashtags}
                            tone={t.category === 'signature' ? 'sig' : t.category}
                            rows={t.hashtagRows}
                        />
                    </div>
                    <div className="mt-[50px] flex justify-center">
                        <TwoDots light={t.category === 'aging'} />
                    </div>
                    <Reveal className="mt-[100px] text-center">
                        <h2 className="font-display text-h2 tracking-[0.08em]">RE:BERRY SOLUTION</h2>
                        <p className="mt-4 text-h2 font-light">
                            {t.solution.light} <strong className="font-bold">{t.solution.strong}</strong>
                        </p>
                    </Reveal>
                    <div className="mt-12 lg:mt-16">
                        {/* 수액주사처럼 ivItems 가 있는 시술은 카드 슬라이더 대신 이름표 박스만 보여줌 */}
                        {ivItems && ivItems.length > 0 ? (
                            <IvTagBox items={ivItems} />
                        ) : (
                            /* 카드 톤은 SolutionSlider 내부(tones 표)에서 category 기준으로 결정 — 여기선 로직 없음 */
                            <SolutionSlider
                                slugs={t.items}
                                baseHref={`/treatments/${t.category}/${t.slug}`}
                                category={t.category}
                            />
                        )}
                    </div>
                </div>
            </section>

            {!sig && <StepPlan />}

            {/* 시그니처 전용 — Column */}
            {sig && getColumnsBySlug(t.slug).length > 0 && (
                <section className="bg-cream relative py-20 lg:pt-32.5 lg:pb-37.5 overflow-x-clip">
                    <Image
                        src="/images/bg-texture-08.jpg"
                        alt=""
                        fill
                        quality={80}
                        sizes="100vw"
                        className="object-cover"
                    />
                    <div className="relative container-site">
                        <Reveal className="text-center">
                            <h2 className="font-display text-h2">Column</h2>
                            <p className="mt-10 text-h2 tracking-tighter leading-9">
                                {tTreatments.rich('chrome.columnIntro', {
                                    name,
                                    hl: (chunks) => <strong className="font-bold">{chunks}</strong>,
                                })}
                            </p>
                        </Reveal>
                        <Reveal className="mt-19.5">
                            <ColumnSlider items={getColumnsBySlug(t.slug)} slug={t.slug} />
                        </Reveal>
                    </div>
                </section>
            )}

            {/* 시그니처 전용 — FAQ */}
            {sig && (
                <section className="texture-dark relative py-20 text-cream lg:pt-30 lg:pb-25">
                    <Image
                        src="/images/bg-texture-09.jpg"
                        alt=""
                        fill
                        quality={80}
                        sizes="100vw"
                        className="object-cover"
                    />
                    <div className="container-site relative">
                        <Reveal className="text-center">
                            <h2 className="font-display text-h2 tracking-[0.7em] leading-12 md:text-h2">
                                RE:BERRY FAQ
                            </h2>
                            <p className="text-h2  font-bold leading-12.5">{tTreatments('chrome.faqHeading')}</p>
                        </Reveal>
                        <Reveal className="mt-17">
                            <FAQAccordion items={faq!} />
                        </Reveal>
                    </div>
                </section>
            )}

            <LocationSection />
        </>
    );
}

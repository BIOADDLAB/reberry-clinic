import { Fragment, type ReactNode } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getLocale, getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import { treatments, findTreatment, categoryLabel, localizeTreatment, type Category } from '@/components/lib/treatments';
import JsonLd from '@/components/seo/JsonLd';
import { breadcrumbJsonLd, medicalWebPageJsonLd } from '@/components/lib/jsonLd';
import Reveal from '@/components/motion/Reveal';
import { cn } from '@/components/lib/cn';
import HashtagChips from '@/components/ui/HashtagChips';
import SolutionSlider from '@/components/ui/SolutionSlider';
import IvTagBox from '@/components/ui/IvTagBox';
import { TwoDots } from '@/components/ui/DecoItem';
import StepPlan from '@/components/ui/StepPlan';
import TreatmentIntroSection from '@/components/ui/TreatmentIntroSection';
import TreatmentColumnSection from '@/components/ui/TreatmentColumnSection';
import TreatmentBASection from '@/components/ui/TreatmentBASection';
import { AGING_LIFTING_PAGES, skinTreatmentPageSlug } from '@/components/lib/adminConfig';
import {
    getSignatureContent,
    signaturePath,
    signatureSlugFromRoute,
} from '@/components/lib/signaturePages';
import SignaturePage from '@/components/signature/SignaturePage';

/* ════════════════════════════════════════════════════════════════════
   #ISSUE: 섹션 노출 순서는 아래 배열 하나로만 정한다. 순서를 바꾸고 싶으면
           JSX 를 옮기지 말고 이 배열의 문자열 순서만 바꾸면 된다.

   intro     시술 소개 ("결점 없이 빛나는 미백의 정점에 서다" 헤드라인 + 인물/정의 카드)
   ba        전후사진 슬라이더                                                           — 피부교정
   solution  시술·기기 슬라이더 (해시태그 + PERSONALIZED SOLUTION)
   step      시술 STEP (StepPlan)
   column    칼럼                                                                        — 피부교정

   #2026.09 시그니처 3개 페이지(volume-booster / chin-filler / under-eye)는 새 시안으로 전면 교체되어
            이 배열을 쓰지 않는다 → components/signature/SignaturePage.tsx
            (섹션 순서: 히어로 → Reberry Signature → 스토리+칼럼 → 전후사진 → Why → Recommendation → 마무리 → 오시는 길)

   맨 위 SubHero(서브 히어로)와 맨 아래 LocationSection(오시는 길)은 항상 고정이라
   배열에 넣지 않는다. 목록에 없는 키는 그냥 안 그려진다.
   ════════════════════════════════════════════════════════════════════ */
const SECTION_ORDER = {
    /* 피부교정: 전후사진 → STEP → 칼럼 → 시술·기기 → 시술 소개
       #ISSUE: intro(“Pigmentation — 결점 없이 빛나는 미백의 정점에 서다”)가 맨 위로 올라가 있었는데,
               원래 페이지에서는 오시는 길 바로 위 마지막 섹션이었다. 원래 자리로 되돌린다.
               BA→STEP→칼럼 순서는 2026.09.03 미팅 요청(전후사진-스텝-칼럼-시술기기)대로 유지 */
    skin: ['ba', 'step', 'column', 'solution', 'intro'],
    // 나머지 안티에이징: STEP → 시술·기기 → 시술 소개 (intro 위치는 피부교정과 동일하게 맨 아래)
    other: ['step', 'solution', 'intro'],
} as const;

interface Params {
    params: Promise<{ category: string; slug: string }>;
}

// treatments.ts 데이터에서 현재 시술 주소를 자동 생성
export function generateStaticParams() {
    return treatments.map((t) => ({ category: t.category, slug: t.slug }));
}

export async function generateMetadata({ params }: Params) {
    const { category, slug } = await params;
    const rawTreatment = findTreatment(category, slug);
    if (!rawTreatment) return {};

    const locale = await getLocale();
    const tTreatments = await getTranslations('treatments');
    const localizedCategoryLabel: Record<Category, string> =
        locale === 'ko' ? categoryLabel : (tTreatments.raw('categoryLabel') as Record<Category, string>);

    // 시그니처는 화면에 보이는 새 문구로 제목·설명을 만든다
    const signatureSlug = rawTreatment.category === 'signature' ? signatureSlugFromRoute(rawTreatment.slug) : undefined;
    if (signatureSlug) {
        const c = getSignatureContent(signatureSlug, locale);
        return {
            title: `${c.heroTitle} | ${localizedCategoryLabel.signature}`,
            description: signatureDescription(c.heroSub, c.storySub),
        };
    }

    const t = localizeTreatment(
        rawTreatment,
        locale === 'ko' ? undefined : tTreatments.raw(`${rawTreatment.category}.${rawTreatment.slug}`),
    );

    return {
        title: `${locale === 'ko' ? t.name : t.en} | ${localizedCategoryLabel[t.category]}`,
        description: `${t.definition.title} — ${t.definition.text}`,
    };
}

const signatureDescription = (heroSub: string, storySub: string) =>
    `${heroSub} — ${storySub.replace(/\s*\n\s*/g, ' ')}`;

// 서브 히어로 배경: 카테고리별 (bg-sub-)
const heroImage: Record<string, string> = {
    skin: '/images/bg-sub-03.jpg',
    aging: '/images/bg-sub-04.jpg',
};

export default async function TreatmentPage({ params }: Params) {
    const { category, slug } = await params;
    // 삭제된 예전 시그니처 주소는 next.config 301 이 새 주소로 보낸다.
    const rawTreatment = findTreatment(category, slug);
    if (!rawTreatment) notFound();
    if (category === 'aging' && slug === 'laser-lifting') {
        redirect(`/treatments/aging/laser-lifting/${AGING_LIFTING_PAGES[0].itemSlug}`);
    }

    const locale = await getLocale();
    const tTreatments = await getTranslations('treatments');
    const isKo = locale === 'ko';
    const t = localizeTreatment(
        rawTreatment,
        isKo ? undefined : tTreatments.raw(`${rawTreatment.category}.${rawTreatment.slug}`),
    );
    const path = `/treatments/${t.category}/${t.slug}`;
    const localizedCategory =
        isKo ? categoryLabel[t.category] : (tTreatments.raw('categoryLabel') as Record<Category, string>)[t.category];
    const categoryHub: Record<string, string> = {
        signature: signaturePath('booster'),
        skin: '/treatments/skin/pigment',
        aging: `/treatments/aging/laser-lifting/${AGING_LIFTING_PAGES[0].itemSlug}`,
    };
    const breadcrumbsFor = (name: string) => {
        const breadcrumbs = [{ name: '홈', path: '/' }];
        if (categoryHub[t.category] && categoryHub[t.category] !== path) {
            breadcrumbs.push({ name: localizedCategory, path: categoryHub[t.category] });
        }
        breadcrumbs.push({ name, path });
        return breadcrumbs;
    };

    /* ── 시그니처 3개 페이지 — 2026.09 리뉴얼 시안 ── */
    if (t.category === 'signature') {
        const signatureSlug = signatureSlugFromRoute(t.slug);
        if (signatureSlug) {
            const content = getSignatureContent(signatureSlug, locale);
            return (
                <>
                    <JsonLd data={breadcrumbJsonLd(breadcrumbsFor(content.heroTitle))} />
                    <JsonLd
                        data={medicalWebPageJsonLd({
                            name: content.heroTitle,
                            description: signatureDescription(content.heroSub, content.storySub),
                            path,
                        })}
                    />
                    <SignaturePage content={content} />
                </>
            );
        }
    }

    /* ── 피부교정 · 안티에이징 ── */
    const name = isKo ? t.name : t.en;
    const ivItems = isKo ? t.ivItems : t.ivItems?.length ? (tTreatments.raw('ivItems') as string[]) : undefined;
    const pageContentSlug = t.category === 'skin' ? (skinTreatmentPageSlug(t.slug) ?? t.slug) : t.slug;

    // 섹션 본문. 여기서는 "무엇을 그릴지"만 만들고, "어떤 순서로 그릴지"는 SECTION_ORDER 가 정한다
    const sections: Record<string, ReactNode> = {
        intro: <TreatmentIntroSection treatment={t} name={name} />,

        /* 전후사진 — 피부교정 */
        ba: t.category === 'skin' ? <TreatmentBASection slug={pageContentSlug} /> : null,

        /* 솔루션 영역 - 안티에이징, 피부교정 공통 */
        /* #FIX: 반응형 좀 더 다듬기 */
        solution: (
            <section
                className={cn(
                    'relative overflow-hidden py-20 lg:pt-[180px] lg:pb-[170px]',
                    t.category === 'skin' && 'bg-sand',
                    t.category === 'aging' && 'bg-cocoa text-cream',
                )}
            >
                <div className="container-site relative">
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
                        <h2 className="font-display text-h2 tracking-[0.08em]">PERSONALIZED SOLUTION</h2>
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
        ),

        step: <StepPlan />,

        /* 피부교정 관리자 연결 칼럼 */
        column: t.category === 'skin' ? <TreatmentColumnSection slug={pageContentSlug} name={name} /> : null,
    };

    const order = t.category === 'skin' ? SECTION_ORDER.skin : SECTION_ORDER.other;
    const description = `${t.definition.title} — ${t.definition.text}`;

    return (
        <>
            <JsonLd data={breadcrumbJsonLd(breadcrumbsFor(name))} />
            <JsonLd data={medicalWebPageJsonLd({ name, description, path })} />

            <SubHero
                en={t.heroEn ?? t.en}
                title={isKo ? t.name : undefined}
                description={t.heroDescription}
                image={heroImage[t.category]}
            />

            {order.map((key) => (
                <Fragment key={key}>{sections[key]}</Fragment>
            ))}

            <LocationSection />
        </>
    );
}

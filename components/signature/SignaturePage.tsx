/* #COMPONENTS: 시그니처 시술 페이지 (2026.09 리뉴얼)
   섹션 순서(시안): 히어로 → Reberry Signature → 스토리 + 칼럼 → 전후사진 → Why → Recommendation → 마무리 → 오시는 길
   - 문구·스토리 이미지는 components/lib/signaturePages.ts 에서 받는다.
   - 칼럼·전후사진은 관리자 데이터에 연결돼 있고, 등록된 게 없으면 해당 영역만 숨는다.
   - 시안 기준 캔버스 1920 / 콘텐츠 1182~1190. 3장이 컨테이너에 안 들어가면 가로 스와이프. */

import Image from 'next/image';
import { cn } from '@/components/lib/cn';
import { zoom } from '@/components/lib/motion';
import { SIGNATURE_IMAGES, signaturePortraits, type SignatureContent } from '@/components/lib/signaturePages';
import Reveal from '@/components/motion/Reveal';
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';
import LocationSection from '@/components/ui/LocationSection';
import SkeletonImage from '@/components/ui/SkeletonImage';
import TextureBackground from '@/components/ui/TextureBackground';
import SignatureBASection from '@/components/signature/SignatureBASection';
import SignatureColumnSection from '@/components/signature/SignatureColumnSection';
import SignatureSwipeRow from '@/components/signature/SignatureSwipeRow';
import { SignatureEmblem, SignatureMotion } from '@/components/signature/SignatureMotion';
import {
    CheckCircleIcon,
    DotOrnament,
    KeepFrom,
    KeepWords,
    QuoteMark,
    Rich,
    ScrollMouse,
    SIG_TYPE,
    TRACK_24,
    fillName,
} from '@/components/signature/SignatureParts';

/* 시안 섹션 배경 — System 팔레트(F3F2EE / F7F3EA) 기준, 시안 원본 값 그대로 */
const BG = {
    paper: 'bg-[#F3F2EE]', // 인트로 · 마무리 (+ 종이 결 60%)
    story: 'bg-[#F4F4F2]', // 스토리 + 칼럼
    ivory: 'bg-[#F7F3EA]', // Why · 추천 알약
} as const;

const H2 = cn('text-balance leading-[1.4] tracking-tighter', SIG_TYPE.h2);

export default function SignaturePage({ content: c }: { content: SignatureContent }) {
    const locale = c.locale;
    // 한국어는 어절 단위로만 줄바꿈 (번역 모드에서는 globals.css 가 자동으로 풀어준다)
    const keep = 'break-keep';
    const t24 = locale === 'ko' ? TRACK_24 : '';
    // 모바일(md 미만) 줄바꿈 — 짧은 문구는 줄 길이를 고르게, 긴 문단은 마지막 줄에 한 단어만 남지 않게
    const mBalance = 'max-md:text-balance';
    const mPretty = 'max-md:text-pretty';
    const keepWords = (text: string) => (locale === 'ko' ? <KeepWords text={text} /> : text);

    return (
        <SignatureMotion>
            <section className="relative flex h-[420px] items-center justify-center overflow-hidden text-center text-cocoa md:h-[466px] lg:h-[566px]">
                <Image
                    src={SIGNATURE_IMAGES.hero}
                    alt=""
                    fill
                    priority
                    quality={85}
                    sizes="100vw"
                    className="object-cover object-[30%_50%] md:object-center"
                />
                <Reveal className="relative px-6">
                    <h1 className="flex items-center justify-center gap-3 text-[clamp(26px,3.4vw,45px)] font-medium leading-[1.3] md:gap-[38px]">
                        <DotOrnament size="lg" />
                        <span className={cn('text-balance', keep)}>{c.heroTitle}</span>
                        <DotOrnament size="lg" />
                    </h1>
                    <p
                        className={cn(
                            'mt-2.5 text-[clamp(15px,1.4vw,22px)] font-medium leading-[1.45] tracking-normal md:mt-4 lg:mt-[22px]',
                            mBalance,
                            keep,
                        )}
                    >
                        {c.heroSub}
                    </p>
                </Reveal>
                <ScrollMouse className="absolute bottom-9 left-1/2 -translate-x-1/2 md:bottom-12 lg:bottom-[65px]" />
            </section>

            {/* ── Reberry Signature ─────────────────────────────────── */}
            <section className={cn('relative overflow-hidden py-20 lg:pt-[179px] lg:pb-[140px]', BG.paper)}>
                <TextureBackground src="/images/bg-texture-06.jpg" className="opacity-60" />
                <div className="container-site relative text-center">
                    <Reveal>
                        <p
                            className={cn(
                                'notranslate font-title font-normal leading-[1.2] tracking-normal',
                                SIG_TYPE.display,
                            )}
                        >
                            Reberry Signature
                        </p>
                        <h2 className={cn(H2, 'mt-2 font-light md:mt-[19px]', keep)}>
                            <Rich text={c.intro ? `**${c.name}**` : c.introHeadline} strongClassName="font-bold" locale={locale} />
                        </h2>
                    </Reveal>

                    <Reveal delay={0.1} className="mt-12 flex flex-col items-center lg:mt-[71px]">
                        <QuoteMark />
                        <p className={cn('mt-4 font-semibold leading-[1.67] md:mt-[27px]', SIG_TYPE.quote, t24, mBalance, keep)}>
                            <Rich text={c.intro?.quote ?? c.introQuote} lineBlocks locale={locale} />
                        </p>
                        <QuoteMark close className="mt-4 md:mt-[27px]" />
                    </Reveal>

                    {c.intro ? (
                        <>
                            <Reveal className="mx-auto mt-10 max-w-[546px] rounded-[15px] bg-white px-5 py-10 shadow-[0_4px_10px_rgba(69,54,45,0.15)] md:px-10 lg:mt-[54px] lg:py-[60px]">
                                <h3 className={cn('text-balance font-semibold leading-[1.4] tracking-tighter', SIG_TYPE.h2, keep)}>
                                    {c.intro.causesTitle}
                                </h3>
                                <ul className="mt-7 flex flex-col items-center gap-3 lg:mt-[34px]">
                                    {c.intro.causes.map((cause, index) => (
                                        <li
                                            key={cause}
                                            className={cn(
                                                'max-w-full rounded-full border border-latte px-4 py-3 text-[16px] font-medium leading-[1.45] tracking-tight lg:px-5 lg:text-[20px]',
                                                index % 2 === 0 && BG.paper,
                                                mBalance,
                                                keep,
                                            )}
                                        >
                                            <span aria-hidden className="mr-1.5 text-latte">#</span>
                                            {cause}
                                        </li>
                                    ))}
                                </ul>
                            </Reveal>
                            <Reveal className={cn('mx-auto mt-10 max-w-[800px] font-medium leading-[1.7] tracking-tight lg:mt-[60px]', SIG_TYPE.body, keep)}>
                                <p className={mBalance}>{c.intro.note}</p>
                            </Reveal>
                        </>
                    ) : (
                        <>
                            {/* 시안 줄 폭 1118 = 카드 350 × 3 + 간격 34 × 2. 넓은 화면에서는 이 폭으로 가운데,
                                줄 폭이 880 아래로 좁아지면 스와이프 (자세한 규칙은 SignatureSwipeRow 머리말) */}
                            <SignatureSwipeRow
                                count={3}
                                maxWidth={1118}
                                gapClassName="[--gap:16px] md:[--gap:20px] xl:[--gap:34px]"
                                className="mt-10 lg:mt-[54px]"
                            >
                                {signaturePortraits(locale).map((src, i) => (
                                    <RevealItem key={src} className="relative aspect-[350/412] overflow-hidden">
                                        {/* 사진이 오기 전에는 은은하게 깜빡이는 자리(스켈레톤) — 도착하면 서서히 올라온다 */}
                                        <SkeletonImage
                                            src={src}
                                            alt={`${c.portraitAlt} ${i + 1}`}
                                            quality={88}
                                            sizes="(max-width: 768px) 78vw, (max-width: 1024px) 320px, 350px"
                                            className="object-cover"
                                        />
                                    </RevealItem>
                                ))}
                            </SignatureSwipeRow>

                            <Reveal
                                className={cn(
                                    'mx-auto mt-10 max-w-[680px] font-medium leading-[1.95] tracking-tight lg:mt-[58px] lg:max-w-[880px] lg:leading-[35px]',
                                    SIG_TYPE.body,
                                )}
                            >
                                <p className={cn(mPretty, keep)}>
                                    <Rich text={c.introBody[0]} breakFrom="lg" locale={locale} />
                                </p>
                                <p className={cn('mt-3 lg:mt-[15px]', mPretty, keep)}>
                                    <Rich text={c.introBody[1]} breakFrom="lg" locale={locale} />
                                </p>
                            </Reveal>
                        </>
                    )}
                </div>
            </section>

            {/* ── 스토리 + 칼럼 ─────────────────────────────────────── */}
            <section className={cn('py-20 lg:pt-[182px] lg:pb-[141px]', BG.story)}>
                <div className="container-site">
                    <div className="mx-auto grid max-w-[1190px] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,428px)] lg:gap-12">
                        <Reveal className="order-2 lg:order-1 lg:-mb-6">
                            <p className="flex items-center gap-4 md:gap-[21px]">
                                <DotOrnament />
                                <Image
                                    src="/images/logo.svg"
                                    alt="RE:BERRY"
                                    width={176}
                                    height={19}
                                    unoptimized
                                    className="to-cocoa h-auto w-[140px] md:w-[176px]"
                                />
                                <DotOrnament />
                            </p>
                            <h2
                                className={cn(
                                    'mt-8 font-semibold leading-[1.3] tracking-tighter lg:mt-[63px]',
                                    SIG_TYPE.display,
                                    keep,
                                )}
                            >
                                {c.name}
                            </h2>
                            <p
                                className={cn(
                                    'mt-3 font-medium leading-[1.46] lg:mt-[10px]',
                                    SIG_TYPE.quote,
                                    t24,
                                    keep,
                                )}
                            >
                                <Rich text={c.storySub} locale={locale} />
                            </p>
                            <div
                                className={cn(
                                    'mt-8 font-medium leading-[1.95] tracking-tight text-latte lg:mt-[48px] lg:leading-[35px]',
                                    SIG_TYPE.body,
                                )}
                            >
                                <p className={cn(mPretty, keep)}>
                                    <Rich text={c.storyBody[0]} breakFrom="xl" locale={locale} />
                                </p>
                                <p className={cn('mt-4 lg:mt-[22px]', mPretty, keep)}>
                                    <Rich text={c.storyBody[1]} breakFrom="xl" locale={locale} />
                                </p>
                            </div>
                        </Reveal>

                        <Reveal variants={zoom} className="order-1 mx-auto w-full max-w-[428px] lg:order-2">
                            {/* 시안: 3px 크림(#FFFFFC) 테두리 + 바깥 모서리 15px (안쪽 12px 은 border 가 자동 계산).
                                이미지 파일에는 테두리가 없고, 여기서 감싸는 박스가 테두리와 모서리 자르기를 맡는다 */}
                            <div className="overflow-hidden rounded-[15px] border-[3px] border-cream">
                                <Image
                                    src={c.storyImage.src}
                                    alt=""
                                    width={c.storyImage.width}
                                    height={c.storyImage.height}
                                    quality={88}
                                    sizes="(max-width: 1024px) 90vw, 422px"
                                    className="block h-auto w-full"
                                />
                            </div>
                        </Reveal>
                    </div>

                    {c.treatmentCards && (
                        <RevealGroup className="mx-auto mt-14 grid max-w-[1190px] gap-8 sm:grid-cols-2 lg:mt-[126px] lg:grid-cols-4 lg:gap-[30px]">
                            {c.treatmentCards.map((text, index) => (
                                <RevealItem key={text} className="relative flex min-h-[148px] items-center justify-center rounded-[10px] bg-white px-5 py-8 text-center lg:min-h-[168px] lg:px-4">
                                    <span className="notranslate absolute -top-4 left-1/2 flex size-[34px] -translate-x-1/2 items-center justify-center rounded-full border border-cocoa bg-cocoa font-display text-[18px] text-cream ring-1 ring-inset ring-cream">
                                        {String(index + 1).padStart(2, '0')}
                                    </span>
                                    <p className={cn('text-[17px] font-medium leading-[1.6] tracking-tight lg:text-[20px]', mBalance, keep)}>
                                        <Rich text={text} breakFrom="lg" lineBlocks locale={locale} />
                                    </p>
                                </RevealItem>
                            ))}
                        </RevealGroup>
                    )}

                    <SignatureColumnSection slug={c.slug} title={fillName(c.columnTitle, c.name)} locale={locale} />
                </div>
            </section>

            {/* ── 전후사진 ──────────────────────────────────────────── */}
            <SignatureBASection slug={c.slug} title={fillName(c.baTitle, c.name)} locale={locale} />

            {/* ── Why Reberry ───────────────────────────────────────── */}
            <section className={cn('py-20 lg:pt-[134px] lg:pb-[138px]', BG.ivory)}>
                <div className="container-site">
                    <Reveal className="text-center">
                        <p className={cn('notranslate font-display leading-[1.3]', SIG_TYPE.eyebrow)}>Why Reberry?</p>
                        <h2 className={cn(H2, 'mt-1 font-semibold md:mt-px', keep)}>
                            {locale === 'ko' ? <KeepFrom text={c.whyTitle} phrase={c.name} /> : c.whyTitle}
                        </h2>
                    </Reveal>

                    <RevealGroup className="mx-auto mt-10 flex w-fit max-w-full flex-col gap-3.5 md:gap-4 lg:mt-[58px] lg:gap-[17px]">
                        {c.why.map((item) => (
                            <RevealItem key={item} className="flex items-start gap-3 md:items-center md:gap-[31px]">
                                <CheckCircleIcon
                                    variant="why"
                                    className="mt-0.5 size-[22px] shrink-0 text-latte md:mt-0 md:size-[34px] md:p-[2px]"
                                />
                                <p
                                    className={cn(
                                        'font-medium tracking-tight leading-[1.5] text-latte md:leading-[34px]',
                                        SIG_TYPE.h3,
                                        t24,
                                        mBalance,
                                        keep,
                                    )}
                                >
                                    {keepWords(item)}
                                </p>
                            </RevealItem>
                        ))}
                    </RevealGroup>
                </div>
            </section>

            {/* ── Recommendation ────────────────────────────────────── */}
            <section className="relative overflow-hidden py-20 lg:pt-[134px] lg:pb-[141px]">
                {/* 배경 사진에 시안의 아이보리 덮개(64%)가 이미 들어가 있다 */}
                <Image
                    src={SIGNATURE_IMAGES.recommend}
                    alt=""
                    fill
                    quality={85}
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="container-site relative">
                    <Reveal className="text-center">
                        <p className={cn('notranslate font-display leading-[1.3]', SIG_TYPE.eyebrow)}>Recommendation</p>
                        <h2 className={cn('mt-1 text-balance font-bold leading-[1.4] md:mt-0.5', SIG_TYPE.h2Sm, keep)}>
                            {c.recommendTitle}
                        </h2>
                    </Reveal>

                    {/* md 이상: 가운데 칸(auto) 하나를 모든 알약이 같이 쓰는 subgrid —
                        가장 긴 문장 기준으로 묶음 전체가 가운데 오고, 체크 아이콘은 한 줄로 맞는다(시안) */}
                    <RevealGroup className="mx-auto mt-10 grid max-w-[800px] gap-3 md:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] md:gap-y-5 lg:mt-[61px]">
                        {c.recommend.map((item) => (
                            <RevealItem
                                key={item}
                                className={cn(
                                    'flex min-h-[54px] items-center rounded-full px-6 py-3',
                                    'md:col-span-3 md:grid md:min-h-16 md:grid-cols-subgrid md:px-10 md:py-3',
                                    BG.ivory,
                                )}
                            >
                                <span className="flex items-center gap-3 md:col-start-2 md:gap-[22px]">
                                    <CheckCircleIcon variant="recommend" className="size-5 shrink-0 md:size-[26px]" />
                                    <span
                                        className={cn(
                                            ' text-[15px]  tracking-tight font-medium leading-[1.45] md:text-[clamp(17px,1.8vw,24px)]',
                                            t24,
                                            mBalance,
                                            keep,
                                        )}
                                    >
                                        {keepWords(item)}
                                    </span>
                                </span>
                            </RevealItem>
                        ))}
                    </RevealGroup>
                </div>
            </section>

            {/* ── 마무리 ────────────────────────────────────────────── */}
            <section className={cn('relative overflow-hidden py-20 lg:pt-[136px] lg:pb-[134px]', BG.paper)}>
                <TextureBackground src="/images/bg-texture-06.jpg" className="opacity-60" />
                <div className="container-site relative text-center">
                    <SignatureEmblem />
                    <Reveal className="mt-8 lg:mt-[41px]">
                        <h2 className={cn('text-balance leading-[1.41]', SIG_TYPE.h2Sm, keep)}>
                            <span className="block font-normal">{c.closingLead}</span>
                            <span className="block font-normal">
                                <Rich text={c.closingStatement} strongClassName="font-bold" locale={locale} />
                            </span>
                        </h2>
                    </Reveal>
                    <Reveal
                        delay={0.1}
                        className={cn('mt-7 font-semibold leading-[1.46] lg:mt-[39px]', SIG_TYPE.h3, t24)}
                    >
                        <p className={keep}>
                            <Rich text={c.closingSub} locale={locale} />
                        </p>
                        <p className={cn('mt-2 lg:mt-3', keep)}>{c.closingEnd}</p>
                    </Reveal>
                </div>
            </section>

            <LocationSection />
        </SignatureMotion>
    );
}

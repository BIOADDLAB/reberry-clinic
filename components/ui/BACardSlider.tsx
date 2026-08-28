// #COMPONENTS: 시그니처 전후 카드 슬라이더
// #STYLE: 화살표/도트 = 메인 BASlider 것을 그대로 (화살표는 배경색 없음 버전) / 트랙 = 컬럼 방식 풀블리드
// #ISSUE: 넘치면 우측 풀블리드 슬라이드 + 화살표 활성상태(넘길 게 있으면 진해짐), 안 넘치면 중앙
// #ISSUE: 넘칠 때/안 넘칠 때 카드 JSX 가 통째로 복붙돼 있어 한쪽만 고치는 사고가 있었음 → Card 하나로 통합

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { resolveBALabel, type BAPhoto } from '@/components/lib/ba';
import { useBAPhotos, useBAPhotosLoading, filterBAPhotosBySlug } from '@/components/lib/useBAPhotos';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import T from '@/components/lang/T';
import Skeleton from '@/components/ui/Skeleton';

const CARD_W = 244;
const GAP = 23;
const SKELETON_COUNT = 4;

function Card({ b, overflow }: { b: BAPhoto; overflow: boolean }) {
    const t = useTranslations('common');
    const label = resolveBALabel(b);

    return (
        <article
            className="card-fixed-h t-tight flex h-[464px] w-[244px] shrink-0 snap-start flex-col rounded-[10px] bg-cream text-cocoa"
            style={{ '--card-h': '464px' } as React.CSSProperties}
        >
            {/* 시술명은 messages/*.json 의 labels 네임스페이스로 교체, "전후 사진"은 common 네임스페이스로 교체.
                #ISSUE: "시술명 전후 사진" 을 한 줄로 흘리면 이름 길이에 따라 줄 수가 갈려 헤더 높이가 제각각이었다
                        → 시술명 / 전후 사진 두 덩이로 쪼개고 헤더를 3줄 높이(min-h-[3lh])로 고정.
                        헤더가 한 줄분 늘어난 만큼 카드 높이도 439 → 464px(화살표 top 은 그 절반) */}
            <h3 className="flex min-h-[3lh] flex-col justify-center px-3 py-5 text-center text-lead font-bold leading-snug">
                <span className="line-clamp-2 break-keep">
                    <T ko={label} />
                </span>
                <span>{t('beforeAfter')}</span>
            </h3>

            <div className="skeleton relative h-[147px] w-full overflow-hidden">
                <Image
                    src={b.before}
                    alt={t('beforeAltWithLabel', { label })}
                    fill
                    quality={85}
                    sizes="244px"
                    className="object-cover"
                />
            </div>

            <div className="relative z-10 flex h-0 justify-center">
                <span
                    className={cn(
                        'flex -translate-y-1/2 items-center justify-center rounded-full',
                        overflow ? 'h-[32px] w-[32px] bg-cream/50' : 'h-[34px] w-[34px] bg-cocoa',
                    )}
                >
                    <span
                        aria-hidden
                        className={cn(
                            'mt-[-3px] block rotate-45 border-b-2 border-r-2',
                            overflow ? 'h-3 w-3 border-cocoa!' : 'h-2 w-2 border-cream',
                        )}
                    />
                </span>
            </div>

            <div className="skeleton relative h-[147px] w-full overflow-hidden">
                <Image src={b.after} alt={t('afterAlt')} fill quality={85} sizes="244px" className="object-cover" />
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-3 pb-3.5 pt-4">
                <p className="line-clamp-2 max-w-full rounded-[16px] bg-cocoa px-4 py-0.5 text-center text-small font-bold leading-snug text-cream">
                    <T ko={label} />
                </p>
                <span className="notranslate font-display text-caption mt-1 text-cocoa/30">RE:BERRY</span>
            </div>
        </article>
    );
}

// slug 를 받아서 컴포넌트가 직접 Firestore 를 확인 — 서버 페이지(page.tsx)는 slug 문자열만 넘기면 됨
export default function BACardSlider({ slug }: { slug: string }) {
    const t = useTranslations('common');
    const allPhotos = useBAPhotos();
    const loading = useBAPhotosLoading();
    const photos = filterBAPhotosBySlug(allPhotos, slug);

    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(photos.length, CARD_W, GAP);

    if (loading) {
        return (
            <div className="relative mx-auto max-w-[1045px]">
                <div className="flex justify-center gap-[23px] overflow-hidden">
                    {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                        <Skeleton key={i} className="h-[464px] w-[244px] shrink-0 rounded-[10px]" />
                    ))}
                </div>
                <div className="mt-6 flex justify-center gap-2 lg:mt-[58px]">
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-1.5 w-1.5 rounded-full" />
                    ))}
                </div>
            </div>
        );
    }

    if (photos.length === 0) return null;

    return (
        <div className="relative mx-auto max-w-[1045px]">
            {/* 메인 BASlider 화살표 그대로 — 배경 없음(border만), 넘길 방향이 있으면 진하게 */}
            {over && (
                <>
                    <button
                        onClick={() => move(-1)}
                        aria-label={t('prev')}
                        className={cn(
                            'absolute -left-16 top-[232px] z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border border-cream bg-transparent transition-all duration-500 hover:scale-105 min-[1240px]:flex min-[1440px]:-left-24',
                            canPrev ? 'opacity-100' : 'opacity-30',
                        )}
                    >
                        <span
                            aria-hidden
                            className="mr-[-3px] block h-3 w-3 rotate-45 border-b-2 border-l-2 border-cream"
                        />
                    </button>
                    <button
                        onClick={() => move(1)}
                        aria-label={t('next')}
                        className={cn(
                            'absolute -right-16 top-[232px] z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border border-cream bg-transparent transition-all duration-500 hover:scale-105 min-[1240px]:flex min-[1440px]:-right-24',
                            canNext ? 'opacity-100' : 'opacity-30',
                        )}
                    >
                        <span
                            aria-hidden
                            className="ml-[-3px] block h-3 w-3 rotate-45 border-r-2 border-t-2 border-cream"
                        />
                    </button>
                </>
            )}

            <div
                ref={ref}
                {...(over ? dragProps : {})}
                onScroll={onScroll}
                className={cn(
                    'flex gap-[23px]',
                    over && 'no-scrollbar snap-x overflow-x-auto scroll-smooth pb-1',
                    // 풀블리드는 창(1045)이 화면에 안 들어가는 반응형 구간에서만 — 1140 이상은 창 안 스크롤(시안: 4개 노출)
                    over && 'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)] min-[1140px]:mr-0 min-[1140px]:pr-0',
                    over && dragClass,
                    !over && 'justify-center',
                )}
            >
                {photos.map((b) => (
                    <Card key={b.id} b={b} overflow={over} />
                ))}
            </div>

            {/* 메인 BASlider 도트 그대로 (다크 섹션 → 크림) */}
            <div className="mt-6 flex justify-center gap-2 lg:mt-[58px]">
                {Array.from({ length: total }).map((_, d) => (
                    <span
                        key={d}
                        className={cn(
                            'h-1.5 w-1.5 rounded-full transition-colors',
                            page === d + 1 ? 'bg-cream' : 'bg-cream/30',
                        )}
                    />
                ))}
            </div>
        </div>
    );
}

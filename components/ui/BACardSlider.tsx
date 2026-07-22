// #COMPONENTS: 시그니처 전후 카드 슬라이더
// #STYLE: 화살표/도트 = 메인 BASlider 것을 그대로 (화살표는 배경색 없음 버전) / 트랙 = 컬럼 방식 풀블리드
// #ISSUE: 넘치면 우측 풀블리드 슬라이드 + 화살표 활성상태(넘길 게 있으면 진해짐), 안 넘치면 중앙

'use client';

import Image from 'next/image';
import { useBAPhotos, filterBAPhotosBySlug } from '@/components/lib/useBAPhotos';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';

const CARD_W = 244;
const GAP = 23;

// slug 를 받아서 컴포넌트가 직접 Firestore 를 확인 — 서버 페이지(page.tsx)는 slug 문자열만 넘기면 됨
export default function BACardSlider({ slug }: { slug: string }) {
    const allPhotos = useBAPhotos();
    const photos = filterBAPhotosBySlug(allPhotos, slug);

    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(photos.length, CARD_W, GAP);

    if (photos.length === 0) return null;

    return (
        <div className="relative mx-auto max-w-[1045px]">
            {/* 메인 BASlider 화살표 그대로 — 배경 없음(border만), 넘길 방향이 있으면 진하게 */}
            {over && (
                <>
                    <button
                        onClick={() => move(-1)}
                        aria-label="이전"
                        className={cn(
                            'absolute -left-16 top-[219px] z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border border-cream bg-transparent transition-all duration-500 hover:scale-105 min-[1240px]:flex min-[1440px]:-left-24',
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
                        aria-label="다음"
                        className={cn(
                            'absolute -right-16 top-[219px] z-10 hidden h-[50px] w-[50px] -translate-y-1/2 items-center justify-center rounded-full border border-cream bg-transparent transition-all duration-500 hover:scale-105 min-[1240px]:flex min-[1440px]:-right-24',
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

            {over ? (
                /* 컬럼과 동일 — 우측 뷰포트 끝까지 풀블리드, 좌측은 컨테이너 라인 */
                <div
                    ref={ref}
                    {...dragProps}
                    onScroll={onScroll}
                    className={cn(
                        'no-scrollbar flex snap-x gap-[23px] overflow-x-auto scroll-smooth pb-1',
                        // 풀블리드는 창(1045)이 화면에 안 들어가는 반응형 구간에서만 — 1140 이상은 창 안 스크롤(시안: 4개 노출)
                        'mr-[calc(50%-50vw-2px)] pr-[calc(50vw-50%+40px)] min-[1140px]:mr-0 min-[1140px]:pr-0',
                        dragClass,
                    )}
                >
                    {photos.map((b) => (
                        <article
                            key={b.id}
                            className="snap-start shrink-0 w-[244px] flex h-[439px] flex-col rounded-[10px] bg-cream text-cocoa"
                        >
                            <h3 className="notranslate py-5 text-center text-lead font-bold leading-none">
                                {b.label} 전후 사진
                            </h3>

                            <div className="relative h-[147px] w-full overflow-hidden">
                                <Image
                                    src={b.before}
                                    alt={`${b.label}시술 전`}
                                    fill
                                    quality={85}
                                    sizes="244px"
                                    className="scale-110 object-cover blur-[6px]"
                                />
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="rounded-full bg-deep/70 px-3.5 py-1.5 text-caption-sm text-cream">
                                        로그인
                                    </span>
                                </span>
                            </div>

                            <div className="relative z-10 flex h-0 justify-center">
                                <span className="flex h-[32px] w-[32px] -translate-y-1/2 items-center justify-center rounded-full bg-cream/50">
                                    <span
                                        aria-hidden
                                        className="mt-[-3px] block h-3 w-3 rotate-45 border-b-2 border-r-2 border-cocoa!"
                                    />
                                </span>
                            </div>

                            <div className="relative h-[147px] w-full overflow-hidden">
                                <Image
                                    src={b.after}
                                    alt="시술 후"
                                    fill
                                    quality={85}
                                    sizes="244px"
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex flex-col flex-1 items-center justify-center pb-3.5 pt-4">
                                <p className="rounded-full bg-cocoa px-4 text-lead font-bold text-cream">{b.label}</p>
                                <span className="font-display text-caption mt-1 text-cocoa/30">RE:BERRY</span>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div ref={ref} className="flex justify-center gap-[23px]">
                    {photos.map((b) => (
                        <article
                            key={b.id}
                            className="flex h-[439px] w-[244px] shrink-0 flex-col rounded-[10px] bg-cream text-cocoa"
                        >
                            <h3 className="notranslate py-5 text-center text-lead font-bold leading-none">
                                {b.label} 전후 사진
                            </h3>

                            <div className="relative h-[147px] w-full overflow-hidden">
                                <Image
                                    src={b.before}
                                    alt={`${b.label}시술 전`}
                                    fill
                                    quality={85}
                                    sizes="244px"
                                    className="scale-110 object-cover blur-[6px]"
                                />
                                <span className="absolute inset-0 flex items-center justify-center">
                                    <span className="rounded-full bg-deep/70 px-3.5 py-1.5 text-caption-sm text-cream">
                                        로그인
                                    </span>
                                </span>
                            </div>

                            <div className="relative z-10 flex h-0 justify-center">
                                <span className="flex h-[34px] w-[34px] -translate-y-1/2 items-center justify-center rounded-full bg-cocoa">
                                    <span
                                        aria-hidden
                                        className="mt-[-3px] block h-2 w-2 rotate-45 border-b-2 border-r-2 border-cream"
                                    />
                                </span>
                            </div>

                            <div className="relative h-[147px] w-full overflow-hidden">
                                <Image
                                    src={b.after}
                                    alt="시술 후"
                                    fill
                                    quality={85}
                                    sizes="244px"
                                    className="object-cover"
                                />
                            </div>

                            <div className="flex flex-col flex-1 items-center justify-center pb-3.5 pt-4">
                                <p className="rounded-full bg-cocoa px-4 text-lead font-bold text-cream">{b.label}</p>
                                <span className="font-display text-caption mt-1 text-cocoa/30">RE:BERRY</span>
                            </div>
                        </article>
                    ))}
                </div>
            )}

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

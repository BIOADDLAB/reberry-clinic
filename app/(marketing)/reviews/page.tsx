'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import BAPhotoModal from '@/components/ui/BAPhotoModal';
import Skeleton from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import T from '@/components/lang/T';
import { cn } from '@/components/lib/cn';
import { BA_CATEGORIES, baCategoryLabel, baPhotoUrl, resolveBACategory, resolveBALabel, type BAPhoto } from '@/components/lib/ba';
import { filterReviewBAPhotos, useBAPhotos, useBAPhotosLoading } from '@/components/lib/useBAPhotos';
import TextureBackground from '@/components/ui/TextureBackground';

const PER_PAGE = 8;

/** 카테고리 탭의 '전체' 자리. BA_CATEGORIES 에 넣지 않는 이유는 실제 분류값이 아니기 때문 */
const ALL = 'all';

const shuffle = (arr: BAPhoto[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

export default function ReviewsPage() {
    const tReviews = useTranslations('reviews');
    const [page, setPage] = useState(1);
    const [category, setCategory] = useState<string>(ALL);
    const allPhotos = useBAPhotos();
    const loading = useBAPhotosLoading();
    // 관리자에서 '시술 페이지만' 으로 등록한 사진은 이 페이지에 안 나온다
    const photos = useMemo(() => filterReviewBAPhotos(allPhotos), [allPhotos]);
    const [shuffled, setShuffled] = useState<BAPhoto[]>([]);
    const [selectedPhoto, setSelectedPhoto] = useState<BAPhoto | null>(null);
    const topRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setShuffled(shuffle(photos));
    }, [photos]);

    const isFirstRender = useRef(true);
    useEffect(() => {
        // 처음 들어왔을 때는 스크롤 안 함(히어로부터 보이게) → 페이지 넘길 때만 화면 맨 위로
        if (isFirstRender.current) {
            isFirstRender.current = false;
            return;
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, [page]);

    // 카테고리별 장수 — 0장인 탭은 아예 안 그린다(빈 탭을 눌러 빈 화면을 보게 두지 않음)
    const counts = useMemo(() => {
        const map = new Map<string, number>();
        for (const p of shuffled) {
            const key = resolveBACategory(p);
            if (key) map.set(key, (map.get(key) ?? 0) + 1);
        }
        return map;
    }, [shuffled]);

    const visibleTabs = useMemo(
        () => [{ key: ALL, label: '전체' }, ...BA_CATEGORIES.filter((c) => (counts.get(c.key) ?? 0) > 0)],
        [counts],
    );

    const filtered = useMemo(
        () => (category === ALL ? shuffled : shuffled.filter((p) => resolveBACategory(p) === category)),
        [shuffled, category],
    );

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const start = (page - 1) * PER_PAGE;
    const currentPhotos = filtered.slice(start, start + PER_PAGE);

    const pickCategory = (key: string) => {
        setCategory(key);
        setPage(1);
    };

    return (
        <>
            <SubHero en="Before &amp; After" image="/images/bg-sub-06.jpg" />

            <section className="relative py-20 lg:py-37.5">
                <TextureBackground src="/images/bg-texture-06.jpg" priority />
                <div className="container-site relative">
                    <div ref={topRef} />

                    {/* #STYLE: 불필요한 Reveal 애니메이션 컴포넌트들을 제거하고 기본 div 요소로 대체 */}
                    <div className="text-center">
                        <h2 className="notranslate font-display text-h2 tracking-[0.06em]">Before &amp; After</h2>
                    </div>

                    {/* 카테고리 탭 — 탭 목록은 ba.ts 의 BA_CATEGORIES 에서 온다.
                        #ISSUE: 가로 스크롤로 두니 모바일에서 뒤쪽 탭이 잘린 것처럼 보였다.
                        → 좁은 화면에서는 알약 하나하나가 여러 줄로 자동 줄바꿈(flex-wrap)되고,
                          한 줄에 다 들어가는 lg(1024px) 이상에서만 시안대로 알약 바로 묶인다 */}
                    {!loading && visibleTabs.length > 1 && (
                        <div className="mt-10 flex justify-center lg:mt-14">
                            <div
                                role="group"
                                aria-label={tReviews('categoryLabel')}
                                className="flex max-w-full flex-wrap justify-center gap-2 lg:gap-1 lg:rounded-full lg:border lg:border-cocoa/15 lg:bg-cream/70 lg:p-1.5"
                            >
                                {visibleTabs.map((tab) => (
                                    <button
                                        key={tab.key}
                                        type="button"
                                        onClick={() => pickCategory(tab.key)}
                                        aria-pressed={category === tab.key}
                                        className={cn(
                                            'rounded-full px-4 py-2 text-small whitespace-nowrap transition-colors lg:px-5',
                                            category === tab.key
                                                ? 'border border-cocoa bg-cocoa font-semibold text-cream'
                                                : 'border border-cocoa/15 bg-cream/70 text-cocoa/60 hover:bg-sand/40 hover:text-cocoa lg:border-transparent lg:bg-transparent',
                                        )}
                                    >
                                        <T ko={tab.label} />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:mt-16 lg:grid-cols-4">
                        {/* Firestore 응답 대기 중 — 한 페이지 분량(8개)만큼 스켈레톤 카드 */}
                        {loading
                            ? Array.from({ length: PER_PAGE }).map((_, i) => (
                                  <div key={i} className="rounded-[4px] bg-sand p-2.5 shadow-sm">
                                      <Skeleton className="aspect-square" />
                                      <Skeleton className="mx-auto mt-3 h-4 w-32 rounded-full" />
                                      <Skeleton className="mx-auto mt-2 h-3 w-20 rounded-full" />
                                  </div>
                              ))
                            : currentPhotos.map((r) => {
                                  /* #ISSUE: 예전 카드는 사진 안에 이미 시술일이 박혀 있는데 카드에도 또 찍혀 중복이었다.
                                     → 시술일은 빼고, 카테고리 칩 + 흰 카드로 정리 (타 병원 전후사진 페이지 표준형) */
                                  const categoryKey = resolveBACategory(r);
                                  const label = resolveBALabel(r);

                                  return (
                                      <button
                                          key={r.id}
                                          type="button"
                                          onClick={() => setSelectedPhoto(r)}
                                          className="group block overflow-hidden rounded-[6px] bg-white text-left shadow-[0_4px_18px_rgba(69,54,45,0.06)] ring-1 ring-cocoa/[0.06] transition-transform duration-300 hover:-translate-y-1"
                                      >
                                          <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
                                              {categoryKey ? (
                                                  <span className="rounded-full bg-sand/70 px-2.5 py-1 text-caption-sm font-semibold text-cocoa/70">
                                                      <T ko={baCategoryLabel(categoryKey)} />
                                                  </span>
                                              ) : (
                                                  <span aria-hidden />
                                              )}
                                              <span className="notranslate font-display text-caption-sm tracking-[0.2em] text-cocoa/30">
                                                  RE:BERRY
                                              </span>
                                          </div>
                                          <div className="skeleton relative aspect-square overflow-hidden bg-white">
                                              <Image
                                                  src={baPhotoUrl(r)}
                                                  alt={tReviews('beforeAlt')}
                                                  fill
                                                  quality={85}
                                                  sizes="(max-width: 768px) 90vw, (max-width: 1024px) 45vw, 220px"
                                                  className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                                              />
                                          </div>
                                          {/* 클릭(상세보기) 전에도 무슨 시술인지 바로 보이도록 사진 아래 시술명 알약 표기 */}
                                          <div className="flex justify-center px-3.5 py-3">
                                              <span className="line-clamp-1 max-w-full rounded-full bg-cocoa px-4 py-1 text-center text-caption-sm font-bold leading-snug text-cream">
                                                  <T ko={label} />
                                              </span>
                                          </div>
                                      </button>
                                  );
                              })}
                    </div>

                    {!loading && filtered.length === 0 && (
                        <p className="mt-16 text-center text-small text-latte">{tReviews('empty')}</p>
                    )}

                    {/* 페이지네이션 — 피부칼럼(SkinColumnList)과 같은 숫자형으로 통일 */}
                    {!loading && (
                        <Pagination
                            currentPage={page}
                            totalPages={totalPages}
                            onChange={setPage}
                            label={tReviews('pagination')}
                            prevLabel={tReviews('prevPage')}
                            nextLabel={tReviews('nextPage')}
                            className="mt-16 lg:mt-21"
                        />
                    )}
                </div>
            </section>

            <BAPhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
            <LocationSection />
        </>
    );
}

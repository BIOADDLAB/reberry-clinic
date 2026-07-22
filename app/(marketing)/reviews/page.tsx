'use client';

import { useState, useEffect, useRef, useSyncExternalStore } from 'react';
import Image from 'next/image';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import BAPhotoModal from '@/components/ui/BAPhotoModal';
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';
import Reveal from '@/components/motion/Reveal';
import type { BAPhoto } from '@/components/lib/ba';
import { useBAPhotos } from '@/components/lib/useBAPhotos';

const PER_PAGE = 8;
const MOBILE_QUERY = '(max-width: 767px)';

const shuffle = (arr: BAPhoto[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

const subscribeMobile = (callback: () => void) => {
    const mql = window.matchMedia(MOBILE_QUERY);
    mql.addEventListener('change', callback);
    return () => mql.removeEventListener('change', callback);
};
const getMobileSnapshot = () => window.matchMedia(MOBILE_QUERY).matches;
const getMobileServerSnapshot = () => false;

export default function ReviewsPage() {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [page, setPage] = useState(1);
    const photos = useBAPhotos(); // 정적 폴백으로 시작 → Firestore 도착하면 자동 교체
    const [shuffled, setShuffled] = useState<BAPhoto[]>(photos);
    const [selectedPhoto, setSelectedPhoto] = useState<BAPhoto | null>(null);
    const topRef = useRef<HTMLDivElement>(null);

    const isMobile = useSyncExternalStore(subscribeMobile, getMobileSnapshot, getMobileServerSnapshot);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- 서버/클라 결과가 달라야 하는 랜덤 셔플
        setShuffled(shuffle(photos));
    }, [photos]);

    useEffect(() => {
        topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [page]);

    const totalPages = Math.ceil(shuffled.length / PER_PAGE);
    const start = (page - 1) * PER_PAGE;
    const currentPhotos = shuffled.slice(start, start + PER_PAGE);

    const goPrev = () => setPage((p) => Math.max(1, p - 1));
    const goNext = () => setPage((p) => Math.min(totalPages, p + 1));

    const Group = isMobile ? 'div' : RevealGroup;
    const Item = isMobile ? 'div' : RevealItem;

    return (
        <>
            <SubHero en="Before &amp; After" image="/images/bg-sub-06.jpg" />

            <section className="relative py-20 lg:py-37.5">
                <Image
                    src="/images/bg-texture-06.jpg"
                    alt=""
                    fill
                    priority
                    quality={88}
                    sizes="100vw"
                    className="object-cover"
                />
                <div className="container-site relative">
                    <div ref={topRef} />

                    <Reveal className="text-center">
                        <h2 className="font-display text-h2 tracking-[0.06em]">Before &amp; After</h2>
                    </Reveal>

                    <Group
                        key={isMobile ? 'mobile' : `desktop-${page}`}
                        className="mt-12 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 lg:mt-21 lg:grid-cols-4"
                    >
                        {currentPhotos.map((r) => (
                            <Item key={r.id} className="bg-sand p-2.5 rounded-[4px] shadow-sm">
                                <div
                                    onClick={() => setSelectedPhoto(r)}
                                    className="cursor-pointer transition-transform hover:scale-[1.02]"
                                >
                                    <div className="grid grid-cols-2 gap-1">
                                        <div className="relative aspect-[4/3] overflow-hidden">
                                            <Image
                                                src={r.before}
                                                alt="시술 전 (로그인 후 공개)"
                                                fill
                                                quality={85}
                                                sizes="(max-width: 768px) 160px, 220px"
                                                className="scale-110 object-cover blur-[7px]"
                                            />
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setIsLoginModalOpen(true);
                                                }}
                                                className="absolute inset-0 flex items-center justify-center bg-deep/5 transition-colors hover:bg-deep/15"
                                            >
                                                <span className="rounded-[2px] border border-cream/90 rounded-full px-3 py-1 text-[11px] font-bold text-cream/90 shadow-sm transition-transform hover:scale-105">
                                                    로그인
                                                </span>
                                            </button>
                                        </div>
                                        <div className="relative aspect-[4/3]">
                                            <Image
                                                src={r.after}
                                                alt="시술 후"
                                                fill
                                                quality={85}
                                                sizes="(max-width: 768px) 160px, 220px"
                                                className="object-cover"
                                            />
                                        </div>
                                    </div>
                                    <p className="font-display flex items-center justify-center gap-6 pt-3 text-lead text-cream/90">
                                        Before <span aria-hidden>→</span> After
                                    </p>
                                    <p className="font-display text-center text-small tracking-[0.2em] text-cream/40">
                                        RE:BERRY
                                    </p>
                                </div>
                            </Item>
                        ))}
                    </Group>

                    <Reveal className="mt-21 flex items-center justify-center gap-6">
                        <button
                            onClick={goPrev}
                            disabled={page === 1}
                            className="text-cocoa/60 mt-1 hover:text-cocoa transition-colors disabled:opacity-30"
                            aria-label="이전 페이지"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15 19l-7-7 7-7"
                                />
                            </svg>
                        </button>
                        <span className="font-display text-lead tracking-[0.15em] text-cocoa">
                            {page} / {totalPages}
                        </span>
                        <button
                            onClick={goNext}
                            disabled={page === totalPages}
                            className="text-cocoa/60 mt-1 hover:text-cocoa transition-colors disabled:opacity-30"
                            aria-label="다음 페이지"
                        >
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    </Reveal>
                </div>
            </section>

            <BAPhotoModal
                photo={selectedPhoto}
                onClose={() => setSelectedPhoto(null)}
                onLoginRequired={() => setIsLoginModalOpen(true)}
            />
            <LocationSection />
        </>
    );
}

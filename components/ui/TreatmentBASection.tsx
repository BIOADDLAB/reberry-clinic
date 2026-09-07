'use client';

import Reveal from '@/components/motion/Reveal';
import { TREATMENT_PAGES } from '@/components/lib/adminConfig';
import { filterBAPhotosBySlug, useBAPhotos, useBAPhotosLoading } from '@/components/lib/useBAPhotos';
import BACardSlider from '@/components/ui/BACardSlider';

/*
 * #FIX: 슬라이더만 null을 반환하면 바깥 section의 배경과 제목은 남는다.
 * Firestore 조회가 끝난 뒤 해당 페이지 사진이 0건이면, emptyPlaceholder가 있을 때만
 * 한 칸짜리 준비중 카드를 보여 주고 그 외에는 section 자체를 만들지 않는다.
 */
export default function TreatmentBASection({
    slug,
    emptyPlaceholder = false,
}: {
    slug: string;
    emptyPlaceholder?: boolean;
}) {
    const photos = filterBAPhotosBySlug(useBAPhotos(), slug);
    const loading = useBAPhotosLoading();
    const emptyLabel = TREATMENT_PAGES.find((page) => page.slug === slug)?.label;
    const showEmpty = emptyPlaceholder && photos.length === 0 && Boolean(emptyLabel);

    if (loading || (photos.length === 0 && !showEmpty)) return null;

    return (
        <section className="texture-dark bg-cocoa! py-20 text-cream lg:py-30">
            <div className="container-site">
                <Reveal className="text-center">
                    <h2 className="font-display text-h2 tracking-[0.06em]">Your Beauty Physician</h2>
                </Reveal>
                <Reveal className="mt-12">
                    <BACardSlider slug={slug} emptyPlaceholder={emptyPlaceholder} emptyLabel={emptyLabel} />
                </Reveal>
            </div>
        </section>
    );
}

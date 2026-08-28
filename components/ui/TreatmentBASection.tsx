'use client';

import Reveal from '@/components/motion/Reveal';
import { filterBAPhotosBySlug, useBAPhotos, useBAPhotosLoading } from '@/components/lib/useBAPhotos';
import BACardSlider from '@/components/ui/BACardSlider';

/*
 * #FIX: 슬라이더만 null을 반환하면 바깥 section의 배경과 제목은 남는다.
 * Firestore 조회가 끝난 뒤 해당 페이지 사진이 0건이면 section 자체를 만들지 않는다.
 */
export default function TreatmentBASection({ slug }: { slug: string }) {
    const photos = filterBAPhotosBySlug(useBAPhotos(), slug);
    const loading = useBAPhotosLoading();

    if (loading || photos.length === 0) return null;

    return (
        <section className="texture-dark bg-cocoa! py-20 text-cream lg:py-30">
            <div className="container-site">
                <Reveal className="text-center">
                    <h2 className="font-display text-h2 tracking-[0.06em]">Your Beauty Physician</h2>
                </Reveal>
                <Reveal className="mt-12">
                    <BACardSlider slug={slug} />
                </Reveal>
            </div>
        </section>
    );
}

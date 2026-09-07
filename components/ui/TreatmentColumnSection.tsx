/* #COMPONENTS: 시술 페이지 칼럼 섹션
   #ISSUE: 제목("논문으로 검증하고, 임상으로 증명한 OO 이야기")이 시그니처는 코드 상수,
           피부교정·안티에이징은 다른 문구로 갈려 있어 병원에서 못 고치는 페이지가 있었다.
   → 모든 시술 페이지가 useTreatmentColumnHeading(slug) 하나를 쓰도록 통일한다.
     관리자 → 블로그 연결 관리 에서 페이지별로 제목을 저장하면 그대로 반영된다.
     저장된 값이 없으면 "논문으로 검증하고, 임상으로 증명한 {시술명} 이야기" 가 기본. */

'use client';

import Reveal from '@/components/motion/Reveal';
import { useColumnsBySlug } from '@/components/lib/useColumns';
import { useTreatmentColumnHeading } from '@/components/lib/useTreatmentColumnHeading';
import { ColumnListContent } from '@/components/ui/ColumnSlider';
import TextureBackground from '@/components/ui/TextureBackground';

interface Props {
    slug: string;
    name: string;
    /** 페이지에서 넘긴 기본 문구(시그니처). 관리자 저장값이 우선한다 */
    heading?: string;
    variant?: 'card' | 'list';
}

/** 관리자에 저장된 값이 없을 때 쓰는 기본 제목 */
export const defaultColumnHeading = (name: string) => `논문으로 검증하고, 임상으로 증명한 ${name} 이야기`;

export default function TreatmentColumnSection({ slug, name, heading }: Props) {
    const items = useColumnsBySlug(slug, []);
    const managedHeading = useTreatmentColumnHeading(slug, heading || defaultColumnHeading(name));

    if (items.length === 0) return null;

    // "앞부분, 뒷부분" 형태면 뒤쪽을 굵게 (기존 표기 유지)
    const parts = managedHeading.match(/^(.+?[,、，])\s*(.+)$/);

    return (
        <section className="relative overflow-x-clip bg-cream py-20 lg:pt-32.5 lg:pb-37.5">
            <TextureBackground src="/images/bg-texture-08.jpg" />
            <div className="container-site relative">
                <Reveal className="text-center">
                    <p className="notranslate font-display text-h2">Column</p>
                    <h2 className="mx-auto mt-6 max-w-3xl text-h2 leading-9 tracking-tighter">
                        {parts ? (
                            <>
                                {parts[1]} <strong className="font-bold">{parts[2]}</strong>
                            </>
                        ) : (
                            <strong className="font-bold">{managedHeading}</strong>
                        )}
                    </h2>
                </Reveal>
                <Reveal className="mt-12 lg:mt-16">
                    <ColumnListContent items={items} />
                </Reveal>
            </div>
        </section>
    );
}

/* #COMPONENTS: 시술 페이지 칼럼 섹션
   #ISSUE: 제목("논문으로 검증하고, 임상으로 증명한 OO 이야기")이 시그니처는 코드 상수,
           피부교정·안티에이징은 다른 문구로 갈려 있어 병원에서 못 고치는 페이지가 있었다.
   → 모든 시술 페이지가 useTreatmentColumnHeading(slug) 하나를 쓰도록 통일한다.
     관리자 → 블로그 연결 관리 에서 페이지별로 제목을 저장하면 그대로 반영된다.
     저장된 값이 없으면 "논문으로 검증하고, 임상으로 증명한 {시술명} 이야기" 가 기본. */

'use client';

import { useLocale } from 'next-intl';
import Reveal from '@/components/motion/Reveal';
import { cn } from '@/components/lib/cn';
import { useColumnsBySlug } from '@/components/lib/useColumns';
import { useTreatmentColumnHeading } from '@/components/lib/useTreatmentColumnHeading';
import { ColumnListContent } from '@/components/ui/ColumnSlider';
import TextureBackground from '@/components/ui/TextureBackground';
import { Rich } from '@/components/signature/SignatureParts';

interface Props {
    slug: string;
    name: string;
    /** 페이지에서 넘긴 기본 문구(시그니처). 관리자 저장값이 우선한다 */
    heading?: string;
    variant?: 'card' | 'list';
    /** #ISSUE: 안티에이징 기기 상세 페이지는 바로 위 StepPlan(tone="sand")와 이 섹션이
        똑같은 texture-08 이미지를 써서 두 섹션이 한 덩어리로 겹쳐 보였다.
        다른 결(texture-06)로 바꿔도 결이 있는 채로는 여전히 붙어 보인다는 피드백.
        → "flat" 은 디엘브처럼 결 이미지 없이 살짝 다른 톤의 단색만 깐다. */
    tone?: 'default' | 'flat';
}

/** 관리자에 저장된 값이 없을 때 쓰는 기본 제목 */
export const defaultColumnHeading = (name: string) => `논문으로 검증하고, 임상으로 증명한 **${name}** 이야기`;

/** 시그니처와 같이 **굵게** 를 해석한다. 별표가 없으면 예전 쉼표 표기를 유지한다. */
export function ColumnHeadingText({ text }: { text: string }) {
    const locale = useLocale();
    if (text.includes('**')) {
        return <Rich text={text} strongClassName="font-bold" locale={locale} />;
    }
    const parts = text.match(/^(.+?[,、，])\s*(.+)$/);
    if (parts) {
        return (
            <>
                {parts[1]} <strong className="font-bold">{parts[2]}</strong>
            </>
        );
    }
    return <strong className="font-bold">{text}</strong>;
}

export default function TreatmentColumnSection({ slug, name, heading, tone = 'default' }: Props) {
    const items = useColumnsBySlug(slug, []);
    const managedHeading = useTreatmentColumnHeading(slug, heading || defaultColumnHeading(name));

    if (items.length === 0) return null;

    return (
        <section
            className={cn(
                'relative overflow-x-clip py-20 lg:pt-32.5 lg:pb-37.5',
                tone === 'flat' ? 'bg-[#F3EEE5]' : 'bg-cream',
            )}
        >
            {tone !== 'flat' && <TextureBackground src="/images/bg-texture-08.jpg" />}
            <div className="container-site relative">
                <Reveal className="text-center">
                    <p className="notranslate font-display text-h2">Column</p>
                    <h2 className="mx-auto mt-6 max-w-3xl text-h2 font-normal leading-9 tracking-tighter">
                        <ColumnHeadingText text={managedHeading} />
                    </h2>
                </Reveal>
                <Reveal className="mt-12 lg:mt-16">
                    <ColumnListContent items={items} />
                </Reveal>
            </div>
        </section>
    );
}

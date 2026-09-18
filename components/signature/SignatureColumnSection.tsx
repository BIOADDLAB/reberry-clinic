/* #COMPONENTS: 시그니처 칼럼 — "{시술명} 이야기"
   - 목록은 관리자 → 블로그 연결 관리 → 시그니처 탭에서 이 페이지(slug)에 등록한 칼럼이 그대로 나온다.
   - 목록 모양은 다른 시술 페이지와 같은 ColumnListContent 를 그대로 쓴다(디자인 통일).
   - 등록된 칼럼이 없으면 제목까지 통째로 숨긴다.
   #ISSUE: 제목이 시안 문구("{시술명} 이야기")로 코드에 박혀 있어 병원에서 못 고쳤다.
           다른 시술 페이지는 관리자에서 고칠 수 있는데 시그니처만 예외였다.
           → 다른 페이지와 같은 useTreatmentColumnHeading 을 쓴다. 관리자에 저장된 값이 없으면
             지금까지 나오던 시안 문구가 그대로 기본값이다. */

'use client';

import { cn } from '@/components/lib/cn';
import { useColumnsBySlug } from '@/components/lib/useColumns';
import { useTreatmentColumnHeading } from '@/components/lib/useTreatmentColumnHeading';
import Reveal from '@/components/motion/Reveal';
import { ColumnListContent } from '@/components/ui/ColumnSlider';
import { Rich, SIG_TYPE } from '@/components/signature/SignatureParts';

export default function SignatureColumnSection({ slug, title, locale }: { slug: string; title: string; locale: string }) {
    const items = useColumnsBySlug(slug, []);
    const heading = useTreatmentColumnHeading(slug, title);

    if (items.length === 0) return null;

    return (
        <div className="mt-20 lg:mt-[114px]">
            {/* #ISSUE: 폭 제한(1190)을 제목까지 감싸도록 걸었더니, 제목에 걸린 text-balance 가
                       좁아진 폭에 맞춰 줄을 다시 나눠 "…부스터 / 이야기" 로 끊겼다.
                       → 제목은 컨테이너 폭 그대로 두고, 폭 제한은 아래 목록에만 준다. */}
            <Reveal className="text-center">
                <h2 className={cn('text-balance font-normal leading-[1.4] tracking-tighter', SIG_TYPE.h2)}>
                    <Rich text={heading} strongClassName="font-bold" locale={locale} />
                </h2>
            </Reveal>
            {/* 위 스토리 단(최대 1190)과 왼쪽·오른쪽 끝을 맞춘다 */}
            <div className="mx-auto mt-10 max-w-[1190px] lg:mt-[51px]">
                <ColumnListContent items={items} wide />
            </div>
        </div>
    );
}

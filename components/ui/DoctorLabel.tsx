'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/components/lib/cn';

/* #ISSUE: "닥터 파이톤 Pytone" 이 구글 번역에서 "Dr. Python" / "ドクターパイトン" 으로
   깨졌음(파이톤을 프로그래밍 언어 Python 으로 오역). 브랜드 표기라 언어별로 직접 지정한다.
   ColumnSlider / DeviceColumnSlider 두 곳에서 같은 문구를 쓰므로 컴포넌트로 뺌. */
export default function DoctorLabel({ className }: { className?: string }) {
    const t = useTranslations('common');

    return (
        <p className={cn('text-small font-bold text-cocoa lg:text-medium lg:font-normal', className)}>
            {t.rich('doctorLabel', { brand: (chunks) => <span className="font-display">{chunks}</span> })}
            <span className="ml-1.5 inline-block align-middle text-[0.7em]">▶</span>
        </p>
    );
}

'use client';

import { useLocale, useTranslations } from 'next-intl';
import { cn } from '@/components/lib/cn';

interface Props {
    ko: string;
    className?: string;
}

/* 사전 치환 컴포넌트 — 데이터(site.ts, Firestore 라벨)에서 흘러온 한국어 원문을
   messages/*.json 의 "labels" 네임스페이스에서 찾아 언어별 문구로 바꾼다.

   - 키는 화면에 쓰는 한국어 원문 그대로 (messages/ko.json 의 labels 키와 정확히 같아야 함)
   - 없으면 한국어 원문 그대로 노출 (관리자가 새 라벨을 넣어도 화면이 비지 않음)
   - ko 로케일이거나 라벨이 없으면 notranslate 를 붙이지 않는다(브라우저 자체 번역 방지용으로만 사용) */
export default function T({ ko, className }: Props) {
    const locale = useLocale();
    const t = useTranslations('labels');
    const key = ko.trim();
    const hit = locale !== 'ko' && t.has(key) ? t(key) : null;

    return <span className={cn(hit && 'notranslate', className)}>{hit ?? ko}</span>;
}

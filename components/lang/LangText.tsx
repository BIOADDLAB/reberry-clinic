'use client';

import type { ReactNode } from 'react';
import { useLang, type Lang } from '@/components/lib/useLang';
import { cn } from '@/components/lib/cn';

interface Props {
    ko: ReactNode;
    en?: ReactNode;
    ja?: ReactNode;
    zh?: ReactNode; // zh-CN
    className?: string;
}

/* 부분 수동 번역 컴포넌트
   구글 번역이 깨뜨리는 "중요 문구"만 골라서 직접 번역할 때 사용.
   - notranslate 가 붙어 구글 번역에서 제외됨 (이중 번역 방지)
   - 해당 언어가 비어 있으면 en → ko 순으로 폴백
   - ReactNode 를 받으므로 <strong>, <br /> 같은 마크업 유지 가능

   사용 예 (메인 인용 문구):
   <h2 className="text-h2">
       <LangText
           ko={<>한사람, 한 사람의 <strong className="hl font-bold">고민에 집중한 결과</strong></>}
           en={<>Results from focusing on <strong className="hl font-bold">each person's concern</strong></>}
           ja={<>一人ひとりの<strong className="hl font-bold">悩みに向き合った結果</strong></>}
           zh={<>专注于<strong className="hl font-bold">每一位顾客的困扰</strong></>}
       />
   </h2>

   언어별 스타일까지 다르게: className="main-quote" 를 주고 globals.css 에서
   html[data-lang='ja'] .main-quote { letter-spacing: 0; font-size: 32px; } */
export default function LangText({ ko, en, ja, zh, className }: Props) {
    const lang = useLang();
    // Partial: useLang.ts 에 언어를 추가/제거해도 여기가 깨지지 않음
    const map: Partial<Record<Lang, ReactNode>> = { ko, en, ja, 'zh-CN': zh };
    const content = map[lang] ?? en ?? ko;

    return <span className={cn('notranslate', className)}>{content}</span>;
}

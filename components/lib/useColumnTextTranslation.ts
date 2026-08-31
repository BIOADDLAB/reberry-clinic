'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import {
    COLUMN_TEXT_TRANSLATABLE_LOCALES,
    hashColumnText,
    type ColumnTextTranslatableLocale,
    type FirestoreCol,
} from '@/components/lib/columns';

function isTranslatableLocale(locale: string): locale is ColumnTextTranslatableLocale {
    return (COLUMN_TEXT_TRANSLATABLE_LOCALES as readonly string[]).includes(locale);
}

// 시그니처/기기상세 페이지의 "블로그 연결" 칼럼 카드 문구(text)를 현재 로케일로 보여주는 훅.
// title/en 은 브랜드·시술명이라 기존 isKo 분기를 그대로 쓰고(여기서 건드리지 않음),
// 카드 본문인 text 만 자동번역 대상이다. 구조는 useColumnTranslation.ts(피부칼럼 블로그)와 동일.
export function useLocalizedColumnText(item: FirestoreCol): { text: string; isTranslating: boolean } {
    const locale = useLocale();
    const [cache, setCache] = useState<{ docId: string; locale: string; text: string } | null>(null);

    const sourceHash = hashColumnText(item.text);
    const stored = isTranslatableLocale(locale) ? item.translations?.[locale] : undefined;
    const currentStored = stored?.sourceHash === sourceHash ? stored : undefined;

    useEffect(() => {
        if (!isTranslatableLocale(locale)) return;
        if (currentStored) return;

        let active = true;

        fetch('/api/treatment-column-translation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docId: item.docId, locale }),
        })
            .then((res) => res.json())
            .then((data: { translation?: { text: string } }) => {
                if (!active || !data.translation) return;
                setCache({ docId: item.docId, locale, text: data.translation.text });
            })
            .catch((error) => {
                console.error('[useLocalizedColumnText] translation request failed', error);
            });

        return () => {
            active = false;
        };
    }, [item.docId, locale, currentStored]);

    if (!isTranslatableLocale(locale)) return { text: item.text, isTranslating: false };
    if (currentStored) return { text: currentStored.text, isTranslating: false };
    if (cache && cache.docId === item.docId && cache.locale === locale) {
        return { text: cache.text, isTranslating: false };
    }
    return { text: item.text, isTranslating: true };
}

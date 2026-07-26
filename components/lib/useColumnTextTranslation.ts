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
    const [isTranslating, setIsTranslating] = useState(false);

    useEffect(() => {
        if (!isTranslatableLocale(locale)) return;

        const sourceHash = hashColumnText(item.text);
        const stored = item.translations?.[locale];
        if (stored && stored.sourceHash === sourceHash) {
            setCache({ docId: item.docId, locale, text: stored.text });
            return;
        }

        let active = true;
        setIsTranslating(true);

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
            })
            .finally(() => {
                if (active) setIsTranslating(false);
            });

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [item.docId, locale]);

    if (!isTranslatableLocale(locale)) return { text: item.text, isTranslating: false };
    if (cache && cache.docId === item.docId && cache.locale === locale) {
        return { text: cache.text, isTranslating };
    }
    return { text: item.text, isTranslating };
}

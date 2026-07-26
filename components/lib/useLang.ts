'use client';

import { useLocale } from 'next-intl';
import { LOCALE_COOKIE, type AppLocale } from '@/i18n/locales';

export type Lang = AppLocale;

export const LANGS: { code: Lang; label: string; short: string }[] = [
    { code: 'ko', label: '한국어', short: 'KO' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'ja', label: '日本語', short: 'JA' },
    { code: 'zh', label: '中文(简体)', short: 'ZH' },
];

export function useLang(): Lang {
    return useLocale() as Lang;
}

export function setLangCookie(code: Lang) {
    const domains = ['', `; domain=${location.hostname}`, `; domain=.${location.hostname}`];
    for (const d of domains) {
        document.cookie = `${LOCALE_COOKIE}=${code}; path=/${d}`;
    }
}

// 한국어 여부. 고유명사를 영문명으로 바꿔 보여줄 때 사용.
// 예) 장비 카드 제목: isKo ? item.name : item.engName
export function useIsKo(): boolean {
    return useLang() === 'ko';
}

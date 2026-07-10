'use client';

import { useSyncExternalStore } from 'react';

// 지원 언어 (구글 번역 코드 기준)
export type Lang = 'ko' | 'en' | 'ja' | 'zh-CN' | 'ar';

export const LANGS: { code: Lang; label: string; short: string }[] = [
    { code: 'ko', label: '한국어', short: 'KO' },
    { code: 'en', label: 'English', short: 'EN' },
    { code: 'ja', label: '日本語', short: 'JA' },
    { code: 'zh-CN', label: '中文(简体)', short: 'ZH' },
    { code: 'ar', label: 'العربية', short: 'AR' },
];

export function getCurrentLang(): Lang {
    if (typeof document === 'undefined') return 'ko';
    const m = document.cookie.match(/googtrans=\/ko\/([a-zA-Z-]+)/);
    const code = m?.[1] as Lang | undefined;
    return code && LANGS.some((l) => l.code === code) && code !== 'ko' ? code : 'ko';
}

export function setLangCookie(code: Lang) {
    const domains = ['', `; domain=${location.hostname}`, `; domain=.${location.hostname}`];
    for (const d of domains) {
        if (code === 'ko') {
            document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${d}`;
        } else {
            document.cookie = `googtrans=/ko/${code}; path=/${d}`;
        }
    }
}

const subscribe = () => () => {};

export function useLang(): Lang {
    return useSyncExternalStore(subscribe, getCurrentLang, () => 'ko');
}

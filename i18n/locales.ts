// 서버/클라이언트 양쪽에서 공유하는 순수 로케일 상수.
// i18n/request.ts(next/headers 사용, 서버 전용)와 분리해둔다 — 그렇지 않으면
// 이 상수를 쓰는 클라이언트 컴포넌트(components/lib/useLang.ts)가
// next/headers 를 클라이언트 번들에 끌고 들어가 빌드가 깨진다.
export const locales = ['ko', 'en', 'ja', 'zh'] as const;
export type AppLocale = (typeof locales)[number];
export const defaultLocale: AppLocale = 'ko';
export const LOCALE_COOKIE = 'NEXT_LOCALE';

export function isAppLocale(value: string | undefined): value is AppLocale {
    return !!value && (locales as readonly string[]).includes(value);
}

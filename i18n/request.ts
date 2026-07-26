import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';
import { defaultLocale, isAppLocale, LOCALE_COOKIE } from './locales';

// 라우팅 없는(쿠키 기반) next-intl 설정.
// URL에 로케일 세그먼트를 두지 않는 이유: 기존 구글 번역 위젯 시절과 동일하게
// URL을 바꾸지 않고, 피부칼럼 페이지(app/(marketing)/column/**)를 파일 이동 없이 그대로 둘 수 있음.
export default getRequestConfig(async () => {
    const cookieStore = await cookies();
    const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
    const locale = isAppLocale(cookieLocale) ? cookieLocale : defaultLocale;

    const [base, solutions, treatments] = await Promise.all([
        import(`../messages/${locale}.json`),
        import(`../messages/solutions/${locale}.json`),
        import(`../messages/treatments/${locale}.json`),
    ]);

    return {
        locale,
        messages: { ...base.default, solutions: solutions.default, treatments: treatments.default },
    };
});

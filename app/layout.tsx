import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';
import './globals.css';
import LangAttribute from '@/components/lang/LangAttribute';
import { site } from '@/components/lib/site';

/* #ISSUE: 본문 폰트가 두 벌 로드되고 있었음.
   - public/fonts/AstaSans[wght].ttf (5.6MB) 를 next/font/local 로 preload
   - 동시에 Google Fonts CDN 에서 42dot Sans 를 <link> 로 로드
   둘은 같은 폰트다. 42dot Sans 가 Asta Sans 로 리네임된 것뿐.
   → 로컬 woff2 한 벌로 통일하고 CDN <link> 는 제거했다.
   (TTF 5.6MB → woff2 1.1MB. CDN 을 쓰면 서브셋 분할 덕에 더 작지만,
    외부 연결 + 렌더 블로킹이 생기므로 자체 호스팅을 택함) */
const asta = localFont({
    src: '../public/fonts/AstaSans.woff2',
    weight: '300 800',
    display: 'swap',
    variable: '--font-asta',
});

const belleza = localFont({
    src: '../public/fonts/Belleza-Regular.woff2',
    weight: '400',
    display: 'swap',
    variable: '--font-belleza',
});

export async function generateMetadata(): Promise<Metadata> {
    const t = await getTranslations('meta');

    return {
        metadataBase: new URL(site.url),
        title: {
            default: t('title'),
            template: t('titleTemplate'),
        },
        description: t('description'),
        applicationName: '마포 리베리의원',
        authors: [{ name: '리베리의원 마포점', url: site.url }],
        creator: '리베리의원 마포점',
        publisher: '리베리의원',
        category: 'medical',
        keywords: [
            '마포 리베리의원',
            '리베리 마포',
            '리베리의원 마포점',
            '마포 피부과',
            '마포구청역 피부과',
            '성산동 피부과',
            '상암 피부과',
            '망원동 피부과',
            '마포 보톡스',
            '마포 필러',
            '마포 리프팅',
            '마포 피부관리',
        ],
        alternates: {
            types: {
                'application/rss+xml': `${site.url}/rss.xml`,
            },
        },
        verification: {
            google: 'BG3UGHCDV8WrgCKP_0eZYKMHVP0N7SnEMLZZzgQVe-4',
        },
        other: {
            'naver-site-verification': '23552e6b1f890503e018185ef223ad1ca8ee3a76',
        },
        openGraph: {
            title: t('title'),
            description: t('ogDescription'),
            images: ['/images/og-img.png'],
            locale: t('ogLocale'),
            type: 'website',
            url: site.url,
            siteName: '마포 리베리의원',
        },
        twitter: {
            card: 'summary_large_image',
            title: t('title'),
            description: t('ogDescription'),
            images: ['/images/og-img.png'],
        },
    };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const locale = await getLocale();
    const messages = await getMessages();

    return (
        <html lang={locale} data-lang={locale} className={`${belleza.variable} ${asta.variable}`}>
            <body className="antialiased">
                <NextIntlClientProvider locale={locale} messages={messages}>
                    <LangAttribute />
                    {children}
                </NextIntlClientProvider>
            </body>
        </html>
    );
}

import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingButtons from '@/components/layout/FloatingButtons';
import GoogleTranslate from '@/components/lang/GoogleTranslate';
import LangAttribute from '@/components/lang/LangAttribute';

const belleza = localFont({
    src: '../public/fonts/Belleza-Regular.ttf',
    weight: '400',
    display: 'swap',
    variable: '--font-title',
});

const asta = localFont({
    src: '../public/fonts/AstaSans[wght].ttf',
    weight: '300 800',
    display: 'swap',
    variable: '--font-ui',
});

export const metadata: Metadata = {
    // TODO: 실제 배포 도메인으로 교체
    metadataBase: new URL('https://reberry-clinic.vercel.app'),
    title: {
        default: '리베리의원 | RE:BERRY',
        template: '%s | 리베리의원',
    },
    description:
        '당신의 뷰티 주치의 RE:BERRY. 상업적이지 않은, 진심 어린 치료로 여러분의 아름다움을 설계하겠습니다. 마포구청역 피부과 리베리의원.',
    openGraph: {
        title: '리베리의원 | RE:BERRY',
        description: '당신의 뷰티 주치의 RE:BERRY. 마포구청역 피부과 리베리의원.',
        images: ['/images/og-img.png'],
        locale: 'ko_KR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: '리베리의원 | RE:BERRY',
        description: '당신의 뷰티 주치의 RE:BERRY. 마포구청역 피부과 리베리의원.',
        images: ['/images/og-img.png'],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko" data-lang="ko" className={`${belleza.variable} ${asta.variable}`}>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
                <link
                    rel="stylesheet"
                    href="https://fonts.googleapis.com/css2?family=42dot+Sans:wght@300..800&display=swap"
                />
            </head>
            <body className="antialiased">
                <GoogleTranslate />
                <LangAttribute />
                <Header />
                <main>{children}</main>
                <Footer />
                <FloatingButtons />
            </body>
        </html>
    );
}

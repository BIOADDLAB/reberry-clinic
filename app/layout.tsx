import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: {
        default: '리베리의원 | RE:BERRY',
        template: '%s | 리베리의원',
    },
    description: '피부 본연의 아름다움을 깨우는 리베리의원. 색소, 리프팅, 여드름, 홍조 시그니처 시술.',
    openGraph: {
        title: '리베리의원 | RE:BERRY',
        description: '피부 본연의 아름다움을 깨우는 리베리의원. 색소, 리프팅, 여드름, 홍조 시그니처 시술.',
        images: ['/images/og-img.jpg'],
        locale: 'ko_KR',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: '리베리의원 | RE:BERRY',
        description: '피부 본연의 아름다움을 깨우는 리베리의원. 색소, 리프팅, 여드름, 홍조 시그니술.',
        images: ['/images/og-img.jpg'],
    },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="ko">
            <head></head>
            <body className="antialiased">
                <main>{children}</main>
            </body>
        </html>
    );
}

import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import FloatingButtons from '@/components/layout/FloatingButtons';
import { site } from '@/components/lib/site';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
    const structuredData = {
        '@context': 'https://schema.org',
        '@type': 'MedicalClinic',
        '@id': `${site.url}/#clinic`,
        name: '리베리의원 마포점',
        alternateName: ['마포 리베리의원', '리베리 마포', 'RE:BERRY 마포점'],
        url: site.url,
        logo: `${site.url}/images/logo.svg`,
        image: `${site.url}/images/og-img.png`,
        telephone: site.tel,
        priceRange: '₩₩',
        medicalSpecialty: 'Dermatology',
        address: {
            '@type': 'PostalAddress',
            streetAddress: `${site.address} ${site.addressDetail}`,
            addressLocality: '마포구',
            addressRegion: '서울특별시',
            postalCode: '03930',
            addressCountry: 'KR',
        },
        areaServed: ['마포구', '성산동', '상암동', '망원동', '마포구청역'],
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '10:30',
                closes: '20:30',
            },
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'Saturday',
                opens: '09:00',
                closes: '15:30',
            },
        ],
        hasMap: site.naver,
        sameAs: [site.naver, site.blog, site.youtube],
    };

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, '\\u003c') }}
            />
            <Header />
            <main>{children}</main>
            <Footer />
            <FloatingButtons />
        </>
    );
}

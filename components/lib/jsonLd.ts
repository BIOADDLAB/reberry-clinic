import { site } from './site';

export const clinicNodeId = `${site.url}/#clinic`;
export const websiteNodeId = `${site.url}/#website`;
export const directorNodeId = `${site.url}/#director`;

export function jsonLdString(data: unknown) {
    return JSON.stringify(data).replace(/</g, '\\u003c');
}

const clinicImage = `${site.url}/images/og-img.png`;
const directorImage = `${site.url}/images/img-doc-02.png`;

export function physicianNode() {
    return {
        '@type': ['Person', 'Physician'],
        '@id': directorNodeId,
        name: site.director,
        alternateName: ['닥터 파이톤', 'Dr. Pytone'],
        honorificPrefix: 'Dr.',
        jobTitle: '대표원장',
        image: directorImage,
        url: `${site.url}/doctors`,
        worksFor: { '@id': clinicNodeId },
        medicalSpecialty: 'Dermatologic',
        sameAs: [site.blog, site.youtube],
    };
}

export function medicalClinicNode() {
    return {
        '@type': 'MedicalClinic',
        '@id': clinicNodeId,
        name: '리베리의원 마포점',
        alternateName: ['마포 리베리의원', '리베리 마포', 'RE:BERRY 마포점'],
        url: site.url,
        logo: clinicImage,
        image: clinicImage,
        telephone: site.tel,
        taxID: site.bizNo,
        priceRange: '₩₩',
        currenciesAccepted: 'KRW',
        medicalSpecialty: 'Dermatologic',
        isAcceptingNewPatients: true,
        availableLanguage: ['ko', 'en', 'ja', 'zh'],
        knowsAbout: [
            '피부과',
            '리베리 볼륨 부스터',
            '비수술 앞턱전진 필러',
            '비수술 눈밑 지방 재배치',
            '색소치료',
            '리프팅',
            '여드름',
            '홍조/주사피부염',
            '보톡스',
            '필러',
        ],
        address: {
            '@type': 'PostalAddress',
            streetAddress: `${site.address} ${site.addressDetail}`,
            addressLocality: '마포구',
            addressRegion: '서울특별시',
            postalCode: '03938',
            addressCountry: 'KR',
        },
        areaServed: ['마포구', '성산동', '상암동', '망원동', '마포구청역'],
        geo: {
            '@type': 'GeoCoordinates',
            latitude: site.lat,
            longitude: site.lng,
        },
        hasMap: site.naver,
        openingHoursSpecification: [
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '10:30',
                closes: '14:00',
            },
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
                opens: '15:00',
                closes: '20:30',
            },
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: 'Saturday',
                opens: '09:00',
                closes: '15:30',
            },
        ],
        founder: { '@id': directorNodeId },
        employee: { '@id': directorNodeId },
        contactPoint: {
            '@type': 'ContactPoint',
            telephone: site.tel,
            contactType: 'customer service',
            areaServed: 'KR',
            availableLanguage: ['Korean', 'English', 'Japanese', 'Chinese'],
        },
        sameAs: [site.naver, site.blog, site.youtube, site.kakao],
        amenityFeature: [
            {
                '@type': 'LocationFeatureSpecification',
                name: '기계식 주차',
                value: true,
            },
            {
                '@type': 'LocationFeatureSpecification',
                name: '전기차 외부주차',
                value: true,
            },
        ],
    };
}

export function websiteNode() {
    return {
        '@type': 'WebSite',
        '@id': websiteNodeId,
        url: site.url,
        name: '마포 리베리의원',
        alternateName: 'RE:BERRY',
        inLanguage: 'ko-KR',
        publisher: { '@id': clinicNodeId },
    };
}

export function siteGraph() {
    return {
        '@context': 'https://schema.org',
        '@graph': [medicalClinicNode(), websiteNode(), physicianNode()],
    };
}

export function faqPageJsonLd(items: Array<{ q: string; a: string }>) {
    const entries = items.filter((item) => item.q?.trim() && item.a?.trim());
    if (entries.length === 0) return null;

    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: entries.map((item) => ({
            '@type': 'Question',
            name: item.q,
            acceptedAnswer: {
                '@type': 'Answer',
                text: item.a,
            },
        })),
    };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${site.url}${item.path}`,
        })),
    };
}

export function medicalWebPageJsonLd({
    name,
    description,
    path,
}: {
    name: string;
    description: string;
    path: string;
}) {
    return {
        '@context': 'https://schema.org',
        '@type': 'MedicalWebPage',
        name,
        description,
        url: `${site.url}${path}`,
        about: {
            '@type': 'MedicalProcedure',
            name,
            procedureType: 'Dermatologic',
        },
        isPartOf: { '@id': websiteNodeId },
        sourceOrganization: { '@id': clinicNodeId },
    };
}

export function collectionPageJsonLd({
    name,
    description,
    path,
    items = [],
}: {
    name: string;
    description: string;
    path: string;
    items?: Array<{ name: string; url: string }>;
}) {
    const itemListElement = items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: item.url.startsWith('http') ? item.url : `${site.url}${item.url}`,
    }));
    return {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name,
        description,
        url: `${site.url}${path}`,
        isPartOf: { '@id': websiteNodeId },
        about: { '@id': directorNodeId },
        ...(itemListElement.length > 0
            ? {
                  mainEntity: {
                      '@type': 'ItemList',
                      numberOfItems: itemListElement.length,
                      itemListElement,
                  },
              }
            : {}),
    };
}

export function blogPostingJsonLd({
    title,
    excerpt,
    publishedAt,
    updatedAt,
    path,
    blogUrl,
    imageUrl,
    articleSection,
}: {
    title: string;
    excerpt: string;
    publishedAt: string;
    updatedAt?: string;
    path: string;
    blogUrl?: string;
    imageUrl?: string;
    articleSection?: string;
}) {
    const pageUrl = `${site.url}${path}`;
    const image = imageUrl ? (imageUrl.startsWith('http') ? imageUrl : `${site.url}${imageUrl}`) : undefined;
    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: title,
        description: excerpt,
        datePublished: publishedAt || undefined,
        dateModified: updatedAt || publishedAt || undefined,
        author: { '@id': directorNodeId },
        publisher: { '@id': clinicNodeId },
        mainEntityOfPage: blogUrl || pageUrl,
        url: blogUrl || pageUrl,
        ...(blogUrl ? { sameAs: blogUrl } : {}),
        ...(image ? { image } : {}),
        ...(articleSection ? { articleSection } : {}),
        isPartOf: { '@id': websiteNodeId },
        inLanguage: 'ko-KR',
    };
}

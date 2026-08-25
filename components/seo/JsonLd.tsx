import { jsonLdString } from '@/components/lib/jsonLd';

export default function JsonLd({ data }: { data: object | null | undefined }) {
    if (!data) return null;

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: jsonLdString(data) }}
        />
    );
}

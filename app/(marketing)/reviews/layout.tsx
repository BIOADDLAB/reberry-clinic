import { getTranslations } from 'next-intl/server';

export async function generateMetadata() {
    const t = await getTranslations('reviews');
    return { title: t('metaTitle') };
}

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
    return children;
}

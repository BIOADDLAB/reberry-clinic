import SkinColumnList from '@/components/column/SkinColumnList';
import LocationSection from '@/components/ui/LocationSection';
import SubHero from '@/components/ui/SubHero';
import JsonLd from '@/components/seo/JsonLd';
import { collectionPageJsonLd } from '@/components/lib/jsonLd';
import {
    fetchPublishedSkinColumnPosts,
    getSkinColumnBlogUrl,
} from '@/components/lib/skinColumnPosts';
import { getTranslations } from 'next-intl/server';
import TextureBackground from '@/components/ui/TextureBackground';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const t = await getTranslations('column');
    return { title: t('title'), description: t('subtitle') };
}

export default async function ColumnPage() {
    const t = await getTranslations('column');
    const posts = await fetchPublishedSkinColumnPosts().catch(() => []);

    return (
        <>
            <JsonLd
                data={collectionPageJsonLd({
                    name: t('title'),
                    description: t('subtitle'),
                    path: '/column',
                    items: posts.map((post) => ({
                        name: post.title,
                        url: getSkinColumnBlogUrl(post) ?? `/column/${post.docId}`,
                    })),
                })}
            />
            <SubHero en="Column" image="/images/bg-sub-07.jpg" />
            <section className="relative">
                <TextureBackground src="/images/bg-texture-08.jpg" />
                <SkinColumnList />
            </section>
            <LocationSection />
        </>
    );
}

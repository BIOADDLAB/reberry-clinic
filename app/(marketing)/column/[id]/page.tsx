import SkinColumnDetail from '@/components/column/SkinColumnDetail';
import LocationSection from '@/components/ui/LocationSection';
import SubHero from '@/components/ui/SubHero';
import JsonLd from '@/components/seo/JsonLd';
import { blogPostingJsonLd } from '@/components/lib/jsonLd';
import { fetchPublishedSkinColumnPost, getSkinColumnBlogUrl } from '@/components/lib/skinColumnPosts';

interface SkinColumnDetailPageProps {
    params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: SkinColumnDetailPageProps) {
    const { id } = await params;
    const post = await fetchPublishedSkinColumnPost(id);
    if (!post) return { title: '피부칼럼' };
    const blogUrl = getSkinColumnBlogUrl(post);
    return {
        title: post.title,
        description: post.excerpt || post.title,
        ...(blogUrl ? { alternates: { canonical: blogUrl } } : {}),
    };
}

export default async function SkinColumnDetailPage({ params }: SkinColumnDetailPageProps) {
    const { id } = await params;
    const post = await fetchPublishedSkinColumnPost(id);
    const blogUrl = post ? getSkinColumnBlogUrl(post) ?? undefined : undefined;

    return (
        <main>
            {post ? (
                <JsonLd
                    data={blogPostingJsonLd({
                        title: post.title,
                        excerpt: post.excerpt,
                        publishedAt: post.publishedAt,
                        path: `/column/${post.docId}`,
                        blogUrl,
                    })}
                />
            ) : null}
            <SubHero en="Column" title="피부칼럼" image="/images/bg-sub-07.jpg" />
            <SkinColumnDetail docId={id} />
            <LocationSection />
        </main>
    );
}

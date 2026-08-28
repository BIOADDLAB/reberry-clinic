import type { MetadataRoute } from 'next';
import { site } from '@/components/lib/site';
import { treatments } from '@/components/lib/treatments';
import { fetchPublishedSkinColumnPosts } from '@/components/lib/skinColumnPosts';

const staticRoutes: Array<{
    path: string;
    changeFrequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    priority: number;
}> = [
    { path: '/', changeFrequency: 'weekly', priority: 1 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/doctors', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/reviews', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/events', changeFrequency: 'daily', priority: 0.9 },
    { path: '/column', changeFrequency: 'weekly', priority: 0.9 },
    { path: '/price-list', changeFrequency: 'weekly', priority: 0.8 },
    { path: '/reservation', changeFrequency: 'monthly', priority: 0.8 },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const lastModified = new Date();
    const treatmentRoutes: MetadataRoute.Sitemap = treatments.flatMap((treatment) => [
        ...(treatment.category === 'aging' && treatment.slug === 'laser-lifting'
            ? []
            : [
                  {
                      url: `${site.url}/treatments/${treatment.category}/${treatment.slug}`,
                      lastModified,
                      changeFrequency: 'monthly' as const,
                      priority: 0.8,
                  },
              ]),
        ...treatment.items.map((item) => ({
            url: `${site.url}/treatments/${treatment.category}/${treatment.slug}/${item}`,
            lastModified,
            changeFrequency: 'monthly' as const,
            priority: 0.7,
        })),
    ]);

    let columnRoutes: MetadataRoute.Sitemap = [];
    try {
        const posts = await fetchPublishedSkinColumnPosts();
        columnRoutes = posts
            .filter((post) => post.source !== 'naver-blog')
            .map((post) => ({
            url: `${site.url}/column/${post.docId}`,
            lastModified: post.updatedAt || post.publishedAt || lastModified,
            changeFrequency: 'monthly',
            priority: 0.7,
        }));
    } catch (error) {
        console.error('[sitemap] Failed to load skin columns', error);
    }

    return [
        ...staticRoutes.map((route) => ({
            url: `${site.url}${route.path}`,
            lastModified,
            changeFrequency: route.changeFrequency,
            priority: route.priority,
        })),
        ...treatmentRoutes,
        ...columnRoutes,
    ];
}

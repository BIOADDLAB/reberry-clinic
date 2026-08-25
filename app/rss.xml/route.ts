import { site } from '@/components/lib/site';
import {
    fetchPublishedSkinColumnPosts,
    type SkinColumnPostItem,
} from '@/components/lib/skinColumnPosts';

export const revalidate = 3600;

const escapeXml = (value: string) =>
    value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

const toRssDate = (value: string) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? new Date().toUTCString() : date.toUTCString();
};

export async function GET() {
    let posts: SkinColumnPostItem[] = [];
    try {
        posts = await fetchPublishedSkinColumnPosts();
    } catch (error) {
        console.error('[rss] Failed to load skin columns', error);
    }

    const items = posts
        .map((post) => {
            const url = post.blogUrl || `${site.url}/column/${post.docId}`;
            return `<item>
    <title>${escapeXml(post.title)}</title>
    <link>${url}</link>
    <guid isPermaLink="true">${url}</guid>
    <description>${escapeXml(post.excerpt)}</description>
    <category>${escapeXml(post.categorySlug)}</category>
    <pubDate>${toRssDate(post.publishedAt || post.createdAt)}</pubDate>
  </item>`;
        })
        .join('\n  ');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>마포 리베리의원 피부칼럼</title>
  <link>${site.url}/column</link>
  <description>마포 리베리의원이 전하는 피부 건강 정보와 진료 이야기</description>
  <language>ko-KR</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${site.url}/rss.xml" rel="self" type="application/rss+xml" />
  ${items}
</channel>
</rss>`;

    return new Response(xml, {
        headers: {
            'Content-Type': 'application/rss+xml; charset=utf-8',
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    });
}

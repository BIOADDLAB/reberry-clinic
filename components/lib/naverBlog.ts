export interface NaverBlogPost {
    id: string;
    title: string;
    url: string;
    description: string;
    publishedAt: string;
    thumbnailUrl: string | null;
}

const RSS_URL = 'https://rss.blog.naver.com/drpyton.xml';

const decodeXml = (value: string) =>
    value
        .replace(/^<!\[CDATA\[|\]\]>$/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();

const getTagValue = (source: string, tag: string) => {
    const match = source.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, 'i'));
    return match ? decodeXml(match[1]) : '';
};

async function fetchThumbnail(logNo: string): Promise<string | null> {
    try {
        const response = await fetch(`https://blog.naver.com/PostView.naver?blogId=drpyton&logNo=${logNo}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 60 * 60 },
        });
        if (!response.ok) return null;

        const html = await response.text();
        const propertyFirst = html.match(
            /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["'][^>]*>/i,
        );
        const contentFirst = html.match(
            /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["'][^>]*>/i,
        );
        const thumbnailUrl = propertyFirst?.[1] ?? contentFirst?.[1];

        return thumbnailUrl ? decodeXml(thumbnailUrl) : null;
    } catch {
        return null;
    }
}

export async function fetchLatestNaverBlogPosts(count = 2): Promise<NaverBlogPost[]> {
    try {
        const response = await fetch(RSS_URL, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 60 * 60 },
        });
        if (!response.ok) return [];

        const xml = await response.text();
        const items = (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []).slice(0, count);

        return Promise.all(
            items.map(async (item) => {
                const url = getTagValue(item, 'link');
                const id = getTagValue(item, 'guid').match(/(\d+)(?:\?.*)?$/)?.[1] ?? url;
                return {
                    id,
                    title: getTagValue(item, 'title'),
                    url,
                    description: getTagValue(item, 'description'),
                    publishedAt: getTagValue(item, 'pubDate'),
                    thumbnailUrl: /^\d+$/.test(id) ? await fetchThumbnail(id) : null,
                };
            }),
        );
    } catch (error) {
        console.error('[naver-blog] RSS feed fetch failed', error);
        return [];
    }
}

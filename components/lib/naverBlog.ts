export interface NaverBlogPost {
    id: string;
    title: string;
    url: string;
    description: string;
    publishedAt: string;
    thumbnailUrl: string | null;
    category: string;
}

const RSS_URL = 'https://rss.blog.naver.com/drpyton.xml';
const BLOG_ID = 'drpyton';

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

export function stripHtmlToText(value: string) {
    return value
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s+/g, ' ')
        .trim();
}

export function toBlogExcerpt(description: string, max = 140) {
    const text = stripHtmlToText(description);
    if (text.length <= max) return text;
    return `${text.slice(0, max).replace(/\s+\S*$/, '')}…`;
}

export function toBlogPublishedAt(pubDate: string) {
    const date = new Date(pubDate);
    return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

async function fetchThumbnail(logNo: string): Promise<string | null> {
    try {
        const response = await fetch(`https://blog.naver.com/PostView.naver?blogId=${BLOG_ID}&logNo=${logNo}`, {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 60 * 60 * 24 },
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

const parseRssItem = (item: string): Omit<NaverBlogPost, 'thumbnailUrl'> => {
    const url = getTagValue(item, 'link');
    const id = getTagValue(item, 'guid').match(/(\d+)(?:\?.*)?$/)?.[1] ?? url;
    return {
        id,
        title: getTagValue(item, 'title'),
        url,
        description: getTagValue(item, 'description'),
        publishedAt: getTagValue(item, 'pubDate'),
        category: getTagValue(item, 'category'),
    };
};

async function fetchRssXml(fresh: boolean) {
    const response = await fetch(RSS_URL, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        ...(fresh ? { cache: 'no-store' as const } : { next: { revalidate: 60 * 60 } }),
    });
    if (!response.ok) throw new Error(`네이버 블로그 RSS를 불러오지 못했습니다. (${response.status})`);
    return response.text();
}

export async function fetchNaverBlogFeed(options?: { fresh?: boolean }): Promise<Omit<NaverBlogPost, 'thumbnailUrl'>[]> {
    const xml = await fetchRssXml(options?.fresh === true);
    return (xml.match(/<item>[\s\S]*?<\/item>/gi) ?? []).map(parseRssItem);
}

export async function fetchNaverBlogThumbnails(
    logNos: string[],
    concurrency = 4,
): Promise<Map<string, string | null>> {
    const unique = [...new Set(logNos.filter((logNo) => /^\d+$/.test(logNo)))];
    const result = new Map<string, string | null>();

    for (let index = 0; index < unique.length; index += concurrency) {
        const chunk = unique.slice(index, index + concurrency);
        const thumbnails = await Promise.all(chunk.map((logNo) => fetchThumbnail(logNo)));
        chunk.forEach((logNo, chunkIndex) => {
            result.set(logNo, thumbnails[chunkIndex] ?? null);
        });
    }

    return result;
}

export async function fetchLatestNaverBlogPosts(count = 2): Promise<NaverBlogPost[]> {
    try {
        const items = (await fetchNaverBlogFeed()).slice(0, count);
        const thumbnails = await fetchNaverBlogThumbnails(items.map((item) => item.id));

        return items.map((item) => ({
            ...item,
            thumbnailUrl: thumbnails.get(item.id) ?? null,
        }));
    } catch (error) {
        console.error('[naver-blog] RSS feed fetch failed', error);
        return [];
    }
}

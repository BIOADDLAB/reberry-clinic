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

/** 글 본문 페이지에서 한 번에 뽑아낼 수 있는 것들. RSS 밖으로 밀려난 글은 여기서만 얻는다. */
export interface NaverBlogPostDetail {
    thumbnailUrl: string | null;
    description: string;
    category: string;
    publishedAt: string;
}

const postViewUrl = (logNo: string) => `https://blog.naver.com/PostView.naver?blogId=${BLOG_ID}&logNo=${logNo}`;

/** "2026. 9. 7. 14:34" → ISO. 글 목록은 날짜까지만 주지만 본문에는 분까지 찍혀 있다. */
export const parseKoreanDateTime = (value: string) => {
    const match = value.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.?(?:\s*(\d{1,2}):(\d{2}))?/);
    if (!match) return '';
    const [, year, month, day, hour = '0', minute = '0'] = match;
    // 네이버 표기는 한국 시간이다. UTC 로 옮겨 저장해야 RSS 로 들어온 글과 같은 기준이 된다.
    const utc = Date.UTC(+year, +month - 1, +day, +hour - 9, +minute);
    return Number.isNaN(utc) ? '' : new Date(utc).toISOString();
};

export async function fetchNaverBlogPostDetail(logNo: string): Promise<NaverBlogPostDetail | null> {
    try {
        const response = await fetch(postViewUrl(logNo), {
            headers: { 'User-Agent': 'Mozilla/5.0' },
            next: { revalidate: 60 * 60 * 24 },
        });
        if (!response.ok) return null;

        const html = await response.text();
        const meta = (name: string) =>
            html.match(new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']*)["'][^>]*>`, 'i'))?.[1] ??
            html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+property=["']${name}["'][^>]*>`, 'i'))?.[1] ??
            '';

        const thumbnailUrl = meta('og:image');
        return {
            thumbnailUrl: thumbnailUrl ? decodeXml(thumbnailUrl) : null,
            description: decodeXml(meta('og:description')),
            // 본문 스크립트에 categoryName = '필러' 형태로 박혀 있다 (RSS 의 <category> 와 같은 값)
            category: decodeXml(html.match(/categoryName\s*=\s*'([^']*)'/)?.[1] ?? ''),
            publishedAt: parseKoreanDateTime(html.match(/se_publishDate[^>]*>([^<]{4,40})</)?.[1] ?? ''),
        };
    } catch {
        return null;
    }
}

async function fetchThumbnail(logNo: string): Promise<string | null> {
    return (await fetchNaverBlogPostDetail(logNo))?.thumbnailUrl ?? null;
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

/* ── 전체 글 목록 ───────────────────────────────────────────────────────
   #ISSUE: RSS 는 네이버가 최근 50편까지만 내려준다. 늘릴 방법이 없어서 그보다 오래된 글은
           사이트에 들어온 적이 아예 없었다(2026.09 기준 227편 중 177편).
   → 블로그가 자기 글목록 화면을 그릴 때 쓰는 주소를 페이지 단위로 넘겨 전체를 받는다.
     제목·글번호·날짜만 오므로 요약문·카테고리·썸네일은 fetchNaverBlogPostDetail 로 따로 채운다.

   상시로 쓰지 않는다 — 매일 도는 동기화는 공식 RSS 그대로다.
   새 글은 올라오는 즉시 RSS 맨 앞에 잡히고 50편이면 9개월치 여유라 놓칠 일이 없다.
   이 목록은 밀린 옛날 글을 한 번 채울 때만 쓴다. */

export interface NaverBlogListItem {
    id: string;
    title: string;
    url: string;
    /** 목록에는 날짜까지만 있다. 분 단위 시각은 본문 페이지에서 채운다. */
    addDate: string;
}

const POST_LIST_URL = 'https://blog.naver.com/PostTitleListAsync.naver';

/** 네이버가 JSON 안에 \' 같은 비표준 이스케이프를 섞어 보내 JSON.parse 가 그대로는 실패한다. */
const parseNaverJson = (raw: string) => JSON.parse(raw.replace(/\\(?!["\\/bfnrtu])/g, ''));

/* 목록의 제목은 URL 인코딩(+ 가 공백)에 HTML 기호까지 겹쳐 온다.
   두 번 풀지 않으면 "만들기 &lt;1&gt;" 처럼 남는다. */
const decodeListTitle = (value: string) => {
    const spaced = value.replace(/\+/g, ' ');
    try {
        return decodeXml(decodeURIComponent(spaced));
    } catch {
        return decodeXml(spaced);
    }
};

export async function fetchNaverBlogPostList(countPerPage = 30): Promise<NaverBlogListItem[]> {
    const loadPage = async (page: number) => {
        const url =
            `${POST_LIST_URL}?blogId=${BLOG_ID}&viewdate=&currentPage=${page}` +
            `&categoryNo=&parentCategoryNo=&countPerPage=${countPerPage}`;
        const response = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, cache: 'no-store' });
        if (!response.ok) throw new Error(`네이버 블로그 글목록을 불러오지 못했습니다. (${response.status})`);
        return parseNaverJson(await response.text()) as {
            totalCount?: string;
            // 같은 응답 안에서도 값이 문자열('0')이거나 숫자(0)로 섞여 온다
            postList?: Record<string, unknown>[];
        };
    };

    const first = await loadPage(1);
    const total = Number(first.totalCount ?? 0);
    const lastPage = Math.max(1, Math.ceil(total / countPerPage));

    const pages = [first];
    for (let page = 2; page <= lastPage; page += 1) pages.push(await loadPage(page));

    const items = new Map<string, NaverBlogListItem>();
    pages.forEach((data) => {
        (data.postList ?? []).forEach((post) => {
            const id = String(post.logNo ?? '');
            // 비공개·차단 글은 사이트에 걸어 봐야 열리지 않는다
            if (!/^\d+$/.test(id) || String(post.isPostNotOpen) === '1' || String(post.isPostBlocked) === '1') return;
            items.set(id, {
                id,
                title: decodeListTitle(String(post.title ?? '')),
                url: `https://blog.naver.com/${BLOG_ID}/${id}`,
                addDate: String(post.addDate ?? ''),
            });
        });
    });

    return [...items.values()];
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
    if (process.env.SKIP_REMOTE_CONTENT === '1') return [];
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

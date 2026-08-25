import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { SIGNATURE_PAGES } from './adminConfig';
import { db } from './firebase';
import {
    fetchNaverBlogFeed,
    fetchNaverBlogThumbnails,
    toBlogExcerpt,
    toBlogPublishedAt,
} from './naverBlog';
import {
    fetchAllSkinColumnPosts,
    type SkinColumnPostItem,
} from './skinColumnPosts';

export function naverBlogColumnDocId(logNo: string) {
    return `naver-${logNo}`;
}

const SETTINGS_COLLECTION = 'skinColumnSettings';
const SETTINGS_DOC = 'blogImport';
const POSTS_COLLECTION = 'skinColumnPosts';
const SYNC_INTERVAL_MS = 6 * 60 * 60 * 1000;

const SITE_CATEGORY_SLUGS = new Set<string>(SIGNATURE_PAGES.map((category) => category.slug));

// 블로그 카테고리 문자열이 사이트 탭과 거의 1:1인 경우만 기본값으로 넣는다.
// 애매한 분류(공지, 포텐자, 지방분해 등)는 비워 두고 관리자가 지정한다.
export const DEFAULT_BLOG_CATEGORY_MAPS: Record<string, string> = {
    기미: 'pigment',
    흑자: 'pigment',
    'MLA, 피코프락셀, 제네시스': 'pigment',
    여드름: 'acne',
    '주사, 홍조, 모세혈관확장증': 'redness',
    '볼륨부스터, 쥬베룩 볼륨': 'booster',
    '리쥬란, 물광주사': 'booster',
    '레비나스 리프팅': 'lifting',
    '온다 리프팅': 'lifting',
    '울쎄라, 브이로, 슈링크': 'lifting',
    '인모드 리프팅': 'lifting',
    실리프팅: 'lifting',
    보톡스: 'lifting',
    필러: 'lifting',
};

const TOKEN_HINTS: Array<[string, string]> = [
    ['홍조', 'redness'],
    ['주사', 'redness'],
    ['모세혈관', 'redness'],
    ['기미', 'pigment'],
    ['흑자', 'pigment'],
    ['색소', 'pigment'],
    ['피코', 'pigment'],
    ['여드름', 'acne'],
    ['쥬베룩', 'booster'],
    ['볼륨부스터', 'booster'],
    ['리쥬란', 'booster'],
    ['물광', 'booster'],
    ['리프팅', 'lifting'],
    ['울쎄라', 'lifting'],
    ['온다', 'lifting'],
    ['실리프팅', 'lifting'],
    ['인모드', 'lifting'],
    ['슈링크', 'lifting'],
    ['브이로', 'lifting'],
    ['보톡스', 'lifting'],
    ['필러', 'lifting'],
];

export interface BlogImportSettings {
    maps: Record<string, string>;
    lastSyncedAt: string;
}

export interface BlogImportResult {
    fetched: number;
    created: number;
    updated: number;
    published: number;
    needsCategory: number;
    skipped: boolean;
}

const settingsRef = doc(db, SETTINGS_COLLECTION, SETTINGS_DOC);

const isSiteCategorySlug = (value: string) => SITE_CATEGORY_SLUGS.has(value);

const splitBlogCategoryTokens = (blogCategory: string) =>
    blogCategory
        .split(/[,/|]/)
        .map((token) => token.trim())
        .filter(Boolean);

export function resolveBlogCategorySlug(
    blogCategory: string,
    maps: Record<string, string>,
): string {
    const exact = maps[blogCategory.trim()];
    if (exact && isSiteCategorySlug(exact)) return exact;
    if (exact === '') return '';

    const tokens = splitBlogCategoryTokens(blogCategory);
    const slugs = new Set<string>();

    for (const token of tokens) {
        const mapped = maps[token];
        if (mapped === '') {
            slugs.clear();
            break;
        }
        if (mapped && isSiteCategorySlug(mapped)) {
            slugs.add(mapped);
            continue;
        }

        const hint = TOKEN_HINTS.find(([needle]) => token.includes(needle));
        if (hint) slugs.add(hint[1]);
    }

    return slugs.size === 1 ? [...slugs][0] : '';
}

const normalizeMaps = (value: unknown): Record<string, string> => {
    if (!value || typeof value !== 'object') return {};
    const result: Record<string, string> = {};
    for (const [blogCategory, categorySlug] of Object.entries(value as Record<string, unknown>)) {
        if (!blogCategory.trim()) continue;
        result[blogCategory] = typeof categorySlug === 'string' && isSiteCategorySlug(categorySlug) ? categorySlug : '';
    }
    return result;
};

export async function fetchBlogImportSettings(): Promise<BlogImportSettings> {
    const snapshot = await getDoc(settingsRef);
    if (!snapshot.exists()) {
        return { maps: { ...DEFAULT_BLOG_CATEGORY_MAPS }, lastSyncedAt: '' };
    }

    const data = snapshot.data();
    const maps = normalizeMaps(data.maps);
    return {
        maps: Object.keys(maps).length > 0 ? maps : { ...DEFAULT_BLOG_CATEGORY_MAPS },
        lastSyncedAt: typeof data.lastSyncedAt === 'string' ? data.lastSyncedAt : '',
    };
}

export async function saveBlogCategoryMaps(maps: Record<string, string>): Promise<void> {
    const normalized: Record<string, string> = {};
    for (const [blogCategory, categorySlug] of Object.entries(maps)) {
        const key = blogCategory.trim();
        if (!key) continue;
        normalized[key] = isSiteCategorySlug(categorySlug) ? categorySlug : '';
    }

    await setDoc(
        settingsRef,
        {
            maps: normalized,
            updatedAt: new Date().toISOString(),
        },
        { merge: true },
    );
}

export async function applyMapsToUnmappedPosts(
    maps: Record<string, string>,
    posts?: SkinColumnPostItem[],
): Promise<number> {
    const allPosts = posts ?? (await fetchAllSkinColumnPosts());
    const batch = writeBatch(db);
    let applied = 0;

    allPosts.forEach((post) => {
        if (post.source !== 'naver-blog' || post.categorySlug) return;
        const categorySlug = resolveBlogCategorySlug(post.blogCategory ?? '', maps);
        if (!categorySlug) return;

        batch.update(doc(db, POSTS_COLLECTION, post.docId), {
            categorySlug,
            isPublished: true,
            updatedAt: new Date().toISOString(),
        });
        applied += 1;
    });

    if (applied > 0) await batch.commit();
    return applied;
}

const emptyResult = (skipped: boolean): BlogImportResult => ({
    fetched: 0,
    created: 0,
    updated: 0,
    published: 0,
    needsCategory: 0,
    skipped,
});

export async function maybeSyncNaverBlogSkinColumns(): Promise<BlogImportResult> {
    return syncNaverBlogSkinColumns({ force: false });
}

export async function syncNaverBlogSkinColumns(options?: { force?: boolean }): Promise<BlogImportResult> {
    const force = options?.force === true;
    const settings = await fetchBlogImportSettings();

    if (!force && settings.lastSyncedAt) {
        const elapsed = Date.now() - Date.parse(settings.lastSyncedAt);
        if (Number.isFinite(elapsed) && elapsed < SYNC_INTERVAL_MS) {
            return emptyResult(true);
        }
    }

    const feed = await fetchNaverBlogFeed({ fresh: force });
    if (feed.length === 0) return emptyResult(false);

    const existingPosts = await fetchAllSkinColumnPosts();
    const copiesByLogNo = new Map<string, SkinColumnPostItem[]>();
    existingPosts.forEach((post) => {
        if (post.source !== 'naver-blog' || !post.blogLogNo) return;
        const copies = copiesByLogNo.get(post.blogLogNo) ?? [];
        copies.push(post);
        copiesByLogNo.set(post.blogLogNo, copies);
    });

    const missingThumbnails = feed
        .filter((item) => {
            if (!/^\d+$/.test(item.id)) return false;
            return !copiesByLogNo.get(item.id)?.some((post) => post.thumbnailUrl);
        })
        .map((item) => item.id);
    const thumbnails = await fetchNaverBlogThumbnails(missingThumbnails);

    const now = new Date().toISOString();
    const batch = writeBatch(db);
    let created = 0;
    let updated = 0;
    let published = 0;
    let needsCategory = 0;
    const handledLogNos = new Set<string>();

    const pickCanonical = (logNo: string) => {
        const copies = copiesByLogNo.get(logNo) ?? [];
        const stableId = naverBlogColumnDocId(logNo);
        return copies.find((post) => post.docId === stableId) ?? copies[0];
    };

    feed.forEach((item) => {
        if (!item.id) return;
        handledLogNos.add(item.id);

        const excerpt = toBlogExcerpt(item.description);
        const publishedAt = toBlogPublishedAt(item.publishedAt);
        const canonical = pickCanonical(item.id);
        const copies = copiesByLogNo.get(item.id) ?? [];
        const thumbnailUrl = canonical?.thumbnailUrl || thumbnails.get(item.id) || '';
        const resolvedSlug = resolveBlogCategorySlug(item.category, settings.maps);
        const categorySlug = canonical?.categorySlug || resolvedSlug;
        const isPublished = canonical?.categorySlug ? canonical.isPublished : Boolean(resolvedSlug);
        const ref = doc(db, POSTS_COLLECTION, naverBlogColumnDocId(item.id));

        batch.set(
            ref,
            {
                categorySlug,
                title: item.title,
                excerpt,
                contentHtml: canonical?.contentHtml ?? '',
                youtubeUrl: canonical?.youtubeUrl ?? '',
                thumbnailUrl,
                publishedAt,
                isPublished,
                source: 'naver-blog',
                blogUrl: item.url,
                blogCategory: item.category,
                blogLogNo: item.id,
                sort: canonical?.sort ?? (-Date.parse(publishedAt) || 0),
                createdAt: canonical?.createdAt || now,
                updatedAt: now,
            },
            { merge: true },
        );

        if (canonical && canonical.docId === ref.id) updated += 1;
        else if (canonical) updated += 1;
        else created += 1;

        copies.forEach((post) => {
            if (post.docId !== ref.id) batch.delete(doc(db, POSTS_COLLECTION, post.docId));
        });

        if (isPublished) published += 1;
        else if (!categorySlug) needsCategory += 1;
    });

    copiesByLogNo.forEach((copies, logNo) => {
        if (handledLogNos.has(logNo)) return;
        const keep = pickCanonical(logNo);
        copies.forEach((post) => {
            if (keep && post.docId !== keep.docId) batch.delete(doc(db, POSTS_COLLECTION, post.docId));
        });
    });

    await batch.commit();
    await setDoc(
        settingsRef,
        {
            maps: settings.maps,
            lastSyncedAt: now,
            updatedAt: now,
        },
        { merge: true },
    );

    return {
        fetched: feed.length,
        created,
        updated,
        published,
        needsCategory,
        skipped: false,
    };
}

export function collectBlogCategories(posts: SkinColumnPostItem[]) {
    const categories = new Set<string>();
    posts.forEach((post) => {
        if (post.source === 'naver-blog' && post.blogCategory) categories.add(post.blogCategory);
    });
    Object.keys(DEFAULT_BLOG_CATEGORY_MAPS).forEach((category) => categories.add(category));
    return [...categories].sort((a, b) => a.localeCompare(b, 'ko'));
}

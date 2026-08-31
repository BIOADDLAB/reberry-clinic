import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { SIGNATURE_PAGES } from './adminConfig';
import { db } from './firebase';
import {
    fetchAllSkinColumnPosts,
    type SkinColumnPostItem,
} from './skinColumnPosts';

const SETTINGS_COLLECTION = 'skinColumnSettings';
const SETTINGS_DOC = 'blogImport';
const POSTS_COLLECTION = 'skinColumnPosts';

const SITE_CATEGORY_SLUGS = new Set<string>(SIGNATURE_PAGES.map((category) => category.slug));

// 블로그 카테고리 문자열이 사이트 탭과 거의 1:1인 경우만 기본값으로 넣는다.
// 애매한 분류(공지, 포텐자, 지방분해 등)는 비워 두고 관리자가 지정한다.
export const DEFAULT_BLOG_CATEGORY_MAPS: Record<string, string> = {
    '볼륨부스터, 쥬베룩 볼륨': 'booster',
    '리쥬란, 물광주사': 'booster',
    필러: 'acne',
    '턱끝 필러': 'acne',
    '눈밑 지방 재배치': 'redness',
};

const TOKEN_HINTS: Array<[string, string]> = [
    ['눈밑', 'redness'],
    ['하안검', 'redness'],
    ['턱끝', 'acne'],
    ['필러', 'acne'],
    ['쥬베룩', 'booster'],
    ['볼륨부스터', 'booster'],
    ['리쥬란', 'booster'],
    ['물광', 'booster'],
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
    thumbnailsStored: number;
    thumbnailsMissing: number;
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

export function collectBlogCategories(posts: SkinColumnPostItem[]) {
    const categories = new Set<string>();
    posts.forEach((post) => {
        if (post.source === 'naver-blog' && post.blogCategory) categories.add(post.blogCategory);
    });
    Object.keys(DEFAULT_BLOG_CATEGORY_MAPS).forEach((category) => categories.add(category));
    return [...categories].sort((a, b) => a.localeCompare(b, 'ko'));
}

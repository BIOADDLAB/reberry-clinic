import 'server-only';

import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import {
    fetchNaverBlogFeed,
    fetchNaverBlogThumbnails,
    toBlogExcerpt,
    toBlogPublishedAt,
} from './naverBlog';
import { storeNaverBlogThumbnail } from './naverBlogThumbnailStorage';
import {
    fetchBlogImportSettings,
    resolveBlogCategorySlug,
    type BlogImportResult,
} from './skinColumnBlogImport';
import {
    fetchAllSkinColumnPosts,
    isHostedColumnThumbnail,
    type SkinColumnPostItem,
} from './skinColumnPosts';

const POSTS_COLLECTION = 'skinColumnPosts';

const naverBlogColumnDocId = (logNo: string) => `naver-${logNo}`;

const emptyResult = (): BlogImportResult => ({
    fetched: 0,
    created: 0,
    updated: 0,
    published: 0,
    needsCategory: 0,
    thumbnailsStored: 0,
    thumbnailsMissing: 0,
    skipped: false,
});

export async function syncNaverBlogSkinColumns(): Promise<BlogImportResult> {
    const settings = await fetchBlogImportSettings();
    const feed = await fetchNaverBlogFeed({ fresh: true });
    if (feed.length === 0) return emptyResult();

    const existingPosts = await fetchAllSkinColumnPosts();
    const copiesByLogNo = new Map<string, SkinColumnPostItem[]>();
    existingPosts.forEach((post) => {
        if (post.source !== 'naver-blog' || !post.blogLogNo) return;
        const copies = copiesByLogNo.get(post.blogLogNo) ?? [];
        copies.push(post);
        copiesByLogNo.set(post.blogLogNo, copies);
    });

    const thumbnailLogNos = [...new Set([
        ...feed.map((item) => item.id),
        ...existingPosts
            .filter((post) => post.source === 'naver-blog' && post.blogLogNo)
            .map((post) => post.blogLogNo as string),
    ])].filter((logNo) => {
        if (!/^\d+$/.test(logNo)) return false;
        return !copiesByLogNo.get(logNo)?.some((post) => isHostedColumnThumbnail(post.thumbnailUrl));
    });
    const sourceThumbnails = await fetchNaverBlogThumbnails(thumbnailLogNos);
    const storedThumbnails = new Map<string, string>();

    for (let index = 0; index < thumbnailLogNos.length; index += 4) {
        const chunk = thumbnailLogNos.slice(index, index + 4);
        const stored = await Promise.all(
            chunk.map(async (logNo) => {
                const sourceUrl = sourceThumbnails.get(logNo);
                if (!sourceUrl) return [logNo, null] as const;
                return [logNo, await storeNaverBlogThumbnail(logNo, sourceUrl)] as const;
            }),
        );
        stored.forEach(([logNo, thumbnailUrl]) => {
            if (thumbnailUrl) storedThumbnails.set(logNo, thumbnailUrl);
        });
    }

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
        const existingHostedThumbnail = copies.find((post) => isHostedColumnThumbnail(post.thumbnailUrl))?.thumbnailUrl;
        const thumbnailUrl = existingHostedThumbnail || storedThumbnails.get(item.id) || '';
        const resolvedSlug = resolveBlogCategorySlug(item.category, settings.maps);
        const categorySlug = canonical?.categorySlug || resolvedSlug;
        const isPublished = canonical?.categorySlug ? canonical.isPublished : Boolean(resolvedSlug);
        const postRef = doc(db, POSTS_COLLECTION, naverBlogColumnDocId(item.id));

        batch.set(
            postRef,
            {
                categorySlug,
                title: canonical?.title || item.title,
                blogTitle: item.title,
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

        if (canonical) updated += 1;
        else created += 1;

        copies.forEach((post) => {
            if (post.docId !== postRef.id) batch.delete(doc(db, POSTS_COLLECTION, post.docId));
        });

        if (isPublished) published += 1;
        else if (!categorySlug) needsCategory += 1;
    });

    copiesByLogNo.forEach((copies, logNo) => {
        if (handledLogNos.has(logNo)) return;
        const keep = pickCanonical(logNo);
        const storedThumbnailUrl = storedThumbnails.get(logNo);
        if (keep && storedThumbnailUrl) {
            batch.update(doc(db, POSTS_COLLECTION, keep.docId), {
                thumbnailUrl: storedThumbnailUrl,
                updatedAt: now,
            });
        }
        copies.forEach((post) => {
            if (keep && post.docId !== keep.docId) batch.delete(doc(db, POSTS_COLLECTION, post.docId));
        });
    });

    await batch.commit();
    await setDoc(
        doc(db, 'skinColumnSettings', 'blogImport'),
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
        thumbnailsStored: storedThumbnails.size,
        thumbnailsMissing: Math.max(0, thumbnailLogNos.length - storedThumbnails.size),
        skipped: false,
    };
}

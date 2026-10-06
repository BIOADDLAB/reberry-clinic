import 'server-only';

import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';
import {
    fetchNaverBlogFeed,
    fetchNaverBlogThumbnails,
    toBlogExcerpt,
    toBlogPublishedAt,
} from './naverBlog';
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

    /* 이번 RSS 에 있고 아직 우리 저장소 썸네일이 없는 글만. 예전 글 전체의 그림을 다시 받으면
       함수 제한 시간에 걸려 새 글 저장까지 같이 죽는다. */
    const thumbnailLogNos = feed
        .map((item) => item.id)
        .filter((logNo) => /^\d+$/.test(logNo))
        .filter((logNo) => !copiesByLogNo.get(logNo)?.some((post) => isHostedColumnThumbnail(post.thumbnailUrl)));

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
        const thumbnailUrl = copies.find((post) => isHostedColumnThumbnail(post.thumbnailUrl))?.thumbnailUrl || '';
        const resolvedSlug = resolveBlogCategorySlug(item.category, settings.maps);
        const categorySlug = canonical?.categorySlug || resolvedSlug;
        /* #ISSUE: 예전에는 "블로그 카테고리가 사이트 분류로 매핑되면 공개, 아니면 비공개" 였다.
           블로그 카테고리는 18종이 넘는데 매핑표에는 5줄뿐이라 대부분의 글이 안 보인 채 쌓였다.
           → 분류를 걷어냈으므로 새 글은 그냥 공개하고, 이미 있는 글은 관리자가 정한 상태를 따른다. */
        const isPublished = canonical ? canonical.isPublished : true;
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

    /* 글은 이미 저장됐다. 썸네일 모듈(sharp)이나 이미지 받기가 실패해도 수집 전체를 실패로 치지 않는다. */
    const storedThumbnails = new Map<string, string>();
    try {
        if (thumbnailLogNos.length > 0) {
            const { storeNaverBlogThumbnail } = await import('./naverBlogThumbnailStorage');
            const sourceThumbnails = await fetchNaverBlogThumbnails(thumbnailLogNos);
            const thumbBatch = writeBatch(db);
            let thumbWrites = 0;
            for (const logNo of thumbnailLogNos) {
                const sourceUrl = sourceThumbnails.get(logNo);
                if (!sourceUrl) continue;
                const storedUrl = await storeNaverBlogThumbnail(logNo, sourceUrl);
                if (!storedUrl) continue;
                storedThumbnails.set(logNo, storedUrl);
                thumbBatch.update(doc(db, POSTS_COLLECTION, naverBlogColumnDocId(logNo)), {
                    thumbnailUrl: storedUrl,
                    updatedAt: now,
                });
                thumbWrites += 1;
            }
            if (thumbWrites > 0) await thumbBatch.commit();
        }
    } catch (error) {
        console.error('[skin-columns/sync] thumbnail step failed', error);
    }

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

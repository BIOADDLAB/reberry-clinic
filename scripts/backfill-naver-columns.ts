/* 네이버 블로그의 밀린 옛날 글을 피부칼럼에 한 번에 채운다.

   왜 필요한가: 매일 도는 동기화는 네이버 RSS 를 읽는데, RSS 는 최근 50편까지만 내려준다.
   늘릴 방법이 없어서 그보다 오래된 글은 사이트에 들어온 적이 아예 없다(2026.09 기준 227편 중 177편).
   여기서는 블로그 글목록 주소로 전체를 받아 빠진 것을 메운다.

   이 스크립트는 한 번만 쓰는 물건이다. 앞으로의 새 글은 RSS 에 반드시 잡히므로
   매일 동기화(vercel cron)가 그대로 처리한다.

   안전한 성질:
   - 문서 이름이 naver-{글번호} 로 고정이라 몇 번을 돌려도 중복이 안 생긴다.
   - 이미 받아 둔 글은 건너뛰므로 중간에 끊겨도 다시 돌리면 이어서 채운다.
   - 관리자가 고친 제목·본문·썸네일은 덮어쓰지 않는다.

   실행: npm run columns:backfill
         npm run columns:backfill -- --dry-run     무엇이 들어갈지만 확인
         npm run columns:backfill -- --limit=40    이번에 채울 개수 제한 */

import { collection, doc, getDocs, terminate, writeBatch } from 'firebase/firestore';
import { db } from '../components/lib/firebase';
import {
    fetchNaverBlogPostDetail,
    fetchNaverBlogPostList,
    parseKoreanDateTime,
    toBlogExcerpt,
} from '../components/lib/naverBlog';
import { storeNaverBlogThumbnail } from '../components/lib/naverBlogThumbnailStorage';

const COLLECTION = 'skinColumnPosts';
const CONCURRENCY = 4; // 매일 도는 동기화가 쓰는 값과 같게 — 네이버에 부담 주지 않는 선
const BATCH_LIMIT = 400; // Firestore 한 배치 상한(500)보다 넉넉히 아래

const argOf = (name: string) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split('=')[1];
const dryRun = process.argv.includes('--dry-run');
const limit = Number(argOf('limit') ?? 0) || Infinity;

/** 이미 Firestore 에 있는 네이버 글 — 글번호로 찾아 쓴다 */
interface Existing {
    docId: string;
    title?: string;
    excerpt?: string;
    thumbnailUrl?: string;
    blogCategory?: string;
    contentHtml?: string;
    youtubeUrl?: string;
    categorySlug?: string;
    createdAt?: string;
    sort?: number;
    isPublished?: boolean;
}

const isHostedThumbnail = (value?: string) => Boolean(value && value.includes('firebasestorage'));

/** 제목·요약문·썸네일·블로그 카테고리가 다 있으면 다시 긁을 이유가 없다 */
const isComplete = (post?: Existing) =>
    Boolean(post && post.excerpt && post.blogCategory && isHostedThumbnail(post.thumbnailUrl));

async function mapWithConcurrency<T, R>(items: T[], worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const results: R[] = [];
    for (let index = 0; index < items.length; index += CONCURRENCY) {
        const chunk = items.slice(index, index + CONCURRENCY);
        results.push(...(await Promise.all(chunk.map((item, offset) => worker(item, index + offset)))));
    }
    return results;
}

async function main() {
    console.log('네이버 블로그 전체 글 목록을 받는 중…');
    const list = await fetchNaverBlogPostList();
    console.log(`  블로그 전체 글: ${list.length}편`);

    const snapshot = await getDocs(collection(db, COLLECTION));
    const existingByLogNo = new Map<string, Existing>();
    snapshot.docs.forEach((entry) => {
        const data = entry.data();
        if (data.source !== 'naver-blog' || !data.blogLogNo) return;
        existingByLogNo.set(String(data.blogLogNo), { docId: entry.id, ...data } as Existing);
    });
    console.log(`  사이트에 이미 있는 글: ${existingByLogNo.size}편`);

    const hidden = [...existingByLogNo.values()].filter((post) => post.isPublished === false);
    if (hidden.length > 0) console.log(`  그중 사이트에 안 보이는 글: ${hidden.length}편`);

    const todo = list.filter((item) => !isComplete(existingByLogNo.get(item.id))).slice(0, limit);
    console.log(`  이번에 채울 글: ${todo.length}편\n`);

    if (dryRun) {
        todo.slice(0, 10).forEach((item) => console.log(`  · ${item.addDate}  ${item.title}`));
        if (todo.length > 10) console.log(`  … 외 ${todo.length - 10}편`);
        console.log('\n--dry-run 이라 저장하지 않았습니다.');
        return;
    }

    /* 분류를 걷어내기 전에는 "블로그 카테고리가 매핑 안 되면 비공개" 였다.
       그때 숨겨진 채로 쌓인 글들을 여기서 같이 풀어 준다. */
    if (hidden.length > 0) {
        const batch = writeBatch(db);
        hidden.forEach((post) => batch.set(doc(db, COLLECTION, post.docId), { isPublished: true }, { merge: true }));
        await batch.commit();
        console.log(`숨겨져 있던 ${hidden.length}편을 공개로 바꿨습니다.\n`);
    }

    if (todo.length === 0) {
        console.log('새로 채울 글은 없습니다. 이미 전부 들어와 있습니다.');
        return;
    }

    let done = 0;
    let noThumbnail = 0;
    const rows = await mapWithConcurrency(todo, async (item) => {
        const existing = existingByLogNo.get(item.id);
        const detail = await fetchNaverBlogPostDetail(item.id);

        // 이미 Firebase 에 올려 둔 썸네일이 있으면 다시 받지 않는다
        const hosted = isHostedThumbnail(existing?.thumbnailUrl)
            ? existing?.thumbnailUrl
            : detail?.thumbnailUrl
              ? await storeNaverBlogThumbnail(item.id, detail.thumbnailUrl)
              : null;
        if (!hosted) noThumbnail += 1;

        done += 1;
        if (done % 20 === 0 || done === todo.length) console.log(`  ${done}/${todo.length}편 처리`);

        // 본문 페이지의 분 단위 시각이 가장 정확하다. 못 읽으면 목록의 날짜로 떨어진다.
        const publishedAt =
            detail?.publishedAt || parseKoreanDateTime(item.addDate) || new Date().toISOString();

        return {
            logNo: item.id,
            data: {
                // 관리자가 고쳐 둔 값이 있으면 그대로 둔다 (매일 동기화와 같은 규칙)
                title: existing?.title || item.title,
                blogTitle: item.title,
                excerpt: existing?.excerpt || toBlogExcerpt(detail?.description ?? ''),
                contentHtml: existing?.contentHtml ?? '',
                youtubeUrl: existing?.youtubeUrl ?? '',
                thumbnailUrl: hosted ?? '',
                publishedAt,
                // 분류를 걷어냈으므로 전부 공개로 넣는다.
                // 예전에 "매핑 안 됨"이라 숨겨져 있던 글도 여기서 같이 풀린다.
                isPublished: true,
                categorySlug: existing?.categorySlug ?? '',
                source: 'naver-blog',
                blogUrl: item.url,
                // 나중에 분류를 되살릴 때 붙일 근거가 된다. 반드시 저장해 둔다.
                blogCategory: detail?.category ?? existing?.blogCategory ?? '',
                blogLogNo: item.id,
                sort: existing?.sort ?? (-Date.parse(publishedAt) || 0),
                createdAt: existing?.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        };
    });

    for (let index = 0; index < rows.length; index += BATCH_LIMIT) {
        const batch = writeBatch(db);
        rows.slice(index, index + BATCH_LIMIT).forEach((row) => {
            batch.set(doc(db, COLLECTION, `naver-${row.logNo}`), row.data, { merge: true });
        });
        await batch.commit();
    }

    console.log(`\n저장 완료 — ${rows.length}편`);
    if (noThumbnail > 0) console.log(`  썸네일을 못 찾은 글 ${noThumbnail}편 (글자만 나옵니다)`);
    console.log(`  사이트 전체 피부칼럼: ${existingByLogNo.size + rows.filter((r) => !existingByLogNo.has(r.logNo)).length}편`);
}

main()
    .catch((error) => {
        console.error('\n실패했습니다:', error instanceof Error ? error.message : error);
        process.exitCode = 1;
    })
    .finally(() => terminate(db));

/* 전후사진을 시술 페이지에 배정한다. 사진을 다시 올리지는 않고 이미 올라간 문서의 노출 설정만 고친다.
   - data/reviews-ba.seed.json 의 slugs / place / order / main 을 그대로 반영
   - 그 목록에 없는 예전 사진은 지우지 않고 어디에도 안 나오게만 둔다
     (문서와 사진은 남으므로 관리자 화면에서 다시 살리거나 삭제할 수 있다)

   실행: npm run ba:assign-pages   /   되돌리기: npm run ba:assign-pages -- --restore */

import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collection, doc, getDocs, terminate, writeBatch } from 'firebase/firestore';
import { db } from '../components/lib/firebase';

interface SeedItem {
    docId: string;
    label: string;
    slugs: string[];
    place: string;
    order: number;
    main?: number;
}

const COLLECTION = 'baPhotos';
const seedPath = resolve(process.cwd(), 'data/reviews-ba.seed.json');
/* 적용 직전 상태를 그대로 받아 둔다. --restore 는 이 파일을 되돌려 쓰므로,
   예전 사진을 숨긴 것까지 원래대로 복구된다. */
const backupPath = resolve(process.cwd(), 'data/ba-photos.backup.json');

/* 예전 사진을 숨기는 값. 시술 페이지 노출로 두되 연결된 페이지를 비워서 어느 화면에도 걸리지 않게 한다.
   (place 에는 "아무 데도 안 보임" 값이 없어서 이 조합을 쓴다) */
const HIDDEN = { place: 'treatment', slug: '', slugs: [], main: null };

/** 백업해 둔 노출 설정을 그대로 돌려놓는다 */
async function restoreFromBackup() {
    const saved = JSON.parse(await readFile(backupPath, 'utf8')) as Record<string, Record<string, unknown>>[];
    const batch = writeBatch(db);

    saved.forEach((row) => {
        const { id, ...fields } = row as unknown as { id: string } & Record<string, unknown>;
        batch.update(doc(db, COLLECTION, id), fields);
    });

    await batch.commit();
    console.log(`되돌렸습니다 — 사진 ${saved.length}장의 노출 설정을 적용 전으로 복구`);
    await terminate(db);
}

async function main() {
    if (process.argv.includes('--restore')) return restoreFromBackup();

    const payload = JSON.parse(await readFile(seedPath, 'utf8')) as { version: string; items: SeedItem[] };
    const seedById = new Map(payload.items.map((item) => [item.docId, item]));

    const snapshot = await getDocs(collection(db, COLLECTION));

    await writeFile(
        backupPath,
        JSON.stringify(
            snapshot.docs.map((entry) => {
                const data = entry.data();
                return {
                    id: entry.id,
                    slug: data.slug ?? '',
                    slugs: data.slugs ?? [],
                    place: data.place ?? 'both',
                    order: data.order ?? null,
                    main: data.main ?? null,
                };
            }),
            null,
            2,
        ),
        'utf8',
    );

    const batch = writeBatch(db);

    let assigned = 0;
    let reviewsOnly = 0;
    let hidden = 0;
    const perPage = new Map<string, number>();

    for (const entry of snapshot.docs) {
        const item = seedById.get(entry.id);

        if (!item) {
            batch.update(doc(db, COLLECTION, entry.id), HIDDEN);
            hidden += 1;
            continue;
        }

        batch.update(doc(db, COLLECTION, entry.id), {
            slug: item.slugs[0] ?? '',
            slugs: item.slugs,
            place: item.place,
            order: item.order,
            main: item.main ?? null,
        });

        if (item.slugs.length > 0) assigned += 1;
        else reviewsOnly += 1;
        item.slugs.forEach((slug) => perPage.set(slug, (perPage.get(slug) ?? 0) + 1));
    }

    const missing = payload.items.filter((item) => !snapshot.docs.some((entry) => entry.id === item.docId));

    await batch.commit();

    console.log('시술 페이지 배정을 마쳤습니다 (적용 전 상태는 data/ba-photos.backup.json 에 저장)');
    console.log(`  시술 페이지에 배정: ${assigned}장`);
    console.log(`  전후사진 페이지에만: ${reviewsOnly}장`);
    console.log(`  숨긴 예전 사진: ${hidden}장`);
    if (missing.length > 0) {
        console.log(`  ! Firestore 에 없는 사진 ${missing.length}장 — 먼저 npm run seed:reviews-ba 를 돌려 주세요`);
    }
    console.log('\n페이지별 장수');
    [...perPage.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([slug, count]) => console.log(`  ${slug.padEnd(20)} ${count}장`));

    await terminate(db);
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

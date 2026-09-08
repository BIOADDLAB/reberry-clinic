import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collection, doc, getDocs, terminate, updateDoc, writeBatch } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../components/lib/firebase';

interface SeedItem {
    docId: string;
    label: string;
    category: string;
    treatmentDate: string;
    image: string;
    slugs: string[]; // 이 사진을 함께 보여 줄 시술 페이지
    place: string; // 'both' = 시술 페이지 + 전후사진 페이지, 'reviews' = 전후사진 페이지만
    order: number; // 시술 페이지 안에서의 순서 (시술일 최신순)
    main?: number; // 메인 노출 순서. 없으면 메인에 안 나옴
}

interface SeedPayload {
    version: string;
    items: SeedItem[];
}

const COLLECTION = 'baPhotos';
const seedPath = resolve(process.cwd(), 'data/reviews-ba.seed.json');

async function main() {
    const payload = JSON.parse(await readFile(seedPath, 'utf8')) as SeedPayload;
    const existing = await getDocs(collection(db, COLLECTION));
    const seedIds = new Set(payload.items.map((item) => item.docId));

    let hiddenLegacy = 0;

    /* 이 목록에 없는 예전 사진은 지우지 않고 어디에도 안 나오게만 둔다.
       (place 에 "아무 데도 안 보임" 값이 없어서, 시술 페이지 노출로 두되 연결 페이지를 비운다)
       문서와 사진이 남아 있으므로 관리자 화면에서 다시 살리거나 삭제할 수 있다. */
    for (const entry of existing.docs) {
        if (seedIds.has(entry.id)) continue;

        await updateDoc(entry.ref, { place: 'treatment', slug: '', slugs: [], main: null });
        hiddenLegacy += 1;
    }

    const now = new Date().toISOString();
    const uploadedItems: Array<SeedItem & { imageUrl: string }> = [];
    for (const item of payload.items) {
        const localPath = resolve(process.cwd(), 'public', item.image.replace(/^\//, ''));
        const bytes = await readFile(localPath);
        const storageRef = ref(storage, `ba/reviews/${item.docId}.jpg`);
        await uploadBytes(storageRef, bytes, { contentType: 'image/jpeg' });
        const imageUrl = await getDownloadURL(storageRef);
        uploadedItems.push({ ...item, imageUrl });
        console.log(`uploaded ${item.docId}`);
    }

    for (let offset = 0; offset < uploadedItems.length; offset += 400) {
        const batch = writeBatch(db);
        uploadedItems.slice(offset, offset + 400).forEach((item) => {
            batch.set(doc(db, COLLECTION, item.docId), {
                slug: item.slugs[0] ?? '',
                slugs: item.slugs,
                label: item.label,
                before: item.imageUrl,
                after: item.imageUrl,
                category: item.category,
                place: item.place,
                order: item.order,
                main: item.main ?? null,
                treatmentDate: item.treatmentDate,
                seedVersion: payload.version,
                createdAt: now,
                updatedAt: now,
            });
        });
        await batch.commit();
    }

    const result = await getDocs(collection(db, COLLECTION));
    const uploaded = result.docs.filter((entry) => entry.data().seedVersion === payload.version);
    const reviewsVisible = result.docs.filter((entry) => {
        const place = entry.data().place;
        return place !== 'treatment';
    });

    console.log(
        JSON.stringify(
            {
                uploaded: uploaded.length,
                reviewsVisible: reviewsVisible.length,
                hiddenLegacy,
                firestoreTotal: result.size,
                version: payload.version,
            },
            null,
            2,
        ),
    );
    await terminate(db);
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

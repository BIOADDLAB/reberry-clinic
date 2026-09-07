import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collection, deleteDoc, doc, getDocs, terminate, updateDoc, writeBatch } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { db, storage } from '../components/lib/firebase';

interface SeedItem {
    docId: string;
    label: string;
    category: string;
    treatmentDate: string;
    image: string;
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

    let movedToTreatment = 0;
    let removedReviews = 0;

    for (const entry of existing.docs) {
        if (seedIds.has(entry.id)) continue;

        const place = entry.data().place;
        if (place === 'treatment') continue;

        if (place === 'reviews') {
            await deleteDoc(entry.ref);
            removedReviews += 1;
            continue;
        }

        // both / 값 없음 → 시술 페이지에만 남기고 전후사진 탭에서는 뺀다
        await updateDoc(entry.ref, { place: 'treatment' });
        movedToTreatment += 1;
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
                slug: '',
                slugs: [],
                label: item.label,
                before: item.imageUrl,
                after: item.imageUrl,
                category: item.category,
                place: 'reviews',
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
                movedToTreatment,
                removedReviews,
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

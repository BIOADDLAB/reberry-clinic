import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collection, doc, getDocs, terminate, writeBatch } from 'firebase/firestore';
import { db } from '../components/lib/firebase';

interface SeedPayload {
    version: string;
    categories: Array<{
        docId: string;
        label: string;
        sort: number;
        isPublished: boolean;
        seedVersion: string;
    }>;
    items: Array<{
        docId: string;
        categoryId: string;
        section: string;
        name: string;
        description: string;
        options: Array<{ id: string; label: string; price: number }>;
        sort: number;
        isPublished: boolean;
        seedVersion: string;
    }>;
}

const CATEGORY_COLLECTION = 'priceListCategories';
const ITEM_COLLECTION = 'priceListItems';
const seedPath = resolve(process.cwd(), 'data/price-list.seed.json');

async function main() {
    const payload = JSON.parse(await readFile(seedPath, 'utf8')) as SeedPayload;
    const packagePattern = /pkg|패키지/i;
    const invalidItem = payload.items.find(
        (item) =>
            packagePattern.test(item.name) ||
            packagePattern.test(item.description) ||
            item.options.length === 0 ||
            item.options.some((option) => !Number.isInteger(option.price) || option.price <= 0),
    );
    if (invalidItem) throw new Error(`Invalid seed item: ${invalidItem.name}`);

    const now = new Date().toISOString();
    const writes = [
        ...payload.categories.map((category) => ({
            ref: doc(db, CATEGORY_COLLECTION, category.docId),
            data: {
                label: category.label,
                sort: category.sort,
                isPublished: category.isPublished,
                seedVersion: payload.version,
                createdAt: now,
                updatedAt: now,
            },
        })),
        ...payload.items.map((item) => ({
            ref: doc(db, ITEM_COLLECTION, item.docId),
            data: {
                categoryId: item.categoryId,
                section: item.section,
                name: item.name,
                description: item.description,
                options: item.options.map(({ id, label, price }) => ({ id, label, price })),
                sort: item.sort,
                isPublished: item.isPublished,
                seedVersion: payload.version,
                createdAt: now,
                updatedAt: now,
            },
        })),
    ];

    for (let offset = 0; offset < writes.length; offset += 450) {
        const batch = writeBatch(db);
        writes.slice(offset, offset + 450).forEach(({ ref, data }) => batch.set(ref, data, { merge: true }));
        await batch.commit();
    }

    const [categorySnapshot, itemSnapshot] = await Promise.all([
        getDocs(collection(db, CATEGORY_COLLECTION)),
        getDocs(collection(db, ITEM_COLLECTION)),
    ]);

    if (categorySnapshot.size < payload.categories.length || itemSnapshot.size < payload.items.length) {
        throw new Error(
            `Read-back mismatch: categories=${categorySnapshot.size}/${payload.categories.length}, items=${itemSnapshot.size}/${payload.items.length}`,
        );
    }

    const firstItem = itemSnapshot.docs[0];
    console.log(
        JSON.stringify(
            {
                uploadedCategories: payload.categories.length,
                uploadedItems: payload.items.length,
                firestoreCategories: categorySnapshot.size,
                firestoreItems: itemSnapshot.size,
                sample: firstItem ? { id: firstItem.id, name: firstItem.data().name } : null,
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


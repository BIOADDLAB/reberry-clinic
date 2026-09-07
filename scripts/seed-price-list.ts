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
    sections: Array<{
        docId: string;
        categoryId: string;
        label: string;
        sort: number;
        isPublished: boolean;
        seedVersion: string;
    }>;
    items: Array<{
        docId: string;
        categoryId: string;
        sectionId: string;
        name: string;
        productLabel: string;
        description: string;
        sessions: Array<{ id: string; label: string; price: number }>;
        sort: number;
        isPublished: boolean;
        seedVersion: string;
    }>;
}

const CATEGORY_COLLECTION = 'priceListCategories';
const SECTION_COLLECTION = 'priceListSections';
const ITEM_COLLECTION = 'priceListItems';
const seedPath = resolve(process.cwd(), 'data/price-list.seed.json');

async function main() {
    const payload = JSON.parse(await readFile(seedPath, 'utf8')) as SeedPayload;
    const invalidItem = payload.items.find(
        (item) =>
            item.sessions.length === 0 ||
            item.sessions.some(
                (session) =>
                    !/^\d+(?:\.\d+)?(?:회|개|병)$/.test(session.label) ||
                    !Number.isInteger(session.price) ||
                    session.price <= 0,
            ),
    );
    if (invalidItem) throw new Error(`Invalid seed item: ${invalidItem.name}`);

    const [existingCategories, existingSections, existingItems] = await Promise.all([
        getDocs(collection(db, CATEGORY_COLLECTION)),
        getDocs(collection(db, SECTION_COLLECTION)),
        getDocs(collection(db, ITEM_COLLECTION)),
    ]);
    /* --reset : 기존 수가표를 전부 지우고 새로 넣는다.
       기본 동작은 "이전 시드가 남긴 문서 중 이번 시드에 없는 것"만 지우기라,
       관리자에서 손으로 만든 문서(seedVersion 없음)는 그대로 남는다.
       수가표를 통째로 교체할 때는 이 플래그를 붙여야 옛날 데이터가 섞이지 않는다. */
    const resetAll = process.argv.includes('--reset');
    if (resetAll) {
        const everything = [...existingCategories.docs, ...existingSections.docs, ...existingItems.docs];
        for (let offset = 0; offset < everything.length; offset += 450) {
            const batch = writeBatch(db);
            everything.slice(offset, offset + 450).forEach((entry) => batch.delete(entry.ref));
            await batch.commit();
        }
        console.log(`[reset] 기존 수가표 문서 ${everything.length}건 삭제`);
    }

    const targetCategoryIds = new Set(payload.categories.map((category) => category.docId));
    const targetSectionIds = new Set(payload.sections.map((section) => section.docId));
    const targetItemIds = new Set(payload.items.map((item) => item.docId));
    const staleSeedDocs = resetAll ? [] : [
        ...existingCategories.docs.filter(
            (entry) =>
                String(entry.data().seedVersion ?? '').startsWith('xlsx-seed-') &&
                !targetCategoryIds.has(entry.id),
        ),
        ...existingSections.docs.filter(
            (entry) =>
                String(entry.data().seedVersion ?? '').startsWith('xlsx-seed-') &&
                !targetSectionIds.has(entry.id),
        ),
        ...existingItems.docs.filter(
            (entry) =>
                String(entry.data().seedVersion ?? '').startsWith('xlsx-seed-') &&
                !targetItemIds.has(entry.id),
        ),
    ];
    for (let offset = 0; offset < staleSeedDocs.length; offset += 450) {
        const batch = writeBatch(db);
        staleSeedDocs.slice(offset, offset + 450).forEach((entry) => batch.delete(entry.ref));
        await batch.commit();
    }

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
        ...payload.sections.map((section) => ({
            ref: doc(db, SECTION_COLLECTION, section.docId),
            data: {
                categoryId: section.categoryId,
                label: section.label,
                sort: section.sort,
                isPublished: section.isPublished,
                seedVersion: payload.version,
                createdAt: now,
                updatedAt: now,
            },
        })),
        ...payload.items.map((item) => ({
            ref: doc(db, ITEM_COLLECTION, item.docId),
            data: {
                categoryId: item.categoryId,
                sectionId: item.sectionId,
                name: item.name,
                productLabel: item.productLabel ?? '',
                description: item.description,
                sessions: item.sessions.map(({ id, label, price }) => ({ id, label, price })),
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
        writes.slice(offset, offset + 450).forEach(({ ref, data }) => batch.set(ref, data));
        await batch.commit();
    }

    const [categorySnapshot, sectionSnapshot, itemSnapshot] = await Promise.all([
        getDocs(collection(db, CATEGORY_COLLECTION)),
        getDocs(collection(db, SECTION_COLLECTION)),
        getDocs(collection(db, ITEM_COLLECTION)),
    ]);

    const uploadedCategoryCount = categorySnapshot.docs.filter(
        (entry) => entry.data().seedVersion === payload.version,
    ).length;
    const uploadedSectionCount = sectionSnapshot.docs.filter(
        (entry) => entry.data().seedVersion === payload.version,
    ).length;
    const uploadedItemCount = itemSnapshot.docs.filter((entry) => entry.data().seedVersion === payload.version).length;
    const categoryById = new Map(categorySnapshot.docs.map((entry) => [entry.id, entry.data()]));
    const sectionById = new Map(sectionSnapshot.docs.map((entry) => [entry.id, entry.data()]));
    const itemById = new Map(itemSnapshot.docs.map((entry) => [entry.id, entry.data()]));
    const contentMismatch =
        payload.categories.find((category) => categoryById.get(category.docId)?.label !== category.label)?.docId ??
        payload.sections.find((section) => {
            const stored = sectionById.get(section.docId);
            return stored?.categoryId !== section.categoryId || stored?.label !== section.label;
        })?.docId ??
        payload.items.find((item) => {
            const stored = itemById.get(item.docId);
            return (
                stored?.categoryId !== item.categoryId ||
                stored?.sectionId !== item.sectionId ||
                stored?.name !== item.name ||
                (stored?.productLabel ?? '') !== (item.productLabel ?? '') ||
                JSON.stringify(stored?.sessions ?? []) !==
                    JSON.stringify(item.sessions.map(({ id, label, price }) => ({ id, label, price })))
            );
        })?.docId;
    if (
        uploadedCategoryCount !== payload.categories.length ||
        uploadedSectionCount !== payload.sections.length ||
        uploadedItemCount !== payload.items.length ||
        contentMismatch
    ) {
        throw new Error(
            `Read-back mismatch: categories=${uploadedCategoryCount}/${payload.categories.length}, ` +
                `sections=${uploadedSectionCount}/${payload.sections.length}, items=${uploadedItemCount}/${payload.items.length}, ` +
                `content=${contentMismatch ?? 'ok'}`,
        );
    }

    const firstItem = itemSnapshot.docs[0];
    console.log(
        JSON.stringify(
            {
                uploadedCategories: payload.categories.length,
                uploadedSections: payload.sections.length,
                uploadedItems: payload.items.length,
                firestoreCategories: categorySnapshot.size,
                firestoreSections: sectionSnapshot.size,
                firestoreItems: itemSnapshot.size,
                removedStaleSeedDocs: staleSeedDocs.length,
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


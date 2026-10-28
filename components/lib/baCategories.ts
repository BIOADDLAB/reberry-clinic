import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    updateDoc,
    writeBatch,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { BA_CATEGORIES, resolveBACategory } from './ba';

const COLLECTION = 'baCategories';
const PHOTOS_COLLECTION = 'baPhotos';
const categoriesCollection = collection(db, COLLECTION);

export interface BACategoryInput {
    label: string;
    isPublished: boolean;
}

export interface BACategory extends BACategoryInput {
    key: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

const toString = (value: unknown) => (typeof value === 'string' ? value : '');
const toNumber = (value: unknown, fallback = 0) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeCategory = (docId: string, data: Record<string, unknown>): BACategory => ({
    key: docId,
    label: toString(data.label) || docId,
    isPublished: data.isPublished !== false,
    sort: toNumber(data.sort, Number.MAX_SAFE_INTEGER),
    createdAt: toString(data.createdAt),
    updatedAt: toString(data.updatedAt),
});

const sortByOrder = (items: BACategory[]) => [...items].sort((a, b) => a.sort - b.sort);

export function subscribeBACategories(
    onItems: (items: BACategory[]) => void,
    onError: (error: Error) => void,
    publishedOnly = false,
): Unsubscribe {
    return onSnapshot(
        categoriesCollection,
        (snapshot) => {
            const items = snapshot.docs.map((entry) => normalizeCategory(entry.id, entry.data()));
            onItems(sortByOrder(publishedOnly ? items.filter((item) => item.isPublished) : items));
        },
        onError,
    );
}

/** 컬렉션이 비어 있으면 기본 6개 탭을 넣는다. 이미 있으면 건드리지 않는다. */
export async function ensureDefaultBACategories(): Promise<void> {
    const snapshot = await getDocs(categoriesCollection);
    if (!snapshot.empty) return;
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    BA_CATEGORIES.forEach((category, sort) => {
        batch.set(doc(db, COLLECTION, category.key), {
            label: category.label,
            isPublished: true,
            sort,
            createdAt: now,
            updatedAt: now,
        });
    });
    await batch.commit();
}

/** 기본 6개 탭의 이름·순서를 맞춘다. 관리자가 만든 추가 탭은 그대로 둔다. */
export async function upsertDefaultBACategories(): Promise<void> {
    const now = new Date().toISOString();
    const batch = writeBatch(db);
    BA_CATEGORIES.forEach((category, sort) => {
        batch.set(
            doc(db, COLLECTION, category.key),
            {
                label: category.label,
                isPublished: true,
                sort,
                updatedAt: now,
            },
            { merge: true },
        );
    });
    await batch.commit();
}

export async function createBACategory(input: BACategoryInput): Promise<string> {
    const snapshot = await getDocs(categoriesCollection);
    const latestSort = Math.max(-1, ...snapshot.docs.map((entry) => toNumber(entry.data().sort, -1)));
    const now = new Date().toISOString();
    const created = await addDoc(categoriesCollection, {
        ...input,
        sort: latestSort + 1,
        createdAt: now,
        updatedAt: now,
    });
    return created.id;
}

export async function updateBACategory(key: string, input: BACategoryInput): Promise<void> {
    await updateDoc(doc(db, COLLECTION, key), { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteBACategory(key: string): Promise<void> {
    const photos = await getDocs(collection(db, PHOTOS_COLLECTION));
    const linked = photos.docs.filter((entry) => resolveBACategory(entry.data()) === key);
    if (linked.length > 0) {
        throw new Error(`이 탭에 사진이 ${linked.length}장 남아 있습니다. 사진을 다른 탭으로 옮긴 뒤 삭제해 주세요.`);
    }
    await deleteDoc(doc(db, COLLECTION, key));
}

export async function updateBACategorySorts(items: Array<{ key: string; sort: number }>): Promise<void> {
    const batch = writeBatch(db);
    const updatedAt = new Date().toISOString();
    items.forEach(({ key, sort }) => batch.update(doc(db, COLLECTION, key), { sort, updatedAt }));
    await batch.commit();
}


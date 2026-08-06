import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    query,
    updateDoc,
    where,
    writeBatch,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

const CATEGORY_COLLECTION = 'priceListCategories';
const ITEM_COLLECTION = 'priceListItems';

export interface PriceOption {
    id: string;
    label: string;
    price: number;
}

export interface PriceCategoryInput {
    label: string;
    isPublished: boolean;
}

export interface PriceCategory extends PriceCategoryInput {
    docId: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

export interface PriceListItemInput {
    categoryId: string;
    section: string;
    name: string;
    description: string;
    options: PriceOption[];
    isPublished: boolean;
}

export interface PriceListItem extends PriceListItemInput {
    docId: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

export interface PriceCartItem {
    itemId: string;
    optionId: string;
    categoryLabel: string;
    itemName: string;
    optionLabel: string;
    unitPrice: number;
    quantity: number;
}

export const PRICE_CART_STORAGE_KEY = 'reberry-price-cart';

const categoriesCollection = collection(db, CATEGORY_COLLECTION);
const itemsCollection = collection(db, ITEM_COLLECTION);

const toString = (value: unknown) => (typeof value === 'string' ? value : '');
const toNumber = (value: unknown, fallback = 0) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

const normalizeOptions = (value: unknown): PriceOption[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry, index) => {
            const option = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
            return {
                id: toString(option.id) || `option-${index}`,
                label: toString(option.label) || '기본',
                price: Math.max(0, Math.round(toNumber(option.price))),
            };
        })
        .filter((option) => option.price > 0);
};

const normalizeCategory = (docId: string, data: Record<string, unknown>): PriceCategory => ({
    docId,
    label: toString(data.label),
    isPublished: data.isPublished !== false,
    sort: toNumber(data.sort, Number.MAX_SAFE_INTEGER),
    createdAt: toString(data.createdAt),
    updatedAt: toString(data.updatedAt),
});

const normalizeItem = (docId: string, data: Record<string, unknown>): PriceListItem => ({
    docId,
    categoryId: toString(data.categoryId),
    section: toString(data.section),
    name: toString(data.name),
    description: toString(data.description),
    options: normalizeOptions(data.options),
    isPublished: data.isPublished !== false,
    sort: toNumber(data.sort, Number.MAX_SAFE_INTEGER),
    createdAt: toString(data.createdAt),
    updatedAt: toString(data.updatedAt),
});

const sortByOrder = <T extends { sort: number }>(items: T[]) => [...items].sort((a, b) => a.sort - b.sort);

export function subscribePriceCategories(
    onItems: (items: PriceCategory[]) => void,
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

export function subscribePriceListItems(
    onItems: (items: PriceListItem[]) => void,
    onError: (error: Error) => void,
    publishedOnly = false,
): Unsubscribe {
    return onSnapshot(
        itemsCollection,
        (snapshot) => {
            const items = snapshot.docs.map((entry) => normalizeItem(entry.id, entry.data()));
            onItems(sortByOrder(publishedOnly ? items.filter((item) => item.isPublished) : items));
        },
        onError,
    );
}

export async function createPriceCategory(input: PriceCategoryInput): Promise<void> {
    const snapshot = await getDocs(categoriesCollection);
    const latestSort = Math.max(-1, ...snapshot.docs.map((entry) => toNumber(entry.data().sort, -1)));
    const now = new Date().toISOString();
    await addDoc(categoriesCollection, { ...input, sort: latestSort + 1, createdAt: now, updatedAt: now });
}

export async function updatePriceCategory(docId: string, input: PriceCategoryInput): Promise<void> {
    await updateDoc(doc(db, CATEGORY_COLLECTION, docId), { ...input, updatedAt: new Date().toISOString() });
}

export async function deletePriceCategory(docId: string): Promise<void> {
    const linkedItems = await getDocs(query(itemsCollection, where('categoryId', '==', docId)));
    if (!linkedItems.empty) throw new Error('시술 항목이 남아 있는 카테고리는 삭제할 수 없습니다.');
    await deleteDoc(doc(db, CATEGORY_COLLECTION, docId));
}

export async function createPriceListItem(input: PriceListItemInput): Promise<void> {
    const snapshot = await getDocs(itemsCollection);
    const latestSort = Math.max(
        -1,
        ...snapshot.docs
            .filter((entry) => entry.data().categoryId === input.categoryId)
            .map((entry) => toNumber(entry.data().sort, -1)),
    );
    const now = new Date().toISOString();
    await addDoc(itemsCollection, { ...input, sort: latestSort + 1, createdAt: now, updatedAt: now });
}

export async function updatePriceListItem(docId: string, input: PriceListItemInput): Promise<void> {
    await updateDoc(doc(db, ITEM_COLLECTION, docId), { ...input, updatedAt: new Date().toISOString() });
}

export async function deletePriceListItem(docId: string): Promise<void> {
    await deleteDoc(doc(db, ITEM_COLLECTION, docId));
}

export async function updatePriceListItemSorts(items: Array<{ docId: string; sort: number }>): Promise<void> {
    const batch = writeBatch(db);
    const updatedAt = new Date().toISOString();
    items.forEach(({ docId, sort }) => batch.update(doc(db, ITEM_COLLECTION, docId), { sort, updatedAt }));
    await batch.commit();
}

export const formatPrice = (price: number, locale = 'ko-KR') =>
    new Intl.NumberFormat(locale, { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(price);

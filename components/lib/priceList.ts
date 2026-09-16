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
const SECTION_COLLECTION = 'priceListSections';
const ITEM_COLLECTION = 'priceListItems';

export interface PriceSession {
    id: string;
    label: string;
    price: number;
}

/* 금액 대신 "상담 문의" 로 낼 때 쓰는 값 (헐리우드 토닝 체험가처럼 가격이 아직 없는 시술).
   0원을 쓰면 안 된다 — 0원은 관리자에서 [항목 추가]·[가격 열 추가] 로 만든 빈 칸이라
   홈페이지에 안 내는 값이다. 세 가지 상태를 구분해야 해서 따로 둔다.
     0원  : 아직 안 채운 칸 → 홈페이지에 안 나온다
     음수 : 상담 문의       → 홈페이지에 "상담 문의" 로 나온다
     양수 : 금액 */
export const CONSULT_PRICE = -1;

export const isConsultPrice = (price: number) => price < 0;

export interface PriceCategoryInput {
    label: string;
    /* 탭 아래에 나오는 안내 박스 문구 (예: 주름 보톡스 가능 부위).
       줄바꿈으로 여러 줄을 쓸 수 있다. 비우면 박스가 안 나온다. */
    note?: string;
    isPublished: boolean;
}

export interface PriceCategory extends PriceCategoryInput {
    docId: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

export interface PriceSectionInput {
    categoryId: string;
    label: string;
    isPublished: boolean;
}

export interface PriceSection extends PriceSectionInput {
    docId: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

export interface PriceListItemInput {
    categoryId: string;
    sectionId: string;
    name: string;
    productLabel: string;
    description: string;
    sessions: PriceSession[];
    isPublished: boolean;
}

export interface PriceListItem extends PriceListItemInput {
    docId: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

const categoriesCollection = collection(db, CATEGORY_COLLECTION);
const sectionsCollection = collection(db, SECTION_COLLECTION);
const itemsCollection = collection(db, ITEM_COLLECTION);

const toString = (value: unknown) => (typeof value === 'string' ? value : '');
const toNumber = (value: unknown, fallback = 0) =>
    typeof value === 'number' && Number.isFinite(value) ? value : fallback;

/* #ISSUE: 여기서 0원 회차를 걸러 버려서, 관리자에서 [항목 추가] 로 만든 줄(가격 0원)이
           sessions 없는 항목이 되고 → 가격을 적어도 저장이 안 됐다.
   → 0원도 그대로 들고 온다. 홈페이지에 안 내는 일은 priceBoard 가 맡는다.
     음수도 0원으로 깎지 않는다 — 상담 문의 표시라서 그대로 살려야 한다 (CONSULT_PRICE). */
const normalizeSessions = (value: unknown): PriceSession[] => {
    if (!Array.isArray(value)) return [];
    return value.map((entry, index) => {
        const option = entry && typeof entry === 'object' ? (entry as Record<string, unknown>) : {};
        const price = Math.round(toNumber(option.price));
        return {
            id: toString(option.id) || `option-${index}`,
            label: toString(option.label) || '1회',
            price: isConsultPrice(price) ? CONSULT_PRICE : price,
        };
    });
};

const normalizeCategory = (docId: string, data: Record<string, unknown>): PriceCategory => ({
    docId,
    label: toString(data.label),
    note: toString(data.note),
    isPublished: data.isPublished !== false,
    sort: toNumber(data.sort, Number.MAX_SAFE_INTEGER),
    createdAt: toString(data.createdAt),
    updatedAt: toString(data.updatedAt),
});

const normalizeSection = (docId: string, data: Record<string, unknown>): PriceSection => ({
    docId,
    categoryId: toString(data.categoryId),
    label: toString(data.label),
    isPublished: data.isPublished !== false,
    sort: toNumber(data.sort, Number.MAX_SAFE_INTEGER),
    createdAt: toString(data.createdAt),
    updatedAt: toString(data.updatedAt),
});

const normalizeItem = (docId: string, data: Record<string, unknown>): PriceListItem => ({
    docId,
    categoryId: toString(data.categoryId),
    sectionId: toString(data.sectionId),
    name: toString(data.name),
    productLabel: toString(data.productLabel),
    description: toString(data.description),
    sessions: normalizeSessions(data.sessions ?? data.options),
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

export function subscribePriceSections(
    onItems: (items: PriceSection[]) => void,
    onError: (error: Error) => void,
    publishedOnly = false,
): Unsubscribe {
    return onSnapshot(
        sectionsCollection,
        (snapshot) => {
            const items = snapshot.docs.map((entry) => normalizeSection(entry.id, entry.data()));
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
    const linkedSections = await getDocs(query(sectionsCollection, where('categoryId', '==', docId)));
    const linkedItems = await getDocs(query(itemsCollection, where('categoryId', '==', docId)));
    if (!linkedSections.empty || !linkedItems.empty) {
        throw new Error('소제목 또는 시술 항목이 남아 있는 카테고리는 삭제할 수 없습니다.');
    }
    await deleteDoc(doc(db, CATEGORY_COLLECTION, docId));
}

/** 대분류(카테고리) 노출 순서 저장. 소제목·항목과 같은 방식으로 sort 값만 갈아끼운다. */
export async function updatePriceCategorySorts(items: Array<{ docId: string; sort: number }>): Promise<void> {
    const batch = writeBatch(db);
    const updatedAt = new Date().toISOString();
    items.forEach(({ docId, sort }) => batch.update(doc(db, CATEGORY_COLLECTION, docId), { sort, updatedAt }));
    await batch.commit();
}

/** `first` 면 맨 앞에 꽂는다 — 카드를 추가하고 곧바로 이름을 적을 수 있어야 해서. */
export async function createPriceSection(input: PriceSectionInput, { first = false } = {}): Promise<void> {
    const snapshot = await getDocs(sectionsCollection);
    const sameCategory = snapshot.docs
        .filter((entry) => entry.data().categoryId === input.categoryId)
        .map((entry) => toNumber(entry.data().sort, -1));
    const sort = first ? Math.min(0, ...sameCategory) - 1 : Math.max(-1, ...sameCategory) + 1;
    const now = new Date().toISOString();
    await addDoc(sectionsCollection, { ...input, sort, createdAt: now, updatedAt: now });
}

export async function updatePriceSection(docId: string, input: PriceSectionInput): Promise<void> {
    await updateDoc(doc(db, SECTION_COLLECTION, docId), { ...input, updatedAt: new Date().toISOString() });
}

export async function deletePriceSection(docId: string): Promise<void> {
    const linkedItems = await getDocs(query(itemsCollection, where('sectionId', '==', docId)));
    if (!linkedItems.empty) throw new Error('시술 항목이 남아 있는 소제목은 삭제할 수 없습니다.');
    await deleteDoc(doc(db, SECTION_COLLECTION, docId));
}

export async function updatePriceSectionSorts(items: Array<{ docId: string; sort: number }>): Promise<void> {
    const batch = writeBatch(db);
    const updatedAt = new Date().toISOString();
    items.forEach(({ docId, sort }) => batch.update(doc(db, SECTION_COLLECTION, docId), { sort, updatedAt }));
    await batch.commit();
}

export async function createPriceListItem(input: PriceListItemInput): Promise<void> {
    const snapshot = await getDocs(itemsCollection);
    const latestSort = Math.max(
        -1,
        ...snapshot.docs
            .filter((entry) => entry.data().sectionId === input.sectionId)
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

export const formatPriceItemName = (item: Pick<PriceListItem, 'name' | 'productLabel'>) =>
    item.productLabel ? `${item.name} (${item.productLabel})` : item.name;

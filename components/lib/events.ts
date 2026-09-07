/* 이벤트(프로모션) 데이터
   #ISSUE 1: "9월 프로모션" 같은 상단 제목·기간·부가세 문구를 이벤트마다 하나씩 적게 돼 있었다.
             이벤트가 20개면 같은 문구를 20번 적어야 하고, 달이 바뀌면 20개를 다 고쳐야 했다.
             → 화면 전체에 한 번만 들어가는 값이므로 전역 설정(settings/eventSettings)으로 뺀다.
   #ISSUE 2: 기간이 그냥 문자열이라 "언제 끝나는지" 를 코드가 알 수 없었다.
             끝난 이벤트도 계속 노출되고, 상시 이벤트를 표현할 방법도 없었다.
             → startDate/endDate(YYYY-MM-DD) + alwaysOn(상시) 로 바꾸고,
               끝난 이벤트는 고객 화면에서 자동으로 빠진다(관리자에는 '종료' 로 보임). */

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    onSnapshot,
    setDoc,
    updateDoc,
    writeBatch,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'events';
const eventsCollection = collection(db, COLLECTION_NAME);
const SETTINGS_DOC = doc(db, 'settings', 'eventSettings');

/* ── 전역 설정 : 화면 맨 위에 한 번만 나오는 값 ───────────────────────────── */

export interface EventSettings {
    /** 예: "9월 프로모션" */
    headline: string;
    /** 예: "부가세 별도" */
    vatNotice: string;
    /** 화면 상단에 노출할 기간 문구. 비우면 이벤트들의 종료일 중 가장 늦은 날로 자동 표기 */
    periodNotice: string;
}

export const DEFAULT_EVENT_SETTINGS: EventSettings = {
    headline: '이번 달 프로모션',
    vatNotice: '부가세 별도',
    periodNotice: '',
};

export function subscribeEventSettings(
    onSettings: (settings: EventSettings) => void,
    onError?: (error: Error) => void,
): Unsubscribe {
    return onSnapshot(
        SETTINGS_DOC,
        (snapshot) => {
            const data = snapshot.data() ?? {};
            onSettings({
                headline: typeof data.headline === 'string' && data.headline ? data.headline : DEFAULT_EVENT_SETTINGS.headline,
                vatNotice:
                    typeof data.vatNotice === 'string' && data.vatNotice ? data.vatNotice : DEFAULT_EVENT_SETTINGS.vatNotice,
                periodNotice: typeof data.periodNotice === 'string' ? data.periodNotice : '',
            });
        },
        (error) => onError?.(error),
    );
}

export async function saveEventSettings(settings: Partial<EventSettings>): Promise<void> {
    await setDoc(SETTINGS_DOC, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
}

/* ── 이벤트 항목 ─────────────────────────────────────────────────────────── */

export interface EventInput {
    title: string;
    category: string;
    description: string;
    originalPrice: number | null;
    salePrice: number | null;
    /** true 면 기간 없이 상시 진행 */
    alwaysOn: boolean;
    /** YYYY-MM-DD. alwaysOn 이면 비워 둔다 */
    startDate: string;
    endDate: string;
    isPublished: boolean;
    /** 예전 데이터 호환용 — 새로 쓰지 않는다 */
    imageUrl: string;
    badge: string;
}

export interface EventItem extends EventInput {
    docId: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);
const num = (value: unknown) => (typeof value === 'number' && Number.isFinite(value) ? value : null);
const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value);

const normalizeEvent = (docId: string, data: Record<string, unknown>): EventItem => ({
    docId,
    title: str(data.title),
    category: str(data.category, '이벤트') || '이벤트',
    description: str(data.description),
    originalPrice: num(data.originalPrice),
    salePrice: num(data.salePrice),
    // 기간 정보가 아예 없던 예전 데이터는 '상시' 로 읽어 화면에서 사라지지 않게 한다
    alwaysOn: typeof data.alwaysOn === 'boolean' ? data.alwaysOn : !isDate(str(data.endDate)),
    startDate: isDate(str(data.startDate)) ? str(data.startDate) : '',
    endDate: isDate(str(data.endDate)) ? str(data.endDate) : '',
    isPublished: data.isPublished !== false,
    imageUrl: str(data.imageUrl),
    badge: str(data.badge),
    sort: typeof data.sort === 'number' ? data.sort : Number.MAX_SAFE_INTEGER,
    createdAt: str(data.createdAt),
    updatedAt: str(data.updatedAt),
});

/** 오늘 날짜(YYYY-MM-DD). 시간대 변환 없이 로컬 기준 */
export function todayKey(date = new Date()): string {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** 지금 진행 중인가. 상시면 항상 true, 아니면 시작~종료 안에 있어야 한다 */
export function isEventLive(event: Pick<EventItem, 'alwaysOn' | 'startDate' | 'endDate'>, today = todayKey()): boolean {
    if (event.alwaysOn) return true;
    if (event.startDate && today < event.startDate) return false;
    if (event.endDate && today > event.endDate) return false;
    return true;
}

/** 관리자 목록에 찍을 상태 */
export function eventStatus(
    event: Pick<EventItem, 'alwaysOn' | 'startDate' | 'endDate' | 'isPublished'>,
    today = todayKey(),
): '진행 중' | '예정' | '종료' | '숨김' {
    if (!event.isPublished) return '숨김';
    if (event.alwaysOn) return '진행 중';
    if (event.startDate && today < event.startDate) return '예정';
    if (event.endDate && today > event.endDate) return '종료';
    return '진행 중';
}

const dots = (value: string) => value.replace(/-/g, '.');

/** "2026.09.01 — 2026.09.30" / "상시 진행" */
export function formatEventPeriod(event: Pick<EventItem, 'alwaysOn' | 'startDate' | 'endDate'>): string {
    if (event.alwaysOn) return '상시 진행';
    if (event.startDate && event.endDate) return `${dots(event.startDate)} — ${dots(event.endDate)}`;
    if (event.endDate) return `~ ${dots(event.endDate)} 까지`;
    if (event.startDate) return `${dots(event.startDate)} ~`;
    return '상시 진행';
}

/** 정상가 대비 할인율(%). 할인이 아니면 0 */
export function eventDiscountRate(event: Pick<EventItem, 'originalPrice' | 'salePrice'>): number {
    const { originalPrice, salePrice } = event;
    if (originalPrice === null || salePrice === null || originalPrice <= salePrice) return 0;
    return Math.round((1 - salePrice / originalPrice) * 100);
}

export function subscribeEvents(
    onItems: (items: EventItem[]) => void,
    onError: (error: Error) => void,
    /** true 면 고객 화면용 — 숨김 + 기간이 지난 이벤트를 빼고 내려 준다 */
    publishedOnly = false,
): Unsubscribe {
    return onSnapshot(
        eventsCollection,
        (snapshot) => {
            const today = todayKey();
            const items = snapshot.docs
                .map((entry) => normalizeEvent(entry.id, entry.data()))
                .filter((item) => !publishedOnly || (item.isPublished && isEventLive(item, today)))
                .sort((a, b) => a.sort - b.sort);
            onItems(items);
        },
        onError,
    );
}

export async function createEvent(input: EventInput): Promise<string> {
    const snapshot = await getDocs(eventsCollection);
    const latestSort = Math.max(
        -1,
        ...snapshot.docs.map((entry) => (typeof entry.data().sort === 'number' ? entry.data().sort : -1)),
    );
    const now = new Date().toISOString();
    const created = await addDoc(eventsCollection, { ...input, sort: latestSort + 1, createdAt: now, updatedAt: now });
    return created.id;
}

export async function updateEvent(docId: string, input: EventInput): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, docId), { ...input, updatedAt: new Date().toISOString() });
}

export async function deleteEvent(docId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
}

export async function updateEventSorts(items: Array<{ docId: string; sort: number }>): Promise<void> {
    const batch = writeBatch(db);
    const updatedAt = new Date().toISOString();
    items.forEach(({ docId, sort }) => batch.update(doc(db, COLLECTION_NAME, docId), { sort, updatedAt }));
    await batch.commit();
}

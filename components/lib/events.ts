/* 이벤트(프로모션) 데이터 — 포스터 사진 한 장이 이벤트 하나다.
   #ISSUE: 한동안 제목·설명·정상가·이벤트가·기간을 칸마다 적는 표 형태로 운영했는데,
           병원에서 쓰는 방식은 디자인된 포스터를 그대로 올리는 것이었다. 가격을 두 군데
           (포스터 그림 안 / 사이트 글자) 적게 되니 서로 어긋나기만 했다.
           → 2026.09.17 부터 사진 + 관리용 이름 + 보임 세 가지만 남긴다.
             가격·기간·분류 칸은 화면과 코드에서 뺐다 (옛 문서에 남은 값은 읽지 않고 버려 둔다).
   #ISSUE: 사진이 없는 이벤트는 고객 화면에 걸 것이 없다 → 만들어만 두고 사진을 안 올린 것은
           보임을 켜 놨어도 자동으로 빠진다. 관리자에는 '사진 필요' 로 보인다. */

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
    /** 포스터 위에 한 번 나오는 큰 제목. 예: "9월 프로모션" */
    headline: string;
}

export const DEFAULT_EVENT_SETTINGS: EventSettings = {
    headline: '이번 달 프로모션',
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
                headline:
                    typeof data.headline === 'string' && data.headline
                        ? data.headline
                        : DEFAULT_EVENT_SETTINGS.headline,
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
    /** 이벤트 이름. 고객 화면에서 포스터 아래 작은 글씨(캡션)로 나온다.
        #ISSUE: 한동안 빈 이름을 막았는데, 포스터 그림에 이미 이름이 박혀 있으면 아래에 또 적을
                까닭이 없다 → 비워 두면 캡션 없이 사진만 나온다. 사진 대체글은 따로 채운다. */
    title: string;
    /** 포스터 사진 주소 (Firebase Storage). 비어 있으면 고객 화면에서 빠진다 */
    imageUrl: string;
    isPublished: boolean;
    /** 메인(첫 화면) "CURRENT EVENT" 칸에도 걸지. 최대 MAIN_MAX 장까지 */
    showOnMain: boolean;
}

/** 메인에 걸 수 있는 최대 장수. 메인은 한 줄(3칸)이라 그 이상은 줄이 넘어가 보기 나쁘다 */
export const MAIN_MAX = 3;

export interface EventItem extends EventInput {
    docId: string;
    /** 이벤트 페이지에서 넘어가는 순서 */
    sort: number;
    /** 메인(첫 화면)에서 나오는 순서. sort 와 따로 둔다 (아래 mainEvents 설명 참고) */
    mainSort: number;
    createdAt: string;
    updatedAt: string;
}

const str = (value: unknown, fallback = '') => (typeof value === 'string' ? value : fallback);

const normalizeEvent = (docId: string, data: Record<string, unknown>): EventItem => {
    const sort = typeof data.sort === 'number' ? data.sort : Number.MAX_SAFE_INTEGER;
    return {
        docId,
        title: str(data.title),
        imageUrl: str(data.imageUrl),
        isPublished: data.isPublished !== false,
        showOnMain: data.showOnMain === true,
        sort,
        /* 메인 순서를 한 번도 안 건드린 문서는 목록 순서를 그대로 쓴다 → 손대기 전까지는
           예전과 똑같은 순서로 나오고, 옛 문서를 고쳐 쓰는 작업(마이그레이션)도 필요 없다 */
        mainSort: typeof data.mainSort === 'number' ? data.mainSort : sort,
        createdAt: str(data.createdAt),
        updatedAt: str(data.updatedAt),
    };
};

/** 메인에 걸 포스터. 체크한 것이 있으면 그것만, 하나도 없으면 앞에서부터 MAIN_MAX 장.
    나오는 순서는 이벤트 페이지 순서(sort)가 아니라 mainSort 를 따른다.
    #ISSUE: 체크가 하나도 없을 때 메인 "CURRENT EVENT" 칸이 통째로 비면 고장난 것처럼 보인다
            → 예전처럼 앞에서부터 채운다. slice 는 데이터에 체크가 4개 이상 들어가도 메인이
              깨지지 않게 막는 마지막 방어선이다.
    #ISSUE: 메인 순서를 sort 로 같이 쓰다 보니, 메인에서 한 장을 앞으로 보내려고 카드를 옮기면
            이벤트 페이지 순서까지 끌려 바뀌었다 → mainSort 로 갈라 놨다. 고르기(어느 3장)는
            sort 순서로, 늘어놓기(그 3장의 순서)는 mainSort 로 한다. */
export function mainEvents(items: EventItem[]): EventItem[] {
    const picked = items.filter((item) => item.showOnMain);
    return (picked.length ? picked : items).slice(0, MAIN_MAX).sort((a, b) => a.mainSort - b.mainSort);
}

/** 관리자 목록에 찍을 상태 */
export function eventStatus(event: Pick<EventItem, 'imageUrl' | 'isPublished'>): '보임' | '숨김' | '사진 필요' {
    if (!event.imageUrl) return '사진 필요';
    return event.isPublished ? '보임' : '숨김';
}

export function subscribeEvents(
    onItems: (items: EventItem[]) => void,
    onError: (error: Error) => void,
    /** true 면 고객 화면용 — 숨김 + 사진 없는 이벤트를 빼고 내려 준다 */
    publishedOnly = false,
): Unsubscribe {
    return onSnapshot(
        eventsCollection,
        (snapshot) => {
            const items = snapshot.docs
                .map((entry) => normalizeEvent(entry.id, entry.data()))
                .filter((item) => !publishedOnly || (item.isPublished && Boolean(item.imageUrl)))
                .sort((a, b) => a.sort - b.sort);
            onItems(items);
        },
        onError,
    );
}

/* 새 칸은 목록 맨 앞에 만든다. [+ 이벤트 칸 추가] 버튼이 목록 위에 있어서, 뒤에 붙이면
   누른 자리에서는 아무 일도 안 일어난 것처럼 보이고 한참 내려가야 새 칸이 나온다.
   새로 만드는 이벤트가 보통 최신 프로모션이라 앞자리가 맞기도 하다. */
export async function createEvent(input: EventInput): Promise<string> {
    const snapshot = await getDocs(eventsCollection);
    const sorts = snapshot.docs.map((entry) => (typeof entry.data().sort === 'number' ? entry.data().sort : 0));
    const sort = sorts.length ? Math.min(...sorts) - 1 : 0;
    const now = new Date().toISOString();
    const created = await addDoc(eventsCollection, { ...input, sort, createdAt: now, updatedAt: now });
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

/** 메인에서 나오는 순서만 저장한다. 이벤트 페이지 순서(sort)는 건드리지 않는다. */
export async function updateEventMainSorts(items: Array<{ docId: string; mainSort: number }>): Promise<void> {
    const batch = writeBatch(db);
    const updatedAt = new Date().toISOString();
    items.forEach(({ docId, mainSort }) => batch.update(doc(db, COLLECTION_NAME, docId), { mainSort, updatedAt }));
    await batch.commit();
}

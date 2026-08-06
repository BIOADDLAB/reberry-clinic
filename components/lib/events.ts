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

const COLLECTION_NAME = 'events';
const eventsCollection = collection(db, COLLECTION_NAME);

export interface EventInput {
    title: string;
    imageUrl: string;
    isPublished: boolean;
}

export interface EventItem extends EventInput {
    docId: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

const normalizeEvent = (docId: string, data: Record<string, unknown>): EventItem => ({
    docId,
    title: typeof data.title === 'string' ? data.title : '',
    imageUrl: typeof data.imageUrl === 'string' ? data.imageUrl : '',
    isPublished: data.isPublished !== false,
    sort: typeof data.sort === 'number' ? data.sort : Number.MAX_SAFE_INTEGER,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
});

export function subscribeEvents(
    onItems: (items: EventItem[]) => void,
    onError: (error: Error) => void,
    publishedOnly = false,
): Unsubscribe {
    return onSnapshot(
        eventsCollection,
        (snapshot) => {
            const items = snapshot.docs
                .map((entry) => normalizeEvent(entry.id, entry.data()))
                .filter((item) => !publishedOnly || item.isPublished)
                .sort((a, b) => a.sort - b.sort);
            onItems(items);
        },
        onError,
    );
}

export async function createEvent(input: EventInput): Promise<void> {
    const snapshot = await getDocs(eventsCollection);
    const latestSort = Math.max(
        -1,
        ...snapshot.docs.map((entry) => (typeof entry.data().sort === 'number' ? entry.data().sort : -1)),
    );
    const now = new Date().toISOString();
    await addDoc(eventsCollection, { ...input, sort: latestSort + 1, createdAt: now, updatedAt: now });
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

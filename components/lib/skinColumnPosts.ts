'use client';

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    limit,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    where,
    writeBatch,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'skinColumnPosts';

export interface SkinColumnPostInput {
    categorySlug: string;
    title: string;
    excerpt: string;
    contentHtml: string;
    youtubeUrl?: string;
    thumbnailUrl?: string;
    publishedAt: string;
    isPublished: boolean;
}

export interface SkinColumnPostItem extends SkinColumnPostInput {
    docId: string;
    sort: number;
    createdAt: string;
    updatedAt: string;
}

const postsCollection = collection(db, COLLECTION_NAME);

const normalizePost = (docId: string, data: Record<string, unknown>): SkinColumnPostItem => ({
    docId,
    categorySlug: typeof data.categorySlug === 'string' ? data.categorySlug : '',
    title: typeof data.title === 'string' ? data.title : '',
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    contentHtml: typeof data.contentHtml === 'string' ? data.contentHtml : '',
    youtubeUrl: typeof data.youtubeUrl === 'string' ? data.youtubeUrl : undefined,
    thumbnailUrl: typeof data.thumbnailUrl === 'string' ? data.thumbnailUrl : undefined,
    publishedAt: typeof data.publishedAt === 'string' ? data.publishedAt : '',
    isPublished: data.isPublished !== false,
    sort: typeof data.sort === 'number' ? data.sort : Number.MAX_SAFE_INTEGER,
    createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
});

export function subscribeSkinColumnPosts(
    onPosts: (posts: SkinColumnPostItem[]) => void,
    onError: (error: Error) => void,
): Unsubscribe {
    const postsQuery = query(postsCollection, orderBy('sort', 'asc'));

    return onSnapshot(
        postsQuery,
        (snapshot) => {
            onPosts(snapshot.docs.map((snapshotDoc) => normalizePost(snapshotDoc.id, snapshotDoc.data())));
        },
        (error) => onError(error),
    );
}

export function subscribePublishedSkinColumnPosts(
    onPosts: (posts: SkinColumnPostItem[]) => void,
    onError: (error: Error) => void,
): Unsubscribe {
    const publishedQuery = query(postsCollection, where('isPublished', '==', true));

    return onSnapshot(
        publishedQuery,
        (snapshot) => {
            const posts = snapshot.docs
                .map((snapshotDoc) => normalizePost(snapshotDoc.id, snapshotDoc.data()))
                .sort((a, b) => a.sort - b.sort);
            onPosts(posts);
        },
        (error) => onError(error),
    );
}

export async function fetchPublishedSkinColumnPost(docId: string): Promise<SkinColumnPostItem | null> {
    const snapshot = await getDoc(doc(db, COLLECTION_NAME, docId));
    if (!snapshot.exists()) return null;

    const post = normalizePost(snapshot.id, snapshot.data());
    return post.isPublished ? post : null;
}

export async function createSkinColumnPost(input: SkinColumnPostInput): Promise<void> {
    const latestQuery = query(postsCollection, orderBy('sort', 'desc'), limit(1));
    const latestSnapshot = await getDocs(latestQuery);
    const latestSort = latestSnapshot.empty ? -1 : Number(latestSnapshot.docs[0].data().sort ?? -1);
    const now = new Date().toISOString();

    await addDoc(postsCollection, {
        ...input,
        youtubeUrl: input.youtubeUrl ?? '',
        thumbnailUrl: input.thumbnailUrl ?? '',
        sort: Number.isFinite(latestSort) ? latestSort + 1 : 0,
        createdAt: now,
        updatedAt: now,
    });
}

export async function updateSkinColumnPost(docId: string, input: SkinColumnPostInput): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, docId), {
        ...input,
        youtubeUrl: input.youtubeUrl ?? '',
        thumbnailUrl: input.thumbnailUrl ?? '',
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteSkinColumnPost(docId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
}

export async function updateSkinColumnPostSorts(items: Array<{ docId: string; sort: number }>): Promise<void> {
    const batch = writeBatch(db);
    const updatedAt = new Date().toISOString();

    items.forEach(({ docId, sort }) => {
        batch.update(doc(db, COLLECTION_NAME, docId), { sort, updatedAt });
    });

    await batch.commit();
}

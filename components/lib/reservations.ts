'use client';

import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    updateDoc,
    type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { PriceCartItem } from './priceList';

const COLLECTION_NAME = 'reservations';

export const RESERVATION_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

export interface ReservationInput {
    treatmentCategory: string;
    treatmentSlug: string;
    treatmentName: string;
    name: string;
    phone: string;
    email: string;
    reservationDate: string;
    reservationTime: string;
    memo: string;
    status: ReservationStatus;
    selectedPriceItems: PriceCartItem[];
    estimatedTotal: number;
}

export interface ReservationItem extends ReservationInput {
    docId: string;
    createdAt: string;
    updatedAt: string;
}

const reservationsCollection = collection(db, COLLECTION_NAME);

const normalizeReservation = (docId: string, data: Record<string, unknown>): ReservationItem => {
    const rawStatus = typeof data.status === 'string' ? data.status : 'pending';
    const status = RESERVATION_STATUSES.includes(rawStatus as ReservationStatus)
        ? (rawStatus as ReservationStatus)
        : 'pending';

    return {
        docId,
        treatmentCategory: typeof data.treatmentCategory === 'string' ? data.treatmentCategory : '',
        treatmentSlug: typeof data.treatmentSlug === 'string' ? data.treatmentSlug : '',
        treatmentName: typeof data.treatmentName === 'string' ? data.treatmentName : '',
        name: typeof data.name === 'string' ? data.name : '',
        phone: typeof data.phone === 'string' ? data.phone : '',
        email: typeof data.email === 'string' ? data.email : '',
        reservationDate: typeof data.reservationDate === 'string' ? data.reservationDate : '',
        reservationTime: typeof data.reservationTime === 'string' ? data.reservationTime : '',
        memo: typeof data.memo === 'string' ? data.memo : '',
        status,
        selectedPriceItems: Array.isArray(data.selectedPriceItems)
            ? data.selectedPriceItems
                  .filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === 'object'))
                  .map((entry) => ({
                      itemId: typeof entry.itemId === 'string' ? entry.itemId : '',
                      optionId: typeof entry.optionId === 'string' ? entry.optionId : '',
                      categoryLabel: typeof entry.categoryLabel === 'string' ? entry.categoryLabel : '',
                      itemName: typeof entry.itemName === 'string' ? entry.itemName : '',
                      optionLabel: typeof entry.optionLabel === 'string' ? entry.optionLabel : '',
                      unitPrice: typeof entry.unitPrice === 'number' ? entry.unitPrice : 0,
                      quantity: typeof entry.quantity === 'number' ? entry.quantity : 1,
                  }))
                  .filter((entry) => entry.itemId && entry.optionId && entry.unitPrice > 0)
            : [],
        estimatedTotal: typeof data.estimatedTotal === 'number' ? data.estimatedTotal : 0,
        createdAt: typeof data.createdAt === 'string' ? data.createdAt : '',
        updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : '',
    };
};

export function subscribeReservations(
    onReservations: (items: ReservationItem[]) => void,
    onError: (error: Error) => void,
): Unsubscribe {
    const reservationsQuery = query(reservationsCollection, orderBy('createdAt', 'desc'));

    return onSnapshot(
        reservationsQuery,
        (snapshot) => {
            onReservations(snapshot.docs.map((snapshotDoc) => normalizeReservation(snapshotDoc.id, snapshotDoc.data())));
        },
        onError,
    );
}

export async function createReservation(input: ReservationInput): Promise<void> {
    const now = new Date().toISOString();
    await addDoc(reservationsCollection, { ...input, createdAt: now, updatedAt: now });
}

export async function updateReservation(docId: string, input: ReservationInput): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, docId), {
        ...input,
        updatedAt: new Date().toISOString(),
    });
}

export async function updateReservationStatus(docId: string, status: ReservationStatus): Promise<void> {
    await updateDoc(doc(db, COLLECTION_NAME, docId), {
        status,
        updatedAt: new Date().toISOString(),
    });
}

export async function deleteReservation(docId: string): Promise<void> {
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
}

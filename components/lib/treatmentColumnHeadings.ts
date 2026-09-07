import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore';
import { db } from './firebase';

const HEADING_DOC = doc(db, 'settings', 'treatmentColumnHeadings');

export type TreatmentColumnHeadings = Record<string, string>;

const normalizeHeadings = (value: unknown): TreatmentColumnHeadings => {
    if (!value || typeof value !== 'object') return {};
    return Object.fromEntries(
        Object.entries(value as Record<string, unknown>)
            .filter((entry): entry is [string, string] => typeof entry[1] === 'string')
            .map(([slug, heading]) => [slug, heading.trim()]),
    );
};

export function subscribeTreatmentColumnHeadings(
    onHeadings: (headings: TreatmentColumnHeadings) => void,
    onError?: (error: Error) => void,
): Unsubscribe {
    return onSnapshot(
        HEADING_DOC,
        (snapshot) => onHeadings(normalizeHeadings(snapshot.data()?.headings)),
        (error) => onError?.(error),
    );
}

export async function saveTreatmentColumnHeading(slug: string, heading: string): Promise<void> {
    await setDoc(HEADING_DOC, { headings: { [slug]: heading.trim() } }, { merge: true });
}

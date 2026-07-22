'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Col } from './columns';

interface ColDoc {
    title: string;
    en: string;
    text: string;
    link?: string;
    slugs: string[];
    order?: number;
}

export function useColumnsBySlug(slug: string, staticFallback: Col[]): Col[] {
    const [items, setItems] = useState<Col[]>(staticFallback);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const q = query(collection(db, 'columns'), where('slugs', 'array-contains', slug), orderBy('order'));
                const snap = await getDocs(q);
                if (cancelled || snap.empty) return; // Firestore 에 이 slug 로 등록된 게 없으면 정적 데이터 유지

                const fromFirestore: Col[] = snap.docs.map((docSnap) => {
                    const data = docSnap.data() as ColDoc;
                    return { title: data.title, en: data.en, text: data.text, link: data.link, slugs: data.slugs };
                });

                setItems(fromFirestore);
            } catch (err) {
                console.error('[useColumnsBySlug] Firestore 조회 실패, 정적 데이터로 폴백:', err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    return items;
}

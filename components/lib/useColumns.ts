'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import type { Col, FirestoreCol } from './columns';

interface ColDoc {
    title: string;
    en: string;
    text: string;
    link?: string;
    slugs: string[];
    order?: number;
    translations?: FirestoreCol['translations'];
}

// #ISSUE: 칼럼도 전후사진과 마찬가지로 관리자에서 등록한 것만 노출하기로 함.
//         두 번째 인자(staticFallback)는 더 이상 화면에 쓰지 않지만,
//         기존 호출부를 그대로 두려고 인자는 남겨둠(무시됨).
export function useColumnsBySlug(slug: string, staticFallback: Col[]): FirestoreCol[] {
    void staticFallback; // 의도적으로 사용하지 않음 (관리자 데이터만 노출)
    const [items, setItems] = useState<FirestoreCol[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const q = query(collection(db, 'columns'), where('slugs', 'array-contains', slug), orderBy('order'));
                const snap = await getDocs(q);
                if (cancelled) return;

                const fromFirestore: FirestoreCol[] = snap.docs.map((docSnap) => {
                    const data = docSnap.data() as ColDoc;
                    return {
                        docId: docSnap.id,
                        title: data.title,
                        en: data.en,
                        text: data.text,
                        link: data.link,
                        slugs: data.slugs,
                        translations: data.translations,
                    };
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

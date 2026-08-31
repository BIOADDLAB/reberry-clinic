'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { Col, FirestoreCol } from './columns';

interface ColDoc {
    title: string;
    en: string;
    text: string;
    link?: string;
    slug?: string;
    slugs?: string[];
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
                // 전체를 한 번 읽어 클라이언트에서 대상·순서를 정리한다.
                // 1) array-contains + orderBy 복합 인덱스가 없어도 조회가 실패하지 않고,
                // 2) 예전 단일 slug 문서도 관리자가 수정하기 전까지 계속 노출된다.
                const snap = await getDocs(collection(db, 'columns'));
                if (cancelled) return;

                const fromFirestore: FirestoreCol[] = snap.docs
                    .map((docSnap) => {
                        const data = docSnap.data() as ColDoc;
                        const slugs = Array.isArray(data.slugs)
                            ? data.slugs.filter((target): target is string => typeof target === 'string' && target.length > 0)
                            : typeof data.slug === 'string' && data.slug
                              ? [data.slug]
                              : [];
                        return {
                            item: {
                                docId: docSnap.id,
                                title: typeof data.title === 'string' ? data.title : '',
                                en: typeof data.en === 'string' ? data.en : '',
                                text: typeof data.text === 'string' ? data.text : '',
                                link: typeof data.link === 'string' ? data.link : undefined,
                                slugs: [...new Set(slugs)],
                                translations: data.translations,
                            } satisfies FirestoreCol,
                            order: typeof data.order === 'number' ? data.order : Number.MAX_SAFE_INTEGER,
                        };
                    })
                    .filter((entry) => entry.item.slugs.includes(slug))
                    .sort((a, b) => a.order - b.order)
                    .map((entry) => entry.item);

                setItems(fromFirestore);
            } catch (err) {
                console.error('[useColumnsBySlug] Firestore 조회 실패:', err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    return items;
}

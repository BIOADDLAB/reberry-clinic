'use client';

// 파일 전체를 클라이언트 전용으로 만들면 안 되기 때문에, Firestore 훅만 별도 파일로 뺌.
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import type { BAPhoto } from './ba';

// Firestore 문서 원본 모양 — 관리자 화면(app/admin/(protected)/ba/page.tsx)이 저장하는 필드와 반드시 일치해야 함
interface BAPhotoDoc {
    label: string; // 시술명
    slug: string; // 어느 시그니처 페이지인지 pigment/lifting/booster/acne/redness
    before: string;
    after: string;
    order?: number; // 해당 시그니처 페이지 안에서의 순서 (관리자에서 지정)
    main?: number;
}

// #ISSUE: 예전에는 정적 데이터(public/images/ba)를 먼저 보여주고 Firestore 가 오면 교체했지만,
// 이제 전후사진은 100% 관리자에서 등록한 것만 쓰기로 해서 정적 폴백을 없앰.
// → 관리자에 등록된 게 없으면 화면에 아무것도 안 나오는 게 정상 동작임.
export function useBAPhotos(): BAPhoto[] {
    const [photos, setPhotos] = useState<BAPhoto[]>([]);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const snap = await getDocs(collection(db, 'baPhotos'));
                if (cancelled) return;

                const fromFirestore: BAPhoto[] = snap.docs.map((docSnap) => {
                    const data = docSnap.data() as BAPhotoDoc;
                    return {
                        id: docSnap.id,
                        slug: data.slug,
                        label: data.label,
                        before: data.before,
                        after: data.after,
                        ...(typeof data.main === 'number' ? { main: data.main } : {}),
                        ...(typeof data.order === 'number' ? { order: data.order } : {}),
                    };
                });

                setPhotos(fromFirestore);
            } catch (err) {
                console.error('[useBAPhotos] Firestore 조회 실패, 정적 데이터로 폴백:', err);
            }
        })();

        return () => {
            cancelled = true;
        };
    }, []);

    return photos;
}

export const filterMainBAPhotos = (photos: BAPhoto[]) =>
    photos.filter((b): b is BAPhoto & { main: number } => typeof b.main === 'number').sort((a, b) => a.main - b.main);

export const filterBAPhotosBySlug = (photos: BAPhoto[], slug: string) =>
    photos.filter((b) => b.slug === slug).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

'use client';

// 파일 전체를 클라이언트 전용으로 만들면 안 되기 때문에, Firestore 훅만 별도 파일로 뺌.
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { baPhotos, type BAPhoto } from './ba';

// Firestore 문서 원본 모양 — 관리자 화면(app/admin/(protected)/ba/page.tsx)이 저장하는 필드와 반드시 일치해야 함
interface BAPhotoDoc {
    label: string; // 시술명
    slug: string; // 어느 시그니처 페이지인지 pigment/lifting/booster/acne/redness
    before: string;
    after: string;
    main?: number;
}

export function useBAPhotos(): BAPhoto[] {
    const [photos, setPhotos] = useState<BAPhoto[]>(baPhotos);

    useEffect(() => {
        let cancelled = false;

        (async () => {
            try {
                const snap = await getDocs(collection(db, 'baPhotos'));
                if (cancelled || snap.empty) return;

                const fromFirestore: BAPhoto[] = snap.docs.map((docSnap) => {
                    const data = docSnap.data() as BAPhotoDoc;
                    return {
                        id: docSnap.id,
                        slug: data.slug,
                        label: data.label,
                        before: data.before,
                        after: data.after,
                        ...(typeof data.main === 'number' ? { main: data.main } : {}),
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

export const filterBAPhotosBySlug = (photos: BAPhoto[], slug: string) => photos.filter((b) => b.slug === slug);

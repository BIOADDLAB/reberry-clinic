'use client';

// 파일 전체를 클라이언트 전용으로 만들면 안 되기 때문에, Firestore 훅만 별도 파일로 뺌.
import { useSyncExternalStore } from 'react';
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

/* #ISSUE: 전에는 컴포넌트마다 useEffect 로 각자 조회해서, 한 페이지에
   BASlider 와 BACardSlider 가 같이 있으면 같은 컬렉션을 두세 번 읽었다.
   → 모듈 스코프 캐시 하나로 모으고 useSyncExternalStore 로 구독한다.
     (useLang.ts 와 같은 방식. 새 패턴을 들이지 않으려고 맞춤)
   조회는 첫 구독이 생길 때 딱 한 번만 실행된다. */

const EMPTY: BAPhoto[] = []; // 서버 스냅샷용 고정 참조 (매번 새 배열을 주면 무한 렌더)

let cache: BAPhoto[] = EMPTY;
let isLoading = true;
let started = false;

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function load() {
    if (started) return;
    started = true;

    getDocs(collection(db, 'baPhotos'))
        .then((snap) => {
            cache = snap.docs.map((docSnap) => {
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
        })
        .catch((err) => {
            console.error('[useBAPhotos] Firestore 조회 실패:', err);
        })
        .finally(() => {
            isLoading = false;
            emit();
        });
}

function subscribe(onChange: () => void) {
    listeners.add(onChange);
    load();
    return () => {
        listeners.delete(onChange);
    };
}

// #ISSUE: 전후사진은 100% 관리자에서 등록한 것만 씀 (정적 폴백 없음).
// 반환 타입은 예전 그대로 BAPhoto[] — 기존 호출부를 건드리지 않는다.
export function useBAPhotos(): BAPhoto[] {
    return useSyncExternalStore(
        subscribe,
        () => cache,
        () => EMPTY,
    );
}

/* 로딩 여부. useBAPhotos 와 같은 캐시를 보므로 조회가 늘지 않는다.
   "아직 안 왔다"(스켈레톤)와 "받았는데 0건이다"(영역 숨김)를 구분하려고 필요하다. */
export function useBAPhotosLoading(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => isLoading,
        () => true,
    );
}

export const filterMainBAPhotos = (photos: BAPhoto[]) =>
    photos.filter((b): b is BAPhoto & { main: number } => typeof b.main === 'number').sort((a, b) => a.main - b.main);

export const filterBAPhotosBySlug = (photos: BAPhoto[], slug: string) =>
    photos.filter((b) => b.slug === slug).sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

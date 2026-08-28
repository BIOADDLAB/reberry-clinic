'use client';

// 파일 전체를 클라이언트 전용으로 만들면 안 되기 때문에, Firestore 훅만 별도 파일로 뺌.
import { useSyncExternalStore } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { resolveBASlugs, showsOnReviews, showsOnTreatment, type BAPhoto } from './ba';

// Firestore 문서 원본 모양 — 관리자 화면(app/admin/(protected)/ba/page.tsx)이 저장하는 필드와 반드시 일치해야 함
interface BAPhotoDoc {
    label: string; // 시술명
    slug?: string; // 기존 단일 페이지 데이터 및 대표 페이지
    slugs?: string[]; // 노출할 시술 페이지들
    before: string;
    after: string;
    order?: number; // 해당 시그니처 페이지 안에서의 순서 (관리자에서 지정)
    main?: number;
    category?: string; // 전후사진 페이지 카테고리 탭 (없으면 slug 로 자동 배정)
    place?: string; // 노출 위치 treatment/reviews/both (없으면 both = 기존처럼 양쪽)
    treatmentDate?: string; // 시술일 YYYY-MM-DD
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
                const slugs = Array.isArray(data.slugs)
                    ? data.slugs.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
                    : [];
                const slug = typeof data.slug === 'string' ? data.slug : (slugs[0] ?? '');
                return {
                    id: docSnap.id,
                    slug,
                    ...(slugs.length > 0 ? { slugs: [...new Set(slugs)] } : {}),
                    label: data.label,
                    before: data.before,
                    after: data.after,
                    ...(typeof data.main === 'number' ? { main: data.main } : {}),
                    ...(typeof data.order === 'number' ? { order: data.order } : {}),
                    ...(typeof data.category === 'string' ? { category: data.category } : {}),
                    ...(typeof data.place === 'string' ? { place: data.place } : {}),
                    ...(typeof data.treatmentDate === 'string' ? { treatmentDate: data.treatmentDate } : {}),
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

/* 시술 페이지(BACardSlider)용. 시술 페이지 노출을 끈 사진은 여기서 빠진다. */
export const filterBAPhotosBySlug = (photos: BAPhoto[], slug: string) =>
    photos
        .filter((b) => resolveBASlugs(b).includes(slug) && showsOnTreatment(b))
        .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

/* 전후사진 페이지(/reviews)용. 전후사진 페이지 노출을 끈 사진은 여기서 빠진다. */
export const filterReviewBAPhotos = (photos: BAPhoto[]) => photos.filter(showsOnReviews);

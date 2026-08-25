// #COMPONENTS: 전후 사진 공용 데이터 — 메인 / 시그니처 / 시술결과가 같은 배열에서 꺼내 씀
// 카드 UI 는 곳마다 다르니 컴포넌트는 각자, 데이터만 여기서 공유
export interface BAPhoto {
    id: string;
    slug: string;
    label: string;
    before: string;
    after: string;
    order?: number; // 시그니처 페이지 안에서의 노출 순서 (관리자에서 지정, 없으면 등록순)
    main?: number; // 메인페이지(BASlider) 노출 순서. 1,2,3... 숫자 있으면 노출 + 그 순서로 정렬, 없으면(undefined) 메인에 미노출
    category?: string; // 전후사진 페이지(/reviews) 카테고리 탭. 비어 있으면 slug 로 자동 배정 (BA_CATEGORY_BY_SLUG)
    place?: string; // 어디에 노출할지. 'treatment' | 'reviews' | 'both'. 값이 없는 기존 사진은 'both' 로 읽는다
}

/* ─────────────────────────────────────────────────────────────
   노출 위치 — 시술 페이지용 사진과 전후사진 페이지용 사진을 분리한다.
   #ISSUE: 예전에는 등록한 사진이 무조건 양쪽에 다 떴다.
           이제 관리자에서 한쪽만 고를 수 있고, place 값이 없는 기존 사진은
           'both' 로 읽어서 지금까지와 똑같이 양쪽에 계속 나온다(마이그레이션 불필요).
   ───────────────────────────────────────────────────────────── */
export const BA_PLACES = [
    { key: 'treatment', label: '시술 페이지만' },
    { key: 'reviews', label: '전후사진 페이지만' },
    { key: 'both', label: '양쪽 다' },
] as const;

export type BAPlaceKey = (typeof BA_PLACES)[number]['key'];

/** 저장된 place 값을 정규화. 값이 없거나 모르는 값이면 'both' */
export const resolveBAPlace = (photo: Pick<BAPhoto, 'place'>): BAPlaceKey =>
    photo.place === 'treatment' || photo.place === 'reviews' ? photo.place : 'both';

/** 시술 페이지(BACardSlider)에 노출되는가 */
export const showsOnTreatment = (photo: Pick<BAPhoto, 'place'>) => resolveBAPlace(photo) !== 'reviews';

/** 전후사진 페이지(/reviews)에 노출되는가 */
export const showsOnReviews = (photo: Pick<BAPhoto, 'place'>) => resolveBAPlace(photo) !== 'treatment';

export const baPlaceLabel = (place?: string) =>
    BA_PLACES.find((p) => p.key === resolveBAPlace({ place }))!.label;

/* ─────────────────────────────────────────────────────────────
   전후사진 페이지(/reviews) 카테고리 탭
   #ISSUE: slug 는 "어느 시그니처 페이지에 뜰지"를 정하는 값이라 축이 다르다.
           탭 분류는 category 필드로 따로 관리한다(관리자에서 선택).
   탭을 늘리거나 이름을 바꾸려면 아래 배열만 고치면 화면·관리자 양쪽에 반영된다.
   ───────────────────────────────────────────────────────────── */
export const BA_CATEGORIES = [
    { key: 'pigment', label: '색소' },
    { key: 'acne', label: '여드름' },
    { key: 'redness', label: '홍조' },
    { key: 'pore-scar', label: '모공/흉터' },
    { key: 'wrinkle', label: '주름' },
    { key: 'lifting', label: '리프팅/탄력' },
    { key: 'petit', label: '쁘띠성형' },
    { key: 'hair-removal', label: '제모' },
] as const;

export type BACategoryKey = (typeof BA_CATEGORIES)[number]['key'];

/** 카테고리 값이 없는 기존 사진을 기존 slug 로 자동 배정한다 (데이터 마이그레이션 없이 바로 분류됨) */
const BA_CATEGORY_BY_SLUG: Record<string, BACategoryKey> = {
    pigment: 'pigment',
    acne: 'acne',
    redness: 'redness',
    lifting: 'lifting',
    booster: 'petit',
};

/** 이 사진이 속한 카테고리 키. 지정값 → slug 자동배정 → null(어느 탭에도 안 걸림) */
export function resolveBACategory(photo: Pick<BAPhoto, 'slug' | 'category'>): BACategoryKey | null {
    const picked = BA_CATEGORIES.find((c) => c.key === photo.category);
    return picked ? picked.key : (BA_CATEGORY_BY_SLUG[photo.slug] ?? null);
}

export const baCategoryLabel = (key: string) => BA_CATEGORIES.find((c) => c.key === key)?.label ?? key;

/*
저장 위치: /public/images/ba/
파일명 규칙: {code}-{순번}-{b|a}.jpg

code 매핑 & 파일명 예시
- pigment (색소)      → pig-1-b.jpg   ~ pig-{count}-a.jpg
- volume-lifting      → vlift-1-b.jpg ~ vlift-{count}-a.jpg
- volume-booster      → vboost-1-b.jpg ~ vboost-{count}-a.jpg
- acne (여드름)        → acne-1-b.jpg  ~ acne-{count}-a.jpg
- redness (홍조)       → red-1-b.jpg   ~ red-{count}-a.jpg

카테고리별 장수는 CATEGORIES 배열의 count 값만 수정하면 됨. 10장 넘는 곳은
count를 그 개수로 바꾸고, 실제 파일도 그 개수만큼 넣으면 끝.
*/

const code: Record<string, string> = {
    lifting: 'vlift',
    booster: 'vboost',
    pigment: 'pig',
    acne: 'acne',
    redness: 'red',
};

const ba = (slug: string, n: number, type: 'b' | 'a') => `/images/ba/${code[slug]}-${n}-${type}.jpg`;

const CATEGORIES: { slug: string; label: string; count: number; mainOrder: number }[] = [
    { slug: 'pigment', label: '색소치료', count: 10, mainOrder: 1 },
    { slug: 'lifting', label: '볼륨리프팅', count: 9, mainOrder: 2 },
    { slug: 'booster', label: '볼륨부스터', count: 14, mainOrder: 3 },
    { slug: 'acne', label: '여드름치료', count: 8, mainOrder: 4 },
    { slug: 'redness', label: '홍조치료', count: 3, mainOrder: 5 },
];

const genCategory = ({ slug, label, count, mainOrder }: (typeof CATEGORIES)[number]): BAPhoto[] =>
    Array.from({ length: count }, (_, i) => {
        const n = i + 1;
        return {
            id: `${slug}-${n}`,
            slug,
            label,
            before: ba(slug, n, 'b'),
            after: ba(slug, n, 'a'),
            ...(n === 1 ? { main: mainOrder } : {}),
        };
    });

export const baPhotos: BAPhoto[] = CATEGORIES.flatMap(genCategory);

export const getBAPhotosBySlug = (slug: string) => baPhotos.filter((b) => b.slug === slug);

export const getMainBAPhotos = () =>
    baPhotos.filter((b): b is BAPhoto & { main: number } => typeof b.main === 'number').sort((a, b) => a.main - b.main);

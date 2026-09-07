// #COMPONENTS: 전후 사진 공용 데이터 — 메인 / 시그니처 / 시술결과가 같은 배열에서 꺼내 씀
// 카드 UI 는 곳마다 다르니 컴포넌트는 각자, 데이터만 여기서 공유
export interface BAPhoto {
    id: string;
    slug: string; // 기존 단일 페이지 데이터 및 대표 페이지(하위 호환)
    slugs?: string[]; // 실제 노출할 시술 페이지들. 없으면 기존 slug 한 개로 읽는다
    label: string;
    before: string;
    after: string;
    order?: number; // 시그니처 페이지 안에서의 노출 순서 (관리자에서 지정, 없으면 등록순)
    main?: number; // 메인페이지(BASlider) 노출 순서. 1,2,3... 숫자 있으면 노출 + 그 순서로 정렬, 없으면(undefined) 메인에 미노출
    category?: string; // 전후사진 페이지(/reviews) 카테고리 탭. 비어 있으면 slug 로 자동 배정 (BA_CATEGORY_BY_SLUG)
    place?: string; // 어디에 노출할지. 'treatment' | 'reviews' | 'both'. 값이 없는 기존 사진은 'both' 로 읽는다
    treatmentDate?: string; // 시술일. 관리자 date input에서 저장하는 YYYY-MM-DD 형식
}

/** 시술일을 시간대 변환 없이 YYYY.MM.DD 형식으로 표시한다. */
export function formatTreatmentDate(value?: string): string {
    const matched = value?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    return matched ? `${matched[1]}.${matched[2]}.${matched[3]}` : '';
}

/** 전후 한 장. 새 데이터는 before=after, 예전 데이터는 before를 쓴다. */
export function baPhotoUrl(photo: Pick<BAPhoto, 'before' | 'after'>): string {
    return photo.before || photo.after;
}

/** 전·후가 한 장의 합성 컷인지. after가 비었거나 before와 같으면 한 장으로 보여 준다. */
export function isCombinedBAPhoto(photo: Pick<BAPhoto, 'before' | 'after'>): boolean {
    return Boolean(photo.before) && (!photo.after || photo.after === photo.before);
}

/** 관리자에서 올려 둔 준비중(test.png) 자리표시 사진 */
export function isPlaceholderBAPhoto(photo: Pick<BAPhoto, 'before' | 'after'>): boolean {
    const isTest = (url: string) => /-test\.png(?:$|\?)/i.test(url);
    return isTest(photo.before) || isTest(photo.after);
}

const combinedLiftingPhoto = (
    id: string,
    slug: string,
    label: string,
    file: string,
    order: number,
): BAPhoto => {
    const src = `/images/ba/${file}`;
    return {
        id,
        slug,
        slugs: [slug],
        label,
        before: src,
        after: src,
        order,
        place: 'treatment',
        category: 'lifting',
    };
};

/* 관리자에 아직 등록되지 않은 안티에이징 리프팅 전후 합성 컷.
   Firestore에 같은 시술 페이지 사진이 있으면 useBAPhotos에서 이쪽은 쓰지 않는다. */
export const agingLiftingBAPhotos: BAPhoto[] = [
    combinedLiftingPhoto('aging-onda-01', 'aging-onda', '온다 리프팅', 'onda-01.jpg', 1),
    combinedLiftingPhoto('aging-onda-02', 'aging-onda', '온다 리프팅', 'onda-02.jpg', 2),
    combinedLiftingPhoto('aging-onda-03', 'aging-onda', '온다 리프팅', 'onda-03.jpg', 3),
    combinedLiftingPhoto('aging-onda-04', 'aging-onda', '온다 리프팅', 'onda-04.jpg', 4),
    combinedLiftingPhoto('aging-onda-05', 'aging-onda', '온다 리프팅', 'onda-05.jpg', 5),
    combinedLiftingPhoto('aging-ulthera-01', 'aging-ulthera', '울쎄라 리프팅', 'ulthera-01.jpg', 1),
    combinedLiftingPhoto('aging-ulthera-02', 'aging-ulthera', '울쎄라 리프팅', 'ulthera-02.jpg', 2),
    combinedLiftingPhoto('aging-ulthera-03', 'aging-ulthera', '울쎄라 리프팅', 'ulthera-03.jpg', 3),
];

/* ─────────────────────────────────────────────────────────────
   노출 위치 — 시술 페이지용 사진과 전후사진 페이지용 사진을 분리한다.
   #ISSUE: 예전에는 등록한 사진이 무조건 양쪽에 다 떴다.
           이제 관리자에서 한쪽만 고를 수 있고, place 값이 없는 기존 사진은
           'both' 로 읽어서 지금까지와 똑같이 양쪽에 계속 나온다(마이그레이션 불필요).
   ───────────────────────────────────────────────────────────── */
export const BA_PLACES = [
    { key: 'treatment', label: '시술 페이지' },
    { key: 'reviews', label: '전후사진 페이지' },
    { key: 'both', label: '시술 페이지 + 전후사진 페이지' },
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

/** 새 다중 선택 데이터와 기존 단일 slug 데이터를 같은 방식으로 읽는다. */
export function resolveBASlugs(photo: Pick<BAPhoto, 'slug' | 'slugs'>): string[] {
    const selected = Array.isArray(photo.slugs)
        ? photo.slugs.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
        : [];
    return selected.length > 0 ? [...new Set(selected)] : photo.slug ? [photo.slug] : [];
}

const RENAMED_SIGNATURE_BA_LABELS: Record<string, { label: string; legacy: string[] }> = {
    booster: { label: '리베리 볼륨 부스터', legacy: ['부스터', '볼륨부스터', '볼륨 부스터'] },
    acne: { label: '비수술 앞턱전진 필러', legacy: ['여드름', '여드름치료', '여드름 치료'] },
    redness: { label: '비수술 눈밑 지방 재배치', legacy: ['홍조', '홍조치료', '홍조 치료'] },
};

/** 기존 시그니처 사진은 DB를 다시 올리지 않아도 예전 라벨만 새 명칭으로 표시한다. */
export function resolveBALabel(photo: Pick<BAPhoto, 'slug' | 'slugs' | 'label'>): string {
    const current = photo.label.trim();
    for (const slug of resolveBASlugs(photo)) {
        const renamed = RENAMED_SIGNATURE_BA_LABELS[slug];
        if (renamed?.legacy.includes(current)) return renamed.label;
    }
    return current;
}

/* ─────────────────────────────────────────────────────────────
   전후사진 페이지(/reviews) 카테고리 탭
   #ISSUE: slug 는 "어느 시그니처 페이지에 뜰지"를 정하는 값이라 축이 다르다.
           탭 분류는 category 필드로 따로 관리한다(관리자에서 선택).
   탭을 늘리거나 이름을 바꾸려면 아래 배열만 고치면 화면·관리자 양쪽에 반영된다.
   ───────────────────────────────────────────────────────────── */
export const BA_CATEGORIES = [
    { key: 'pigment', label: '색소' },
    { key: 'acne', label: '여드름' },
    { key: 'redness', label: '홍조/주사피부염' },
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
    // 시그니처의 acne/redness route key는 새 시술로 재사용한다.
    acne: 'petit',
    redness: 'petit',
    lifting: 'lifting',
    booster: 'petit',
    'skin-pigment': 'pigment',
    'skin-acne': 'acne',
    'skin-redness': 'redness',
    'skin-skinbooster': 'petit',
    'skin-tattoo-removal': 'pigment',
    'skin-scar-pore': 'pore-scar',
    'skin-hair-removal': 'hair-removal',
    'skin-care': 'redness',
    'aging-ulthera': 'lifting',
    'aging-onda': 'lifting',
    'aging-vro': 'lifting',
    'aging-revinas': 'lifting',
    'aging-shrink': 'lifting',
};

/** 이 사진이 속한 카테고리 키. 지정값 → slug 자동배정 → null(어느 탭에도 안 걸림) */
export function resolveBACategory(photo: Pick<BAPhoto, 'slug' | 'slugs' | 'category'>): BACategoryKey | null {
    const picked = BA_CATEGORIES.find((c) => c.key === photo.category);
    if (picked) return picked.key;
    const matchingSlug = resolveBASlugs(photo).find((slug) => BA_CATEGORY_BY_SLUG[slug]);
    return matchingSlug ? BA_CATEGORY_BY_SLUG[matchingSlug] : null;
}

export const baCategoryLabel = (key: string) => BA_CATEGORIES.find((c) => c.key === key)?.label ?? key;

/*
저장 위치: /public/images/ba/
파일명 규칙: {code}-{순번}-{b|a}.jpg

code 매핑은 기존 파일명을 유지한다. 화면 라벨과 페이지 의미는 위
RENAMED_SIGNATURE_BA_LABELS에서 새 시그니처 명칭으로 변환한다.

카테고리별 장수는 CATEGORIES 배열의 count 값만 수정하면 됨. 10장 넘는 곳은
count를 그 개수로 바꾸고, 실제 파일도 그 개수만큼 넣으면 끝.
*/

const code: Record<string, string> = {
    booster: 'vboost',
    acne: 'acne',
    redness: 'red',
};

const ba = (slug: string, n: number, type: 'b' | 'a') => `/images/ba/${code[slug]}-${n}-${type}.jpg`;

const CATEGORIES: { slug: string; label: string; count: number; mainOrder: number }[] = [
    { slug: 'booster', label: '리베리 볼륨 부스터', count: 14, mainOrder: 1 },
    { slug: 'acne', label: '비수술 앞턱전진 필러', count: 8, mainOrder: 2 },
    { slug: 'redness', label: '비수술 눈밑 지방 재배치', count: 3, mainOrder: 3 },
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

export const getBAPhotosBySlug = (slug: string) => baPhotos.filter((b) => resolveBASlugs(b).includes(slug));

export const getMainBAPhotos = () =>
    baPhotos.filter((b): b is BAPhoto & { main: number } => typeof b.main === 'number').sort((a, b) => a.main - b.main);

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
}

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

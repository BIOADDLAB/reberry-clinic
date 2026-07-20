// #COMPONENTS: 전후 사진 공용 데이터 — 메인 / 시그니처 / 시술결과가 같은 배열에서 꺼내 씀
// 카드 UI 는 곳마다 다르니 컴포넌트는 각자, 데이터만 여기서 공유
export interface BAPhoto {
    id: string;
    slug: string;
    label: string;
    before: string;
    after: string;
    main?: number; // 메인페이지(BASlider) 노출 순서. 1,2,3... 숫자 있으면 노출 + 그 순서로 정렬, 없으면(undefined) 메인에 미노출
}

/* 
파일명: {code}-{순번}-{b|a}.jpg → 예: pig-1-b.jpg, laser-2-a.jpg, box-1-b.jpg

이미지 저장 규칙
색소 - pig
리프팅 - lift
홍조 - red
여드름 - acne
필러 - fill
스킨부스터 - boost
문신제거 - tat
제모 - hair
레이저(리프팅) - laser
보톡스 - box

#ISSUE: 실사진 확보된 건 pig-1 / lift-1 / red-1 / acne-1 이 4장뿐임.
그 외 slug(filler, booster, tattoo-removal, hair-removal, laser-lifting, botox)는
사진이 아예 없어서 위 4장 중 하나를 빌려쓰는 중이고, pig-1/lift-1/red-1/acne-1
안에서도 슬롯 개수를 늘리려고 같은 사진 1장을 여러 번 재사용 중임 (엑박 방지 목적).
아래 각 항목마다 #ISSUE 주석으로 "지금 뭘 빌려쓰는지 + 실사진 들어오면 뭘로
바꿔야 하는지" 표시해뒀음. id / slug / label / main 값은 이미 최종 형태로
맞춰놨으니 그대로 두고, ba() 호출부의 slug/n 값만 실제 파일명에 맞게 교체하면 됨.
전체 대체 작업 끝나면 이 최상단 #ISSUE 블록도 지울 것.
*/

// 파일명에만 쓰이는 짧은 코드 — treatments.ts의 slug와는 별개
const code: Record<string, string> = {
    pigment: 'pig',
    lifting: 'lift',
    redness: 'red',
    acne: 'acne',
    filler: 'fill',
    booster: 'boost',
    'tattoo-removal': 'tat',
    'hair-removal': 'hair',
    'laser-lifting': 'laser',
    botox: 'box',
};

const ba = (slug: string, n: number, type: 'b' | 'a') => `/images/${code[slug]}-${n}-${type}.jpg`;

export const baPhotos: BAPhoto[] = [
    /* ─────────── 색소 (pigment) — 6장, 메인 노출 1순위 ─────────── */
    {
        id: 'pigment-1',
        slug: 'pigment',
        label: '색소치료',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
        main: 1,
    },
    // #ISSUE: pig-2 실사진 미확보 → pig-1 임시 대체. 사진 들어오면 ba('pigment', 2, ...)로 원복
    {
        id: 'pigment-2',
        slug: 'pigment',
        label: '색소치료',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
    },
    // #ISSUE: pig-3 실사진 미확보 → pig-1 임시 대체. 사진 들어오면 ba('pigment', 3, ...)로 원복
    {
        id: 'pigment-3',
        slug: 'pigment',
        label: '색소치료',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
    },
    // #ISSUE: pig-4 실사진 미확보 → pig-1 임시 대체. 사진 들어오면 ba('pigment', 4, ...)로 원복
    {
        id: 'pigment-4',
        slug: 'pigment',
        label: '색소치료',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
    },
    // #ISSUE: pig-5 실사진 미확보 → pig-1 임시 대체. 사진 들어오면 ba('pigment', 5, ...)로 원복
    {
        id: 'pigment-5',
        slug: 'pigment',
        label: '색소치료',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
    },
    // #ISSUE: pig-6 실사진 미확보 → pig-1 임시 대체. 사진 들어오면 ba('pigment', 6, ...)로 원복
    {
        id: 'pigment-6',
        slug: 'pigment',
        label: '색소치료',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
    },

    /* ─────────── 리프팅 (lifting) — 5장, 메인 노출 2순위 ─────────── */
    {
        id: 'lifting-1',
        slug: 'lifting',
        label: '리프팅',
        before: ba('lifting', 1, 'b'),
        after: ba('lifting', 1, 'a'),
        main: 2,
    },
    // #ISSUE: lift-2 실사진 미확보 → lift-1 임시 대체. 사진 들어오면 ba('lifting', 2, ...)로 원복
    { id: 'lifting-2', slug: 'lifting', label: '리프팅', before: ba('lifting', 1, 'b'), after: ba('lifting', 1, 'a') },
    // #ISSUE: lift-3 실사진 미확보 → lift-1 임시 대체. 사진 들어오면 ba('lifting', 3, ...)로 원복
    { id: 'lifting-3', slug: 'lifting', label: '리프팅', before: ba('lifting', 1, 'b'), after: ba('lifting', 1, 'a') },
    // #ISSUE: lift-4 실사진 미확보 → lift-1 임시 대체. 사진 들어오면 ba('lifting', 4, ...)로 원복
    { id: 'lifting-4', slug: 'lifting', label: '리프팅', before: ba('lifting', 1, 'b'), after: ba('lifting', 1, 'a') },
    // #ISSUE: lift-5 실사진 미확보 → lift-1 임시 대체. 사진 들어오면 ba('lifting', 5, ...)로 원복
    { id: 'lifting-5', slug: 'lifting', label: '리프팅', before: ba('lifting', 1, 'b'), after: ba('lifting', 1, 'a') },

    /* ─────────── 홍조 (redness) — 3장, 메인 노출 3순위 ─────────── */
    {
        id: 'redness-1',
        slug: 'redness',
        label: '홍조치료',
        before: ba('redness', 1, 'b'),
        after: ba('redness', 1, 'a'),
        main: 3,
    },
    // #ISSUE: red-2 실사진 미확보 → red-1 임시 대체. 사진 들어오면 ba('redness', 2, ...)로 원복
    {
        id: 'redness-2',
        slug: 'redness',
        label: '홍조치료',
        before: ba('redness', 1, 'b'),
        after: ba('redness', 1, 'a'),
    },
    // #ISSUE: red-3 실사진 미확보 → red-1 임시 대체. 사진 들어오면 ba('redness', 3, ...)로 원복
    {
        id: 'redness-3',
        slug: 'redness',
        label: '홍조치료',
        before: ba('redness', 1, 'b'),
        after: ba('redness', 1, 'a'),
    },

    /* ─────────── 여드름 (acne) — 4장, 메인 노출 4순위 ─────────── */
    {
        id: 'acne-1',
        slug: 'acne',
        label: '여드름치료',
        before: ba('acne', 1, 'b'),
        after: ba('acne', 1, 'a'),
        main: 4,
    },
    // #ISSUE: acne-2 실사진 미확보 → acne-1 임시 대체. 사진 들어오면 ba('acne', 2, ...)로 원복
    { id: 'acne-2', slug: 'acne', label: '여드름치료', before: ba('acne', 1, 'b'), after: ba('acne', 1, 'a') },
    // #ISSUE: acne-3 실사진 미확보 → acne-1 임시 대체. 사진 들어오면 ba('acne', 3, ...)로 원복
    { id: 'acne-3', slug: 'acne', label: '여드름치료', before: ba('acne', 1, 'b'), after: ba('acne', 1, 'a') },
    // #ISSUE: acne-4 실사진 미확보 → acne-1 임시 대체. 사진 들어오면 ba('acne', 4, ...)로 원복
    { id: 'acne-4', slug: 'acne', label: '여드름치료', before: ba('acne', 1, 'b'), after: ba('acne', 1, 'a') },

    /* ─────────── 필러 (filler) — 2장, 메인 노출 5순위 ─────────── */
    // #ISSUE: fill 실사진 전부 미확보 → pig-1 임시 대체 (fill 코드 자체도 아직 파일 없음). 사진 들어오면 ba('filler', n, ...)로 원복
    {
        id: 'filler-1',
        slug: 'filler',
        label: '필러',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
        main: 5,
    },
    // #ISSUE: fill-2 실사진 전부 미확보 → pig-1 임시 대체. 사진 들어오면 ba('filler', 2, ...)로 원복
    { id: 'filler-2', slug: 'filler', label: '필러', before: ba('pigment', 1, 'b'), after: ba('pigment', 1, 'a') },

    /* ─────────── 스킨부스터 (booster) — 5장, 메인 노출 6순위 ─────────── */
    // #ISSUE: boost 실사진 전부 미확보 → lift-1 임시 대체. 사진 들어오면 ba('booster', n, ...)로 원복
    {
        id: 'booster-1',
        slug: 'booster',
        label: '스킨부스터',
        before: ba('lifting', 1, 'b'),
        after: ba('lifting', 1, 'a'),
        main: 6,
    },
    // #ISSUE: boost-2 실사진 전부 미확보 → lift-1 임시 대체. 사진 들어오면 ba('booster', 2, ...)로 원복
    {
        id: 'booster-2',
        slug: 'booster',
        label: '스킨부스터',
        before: ba('lifting', 1, 'b'),
        after: ba('lifting', 1, 'a'),
    },
    // #ISSUE: boost-3 실사진 전부 미확보 → lift-1 임시 대체. 사진 들어오면 ba('booster', 3, ...)로 원복
    {
        id: 'booster-3',
        slug: 'booster',
        label: '스킨부스터',
        before: ba('lifting', 1, 'b'),
        after: ba('lifting', 1, 'a'),
    },
    // #ISSUE: boost-4 실사진 전부 미확보 → lift-1 임시 대체. 사진 들어오면 ba('booster', 4, ...)로 원복
    {
        id: 'booster-4',
        slug: 'booster',
        label: '스킨부스터',
        before: ba('lifting', 1, 'b'),
        after: ba('lifting', 1, 'a'),
    },
    // #ISSUE: boost-5 실사진 전부 미확보 → lift-1 임시 대체. 사진 들어오면 ba('booster', 5, ...)로 원복
    {
        id: 'booster-5',
        slug: 'booster',
        label: '스킨부스터',
        before: ba('lifting', 1, 'b'),
        after: ba('lifting', 1, 'a'),
    },

    /* ─────────── 문신제거 (tattoo-removal) — 1장, 메인 노출 7순위 ─────────── */
    // #ISSUE: tat 실사진 전부 미확보 → red-1 임시 대체. 사진 들어오면 ba('tattoo-removal', 1, ...)로 원복
    {
        id: 'tattoo-removal-1',
        slug: 'tattoo-removal',
        label: '문신제거',
        before: ba('redness', 1, 'b'),
        after: ba('redness', 1, 'a'),
        main: 7,
    },

    /* ─────────── 제모 (hair-removal) — 3장, 메인 노출 8순위 ─────────── */
    // #ISSUE: hair 실사진 전부 미확보 → acne-1 임시 대체. 사진 들어오면 ba('hair-removal', n, ...)로 원복
    {
        id: 'hair-removal-1',
        slug: 'hair-removal',
        label: '제모',
        before: ba('acne', 1, 'b'),
        after: ba('acne', 1, 'a'),
        main: 8,
    },
    // #ISSUE: hair-2 실사진 전부 미확보 → acne-1 임시 대체. 사진 들어오면 ba('hair-removal', 2, ...)로 원복
    {
        id: 'hair-removal-2',
        slug: 'hair-removal',
        label: '제모',
        before: ba('acne', 1, 'b'),
        after: ba('acne', 1, 'a'),
    },
    // #ISSUE: hair-3 실사진 전부 미확보 → acne-1 임시 대체. 사진 들어오면 ba('hair-removal', 3, ...)로 원복
    {
        id: 'hair-removal-3',
        slug: 'hair-removal',
        label: '제모',
        before: ba('acne', 1, 'b'),
        after: ba('acne', 1, 'a'),
    },

    /* ─────────── 레이저리프팅 (laser-lifting) — 4장, 메인 노출 9순위 ─────────── */
    // #ISSUE: laser 실사진 전부 미확보 → pig-1 임시 대체. 사진 들어오면 ba('laser-lifting', n, ...)로 원복
    {
        id: 'laser-lifting-1',
        slug: 'laser-lifting',
        label: '레이저리프팅',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
        main: 9,
    },
    // #ISSUE: laser-2 실사진 전부 미확보 → pig-1 임시 대체. 사진 들어오면 ba('laser-lifting', 2, ...)로 원복
    {
        id: 'laser-lifting-2',
        slug: 'laser-lifting',
        label: '레이저리프팅',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
    },
    // #ISSUE: laser-3 실사진 전부 미확보 → pig-1 임시 대체. 사진 들어오면 ba('laser-lifting', 3, ...)로 원복
    {
        id: 'laser-lifting-3',
        slug: 'laser-lifting',
        label: '레이저리프팅',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
    },
    // #ISSUE: laser-4 실사진 전부 미확보 → pig-1 임시 대체. 사진 들어오면 ba('laser-lifting', 4, ...)로 원복
    {
        id: 'laser-lifting-4',
        slug: 'laser-lifting',
        label: '레이저리프팅',
        before: ba('pigment', 1, 'b'),
        after: ba('pigment', 1, 'a'),
    },

    /* ─────────── 보톡스 (botox) — 2장, 메인 노출 10순위 ─────────── */
    // #ISSUE: box 실사진 전부 미확보 → lift-1 임시 대체. 사진 들어오면 ba('botox', n, ...)로 원복
    {
        id: 'botox-1',
        slug: 'botox',
        label: '보톡스',
        before: ba('lifting', 1, 'b'),
        after: ba('lifting', 1, 'a'),
        main: 10,
    },
    // #ISSUE: box-2 실사진 전부 미확보 → lift-1 임시 대체. 사진 들어오면 ba('botox', 2, ...)로 원복
    { id: 'botox-2', slug: 'botox', label: '보톡스', before: ba('lifting', 1, 'b'), after: ba('lifting', 1, 'a') },
];

// 시그니처/치료 상세페이지용 — 해당 slug의 전후 사진 전체 추출
export const getBAPhotosBySlug = (slug: string) => baPhotos.filter((b) => b.slug === slug);

// 메인페이지(BASlider) 노출용 — main 값 있는 것만, 숫자 오름차순으로 정렬해서 반환
export const getMainBAPhotos = () =>
    baPhotos.filter((b): b is BAPhoto & { main: number } => typeof b.main === 'number').sort((a, b) => a.main - b.main);

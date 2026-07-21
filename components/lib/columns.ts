export interface Col {
    title: string;
    en: string;
    text: string;
    link?: string; // 개별 블로그 포스트 링크. 없으면 site.blog(블로그 메인)로 연결
    slugs: string[];
}

// #ISSUE: link 전부 가라 URL, 개수도 테스트용 가라 데이터 (색소1/리프팅2/부스터3/여드름4/홍조5).
// 실제 칼럼 콘텐츠 발행되면 link + slugs 조합 실제로 맞춰서 교체
export const columns: Col[] = [
    // ── 색소 (pigment) — 1개
    {
        title: '피코토닝',
        en: 'Pico',
        text: '토닝은 많이 받을수록\n좋은 걸까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['pigment'],
    },

    // ── 리프팅 (lifting) — 2개
    {
        title: '온다리프팅',
        en: 'Onda',
        text: '3mm vs 7mm\n내 얼굴엔 어떤 깊이가 맞을까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['lifting'],
    },
    {
        title: '울쎄라',
        en: 'Ulthera',
        text: '울쎄라와 써마지,\n내게 맞는 리프팅은?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['lifting'],
    },

    // ── 부스터 (booster) — 3개
    {
        title: '스킨부스터',
        en: 'Booster',
        text: '리쥬란과 쥬베룩,\n무엇이 다를까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['booster'],
    },
    {
        title: '물광주사',
        en: 'Glow Shot',
        text: '물광주사 효과,\n얼마나 유지될까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['booster'],
    },
    {
        title: '엑소좀',
        en: 'Exosome',
        text: '엑소좀 앰플,\n정말 효과가 있을까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['booster'],
    },

    // ── 여드름 (acne) — 4개
    {
        title: '여드름',
        en: 'Acne',
        text: '여드름 압출,\n해도 되는 걸까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['acne'],
    },
    {
        title: '골드PTT',
        en: 'Gold PTT',
        text: '금 나노입자로 여드름을\n치료한다고?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['acne'],
    },
    {
        title: '포텐자',
        en: 'Potenza',
        text: '포텐자 시술 후\n관리는 어떻게?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['acne'],
    },
    {
        title: '여드름 흉터',
        en: 'Acne Scar',
        text: '패인 흉터도\n다시 채울 수 있을까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['acne'],
    },

    // ── 홍조 (redness) — 5개
    {
        title: '자외선',
        en: 'UV',
        text: '선크림만으로 기미를\n막을 수 있을까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['redness'],
    },
    {
        title: '엑셀브이',
        en: 'ExcelV',
        text: '혈관 레이저,\n얼마나 자주 받아야 할까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['redness'],
    },
    {
        title: '주사비',
        en: 'Rosacea',
        text: '홍조와 주사비,\n어떻게 다를까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['redness'],
    },
    {
        title: '피부장벽',
        en: 'Barrier',
        text: '무너진 장벽,\n어떻게 되돌릴까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['redness'],
    },
    {
        title: '진정관리',
        en: 'Soothing',
        text: '시술 후 붉은기,\n빨리 가라앉히는 법',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['redness'],
    },
];

// 시그니처 상세페이지용 — 해당 slug와 관련된 칼럼만 추출
export const getColumnsBySlug = (slug: string) => columns.filter((c) => c.slugs.includes(slug));

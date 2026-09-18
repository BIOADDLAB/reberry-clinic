/*
    #ISSUE: 관리자 화면에서 쓰는 선택지 목록 + 글자수/개수 제한을 한 파일로 모음.
    - 제한 숫자를 바꾸고 싶으면 여기만 고치면 관리자 화면 전체에 반영됨.
    - (글자수 기준은 실제 카드 크기에서 줄바꿈/말줄임 없이 들어가는 최대치를 재서 정한 값) */

import { signaturePageName } from '@/components/lib/signaturePages';

// ── 시그니처 시술 페이지 (전후사진·칼럼 공통)
// slug 값은 Firestore 저장 키(booster/acne/redness). 공개 URL 은 signaturePages.ts 의 route.
export const SIGNATURE_PAGES = [
    // 기존 slug는 Firestore 전후사진·칼럼 연결을 끊지 않기 위해 유지한다.
    { slug: 'booster' as const, label: signaturePageName('booster') },
    { slug: 'acne' as const, label: signaturePageName('acne') },
    { slug: 'redness' as const, label: signaturePageName('redness') },
];

// 피부교정 페이지는 시그니처와 route slug가 겹치므로 관리자 저장 키를 분리한다.
export const SKIN_TREATMENT_PAGES = [
    { slug: 'skin-pigment', routeSlug: 'pigment', label: '색소' },
    { slug: 'skin-acne', routeSlug: 'acne', label: '여드름' },
    { slug: 'skin-redness', routeSlug: 'redness', label: '홍조/주사피부염' },
    { slug: 'skin-skinbooster', routeSlug: 'skinbooster', label: '스킨부스터' },
    { slug: 'skin-tattoo-removal', routeSlug: 'tattoo-removal', label: '문신제거' },
    { slug: 'skin-scar-pore', routeSlug: 'scar-pore', label: '흉터·모공·피부결' },
    { slug: 'skin-hair-removal', routeSlug: 'hair-removal', label: '제모' },
    { slug: 'skin-care', routeSlug: 'care', label: '관리' },
] as const;

// 안티에이징 레이저리프팅 5개 상세 페이지 전용 관리자 저장 키.
// 시그니처 장비 상세 페이지와 데이터가 섞이지 않도록 item slug와 분리한다.
export const AGING_LIFTING_PAGES = [
    { slug: 'aging-ulthera', itemSlug: 'ulthera', label: '울쎄라 리프팅' },
    { slug: 'aging-onda', itemSlug: 'onda', label: '온다 리프팅' },
    { slug: 'aging-vro', itemSlug: 'vro', label: '브이로 리프팅' },
    { slug: 'aging-revinas', itemSlug: 'revinas', label: '레비나스 리프팅' },
    { slug: 'aging-shrink', itemSlug: 'shrink', label: '슈링크 유니버스 리프팅' },
] as const;

export const TREATMENT_PAGE_GROUPS = [
    { key: 'signature', label: '시그니처', pages: SIGNATURE_PAGES },
    { key: 'skin', label: '피부교정', pages: SKIN_TREATMENT_PAGES },
    { key: 'aging', label: '안티에이징', pages: AGING_LIFTING_PAGES },
] as const;

export const TREATMENT_PAGES = TREATMENT_PAGE_GROUPS.flatMap((group) =>
    group.pages.map((page) => ({ slug: page.slug, label: page.label, group: group.label })),
);

export const skinTreatmentPageSlug = (routeSlug: string) =>
    SKIN_TREATMENT_PAGES.find((page) => page.routeSlug === routeSlug)?.slug;

export const agingLiftingPageSlug = (itemSlug: string) =>
    AGING_LIFTING_PAGES.find((page) => page.itemSlug === itemSlug)?.slug;

/* ── 글자수 제한
   #ISSUE: 예전 값(제목 10자)은 카드 폭에 물리적으로 안 들어가 제목이 2~3줄로 터졌다.
   폭 계산 (칼럼 카드 기준): 카드 344 − 좌우 여백 30×2 − 헤더 안쪽 여백 10×2 = 264px
   실측(Asta Sans Bold, 24px) 한글 1자 ≈ 20.5px → 12자(247px) 까지 한 줄에 들어간다.
   #ISSUE: 이름표 옆에 있던 영문 칸을 없애면서(2026.09) 영문 유무로 갈렸던 두 값을 하나로 합쳤다. */
export const LIMITS = {
    // 칼럼 — 시술·기기 이름표. 지금 목록 디자인에서는 관리자 안에서만 쓰는 메모다
    columnTitle: 12,
    // 칼럼 — 제목(카드 본문). 2줄까지만 보이고 넘으면 말줄임(...) 처리됨
    columnText: 34,
    // 전후사진 — 새 시그니처 정식 명칭까지 입력할 수 있도록 20자로 확장
    baLabel: 20,
} as const;

// ── 개수 제한
export const COUNT_LIMITS = {
    /* 페이지당 칼럼 최대 10개.
       #ISSUE: 12개까지 열어 뒀더니 목록이 화면을 넘겨 한 줄씩 보는 의미가 흐려졌다.
               한 페이지에 10개면 관련 글을 담기에 충분하다는 병원 확인. */
    columnPerPage: 10,
    baPerPage: 14, // 시그니처 페이지 1개당 전후사진 최대
    baMain: 10, // 메인페이지에 노출할 전후사진 최대
} as const;

// ── 전후사진 권장 이미지 규격
// 전후사진 페이지 카드는 한 장을 정사각으로 보여 준다.
// 고화질 화면에서 흐려 보이지 않게 800px 정사각을 권장
export const BA_IMAGE_GUIDE = {
    displayWidth: 244,
    displayHeight: 244,
    recommendWidth: 800,
    recommendHeight: 800,
    maxFileSizeMB: 5,
} as const;

/*
    #ISSUE: 관리자 화면에서 쓰는 선택지 목록 + 글자수/개수 제한을 한 파일로 모음.
    - 제한 숫자를 바꾸고 싶으면 여기만 고치면 관리자 화면 전체에 반영됨.
    - (글자수 기준은 실제 카드 크기에서 줄바꿈/말줄임 없이 들어가는 최대치를 재서 정한 값) */

// ── 시그니처 시술 페이지 (전후사진·칼럼 공통)
// slug 값은 components/lib/treatments.ts 의 시그니처 slug 와 반드시 같아야 함!!
export const SIGNATURE_PAGES = [
    { slug: 'pigment', label: '색소' },
    { slug: 'lifting', label: '볼륨리프팅' },
    { slug: 'booster', label: '볼륨부스터' },
    { slug: 'acne', label: '여드름' },
    { slug: 'redness', label: '홍조' },
] as const;

/* ── 글자수 제한
   #ISSUE: 예전 값(제목 10자 + 영문 14자)은 카드에 물리적으로 안 들어갔다.
   실제 폰트로 재보면 24px 기준 한글 10자 = 205px, 영문 14자 = 156px → 합계 361px.
   쓸 수 있는 폭은 252px 뿐이라 100px 넘게 초과해서 제목이 2~3줄로 터졌다.

   폭 계산 (칼럼 카드 기준)
     카드 344 − 좌우 여백 30×2 = 284
     헤더 안쪽 여백 10×2 = 264
     제목과 영문 사이 간격 12 = 252  ← 제목 + 영문이 나눠 쓸 폭

   실측(Asta Sans Bold / Belleza, 24px)
     한글 1자 ≈ 20.5px,  영문 1자 ≈ 11.1px
     → 영문 있을 때  : 한글 7자(144) + 영문 9자(100) = 244  ✓
     → 영문 없을 때  : 264px 전부 사용 → 한글 12자(247)   ✓ */
export const LIMITS = {
    // 칼럼 — 시술,기기 이름 (카드 왼쪽 위 큰 글씨). 오른쪽에 영문명이 같이 놓이는 경우
    columnTitle: 7,
    // 칼럼 — 영문 이름을 비웠을 때. 오른쪽 자리를 통째로 쓸 수 있어 더 길게 허용
    columnTitleNoEn: 12,
    // 칼럼 — 영문 이름 (카드 오른쪽 위). 영문은 글자 폭이 좁아 한글보다 여유 있음
    columnEn: 9,
    // 칼럼 — 제목(카드 본문). 2줄까지만 보이고 넘으면 말줄임(...) 처리됨
    columnText: 34,
    // 전후사진 — 사진 아래 라벨(알약 모양) / 한 줄 안에 들어가야 함
    baLabel: 10,
} as const;

// ── 개수 제한
export const COUNT_LIMITS = {
    columnPerPage: 8, // 한 페이지(시그니처 1개 또는 기기 1개)당 칼럼 최대
    baPerPage: 14, // 시그니처 페이지 1개당 전후사진 최대
    baMain: 10, // 메인페이지에 노출할 전후사진 최대
} as const;

// ── 전후사진 권장 이미지 규격
// 카드에서 실제로 보이는 크기는 가로 244 × 세로 147.
// 고화질 화면(레티나)에서 흐려 보이지 않게 2배 크기로 올리는 걸 권장
export const BA_IMAGE_GUIDE = {
    displayWidth: 244,
    displayHeight: 147,
    recommendWidth: 488,
    recommendHeight: 294,
    maxFileSizeMB: 5,
} as const;

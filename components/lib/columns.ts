export interface Col {
    title: string;
    en: string;
    text: string;
    link?: string; // 개별 블로그 포스트 링크. 없으면 site.blog(블로그 메인)로 연결
    slugs: string[];
}

// 자동번역 대상 언어. title/en은 브랜드·시술명이라 번역하지 않고(기존 isKo 분기 그대로),
// 카드 본문인 text 필드만 번역한다.
export const COLUMN_TEXT_TRANSLATABLE_LOCALES = ['en', 'ja', 'zh'] as const;
export type ColumnTextTranslatableLocale = (typeof COLUMN_TEXT_TRANSLATABLE_LOCALES)[number];

export interface ColumnTextTranslation {
    text: string;
    sourceHash: string; // 번역 시점의 원문(text) 해시 — 관리자가 문구를 고치면 캐시가 자동 무효화됨
    translatedAt: string;
}

// Firestore 'columns' 컬렉션에서 읽어온 항목 — docId/translations 가 실려 있어 번역 캐시 조회/갱신이 가능하다.
export interface FirestoreCol extends Col {
    docId: string;
    translations?: Partial<Record<ColumnTextTranslatableLocale, ColumnTextTranslation>>;
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
        slugs: ['lifting', 'ulthera'],
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

    // ── 기기상세 데모용 가라 데이터 (메인 4장비) — 발행 시 교체 ──
    // 리팟 3개
    {
        title: '리팟 재생',
        en: 'Lipot',
        text: '피부 재생,\n리팟이 답일까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['lipot'],
    },
    {
        title: '리팟 vs 토닝',
        en: 'Lipot',
        text: '색소 잡는 데\n뭐가 더 나을까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['lipot'],
    },
    {
        title: '리팟 주기',
        en: 'Lipot',
        text: '몇 주 간격이\n가장 효과적일까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['lipot'],
    },
    // 엑셀V 2개
    {
        title: '엑셀V 홍조',
        en: 'Excel V',
        text: '붉은기,\n레이저로 잡힐까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['excelv'],
    },
    {
        title: '엑셀V 혈관',
        en: 'Excel V',
        text: '실핏줄 치료,\n아프지 않을까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['excelv'],
    },
    // 헐리우드 스펙트라 4개
    {
        title: '스펙트라 토닝',
        en: 'Spectra',
        text: '기미 토닝,\n몇 번이면 될까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['spectra'],
    },
    {
        title: '스펙트라 모공',
        en: 'Spectra',
        text: '모공도 같이\n좋아질까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['spectra'],
    },
    {
        title: '스펙트라 톤업',
        en: 'Spectra',
        text: '피부톤 개선,\n얼마나 걸릴까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['spectra'],
    },
    {
        title: '스펙트라 다운타임',
        en: 'Spectra',
        text: '시술 후 바로\n일상 가능할까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['spectra'],
    },
    // 피코 플러스 5개
    {
        title: '피코 색소',
        en: 'Pico',
        text: '난치성 색소,\n피코가 답일까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['pico'],
    },
    {
        title: '피코 문신',
        en: 'Pico',
        text: '문신 제거,\n몇 회 필요할까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['pico'],
    },
    {
        title: '피코 흉터',
        en: 'Pico',
        text: '패인 흉터도\n좋아질까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['pico'],
    },
    {
        title: '피코 vs 토닝',
        en: 'Pico',
        text: '뭐가 내 피부에\n더 맞을까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['pico'],
    },
    {
        title: '피코 통증',
        en: 'Pico',
        text: '시술 아플까?\n마취 필요할까?',
        link: 'https://blog.naver.com/drpyton',
        slugs: ['pico'],
    },
];

// 시그니처 상세페이지용 — 해당 slug와 관련된 칼럼만 추출
export const getColumnsBySlug = (slug: string) => columns.filter((c) => c.slugs.includes(slug));

// ── 아래는 'columns' Firestore 문서의 번역 캐시 조회/저장 ──
// 클라이언트 훅(useColumns.ts)과 서버 라우트(app/api/treatment-column-translation)가 공유한다.
// 이 파일엔 'use client' 가 없으므로 서버에서 import 해도 안전하다(firebase.ts와 동일한 전제).

import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

// FNV-1a 32bit — skinColumnPosts.ts의 hashSkinColumnSource와 같은 방식(암호화용 아님, 변경 감지용)
export function hashColumnText(text: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
    }
    return (hash >>> 0).toString(16);
}

function normalizeColumnTranslations(value: unknown): FirestoreCol['translations'] {
    if (!value || typeof value !== 'object') return undefined;
    const result: FirestoreCol['translations'] = {};

    for (const locale of COLUMN_TEXT_TRANSLATABLE_LOCALES) {
        const entry = (value as Record<string, unknown>)[locale];
        if (!entry || typeof entry !== 'object') continue;
        const e = entry as Record<string, unknown>;
        if (typeof e.text !== 'string' || typeof e.sourceHash !== 'string' || typeof e.translatedAt !== 'string') continue;
        result[locale] = { text: e.text, sourceHash: e.sourceHash, translatedAt: e.translatedAt };
    }

    return Object.keys(result).length > 0 ? result : undefined;
}

export async function fetchColumnById(docId: string): Promise<FirestoreCol | null> {
    const snap = await getDoc(doc(db, 'columns', docId));
    if (!snap.exists()) return null;

    const data = snap.data();
    return {
        docId: snap.id,
        title: typeof data.title === 'string' ? data.title : '',
        en: typeof data.en === 'string' ? data.en : '',
        text: typeof data.text === 'string' ? data.text : '',
        link: typeof data.link === 'string' ? data.link : undefined,
        slugs: Array.isArray(data.slugs) ? data.slugs.filter((s): s is string => typeof s === 'string') : [],
        translations: normalizeColumnTranslations(data.translations),
    };
}

export async function saveColumnTextTranslation(
    docId: string,
    locale: ColumnTextTranslatableLocale,
    translation: ColumnTextTranslation,
): Promise<void> {
    await updateDoc(doc(db, 'columns', docId), {
        [`translations.${locale}`]: translation,
    });
}

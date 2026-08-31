'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import {
    COLUMN_TRANSLATABLE_LOCALES,
    hashSkinColumnSource,
    type ColumnTranslatableLocale,
    type SkinColumnPostItem,
} from '@/components/lib/skinColumnPosts';

type TranslatableFields = Pick<SkinColumnPostItem, 'title' | 'excerpt' | 'contentHtml'>;

interface LocalizedColumnPost {
    post: SkinColumnPostItem | null;
    // 번역 API 호출이 진행 중인 동안 true. 이 사이엔 post 는 원문(한국어)을 그대로 보여준다
    // (빈 화면 대신 자연스럽게 도착 즉시 교체되는 편이 낫다는 판단).
    isTranslating: boolean;
}

function isTranslatableLocale(locale: string): locale is ColumnTranslatableLocale {
    return (COLUMN_TRANSLATABLE_LOCALES as readonly string[]).includes(locale);
}

// 피부칼럼 게시글을 현재 로케일에 맞춰 보여주는 훅.
// - ko: 아무 것도 하지 않고 원문 그대로 반환 (API 호출 0회 — 기존 동작 완전히 그대로 유지)
// - en/ja/zh: Firestore에 캐시된 번역이 최신이면 그걸 쓰고, 없거나 오래됐으면
//   /api/column-translation 을 호출해 새로 받아온다.
export function useLocalizedColumnPost(post: SkinColumnPostItem | null): LocalizedColumnPost {
    const locale = useLocale();
    const [cache, setCache] = useState<{ docId: string; locale: string; fields: TranslatableFields } | null>(null);

    const sourceHash = post ? hashSkinColumnSource(post.title, post.excerpt, post.contentHtml) : '';
    const stored = post && isTranslatableLocale(locale) ? post.translations?.[locale] : undefined;
    const currentStored = stored?.sourceHash === sourceHash ? stored : undefined;

    useEffect(() => {
        if (!post || !isTranslatableLocale(locale)) return;
        if (currentStored) return;

        let active = true;

        fetch('/api/column-translation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ docId: post.docId, locale }),
        })
            .then((res) => res.json())
            .then((data: { translation?: TranslatableFields }) => {
                if (!active || !data.translation) return;
                const { title, excerpt, contentHtml } = data.translation;
                setCache({ docId: post.docId, locale, fields: { title, excerpt, contentHtml } });
            })
            .catch((error) => {
                console.error('[useLocalizedColumnPost] translation request failed', error);
            });

        return () => {
            active = false;
        };
        // docId/locale 변경 시점에만 다시 확인하면 충분 — 같은 세션 중 관리자가 원문을 실시간으로
        // 고치는 상황은 없으므로 title/excerpt/contentHtml 은 deps에서 뺐다.
    }, [post, locale, currentStored]);

    if (!post) return { post: null, isTranslating: false };
    if (!isTranslatableLocale(locale)) return { post, isTranslating: false };
    if (currentStored) return { post: { ...post, ...currentStored }, isTranslating: false };
    if (cache && cache.docId === post.docId && cache.locale === locale) {
        return { post: { ...post, ...cache.fields }, isTranslating: false };
    }
    return { post, isTranslating: true };
}

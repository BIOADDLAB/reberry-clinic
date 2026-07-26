import { NextResponse } from 'next/server';
import {
    COLUMN_TRANSLATABLE_LOCALES,
    fetchPublishedSkinColumnPost,
    hashSkinColumnSource,
    saveSkinColumnTranslation,
    type ColumnTranslatableLocale,
} from '@/components/lib/skinColumnPosts';
import { translateColumnFields } from '@/components/lib/googleTranslate';

// 피부칼럼 게시글 하나를 요청받은 언어로 번역해 Firestore에 캐시하고 돌려주는 엔드포인트.
// 클라이언트(SkinColumnList/SkinColumnDetail)는 캐시된 번역이 없거나(sourceHash 불일치로) 오래됐을 때만 호출한다.
// #ISSUE: 지금은 별도 rate limit이 없다 — docId를 알면 누구나 반복 호출해 번역 API 비용을 유발할 수 있음.
//         트래픽이 늘면 IP/세션 단위 rate limit을 추가할 것.
export async function POST(request: Request) {
    let body: { docId?: unknown; locale?: unknown };
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 });
    }

    const { docId, locale } = body;
    if (typeof docId !== 'string' || !docId) {
        return NextResponse.json({ error: 'docId is required' }, { status: 400 });
    }
    if (typeof locale !== 'string' || !COLUMN_TRANSLATABLE_LOCALES.includes(locale as ColumnTranslatableLocale)) {
        return NextResponse.json({ error: `locale must be one of: ${COLUMN_TRANSLATABLE_LOCALES.join(', ')}` }, { status: 400 });
    }
    const targetLocale = locale as ColumnTranslatableLocale;

    const post = await fetchPublishedSkinColumnPost(docId);
    if (!post) {
        return NextResponse.json({ error: 'post not found or not published' }, { status: 404 });
    }

    const sourceHash = hashSkinColumnSource(post.title, post.excerpt, post.contentHtml);
    const cached = post.translations?.[targetLocale];
    if (cached && cached.sourceHash === sourceHash) {
        return NextResponse.json({ translation: cached, cached: true });
    }

    let translatedFields: { title: string; excerpt: string; contentHtml: string };
    try {
        translatedFields = await translateColumnFields(
            { title: post.title, excerpt: post.excerpt, contentHtml: post.contentHtml },
            targetLocale,
        );
    } catch (error) {
        console.error('[column-translation] translate failed', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'translation failed' },
            { status: 502 },
        );
    }

    const translation = {
        ...translatedFields,
        sourceHash,
        translatedAt: new Date().toISOString(),
    };

    try {
        await saveSkinColumnTranslation(docId, targetLocale, translation);
    } catch (error) {
        // 캐시 저장이 실패해도 이번 요청 응답은 그대로 내려준다 — 다음 조회 때 다시 번역될 뿐.
        console.error('[column-translation] failed to cache translation', error);
    }

    return NextResponse.json({ translation, cached: false });
}

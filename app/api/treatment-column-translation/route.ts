import { NextResponse } from 'next/server';
import {
    COLUMN_TEXT_TRANSLATABLE_LOCALES,
    fetchColumnById,
    hashColumnText,
    saveColumnTextTranslation,
    type ColumnTextTranslatableLocale,
} from '@/components/lib/columns';
import { translateColumnFields } from '@/components/lib/googleTranslate';

// 시그니처/기기상세 페이지의 "블로그 연결" 칼럼 카드(Firestore 'columns' 컬렉션) 문구를
// 요청받은 언어로 번역해 캐시하고 돌려준다. 피부칼럼 블로그용 /api/column-translation 과
// 같은 패턴이지만, 이쪽은 title/excerpt/contentHtml 이 아니라 text 한 필드만 다룬다.
// #ISSUE: 여기도 별도 rate limit이 없다 — 트래픽이 늘면 추가할 것.
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
    if (typeof locale !== 'string' || !COLUMN_TEXT_TRANSLATABLE_LOCALES.includes(locale as ColumnTextTranslatableLocale)) {
        return NextResponse.json(
            { error: `locale must be one of: ${COLUMN_TEXT_TRANSLATABLE_LOCALES.join(', ')}` },
            { status: 400 },
        );
    }
    const targetLocale = locale as ColumnTextTranslatableLocale;

    const item = await fetchColumnById(docId);
    if (!item) {
        return NextResponse.json({ error: 'column not found' }, { status: 404 });
    }

    const sourceHash = hashColumnText(item.text);
    const cached = item.translations?.[targetLocale];
    if (cached && cached.sourceHash === sourceHash) {
        return NextResponse.json({ translation: cached, cached: true });
    }

    let translatedText: string;
    try {
        // googleTranslate.ts는 title/excerpt/contentHtml 3필드 시그니처라, text 하나만 번역할 땐
        // title 자리에 넣고 excerpt/contentHtml은 빈 값으로 보낸다(불필요한 API 호출 없이 재사용).
        const result = await translateColumnFields({ title: item.text, excerpt: '', contentHtml: '' }, targetLocale);
        translatedText = result.title;
    } catch (error) {
        console.error('[treatment-column-translation] translate failed', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'translation failed' },
            { status: 502 },
        );
    }

    const translation = {
        text: translatedText,
        sourceHash,
        translatedAt: new Date().toISOString(),
    };

    try {
        await saveColumnTextTranslation(docId, targetLocale, translation);
    } catch (error) {
        console.error('[treatment-column-translation] failed to cache translation', error);
    }

    return NextResponse.json({ translation, cached: false });
}

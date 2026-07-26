// 서버 전용 — Google Cloud Translation API v2 클라이언트.
// #ISSUE: 브라우저에서 직접 호출하면 API 키가 그대로 노출돼 과금 악용이 가능하다.
//         반드시 Route Handler(app/api/column-translation) 등 서버 코드에서만 import 할 것.
// 필요한 환경변수: GOOGLE_TRANSLATE_API_KEY (Google Cloud Console에서
//   "Cloud Translation API"를 활성화한 프로젝트의 API 키). .env.local 에 추가하고,
//   그 파일은 절대 커밋하지 말 것(.gitignore의 .env* 에 이미 포함되어 있음).

const ENDPOINT = 'https://translation.googleapis.com/language/translate/v2';

interface ColumnSourceFields {
    title: string;
    excerpt: string;
    contentHtml: string;
}

async function callTranslateApi(q: string[], target: string, format: 'text' | 'html'): Promise<string[]> {
    const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
    if (!apiKey) {
        throw new Error(
            'GOOGLE_TRANSLATE_API_KEY 환경변수가 설정되어 있지 않습니다. .env.local에 추가한 뒤 서버를 재시작하세요.',
        );
    }

    const res = await fetch(`${ENDPOINT}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ q, source: 'ko', target, format }),
    });

    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`Google Translate API 오류 (${res.status}): ${body.slice(0, 500)}`);
    }

    const json = (await res.json()) as { data?: { translations?: { translatedText: string }[] } };
    const translations = json.data?.translations;
    if (!translations || translations.length !== q.length) {
        throw new Error('Google Translate API 응답 형식이 예상과 다릅니다.');
    }

    return translations.map((t) => t.translatedText);
}

// title/excerpt는 일반 텍스트, contentHtml은 Tiptap이 만든 정갈한 HTML이라
// format을 분리해서 두 번 호출한다(HTML로 같이 보내면 제목의 특수문자가
// 불필요하게 엔티티 이스케이프될 수 있음).
export async function translateColumnFields(
    source: ColumnSourceFields,
    targetLocale: 'en' | 'ja' | 'zh',
): Promise<ColumnSourceFields> {
    const [textResults, htmlResults] = await Promise.all([
        callTranslateApi([source.title, source.excerpt], targetLocale, 'text'),
        source.contentHtml
            ? callTranslateApi([source.contentHtml], targetLocale, 'html')
            : Promise.resolve(['']),
    ]);

    return {
        title: textResults[0] ?? source.title,
        excerpt: textResults[1] ?? source.excerpt,
        contentHtml: htmlResults[0] ?? source.contentHtml,
    };
}

'use client';

import { useEffect } from 'react';
import { getCurrentLang } from '@/components/lib/useLang';

// <html data-lang="ja"> 형태로 현재 언어를 심어,
// globals.css에서 html[data-lang='ja'] ... 로 언어별 스타일을 제어할 수 있게 한다.
export default function LangAttribute() {
    useEffect(() => {
        document.documentElement.dataset.lang = getCurrentLang();
    }, []);
    return null;
}

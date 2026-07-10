'use client';

import { useEffect } from 'react';

declare global {
    interface Window {
        google?: {
            translate: {
                TranslateElement: new (
                    options: { pageLanguage: string; includedLanguages: string; autoDisplay: boolean },
                    elementId: string,
                ) => void;
            };
        };
        googleTranslateElementInit?: () => void;
    }
}

// 구글 번역 위젯 로더 — UI는 globals.css에서 전부 숨기고,
// 언어 전환은 LanguageToggle이 googtrans 쿠키로 제어한다.
export default function GoogleTranslate() {
    useEffect(() => {
        if (document.getElementById('google-translate-script')) return;

        window.googleTranslateElementInit = () => {
            if (!window.google) return;
            new window.google.translate.TranslateElement(
                { pageLanguage: 'ko', includedLanguages: 'ko,en,ja,zh-CN,ar', autoDisplay: false },
                'google_translate_element',
            );
        };

        const script = document.createElement('script');
        script.id = 'google-translate-script';
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
    }, []);

    return <div id="google_translate_element" />;
}

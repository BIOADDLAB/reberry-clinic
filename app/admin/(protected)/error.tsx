'use client';

import { useEffect } from 'react';

/* 배포판 렌더 오류의 영어 원문은 화면에 두지 않는다. 내용은 브라우저 콘솔에만 남긴다. */
export default function AdminSectionError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('[관리자]', error);
    }, [error]);

    return (
        <div className="rounded-2xl bg-white px-6 py-10 text-center shadow-[0_2px_20px_rgba(69,54,45,0.06)]">
            <p className="text-lead font-bold text-cocoa">화면을 불러오지 못했습니다.</p>
            <p className="mt-2 text-small text-latte">관리자에게 문의하세요.</p>
            <button
                type="button"
                onClick={reset}
                className="mt-6 rounded-full bg-cocoa px-5 py-2.5 text-small font-semibold text-cream"
            >
                다시 시도
            </button>
        </div>
    );
}

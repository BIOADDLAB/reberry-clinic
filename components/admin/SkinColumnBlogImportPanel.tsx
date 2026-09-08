'use client';

import { useEffect, useState } from 'react';
import { syncBlogSkinColumnsAction } from '@/app/admin/(protected)/skin-columns/actions';
import { fetchBlogImportSettings, type BlogImportResult } from '@/components/lib/skinColumnBlogImport';

export default function SkinColumnBlogImportPanel({ onError }: { onError: (message: string | null) => void }) {
    const [lastSyncedAt, setLastSyncedAt] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState<BlogImportResult | null>(null);

    useEffect(() => {
        let active = true;
        fetchBlogImportSettings()
            .then((settings) => {
                if (active) setLastSyncedAt(settings.lastSyncedAt);
            })
            .catch((error) => {
                if (active) onError(error instanceof Error ? error.message : '수집 기록을 불러오지 못했습니다.');
            });
        return () => {
            active = false;
        };
    }, [onError]);

    const handleSync = async () => {
        setSyncing(true);
        onError(null);
        try {
            setResult(await syncBlogSkinColumnsAction());
            setLastSyncedAt((await fetchBlogImportSettings()).lastSyncedAt);
        } catch (error) {
            onError(error instanceof Error ? error.message : '블로그 글을 가져오지 못했습니다.');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)] md:p-7">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lead font-bold text-cocoa">네이버 블로그 수집</h2>
                    <p className="mt-1 max-w-2xl text-caption leading-6 text-latte">
                        닥터 파이톤 블로그에서 제목·요약·대표 이미지를 가져옵니다. 대표 이미지는 웹용 썸네일로 압축해
                        저장하며, 본문은 사이트에 복사하지 않고 카드에서 블로그 원문으로 이동합니다. 가져온 글은 바로
                        공개되고, 사이트에서 수정한 제목은 다시 가져와도 유지됩니다.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        disabled={syncing}
                        onClick={() => void handleSync()}
                        className="rounded-full bg-cocoa px-4 py-2 text-caption font-semibold text-cream hover:bg-deep disabled:opacity-40"
                    >
                        {syncing ? '가져오는 중…' : '블로그에서 가져오기'}
                    </button>
                </div>
            </div>

            <p className="mt-3 text-caption-sm text-latte">
                {lastSyncedAt
                    ? `마지막 수집: ${new Date(lastSyncedAt).toLocaleString('ko-KR')}`
                    : '아직 수집한 기록이 없습니다. 먼저 블로그 글을 가져오세요.'}
            </p>

            {/* 블로그 카테고리 ↔ 사이트 분류 매핑표가 있던 자리.
                분류를 없앴으므로 연결할 것이 없다. */}
            {result && !result.skipped ? (
                <p className="mt-2 text-caption text-cocoa">
                    가져온 글 {result.fetched}개 · 신규 {result.created}개 · 갱신 {result.updated}개
                    {result.thumbnailsStored > 0 ? ` · 썸네일 저장 ${result.thumbnailsStored}개` : ''}
                    {result.thumbnailsMissing > 0 ? ` · 썸네일 없음 ${result.thumbnailsMissing}개` : ''}
                </p>
            ) : null}
        </section>
    );
}

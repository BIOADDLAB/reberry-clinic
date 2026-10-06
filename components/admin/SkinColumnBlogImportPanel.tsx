'use client';

import { useEffect, useState } from 'react';
import { syncBlogSkinColumnsAction } from '@/app/admin/(protected)/skin-columns/actions';
import { fetchBlogImportSettings, type BlogImportResult } from '@/components/lib/skinColumnBlogImport';

const SYNC_FAILED = '블로그 글을 가져오지 못했습니다. 관리자에게 문의하세요.';

/** 배포판이 지워 버린 영어 렌더 오류는 화면에 올리지 않고 콘솔에만 남긴다. */
function reportSyncFailure(error: unknown, onError: (message: string | null) => void) {
    console.error('[블로그에서 가져오기]', error);
    onError(SYNC_FAILED);
}

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
                if (active) reportSyncFailure(error, onError);
            });
        return () => {
            active = false;
        };
    }, [onError]);

    const handleSync = async () => {
        setSyncing(true);
        setResult(null);
        onError(null);
        try {
            const response = await syncBlogSkinColumnsAction();
            if (!response?.ok) {
                reportSyncFailure(response && 'message' in response ? response.message : response, onError);
                return;
            }
            setResult(response.result);
            setLastSyncedAt((await fetchBlogImportSettings()).lastSyncedAt);
        } catch (error) {
            reportSyncFailure(error, onError);
        } finally {
            setSyncing(false);
        }
    };

    /** 마지막 수집이 며칠 전인지. 기록이 없으면 null */
    const staleDays = lastSyncedAt
        ? Math.floor((Date.now() - new Date(lastSyncedAt).getTime()) / 86_400_000)
        : null;

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

            {/* #ISSUE: 2026.09.17 — 매일 도는 자동 수집이 9월 8일에 멈췄는데 화면에 아무 표시가 없어
                9일 동안 아무도 몰랐다. 9월 15일 글이 안 올라온 것도 이걸로 드러났다.
                → 자동 수집은 하루 한 번이니, 사흘 넘게 소식이 없으면 눈에 보이게 알린다. */}
            {staleDays !== null && staleDays >= 3 && (
                <p className="mt-2 rounded-xl bg-[#FFF6D6] px-3 py-2 text-caption text-[#8A5A12]">
                    자동 수집이 {staleDays}일째 멈춰 있습니다. 위 [블로그에서 가져오기]를 눌러 보시고, 그래도 안 되면
                    알려 주세요.
                </p>
            )}

            {/* 블로그 카테고리 ↔ 사이트 분류 매핑표가 있던 자리.
                분류를 없앴으므로 연결할 것이 없다. */}
            {result && !result.skipped ? (
                <p className="mt-3 text-small font-semibold text-cocoa">
                    {result.created > 0 ? `새 글 ${result.created}개를 가져왔습니다.` : '최신글입니다.'}
                </p>
            ) : null}
        </section>
    );
}

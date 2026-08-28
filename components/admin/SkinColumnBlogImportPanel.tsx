'use client';

import { useEffect, useMemo, useState } from 'react';
import { syncBlogSkinColumnsAction } from '@/app/admin/(protected)/skin-columns/actions';
import { SIGNATURE_PAGES } from '@/components/lib/adminConfig';
import {
    applyMapsToUnmappedPosts,
    collectBlogCategories,
    fetchBlogImportSettings,
    saveBlogCategoryMaps,
    type BlogImportResult,
} from '@/components/lib/skinColumnBlogImport';
import type { SkinColumnPostItem } from '@/components/lib/skinColumnPosts';

const selectClass =
    'rounded-lg border border-cocoa/15 bg-white px-3 py-2 text-caption text-cocoa outline-none focus:border-cocoa/40 disabled:opacity-40';

export default function SkinColumnBlogImportPanel({
    posts,
    onError,
}: {
    posts: SkinColumnPostItem[];
    onError: (message: string | null) => void;
}) {
    const [maps, setMaps] = useState<Record<string, string>>({});
    const [lastSyncedAt, setLastSyncedAt] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [result, setResult] = useState<BlogImportResult | null>(null);

    const blogCategories = useMemo(() => collectBlogCategories(posts), [posts]);
    const unmappedCount = posts.filter((post) => post.source === 'naver-blog' && !post.categorySlug).length;

    useEffect(() => {
        let active = true;
        fetchBlogImportSettings()
            .then((settings) => {
                if (!active) return;
                setMaps(settings.maps);
                setLastSyncedAt(settings.lastSyncedAt);
            })
            .catch((error) => {
                if (active) onError(error instanceof Error ? error.message : '카테고리 매핑을 불러오지 못했습니다.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });
        return () => {
            active = false;
        };
    }, [onError]);

    const handleMapChange = async (blogCategory: string, categorySlug: string) => {
        const nextMaps = { ...maps, [blogCategory]: categorySlug };
        setMaps(nextMaps);
        setSaving(true);
        onError(null);
        try {
            await saveBlogCategoryMaps(nextMaps);
            await applyMapsToUnmappedPosts(nextMaps, posts);
        } catch (error) {
            onError(error instanceof Error ? error.message : '카테고리 매핑 저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        onError(null);
        try {
            const nextResult = await syncBlogSkinColumnsAction();
            setResult(nextResult);
            const settings = await fetchBlogImportSettings();
            setMaps(settings.maps);
            setLastSyncedAt(settings.lastSyncedAt);
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
                        닥터 파이톤 블로그 RSS에서 제목·요약·썸네일을 가져옵니다. 본문은 사이트에 복사하지 않고, 카드에서
                        블로그 원문으로 이동합니다. 아래 매핑만 한 번 연결하면 이후 글은 자동 분류되며, 사이트에서 수정한
                        제목은 다시 수집해도 유지됩니다.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {unmappedCount > 0 ? (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-caption-sm font-semibold text-amber-800">
                            분류 필요 {unmappedCount}개
                        </span>
                    ) : null}
                    <button
                        type="button"
                        disabled={syncing || saving}
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
                {saving ? ' · 매핑 저장 중…' : ''}
            </p>

            {result && !result.skipped ? (
                <p className="mt-2 text-caption text-cocoa">
                    RSS {result.fetched}개 · 신규 {result.created}개 · 갱신 {result.updated}개 · 공개 {result.published}개
                    {result.needsCategory > 0 ? ` · 분류 필요 ${result.needsCategory}개` : ''}
                </p>
            ) : null}

            {loading ? (
                <p className="mt-5 text-caption text-latte">매핑 목록을 불러오는 중…</p>
            ) : (
                <div className="mt-5 overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-1 text-left">
                        <thead>
                            <tr className="text-caption-sm text-latte">
                                <th className="px-3 py-2 font-semibold">블로그 카테고리</th>
                                <th className="px-3 py-2 font-semibold">사이트 피부칼럼 분류</th>
                            </tr>
                        </thead>
                        <tbody>
                            {blogCategories.map((blogCategory) => (
                                <tr key={blogCategory} className="align-middle">
                                    <td className="rounded-l-lg bg-[#F5F2EC]/80 px-3 py-2 text-caption text-cocoa">
                                        {blogCategory}
                                    </td>
                                    <td className="rounded-r-lg bg-[#F5F2EC]/80 px-3 py-2">
                                        <select
                                            className={selectClass}
                                            value={maps[blogCategory] ?? ''}
                                            disabled={saving || syncing}
                                            onChange={(event) => void handleMapChange(blogCategory, event.target.value)}
                                        >
                                            <option value="">분류 안 함 (비공개)</option>
                                            {SIGNATURE_PAGES.map((category) => (
                                                <option key={category.slug} value={category.slug}>
                                                    {category.label}
                                                </option>
                                            ))}
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {blogCategories.length === 0 ? (
                        <p className="mt-3 text-caption text-latte">
                            아직 가져온 블로그 카테고리가 없습니다. 위 버튼으로 글을 가져오면 여기에 목록이 생깁니다.
                        </p>
                    ) : null}
                </div>
            )}
        </section>
    );
}

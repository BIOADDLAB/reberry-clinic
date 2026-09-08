'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    getSkinColumnBlogUrl,
    isHostedColumnThumbnail,
    sortSkinColumnPosts,
    subscribePublishedSkinColumnPosts,
    type SkinColumnPostItem,
    type SkinColumnSortOrder,
} from '@/components/lib/skinColumnPosts';
import { useLocalizedColumnPost } from '@/components/lib/useColumnTranslation';
import Pagination from '@/components/ui/Pagination';

const PER_PAGE = 6;

export default function SkinColumnList() {
    const t = useTranslations('column');
    const [posts, setPosts] = useState<SkinColumnPostItem[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState('');
    const [order, setOrder] = useState<SkinColumnSortOrder>('newest');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const isFirstPageRender = useRef(true);

    useEffect(
        () =>
            subscribePublishedSkinColumnPosts(
                (nextPosts) => {
                    setPosts(nextPosts);
                    setLoading(false);
                },
                () => {
                    setError(t('loadError'));
                    setLoading(false);
                },
            ),
        [t],
    );

    /* #ISSUE: 분류 탭이 시그니처 시술 페이지 목록(SIGNATURE_PAGES)을 빌려 쓰고 있었다.
       블로그 카테고리는 18종이 넘는데 사이트 분류는 3개뿐이라 대부분의 글이 어느 탭에도 못 걸렸고,
       분류가 안 잡히면 아예 비공개로 들어와 안 보인 채 쌓였다.
       → 분류를 걷어내고 전체를 한 줄로 보여 준다. 걸러내는 건 검색어 하나뿐이다.
         블로그 카테고리(blogCategory)는 검색 대상으로 남겨 둬서 "여드름" 같은 말로 찾을 수 있다. */
    const visiblePosts = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        const matched = keyword
            ? posts.filter((post) =>
                  [post.title, post.excerpt, post.blogCategory].some((value) =>
                      (value ?? '').toLowerCase().includes(keyword),
                  ),
              )
            : posts;
        // 227편이 전부 브라우저에 들어와 있어서 정렬을 바꿔도 다시 불러올 필요가 없다
        return sortSkinColumnPosts(matched, order);
    }, [order, posts, query]);
    const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pagedPosts = visiblePosts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    useEffect(() => {
        if (isFirstPageRender.current) {
            isFirstPageRender.current = false;
            return;
        }
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [currentPage]);

    const pickOrder = (next: SkinColumnSortOrder) => {
        if (next === order) return;
        setOrder(next);
        setPage(1);
    };

    return (
        <div ref={listRef} className="container-site relative scroll-mt-24 py-20 md:py-28 lg:py-36">
            <div className="text-center">
                <p className="font-display text-small tracking-[0.18em] text-latte">SKIN COLUMN</p>
                <h1 className="mt-3 text-h2 font-bold tracking-tight text-cocoa">{t('title')}</h1>
                <p className="mx-auto mt-4 max-w-2xl text-small leading-7 text-latte">{t('subtitle')}</p>
            </div>

            <form
                className="mx-auto mt-10 flex w-full max-w-xl gap-2 md:mt-14"
                onSubmit={(event) => {
                    event.preventDefault();
                    setQuery(searchInput.trim());
                    setPage(1);
                }}
            >
                <label className="min-w-0 flex-1">
                    <span className="sr-only">{t('search')}</span>
                    <input
                        type="search"
                        value={searchInput}
                        onChange={(event) => setSearchInput(event.target.value)}
                        placeholder={t('searchPlaceholder')}
                        className="w-full rounded-full border border-cocoa/15 bg-cream px-5 py-3 text-small text-cocoa outline-none placeholder:text-latte/50 focus:border-cocoa/40"
                    />
                </label>
                <button
                    type="submit"
                    className="shrink-0 rounded-full bg-cocoa px-5 py-3 text-caption font-semibold text-cream transition-colors hover:bg-deep"
                >
                    {t('searchButton')}
                </button>
            </form>

            {loading ? (
                <ColumnMessage message={t('loading')} />
            ) : error ? (
                <ColumnMessage message={error} error />
            ) : visiblePosts.length === 0 ? (
                <ColumnMessage message={query ? t('emptySearch') : t('empty')} />
            ) : (
                <>
                    <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
                        <p className="text-caption text-latte">{t('resultCount', { count: visiblePosts.length })}</p>
                        <div className="flex gap-1.5" role="group" aria-label={t('sortAria')}>
                            <SortButton
                                active={order === 'newest'}
                                label={t('sortNewest')}
                                onClick={() => pickOrder('newest')}
                            />
                            <SortButton
                                active={order === 'oldest'}
                                label={t('sortOldest')}
                                onClick={() => pickOrder('oldest')}
                            />
                        </div>
                    </div>

                    <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-10 lg:grid-cols-3">
                        {pagedPosts.map((post) => (
                            <ColumnCard key={post.docId} post={post} />
                        ))}
                    </div>
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onChange={setPage}
                        label={t('pagination')}
                        prevLabel={t('prevPage')}
                        nextLabel={t('nextPage')}
                    />
                </>
            )}
        </div>
    );
}

function SortButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={`rounded-full border px-4 py-1.5 text-caption font-semibold transition-colors ${
                active
                    ? 'border-cocoa bg-cocoa text-cream'
                    : 'border-cocoa/15 bg-cream/80 text-latte hover:border-cocoa/35 hover:text-cocoa'
            }`}
        >
            {label}
        </button>
    );
}

function ColumnCard({ post: rawPost }: { post: SkinColumnPostItem }) {
    const t = useTranslations('column');
    const { post } = useLocalizedColumnPost(rawPost);
    if (!post) return null;

    const blogUrl = getSkinColumnBlogUrl(post);
    const className =
        'group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-cream shadow-[0_8px_30px_rgba(69,54,45,0.08)] transition-transform duration-300 hover:-translate-y-1';

    const inner = (
        <>
            <ColumnThumbnail post={post} />
            <div className="flex flex-1 flex-col p-5 md:p-6">
                {/* 분류 알약을 걷어낸 자리 — 날짜만 남긴다 */}
                <div className="flex items-center justify-end gap-3 text-caption-sm text-latte">
                    <time dateTime={post.publishedAt}>{new Date(post.publishedAt).toLocaleDateString('ko-KR')}</time>
                </div>
                <h2 className="clamp-2 mt-4 text-lead font-bold leading-snug text-cocoa">{post.title}</h2>
                {post.excerpt ? <p className="clamp-2 mt-3 text-caption leading-6 text-latte">{post.excerpt}</p> : null}
                <span className="mt-auto pt-6 text-caption font-semibold text-cocoa">
                    {blogUrl ? t('openBlog') : t('readMore')} <span aria-hidden>→</span>
                </span>
            </div>
        </>
    );

    if (blogUrl) {
        return (
            <a href={blogUrl} target="_blank" rel="noopener noreferrer" className={className}>
                {inner}
            </a>
        );
    }

    return (
        <Link href={`/column/${post.docId}`} className={className}>
            {inner}
        </Link>
    );
}

function ColumnThumbnail({ post }: { post: SkinColumnPostItem }) {
    if (isHostedColumnThumbnail(post.thumbnailUrl) && post.thumbnailUrl) {
        return (
            <div className="relative aspect-[16/10] overflow-hidden bg-sand/35">
                <Image
                    src={post.thumbnailUrl}
                    alt=""
                    fill
                    unoptimized
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
            </div>
        );
    }

    return (
        <div className="relative flex aspect-[16/10] items-center justify-center overflow-hidden bg-sand/35">
            <span className="font-display text-h3 tracking-[0.08em] text-latte/40 transition-transform duration-500 group-hover:scale-[1.04]">
                RE:BERRY
            </span>
        </div>
    );
}

function ColumnMessage({ message, error = false }: { message: string; error?: boolean }) {
    return (
        <div
            role={error ? 'alert' : 'status'}
            className={`mt-12 rounded-2xl border px-6 py-20 text-center text-small ${
                error ? 'border-red-200 bg-red-50 text-red-700' : 'border-cocoa/10 bg-cream/70 text-latte'
            }`}
        >
            {message}
        </div>
    );
}

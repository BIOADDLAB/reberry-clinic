'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SIGNATURE_PAGES } from '@/components/lib/adminConfig';
import {
    getSkinColumnBlogUrl,
    isHostedColumnThumbnail,
    subscribePublishedSkinColumnPosts,
    type SkinColumnPostItem,
} from '@/components/lib/skinColumnPosts';
import { useLocalizedColumnPost } from '@/components/lib/useColumnTranslation';
import T from '@/components/lang/T';

const PER_PAGE = 6;

type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis';

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    if (currentPage <= 4) {
        return [1, 2, 3, 4, 5, 'end-ellipsis', totalPages];
    }

    if (currentPage >= totalPages - 3) {
        return [1, 'start-ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, 'start-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'end-ellipsis', totalPages];
}

export default function SkinColumnList() {
    const t = useTranslations('column');
    const [posts, setPosts] = useState<SkinColumnPostItem[]>([]);
    const [searchInput, setSearchInput] = useState('');
    const [query, setQuery] = useState('');
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

    const visiblePosts = useMemo(() => {
        const keyword = query.trim().toLowerCase();
        if (!keyword) return posts;

        return posts.filter((post) => {
            const categoryLabel = SIGNATURE_PAGES.find((category) => category.slug === post.categorySlug)?.label ?? '';
            return [post.title, post.excerpt, post.blogCategory, categoryLabel].some((value) =>
                (value ?? '').toLowerCase().includes(keyword),
            );
        });
    }, [posts, query]);
    const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pagedPosts = visiblePosts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);
    const paginationItems = getPaginationItems(currentPage, totalPages);

    useEffect(() => {
        if (isFirstPageRender.current) {
            isFirstPageRender.current = false;
            return;
        }
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [currentPage]);

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
                    <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
                        {pagedPosts.map((post) => (
                            <ColumnCard key={post.docId} post={post} />
                        ))}
                    </div>
                    {totalPages > 1 ? (
                        <nav
                            className="mt-14 flex items-center justify-center gap-0.5 sm:gap-2"
                            aria-label={t('pagination')}
                        >
                            <button
                                type="button"
                                onClick={() => setPage(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cocoa/15 bg-cream text-cocoa transition-colors hover:border-cocoa/35 hover:bg-sand/25 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
                                aria-label={t('prevPage')}
                            >
                                <svg
                                    className="h-[18px] w-[18px]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                            {paginationItems.map((item) => {
                                if (typeof item !== 'number') {
                                    return (
                                        <span
                                            key={item}
                                            aria-hidden="true"
                                            className="inline-flex h-8 min-w-4 items-center justify-center text-caption-sm text-latte sm:h-10 sm:min-w-6 sm:text-caption"
                                        >
                                            …
                                        </span>
                                    );
                                }

                                const active = item === currentPage;
                                return (
                                    <button
                                        key={item}
                                        type="button"
                                        onClick={() => setPage(item)}
                                        aria-current={active ? 'page' : undefined}
                                        className={`notranslate inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-caption-sm font-semibold transition-colors sm:h-10 sm:min-w-10 sm:px-2 sm:text-caption ${
                                            active
                                                ? 'bg-cocoa text-cream'
                                                : 'border border-cocoa/15 bg-cream text-latte hover:border-cocoa/35 hover:bg-sand/25 hover:text-cocoa'
                                        }`}
                                    >
                                        {item}
                                    </button>
                                );
                            })}
                            <button
                                type="button"
                                onClick={() => setPage(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cocoa/15 bg-cream text-cocoa transition-colors hover:border-cocoa/35 hover:bg-sand/25 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
                                aria-label={t('nextPage')}
                            >
                                <svg
                                    className="h-[18px] w-[18px]"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 5l7 7-7 7"
                                    />
                                </svg>
                            </button>
                        </nav>
                    ) : null}
                </>
            )}
        </div>
    );
}

function ColumnCard({ post: rawPost }: { post: SkinColumnPostItem }) {
    const t = useTranslations('column');
    const { post } = useLocalizedColumnPost(rawPost);
    if (!post) return null;

    const categoryLabel = SIGNATURE_PAGES.find((category) => category.slug === post.categorySlug)?.label;
    const blogUrl = getSkinColumnBlogUrl(post);
    const className =
        'group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-cream shadow-[0_8px_30px_rgba(69,54,45,0.08)] transition-transform duration-300 hover:-translate-y-1';

    const inner = (
        <>
            <ColumnThumbnail post={post} />
            <div className="flex flex-1 flex-col p-5 md:p-6">
                <div className="flex items-center justify-between gap-3 text-caption-sm text-latte">
                    <span className="rounded-full bg-sand/25 px-2.5 py-1 font-semibold text-cocoa">
                        {categoryLabel ? <T ko={categoryLabel} /> : t('fallbackCategoryLabel')}
                    </span>
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

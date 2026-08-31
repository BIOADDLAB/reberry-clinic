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

export default function SkinColumnList() {
    const t = useTranslations('column');
    const [posts, setPosts] = useState<SkinColumnPostItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
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
        return posts.filter((post) => {
            if (activeCategory !== 'all' && post.categorySlug !== activeCategory) return false;
            if (!keyword) return true;

            const categoryLabel =
                SIGNATURE_PAGES.find((category) => category.slug === post.categorySlug)?.label ?? '';
            return [post.title, post.excerpt, post.blogCategory, categoryLabel].some((value) =>
                (value ?? '').toLowerCase().includes(keyword),
            );
        });
    }, [activeCategory, posts, query]);
    const totalPages = Math.max(1, Math.ceil(visiblePosts.length / PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pagedPosts = visiblePosts.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

    useEffect(() => {
        if (isFirstPageRender.current) {
            isFirstPageRender.current = false;
            return;
        }
        listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [currentPage, activeCategory]);

    const pickCategory = (slug: string) => {
        if (slug === activeCategory) return;
        setActiveCategory(slug);
        setPage(1);
    };

    return (
        <div ref={listRef} className="container-site relative scroll-mt-24 py-20 md:py-28 lg:py-36">
            <div className="text-center">
                <p className="font-display text-small tracking-[0.18em] text-latte">SKIN COLUMN</p>
                <h1 className="mt-3 text-h2 font-bold tracking-tight text-cocoa">{t('title')}</h1>
                <p className="mx-auto mt-4 max-w-2xl text-small leading-7 text-latte">{t('subtitle')}</p>
            </div>

            <nav aria-label={t('categoryNavAria')} className="mt-10 flex flex-wrap justify-center gap-2 md:mt-14">
                <FilterButton active={activeCategory === 'all'} label={t('allFilter')} onClick={() => pickCategory('all')} />
                {SIGNATURE_PAGES.map((category) => (
                    <FilterButton
                        key={category.slug}
                        active={activeCategory === category.slug}
                        label={<T ko={category.label} />}
                        onClick={() => pickCategory(category.slug)}
                    />
                ))}
            </nav>

            <form
                className="mx-auto mt-8 flex w-full max-w-xl gap-2"
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
                        <nav className="mt-14 flex items-center justify-center gap-6" aria-label={t('pagination')}>
                            <button
                                type="button"
                                onClick={() => setPage((current) => Math.max(1, current - 1))}
                                disabled={currentPage === 1}
                                className="mt-1 text-cocoa/60 transition-colors hover:text-cocoa disabled:opacity-30"
                                aria-label={t('prevPage')}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 19l-7-7 7-7"
                                    />
                                </svg>
                            </button>
                            <span className="notranslate font-display text-lead tracking-[0.15em] text-cocoa">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                type="button"
                                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                                disabled={currentPage === totalPages}
                                className="mt-1 text-cocoa/60 transition-colors hover:text-cocoa disabled:opacity-30"
                                aria-label={t('nextPage')}
                            >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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

function FilterButton({
    active,
    label,
    onClick,
}: {
    active: boolean;
    label: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-pressed={active}
            onClick={onClick}
            className={`rounded-full border px-4 py-2 text-caption font-semibold transition-colors md:px-5 ${
                active
                    ? 'border-cocoa bg-cocoa text-cream'
                    : 'border-cocoa/15 bg-cream/80 text-latte hover:border-cocoa/35 hover:text-cocoa'
            }`}
        >
            {label}
        </button>
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

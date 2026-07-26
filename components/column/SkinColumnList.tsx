'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SIGNATURE_PAGES } from '@/components/lib/adminConfig';
import {
    subscribePublishedSkinColumnPosts,
    type SkinColumnPostItem,
} from '@/components/lib/skinColumnPosts';
import { useLocalizedColumnPost } from '@/components/lib/useColumnTranslation';
import T from '@/components/lang/T';

export default function SkinColumnList() {
    const t = useTranslations('column');
    const [posts, setPosts] = useState<SkinColumnPostItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const visiblePosts = useMemo(
        () => (activeCategory === 'all' ? posts : posts.filter((post) => post.categorySlug === activeCategory)),
        [activeCategory, posts],
    );

    return (
        <div className="container-site relative py-20 md:py-28 lg:py-36">
            <div className="text-center">
                <p className="font-display text-small tracking-[0.18em] text-latte">SKIN COLUMN</p>
                <h1 className="mt-3 text-h2 font-bold tracking-tight text-cocoa">{t('title')}</h1>
                <p className="mx-auto mt-4 max-w-2xl text-small leading-7 text-latte">{t('subtitle')}</p>
            </div>

            <nav aria-label={t('categoryNavAria')} className="mt-10 flex flex-wrap justify-center gap-2 md:mt-14">
                <FilterButton active={activeCategory === 'all'} label={t('allFilter')} onClick={() => setActiveCategory('all')} />
                {SIGNATURE_PAGES.map((category) => (
                    <FilterButton
                        key={category.slug}
                        active={activeCategory === category.slug}
                        label={<T ko={category.label} />}
                        onClick={() => setActiveCategory(category.slug)}
                    />
                ))}
            </nav>

            {loading ? (
                <ColumnMessage message={t('loading')} />
            ) : error ? (
                <ColumnMessage message={error} error />
            ) : visiblePosts.length === 0 ? (
                <ColumnMessage message={t('empty')} />
            ) : (
                <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
                    {visiblePosts.map((post) => (
                        <ColumnCard key={post.docId} post={post} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ColumnCard({ post: rawPost }: { post: SkinColumnPostItem }) {
    const t = useTranslations('column');
    const { post } = useLocalizedColumnPost(rawPost);
    if (!post) return null;

    const categoryLabel = SIGNATURE_PAGES.find((category) => category.slug === post.categorySlug)?.label;

    return (
        <Link
            href={`/column/${post.docId}`}
            className="group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-cream shadow-[0_8px_30px_rgba(69,54,45,0.08)] transition-transform duration-300 hover:-translate-y-1"
        >
            <div className="relative aspect-[16/10] overflow-hidden bg-sand/30">
                {post.thumbnailUrl ? (
                    <Image
                        src={post.thumbnailUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center font-display text-h3 text-latte/40">RE:BERRY</div>
                )}
            </div>
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
                    {t('readMore')} <span aria-hidden>→</span>
                </span>
            </div>
        </Link>
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

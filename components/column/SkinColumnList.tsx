'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SIGNATURE_PAGES } from '@/components/lib/adminConfig';
import {
    subscribePublishedSkinColumnPosts,
    type SkinColumnPostItem,
} from '@/components/lib/skinColumnPosts';

export default function SkinColumnList() {
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
                    setError('피부칼럼을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
                    setLoading(false);
                },
            ),
        [],
    );

    const visiblePosts = useMemo(
        () => (activeCategory === 'all' ? posts : posts.filter((post) => post.categorySlug === activeCategory)),
        [activeCategory, posts],
    );
    const categoryLabelBySlug = useMemo(
        () => new Map<string, string>(SIGNATURE_PAGES.map((category) => [category.slug, category.label])),
        [],
    );

    return (
        <div className="container-site relative py-20 md:py-28 lg:py-36">
            <div className="text-center">
                <p className="font-display text-small tracking-[0.18em] text-latte">SKIN COLUMN</p>
                <h1 className="mt-3 text-h2 font-bold tracking-tight text-cocoa">닥터파이톤의 피부칼럼</h1>
                <p className="mx-auto mt-4 max-w-2xl text-small leading-7 text-latte">
                    건강한 피부를 위한 정확한 정보와 리베리의 진료 원칙을 전합니다.
                </p>
            </div>

            <nav aria-label="피부칼럼 카테고리" className="mt-10 flex flex-wrap justify-center gap-2 md:mt-14">
                <FilterButton
                    active={activeCategory === 'all'}
                    label="전체"
                    onClick={() => setActiveCategory('all')}
                />
                {SIGNATURE_PAGES.map((category) => (
                    <FilterButton
                        key={category.slug}
                        active={activeCategory === category.slug}
                        label={category.label}
                        onClick={() => setActiveCategory(category.slug)}
                    />
                ))}
            </nav>

            {loading ? (
                <ColumnMessage message="피부칼럼을 불러오는 중입니다." />
            ) : error ? (
                <ColumnMessage message={error} error />
            ) : visiblePosts.length === 0 ? (
                <ColumnMessage message="등록된 피부칼럼이 없습니다." />
            ) : (
                <div className="mt-12 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:mt-16 lg:grid-cols-3">
                    {visiblePosts.map((post) => (
                        <Link
                            key={post.docId}
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
                                    <div className="flex h-full items-center justify-center font-display text-h3 text-latte/40">
                                        RE:BERRY
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-1 flex-col p-5 md:p-6">
                                <div className="flex items-center justify-between gap-3 text-caption-sm text-latte">
                                    <span className="rounded-full bg-sand/25 px-2.5 py-1 font-semibold text-cocoa">
                                        {categoryLabelBySlug.get(post.categorySlug) ?? '피부칼럼'}
                                    </span>
                                    <time dateTime={post.publishedAt}>
                                        {new Date(post.publishedAt).toLocaleDateString('ko-KR')}
                                    </time>
                                </div>
                                <h2 className="clamp-2 mt-4 text-lead font-bold leading-snug text-cocoa">
                                    {post.title}
                                </h2>
                                {post.excerpt ? (
                                    <p className="clamp-2 mt-3 text-caption leading-6 text-latte">{post.excerpt}</p>
                                ) : null}
                                <span className="mt-auto pt-6 text-caption font-semibold text-cocoa">
                                    자세히 보기 <span aria-hidden>→</span>
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterButton({
    active,
    label,
    onClick,
}: {
    active: boolean;
    label: string;
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

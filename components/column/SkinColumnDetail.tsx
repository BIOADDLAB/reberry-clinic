'use client';

import DOMPurify from 'dompurify';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { SIGNATURE_PAGES } from '@/components/lib/adminConfig';
import {
    fetchPublishedSkinColumnPost,
    getSkinColumnBlogUrl,
    isHostedColumnThumbnail,
    isNaverBlogColumnPost,
    type SkinColumnPostItem,
} from '@/components/lib/skinColumnPosts';
import { useLocalizedColumnPost } from '@/components/lib/useColumnTranslation';
import T from '@/components/lang/T';

export default function SkinColumnDetail({ docId }: { docId: string }) {
    const t = useTranslations('column');
    const [rawPost, setRawPost] = useState<SkinColumnPostItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        fetchPublishedSkinColumnPost(docId)
            .then((nextPost) => {
                if (!active) return;
                setRawPost(nextPost);
                if (!nextPost) setError(t('notFound'));
            })
            .catch(() => {
                if (active) setError(t('loadError'));
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [docId]);

    const { post } = useLocalizedColumnPost(rawPost);

    const sanitizedHtml = useMemo(() => {
        if (!post) return '';
        return DOMPurify.sanitize(post.contentHtml, {
            ADD_ATTR: ['target'],
            ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
        });
    }, [post]);

    const categoryLabel = useMemo(
        () => SIGNATURE_PAGES.find((category) => category.slug === post?.categorySlug)?.label,
        [post?.categorySlug],
    );
    const youtubeEmbedUrl = useMemo(() => getYoutubeEmbedUrl(post?.youtubeUrl), [post?.youtubeUrl]);
    const isBlogPost = Boolean(post && isNaverBlogColumnPost(post));
    const blogUrl = post ? getSkinColumnBlogUrl(post) : null;
    const thumbnailUrl = post && isHostedColumnThumbnail(post.thumbnailUrl) ? post.thumbnailUrl : undefined;

    if (loading) return <DetailMessage message={t('loading')} />;
    if (!post || error) return <DetailMessage message={error ?? t('notFoundGeneric')} error />;

    return (
        <article className="container-site py-16 md:py-24 lg:py-28">
            <div className="mx-auto max-w-4xl">
                <Link href="/column" className="text-caption font-semibold text-latte hover:text-cocoa">
                    {t('backToList')}
                </Link>

                <header className="mt-8 border-b border-cocoa/10 pb-8 text-center md:pb-12">
                    <span className="inline-flex rounded-full bg-sand/25 px-3 py-1 text-caption font-semibold text-cocoa">
                        {categoryLabel ? <T ko={categoryLabel} /> : t('fallbackCategoryLabel')}
                    </span>
                    <h1 className="mt-5 text-h2 font-bold leading-tight tracking-tight text-cocoa">{post.title}</h1>
                    {post.excerpt ? (
                        <p className="mx-auto mt-5 max-w-2xl text-small leading-7 text-latte">{post.excerpt}</p>
                    ) : null}
                    <time dateTime={post.publishedAt} className="mt-5 block text-caption text-latte/80">
                        {new Date(post.publishedAt).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </time>
                </header>

                {thumbnailUrl ? (
                    <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-sand/20 md:mt-14">
                        <Image
                            src={thumbnailUrl}
                            alt=""
                            fill
                            priority
                            unoptimized
                            sizes="(max-width: 896px) 100vw, 896px"
                            className="object-cover"
                        />
                    </div>
                ) : null}

                {youtubeEmbedUrl ? (
                    <div className="mt-10 aspect-video overflow-hidden rounded-2xl bg-black md:mt-14">
                        <iframe
                            src={youtubeEmbedUrl}
                            title={t('videoTitle', { title: post.title })}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="size-full border-0"
                        />
                    </div>
                ) : null}

                {isBlogPost && blogUrl ? (
                    <div className="mt-10 rounded-2xl border border-cocoa/10 bg-cream px-6 py-8 text-center md:mt-14">
                        <p className="text-small leading-7 text-latte">{t('blogRedirectHint')}</p>
                        <a
                            href={blogUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 inline-flex rounded-full bg-cocoa px-6 py-2.5 text-caption font-semibold text-cream transition-colors hover:bg-deep"
                        >
                            {t('openBlog')}
                        </a>
                    </div>
                ) : (
                    <div
                        className="skin-column-editor-content ProseMirror mt-10 text-small md:mt-14"
                        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                    />
                )}

                <div className="mt-14 border-t border-cocoa/10 pt-8 text-center md:mt-20">
                    <Link
                        href="/column"
                        className="inline-flex rounded-full border border-cocoa/20 px-6 py-2.5 text-caption font-semibold text-cocoa transition-colors hover:bg-cocoa hover:text-cream"
                    >
                        {t('backToListButton')}
                    </Link>
                </div>
            </div>
        </article>
    );
}

function DetailMessage({ message, error = false }: { message: string; error?: boolean }) {
    const t = useTranslations('column');
    return (
        <div className="container-site py-24 md:py-36">
            <div
                role={error ? 'alert' : 'status'}
                className={`mx-auto max-w-3xl rounded-2xl border px-6 py-20 text-center text-small ${
                    error ? 'border-red-200 bg-red-50 text-red-700' : 'border-cocoa/10 bg-cream text-latte'
                }`}
            >
                <p>{message}</p>
                {error ? (
                    <Link href="/column" className="mt-5 inline-block font-semibold text-cocoa underline">
                        {t('backToList')}
                    </Link>
                ) : null}
            </div>
        </div>
    );
}

function getYoutubeEmbedUrl(value?: string): string | null {
    if (!value) return null;

    try {
        const url = new URL(value);
        const hostname = url.hostname.replace(/^www\./, '');
        let videoId = '';

        if (hostname === 'youtu.be') {
            videoId = url.pathname.split('/').filter(Boolean)[0] ?? '';
        } else if (hostname === 'youtube.com' || hostname === 'm.youtube.com') {
            if (url.pathname === '/watch') videoId = url.searchParams.get('v') ?? '';
            if (url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')) {
                videoId = url.pathname.split('/').filter(Boolean)[1] ?? '';
            }
        }

        return /^[\w-]{6,}$/.test(videoId) ? `https://www.youtube-nocookie.com/embed/${videoId}` : null;
    } catch {
        return null;
    }
}

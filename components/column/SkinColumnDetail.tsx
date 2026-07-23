'use client';

import DOMPurify from 'dompurify';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { SIGNATURE_PAGES } from '@/components/lib/adminConfig';
import {
    fetchPublishedSkinColumnPost,
    type SkinColumnPostItem,
} from '@/components/lib/skinColumnPosts';

export default function SkinColumnDetail({ docId }: { docId: string }) {
    const [post, setPost] = useState<SkinColumnPostItem | null>(null);
    const [sanitizedHtml, setSanitizedHtml] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        fetchPublishedSkinColumnPost(docId)
            .then((nextPost) => {
                if (!active) return;
                setPost(nextPost);
                if (nextPost) {
                    setSanitizedHtml(
                        DOMPurify.sanitize(nextPost.contentHtml, {
                            ADD_ATTR: ['target'],
                            ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.-:]|$))/i,
                        }),
                    );
                } else {
                    setError('존재하지 않거나 공개되지 않은 피부칼럼입니다.');
                }
            })
            .catch(() => {
                if (active) setError('피부칼럼을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
            })
            .finally(() => {
                if (active) setLoading(false);
            });

        return () => {
            active = false;
        };
    }, [docId]);

    const categoryLabel = useMemo(
        () => SIGNATURE_PAGES.find((category) => category.slug === post?.categorySlug)?.label ?? '피부칼럼',
        [post?.categorySlug],
    );
    const youtubeEmbedUrl = useMemo(() => getYoutubeEmbedUrl(post?.youtubeUrl), [post?.youtubeUrl]);

    if (loading) return <DetailMessage message="피부칼럼을 불러오는 중입니다." />;
    if (!post || error) return <DetailMessage message={error ?? '피부칼럼을 찾을 수 없습니다.'} error />;

    return (
        <article className="container-site py-16 md:py-24 lg:py-28">
            <div className="mx-auto max-w-4xl">
                <Link href="/column" className="text-caption font-semibold text-latte hover:text-cocoa">
                    ← 피부칼럼 목록
                </Link>

                <header className="mt-8 border-b border-cocoa/10 pb-8 text-center md:pb-12">
                    <span className="inline-flex rounded-full bg-sand/25 px-3 py-1 text-caption font-semibold text-cocoa">
                        {categoryLabel}
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

                {post.thumbnailUrl ? (
                    <div className="relative mt-10 aspect-[16/9] overflow-hidden rounded-2xl bg-sand/20 md:mt-14">
                        <Image
                            src={post.thumbnailUrl}
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
                            title={`${post.title} 영상`}
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="size-full border-0"
                        />
                    </div>
                ) : null}

                <div
                    className="skin-column-editor-content ProseMirror mt-10 text-small md:mt-14"
                    dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
                />

                <div className="mt-14 border-t border-cocoa/10 pt-8 text-center md:mt-20">
                    <Link
                        href="/column"
                        className="inline-flex rounded-full border border-cocoa/20 px-6 py-2.5 text-caption font-semibold text-cocoa transition-colors hover:bg-cocoa hover:text-cream"
                    >
                        목록으로 돌아가기
                    </Link>
                </div>
            </div>
        </article>
    );
}

function DetailMessage({ message, error = false }: { message: string; error?: boolean }) {
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
                        피부칼럼 목록으로
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

'use client';

import {
    closestCenter,
    DndContext,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove, rectSortingStrategy, SortableContext, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Image from 'next/image';
import { useEffect, useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
import { SIGNATURE_PAGES } from '@/components/lib/adminConfig';
import {
    createSkinColumnPost,
    deleteSkinColumnPost,
    isHostedColumnThumbnail,
    isNaverBlogColumnPost,
    patchSkinColumnPost,
    subscribeSkinColumnPosts,
    updateSkinColumnPost,
    updateSkinColumnPostSorts,
    type SkinColumnPostInput,
    type SkinColumnPostItem,
} from '@/components/lib/skinColumnPosts';
import { uploadImage } from '@/components/lib/storageUpload';
import SkinColumnBlogImportPanel from './SkinColumnBlogImportPanel';
import SkinColumnRichEditor from './SkinColumnRichEditor';

const inputClass =
    'w-full rounded-xl border border-cocoa/15 bg-white px-3.5 py-2.5 text-small text-cocoa outline-none placeholder:text-latte/60 focus:border-cocoa/40 disabled:cursor-not-allowed disabled:bg-cocoa/[0.03]';
const labelClass = 'mb-1.5 block text-caption font-semibold text-cocoa';

const isContentEmpty = (html: string) => {
    if (/<img\b/i.test(html)) return false;
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim().length === 0;
};

const toDateTimeLocal = (iso?: string) => {
    const date = iso ? new Date(iso) : new Date();
    if (Number.isNaN(date.getTime())) return '';
    return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

const validateYoutubeUrl = (value: string) => {
    if (!value.trim()) return true;
    try {
        const url = new URL(value);
        const hostname = url.hostname.replace(/^www\./, '');
        return ['youtube.com', 'm.youtube.com', 'youtu.be'].includes(hostname);
    } catch {
        return false;
    }
};

function SortablePostCard({
    post,
    disabled,
    children,
}: {
    post: SkinColumnPostItem;
    disabled: boolean;
    children: ReactNode;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: post.docId,
        disabled,
    });
    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        position: 'relative',
        zIndex: isDragging ? 10 : undefined,
    };

    return (
        <article
            ref={setNodeRef}
            style={style}
            className={`group flex min-w-0 flex-col overflow-hidden rounded-xl border border-cocoa/10 bg-white transition-shadow hover:shadow-md ${
                isDragging ? 'shadow-lg ring-1 ring-cocoa/30' : ''
            }`}
        >
            <button
                type="button"
                aria-label={`${post.title || '피부칼럼'} 순서 변경`}
                disabled={disabled}
                className="absolute right-2 top-2 z-10 flex size-8 touch-none cursor-grab items-center justify-center rounded-full bg-white/95 text-cocoa shadow-sm hover:bg-[#F5F2EC] active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-50"
                {...attributes}
                {...listeners}
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
                    <circle cx="5" cy="4" r="1.35" />
                    <circle cx="11" cy="4" r="1.35" />
                    <circle cx="5" cy="8" r="1.35" />
                    <circle cx="11" cy="8" r="1.35" />
                    <circle cx="5" cy="12" r="1.35" />
                    <circle cx="11" cy="12" r="1.35" />
                </svg>
            </button>
            {children}
        </article>
    );
}

export default function SkinColumnPostManager() {
    const [posts, setPosts] = useState<SkinColumnPostItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState<SkinColumnPostItem | null>(null);
    const [saving, setSaving] = useState(false);
    const [formUploading, setFormUploading] = useState(false);
    const [reorderSaving, setReorderSaving] = useState(false);
    const [activeCategory, setActiveCategory] = useState('all');
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

    useEffect(
        () =>
            subscribeSkinColumnPosts(
                (nextPosts) => {
                    setPosts(nextPosts);
                    setLoading(false);
                },
                (subscriptionError) => {
                    setError(subscriptionError.message || '피부칼럼 목록을 불러오지 못했습니다.');
                    setLoading(false);
                },
            ),
        [],
    );

    const categoryLabelBySlug = useMemo(
        () => new Map<string, string>(SIGNATURE_PAGES.map((category) => [category.slug, category.label])),
        [],
    );
    const visiblePosts = useMemo(() => {
        if (activeCategory === 'all') return posts;
        if (activeCategory === 'unmapped') {
            return posts.filter((post) => post.source === 'naver-blog' && !post.categorySlug);
        }
        return posts.filter((post) => post.categorySlug === activeCategory);
    }, [activeCategory, posts]);
    const unmappedCount = useMemo(
        () => posts.filter((post) => post.source === 'naver-blog' && !post.categorySlug).length,
        [posts],
    );

    const handleCreate = async (input: SkinColumnPostInput) => {
        setSaving(true);
        setError(null);
        try {
            await createSkinColumnPost(input);
            setShowForm(false);
        } catch (createError) {
            setError(createError instanceof Error ? createError.message : '피부칼럼 등록에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdate = async (docId: string, input: SkinColumnPostInput) => {
        setSaving(true);
        setError(null);
        try {
            await updateSkinColumnPost(docId, input);
            setEditing(null);
        } catch (updateError) {
            setError(updateError instanceof Error ? updateError.message : '피부칼럼 수정에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (post: SkinColumnPostItem) => {
        if (!window.confirm(`"${post.title}" 피부칼럼을 삭제할까요?`)) return;
        setSaving(true);
        setError(null);
        try {
            await deleteSkinColumnPost(post.docId);
            if (editing?.docId === post.docId) setEditing(null);
        } catch (deleteError) {
            setError(deleteError instanceof Error ? deleteError.message : '피부칼럼 삭제에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleAssignCategory = async (post: SkinColumnPostItem, categorySlug: string) => {
        setSaving(true);
        setError(null);
        try {
            await patchSkinColumnPost(post.docId, {
                categorySlug,
                isPublished: Boolean(categorySlug),
            });
        } catch (assignError) {
            setError(assignError instanceof Error ? assignError.message : '카테고리 지정에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleTogglePublished = async (post: SkinColumnPostItem) => {
        if (!post.categorySlug && !post.isPublished) {
            setError('공개하려면 먼저 카테고리를 지정해 주세요.');
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await patchSkinColumnPost(post.docId, { isPublished: !post.isPublished });
        } catch (toggleError) {
            setError(toggleError instanceof Error ? toggleError.message : '공개 상태 변경에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id || reorderSaving) return;
        const oldIndex = visiblePosts.findIndex((post) => post.docId === String(active.id));
        const newIndex = visiblePosts.findIndex((post) => post.docId === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const previousPosts = posts;
        const movedVisiblePosts = arrayMove(visiblePosts, oldIndex, newIndex);
        const visibleIds = new Set(movedVisiblePosts.map((post) => post.docId));
        let visibleIndex = 0;
        const sortedPosts = posts
            .map((post) => (visibleIds.has(post.docId) ? movedVisiblePosts[visibleIndex++] : post))
            .map((post, sort) => ({ ...post, sort }));

        setPosts(sortedPosts);
        setReorderSaving(true);
        setError(null);
        try {
            await updateSkinColumnPostSorts(sortedPosts.map(({ docId, sort }) => ({ docId, sort })));
        } catch (sortError) {
            setPosts(previousPosts);
            setError(sortError instanceof Error ? sortError.message : '노출 순서 저장에 실패했습니다.');
        } finally {
            setReorderSaving(false);
        }
    };

    const closeForm = () => {
        setFormUploading(false);
        setShowForm(false);
        setEditing(null);
    };

    return (
        <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-h2 font-bold text-cocoa">피부칼럼 관리</h1>
                    <p className="mt-1 text-small text-latte">
                        네이버 블로그 글을 가져와 공개하고, 직접 작성한 글도 함께 관리합니다.
                    </p>
                </div>
                <button
                    type="button"
                    disabled={saving || formUploading}
                    onClick={() => {
                        setEditing(null);
                        setShowForm((current) => !current);
                    }}
                    className="rounded-full bg-cocoa px-5 py-2.5 text-small font-semibold text-cream transition-colors hover:bg-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {showForm ? '작성 취소' : '+ 피부칼럼 작성'}
                </button>
            </div>

            {error ? (
                <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-caption text-red-700">
                    {error}
                </div>
            ) : null}

            <SkinColumnBlogImportPanel posts={posts} onError={setError} />

            {showForm || editing ? (
                <SkinColumnPostForm
                    key={editing?.docId ?? 'new'}
                    initial={editing ?? undefined}
                    saving={saving}
                    onSave={editing ? (input) => handleUpdate(editing.docId, input) : handleCreate}
                    onCancel={closeForm}
                    onError={setError}
                    onUploadingChange={setFormUploading}
                />
            ) : null}

            <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)] md:p-7">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h2 className="text-lead font-bold text-cocoa">등록된 피부칼럼</h2>
                        <p className="mt-1 text-caption text-latte">
                            카테고리별로 확인하고 카드 우측 상단 핸들로 노출 순서를 변경할 수 있습니다.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        {reorderSaving ? (
                            <span className="rounded-full bg-cocoa px-3 py-1 text-caption-sm font-semibold text-cream">
                                순서 저장 중…
                            </span>
                        ) : null}
                        <span className="rounded-full bg-[#F5F2EC] px-3 py-1 text-caption-sm font-semibold text-latte">
                            총 {posts.length}개
                        </span>
                    </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                    <CategoryFilterButton
                        active={activeCategory === 'all'}
                        label="전체"
                        onClick={() => setActiveCategory('all')}
                    />
                    <CategoryFilterButton
                        active={activeCategory === 'unmapped'}
                        label={unmappedCount > 0 ? `분류 필요 (${unmappedCount})` : '분류 필요'}
                        onClick={() => setActiveCategory('unmapped')}
                    />
                    {SIGNATURE_PAGES.map((category) => (
                        <CategoryFilterButton
                            key={category.slug}
                            active={activeCategory === category.slug}
                            label={category.label}
                            onClick={() => setActiveCategory(category.slug)}
                        />
                    ))}
                </div>
            </section>

            {loading ? (
                <EmptyState message="피부칼럼 목록을 불러오는 중…" />
            ) : posts.length === 0 ? (
                <EmptyState message="등록된 피부칼럼이 없습니다. 블로그에서 글을 가져오거나 직접 작성하세요." />
            ) : visiblePosts.length === 0 ? (
                <EmptyState
                    message={
                        activeCategory === 'unmapped'
                            ? '분류가 필요한 블로그 글이 없습니다.'
                            : '선택한 카테고리에 등록된 피부칼럼이 없습니다.'
                    }
                />
            ) : (
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                    <SortableContext items={visiblePosts.map((post) => post.docId)} strategy={rectSortingStrategy}>
                        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                            {visiblePosts.map((post) => (
                                <SortablePostCard
                                    key={post.docId}
                                    post={post}
                                    disabled={saving || reorderSaving}
                                >
                                    <div className="relative aspect-video w-full overflow-hidden bg-[#E9E4DC]">
                                        {isHostedColumnThumbnail(post.thumbnailUrl) && post.thumbnailUrl ? (
                                            <Image
                                                src={post.thumbnailUrl}
                                                alt=""
                                                fill
                                                unoptimized
                                                sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                                                className="object-cover transition-transform group-hover:scale-[1.02]"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center font-display text-lead tracking-[0.08em] text-latte/40">
                                                RE:BERRY
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-1 flex-col p-4">
                                        <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                            {isNaverBlogColumnPost(post) ? (
                                                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-caption-sm font-semibold text-sky-800">
                                                    블로그
                                                </span>
                                            ) : null}
                                            <span className="rounded-full bg-[#F5F2EC] px-2 py-0.5 text-caption-sm font-semibold text-cocoa">
                                                {categoryLabelBySlug.get(post.categorySlug) ?? '카테고리 없음'}
                                            </span>
                                            <span
                                                className={`rounded-full px-2 py-0.5 text-caption-sm font-semibold ${
                                                    post.isPublished
                                                        ? 'bg-emerald-50 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                }`}
                                            >
                                                {post.isPublished ? '공개' : '비공개'}
                                            </span>
                                        </div>
                                        <h3 className="clamp-2 text-small font-semibold leading-snug text-cocoa">
                                            {post.title || '제목 없음'}
                                        </h3>
                                        {post.blogCategory ? (
                                            <p className="mt-1 text-caption-sm text-latte">원문 분류: {post.blogCategory}</p>
                                        ) : null}
                                        {post.excerpt ? (
                                            <p className="clamp-2 mt-2 text-caption leading-5 text-latte">
                                                {post.excerpt}
                                            </p>
                                        ) : null}
                                        <p className="mt-auto pt-4 text-caption-sm text-latte">
                                            {post.publishedAt
                                                ? new Date(post.publishedAt).toLocaleDateString('ko-KR')
                                                : '작성일 없음'}
                                        </p>
                                        <div className="mt-3 flex flex-col gap-2 border-t border-cocoa/10 pt-3">
                                            {isNaverBlogColumnPost(post) ? (
                                                <select
                                                    className="rounded-lg border border-cocoa/15 bg-white px-2.5 py-1.5 text-caption-sm text-cocoa outline-none disabled:opacity-40"
                                                    value={post.categorySlug}
                                                    disabled={saving || reorderSaving}
                                                    onChange={(event) =>
                                                        void handleAssignCategory(post, event.target.value)
                                                    }
                                                >
                                                    <option value="">분류 필요</option>
                                                    {SIGNATURE_PAGES.map((category) => (
                                                        <option key={category.slug} value={category.slug}>
                                                            {category.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : null}
                                            <div className="flex flex-wrap gap-2">
                                                {isNaverBlogColumnPost(post) ? (
                                                    <>
                                                        <button
                                                            type="button"
                                                            disabled={saving || reorderSaving}
                                                            onClick={() => void handleTogglePublished(post)}
                                                            className="rounded-full border border-cocoa/20 px-3 py-1.5 text-caption-sm font-semibold text-cocoa hover:bg-cocoa/5 disabled:opacity-40"
                                                        >
                                                            {post.isPublished ? '비공개' : '공개'}
                                                        </button>
                                                        {post.blogUrl ? (
                                                            <a
                                                                href={post.blogUrl}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="rounded-full border border-cocoa/20 px-3 py-1.5 text-caption-sm font-semibold text-cocoa hover:bg-cocoa/5"
                                                            >
                                                                원문
                                                            </a>
                                                        ) : null}
                                                    </>
                                                ) : (
                                                    <button
                                                        type="button"
                                                        disabled={saving || reorderSaving}
                                                        onClick={() => {
                                                            setShowForm(false);
                                                            setEditing(post);
                                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                                        }}
                                                        className="rounded-full border border-cocoa/20 px-3 py-1.5 text-caption-sm font-semibold text-cocoa hover:bg-cocoa/5 disabled:opacity-40"
                                                    >
                                                        수정
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    disabled={saving || reorderSaving}
                                                    onClick={() => void handleDelete(post)}
                                                    className="rounded-full border border-red-200 px-3 py-1.5 text-caption-sm font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                                                >
                                                    삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </SortablePostCard>
                            ))}
                        </div>
                    </SortableContext>
                </DndContext>
            )}
        </div>
    );
}

function CategoryFilterButton({
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
            onClick={onClick}
            className={`rounded-full px-3.5 py-1.5 text-caption font-semibold transition-colors ${
                active ? 'bg-cocoa text-cream' : 'bg-[#F5F2EC] text-latte hover:text-cocoa'
            }`}
        >
            {label}
        </button>
    );
}

function EmptyState({ message }: { message: string }) {
    return (
        <div className="mt-5 rounded-2xl border border-dashed border-cocoa/15 bg-white px-6 py-16 text-center text-small text-latte">
            {message}
        </div>
    );
}

function SkinColumnPostForm({
    initial,
    saving,
    onSave,
    onCancel,
    onError,
    onUploadingChange,
}: {
    initial?: SkinColumnPostItem;
    saving: boolean;
    onSave: (input: SkinColumnPostInput) => Promise<void>;
    onCancel: () => void;
    onError: (message: string | null) => void;
    onUploadingChange: (uploading: boolean) => void;
}) {
    const [categorySlug, setCategorySlug] = useState(initial?.categorySlug ?? SIGNATURE_PAGES[0].slug);
    const [title, setTitle] = useState(initial?.title ?? '');
    const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
    const [contentHtml, setContentHtml] = useState(initial?.contentHtml ?? '');
    const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '');
    const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? '');
    const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(initial?.publishedAt));
    const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingBodyImage, setUploadingBodyImage] = useState(false);

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onError(null);
        if (uploadingThumbnail || uploadingBodyImage) return onError('이미지 업로드가 끝난 뒤 저장하세요.');
        if (!title.trim()) return onError('제목을 입력하세요.');
        if (isContentEmpty(contentHtml)) return onError('본문을 입력하세요.');
        if (!validateYoutubeUrl(youtubeUrl)) return onError('올바른 YouTube 주소를 입력하세요.');
        if (!publishedAt || Number.isNaN(new Date(publishedAt).getTime())) return onError('작성일을 확인하세요.');

        await onSave({
            categorySlug,
            title: title.trim(),
            excerpt: excerpt.trim(),
            contentHtml: contentHtml.trim(),
            youtubeUrl: youtubeUrl.trim() || undefined,
            thumbnailUrl: thumbnailUrl.trim() || undefined,
            publishedAt: new Date(publishedAt).toISOString(),
            isPublished,
        });
    };

    const handleThumbnailUpload = async (file: File | undefined) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) return onError('썸네일은 이미지 파일만 업로드할 수 있습니다.');
        if (file.size > 5 * 1024 * 1024) return onError('썸네일은 5MB 이하만 업로드할 수 있습니다.');

        setUploadingThumbnail(true);
        onUploadingChange(true);
        onError(null);
        try {
            setThumbnailUrl(await uploadImage(file, 'skin-columns/thumbnails'));
        } catch (uploadError) {
            onError(uploadError instanceof Error ? uploadError.message : '썸네일 업로드에 실패했습니다.');
        } finally {
            setUploadingThumbnail(false);
            onUploadingChange(false);
        }
    };

    return (
        <form
            onSubmit={(event) => void submit(event)}
            className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)] md:p-7"
        >
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lead font-bold text-cocoa">
                    {initial ? '피부칼럼 수정' : '새 피부칼럼 작성'}
                </h2>
                <label className="flex cursor-pointer items-center gap-2 text-caption font-semibold text-cocoa">
                    <input
                        type="checkbox"
                        checked={isPublished}
                        disabled={saving}
                        onChange={(event) => setIsPublished(event.target.checked)}
                        className="size-4 accent-cocoa"
                    />
                    사이트에 공개
                </label>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="skin-column-category" className={labelClass}>
                        카테고리 *
                    </label>
                    <select
                        id="skin-column-category"
                        value={categorySlug}
                        disabled={saving}
                        onChange={(event) => setCategorySlug(event.target.value)}
                        className={inputClass}
                    >
                        {SIGNATURE_PAGES.map((category) => (
                            <option key={category.slug} value={category.slug}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="skin-column-date" className={labelClass}>
                        작성일 *
                    </label>
                    <input
                        id="skin-column-date"
                        type="datetime-local"
                        required
                        value={publishedAt}
                        disabled={saving}
                        onChange={(event) => setPublishedAt(event.target.value)}
                        className={inputClass}
                    />
                </div>
            </div>

            <div className="mt-4">
                <label htmlFor="skin-column-title" className={labelClass}>
                    제목 *
                </label>
                <input
                    id="skin-column-title"
                    type="text"
                    required
                    maxLength={120}
                    value={title}
                    disabled={saving}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder="피부칼럼 제목"
                    className={inputClass}
                />
                <p className="mt-1 text-right text-caption-sm text-latte">{title.length}/120자</p>
            </div>

            <div className="mt-4">
                <label htmlFor="skin-column-excerpt" className={labelClass}>
                    요약
                </label>
                <textarea
                    id="skin-column-excerpt"
                    rows={3}
                    maxLength={240}
                    value={excerpt}
                    disabled={saving}
                    onChange={(event) => setExcerpt(event.target.value)}
                    placeholder="목록 카드에 표시할 짧은 소개"
                    className={`${inputClass} resize-y`}
                />
                <p className="mt-1 text-right text-caption-sm text-latte">{excerpt.length}/240자</p>
            </div>

            <div className="mt-4">
                <label htmlFor="skin-column-youtube" className={labelClass}>
                    YouTube 영상 주소
                </label>
                <input
                    id="skin-column-youtube"
                    type="url"
                    value={youtubeUrl}
                    disabled={saving}
                    onChange={(event) => setYoutubeUrl(event.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className={inputClass}
                />
                <p className="mt-1 text-caption-sm text-latte">입력하면 상세 페이지 본문 상단에 영상이 표시됩니다.</p>
            </div>

            <div className="mt-4">
                <span className={labelClass}>본문 *</span>
                <p className="mb-2 text-caption-sm text-latte">
                    제목, 강조, 목록, 링크와 본문 이미지를 자유롭게 구성할 수 있습니다.
                </p>
                <SkinColumnRichEditor
                    value={contentHtml}
                    onChange={setContentHtml}
                    disabled={saving || uploadingThumbnail}
                    onImageUpload={(file) => uploadImage(file, 'skin-columns/content')}
                    onUploadError={onError}
                    onUploadingChange={(uploading) => {
                        setUploadingBodyImage(uploading);
                        onUploadingChange(uploading);
                    }}
                />
            </div>

            <div className="mt-5">
                <span className={labelClass}>썸네일</span>
                <p className="mb-2 text-caption-sm text-latte">가로형 이미지를 권장하며 최대 5MB까지 업로드할 수 있습니다.</p>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                    <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-xl border border-dashed border-cocoa/20 bg-[#F5F2EC]">
                        {thumbnailUrl ? (
                            <Image
                                src={thumbnailUrl}
                                alt="썸네일 미리보기"
                                fill
                                unoptimized
                                sizes="384px"
                                className="object-cover"
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center px-4 text-center text-caption text-latte">
                                이미지를 선택하면 미리보기가 표시됩니다.
                            </div>
                        )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <label className="cursor-pointer rounded-xl border border-cocoa/20 px-4 py-2 text-caption font-semibold text-cocoa hover:bg-cocoa/5">
                            {uploadingThumbnail ? '업로드 중…' : '이미지 선택'}
                            <input
                                type="file"
                                accept="image/*"
                                disabled={saving || uploadingThumbnail || uploadingBodyImage}
                                className="sr-only"
                                onChange={(event) => {
                                    void handleThumbnailUpload(event.target.files?.[0]);
                                    event.target.value = '';
                                }}
                            />
                        </label>
                        {thumbnailUrl ? (
                            <button
                                type="button"
                                disabled={saving || uploadingThumbnail}
                                onClick={() => setThumbnailUrl('')}
                                className="rounded-xl border border-red-200 px-4 py-2 text-caption font-semibold text-red-600 hover:bg-red-50 disabled:opacity-40"
                            >
                                이미지 제거
                            </button>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 border-t border-cocoa/10 pt-5">
                <button
                    type="submit"
                    disabled={
                        saving ||
                        uploadingThumbnail ||
                        uploadingBodyImage ||
                        !title.trim() ||
                        isContentEmpty(contentHtml) ||
                        !publishedAt
                    }
                    className="rounded-xl bg-cocoa px-5 py-2.5 text-small font-semibold text-cream hover:bg-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {saving ? '저장 중…' : initial ? '수정 완료' : '등록'}
                </button>
                <button
                    type="button"
                    disabled={saving || uploadingThumbnail || uploadingBodyImage}
                    onClick={onCancel}
                    className="rounded-xl border border-cocoa/20 px-5 py-2.5 text-small font-semibold text-cocoa hover:bg-cocoa/5 disabled:opacity-40"
                >
                    취소
                </button>
            </div>
        </form>
    );
}

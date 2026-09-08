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
import { useEffect, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react';
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
import {
    AdminHeader,
    ErrorBanner,
    HelpBanner,
    TextAction,
    VisibilitySwitch,
    confirmDelete,
} from '@/components/admin/AdminUI';
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

const CARD_CLASS = 'group flex min-w-0 flex-col overflow-hidden rounded-2xl bg-cream shadow-[0_8px_30px_rgba(69,54,45,0.08)]';

/* 고정한 글에만 붙는다. 227편 전체를 끌어다 옮기는 건 쓸 수 없는 조작이고,
   공개 페이지가 작성일 순으로 세우기 때문에 어차피 반영되지도 않는다. */
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
            className={`${CARD_CLASS} ${isDragging ? 'shadow-lg ring-1 ring-cocoa/30' : ''}`}
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

interface CardActions {
    disabled: boolean;
    onEdit: (post: SkinColumnPostItem) => void;
    onTogglePublished: (post: SkinColumnPostItem) => void;
    onTogglePin: (post: SkinColumnPostItem) => void;
    onDelete: (post: SkinColumnPostItem) => void;
}

/** 고정 목록과 전체 목록이 같은 카드를 쓴다 */
function PostCardBody({
    post,
    disabled,
    onEdit,
    onTogglePublished,
    onTogglePin,
    onDelete,
}: CardActions & { post: SkinColumnPostItem }) {
    return (
        <>
            <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand/35">
                {isHostedColumnThumbnail(post.thumbnailUrl) && post.thumbnailUrl ? (
                    <Image
                        src={post.thumbnailUrl}
                        alt=""
                        fill
                        unoptimized
                        sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                        className="object-cover"
                    />
                ) : (
                    <div className="flex h-full items-center justify-center font-display text-lead tracking-[0.08em] text-latte/40">
                        RE:BERRY
                    </div>
                )}
            </div>
            <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center justify-between gap-3 text-caption-sm text-latte">
                    {/* 분류 알약이 있던 자리. 블로그 카테고리를 참고용으로 보여 준다. */}
                    <span className="truncate font-semibold text-latte/70">{post.blogCategory || ''}</span>
                    <time className="shrink-0">
                        {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('ko-KR') : '작성일 없음'}
                    </time>
                </div>
                <h3 className="clamp-2 mt-4 text-lead font-bold leading-snug text-cocoa">{post.title || '제목 없음'}</h3>
                {post.excerpt ? <p className="clamp-2 mt-3 text-caption leading-6 text-latte">{post.excerpt}</p> : null}
                <div className="mt-auto flex flex-col gap-2 pt-6">
                    <VisibilitySwitch
                        visible={post.isPublished}
                        disabled={disabled}
                        onChange={() => onTogglePublished(post)}
                    />
                    <div className="flex flex-wrap gap-2">
                        <TextAction disabled={disabled} onClick={() => onTogglePin(post)}>
                            {post.isPinned ? '고정 해제' : '맨 위에 고정'}
                        </TextAction>
                        <TextAction disabled={disabled} onClick={() => onEdit(post)}>
                            고치기
                        </TextAction>
                        {isNaverBlogColumnPost(post) && post.blogUrl ? (
                            <a
                                href={post.blogUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center rounded-full border border-cocoa/15 px-4 text-small font-semibold text-cocoa"
                            >
                                원문 보기
                            </a>
                        ) : null}
                        <TextAction tone="danger" disabled={disabled} onClick={() => onDelete(post)}>
                            삭제
                        </TextAction>
                    </div>
                </div>
            </div>
        </>
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
    const [search, setSearch] = useState('');
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

    /* 분류를 걷어냈다. 예전에는 여기서 글마다 사이트 분류를 골라 줘야 했고
       고르지 않으면 공개가 안 됐는데, 블로그 카테고리는 18종이 넘고 사이트 분류는 3개뿐이라
       대부분의 글이 "분류 필요" 로 남아 안 보인 채 쌓였다. 이제 전부 그냥 공개된다.

       대신 글이 227편이라 목록에서 원하는 글을 눈으로 찾는 게 불가능해졌다 → 검색으로 좁힌다. */
    const pinnedPosts = posts.filter((post) => post.isPinned);
    const keyword = search.trim().toLowerCase();
    const listedPosts = posts.filter((post) => {
        if (post.isPinned) return false; // 위쪽 고정 목록에 이미 있다
        if (!keyword) return true;
        return [post.title, post.excerpt, post.blogCategory].some((value) =>
            (value ?? '').toLowerCase().includes(keyword),
        );
    });

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
        if (!confirmDelete(post.title || '이 피부칼럼')) return;
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

    const handleTogglePublished = async (post: SkinColumnPostItem) => {
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

    /* 고정한 글을 새로 집으면 고정 목록 맨 끝에 붙인다.
       sort 는 고정된 글끼리의 순서로만 쓰므로 나머지 글은 건드리지 않는다. */
    const handleTogglePin = async (post: SkinColumnPostItem) => {
        setSaving(true);
        setError(null);
        try {
            const lastSort = pinnedPosts.reduce((max, pinned) => Math.max(max, pinned.sort), -1);
            await patchSkinColumnPost(post.docId, {
                isPinned: !post.isPinned,
                ...(post.isPinned ? {} : { sort: lastSort + 1 }),
            });
        } catch (pinError) {
            setError(pinError instanceof Error ? pinError.message : '고정 상태 변경에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDragEnd = async ({ active, over }: DragEndEvent) => {
        if (!over || active.id === over.id || reorderSaving) return;
        const oldIndex = pinnedPosts.findIndex((post) => post.docId === String(active.id));
        const newIndex = pinnedPosts.findIndex((post) => post.docId === String(over.id));
        if (oldIndex < 0 || newIndex < 0) return;

        const previousPosts = posts;
        const reordered = arrayMove(pinnedPosts, oldIndex, newIndex).map((post, sort) => ({ ...post, sort }));
        const sortByDocId = new Map(reordered.map((post) => [post.docId, post.sort]));

        setPosts(posts.map((post) => (sortByDocId.has(post.docId) ? { ...post, sort: sortByDocId.get(post.docId)! } : post)));
        setReorderSaving(true);
        setError(null);
        try {
            await updateSkinColumnPostSorts(reordered.map(({ docId, sort }) => ({ docId, sort })));
        } catch (sortError) {
            setPosts(previousPosts);
            setError(sortError instanceof Error ? sortError.message : '고정 순서 저장에 실패했습니다.');
        } finally {
            setReorderSaving(false);
        }
    };

    const closeForm = () => {
        setFormUploading(false);
        setShowForm(false);
        setEditing(null);
    };

    const cardActions: CardActions = {
        disabled: saving || reorderSaving,
        onEdit: (post) => {
            setShowForm(false);
            setEditing(post);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        },
        onTogglePublished: (post) => void handleTogglePublished(post),
        onTogglePin: (post) => void handleTogglePin(post),
        onDelete: (post) => void handleDelete(post),
    };

    return (
        <div className="mx-auto max-w-6xl">
            <AdminHeader
                title="피부칼럼 관리"
                description="홈페이지 피부칼럼과 같은 카드입니다. 카드를 눌러 고치거나, 새 글을 작성하세요."
                previewHref="/column"
                action={
                    <button
                        type="button"
                        disabled={saving || formUploading}
                        onClick={() => {
                            setEditing(null);
                            setShowForm((current) => !current);
                        }}
                        className="inline-flex min-h-11 items-center rounded-full bg-cocoa px-5 text-small font-semibold text-cream hover:bg-deep disabled:opacity-40"
                    >
                        {showForm ? '작성 취소' : '+ 피부칼럼 작성'}
                    </button>
                }
            />
            <ErrorBanner message={error} />
            <HelpBanner>
                <b className="text-cocoa">사용법</b> · 홈페이지와 같은 카드가 아래에 있습니다.{' '}
                <b className="text-cocoa">초록 버튼</b>은 홈페이지에 보임, <b className="text-cocoa">주황 버튼</b>은
                숨김입니다. 홈페이지는 작성일이 최신인 글부터 보여 주며, 위에 띄우고 싶은 글은{' '}
                <b className="text-cocoa">[맨 위에 고정]</b>을 누르면 방문자가 어떤 정렬을 골라도 맨 앞에 남습니다. 새
                글은 오른쪽 위 [+ 피부칼럼 작성]을 누르세요.
            </HelpBanner>

            <SkinColumnBlogImportPanel onError={setError} />

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
                        <h2 className="text-lead font-bold text-cocoa">홈페이지에 나오는 카드</h2>
                        <p className="mt-1 text-small text-latte">
                            홈페이지는 작성일이 최신인 글부터 보여 줍니다. 위에 띄우고 싶은 글은 [맨 위에 고정]을
                            누르세요.
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
            </section>

            {loading ? (
                <EmptyState message="피부칼럼 목록을 불러오는 중…" />
            ) : posts.length === 0 ? (
                <EmptyState message="등록된 피부칼럼이 없습니다. 블로그에서 글을 가져오거나 직접 작성하세요." />
            ) : (
                <>
                    {pinnedPosts.length > 0 ? (
                        <section className="mt-6">
                            <h3 className="text-small font-bold text-cocoa">
                                맨 위에 고정한 글 {pinnedPosts.length}개
                                <span className="ml-2 font-normal text-latte">
                                    카드를 잡고 옮기면 이 안에서 순서가 바뀝니다.
                                </span>
                            </h3>
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext
                                    items={pinnedPosts.map((post) => post.docId)}
                                    strategy={rectSortingStrategy}
                                >
                                    <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                        {pinnedPosts.map((post) => (
                                            <SortablePostCard
                                                key={post.docId}
                                                post={post}
                                                disabled={saving || reorderSaving}
                                            >
                                                <PostCardBody post={post} {...cardActions} />
                                            </SortablePostCard>
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        </section>
                    ) : null}

                    <section className="mt-8">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-small font-bold text-cocoa">
                                {pinnedPosts.length > 0 ? '나머지 글' : '전체 글'} {listedPosts.length}개
                                <span className="ml-2 font-normal text-latte">최신순</span>
                            </h3>
                            {/* 글이 227편이라 눈으로 찾을 수 없다 → 제목·요약·블로그 카테고리로 좁힌다 */}
                            <input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="제목으로 찾기"
                                className="min-h-11 w-full rounded-full border border-cocoa/15 bg-white px-4 text-small text-cocoa outline-none placeholder:text-latte/60 focus:border-cocoa/40 sm:w-64"
                            />
                        </div>

                        {listedPosts.length === 0 ? (
                            <EmptyState
                                message={
                                    keyword
                                        ? '찾는 글이 없습니다. 검색어를 지우거나 다르게 입력해 보세요.'
                                        : '고정하지 않은 글이 없습니다.'
                                }
                            />
                        ) : (
                            <div className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                                {listedPosts.map((post) => (
                                    <article key={post.docId} className={CARD_CLASS}>
                                        <PostCardBody post={post} {...cardActions} />
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
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
    const [title, setTitle] = useState(initial?.title ?? '');
    const [excerpt, setExcerpt] = useState(initial?.excerpt ?? '');
    const [contentHtml, setContentHtml] = useState(initial?.contentHtml ?? '');
    const [youtubeUrl, setYoutubeUrl] = useState(initial?.youtubeUrl ?? '');
    const [thumbnailUrl, setThumbnailUrl] = useState(initial?.thumbnailUrl ?? '');
    const [publishedAt, setPublishedAt] = useState(toDateTimeLocal(initial?.publishedAt));
    const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
    const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
    const [uploadingBodyImage, setUploadingBodyImage] = useState(false);
    const isImportedBlog = initial?.source === 'naver-blog';

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        onError(null);
        if (uploadingThumbnail || uploadingBodyImage) return onError('이미지 업로드가 끝난 뒤 저장하세요.');
        if (!title.trim()) return onError('제목을 입력하세요.');
        if (!isImportedBlog && isContentEmpty(contentHtml)) return onError('본문을 입력하세요.');
        if (!validateYoutubeUrl(youtubeUrl)) return onError('올바른 YouTube 주소를 입력하세요.');
        if (!publishedAt || Number.isNaN(new Date(publishedAt).getTime())) return onError('작성일을 확인하세요.');

        await onSave({
            categorySlug: initial?.categorySlug ?? '',
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
                <VisibilitySwitch visible={isPublished} disabled={saving} onChange={setIsPublished} />
            </div>

            {/* 카테고리 선택이 있던 자리 — 분류를 없애서 작성일만 남는다 */}
            <div className="mt-5">
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
                <div className="mt-1 flex items-start justify-between gap-3 text-caption-sm text-latte">
                    <span>
                        {isImportedBlog
                            ? '사이트에 표시할 제목입니다. 수정한 제목은 블로그를 다시 가져와도 유지됩니다.'
                            : ''}
                    </span>
                    <span className="shrink-0">{title.length}/120자</span>
                </div>
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

            {isImportedBlog ? (
                <div className="mt-4 rounded-xl bg-cocoa/[0.04] px-4 py-3 text-caption leading-6 text-latte">
                    네이버 블로그 글은 본문을 중복 저장하지 않고 원문으로 연결됩니다. 제목·요약·카테고리·썸네일은
                    사이트용으로 자유롭게 수정할 수 있습니다.
                </div>
            ) : (
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
            )}

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
                        (!isImportedBlog && isContentEmpty(contentHtml)) ||
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

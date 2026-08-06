'use client';

import Image from 'next/image';
import { useEffect, useState, type FormEvent } from 'react';
import {
    createEvent,
    deleteEvent,
    subscribeEvents,
    updateEvent,
    updateEventSorts,
    type EventItem,
} from '@/components/lib/events';
import { uploadImage } from '@/components/lib/storageUpload';

const inputClass =
    'block w-full rounded-xl border border-cocoa/15 bg-white px-3.5 py-2.5 text-small text-cocoa outline-none focus:border-cocoa/40 disabled:bg-cocoa/[0.03]';

export default function EventManager() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [editing, setEditing] = useState<EventItem | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(
        () =>
            subscribeEvents(
                (items) => {
                    setEvents(items);
                    setLoading(false);
                },
                (subscriptionError) => {
                    setError(subscriptionError.message || '이벤트를 불러오지 못했습니다.');
                    setLoading(false);
                },
            ),
        [],
    );

    const run = async (action: () => Promise<void>, fallback: string) => {
        setBusy(true);
        setError(null);
        try {
            await action();
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : fallback);
        } finally {
            setBusy(false);
        }
    };

    const remove = (item: EventItem) => {
        if (!window.confirm(`"${item.title}" 이벤트를 삭제할까요?`)) return;
        void run(() => deleteEvent(item.docId), '이벤트 삭제에 실패했습니다.');
    };

    const move = (item: EventItem, direction: -1 | 1) => {
        const index = events.findIndex((candidate) => candidate.docId === item.docId);
        const target = events[index + direction];
        if (!target) return;
        void run(
            () =>
                updateEventSorts([
                    { docId: item.docId, sort: target.sort },
                    { docId: target.docId, sort: item.sort },
                ]),
            '이벤트 순서 변경에 실패했습니다.',
        );
    };

    return (
        <div className="mx-auto max-w-6xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-h2 font-bold text-cocoa">이벤트 관리</h1>
                    <p className="mt-1 text-small text-latte">메인과 이벤트 페이지에 표시할 이벤트를 관리합니다.</p>
                </div>
                <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                        setEditing(null);
                        setShowForm((current) => !current);
                    }}
                    className="rounded-full bg-cocoa px-5 py-2.5 text-small font-semibold text-cream disabled:opacity-40"
                >
                    {showForm ? '등록 취소' : '+ 이벤트 등록'}
                </button>
            </div>

            {error && (
                <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-caption text-red-700">
                    {error}
                </div>
            )}

            {(showForm || editing) && (
                <EventForm
                    key={editing?.docId ?? 'new'}
                    initial={editing ?? undefined}
                    saving={busy}
                    onCancel={() => {
                        setEditing(null);
                        setShowForm(false);
                    }}
                    onSave={(input) =>
                        run(async () => {
                            if (editing) await updateEvent(editing.docId, input);
                            else await createEvent(input);
                            setEditing(null);
                            setShowForm(false);
                        }, '이벤트 저장에 실패했습니다.')
                    }
                />
            )}

            {loading ? (
                <Empty message="이벤트를 불러오는 중입니다." />
            ) : events.length === 0 ? (
                <Empty message="등록된 이벤트가 없습니다." />
            ) : (
                <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((item, index) => (
                        <article key={item.docId} className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_15px_rgba(69,54,45,0.07)]">
                            <div className="relative aspect-[7/10] bg-cocoa/5">
                                <Image src={item.imageUrl} alt="" fill sizes="360px" className="object-cover" />
                                {!item.isPublished && (
                                    <span className="absolute left-3 top-3 rounded-full bg-black/65 px-3 py-1 text-caption-sm text-white">
                                        비공개
                                    </span>
                                )}
                            </div>
                            <div className="p-4">
                                <h2 className="clamp-2 min-h-10 text-small font-bold text-cocoa">{item.title}</h2>
                                <div className="mt-4 flex flex-wrap gap-2">
                                    <button type="button" disabled={busy || index === 0} onClick={() => move(item, -1)} className="rounded-lg border px-2.5 py-1.5 text-caption disabled:opacity-30">↑</button>
                                    <button type="button" disabled={busy || index === events.length - 1} onClick={() => move(item, 1)} className="rounded-lg border px-2.5 py-1.5 text-caption disabled:opacity-30">↓</button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditing(item);
                                            setShowForm(false);
                                            window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className="rounded-lg border border-cocoa/15 px-3 py-1.5 text-caption font-semibold text-cocoa"
                                    >
                                        수정
                                    </button>
                                    <button type="button" onClick={() => remove(item)} className="rounded-lg px-3 py-1.5 text-caption text-red-600">삭제</button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}

function EventForm({
    initial,
    saving,
    onSave,
    onCancel,
}: {
    initial?: EventItem;
    saving: boolean;
    onSave: (input: { title: string; imageUrl: string; isPublished: boolean }) => Promise<void>;
    onCancel: () => void;
}) {
    const [title, setTitle] = useState(initial?.title ?? '');
    const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? '');
    const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const upload = async (file?: File) => {
        if (!file) return;
        if (!file.type.startsWith('image/')) {
            setUploadError('이미지 파일만 업로드할 수 있습니다.');
            return;
        }
        setUploading(true);
        setUploadError(null);
        try {
            setImageUrl(await uploadImage(file, 'events'));
        } catch {
            setUploadError('이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const submit = (event: FormEvent) => {
        event.preventDefault();
        if (!title.trim() || !imageUrl || uploading) return;
        void onSave({ title: title.trim(), imageUrl, isPublished });
    };

    return (
        <form onSubmit={submit} className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)] md:p-7">
            <h2 className="text-lead font-bold text-cocoa">{initial ? '이벤트 수정' : '이벤트 등록'}</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]">
                <div>
                    <div className="relative aspect-[7/10] overflow-hidden rounded-xl bg-cocoa/5">
                        {imageUrl ? <Image src={imageUrl} alt="" fill sizes="220px" className="object-cover" /> : null}
                    </div>
                    <label className="mt-3 block cursor-pointer rounded-xl border border-cocoa/15 px-4 py-2.5 text-center text-caption font-semibold text-cocoa">
                        {uploading ? '업로드 중…' : '이미지 선택'}
                        <input type="file" accept="image/*" disabled={uploading} onChange={(event) => void upload(event.target.files?.[0])} className="sr-only" />
                    </label>
                    <p className="mt-2 text-caption-sm text-latte">권장 비율 7:10</p>
                </div>
                <div>
                    <label className="text-caption font-semibold text-cocoa">
                        이벤트 제목
                        <input value={title} onChange={(event) => setTitle(event.target.value)} required className={`${inputClass} mt-1.5`} />
                    </label>
                    <label className="mt-5 flex items-center gap-2 text-caption font-semibold text-cocoa">
                        <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
                        고객 페이지에 공개
                    </label>
                    {uploadError && <p className="mt-3 text-caption text-red-600">{uploadError}</p>}
                    <div className="mt-8 flex gap-2">
                        <button type="button" onClick={onCancel} className="rounded-full border border-cocoa/15 px-5 py-2.5 text-small text-cocoa">취소</button>
                        <button type="submit" disabled={saving || uploading || !title.trim() || !imageUrl} className="rounded-full bg-cocoa px-5 py-2.5 text-small font-semibold text-cream disabled:opacity-40">저장</button>
                    </div>
                </div>
            </div>
        </form>
    );
}

function Empty({ message }: { message: string }) {
    return <div className="mt-6 rounded-2xl bg-white py-16 text-center text-small text-latte">{message}</div>;
}

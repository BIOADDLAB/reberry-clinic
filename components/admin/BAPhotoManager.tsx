/* 전후사진 관리 — 홈페이지 전후사진 페이지와 같은 카드 격자에서 사진을 올리고 고친다. */

'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/components/lib/firebase';
import { deleteStoredImage, uploadImage } from '@/components/lib/storageUpload';
import {
    BA_IMAGE_GUIDE,
    COUNT_LIMITS,
    LIMITS,
    TREATMENT_PAGES,
    TREATMENT_PAGE_GROUPS,
} from '@/components/lib/adminConfig';
import {
    BA_CATEGORIES,
    baCategoryLabel,
    baPhotoUrl,
    formatTreatmentDate,
    resolveBACategory,
    resolveBAPlace,
    resolveBASlugs,
    showsOnReviews,
    showsOnTreatment,
} from '@/components/lib/ba';
import {
    AddRowButton,
    AdminHeader,
    ErrorBanner,
    Field,
    HelpBanner,
    TextAction,
    Toast,
    VisibilitySwitch,
    confirmDelete,
    useAdminAction,
} from '@/components/admin/AdminUI';

interface BAPhotoDoc {
    id: string;
    slug: string;
    slugs?: string[];
    label: string;
    before: string;
    after: string;
    main?: number;
    order?: number;
    category?: string;
    place?: string;
    treatmentDate?: string;
    createdAt?: unknown;
}

const VALID_SLUGS = new Set(TREATMENT_PAGES.map((page) => page.slug));

const createdAtMillis = (value: unknown) => {
    if (typeof value === 'string') return Date.parse(value) || 0;
    if (!value || typeof value !== 'object') return 0;
    const timestamp = value as { toMillis?: () => number; seconds?: number };
    if (typeof timestamp.toMillis === 'function') return timestamp.toMillis();
    return typeof timestamp.seconds === 'number' ? timestamp.seconds * 1000 : 0;
};

const emptyForm = () => ({
    place: 'treatment' as string,
    slugs: [] as string[],
    category: BA_CATEGORIES[0].key as string,
    label: '',
    treatmentDate: '',
    showMain: false,
    imageFile: null as File | null,
    previewUrl: '',
});

export default function BAPhotoManager() {
    const [items, setItems] = useState<BAPhotoDoc[]>([]);
    const [filter, setFilter] = useState('all');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);
    const { busy, error, toast, run, setError } = useAdminAction();

    useEffect(
        () =>
            onSnapshot(
                collection(db, 'baPhotos'),
                (snapshot) => {
                    setItems(
                        snapshot.docs
                            .map((entry) => ({ id: entry.id, ...entry.data() }) as BAPhotoDoc)
                            .sort((a, b) => createdAtMillis(b.createdAt) - createdAtMillis(a.createdAt)),
                    );
                    setLoading(false);
                    setError(null);
                },
                (snapshotError) => {
                    setError(snapshotError.message || '전후사진을 불러오지 못했습니다.');
                    setLoading(false);
                },
            ),
        [setError],
    );

    const nextFreeOrder = (taken: number[]) => {
        for (let number = 1; number <= taken.length + 1; number += 1) if (!taken.includes(number)) return number;
        return taken.length + 1;
    };

    const usesTreatment = form.place !== 'reviews';
    const usesReviews = form.place !== 'treatment';
    const pageName = (slug: string) => TREATMENT_PAGES.find((page) => page.slug === slug)?.label ?? slug;

    const visibleItems = useMemo(() => {
        if (filter === 'all') return items;
        if (filter === 'main') return items.filter((item) => typeof item.main === 'number');
        if (BA_CATEGORIES.some((category) => category.key === filter)) {
            return items.filter((item) => showsOnReviews(item) && resolveBACategory(item) === filter);
        }
        return items.filter((item) => showsOnTreatment(item) && resolveBASlugs(item).includes(filter));
    }, [items, filter]);

    const startAdd = () => {
        setEditingId(null);
        setAdding(true);
        setForm(emptyForm());
    };

    const startEdit = (item: BAPhotoDoc) => {
        const place = resolveBAPlace(item);
        const slugs = resolveBASlugs(item).filter((slug) => VALID_SLUGS.has(slug as (typeof TREATMENT_PAGES)[number]['slug']));
        setEditingId(item.id);
        setAdding(false);
        setForm({
            place,
            slugs,
            category: resolveBACategory(item) ?? BA_CATEGORIES[0].key,
            label: item.label,
            treatmentDate: item.treatmentDate ?? '',
            showMain: typeof item.main === 'number',
            imageFile: null,
            previewUrl: baPhotoUrl(item),
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancel = () => {
        setEditingId(null);
        setAdding(false);
        setForm(emptyForm());
    };

    const pickFile = (file: File | null) => {
        if (file && file.size > BA_IMAGE_GUIDE.maxFileSizeMB * 1024 * 1024) {
            alert(`사진은 ${BA_IMAGE_GUIDE.maxFileSizeMB}MB 이하로 올려 주세요.`);
            return;
        }
        setForm((current) => ({
            ...current,
            imageFile: file,
            previewUrl: file ? URL.createObjectURL(file) : current.previewUrl,
        }));
    };

    const submit = () =>
        run(
            async () => {
                if (usesTreatment && form.slugs.length === 0) throw new Error('사진을 보여줄 시술 페이지를 골라 주세요.');
                if (!form.label.trim()) throw new Error('사진 아래 이름을 적어 주세요.');
                if (!form.treatmentDate) throw new Error('시술일을 골라 주세요.');
                if (!editingId && !form.imageFile) throw new Error('사진을 올려 주세요.');

                const existing = items.find((item) => item.id === editingId);
                const imageUrl = form.imageFile ? await uploadImage(form.imageFile, 'ba') : form.previewUrl;
                if (!imageUrl) throw new Error('사진을 올리지 못했습니다.');

                const usedOrders = items
                    .filter((item) => item.id !== editingId && showsOnTreatment(item) && resolveBASlugs(item).some((slug) => form.slugs.includes(slug)))
                    .map((item) => item.order ?? 0)
                    .filter(Boolean);
                const usedMain = items.filter((item) => item.id !== editingId && typeof item.main === 'number').map((item) => item.main as number);

                const payload = {
                    place: form.place,
                    slug: form.slugs[0] ?? existing?.slug ?? TREATMENT_PAGES[0].slug,
                    slugs: form.slugs,
                    category: form.category,
                    label: form.label.trim().slice(0, LIMITS.baLabel),
                    treatmentDate: form.treatmentDate,
                    before: imageUrl,
                    after: imageUrl,
                    order: existing?.order && !usedOrders.includes(existing.order) ? existing.order : nextFreeOrder(usedOrders),
                    main: form.showMain
                        ? existing?.main && !usedMain.includes(existing.main)
                            ? existing.main
                            : nextFreeOrder(usedMain)
                        : null,
                };

                if (editingId) await updateDoc(doc(db, 'baPhotos', editingId), payload);
                else await addDoc(collection(db, 'baPhotos'), { ...payload, createdAt: serverTimestamp() });

                if (existing && form.imageFile) {
                    await Promise.allSettled(
                        [...new Set([existing.before, existing.after].filter((url) => url && url !== imageUrl))].map((url) =>
                            deleteStoredImage(url),
                        ),
                    );
                }
                cancel();
            },
            '저장에 실패했습니다.',
            editingId ? '사진을 수정했습니다' : '사진을 올렸습니다',
        );

    const remove = (item: BAPhotoDoc) => {
        if (!confirmDelete(item.label || '이 사진')) return;
        void run(
            async () => {
                if (editingId === item.id) cancel();
                await deleteDoc(doc(db, 'baPhotos', item.id));
                await Promise.allSettled([...new Set([item.before, item.after].filter(Boolean))].map((url) => deleteStoredImage(url)));
            },
            '삭제에 실패했습니다.',
            '삭제했습니다',
        );
    };

    const mainCount = items.filter((item) => typeof item.main === 'number').length;
    const overMain = form.showMain && !editingId && mainCount >= COUNT_LIMITS.baMain;
    const overPage = usesTreatment && form.slugs.some((slug) => {
        const count = items.filter((item) => item.id !== editingId && showsOnTreatment(item) && resolveBASlugs(item).includes(slug)).length;
        return count >= COUNT_LIMITS.baPerPage;
    });

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">전후사진을 불러오는 중입니다.</div>;
    }

    return (
        <div className="pb-10">
            <AdminHeader
                title="전후사진 관리"
                description="홈페이지 전후사진과 같은 칸입니다. 사진을 눌러 고치거나, 아래 버튼으로 새 사진을 올립니다."
                previewHref="/reviews"
            />
            <ErrorBanner message={error} />
            <HelpBanner>
                <b className="text-cocoa">사용법</b> · 사진을 누르면 그 자리에서 이름·시술일·어디에 보일지를 고칩니다.
                새 사진은 맨 아래 <b className="text-cocoa">[+ 사진 올리기]</b>를 누르세요.
            </HelpBanner>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                    { key: 'all', label: '전체' },
                    { key: 'main', label: '메인에 보이는 사진' },
                    ...BA_CATEGORIES.map((category) => ({ key: category.key, label: category.label })),
                ].map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        onClick={() => setFilter(tab.key)}
                        className={`rounded-full border px-4 py-2 text-small font-semibold ${
                            filter === tab.key ? 'border-cocoa bg-cocoa text-cream' : 'border-cocoa/15 bg-cream text-latte'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {(adding || editingId) && (
                <section className="mt-8 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(69,54,45,0.06)] md:p-7">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lead font-bold text-cocoa">{editingId ? '이 사진 고치기' : '새 사진 올리기'}</h2>
                        <TextAction onClick={cancel}>취소</TextAction>
                    </div>

                    <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]">
                        <label className="block cursor-pointer">
                            <span className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[6px] bg-sand/40 ring-1 ring-cocoa/10">
                                {form.previewUrl ? (
                                    <Image src={form.previewUrl} alt="" fill unoptimized className="object-contain" />
                                ) : (
                                    <span className="px-4 text-center text-small font-semibold text-latte">여기를 눌러 사진 올리기</span>
                                )}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
                            />
                            <p className="mt-2 text-center text-caption text-latte">
                                {BA_IMAGE_GUIDE.recommendWidth}×{BA_IMAGE_GUIDE.recommendHeight}px 정사각 권장
                            </p>
                        </label>

                        <div>
                            <p className="text-caption font-semibold text-latte">사진 아래 이름</p>
                            <Field
                                value={form.label}
                                onChange={(label) => setForm((current) => ({ ...current, label }))}
                                placeholder="예: 리베리 볼륨 부스터"
                                className="border-cocoa/15 bg-white text-small font-bold text-cocoa"
                            />

                            <p className="mt-4 text-caption font-semibold text-latte">시술일</p>
                            <input
                                type="date"
                                value={form.treatmentDate}
                                onChange={(event) => setForm((current) => ({ ...current, treatmentDate: event.target.value }))}
                                className="mt-1 min-h-11 rounded-lg border border-cocoa/15 px-3 text-small text-cocoa"
                            />

                            <p className="mt-4 text-caption font-semibold text-latte">어디에 보일까요?</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Chip
                                    active={usesTreatment}
                                    onClick={() =>
                                        setForm((current) => ({
                                            ...current,
                                            place: usesTreatment ? (usesReviews ? 'reviews' : current.place) : usesReviews ? 'both' : 'treatment',
                                        }))
                                    }
                                >
                                    시술 페이지
                                </Chip>
                                <Chip
                                    active={usesReviews}
                                    onClick={() =>
                                        setForm((current) => ({
                                            ...current,
                                            place: usesReviews ? (usesTreatment ? 'treatment' : current.place) : usesTreatment ? 'both' : 'reviews',
                                        }))
                                    }
                                >
                                    전후사진 페이지
                                </Chip>
                            </div>

                            {usesTreatment && (
                                <div className="mt-4 space-y-3">
                                    {TREATMENT_PAGE_GROUPS.map((group) => (
                                        <div key={group.key}>
                                            <p className="mb-2 text-caption font-semibold text-latte">{group.label}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {group.pages.map((page) => (
                                                    <Chip
                                                        key={page.slug}
                                                        active={form.slugs.includes(page.slug)}
                                                        onClick={() =>
                                                            setForm((current) => ({
                                                                ...current,
                                                                slugs: current.slugs.includes(page.slug)
                                                                    ? current.slugs.filter((slug) => slug !== page.slug)
                                                                    : [...current.slugs, page.slug],
                                                            }))
                                                        }
                                                    >
                                                        {page.label}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {usesReviews && (
                                <div className="mt-4">
                                    <p className="text-caption font-semibold text-latte">전후사진 페이지 탭</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {BA_CATEGORIES.map((category) => (
                                            <Chip
                                                key={category.key}
                                                active={form.category === category.key}
                                                onClick={() => setForm((current) => ({ ...current, category: category.key }))}
                                            >
                                                {category.label}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-5">
                                <VisibilitySwitch
                                    visible={form.showMain}
                                    disabled={busy || overMain}
                                    onLabel="메인에도 보임"
                                    offLabel="메인은 안 보임 · 눌러서 넣기"
                                    onChange={(showMain) => setForm((current) => ({ ...current, showMain }))}
                                />
                                <p className="mt-2 text-caption text-latte">
                                    초록이면 메인 첫 화면에도 나갑니다. 지금 {mainCount}/{COUNT_LIMITS.baMain}장
                                </p>
                                {overMain && <p className="mt-1 text-caption text-red-600">메인 사진은 더 넣을 수 없습니다.</p>}
                                {overPage && (
                                    <p className="mt-1 text-caption text-red-600">
                                        선택한 시술 페이지에 사진이 가득 찼습니다. 기존 사진을 지운 뒤 올려 주세요.
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                disabled={busy || overMain || overPage}
                                onClick={() => void submit()}
                                className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#C95813] px-8 text-small font-bold text-white disabled:opacity-40"
                            >
                                {busy ? '저장 중…' : editingId ? '이 사진 저장하기' : '사진 올리기'}
                            </button>
                        </div>
                    </div>
                </section>
            )}

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {visibleItems.map((item) => (
                    <article key={item.id} className="overflow-hidden rounded-[6px] bg-white shadow-[0_4px_18px_rgba(69,54,45,0.06)] ring-1 ring-cocoa/[0.06]">
                        <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
                            <span className="rounded-full bg-sand/70 px-2.5 py-1 text-caption-sm font-semibold text-cocoa/70">
                                {item.label || baCategoryLabel(resolveBACategory(item) ?? '')}
                            </span>
                            <span className="font-display text-caption-sm tracking-[0.2em] text-cocoa/30">RE:BERRY</span>
                        </div>
                        <button type="button" onClick={() => startEdit(item)} className="relative block aspect-square w-full bg-white">
                            {baPhotoUrl(item) && (
                                <Image src={baPhotoUrl(item)} alt="" fill unoptimized sizes="220px" className="object-contain" />
                            )}
                        </button>
                        <div className="space-y-2 px-3 py-3">
                            <p className="text-caption text-latte">
                                {showsOnTreatment(item) && resolveBASlugs(item).map(pageName).join(', ')}
                                {showsOnTreatment(item) && showsOnReviews(item) && ' · '}
                                {showsOnReviews(item) && `전후사진 · ${baCategoryLabel(resolveBACategory(item) ?? '')}`}
                                {typeof item.main === 'number' && ' · 메인'}
                                {item.treatmentDate && ` · ${formatTreatmentDate(item.treatmentDate)}`}
                            </p>
                            <div className="flex gap-2">
                                <TextAction onClick={() => startEdit(item)}>고치기</TextAction>
                                <TextAction tone="danger" disabled={busy} onClick={() => remove(item)}>
                                    삭제
                                </TextAction>
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {visibleItems.length === 0 && (
                <p className="mt-10 rounded-2xl bg-white py-16 text-center text-small text-latte">이 칸에 사진이 없습니다.</p>
            )}

            <div className="mt-8">
                <AddRowButton disabled={busy} onClick={startAdd}>
                    + 사진 올리기
                </AddRowButton>
            </div>
            <Toast message={toast} />
        </div>
    );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-small font-semibold ${
                active ? 'border-cocoa bg-cocoa text-cream' : 'border-cocoa/15 bg-white text-latte'
            }`}
        >
            {children}
        </button>
    );
}

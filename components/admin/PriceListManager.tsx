'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
    createPriceCategory,
    createPriceListItem,
    createPriceSection,
    deletePriceCategory,
    deletePriceListItem,
    deletePriceSection,
    formatPrice,
    subscribePriceCategories,
    subscribePriceListItems,
    subscribePriceSections,
    updatePriceCategory,
    updatePriceListItem,
    updatePriceListItemSorts,
    updatePriceSection,
    updatePriceSectionSorts,
    type PriceCategory,
    type PriceListItem,
    type PriceSection,
    type PriceSession,
} from '@/components/lib/priceList';

const inputClass =
    'block w-full rounded-xl border border-cocoa/15 bg-white px-3.5 py-2.5 text-small text-cocoa outline-none focus:border-cocoa/40 disabled:bg-cocoa/[0.03]';
const PAGE_SIZE = 20;
const SESSION_LABEL_RE = /^\d+(?:\.\d+)?(?:회|개|병)$/;

const newSession = (): PriceSession => ({
    id: crypto.randomUUID(),
    label: '1회',
    price: 0,
});

export default function PriceListManager() {
    const [categories, setCategories] = useState<PriceCategory[]>([]);
    const [sections, setSections] = useState<PriceSection[]>([]);
    const [items, setItems] = useState<PriceListItem[]>([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [editing, setEditing] = useState<PriceListItem | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [categoryLabel, setCategoryLabel] = useState('');
    const [sectionCategoryId, setSectionCategoryId] = useState('');
    const [sectionLabel, setSectionLabel] = useState('');
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fail = (subscriptionError: Error) => {
            setError(subscriptionError.message || '수가표 데이터를 불러오지 못했습니다.');
            setLoading(false);
        };
        const unsubscribeCategories = subscribePriceCategories((nextCategories) => {
            setCategories(nextCategories);
            setSectionCategoryId((current) => current || nextCategories[0]?.docId || '');
            setLoading(false);
        }, fail);
        const unsubscribeSections = subscribePriceSections(setSections, fail);
        const unsubscribeItems = subscribePriceListItems(setItems, fail);
        return () => {
            unsubscribeCategories();
            unsubscribeSections();
            unsubscribeItems();
        };
    }, []);

    const visibleItems = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return items.filter(
            (item) =>
                (selectedCategory === 'all' || item.categoryId === selectedCategory) &&
                (!keyword ||
                    item.name.toLowerCase().includes(keyword) ||
                    item.productLabel.toLowerCase().includes(keyword) ||
                    item.description.toLowerCase().includes(keyword) ||
                    (sections.find((section) => section.docId === item.sectionId)?.label ?? '')
                        .toLowerCase()
                        .includes(keyword) ||
                    item.sessions.some((session) => session.label.toLowerCase().includes(keyword))),
        );
    }, [items, search, sections, selectedCategory]);
    const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginatedItems = visibleItems.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
    const categoryById = useMemo(
        () => new Map(categories.map((category) => [category.docId, category])),
        [categories],
    );
    const sectionById = useMemo(
        () => new Map(sections.map((section) => [section.docId, section])),
        [sections],
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

    const addCategory = async (event: FormEvent) => {
        event.preventDefault();
        const label = categoryLabel.trim();
        if (!label) return;
        await run(async () => {
            await createPriceCategory({ label, isPublished: true });
            setCategoryLabel('');
        }, '카테고리 추가에 실패했습니다.');
    };

    const renameCategory = (category: PriceCategory) => {
        const label = window.prompt('카테고리 이름', category.label)?.trim();
        if (!label || label === category.label) return;
        void run(
            () => updatePriceCategory(category.docId, { label, isPublished: category.isPublished }),
            '카테고리 수정에 실패했습니다.',
        );
    };

    const toggleCategory = (category: PriceCategory) =>
        run(
            () =>
                updatePriceCategory(category.docId, {
                    label: category.label,
                    isPublished: !category.isPublished,
                }),
            '카테고리 공개 상태 변경에 실패했습니다.',
        );

    const removeCategory = (category: PriceCategory) => {
        if (!window.confirm(`"${category.label}" 카테고리를 삭제할까요?`)) return;
        void run(() => deletePriceCategory(category.docId), '카테고리 삭제에 실패했습니다.');
    };

    const addSection = async (event: FormEvent) => {
        event.preventDefault();
        const label = sectionLabel.trim();
        if (!sectionCategoryId || !label) return;
        await run(async () => {
            await createPriceSection({ categoryId: sectionCategoryId, label, isPublished: true });
            setSectionLabel('');
        }, '소제목 추가에 실패했습니다.');
    };

    const renameSection = (section: PriceSection) => {
        const label = window.prompt('소제목 이름', section.label)?.trim();
        if (!label || label === section.label) return;
        void run(
            () =>
                updatePriceSection(section.docId, {
                    categoryId: section.categoryId,
                    label,
                    isPublished: section.isPublished,
                }),
            '소제목 수정에 실패했습니다.',
        );
    };

    const toggleSection = (section: PriceSection) =>
        run(
            () =>
                updatePriceSection(section.docId, {
                    categoryId: section.categoryId,
                    label: section.label,
                    isPublished: !section.isPublished,
                }),
            '소제목 공개 상태 변경에 실패했습니다.',
        );

    const removeSection = (section: PriceSection) => {
        if (!window.confirm(`"${section.label}" 소제목을 삭제할까요?`)) return;
        void run(() => deletePriceSection(section.docId), '소제목 삭제에 실패했습니다.');
    };

    const moveSection = async (section: PriceSection, direction: -1 | 1) => {
        const siblings = sections.filter((candidate) => candidate.categoryId === section.categoryId);
        const index = siblings.findIndex((candidate) => candidate.docId === section.docId);
        const target = siblings[index + direction];
        if (!target) return;
        await run(
            () =>
                updatePriceSectionSorts([
                    { docId: section.docId, sort: target.sort },
                    { docId: target.docId, sort: section.sort },
                ]),
            '소제목 정렬 변경에 실패했습니다.',
        );
    };

    const moveItem = async (item: PriceListItem, direction: -1 | 1) => {
        const siblings = items.filter((candidate) => candidate.sectionId === item.sectionId);
        const index = siblings.findIndex((candidate) => candidate.docId === item.docId);
        const target = siblings[index + direction];
        if (!target) return;
        await run(
            () =>
                updatePriceListItemSorts([
                    { docId: item.docId, sort: target.sort },
                    { docId: target.docId, sort: item.sort },
                ]),
            '정렬 변경에 실패했습니다.',
        );
    };

    const removeItem = (item: PriceListItem) => {
        if (!window.confirm(`"${item.name}" 항목을 삭제할까요?`)) return;
        void run(() => deletePriceListItem(item.docId), '시술 삭제에 실패했습니다.');
    };

    return (
        <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-h2 font-bold text-cocoa">수가표 관리</h1>
                    <p className="mt-1 text-small text-latte">고객에게 공개할 시술과 가격 옵션을 관리합니다.</p>
                </div>
                <button
                    type="button"
                    disabled={busy || categories.length === 0}
                    onClick={() => {
                        setEditing(null);
                        setShowForm((current) => !current);
                    }}
                    className="rounded-full bg-cocoa px-5 py-2.5 text-small font-semibold text-cream disabled:opacity-40"
                >
                    {showForm ? '등록 취소' : '+ 시술 등록'}
                </button>
            </div>

            {error && (
                <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-caption text-red-700">
                    {error}
                </div>
            )}

            <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lead font-bold text-cocoa">카테고리</h2>
                        <p className="mt-1 text-caption text-latte">항목이 남아 있는 카테고리는 삭제할 수 없습니다.</p>
                    </div>
                    <form onSubmit={addCategory} className="flex gap-2">
                        <input
                            value={categoryLabel}
                            onChange={(event) => setCategoryLabel(event.target.value)}
                            placeholder="새 카테고리"
                            className={`${inputClass} w-44`}
                        />
                        <button
                            type="submit"
                            disabled={busy || !categoryLabel.trim()}
                            className="rounded-xl border border-cocoa/20 px-4 text-caption font-semibold text-cocoa disabled:opacity-40"
                        >
                            추가
                        </button>
                    </form>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                    {categories.map((category) => (
                        <div
                            key={category.docId}
                            className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-caption ${
                                category.isPublished ? 'border-cocoa/15 text-cocoa' : 'border-dashed border-cocoa/15 text-latte/60'
                            }`}
                        >
                            <button type="button" onClick={() => renameCategory(category)} className="font-semibold">
                                {category.label}
                            </button>
                            <button
                                type="button"
                                onClick={() => void toggleCategory(category)}
                                className="ml-1 text-[11px] text-latte"
                            >
                                {category.isPublished ? '공개' : '비공개'}
                            </button>
                            <button
                                type="button"
                                onClick={() => removeCategory(category)}
                                className="text-[11px] text-red-500"
                            >
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            </section>

            <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)]">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h2 className="text-lead font-bold text-cocoa">소제목</h2>
                        <p className="mt-1 text-caption text-latte">
                            고객 가격표에서 상품 묶음 제목으로 표시됩니다.
                        </p>
                    </div>
                    <form onSubmit={addSection} className="flex flex-wrap gap-2">
                        <select
                            value={sectionCategoryId}
                            onChange={(event) => setSectionCategoryId(event.target.value)}
                            className={`${inputClass} w-auto min-w-36`}
                        >
                            {categories.map((category) => (
                                <option key={category.docId} value={category.docId}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                        <input
                            value={sectionLabel}
                            onChange={(event) => setSectionLabel(event.target.value)}
                            placeholder="새 소제목"
                            className={`${inputClass} w-44`}
                        />
                        <button
                            type="submit"
                            disabled={busy || !sectionCategoryId || !sectionLabel.trim()}
                            className="rounded-xl border border-cocoa/20 px-4 text-caption font-semibold text-cocoa disabled:opacity-40"
                        >
                            추가
                        </button>
                    </form>
                </div>
                <div className="mt-4 space-y-3">
                    {categories.map((category) => {
                        const categorySections = sections.filter(
                            (section) => section.categoryId === category.docId,
                        );
                        if (categorySections.length === 0) return null;
                        return (
                            <div key={category.docId} className="flex flex-wrap items-center gap-2">
                                <strong className="w-24 text-caption text-cocoa">{category.label}</strong>
                                {categorySections.map((section) => (
                                    <div
                                        key={section.docId}
                                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-caption ${
                                            section.isPublished
                                                ? 'border-cocoa/15 text-cocoa'
                                                : 'border-dashed border-cocoa/15 text-latte/60'
                                        }`}
                                    >
                                        <button type="button" disabled={busy} onClick={() => void moveSection(section, -1)}>
                                            ↑
                                        </button>
                                        <button type="button" disabled={busy} onClick={() => void moveSection(section, 1)}>
                                            ↓
                                        </button>
                                        <button type="button" onClick={() => renameSection(section)} className="font-semibold">
                                            {section.label}
                                        </button>
                                        <button type="button" onClick={() => void toggleSection(section)} className="text-[11px] text-latte">
                                            {section.isPublished ? '공개' : '비공개'}
                                        </button>
                                        <button type="button" onClick={() => removeSection(section)} className="text-[11px] text-red-500">
                                            삭제
                                        </button>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            </section>

            {(showForm || editing) && (
                <PriceItemForm
                    key={editing?.docId ?? 'new'}
                    categories={categories}
                    sections={sections}
                    initial={editing ?? undefined}
                    defaultCategoryId={selectedCategory === 'all' ? categories[0]?.docId : selectedCategory}
                    saving={busy}
                    onCancel={() => {
                        setEditing(null);
                        setShowForm(false);
                    }}
                    onSave={(input) =>
                        run(async () => {
                            if (editing) await updatePriceListItem(editing.docId, input);
                            else await createPriceListItem(input);
                            setEditing(null);
                            setShowForm(false);
                        }, '시술 저장에 실패했습니다.')
                    }
                />
            )}

            <section className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)]">
                <div className="flex flex-wrap gap-3">
                    <select
                        value={selectedCategory}
                        onChange={(event) => {
                            setSelectedCategory(event.target.value);
                            setPage(1);
                        }}
                        className={`${inputClass} w-auto min-w-44`}
                    >
                        <option value="all">전체 카테고리</option>
                        {categories.map((category) => (
                            <option key={category.docId} value={category.docId}>
                                {category.label}
                            </option>
                        ))}
                    </select>
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder="시술명·옵션 검색"
                        className={`${inputClass} max-w-sm`}
                    />
                    <span className="self-center text-caption text-latte">총 {visibleItems.length}개</span>
                </div>
            </section>

            {loading ? (
                <EmptyState message="수가표를 불러오는 중입니다." />
            ) : visibleItems.length === 0 ? (
                <EmptyState message="조건에 맞는 시술이 없습니다." />
            ) : (
                <div className="mt-4 space-y-2">
                    {paginatedItems.map((item) => (
                        <article key={item.docId} className="rounded-xl bg-white px-4 py-4 shadow-[0_1px_8px_rgba(69,54,45,0.05)]">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="rounded-full bg-sand/35 px-2.5 py-1 text-caption-sm font-semibold text-cocoa">
                                            {categoryById.get(item.categoryId)?.label ?? '미분류'}
                                        </span>
                                        <span className="rounded-full border border-cocoa/10 px-2.5 py-1 text-caption-sm text-latte">
                                            {sectionById.get(item.sectionId)?.label ?? '소제목 없음'}
                                        </span>
                                        {!item.isPublished && (
                                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-caption-sm text-slate-500">
                                                비공개
                                            </span>
                                        )}
                                        <strong className="text-small text-cocoa">{item.name}</strong>
                                        {item.productLabel ? (
                                            <span className="rounded-full border border-cocoa/12 bg-sand/60 px-2 py-0.5 text-caption-sm font-semibold text-latte">
                                                {item.productLabel}
                                            </span>
                                        ) : null}
                                    </div>
                                    {item.description && (
                                        <p className="mt-2 whitespace-pre-line text-caption leading-5 text-latte">
                                            {item.description}
                                        </p>
                                    )}
                                    <p className="mt-2 text-caption text-latte">
                                        {item.sessions
                                            .map((session) => `${session.label} ${formatPrice(session.price)}`)
                                            .join(' · ')}
                                    </p>
                                </div>
                                <div className="flex shrink-0 gap-2">
                                    <button type="button" disabled={busy} onClick={() => void moveItem(item, -1)} className="rounded-lg border px-2.5 py-1.5 text-caption">
                                        ↑
                                    </button>
                                    <button type="button" disabled={busy} onClick={() => void moveItem(item, 1)} className="rounded-lg border px-2.5 py-1.5 text-caption">
                                        ↓
                                    </button>
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
                                    <button type="button" onClick={() => removeItem(item)} className="rounded-lg px-3 py-1.5 text-caption text-red-600">
                                        삭제
                                    </button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                    <button disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} className="rounded-lg border px-3 py-2 text-caption disabled:opacity-30">
                        이전
                    </button>
                    <span className="text-caption text-latte">{currentPage} / {totalPages}</span>
                    <button disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} className="rounded-lg border px-3 py-2 text-caption disabled:opacity-30">
                        다음
                    </button>
                </div>
            )}
        </div>
    );
}

function PriceItemForm({
    categories,
    sections,
    initial,
    defaultCategoryId,
    saving,
    onSave,
    onCancel,
}: {
    categories: PriceCategory[];
    sections: PriceSection[];
    initial?: PriceListItem;
    defaultCategoryId?: string;
    saving: boolean;
    onSave: (input: Omit<PriceListItem, 'docId' | 'sort' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    onCancel: () => void;
}) {
    const [categoryId, setCategoryId] = useState(initial?.categoryId ?? defaultCategoryId ?? '');
    const availableSections = sections.filter((section) => section.categoryId === categoryId);
    const [sectionId, setSectionId] = useState(
        initial?.sectionId ??
            sections.find((section) => section.categoryId === (defaultCategoryId ?? categories[0]?.docId))?.docId ??
            '',
    );
    const [name, setName] = useState(initial?.name ?? '');
    const [productLabel, setProductLabel] = useState(initial?.productLabel ?? '');
    const [description, setDescription] = useState(initial?.description ?? '');
    const [sessions, setSessions] = useState<PriceSession[]>(initial?.sessions ?? [newSession()]);
    const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
    const [validationError, setValidationError] = useState<string | null>(null);

    const submit = async (event: FormEvent) => {
        event.preventDefault();
        setValidationError(null);
        const normalizedSessions = sessions
            .map((session) => ({
                ...session,
                label: session.label.trim().replace(/\s/g, ''),
                price: Math.round(session.price),
            }))
            .filter((session) => session.price > 0);
        if (!categoryId || !sectionId || !name.trim() || normalizedSessions.length === 0) {
            setValidationError('카테고리, 소제목, 상품명과 가격을 모두 입력해 주세요.');
            return;
        }
        if (normalizedSessions.some((session) => !SESSION_LABEL_RE.test(session.label))) {
            setValidationError('횟수/수량은 1회, 3회, 1병, 20개와 같은 형식만 입력할 수 있습니다.');
            return;
        }
        await onSave({
            categoryId,
            sectionId,
            name: name.trim(),
            productLabel: productLabel.trim(),
            description: description.trim(),
            sessions: normalizedSessions,
            isPublished,
        });
    };

    return (
        <form onSubmit={submit} className="mt-6 rounded-2xl border border-cocoa/10 bg-white p-5 md:p-7">
            <h2 className="text-lead font-bold text-cocoa">{initial ? '시술 수정' : '시술 등록'}</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
                <label className="text-caption font-semibold text-cocoa">
                    카테고리
                    <select
                        value={categoryId}
                        onChange={(event) => {
                            const nextCategoryId = event.target.value;
                            setCategoryId(nextCategoryId);
                            setSectionId(
                                sections.find((section) => section.categoryId === nextCategoryId)?.docId ?? '',
                            );
                        }}
                        required
                        className={`${inputClass} mt-1.5`}
                    >
                        <option value="">선택</option>
                        {categories.map((category) => <option key={category.docId} value={category.docId}>{category.label}</option>)}
                    </select>
                </label>
                <label className="text-caption font-semibold text-cocoa">
                    소제목
                    <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} required className={`${inputClass} mt-1.5`}>
                        <option value="">선택</option>
                        {availableSections.map((section) => (
                            <option key={section.docId} value={section.docId}>
                                {section.label}
                            </option>
                        ))}
                    </select>
                </label>
                <label className="text-caption font-semibold text-cocoa">
                    시술명
                    <input value={name} onChange={(event) => setName(event.target.value)} required className={`${inputClass} mt-1.5`} />
                </label>
                <label className="text-caption font-semibold text-cocoa">
                    제품명
                    <input
                        value={productLabel}
                        onChange={(event) => setProductLabel(event.target.value)}
                        placeholder="예: 아띠에르"
                        className={`${inputClass} mt-1.5`}
                    />
                </label>
                <label className="text-caption font-semibold text-cocoa md:col-span-2">
                    설명
                    <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={2} className={`${inputClass} mt-1.5 resize-y`} />
                </label>
            </div>
            <div className="mt-5">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-small font-bold text-cocoa">횟수/수량별 가격</h3>
                        <p className="mt-1 text-caption-sm text-latte">제품명은 시술명 옆 뱃지로 표시되고, 이곳에는 횟수나 수량만 입력합니다.</p>
                    </div>
                    <button type="button" onClick={() => setSessions((current) => [...current, newSession()])} className="text-caption font-semibold text-cocoa underline">
                        + 가격 행 추가
                    </button>
                </div>
                <div className="mt-3 space-y-2">
                    {sessions.map((session, index) => (
                        <div key={session.id} className="grid gap-2 sm:grid-cols-[1fr_180px_auto_auto]">
                            <input
                                value={session.label}
                                onChange={(event) => setSessions((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, label: event.target.value } : entry))}
                                placeholder="1회, 3회, 1병, 20개"
                                className={inputClass}
                            />
                            <input
                                value={session.price || ''}
                                onChange={(event) => setSessions((current) => current.map((entry, entryIndex) => entryIndex === index ? { ...entry, price: Number(event.target.value.replace(/\D/g, '')) } : entry))}
                                inputMode="numeric"
                                placeholder="가격"
                                className={inputClass}
                            />
                            <div className="flex">
                                <button type="button" disabled={index === 0} onClick={() => setSessions((current) => {
                                    const next = [...current];
                                    [next[index - 1], next[index]] = [next[index], next[index - 1]];
                                    return next;
                                })} className="rounded-lg px-2 text-caption disabled:opacity-30">↑</button>
                                <button type="button" disabled={index === sessions.length - 1} onClick={() => setSessions((current) => {
                                    const next = [...current];
                                    [next[index], next[index + 1]] = [next[index + 1], next[index]];
                                    return next;
                                })} className="rounded-lg px-2 text-caption disabled:opacity-30">↓</button>
                            </div>
                            <button type="button" disabled={sessions.length === 1} onClick={() => setSessions((current) => current.filter((_, entryIndex) => entryIndex !== index))} className="rounded-lg px-3 text-caption text-red-600 disabled:opacity-30">
                                삭제
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            {validationError && <p role="alert" className="mt-3 text-caption text-red-600">{validationError}</p>}
            <label className="mt-5 flex items-center gap-2 text-caption font-semibold text-cocoa">
                <input type="checkbox" checked={isPublished} onChange={(event) => setIsPublished(event.target.checked)} />
                고객 페이지에 공개
            </label>
            <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={onCancel} className="rounded-full border border-cocoa/15 px-5 py-2.5 text-small text-cocoa">취소</button>
                <button type="submit" disabled={saving} className="rounded-full bg-cocoa px-5 py-2.5 text-small font-semibold text-cream disabled:opacity-40">저장</button>
            </div>
        </form>
    );
}

function EmptyState({ message }: { message: string }) {
    return <div className="mt-5 rounded-2xl bg-white py-16 text-center text-small text-latte">{message}</div>;
}

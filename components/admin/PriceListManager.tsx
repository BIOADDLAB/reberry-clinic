/* #COMPONENTS: 수가표 관리 — 고객 페이지와 "똑같은 표" 를 그대로 놓고 고친다
   #ISSUE 1: 관리자 화면이 고객 페이지와 다른 모양(대분류 목록 + 카드 편집기)이라
             고친 결과가 실제로 어떻게 보이는지 알 수 없었다.
   → 검색창 · 탭 · 아코디언 카드까지 고객 페이지(PriceListClient)와 같은 모양으로 맞췄다.
   #ISSUE 2: 자동 저장이라 "저장을 어떻게 하는지" 를 알 수 없었다.
   → 글자·가격 수정은 화면에만 먼저 반영되고, 아래 고정 바의 [저장하기] 를 눌러야 홈페이지에 올라간다.
     저장 안 한 칸은 노란 테두리로 표시하고, 저장 전에 창을 닫으면 브라우저가 한 번 더 물어본다.
     (카드 추가·삭제·순서 변경처럼 되돌릴 일이 없는 동작은 누르는 즉시 저장된다) */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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
    updatePriceCategorySorts,
    updatePriceListItem,
    updatePriceListItemSorts,
    updatePriceSection,
    updatePriceSectionSorts,
    type PriceCategory,
    type PriceListItem,
    type PriceSection,
} from '@/components/lib/priceList';
import { buildPriceBoard } from '@/components/lib/priceBoard';
import { AdminHeader, ErrorBanner, IconButton, PublishToggle, Toast, useAdminAction } from '@/components/admin/AdminUI';

/** 저장 대기 중인 수정 내용. 키는 "종류:문서ID:필드" */
type Edits = Record<string, string>;

const key = (kind: 'cat' | 'sec' | 'item', id: string, field: string) => `${kind}:${id}:${field}`;
const digits = (value: string) => Number(value.replace(/[^0-9]/g, '')) || 0;

export default function PriceListManager() {
    const [categories, setCategories] = useState<PriceCategory[]>([]);
    const [sections, setSections] = useState<PriceSection[]>([]);
    const [items, setItems] = useState<PriceListItem[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [openCards, setOpenCards] = useState<string[] | null>(null);
    const [edits, setEdits] = useState<Edits>({});
    const [arrange, setArrange] = useState(false);
    const [loading, setLoading] = useState(true);
    const { busy, error, toast, run, setError } = useAdminAction();

    useEffect(() => {
        const fail = (e: Error) => {
            setError(e.message || '수가표를 불러오지 못했습니다.');
            setLoading(false);
        };
        const offC = subscribePriceCategories(setCategories, fail);
        const offS = subscribePriceSections(setSections, fail);
        const offI = subscribePriceListItems((next) => {
            setItems(next);
            setLoading(false);
        }, fail);
        return () => {
            offC();
            offS();
            offI();
        };
    }, [setError]);

    const dirtyCount = Object.keys(edits).length;

    // 저장 안 하고 창을 닫으려 하면 브라우저가 한 번 더 물어본다
    useEffect(() => {
        if (dirtyCount === 0) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirtyCount]);

    const setEdit = useCallback((k: string, value: string, original: string) => {
        setEdits((current) => {
            const next = { ...current };
            if (value === original) delete next[k];
            else next[k] = value;
            return next;
        });
    }, []);

    /** 화면에 보여 줄 값 = 저장 대기 값이 있으면 그것, 없으면 저장된 값 */
    const shown = (k: string, original: string) => edits[k] ?? original;

    const saveAll = () =>
        run(
            async () => {
                for (const category of categories) {
                    const label = edits[key('cat', category.docId, 'label')];
                    const note = edits[key('cat', category.docId, 'note')];
                    if (label === undefined && note === undefined) continue;
                    await updatePriceCategory(category.docId, {
                        label: label ?? category.label,
                        note: note ?? category.note ?? '',
                        isPublished: category.isPublished,
                    });
                }
                for (const section of sections) {
                    const label = edits[key('sec', section.docId, 'label')];
                    if (label === undefined) continue;
                    await updatePriceSection(section.docId, {
                        categoryId: section.categoryId,
                        label,
                        isPublished: section.isPublished,
                    });
                }
                for (const item of items) {
                    const name = edits[key('item', item.docId, 'name')];
                    const price = edits[key('item', item.docId, 'price')];
                    if (name === undefined && price === undefined) continue;
                    await updatePriceListItem(item.docId, {
                        categoryId: item.categoryId,
                        sectionId: item.sectionId,
                        name: name ?? item.name,
                        productLabel: item.productLabel,
                        description: item.description,
                        sessions:
                            price === undefined
                                ? item.sessions
                                : item.sessions.map((s, i) => (i === 0 ? { ...s, price: digits(price) } : s)),
                        isPublished: item.isPublished,
                    });
                }
                setEdits({});
            },
            '저장에 실패했습니다.',
            '홈페이지에 반영했습니다',
        );

    const board = useMemo(() => buildPriceBoard(categories, sections, items), [categories, sections, items]);
    const activeGroup = board.find((g) => g.category.docId === activeCategoryId) ?? board[0] ?? null;

    const cards = useMemo(() => {
        if (!activeGroup) return [];
        const kw = search.trim().toLowerCase();
        if (!kw) return activeGroup.cards;
        return activeGroup.cards.filter(
            (card) =>
                card.title.toLowerCase().includes(kw) ||
                card.items.some((i) => i.name.toLowerCase().includes(kw)),
        );
    }, [activeGroup, search]);

    const openKeys = openCards ?? (cards[0] ? [cards[0].key] : []);

    /* ── 즉시 저장되는 동작들 (추가 · 삭제 · 순서) ─────────────────────── */
    const moveCategory = (index: number, dir: -1 | 1) => {
        const a = categories[index];
        const b = categories[index + dir];
        if (!a || !b) return;
        void run(
            () => updatePriceCategorySorts([{ docId: a.docId, sort: b.sort }, { docId: b.docId, sort: a.sort }]),
            '순서 변경에 실패했습니다.',
            '순서를 바꿨습니다',
        );
    };

    const addCategory = () => {
        const label = window.prompt('추가할 탭(대분류) 이름을 입력하세요.\n예: 톡신·윤곽')?.trim();
        if (!label) return;
        void run(() => createPriceCategory({ label, note: '', isPublished: true }), '추가에 실패했습니다.', '탭을 추가했습니다');
    };

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">수가표를 불러오는 중입니다.</div>;
    }

    return (
        <div className="pb-32">
            <AdminHeader
                title="수가표 관리"
                description="홈페이지에 나오는 표와 똑같습니다. 글자나 가격을 눌러 고친 뒤, 화면 아래 [저장하기] 를 누르세요."
                previewHref="/price-list"
            />

            <ErrorBanner message={error} />

            {/* 사용법 안내 — 처음 쓰는 사람이 헤매지 않게 */}
            <div className="mt-5 rounded-xl border border-cocoa/10 bg-white px-4 py-3.5 text-caption leading-6 text-latte">
                <b className="text-cocoa">사용법</b> · 고치고 싶은 글자나 가격을 <b className="text-cocoa">직접 클릭</b>해서
                수정하세요. 수정한 칸은 <span className="rounded bg-[#FFF6D6] px-1 py-0.5 text-cocoa">노란색</span> 으로
                표시됩니다. 다 고친 뒤 화면 맨 아래 <b className="text-cocoa">[저장하기]</b> 를 눌러야 홈페이지에 올라갑니다.
                <br />
                카드 추가·삭제와 순서 바꾸기(↑↓)는 누르는 즉시 저장됩니다.
            </div>

            {/* ── 검색 + 탭 : 고객 페이지와 같은 모양 ─────────────────────── */}
            <div className="mt-8 rounded-2xl bg-white p-5 shadow-[0_2px_15px_rgba(69,54,45,0.05)] md:p-7">
                <label className="relative mx-auto block max-w-md">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-latte">⌕</span>
                    <input
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setOpenCards(null);
                        }}
                        placeholder="시술명을 검색해 보세요"
                        className="h-12 w-full rounded-full border border-cocoa/10 bg-[#FBF9F5] pl-11 pr-5 text-caption text-cocoa outline-none focus:border-cocoa/30"
                    />
                </label>

                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {board.map((group) => {
                        const active = activeGroup?.category.docId === group.category.docId;
                        return (
                            <button
                                key={group.category.docId}
                                type="button"
                                onClick={() => {
                                    setActiveCategoryId(group.category.docId);
                                    setOpenCards(null);
                                }}
                                className={`rounded-full border px-4 py-2 text-caption font-semibold transition-colors ${
                                    active
                                        ? 'border-cocoa bg-cocoa text-cream'
                                        : 'border-cocoa/10 bg-white text-latte hover:border-cocoa/25 hover:text-cocoa'
                                }`}
                            >
                                {shown(key('cat', group.category.docId, 'label'), group.category.label)}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        onClick={() => setArrange((v) => !v)}
                        className={`rounded-full border px-3 py-2 text-caption font-semibold transition-colors ${
                            arrange ? 'border-cocoa bg-cocoa/[0.06] text-cocoa' : 'border-cocoa/15 text-latte hover:text-cocoa'
                        }`}
                    >
                        {arrange ? '탭 정리 끝내기' : '탭 이름·순서 바꾸기'}
                    </button>
                </div>

                {/* 탭 정리 모드 */}
                {arrange && (
                    <ul className="mx-auto mt-5 max-w-xl space-y-2 rounded-xl bg-[#FBF9F5] p-3">
                        {categories.map((category, index) => (
                            <li key={category.docId} className="flex items-center gap-2">
                                <span className="w-5 text-center text-caption text-latte">{index + 1}</span>
                                <Field
                                    value={shown(key('cat', category.docId, 'label'), category.label)}
                                    dirty={key('cat', category.docId, 'label') in edits}
                                    onChange={(v) => setEdit(key('cat', category.docId, 'label'), v, category.label)}
                                    className="flex-1 text-small font-semibold text-cocoa"
                                />
                                <IconButton label="위로" disabled={busy || index === 0} onClick={() => moveCategory(index, -1)}>↑</IconButton>
                                <IconButton label="아래로" disabled={busy || index === categories.length - 1} onClick={() => moveCategory(index, 1)}>↓</IconButton>
                                <PublishToggle
                                    published={category.isPublished}
                                    disabled={busy}
                                    onChange={(isPublished) =>
                                        run(
                                            () =>
                                                updatePriceCategory(category.docId, {
                                                    label: category.label,
                                                    note: category.note ?? '',
                                                    isPublished,
                                                }),
                                            '저장에 실패했습니다.',
                                            isPublished ? '공개했습니다' : '숨겼습니다',
                                        )
                                    }
                                />
                                <IconButton
                                    label="탭 삭제"
                                    tone="danger"
                                    disabled={busy}
                                    onClick={() => {
                                        if (!window.confirm(`"${category.label}" 탭을 삭제할까요?\n안에 카드가 남아 있으면 삭제되지 않습니다.`)) return;
                                        void run(() => deletePriceCategory(category.docId), '삭제에 실패했습니다.', '삭제했습니다');
                                    }}
                                >
                                    ×
                                </IconButton>
                            </li>
                        ))}
                        <li>
                            <button
                                type="button"
                                onClick={addCategory}
                                disabled={busy}
                                className="w-full rounded-lg border border-dashed border-cocoa/25 py-2 text-caption font-semibold text-latte hover:border-cocoa/45 hover:text-cocoa"
                            >
                                + 탭 추가
                            </button>
                        </li>
                    </ul>
                )}

                {/* 탭 안내 박스 — 고객 페이지에서 탭 바로 아래 나오는 그 박스 */}
                {activeGroup && (
                    <div className="mt-6 rounded-xl border border-cocoa/10 bg-[#FBF9F5] px-4 py-3">
                        <p className="text-caption-sm font-semibold text-latte">
                            탭 안내 문구 (비우면 안 나옴) · 예: 주름 보톡스 가능 부위
                        </p>
                        <Field
                            multiline
                            value={shown(key('cat', activeGroup.category.docId, 'note'), activeGroup.category.note ?? '')}
                            dirty={key('cat', activeGroup.category.docId, 'note') in edits}
                            onChange={(v) =>
                                setEdit(key('cat', activeGroup.category.docId, 'note'), v, activeGroup.category.note ?? '')
                            }
                            placeholder="예: 주름 보톡스 : 이마 · 미간 · 눈가 중 선택"
                            className="mt-1.5 w-full text-caption text-cocoa"
                        />
                    </div>
                )}

                {/* ── 카드 : 고객 페이지와 같은 아코디언 ───────────────────── */}
                <div className="mt-8 space-y-4">
                    {cards.map((card, index) => {
                        const open = openKeys.includes(card.key);
                        return (
                            <article
                                key={card.key}
                                className="overflow-hidden rounded-2xl border border-cocoa/[0.08] bg-[#FBF9F5]"
                            >
                                <div className="flex items-center gap-2 px-4 py-4 md:px-6">
                                    <Field
                                        value={shown(key('sec', card.section.docId, 'label'), card.section.label)}
                                        dirty={key('sec', card.section.docId, 'label') in edits}
                                        onChange={(v) => setEdit(key('sec', card.section.docId, 'label'), v, card.section.label)}
                                        className="min-w-0 flex-1 text-small font-bold text-cocoa md:text-medium"
                                    />
                                    <IconButton label="위로" disabled={busy || index === 0} onClick={() => {
                                        const b = cards[index - 1];
                                        if (!b) return;
                                        void run(
                                            () => updatePriceSectionSorts([
                                                { docId: card.section.docId, sort: b.section.sort },
                                                { docId: b.section.docId, sort: card.section.sort },
                                            ]),
                                            '순서 변경 실패', '순서를 바꿨습니다',
                                        );
                                    }}>↑</IconButton>
                                    <IconButton label="아래로" disabled={busy || index === cards.length - 1} onClick={() => {
                                        const b = cards[index + 1];
                                        if (!b) return;
                                        void run(
                                            () => updatePriceSectionSorts([
                                                { docId: card.section.docId, sort: b.section.sort },
                                                { docId: b.section.docId, sort: card.section.sort },
                                            ]),
                                            '순서 변경 실패', '순서를 바꿨습니다',
                                        );
                                    }}>↓</IconButton>
                                    <PublishToggle
                                        published={card.section.isPublished}
                                        disabled={busy}
                                        onChange={(isPublished) =>
                                            run(
                                                () => updatePriceSection(card.section.docId, {
                                                    categoryId: card.section.categoryId,
                                                    label: card.section.label,
                                                    isPublished,
                                                }),
                                                '저장 실패', isPublished ? '공개했습니다' : '숨겼습니다',
                                            )
                                        }
                                    />
                                    <IconButton label="카드 삭제" tone="danger" disabled={busy} onClick={() => {
                                        if (!window.confirm(`"${card.section.label}" 카드를 삭제할까요?\n안에 항목이 남아 있으면 삭제되지 않습니다.`)) return;
                                        void run(() => deletePriceSection(card.section.docId), '삭제 실패', '삭제했습니다');
                                    }}>×</IconButton>
                                    <button
                                        type="button"
                                        aria-label={open ? '접기' : '펼치기'}
                                        onClick={() =>
                                            setOpenCards(open ? openKeys.filter((k) => k !== card.key) : [...openKeys, card.key])
                                        }
                                        className="ml-1 h-8 w-8 shrink-0 rounded-lg text-latte hover:bg-cocoa/5"
                                    >
                                        <span className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}>⌄</span>
                                    </button>
                                </div>

                                {open && (
                                    <div className="border-t border-cocoa/[0.07] bg-white px-4 pb-3 md:px-6">
                                        {card.items.map((item, itemIndex) => (
                                            <div
                                                key={item.docId}
                                                className="flex items-center gap-2 border-b border-cocoa/[0.06] py-2.5 last:border-b-0"
                                            >
                                                <Field
                                                    value={shown(key('item', item.docId, 'name'), item.name)}
                                                    dirty={key('item', item.docId, 'name') in edits}
                                                    onChange={(v) => setEdit(key('item', item.docId, 'name'), v, item.name)}
                                                    className="min-w-0 flex-1 text-caption text-cocoa md:text-small"
                                                />
                                                <span className="shrink-0 text-caption text-latte">₩</span>
                                                <Field
                                                    align="right"
                                                    value={shown(
                                                        key('item', item.docId, 'price'),
                                                        String(item.sessions[0]?.price ?? 0),
                                                    )}
                                                    dirty={key('item', item.docId, 'price') in edits}
                                                    onChange={(v) =>
                                                        setEdit(
                                                            key('item', item.docId, 'price'),
                                                            v.replace(/[^0-9]/g, ''),
                                                            String(item.sessions[0]?.price ?? 0),
                                                        )
                                                    }
                                                    format={(v) => (v ? Number(v).toLocaleString('ko-KR') : '')}
                                                    className="w-28 shrink-0 text-caption font-semibold text-cocoa md:text-small"
                                                />
                                                <IconButton label="위로" disabled={busy || itemIndex === 0} onClick={() => {
                                                    const b = card.items[itemIndex - 1];
                                                    void run(
                                                        () => updatePriceListItemSorts([
                                                            { docId: item.docId, sort: b.sort },
                                                            { docId: b.docId, sort: item.sort },
                                                        ]),
                                                        '순서 변경 실패', '순서를 바꿨습니다',
                                                    );
                                                }}>↑</IconButton>
                                                <IconButton label="아래로" disabled={busy || itemIndex === card.items.length - 1} onClick={() => {
                                                    const b = card.items[itemIndex + 1];
                                                    void run(
                                                        () => updatePriceListItemSorts([
                                                            { docId: item.docId, sort: b.sort },
                                                            { docId: b.docId, sort: item.sort },
                                                        ]),
                                                        '순서 변경 실패', '순서를 바꿨습니다',
                                                    );
                                                }}>↓</IconButton>
                                                <IconButton label="항목 삭제" tone="danger" disabled={busy} onClick={() => {
                                                    if (!window.confirm(`"${item.name}" 을(를) 삭제할까요?`)) return;
                                                    void run(() => deletePriceListItem(item.docId), '삭제 실패', '삭제했습니다');
                                                }}>×</IconButton>
                                            </div>
                                        ))}

                                        <button
                                            type="button"
                                            disabled={busy}
                                            onClick={() =>
                                                run(
                                                    () =>
                                                        createPriceListItem({
                                                            categoryId: card.section.categoryId,
                                                            sectionId: card.section.docId,
                                                            name: '새 항목',
                                                            productLabel: '',
                                                            description: '',
                                                            sessions: [{ id: 'option-0', label: '1회', price: 0 }],
                                                            isPublished: true,
                                                        }),
                                                    '추가 실패',
                                                    '항목을 추가했습니다',
                                                )
                                            }
                                            className="my-3 w-full rounded-xl border border-dashed border-cocoa/25 py-2.5 text-caption font-semibold text-latte hover:border-cocoa/45 hover:text-cocoa disabled:opacity-40"
                                        >
                                            + 이 카드에 항목 추가
                                        </button>
                                    </div>
                                )}
                            </article>
                        );
                    })}

                    {activeGroup && (
                        <button
                            type="button"
                            disabled={busy}
                            onClick={() => {
                                const label = window.prompt('추가할 카드 이름을 입력하세요.\n예: 주름 보톡스')?.trim();
                                if (!label) return;
                                void run(
                                    () =>
                                        createPriceSection({
                                            categoryId: activeGroup.category.docId,
                                            label,
                                            isPublished: true,
                                        }),
                                    '추가 실패',
                                    '카드를 추가했습니다',
                                );
                            }}
                            className="w-full rounded-2xl border border-dashed border-cocoa/25 py-4 text-small font-semibold text-latte hover:border-cocoa/45 hover:text-cocoa disabled:opacity-40"
                        >
                            + 카드 추가
                        </button>
                    )}
                </div>

                <p className="mt-8 text-center text-caption text-latte">
                    표시된 가격은 부가세 별도입니다. · 총 {items.length}개 항목
                    {items.length > 0 && ` · 최저 ${formatPrice(Math.min(...items.map((i) => i.sessions[0]?.price ?? 0)))}`}
                </p>
            </div>

            {/* ── 저장 바 : 항상 화면 아래 고정 ────────────────────────────── */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cocoa/10 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-10">
                    <p className="text-caption text-latte">
                        {dirtyCount > 0 ? (
                            <>
                                <b className="text-[#C95813]">저장하지 않은 수정 {dirtyCount}개</b> 가 있습니다.
                                오른쪽 [저장하기] 를 눌러야 홈페이지에 반영됩니다.
                            </>
                        ) : (
                            '수정한 내용이 없습니다. 글자나 가격을 눌러 고쳐 보세요.'
                        )}
                    </p>
                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            disabled={busy || dirtyCount === 0}
                            onClick={() => {
                                if (!window.confirm('저장하지 않은 수정을 모두 되돌릴까요?')) return;
                                setEdits({});
                            }}
                            className="rounded-full border border-cocoa/15 px-5 py-2.5 text-small font-semibold text-cocoa disabled:opacity-30"
                        >
                            되돌리기
                        </button>
                        <button
                            type="button"
                            disabled={busy || dirtyCount === 0}
                            onClick={() => void saveAll()}
                            className="rounded-full bg-[#C95813] px-7 py-2.5 text-small font-bold text-white transition-opacity disabled:bg-cocoa/20 disabled:text-cocoa/40"
                        >
                            {busy ? '저장 중…' : '저장하기'}
                        </button>
                    </div>
                </div>
            </div>

            <Toast message={toast} />
        </div>
    );
}

/** 그 자리에서 고치는 칸. 저장 전이면 노란 배경으로 눈에 띄게 한다. */
function Field({
    value,
    onChange,
    dirty,
    className = '',
    placeholder,
    align = 'left',
    multiline = false,
    format,
}: {
    value: string;
    onChange: (value: string) => void;
    dirty: boolean;
    className?: string;
    placeholder?: string;
    align?: 'left' | 'right';
    multiline?: boolean;
    format?: (value: string) => string;
}) {
    const [focused, setFocused] = useState(false);
    const shown = !focused && format ? format(value) : value;
    const base = `rounded-md border px-2 py-1.5 outline-none transition-colors ${
        align === 'right' ? 'text-right' : ''
    } ${dirty ? 'border-[#E0B84A] bg-[#FFF6D6]' : 'border-transparent bg-transparent hover:border-cocoa/15 hover:bg-white focus:border-cocoa/35 focus:bg-white'} ${className}`;

    if (multiline) {
        return (
            <textarea
                rows={2}
                value={value}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={`${base} resize-y`}
            />
        );
    }

    return (
        <input
            value={shown}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            className={base}
        />
    );
}

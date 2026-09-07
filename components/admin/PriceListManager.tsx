/* 수가표 관리 — 홈페이지 수가표와 같은 탭·카드 표에서 이름과 가격을 눌러 고친다.
   카드는 어느 탭에서든 기본으로 전부 펼쳐 둔다(고객 화면과 같은 상태로 보고 고치게). */

'use client';

import { useEffect, useMemo, useState } from 'react';
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
import {
    AddRowButton,
    AdminHeader,
    DragHandle,
    ErrorBanner,
    Field,
    HelpBanner,
    MoneyField,
    MoveButton,
    SaveBar,
    TextAction,
    Toast,
    VisibilitySwitch,
    confirmDelete,
    reindex,
    useAdminAction,
    useDirtyEdits,
    useDragReorder,
} from '@/components/admin/AdminUI';
import SearchIcon from '@/components/ui/SearchIcon';

const key = (kind: 'cat' | 'sec' | 'item', id: string, field: string) => `${kind}:${id}:${field}`;
const digits = (value: string) => Number(value.replace(/[^0-9]/g, '')) || 0;

export default function PriceListManager() {
    const [categories, setCategories] = useState<PriceCategory[]>([]);
    const [sections, setSections] = useState<PriceSection[]>([]);
    const [items, setItems] = useState<PriceListItem[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [openCards, setOpenCards] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(true);
    const { edits, setEdit, shown, dirtyCount, clearEdits } = useDirtyEdits();
    const { busy, error, toast, run, setError } = useAdminAction();

    useEffect(() => {
        const fail = (loadError: Error) => {
            setError(loadError.message || '수가표를 불러오지 못했습니다.');
            setLoading(false);
        };
        const offCategories = subscribePriceCategories(setCategories, fail);
        const offSections = subscribePriceSections(setSections, fail);
        const offItems = subscribePriceListItems((next) => {
            setItems(next);
            setLoading(false);
        }, fail);
        return () => {
            offCategories();
            offSections();
            offItems();
        };
    }, [setError]);

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
                                : item.sessions.map((session, index) =>
                                      index === 0 ? { ...session, price: digits(price) } : session,
                                  ),
                        isPublished: item.isPublished,
                    });
                }
                clearEdits();
            },
            '저장에 실패했습니다.',
            '홈페이지에 반영했습니다',
        );

    const board = useMemo(() => buildPriceBoard(categories, sections, items), [categories, sections, items]);
    const activeGroup = board.find((group) => group.category.docId === activeCategoryId) ?? board[0] ?? null;

    const cards = useMemo(() => {
        if (!activeGroup) return [];
        const keyword = search.trim().toLowerCase();
        if (!keyword) return activeGroup.cards;
        return activeGroup.cards.filter(
            (card) => card.title.toLowerCase().includes(keyword) || card.items.some((item) => item.name.toLowerCase().includes(keyword)),
        );
    }, [activeGroup, search]);

    /* 기본값은 전부 펼침. 탭 변경·검색에서 setOpenCards(null) 로 되돌리므로
       어느 탭으로 가도 카드가 모두 열린 상태로 시작한다. */
    const openKeys = openCards ?? cards.map((card) => card.key);
    const activeCategory = activeGroup?.category;

    /* ── 순서 바꾸기 ─────────────────────────────────────────────────
       끌어서 옮기거나 화살표로 한 칸씩 옮긴다. 옮긴 뒤 sort 를 0,1,2… 로 다시 매긴다.
       검색 중에는 목록이 걸러져 있어서 재배열하면 안 보이는 줄의 순서가 어긋난다 → 잠근다. */
    const locked = busy || search.trim().length > 0;

    const reorder = (kind: 'cat' | 'card' | 'item', ids: string[]) => {
        const save = { cat: updatePriceCategorySorts, card: updatePriceSectionSorts, item: updatePriceListItemSorts }[kind];
        const done = { cat: '탭 순서를 바꿨습니다', card: '카드 순서를 바꿨습니다', item: '순서를 바꿨습니다' }[kind];
        void run(() => save(reindex(ids)), '순서 변경 실패', done);
    };

    const categoryDrag = useDragReorder((ids) => reorder('cat', ids));
    const cardDrag = useDragReorder((ids) => reorder('card', ids));
    const itemDrag = useDragReorder((ids) => reorder('item', ids));

    /** 화살표로 한 칸 옮기기 */
    const nudge = (kind: 'cat' | 'card' | 'item', ids: string[], index: number, step: number) => {
        const swap = index + step;
        if (swap < 0 || swap >= ids.length) return;
        const next = [...ids];
        [next[index], next[swap]] = [next[swap], next[index]];
        reorder(kind, next);
    };

    const categoryIds = categories.map((category) => category.docId);
    const cardIds = cards.map((card) => card.section.docId);
    const activeIndex = activeCategory ? categoryIds.indexOf(activeCategory.docId) : -1;

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">수가표를 불러오는 중입니다.</div>;
    }

    return (
        <div className="pb-32">
            <AdminHeader
                title="수가표 관리"
                description="홈페이지 시술&가격 표와 똑같습니다. 이름과 가격을 눌러 고친 뒤 [저장하기]를 누르세요."
                previewHref="/price-list"
            />
            <ErrorBanner message={error} />
            <HelpBanner>
                <b className="text-cocoa">사용법</b> · 표 안의 글자나 가격을 눌러 고칩니다. 고친 칸은{' '}
                <span className="rounded bg-[#FFF6D6] px-1 py-0.5 text-cocoa">노란색</span>이 됩니다. 다 고친 뒤 아래{' '}
                <b className="text-cocoa">[저장하기]</b>를 눌러야 홈페이지에 나갑니다.
                <br />
                순서는 왼쪽 <b className="text-cocoa">점 여섯 개(⠿)</b>를 잡고 끌거나 <b className="text-cocoa">화살표</b>로
                한 칸씩 옮깁니다. 추가·삭제·순서·숨기기는 누르는 즉시 반영됩니다.
            </HelpBanner>

            <div className="mx-auto mt-8 max-w-[960px]">
                <label className="relative mx-auto block max-w-md">
                    <SearchIcon />
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setOpenCards(null);
                        }}
                        placeholder="시술명을 검색해 보세요"
                        className="h-12 w-full rounded-full border border-cocoa/10 bg-cream pl-11 pr-5 text-caption text-cocoa outline-none focus:border-cocoa/30"
                    />
                </label>

                {/* 탭은 알약을 그대로 잡고 끌어서 순서를 바꾼다 (안에 입력칸이 없어 손잡이가 따로 필요 없다) */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {board.map((group) => {
                        const docId = group.category.docId;
                        const active = activeGroup?.category.docId === docId;
                        const drag = locked ? {} : { ...categoryDrag.rowProps(docId, categoryIds), ...categoryDrag.handleProps(docId) };
                        return (
                            <button
                                key={docId}
                                type="button"
                                {...drag}
                                onClick={() => {
                                    setActiveCategoryId(docId);
                                    setOpenCards(null);
                                }}
                                className={`rounded-full border px-4 py-2 text-caption font-semibold transition-colors ${
                                    locked ? '' : 'cursor-grab active:cursor-grabbing'
                                } ${categoryDrag.isTarget(docId) ? 'ring-2 ring-[#C95813] ring-offset-1' : ''} ${
                                    categoryDrag.isMoving(docId) ? 'opacity-40' : ''
                                } ${
                                    active
                                        ? 'border-deep bg-deep text-cream'
                                        : 'border-cocoa/10 bg-cream text-latte hover:border-cocoa/25 hover:text-cocoa'
                                }`}
                            >
                                {shown(key('cat', docId, 'label'), group.category.label)}
                            </button>
                        );
                    })}
                    <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                            run(
                                () => createPriceCategory({ label: '새 카테고리', note: '', isPublished: true }),
                                '추가 실패',
                                '카테고리를 추가했습니다',
                            )
                        }
                        className="rounded-full border border-dashed border-cocoa/25 px-4 py-2 text-caption font-semibold text-latte transition-colors hover:border-cocoa/50 hover:text-cocoa disabled:opacity-40"
                    >
                        + 카테고리 추가
                    </button>
                </div>

                {activeCategory && (
                    <div className="mt-6 rounded-2xl border border-cocoa/10 bg-cream px-5 py-4">
                        <p className="text-caption font-semibold text-latte">이 카테고리 이름 · 안내 문구</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <Field
                                value={shown(key('cat', activeCategory.docId, 'label'), activeCategory.label)}
                                dirty={key('cat', activeCategory.docId, 'label') in edits}
                                onChange={(value) => setEdit(key('cat', activeCategory.docId, 'label'), value, activeCategory.label)}
                                className="max-w-xs text-small font-bold text-cocoa"
                            />
                            <VisibilitySwitch
                                visible={activeCategory.isPublished}
                                disabled={busy}
                                onChange={(isPublished) =>
                                    run(
                                        () =>
                                            updatePriceCategory(activeCategory.docId, {
                                                label: activeCategory.label,
                                                note: activeCategory.note ?? '',
                                                isPublished,
                                            }),
                                        '저장 실패',
                                        isPublished ? '이 카테고리를 보이게 했습니다' : '이 카테고리를 숨겼습니다',
                                    )
                                }
                            />
                            <MoveButton
                                dir="left"
                                disabled={locked || activeIndex <= 0}
                                onClick={() => nudge('cat', categoryIds, activeIndex, -1)}
                            />
                            <MoveButton
                                dir="right"
                                disabled={locked || activeIndex < 0 || activeIndex === categoryIds.length - 1}
                                onClick={() => nudge('cat', categoryIds, activeIndex, 1)}
                            />
                            <TextAction
                                tone="danger"
                                disabled={busy}
                                onClick={() => {
                                    if (!confirmDelete(activeCategory.label)) return;
                                    void run(() => deletePriceCategory(activeCategory.docId), '삭제 실패', '카테고리를 삭제했습니다');
                                }}
                            >
                                이 카테고리 삭제
                            </TextAction>
                        </div>
                        <Field
                            multiline
                            value={shown(key('cat', activeCategory.docId, 'note'), activeCategory.note ?? '')}
                            dirty={key('cat', activeCategory.docId, 'note') in edits}
                            onChange={(value) => setEdit(key('cat', activeCategory.docId, 'note'), value, activeCategory.note ?? '')}
                            placeholder="예: 주름 보톡스 : 이마 · 미간 · 눈가 중 선택 (비우면 안 나옴)"
                            className="mt-2 text-caption text-latte"
                        />
                    </div>
                )}

                <div className="mt-8 space-y-4">
                    {/* 카드 추가는 목록 위에 둔다 — 아래로 한참 내려가야 새 카드가 보이던 문제 */}
                    {activeGroup && (
                        <AddRowButton
                            disabled={busy}
                            onClick={() =>
                                run(
                                    () =>
                                        createPriceSection(
                                            { categoryId: activeGroup.category.docId, label: '새 카드', isPublished: true },
                                            { first: true },
                                        ),
                                    '추가 실패',
                                    '카드를 맨 위에 추가했습니다',
                                )
                            }
                        >
                            + {shown(key('cat', activeGroup.category.docId, 'label'), activeGroup.category.label)}에 카드 추가
                        </AddRowButton>
                    )}

                    {cards.map((card, index) => {
                        const open = openKeys.includes(card.key);
                        const sectionId = card.section.docId;
                        return (
                            <article
                                key={card.key}
                                {...(locked ? {} : cardDrag.rowProps(sectionId, cardIds))}
                                className={`overflow-hidden rounded-2xl border bg-cream shadow-[0_8px_24px_rgba(69,54,45,0.035)] ${
                                    cardDrag.isTarget(sectionId) ? 'border-[#C95813]' : 'border-cocoa/[0.08]'
                                } ${cardDrag.isMoving(sectionId) ? 'opacity-40' : ''}`}
                            >
                                <div className="flex items-center gap-2 px-3 py-5 md:px-5">
                                    <DragHandle disabled={locked} {...(locked ? {} : cardDrag.handleProps(sectionId))} />
                                    <Field
                                        value={shown(key('sec', sectionId, 'label'), card.section.label)}
                                        dirty={key('sec', sectionId, 'label') in edits}
                                        onChange={(value) => setEdit(key('sec', sectionId, 'label'), value, card.section.label)}
                                        className="min-w-0 flex-1 text-small font-bold text-cocoa md:text-medium"
                                    />
                                    <MoveButton
                                        dir="up"
                                        disabled={locked || index === 0}
                                        onClick={() => nudge('card', cardIds, index, -1)}
                                    />
                                    <MoveButton
                                        dir="down"
                                        disabled={locked || index === cards.length - 1}
                                        onClick={() => nudge('card', cardIds, index, 1)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setOpenCards(open ? openKeys.filter((cardKey) => cardKey !== card.key) : [...openKeys, card.key])
                                        }
                                        className="shrink-0 px-1 text-caption text-latte hover:text-cocoa"
                                    >
                                        {open ? '접기' : '펼치기'}
                                    </button>
                                </div>

                                {open && (
                                    <div className="px-3 pb-3 md:px-5">
                                        {(() => {
                                            const itemIds = card.items.map((entry) => entry.docId);
                                            return card.items.map((item, itemIndex) => (
                                            <div
                                                key={item.docId}
                                                {...(locked ? {} : itemDrag.rowProps(item.docId, itemIds))}
                                                className={`flex items-center gap-2 border-t py-3 ${
                                                    itemDrag.isTarget(item.docId) ? 'border-[#C95813]' : 'border-cocoa/[0.07]'
                                                } ${itemDrag.isMoving(item.docId) ? 'opacity-40' : ''}`}
                                            >
                                                <DragHandle disabled={locked} {...(locked ? {} : itemDrag.handleProps(item.docId))} />
                                                <Field
                                                    value={shown(key('item', item.docId, 'name'), item.name)}
                                                    dirty={key('item', item.docId, 'name') in edits}
                                                    onChange={(value) => setEdit(key('item', item.docId, 'name'), value, item.name)}
                                                    className="min-w-0 flex-1 text-caption text-latte md:text-small"
                                                />
                                                <div className="w-[20%] min-w-24 shrink-0">
                                                    <MoneyField
                                                        value={shown(key('item', item.docId, 'price'), String(item.sessions[0]?.price ?? 0))}
                                                        dirty={key('item', item.docId, 'price') in edits}
                                                        onChange={(value) =>
                                                            setEdit(
                                                                key('item', item.docId, 'price'),
                                                                value,
                                                                String(item.sessions[0]?.price ?? 0),
                                                            )
                                                        }
                                                        className="text-caption font-medium text-cocoa md:text-small"
                                                    />
                                                </div>
                                                <span className="flex shrink-0 items-center gap-1">
                                                    <MoveButton
                                                        dir="up"
                                                        disabled={locked || itemIndex === 0}
                                                        onClick={() => nudge('item', itemIds, itemIndex, -1)}
                                                    />
                                                    <MoveButton
                                                        dir="down"
                                                        disabled={locked || itemIndex === card.items.length - 1}
                                                        onClick={() => nudge('item', itemIds, itemIndex, 1)}
                                                    />
                                                    <TextAction
                                                        tone="danger"
                                                        disabled={busy}
                                                        onClick={() => {
                                                            if (!confirmDelete(item.name)) return;
                                                            void run(() => deletePriceListItem(item.docId), '삭제 실패', '삭제했습니다');
                                                        }}
                                                    >
                                                        삭제
                                                    </TextAction>
                                                </span>
                                            </div>
                                            ));
                                        })()}

                                        <div className="mt-3">
                                            <AddRowButton
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
                                                        '행을 추가했습니다',
                                                    )
                                                }
                                            >
                                                + 이 카드에 항목 추가
                                            </AddRowButton>
                                        </div>

                                        <div className="mt-3 flex flex-wrap gap-2">
                                            <VisibilitySwitch
                                                visible={card.section.isPublished}
                                                disabled={busy}
                                                onChange={(isPublished) =>
                                                    run(
                                                        () =>
                                                            updatePriceSection(card.section.docId, {
                                                                categoryId: card.section.categoryId,
                                                                label: card.section.label,
                                                                isPublished,
                                                            }),
                                                        '저장 실패',
                                                        isPublished ? '이 카드를 보이게 했습니다' : '이 카드를 숨겼습니다',
                                                    )
                                                }
                                            />
                                            <TextAction
                                                tone="danger"
                                                disabled={busy}
                                                onClick={() => {
                                                    if (!confirmDelete(card.section.label)) return;
                                                    void run(() => deletePriceSection(sectionId), '삭제 실패', '삭제했습니다');
                                                }}
                                            >
                                                이 카드 삭제
                                            </TextAction>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    })}

                </div>

                <p className="mt-10 text-center text-caption text-latte">
                    표시된 가격은 부가세 별도입니다.
                    {items.length > 0 && ` · 최저 ${formatPrice(Math.min(...items.map((item) => item.sessions[0]?.price ?? 0)))}`}
                </p>
            </div>

            <SaveBar
                dirtyCount={dirtyCount}
                busy={busy}
                onSave={() => void saveAll()}
                onRevert={() => {
                    if (!window.confirm('저장하지 않은 수정을 모두 되돌릴까요?')) return;
                    clearEdits();
                }}
            />
            <Toast message={toast} />
        </div>
    );
}

/* 수가표 관리 — 홈페이지 수가표와 같은 탭·카드 표에서 이름과 가격을 눌러 고친다.
   카드는 어느 탭에서든 기본으로 전부 펼쳐 둔다(고객 화면과 같은 상태로 보고 고치게).

   #ISSUE: 2026.09.16 수가표를 "회차·용량을 열로 세운 표" 로 묶었는데(priceBoard.ts),
           관리자는 한 줄에 가격 한 칸(sessions[0])만 고칠 수 있어서
           주름 보톡스 3부위·올인원처럼 두 번째 열부터는 아예 손댈 수가 없었다.
   → 홈페이지와 같은 열을 그려 놓고 칸마다 가격을 고치게 한다.
     열 이름은 카드 단위로 한 번 고치면 그 카드 모든 줄에 같이 반영된다. */

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
    isConsultPrice,
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
    type PriceListItemInput,
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

const key = (kind: 'cat' | 'sec' | 'item' | 'col', id: string, field: string) => `${kind}:${id}:${field}`;
const digits = (value: string) => Number(value.replace(/[^0-9]/g, '')) || 0;

/** 카드에 놓을 가격 열. 홈페이지와 같은 순서(줄에 처음 나온 순)로 모은다. 빈 카드는 1회 한 칸. */
function columnLabels(cardItems: PriceListItem[]): string[] {
    const labels: string[] = [];
    for (const item of cardItems) {
        for (const session of item.sessions) {
            const label = session.label.trim();
            if (label && !labels.includes(label)) labels.push(label);
        }
    }
    return labels.length > 0 ? labels : ['1회'];
}

/** 항목 저장용 형태. docId·sort 처럼 건드리면 안 되는 값이 섞여 들어가지 않게 한 곳에서 만든다. */
const itemInput = (item: PriceListItem, patch: Partial<PriceListItemInput> = {}): PriceListItemInput => ({
    categoryId: item.categoryId,
    sectionId: item.sectionId,
    name: item.name,
    productLabel: item.productLabel,
    description: item.description,
    sessions: item.sessions,
    isPublished: item.isPublished,
    ...patch,
});

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
                /* 열 이름은 카드 하나에 하나지만 실제 값은 줄마다 들고 있다(sessions).
                   → 어떤 이름을 어떤 이름으로 바꿀지 먼저 모아 두고, 항목은 아래에서 한 번만 저장한다. */
                const renames = new Map<string, Map<string, string>>();
                for (const section of sections) {
                    for (const column of columnLabels(items.filter((item) => item.sectionId === section.docId))) {
                        const next = edits[key('col', section.docId, column)]?.trim();
                        if (!next || next === column) continue;
                        renames.set(section.docId, (renames.get(section.docId) ?? new Map()).set(column, next));
                    }
                }

                for (const item of items) {
                    const name = edits[key('item', item.docId, 'name')];
                    const rename = renames.get(item.sectionId);
                    const sessions = item.sessions.map((session) => {
                        const price = edits[key('item', item.docId, `price:${session.id}`)];
                        return {
                            ...session,
                            label: rename?.get(session.label.trim()) ?? session.label,
                            price: price === undefined ? session.price : digits(price),
                        };
                    });
                    const touched = sessions.some(
                        (session, index) =>
                            session.label !== item.sessions[index].label || session.price !== item.sessions[index].price,
                    );
                    if (name === undefined && !touched) continue;
                    await updatePriceListItem(item.docId, itemInput(item, { name: name ?? item.name, sessions }));
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
    /* 맨 아래 안내 줄에 쓰는 최저가. 방금 만든 0원 칸은 값이 아니라 빈칸이므로 뺀다. */
    const lowestPrice = Math.min(
        ...items.flatMap((item) => item.sessions.map((session) => session.price)).filter((price) => price > 0),
    );

    /* ── 가격 열 ─────────────────────────────────────────────────────
       열은 카드에 저장되는 값이 아니라 "줄들이 들고 있는 회차·용량 이름" 을 모은 것이다.
       그래서 열을 더하고 지우는 일은 그 카드 모든 줄을 같이 고치는 것과 같다. */
    const setSessions = async (cardItems: PriceListItem[], make: (item: PriceListItem) => PriceListItem['sessions']) => {
        await Promise.all(cardItems.map((item) => updatePriceListItem(item.docId, itemInput(item, { sessions: make(item) }))));
    };

    const addColumn = (cardItems: PriceListItem[], label: string) =>
        run(
            () =>
                setSessions(cardItems, (item) => [
                    ...item.sessions,
                    { id: `option-${item.sessions.length}-${Date.now()}`, label, price: 0 },
                ]),
            '열 추가 실패',
            `"${label}" 열을 만들었습니다`,
        );

    const removeColumn = (cardItems: PriceListItem[], label: string) =>
        run(
            () => setSessions(cardItems, (item) => item.sessions.filter((session) => session.label.trim() !== label)),
            '열 삭제 실패',
            `"${label}" 열을 지웠습니다`,
        );

    /** 그 줄에만 없는 칸 하나 만들기 (예: 레비나스 3000샷에 3회 가격을 새로 넣을 때) */
    const addCell = (item: PriceListItem, label: string) =>
        run(
            () =>
                updatePriceListItem(
                    item.docId,
                    itemInput(item, {
                        sessions: [...item.sessions, { id: `option-${item.sessions.length}-${Date.now()}`, label, price: 0 }],
                    }),
                ),
            '칸 추가 실패',
            `"${label}" 칸을 만들었습니다`,
        );

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
                가격이 여러 개인 카드는 <b className="text-cocoa">가격 열</b>(1부위·3부위·올인원, 50U·75U·100U 처럼)로
                나뉩니다. 카드 맨 윗줄에서 열 이름을 고치면 그 카드 모든 줄에 함께 반영됩니다.
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
                        const itemIds = card.items.map((entry) => entry.docId);
                        const columns = columnLabels(card.items);
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
                                        {/* 열 이름 줄 — 홈페이지 표 머리글과 같다. 여기서 고치면 이 카드 모든 줄에 반영된다.
                                            열이 하나뿐이면 홈페이지에도 머리글이 안 나오므로 이 줄도 감춘다. */}
                                        {columns.length > 1 && (
                                            <div className="flex items-center gap-2 border-t border-cocoa/[0.07] py-2">
                                                <span aria-hidden className="w-5 shrink-0" />
                                                <p className="min-w-0 flex-1 px-1.5 text-caption-sm font-semibold text-latte">
                                                    가격 열 (회차 · 용량 · 부위)
                                                </p>
                                                {columns.map((column) => (
                                                    <div key={column} className="w-24 shrink-0 md:w-28">
                                                        <Field
                                                            value={shown(key('col', sectionId, column), column)}
                                                            dirty={key('col', sectionId, column) in edits}
                                                            onChange={(value) => setEdit(key('col', sectionId, column), value, column)}
                                                            align="right"
                                                            className="text-caption-sm font-semibold text-cocoa"
                                                        />
                                                    </div>
                                                ))}
                                                <span className="w-24 shrink-0" />
                                            </div>
                                        )}

                                        {card.items.map((item, itemIndex) => (
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
                                                {columns.map((column) => {
                                                    const session = item.sessions.find((entry) => entry.label.trim() === column);
                                                    const priceKey = key('item', item.docId, `price:${session?.id ?? column}`);
                                                    return (
                                                        <div key={column} className="w-24 shrink-0 md:w-28">
                                                            {session ? (
                                                                /* 상담 문의 칸은 금액이 없으니 빈 칸으로 두고 흐린 글씨로 알려 준다.
                                                                   숫자를 적으면 그대로 금액이 된다. */
                                                                <MoneyField
                                                                    value={shown(
                                                                        priceKey,
                                                                        isConsultPrice(session.price) ? '' : String(session.price),
                                                                    )}
                                                                    dirty={priceKey in edits}
                                                                    placeholder={isConsultPrice(session.price) ? '상담 문의' : '0'}
                                                                    onChange={(value) => setEdit(priceKey, value, String(session.price))}
                                                                    className="text-caption font-medium text-cocoa md:text-small"
                                                                />
                                                            ) : (
                                                                /* 이 줄에는 없는 열 — 홈페이지에서 "–" 로 나오는 칸 */
                                                                <TextAction disabled={busy} onClick={() => void addCell(item, column)}>
                                                                    + 가격 넣기
                                                                </TextAction>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                                <span className="flex w-24 shrink-0 items-center justify-end gap-1">
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
                                        ))}

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
                                                                // 새 줄도 이 카드와 같은 열을 갖게 만든다
                                                                sessions: columns.map((label, columnIndex) => ({
                                                                    id: `option-${columnIndex}`,
                                                                    label,
                                                                    price: 0,
                                                                })),
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
                                                disabled={busy || card.items.length === 0}
                                                onClick={() => {
                                                    const label = window.prompt(
                                                        '새로 만들 가격 열 이름을 적어 주세요. (예: 3회, 100U, 올인원)',
                                                        '3회',
                                                    );
                                                    if (!label?.trim() || columns.includes(label.trim())) return;
                                                    void addColumn(card.items, label.trim());
                                                }}
                                            >
                                                + 가격 열 추가
                                            </TextAction>
                                            {columns.length > 1 && (
                                                <span className="flex flex-wrap items-center gap-1 text-caption-sm text-latte">
                                                    열 지우기
                                                    {columns.map((column) => (
                                                        <TextAction
                                                            key={column}
                                                            tone="danger"
                                                            disabled={busy}
                                                            onClick={() => {
                                                                if (!confirmDelete(`${card.section.label} 의 ${column} 열`)) return;
                                                                void removeColumn(card.items, column);
                                                            }}
                                                        >
                                                            {column}
                                                        </TextAction>
                                                    ))}
                                                </span>
                                            )}
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
                    {Number.isFinite(lowestPrice) && ` · 최저 ${formatPrice(lowestPrice)}`}
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

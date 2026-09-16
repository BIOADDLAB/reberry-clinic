/* #COMPONENTS: 고객용 수가표
   #ISSUE: 예전 버전은 Firestore 데이터가 지저분해서 화면에서 이름을 정규식으로 잘라 붙이고
           카테고리도 코드에 하드코딩된 8종(CATEGORY_KEYS)으로 강제 매핑했다.
           → 관리자에서 카테고리를 추가하거나 순서를 바꿔도 화면이 안 따라오고,
             이름 규칙이 조금만 달라져도 카드 제목이 깨졌다.
   → 2026.09 수가표 개편에 맞춰 "보이는 대로 저장된 대로" 로 단순화한다.
        대분류(category)  = 상단 탭      · category.sort 순
        카드(section)     = 가격 카드     · section.sort 순
        행(item×session)  = 카드 안 한 줄 · item.sort 순
     관리자(PriceListManager)가 이 구조를 그대로 편집하므로 저장 즉시 이 화면에 반영된다.

   #ISSUE: 카드가 아코디언이라 병원에서 "카드 펼치면 항목이 전부 주루룩 나오는 건지" 를 되물었고,
           접힌 카드 때문에 가격 비교가 안 된다는 피드백을 받아 한동안 아코디언을 완전히 없앴다.
   → 다시 확인해 보니 요청은 "아코디언 자체가 아니라 처음 진입했을 때 전부 펼쳐져 있어야 한다" 는 것.
     그래서 접고 펼치는 기능은 되살리고, 기본값만 "전부 펼침" 으로 둔다.
     탭을 바꾸거나 검색을 지우면 다시 전부 펼쳐진 상태로 돌아간다.

   #ISSUE: 2026.09.16 — "묶을 수 있는 건 다 묶어 달라".
   → 회차·용량이 여러 개인 카드는 그것을 표의 열로 세운다 (하이톡스 | 1부위 · 3부위 · 올인원).
     어떤 카드를 표로 만들지는 priceBoard 가 정하고(card.layout), 여기서는 그리기만 한다. */

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
    formatPrice,
    isConsultPrice,
    subscribePriceCategories,
    subscribePriceListItems,
    subscribePriceSections,
    type PriceCategory,
    type PriceListItem,
    type PriceSection,
} from '@/components/lib/priceList';
import { buildPriceBoard, type PriceBoardCard } from '@/components/lib/priceBoard';
import SearchIcon from '@/components/ui/SearchIcon';

const AREA_NOTE_DESIGN: 1 | 2 | 3 | 4 | 5 = 1;

/* 탭 안내 문구를 부위 목록으로 보여 주기 위한 해석.
   관리자에서는 그냥 여러 줄 글로 적는다.
     "주름 보톡스 : 이마 · 미간 · 눈가"  → 제목 + 부위 목록
     "용량은 상담 후 안내합니다."         → 아래 각주 한 줄 */
interface NoteChipGroup {
    label: string;
    chips: string[];
}

function parseNote(note: string): { groups: NoteChipGroup[]; footnotes: string[] } {
    const groups: NoteChipGroup[] = [];
    const footnotes: string[] = [];

    for (const line of note.split('\n').map((entry) => entry.trim()).filter(Boolean)) {
        const divider = line.indexOf(':');
        const chips =
            divider > 0
                ? line
                      .slice(divider + 1)
                      .split('·')
                      .map((chip) => chip.trim())
                      .filter(Boolean)
                : [];
        if (chips.length > 1) groups.push({ label: line.slice(0, divider).trim(), chips });
        else footnotes.push(line);
    }

    return { groups, footnotes };
}

export default function PriceListClient() {
    const t = useTranslations('priceList');
    const locale = useLocale();
    const [categories, setCategories] = useState<PriceCategory[]>([]);
    const [sections, setSections] = useState<PriceSection[]>([]);
    const [items, setItems] = useState<PriceListItem[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [openCards, setOpenCards] = useState<string[] | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fail = () => {
            setError(t('loadError'));
            setLoading(false);
        };
        const unsubscribeCategories = subscribePriceCategories(setCategories, fail, true);
        const unsubscribeSections = subscribePriceSections(setSections, fail, true);
        const unsubscribeItems = subscribePriceListItems(
            (nextItems) => {
                setItems(nextItems);
                setLoading(false);
            },
            fail,
            true,
        );
        return () => {
            unsubscribeCategories();
            unsubscribeSections();
            unsubscribeItems();
        };
    }, [t]);

    // 저장된 순서 그대로 [카테고리 → 카드 → 행] 으로 조립한다
    const board = useMemo(() => buildPriceBoard(categories, sections, items), [categories, sections, items]);

    const activeGroup = board.find((group) => group.category.docId === activeCategoryId) ?? board[0] ?? null;
    const keyword = search.trim().toLowerCase();

    /* 검색어가 있으면 분류를 넘어 전체에서 찾는다. 없으면 고른 탭만 본다. */
    const cards = useMemo(() => {
        const scope = keyword ? board : board.filter((group) => group === activeGroup);
        const found: PriceBoardCard[] = [];
        for (const group of scope) {
            for (const card of group.cards) {
                if (!keyword) {
                    found.push(card);
                    continue;
                }
                const titleHit = card.title.toLowerCase().includes(keyword);
                const rows = titleHit
                    ? card.rows
                    : card.rows.filter((row) => row.label.toLowerCase().includes(keyword));
                if (rows.length > 0) found.push({ ...card, rows });
            }
        }
        return found;
    }, [board, activeGroup, keyword]);

    const note = keyword ? { groups: [], footnotes: [] } : parseNote(activeGroup?.category.note ?? '');
    const moneyLocale = locale === 'ko' ? 'ko-KR' : locale;

    /* 기본값(openCards === null)은 "전부 펼침". 검색 중에는 찾은 카드가 안 보이면 안 되니 항상 편다. */
    const openKeys = keyword ? cards.map((card) => card.key) : openCards ?? cards.map((card) => card.key);

    if (loading) return <StatusMessage>{t('loading')}</StatusMessage>;
    if (error) return <StatusMessage>{error}</StatusMessage>;

    return (
        <div className="mx-auto w-full max-w-[960px]">
            <label className="relative mx-auto block max-w-md">
                <SearchIcon />
                <span className="sr-only">{t('search')}</span>
                <input
                    value={search}
                    onChange={(event) => {
                        setSearch(event.target.value);
                        setOpenCards(null);
                    }}
                    placeholder={t('searchPlaceholder')}
                    className="h-12 w-full rounded-full border border-cocoa/10 bg-cream pl-11 pr-5 text-caption text-cocoa outline-none transition-colors placeholder:text-latte/55 focus:border-cocoa/30"
                />
            </label>

            {/* 탭 = 관리자에 등록된 대분류. 순서·이름 모두 관리자에서 바꾸면 그대로 반영된다 */}
            <nav
                aria-label="시술 가격 분류"
                className="no-scrollbar -mx-6 mt-5 overflow-x-auto px-6 pb-2 md:mx-0 md:overflow-visible md:px-0"
            >
                <div className="mx-auto flex min-w-max gap-2 md:min-w-0 md:flex-wrap md:justify-center">
                    {board.map((group) => {
                        const active = !keyword && activeGroup?.category.docId === group.category.docId;
                        return (
                            <button
                                key={group.category.docId}
                                type="button"
                                aria-current={active ? 'page' : undefined}
                                onClick={() => {
                                    setSearch('');
                                    setActiveCategoryId(group.category.docId);
                                    setOpenCards(null);
                                }}
                                className={`rounded-full border px-4 py-2 text-caption font-semibold transition-colors ${
                                    active
                                        ? 'border-deep bg-deep text-cream'
                                        : 'border-cocoa/10 bg-cream text-latte hover:border-cocoa/25 hover:text-cocoa'
                                }`}
                            >
                                {group.category.label}
                            </button>
                        );
                    })}
                </div>
            </nav>

            {/* 탭마다 관리자에서 적어 두는 안내 문구 (예: 주름 보톡스 가능 부위) */}
            {(note.groups.length > 0 || note.footnotes.length > 0) && (
                <div className="mt-8">
                    {AREA_NOTE_DESIGN === 1 && <AreaNoteInline groups={note.groups} footnotes={note.footnotes} />}
                    {AREA_NOTE_DESIGN === 2 && <AreaNoteCards groups={note.groups} footnotes={note.footnotes} />}
                    {AREA_NOTE_DESIGN === 3 && <AreaNoteTabs groups={note.groups} footnotes={note.footnotes} />}
                    {AREA_NOTE_DESIGN === 4 && <AreaNoteSentence groups={note.groups} footnotes={note.footnotes} />}
                    {AREA_NOTE_DESIGN === 5 && <AreaNoteFold groups={note.groups} footnotes={note.footnotes} />}
                </div>
            )}

            {/* 카드는 기본으로 전부 펼쳐 두되, 제목을 눌러 각자 접고 펼 수 있다 */}
            <div className="mt-8 space-y-4">
                {cards.map((card) => {
                    const open = openKeys.includes(card.key);
                    return (
                        <article
                            key={card.key}
                            className="overflow-hidden rounded-2xl border border-cocoa/[0.08] bg-cream shadow-[0_8px_24px_rgba(69,54,45,0.035)]"
                        >
                            <button
                                type="button"
                                onClick={() =>
                                    setOpenCards(open ? openKeys.filter((cardKey) => cardKey !== card.key) : [...openKeys, card.key])
                                }
                                aria-expanded={open}
                                className="flex w-full items-start justify-between gap-4 px-5 pt-5 pb-4 text-left md:px-7"
                            >
                                <span>
                                    <h2 className="text-small font-bold text-cocoa md:text-medium">{card.title}</h2>
                                    {card.note && <p className="mt-2 text-caption leading-6 text-latte">{card.note}</p>}
                                </span>
                                <ChevronIcon open={open} />
                            </button>
                            {open && (
                                <div className="px-5 pb-2 md:px-7">
                                    {card.layout === 'table' ? (
                                        <PriceTable
                                            card={card}
                                            moneyLocale={moneyLocale}
                                            itemHeading={t('columnItem')}
                                            consultLabel={t('consultPrice')}
                                        />
                                    ) : (
                                        card.rows.map((row) => (
                                            <div
                                                key={row.id}
                                                className="flex items-start justify-between gap-5 border-t border-cocoa/[0.07] py-3.5"
                                            >
                                                <span className="min-w-0 text-caption leading-6 text-latte md:text-small">
                                                    {row.label}
                                                </span>
                                                <strong className="shrink-0 text-caption font-medium text-cocoa md:text-small">
                                                    <PriceCell
                                                        price={row.cells[0]?.price ?? 0}
                                                        moneyLocale={moneyLocale}
                                                        consultLabel={t('consultPrice')}
                                                    />
                                                </strong>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </article>
                    );
                })}
            </div>

            {cards.length === 0 && <StatusMessage>{t('empty')}</StatusMessage>}

            <div className="mt-10 text-center">
                <p className="text-caption leading-6 text-latte">{t('vatNotice')}</p>
                <Link
                    href="/reservation"
                    className="mt-5 inline-flex min-h-12 items-center justify-center rounded-full bg-cocoa px-7 py-3 text-caption font-bold text-cream transition-colors hover:bg-deep"
                >
                    {t('kakaoCta')}
                </Link>
            </div>
        </div>
    );
}

/* 회차·용량을 열로 세운 가격 표.
   #ISSUE: 처음에는 열 너비를 브라우저에 맡겼는데(table-auto), 남는 폭을 열 수대로 나눠 갖는 바람에
           열이 둘인 카드는 가격 사이가 휑하고 넷인 카드는 촘촘해서 카드마다 간격이 달라 보였다.
   → table-fixed 로 가격 열을 모두 같은 너비(PRICE_COLUMN)로 고정하고 시술명 칸이 남는 폭을 다 먹는다.
     그러면 열이 하나든 넷이든 가격이 오른쪽 끝에 같은 간격으로 붙는다.
        1열              ·                    1개가격
        2열              ·        2개가격  2개가격
     열이 넷까지 늘 수 있어서 좁은 화면에서는 카드 안에서만 옆으로 밀리게 둔다.
     아래 두 값은 그 "밀리기 시작하는 폭" 이라 모바일 칸 너비(w-[84px])와 맞춰 둔다. */
const PRICE_COLUMN = 84;
const NAME_COLUMN_MIN = 116;

/** 금액 한 칸. 가격이 아직 없는 시술은 숫자 자리에 "상담 문의" 가 들어간다 (CONSULT_PRICE). */
function PriceCell({
    price,
    moneyLocale,
    consultLabel,
}: {
    price: number;
    moneyLocale: string;
    consultLabel: string;
}) {
    if (isConsultPrice(price)) return <>{consultLabel}</>;
    return <>{formatPrice(price, moneyLocale)}</>;
}

function PriceTable({
    card,
    moneyLocale,
    itemHeading,
    consultLabel,
}: {
    card: PriceBoardCard;
    moneyLocale: string;
    itemHeading: string;
    consultLabel: string;
}) {
    return (
        <div className="-mx-1 overflow-x-auto px-1">
            <table
                className="w-full table-fixed border-collapse text-left"
                style={{ minWidth: NAME_COLUMN_MIN + card.columns.length * PRICE_COLUMN }}
            >
                <thead>
                    <tr>
                        <th
                            scope="col"
                            className="border-t border-cocoa/[0.07] py-2.5 pr-3 text-caption-sm font-semibold text-latte/70"
                        >
                            {itemHeading}
                        </th>
                        {card.columns.map((column) => (
                            <th
                                key={column}
                                scope="col"
                                className="w-[84px] border-t border-cocoa/[0.07] py-2.5 pl-1.5 text-right text-caption-sm font-semibold text-latte/70 md:w-28 md:pl-3"
                            >
                                {column}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {card.rows.map((row) => (
                        <tr key={row.id}>
                            <th
                                scope="row"
                                className="border-t border-cocoa/[0.07] py-3.5 pr-3 text-caption font-normal leading-6 text-latte md:text-small"
                            >
                                {row.label}
                            </th>
                            {row.cells.map((cell, index) => (
                                <td
                                    key={card.columns[index]}
                                    className="whitespace-nowrap border-t border-cocoa/[0.07] py-3.5 pl-1.5 text-right md:pl-3"
                                >
                                    {cell ? (
                                        <strong className="text-caption font-medium text-cocoa md:text-small">
                                            <PriceCell
                                                price={cell.price}
                                                moneyLocale={moneyLocale}
                                                consultLabel={consultLabel}
                                            />
                                        </strong>
                                    ) : (
                                        <span aria-label="해당 없음" className="text-caption text-sand">
                                            –
                                        </span>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

interface AreaNoteProps {
    groups: NoteChipGroup[];
    footnotes: string[];
}

/** 부위를 격자 대신 글줄처럼 흘려 쓴다. 낱말 사이에만 가운뎃점이 들어가 간격이 일정하다. */
function AreaChips({ chips, className = 'text-caption leading-6 text-latte md:text-small' }: { chips: string[]; className?: string }) {
    return (
        <ul className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            {chips.map((chip, index) => (
                <li key={chip} className={`flex items-baseline gap-2 ${className}`}>
                    {index > 0 && (
                        <span aria-hidden className="text-sand">
                            ·
                        </span>
                    )}
                    {chip}
                </li>
            ))}
        </ul>
    );
}

function AreaFootnotes({ lines, className = '' }: { lines: string[]; className?: string }) {
    return lines.map((line) => (
        <p key={line} className={`text-caption-sm leading-5 text-latte ${className}`}>
            {line}
        </p>
    ));
}

/* 1안 · 인라인 — 왼쪽에 시술 이름, 오른쪽에 부위를 촘촘히 흘려 쓴다.
   아래 가격 표와 같은 "왼쪽 이름 / 오른쪽 내용" 구조라 페이지 전체가 한 덩어리로 읽힌다. */
function AreaNoteInline({ groups, footnotes }: AreaNoteProps) {
    return (
        <div className="overflow-hidden rounded-2xl border border-cocoa/[0.1] bg-cream">
            {groups.map((group, index) => (
                <div
                    key={group.label}
                    className={`flex flex-col gap-1 px-5 py-3.5 md:flex-row md:items-baseline md:gap-5 md:px-6 ${
                        index > 0 ? 'border-t border-cocoa/[0.08]' : ''
                    }`}
                >
                    <p className="flex shrink-0 items-baseline gap-2 text-caption font-bold text-cocoa md:w-44 md:text-small">
                        <span aria-hidden className="h-3 w-[3px] shrink-0 translate-y-[-1px] rounded-full bg-sand" />
                        {group.label}
                    </p>
                    <AreaChips chips={group.chips} />
                </div>
            ))}
            {footnotes.length > 0 && (
                <div className="border-t border-cocoa/[0.08] bg-sand/10 px-5 py-3 md:px-6">
                    <AreaFootnotes lines={footnotes} />
                </div>
            )}
        </div>
    );
}

/* 2안 · 카드형 — 시술마다 카드를 하나씩 나란히 세운다.
   시술이 두세 개일 때 좌우로 갈려서 "이 부위는 어느 시술인지" 가 가장 또렷하다. */
function AreaNoteCards({ groups, footnotes }: AreaNoteProps) {
    return (
        <div>
            <div className="grid gap-3 md:grid-cols-2">
                {groups.map((group) => (
                    <section key={group.label} className="rounded-2xl border border-cocoa/[0.1] bg-cream px-5 py-4">
                        <h3 className="text-caption font-bold text-cocoa md:text-small">{group.label}</h3>
                        <ul className="mt-2.5 flex flex-wrap gap-x-2 gap-y-1">
                            {group.chips.map((chip) => (
                                <li key={chip} className="flex items-center gap-1.5 text-caption leading-6 text-latte">
                                    <span aria-hidden className="h-1 w-1 shrink-0 rounded-full bg-sand" />
                                    {chip}
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
            </div>
            <AreaFootnotes lines={footnotes} className="mt-3 px-1" />
        </div>
    );
}

/* 3안 · 탭형 — 시술 이름을 눌러 그 시술 부위만 크게 보여 준다.
   부위가 더 늘어나도 안내 박스 높이가 그대로라, 가격 표가 화면 아래로 밀리지 않는다. */
function AreaNoteTabs({ groups, footnotes }: AreaNoteProps) {
    const [openLabel, setOpenLabel] = useState(groups[0]?.label ?? '');
    const current = groups.find((group) => group.label === openLabel) ?? groups[0];

    return (
        <div className="rounded-2xl border border-cocoa/[0.1] bg-cream px-5 py-4 md:px-6">
            {groups.length > 1 && (
                <div className="flex flex-wrap gap-2">
                    {groups.map((group) => {
                        const active = group.label === current?.label;
                        return (
                            <button
                                key={group.label}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setOpenLabel(group.label)}
                                className={`rounded-full border px-3.5 py-1.5 text-caption font-semibold transition-colors ${
                                    active
                                        ? 'border-cocoa/25 bg-sand/30 text-cocoa'
                                        : 'border-cocoa/10 text-latte hover:border-cocoa/25 hover:text-cocoa'
                                }`}
                            >
                                {group.label}
                            </button>
                        );
                    })}
                </div>
            )}
            {current && (
                <div className={groups.length > 1 ? 'mt-3.5' : ''}>
                    <AreaChips chips={current.chips} className="text-small font-medium leading-6 text-cocoa" />
                </div>
            )}
            <AreaFootnotes lines={footnotes} className="mt-3 border-t border-cocoa/[0.08] pt-3" />
        </div>
    );
}

/* 4안 · 문장형 — 테두리를 없애고 옅은 바탕에 안내문처럼 한 문단으로 적는다.
   가장 조용해서 가격 카드가 주인공으로 남는다. 부위가 많아도 줄만 늘어난다. */
function AreaNoteSentence({ groups, footnotes }: AreaNoteProps) {
    return (
        <div className="rounded-2xl bg-sand/15 px-5 py-4 md:px-6">
            {groups.map((group) => (
                <p key={group.label} className="text-caption leading-7 text-latte md:text-small">
                    <b className="font-bold text-cocoa">{group.label}</b>
                    <span aria-hidden className="mx-2 text-sand">
                        |
                    </span>
                    {group.chips.join(' · ')}
                </p>
            ))}
            <AreaFootnotes lines={footnotes} className="mt-2" />
        </div>
    );
}

/* 5안 · 접이식 — 한 줄로 접어 두고 눌러서 펼친다.
   부위는 가격을 정한 다음에 확인하는 정보라, 접어 두면 가격 카드가 화면 위로 올라온다. */
function AreaNoteFold({ groups, footnotes }: AreaNoteProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className="overflow-hidden rounded-2xl border border-cocoa/[0.1] bg-cream">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-5 py-3.5 text-left md:px-6"
            >
                <span className="text-caption font-bold text-cocoa md:text-small">시술 가능 부위 안내</span>
                <ChevronIcon open={open} />
            </button>
            {open && (
                <div className="border-t border-cocoa/[0.08] px-5 pb-4 pt-1 md:px-6">
                    {groups.map((group) => (
                        <div key={group.label} className="flex flex-col gap-1 py-2.5 md:flex-row md:items-baseline md:gap-5">
                            <p className="shrink-0 text-caption font-bold text-cocoa md:w-44">{group.label}</p>
                            <AreaChips chips={group.chips} />
                        </div>
                    ))}
                    <AreaFootnotes lines={footnotes} className="mt-1" />
                </div>
            )}
        </div>
    );
}

function StatusMessage({ children }: { children: React.ReactNode }) {
    return <div className="mx-auto max-w-[960px] py-16 text-center text-small text-latte">{children}</div>;
}

/* 카드 접기/펼치기 표시. 글자(^)로 넣으면 검색 아이콘과 같은 문제(폰트 폴백)가 나서 도형으로 그린다. */
function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 16 16"
            fill="none"
            className={`mt-1.5 h-4 w-4 shrink-0 text-latte transition-transform ${open ? 'rotate-180' : ''}`}
        >
            <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );
}

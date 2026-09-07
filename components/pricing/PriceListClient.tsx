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
     탭을 바꾸거나 검색을 지우면 다시 전부 펼쳐진 상태로 돌아간다. */

'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
    formatPrice,
    subscribePriceCategories,
    subscribePriceListItems,
    subscribePriceSections,
    type PriceCategory,
    type PriceListItem,
    type PriceSection,
} from '@/components/lib/priceList';
import { buildPriceBoard, type PriceBoardCard } from '@/components/lib/priceBoard';
import SearchIcon from '@/components/ui/SearchIcon';

/* 탭 안내 문구를 부위 알약으로 보여 주기 위한 해석.
   관리자에서는 그냥 여러 줄 글로 적는다.
     "주름 보톡스 : 이마 · 미간 · 눈가"  → 제목 + 알약
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

            {/* 탭 안내 박스 — 관리자에서 탭마다 적어 두는 문구 (예: 주름 보톡스 가능 부위).
                #ISSUE: 그룹마다 py-5 + 제목을 md:text-medium(20px) 으로 키워서 박스가 카드보다도 커 보였다.
                → 디엘브처럼 제목은 작은 라벨, 알약은 한 줄에 촘촘히, 그룹 사이는 얇은 선 하나로만 나눈다. */}
            {(note.groups.length > 0 || note.footnotes.length > 0) && (
                <div className="mt-8 divide-y divide-cocoa/[0.08] rounded-2xl border border-cocoa/[0.1] bg-cream px-5 py-1 md:px-6">
                    {note.groups.map((group) => (
                        <div key={group.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-2 py-3">
                            <p className="shrink-0 text-caption font-bold text-cocoa">{group.label}</p>
                            <ul className="flex flex-wrap gap-1.5">
                                {group.chips.map((chip) => (
                                    <li
                                        key={chip}
                                        className="rounded-full border border-sand/70 bg-sand/25 px-2.5 py-0.5 text-caption-sm font-medium text-cocoa"
                                    >
                                        {chip}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {note.footnotes.map((line) => (
                        <p key={line} className="py-3 text-caption-sm leading-5 text-latte">
                            {line}
                        </p>
                    ))}
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
                                    {card.rows.map((row) => (
                                        <div
                                            key={row.id}
                                            className="flex items-start justify-between gap-5 border-t border-cocoa/[0.07] py-3.5"
                                        >
                                            <span className="min-w-0 text-caption leading-6 text-latte md:text-small">
                                                {row.label}
                                            </span>
                                            <strong className="shrink-0 text-caption font-medium text-cocoa md:text-small">
                                                {formatPrice(row.price, moneyLocale)}
                                            </strong>
                                        </div>
                                    ))}
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

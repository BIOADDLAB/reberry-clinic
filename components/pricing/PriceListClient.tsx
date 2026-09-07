/* #COMPONENTS: 고객용 수가표
   #ISSUE: 예전 버전은 Firestore 데이터가 지저분해서 화면에서 이름을 정규식으로 잘라 붙이고
           카테고리도 코드에 하드코딩된 8종(CATEGORY_KEYS)으로 강제 매핑했다.
           → 관리자에서 카테고리를 추가하거나 순서를 바꿔도 화면이 안 따라오고,
             이름 규칙이 조금만 달라져도 카드 제목이 깨졌다.
   → 2026.09 수가표 개편에 맞춰 "보이는 대로 저장된 대로" 로 단순화한다.
        대분류(category)  = 상단 탭        · category.sort 순
        카드(section)     = 아코디언 카드   · section.sort 순
        행(item×session)  = 카드 안 한 줄   · item.sort 순
     관리자(PriceListManager)가 이 구조를 그대로 편집하므로 저장 즉시 이 화면에 반영된다. */

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

export default function PriceListClient() {
    const t = useTranslations('priceList');
    const locale = useLocale();
    const [categories, setCategories] = useState<PriceCategory[]>([]);
    const [sections, setSections] = useState<PriceSection[]>([]);
    const [items, setItems] = useState<PriceListItem[]>([]);
    const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    /* null = 아직 아무것도 안 눌렀다는 뜻. 이때는 맨 위 카드를 펼친 상태로 보여 준다.
       (빈 배열이면 "사용자가 전부 접었다" 는 뜻이라 구분이 필요하다) */
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

    const cards = useMemo(() => {
        if (!activeGroup) return [] as PriceBoardCard[];
        const keyword = search.trim().toLowerCase();
        if (!keyword) return activeGroup.cards;
        return activeGroup.cards
            .map((card) => ({
                ...card,
                rows: card.rows.filter(
                    (row) =>
                        card.title.toLowerCase().includes(keyword) || row.label.toLowerCase().includes(keyword),
                ),
            }))
            .filter((card) => card.rows.length > 0);
    }, [activeGroup, search]);

    // 아직 아무것도 안 눌렀으면 맨 위 카드만 펼쳐 둔다
    const openKeys = openCards ?? (cards[0] ? [cards[0].key] : []);
    const moneyLocale = locale === 'ko' ? 'ko-KR' : locale;

    if (loading) return <StatusMessage>{t('loading')}</StatusMessage>;
    if (error) return <StatusMessage>{error}</StatusMessage>;

    return (
        <div className="mx-auto w-full max-w-[960px]">
            <label className="relative mx-auto block max-w-md">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-latte" aria-hidden>
                    ⌕
                </span>
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
                        const active = activeGroup?.category.docId === group.category.docId;
                        return (
                            <button
                                key={group.category.docId}
                                type="button"
                                aria-current={active ? 'page' : undefined}
                                onClick={() => {
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

            {/* 탭 안내 박스 — 관리자에서 탭마다 적어 두는 문구 (예: 주름 보톡스 가능 부위) */}
            {activeGroup?.category.note && (
                <div className="mt-8 rounded-2xl border border-cocoa/[0.1] bg-cream px-5 py-4 md:px-7">
                    {activeGroup.category.note.split('\n').filter(Boolean).map((line, index) => (
                        <p key={index} className="text-caption leading-6 text-latte md:text-small">
                            {line}
                        </p>
                    ))}
                </div>
            )}

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
                                aria-expanded={open}
                                onClick={() =>
                                    setOpenCards(
                                        open ? openKeys.filter((key) => key !== card.key) : [...openKeys, card.key],
                                    )
                                }
                                className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left md:px-7"
                            >
                                <h2 className="min-w-0 text-small font-bold text-cocoa md:text-medium">{card.title}</h2>
                                <ChevronIcon open={open} />
                            </button>
                            {open && (
                                <div className="px-5 pb-3 md:px-7">
                                    {card.rows.map((row) => (
                                        <div
                                            key={row.id}
                                            className="flex items-start justify-between gap-5 border-t border-cocoa/[0.07] py-4"
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

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 20 20"
            className={`h-5 w-5 shrink-0 text-latte transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
            fill="none"
        >
            <path
                d="m5.5 7.5 4.5 4.5 4.5-4.5"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}

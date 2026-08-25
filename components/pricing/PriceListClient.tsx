'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
    formatPrice,
    formatPriceItemName,
    PRICE_CART_STORAGE_KEY,
    subscribePriceCategories,
    subscribePriceListItems,
    subscribePriceSections,
    type PriceCartItem,
    type PriceCategory,
    type PriceListItem,
    type PriceSection,
} from '@/components/lib/priceList';

const PAGE_SIZE = 12;

export default function PriceListClient() {
    const t = useTranslations('priceList');
    const locale = useLocale();
    const router = useRouter();
    const rootRef = useRef<HTMLDivElement>(null);
    const [categories, setCategories] = useState<PriceCategory[]>([]);
    const [sections, setSections] = useState<PriceSection[]>([]);
    const [items, setItems] = useState<PriceListItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [activeSection, setActiveSection] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [cart, setCart] = useState<PriceCartItem[]>([]);
    const [cartLoaded, setCartLoaded] = useState(false);
    const [mobileCartOpen, setMobileCartOpen] = useState(false);
    const [mobileBarVisible, setMobileBarVisible] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const frame = window.requestAnimationFrame(() => {
            try {
                const saved = JSON.parse(localStorage.getItem(PRICE_CART_STORAGE_KEY) ?? '[]');
                if (Array.isArray(saved)) setCart(saved);
            } catch {
                localStorage.removeItem(PRICE_CART_STORAGE_KEY);
            } finally {
                setCartLoaded(true);
            }
        });
        const fail = () => {
            setError(t('loadError'));
            setLoading(false);
        };
        const unsubscribeCategories = subscribePriceCategories(setCategories, fail, true);
        const unsubscribeSections = subscribePriceSections(setSections, fail, true);
        const unsubscribeItems = subscribePriceListItems((nextItems) => {
            setItems(nextItems);
            setLoading(false);
        }, fail, true);
        return () => {
            window.cancelAnimationFrame(frame);
            unsubscribeCategories();
            unsubscribeSections();
            unsubscribeItems();
        };
    }, [t]);

    useEffect(() => {
        if (!cartLoaded || loading) return;
        const frame = window.requestAnimationFrame(() => {
            setCart((current) => {
                const next = current.filter((cartItem) => {
                    const item = items.find((candidate) => candidate.docId === cartItem.itemId);
                    return item?.sessions.some((session) => session.id === cartItem.optionId);
                });
                if (next.length !== current.length) {
                    localStorage.setItem(PRICE_CART_STORAGE_KEY, JSON.stringify(next));
                }
                return next.length === current.length ? current : next;
            });
        });
        return () => window.cancelAnimationFrame(frame);
    }, [cartLoaded, items, loading]);

    useEffect(() => {
        const target = rootRef.current;
        if (!target) return;
        const observer = new IntersectionObserver(
            ([entry]) => setMobileBarVisible(entry.isIntersecting),
            { threshold: 0.05 },
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!mobileCartOpen) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') setMobileCartOpen(false);
        };
        document.body.style.overflow = 'hidden';
        window.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            window.removeEventListener('keydown', closeOnEscape);
        };
    }, [mobileCartOpen]);

    const categoryById = useMemo(
        () => new Map(categories.map((category) => [category.docId, category.label])),
        [categories],
    );
    const sectionById = useMemo(
        () => new Map(sections.map((section) => [section.docId, section])),
        [sections],
    );
    const categoryOrder = useMemo(
        () => new Map(categories.map((category, index) => [category.docId, index])),
        [categories],
    );
    const sectionOrder = useMemo(
        () => new Map(sections.map((section, index) => [section.docId, index])),
        [sections],
    );
    const categorySections = useMemo(
        () => sections.filter((section) => section.categoryId === activeCategory),
        [activeCategory, sections],
    );
    const visibleItems = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return items
            .filter(
                (item) =>
                    categoryById.has(item.categoryId) &&
                    sectionById.has(item.sectionId) &&
                    (activeCategory === 'all' || item.categoryId === activeCategory) &&
                    (activeSection === 'all' || item.sectionId === activeSection) &&
                    (!keyword ||
                        item.name.toLowerCase().includes(keyword) ||
                        item.productLabel.toLowerCase().includes(keyword) ||
                        item.description.toLowerCase().includes(keyword) ||
                        (sectionById.get(item.sectionId)?.label ?? '').toLowerCase().includes(keyword) ||
                        item.sessions.some((session) => session.label.toLowerCase().includes(keyword))),
            )
            .sort(
                (a, b) =>
                    (categoryOrder.get(a.categoryId) ?? 0) - (categoryOrder.get(b.categoryId) ?? 0) ||
                    (sectionOrder.get(a.sectionId) ?? 0) - (sectionOrder.get(b.sectionId) ?? 0) ||
                    a.sort - b.sort,
            );
    }, [
        activeCategory,
        activeSection,
        categoryById,
        categoryOrder,
        items,
        search,
        sectionById,
        sectionOrder,
    ]);
    const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginatedItems = visibleItems.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );
    const paginatedGroups = useMemo(() => {
        const groups: Array<{ section: PriceSection; items: PriceListItem[] }> = [];
        paginatedItems.forEach((item) => {
            const section = sectionById.get(item.sectionId);
            if (!section) return;
            const current = groups.at(-1);
            if (current?.section.docId === section.docId) current.items.push(item);
            else groups.push({ section, items: [item] });
        });
        return groups;
    }, [paginatedItems, sectionById]);
    const total = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const moneyLocale = locale === 'ko' ? 'ko-KR' : locale;

    const updateCart = (updater: (current: PriceCartItem[]) => PriceCartItem[]) => {
        setCart((current) => {
            const next = updater(current);
            localStorage.setItem(PRICE_CART_STORAGE_KEY, JSON.stringify(next));
            return next;
        });
    };

    const addItem = (item: PriceListItem) => {
        const optionId = selectedOptions[item.docId] ?? item.sessions[0]?.id;
        const session = item.sessions.find((candidate) => candidate.id === optionId);
        if (!session) return;
        updateCart((current) => {
            const index = current.findIndex(
                (cartItem) => cartItem.itemId === item.docId && cartItem.optionId === session.id,
            );
            if (index < 0) {
                return [
                    ...current,
                    {
                        itemId: item.docId,
                        optionId: session.id,
                        categoryLabel: categoryById.get(item.categoryId) ?? '',
                        itemName: formatPriceItemName(item),
                        optionLabel: session.label,
                        unitPrice: session.price,
                        quantity: 1,
                    },
                ];
            }
            return current.map((cartItem, cartIndex) =>
                cartIndex === index ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
            );
        });
    };

    return (
        <div
            ref={rootRef}
            className="grid w-full min-w-0 max-w-full gap-10 overflow-x-clip pb-24 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:pb-0"
        >
            <div className="min-w-0 max-w-full">
                <div className="flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-2">
                    <CategoryButton
                        active={activeCategory === 'all'}
                        label={t('all')}
                        onClick={() => {
                            setActiveCategory('all');
                            setActiveSection('all');
                            setPage(1);
                        }}
                    />
                    {categories.map((category) => (
                        <CategoryButton
                            key={category.docId}
                            active={activeCategory === category.docId}
                            label={category.label}
                            onClick={() => {
                                setActiveCategory(category.docId);
                                setActiveSection('all');
                                setPage(1);
                            }}
                        />
                    ))}
                </div>
                {activeCategory !== 'all' && categorySections.length > 1 && (
                    <div className="mt-3 flex w-full min-w-0 max-w-full gap-2 overflow-x-auto pb-2">
                        <CategoryButton
                            active={activeSection === 'all'}
                            label={t('all')}
                            onClick={() => {
                                setActiveSection('all');
                                setPage(1);
                            }}
                            secondary
                        />
                        {categorySections.map((section) => (
                            <CategoryButton
                                key={section.docId}
                                active={activeSection === section.docId}
                                label={section.label}
                                onClick={() => {
                                    setActiveSection(section.docId);
                                    setPage(1);
                                }}
                                secondary
                            />
                        ))}
                    </div>
                )}
                <label className="mt-5 block">
                    <span className="sr-only">{t('search')}</span>
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder={t('searchPlaceholder')}
                        className="block w-full min-w-0 max-w-full rounded-2xl border border-cocoa/15 bg-cream px-5 py-3.5 text-small text-cocoa outline-none focus:border-cocoa/40"
                    />
                </label>

                {error ? (
                    <div className="mt-6 rounded-2xl bg-red-50 px-5 py-8 text-center text-small text-red-700">
                        {error}
                    </div>
                ) : loading ? (
                    <Empty message={t('loading')} />
                ) : visibleItems.length === 0 ? (
                    <Empty message={t('empty')} />
                ) : (
                    <div className="mt-7 space-y-10">
                        {paginatedGroups.map((group) => (
                            <section key={`${currentPage}-${group.section.docId}`}>
                                <div className="mb-3 border-b border-cocoa/15 pb-3">
                                    <p className="text-caption font-semibold tracking-[0.12em] text-latte">
                                        {categoryById.get(group.section.categoryId)}
                                    </p>
                                    <h2 className="mt-1 text-h3 font-bold text-cocoa">{group.section.label}</h2>
                                </div>
                                <div className="space-y-3">
                                {group.items.map((item) => {
                            const selectedId = selectedOptions[item.docId] ?? item.sessions[0]?.id ?? '';
                            const selected = item.sessions.find((session) => session.id === selectedId);
                            return (
                                <article
                                    key={item.docId}
                                    className="rounded-2xl border border-cocoa/10 bg-cream/90 p-5 shadow-[0_2px_12px_rgba(69,54,45,0.04)] md:p-6"
                                >
                                    <div className="grid min-w-0 gap-5 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
                                        <div className="min-w-0 flex-1">
                                            <h3 className="flex flex-wrap items-center gap-2 break-keep text-lead font-bold text-cocoa">
                                                <span>{item.name}</span>
                                                {item.productLabel ? (
                                                    <span className="rounded-full border border-cocoa/12 bg-sand/70 px-2.5 py-0.5 text-caption-sm font-semibold tracking-tight text-latte">
                                                        {item.productLabel}
                                                    </span>
                                                ) : null}
                                            </h3>
                                            {item.description && (
                                                <p className="mt-2 whitespace-pre-line break-keep text-caption leading-6 text-latte">
                                                    <span className="font-semibold text-cocoa">{t('composition')} </span>
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-2 sm:block">
                                            <select
                                                value={selectedId}
                                                onChange={(event) =>
                                                    setSelectedOptions((current) => ({
                                                        ...current,
                                                        [item.docId]: event.target.value,
                                                    }))
                                                }
                                                className="block w-full min-w-0 max-w-full rounded-xl border border-cocoa/15 bg-white px-3 py-2.5 text-caption text-cocoa outline-none"
                                            >
                                                {item.sessions.map((session) => (
                                                    <option key={session.id} value={session.id}>
                                                        {session.label}
                                                    </option>
                                                ))}
                                            </select>
                                            <strong className="self-center whitespace-nowrap text-right text-small text-cocoa sm:mt-2 sm:block sm:text-lead">
                                                {selected ? formatPrice(selected.price, moneyLocale) : ''}
                                            </strong>
                                            <button
                                                type="button"
                                                disabled={!selected}
                                                onClick={() => addItem(item)}
                                                className="col-span-2 w-full rounded-xl bg-cocoa px-4 py-2.5 text-caption font-semibold text-cream transition-colors hover:bg-deep disabled:opacity-40 sm:mt-2"
                                            >
                                                {t('add')}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                                })}
                                </div>
                            </section>
                        ))}
                    </div>
                )}

                {!loading && !error && totalPages > 1 && (
                    <nav className="mt-8 flex items-center justify-center gap-3" aria-label={t('pagination')}>
                        <button
                            type="button"
                            disabled={currentPage === 1}
                            onClick={() => setPage((value) => Math.max(1, value - 1))}
                            className="rounded-xl border border-cocoa/15 bg-cream px-4 py-2.5 text-caption font-semibold text-cocoa disabled:opacity-30"
                        >
                            {t('previous')}
                        </button>
                        <span className="min-w-20 text-center text-caption text-latte">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            type="button"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                            className="rounded-xl border border-cocoa/15 bg-cream px-4 py-2.5 text-caption font-semibold text-cocoa disabled:opacity-30"
                        >
                            {t('next')}
                        </button>
                    </nav>
                )}
            </div>

            <aside className="hidden rounded-2xl border border-cocoa/10 bg-cream p-5 shadow-[0_8px_30px_rgba(69,54,45,0.08)] lg:sticky lg:top-28 lg:block">
                <CartPanel
                    cart={cart}
                    total={total}
                    moneyLocale={moneyLocale}
                    labels={{
                        cart: t('cart'),
                        countUnit: t('countUnit'),
                        cartEmpty: t('cartEmpty'),
                        remove: t('remove'),
                        estimatedTotal: t('estimatedTotal'),
                        estimateNotice: t('estimateNotice'),
                        reserve: t('reserve'),
                    }}
                    updateCart={updateCart}
                    onReserve={() => router.push('/reservation?from=price-list')}
                />
            </aside>

            {mobileBarVisible && (
            <div className="fixed bottom-4 left-4 right-20 z-40 flex items-center gap-2 rounded-2xl border border-cocoa/10 bg-cream p-2 shadow-[0_8px_30px_rgba(69,54,45,0.22)] lg:hidden">
                <button
                    type="button"
                    onClick={() => setMobileCartOpen(true)}
                    className="min-w-0 flex-1 px-3 py-2 text-left"
                >
                    <span className="block text-caption-sm text-latte">
                        {t('cart')} · {cart.length}{t('countUnit')}
                    </span>
                    <strong className="block truncate text-small text-cocoa">
                        {formatPrice(total, moneyLocale)}
                    </strong>
                </button>
                <button
                    type="button"
                    disabled={cart.length === 0}
                    onClick={() => router.push('/reservation?from=price-list')}
                    className="shrink-0 rounded-xl bg-cocoa px-4 py-3 text-caption font-semibold text-cream disabled:opacity-40"
                >
                    {t('reserveShort')}
                </button>
            </div>
            )}

            {mobileCartOpen && (
                <div
                    className="fixed inset-0 z-[70] flex items-end bg-deep/60 lg:hidden"
                    onClick={() => setMobileCartOpen(false)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={t('cart')}
                        onClick={(event) => event.stopPropagation()}
                        className="max-h-[82dvh] w-full overflow-y-auto rounded-t-3xl bg-cream p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
                    >
                        <div className="mb-2 flex justify-end">
                            <button
                                type="button"
                                aria-label={t('closeCart')}
                                onClick={() => setMobileCartOpen(false)}
                                className="grid size-9 place-items-center rounded-full bg-cocoa/5 text-2xl text-cocoa"
                            >
                                ×
                            </button>
                        </div>
                        <CartPanel
                            cart={cart}
                            total={total}
                            moneyLocale={moneyLocale}
                            labels={{
                                cart: t('cart'),
                                countUnit: t('countUnit'),
                                cartEmpty: t('cartEmpty'),
                                remove: t('remove'),
                                estimatedTotal: t('estimatedTotal'),
                                estimateNotice: t('estimateNotice'),
                                reserve: t('reserve'),
                            }}
                            updateCart={updateCart}
                            onReserve={() => router.push('/reservation?from=price-list')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

function CartPanel({
    cart,
    total,
    moneyLocale,
    labels,
    updateCart,
    onReserve,
}: {
    cart: PriceCartItem[];
    total: number;
    moneyLocale: string;
    labels: {
        cart: string;
        countUnit: string;
        cartEmpty: string;
        remove: string;
        estimatedTotal: string;
        estimateNotice: string;
        reserve: string;
    };
    updateCart: (updater: (current: PriceCartItem[]) => PriceCartItem[]) => void;
    onReserve: () => void;
}) {
    return (
        <>
            <div className="flex items-center justify-between">
                <h2 className="text-lead font-bold text-cocoa">{labels.cart}</h2>
                <span className="text-caption text-latte">{cart.length}{labels.countUnit}</span>
            </div>
            {cart.length === 0 ? (
                <p className="py-12 text-center text-caption text-latte">{labels.cartEmpty}</p>
            ) : (
                <div className="mt-4 space-y-4">
                    {cart.map((item) => (
                        <div key={`${item.itemId}-${item.optionId}`} className="border-b border-cocoa/10 pb-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-caption-sm text-latte">{item.categoryLabel}</p>
                                    <p className="mt-1 text-caption font-semibold text-cocoa">{item.itemName}</p>
                                    <p className="mt-0.5 text-caption-sm text-latte">
                                        {item.optionLabel} · {formatPrice(item.unitPrice, moneyLocale)}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        updateCart((current) =>
                                            current.filter(
                                                (candidate) =>
                                                    candidate.itemId !== item.itemId ||
                                                    candidate.optionId !== item.optionId,
                                            ),
                                        )
                                    }
                                    className="text-caption-sm text-red-500"
                                >
                                    {labels.remove}
                                </button>
                            </div>
                            <div className="mt-2 flex items-center gap-2">
                                <button
                                    type="button"
                                    aria-label="수량 줄이기"
                                    onClick={() =>
                                        updateCart((current) =>
                                            current.map((candidate) =>
                                                candidate.itemId === item.itemId &&
                                                candidate.optionId === item.optionId
                                                    ? { ...candidate, quantity: Math.max(1, candidate.quantity - 1) }
                                                    : candidate,
                                            ),
                                        )
                                    }
                                    className="grid size-7 place-items-center rounded-full border border-cocoa/15"
                                >
                                    −
                                </button>
                                <span className="min-w-5 text-center text-caption">{item.quantity}</span>
                                <button
                                    type="button"
                                    aria-label="수량 늘리기"
                                    onClick={() =>
                                        updateCart((current) =>
                                            current.map((candidate) =>
                                                candidate.itemId === item.itemId &&
                                                candidate.optionId === item.optionId
                                                    ? { ...candidate, quantity: candidate.quantity + 1 }
                                                    : candidate,
                                            ),
                                        )
                                    }
                                    className="grid size-7 place-items-center rounded-full border border-cocoa/15"
                                >
                                    +
                                </button>
                                <strong className="ml-auto text-caption text-cocoa">
                                    {formatPrice(item.unitPrice * item.quantity, moneyLocale)}
                                </strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <div className="mt-5 flex items-center justify-between">
                <span className="text-small text-latte">{labels.estimatedTotal}</span>
                <strong className="text-lead text-cocoa">{formatPrice(total, moneyLocale)}</strong>
            </div>
            <p className="mt-3 text-caption-sm leading-5 text-latte">{labels.estimateNotice}</p>
            <button
                type="button"
                disabled={cart.length === 0}
                onClick={onReserve}
                className="mt-5 w-full rounded-full bg-cocoa px-5 py-3 text-small font-semibold text-cream hover:bg-deep disabled:opacity-40"
            >
                {labels.reserve}
            </button>
        </>
    );
}

function CategoryButton({
    active,
    label,
    onClick,
    secondary = false,
}: {
    active: boolean;
    label: string;
    onClick: () => void;
    secondary?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 rounded-full border px-4 py-2 text-caption font-semibold ${
                active
                    ? secondary
                        ? 'border-cocoa/30 bg-sand/70 text-cocoa'
                        : 'border-cocoa bg-cocoa text-cream'
                    : 'border-cocoa/15 bg-cream text-latte'
            }`}
        >
            {label}
        </button>
    );
}

function Empty({ message }: { message: string }) {
    return <div className="mt-6 rounded-2xl bg-cream py-16 text-center text-small text-latte">{message}</div>;
}

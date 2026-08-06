'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import {
    formatPrice,
    PRICE_CART_STORAGE_KEY,
    subscribePriceCategories,
    subscribePriceListItems,
    type PriceCartItem,
    type PriceCategory,
    type PriceListItem,
} from '@/components/lib/priceList';

const PAGE_SIZE = 12;

export default function PriceListClient() {
    const t = useTranslations('priceList');
    const locale = useLocale();
    const router = useRouter();
    const rootRef = useRef<HTMLDivElement>(null);
    const [categories, setCategories] = useState<PriceCategory[]>([]);
    const [items, setItems] = useState<PriceListItem[]>([]);
    const [activeCategory, setActiveCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
    const [cart, setCart] = useState<PriceCartItem[]>([]);
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
            }
        });
        const fail = () => {
            setError(t('loadError'));
            setLoading(false);
        };
        const unsubscribeCategories = subscribePriceCategories(setCategories, fail, true);
        const unsubscribeItems = subscribePriceListItems((nextItems) => {
            setItems(nextItems);
            setLoading(false);
        }, fail, true);
        return () => {
            window.cancelAnimationFrame(frame);
            unsubscribeCategories();
            unsubscribeItems();
        };
    }, [t]);

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
    const visibleItems = useMemo(() => {
        const keyword = search.trim().toLowerCase();
        return items.filter(
            (item) =>
                categoryById.has(item.categoryId) &&
                (activeCategory === 'all' || item.categoryId === activeCategory) &&
                (!keyword ||
                    item.name.toLowerCase().includes(keyword) ||
                    item.options.some((option) => option.label.toLowerCase().includes(keyword))),
        );
    }, [activeCategory, categoryById, items, search]);
    const totalPages = Math.max(1, Math.ceil(visibleItems.length / PAGE_SIZE));
    const currentPage = Math.min(page, totalPages);
    const paginatedItems = visibleItems.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
    );
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
        const optionId = selectedOptions[item.docId] ?? item.options[0]?.id;
        const option = item.options.find((candidate) => candidate.id === optionId);
        if (!option) return;
        updateCart((current) => {
            const index = current.findIndex(
                (cartItem) => cartItem.itemId === item.docId && cartItem.optionId === option.id,
            );
            if (index < 0) {
                return [
                    ...current,
                    {
                        itemId: item.docId,
                        optionId: option.id,
                        categoryLabel: categoryById.get(item.categoryId) ?? '',
                        itemName: item.name,
                        optionLabel: option.label,
                        unitPrice: option.price,
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
        <div ref={rootRef} className="grid gap-10 pb-24 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:pb-0">
            <div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                    <CategoryButton
                        active={activeCategory === 'all'}
                        label={t('all')}
                        onClick={() => {
                            setActiveCategory('all');
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
                                setPage(1);
                            }}
                        />
                    ))}
                </div>
                <label className="mt-5 block">
                    <span className="sr-only">{t('search')}</span>
                    <input
                        value={search}
                        onChange={(event) => {
                            setSearch(event.target.value);
                            setPage(1);
                        }}
                        placeholder={t('searchPlaceholder')}
                        className="w-full rounded-2xl border border-cocoa/15 bg-cream px-5 py-3.5 text-small text-cocoa outline-none focus:border-cocoa/40"
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
                    <div className="mt-6 space-y-3">
                        {paginatedItems.map((item) => {
                            const selectedId = selectedOptions[item.docId] ?? item.options[0]?.id ?? '';
                            const selected = item.options.find((option) => option.id === selectedId);
                            return (
                                <article
                                    key={item.docId}
                                    className="rounded-2xl border border-cocoa/10 bg-cream/90 p-5 shadow-[0_2px_12px_rgba(69,54,45,0.04)] md:p-6"
                                >
                                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-caption text-latte">{categoryById.get(item.categoryId)}</p>
                                            <h2 className="mt-1 text-lead font-bold text-cocoa">{item.name}</h2>
                                            {item.description && (
                                                <p className="mt-2 whitespace-pre-line text-caption leading-6 text-latte">
                                                    {item.description}
                                                </p>
                                            )}
                                        </div>
                                        <div className="w-full shrink-0 sm:w-56">
                                            <select
                                                value={selectedId}
                                                onChange={(event) =>
                                                    setSelectedOptions((current) => ({
                                                        ...current,
                                                        [item.docId]: event.target.value,
                                                    }))
                                                }
                                                className="w-full rounded-xl border border-cocoa/15 bg-white px-3 py-2.5 text-caption text-cocoa outline-none"
                                            >
                                                {item.options.map((option) => (
                                                    <option key={option.id} value={option.id}>
                                                        {option.label} · {formatPrice(option.price, moneyLocale)}
                                                    </option>
                                                ))}
                                            </select>
                                            <button
                                                type="button"
                                                disabled={!selected}
                                                onClick={() => addItem(item)}
                                                className="mt-2 w-full rounded-xl bg-cocoa px-4 py-2.5 text-caption font-semibold text-cream transition-colors hover:bg-deep disabled:opacity-40"
                                            >
                                                {t('add')}
                                            </button>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
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

function CategoryButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`shrink-0 rounded-full border px-4 py-2 text-caption font-semibold ${
                active ? 'border-cocoa bg-cocoa text-cream' : 'border-cocoa/15 bg-cream text-latte'
            }`}
        >
            {label}
        </button>
    );
}

function Empty({ message }: { message: string }) {
    return <div className="mt-6 rounded-2xl bg-cream py-16 text-center text-small text-latte">{message}</div>;
}

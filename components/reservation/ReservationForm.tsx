'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createReservation } from '@/components/lib/reservations';
import { getReservationTimeSlots, isReservationTimeValid } from '@/components/lib/reservationSchedule';
import { categoryLabel, treatments } from '@/components/lib/treatments';
import {
    formatPrice,
    PRICE_CART_STORAGE_KEY,
    type PriceCartItem,
} from '@/components/lib/priceList';

const localeMap: Record<string, string> = {
    ko: 'ko-KR',
    en: 'en-US',
    ja: 'ja-JP',
    zh: 'zh-CN',
};

const toDateKey = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const inputClass =
    'block w-full min-w-0 rounded-xl border border-cocoa/15 bg-cream px-4 py-3 text-small text-cocoa outline-none transition placeholder:text-latte/50 focus:border-cocoa/40 focus:ring-2 focus:ring-sand/20';

export default function ReservationForm({ fromPriceList = false }: { fromPriceList?: boolean }) {
    const t = useTranslations('reservation');
    const tp = useTranslations('priceList');
    const tLabels = useTranslations('labels');
    const locale = useLocale();
    const router = useRouter();
    const today = useMemo(() => {
        const now = new Date();
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }, []);
    const [visibleMonth, setVisibleMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
    const [selectedDate, setSelectedDate] = useState('');
    const [selectedTime, setSelectedTime] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [selectedPriceItems, setSelectedPriceItems] = useState<PriceCartItem[]>([]);

    useEffect(() => {
        if (!fromPriceList) return;
        const frame = window.requestAnimationFrame(() => {
            try {
                const stored = JSON.parse(localStorage.getItem(PRICE_CART_STORAGE_KEY) ?? '[]');
                if (Array.isArray(stored)) setSelectedPriceItems(stored);
            } catch {
                localStorage.removeItem(PRICE_CART_STORAGE_KEY);
            }
        });
        return () => window.cancelAnimationFrame(frame);
    }, [fromPriceList]);

    const weekdays = t.raw('weekdays') as string[];
    const calendarCells = useMemo(() => {
        const year = visibleMonth.getFullYear();
        const month = visibleMonth.getMonth();
        const firstWeekday = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();

        return [
            ...Array.from({ length: firstWeekday }, () => null),
            ...Array.from({ length: lastDate }, (_, index) => new Date(year, month, index + 1)),
        ];
    }, [visibleMonth]);

    const timeSlots = getReservationTimeSlots(selectedDate).filter((time) => {
        if (selectedDate !== toDateKey(today)) return true;
        const [hour, minute] = time.split(':').map(Number);
        const now = new Date();
        return hour * 60 + minute > now.getHours() * 60 + now.getMinutes();
    });
    const isCurrentMonth =
        visibleMonth.getFullYear() === today.getFullYear() && visibleMonth.getMonth() === today.getMonth();
    const estimatedTotal = selectedPriceItems.reduce(
        (sum, item) => sum + item.unitPrice * item.quantity,
        0,
    );

    const moveMonth = (amount: number) => {
        setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1));
        setSelectedDate('');
        setSelectedTime('');
    };

    const submit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!isReservationTimeValid(selectedDate, selectedTime)) return;

        const form = event.currentTarget;
        const formData = new FormData(form);
        const treatmentValue = String(formData.get('treatment') ?? '');
        const [treatmentCategory, treatmentSlug] = treatmentValue.split('/');
        const treatment = treatments.find(
            (item) => item.category === treatmentCategory && item.slug === treatmentSlug,
        );

        setSubmitting(true);
        setSubmitError(null);
        try {
            await createReservation({
                treatmentCategory: treatment?.category ?? '',
                treatmentSlug: treatment?.slug ?? '',
                treatmentName: treatment?.name ?? '',
                name: String(formData.get('name') ?? '').trim(),
                phone: String(formData.get('phone') ?? '').trim(),
                email: String(formData.get('email') ?? '').trim(),
                reservationDate: selectedDate,
                reservationTime: selectedTime,
                memo: String(formData.get('memo') ?? '').trim(),
                status: 'pending',
                selectedPriceItems,
                estimatedTotal,
            });
            form.reset();
            setSelectedDate('');
            setSelectedTime('');
            localStorage.removeItem(PRICE_CART_STORAGE_KEY);
            window.alert(t('submitSuccess'));
            router.push('/');
        } catch {
            setSubmitError(t('submitError'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <form onSubmit={submit} className="mx-auto max-w-5xl">
            {selectedPriceItems.length > 0 && (
                <section className="mb-10 rounded-2xl border border-cocoa/10 bg-cream/90 p-6 shadow-[0_2px_14px_rgba(69,54,45,0.07)] md:p-10">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <h2 className="text-h3 font-bold text-cocoa">{tp('selectedTitle')}</h2>
                            <p className="mt-2 text-small text-latte">{tp('selectedDescription')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setSelectedPriceItems([]);
                                localStorage.removeItem(PRICE_CART_STORAGE_KEY);
                            }}
                            className="text-caption font-semibold text-latte underline"
                        >
                            {tp('clearSelection')}
                        </button>
                    </div>
                    <div className="mt-5 divide-y divide-cocoa/10">
                        {selectedPriceItems.map((item) => (
                            <div key={`${item.itemId}-${item.optionId}`} className="flex items-center justify-between gap-4 py-3 text-caption">
                                <div>
                                    <strong className="text-cocoa">{item.itemName}</strong>
                                    <span className="ml-2 text-latte">{item.optionLabel} × {item.quantity}</span>
                                </div>
                                <span className="font-semibold text-cocoa">
                                    {formatPrice(item.unitPrice * item.quantity, localeMap[locale] ?? locale)}
                                </span>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-end gap-4">
                        <span className="text-small text-latte">{tp('estimatedTotal')}</span>
                        <strong className="text-lead text-cocoa">
                            {formatPrice(estimatedTotal, localeMap[locale] ?? locale)}
                        </strong>
                    </div>
                </section>
            )}
            <section className="rounded-2xl border border-cocoa/10 bg-cream/90 p-6 shadow-[0_2px_14px_rgba(69,54,45,0.07)] md:p-10">
                <h2 className="text-h3 font-bold text-cocoa">{t('treatmentTitle')}</h2>
                <p className="mt-4 text-small text-latte">{t('treatmentDescription')}</p>
                <label className="mt-6 block">
                    <span className="mb-2 block text-caption font-semibold text-cocoa">{t('treatment')}</span>
                    <select name="treatment" defaultValue="" className={inputClass}>
                        <option value="">
                            {t('chooseTreatment')}
                        </option>
                        {treatments.map((item) => {
                            const localizedName =
                                locale !== 'ko' && tLabels.has(item.name)
                                    ? tLabels(item.name)
                                    : locale === 'ko'
                                      ? item.name
                                      : item.en;
                            const categoryName = categoryLabel[item.category];
                            const localizedCategory =
                                locale !== 'ko' && tLabels.has(categoryName) ? tLabels(categoryName) : categoryName;
                            return (
                                <option key={`${item.category}-${item.slug}`} value={`${item.category}/${item.slug}`}>
                                    {localizedCategory} · {localizedName}
                                </option>
                            );
                        })}
                    </select>
                </label>
            </section>

            <section className="mt-10 rounded-2xl border border-cocoa/10 bg-cream/90 p-6 shadow-[0_2px_14px_rgba(69,54,45,0.07)] md:p-10">
                <h2 className="text-h3 font-bold text-cocoa">{t('applicantTitle')}</h2>

                <div className="mt-8 grid gap-6 md:grid-cols-2">
                    <label>
                        <span className="mb-2 block text-caption font-semibold text-cocoa">
                            {t('name')} <span className="text-red-500">*</span>
                        </span>
                        <input
                            name="name"
                            type="text"
                            required
                            autoComplete="name"
                            placeholder={t('namePlaceholder')}
                            className={inputClass}
                        />
                    </label>
                    <label>
                        <span className="mb-2 block text-caption font-semibold text-cocoa">
                            {t('phone')} <span className="text-red-500">*</span>
                        </span>
                        <input
                            name="phone"
                            type="tel"
                            required
                            autoComplete="tel"
                            inputMode="tel"
                            placeholder="010-0000-0000"
                            className={inputClass}
                        />
                    </label>
                    <label className="md:col-span-2">
                        <span className="mb-2 block text-caption font-semibold text-cocoa">{t('email')}</span>
                        <input
                            name="email"
                            type="email"
                            autoComplete="email"
                            placeholder="example@email.com"
                            className={inputClass}
                        />
                    </label>
                </div>

                <div className="mt-8">
                    <span className="mb-2 block text-caption font-semibold text-cocoa">
                        {t('date')} <span className="text-red-500">*</span>
                    </span>
                    <div className="rounded-2xl border border-cocoa/10 p-4 sm:p-6 md:p-8">
                        <div className="flex items-center justify-between">
                            <button
                                type="button"
                                disabled={isCurrentMonth}
                                onClick={() => moveMonth(-1)}
                                aria-label={t('previousMonth')}
                                className="flex size-10 items-center justify-center rounded-full text-2xl text-latte hover:bg-cocoa/5 disabled:cursor-not-allowed disabled:opacity-20"
                            >
                                ‹
                            </button>
                            <strong className="text-lead font-semibold text-cocoa">
                                {new Intl.DateTimeFormat(localeMap[locale] ?? locale, {
                                    year: 'numeric',
                                    month: 'long',
                                }).format(visibleMonth)}
                            </strong>
                            <button
                                type="button"
                                onClick={() => moveMonth(1)}
                                aria-label={t('nextMonth')}
                                className="flex size-10 items-center justify-center rounded-full text-2xl text-latte hover:bg-cocoa/5"
                            >
                                ›
                            </button>
                        </div>

                        <div className="mt-5 grid grid-cols-7 text-center text-caption text-latte">
                            {weekdays.map((weekday) => (
                                <span key={weekday} className="py-2">
                                    {weekday}
                                </span>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-y-1 text-center">
                            {calendarCells.map((date, index) => {
                                if (!date) return <span key={`empty-${index}`} className="h-11" />;
                                const dateKey = toDateKey(date);
                                const unavailable = date < today || date.getDay() === 0;
                                const selected = selectedDate === dateKey;

                                return (
                                    <button
                                        key={dateKey}
                                        type="button"
                                        disabled={unavailable}
                                        aria-pressed={selected}
                                        onClick={() => {
                                            setSelectedDate(dateKey);
                                            setSelectedTime('');
                                            setSubmitError(null);
                                        }}
                                        className={`mx-auto flex size-11 items-center justify-center rounded-xl text-caption transition-colors ${
                                            selected
                                                ? 'bg-cocoa font-semibold text-cream'
                                                : unavailable
                                                  ? 'cursor-not-allowed text-latte/25'
                                                  : 'text-cocoa hover:bg-sand/30'
                                        }`}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <span className="mb-3 block text-caption font-semibold text-cocoa">{t('time')}</span>
                    {selectedDate && timeSlots.length > 0 ? (
                        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                            {timeSlots.map((time) => (
                                <button
                                    key={time}
                                    type="button"
                                    aria-pressed={selectedTime === time}
                                    onClick={() => {
                                        setSelectedTime(time);
                                        setSubmitError(null);
                                    }}
                                    className={`rounded-xl px-2 py-3 text-caption font-medium transition-colors ${
                                        selectedTime === time
                                            ? 'bg-cocoa text-cream'
                                            : 'bg-cocoa/5 text-latte hover:bg-sand/35 hover:text-cocoa'
                                    }`}
                                >
                                    {time}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-xl bg-cocoa/[0.04] px-4 py-5 text-caption text-latte">
                            {selectedDate ? t('noAvailableTimes') : t('chooseDateFirst')}
                        </p>
                    )}
                </div>

                <label className="mt-8 block">
                    <span className="mb-2 block text-caption font-semibold text-cocoa">{t('memo')}</span>
                    <textarea
                        name="memo"
                        rows={5}
                        placeholder={t('memoPlaceholder')}
                        className={`${inputClass} min-h-36 resize-y`}
                    />
                </label>

                <label className="mt-6 flex items-start gap-2 text-caption text-latte">
                    <input type="checkbox" required className="mt-1 size-4 accent-cocoa" />
                    <span>{t('consent')}</span>
                </label>

                <div className="mt-8 flex flex-col items-end gap-3">
                    <button
                        type="submit"
                        disabled={!selectedDate || !selectedTime || submitting}
                        className="rounded-xl bg-cocoa px-7 py-3 text-small font-semibold text-cream transition-colors hover:bg-deep disabled:cursor-not-allowed disabled:opacity-35"
                    >
                        {submitting ? t('submitting') : t('submit')}
                    </button>
                    {submitError ? (
                        <p role="alert" className="text-caption font-semibold text-red-600">
                            {submitError}
                        </p>
                    ) : null}
                </div>
            </section>
        </form>
    );
}

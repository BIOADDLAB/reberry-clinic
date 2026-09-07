/* #COMPONENTS: 고객용 이벤트(프로모션) 목록
   #ISSUE: 상단 제목·기간·부가세 문구를 첫 번째 이벤트의 값으로 대신 쓰고 있었다.
           (visibleEvents[0].badge / .period) → 이벤트 순서가 바뀌면 제목도 같이 바뀌는 구조.
   → 전역 설정(settings/eventSettings)에서 한 번만 읽는다.
     기간 문구를 비워 두면 진행 중인 이벤트의 가장 늦은 종료일로 자동 표기한다. */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
    DEFAULT_EVENT_SETTINGS,
    eventDiscountRate,
    formatEventPeriod,
    subscribeEventSettings,
    subscribeEvents,
    type EventItem,
    type EventSettings,
} from '@/components/lib/events';

export default function ManagedEventList({ limit, showHeader = true }: { limit?: number; showHeader?: boolean }) {
    const t = useTranslations('events');
    const locale = useLocale();
    const [events, setEvents] = useState<EventItem[]>([]);
    const [settings, setSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(
        () =>
            subscribeEvents(
                (items) => {
                    setEvents(items);
                    setLoading(false);
                },
                () => {
                    setError(true);
                    setLoading(false);
                },
                true,
            ),
        [],
    );

    useEffect(() => subscribeEventSettings(setSettings), []);

    const visibleEvents = useMemo(
        () => (typeof limit === 'number' ? events.slice(0, limit) : events),
        [events, limit],
    );

    const groups = useMemo(() => {
        const result = new Map<string, EventItem[]>();
        visibleEvents.forEach((event) => {
            const category = event.category.trim() || t('categoryFallback');
            result.set(category, [...(result.get(category) ?? []), event]);
        });
        return [...result.entries()];
    }, [t, visibleEvents]);

    // 기간 문구를 안 적어 두면 진행 중인 이벤트의 가장 늦은 종료일로 대신 표기한다
    const autoPeriod = useMemo(() => {
        const ends = visibleEvents.filter((event) => !event.alwaysOn && event.endDate).map((event) => event.endDate);
        if (ends.length === 0) return '';
        const latest = ends.sort().at(-1)!;
        const [year, month, day] = latest.split('-');
        return `~ ${year}년 ${Number(month)}월 ${Number(day)}일까지`;
    }, [visibleEvents]);

    if (loading) return <StateMessage>{t('loading')}</StateMessage>;
    if (error) return <StateMessage>{t('loadError')}</StateMessage>;
    if (events.length === 0) return <StateMessage>{t('empty')}</StateMessage>;

    const periodText = settings.periodNotice || autoPeriod;
    const moneyLocale = locale === 'ko' ? 'ko-KR' : locale;

    return (
        <div className="mx-auto mt-12 max-w-5xl">
            {showHeader && (
                <header className="text-center">
                    <h2 className="text-h2 font-bold text-cocoa">{settings.headline}</h2>
                    <p className="mt-3 text-caption leading-6 text-latte">
                        {settings.vatNotice}
                        {periodText && (
                            <>
                                <br />
                                <strong className="font-semibold text-[#C95813]">{periodText}</strong>
                            </>
                        )}
                    </p>
                </header>
            )}

            <div className={showHeader ? 'mt-10 space-y-12' : 'space-y-12'}>
                {groups.map(([category, items]) => (
                    <section key={category}>
                        <div className="mb-6 flex items-center gap-5">
                            <span className="h-px flex-1 bg-cocoa/15" />
                            <h3 className="shrink-0 text-lead font-bold text-cocoa">{category}</h3>
                            <span className="h-px flex-1 bg-cocoa/15" />
                        </div>

                        <div className="space-y-3">
                            {items.map((event) => (
                                <EventRow key={event.docId} event={event} moneyLocale={moneyLocale} />
                            ))}
                        </div>
                    </section>
                ))}
            </div>
        </div>
    );
}

function EventRow({ event, moneyLocale }: { event: EventItem; moneyLocale: string }) {
    const hasSalePrice = event.salePrice !== null;
    const discountRate = eventDiscountRate(event);
    const hasDiscount = discountRate > 0;

    return (
        <article className="grid gap-5 rounded-[14px] border border-cocoa/[0.07] bg-cream px-5 py-6 shadow-[0_8px_24px_rgba(69,54,45,0.03)] md:grid-cols-[1fr_auto] md:items-center md:px-7">
            <div className="min-w-0">
                <h4 className="text-small font-bold leading-6 text-cocoa md:text-medium">{event.title}</h4>
                {event.description && <p className="mt-1 text-caption leading-6 text-latte">{event.description}</p>}
                {/* 상시가 아닌 이벤트만 개별 기간을 표시 (상단에 공통 기간이 이미 있으므로) */}
                {!event.alwaysOn && (event.startDate || event.endDate) && (
                    <p className="notranslate mt-2 text-caption-sm text-latte/80">{formatEventPeriod(event)}</p>
                )}
            </div>

            {hasSalePrice && (
                <div className="flex items-end justify-between gap-4 md:min-w-56 md:justify-end">
                    {hasDiscount && (
                        <span className="mb-1 rounded bg-[#C95813] px-2 py-1 text-caption-sm font-bold text-white">
                            -{discountRate}%
                        </span>
                    )}
                    <div className="text-right">
                        {hasDiscount && (
                            <p className="text-caption-sm text-latte line-through">
                                {formatPrice(event.originalPrice!, moneyLocale)}
                            </p>
                        )}
                        <strong className="text-h3 font-bold text-cocoa">
                            {formatPrice(event.salePrice!, moneyLocale)}
                        </strong>
                    </div>
                </div>
            )}
        </article>
    );
}

function formatPrice(price: number, locale: string) {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: 'KRW',
        maximumFractionDigits: 0,
    }).format(price);
}

function StateMessage({ children }: { children: React.ReactNode }) {
    return <div className="mt-10 py-16 text-center text-small text-latte">{children}</div>;
}

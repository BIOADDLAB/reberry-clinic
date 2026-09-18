/* #COMPONENTS: 고객용 이벤트 포스터 목록
   관리자에서 올린 포스터를 슬라이드로 걸고, 누르면 A4 비율로 크게 보여 준다.
   슬라이드·확대 모양은 EventModal 이 그대로 갖고 있으니 여기서는 데이터만 채워 넣는다. */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import EventModal from '@/components/ui/EventModal';
import {
    DEFAULT_EVENT_SETTINGS,
    fetchEvents,
    mainEvents,
    subscribeEventSettings,
    subscribeEvents,
    type EventItem,
    type EventSettings,
} from '@/components/lib/events';

/** 이만큼 기다려도 서버 응답이 없으면 한 번 읽기로 다시 시도한다 */
const SLOW_MS = 10000;

/** main 을 켜면 관리자에서 [메인에 표시]를 체크한 포스터만 (최대 3장) 걸린다 */
export default function ManagedEventPosters({ main = false, showHeader = true }: { main?: boolean; showHeader?: boolean }) {
    const t = useTranslations('events');
    const [events, setEvents] = useState<EventItem[]>([]);
    const [settings, setSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    /* #ISSUE: 고객 화면에서 이벤트를 못 불러오는 경우가 있었다.
       ① 연결이 늦거나 불안정하면 Firestore 가 서버 대신 "빈 캐시"를 먼저 줘서, 이벤트가 있어도
          "진행 중인 이벤트가 없습니다" 가 떴다 → 빈 캐시는 결론으로 치지 않고 서버 응답을 기다린다.
       ② 실시간 연결이 실패하면 그대로 "불러오지 못했습니다" 로 끝났고, 이유도 어디에도 안 남았다
          → 한 번 읽기(getDocs)로 한 번 더 시도하고, 그래도 안 되면 콘솔에 실패 이유(코드)를 남긴다.
             permission-denied = Firestore 규칙에서 events 읽기가 막힘 / unavailable = 네트워크·차단 프로그램 */
    useEffect(() => {
        let settled = false;
        let retried = false;

        const done = (items: EventItem[]) => {
            settled = true;
            setEvents(items);
            setError(false);
            setLoading(false);
        };
        const giveUp = (reason: unknown) => {
            console.error('[events] 이벤트를 불러오지 못했습니다:', reason);
            if (settled) return;
            setError(true);
            setLoading(false);
        };
        const retryOnce = (reason: unknown) => {
            console.warn('[events] 실시간 연결 실패 → 한 번 읽기로 다시 시도합니다:', reason);
            if (retried) return;
            retried = true;
            fetchEvents(true).then(done).catch(giveUp);
        };

        const unsubscribe = subscribeEvents(
            (items, { fromCache }) => {
                if (fromCache && items.length === 0) return; // 빈 캐시 — 서버 응답을 더 기다린다
                done(items);
            },
            retryOnce,
            true,
        );
        const slowTimer = setTimeout(() => {
            if (!settled) retryOnce(new Error(`${SLOW_MS / 1000}초 동안 응답 없음`));
        }, SLOW_MS);

        return () => {
            unsubscribe();
            clearTimeout(slowTimer);
        };
    }, []);

    useEffect(() => subscribeEventSettings(setSettings), []);

    const posters = useMemo(
        () =>
            (main ? mainEvents(events) : events).map((event) => ({
                image: event.imageUrl,
                title: event.title,
            })),
        [events, main],
    );

    if (loading) return <StateMessage>{t('loading')}</StateMessage>;
    if (error) return <StateMessage>{t('loadError')}</StateMessage>;
    if (posters.length === 0) return <StateMessage>{t('empty')}</StateMessage>;

    return (
        <div>
            {showHeader && (
                <header className="text-center">
                    <h2 className="text-h2 font-bold text-cocoa">{settings.headline}</h2>
                </header>
            )}
            <EventModal events={posters} />
        </div>
    );
}

function StateMessage({ children }: { children: React.ReactNode }) {
    return <div className="mt-10 py-16 text-center text-small text-latte">{children}</div>;
}

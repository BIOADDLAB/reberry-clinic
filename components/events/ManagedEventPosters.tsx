/* #COMPONENTS: 고객용 이벤트 포스터 목록
   관리자에서 올린 포스터를 슬라이드로 걸고, 누르면 A4 비율로 크게 보여 준다.
   슬라이드·확대 모양은 EventModal 이 그대로 갖고 있으니 여기서는 데이터만 채워 넣는다. */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import EventModal from '@/components/ui/EventModal';
import {
    DEFAULT_EVENT_SETTINGS,
    mainEvents,
    subscribeEventSettings,
    subscribeEvents,
    type EventItem,
    type EventSettings,
} from '@/components/lib/events';

/** main 을 켜면 관리자에서 [메인에 표시]를 체크한 포스터만 (최대 3장) 걸린다 */
export default function ManagedEventPosters({ main = false, showHeader = true }: { main?: boolean; showHeader?: boolean }) {
    const t = useTranslations('events');
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

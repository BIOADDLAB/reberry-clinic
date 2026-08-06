'use client';

import { useEffect, useState } from 'react';
import EventModal from '@/components/ui/EventModal';
import { subscribeEvents, type EventItem } from '@/components/lib/events';

export default function ManagedEventList({ limit }: { limit?: number }) {
    const [events, setEvents] = useState<EventItem[]>([]);
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

    if (loading) {
        return <div className="mt-12 py-20 text-center text-small text-latte">이벤트를 불러오는 중입니다.</div>;
    }
    if (error) {
        return <div className="mt-12 py-20 text-center text-small text-latte">이벤트를 불러오지 못했습니다.</div>;
    }
    if (events.length === 0) {
        return <div className="mt-12 py-20 text-center text-small text-latte">진행 중인 이벤트가 없습니다.</div>;
    }

    return (
        <EventModal
            events={(typeof limit === 'number' ? events.slice(0, limit) : events).map((event) => ({
                image: event.imageUrl,
                title: event.title,
            }))}
        />
    );
}

/* #COMPONENTS: 이벤트 관리 — 고객 페이지와 똑같은 모양에서 고친다
   #ISSUE 1: 상단 제목("9월 프로모션")을 이벤트마다 하나씩 적게 돼 있었다 → 맨 위 공통 설정 한 곳으로.
   #ISSUE 2: 분류 이름("이벤트")이 큰 글씨로 박혀 있는데 고치거나 지울 방법이 없었다
             → 분류 줄을 직접 눌러 이름을 고칠 수 있게 하고, 고치면 그 분류의 이벤트가 통째로 따라간다.
   #ISSUE 3: 자동 저장이라 "저장을 어떻게 하는지" 알 수 없었다
             → 글자·가격 수정은 화면에만 반영되고, 아래 [저장하기] 를 눌러야 홈페이지에 올라간다. */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    DEFAULT_EVENT_SETTINGS,
    createEvent,
    deleteEvent,
    eventStatus,
    saveEventSettings,
    subscribeEventSettings,
    subscribeEvents,
    updateEvent,
    updateEventSorts,
    type EventItem,
    type EventSettings,
} from '@/components/lib/events';
import { AdminHeader, ErrorBanner, IconButton, PublishToggle, Toast, useAdminAction } from '@/components/admin/AdminUI';

type Edits = Record<string, string>;
const key = (id: string, field: string) => `${id}:${field}`;
const digits = (v: string) => v.replace(/[^0-9]/g, '');

const STATUS_TONE: Record<string, string> = {
    '진행 중': 'bg-[#2E7D4F]/10 text-[#2E7D4F]',
    예정: 'bg-cocoa/[0.06] text-latte',
    종료: 'bg-black/[0.06] text-latte',
    숨김: 'bg-black/70 text-white',
};

export default function EventManager() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [settings, setSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS);
    const [edits, setEdits] = useState<Edits>({});
    const [loading, setLoading] = useState(true);
    const { busy, error, toast, run, setError } = useAdminAction();

    useEffect(
        () =>
            subscribeEvents(
                (items) => {
                    setEvents(items);
                    setLoading(false);
                },
                (e) => {
                    setError(e.message || '이벤트를 불러오지 못했습니다.');
                    setLoading(false);
                },
            ),
        [setError],
    );
    useEffect(() => subscribeEventSettings(setSettings), []);

    const dirtyCount = Object.keys(edits).length;

    useEffect(() => {
        if (dirtyCount === 0) return;
        const warn = (e: BeforeUnloadEvent) => e.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirtyCount]);

    const setEdit = useCallback((k: string, value: string, original: string) => {
        setEdits((current) => {
            const next = { ...current };
            if (value === original) delete next[k];
            else next[k] = value;
            return next;
        });
    }, []);
    const shown = (k: string, original: string) => edits[k] ?? original;

    const groups = useMemo(() => {
        const map = new Map<string, EventItem[]>();
        events.forEach((event) => {
            const name = shown(key(event.docId, 'category'), event.category) || '이벤트';
            map.set(name, [...(map.get(name) ?? []), event]);
        });
        return [...map.entries()];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [events, edits]);

    const saveAll = () =>
        run(
            async () => {
                const s: Partial<EventSettings> = {};
                if (edits['settings:headline'] !== undefined) s.headline = edits['settings:headline'];
                if (edits['settings:vatNotice'] !== undefined) s.vatNotice = edits['settings:vatNotice'];
                if (edits['settings:periodNotice'] !== undefined) s.periodNotice = edits['settings:periodNotice'];
                if (Object.keys(s).length) await saveEventSettings(s);

                for (const event of events) {
                    const fields = ['title', 'description', 'category', 'originalPrice', 'salePrice', 'startDate', 'endDate'];
                    if (!fields.some((f) => edits[key(event.docId, f)] !== undefined)) continue;
                    const pick = (f: string) => edits[key(event.docId, f)];
                    const price = (f: string, fallback: number | null) => {
                        const raw = pick(f);
                        if (raw === undefined) return fallback;
                        return raw ? Number(raw) : null;
                    };
                    await updateEvent(event.docId, {
                        title: pick('title') ?? event.title,
                        category: (pick('category') ?? event.category) || '이벤트',
                        description: pick('description') ?? event.description,
                        originalPrice: price('originalPrice', event.originalPrice),
                        salePrice: price('salePrice', event.salePrice),
                        alwaysOn: event.alwaysOn,
                        startDate: pick('startDate') ?? event.startDate,
                        endDate: pick('endDate') ?? event.endDate,
                        isPublished: event.isPublished,
                        imageUrl: event.imageUrl,
                        badge: event.badge,
                    });
                }
                setEdits({});
            },
            '저장에 실패했습니다.',
            '홈페이지에 반영했습니다',
        );

    /** 분류 이름 바꾸기 — 그 분류에 속한 이벤트 전부의 분류를 같이 바꾼다 */
    const renameGroup = (from: string, to: string) => {
        events
            .filter((e) => (shown(key(e.docId, 'category'), e.category) || '이벤트') === from)
            .forEach((e) => setEdit(key(e.docId, 'category'), to, e.category));
    };

    const addEvent = (category: string) =>
        run(
            async () => {
                await createEvent({
                    title: '새 이벤트',
                    category,
                    description: '',
                    originalPrice: null,
                    salePrice: null,
                    alwaysOn: true,
                    startDate: '',
                    endDate: '',
                    isPublished: false,
                    imageUrl: '',
                    badge: '',
                });
            },
            '추가에 실패했습니다.',
            '추가했습니다 (숨김 상태)',
        );

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">이벤트를 불러오는 중입니다.</div>;
    }

    return (
        <div className="pb-32">
            <AdminHeader
                title="이벤트 관리"
                description="홈페이지 이벤트 페이지와 같은 모양입니다. 고친 뒤 화면 아래 [저장하기] 를 누르세요."
                previewHref="/events"
                action={
                    <button
                        type="button"
                        onClick={() => {
                            const c = window.prompt('추가할 분류 이름을 입력하세요.\n예: 리프팅')?.trim();
                            if (c) void addEvent(c);
                        }}
                        disabled={busy}
                        className="rounded-full bg-cocoa px-4 py-2 text-caption font-semibold text-cream disabled:opacity-40"
                    >
                        + 분류 추가
                    </button>
                }
            />

            <ErrorBanner message={error} />

            <div className="mt-5 rounded-xl border border-cocoa/10 bg-white px-4 py-3.5 text-caption leading-6 text-latte">
                <b className="text-cocoa">사용법</b> · 글자와 가격을 <b className="text-cocoa">직접 클릭</b>해서 고치세요.
                고친 칸은 <span className="rounded bg-[#FFF6D6] px-1 py-0.5 text-cocoa">노란색</span> 이 됩니다.
                <b className="text-cocoa"> 가운데 큰 글씨(분류 이름)</b> 도 눌러서 고치거나 지울 수 있습니다.
                다 고쳤으면 맨 아래 <b className="text-cocoa">[저장하기]</b>.
                <br />
                할인율은 정상가·이벤트가를 넣으면 <b className="text-cocoa">자동으로 계산</b>됩니다. 따로 입력하지 않습니다.
            </div>

            {/* ── 공통 설정 ─────────────────────────────────────────────── */}
            <section className="mt-8 rounded-2xl bg-white p-5 shadow-[0_2px_15px_rgba(69,54,45,0.06)] md:p-6">
                <h2 className="text-small font-bold text-cocoa">공통 설정</h2>
                <p className="mt-1 text-caption text-latte">이벤트 페이지 맨 위에 한 번만 나오는 문구입니다.</p>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                    {(
                        [
                            ['headline', '상단 제목', '예: 9월 프로모션', settings.headline],
                            ['vatNotice', '부가세 문구', '예: 부가세 별도', settings.vatNotice],
                            ['periodNotice', '기간 문구 (비우면 자동)', '비우면 종료일 중 가장 늦은 날로 표기', settings.periodNotice],
                        ] as const
                    ).map(([field, label, placeholder, value]) => (
                        <label key={field} className="block">
                            <span className="text-caption-sm font-semibold text-latte">{label}</span>
                            <Field
                                value={shown(`settings:${field}`, value)}
                                dirty={`settings:${field}` in edits}
                                placeholder={placeholder}
                                onChange={(v) => setEdit(`settings:${field}`, v, value)}
                                className="mt-1 w-full text-small text-cocoa"
                                box
                            />
                        </label>
                    ))}
                </div>
            </section>

            {/* ── 분류별 이벤트 ─────────────────────────────────────────── */}
            <div className="mt-8 space-y-10">
                {groups.map(([category, list]) => (
                    <section key={category}>
                        {/* 분류 줄 — 큰 글씨를 직접 눌러 고친다 */}
                        <div className="mb-4 flex items-center gap-4">
                            <span className="h-px flex-1 bg-cocoa/15" />
                            <Field
                                value={category}
                                dirty={list.some((e) => key(e.docId, 'category') in edits)}
                                onChange={(v) => renameGroup(category, v)}
                                className="w-56 text-center text-lead font-bold text-cocoa"
                                placeholder="분류 이름"
                            />
                            <span className="h-px flex-1 bg-cocoa/15" />
                        </div>

                        <div className="space-y-3">
                            {list.map((event) => (
                                <EventCard
                                    key={event.docId}
                                    event={event}
                                    busy={busy}
                                    edits={edits}
                                    setEdit={setEdit}
                                    shown={shown}
                                    run={run}
                                    isFirst={events[0]?.docId === event.docId}
                                    isLast={events[events.length - 1]?.docId === event.docId}
                                    onMove={(dir) => {
                                        const i = events.findIndex((c) => c.docId === event.docId);
                                        const t = events[i + dir];
                                        if (!t) return;
                                        void run(
                                            () =>
                                                updateEventSorts([
                                                    { docId: event.docId, sort: t.sort },
                                                    { docId: t.docId, sort: event.sort },
                                                ]),
                                            '순서 변경 실패',
                                            '순서를 바꿨습니다',
                                        );
                                    }}
                                />
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => void addEvent(category)}
                            disabled={busy}
                            className="mt-3 w-full rounded-xl border border-dashed border-cocoa/25 py-2.5 text-caption font-semibold text-latte hover:border-cocoa/45 hover:text-cocoa disabled:opacity-40"
                        >
                            + {category} 에 이벤트 추가
                        </button>
                    </section>
                ))}

                {groups.length === 0 && (
                    <p className="rounded-2xl bg-white py-16 text-center text-small text-latte">
                        등록된 이벤트가 없습니다. 오른쪽 위 “+ 분류 추가” 로 시작하세요.
                    </p>
                )}
            </div>

            {/* ── 저장 바 ───────────────────────────────────────────────── */}
            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cocoa/10 bg-white/95 backdrop-blur">
                <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-10">
                    <p className="text-caption text-latte">
                        {dirtyCount > 0 ? (
                            <>
                                <b className="text-[#C95813]">저장하지 않은 수정 {dirtyCount}개</b> 가 있습니다.
                            </>
                        ) : (
                            '수정한 내용이 없습니다.'
                        )}
                    </p>
                    <div className="flex shrink-0 gap-2">
                        <button
                            type="button"
                            disabled={busy || dirtyCount === 0}
                            onClick={() => {
                                if (!window.confirm('저장하지 않은 수정을 모두 되돌릴까요?')) return;
                                setEdits({});
                            }}
                            className="rounded-full border border-cocoa/15 px-5 py-2.5 text-small font-semibold text-cocoa disabled:opacity-30"
                        >
                            되돌리기
                        </button>
                        <button
                            type="button"
                            disabled={busy || dirtyCount === 0}
                            onClick={() => void saveAll()}
                            className="rounded-full bg-[#C95813] px-7 py-2.5 text-small font-bold text-white disabled:bg-cocoa/20 disabled:text-cocoa/40"
                        >
                            {busy ? '저장 중…' : '저장하기'}
                        </button>
                    </div>
                </div>
            </div>

            <Toast message={toast} />
        </div>
    );
}

function EventCard({
    event,
    busy,
    edits,
    setEdit,
    shown,
    run,
    onMove,
    isFirst,
    isLast,
}: {
    event: EventItem;
    busy: boolean;
    edits: Edits;
    setEdit: (k: string, v: string, original: string) => void;
    shown: (k: string, original: string) => string;
    run: (action: () => Promise<void>, fallback: string, done?: string) => Promise<void>;
    onMove: (dir: -1 | 1) => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const id = event.docId;
    const original = shown(key(id, 'originalPrice'), event.originalPrice === null ? '' : String(event.originalPrice));
    const sale = shown(key(id, 'salePrice'), event.salePrice === null ? '' : String(event.salePrice));
    const o = Number(original) || 0;
    const s = Number(sale) || 0;
    const discount = o > s && s > 0 ? Math.round((1 - s / o) * 100) : 0;
    const status = eventStatus(event);

    const toggleAlways = (alwaysOn: boolean) =>
        run(
            () =>
                updateEvent(id, {
                    title: event.title,
                    category: event.category,
                    description: event.description,
                    originalPrice: event.originalPrice,
                    salePrice: event.salePrice,
                    alwaysOn,
                    startDate: alwaysOn ? '' : event.startDate,
                    endDate: alwaysOn ? '' : event.endDate,
                    isPublished: event.isPublished,
                    imageUrl: event.imageUrl,
                    badge: event.badge,
                }),
            '저장 실패',
            alwaysOn ? '상시로 바꿨습니다' : '기간제로 바꿨습니다',
        );

    return (
        <article className="rounded-[14px] border border-cocoa/[0.07] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(69,54,45,0.04)] md:px-6">
            <div className="flex flex-wrap items-center gap-2">
                <Field
                    value={shown(key(id, 'title'), event.title)}
                    dirty={key(id, 'title') in edits}
                    onChange={(v) => setEdit(key(id, 'title'), v, event.title)}
                    placeholder="시술명"
                    className="min-w-40 flex-1 text-small font-bold text-cocoa md:text-medium"
                />
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-caption-sm font-semibold ${STATUS_TONE[status]}`}>
                    {status}
                </span>
                <div className="flex shrink-0 items-center gap-1">
                    <IconButton label="위로" disabled={busy || isFirst} onClick={() => onMove(-1)}>↑</IconButton>
                    <IconButton label="아래로" disabled={busy || isLast} onClick={() => onMove(1)}>↓</IconButton>
                    <PublishToggle
                        published={event.isPublished}
                        disabled={busy}
                        onChange={(isPublished) =>
                            run(
                                () =>
                                    updateEvent(id, {
                                        title: event.title,
                                        category: event.category,
                                        description: event.description,
                                        originalPrice: event.originalPrice,
                                        salePrice: event.salePrice,
                                        alwaysOn: event.alwaysOn,
                                        startDate: event.startDate,
                                        endDate: event.endDate,
                                        isPublished,
                                        imageUrl: event.imageUrl,
                                        badge: event.badge,
                                    }),
                                '저장 실패',
                                isPublished ? '공개했습니다' : '숨겼습니다',
                            )
                        }
                    />
                    <IconButton
                        label="삭제"
                        tone="danger"
                        disabled={busy}
                        onClick={() => {
                            if (!window.confirm(`"${event.title}" 이벤트를 삭제할까요?`)) return;
                            void run(() => deleteEvent(id), '삭제 실패', '삭제했습니다');
                        }}
                    >
                        ×
                    </IconButton>
                </div>
            </div>

            <Field
                value={shown(key(id, 'description'), event.description)}
                dirty={key(id, 'description') in edits}
                onChange={(v) => setEdit(key(id, 'description'), v, event.description)}
                placeholder="한 줄 설명 (선택)"
                className="mt-1 w-full text-caption text-latte"
            />

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-cocoa/[0.06] pt-3">
                <label className="flex items-center gap-1.5">
                    <input type="checkbox" checked={event.alwaysOn} disabled={busy} onChange={(e) => void toggleAlways(e.target.checked)} />
                    <span className="text-caption text-cocoa">상시</span>
                </label>

                {!event.alwaysOn && (
                    <span className="flex items-center gap-1.5">
                        <input
                            type="date"
                            value={shown(key(id, 'startDate'), event.startDate)}
                            onChange={(e) => setEdit(key(id, 'startDate'), e.target.value, event.startDate)}
                            className={`rounded-md border px-2 py-1 text-caption text-cocoa ${
                                key(id, 'startDate') in edits ? 'border-[#E0B84A] bg-[#FFF6D6]' : 'border-cocoa/12'
                            }`}
                        />
                        <span className="text-caption text-latte">~</span>
                        <input
                            type="date"
                            value={shown(key(id, 'endDate'), event.endDate)}
                            onChange={(e) => setEdit(key(id, 'endDate'), e.target.value, event.endDate)}
                            className={`rounded-md border px-2 py-1 text-caption text-cocoa ${
                                key(id, 'endDate') in edits ? 'border-[#E0B84A] bg-[#FFF6D6]' : 'border-cocoa/12'
                            }`}
                        />
                    </span>
                )}

                <span className="ml-auto flex flex-wrap items-center gap-2">
                    <span className="text-caption-sm text-latte">정상가</span>
                    <Field
                        value={original}
                        dirty={key(id, 'originalPrice') in edits}
                        align="right"
                        format={(v) => (v ? Number(v).toLocaleString('ko-KR') : '')}
                        onChange={(v) => setEdit(key(id, 'originalPrice'), digits(v), event.originalPrice === null ? '' : String(event.originalPrice))}
                        className="w-28 text-caption text-latte"
                        box
                    />
                    <span className="text-caption-sm text-latte">이벤트가</span>
                    <Field
                        value={sale}
                        dirty={key(id, 'salePrice') in edits}
                        align="right"
                        format={(v) => (v ? Number(v).toLocaleString('ko-KR') : '')}
                        onChange={(v) => setEdit(key(id, 'salePrice'), digits(v), event.salePrice === null ? '' : String(event.salePrice))}
                        className="w-28 text-caption font-bold text-cocoa"
                        box
                    />
                    <span
                        title="정상가와 이벤트가로 자동 계산됩니다"
                        className={`rounded px-1.5 py-0.5 text-caption-sm font-bold ${
                            discount > 0 ? 'bg-[#C95813] text-white' : 'bg-cocoa/[0.06] text-latte'
                        }`}
                    >
                        {discount > 0 ? `-${discount}%` : '—'}
                    </span>
                </span>
            </div>
        </article>
    );
}

function Field({
    value,
    onChange,
    dirty,
    className = '',
    placeholder,
    align = 'left',
    format,
    box = false,
}: {
    value: string;
    onChange: (value: string) => void;
    dirty: boolean;
    className?: string;
    placeholder?: string;
    align?: 'left' | 'right';
    format?: (value: string) => string;
    box?: boolean;
}) {
    const [focused, setFocused] = useState(false);
    const display = !focused && format ? format(value) : value;

    return (
        <input
            value={display}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(e) => onChange(e.target.value)}
            className={`rounded-md border px-2 py-1.5 outline-none transition-colors ${align === 'right' ? 'text-right' : ''} ${
                dirty
                    ? 'border-[#E0B84A] bg-[#FFF6D6]'
                    : box
                      ? 'border-cocoa/12 bg-white focus:border-cocoa/35'
                      : 'border-transparent bg-transparent hover:border-cocoa/15 hover:bg-white focus:border-cocoa/35 focus:bg-white'
            } ${className}`}
        />
    );
}

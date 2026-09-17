/* 이벤트 관리 — 홈페이지 이벤트 페이지와 같은 카드에서 글자·가격을 눌러 고친다.
   숨김/공개를 알약 두 개로 나누지 않고, [홈페이지에 보임] 스위치 하나로 정한다. */

'use client';

import { useEffect, useMemo, useState } from 'react';
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
    type EventInput,
    type EventItem,
    type EventSettings,
} from '@/components/lib/events';
import {
    AddRowButton,
    AdminHeader,
    ErrorBanner,
    Field,
    HelpBanner,
    MoneyField,
    SaveBar,
    TextAction,
    Toast,
    VisibilitySwitch,
    confirmDelete,
    useAdminAction,
    useDirtyEdits,
} from '@/components/admin/AdminUI';

const fieldKey = (id: string, field: string) => `${id}:${field}`;

/* 카드 한 장에서 사람이 고칠 수 있는 칸. draft() 와 "고친 게 있나" 판단이 같은 목록을 본다. */
const EDITABLE_FIELDS = ['title', 'description', 'category', 'originalPrice', 'salePrice', 'startDate', 'endDate'] as const;

/* #ISSUE: 2026.09.17 점검 — Firestore 는 문서를 통째로 덮어쓰는데, [보임] 스위치와 [상시 → 기간]은
   저장 안 한 수정(노란 칸)을 무시하고 화면에 처음 불러온 값으로 썼다. 이름과 가격을 고친 뒤 보임을
   켜면 홈페이지에 옛 이름·옛 가격이 나가 버린다.
   → 어느 경로로 쓰든 이 함수로 "지금 화면에 보이는 값" 을 만들어 보낸다. */
function draft(event: EventItem, edits: Record<string, string>, next: Partial<EventInput> = {}): EventInput {
    const pick = (field: string) => edits[fieldKey(event.docId, field)];
    const price = (field: 'originalPrice' | 'salePrice') => {
        const raw = pick(field);
        if (raw === undefined) return event[field];
        return raw ? Number(raw) : null;
    };

    return {
        title: pick('title') ?? event.title,
        category: (pick('category') ?? event.category) || '이벤트',
        description: pick('description') ?? event.description,
        originalPrice: price('originalPrice'),
        salePrice: price('salePrice'),
        alwaysOn: event.alwaysOn,
        startDate: pick('startDate') ?? event.startDate,
        endDate: pick('endDate') ?? event.endDate,
        isPublished: event.isPublished,
        imageUrl: event.imageUrl,
        badge: event.badge,
        ...next,
    };
}

export default function EventManager() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [settings, setSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS);
    const [loading, setLoading] = useState(true);
    const { edits, setEdit, shown, dirtyCount, clearEdits, clearKeys } = useDirtyEdits();
    const { busy, error, toast, run, setError } = useAdminAction();

    useEffect(
        () =>
            subscribeEvents(
                (items) => {
                    setEvents(items);
                    setLoading(false);
                },
                (loadError) => {
                    setError(loadError.message || '이벤트를 불러오지 못했습니다.');
                    setLoading(false);
                },
            ),
        [setError],
    );
    useEffect(() => subscribeEventSettings(setSettings), []);

    const groups = useMemo(() => {
        const map = new Map<string, EventItem[]>();
        events.forEach((event) => {
            const name = shown(fieldKey(event.docId, 'category'), event.category) || '이벤트';
            map.set(name, [...(map.get(name) ?? []), event]);
        });
        return [...map.entries()];
    }, [events, shown]);

    const saveAll = () =>
        run(
            async () => {
                const nextSettings: Partial<EventSettings> = {};
                if (edits['settings:headline'] !== undefined) nextSettings.headline = edits['settings:headline'];
                if (edits['settings:vatNotice'] !== undefined) nextSettings.vatNotice = edits['settings:vatNotice'];
                if (edits['settings:periodNotice'] !== undefined) nextSettings.periodNotice = edits['settings:periodNotice'];
                if (Object.keys(nextSettings).length) await saveEventSettings(nextSettings);

                for (const event of events) {
                    if (!EDITABLE_FIELDS.some((field) => edits[fieldKey(event.docId, field)] !== undefined)) continue;
                    await updateEvent(event.docId, draft(event, edits));
                }
                clearEdits();
            },
            '저장에 실패했습니다.',
            '홈페이지에 반영했습니다',
        );

    const renameGroup = (from: string, to: string) => {
        events
            .filter((event) => (shown(fieldKey(event.docId, 'category'), event.category) || '이벤트') === from)
            .forEach((event) => setEdit(fieldKey(event.docId, 'category'), to, event.category));
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
            '추가했습니다. 주황색 버튼을 누르면 홈페이지에 보입니다.',
        );

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">이벤트를 불러오는 중입니다.</div>;
    }

    const periodText = shown('settings:periodNotice', settings.periodNotice);

    return (
        <div className="pb-32">
            <AdminHeader
                title="이벤트 관리"
                description="홈페이지 이벤트 페이지와 똑같은 화면입니다. 글자와 가격을 눌러 고친 뒤 [저장하기]를 누르세요."
                previewHref="/events"
            />
            <ErrorBanner message={error} />
            <HelpBanner>
                <b className="text-cocoa">사용법</b> · 시술 이름, 설명, 가격을 마우스로 눌러 고칩니다. 고친 칸은{' '}
                <span className="rounded bg-[#FFF6D6] px-1 py-0.5 text-cocoa">노란색</span>이 되고, 아래 [저장하기]를
                누르면 홈페이지에 나갑니다. 맨 위 큰 제목과 가운데 분류 이름도 눌러서 바꿉니다.
                <br />
                <b className="text-cocoa">보임 · 상시/기간 · 순서 · 삭제</b>는 누르는 즉시 저장됩니다. 이때 노란 칸도
                함께 저장되니, 고치는 중에 눌러도 옛 내용이 나가지 않습니다.
            </HelpBanner>

            <div className="mx-auto mt-10 max-w-5xl">
                <header className="text-center">
                    <Field
                        value={shown('settings:headline', settings.headline)}
                        dirty={'settings:headline' in edits}
                        onChange={(value) => setEdit('settings:headline', value, settings.headline)}
                        placeholder="예: 9월 프로모션"
                        className="text-center text-h2 font-bold text-cocoa"
                    />
                    <Field
                        value={shown('settings:vatNotice', settings.vatNotice)}
                        dirty={'settings:vatNotice' in edits}
                        onChange={(value) => setEdit('settings:vatNotice', value, settings.vatNotice)}
                        placeholder="예: 부가세 별도"
                        className="mt-2 text-center text-caption text-latte"
                    />
                    <Field
                        value={periodText}
                        dirty={'settings:periodNotice' in edits}
                        onChange={(value) => setEdit('settings:periodNotice', value, settings.periodNotice)}
                        placeholder="예: ~ 2026년 9월 30일까지 (비워 두면 자동)"
                        className="text-center text-caption font-semibold text-[#C95813]"
                    />
                </header>

                <div className="mt-10 space-y-12">
                    {groups.map(([category, list]) => (
                        <section key={category}>
                            <div className="mb-6 flex items-center gap-5">
                                <span className="h-px flex-1 bg-cocoa/15" />
                                <Field
                                    value={category}
                                    dirty={list.some((event) => fieldKey(event.docId, 'category') in edits)}
                                    onChange={(value) => renameGroup(category, value)}
                                    placeholder="분류 이름"
                                    className="w-56 text-center text-lead font-bold text-cocoa"
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
                                        clearKeys={clearKeys}
                                        run={run}
                                        isFirst={events[0]?.docId === event.docId}
                                        isLast={events[events.length - 1]?.docId === event.docId}
                                        onMove={(dir) => {
                                            const index = events.findIndex((item) => item.docId === event.docId);
                                            const target = events[index + dir];
                                            if (!target) return;
                                            void run(
                                                () =>
                                                    updateEventSorts([
                                                        { docId: event.docId, sort: target.sort },
                                                        { docId: target.docId, sort: event.sort },
                                                    ]),
                                                '순서 변경 실패',
                                                '순서를 바꿨습니다',
                                            );
                                        }}
                                    />
                                ))}
                            </div>

                            <div className="mt-3">
                                <AddRowButton disabled={busy} onClick={() => void addEvent(category)}>
                                    + {category}에 이벤트 추가
                                </AddRowButton>
                            </div>
                        </section>
                    ))}

                    <AddRowButton
                        disabled={busy}
                        onClick={() => void addEvent(`새 분류 ${groups.length + 1}`)}
                    >
                        + 새 분류 만들기
                    </AddRowButton>

                    {groups.length === 0 && (
                        <p className="rounded-2xl bg-white py-16 text-center text-small text-latte">
                            등록된 이벤트가 없습니다. 위의 [+ 새 분류 만들기]를 누르세요.
                        </p>
                    )}
                </div>
            </div>

            <SaveBar
                dirtyCount={dirtyCount}
                busy={busy}
                onSave={() => void saveAll()}
                onRevert={() => {
                    if (!window.confirm('저장하지 않은 수정을 모두 되돌릴까요?')) return;
                    clearEdits();
                }}
            />
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
    clearKeys,
    run,
    onMove,
    isFirst,
    isLast,
}: {
    event: EventItem;
    busy: boolean;
    edits: Record<string, string>;
    setEdit: (key: string, value: string, original: string) => void;
    shown: (key: string, original: string) => string;
    clearKeys: (keys: string[]) => void;
    run: (action: () => Promise<void>, fallback: string, done?: string) => Promise<void>;
    onMove: (dir: -1 | 1) => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const id = event.docId;
    const original = shown(fieldKey(id, 'originalPrice'), event.originalPrice === null ? '' : String(event.originalPrice));
    const sale = shown(fieldKey(id, 'salePrice'), event.salePrice === null ? '' : String(event.salePrice));
    const originalNumber = Number(original) || 0;
    const saleNumber = Number(sale) || 0;
    const discount = originalNumber > saleNumber && saleNumber > 0 ? Math.round((1 - saleNumber / originalNumber) * 100) : 0;
    const status = event.isPublished ? eventStatus({ ...event, isPublished: true }) : null;

    /* 노란 칸(저장 안 한 수정)까지 함께 보내고, 보낸 칸의 노란색은 지운다.
       그래야 스위치 한 번이 "지금 화면 그대로 홈페이지에 반영" 이 된다. */
    const patch = (next: Partial<EventInput>, done?: string) =>
        run(
            async () => {
                await updateEvent(id, draft(event, edits, next));
                clearKeys(EDITABLE_FIELDS.map((field) => fieldKey(id, field)));
            },
            '저장 실패',
            done,
        );

    return (
        <article
            className={`rounded-[14px] border bg-cream px-5 py-6 shadow-[0_8px_24px_rgba(69,54,45,0.03)] md:px-7 ${
                event.isPublished ? 'border-cocoa/[0.07]' : 'border-[#C95813]/35 bg-[#FFF8F1]'
            }`}
        >
            <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
                <div className="min-w-0">
                    <Field
                        value={shown(fieldKey(id, 'title'), event.title)}
                        dirty={fieldKey(id, 'title') in edits}
                        onChange={(value) => setEdit(fieldKey(id, 'title'), value, event.title)}
                        placeholder="시술 이름"
                        className="text-small font-bold text-cocoa md:text-medium"
                    />
                    <Field
                        value={shown(fieldKey(id, 'description'), event.description)}
                        dirty={fieldKey(id, 'description') in edits}
                        onChange={(value) => setEdit(fieldKey(id, 'description'), value, event.description)}
                        placeholder="한 줄 설명 (없어도 됩니다)"
                        className="mt-1 text-caption text-latte"
                    />
                    {!event.alwaysOn && (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                            <input
                                type="date"
                                value={shown(fieldKey(id, 'startDate'), event.startDate)}
                                onChange={(eventChange) =>
                                    setEdit(fieldKey(id, 'startDate'), eventChange.target.value, event.startDate)
                                }
                                className={`min-h-11 rounded-lg border px-3 text-caption text-cocoa ${
                                    fieldKey(id, 'startDate') in edits ? 'border-[#E0B84A] bg-[#FFF6D6]' : 'border-cocoa/12'
                                }`}
                            />
                            <span className="text-caption text-latte">부터</span>
                            <input
                                type="date"
                                value={shown(fieldKey(id, 'endDate'), event.endDate)}
                                onChange={(eventChange) =>
                                    setEdit(fieldKey(id, 'endDate'), eventChange.target.value, event.endDate)
                                }
                                className={`min-h-11 rounded-lg border px-3 text-caption text-cocoa ${
                                    fieldKey(id, 'endDate') in edits ? 'border-[#E0B84A] bg-[#FFF6D6]' : 'border-cocoa/12'
                                }`}
                            />
                            <span className="text-caption text-latte">까지</span>
                        </div>
                    )}
                </div>

                <div className="flex items-end justify-between gap-4 md:min-w-56 md:justify-end">
                    <span
                        className={`mb-1 rounded px-2 py-1 text-caption-sm font-bold ${
                            discount > 0 ? 'bg-[#C95813] text-white' : 'bg-cocoa/[0.06] text-latte'
                        }`}
                    >
                        {discount > 0 ? `-${discount}%` : '할인율 자동'}
                    </span>
                    <div className="text-right">
                        <p className="text-caption-sm text-latte">정상가</p>
                        <MoneyField
                            value={original}
                            dirty={fieldKey(id, 'originalPrice') in edits}
                            onChange={(value) =>
                                setEdit(
                                    fieldKey(id, 'originalPrice'),
                                    value,
                                    event.originalPrice === null ? '' : String(event.originalPrice),
                                )
                            }
                            className="w-36 text-caption text-latte line-through"
                        />
                        <p className="mt-1 text-caption-sm text-latte">이벤트가</p>
                        <MoneyField
                            value={sale}
                            dirty={fieldKey(id, 'salePrice') in edits}
                            onChange={(value) =>
                                setEdit(fieldKey(id, 'salePrice'), value, event.salePrice === null ? '' : String(event.salePrice))
                            }
                            className="w-36 text-h3 font-bold text-cocoa"
                        />
                    </div>
                </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-cocoa/[0.07] pt-4">
                <VisibilitySwitch
                    visible={event.isPublished}
                    disabled={busy}
                    onChange={(isPublished) => void patch({ isPublished }, isPublished ? '홈페이지에 보이게 했습니다' : '숨겼습니다')}
                />
                <TextAction
                    disabled={busy}
                    onClick={() =>
                        void patch(
                            { alwaysOn: !event.alwaysOn, startDate: event.alwaysOn ? event.startDate : '', endDate: event.alwaysOn ? event.endDate : '' },
                            event.alwaysOn ? '기간제로 바꿨습니다' : '상시로 바꿨습니다',
                        )
                    }
                >
                    {event.alwaysOn ? '상시 → 기간' : '기간 → 상시'}
                </TextAction>
                {status && status !== '숨김' && (
                    <span className="text-caption text-latte">{status}</span>
                )}
                <span className="ml-auto flex flex-wrap gap-2">
                    <TextAction disabled={busy || isFirst} onClick={() => onMove(-1)}>
                        위로
                    </TextAction>
                    <TextAction disabled={busy || isLast} onClick={() => onMove(1)}>
                        아래로
                    </TextAction>
                    <TextAction
                        tone="danger"
                        disabled={busy}
                        onClick={() => {
                            if (!confirmDelete(shown(fieldKey(id, 'title'), event.title))) return;
                            void run(() => deleteEvent(id), '삭제 실패', '삭제했습니다');
                        }}
                    >
                        삭제
                    </TextAction>
                </span>
            </div>
        </article>
    );
}

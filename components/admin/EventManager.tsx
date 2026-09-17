/* 이벤트 관리 — 디자인된 포스터를 그대로 올리는 화면.
   카드 한 장이 홈페이지 이벤트 페이지의 포스터 한 장이다. 사진을 눌러 올리고,
   [홈페이지에 보임] 스위치 하나로 걸고 내린다.

   #ISSUE: 2026.09.17 — 제목·설명·정상가·이벤트가·기간을 칸마다 적던 표 형태였는데,
           가격이 포스터 그림 안에도 있어 두 군데를 맞춰 적어야 했다. 사진 한 장만 올리는
           예전 방식으로 되돌리고 가격·기간 칸은 없앴다. */

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { uploadImage, deleteStoredImage } from '@/components/lib/storageUpload';
import {
    DEFAULT_EVENT_SETTINGS,
    MAIN_MAX,
    createEvent,
    deleteEvent,
    eventStatus,
    mainEvents,
    saveEventSettings,
    subscribeEventSettings,
    subscribeEvents,
    updateEvent,
    updateEventMainSorts,
    updateEventSorts,
    type EventInput,
    type EventItem,
    type EventSettings,
} from '@/components/lib/events';
import {
    AddRowButton,
    AdminHeader,
    CheckBox,
    DragHandle,
    ErrorBanner,
    Field,
    HelpBanner,
    MoveButton,
    SaveBar,
    TextAction,
    Toast,
    VisibilitySwitch,
    confirmDelete,
    reindex,
    useAdminAction,
    useDirtyEdits,
    useDragReorder,
} from '@/components/admin/AdminUI';

const titleKey = (id: string) => `${id}:title`;

/** index 자리를 step 만큼 옮긴 새 순서. 목록 밖으로 나가면 null (버튼이 잠겨 있어도 한 번 더 막는다) */
function swapped(order: string[], index: number, step: number): string[] | null {
    const swap = index + step;
    if (swap < 0 || swap >= order.length) return null;
    const next = [...order];
    [next[index], next[swap]] = [next[swap], next[index]];
    return next;
}

/* #ISSUE: Firestore 는 문서를 통째로 덮어쓴다. [보임] 스위치나 사진 올리기가 저장 안 한
   이름(노란 칸)을 무시하고 처음 불러온 값으로 쓰면, 이름을 고치던 중 스위치를 누른 순간
   옛 이름이 다시 저장된다. → 어느 경로로 쓰든 이 함수로 "지금 화면에 보이는 값" 을 만든다. */
function draft(event: EventItem, edits: Record<string, string>, next: Partial<EventInput> = {}): EventInput {
    return {
        title: edits[titleKey(event.docId)] ?? event.title,
        imageUrl: event.imageUrl,
        isPublished: event.isPublished,
        showOnMain: event.showOnMain,
        ...next,
    };
}

export default function EventManager() {
    const [events, setEvents] = useState<EventItem[]>([]);
    const [settings, setSettings] = useState<EventSettings>(DEFAULT_EVENT_SETTINGS);
    const [loading, setLoading] = useState(true);
    /* 방금 만든 칸. 그 칸이 화면에 그려지면 거기로 스크롤해서 바로 사진을 올릴 수 있게 한다 */
    const [addedId, setAddedId] = useState<string | null>(null);
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

    const saveAll = () =>
        run(
            async () => {
                if (edits['settings:headline'] !== undefined) {
                    await saveEventSettings({ headline: edits['settings:headline'] });
                }
                for (const event of events) {
                    if (edits[titleKey(event.docId)] === undefined) continue;
                    await updateEvent(event.docId, draft(event, edits));
                }
                clearEdits();
            },
            '저장에 실패했습니다.',
            '홈페이지에 반영했습니다',
        );

    const addEvent = () =>
        run(
            async () => {
                const id = await createEvent({
                    // 이름은 비워 둔 채 만든다. 넣어 두면 안 지운 사람의 포스터 아래에 그 글씨가 그대로 나간다
                    title: '',
                    imageUrl: '',
                    isPublished: false,
                    showOnMain: false,
                });
                setAddedId(id);
                // 테두리 강조는 잠깐만. 계속 켜 두면 무엇이 새 칸인지 뜻이 흐려진다
                window.setTimeout(() => setAddedId((current) => (current === id ? null : current)), 4000);
            },
            '추가에 실패했습니다.',
            '맨 앞에 칸을 만들었습니다. 사진을 올려 주세요.',
        );

    /* ── 순서 바꾸기 : 손잡이로 끌거나 화살표로 한 칸씩 ──────────────────
       옮긴 뒤 sort 를 0,1,2… 로 다시 매긴다. 두 개만 맞바꾸면 값이 어긋나 순서가 튄다. */
    const ids = events.map((event) => event.docId);
    const reorder = (nextIds: string[]) =>
        void run(() => updateEventSorts(reindex(nextIds)), '순서 변경 실패', '순서를 바꿨습니다');

    const drag = useDragReorder(reorder);

    const nudge = (index: number, step: number) => {
        const next = swapped(ids, index, step);
        if (next) reorder(next);
    };

    /* ── 메인(첫 화면)에 걸리는 포스터 ──────────────────────────────────
       메인은 한 줄(3칸)뿐이라 그 이상 체크하면 줄이 넘어간다 → 3개가 차면 나머지는 못 켜게 잠근다.
       하나도 체크가 없으면 예전처럼 앞에서부터 3개가 자동으로 올라간다(mainEvents).
       고객 화면과 똑같은 기준(보임 + 사진 있음)으로 골라야 아래 미리보기가 실제와 맞는다. */
    const liveEvents = events.filter((event) => event.isPublished && event.imageUrl);
    const mainList = mainEvents(liveEvents);
    const mainRank = new Map(mainList.map((event, at) => [event.docId, at + 1]));
    const mainPickedCount = events.filter((event) => event.showOnMain).length;
    const mainFull = mainPickedCount >= MAIN_MAX;
    const mainAuto = mainPickedCount === 0;

    /* 메인 순서는 mainSort 에만 쓴다 → 여기서 옮겨도 이벤트 페이지 순서는 그대로다 */
    const nudgeMain = (index: number, step: number) => {
        const next = swapped(
            mainList.map((event) => event.docId),
            index,
            step,
        );
        if (!next) return;
        void run(
            () => updateEventMainSorts(next.map((docId, mainSort) => ({ docId, mainSort }))),
            '메인 순서 변경 실패',
            '메인에서 나오는 순서를 바꿨습니다',
        );
    };

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">이벤트를 불러오는 중입니다.</div>;
    }

    return (
        <div className="pb-32">
            <AdminHeader
                title="이벤트 관리"
                description="이벤트 포스터를 올리는 화면입니다. 사진을 눌러 올린 뒤 [홈페이지에 보임]을 켜세요."
                previewHref="/events"
            />
            <ErrorBanner message={error} />
            <HelpBanner>
                <b className="text-cocoa">사용법</b> · [+ 이벤트 칸 추가]를 누르고, 회색 사진 칸을 눌러 만들어 둔 포스터
                이미지를 올립니다. 그다음 [홈페이지에 보임]을 켜면 이벤트 페이지에 걸립니다. 세로로 긴 포스터(A4
                비율)가 가장 예쁘게 나옵니다.
                <br />
                <b className="text-cocoa">순서</b>는 왼쪽 위 점 여섯 개(⠿)를 끌어서 바꿉니다. 화살표로 한 칸씩 옮겨도
                됩니다. 여기 놓인 순서 그대로 홈페이지에서 넘어갑니다.
                <br />
                <b className="text-cocoa">메인에 표시</b>를 체크하면 첫 화면 [CURRENT EVENT] 칸에도 걸립니다. 최대{' '}
                {MAIN_MAX}개까지이고, 하나도 체크하지 않으면 위에서부터 {MAIN_MAX}개가 자동으로 올라갑니다. 이벤트
                페이지에는 체크와 상관없이 [보임]인 것이 모두 나옵니다.
                <br />
                메인에서 나오는 <b className="text-cocoa">순서</b>는 위쪽 [메인(첫 화면)에 나오는 순서] 줄에서 화살표로
                바꿉니다. 메인 순서와 이벤트 페이지 순서는 따로 저장되니 한쪽을 바꿔도 다른 쪽은 그대로입니다.
                <br />
                <b className="text-cocoa">사진 · 보임 · 순서 · 삭제</b>는 누르는 즉시 저장됩니다. 글씨를 고쳤을 때만
                아래 [저장하기]를 누르세요.
                <br />
                사진 아래 칸에 적은 글씨는 홈페이지에서 <b className="text-cocoa">포스터 아래에 작게</b> 나옵니다.
                포스터 그림에 이미 이름이 들어 있으면 <b className="text-cocoa">비워 두세요</b> — 비우면 사진만 나옵니다.
                <br />
                끝난 이벤트는 [보임]을 끄면 홈페이지에서 내려갑니다. 사진을 안 올린 칸은 켜 두어도 나오지 않습니다.
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
                </header>

                <MainOrder items={mainList} auto={mainAuto} busy={busy} onMove={nudgeMain} />

                {/* 새 칸을 만드는 버튼은 목록 위에 둔다. 포스터가 늘어나면 아래쪽 버튼은
                    한참 스크롤해야 나와서 찾기 어렵다. 새 칸도 맨 앞에 생기므로 누른 자리 바로 아래에 보인다. */}
                <div className="mt-8">
                    <AddRowButton disabled={busy} onClick={() => void addEvent()}>
                        + 이벤트 칸 추가
                    </AddRowButton>
                </div>

                <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {events.map((event, index) => (
                        <EventCard
                            key={event.docId}
                            event={event}
                            busy={busy}
                            edits={edits}
                            setEdit={setEdit}
                            shown={shown}
                            clearKeys={clearKeys}
                            run={run}
                            setError={setError}
                            drag={drag}
                            ids={ids}
                            mainFull={mainFull}
                            mainAuto={mainAuto}
                            /* 메인에서 몇 번째로 나오는지. 0 이면 메인에 안 걸린 카드 */
                            mainRank={mainRank.get(event.docId) ?? 0}
                            justAdded={event.docId === addedId}
                            isFirst={index === 0}
                            isLast={index === events.length - 1}
                            onMove={(dir) => nudge(index, dir)}
                        />
                    ))}
                </div>

                {events.length === 0 && (
                    <p className="rounded-2xl bg-white py-16 text-center text-small text-latte">
                        등록된 이벤트가 없습니다. 위의 [+ 이벤트 칸 추가]를 누르세요.
                    </p>
                )}
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

/* ── 메인에서 나오는 순서 ────────────────────────────────────────────────
   #ISSUE: 메인 순서를 이벤트 페이지 순서와 같이 쓰던 때는, 메인에서 한 장을 앞으로 보내려고
           카드를 끌면 이벤트 페이지 순서까지 끌려 바뀌었다. 반대로 이벤트 페이지를 정리하면
           메인 순서가 멋대로 바뀌었다 → 메인 순서는 이 줄에서만 따로 정한다.
   메인은 세 장뿐이라 화살표로 충분하다. 큰 카드를 여기까지 늘어놓으면 정작 아래 목록이
   화면에서 밀려나므로, 지금 첫 화면에 어떤 순서로 걸려 있는지만 작게 보여 준다. */
function MainOrder({
    items,
    auto,
    busy,
    onMove,
}: {
    items: EventItem[];
    /** 체크가 하나도 없어 자동으로 채워진 상태인지 */
    auto: boolean;
    busy: boolean;
    onMove: (index: number, step: -1 | 1) => void;
}) {
    // 한 장뿐이면 정할 순서가 없다 → 빈 상자만 남아 화면만 어지럽다
    if (items.length < 2) return null;

    return (
        <section className="mt-8 rounded-2xl border border-cocoa/10 bg-white px-5 py-4">
            <h3 className="text-small font-bold text-cocoa">메인(첫 화면)에 나오는 순서</h3>
            <p className="mt-1 text-caption leading-6 text-latte">
                화살표로 옮기면 <b className="text-cocoa">첫 화면에서 나오는 순서만</b> 바뀝니다. 아래 이벤트 페이지
                순서는 그대로 있습니다.
                {auto && ' 지금은 [메인에 표시]를 체크한 이벤트가 없어서 앞에서부터 자동으로 걸려 있습니다.'}
            </p>
            <ol className="mt-3 flex flex-wrap gap-4">
                {items.map((event, index) => (
                    <li key={event.docId} className="w-[104px]">
                        <div className="relative aspect-[7/10] overflow-hidden rounded-lg border border-cocoa/10 bg-cream">
                            <Image src={event.imageUrl} alt="" fill unoptimized className="object-cover" />
                            <span className="absolute left-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C95813] text-caption-sm font-bold text-cream">
                                {index + 1}
                            </span>
                        </div>
                        {/* 이름은 비워 둘 수 있다 → 빈 줄만 남기지 않고 자리 표시를 흐리게 둔다 */}
                        <p
                            className={`mt-1.5 truncate text-caption-sm font-semibold ${
                                event.title ? 'text-cocoa' : 'text-latte'
                            }`}
                            title={event.title}
                        >
                            {event.title || '글씨 없음'}
                        </p>
                        <div className="mt-1 flex justify-center gap-1">
                            <MoveButton dir="left" disabled={busy || index === 0} onClick={() => onMove(index, -1)} />
                            <MoveButton
                                dir="right"
                                disabled={busy || index === items.length - 1}
                                onClick={() => onMove(index, 1)}
                            />
                        </div>
                    </li>
                ))}
            </ol>
        </section>
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
    setError,
    drag,
    ids,
    mainFull,
    mainAuto,
    mainRank,
    justAdded,
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
    setError: (message: string | null) => void;
    drag: ReturnType<typeof useDragReorder>;
    ids: string[];
    /** 메인 자리가 이미 다 찼는지 (체크된 것이 3개) */
    mainFull: boolean;
    /** 아무것도 체크되지 않아 메인이 자동으로 채워지는 상태인지 */
    mainAuto: boolean;
    /** 메인에서 몇 번째로 나오는지. 0 이면 메인에 안 걸림 */
    mainRank: number;
    /** 방금 [+ 이벤트 칸 추가]로 만든 칸인지 */
    justAdded: boolean;
    onMove: (dir: -1 | 1) => void;
    isFirst: boolean;
    isLast: boolean;
}) {
    const id = event.docId;
    const [uploading, setUploading] = useState(false);
    const title = shown(titleKey(id), event.title);
    const status = eventStatus(event);
    const card = useRef<HTMLElement>(null);

    /* 새로 만든 칸은 화면 밖에 있을 수 있다 → 스스로 화면 가운데로 온다.
       버튼만 누르고 아무 일도 안 일어난 것처럼 보이는 일을 막는다. */
    useEffect(() => {
        if (justAdded) card.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [justAdded]);

    /* 노란 칸(저장 안 한 이름)까지 함께 보내고, 보낸 칸의 노란색은 지운다.
       그래야 스위치 한 번이 "지금 화면 그대로 홈페이지에 반영" 이 된다. */
    const patch = (next: Partial<EventInput>, done?: string) =>
        run(
            async () => {
                await updateEvent(id, draft(event, edits, next));
                clearKeys([titleKey(id)]);
            },
            '저장 실패',
            done,
        );

    /* 사진은 올리는 즉시 저장한다. 저장을 잊고 나가면 Storage 에만 파일이 남아
       "올렸는데 안 나온다" 가 되기 때문이다. 바뀐 뒤 옛 사진은 지워 용량을 아낀다. */
    const pickImage = async (file: File | undefined) => {
        if (!file) return;
        setUploading(true);
        try {
            const previous = event.imageUrl;
            const url = await uploadImage(file, 'events');
            await patch({ imageUrl: url }, '사진을 올렸습니다');
            if (previous && previous !== url) await deleteStoredImage(previous).catch(() => undefined);
        } catch {
            setError('사진을 올리지 못했습니다. 파일 크기를 줄여 다시 시도해 주세요.');
        } finally {
            setUploading(false);
        }
    };

    const locked = busy || uploading;

    return (
        <article
            ref={card}
            {...(locked ? {} : drag.rowProps(id, ids))}
            className={`overflow-hidden rounded-[14px] border bg-cream shadow-[0_8px_24px_rgba(69,54,45,0.03)] ${
                drag.isTarget(id)
                    ? 'border-[#C95813]'
                    : event.isPublished && event.imageUrl
                      ? 'border-cocoa/[0.07]'
                      : 'border-[#C95813]/35'
            } ${drag.isMoving(id) ? 'opacity-40' : ''} ${
                justAdded ? 'ring-2 ring-[#C95813] ring-offset-2 ring-offset-[#F5F1EA]' : ''
            }`}
        >
            <label className="relative block aspect-[7/10] cursor-pointer overflow-hidden bg-white">
                {event.imageUrl ? (
                    <Image src={event.imageUrl} alt="" fill unoptimized className="object-cover" />
                ) : (
                    <span className="flex h-full items-center justify-center px-6 text-center text-small font-semibold text-latte">
                        {uploading ? '올리는 중…' : '여기를 눌러 포스터 올리기'}
                    </span>
                )}
                {event.imageUrl && (
                    <span className="absolute inset-x-0 bottom-0 bg-cocoa/70 py-2 text-center text-caption font-semibold text-cream">
                        {uploading ? '올리는 중…' : '눌러서 사진 바꾸기'}
                    </span>
                )}
                <input
                    type="file"
                    accept="image/*"
                    disabled={busy || uploading}
                    className="sr-only"
                    onChange={(changeEvent) => void pickImage(changeEvent.target.files?.[0])}
                />
            </label>

            <div className="px-4 py-4">
                {/* 손잡이만 끌리게 둔다 → 이름 칸의 글자 선택을 방해하지 않는다 */}
                <div className="flex items-center gap-2">
                    <DragHandle disabled={locked} {...(locked ? {} : drag.handleProps(id))} />
                    <Field
                        value={title}
                        dirty={titleKey(id) in edits}
                        onChange={(value) => setEdit(titleKey(id), value, event.title)}
                        /* 비워 둬도 되는 칸이라는 것을 여기서 바로 알려 준다 */
                        placeholder="포스터 아래 글씨 (없으면 비워 두세요)"
                        className="min-w-0 flex-1 text-small font-bold text-cocoa"
                    />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-cocoa/[0.07] pt-3">
                    <VisibilitySwitch
                        visible={event.isPublished}
                        disabled={busy || uploading}
                        onChange={(isPublished) =>
                            void patch({ isPublished }, isPublished ? '홈페이지에 보이게 했습니다' : '숨겼습니다')
                        }
                    />
                    {/* 스위치가 이미 보임/숨김을 말해 준다 → 손볼 게 있을 때만 덧붙인다 */}
                    {status === '사진 필요' && (
                        <span className="text-caption font-semibold text-[#C95813]">사진 필요</span>
                    )}
                </div>

                <div className="mt-2">
                    <CheckBox
                        checked={event.showOnMain}
                        disabled={locked || (mainFull && !event.showOnMain)}
                        reason={
                            mainFull && !event.showOnMain
                                ? `메인에는 ${MAIN_MAX}개까지만 걸 수 있습니다. 다른 이벤트의 체크를 먼저 풀어 주세요.`
                                : '첫 화면 [CURRENT EVENT] 칸에도 이 포스터를 걸어 둡니다.'
                        }
                        onChange={(showOnMain) =>
                            void patch(
                                { showOnMain },
                                showOnMain ? '메인에도 걸었습니다' : '메인에서 내렸습니다',
                            )
                        }
                    >
                        메인에 표시
                    </CheckBox>
                    {/* 순서는 위쪽 [메인에 나오는 순서] 줄에서 정한다 → 여기서는 몇 번째인지만 알려 준다.
                        자동으로 걸린 것은 뒤에 '자동' 을 붙인다. 카드마다 긴 문장을 반복하면 읽지 않는다. */}
                    {mainRank > 0 && (
                        <span
                            title={
                                mainAuto
                                    ? '체크한 이벤트가 없어서 자동으로 걸려 있습니다. 순서는 위쪽 [메인(첫 화면)에 나오는 순서]에서 바꿉니다.'
                                    : '첫 화면에 나오는 차례입니다. 순서는 위쪽 [메인(첫 화면)에 나오는 순서]에서 바꿉니다.'
                            }
                            className="ml-2 rounded bg-[#C95813]/10 px-1.5 py-0.5 text-caption-sm font-semibold text-[#C95813]"
                        >
                            메인 {mainRank}번째{mainAuto && ' · 자동'}
                        </span>
                    )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {/* 화살표만 두면 무엇이 움직이는지 모른다 → 무슨 버튼인지 옆에 적어 둔다 */}
                    <span className="text-caption text-latte">순서 변경</span>
                    <MoveButton dir="left" disabled={locked || isFirst} onClick={() => onMove(-1)} />
                    <MoveButton dir="right" disabled={locked || isLast} onClick={() => onMove(1)} />
                    <span className="ml-auto">
                        <TextAction
                            tone="danger"
                            disabled={locked}
                            onClick={() => {
                                if (!confirmDelete(title || '이 이벤트')) return;
                                void run(
                                    async () => {
                                        await deleteEvent(id);
                                        if (event.imageUrl) await deleteStoredImage(event.imageUrl).catch(() => undefined);
                                    },
                                    '삭제 실패',
                                    '삭제했습니다',
                                );
                            }}
                        >
                            삭제
                        </TextAction>
                    </span>
                </div>
            </div>
        </article>
    );
}

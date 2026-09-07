/* 관리자 공통 UI
   규칙: 홈페이지와 같은 모양에서, 글자를 눌러 고치고, 아래 [저장하기] 로 반영한다.
   삭제·숨김처럼 헷갈리면 안 되는 건 한글 라벨로, 순서 이동처럼 방향이 있는 건 화살표로 보여 준다.

   #ISSUE: 버튼이 크다는 피드백을 받고 화살표(↑↓)를 "위/아래" 글자 링크로 바꿨더니
           방향이 한눈에 안 보인다는 지적을 받았다.
   → 화살표는 SVG 로 되살리고 크기만 작게 유지한다. 순서는 끌어서도 바꿀 수 있게 한다. */

'use client';

import { useCallback, useEffect, useState } from 'react';

/** 저장 대기 중인 칸은 노란 배경으로 표시한다 */
export function Field({
    value,
    onChange,
    dirty,
    className = '',
    placeholder,
    align = 'left',
    multiline = false,
    format,
    rows = 2,
}: {
    value: string;
    onChange: (value: string) => void;
    dirty?: boolean;
    className?: string;
    placeholder?: string;
    align?: 'left' | 'right';
    multiline?: boolean;
    format?: (value: string) => string;
    rows?: number;
}) {
    const [focused, setFocused] = useState(false);
    const shown = !focused && format ? format(value) : value;
    const box = `min-h-8 w-full rounded border px-1.5 py-1 outline-none transition-colors ${
        align === 'right' ? 'text-right' : ''
    } ${
        dirty
            ? 'border-[#E0B84A] bg-[#FFF6D6]'
            : 'border-transparent bg-transparent hover:border-cocoa/15 hover:bg-white focus:border-cocoa/35 focus:bg-white'
    } ${className}`;

    if (multiline) {
        return (
            <textarea
                rows={rows}
                value={value}
                placeholder={placeholder}
                onChange={(event) => onChange(event.target.value)}
                className={`${box} resize-y`}
            />
        );
    }

    return (
        <input
            value={shown}
            placeholder={placeholder}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onChange={(event) => onChange(event.target.value)}
            className={box}
        />
    );
}

export function MoneyField({
    value,
    dirty,
    onChange,
    className = '',
    placeholder = '0',
}: {
    value: string;
    dirty?: boolean;
    onChange: (digits: string) => void;
    className?: string;
    placeholder?: string;
}) {
    return (
        <Field
            value={value}
            dirty={dirty}
            align="right"
            placeholder={placeholder}
            format={(next) => (next ? Number(next).toLocaleString('ko-KR') : '')}
            onChange={(next) => onChange(next.replace(/[^0-9]/g, ''))}
            className={className}
        />
    );
}

/** 홈페이지에 보일지 한 번에 정하는 큰 스위치. 알약 두 개로 나누지 않는다. */
export function VisibilitySwitch({
    visible,
    onChange,
    disabled,
    onLabel = '보임',
    offLabel = '숨김',
}: {
    visible: boolean;
    onChange: (visible: boolean) => void;
    disabled?: boolean;
    onLabel?: string;
    offLabel?: string;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!visible)}
            title={visible ? `${onLabel}. 누르면 바뀝니다.` : `${offLabel}`}
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-caption-sm font-semibold transition-colors disabled:opacity-40 ${
                visible ? 'text-[#2E7D4F] hover:bg-[#2E7D4F]/10' : 'text-[#C95813] hover:bg-[#C95813]/10'
            }`}
        >
            {visible ? onLabel : offLabel}
        </button>
    );
}

export function TextAction({
    children,
    onClick,
    disabled,
    tone = 'default',
}: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
    tone?: 'default' | 'danger';
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className={`inline-flex items-center px-1 text-caption-sm font-medium transition-colors disabled:opacity-25 ${
                tone === 'danger' ? 'text-red-500 hover:underline' : 'text-latte hover:text-cocoa hover:underline'
            }`}
        >
            {children}
        </button>
    );
}

/* ───────── 순서 바꾸기 ───────── */

const ARROW: Record<'up' | 'down' | 'left' | 'right', string> = {
    up: 'm4 10 4-4 4 4',
    down: 'm4 6 4 4 4-4',
    left: 'M10 4 6 8l4 4',
    right: 'M6 4l4 4-4 4',
};

const MOVE_LABEL: Record<'up' | 'down' | 'left' | 'right', string> = {
    up: '위로 옮기기',
    down: '아래로 옮기기',
    left: '왼쪽으로 옮기기',
    right: '오른쪽으로 옮기기',
};

/** 방향 화살표 한 칸. 작게 두되 방향은 그림으로 바로 보이게 한다. */
export function MoveButton({
    dir,
    onClick,
    disabled,
}: {
    dir: 'up' | 'down' | 'left' | 'right';
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            title={MOVE_LABEL[dir]}
            aria-label={MOVE_LABEL[dir]}
            className="inline-flex h-6 w-6 items-center justify-center rounded border border-cocoa/15 text-latte transition-colors hover:border-cocoa/40 hover:text-cocoa disabled:opacity-20"
        >
            <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5">
                <path d={ARROW[dir]} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </button>
    );
}

/** 끌어서 옮기는 손잡이. 이 손잡이만 draggable 이라 칸 안의 글자 선택을 방해하지 않는다. */
export function DragHandle(props: React.HTMLAttributes<HTMLSpanElement> & { disabled?: boolean }) {
    const { disabled, className = '', ...rest } = props;
    return (
        <span
            {...rest}
            draggable={!disabled && rest.draggable}
            title="끌어서 순서 바꾸기"
            aria-label="끌어서 순서 바꾸기"
            className={`inline-flex h-6 w-5 shrink-0 items-center justify-center text-sand transition-colors ${
                disabled ? 'opacity-25' : 'cursor-grab hover:text-latte active:cursor-grabbing'
            } ${className}`}
        >
            <svg viewBox="0 0 10 16" fill="currentColor" className="h-3.5 w-2.5">
                {[3, 8, 13].map((y) => (
                    <g key={y}>
                        <circle cx="2.5" cy={y} r="1.2" />
                        <circle cx="7.5" cy={y} r="1.2" />
                    </g>
                ))}
            </svg>
        </span>
    );
}

/** 끌어서 순서 바꾸기. 놓은 자리에 맞춰 재배열한 docId 배열을 넘겨 준다. */
export function useDragReorder(onReorder: (orderedIds: string[]) => void) {
    const [dragId, setDragId] = useState<string | null>(null);
    const [overId, setOverId] = useState<string | null>(null);
    const reset = () => {
        setDragId(null);
        setOverId(null);
    };

    const handleProps = (id: string) => ({
        draggable: true,
        onDragStart: (event: React.DragEvent) => {
            setDragId(id);
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', id);
            // 손잡이만 끌면 미리보기가 점 여섯 개뿐이라 무엇을 옮기는지 모른다 → 줄 전체를 미리보기로 쓴다
            const row = (event.currentTarget as HTMLElement).closest('[data-drag-row]');
            if (row) event.dataTransfer.setDragImage(row, 24, 20);
        },
        onDragEnd: reset,
    });

    const rowProps = (id: string, ids: string[]) => ({
        'data-drag-row': '',
        onDragOver: (event: React.DragEvent) => {
            if (!dragId || dragId === id) return;
            event.preventDefault();
            setOverId(id);
        },
        onDrop: (event: React.DragEvent) => {
            event.preventDefault();
            const moving = dragId ?? event.dataTransfer.getData('text/plain');
            const from = ids.indexOf(moving);
            const to = ids.indexOf(id);
            reset();
            if (from < 0 || to < 0 || from === to) return;
            const next = [...ids];
            next.splice(to, 0, ...next.splice(from, 1));
            onReorder(next);
        },
    });

    /** 지금 끌고 있는 줄 위에 올라와 있는지 — 놓을 자리를 테두리로 표시하는 데 쓴다 */
    const isTarget = (id: string) => overId === id && dragId !== id;

    return { handleProps, rowProps, isTarget, isMoving: (id: string) => dragId === id };
}

/** 순서를 0,1,2… 로 다시 매긴다. 두 개만 맞바꾸면 값이 어긋나 순서가 튀는 일이 있었다. */
export const reindex = (orderedIds: string[]) => orderedIds.map((docId, sort) => ({ docId, sort }));

export function AddRowButton({
    children,
    onClick,
    disabled,
}: {
    children: React.ReactNode;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={onClick}
            className="flex min-h-9 w-full items-center justify-center rounded-xl border border-dashed border-cocoa/20 text-caption font-semibold text-latte transition-colors hover:border-cocoa/40 hover:text-cocoa disabled:opacity-40"
        >
            {children}
        </button>
    );
}

export function HelpBanner({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-5 rounded-2xl border border-cocoa/10 bg-white px-5 py-4 text-small leading-7 text-latte">
            {children}
        </div>
    );
}

export function AdminHeader({
    title,
    description,
    previewHref,
    action,
}: {
    title: string;
    description: string;
    previewHref?: string;
    action?: React.ReactNode;
}) {
    return (
        <header className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-0">
                <h1 className="text-h2 font-bold text-cocoa">{title}</h1>
                <p className="mt-1 text-small text-latte">{description}</p>
            </div>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
                {action}
                {previewHref && (
                    <a
                        href={previewHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center rounded-full border border-cocoa/15 px-4 text-small font-semibold text-cocoa hover:bg-cocoa/5"
                    >
                        홈페이지에서 보기
                    </a>
                )}
            </div>
        </header>
    );
}

export function SaveBar({
    dirtyCount,
    busy,
    onSave,
    onRevert,
}: {
    dirtyCount: number;
    busy: boolean;
    onSave: () => void;
    onRevert: () => void;
}) {
    return (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cocoa/10 bg-white/95 backdrop-blur">
            <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-10">
                <p className="text-small text-latte">
                    {dirtyCount > 0 ? (
                        <>
                            <b className="text-[#C95813]">아직 저장 안 한 수정 {dirtyCount}개</b>
                            가 있습니다. 오른쪽 [저장하기]를 눌러야 홈페이지에 나갑니다.
                        </>
                    ) : (
                        '고치고 싶은 글자를 눌러 보세요. 바꾼 뒤에는 [저장하기]를 누릅니다.'
                    )}
                </p>
                <div className="flex shrink-0 gap-2">
                    <button
                        type="button"
                        disabled={busy || dirtyCount === 0}
                        onClick={onRevert}
                        className="inline-flex min-h-12 items-center rounded-full border border-cocoa/15 px-5 text-small font-semibold text-cocoa disabled:opacity-30"
                    >
                        되돌리기
                    </button>
                    <button
                        type="button"
                        disabled={busy || dirtyCount === 0}
                        onClick={onSave}
                        className="inline-flex min-h-12 items-center rounded-full bg-[#C95813] px-8 text-small font-bold text-white disabled:bg-cocoa/20 disabled:text-cocoa/40"
                    >
                        {busy ? '저장 중…' : '저장하기'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function Toast({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <div className="fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-cocoa px-5 py-3 text-small font-semibold text-cream shadow-lg">
            {message}
        </div>
    );
}

export function ErrorBanner({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <div role="alert" className="mt-5 rounded-2xl bg-red-50 px-5 py-4 text-small text-red-700">
            {message}
        </div>
    );
}

export function useAdminAction() {
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toast, setToast] = useState<string | null>(null);

    const run = async (action: () => Promise<void>, fallback: string, done?: string) => {
        setBusy(true);
        setError(null);
        try {
            await action();
            if (done) {
                setToast(done);
                window.setTimeout(() => setToast(null), 1800);
            }
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : fallback);
        } finally {
            setBusy(false);
        }
    };

    return { busy, error, toast, run, setError };
}

export function useDirtyEdits() {
    const [edits, setEdits] = useState<Record<string, string>>({});

    const setEdit = useCallback((key: string, value: string, original: string) => {
        setEdits((current) => {
            const next = { ...current };
            if (value === original) delete next[key];
            else next[key] = value;
            return next;
        });
    }, []);

    const shown = (key: string, original: string) => edits[key] ?? original;
    const dirtyCount = Object.keys(edits).length;
    const clearEdits = () => setEdits({});

    useEffect(() => {
        if (dirtyCount === 0) return;
        const warn = (event: BeforeUnloadEvent) => event.preventDefault();
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [dirtyCount]);

    return { edits, setEdit, shown, dirtyCount, clearEdits };
}

export function confirmDelete(name: string) {
    return window.confirm(`"${name}" 을(를) 정말 삭제할까요?\n삭제한 뒤에는 되돌릴 수 없습니다.`);
}

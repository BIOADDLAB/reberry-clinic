/* #COMPONENTS: 관리자 공통 UI 조각
   관리자 화면은 전부 "고객 페이지와 같은 레이아웃에서 그 자리에서 고친다" 는 규칙을 따른다.
   그 규칙을 만드는 부품(그 자리 입력칸 · 아이콘 버튼 · 공개 토글 · 저장 알림)을 여기 모아
   수가표 / 이벤트 / 앞으로 추가될 관리 화면이 똑같이 쓰게 한다. */

'use client';

import { useEffect, useRef, useState } from 'react';

/** 그 자리에서 고치는 입력칸. 포커스가 빠질 때(또는 Enter) 값이 바뀌었으면 저장한다. */
export function InlineText({
    value,
    onCommit,
    className = '',
    placeholder,
    disabled,
    align = 'left',
    multiline = false,
}: {
    value: string;
    onCommit: (value: string) => void | Promise<void>;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
    align?: 'left' | 'right';
    multiline?: boolean;
}) {
    const [draft, setDraft] = useState(value);
    const committed = useRef(value);

    // 다른 곳에서 저장돼 값이 바뀌면(구독으로 내려오면) 입력칸도 따라간다
    useEffect(() => {
        if (value !== committed.current) {
            committed.current = value;
            setDraft(value);
        }
    }, [value]);

    const commit = () => {
        const next = draft.trim();
        if (next === committed.current.trim()) return;
        committed.current = next;
        void onCommit(next);
    };

    const base = `w-full rounded-md bg-transparent px-1.5 py-1 outline-none transition-colors hover:bg-cocoa/[0.04] focus:bg-white focus:ring-2 focus:ring-cocoa/20 disabled:opacity-50 ${
        align === 'right' ? 'text-right' : ''
    } ${className}`;

    if (multiline) {
        return (
            <textarea
                value={draft}
                rows={2}
                disabled={disabled}
                placeholder={placeholder}
                onChange={(event) => setDraft(event.target.value)}
                onBlur={commit}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') setDraft(committed.current);
                }}
                className={`${base} resize-y`}
            />
        );
    }

    return (
        <input
            value={draft}
            disabled={disabled}
            placeholder={placeholder}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={commit}
            onKeyDown={(event) => {
                if (event.key === 'Enter') event.currentTarget.blur();
                if (event.key === 'Escape') setDraft(committed.current);
            }}
            className={base}
        />
    );
}

/** 숫자(원) 전용 입력칸 — 천 단위 콤마를 붙여 보여 주고 숫자만 저장한다 */
export function InlineMoney({
    value,
    onCommit,
    className = '',
    placeholder = '0',
    disabled,
}: {
    value: number | null;
    onCommit: (value: number | null) => void | Promise<void>;
    className?: string;
    placeholder?: string;
    disabled?: boolean;
}) {
    return (
        <InlineText
            value={value === null ? '' : value.toLocaleString('ko-KR')}
            disabled={disabled}
            placeholder={placeholder}
            align="right"
            className={className}
            onCommit={(next) => {
                const digits = next.replace(/[^0-9]/g, '');
                onCommit(digits ? Number(digits) : null);
            }}
        />
    );
}

export function IconButton({
    children,
    label,
    onClick,
    disabled,
    tone = 'default',
}: {
    children: React.ReactNode;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    tone?: 'default' | 'danger';
}) {
    return (
        <button
            type="button"
            aria-label={label}
            title={label}
            onClick={onClick}
            disabled={disabled}
            className={`h-8 w-8 shrink-0 rounded-lg border text-caption transition-colors disabled:opacity-25 ${
                tone === 'danger'
                    ? 'border-transparent text-latte hover:bg-red-50 hover:text-red-600'
                    : 'border-cocoa/12 text-cocoa hover:bg-cocoa/5'
            }`}
        >
            {children}
        </button>
    );
}

export function PublishToggle({
    published,
    onChange,
    disabled,
    onLabel = '공개',
    offLabel = '숨김',
}: {
    published: boolean;
    onChange: (published: boolean) => void;
    disabled?: boolean;
    onLabel?: string;
    offLabel?: string;
}) {
    return (
        <button
            type="button"
            onClick={() => onChange(!published)}
            disabled={disabled}
            title={published ? '고객 페이지에 공개 중' : '숨김 상태'}
            className={`h-8 shrink-0 rounded-lg border px-2.5 text-caption-sm font-semibold transition-colors disabled:opacity-40 ${
                published ? 'border-transparent bg-cocoa/[0.06] text-cocoa' : 'border-transparent bg-black/70 text-white'
            }`}
        >
            {published ? onLabel : offLabel}
        </button>
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
                        className="rounded-full border border-cocoa/15 px-4 py-2 text-caption font-semibold text-cocoa transition-colors hover:bg-cocoa/5"
                    >
                        고객 페이지 열기 ↗
                    </a>
                )}
            </div>
        </header>
    );
}

export function Toast({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-cocoa px-5 py-2.5 text-caption font-semibold text-cream shadow-lg">
            {message}
        </div>
    );
}

export function ErrorBanner({ message }: { message: string | null }) {
    if (!message) return null;
    return (
        <div role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-caption text-red-700">
            {message}
        </div>
    );
}

/** 관리 화면 공통 비동기 실행기 — 저장 중 표시 / 에러 / "저장했습니다" 알림을 한 번에 처리 */
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
                window.setTimeout(() => setToast(null), 1600);
            }
        } catch (actionError) {
            setError(actionError instanceof Error ? actionError.message : fallback);
        } finally {
            setBusy(false);
        }
    };

    return { busy, error, toast, run, setError };
}

/* #COMPONENTS: 숫자 페이지네이션 — 피부칼럼(SkinColumnList)에서 쓰던 형태를 공용으로 뺀 것.
   전후사진(/reviews) 도 같은 모양을 쓰기로 해서 두 곳이 어긋나지 않게 한 파일로 합쳤다.
   라벨은 화면마다 번역 네임스페이스가 달라 props 로 받는다. */

'use client';

export type PaginationItem = number | 'start-ellipsis' | 'end-ellipsis';

/** 페이지가 많아도 버튼이 7칸을 넘지 않게 … 로 접는다 */
export function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    if (currentPage <= 4) return [1, 2, 3, 4, 5, 'end-ellipsis', totalPages];
    if (currentPage >= totalPages - 3) {
        return [1, 'start-ellipsis', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'start-ellipsis', currentPage - 1, currentPage, currentPage + 1, 'end-ellipsis', totalPages];
}

interface Props {
    currentPage: number;
    totalPages: number;
    onChange: (page: number) => void;
    label: string;
    prevLabel: string;
    nextLabel: string;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onChange,
    label,
    prevLabel,
    nextLabel,
    className = 'mt-14',
}: Props) {
    if (totalPages <= 1) return null;
    const items = getPaginationItems(currentPage, totalPages);

    return (
        <nav className={`flex items-center justify-center gap-0.5 sm:gap-2 ${className}`} aria-label={label}>
            <button
                type="button"
                onClick={() => onChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cocoa/15 bg-cream text-cocoa transition-colors hover:border-cocoa/35 hover:bg-sand/25 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
                aria-label={prevLabel}
            >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            {items.map((item) => {
                if (typeof item !== 'number') {
                    return (
                        <span
                            key={item}
                            aria-hidden="true"
                            className="inline-flex h-8 min-w-4 items-center justify-center text-caption-sm text-latte sm:h-10 sm:min-w-6 sm:text-caption"
                        >
                            …
                        </span>
                    );
                }

                const active = item === currentPage;
                return (
                    <button
                        key={item}
                        type="button"
                        onClick={() => onChange(item)}
                        aria-current={active ? 'page' : undefined}
                        className={`notranslate inline-flex h-8 min-w-8 items-center justify-center rounded-full px-1.5 text-caption-sm font-semibold transition-colors sm:h-10 sm:min-w-10 sm:px-2 sm:text-caption ${
                            active
                                ? 'bg-cocoa text-cream'
                                : 'border border-cocoa/15 bg-cream text-latte hover:border-cocoa/35 hover:bg-sand/25 hover:text-cocoa'
                        }`}
                    >
                        {item}
                    </button>
                );
            })}

            <button
                type="button"
                onClick={() => onChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-cocoa/15 bg-cream text-cocoa transition-colors hover:border-cocoa/35 hover:bg-sand/25 disabled:cursor-not-allowed disabled:opacity-30 sm:h-10 sm:w-10"
                aria-label={nextLabel}
            >
                <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
        </nav>
    );
}

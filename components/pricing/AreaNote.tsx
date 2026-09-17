/* 수가표 탭 아래 "시술 부위 안내" 박스.
   고객 페이지(PriceListClient)와 관리자(PriceListManager)가 같은 껍데기를 쓴다.
   관리자는 이 박스 안에 그대로 입력칸을 넣어 고치므로, 보이는 모양이 곧 홈페이지 모양이다.

   #ISSUE: 2026.09.16 병원이 안내 박스 디자인 5안을 받아 보고 1안(인라인)을 골랐다.
           나머지 4안과 전환용 상수는 지웠다 — 필요하면 git 이력에 남아 있다.

   #ISSUE: 2026.09.17 병원 지적 — "· 이걸 꼭 써야 저게 나오더라고?"
           부위를 가운뎃점으로 잘라 알약처럼 다시 그렸다. 그래서 쉼표로 적으면 안 나오고,
           "주름필러 (이마 · 미간 · 눈가)" 는 괄호 안까지 잘려 "주름필러 (이마" 가 한 부위가 됐다.
   → 자르지 않는다. 오른쪽 칸은 적은 글자를 그대로 내보낸다. 구분자를 무엇으로 쓰든,
     안 쓰든 화면에 쓴 대로 나간다.

   저장 형태는 여전히 여러 줄 글 하나("이름 : 내용")다. 관리자에서는 왼쪽·오른쪽 칸으로 나눠
   보여 주고 저장할 때 합치므로, 적는 사람이 콜론을 알 필요는 없다. */

import type { ReactNode } from 'react';

export interface NoteLine {
    /** 왼쪽 굵은 글씨 (예: 주름 보톡스 시술 부위). 비우면 아래 작은 안내 줄이 된다 */
    label: string;
    /** 오른쪽 내용. 적은 그대로 나간다 */
    text: string;
}

export function parseNoteLines(note: string): NoteLine[] {
    return note.split('\n').map((line) => {
        const divider = line.indexOf(':');
        if (divider <= 0) return { label: '', text: line.trim() };
        return { label: line.slice(0, divider).trim(), text: line.slice(divider + 1).trim() };
    });
}

export function noteFromLines(lines: NoteLine[]): string {
    return lines.map((line) => (line.label ? `${line.label} : ${line.text}` : line.text)).join('\n');
}

export function AreaNoteBox({ children }: { children: ReactNode }) {
    return <div className="overflow-hidden rounded-2xl border border-cocoa/[0.1] bg-cream">{children}</div>;
}

/** 한 줄. 아래 가격 표와 같은 "왼쪽 이름 / 오른쪽 내용" 구조라 페이지가 한 덩어리로 읽힌다. */
export function AreaNoteRow({
    first,
    label,
    children,
}: {
    first: boolean;
    /** null 이면 이름 없는 안내 줄 — 옅은 바탕에 오른쪽 내용만 한 줄로 깐다 */
    label: ReactNode | null;
    children: ReactNode;
}) {
    const border = first ? '' : 'border-t border-cocoa/[0.08]';
    if (label === null) return <div className={`${border} bg-sand/10 px-5 py-3 md:px-6`}>{children}</div>;

    return (
        <div className={`${border} flex flex-col gap-1 px-5 py-3.5 md:flex-row md:items-baseline md:gap-5 md:px-6`}>
            <div className="flex shrink-0 items-baseline gap-2 md:w-44">
                <span aria-hidden className="h-3 w-[3px] shrink-0 translate-y-[-1px] rounded-full bg-sand" />
                {label}
            </div>
            {children}
        </div>
    );
}

export default function AreaNote({ note }: { note: string }) {
    const lines = parseNoteLines(note).filter((line) => line.label || line.text);
    if (lines.length === 0) return null;

    return (
        <AreaNoteBox>
            {lines.map((line, index) => (
                <AreaNoteRow
                    key={`${line.label}|${line.text}`}
                    first={index === 0}
                    label={line.label ? <p className="text-caption font-bold text-cocoa md:text-small">{line.label}</p> : null}
                >
                    <p
                        className={
                            line.label
                                ? 'text-caption leading-6 text-latte md:text-small'
                                : 'text-caption-sm leading-5 text-latte'
                        }
                    >
                        {line.text}
                    </p>
                </AreaNoteRow>
            ))}
        </AreaNoteBox>
    );
}

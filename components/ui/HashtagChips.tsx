import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';
import { cn } from '@/components/lib/cn';
import type { Chip } from '@/components/lib/treatments';

export type ChipTone = 'sig' | 'skin' | 'aging';

const tones: Record<ChipTone, { base: string; strong: string }> = {
    sig: { base: 'bg-cream text-cocoa', strong: 'bg-cocoa text-cream' },
    skin: { base: 'bg-cream text-cocoa', strong: 'bg-cocoa text-sand' },
    aging: { base: 'bg-cream text-cocoa', strong: 'bg-sand text-cocoa' },
};

function PillChip({ c, tone }: { c: Chip; tone: ChipTone }) {
    return (
        <RevealItem className="flex">
            <span
                className={cn(
                    'flex min-h-[54px] w-full items-center justify-center whitespace-pre-line rounded-full px-6 py-2.5 leading-[24px]! text-center text-lead font-semibold',
                    c.strong ? tones[tone].strong : tones[tone].base,
                )}
            >
                <span className="line-clamp-2">
                    <span className="opacity-50"># </span>
                    {c.text}
                </span>
            </span>
        </RevealItem>
    );
}

function BoxChip({ c, i, tone }: { c: Chip; i: number; tone: ChipTone }) {
    return (
        <RevealItem
            className={cn(
                'w-fit max-w-[78%] rounded-[20px] px-4 py-2.5 text-medium font-medium leading-snug sm:px-6 sm:py-3 sm:text-lead',
                c.strong ? tones[tone].strong : tones[tone].base,
                i % 2 === 0 ? 'self-start rounded-bl-[5px]' : 'self-end rounded-br-[5px]',
            )}
        >
            <span
                className={cn('whitespace-pre-line', !c.wrap && 'text-balance')}
                style={c.wrap ? { maxWidth: `${c.wrap}px` } : undefined}
            >
                <span className="opacity-50"># </span>
                {c.text}
            </span>
        </RevealItem>

        // [2안 후보] 가운데 정렬 + 완전 둥근 pill — 쓰려면 위 블록 대신 사용
        // <RevealItem
        //     className={cn(
        //         'w-fit max-w-full rounded-full px-5 py-2.5 text-center text-medium font-medium leading-snug',
        //         c.strong ? tones[tone].strong : tones[tone].base,
        //     )}
        // >
        //     <span className="whitespace-pre-line">
        //         <span className="opacity-50"># </span>
        //         {c.text}
        //     </span>
        // </RevealItem>

        /* [기존안] 2열 그리드 박스형 — 밋밋한 버전, 되돌리려면 컨테이너를 grid grid-cols-2 로*/
        // <RevealItem
        //     className={cn(
        //         'flex items-center justify-center overflow-hidden rounded-2xl px-4 py-2 text-center text-medium font-medium leading-snug break-all',
        //         c.strong ? tones[tone].strong : tones[tone].base,
        //     )}
        // >
        //     <span>
        //         <span className="opacity-50"># </span>
        //         {c.text}
        //     </span>
        // </RevealItem>
    );
}

interface Props {
    items: Chip[];
    tone?: ChipTone;
    rows?: [number, number]; // [위 개수, 아래 개수] — lg 이상 pill 레이아웃에만 적용
}

export default function HashtagChips({ items, tone = 'sig', rows }: Props) {
    const top = rows ? items.slice(0, rows[0]) : items;
    const bottom = rows ? items.slice(rows[0]) : [];

    return (
        <>
            {rows ? (
                <RevealGroup className="mx-auto hidden flex-col items-center gap-y-4.25 lg:flex">
                    <div className="flex flex-wrap items-stretch justify-center gap-x-2.5 gap-y-4.25">
                        {top.map((c) => (
                            <PillChip key={c.text} c={c} tone={tone} />
                        ))}
                    </div>
                    <div className="flex flex-wrap items-stretch justify-center gap-x-2.5 gap-y-4.25">
                        {bottom.map((c) => (
                            <PillChip key={c.text} c={c} tone={tone} />
                        ))}
                    </div>
                </RevealGroup>
            ) : (
                <RevealGroup className="mx-auto hidden flex-wrap items-stretch justify-center gap-x-2.5 gap-y-4.25 lg:flex">
                    {items.map((c) => (
                        <PillChip key={c.text} c={c} tone={tone} />
                    ))}
                </RevealGroup>
            )}

            {/* lg 미만 — 2열 그리드 박스형 */}
            <RevealGroup className="mx-auto flex w-full max-w-[300px] flex-col gap-2.5 sm:max-w-[520px] md:max-w-[640px] lg:hidden">
                {items.map((c, i) => (
                    <BoxChip key={c.text} c={c} i={i} tone={tone} />
                ))}
            </RevealGroup>
        </>
    );
}

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
                    'flex h-[67px] items-center justify-center overflow-hidden whitespace-pre-line rounded-full px-6 py-2.5 leading-[24px]! text-center text-lead font-semibold ',
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

function BoxChip({ c }: { c: Chip }) {
    return (
        <RevealItem className="flex items-center justify-center overflow-hidden rounded-2xl bg-cream px-4 text-center py-2 break-all text-cocoa text-medium font-medium leading-snug">
            <span
                className={cn(' whitespace-pre-line', !c.wrap && 'text-balance')}
                style={c.wrap ? { maxWidth: `${c.wrap}px` } : undefined}
            >
                <span className="opacity-50"># </span>
                {c.text}
            </span>
        </RevealItem>
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
            <RevealGroup className="mx-auto grid max-w-md grid-cols-2 gap-3 lg:hidden">
                {items.map((c) => (
                    <BoxChip key={c.text} c={c} />
                ))}
            </RevealGroup>
        </>
    );
}

import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';
import { cn } from '@/components/lib/cn';
import type { Chip } from '@/components/lib/treatments';

export default function HashtagChips({ items }: { items: Chip[] }) {
    return (
        <RevealGroup className="mx-auto flex max-w-3xl flex-wrap justify-center gap-3">
            {items.map((c) => (
                <RevealItem key={c.text}>
                    <span
                        className={cn(
                            'inline-block rounded-full px-5 py-2.5 text-small shadow-sm',
                            c.strong ? 'bg-cocoa text-cream' : 'bg-cream text-cocoa ring-1 ring-cocoa/10',
                        )}
                    >
                        <span className="mr-1 opacity-50">#</span>
                        {c.text}
                    </span>
                </RevealItem>
            ))}
        </RevealGroup>
    );
}

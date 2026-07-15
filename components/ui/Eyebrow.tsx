import { cn } from '@/components/lib/cn';

export default function Eyebrow({
    children,
    light,
    className,
    hero,
}: {
    children: string;
    light?: boolean;
    hero?: boolean;
    className?: string;
}) {
    return (
        <p
            className={cn(
                'font-display flex items-center justify-center gap-3 text-lg md:text-xl',
                light ? 'text-cream' : 'text-cocoa',
                hero ? 'gap-3 md:gap-7 ' : 'gap-3 ',
                className,
            )}
        >
            {hero ? (
                <>
                    <span className="relative flex h-3.25 w-3.75 items-center justify-center rounded-full bg-cream/50">
                        <span className="relative block h-1.75 w-1.75 rounded-full bg-cream/50" />
                    </span>
                    {children}
                    <span className="relative flex h-3.75 w-3.75 items-center justify-center rounded-full bg-cream/50">
                        <span className="relative block h-1.75 w-1.75 rounded-full bg-cream/50" />
                    </span>
                </>
            ) : (
                <>
                    <span className="relative flex h-2.75 w-2.75 items-center justify-center rounded-full bg-cocoa/50">
                        <span className="relative block h-1.25 w-1.25 rounded-full bg-cocoa/50" />
                    </span>
                    {children}
                    <span className="relative flex h-2.75 w-2.75 items-center justify-center rounded-full bg-cocoa/50">
                        <span className="relative block h-1.25 w-1.25 rounded-full bg-cocoa/50" />
                    </span>
                </>
            )}
        </p>
    );
}

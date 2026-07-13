import { cn } from '@/components/lib/cn';

export default function Eyebrow({
    children,
    light,
    className,
}: {
    children: string;
    light?: boolean;
    className?: string;
}) {
    return (
        <p
            className={cn(
                'font-display flex items-center justify-center gap-3 text-lg md:text-xl',
                light ? 'text-cream' : 'text-cocoa',
                className,
            )}
        >
            <span className=" relative w-2.75 h-2.75 bg-cocoa/50 rounded-full flex justify-center items-center">
                <span className="w-1.25 h-1.25 bg-cocoa/50 relative block rounded-full"></span>
            </span>
            {children}
            <span className="relative w-2.75 h-2.75 bg-cocoa/50 rounded-full flex justify-center items-center">
                <span className="w-1.25 h-1.25 bg-cocoa/50 relative block rounded-full"></span>
            </span>
        </p>
    );
}

import Link from 'next/link';
import { cn } from '@/components/lib/cn';

export default function MoreView({
    href,
    dark,
    label = 'More View',
}: {
    href: string;
    dark?: boolean;
    label?: string;
}) {
    return (
        <Link
            href={href}
            className={cn(
                'group inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-caption tracking-wide transition-colors',
                dark
                    ? 'bg-cocoa text-cream hover:bg-deep'
                    : 'border border-cocoa/40 text-cocoa hover:bg-cocoa hover:text-cream',
            )}
        >
            {label} {/* #STYLE: 호버 시 무한 루프 애니메이션 클래스(animate-pulse-slow) 매핑 */}
            <span className="relative w-2.75 h-2.75 bg-white/25 rounded-full flex justify-center items-center animate-pulse-slow">
                <span className="w-1.25 h-1.25 bg-white relative block rounded-full"></span>
            </span>
        </Link>
    );
}

import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';
import type { SolutionPrinciple } from '@/components/lib/solutions';
import { cn } from '@/components/lib/cn';
import TextureBackground from '@/components/ui/TextureBackground';

export default function SolutionPrincipleCards({ principles }: { principles: SolutionPrinciple[] }) {
    if (principles.length === 0) return null;

    const threeUp = principles.length >= 3;

    return (
        <section className="relative py-20 lg:py-30">
            <TextureBackground src="/images/bg-texture-08.jpg" />
            <div className="container-site relative">
                <RevealGroup
                    className={cn(
                        'grid items-stretch gap-5 lg:gap-6',
                        threeUp
                            ? 'md:grid-cols-2 xl:grid-cols-3'
                            : 'md:mx-auto md:max-w-[920px] md:grid-cols-2',
                    )}
                >
                    {principles.map((principle, index) => (
                        <RevealItem key={principle.title} className="h-full">
                            <article className="relative flex h-full flex-col overflow-hidden rounded-[10px] border border-cocoa/12 bg-cream/90 px-6 py-8 shadow-[0_10px_32px_rgba(56,43,34,0.06)] lg:px-7 lg:py-9">
                                <span aria-hidden className="absolute inset-x-0 top-0 h-[3px] bg-cocoa/70" />
                                <p className="font-display text-caption tracking-[0.22em] text-cocoa/40">
                                    {String(index + 1).padStart(2, '0')}
                                </p>
                                <h3 className="mt-3 break-keep text-lead font-bold leading-snug text-cocoa lg:text-h3">
                                    {principle.title}
                                </h3>
                                <span className="mt-5 block h-[2px] w-7.5 bg-cocoa/50" aria-hidden />
                                <p className="mt-6 flex-1 whitespace-pre-line break-keep text-small leading-[28px] text-cocoa/80">
                                    {principle.content}
                                </p>
                            </article>
                        </RevealItem>
                    ))}
                </RevealGroup>
            </div>
        </section>
    );
}

import Image from 'next/image';
import Reveal from '@/components/motion/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';

interface Props {
    en: string;
    title?: string;
    description?: string;
    image: string;
    preserveHeight?: boolean;
}

// 서브 페이지 공통 히어로
export default function SubHero({ en, title, description, image, preserveHeight = false }: Props) {
    return (
        <section
            className={`relative flex items-center justify-center overflow-hidden text-center text-cream ${
                preserveHeight ? 'h-[420px] md:h-[466px] lg:h-[566px]' : 'h-[280px] md:h-[320px] lg:h-[360px]'
            }`}
        >
            <Image src={image} alt="" fill priority quality={85} sizes="100vw" className="object-cover" />
            {!preserveHeight && <div className="absolute inset-0 bg-deep/15" />}
            <Reveal className="relative px-6">
                <Eyebrow light hero className="text-h1-sm tracking-normal ">
                    {en}
                </Eyebrow>
                {title && <h1 className="mt-3.5 text-h1-sm font-medium ">{title}</h1>}
                {description && <p className="mt-2 text-small font-medium text-cream/90">{description}</p>}
            </Reveal>
            <div
                className={`absolute left-1/2 z-3 flex -translate-x-1/2 flex-col items-center gap-1.5 ${
                    preserveHeight ? 'bottom-10 md:bottom-13 md:gap-2 lg:bottom-15' : 'bottom-5 md:bottom-6'
                }`}
            >
                <div
                    className={`flex items-start justify-center rounded-full border-2 border-white p-1 ${
                        preserveHeight ? 'h-8 w-5 md:h-10 md:w-6' : 'h-8 w-5 md:h-9 md:w-5.5'
                    }`}
                >
                    <div className="h-1.5 w-0.5 animate-wheel rounded-full bg-white md:h-2" />
                </div>
                <Image
                    src="/images/i-arr-down-03.svg"
                    alt="scroll down"
                    width={9}
                    height={6}
                    unoptimized
                    className={preserveHeight ? 'w-3 md:w-auto' : 'w-2.5 md:w-3'}
                />
            </div>
        </section>
    );
}

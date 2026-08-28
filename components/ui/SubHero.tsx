import Image from 'next/image';
import Reveal from '@/components/motion/Reveal';
import Eyebrow from '@/components/ui/Eyebrow';

interface Props {
    en: string;
    title?: string;
    description?: string;
    image: string;
}

// 서브 페이지 공통 히어로
export default function SubHero({ en, title, description, image }: Props) {
    return (
        <section className="relative flex h-[420px] items-center justify-center overflow-hidden text-center text-cream md:h-[466px] lg:h-[566px]">
            <Image src={image} alt="" fill priority quality={85} sizes="100vw" className="object-cover" />
            <Reveal className="relative px-6">
                <Eyebrow light hero className="text-h1-sm tracking-normal ">
                    {en}
                </Eyebrow>
                {title && <h1 className="mt-3.5 text-h1-sm font-medium ">{title}</h1>}
                {description && <p className="mt-2 text-small font-medium text-cream/90">{description}</p>}
            </Reveal>
            <div className="absolute bottom-10 md:bottom-13 left-1/2 -translate-x-1/2 z-3 flex flex-col items-center gap-1.5 md:gap-2 lg:bottom-15">
                <div className="flex h-8 w-5 md:h-10 md:w-6 items-start justify-center rounded-full border-2 border-white p-1">
                    <div className="h-1.5 w-0.5 md:h-2 md:w-0.5 rounded-full bg-white animate-wheel" />
                </div>
                <img src="/images/i-arr-down-03.svg" alt="scroll down" className="w-3 md:w-auto" />
            </div>
        </section>
    );
}

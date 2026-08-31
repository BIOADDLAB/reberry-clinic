import Image from 'next/image';
import { cn } from '@/components/lib/cn';

interface TextureBackgroundProps {
    src: string;
    className?: string;
    priority?: boolean;
    sizes?: string;
}

/**
 * 종이/벽면 텍스처 전용 배경.
 *
 * 텍스처처럼 미세한 명암이 반복되는 이미지를 Next 이미지 최적화가 AVIF/WebP로
 * 다시 압축하면 스크롤 중 입자가 깜빡이는 것처럼 보일 수 있다. 배경 텍스처만
 * 원본 파일을 그대로 사용하고, 확대 transform 없이 고정해 해당 현상을 막는다.
 */
export default function TextureBackground({
    src,
    className,
    priority = false,
    sizes = '100vw',
}: TextureBackgroundProps) {
    return (
        <Image
            src={src}
            alt=""
            fill
            priority={priority}
            unoptimized
            draggable={false}
            sizes={sizes}
            className={cn(
                'pointer-events-none select-none object-cover [backface-visibility:hidden]',
                className,
            )}
        />
    );
}

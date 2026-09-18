/* #COMPONENTS: 사진 자리 스켈레톤 — next/image(fill) 대신 그대로 바꿔 끼우면 된다.
   사진이 오기 전에는 은은하게 숨 쉬는 샌드색 자리를 보여 주고, 도착하면 사진을 부드럽게 올린 뒤 자리를 치운다.
   #ISSUE: 카드 사진이 늦게 오는 동안 빈 흰 칸(또는 멈춘 회색 칸)만 보여서 깨진 것처럼 보였다.
   - 부모는 next/image fill 과 같은 조건: relative(또는 absolute) + 크기(aspect-* / 고정 높이) + 보통 overflow-hidden
   - 스켈레톤은 사진이 오면 DOM 에서 빠진다 → globals.css 가 걱정한 "사진 뒤에서 계속 움직이는 무늬" 문제가 없다
   - 사진이 깨져도(onError) 깜빡임은 멈춘다. 이미 받아 둔(캐시) 사진은 next/image 가 연결 직후 onLoad 를 불러 준다
   - 사진 자체의 className(object-cover, 호버 확대 등)은 그대로 img 에 붙는다. 서서히 나타나는 효과는 바깥 상자가 맡는다 */

'use client';

import Image, { type ImageProps } from 'next/image';
import { useState } from 'react';
import { cn } from '@/components/lib/cn';

type Props = Omit<ImageProps, 'fill'> & {
    /** 스켈레톤 색 바꾸고 싶을 때 (기본: 샌드 45%) */
    skeletonClassName?: string;
};

export default function SkeletonImage({ skeletonClassName, onLoad, onError, alt, ...props }: Props) {
    const [done, setDone] = useState(false);

    return (
        <>
            {!done && (
                <span
                    aria-hidden
                    className={cn('pointer-events-none absolute inset-0 bg-sand/45 motion-safe:animate-pulse', skeletonClassName)}
                />
            )}
            <span
                className={cn(
                    'absolute inset-0 block transition-opacity duration-500 ease-out',
                    done ? 'opacity-100' : 'opacity-0',
                )}
            >
                <Image
                    {...props}
                    alt={alt}
                    fill
                    onLoad={(e) => {
                        setDone(true);
                        onLoad?.(e);
                    }}
                    onError={(e) => {
                        setDone(true);
                        onError?.(e);
                    }}
                />
            </span>
        </>
    );
}

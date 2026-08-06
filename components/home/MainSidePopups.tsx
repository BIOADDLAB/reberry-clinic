'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function MainSidePopups() {
    const [leftOpen, setLeftOpen] = useState(true);
    const [rightOpen, setRightOpen] = useState(true);

    return (
        <div className="pointer-events-none fixed inset-0 z-40 hidden xl:block" aria-label="메인 안내 팝업">
            {leftOpen && (
                <aside className="pointer-events-auto absolute left-4 top-1/2 w-[clamp(250px,24vw,395px)] -translate-y-1/2 shadow-2xl 2xl:left-7">
                    <Link href="/reviews" aria-label="리베리 솔루션 전후사진 더 보기">
                        <Image
                            src="/images/main-popups/main-left.png"
                            alt="리베리 솔루션 전후사진"
                            width={790}
                            height={680}
                            priority
                            className="h-auto w-full"
                        />
                    </Link>
                    <button
                        type="button"
                        aria-label="리베리 솔루션 팝업 닫기"
                        onClick={() => setLeftOpen(false)}
                        className="absolute right-[3.5%] top-[4.5%] h-[8%] w-[8%] cursor-pointer"
                    />
                </aside>
            )}

            {rightOpen && (
                <aside className="pointer-events-auto absolute right-4 top-1/2 w-[clamp(225px,20vw,328px)] -translate-y-1/2 shadow-2xl 2xl:right-7">
                    <Image
                        src="/images/main-popups/main-right.png"
                        alt="리베리의원 대기 시간 안내"
                        width={936}
                        height={1024}
                        priority
                        className="h-auto w-full"
                    />
                    <button
                        type="button"
                        aria-label="대기 시간 안내 팝업 닫기"
                        onClick={() => setRightOpen(false)}
                        className="absolute right-2 top-2 grid size-8 cursor-pointer place-items-center rounded-full bg-cocoa/80 text-xl leading-none text-cream transition-colors hover:bg-cocoa"
                    >
                        ×
                    </button>
                </aside>
            )}
        </div>
    );
}

// #LINK: /components/ui/DeviceColumnSlider.tsx
// #ISSUE: 기기·제품 상세 전용 — 시안: 의사사진X / 카드에는 항상 제목+더보기만 (title/en 값이 있어도 무시)
//         좌측 정렬 고정(1개여도 왼쪽), 영역 안에서만 스와이프(우측 풀블리드 아님), 폭이 모자라면 자동 슬라이더

'use client';

import Image from 'next/image';
import { site } from '@/components/lib/site';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import type { Col } from '@/components/lib/columns';
import { useColumnsBySlug } from '@/components/lib/useColumns';

export default function DeviceColumnSlider({ items, slug }: { items: Col[]; slug: string }) {
    const resolvedItems = useColumnsBySlug(slug, items);

    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(resolvedItems.length, 344, 24);

    // 정적/DB 어느 쪽에도 칼럼이 없으면 이 영역 전체를 숨김 (훅 호출 이후에 있어야 함)
    if (resolvedItems.length === 0) return null;

    return (
        <div className="mt-10">
            {/* 라벨 — 카드 위 좌측 */}
            <p className="text-small font-bold text-cocoa lg:text-medium lg:font-normal">
                닥터 파이톤 <span className="font-display">Pytone</span>
                <span className="ml-1.5 inline-block align-middle text-[0.7em]">▶</span>
            </p>

            {/* 카드 — 좌측 정렬, 영역 안에서만 스크롤 */}
            <div
                role="group"
                aria-label="기기 관련 칼럼 목록"
                ref={ref}
                {...dragProps}
                onScroll={onScroll}
                className={cn(
                    'no-scrollbar mt-3 flex snap-x justify-start gap-6 overflow-x-auto scroll-smooth pb-1',
                    dragClass,
                )}
            >
                {resolvedItems.map((c, i) => (
                    <article
                        key={`${c.title}-${i}`}
                        className="flex h-[239px] w-[344px] shrink-0 snap-start flex-col border border-cocoa bg-transparent"
                    >
                        <div className="flex flex-1 flex-col px-7.5 pt-9 pb-6">
                            {/* #ISSUE: 기기·제품 상세 페이지는 원본 데이터에 title/en 이 들어있어도
                                (시그니처 칼럼과 같이 공유되는 문서일 수 있음) 무조건 제목만 나오게 고정.
                                이 화면의 규칙이라 컴포넌트 자체에서 막음 — 관리자에서 뭘 입력하든 영향 없음 */}
                            <p className="mt-4 line-clamp-2 min-h-[3em] whitespace-pre-line text-lead leading-[30px]!">
                                {c.text}
                            </p>
                            <a
                                href={c.link ?? site.blog}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-auto flex items-center justify-end gap-1.25 pt-2.5 text-medium font-bold transition-opacity duration-500 hover:opacity-60"
                            >
                                더보기
                                <Image src="/images/i-plus-02.svg" alt="" width={10} height={10} className="pb-4" />
                            </a>
                        </div>
                    </article>
                ))}
            </div>

            {/* 페이저 — 카드 아래 우측 (넘칠 때만) */}
            {over && (
                <div className="mt-4 flex items-center justify-end gap-3 text-small text-latte">
                    <button
                        onClick={() => move(-1)}
                        aria-label="이전"
                        className={cn('transition-opacity duration-500 hover:opacity-60', !canPrev && 'opacity-30')}
                    >
                        ←
                    </button>
                    <button
                        onClick={() => move(1)}
                        aria-label="다음"
                        className={cn('transition-opacity duration-500 hover:opacity-60', !canNext && 'opacity-30')}
                    >
                        →
                    </button>
                    <span className="h-3.5 w-px bg-cocoa/30" aria-hidden />
                    <span className="font-display notranslate">
                        {page} / {total}
                    </span>
                </div>
            )}
        </div>
    );
}

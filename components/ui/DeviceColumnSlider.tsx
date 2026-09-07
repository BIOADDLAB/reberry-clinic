// #LINK: /components/ui/DeviceColumnSlider.tsx
// #ISSUE: 기기·제품 상세 전용 — 시안: 의사사진X / 카드에는 항상 제목+더보기만 (title/en 값이 있어도 무시)
//         좌측 정렬 고정(1개여도 왼쪽), 영역 안에서만 스와이프(우측 풀블리드 아님), 폭이 모자라면 자동 슬라이더

'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { site } from '@/components/lib/site';
import { useOverflowSlider } from '@/components/lib/useOverflowSlider';
import { cn } from '@/components/lib/cn';
import type { Col, FirestoreCol } from '@/components/lib/columns';
import { useColumnsBySlug } from '@/components/lib/useColumns';
import { useLocalizedColumnText } from '@/components/lib/useColumnTextTranslation';
import DoctorLabel from '@/components/ui/DoctorLabel';

function DeviceColumnCard({ c }: { c: FirestoreCol }) {
    const t = useTranslations('common');
    const { text } = useLocalizedColumnText(c);

    return (
        <article
            className="card-fixed-h t-tight flex h-[239px] w-[344px] shrink-0 snap-start flex-col border border-cocoa bg-transparent"
            style={{ '--card-h': '239px' } as React.CSSProperties}
        >
            <div className="flex flex-1 flex-col px-7.5 pt-9 pb-6">
                {/* #ISSUE: 기기·제품 상세 페이지는 원본 데이터에 title/en 이 들어있어도
                    (시그니처 칼럼과 같이 공유되는 문서일 수 있음) 무조건 제목만 나오게 고정.
                    이 화면의 규칙이라 컴포넌트 자체에서 막음 — 관리자에서 뭘 입력하든 영향 없음 */}
                <p className="mt-4 line-clamp-2 min-h-[3em] whitespace-pre-line text-lead leading-[30px]!">{text}</p>
                <a
                    href={c.link ?? site.blog}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-auto flex items-center justify-end gap-1.25 pt-2.5 text-medium font-bold transition-opacity duration-500 hover:opacity-60"
                >
                    {t('more')}
                    <Image src="/images/i-plus-02.svg" alt="" width={10} height={10} className="pb-4" />
                </a>
            </div>
        </article>
    );
}

function DeviceColumnListItem({ item }: { item: FirestoreCol }) {
    const t = useTranslations('common');
    const { text } = useLocalizedColumnText(item);

    return (
        <a
            href={item.link ?? site.blog}
            target="_blank"
            rel="noreferrer"
            className="group flex min-h-24 items-center justify-between gap-5 border-b border-cocoa/[0.12] py-6 last:border-b-0 md:min-h-28"
        >
            <h3 className="whitespace-pre-line text-small font-bold leading-7 text-cocoa md:text-lead">{text}</h3>
            <span className="flex shrink-0 items-center gap-3 text-caption font-semibold text-latte transition-colors group-hover:text-cocoa">
                <span className="hidden sm:inline">{t('more')}</span>
                <span aria-hidden className="text-lead">↗</span>
            </span>
        </a>
    );
}

export default function DeviceColumnSlider({
    items,
    slug,
    variant = 'list',
}: {
    items: Col[];
    slug: string;
    variant?: 'card' | 'list';
}) {
    const t = useTranslations('common');
    const resolvedItems = useColumnsBySlug(slug, items);

    const { ref, dragProps, dragClass, over, canPrev, canNext, page, total, move, onScroll } =
        useOverflowSlider<HTMLDivElement>(resolvedItems.length, 344, 24);

    // 정적/DB 어느 쪽에도 칼럼이 없으면 이 영역 전체를 숨김 (훅 호출 이후에 있어야 함)
    if (resolvedItems.length === 0) return null;

    if (variant === 'list') {
        return (
            <div className="mt-10 overflow-hidden rounded-[20px] border border-cocoa/[0.12] bg-cream/70 px-5 md:px-8">
                {resolvedItems.map((item, index) => (
                    <DeviceColumnListItem key={`${item.docId}-${index}`} item={item} />
                ))}

                {/* 이전 가로 카드형 레이아웃 보관
                <div className="no-scrollbar flex snap-x gap-5 overflow-x-auto">
                    {resolvedItems.map((item) => (
                        <article className="w-[336px] rounded-[20px] border bg-cream p-6">
                            칼럼 내용, 더보기
                        </article>
                    ))}
                </div>
                */}
            </div>
        );
    }

    return (
        <div className="mt-10">
            {/* 라벨 — 카드 위 좌측 */}
            <DoctorLabel />

            {/* 카드 — 좌측 정렬, 영역 안에서만 스크롤 */}
            <div
                role="group"
                aria-label={t('deviceColumnListAria')}
                ref={ref}
                {...dragProps}
                onScroll={onScroll}
                className={cn(
                    'no-scrollbar mt-3 flex snap-x justify-start gap-6 overflow-x-auto scroll-smooth pb-1',
                    dragClass,
                )}
            >
                {resolvedItems.map((c, i) => (
                    <DeviceColumnCard key={`${c.docId}-${i}`} c={c} />
                ))}
            </div>

            {/* 페이저 — 카드 아래 우측 (넘칠 때만) */}
            {over && (
                <div className="mt-4 flex items-center justify-end gap-3 text-small text-latte">
                    <button
                        onClick={() => move(-1)}
                        aria-label={t('prev')}
                        className={cn('transition-opacity duration-500 hover:opacity-60', !canPrev && 'opacity-30')}
                    >
                        ←
                    </button>
                    <button
                        onClick={() => move(1)}
                        aria-label={t('next')}
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

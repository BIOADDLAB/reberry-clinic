// #ISSUE: 모바일 2열 배치 시 홀수 개의 아이템(예: 태반주사)이 남을 경우 마지막 요소 중앙 정렬 처리
// #STYLE: Grid 레이아웃은 셀 단위로 고정되므로, Flex 레이아웃과 calc()를 결합하여 정확히 2열 비율을 맞추면서 마지막 홀수 요소를 중앙(justify-center)으로 배치.
// #LINK: https://tailwindcss.com/docs/width#arbitrary-values

'use client';

export default function IvTagBox({ items }: { items: string[] }) {
    if (!items || items.length === 0) return null;

    return (
        <div className="mx-auto w-full max-w-[1428px] rounded-[10px] bg-sand px-5 py-8 md:px-20 md:py-[57px]">
            {/* Flexbox와 justify-center를 사용하여 마지막 요소 중앙 정렬 */}
            <ul className="flex flex-wrap justify-center gap-3 md:items-stretch md:gap-x-5 md:gap-y-[34px] lg:justify-start">
                {items.map((name) => (
                    <li
                        key={name}
                        /* 모바일: gap-3(12px)을 고려해 w-[calc(50%-6px)] 지정, md 이상: 자연스러운 너비(w-auto)로 전환 */
                        className="flex min-h-[52px] w-[calc(50%-6px)] items-center justify-center break-keep border border-cocoa px-2 py-2 text-center text-[18px] text-cocoa sm:text-[20px] md:w-auto md:min-h-[67px] md:px-[24px] md:text-[30px]"
                    >
                        {name}
                    </li>
                ))}
            </ul>
        </div>
    );
}

/* 검색창 왼쪽 돋보기.
   #ISSUE: 처음엔 ⌕(U+2315) 글자를 넣었는데, 이 글리프가 없는 폰트로 폴백되면
   네모나 엉뚱한 기호로 보였다. → 글자 대신 도형으로 그린다. */
export default function SearchIcon() {
    return (
        <svg
            aria-hidden
            viewBox="0 0 20 20"
            fill="none"
            className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-latte"
        >
            <circle cx="9" cy="9" r="5.75" stroke="currentColor" strokeWidth="1.6" />
            <path d="m13.4 13.4 3.6 3.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
    );
}

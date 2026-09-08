// #COMPONENTS: 슬라이더 공통 로직 — 아이템 총폭을 계산해 "넘치면 슬라이더 / 안 넘치면 중앙 정렬" 판단
// 컬럼 슬라이더 방식(useDragScroll)을 모든 카드 슬라이더가 공유. 화살표 활성 상태(canPrev/canNext)까지 제공
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDragScroll } from './useDragScroll';

export function useOverflowSlider<T extends HTMLElement>(count: number, itemW: number, gap: number, allowWide = false) {
    const { ref, dragProps, dragClass } = useDragScroll<T>();
    // #ISSUE: 카드 폭을 인자로 받은 상수로만 쓰니, 카드가 반응형(모바일 280 / 데스크톱 320)이면
    //         모바일에서 한 칸 이동량과 도트 개수가 데스크톱 기준으로 계산돼 어긋났다.
    //         → 실제 그려진 카드에서 폭과 간격을 재고, 아직 못 잰 첫 순간에만 인자를 쓴다.
    const stepRef = useRef(itemW + gap);
    const [over, setOver] = useState(true); // 첫 페인트는 슬라이더로 시작(잘림 방지) 후 측정
    const [wide, setWide] = useState(false); // 컨테이너보다 넓지만 화면엔 다 들어감 → 화면 폭으로 펼쳐 중앙
    const [canPrev, setCanPrev] = useState(false);
    const [canNext, setCanNext] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(1);

    const sync = useCallback(() => {
        const el = ref.current;
        if (!el) return;
        const host = el.parentElement;
        const first = el.children[0] as HTMLElement | undefined;
        const second = el.children[1] as HTMLElement | undefined;
        // offsetLeft 는 스크롤이 아니라 배치 위치라서, 슬라이더를 넘긴 뒤에 재도 값이 변하지 않는다
        const cardW = first?.offsetWidth || itemW;
        const cardGap = first && second ? Math.max(0, second.offsetLeft - first.offsetLeft - cardW) : gap;
        const need = count * cardW + (count - 1) * cardGap;
        const hostW = host?.clientWidth ?? el.clientWidth;
        const screenW = document.documentElement.clientWidth - 48; // 좌우 여백 최소치
        const fitsHost = need <= hostW + 2;
        const fitsScreen = need <= screenW;
        // allowWide: 컨테이너엔 안 들어가도 화면엔 들어가면 화면 폭으로 펼쳐 전부 노출 (솔루션 5개 @1920)
        // 전후 슬라이더는 노출 창이 스펙(메인 3·시그 4)이라 allowWide=false → 창 안에서 스크롤
        const useWide = allowWide && !fitsHost && fitsScreen;
        setWide(useWide);
        setOver(!fitsHost && !useWide);
        const max = el.scrollWidth - el.clientWidth;
        setCanPrev(el.scrollLeft > 4);
        setCanNext(el.scrollLeft < max - 4);
        const step = cardW + cardGap;
        stepRef.current = step;
        setTotal(Math.max(1, Math.round(max / step) + 1));
        setPage(Math.min(Math.max(1, Math.round(el.scrollLeft / step) + 1), Math.round(max / step) + 1));
    }, [count, itemW, gap, allowWide, ref]);

    useEffect(() => {
        const t = setTimeout(sync, 50);
        window.addEventListener('resize', sync);
        return () => {
            clearTimeout(t);
            window.removeEventListener('resize', sync);
        };
    }, [sync]);

    const move = (dir: -1 | 1) => ref.current?.scrollBy({ left: dir * stepRef.current, behavior: 'smooth' });

    return { ref, dragProps, dragClass, over, wide, canPrev, canNext, page, total, move, onScroll: sync };
}

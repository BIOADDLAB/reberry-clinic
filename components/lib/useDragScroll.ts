'use client';

import { useRef } from 'react';
import type React from 'react';

// scroll-snap 슬라이더에 데스크탑 마우스 드래그를 얹는 훅
// (터치는 브라우저 네이티브 스와이프 그대로 사용)
export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T>(null);
    const state = useRef({ down: false, startX: 0, startLeft: 0, moved: false });

    const onPointerDown = (e: React.PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        const el = ref.current;
        if (!el) return;
        state.current = { down: true, startX: e.clientX, startLeft: el.scrollLeft, moved: false };
    };
    const onPointerMove = (e: React.PointerEvent) => {
        if (!state.current.down) return;
        const el = ref.current;
        if (!el) return;
        const dx = e.clientX - state.current.startX;
        if (Math.abs(dx) > 4) state.current.moved = true;
        el.scrollLeft = state.current.startLeft - dx;
    };
    const end = () => {
        state.current.down = false;
    };
    // 드래그 직후 카드 내부 링크 오클릭 방지
    const onClickCapture = (e: React.MouseEvent) => {
        if (state.current.moved) {
            e.preventDefault();
            e.stopPropagation();
            state.current.moved = false;
        }
    };

    return {
        ref,
        dragProps: { onPointerDown, onPointerMove, onPointerUp: end, onPointerLeave: end, onClickCapture },
        dragClass: 'cursor-grab active:cursor-grabbing select-none',
    };
}

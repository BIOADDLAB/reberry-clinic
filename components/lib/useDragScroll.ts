'use client';

import { useRef, useState } from 'react';
import type React from 'react';

/* scroll-snap 슬라이더에 데스크탑 마우스 드래그를 얹는 훅 (터치는 브라우저 네이티브 스와이프 그대로)
   #ISSUE: PC 에서 창만 줄이면(개발자도구 기기 지정 없이) 전후사진 슬라이더를 마우스로 끌어도 안 넘어갔다.
           ① 사진을 잡고 끌면 브라우저 기본 "이미지 끌어다 놓기"가 먼저 시작돼 pointercancel 로 드래그가 끊겼고
           ② scroll-snap · scroll-smooth 가 드래그 중 바꾼 scrollLeft 를 제자리로 되돌리거나 한 박자 늦게 따라왔고
           ③ 카드 밖으로 커서가 벗어나면(pointerleave) 드래그가 그 자리에서 끝났다.
           → 이미지 기본 드래그를 막고, 끄는 동안만 스냅·부드러운 스크롤을 끄고, 포인터를 붙잡아(capture) 끝까지 따라간다.
             놓으면 가까운 카드(빠르게 튕기면 다음 카드)로 부드럽게 붙인 뒤 스냅을 되돌린다.
   끌고 난 직후 따라오는 클릭 한 번(카드 크게 보기·링크 이동)은 무시한다. */

/** 이만큼(px) 움직여야 드래그로 본다. 그 전에 떼면 그냥 클릭 */
const DRAG_THRESHOLD = 6;

export function useDragScroll<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T>(null);
    const state = useRef({ id: -1, startX: 0, startLeft: 0, lastX: 0, lastT: 0, v: 0, moved: false });
    const suppressClick = useRef(false);
    const [dragging, setDragging] = useState(false);

    const onPointerDown = (e: React.PointerEvent) => {
        suppressClick.current = false;
        if (e.pointerType !== 'mouse' || e.button !== 0) return;
        const el = ref.current;
        if (!el || el.scrollWidth - el.clientWidth < 2) return; // 넘길 게 없으면 클릭만
        state.current = {
            id: e.pointerId,
            startX: e.clientX,
            startLeft: el.scrollLeft,
            lastX: e.clientX,
            lastT: e.timeStamp,
            v: 0,
            moved: false,
        };
    };

    const onPointerMove = (e: React.PointerEvent) => {
        const s = state.current;
        if (s.id !== e.pointerId) return;
        const el = ref.current;
        // 버튼을 뗀 채로 들어온 움직임(창 밖에서 뗀 경우 등)은 드래그가 아니다
        if (!el || (e.buttons & 1) === 0) {
            s.id = -1;
            return;
        }
        const dx = e.clientX - s.startX;
        if (!s.moved) {
            if (Math.abs(dx) < DRAG_THRESHOLD) return;
            s.moved = true;
            try {
                el.setPointerCapture(e.pointerId); // 카드 밖·창 밖으로 끌고 나가도 계속 따라오게
            } catch {
                /* 이미 끝난 포인터면 무시 */
            }
            el.style.scrollSnapType = 'none';
            el.style.scrollBehavior = 'auto';
            setDragging(true);
        }
        el.scrollLeft = s.startLeft - dx;
        const dt = e.timeStamp - s.lastT;
        if (dt > 0) {
            s.v = 0.7 * ((e.clientX - s.lastX) / dt) + 0.3 * s.v;
            s.lastX = e.clientX;
            s.lastT = e.timeStamp;
        }
    };

    const end = (e: React.PointerEvent) => {
        const s = state.current;
        if (s.id !== e.pointerId) return;
        s.id = -1;
        if (!s.moved) return;
        const el = ref.current;
        if (!el) return;
        if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        // 손을 뗄 때 따라오는 클릭 한 번만 막는다 (클릭이 안 따라오는 경우를 대비해 곧바로 풀어 둔다)
        suppressClick.current = true;
        setTimeout(() => (suppressClick.current = false), 60);
        setDragging(false);
        // 멈춘 채로 잠깐 있다가 놓았으면 튕긴 게 아니다
        const velocity = e.timeStamp - s.lastT > 120 ? 0 : s.v;
        settleToCard(el, s.startLeft, velocity, () => state.current.id === -1);
    };

    const onClickCapture = (e: React.MouseEvent) => {
        if (!suppressClick.current) return;
        suppressClick.current = false;
        e.preventDefault();
        e.stopPropagation();
    };

    return {
        ref,
        dragProps: {
            onPointerDown,
            onPointerMove,
            onPointerUp: end,
            onPointerCancel: end,
            onClickCapture,
            onDragStart: (e: React.DragEvent) => e.preventDefault(),
        },
        dragClass: dragging ? 'cursor-grabbing select-none [&_*]:cursor-grabbing' : 'cursor-grab select-none',
        dragging,
    };
}

/* 손을 놓은 자리에서 가장 가까운 카드로 붙인다 (카드의 snap-start 기준).
   빠르게 튕겼으면 그 방향으로 한 장, 천천히 40px 넘게 끌었으면 적어도 한 장은 넘긴다. */
function settleToCard(el: HTMLElement, startLeft: number, velocity: number, canRestore: () => boolean) {
    const restore = () => {
        if (!canRestore()) return;
        el.style.scrollSnapType = '';
        el.style.scrollBehavior = '';
    };

    const points = snapPoints(el);
    if (points.length === 0) {
        restore();
        return;
    }

    const nearestIndex = (x: number) =>
        points.reduce((best, p, i) => (Math.abs(p - x) < Math.abs(points[best] - x) ? i : best), 0);

    const moved = el.scrollLeft - startLeft;
    // 마우스가 오른쪽(+)으로 빠르게 움직였으면 앞쪽 카드로 — 스크롤은 반대 방향
    let index = nearestIndex(el.scrollLeft - velocity * 220);
    const startIndex = nearestIndex(startLeft);
    if (index === startIndex && Math.abs(moved) > 40) {
        index = Math.min(points.length - 1, Math.max(0, startIndex + Math.sign(moved)));
    }

    el.scrollTo({ left: points[index], behavior: 'smooth' });
    // 부드러운 이동이 끝난 뒤 스냅을 되돌린다 (scrollend 미지원 브라우저는 시간으로)
    el.addEventListener('scrollend', restore, { once: true });
    setTimeout(restore, 800);
}

/** 카드들이 멈출 수 있는 scrollLeft 값들. 카드가 스크롤 상자 바로 아래에 있든, 한 겹 더 안에 있든 찾는다 */
function snapPoints(el: HTMLElement): number[] {
    const hasSnap = (node: Element) =>
        getComputedStyle(node)
            .scrollSnapAlign.split(' ')
            .some((v) => v !== 'none');
    const direct = Array.from(el.children);
    let cards = direct.filter(hasSnap);
    if (cards.length === 0) cards = direct.flatMap((child) => Array.from(child.children)).filter(hasSnap);
    if (cards.length === 0) return [];

    const max = el.scrollWidth - el.clientWidth;
    const padLeft = parseFloat(getComputedStyle(el).scrollPaddingLeft) || 0;
    const originX = el.getBoundingClientRect().left + el.clientLeft - el.scrollLeft;
    return [
        ...new Set(
            cards.map((card) =>
                Math.round(Math.min(max, Math.max(0, card.getBoundingClientRect().left - originX - padLeft))),
            ),
        ),
    ].sort((a, b) => a - b);
}

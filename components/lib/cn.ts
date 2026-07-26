// className 병합 유틸 — 컴포넌트 깨짐 방지 원칙: 모든 컴포넌트는 className을 받는다
export function cn(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

import type { Variants } from 'framer-motion';

// 전 사이트 공통 모션 — 피부과 무드: 길고 느리게, 잔잔하게
export const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp: Variants = {
    hidden: { opacity: 0, y: 36 },
    show: { opacity: 1, y: 0, transition: { duration: 1.2, ease: EASE } },
};

export const fade: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { duration: 1.4, ease: EASE } },
};

// 이미지 리빌: 살짝 확대된 상태에서 천천히 안착
export const zoom: Variants = {
    hidden: { opacity: 0, scale: 1.06 },
    show: { opacity: 1, scale: 1, transition: { duration: 1.6, ease: EASE } },
};

export const stagger: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18 } },
};

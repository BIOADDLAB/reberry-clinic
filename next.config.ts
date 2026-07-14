import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    images: {
        /* ★ 지글지글(입자) 해결 핵심:
           Next 16은 여기 등록된 quality 값만 허용하고, 미등록 값은 전부 75로 강제(클램프)함.
           → 코드의 quality={85~90}이 실제로는 75 AVIF로 나가서 피부/텍스처가 자글자글했던 것 */
        qualities: [75, 80, 82, 85, 88, 90, 100],
        formats: ['image/avif', 'image/webp'],
        /* 큰 화면에서 한 단계 큰 원본을 내려주도록 상한 확장 (업스케일 방지) */
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
    },
};

export default nextConfig;

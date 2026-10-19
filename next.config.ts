import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';
import { SIGNATURE_LEGACY_REDIRECTS } from './components/lib/signaturePages';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
    /* sharp 는 OS별 바이너리를 들고 있는 네이티브 모듈이다. 번들에 밀어 넣으면 배포판에서
       바이너리를 못 찾고 죽는다 (블로그 썸네일 압축이 여기서 끊겼다). 통째로 밖에 두고 부른다. */
    serverExternalPackages: ['sharp'],
    /* 빌드 추적은 sharp 의 .node 애드온까지만 따라가고, 그 애드온이 링크하는 libvips 공유 라이브러리
       (@img/sharp-libvips-<OS>/lib/libvips-cpp.*)는 놓친다. 이게 함수에 없으면 sharp 를 부르는 순간 죽고
       썸네일 단계가 통째로 건너뛰어진다. sharp 를 실제로 부르는 두 곳(매일 수집 · 관리자 [블로그에서 가져오기])에 직접 싣는다.
       키는 라우트 그룹이 붙은 원래 경로(app/admin/(protected)/skin-columns/page)와 비교되므로 관리자 쪽은 ** 로 그룹을 건너뛴다. */
    outputFileTracingIncludes: {
        '/api/cron/sync-blog-columns': ['./node_modules/@img/sharp-libvips-*/lib/**/*'],
        '/admin/**/skin-columns': ['./node_modules/@img/sharp-libvips-*/lib/**/*'],
    },
    async redirects() {
        return SIGNATURE_LEGACY_REDIRECTS.flatMap(({ from, to }) => [
            { source: `/treatments/signature/${from}`, destination: `/treatments/signature/${to}`, permanent: true },
            {
                source: `/treatments/signature/${from}/:path*`,
                destination: `/treatments/signature/${to}/:path*`,
                permanent: true,
            },
        ]);
    },
    images: {
        /* ★ 지글지글(입자) 해결 핵심:
           Next 16은 여기 등록된 quality 값만 허용하고, 미등록 값은 전부 75로 강제(클램프)함.
           → 코드의 quality={85~90}이 실제로는 75 AVIF로 나가서 피부/텍스처가 자글자글했던 것 */
        qualities: [75, 80, 82, 85, 88, 90, 100],
        formats: ['image/avif', 'image/webp'],
        /* 큰 화면에서 한 단계 큰 원본을 내려주도록 상한 확장 (업스케일 방지) */
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 2560],
        /* Firebase Storage 업로드 이미지(관리자 등록 전후사진 등)를 next/image 로 쓰기 위해 허용 */
        remotePatterns: [
            { protocol: 'https', hostname: 'firebasestorage.googleapis.com' },
            { protocol: 'https', hostname: 'reberryclinic-a8dcd.firebasestorage.app' },
            { protocol: 'https', hostname: 'i.ytimg.com' },
            { protocol: 'https', hostname: 'blogthumb.pstatic.net' },
        ],
    },
};

export default withNextIntl(nextConfig);

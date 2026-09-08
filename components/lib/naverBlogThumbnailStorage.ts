/* #ISSUE: 여기에 'server-only' 를 달아 두면 Next 밖(스크립트)에서 못 불러온다.
   server-only 는 Next 가 번들할 때만 있는 것이라 tsx 로 돌리면 모듈을 못 찾고 죽는다.
   → 뺀다. 이 파일을 쓰는 skinColumnBlogSync 가 이미 'server-only' 를 달고 있고,
     sharp(네이티브 모듈)를 들고 있어서 클라이언트로 딸려 들어가면 어차피 빌드가 깨진다. */

import sharp from 'sharp';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

const MAX_SOURCE_BYTES = 15 * 1024 * 1024;
const THUMBNAIL_WIDTH = 1200;
const THUMBNAIL_HEIGHT = 675;

const isHttpUrl = (value: string) => {
    try {
        const url = new URL(value);
        return url.protocol === 'https:' || url.protocol === 'http:';
    } catch {
        return false;
    }
};

export async function storeNaverBlogThumbnail(logNo: string, sourceUrl: string): Promise<string | null> {
    if (!/^\d+$/.test(logNo) || !isHttpUrl(sourceUrl)) return null;

    try {
        const response = await fetch(sourceUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0',
                Referer: 'https://blog.naver.com/',
            },
            cache: 'no-store',
            signal: AbortSignal.timeout(15_000),
        });
        if (!response.ok || !response.headers.get('content-type')?.startsWith('image/')) return null;

        const declaredSize = Number(response.headers.get('content-length') ?? 0);
        if (declaredSize > MAX_SOURCE_BYTES) return null;

        const source = Buffer.from(await response.arrayBuffer());
        if (source.length === 0 || source.length > MAX_SOURCE_BYTES) return null;

        const thumbnail = await sharp(source, { limitInputPixels: 40_000_000 })
            .rotate()
            .resize(THUMBNAIL_WIDTH, THUMBNAIL_HEIGHT, {
                fit: 'cover',
                position: 'attention',
                withoutEnlargement: true,
            })
            .webp({ quality: 78, effort: 4 })
            .toBuffer();

        const storageRef = ref(storage, `skin-columns/naver/${logNo}.webp`);
        await uploadBytes(storageRef, thumbnail, {
            contentType: 'image/webp',
            cacheControl: 'public,max-age=31536000,immutable',
        });
        return getDownloadURL(storageRef);
    } catch (error) {
        console.error(`[naver-blog] thumbnail storage failed: ${logNo}`, error);
        return null;
    }
}

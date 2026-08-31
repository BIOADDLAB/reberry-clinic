import 'server-only';

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

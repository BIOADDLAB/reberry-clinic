// #LINK: /scripts/optimize-hero-images.mjs
// #ISSUE: 히어로(화면 전체를 채우는 배경) 이미지는 optimize-images.mjs 의 일괄 설정(품질 78%, 최대 2000px)이
//         너무 낮아서 확대되어 보일 때 화질이 눈에 띄게 떨어짐.
//         → 이 파일들만 원본(public/images_original)에서 다시 가져와, 더 높은 품질로 재압축.
//
// 쓰는 법: node scripts/optimize-hero-images.mjs
// 전제: public/images_original 폴더에 압축 전 원본이 남아있어야 함 (없으면 에러 남)

import { stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'public/images';
const BACKUP = 'public/images_original';
const MAX_WIDTH = 2560; // 큰 모니터 풀블리드까지 고려해 넉넉하게
const QUALITY = 92; // 일반 이미지(78)보다 훨씬 높게 — 눈으로 봐서 거의 원본과 구분 안 되는 수준

// 화면 전체를 채우는 히어로/서브히어로 배경만 골라서 다시 처리
const HERO_FILES = [
    'bg-main-hiro.jpg',
    'bg-sub-01.jpg',
    'bg-sub-02.jpg',
    'bg-sub-03.jpg',
    'bg-sub-04.jpg',
    'bg-sub-05.jpg',
    'bg-sub-06.jpg',
    'bg-sub-07.jpg',
];

const run = async () => {
    if (!existsSync(BACKUP)) {
        console.error(`백업 폴더(${BACKUP})가 없습니다. 원본이 없으면 이 스크립트는 의미가 없습니다.`);
        process.exit(1);
    }

    for (const file of HERO_FILES) {
        const original = path.join(BACKUP, file);
        const dest = path.join(SRC, file);

        if (!existsSync(original)) {
            console.log(`${file}: 백업에 원본이 없어 건너뜀`);
            continue;
        }

        const { size: beforeSize } = await stat(dest).catch(() => ({ size: 0 }));

        const image = sharp(original);
        const meta = await image.metadata();
        const pipeline = meta.width && meta.width > MAX_WIDTH ? image.resize({ width: MAX_WIDTH }) : image;

        await pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toFile(dest);

        const { size: afterSize } = await stat(dest);
        console.log(
            `${file}: ${(beforeSize / 1e6).toFixed(1)}MB(구) → ${(afterSize / 1e6).toFixed(1)}MB(신, 품질 ${QUALITY}%)`,
        );
    }
};

run().catch((e) => {
    console.error(e);
    process.exit(1);
});

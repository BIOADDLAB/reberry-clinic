// #ISSUE: public/images 안의 사진이 한 장에 2MB씩이라 사이트가 느림 (총 123MB, 1MB 넘는 파일만 47장)
//         이 스크립트를 한 번 돌리면 화질 차이는 거의 없이 용량만 크게 줄어듦.
//
// 쓰는 법:
//   1) npm i -D sharp
//   2) node scripts/optimize-images.mjs
//   ※ 원본은 public/images_original 폴더에 자동 백업되므로 안전함
//
// 무엇을 하는지:
//   · 가로 2000px 넘는 사진은 2000px 로 줄임 (화면에서 그보다 크게 쓸 일이 없음)
//   · jpg 품질 78 로 다시 저장 (눈으로는 거의 구분 안 되는 수준)

import { readdir, mkdir, copyFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = 'public/images';
const BACKUP = 'public/images_original';
const MAX_WIDTH = 2000;
const QUALITY = 78;

const run = async () => {
    if (!existsSync(BACKUP)) await mkdir(BACKUP, { recursive: true });

    const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f));
    let before = 0;
    let after = 0;

    for (const file of files) {
        const src = path.join(SRC, file);
        const backup = path.join(BACKUP, file);

        const { size: originalSize } = await stat(src);
        before += originalSize;

        // 원본 백업 (이미 백업돼 있으면 건너뜀 = 두 번 돌려도 안전)
        if (!existsSync(backup)) await copyFile(src, backup);

        const image = sharp(backup);
        const meta = await image.metadata();
        const pipeline = meta.width && meta.width > MAX_WIDTH ? image.resize({ width: MAX_WIDTH }) : image;

        const buffer = await (/\.png$/i.test(file)
            ? pipeline.png({ quality: QUALITY, compressionLevel: 9 }).toBuffer()
            : pipeline.jpeg({ quality: QUALITY, mozjpeg: true }).toBuffer());

        await sharp(buffer).toFile(src);
        const { size: newSize } = await stat(src);
        after += newSize;

        const pct = Math.round((1 - newSize / originalSize) * 100);
        console.log(`${file}: ${(originalSize / 1e6).toFixed(1)}MB → ${(newSize / 1e6).toFixed(1)}MB (${pct}% 감소)`);
    }

    console.log(`\n총합: ${(before / 1e6).toFixed(0)}MB → ${(after / 1e6).toFixed(0)}MB`);
    console.log('원본은 public/images_original 에 백업돼 있습니다. 결과가 마음에 들면 그 폴더는 지워도 됩니다.');
};

run().catch((e) => {
    console.error(e);
    process.exit(1);
});

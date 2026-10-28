import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collection, getDocs, terminate, writeBatch, doc } from 'firebase/firestore';
import { db } from '../components/lib/firebase';
import { resolveBACategory } from '../components/lib/ba';
import { upsertDefaultBACategories } from '../components/lib/baCategories';

const PHOTOS = 'baPhotos';
const seedPath = resolve(process.cwd(), 'data/reviews-ba.seed.json');

async function rewriteSeedJson() {
    const payload = JSON.parse(await readFile(seedPath, 'utf8')) as {
        version: string;
        items: Array<{ category: string; slug?: string; slugs?: string[]; label: string }>;
    };
    let changed = 0;
    payload.items.forEach((item) => {
        const next = resolveBACategory(item) ?? item.category;
        if (next !== item.category) {
            item.category = next;
            changed += 1;
        }
    });
    await writeFile(seedPath, `${JSON.stringify(payload, null, 2)}\n`);
    return { total: payload.items.length, changed };
}

async function main() {
    await upsertDefaultBACategories();

    const photos = await getDocs(collection(db, PHOTOS));
    const counts = new Map<string, number>();
    let remapped = 0;

    for (let offset = 0; offset < photos.docs.length; offset += 400) {
        const batch = writeBatch(db);
        let writes = 0;
        photos.docs.slice(offset, offset + 400).forEach((entry) => {
            const data = entry.data();
            const next = resolveBACategory(data);
            const current = typeof data.category === 'string' ? data.category : '';
            if (next) counts.set(next, (counts.get(next) ?? 0) + 1);
            if (!next || next === current) return;
            batch.update(doc(db, PHOTOS, entry.id), { category: next });
            remapped += 1;
            writes += 1;
        });
        if (writes > 0) await batch.commit();
    }

    const json = await rewriteSeedJson();
    const categories = await getDocs(collection(db, 'baCategories'));

    console.log(
        JSON.stringify(
            {
                categories: categories.docs.map((entry) => ({
                    key: entry.id,
                    label: entry.data().label,
                    sort: entry.data().sort,
                })),
                remappedPhotos: remapped,
                photoCounts: Object.fromEntries([...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))),
                seedJson: json,
            },
            null,
            2,
        ),
    );
    await terminate(db);
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

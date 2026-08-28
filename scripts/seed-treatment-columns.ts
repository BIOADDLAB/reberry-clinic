import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { collection, doc, getDocs, terminate, writeBatch } from 'firebase/firestore';
import { db } from '../components/lib/firebase';
import { COUNT_LIMITS, TREATMENT_PAGES } from '../components/lib/adminConfig';
import { solutions } from '../components/lib/solutions';

interface ColumnSeedItem {
    docId: string;
    title: string;
    en: string;
    text: string;
    link: string;
    slugs: string[];
    order: number;
}

interface ColumnSeedPayload {
    version: string;
    items: ColumnSeedItem[];
}

const COLLECTION = 'columns';
const seedPath = resolve(process.cwd(), 'data/treatment-columns.seed.json');

function validate(payload: ColumnSeedPayload) {
    const allowedSlugs = new Set<string>([
        ...TREATMENT_PAGES.map((page) => page.slug),
        ...solutions.map((solution) => solution.slug),
    ]);
    const documentIds = new Set<string>();
    const orderKeys = new Set<string>();
    const perPage = new Map<string, number>();

    for (const item of payload.items) {
        if (!item.docId || documentIds.has(item.docId)) throw new Error(`Duplicate docId: ${item.docId}`);
        documentIds.add(item.docId);

        if (!item.title.trim() || !item.text.trim()) throw new Error(`Missing card text: ${item.docId}`);
        if (!/^https:\/\/blog\.naver\.com\/drpyton\/.+/.test(item.link)) {
            throw new Error(`Invalid blog URL: ${item.docId}`);
        }
        if (!Number.isInteger(item.order) || item.order < 1) throw new Error(`Invalid order: ${item.docId}`);
        if (item.slugs.length === 0 || item.slugs.some((slug) => !allowedSlugs.has(slug))) {
            throw new Error(`Unknown treatment page: ${item.docId}`);
        }

        for (const slug of item.slugs) {
            const orderKey = `${slug}--${item.order}`;
            if (orderKeys.has(orderKey)) throw new Error(`Duplicate order: ${orderKey}`);
            orderKeys.add(orderKey);
            perPage.set(slug, (perPage.get(slug) ?? 0) + 1);
        }
    }

    const overLimit = [...perPage].find(([, count]) => count > COUNT_LIMITS.columnPerPage);
    if (overLimit) throw new Error(`${overLimit[0]} has ${overLimit[1]} columns (max ${COUNT_LIMITS.columnPerPage})`);
}

async function main() {
    const payload = JSON.parse(await readFile(seedPath, 'utf8')) as ColumnSeedPayload;
    validate(payload);
    if (process.argv.includes('--check')) {
        console.log(`validated ${payload.items.length} treatment columns (${payload.version})`);
        return;
    }

    const existing = await getDocs(collection(db, COLLECTION));
    const targetIds = new Set(payload.items.map((item) => item.docId));

    // 이 스크립트가 예전에 올린 데이터만 정리한다. 관리자가 직접 만든 문서는 삭제하지 않는다.
    const staleSeedDocs = existing.docs.filter(
        (entry) =>
            String(entry.data().seedVersion ?? '').startsWith('blog-seed-') && !targetIds.has(entry.id),
    );
    for (let offset = 0; offset < staleSeedDocs.length; offset += 450) {
        const batch = writeBatch(db);
        staleSeedDocs.slice(offset, offset + 450).forEach((entry) => batch.delete(entry.ref));
        await batch.commit();
    }

    const now = new Date().toISOString();
    for (let offset = 0; offset < payload.items.length; offset += 450) {
        const batch = writeBatch(db);
        payload.items.slice(offset, offset + 450).forEach((item) => {
            batch.set(doc(db, COLLECTION, item.docId), {
                title: item.title.trim(),
                en: item.en.trim(),
                text: item.text.trim(),
                link: item.link,
                slugs: item.slugs,
                order: item.order,
                seedVersion: payload.version,
                updatedAt: now,
            });
        });
        await batch.commit();
    }

    const result = await getDocs(collection(db, COLLECTION));
    const uploaded = result.docs.filter((entry) => entry.data().seedVersion === payload.version);
    const uploadedIds = new Set(uploaded.map((entry) => entry.id));
    const missing = payload.items.find((item) => !uploadedIds.has(item.docId));
    if (uploaded.length !== payload.items.length || missing) {
        throw new Error(`Read-back mismatch: ${uploaded.length}/${payload.items.length}, missing=${missing?.docId ?? 'none'}`);
    }

    console.log(
        JSON.stringify(
            {
                uploaded: uploaded.length,
                firestoreTotal: result.size,
                removedStaleSeedDocs: staleSeedDocs.length,
                version: payload.version,
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

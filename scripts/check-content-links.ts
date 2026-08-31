import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
    AGING_LIFTING_PAGES,
    COUNT_LIMITS,
    SIGNATURE_PAGES,
    SKIN_TREATMENT_PAGES,
    TREATMENT_PAGES,
    agingLiftingPageSlug,
    skinTreatmentPageSlug,
} from '../components/lib/adminConfig';
import { resolveBASlugs, showsOnReviews, showsOnTreatment } from '../components/lib/ba';
import { solutions } from '../components/lib/solutions';
import { treatments } from '../components/lib/treatments';

interface BlogSeed {
    version: string;
    items: Array<{
        docId: string;
        title: string;
        text: string;
        link: string;
        slugs: string[];
        order: number;
    }>;
}

interface PriceSeed {
    version: string;
    categories: Array<{ docId: string }>;
    sections: Array<{ docId: string; categoryId: string }>;
    items: Array<{
        docId: string;
        categoryId: string;
        sectionId: string;
        sessions: Array<{ id: string; label: string; price: number }>;
    }>;
}

const readJson = async <T>(file: string) =>
    JSON.parse(await readFile(resolve(process.cwd(), file), 'utf8')) as T;

const assertUnique = (values: string[], label: string) => {
    assert.equal(new Set(values).size, values.length, `${label} 중복값이 있습니다.`);
};

async function main() {
    const [blog, price] = await Promise.all([
        readJson<BlogSeed>('data/treatment-columns.seed.json'),
        readJson<PriceSeed>('data/price-list.seed.json'),
    ]);

    // 관리자에서 선택 가능한 현재 페이지 구조
    assert.equal(SIGNATURE_PAGES.length, 3);
    assert.equal(SKIN_TREATMENT_PAGES.length, 8);
    assert.equal(AGING_LIFTING_PAGES.length, 5);
    assert.equal(TREATMENT_PAGES.length, 16);
    assertUnique(TREATMENT_PAGES.map((page) => page.slug), '관리자 시술 페이지 키');

    assert.deepEqual(
        SIGNATURE_PAGES.map((page) => page.label),
        ['리베리 볼륨 부스터', '비수술 앞턱전진 필러', '비수술 눈밑 지방 재배치'],
    );
    assert.equal(SKIN_TREATMENT_PAGES.find((page) => page.routeSlug === 'redness')?.label, '홍조/주사피부염');
    SKIN_TREATMENT_PAGES.forEach((page) => assert.equal(skinTreatmentPageSlug(page.routeSlug), page.slug));
    AGING_LIFTING_PAGES.forEach((page) => assert.equal(agingLiftingPageSlug(page.itemSlug), page.slug));

    // 공개 시술·상세 주소 조합
    assert.equal(treatments.length, 17);
    assertUnique(treatments.map((treatment) => `${treatment.category}/${treatment.slug}`), '공개 시술 주소');
    const solutionSlugs = new Set(solutions.map((solution) => solution.slug));
    treatments.forEach((treatment) => {
        treatment.items.forEach((item) => {
            assert(solutionSlugs.has(item), `없는 기기·제품 연결: ${treatment.category}/${treatment.slug}/${item}`);
        });
    });

    // 블로그 연결: 모든 대상이 실제 페이지이고 각 페이지의 순서가 겹치지 않아야 한다.
    const allowedColumnTargets = new Set([...TREATMENT_PAGES.map((page) => page.slug), ...solutionSlugs]);
    const blogOrderKeys: string[] = [];
    const blogCountByTarget = new Map<string, number>();
    assertUnique(blog.items.map((item) => item.docId), '블로그 문서 ID');
    blog.items.forEach((item) => {
        assert(item.title.trim() && item.text.trim(), `블로그 문구 누락: ${item.docId}`);
        assert(/^https?:\/\//.test(item.link), `블로그 URL 형식 오류: ${item.docId}`);
        assert(item.slugs.length > 0, `블로그 노출 대상 누락: ${item.docId}`);
        assertUnique(item.slugs, `블로그 ${item.docId} 대상`);
        item.slugs.forEach((slug) => {
            assert(allowedColumnTargets.has(slug), `없는 블로그 노출 대상: ${item.docId}/${slug}`);
            blogOrderKeys.push(`${slug}/${item.order}`);
            blogCountByTarget.set(slug, (blogCountByTarget.get(slug) ?? 0) + 1);
        });
    });
    assertUnique(blogOrderKeys, '페이지별 블로그 순서');
    blogCountByTarget.forEach((count, slug) => {
        assert(count <= COUNT_LIMITS.columnPerPage, `${slug} 블로그 ${count}개: 최대 개수 초과`);
    });

    // 전후사진 한 건을 여러 시술 페이지와 전후사진 탭에서 함께 쓰는 규칙
    const sharedPhoto = {
        slug: 'booster',
        slugs: ['booster', 'skin-skinbooster', 'booster'],
        place: 'both',
    };
    assert.deepEqual(resolveBASlugs(sharedPhoto), ['booster', 'skin-skinbooster']);
    assert(showsOnTreatment(sharedPhoto));
    assert(showsOnReviews(sharedPhoto));

    // 수가표 구조와 모든 참조·옵션을 함께 검사한다.
    assert.equal(price.categories.length, 9);
    assert.equal(price.sections.length, 29);
    assert.equal(price.items.length, 240);
    assert.equal(price.items.reduce((sum, item) => sum + item.sessions.length, 0), 363);
    assertUnique(price.categories.map((category) => category.docId), '수가표 대분류 ID');
    assertUnique(price.sections.map((section) => section.docId), '수가표 소분류 ID');
    assertUnique(price.items.map((item) => item.docId), '수가표 시술 ID');
    const categoryIds = new Set(price.categories.map((category) => category.docId));
    const sectionById = new Map(price.sections.map((section) => [section.docId, section]));
    price.sections.forEach((section) => assert(categoryIds.has(section.categoryId), `없는 대분류: ${section.docId}`));
    price.items.forEach((item) => {
        const section = sectionById.get(item.sectionId);
        assert(section, `없는 소분류: ${item.docId}/${item.sectionId}`);
        assert.equal(section.categoryId, item.categoryId, `수가표 대·소분류 불일치: ${item.docId}`);
        assert(item.sessions.length > 0, `가격 옵션 없음: ${item.docId}`);
        assertUnique(item.sessions.map((session) => session.id), `${item.docId} 가격 옵션 ID`);
        assertUnique(item.sessions.map((session) => session.label.trim()), `${item.docId} 가격 옵션명`);
        item.sessions.forEach((session) => assert(session.price > 0, `가격 오류: ${item.docId}/${session.id}`));
    });

    console.log(
        JSON.stringify(
            {
                status: 'ok',
                adminTreatmentPages: TREATMENT_PAGES.length,
                publicTreatments: treatments.length,
                treatmentItemRoutes: treatments.reduce((sum, treatment) => sum + treatment.items.length, 0),
                blogCards: blog.items.length,
                blogTargets: blogCountByTarget.size,
                priceCategories: price.categories.length,
                priceSections: price.sections.length,
                priceItems: price.items.length,
                priceOptions: price.items.reduce((sum, item) => sum + item.sessions.length, 0),
            },
            null,
            2,
        ),
    );
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

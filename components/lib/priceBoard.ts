/* 수가표 화면 조립기 — 고객 페이지(PriceListClient)와 관리자(PriceListManager)가 같이 쓴다.
   #ISSUE: 예전에는 화면 쪽에서 이름을 정규식으로 자르고 카테고리를 코드에 하드코딩해서,
           관리자에서 고친 내용과 실제 노출이 어긋났다.
   → 조립 규칙을 여기 한 곳에만 두고 양쪽이 같은 함수를 쓰게 한다.
        대분류(category) → 카드(section) → 행(item × session)
     순서는 전부 Firestore 의 sort 값을 그대로 따른다. */

import type { PriceCategory, PriceListItem, PriceSection } from './priceList';

export interface PriceBoardRow {
    id: string;
    label: string;
    price: number;
    itemId: string;
    sessionId: string;
    /** 회차 라벨만 따로 (관리자 인라인 편집에서 사용) */
    sessionLabel: string;
}

export interface PriceBoardCard {
    key: string;
    title: string;
    /** 카드 아래 회색 안내 문구. 카드 첫 항목의 설명을 쓴다 (예: 보톡스 가능 부위) */
    note: string;
    section: PriceSection;
    items: PriceListItem[];
    rows: PriceBoardRow[];
}

export interface PriceBoardGroup {
    category: PriceCategory;
    cards: PriceBoardCard[];
}

const compact = (value: string) => value.replace(/\s+/g, ' ').trim();

/* 행에 보여 줄 문구.
   #ISSUE: 예전에는 시술명 뒤에 회차를 무조건 붙여서 "베리슬림 1회 · 3회" 같은 줄이 나왔다.
   → 회차가 하나뿐인 항목(대부분)은 엑셀에 적힌 시술명을 **그대로** 쓴다.
     한 항목에 회차가 둘 이상일 때만 뒤에 회차를 붙인다. */
export function priceRowLabel(
    item: Pick<PriceListItem, 'name' | 'productLabel' | 'sessions'>,
    sessionLabel: string,
): string {
    const name = compact(item.name);
    const product = compact(item.productLabel);
    const session = compact(sessionLabel);

    const parts = [name];
    if (item.sessions.length > 1 && session && !name.endsWith(session)) parts.push(session);
    if (product) parts.push(product);
    return parts.filter(Boolean).join(' · ');
}

export function buildPriceBoard(
    categories: PriceCategory[],
    sections: PriceSection[],
    items: PriceListItem[],
): PriceBoardGroup[] {
    const itemsBySection = new Map<string, PriceListItem[]>();
    for (const item of items) {
        itemsBySection.set(item.sectionId, [...(itemsBySection.get(item.sectionId) ?? []), item]);
    }

    const sectionsByCategory = new Map<string, PriceSection[]>();
    for (const section of sections) {
        sectionsByCategory.set(section.categoryId, [...(sectionsByCategory.get(section.categoryId) ?? []), section]);
    }

    return categories.map((category) => {
        const cards = (sectionsByCategory.get(category.docId) ?? [])
            .slice()
            .sort((a, b) => a.sort - b.sort)
            .map((section) => {
                const sectionItems = (itemsBySection.get(section.docId) ?? [])
                    .slice()
                    .sort((a, b) => a.sort - b.sort);

                const rows: PriceBoardRow[] = [];
                for (const item of sectionItems) {
                    for (const session of item.sessions) {
                        rows.push({
                            id: `${item.docId}:${session.id}`,
                            label: priceRowLabel(item, session.label),
                            price: session.price,
                            itemId: item.docId,
                            sessionId: session.id,
                            sessionLabel: session.label,
                        });
                    }
                }

                return {
                    key: section.docId,
                    title: section.label,
                    note: compact(sectionItems.find((item) => item.description)?.description ?? ''),
                    section,
                    items: sectionItems,
                    rows,
                } satisfies PriceBoardCard;
            });

        return { category, cards };
    });
}

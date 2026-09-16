/* 수가표 화면 조립기 — 고객 페이지(PriceListClient)와 관리자(PriceListManager)가 같이 쓴다.
   #ISSUE: 예전에는 화면 쪽에서 이름을 정규식으로 자르고 카테고리를 코드에 하드코딩해서,
           관리자에서 고친 내용과 실제 노출이 어긋났다.
   → 조립 규칙을 여기 한 곳에만 두고 양쪽이 같은 함수를 쓰게 한다.
        대분류(category) → 카드(section) → 행(item × session)
     순서는 전부 Firestore 의 sort 값을 그대로 따른다.

   #ISSUE: 2026.09.16 병원 요청 — "묶을 수 있는 건 다 묶어 달라".
           회차·용량마다 줄을 하나씩 만들다 보니 주름 보톡스가 카드 세 장(1부위·3부위·올인원)으로
           흩어지고, 리쥬란 2cc 는 1회/3회가 두 줄로 갈려서 같은 제품 가격을 나란히 못 봤다.
   → 한 항목의 회차·용량(sessions)을 표의 "열" 로 세운다.
        카드 = 시술          (주름 보톡스)
        줄   = 제품·용량      (하이톡스)
        열   = 부위·용량·회차 (1부위 / 3부위 / 올인원)
     다만 줄마다 회차가 다른 카드(색소·미백처럼 4·8·10·12회가 섞인 곳)를 표로 만들면
     빈칸이 절반을 넘어 오히려 못 읽는다 → 그런 카드는 예전처럼 한 줄에 가격 하나로 둔다. */

import { isConsultPrice, type PriceCategory, type PriceListItem, type PriceSection } from './priceList';

export interface PriceBoardCell {
    sessionId: string;
    /** 열 이름 — 1부위 · 50U · 3회 … */
    label: string;
    price: number;
}

export interface PriceBoardRow {
    id: string;
    itemId: string;
    /** 줄 이름 — 표에서는 제품·용량, 목록에서는 시술명 */
    label: string;
    /** 표(table)면 columns 와 길이가 같고 값 없는 열은 null · 목록(list)이면 길이 1 */
    cells: (PriceBoardCell | null)[];
}

export interface PriceBoardCard {
    key: string;
    title: string;
    /** 카드 아래 회색 안내 문구. 카드 첫 항목의 설명을 쓴다 (예: 보톡스 가능 부위) */
    note: string;
    section: PriceSection;
    items: PriceListItem[];
    /** 'table' = 회차·용량을 열로 세운 표 · 'list' = 한 줄에 가격 하나 */
    layout: 'table' | 'list';
    /** 표 머리글. layout 이 'list' 면 빈 배열 */
    columns: string[];
    rows: PriceBoardRow[];
}

export interface PriceBoardGroup {
    category: PriceCategory;
    cards: PriceBoardCard[];
}

const compact = (value: string) => value.replace(/\s+/g, ' ').trim();

/* 표로 묶는 기준.
   열이 넷을 넘으면 모바일에서 가로로 밀리고, 빈칸이 3분의 1을 넘으면 표가 얼룩덜룩해진다. */
const MAX_TABLE_COLUMNS = 4;
const MIN_TABLE_FILL = 0.65;

/** 홈페이지에 낼 회차·용량만. 0원은 관리자에서 아직 안 채운 칸이라 내지 않고,
    상담 문의(음수)는 금액 대신 문구로 나가야 하니 남긴다. */
const pricedSessions = (item: PriceListItem) =>
    item.sessions.filter((session) => session.price > 0 || isConsultPrice(session.price));

/** 1회 · 3회 · 10회처럼 숫자와 단위가 같은 열끼리는 숫자 순으로 세운다 (엑셀 순서가 뒤섞여 있어서) */
function sortColumns(columns: string[]): string[] {
    const parsed = columns.map((column) => /^(\d+(?:\.\d+)?)\s*(\D*)$/.exec(column));
    if (parsed.some((match) => !match)) return columns;
    const units = new Set(parsed.map((match) => match![2].toLowerCase()));
    if (units.size > 1) return columns;
    return columns.slice().sort((a, b) => Number.parseFloat(a) - Number.parseFloat(b));
}

/* 줄에 보여 줄 문구.
   #ISSUE: 예전에는 시술명 뒤에 회차를 무조건 붙여서 "베리슬림 1회 · 3회" 같은 줄이 나왔다.
   → 회차·용량이 표의 열로 올라갔으니 줄 이름에는 붙이지 않는다.
     표로 못 묶은 카드에서만, 그 카드에 회차가 여러 종류일 때 뒤에 붙여 준다. */
export function priceRowLabel(item: Pick<PriceListItem, 'name' | 'productLabel'>, sessionLabel = ''): string {
    const name = compact(item.name);
    const product = compact(item.productLabel);
    const session = compact(sessionLabel);

    const parts = [name];
    if (session && !name.endsWith(session)) parts.push(session);
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
                /* items 는 관리자가 편집할 원본이라 가격을 아직 안 적은 줄까지 들고 있고,
                   rows·columns 는 홈페이지에 나갈 것만 골라 만든다. */
                const priced = sectionItems.filter((item) => pricedSessions(item).length > 0);

                const columns = sortColumns(
                    priced.reduce<string[]>((seen, item) => {
                        for (const session of pricedSessions(item)) {
                            const label = compact(session.label);
                            if (label && !seen.includes(label)) seen.push(label);
                        }
                        return seen;
                    }, []),
                );

                const filled = priced.reduce((count, item) => count + pricedSessions(item).length, 0);
                const table =
                    columns.length > 1 &&
                    columns.length <= MAX_TABLE_COLUMNS &&
                    filled >= priced.length * columns.length * MIN_TABLE_FILL;

                const rows: PriceBoardRow[] = table
                    ? priced.map((item) => ({
                          id: item.docId,
                          itemId: item.docId,
                          label: priceRowLabel(item),
                          cells: columns.map((column) => {
                              const session = pricedSessions(item).find((entry) => compact(entry.label) === column);
                              return session ? { sessionId: session.id, label: column, price: session.price } : null;
                          }),
                      }))
                    : priced.flatMap((item) =>
                          pricedSessions(item).map((session) => ({
                              id: `${item.docId}:${session.id}`,
                              itemId: item.docId,
                              label: priceRowLabel(item, columns.length > 1 ? session.label : ''),
                              cells: [{ sessionId: session.id, label: compact(session.label), price: session.price }],
                          })),
                      );

                return {
                    key: section.docId,
                    title: section.label,
                    note: compact(sectionItems.find((item) => item.description)?.description ?? ''),
                    section,
                    items: sectionItems,
                    layout: table ? 'table' : 'list',
                    columns: table ? columns : [],
                    rows,
                } satisfies PriceBoardCard;
            });

        return { category, cards };
    });
}

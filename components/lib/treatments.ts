// items 의 슬러그는 equipment.ts(장비) 또는 products.ts(제품) 어느 쪽이든 가능 — lib/solution.ts 가 통합 검색
export type Category = 'signature' | 'skin' | 'aging';

export interface Chip {
    text: string;
    strong?: boolean;
    wrap?: number; // 지정 시 이 px 폭에서 강제 줄바꿈 (모바일 BoxChip 전용). 없으면 text-balance 자동
}

export interface Treatment {
    slug: string;
    category: Category;
    name: string;
    en: string;
    heroEn?: string; // 히어로에만 쓰는 긴 영문명. 없으면 en을 그대로 사용
    heroDescription?: string; // 히어로 한글명 아래 보조 문구
    headline?: { light: string; strong: string }; // 캐치프레이즈
    definition: { title: string; text: string };
    hashtags: Chip[];
    solution: { light: string; strong: string };
    hashtagRows?: [number, number];
    ivItems?: string[]; // 수액주사 전용 — 값이 있으면 솔루션 슬라이더 대신 이름표 박스가 나옴 // 장비 + 제품 혼합 슬러그
    items: string[]; // 장비 + 제품 혼합 슬러그
    visual: number; // 배경/인물 세트 번호
    visualW: number; // 시술 소개 그룹(카드+인물)
    visualH: number; // 시술 소개 그룹 시안 실측 높이
    signature?: {
        story: { hook: [string, string, string]; body: string };
        faq: { q: string; a: string }[];
        // messages/treatments/{locale}.json 의 faq.sharedSignatureExtra / faq.boosterExtra 중 어느 것과 조합되는지
        faqSet: 'shared' | 'booster' | 'underEye';
        hideFaq?: boolean;
        columnHeading: string;
    };
}

export const categoryLabel: Record<Category, string> = {
    signature: '시그니처 시술',
    skin: '피부교정',
    aging: '안티에이징',
};

export const findTreatment = (category: string, slug: string) =>
    treatments.find((t) => t.category === category && t.slug === slug);

const commonFaq = [
    {
        q: '몇 번의 시술이 필요할까요?',
        a: '피부 상태와 병변의 깊이에 따라 다르지만 보통 3~5회 시술 후 뚜렷한 변화를 확인하실 수 있습니다. 첫 진료에서 정밀 진단 후 필요한 횟수를 정확히 안내해 드립니다.',
    },
    {
        q: '통증은 어떤가요?',
        a: '시술 전 연고 마취를 충분히 진행하며, 대부분 따끔한 정도로 견딜 만하다고 말씀하십니다. 통증에 예민하신 경우 출력과 시술 방식을 조절해 드립니다.',
    },
    {
        q: '시술 후 바로 세안이나 화장이 가능한가요?',
        a: '가벼운 세안은 당일부터 가능하며, 색조 화장은 시술 부위 상태에 따라 당일 혹은 다음 날부터 권장드립니다. 시술 직후 관리 방법을 상세히 안내해 드립니다.',
    },
    {
        q: '일상생활에 지장은 없나요?',
        a: '대부분 시술 직후 바로 일상 복귀가 가능합니다. 일시적인 붉은기나 미세한 딱지는 수일 내 자연스럽게 회복됩니다.',
    },
];

// 리프팅/색소/홍조/여드름 4개 시그니처 페이지가 공유하는 FAQ 세트 (이미지1 기준)
const sharedSignatureFaq = [
    {
        q: '시술 후 딱지가 생기나요?',
        a: '병변의 종류에 따라 미세한 딱지가 생길 수 있으며, 보통 5~7일 내 자연스럽게 탈락합니다. 인위적으로 떼어내지만 않으시면 흔적 없이 회복됩니다.',
    },
    ...commonFaq,
    {
        q: '울쎄라와 써마지는 어떻게 다른가요?',
        a: '울쎄라는 초음파로 근막층(SMAS)을 당겨 올리는 리프팅에, 써마지는 고주파로 진피층 콜라겐을 재생시키는 탄력 개선에 강점이 있습니다. 처짐과 탄력 저하의 비율을 진단해 단독 또는 병행을 설계해 드립니다.',
    },
];

// 리베리 볼륨 부스터 전용 FAQ
const boosterFaq = [
    {
        q: '시술 후 얼굴이 부자연스럽지 않나요?',
        a: '한 부위를 과도하게 채우는 방식이 아니라 꺼짐과 처짐의 원인, 얼굴 비율을 확인해 필요한 부위와 용량을 나누어 설계합니다. 시술 직후에는 붓기로 평소와 다르게 보일 수 있어 최종적인 모양은 붓기가 가라앉은 뒤 확인합니다.',
    },
    {
        q: '젊은 층도 볼륨 부스터가 필요한가요?',
        a: '나이만으로 시술 필요 여부를 정하지 않습니다. 선천적인 볼륨 부족, 체중 변화, 탄력 저하 등 현재 얼굴 상태와 원하는 개선 정도를 진찰한 뒤 적합 여부를 판단합니다.',
    },
    {
        q: '리프팅과 볼륨부스터, 무엇을 먼저 해야 하나요?',
        a: '처짐이 주된 문제라면 리프팅을, 꺼짐과 구조적인 볼륨 부족이 주된 문제라면 볼륨 보완을 우선 고려합니다. 두 문제가 함께 있는 경우에는 피부 상태와 시술 조합에 따라 같은 날 또는 순차 진행 여부를 의료진이 계획합니다.',
    },
    {
        q: '몇 번 받아야 하나요?',
        a: '사용 제품과 시술 부위, 꺼짐 정도, 개인의 회복 반응에 따라 달라집니다. 첫 시술 후 경과를 확인해 추가 시술 여부와 적절한 간격을 안내합니다.',
    },
    {
        q: '시술 후 어떤 증상이 생길 수 있나요?',
        a: '주사 부위에 붓기, 멍, 압통, 붉은기 등이 일시적으로 나타날 수 있습니다. 심한 통증이나 피부색 변화, 시야 이상처럼 평소와 다른 증상이 생기면 즉시 병원으로 연락해야 합니다.',
    },
];

// 비수술 눈밑 지방 재배치 전용 FAQ
const underEyeFaq = [
    {
        q: '모든 다크서클에 도움이 되나요?',
        a: '눈밑 돌출과 꺼짐 때문에 생긴 구조적인 그림자는 개선 대상이 될 수 있습니다. 다만 색소, 혈관 비침, 피부 질환 등 다른 원인이 중심이라면 별도의 치료가 필요하므로 먼저 원인을 구분해야 합니다.',
    },
    {
        q: '수술 대신 누구나 받을 수 있나요?',
        a: '모든 눈밑 고민을 비수술 방식으로 해결할 수 있는 것은 아닙니다. 지방 돌출과 피부 처짐의 정도, 눈밑 피부 두께, 이전 시술·수술 이력을 확인한 뒤 수술 또는 다른 치료가 더 적합한지 함께 판단합니다.',
    },
    {
        q: '울퉁불퉁하거나 부자연스러워질 수 있나요?',
        a: '눈밑은 피부가 얇아 제품, 주입층, 용량을 보수적으로 설계하는 것이 중요합니다. 시술 후 일시적인 붓기로 고르지 않아 보일 수 있으며, 드물게 지속적인 부종이나 윤곽 불규칙이 생길 수 있어 경과 확인이 필요합니다.',
    },
    {
        q: '몇 번 받아야 하나요?',
        a: '눈밑 돌출과 꺼짐의 정도, 함께 진행하는 시술, 회복 반응에 따라 달라집니다. 한 번에 과도하게 교정하기보다 시술 후 경과를 확인해 추가 시술 여부를 결정합니다.',
    },
    {
        q: '시술 후 주의해야 할 증상이 있나요?',
        a: '붓기, 멍, 압통, 붉은기 등이 일시적으로 나타날 수 있습니다. 시술 부위를 강하게 누르거나 문지르지 말고 안내받은 주의사항을 따라야 하며, 심한 통증이나 피부색 변화, 시야 이상이 생기면 즉시 병원으로 연락해야 합니다.',
    },
];

export const treatments: Treatment[] = [
    /* ─────────── 시그니처 ─────────── */
    {
        slug: 'booster',
        category: 'signature',
        visual: 15,
        visualW: 843,
        visualH: 591,
        name: '리베리 볼륨 부스터',
        en: 'Volume Booster',
        heroEn: 'RE:BERRY Volume Booster',
        heroDescription: '쥬베룩 볼륨 기반 복합 볼륨 시술',
        headline: { light: '볼륨의', strong: '정점에 서다' },
        definition: {
            title: '리베리 볼륨 부스터란?',
            text: '꺼짐과 처짐의 원인을 함께 살펴 얼굴 비율에 맞는 탄력과 볼륨을 설계하는 리베리 시그니처 시술입니다.',
        },
        hashtags: [
            { text: '팔자가 깊어요' },
            { text: '심술보가 신경쓰여요' },
            { text: '피부탄력이 떨어져요', strong: true },
            { text: '목주름이 신경쓰여요', strong: true },
            { text: '이중턱이랑 턱선을 개선하고 싶어요', strong: true },
            { text: '눈꺼풀이 점점 쳐져요' },
        ],
        hashtagRows: [3, 3],
        solution: { light: '볼륨의 핵심은', strong: '처짐과 꺼짐에 맞는 디자인 시술입니다' },
        items: ['ulthera', 'onda', 'vro', 'juvelook-volume'],
        signature: {
            story: {
                hook: ['당신의 얼굴은', '왜 점점 생기를 잃고 꺼져갈까요?', '나이가 들어서만은 아닙니다'],
                body: '어느 한 층만 탄력을 잃어도 \n볼륨은 꺼지고, 라인은 무너지며, \n얼굴은 실제보다 더 퀭하고 나이 들어 보이기 시작합니다. \n진정한 안티에이징의 시작은 채우는것이 아니라, \n꺼진 볼륨의 근본적인 원인을 찾아 \n탄탄하게 세우는 것부터입니다 ',
            },
            faq: boosterFaq,
            faqSet: 'booster',
            columnHeading: '논문으로 검증하고, 임상으로 증명한 볼륨부스터 이야기',
        },
    },
    {
        slug: 'acne',
        category: 'signature',
        visual: 2,
        visualW: 949,
        visualH: 592,
        name: '비수술 앞턱전진 필러',
        en: 'Filler',
        heroEn: 'Non-Surgical Chin Augmentation Filler',
        heroDescription: '무턱을 입체적으로 개선하는 구조적 필러 시술',
        headline: { light: '부족한 볼륨으로', strong: '입체감을 깨우다' },
        definition: {
            title: '비수술 앞턱전진 필러란?',
            text: '뒤로 들어가거나 부족한 앞턱의 볼륨을 보완해 얼굴의 전후 균형과 자연스러운 입체감을 완성하는 시술입니다.',
        },
        hashtags: [
            { text: '밋밋한 이마와 앞광대가 고민이에요' },
            { text: '팔자주름이 깊어 나이 들어 보여요' },
            { text: '볼살이 꺼져 인상이 피곤해 보여요', strong: true },
            { text: '무턱 때문에 얼굴 라인이 불분명해요', strong: true },
            { text: '갸름하고 입체적인 얼굴형을 원해요', strong: true },
            { text: '입가 주름과 마리오네트 라인이 신경 쓰여요' },
        ],
        hashtagRows: [3, 3],
        solution: {
            light: '필러의 핵심은',
            strong: '개별 얼굴 비율에 맞춘 섬세한 볼륨 디자인과 자연스러운 입체감 완성입니다',
        },
        items: ['restylane', 'belotero-soft', 'renefill', 'lenafill', 'artier'],
        signature: {
            story: {
                hook: ['당신의 앞턱은', '왜 어색하게 느껴질까요?', '단순히 용량을 늘리는게 \n답은 아닙니다'],
                body: '꺼진 부위에 볼륨을 채워 \n구조적 불균형의 원인을 해결하고, \n입체적인 페이스를 완성하는 \n시술입니다.',
            },
            faq: sharedSignatureFaq,
            faqSet: 'shared',
            hideFaq: true,
            columnHeading: '논문으로 검증하고, 임상으로 증명한 필러 이야기',
        },
    },
    {
        slug: 'redness',
        category: 'signature',
        visual: 3,
        visualW: 808,
        visualH: 591,
        name: '비수술 눈밑 지방 재배치',
        en: 'Brightening',
        heroEn: 'Non-Surgical Under-Eye Brightening & Filling',
        heroDescription: '눈밑 돌출과 꺼짐을 함께 개선하는 복합 시술',
        headline: { light: '어떤 순간에도 평온한 ', strong: '밝음의 정점에 서다' },
        definition: {
            title: '비수술 눈밑 지방 재배치란?',
            text: '눈밑의 돌출과 꺼짐, 피부 탄력을 함께 살펴 수술 없이 그늘진 인상과 울퉁불퉁한 경계를 완화하는 복합 시술입니다.',
        },
        hashtags: [
            { text: '눈밑이 불룩해 보여요' },
            { text: '눈밑 꺼짐이 신경 쓰여요' },
            { text: '다크서클 때문에 피곤해 보여요', strong: true },
            { text: '눈밑 경계가 울퉁불퉁해요', strong: true },
            { text: '수술 없이 자연스럽게 개선하고 싶어요' },
        ],
        hashtagRows: [3, 2],
        // 제공 시안에서 변경 표시가 없는 시술기기 구성을 그대로 사용한다.
        solution: { light: '볼륨의 핵심은', strong: '처짐과 꺼짐에 맞는 디자인 시술입니다' },
        items: ['ulthera', 'onda', 'vro', 'juvelook-volume'],
        signature: {
            story: {
                hook: ['당신의 눈밑은', '왜 수시로 어둡고 피곤해 보일까요?', '수면 부족 탓만은 아닙니다'],
                body: '눈밑 지방이 밀려나와 그늘이 생기면 \n얼굴 전체의 균형이 무너지고, 어둠이 지며, \n인상이 피곤하고 나이 들어 보이기 시작합니다. \n화사한 눈가의 시작은 어두움을 가리는 것이 아니라 \n돌출과 꺼짐을 동시에 잡는 \n구조적 균형을 바로세우는 것부터입니다.',
            },
            faq: underEyeFaq,
            faqSet: 'underEye',
            columnHeading: '논문으로 검증하고, 임상으로 증명한 지방 재배치 이야기',
        },
    },

    /* ─────────── 피부교정 ─────────── */
    {
        slug: 'pigment',
        category: 'skin',
        visual: 1,
        visualW: 895,
        visualH: 584,
        name: '색소',
        en: 'Pigmentation',
        headline: { light: '결점 없이 빛나는', strong: '미백의 정점에 서다' },
        definition: {
            title: '색소(잡티) 치료란?',
            text: '레이저 에너지로 멜라닌 색소를 \n선택적으로 제거해 \n피부 톤을 개선하는 \n시술 입니다.',
        },
        hashtags: [
            { text: '팔자가 깊어요' },
            { text: '심술보가 신경쓰여요' },
            { text: '피부탄력이 떨어져요', strong: true },
            { text: '목주름이 신경쓰여요', strong: true },
            { text: '이중턱이랑 턱선을 개선하고 싶어요', strong: true },
            { text: '눈꺼풀이 점점 처져요' },
        ],
        hashtagRows: [3, 3],
        solution: { light: '색소치료의 핵심은', strong: '피부층에 맞는 정밀한 타겟팅입니다' },
        items: ['lipot', 'excelv', 'spectra', 'pico', 'clarity'],
    },
    {
        slug: 'acne',
        category: 'skin',
        visual: 2,
        visualW: 949,
        visualH: 592,
        name: '여드름',
        en: 'Acne',
        headline: { light: '매끈하게 정돈된', strong: '무결점의 정점에 서다' },
        definition: {
            title: '여드름 치료란?',
            text: '피지선에 선택적으로 작용하여 \n여드름의 근본적인 원인을 \n제거하고 깨끗한 피부 환경을 \n만드는 시술입니다.',
        },
        hashtags: [
            { text: '턱선에 염증성 여드름이 올라와요' },
            { text: '좁쌀 여드름이 갑자기 생겨요' },
            { text: '여드름 때문에 앞머리를 못올려요', strong: true },
            { text: '볼에 여드름 흉터가 너무 많아요', strong: true },
            { text: '여드름이 무서워요', strong: true },
            { text: '여드름 자국이 사라지지 않아요' },
        ],
        hashtagRows: [3, 3],
        solution: { light: '여드름치료의 핵심은', strong: '재발을 막는 근본적인 원인 차단입니다' },
        items: ['gold-ptt', 'potenza', 'exosome'],
    },
    {
        slug: 'redness',
        category: 'skin',
        visual: 3,
        visualW: 808,
        visualH: 591,
        name: '홍조/주사피부염',
        en: 'Redness',
        headline: { light: '어떤 순간에도 평온한', strong: '투명함의 정점에 서다' },
        definition: {
            title: '홍조 치료란?',
            text: '늘어난 이상 혈관만을 선택적으로 \n치료하여 붉고 얼룩덜룩한 \n피부톤을 맑고 균일하게 \n개선하는 시술입니다.',
        },
        hashtags: [
            { text: '화장을 해도 붉은기가 가려지지 않아요' },
            { text: '갱년기가 와서 얼굴이 화끈거려요', strong: true },
            { text: '긴장할 때마다 얼굴이 붉어져요', strong: true },
            { text: '피부에 실핏줄이 많아요' },
        ],
        hashtagRows: [2, 2],
        solution: { light: '홍조치료의 핵심은', strong: '원인에 맞는 혈관 맞춤 케어입니다' },
        items: ['excelv', 'gold-ptt', 'potenza'],
    },
    {
        slug: 'skinbooster',
        category: 'skin',
        visual: 4,
        visualW: 843,
        visualH: 591,
        name: '스킨부스터',
        en: 'Skin Boosters',
        headline: { light: '피부 깊은 곳에서부터 차오르는', strong: '본연의 광채' },
        definition: {
            title: '스킨부스터란?',
            text: '피부 진피층에 유효 성분을 \n직접 전달하여 깊은 속보습을 \n채우고 무너진 장벽을 \n강화합니다.',
        },
        hashtags: [
            { text: '피부가 너무 건조해요' },
            { text: '화장이 자꾸 떠요' },
            { text: '피부 속부터 당기는 느낌', strong: true },
            { text: '푸석하고 생기가 없어요', strong: true },
            { text: '자연스러운 물광을 원해요', strong: true },
        ],
        hashtagRows: [3, 2],
        solution: { light: '스킨부스터의 핵심은', strong: '피부 속 장벽부터 다지는 깊은 영양 공급입니다' },
        items: ['juvelook', 'rejuran-healer', 'lillide', 'newarti', 'lituo'],
    },
    {
        slug: 'tattoo-removal',
        category: 'skin',
        visual: 5,
        visualW: 842,
        visualH: 581,
        name: '문신제거',
        en: 'Tattoo Removal',
        headline: { light: '흔적 없이 깨끗했던', strong: '원래의 모습으로 돌아가다' },
        definition: {
            title: '문신제거란?',
            text: '주변 피부 손상 없이 \n색소 입자만 잘게 부수어 \n다양한 컬러와 깊은 흔적까지 \n정교하게 지워냅니다.',
        },
        hashtags: [
            { text: '유행 지난 문신 지우고 싶어요' },
            { text: '흉터 없이 지우고 싶어요' },
            { text: '반영구 눈썹 잔흔이 심해요', strong: true },
            { text: '깨끗했던 피부로 돌아가고 싶어요' },
        ],
        hashtagRows: [2, 2],
        solution: { light: '문신제거의 핵심은', strong: '주변 피부 손상을 줄인 정밀한 색소 파괴입니다' },
        items: ['pico'],
    },
    {
        slug: 'scar-pore',
        category: 'skin',
        visual: 6,
        visualW: 794,
        visualH: 584,
        name: '흉터·모공·피부결',
        en: 'Scars · Pores · Texture',
        headline: { light: '촘촘하게 채워져', strong: '빈틈없이 매끄러운 피부결' },
        definition: {
            title: '흉터·모공·피부결',
            text: '피부 자체의 콜라겐 재생을 \n유도하여 패인 요철을 \n촘촘하게 메우고 \n매끄러운 결을 완성합니다.',
        },
        hashtags: [
            { text: '모공이 점점 넓어져요' },
            { text: '여드름 흉터 자국이 고민이에요' },
            { text: '피부 요철 때문에 고민이에요', strong: true },
            { text: '화장해도 모공이 도드라져요', strong: true },
            { text: '매끄러운 피부결을 원해요', strong: true },
        ],
        hashtagRows: [3, 2],
        solution: { light: '흉터·모공·피부결 개선의 핵심은', strong: '촘촘하게 새살을 채우는 피부 재생입니다' },
        items: ['juvelook', 'pico2', 'potenza', 'synerjet'],
    },
    {
        slug: 'hair-removal',
        category: 'skin',
        visual: 7,
        visualW: 811,
        visualH: 592,
        name: '제모',
        en: 'Laser Hair Removal',
        headline: { light: '군더더기 없이 깔끔한', strong: '매끈함의 정점에 서다' },
        definition: {
            title: '제모',
            text: '모근과 모낭만을 선택적으로 \n파괴하여 피부 자극은 최소화하고 \n깔끔함을 오래 유지합니다.',
        },
        hashtags: [
            { text: '매일 면도하기 귀찮아요' },
            { text: '면도 독 때문에 따가워요' },
            { text: '거뭇거뭇한 자국이 신경 쓰여요', strong: true },
            { text: '깔끔한 인상을 만들고 싶어요', strong: true },
            { text: '자극 없는 제모를 원해요', strong: true },
        ],
        hashtagRows: [3, 2],
        solution: { light: '레이저 제모의 핵심은', strong: '모근 성장을 억제하는 주기별 타겟 시술입니다' },
        items: ['clarity2'],
    },
    {
        slug: 'care',
        category: 'skin',
        visual: 8,
        visualW: 853,
        visualH: 592,
        name: '관리',
        en: 'Medical Aesthetics',
        headline: { light: '시술의 완성도를 높이는', strong: '깊이 있는 진정과 재생' },
        definition: {
            title: '관리',
            text: '시술 후 자극받은 피부를 \n빠르게 진정시키고 \n집중적인 재생을 도와 \n시술 효과를 극대화합니다.',
        },
        hashtags: [
            { text: '시술 후 붉은 기를 가라앉히고 싶어요' },
            { text: '중요한 약속 전 집중 케어를 원해요' },
            { text: '피부 장벽이 민감해졌어요', strong: true },
            { text: '전문적인 진정이 필요해요', strong: true },
            { text: '시술 효과를 오래 유지하고 싶어요', strong: true },
        ],
        hashtagRows: [3, 2],
        solution: { light: '피부 관리의 핵심은', strong: '무너진 밸런스를 되찾는 맞춤형 진정 및 재생입니다' },
        items: ['aqua', 'aha-bha', 'peeling', 'scrubber', 'cryocell'],
    },

    /* ─────────── 안티에이징  ─────────── */
    {
        slug: 'laser-lifting',
        category: 'aging',
        visual: 9,
        visualW: 770,
        visualH: 579,
        name: '레이저리프팅',
        en: 'Laser lifting',
        headline: { light: '피부 속부터', strong: '탄력을 촘촘하게 채우다' },
        definition: {
            title: '레이저 리프팅',
            text: '피부 깊은 곳의 탄력을 타겟팅하여 \n처짐의 원인을 바로잡고, \n탄탄한 윤곽을 완성하는 \n시술입니다.',
        },
        hashtags: [
            { text: '팔자가 깊어요' },
            { text: '심술보가 신경쓰여요' },
            { text: '피부탄력이 떨어져요', strong: true },
            { text: '목주름이 신경쓰여요', strong: true },
            { text: '이중턱이랑 턱선을 개선하고 싶어요', strong: true },
            { text: '눈꺼풀이 점점 처져요' },
        ],
        hashtagRows: [3, 3],
        solution: { light: '리프팅의 핵심은', strong: '얼굴형에 맞는 디자인 입니다' },
        items: ['ulthera', 'onda', 'vro', 'revinas', 'shrink'],
    },
    {
        slug: 'thread-lifting',
        category: 'aging',
        visual: 10,
        visualW: 800,
        visualH: 577,
        name: '실리프팅',
        en: 'Thread lift',
        headline: { light: '처진 피부를 ', strong: '끌어올려 탄탄함을 되찾다' },
        definition: {
            title: '실리프팅',
            text: '처진 조직을 직접 지지하여 \n무너진 라인의 원인을 개선하고, \n강력한 리프팅 효과를 만드는 \n시술입니다.',
        },
        hashtags: [
            { text: '턱선이 점점 처지고 무너져요' },
            { text: '팔자주름이 깊어져 \n나이 들어 보여요' },
            { text: '심술보 때문에 얼굴 라인이 \n울퉁불퉁해요', strong: true },
            { text: '피부 탄력이 떨어져 얼굴이 \n전체적으로 처졌어요', strong: true },
            { text: '갸름하고 탄탄한 \nV라인을 만들고 싶어요', strong: true },
            { text: '얼굴 살이 처져 \n입가 주름이 고민이에요' },
        ],
        hashtagRows: [3, 3],
        solution: { light: '리프팅의 핵심은', strong: '즉각적인 라인 정리와 근본적인 피부 탄력 강화입니다' },
        items: ['deuce'],
    },
    {
        slug: 'filler',
        category: 'aging',
        visual: 11,
        visualW: 799,
        visualH: 596,
        name: '필러',
        en: 'Facial fillers',
        headline: { light: '부족한 볼륨으로', strong: '입체감을 깨우다' },
        definition: {
            title: '필러',
            text: '꺼진 부위에 볼륨을 채워 \n구조적 불균형의 원인을 해결하고, \n입체적인 페이스를 완성하는 \n시술입니다.',
        },
        hashtags: [
            { text: '밋밋한 이마와 앞광대가 고민이에요' },
            { text: '팔자주름이 깊어 나이 들어 보여요' },
            { text: '볼살이 꺼져 인상이 피곤해 보여요', strong: true },
            { text: '무턱 때문에 \n얼굴 라인이 불분명해요', strong: true },
            { text: '갸름하고 입체적인 \n얼굴형을 원해요', strong: true },
            { text: '입가 주름과 \n마리오네트 라인이 신경 쓰여요' },
        ],
        hashtagRows: [3, 3],
        solution: {
            light: '필러의 핵심은',
            // #FIX: 입니다. light로 가야함
            strong: '개별 얼굴 비율에 맞춘 \n섬세한 볼륨 디자인과 자연스러운 입체감 완성입니다',
        },
        items: ['restylane', 'belotero-soft', 'renefill', 'lenafill', 'artier'],
    },
    {
        slug: 'botox',
        category: 'aging',
        visual: 12,
        visualW: 770,
        visualH: 579,
        name: '보톡스',
        en: 'Botox',
        headline: { light: '부드럽게 정돈된', strong: '매끄러움의 정점에 서다' },
        definition: {
            title: '보톡스',
            text: '과도한 근육과 \n주름의 원인 부위에 선택적으로 \n작용하여 매끄러운 라인을 \n만드는 시술입니다.',
        },
        hashtags: [
            { text: '사각턱 때문에 얼굴이 커 보여요' },
            { text: '미간과 이마에 \n깊은 주름이 생겼어요' },
            { text: '웃을 때 눈가 주름이 신경 쓰여요', strong: true },
            { text: '승모근이 솟아 목이 짧아 보여요', strong: true },
            { text: '종아리 알이 \n도드라져 고민이예요', strong: true },
            { text: '콧등에 표정 주름이 \n시작했어요' },
        ],
        hashtagRows: [3, 3],
        // #FIX: 입니다. light로 가야함
        solution: { light: '보톡스의 핵심은 정교한 근육 조절을 통한 ', strong: '매끄러운 라인 완성입니다' },
        items: ['xeomin', 'coretox', 'hitox'],
    },
    {
        slug: 'face-contour',
        category: 'aging',
        visual: 13,
        visualW: 814,
        visualH: 595,
        name: '얼굴체형관리',
        en: 'Facial & Body contouring',
        headline: { light: '조화로운 ', strong: '얼굴 균형을 완성하다' },
        definition: {
            title: '얼굴체형관리',
            text: '불필요한 부종과 \n지방의 원인을 케어하여 \n균형 잡힌 윤곽을 되찾아주는 \n관리입니다.',
        },
        hashtags: [
            { text: '좌우 얼굴 비대칭이 심해요' },
            { text: '얼굴 라인이 울퉁불퉁해요' },
            { text: '얼굴 살이 처져 라인이 흐릿해요', strong: true },
            { text: '얼굴이 예전보다 커진 느낌이에요', strong: true },
            { text: '이중턱이 고민이고 \n턱선이 둔해요', strong: true },
            { text: '전체적인 얼굴 윤곽을 정리하고 싶어요' },
        ],
        hashtagRows: [3, 3],
        // #FIX: 입니다. light로 가야함
        solution: { light: '체형 관리의 핵심은', strong: '균형 잡힌 윤곽 설계와 조화로운 라인 정립입니다' },
        items: ['mounjaro', 'wegovy', 'contour-inj', 'dca'],
    },
    {
        slug: 'iv-therapy',
        category: 'aging',
        visual: 14,
        visualW: 755,
        visualH: 582,
        name: '수액주사',
        en: 'IV therapy',
        headline: { light: '지친 일상에', strong: '깊은 활력을 채우다' },
        definition: {
            title: '수액주사',
            text: '체내 깊은 곳부터 영양을 공급해 \n피부 피로의 원인을 해소하고 \n맑은 컨디션을 만드는 \n케어입니다.',
        },
        hashtags: [
            { text: '만성 피로 때문에 \n몸이 항상 무거워요' },
            { text: '피부가 칙칙하고 \n생기가 없어요' },
            { text: '환절기마다 면역력이 \n떨어지는 것 같아요', strong: true },
            { text: '충분히 쉬어도 회복이 안 돼요', strong: true },
            { text: '스트레스로 인한 두통과 \n무기력함이 있어요', strong: true },
            { text: '피부 톤 개선과 활력을 \n되찾고 싶어요' },
        ],
        hashtagRows: [3, 3],
        solution: {
            light: '수액주사의 핵심은 체내 필요한 영양을 즉각적으로 보충하여 ',
            // #FIX: 하는 것입니다 light로 가야함
            strong: '근본적인 활력을 회복하는 것입니다',
        },
        // 수액주사는 솔루션 카드 슬라이더 대신 IvTagBox(이름표 박스)를 씀 → items 는 비워둠
        items: [],
        // IvTagBox 에 들어갈 항목들. 여기 배열만 고치면 화면에 그대로 반영됨
        ivItems: [
            '수액·주사',
            '비타민수액',
            '백옥주사',
            '신데렐라주사',
            '비타민C(고농축)',
            '비타민B주사',
            '항산화주사',
            '감초주사',
            '마늘주사',
            '비타민D주사',
            '태반주사',
        ],
    },
];

// messages/treatments/{locale}.json 의 signature.{slug} / skin.{slug} / aging.{slug} 항목 하나의 모양
export interface TreatmentTranslation {
    heroDescription?: string;
    headline?: { light: string; strong: string };
    definition?: { title: string; text: string };
    hashtags?: string[];
    solution?: { light: string; strong: string };
    story?: { hook: [string, string, string]; body: string };
    columnHeading?: string;
}

// ko 이외 로케일에서 headline/definition/hashtags/solution/story 를 번역본으로 덮어씌운다.
// hashtags 는 순서가 원본과 같다고 가정하고 text 만 교체 — strong 플래그는 그대로 유지.
export const localizeTreatment = (item: Treatment, override?: TreatmentTranslation): Treatment => {
    if (!override) return item;
    return {
        ...item,
        ...(override.heroDescription && { heroDescription: override.heroDescription }),
        ...(override.headline && { headline: override.headline }),
        ...(override.definition && { definition: override.definition }),
        ...(override.hashtags && {
            hashtags: item.hashtags.map((h, i) => ({ ...h, text: override.hashtags![i] ?? h.text })),
        }),
        ...(override.solution && { solution: override.solution }),
        ...(item.signature &&
            (override.story || override.columnHeading) && {
                signature: {
                    ...item.signature,
                    ...(override.story && { story: override.story }),
                    ...(override.columnHeading && { columnHeading: override.columnHeading }),
                },
            }),
    };
};

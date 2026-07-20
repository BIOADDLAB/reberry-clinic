// items 의 슬러그는 equipment.ts(장비) 또는 products.ts(제품) 어느 쪽이든 가능 — lib/solution.ts 가 통합 검색
export type Category = 'signature' | 'skin' | 'aging';

export interface Chip {
    text: string;
    strong?: boolean;
}

export interface Treatment {
    slug: string;
    category: Category;
    name: string;
    en: string;
    headline?: { light: string; strong: string }; // 캐치프레이즈
    definition: { title: string; text: string };
    hashtags: Chip[];
    solution: { light: string; strong: string };
    items: string[]; // 장비 + 제품 혼합 슬러그
    visual: number; // 배경/인물 세트 번호
    visualW: number; // 시술 소개 그룹(카드+인물)
    visualH: number; // 시술 소개 그룹 시안 실측 높이
    signature?: {
        story: { hook: [string, string, string]; body: string };
        faq: { q: string; a: string }[];
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

export const treatments: Treatment[] = [
    /* ─────────── 시그니처 ─────────── */
    {
        slug: 'pigment',
        category: 'signature',
        visual: 1,
        visualW: 895,
        visualH: 584,
        name: '색소',
        en: 'Pigmentation',
        headline: { light: '결점 없이 빛나는', strong: '미백의 정점에 서다' },
        definition: {
            title: '색소(잡티) 치료란?',
            text: '레이저 에너지로 멜라닌 색소를 선택적으로 제거해 피부 톤을 개선하는 시술입니다.',
        },
        hashtags: [
            { text: '얼굴톤이 어두워요' },
            { text: '기미가 점점 진해져요' },
            { text: '임신하고 색소가 많이 생겼어요', strong: true },
            { text: '토닝을 아무리 받아도 효과가 없어요', strong: true },
            { text: '어릴때부터 있었던 색소가 신경쓰여요' },
        ],
        solution: { light: '색소치료의 핵심은', strong: '피부층에 맞는 정밀한 타겟팅입니다' },
        items: ['lipot', 'excelv', 'spectra', 'pico'],
        signature: {
            story: {
                hook: ['당신의 얼굴은', '왜 점점 칙칙하고 어두워질까요?', '자외선 탓만은 아닙니다'],
                body: '작은 잡티 하나가 생겨도\n피부 전체의 맑은 빛이 무너지고, 그림자가 지며,\n인상이 지치고 나이 들어 보이기 시작합니다.\n맑고 투명한 피부의 시작은 겉을 가리는 것이 아니라\n속 깊이 숨은 색소를 깨끗하게 잠재우는 것부터입니다.',
            },
            faq: [
                {
                    q: '시술 후 딱지가 생기나요?',
                    a: '병변의 종류에 따라 미세한 딱지가 생길 수 있으며, 보통 5~7일 내 자연스럽게 탈락합니다. 인위적으로 떼어내지만 않으시면 흔적 없이 회복됩니다.',
                },
                ...commonFaq,
                {
                    q: '토닝과 어떻게 다른가요?',
                    a: '토닝은 넓은 부위의 옅은 색소를 서서히 정리하는 방식이고, 리베리의 색소 치료는 병변의 깊이를 진단해 파장과 장비를 골라 정확히 타겟하는 방식입니다. 난치성 색소일수록 정밀 타겟팅이 중요합니다.',
                },
            ],
        },
    },
    {
        slug: 'lifting',
        category: 'signature',
        visual: 9,
        visualW: 770,
        visualH: 579,
        name: '리프팅',
        en: 'Volume Lifting',
        headline: { light: '무너진 볼륨까지 세우는', strong: '리프팅의 정점에 서다' },
        definition: {
            title: '꺼진 얼굴 볼륨 리프팅이란?',
            text: '처진 라인은 끌어올리고 꺼진 볼륨은 채워, 얼굴의 축을 다시 세우는 리베리만의 복합 리프팅 시술입니다.',
        },
        hashtags: [
            { text: '팔자가 깊어요' },
            { text: '심술보가 신경쓰여요' },
            { text: '피부탄력이 떨어져요', strong: true },
            { text: '목주름이 신경쓰여요', strong: true },
            { text: '이중턱이랑 턱선을 개선하고 싶어요' },
            { text: '눈꺼풀이 점점 처져요' },
        ],
        solution: { light: '리프팅의 핵심은', strong: '얼굴형에 맞는 디자인 입니다' },
        items: ['ulthera', 'onda', 'vro', 'juvelook-volume'],
        signature: {
            story: {
                hook: ['당신의 얼굴은', '왜 점점 아래로 내려올까요?', '나이가 들어서만은 아닙니다'],
                body: '어느 한 층만 약해져도\n턱선은 흐려지고, 팔자주름은 깊어지며,\n얼굴은 실제보다 더 넓고 무거워 보이기 시작합니다.\n리프팅의 시작은 ‘당기는 것’이 아니라\n무너진 원인을 찾는 것부터입니다.',
            },
            faq: [
                {
                    q: '울쎄라와 써마지는 어떻게 다른가요?',
                    a: '울쎄라는 초음파로 근막층(SMAS)을 당겨 올리는 리프팅에, 써마지는 고주파로 진피층 콜라겐을 재생시키는 탄력 개선에 강점이 있습니다. 처짐과 탄력 저하의 비율을 진단해 단독 또는 병행을 설계해 드립니다.',
                },
                ...commonFaq,
                {
                    q: '효과는 얼마나 유지되나요?',
                    a: '장비와 개인차에 따라 다르지만 보통 6개월~1년 이상 유지됩니다. 정기적인 유지 플랜을 함께 설계해 드리면 더 오래, 자연스럽게 유지할 수 있습니다.',
                },
            ],
        },
    },
    {
        slug: 'acne',
        category: 'signature',
        visual: 2,
        visualW: 949,
        visualH: 592,
        name: '여드름',
        en: 'Acne',
        headline: { light: '매끈하게 정돈된', strong: '무결점의 정점에 서다' },
        definition: {
            title: '여드름 치료란?',
            text: '피지선에 선택적으로 작용하여 여드름의 근본적인 원인을 제거하고 깨끗한 피부 환경을 만드는 시술입니다.',
        },
        hashtags: [
            { text: '턱선에 염증성 여드름이 생겨요' },
            { text: '좁쌀 여드름이 갑자기 늘었어요' },
            { text: '여드름 때문에 앞머리를 못 올려요', strong: true },
            { text: '볼에 여드름 흉터가 너무 많아요', strong: true },
            { text: '여드름이 무서워요' },
            { text: '여드름 자국이 사라지지 않아요' },
        ],
        solution: { light: '여드름치료의 핵심은', strong: '재발을 막는 근본적인 원인 차단입니다' },
        items: ['gold-ptt', 'potenza', 'exosome'],
        signature: {
            story: {
                hook: ['당신의 피부는', '왜 반복해서 트러블이 올라올까요?', '잘못된 세안 탓만은 아닙니다'],
                body: '작은 뽀루지 하나만 생겨도\n피부 전체의 매끄러움이 무너지고, 자국이 남으며,\n인상이 어수선하고 나이 들어 보이기 시작합니다.\n깨끗한 피부의 시작은 억지로 짜내는 것이 아니라\n속에서 차오르는 유수분 밸런스를 바로잡는 것부터입니다.',
            },
            faq: [
                {
                    q: '압출은 꼭 해야 하나요?',
                    a: '염증이 진행 중인 병변을 무리하게 짜면 흉터와 색소침착이 남습니다. 리베리는 병변 상태를 보고 의학적으로 필요한 경우에만 무리 없는 압출을 진행합니다.',
                },
                ...commonFaq,
                {
                    q: '피부과 약과 병행해도 되나요?',
                    a: '복용 중인 약과 피부 상태에 따라 시술 강도와 시점을 조절합니다. 진료 시 복용 이력을 알려주시면 안전하게 병행 플랜을 설계해 드립니다.',
                },
            ],
        },
    },
    {
        slug: 'redness',
        category: 'signature',
        visual: 3,
        visualW: 808,
        visualH: 591,
        name: '홍조',
        en: 'Redness',
        headline: { light: '어떤 순간에도 평온한', strong: '투명함의 정점에 서다' },
        definition: {
            title: '홍조 치료란?',
            text: '늘어난 이상 혈관만을 선택적으로 치료하여 붉고 얼룩덜룩한 피부톤을 맑고 균일하게 개선하는 시술입니다.',
        },
        hashtags: [
            { text: '얼굴이 쉽게 빨개져요' },
            { text: '갱년기가 와서 얼굴이 화끈거려요' },
            { text: '긴장할 때마다 얼굴이 붉어져요', strong: true },
            { text: '피부에 실핏줄이 보여요', strong: true },
            { text: '화장으로도 붉은기가 안 가려져요' },
        ],
        solution: { light: '홍조치료의 핵심은', strong: '원인에 맞는 혈관 맞춤 케어입니다' },
        items: ['excelv', 'gold-ptt', 'potenza'],
        signature: {
            story: {
                hook: ['당신의 얼굴은', '왜 수시로 붉고 예민해질까요?', '감정 기복 탓만은 아닙니다'],
                body: '작은 자극 하나에도 홍조가 생기면\n피부 전체의 균형이 무너지고, 얼룩이 지며,\n인상이 불안하고 나이 들어 보이기 시작합니다.\n평온한 피부의 시작은 붉기를 가리는 것이 아니라\n자극에 흔들리는 피부 장벽을 튼튼하게 세우는 것부터입니다.',
            },
            faq: [
                {
                    q: '홍조는 완치가 가능한가요?',
                    a: '체질적 요인이 있는 만큼 “다시는 붉어지지 않는 상태”보다는, 쉽게 붉어지지 않고 빨리 가라앉는 피부로 만드는 것이 치료 목표입니다. 꾸준한 혈관 치료와 장벽 관리로 체감 변화를 만들 수 있습니다.',
                },
                ...commonFaq,
                {
                    q: '레이저 후 더 붉어질 수도 있나요?',
                    a: '시술 직후 일시적으로 붉은기가 올라올 수 있으나 수 시간~수일 내 가라앉습니다. 진정 관리를 함께 설계해 회복을 앞당겨 드립니다.',
                },
            ],
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
            text: '레이저 에너지로 멜라닌 색소를 선택적으로 제거해 피부 톤을 개선하는 시술입니다.',
        },
        hashtags: [
            { text: '얼굴톤이 어두워요' },
            { text: '기미가 점점 진해져요' },
            { text: '임신하고 색소가 많이 생겼어요', strong: true },
            { text: '토닝을 아무리 받아도 효과가 없어요', strong: true },
            { text: '어릴때부터 있었던 색소가 신경쓰여요' },
        ],
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
            text: '피지선에 선택적으로 작용하여 여드름의 근본적인 원인을 제거하고 깨끗한 피부 환경을 만드는 시술입니다.',
        },
        hashtags: [
            { text: '턱선에 염증성 여드름이 생겨요' },
            { text: '좁쌀 여드름이 갑자기 늘었어요' },
            { text: '여드름 때문에 앞머리를 못 올려요', strong: true },
            { text: '볼에 여드름 흉터가 너무 많아요', strong: true },
            { text: '여드름이 무서워요' },
            { text: '여드름 자국이 사라지지 않아요' },
        ],
        solution: { light: '여드름치료의 핵심은', strong: '재발을 막는 근본적인 원인 차단입니다' },
        items: ['gold-ptt', 'potenza', 'exosome'],
    },
    {
        slug: 'redness',
        category: 'skin',
        visual: 3,
        visualW: 808,
        visualH: 591,
        name: '홍조',
        en: 'Redness',
        headline: { light: '어떤 순간에도 평온한', strong: '투명함의 정점에 서다' },
        definition: {
            title: '홍조 치료란?',
            text: '늘어난 이상 혈관만을 선택적으로 치료하여 붉고 얼룩덜룩한 피부톤을 맑고 균일하게 개선하는 시술입니다.',
        },
        hashtags: [
            { text: '얼굴이 쉽게 빨개져요' },
            { text: '갱년기가 와서 얼굴이 화끈거려요' },
            { text: '긴장할 때마다 얼굴이 붉어져요', strong: true },
            { text: '피부에 실핏줄이 보여요', strong: true },
            { text: '화장으로도 붉은기가 안 가려져요' },
        ],
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
        headline: { light: '깊은 곳부터 채워낸', strong: '광채의 정점에 서다' },
        definition: {
            title: '스킨부스터란?',
            text: '피부 진피층에 유효 성분을 직접 전달하여 깊은 속보습을 채우고 무너진 장벽을 강화합니다.',
        },
        hashtags: [
            { text: '피부 속부터 당기는 느낌이에요' },
            { text: '자연스러운 물광을 원해요' },
            { text: '푸석하고 생기가 없어요', strong: true },
            { text: '화장이 들뜨고 각질이 일어나요', strong: true },
            { text: '탄력이 떨어진 게 느껴져요' },
        ],
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
        headline: { light: '흔적 없이 지워낸', strong: '깨끗함의 정점에 서다' },
        definition: {
            title: '문신제거란?',
            text: '주변 피부 손상 없이 색소 입자만 잘게 부수어 다양한 컬러와 깊은 흔적까지 정교하게 제거합니다.',
        },
        hashtags: [
            { text: '유행 지난 문신 지우고 싶어요' },
            { text: '흉터 없이 지우고 싶어요', strong: true },
            { text: '반영구 눈썹 잔흔이 심해요', strong: true },
            { text: '컬러 문신도 지워질까요?' },
        ],
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
        en: 'Scar · Pore',
        headline: { light: '매끄럽게 메워진', strong: '피부결의 정점에 서다' },
        definition: {
            title: '흉터·모공·피부결',
            text: '피부 자체의 콜라겐 재생을 유도하여 패인 요철을 복원하고 매끄러운 피부결을 완성합니다.',
        },
        hashtags: [
            { text: '모공이 점점 넓어져요' },
            { text: '여드름 흉터 자국이 깊어요', strong: true },
            { text: '피부 요철 때문에 고민이에요', strong: true },
            { text: '화장해도 모공이 도드라져요' },
            { text: '매끄러운 피부결을 원해요' },
        ],
        solution: { light: '흉터·모공·피부결 개선의 핵심은', strong: '단단하게 새살을 채우는 피부 재생입니다' },
        items: ['juvelook', 'pico2', 'potenza', 'synerjet'],
    },
    {
        slug: 'hair-removal',
        category: 'skin',
        visual: 7,
        visualW: 811,
        visualH: 592,
        name: '제모',
        en: 'Hair Removal',
        headline: { light: '군더더기 없이 깔끔한', strong: '매끈함의 정점에 서다' },
        definition: {
            title: '제모',
            text: '모근과 모낭만을 선택적으로 파괴하여 피부 자극을 최소화하고 깔끔함을 오래 유지합니다.',
        },
        hashtags: [
            { text: '매일 면도하기 번거로워요' },
            { text: '제모 후 자국이 신경 쓰여요', strong: true },
            { text: '깔끔한 인상을 만들고 싶어요', strong: true },
            { text: '자극 없는 제모를 원해요' },
        ],
        solution: { light: '레이저 제모의 핵심은', strong: '모근 성장을 억제하는 주기별 맞춤 시술입니다' },
        items: ['clarity2'],
    },
    {
        slug: 'care',
        category: 'skin',
        visual: 8,
        visualW: 853,
        visualH: 592,
        name: '관리',
        en: 'Medical Care',
        headline: { light: '흔들림 없이 유지되는', strong: '컨디션의 정점에 서다' },
        definition: {
            title: '관리',
            text: '시술 후 자극받은 피부를 빠르게 진정시키고 집중적인 재생을 도와 시술 효과를 극대화합니다.',
        },
        hashtags: [
            { text: '전문적인 진정이 필요해요' },
            { text: '시술 효과를 오래 유지하고 싶어요', strong: true },
            { text: '민감해진 피부를 달래고 싶어요', strong: true },
            { text: '피부 결이 거칠어졌어요' },
        ],
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
        en: 'Laser Lifting',
        // 시안 캐치프레이즈 — 색소·여드름·홍조는 원문, 나머지는 판독 불가로 동일 패턴 자체 작성(확인 요청)
        headline: { light: '무너짐 없이 탄탄한', strong: '리프팅의 정점에 서다' },
        definition: {
            title: '레이저 리프팅이란?',
            text: '고강도 초음파와 고주파 에너지로 피부 깊은 층을 수축시켜, 자연스러운 턱선과 탄력을 되살리는 시술입니다.',
        },
        hashtags: [
            { text: '팔자가 깊어요' },
            { text: '심술보가 신경쓰여요' },
            { text: '피부탄력이 떨어져요', strong: true },
            { text: '목주름이 신경쓰여요', strong: true },
            { text: '이중턱이랑 턱선을 개선하고 싶어요' },
            { text: '눈꺼풀이 점점 처져요' },
        ],
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
        en: 'Thread Lifting',
        // 시안 캐치프레이즈 — 색소·여드름·홍조는 원문, 나머지는 판독 불가로 동일 패턴 자체 작성(확인 요청)
        headline: { light: '즉각적으로 당겨 올린', strong: '라인의 정점에 서다' },
        definition: {
            title: '실리프팅이란?',
            text: '녹는 실을 이용해 처진 라인을 즉각적으로 끌어올리고, 콜라겐 재생까지 유도하는 시술입니다.',
        },
        hashtags: [
            { text: '턱선이 점점 처지고 무너져요' },
            { text: '팔자주름이 깊어져 나이 들어 보여요' },
            { text: '심술보 때문에 얼굴 라인이 울퉁불퉁해요', strong: true },
            { text: '피부 탄력이 떨어져 얼굴이 전체적으로 처졌어요', strong: true },
            { text: '갸름하고 탄탄한 라인을 만들고 싶어요' },
            { text: '얼굴 살이 처져 입가 주름이 고민이에요' },
        ],
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
        en: 'Filler',
        // 시안 캐치프레이즈 — 색소·여드름·홍조는 원문, 나머지는 판독 불가로 동일 패턴 자체 작성(확인 요청)
        headline: { light: '조화롭게 채워낸', strong: '입체감의 정점에 서다' },
        definition: {
            title: '필러란?',
            text: '히알루론산을 꺼진 부위에 채워 볼륨과 윤곽을 자연스럽게 살리는 시술입니다.',
        },
        hashtags: [
            { text: '꺼진 이마와 앞광대가 고민이에요' },
            { text: '팔자주름이 깊어 나이 들어 보여요' },
            { text: '볼살이 꺼져 인상이 피곤해 보여요', strong: true },
            { text: '무턱 때문에 얼굴 라인이 불분명해요', strong: true },
            { text: '갸름하고 입체적인 얼굴형을 원해요' },
            { text: '입가 주름과 마리오네트 라인이 신경 쓰여요' },
        ],
        solution: {
            light: '필러의 핵심은',
            strong: '개별 얼굴 비율에 맞춘 섬세한 볼륨 디자인과 자연스러운 입체감 완성입니다',
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
        // 시안 캐치프레이즈 — 색소·여드름·홍조는 원문, 나머지는 판독 불가로 동일 패턴 자체 작성(확인 요청)
        headline: { light: '부드럽게 정돈된', strong: '매끄러움의 정점에 서다' },
        definition: {
            title: '보톡스란?',
            text: '과활성 근육을 이완시켜 주름과 라인을 부드럽게 정리하는 시술입니다.',
        },
        hashtags: [
            { text: '사각턱 때문에 얼굴이 커 보여요' },
            { text: '미간과 이마 주름이 깊어요' },
            { text: '웃을 때 눈가 주름이 신경 쓰여요', strong: true },
            { text: '종아리 알이 도드라져 고민이에요', strong: true },
            { text: '표정 주름이 생기기 시작했어요' },
            { text: '승모근이 도드라져 목이 짧아 보여요' },
        ],
        solution: { light: '보톡스의 핵심은', strong: '정교한 근육 조절을 통한 매끄러운 라인 완성입니다' },
        items: ['xeomin', 'coretox', 'hitox'],
    },
    {
        slug: 'face-contour',
        category: 'aging',
        visual: 13,
        visualW: 814,
        visualH: 595,
        name: '얼굴 체형 관리',
        en: 'Face Contouring',
        // 시안 캐치프레이즈 — 색소·여드름·홍조는 원문, 나머지는 판독 불가로 동일 패턴 자체 작성(확인 요청)
        headline: { light: '가볍게 정리된', strong: '윤곽의 정점에 서다' },
        definition: {
            title: '얼굴 체형 관리란?',
            text: '지방 분해와 대사 관리로 얼굴 라인을 가볍고 또렷하게 정리하는 시술입니다.',
        },
        hashtags: [
            { text: '좌우 얼굴 비대칭이 심해요' },
            { text: '얼굴 라인이 울퉁불퉁해요' },
            { text: '얼굴 살이 처져 라인이 흐릿해요', strong: true },
            { text: '이중턱이 고민이고 턱선이 둔해요', strong: true },
            { text: '얼굴이 예전보다 커진 느낌이에요' },
            { text: '전체적인 얼굴 윤곽을 정리하고 싶어요' },
        ],
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
        en: 'IV Therapy',
        // 시안 캐치프레이즈 — 색소·여드름·홍조는 원문, 나머지는 판독 불가로 동일 패턴 자체 작성(확인 요청)
        headline: { light: '속부터 차오르는', strong: '활력의 정점에 서다' },
        definition: {
            title: '수액주사란?',
            text: '컨디션에 맞춘 영양 성분을 정맥으로 공급해 활력과 피부 생기를 회복하는 시술입니다.',
        },
        hashtags: [
            { text: '만성 피로 때문에 몸이 항상 무거워요' },
            { text: '피부가 칙칙하고 생기가 없어요' },
            { text: '환절기마다 면역력이 떨어지는 것 같아요', strong: true },
            { text: '스트레스로 인한 두통과 무기력함이 있어요', strong: true },
            { text: '피부 톤 개선과 활력을 되찾고 싶어요' },
            { text: '충분히 쉬어도 회복이 안 돼요' },
        ],
        solution: {
            light: '수액주사의 핵심은',
            strong: '체내 필요한 영양을 즉각적으로 보충하여 근본적인 활력을 회복하는 것입니다',
        },
        // 시안 장비명 판독 불가 구간 — 확인 후 교체
        items: ['pdrn', 'signature-ha'],
    },
];

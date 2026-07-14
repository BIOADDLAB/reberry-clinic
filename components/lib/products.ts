export interface Product {
    slug: string;
    name: string;
    desc: [string, string];
    point: string;
    image: string;
}

const pr = (n: number) => `/images/items/pr-${String(n).padStart(2, '0')}.jpg`;

// #LINK: products data definition
export const products: Product[] = [
    {
        slug: 'lituo',
        name: '리투오',
        desc: ['피부 턴오버 주기 정상화 및 재생', '거친 피부 결 및 안색 개선'],
        point: '피부결, 안색, 재생시술',
        image: pr(1),
    },
    {
        slug: 'deuce',
        name: '듀스',
        desc: ['자연스러운 리프팅과 탄력 개선', '탄력 개선과 또렷한 얼굴 윤곽 완성'],
        point: '리프팅, 탄력, 윤곽',
        image: pr(2),
    },
    {
        slug: 'restylane',
        name: '레스틸렌',
        desc: ['깊은 주름 개선 및 얼굴 볼륨업', '정교한 라인 교정'],
        point: '볼륨, 라인',
        image: pr(3),
    },
    {
        slug: 'belotero-soft',
        name: '벨로테로 소프트',
        desc: ['자연스러운 표정 연출', '섬세한 주름 개선'],
        point: '밀착력, 자연스러움',
        image: pr(4),
    },
    {
        slug: 'renefill',
        name: '르네필',
        desc: ['얼굴 윤곽 교정', '꺼진 부위 볼륨 충전'],
        point: '볼륨, 윤곽, 점탄성',
        image: pr(5),
    },
    {
        slug: 'lenafill',
        name: '레나필',
        desc: ['얼굴 입체감 형성', '전반적인 피부 윤곽 개선'],
        point: '볼륨, 안전성, 입체감',
        image: pr(6),
    },
    {
        slug: 'artier',
        name: '아띠에르',
        desc: ['이목구비 볼륨 강화', '또렷한 윤곽 라인 완성'],
        point: '몰딩력, 유지력, 윤곽 개선',
        image: pr(7),
    },
    {
        slug: 'dca',
        name: 'DCA주사',
        desc: ['지방 세포 파괴, 이중턱 개선', '이중턱 개선'],
        point: '지방 파괴, 턱선 교정',
        image: pr(8),
    },
    {
        slug: 'wegovy',
        name: '위고비',
        desc: ['식욕 억제 도움', '체지방 개선'],
        point: '식단 관리, 체중 조절',
        image: pr(9),
    },
    {
        slug: 'rejuran-healer',
        name: '리쥬란 힐러',
        desc: ['PN 성분 기반 피부 세포 재생 촉진', '유수분 밸런스 회복 및 탄력 개선'],
        point: '재생, 탄력, 피부 케어',
        image: pr(10),
    },
    {
        slug: 'lillide',
        name: '릴리이드',
        desc: ['피부 장벽 강화', '건조한 피부 속 깊은 수분감 보충'],
        point: '장벽, 수분, 재생 시술',
        image: pr(11),
    },
    {
        slug: 'newarti',
        name: '뉴아티',
        desc: ['고농축 아미노산 및 히알루론산 주입', '피부 광채 촉진 및 미세 주름 개선'],
        point: '광채, 보습, 탄력 케어',
        image: pr(12),
    },
    {
        slug: 'gold-ptt',
        name: 'Gold PTT',
        desc: ['피부 고민별 1:1 맞춤형 솔루션', '근본적인 피부 환경 개선 및 화사한 톤'],
        point: '색조, 홍조, 모공',
        image: pr(13),
    },
    {
        slug: 'juvelook-volume',
        name: '쥬베룩 볼륨',
        desc: ['콜라겐 생성으로 자연스러운 볼륨 개선', '꺼진 부위 및 피부 탄력 개선'],
        point: '볼륨, 탄력, 콜라겐',
        image: pr(14),
    },
    {
        slug: 'exosome',
        name: '엑소좀',
        desc: ['피부 타입별 정밀 맞춤 시술', '손상 최소화 및 피부 결 재생'],
        point: '모공, 흉터, 탄력',
        image: pr(15),
    },
    {
        slug: 'juvelook',
        name: '쥬베룩',
        desc: ['콜라겐 재생으로 볼륨형성', '패인 흉터, 잔주름 및 모공 개선'],
        point: '볼륨, 탄력, 흉터 치료',
        image: pr(16),
    },
    {
        slug: 'xeomin',
        name: '제오민',
        desc: ['자연스러운 주름 개선', '매끄러운 피부 표현'],
        point: '주름, 윤곽, 자연스러움',
        image: pr(17),
    },
    {
        slug: 'hitox',
        name: '하이톡스',
        desc: ['잔주름 개선', '또렷한 얼굴 라인'],
        point: '주름, 탄력, 윤곽',
        image: pr(18),
    },
    {
        slug: 'coretox',
        name: '코어톡스',
        desc: ['표정주름 개선', '자연스러운 얼굴 라인'],
        point: '주름, 윤곽, 자연스러움',
        image: pr(19),
    },
    {
        slug: 'aha-bha',
        name: 'AHA/BHA',
        desc: ['피부 타입별 맞춤형 각질 스케일링', '면포성 여드름 및 피지 분비 조절'],
        point: '각질, 피지, 여드름',
        image: pr(20),
    },
    {
        slug: 'pdrn',
        name: 'PDRN',
        desc: ['연어 주사 성분으로 손상 세포 복구', '염증 완화 및 빠른 피부 진정 효과'],
        point: '재생, 진정, 상처 치료',
        image: pr(21),
    },
    {
        slug: 'mounjaro',
        name: '마운자로',
        desc: ['체지방 감소 지원', '체중 관리 도움'],
        point: '체중 감량, 대사 활성화',
        image: pr(22),
    },
    {
        slug: 'contour-inj',
        name: '윤곽주사',
        desc: ['얼굴 지방 분해, 매끄러운 라인 정리', '윤곽 정리, 얼굴 지방 감소'],
        point: '윤곽 정리, 얼굴 지방 감소',
        image: pr(23),
    },
    {
        slug: 'signature-ha',
        name: '시그니처 HA',
        desc: ['고수분 히알루론산 밀착 공급', '강력한 속건조 해결 및 물광 효과'],
        point: '보습, 물광, 속건조 케어',
        image: pr(24),
    },
    {
        slug: 'peeling',
        name: '필링',
        desc: ['묵은 각질 세포 탈락 및 턴오버 촉진', '거친 피부 결 및 안색 정화 효과'],
        point: '피부결, 안색, 재생',
        image: pr(25),
    },
    {
        slug: 'scrubber',
        name: '스크러버',
        desc: ['초은파 미세 진동을 이용한 각질 제거', '잔여 노폐물 청소 및 딥클렌징'],
        point: '각질, 피지, 노폐물',
        image: pr(26),
    },
];

export const findProducts = (slugs: string[]) =>
    slugs.map((s) => products.find((p) => p.slug === s)).filter(Boolean) as Product[];

export interface Device {
    slug: string;
    name: string;
    desc: [string, string];
    point: string;
    image: string;
}

const eq = (n: number) => `/images/items/eq-${String(n).padStart(2, '0')}.jpg`;

export const devices: Device[] = [
    {
        slug: 'potenza',
        name: '포텐자',
        desc: ['피부 타입별 정밀 맞춤 시술', '손상 최소화 및 피부 결 재생'],
        point: '모공, 흉터, 탄력',
        image: eq(1),
    },
    {
        slug: 'excelv',
        name: '엑셀V',
        desc: ['혈관 병변 및 붉은기 개선', '피부 고민별 맞춤 시술 가능'],
        point: '홍조, 혈관, 민감성',
        image: eq(2),
    },
    {
        slug: 'synerjet',
        name: '시너젯',
        desc: ['공기압 이용 유착 흉터 복원', '패인 부위 콜라겐 생성 및 리프팅'],
        point: '흉터, 유착, 볼륨 시술',
        image: eq(3),
    },
    {
        slug: 'revinas',
        name: '레비나스',
        desc: ['PLA 성분으로 콜라겐 생성을 유도', '자연스러운 볼륨과 피부 탄력 개선'],
        point: '볼륨, 탄력, 콜라겐',
        image: eq(4),
    },
    {
        slug: 'shrink',
        name: '슈링크 유니버스',
        desc: ['초음파 리프팅으로 피부 탄력 개선', '처진 윤곽을 정리하고 리프팅 효과'],
        point: '리프팅, 탄력, 윤곽',
        image: eq(5),
    },
    {
        slug: 'inmode',
        name: '인모드',
        desc: ['고주파 에너지로 탄력 개선 및 리프팅', '불필요한 지방 감소와 윤곽 정리'],
        point: '리프팅, 탄력, 윤곽',
        image: eq(6),
    },
    {
        slug: 'titanium',
        name: '티타늄',
        desc: ['3가지 파장을 활용한 복합 리프팅', '피부 탄력 개선 및 얼굴 윤곽 정리'],
        point: '리프팅, 탄력, 윤곽',
        image: eq(7),
    },
    {
        slug: 'lipot',
        name: '리팟',
        desc: ['피부 고민별 맞춤 시술 가능', '피부결 개선 및 피부 재생 케어'],
        point: '재생, 피결, 탄력',
        image: eq(8),
    },
    {
        slug: 'spectra',
        name: '헐리우드 스펙트라',
        desc: ['기미·잡티·난치성 색소 개선', '모공·피부톤 개선 및 탄력 케어'],
        point: '색소, 톤, 모공',
        image: eq(9),
    },
    {
        slug: 'pico',
        name: '피코 플러스',
        desc: ['기미·잡티·난치성 색소 개선', '모공·문신 제거 및 피부결 개선'],
        point: '색소, 문신, 피부결',
        image: eq(10),
    },
    {
        slug: 'clarity',
        name: '클라리티',
        desc: ['기미·잡티·난치성 색소 개선', '모공·문신 제거 및 피부결 개선'],
        point: '색소, 문신, 피부결',
        image: eq(11),
    },
    {
        slug: 'pico2',
        name: '피코프락셀',
        desc: ['피코 레이저 기반 저자극 흉터 케어', '미세 빔 활용 모공 타이트닝'],
        point: '모공, 흉터, 재생 시술',
        image: eq(12),
    },
    {
        slug: 'ulthera',
        name: '울쎄라',
        desc: ['고강도 초음파 리프팅', '처진 피부 탄력 개선 및 윤곽 리프팅'],
        point: '탄력, 리프팅, 이중턱',
        image: eq(13),
    },
    {
        slug: 'onda',
        name: '온다',
        desc: ['마이크로웨이브 지방 감소', '이중턱·볼살 개선 및 탄력 강화'],
        point: '지방, 윤곽, 탄력',
        image: eq(14),
    },
    {
        slug: 'vro',
        name: '브이로',
        desc: ['피부층별 맞춤 리프팅 가능', '탄력 개선 및 얼굴 윤곽 정리'],
        point: '리프팅, 탄력,윤곽',
        image: eq(15),
    },
    {
        slug: 'clarity2',
        name: '클라리티2',
        desc: ['모근 깊이별 맞춤형 레이저 제모', '지능형 냉각 시스템으로 통증 최소화'],
        point: '모발, 통증, 맞춤 제모',
        image: eq(16),
    },
    {
        slug: 'aqua',
        name: '아쿠아필',
        desc: ['모공 속 피지 및 블랙헤드 제거', '수분 공급 및 각질 개선 효과'],
        point: '피지, 모공, 수분',
        image: eq(17),
    },
    {
        slug: 'cryocell',
        name: '크라이오셀',
        desc: ['냉동 이온 침투로 피부 진정 및 쿨링', '시술 후 자극된 피부 장벽 재생'],
        point: '진정, 붉은기, 쿨링',
        image: eq(18),
    },
    {
        slug: 'ionzyme',
        name: '이온자임·이온토 관리',
        desc: ['고농도 비타민 침투로 강력한 미백 효과', '멜라닌 형성 억제 및 잡티 개선'],
        point: '미백, 비타민, 잡티',
        image: eq(19),
    },
];
export const findDevices = (slugs: string[]) =>
    slugs.map((s) => devices.find((d) => d.slug === s)).filter(Boolean) as Device[];

export const solutionTabs = [
    { key: 'pigment', label: '색소', devices: ['lipot', 'excelv', 'spectra', 'pico'] },
    { key: 'lifting', label: '리프팅', devices: ['ulthera', 'shrink', 'onda', 'thermage'] },
    { key: 'acne', label: '여드름', devices: ['agnes', 'goldptt', 'aqua', 'excelv'] },
    { key: 'redness', label: '주사/홍조', devices: ['excelv', 'rejuran', 'juvelook', 'ldm'] },
];

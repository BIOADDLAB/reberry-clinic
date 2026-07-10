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
    { slug: 'excelv', name: '엑셀V', desc: ['', ''], point: '', image: eq(2) },
    { slug: 'synerjet', name: '시너젯', desc: ['', ''], point: '', image: eq(3) },
    { slug: 'revinas', name: '레비나스', desc: ['', ''], point: '', image: eq(4) },
    { slug: 'shrink', name: '슈링크 유니버스', desc: ['', ''], point: '', image: eq(5) },
    { slug: 'inmode', name: '인모드', desc: ['', ''], point: '', image: eq(6) },
    { slug: 'titanium', name: '티타늄', desc: ['', ''], point: '', image: eq(7) },
    { slug: 'lipot', name: '리팟', desc: ['', ''], point: '', image: eq(8) },
    { slug: 'spectra', name: '헐리우드 스펙트라', desc: ['', ''], point: '', image: eq(9) },
    { slug: 'pico', name: '피코 플러스', desc: ['', ''], point: '', image: eq(10) },
    { slug: 'clarity', name: '클라리티', desc: ['', ''], point: '', image: eq(11) },
    {
        slug: 'pico2',
        name: '피코프락셀',
        desc: ['피코 레이저 기반 저자극 흉터 케어', '미세 빔 활용 모공 타이트닝'],
        point: '모공, 흉터, 재생 시술',
        image: eq(12),
    },
    { slug: 'ulthera', name: '울쎄라', desc: ['', ''], point: '', image: eq(13) },
    { slug: 'onda', name: '온다', desc: ['', ''], point: '', image: eq(14) },
    { slug: 'vro', name: '브이로', desc: ['', ''], point: '', image: eq(15) },
    { slug: 'clarity2', name: '클라리티2', desc: ['', ''], point: '', image: eq(16) },
    { slug: 'aqua', name: '아쿠아필', desc: ['', ''], point: '', image: eq(17) },
    { slug: 'cryocell', name: '크라이오셀', desc: ['', ''], point: '', image: eq(18) },
    { slug: 'ionzyme', name: '이온자임·이온토 관리', desc: ['', ''], point: '', image: eq(19) },
];
export const findDevices = (slugs: string[]) =>
    slugs.map((s) => devices.find((d) => d.slug === s)).filter(Boolean) as Device[];

// 메인 SOLUTION 탭 (시안: 색소 / 리프팅 / 여드름 / 주사·홍조)
export const solutionTabs = [
    { key: 'pigment', label: '색소', devices: ['lipot', 'excelv', 'spectra', 'pico'] },
    { key: 'lifting', label: '리프팅', devices: ['ulthera', 'shrink', 'onda', 'thermage'] },
    { key: 'acne', label: '여드름', devices: ['agnes', 'goldptt', 'aqua', 'excelv'] },
    { key: 'redness', label: '주사/홍조', devices: ['excelv', 'rejuran', 'juvelook', 'ldm'] },
];

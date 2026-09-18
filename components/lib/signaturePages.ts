/* #COMPONENTS: 시그니처 시술 3개 페이지 문구 (2026.09 리뉴얼 시안 기준)
   - 페이지 구성은 components/signature/SignaturePage.tsx 하나를 같이 쓰고, 달라지는 문구·이미지만 여기 둔다.
   - slug 는 관리자(전후사진·칼럼) Firestore 저장 키. 예전 값(booster / acne / redness)을 그대로 둔다.
   - 공개 URL 은 route (volume-booster / chin-filler / under-eye). 옛 주소는 next.config 에서 301.
   - 문법: "**굵게**" / "\n" 줄바꿈. 긴 본문의 \n 은 태블릿(md) 이상에서만 줄을 바꾼다.
   - 번역은 이 파일 안에서 끝낸다(messages/*.json 을 건드리지 않도록 분리). 서버에서만 읽으므로 번들에 안 실린다. */

import type { AppLocale } from '@/i18n/locales';

export const SIGNATURE_SLUGS = ['booster', 'acne', 'redness'] as const;
export type SignatureSlug = (typeof SIGNATURE_SLUGS)[number];

export const SIGNATURE_ROUTES = {
    booster: 'volume-booster',
    acne: 'chin-filler',
    redness: 'under-eye',
} as const satisfies Record<SignatureSlug, string>;

export type SignatureRoute = (typeof SIGNATURE_ROUTES)[SignatureSlug];

export const isSignatureSlug = (slug: string): slug is SignatureSlug =>
    (SIGNATURE_SLUGS as readonly string[]).includes(slug);

export const isSignatureRoute = (route: string): route is SignatureRoute =>
    (Object.values(SIGNATURE_ROUTES) as string[]).includes(route);

export const signatureRoute = (slug: SignatureSlug): SignatureRoute => SIGNATURE_ROUTES[slug];

export const signatureSlugFromRoute = (route: string): SignatureSlug | undefined =>
    (SIGNATURE_SLUGS as readonly SignatureSlug[]).find((slug) => SIGNATURE_ROUTES[slug] === route);

export const signaturePath = (slug: SignatureSlug) => `/treatments/signature/${SIGNATURE_ROUTES[slug]}`;

/** 예전 공개 주소 → 지금 주소. next.config 리다이렉트가 여기를 본다. */
export const SIGNATURE_LEGACY_REDIRECTS = [
    { from: 'booster', to: SIGNATURE_ROUTES.booster },
    { from: 'acne', to: SIGNATURE_ROUTES.acne },
    { from: 'redness', to: SIGNATURE_ROUTES.redness },
    { from: 'pigment', to: SIGNATURE_ROUTES.booster },
    { from: 'lifting', to: SIGNATURE_ROUTES.booster },
] as const;

/** 공통 이미지 — public/images 에 있어야 한다 */
export const SIGNATURE_IMAGES = {
    hero: '/images/bg-sig-banner.jpg',
    recommend: '/images/bg-sig.jpg',
} as const;

/* 인물 사진 3장은 그림 안에 설명 글자("앞볼 평면선" 등)가 박혀 있어서 언어마다 파일이 다르다.
   한국어만 나라 표시 없이 img-sig-01, 나머지는 img-sig-{나라}-01 규칙이다.
   일본어 파일 이름은 ja 가 아니라 jp — 받은 파일명을 그대로 쓴다. */
const PORTRAIT_TAG: Record<AppLocale, string> = { ko: '', en: 'en-', ja: 'jp-', zh: 'zh-' };

export const signaturePortraits = (locale: AppLocale): string[] =>
    [1, 2, 3].map((n) => `/images/img-sig-${PORTRAIT_TAG[locale]}0${n}.jpg`);

/** More View 이동 주소 (전후사진 페이지) */
export const SIGNATURE_BA_MORE_HREF = '/reviews';

/** 시그니처 페이지 전후사진은 시안대로 3칸 — 관리자 안내문도 이 값을 같이 쓴다 */
export const SIGNATURE_BA_VISIBLE = 3;

/** 스토리 이미지 — 파일 크기(2배수)를 그대로 적어 두면 페이지마다 높이가 시안처럼 달라진다.
    #ISSUE: 이미지는 테두리 없는 원본이고, 시안의 3px 크림 테두리는 SignaturePage 에서 CSS 로 준다.
            같은 파일명으로 이미지를 바꾸면 Next 이미지 최적화 캐시(4시간)와 브라우저 캐시가 옛 이미지를 계속 보여 준다.
            → 이미지를 바꿀 때는 파일명을 새로 짓고 여기 경로만 고친다. */
const STORY_IMAGE: Record<SignatureSlug, { src: string; width: number; height: number }> = {
    booster: { src: '/images/img-sig-story-volume.jpg', width: 852, height: 972 },
    acne: { src: '/images/img-sig-story-chin.jpg', width: 852, height: 930 },
    redness: { src: '/images/img-sig-story-eye.jpg', width: 852, height: 950 },
};

interface PageCopy {
    heroTitle: string;
    heroSub: string;
    /** 스토리 제목 · 칼럼/전후사진 제목에 들어가는 시술명 */
    name: string;
    storySub: string;
    storyBody: [string, string];
    whyTitle: string;
    why: string[];
    recommend: string[];
    closingLead: string;
    closingStatement: string;
}

interface CommonCopy {
    introHeadline: string;
    introQuote: string;
    introBody: [string, string];
    portraitAlt: string;
    columnTitle: string;
    baTitle: string;
    recommendTitle: string;
    closingSub: string;
    closingEnd: string;
}

export type SignatureContent = PageCopy &
    CommonCopy & {
        slug: SignatureSlug;
        locale: AppLocale;
        storyImage: { src: string; width: number; height: number };
    };

/* ───────────────────────────── 공통 문구 ───────────────────────────── */

const COMMON: Record<AppLocale, CommonCopy> = {
    ko: {
        introHeadline: '얼굴의 한 부분이 아닌, **전체적인 균형을 봅니다**',
        introQuote: '고전미인 · AI상 미인 · 현대미인은\n윤곽선의 일정한 규칙을 따르고 있습니다',
        introBody: [
            '부족한 턱끝, 꺼진 얼굴의 굴곡, 눈밑의 돌출과 고랑 같은 작은 불균형은 얼굴 전체의 인상을 좌우합니다.\n이러한 부분을 섬세하게 교정하면 이상적인 윤곽에 한층 가까워질 수 있습니다.',
            '리베리의 시그니처 시술은 획일적인 방식이 아닌,\n얼굴의 골격과 지방 분포, 피부 상태와 비율을 분석해 필요한 부분만 정교하게 교정합니다.',
        ],
        portraitAlt: '앞볼 평면선과 외안면 S곡선을 표시한 모델 사진',
        columnTitle: '**{name}** 이야기',
        baTitle: '**{name}** 전후사진',
        recommendTitle: '이런 분께 권합니다',
        closingSub: '과한 변화가 아닌 자연스럽게 예뻐진 인상.\n시술한 티보다 얼굴 전체의 균형이 먼저 보이는 결과.',
        closingEnd: '리베리 시그니처 시술이 추구하는 방향입니다.',
    },
    en: {
        introHeadline: 'Not just one part of the face, **but its overall balance**',
        introQuote: 'Classic beauties, AI-style beauties and modern beauties\nall follow consistent rules in their facial contours',
        introBody: [
            'Small imbalances such as a short chin, hollow contours, or under-eye bulges and grooves shape the impression of the whole face. Refining these areas with care brings you much closer to an ideal contour.',
            'RE:BERRY signature treatments are not one-size-fits-all. We analyze facial structure, fat distribution, skin condition and proportions, then precisely correct only what is needed.',
        ],
        portraitAlt: 'Model photo marked with the front-cheek plane line and the outer-face S-curve',
        columnTitle: 'Stories about **{name}**',
        baTitle: '**{name}** Before & After',
        recommendTitle: 'Recommended for',
        closingSub:
            'A naturally refined impression, not an overdone change.\nResults where the balance of the whole face shows before any sign of treatment.',
        closingEnd: 'This is what RE:BERRY signature treatments aim for.',
    },
    ja: {
        introHeadline: '顔の一部ではなく、**全体のバランスを見ます**',
        introQuote: '古典美人・AI系美人・現代美人は\n輪郭線の一定のルールに従っています',
        introBody: [
            '短い顎先、へこんだ顔の起伏、目の下のふくらみや溝といった小さなアンバランスは、顔全体の印象を左右します。こうした部分を繊細に整えることで、理想的な輪郭により近づくことができます。',
            'RE:BERRYのシグネチャー施術は画一的な方法ではなく、顔の骨格や脂肪の分布、肌の状態と比率を分析し、必要な部分だけを精密に整えます。',
        ],
        portraitAlt: '前頬の平面ラインと外側のSカーブを示したモデル写真',
        columnTitle: '**{name}**のお話',
        baTitle: '**{name}** ビフォーアフター',
        recommendTitle: 'こんな方におすすめです',
        closingSub: '過度な変化ではなく、自然にきれいになった印象。\n施術感よりも、顔全体のバランスが先に見える仕上がり。',
        closingEnd: 'それがRE:BERRYのシグネチャー施術が目指す方向です。',
    },
    zh: {
        introHeadline: '不只看脸的某一部分，**而是看整体的平衡**',
        introQuote: '古典美人 · AI系美人 · 现代美人\n都遵循着轮廓线的一定规律',
        introBody: [
            '下巴不足、面部凹陷、眼下膨出与沟槽等细小的不平衡，会左右整张脸的印象。细致地矫正这些部位，便能更加接近理想的轮廓。',
            'RE:BERRY的招牌疗程并非千篇一律，而是分析面部骨骼、脂肪分布、皮肤状态与比例，只精准矫正需要的部位。',
        ],
        portraitAlt: '标示前颊平面线与外侧面S曲线的模特照片',
        columnTitle: '**{name}**的故事',
        baTitle: '**{name}**前后对比',
        recommendTitle: '推荐给这样的您',
        closingSub: '不是夸张的改变，而是自然变美的印象。\n比起治疗痕迹，更先看到整张脸的平衡。',
        closingEnd: '这正是RE:BERRY招牌疗程追求的方向。',
    },
};

/* ───────────────────────────── 페이지별 문구 ───────────────────────────── */

const PAGES: Record<SignatureSlug, Record<AppLocale, PageCopy>> = {
    /* 리베리 볼륨부스터 */
    booster: {
        ko: {
            heroTitle: '리베리 볼륨부스터',
            heroSub: '쥬베룩 볼륨 기반 복합 볼륨 시술',
            name: '리베리 볼륨부스터',
            storySub: '채우기만 하는 볼륨이 아닌,\n얼굴의 선과 흐름을 되살리는 볼륨',
            storyBody: [
                '얼굴의 볼륨은 많고 적음보다 필요한 곳에 적절하게 위치하는 것이 중요합니다.\n앞볼과 옆볼이 꺼지면 얼굴의 굴곡이 끊어지고,\n피부 처짐과 팔자·눈밑 고랑이 더욱 도드라져 보일 수 있습니다.',
                '리베리 볼륨부스터는 쥬베룩 볼륨을 기반으로 자가 콜라겐 생착률을 높인 시그니처 시술입니다.\n단순히 꺼진 부위를 채우는 것이 아니라, 얼굴의 굴곡과 빛의 흐름을 분석해\n필요한 곳에 자연스러운 볼륨과 선을 연결합니다.',
            ],
            whyTitle: '리베리 볼륨부스터는 다릅니다',
            why: [
                '얼굴 전체의 꺼짐과 비율을 고려한 맞춤 디자인',
                '쥬베룩 볼륨과 히알루론산의 장점을 활용한 복합 시술',
                '물성 개선을 통한 자가 콜라겐 생착률을 높인 시술',
                '특정 부위만 불룩해 보이지 않는 자연스러운 볼륨 연결',
                '앞볼·옆볼·관자·팔자 등 개인별로 다른 노화 지점에 맞춘 설계',
                '피부결과 탄력, 입체감을 함께 고려한 접근',
            ],
            recommend: [
                '얼굴이 전체적으로 꺼지고 평면적으로 보이는 분',
                '앞볼이나 옆볼이 꺼져 피곤해 보이는 분',
                '볼륨은 원하지만 필러 특유의 인위적인 느낌이 부담스러운 분',
                '얼굴의 굴곡과 입체감을 자연스럽게 되살리고 싶은 분',
                '피부 탄력과 볼륨을 함께 개선하고 싶은 분',
            ],
            closingLead: '많이 채우는 것이 아니라',
            closingStatement: '**필요한 곳을 정확하게 연결하는 것**이 중요합니다.',
        },
        en: {
            heroTitle: 'RE:BERRY Volume Booster',
            heroSub: 'A combination volume treatment based on Juvelook Volume',
            name: 'RE:BERRY Volume Booster',
            storySub: 'Not volume that simply fills,\nbut volume that restores the lines and flow of the face',
            storyBody: [
                'What matters is not how much volume a face has, but whether it sits where it is needed. When the front and side cheeks hollow out, facial contours break, and sagging skin, nasolabial folds and under-eye grooves can look more pronounced.',
                'The RE:BERRY Volume Booster is a signature treatment based on Juvelook Volume, designed to improve how well your own collagen is retained. Rather than simply filling hollow areas, we analyze facial contours and the way light falls, then connect natural volume and lines where they are needed.',
            ],
            whyTitle: 'What makes the RE:BERRY Volume Booster different',
            why: [
                'A custom design that considers hollowing and proportions across the whole face',
                'A combination treatment that uses the strengths of Juvelook Volume and hyaluronic acid',
                'Improved material properties for better retention of your own collagen',
                'Natural volume transitions, so no single area looks puffy',
                'Planning tailored to individual aging points such as the cheeks, temples and nasolabial folds',
                'An approach that considers skin texture, elasticity and dimension together',
            ],
            recommend: [
                'Your face looks hollow and flat overall',
                'Hollow front or side cheeks make you look tired',
                'You want volume without the artificial look of filler',
                'You want to naturally restore contours and dimension',
                'You want to improve elasticity and volume together',
            ],
            closingLead: 'It is not about filling more.',
            closingStatement: '**Precisely connecting the areas that need it** is what matters.',
        },
        ja: {
            heroTitle: 'RE:BERRYボリュームブースター',
            heroSub: 'ジュベルックボリュームをベースにした複合ボリューム施術',
            name: 'RE:BERRYボリュームブースター',
            storySub: '満たすだけのボリュームではなく、\n顔のラインと流れをよみがえらせるボリューム',
            storyBody: [
                '顔のボリュームは多い少ないよりも、必要な場所に適切に位置していることが大切です。前頬や横頬がこけると顔の起伏が途切れ、肌のたるみやほうれい線・目の下の溝がより目立って見えることがあります。',
                'RE:BERRYボリュームブースターは、ジュベルックボリュームをベースに自己コラーゲンの定着率を高めたシグネチャー施術です。単にへこんだ部分を埋めるのではなく、顔の起伏と光の流れを分析し、必要な場所に自然なボリュームとラインをつなげます。',
            ],
            whyTitle: 'RE:BERRYボリュームブースターはここが違います',
            why: [
                '顔全体のこけ具合と比率を考慮したオーダーメイドデザイン',
                'ジュベルックボリュームとヒアルロン酸の長所を生かした複合施術',
                '物性の改善により自己コラーゲンの定着率を高めた施術',
                '特定の部位だけがふくらんで見えない自然なボリュームのつながり',
                '前頬・横頬・こめかみ・ほうれい線など一人ひとり異なるエイジングポイントに合わせた設計',
                '肌のキメと弾力、立体感をあわせて考えたアプローチ',
            ],
            recommend: [
                '顔全体がこけて平面的に見える方',
                '前頬や横頬がこけて疲れて見える方',
                'ボリュームは欲しいけれど、フィラー特有の人工的な感じが気になる方',
                '顔の起伏と立体感を自然に取り戻したい方',
                '肌の弾力とボリュームを一緒に改善したい方',
            ],
            closingLead: 'たくさん満たすことではなく',
            closingStatement: '**必要な場所を正確につなげること**が大切です。',
        },
        zh: {
            heroTitle: 'RE:BERRY丰盈焕活',
            heroSub: '以Juvelook Volume为基础的复合丰盈疗程',
            name: 'RE:BERRY丰盈焕活',
            storySub: '不只是填充的容量，\n而是重现面部线条与流动感的容量',
            storyBody: [
                '面部容量的关键不在于多少，而在于是否恰当地位于需要的位置。前颊与侧颊凹陷时，面部的起伏会被打断，皮肤松弛、法令纹与眼下沟槽也会显得更加明显。',
                'RE:BERRY丰盈焕活以Juvelook Volume为基础，是提高自体胶原蛋白留存率的招牌疗程。不只是填补凹陷部位，而是分析面部起伏与光线的流动，在需要的位置自然衔接容量与线条。',
            ],
            whyTitle: 'RE:BERRY丰盈焕活的与众不同',
            why: [
                '综合考虑全脸凹陷与比例的定制设计',
                '结合Juvelook Volume与玻尿酸优点的复合疗程',
                '通过改善材料特性，提高自体胶原蛋白留存率',
                '不会让特定部位显得鼓胀的自然容量衔接',
                '针对前颊、侧颊、太阳穴、法令纹等因人而异的老化部位进行设计',
                '兼顾肤质、弹性与立体感的整体方案',
            ],
            recommend: [
                '整张脸凹陷、显得扁平的人',
                '前颊或侧颊凹陷、看起来疲惫的人',
                '想要容量，但担心填充剂不自然感的人',
                '想自然找回面部起伏与立体感的人',
                '想同时改善皮肤弹性与容量的人',
            ],
            closingLead: '不是填得越多越好，',
            closingStatement: '**精准衔接需要的部位**才是关键。',
        },
    },

    acne: {
        ko: {
            heroTitle: '비수술 턱끝전진 필러',
            heroSub: '무턱을 입체적으로 개선하는 구조적 필러 시술',
            name: '비수술 턱끝전진 필러',
            storySub: '귀티 나는 얼굴의 완성은 턱끝입니다',
            storyBody: [
                '턱끝은 작은 면적이지만 얼굴의 비율과 윤곽을 완성하는 중요한 요소입니다.\n턱끝이 짧거나 뒤로 들어가 있으면 얼굴이 넓고 처져 보이거나,\n입과 광대가 상대적으로 돌출되어 보일 수 있습니다.',
                '리베리의 비수술 턱끝전진 필러는 단순히 턱끝을 길고 뾰족하게 만드는 시술이 아닙니다.\n정면에서는 자연스러운 폭과 형태를, 측면에서는 부족한 돌출을 보완해\n입가부터 턱끝까지 이어지는 자연스러운 곡선을 완성합니다.',
            ],
            whyTitle: '리베리의 턱끝전진 필러는 다릅니다',
            why: [
                '정면과 측면을 함께 고려한 입체적인 디자인',
                '얼굴 길이와 하관의 폭에 맞춘 자연스러운 비율',
                '턱끝만 튀어나오거나 지나치게 뾰족해 보이지 않는 결과',
                '필요에 따라 턱끝 근육과 주변 윤곽까지 함께 고려한 복합 설계',
            ],
            recommend: [
                '턱끝이 짧거나 뒤로 들어가 보이는 분',
                '얼굴이 둥글고 넓어 보이는 분',
                '입이 상대적으로 돌출돼 보이는 분',
                '턱선이 흐릿하고 하관이 답답해 보이는 분',
                '과하게 뾰족하지 않은 자연스러운 턱끝을 원하는 분',
            ],
            closingLead: '예쁜 턱끝보다 중요한 것은',
            closingStatement: '**내 얼굴에 어울리는 턱끝**입니다.',
        },
        en: {
            heroTitle: 'Non-Surgical Chin Augmentation Filler',
            heroSub: 'A structural filler treatment that adds dimension to a recessed chin',
            name: 'Non-Surgical Chin Augmentation Filler',
            storySub: 'An elegant face is completed by the chin',
            storyBody: [
                'The chin is a small area, but it is key to completing facial proportions and contours. When the chin is short or set back, the face can look wider and saggier, and the mouth and cheekbones can appear to protrude.',
                'RE:BERRY Non-Surgical Chin Augmentation Filler is not about making the chin long and pointed. It shapes a natural width and form from the front and adds the projection that is lacking from the side, completing a natural curve from the mouth to the tip of the chin.',
            ],
            whyTitle: 'What makes RE:BERRY chin filler different',
            why: [
                'A three-dimensional design that considers both front and side views',
                'Natural proportions matched to face length and lower-face width',
                'Results where the chin neither juts out nor looks overly pointed',
                'A combined plan that also considers the chin muscles and surrounding contours when needed',
            ],
            recommend: [
                'Your chin looks short or set back',
                'Your face looks round and wide',
                'Your mouth appears relatively protruded',
                'Your jawline looks blurry and your lower face looks heavy',
                'You want a natural chin that is not overly pointed',
            ],
            closingLead: 'What matters more than a pretty chin',
            closingStatement: 'is **a chin that suits your face**.',
        },
        ja: {
            heroTitle: '非手術の顎先前進フィラー',
            heroSub: '引っ込んだ顎を立体的に改善する構造的フィラー施術',
            name: '非手術の顎先前進フィラー',
            storySub: '品のある顔立ちの仕上げは、顎先です',
            storyBody: [
                '顎先は小さな面積ですが、顔の比率と輪郭を完成させる大切な要素です。顎先が短かったり後ろに引っ込んでいたりすると、顔が広くたるんで見えたり、口元や頬骨が相対的に突出して見えたりすることがあります。',
                'RE:BERRYの非手術の顎先前進フィラーは、単に顎先を長く尖らせる施術ではありません。正面からは自然な幅と形を、横顔では足りない突出感を補い、口元から顎先までつながる自然な曲線を完成させます。',
            ],
            whyTitle: 'RE:BERRYの顎先前進フィラーはここが違います',
            why: [
                '正面と横顔を一緒に考えた立体的なデザイン',
                '顔の長さと下顔面の幅に合わせた自然な比率',
                '顎先だけが飛び出したり、尖りすぎて見えたりしない仕上がり',
                '必要に応じて顎先の筋肉や周りの輪郭まで考慮した複合設計',
            ],
            recommend: [
                '顎先が短い、または引っ込んで見える方',
                '顔が丸く広く見える方',
                '口元が相対的に突出して見える方',
                'フェイスラインがぼやけて下顔面が重たく見える方',
                '尖りすぎない自然な顎先を望む方',
            ],
            closingLead: 'きれいな顎先よりも大切なのは',
            closingStatement: '**自分の顔に似合う顎先**です。',
        },
        zh: {
            heroTitle: '非手术下巴前移填充',
            heroSub: '立体改善后缩下巴的结构性填充疗程',
            name: '非手术下巴前移填充',
            storySub: '高级感面容的完成，在于下巴',
            storyBody: [
                '下巴面积虽小，却是完成面部比例与轮廓的重要元素。下巴较短或后缩时，脸会显得宽大、松垮，嘴部与颧骨也会相对显得突出。',
                'RE:BERRY的非手术下巴前移填充，并不只是把下巴做得又长又尖。正面打造自然的宽度与形态，侧面补足不足的突出度，完成从嘴角到下巴尖自然衔接的曲线。',
            ],
            whyTitle: 'RE:BERRY下巴前移填充的与众不同',
            why: [
                '同时考虑正面与侧面的立体设计',
                '依据脸长与下颌宽度打造的自然比例',
                '下巴不会单独突出，也不会显得过尖',
                '必要时兼顾下巴肌肉与周边轮廓的复合设计',
            ],
            recommend: [
                '下巴较短或看起来后缩的人',
                '脸看起来圆而宽的人',
                '嘴部显得相对突出的人',
                '下颌线模糊、下半脸显得沉闷的人',
                '想要不过尖、自然下巴的人',
            ],
            closingLead: '比漂亮的下巴更重要的，',
            closingStatement: '是**适合自己脸型的下巴**。',
        },
    },

    /* 비수술 눈밑 지방 재배치 */
    redness: {
        ko: {
            heroTitle: '비수술 눈밑 지방 재배치',
            heroSub: '눈밑 돌출과 꺼짐을 함께 개선하는 복합 시술',
            name: '비수술 눈밑 지방 재배치',
            storySub: '돌출을 줄이고,\n꺼진 고랑은 자연스럽게 채웁니다',
            storyBody: [
                '눈밑이 피곤해 보이는 이유는 단순히 지방의 돌출 때문만은 아닙니다.\n눈밑 지방 아래 눈물고랑이 함께 꺼지면 돌출과 그림자의 대비가 커져\n눈밑이 더욱 도드라져 보일 수 있습니다.',
                '리베리의 비수술 눈밑지방재배치는 눈밑의 돌출과 꺼짐을 함께 개선하는 복합 시술입니다.\n돌출 부위는 개인의 눈밑 구조와 피부 상태에 맞춰 정돈하고, 꺼진 고랑은\n쥬베룩 볼륨으로 섬세하게 보완해 눈밑 전체가 한결 평평하고 부드럽게 이어지도록 합니다.',
            ],
            whyTitle: '리베리의 비수술 눈밑지방재배치는 다릅니다',
            why: [
                '눈밑 돌출과 눈물고랑을 함께 분석',
                '돌출 부위와 꺼진 부위에 서로 다른 방식으로 접근',
                '눈밑이 불룩하거나 무거워 보이지 않도록 최소한의 볼륨 사용',
                '피부 두께와 지방의 형태에 맞춘 세밀한 시술',
                '인위적으로 채운 느낌보다 경계와 그림자를 완화하는 데 집중',
            ],
            recommend: [
                '눈밑 지방 돌출과 눈물고랑이 함께 있는 분',
                '눈밑 그림자 때문에 늘 피곤해 보이는 분',
                '눈밑 필러 후 불룩해질까 걱정되는 분',
                '수술은 부담스럽지만 자연스러운 개선을 원하는 분',
                '눈밑의 경계와 굴곡을 부드럽게 정돈하고 싶은 분',
            ],
            closingLead: '눈밑을 무조건 채우는 것이 아니라',
            closingStatement: '**돌출과 꺼짐의 경계**를 함께 다루어야 합니다.',
        },
        en: {
            heroTitle: 'Non-Surgical Under-Eye Fat Repositioning',
            heroSub: 'A combination treatment for under-eye bulges and hollows',
            name: 'Non-Surgical Under-Eye Fat Repositioning',
            storySub: 'Reducing bulges\nand naturally filling hollow grooves',
            storyBody: [
                'Tired-looking under-eyes are not caused by protruding fat alone. When the tear trough beneath the fat also hollows, the contrast between bulge and shadow grows, making the area stand out even more.',
                'RE:BERRY Non-Surgical Under-Eye Fat Repositioning is a combination treatment that improves under-eye bulges and hollows together. Bulging areas are refined to suit each person’s under-eye structure and skin condition, while hollow grooves are delicately supplemented with Juvelook Volume so the whole area flows more smoothly and evenly.',
            ],
            whyTitle: 'What makes RE:BERRY under-eye repositioning different',
            why: [
                'Under-eye bulges and tear troughs are analyzed together',
                'Different approaches for bulging areas and hollow areas',
                'Minimal volume, so the under-eyes never look puffy or heavy',
                'Detailed treatment matched to skin thickness and fat shape',
                'A focus on softening edges and shadows rather than an artificially filled look',
            ],
            recommend: [
                'You have both under-eye fat bulges and tear troughs',
                'Under-eye shadows always make you look tired',
                'You worry about puffiness after under-eye filler',
                'You want natural improvement without surgery',
                'You want to softly refine the edges and contours under your eyes',
            ],
            closingLead: 'It is not about simply filling the under-eyes.',
            closingStatement: '**The boundary between bulges and hollows** must be treated together.',
        },
        ja: {
            heroTitle: '非手術の目の下脂肪再配置',
            heroSub: '目の下のふくらみとくぼみを同時に改善する複合施術',
            name: '非手術の目の下脂肪再配置',
            storySub: 'ふくらみを抑え、\nくぼんだ溝は自然に満たします',
            storyBody: [
                '目の下が疲れて見えるのは、脂肪のふくらみだけが原因ではありません。目の下の脂肪の下にある溝（ティアトラフ）も一緒にくぼむと、ふくらみと影のコントラストが大きくなり、目の下がより目立って見えることがあります。',
                'RE:BERRYの非手術の目の下脂肪再配置は、目の下のふくらみとくぼみを同時に改善する複合施術です。ふくらんだ部分は一人ひとりの目の下の構造と肌の状態に合わせて整え、くぼんだ溝はジュベルックボリュームで繊細に補い、目の下全体がよりなめらかにつながるようにします。',
            ],
            whyTitle: 'RE:BERRYの非手術の目の下脂肪再配置はここが違います',
            why: [
                '目の下のふくらみとティアトラフを一緒に分析',
                'ふくらんだ部分とくぼんだ部分に、それぞれ異なる方法でアプローチ',
                '目の下がふくらんだり重く見えたりしないよう最小限のボリュームを使用',
                '肌の厚みと脂肪の形に合わせた緻密な施術',
                '人工的に満たした感じよりも、境目と影をやわらげることに集中',
            ],
            recommend: [
                '目の下の脂肪のふくらみとティアトラフが両方ある方',
                '目の下の影のせいで、いつも疲れて見える方',
                '目の下のフィラー後にふくらまないか心配な方',
                '手術は負担だけれど自然な改善を望む方',
                '目の下の境目と起伏をやわらかく整えたい方',
            ],
            closingLead: '目の下をただ満たすのではなく',
            closingStatement: '**ふくらみとくぼみの境目**を一緒にケアする必要があります。',
        },
        zh: {
            heroTitle: '非手术眼下脂肪重塑',
            heroSub: '同时改善眼下膨出与凹陷的复合疗程',
            name: '非手术眼下脂肪重塑',
            storySub: '减少膨出，\n自然填补凹陷的沟槽',
            storyBody: [
                '眼下看起来疲惫，并不只是因为脂肪膨出。当眼下脂肪下方的泪沟一同凹陷时，膨出与阴影的对比会加大，使眼下显得更加明显。',
                'RE:BERRY的非手术眼下脂肪重塑，是同时改善眼下膨出与凹陷的复合疗程。膨出部位依据个人的眼下结构与皮肤状态进行整理，凹陷的沟槽则以Juvelook Volume细致补充，让整个眼下更加平整、柔和地衔接。',
            ],
            whyTitle: 'RE:BERRY非手术眼下脂肪重塑的与众不同',
            why: [
                '同时分析眼下膨出与泪沟',
                '针对膨出部位与凹陷部位采用不同的方式',
                '使用最少的容量，避免眼下显得鼓胀或沉重',
                '依据皮肤厚度与脂肪形态进行的精细治疗',
                '比起人为填充感，更专注于柔化交界与阴影',
            ],
            recommend: [
                '同时有眼下脂肪膨出与泪沟的人',
                '因眼下阴影而总是显得疲惫的人',
                '担心眼下填充后变得鼓胀的人',
                '对手术有顾虑，但希望自然改善的人',
                '想柔和整理眼下交界与起伏的人',
            ],
            closingLead: '不是一味填充眼下，',
            closingStatement: '而是要同时处理**膨出与凹陷的交界**。',
        },
    },
};

/** 페이지 한 장에 필요한 문구를 언어에 맞춰 조립한다. 없는 언어는 한국어로 대체 */
export function getSignatureContent(slug: SignatureSlug, locale: string): SignatureContent {
    const lang: AppLocale = locale in COMMON ? (locale as AppLocale) : 'ko';
    return {
        slug,
        locale: lang,
        storyImage: STORY_IMAGE[slug],
        ...COMMON[lang],
        ...PAGES[slug][lang],
    };
}

/** 관리자 칼럼 화면에서 시그니처 페이지 칼럼 제목 미리보기에 쓴다 */
export const signatureColumnTitle = (slug: SignatureSlug) => {
    const content = getSignatureContent(slug, 'ko');
    return content.columnTitle.replace('{name}', content.name);
};

/** 공식 페이지명(히어로 제목). GNB·관리자·탭 제목은 여기 값을 쓴다. */
export const signaturePageName = (slug: SignatureSlug, locale: string = 'ko') =>
    getSignatureContent(slug, locale).heroTitle;

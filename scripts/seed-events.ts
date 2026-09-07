import { collection, doc, getDocs, setDoc, terminate } from 'firebase/firestore';
import { db } from '../components/lib/firebase';

async function main() {
    const eventsCollection = collection(db, 'events');
    const existing = await getDocs(eventsCollection);
    if (!existing.empty) {
        console.log(`events collection already has ${existing.size} documents; seed skipped`);
        await terminate(db);
        return;
    }

    const now = new Date().toISOString();
    const events = [
        {
            id: 'event-01',
            imageUrl: '/images/ev-01.jpg',
            alwaysOn: true,
            startDate: '',
            endDate: '',
            category: '리프팅',
            title: '첫 방문 이벤트',
            description: '첫 방문 고객을 위한 주요 시술 혜택을 확인해 보세요.',
            originalPrice: null,
            salePrice: null,
        },
        {
            id: 'event-02',
            imageUrl: '/images/ev-02.jpg',
            alwaysOn: true,
            startDate: '',
            endDate: '',
            category: '스킨케어',
            title: '맞춤 피부관리 이벤트',
            description: '현재 피부 고민에 맞는 관리 프로그램을 상담해 드립니다.',
            originalPrice: null,
            salePrice: null,
        },
        {
            id: 'event-03',
            imageUrl: '/images/ev-03.jpg',
            alwaysOn: true,
            startDate: '',
            endDate: '',
            category: '스킨부스터',
            title: '5세대 스킨부스터 리투오',
            description: '리투오 런칭 혜택과 추천 시술 계획을 확인해 보세요.',
            originalPrice: null,
            salePrice: null,
        },
    ];

    await Promise.all(
        events.map((event, sort) =>
            setDoc(doc(db, 'events', event.id), {
                title: event.title,
                imageUrl: event.imageUrl,
                alwaysOn: event.alwaysOn,
                startDate: event.startDate,
                endDate: event.endDate,
                badge: '',
                category: event.category,
                description: event.description,
                originalPrice: event.originalPrice,
                salePrice: event.salePrice,
                isPublished: true,
                sort,
                createdAt: now,
                updatedAt: now,
            }),
        ),
    );

    const result = await getDocs(eventsCollection);
    console.log(`uploaded ${events.length} events; firestore has ${result.size}`);
    await terminate(db);
}

void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

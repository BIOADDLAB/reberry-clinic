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
        { id: 'event-01', imageUrl: '/images/ev-01.jpg', title: '리베리의원 마포점 첫방문 Open Event' },
        { id: 'event-02', imageUrl: '/images/ev-02.jpg', title: '리베리의원 마포점 너를 위해 June 비했어' },
        { id: 'event-03', imageUrl: '/images/ev-03.jpg', title: '리베리의원 마포점 5세대 스킨부스터 리투오 런칭 특가' },
    ];

    await Promise.all(
        events.map((event, sort) =>
            setDoc(doc(db, 'events', event.id), {
                title: event.title,
                imageUrl: event.imageUrl,
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

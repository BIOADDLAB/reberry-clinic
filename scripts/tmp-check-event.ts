import { collection, getDocs, terminate } from 'firebase/firestore';
import { db } from '../components/lib/firebase';

async function main() {
    const snapshot = await getDocs(collection(db, 'events'));
    for (const document of snapshot.docs) {
        const data = document.data();
        if (typeof data.category === 'string' && data.category.includes('새 분류')) {
            console.log(document.id, JSON.stringify(data, null, 2));
        }
    }
    await terminate(db);
}

void main();

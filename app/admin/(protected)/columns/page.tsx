// #LINK: /app/admin/(protected)/columns/page.tsx
// #ISSUE: 칼럼 관리 — 어느 시그니처 페이지에 넣을지 선택 + 시술/기기명 + 영문명 + 제목 + 더보기 URL
'use client';

import { useEffect, useState } from 'react';
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/components/lib/firebase';

const SIGNATURE_PAGES = [
    { slug: 'pigment', label: '색소' },
    { slug: 'lifting', label: '볼륨리프팅' },
    { slug: 'booster', label: '볼륨부스터' },
    { slug: 'acne', label: '여드름' },
    { slug: 'redness', label: '홍조' },
];

interface ColDoc {
    id: string;
    title: string;
    en: string;
    text: string;
    link: string;
    slugs: string[];
    order: number;
}

export default function AdminColumnsPage() {
    const [items, setItems] = useState<ColDoc[]>([]);
    const [target, setTarget] = useState(SIGNATURE_PAGES[0].slug);
    const [deviceName, setDeviceName] = useState('');
    const [deviceNameEn, setDeviceNameEn] = useState('');
    const [title, setTitle] = useState('');
    const [link, setLink] = useState('');
    const [order, setOrder] = useState(1);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'columns'), orderBy('order'));
        return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ColDoc[]));
    }, []);

    const submit = async () => {
        if (!deviceName || !deviceNameEn || !title) return alert('시술·기기 이름/영문 이름/제목을 모두 입력하세요.');
        setBusy(true);
        try {
            await addDoc(collection(db, 'columns'), {
                title: deviceName, // 카드 상단 큰 글씨 (예: 온다리프팅)
                en: deviceNameEn, // 카드 상단 영문 (예: Onda)
                text: title, // 카드 본문 요약 문구 (예: "3mm vs 7mm\n내 얼굴엔 어떤 깊이가 맞을까?")
                link,
                slugs: [target],
                order,
            });
            setDeviceName('');
            setDeviceNameEn('');
            setTitle('');
            setLink('');
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-3xl">
            <h1 className="text-h2 font-bold text-cocoa">칼럼 관리</h1>
            <p className="mt-1 text-small text-latte">시그니처 시술 페이지의 닥터 파이톤 칼럼 카드를 등록합니다.</p>

            <div className="mt-8 rounded-2xl bg-white p-7 shadow-[0_2px_20px_rgba(69,54,45,0.06)]">
                <label className="block text-small">
                    <span className="font-semibold text-cocoa">어느 시그니처 페이지에 넣을까요?</span>
                    <select
                        value={target}
                        onChange={(e) => setTarget(e.target.value)}
                        className="mt-1.5 block w-full rounded-lg border border-cocoa/15 px-3 py-2.5"
                    >
                        {SIGNATURE_PAGES.map((p) => (
                            <option key={p.slug} value={p.slug}>
                                {p.label}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="mt-4 flex gap-4">
                    <label className="flex-1 text-small">
                        <span className="font-semibold text-cocoa">시술·기기 이름</span>
                        <input
                            placeholder="예: 온다리프팅"
                            value={deviceName}
                            onChange={(e) => setDeviceName(e.target.value)}
                            className="mt-1.5 block w-full rounded-lg border border-cocoa/15 px-3 py-2.5"
                        />
                    </label>
                    <label className="flex-1 text-small">
                        <span className="font-semibold text-cocoa">영문 이름</span>
                        <input
                            placeholder="예: Onda"
                            value={deviceNameEn}
                            onChange={(e) => setDeviceNameEn(e.target.value)}
                            className="mt-1.5 block w-full rounded-lg border border-cocoa/15 px-3 py-2.5"
                        />
                    </label>
                </div>

                <label className="mt-4 block text-small">
                    <span className="font-semibold text-cocoa">제목 (카드 본문 — \n 으로 줄바꿈)</span>
                    <textarea
                        placeholder={'예: 3mm vs 7mm\\n내 얼굴엔 어떤 깊이가 맞을까?'}
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        rows={2}
                        className="mt-1.5 block w-full rounded-lg border border-cocoa/15 px-3 py-2.5"
                    />
                </label>

                <label className="mt-4 block text-small">
                    <span className="font-semibold text-cocoa">더보기 URL (블로그 글 주소)</span>
                    <input
                        placeholder="https://blog.naver.com/..."
                        value={link}
                        onChange={(e) => setLink(e.target.value)}
                        className="mt-1.5 block w-full rounded-lg border border-cocoa/15 px-3 py-2.5"
                    />
                </label>

                <label className="mt-4 inline-block text-small">
                    <span className="font-semibold text-cocoa">정렬 순서</span>{' '}
                    <input
                        type="number"
                        min={1}
                        value={order}
                        onChange={(e) => setOrder(Number(e.target.value))}
                        className="ml-2 w-16 rounded-lg border border-cocoa/15 px-2 py-1.5"
                    />
                </label>

                <button
                    onClick={submit}
                    disabled={busy}
                    className="mt-7 w-full rounded-lg bg-cocoa py-3 text-medium font-semibold text-cream transition-colors hover:bg-deep disabled:opacity-50"
                >
                    {busy ? '저장 중...' : '등록'}
                </button>
            </div>

            <div className="mt-8 flex flex-col gap-3">
                {items.map((it) => (
                    <div
                        key={it.id}
                        className="flex items-center justify-between rounded-xl bg-white p-4 text-small shadow-[0_1px_8px_rgba(69,54,45,0.05)]"
                    >
                        <div>
                            <p className="font-semibold text-cocoa">
                                {it.title} <span className="text-latte">({it.en})</span>
                            </p>
                            <p className="mt-0.5 text-latte">
                                {SIGNATURE_PAGES.find((p) => p.slug === it.slugs[0])?.label ?? it.slugs[0]} 페이지 ·
                                순서 {it.order}
                            </p>
                        </div>
                        <button onClick={() => deleteDoc(doc(db, 'columns', it.id))} className="text-red-500">
                            삭제
                        </button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-small text-latte">등록된 칼럼이 없습니다.</p>}
            </div>
        </div>
    );
}

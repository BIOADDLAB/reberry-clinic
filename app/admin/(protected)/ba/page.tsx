//   - "카테고리"(색소/볼륨리프팅/볼륨부스터/여드름/홍조) = 어느 시그니처 페이지에 뜰지 결정하는 slug. 필수 선택.
//   - "표시 라벨" = 사진 아래 보이는 글자. 카테고리 선택하면 자동으로 채워지고, "직접 입력" 체크하면 자유롭게 수정 가능.
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/components/lib/firebase';
import { uploadImage } from '@/components/lib/storageUpload';

const CATEGORIES = [
    { slug: 'pigment', label: '색소치료' },
    { slug: 'lifting', label: '볼륨리프팅' },
    { slug: 'booster', label: '볼륨부스터' },
    { slug: 'acne', label: '여드름치료' },
    { slug: 'redness', label: '홍조치료' },
] as const;

interface BAPhoto {
    id: string;
    slug: string;
    label: string;
    before: string;
    after: string;
    main?: number;
}

export default function AdminBAPage() {
    const [items, setItems] = useState<BAPhoto[]>([]);

    const [categorySlug, setCategorySlug] = useState<string>(CATEGORIES[0].slug);
    const [useCustomLabel, setUseCustomLabel] = useState(false);
    const [customLabel, setCustomLabel] = useState('');

    const [beforeFile, setBeforeFile] = useState<File | null>(null);
    const [afterFile, setAfterFile] = useState<File | null>(null);

    const [showMain, setShowMain] = useState(false);
    const [mainOrder, setMainOrder] = useState(1);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'baPhotos'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BAPhoto[]));
    }, []);

    const currentCategory = CATEGORIES.find((c) => c.slug === categorySlug)!;
    const finalLabel = useCustomLabel ? customLabel.trim() : currentCategory.label;

    const submit = async () => {
        if (!beforeFile || !afterFile || !finalLabel) return alert('전/후 사진과 표시 라벨을 모두 입력하세요.');
        setBusy(true);
        try {
            const [beforeUrl, afterUrl] = await Promise.all([
                uploadImage(beforeFile, 'ba'),
                uploadImage(afterFile, 'ba'),
            ]);
            await addDoc(collection(db, 'baPhotos'), {
                slug: categorySlug,
                label: finalLabel,
                before: beforeUrl,
                after: afterUrl,
                ...(showMain ? { main: mainOrder } : {}),
                createdAt: serverTimestamp(),
            });
            setBeforeFile(null);
            setAfterFile(null);
            setUseCustomLabel(false);
            setCustomLabel('');
            setShowMain(false);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-h2 font-bold text-cocoa">전후사진 관리</h1>
            <p className="mt-1 text-small text-latte">
                등록하면 그 카테고리의 시그니처 페이지에 바로 반영됩니다. (메인 노출 체크 시 메인페이지에도 노출)
            </p>

            <div className="mt-8 rounded-2xl bg-white p-7 shadow-[0_2px_20px_rgba(69,54,45,0.06)]">
                <label className="block text-small">
                    <span className="font-semibold text-cocoa">카테고리 (어느 시그니처 페이지에 노출할지)</span>
                    <select
                        value={categorySlug}
                        onChange={(e) => setCategorySlug(e.target.value)}
                        className="mt-1.5 block w-full rounded-lg border border-cocoa/15 px-3 py-2.5"
                    >
                        {CATEGORIES.map((c) => (
                            <option key={c.slug} value={c.slug}>
                                {c.label}
                            </option>
                        ))}
                    </select>
                </label>

                <div className="mt-4">
                    <p className="text-small font-semibold text-cocoa">표시 라벨 (사진 아래 보이는 글자)</p>
                    <div className="mt-1.5 flex items-center gap-3">
                        <span className="rounded-lg border border-cocoa/15 bg-cocoa/5 px-3 py-2 text-small text-latte">
                            {useCustomLabel ? '직접 입력 중' : currentCategory.label}
                        </span>
                        <label className="flex items-center gap-1.5 text-small text-latte">
                            <input
                                type="checkbox"
                                checked={useCustomLabel}
                                onChange={(e) => setUseCustomLabel(e.target.checked)}
                            />
                            직접 입력
                        </label>
                        {useCustomLabel && (
                            <input
                                placeholder="예: 색소 3회차 시술"
                                value={customLabel}
                                onChange={(e) => setCustomLabel(e.target.value)}
                                className="flex-1 rounded-lg border border-cocoa/15 px-3 py-2 text-small"
                            />
                        )}
                    </div>
                </div>

                <div className="mt-6 flex gap-6">
                    <label className="flex-1 text-small">
                        <span className="font-semibold text-cocoa">전(Before) 사진</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setBeforeFile(e.target.files?.[0] ?? null)}
                            className="mt-1.5 block w-full text-small"
                        />
                    </label>
                    <label className="flex-1 text-small">
                        <span className="font-semibold text-cocoa">후(After) 사진</span>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setAfterFile(e.target.files?.[0] ?? null)}
                            className="mt-1.5 block w-full text-small"
                        />
                    </label>
                </div>

                <label className="mt-6 flex items-center gap-2 text-small">
                    <input type="checkbox" checked={showMain} onChange={(e) => setShowMain(e.target.checked)} />
                    <span className="font-semibold text-cocoa">메인 페이지에도 노출</span>
                    {showMain && (
                        <>
                            <span className="text-latte">순서</span>
                            <input
                                type="number"
                                min={1}
                                value={mainOrder}
                                onChange={(e) => setMainOrder(Number(e.target.value))}
                                className="w-16 rounded-lg border border-cocoa/20 px-2 py-1"
                            />
                        </>
                    )}
                </label>

                <button
                    onClick={submit}
                    disabled={busy}
                    className="mt-7 w-full rounded-lg bg-cocoa py-3 text-medium font-semibold text-cream transition-colors hover:bg-deep disabled:opacity-50"
                >
                    {busy ? '업로드 중...' : '등록'}
                </button>
            </div>

            <div className="mt-8 flex flex-col gap-3">
                {items.map((it) => (
                    <div
                        key={it.id}
                        className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-[0_1px_8px_rgba(69,54,45,0.05)]"
                    >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                            <Image src={it.before} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                            <Image src={it.after} alt="" fill sizes="64px" className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 text-small">
                            <p className="font-semibold text-cocoa">{it.label}</p>
                            <p className="mt-0.5 text-latte">
                                {CATEGORIES.find((c) => c.slug === it.slug)?.label ?? it.slug}
                                {typeof it.main === 'number' && (
                                    <span className="ml-2 rounded-full bg-cocoa/8 px-2 py-0.5 text-caption">
                                        메인 #{it.main}
                                    </span>
                                )}
                            </p>
                        </div>
                        <button
                            onClick={() => deleteDoc(doc(db, 'baPhotos', it.id))}
                            className="shrink-0 text-small text-red-500"
                        >
                            삭제
                        </button>
                    </div>
                ))}
                {items.length === 0 && (
                    <p className="text-small text-latte">등록된 전후사진이 없습니다. (정적 이미지가 대신 노출 중)</p>
                )}
            </div>
        </div>
    );
}

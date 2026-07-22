// #LINK: /app/admin/(protected)/ba/page.tsx
// #ISSUE: 전후사진 관리 — 시술명(프리셋 드롭다운 또는 직접입력) + 노출 위치별(메인/시그니처 4종) 개별 순서 지정
'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { collection, addDoc, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp } from 'firebase/firestore';
import { db } from '@/components/lib/firebase';
import { uploadImage } from '@/components/lib/storageUpload';

// 노출 위치 — 메인 + 시그니처 4종. 필요하면 이 배열만 늘리면 됨
const PLACEMENTS = [
    { key: 'main', label: '메인 페이지' },
    { key: 'sig-pigment', label: '시그니처 · 색소' },
    { key: 'sig-lifting', label: '시그니처 · 볼륨리프팅' },
    { key: 'sig-booster', label: '시그니처 · 볼륨부스터' },
    { key: 'sig-acne', label: '시그니처 · 여드름' },
    { key: 'sig-redness', label: '시그니처 · 홍조' },
] as const;

const LABEL_PRESETS = ['색소', '볼륨리프팅', '볼륨부스터', '여드름', '홍조'];

interface Placement {
    key: string;
    order: number;
}

interface BAPhoto {
    id: string;
    label: string;
    before: string;
    after: string;
    placements: Placement[];
}

export default function AdminBAPage() {
    const [items, setItems] = useState<BAPhoto[]>([]);
    const [beforeFile, setBeforeFile] = useState<File | null>(null);
    const [afterFile, setAfterFile] = useState<File | null>(null);

    const [useCustomLabel, setUseCustomLabel] = useState(false);
    const [labelPreset, setLabelPreset] = useState(LABEL_PRESETS[0]);
    const [labelCustom, setLabelCustom] = useState('');

    // 위치별 체크 + 순서 상태: { main: 1, 'sig-pigment': 2, ... } (체크 안 하면 키 없음)
    const [placementOrders, setPlacementOrders] = useState<Record<string, number>>({});
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const q = query(collection(db, 'baPhotos'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BAPhoto[]));
    }, []);

    const togglePlacement = (key: string, checked: boolean) => {
        setPlacementOrders((prev) => {
            const next = { ...prev };
            if (checked) next[key] = next[key] ?? Object.keys(prev).length + 1;
            else delete next[key];
            return next;
        });
    };

    const submit = async () => {
        const label = useCustomLabel ? labelCustom.trim() : labelPreset;
        if (!beforeFile || !afterFile || !label) return alert('전/후 사진과 시술명을 모두 입력하세요.');
        setBusy(true);
        try {
            const [beforeUrl, afterUrl] = await Promise.all([
                uploadImage(beforeFile, 'ba'),
                uploadImage(afterFile, 'ba'),
            ]);
            const placements: Placement[] = Object.entries(placementOrders).map(([key, order]) => ({ key, order }));
            await addDoc(collection(db, 'baPhotos'), {
                label,
                before: beforeUrl,
                after: afterUrl,
                placements,
                createdAt: serverTimestamp(),
            });
            setBeforeFile(null);
            setAfterFile(null);
            setLabelCustom('');
            setPlacementOrders({});
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-h2 font-bold text-cocoa">전후사진 관리</h1>
            <p className="mt-1 text-small text-latte">등록 즉시 사이트에 반영됩니다.</p>

            {/* 등록 폼 */}
            <div className="mt-8 rounded-2xl bg-white p-7 shadow-[0_2px_20px_rgba(69,54,45,0.06)]">
                {/* 시술명 */}
                <div>
                    <p className="text-small font-semibold text-cocoa">시술명</p>
                    <div className="mt-2 flex flex-wrap items-center gap-3">
                        <select
                            value={labelPreset}
                            disabled={useCustomLabel}
                            onChange={(e) => setLabelPreset(e.target.value)}
                            className="rounded-lg border border-cocoa/15 px-3 py-2 text-small disabled:opacity-40"
                        >
                            {LABEL_PRESETS.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
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
                                placeholder="시술명 입력"
                                value={labelCustom}
                                onChange={(e) => setLabelCustom(e.target.value)}
                                className="flex-1 rounded-lg border border-cocoa/15 px-3 py-2 text-small"
                            />
                        )}
                    </div>
                </div>

                {/* 사진 */}
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

                {/* 노출 위치 + 순서 */}
                <div className="mt-6">
                    <p className="text-small font-semibold text-cocoa">
                        노출 위치 (여러 곳 동시 선택 가능, 각각 순서 지정)
                    </p>
                    <div className="mt-2 grid grid-cols-2 gap-2.5 md:grid-cols-3">
                        {PLACEMENTS.map((p) => {
                            const checked = p.key in placementOrders;
                            return (
                                <div
                                    key={p.key}
                                    className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-small ${
                                        checked ? 'border-cocoa/30 bg-cocoa/5' : 'border-cocoa/10'
                                    }`}
                                >
                                    <label className="flex items-center gap-1.5">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) => togglePlacement(p.key, e.target.checked)}
                                        />
                                        {p.label}
                                    </label>
                                    {checked && (
                                        <input
                                            type="number"
                                            min={1}
                                            value={placementOrders[p.key]}
                                            onChange={(e) =>
                                                setPlacementOrders((prev) => ({
                                                    ...prev,
                                                    [p.key]: Number(e.target.value),
                                                }))
                                            }
                                            className="w-12 rounded border border-cocoa/20 px-1.5 py-0.5 text-center"
                                        />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <button
                    onClick={submit}
                    disabled={busy}
                    className="mt-7 w-full rounded-lg bg-cocoa py-3 text-medium font-semibold text-cream transition-colors hover:bg-deep disabled:opacity-50"
                >
                    {busy ? '업로드 중...' : '등록'}
                </button>
            </div>

            {/* 목록 */}
            <div className="mt-8 flex flex-col gap-3">
                {items.map((it) => (
                    <div
                        key={it.id}
                        className="flex items-center gap-4 rounded-xl bg-white p-3 shadow-[0_1px_8px_rgba(69,54,45,0.05)]"
                    >
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                            <Image src={it.before} alt="" fill className="object-cover" />
                        </div>
                        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                            <Image src={it.after} alt="" fill className="object-cover" />
                        </div>
                        <div className="min-w-0 flex-1 text-small">
                            <p className="font-semibold text-cocoa">{it.label}</p>
                            <div className="mt-1 flex flex-wrap gap-1.5">
                                {(it.placements ?? []).length === 0 && (
                                    <span className="text-latte">노출 위치 없음</span>
                                )}
                                {(it.placements ?? []).map((p) => (
                                    <span
                                        key={p.key}
                                        className="rounded-full bg-cocoa/8 px-2 py-0.5 text-caption text-cocoa"
                                    >
                                        {PLACEMENTS.find((x) => x.key === p.key)?.label ?? p.key} #{p.order}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <button
                            onClick={() => deleteDoc(doc(db, 'baPhotos', it.id))}
                            className="shrink-0 text-small text-red-500"
                        >
                            삭제
                        </button>
                    </div>
                ))}
                {items.length === 0 && <p className="text-small text-latte">등록된 전후사진이 없습니다.</p>}
            </div>
        </div>
    );
}

// #LINK: /app/admin/(protected)/columns/page.tsx
// #ISSUE: 칼럼 관리 — 등록 / 수정 / 삭제 / 페이지별 필터
//   · 노출 위치 2종:
//       (1) 시그니처 페이지  → 카드에 [시술명 + 영문명 + 제목 + 더보기] 전부 나옴
//       (2) 기기·제품 상세   → 카드에 [제목 + 더보기]만 나옴 (시술명/영문명 칸이 아예 없음)
//   · 글자수·개수 제한은 components/lib/adminConfig.ts 에서 한 번에 관리
'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/components/lib/firebase';
import { solutions } from '@/components/lib/solutions';
import { SIGNATURE_PAGES, LIMITS, COUNT_LIMITS } from '@/components/lib/adminConfig';
import { site } from '@/components/lib/site';

interface ColDoc {
    id: string;
    title: string; // 시술·기기 이름 (기기상세용이면 빈 문자열)
    en: string; // 영문 이름 (기기상세용이면 빈 문자열)
    text: string; // 제목 = 카드 본문
    link: string; // 더보기 URL (비우면 블로그 홈으로)
    slugs: string[]; // 어디에 노출할지. [시그니처slug] 또는 [기기slug]
    order: number; // 그 페이지 안에서 몇 번째로 보일지
}

const DEVICE_OPTIONS = solutions.map((s) => ({ slug: s.slug, name: s.name }));

// 폼 초기값 — 등록 완료 후 이 상태로 되돌림
const EMPTY_FORM = {
    scope: 'signature' as 'signature' | 'device',
    target: SIGNATURE_PAGES[0].slug as string,
    title: '',
    en: '',
    text: '',
    link: '',
    order: 1,
};

export default function AdminColumnsPage() {
    const [items, setItems] = useState<ColDoc[]>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null); // null이면 "새로 등록", 값이 있으면 "그 문서 수정 중"
    const [busy, setBusy] = useState(false);

    // 목록 필터 — 등록된 칼럼이 많아지면 페이지별로 골라 볼 수 있게
    const [filterScope, setFilterScope] = useState<'all' | 'signature' | 'device'>('all');
    const [filterTarget, setFilterTarget] = useState<string>('all');

    useEffect(() => {
        const q = query(collection(db, 'columns'), orderBy('order'));
        return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as ColDoc[]));
    }, []);

    const isDevice = form.scope === 'device';

    // 비어 있는 가장 빠른 순서 번호를 찾아줌 (1,2,4 가 쓰였으면 → 3)
    const nextFreeOrder = (taken: number[]) => {
        for (let n = 1; n <= taken.length + 1; n += 1) if (!taken.includes(n)) return n;
        return taken.length + 1;
    };

    // 지금 선택한 페이지(target)에 이미 등록된 칼럼들
    const sameTargetItems = useMemo(
        () => items.filter((it) => it.slugs[0] === form.target && it.id !== editingId),
        [items, form.target, editingId],
    );
    const usedOrders = sameTargetItems.map((it) => it.order);
    const isDuplicateOrder = usedOrders.includes(form.order);
    const isOverCount = !editingId && sameTargetItems.length >= COUNT_LIMITS.columnPerPage;

    // 목록에 실제로 보여줄 것들 (필터 적용)
    const visibleItems = useMemo(() => {
        return items.filter((it) => {
            const slug = it.slugs[0];
            const itemIsDevice = !SIGNATURE_PAGES.some((p) => p.slug === slug);
            if (filterScope === 'signature' && itemIsDevice) return false;
            if (filterScope === 'device' && !itemIsDevice) return false;
            if (filterTarget !== 'all' && slug !== filterTarget) return false;
            return true;
        });
    }, [items, filterScope, filterTarget]);

    const targetLabel = (slug: string) =>
        SIGNATURE_PAGES.find((p) => p.slug === slug)?.label ??
        DEVICE_OPTIONS.find((d) => d.slug === slug)?.name ??
        slug;

    const startEdit = (it: ColDoc) => {
        const slug = it.slugs[0];
        const itemIsDevice = !SIGNATURE_PAGES.some((p) => p.slug === slug);
        setEditingId(it.id);
        setForm({
            scope: itemIsDevice ? 'device' : 'signature',
            target: slug,
            title: it.title ?? '',
            en: it.en ?? '',
            text: it.text ?? '',
            link: it.link ?? '',
            order: it.order ?? 1,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' }); // 폼이 위에 있으니 스크롤 올려줌
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const submit = async () => {
        // 기기상세용 칼럼은 제목만 필수, 시그니처용은 시술명/영문명도 필수
        if (!form.text.trim()) return alert('제목(카드 본문)을 입력하세요.');
        if (!isDevice && (!form.title.trim() || !form.en.trim()))
            return alert('시술·기기 이름과 영문 이름을 입력하세요.');
        if (isDuplicateOrder) return alert(`이 페이지에는 이미 ${form.order}번이 있습니다. 다른 번호를 입력하세요.`);
        if (isOverCount)
            return alert(`한 페이지에 칼럼은 최대 ${COUNT_LIMITS.columnPerPage}개까지만 등록할 수 있습니다.`);

        setBusy(true);
        try {
            const payload = {
                title: isDevice ? '' : form.title.trim(), // 기기상세는 카드에 안 나오므로 빈 값으로 저장
                en: isDevice ? '' : form.en.trim(),
                // 줄바꿈(엔터)은 그대로 보존. 단, "\\n" 이라고 글자로 직접 친 경우도 진짜 줄바꿈으로 바꿔줌
                text: form.text.replace(/\\n/g, '\n'),
                link: form.link.trim(),
                slugs: [form.target],
                order: form.order,
            };
            if (editingId) {
                await updateDoc(doc(db, 'columns', editingId), payload);
            } else {
                await addDoc(collection(db, 'columns'), payload);
            }
            cancelEdit();
        } finally {
            setBusy(false);
        }
    };

    const remove = async (it: ColDoc) => {
        if (!confirm(`"${it.text.split('\n')[0]}" 칼럼을 삭제할까요?`)) return;
        if (editingId === it.id) cancelEdit(); // 수정 중이던 걸 삭제하면 폼도 초기화
        await deleteDoc(doc(db, 'columns', it.id));
    };

    // 입력칸 공통 스타일
    const inputCls =
        'w-full rounded-lg border border-cocoa/15 px-3 py-2.5 text-small outline-none focus:border-cocoa/40';

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-h2 font-bold text-cocoa">칼럼 관리</h1>
            <p className="mt-1 text-small text-latte">닥터 파이톤 칼럼 카드를 등록·수정합니다.</p>

            {/* ══════════ 등록/수정 폼 ══════════ */}
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)] md:p-7">
                {editingId && (
                    <div className="mb-5 flex items-center justify-between rounded-lg bg-cocoa/5 px-4 py-2.5 text-small">
                        <span className="font-semibold text-cocoa">수정 중입니다</span>
                        <button onClick={cancelEdit} className="text-latte underline">
                            취소하고 새로 등록
                        </button>
                    </div>
                )}

                {/* 노출 위치 */}
                <p className="text-small font-semibold text-cocoa">어디에 노출할까요?</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-small">
                    <label className="flex items-center gap-1.5">
                        <input
                            type="radio"
                            checked={!isDevice}
                            onChange={() => {
                                const t = SIGNATURE_PAGES[0].slug;
                                const taken = items.filter((it) => it.slugs[0] === t).map((it) => it.order);
                                setForm({ ...form, scope: 'signature', target: t, order: nextFreeOrder(taken) });
                            }}
                        />
                        시그니처 시술 페이지
                    </label>
                    <label className="flex items-center gap-1.5">
                        <input
                            type="radio"
                            checked={isDevice}
                            onChange={() => {
                                const t = DEVICE_OPTIONS[0].slug;
                                const taken = items.filter((it) => it.slugs[0] === t).map((it) => it.order);
                                setForm({ ...form, scope: 'device', target: t, order: nextFreeOrder(taken) });
                            }}
                        />
                        기기·제품 상세 페이지
                    </label>
                </div>

                <select
                    value={form.target}
                    onChange={(e) => {
                        // 페이지를 바꾸면 그 페이지에서 아직 안 쓴 번호를 자동으로 넣어줌 → 중복 입력 자체가 잘 안 생김
                        const nextTarget = e.target.value;
                        const taken = items
                            .filter((it) => it.slugs[0] === nextTarget && it.id !== editingId)
                            .map((it) => it.order);
                        setForm({ ...form, target: nextTarget, order: nextFreeOrder(taken) });
                    }}
                    className={`${inputCls} mt-2`}
                >
                    {(isDevice ? DEVICE_OPTIONS : SIGNATURE_PAGES).map((o) => (
                        <option key={o.slug} value={o.slug}>
                            {'label' in o ? o.label : o.name}
                        </option>
                    ))}
                </select>

                {isDevice && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-caption text-amber-800">
                        기기·제품 상세 페이지의 칼럼 카드에는 <b>제목과 더보기 버튼만</b> 나옵니다. 그래서 시술·기기
                        이름과 영문 이름은 입력하지 않아도 됩니다.
                    </p>
                )}

                {/* 시술명 / 영문명 — 시그니처용일 때만 */}
                {!isDevice && (
                    <div className="mt-4 flex flex-col gap-4 md:flex-row">
                        <label className="flex-1 text-small">
                            <span className="font-semibold text-cocoa">시술·기기 이름</span>
                            <span className="ml-2 text-caption text-latte">
                                {form.title.length}/{LIMITS.columnTitle}자
                            </span>
                            <input
                                placeholder="예: 온다리프팅"
                                value={form.title}
                                maxLength={LIMITS.columnTitle}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className={`${inputCls} mt-1.5`}
                            />
                        </label>
                        <label className="flex-1 text-small">
                            <span className="font-semibold text-cocoa">영문 이름</span>
                            <span className="ml-2 text-caption text-latte">
                                {form.en.length}/{LIMITS.columnEn}자
                            </span>
                            <input
                                placeholder="예: Onda"
                                value={form.en}
                                maxLength={LIMITS.columnEn}
                                onChange={(e) => setForm({ ...form, en: e.target.value })}
                                className={`${inputCls} mt-1.5`}
                            />
                        </label>
                    </div>
                )}

                {/* 제목(본문) */}
                <label className="mt-4 block text-small">
                    <span className="font-semibold text-cocoa">제목 (카드에 보이는 문구)</span>
                    <span
                        className={`ml-2 text-caption ${form.text.length > LIMITS.columnText ? 'text-red-500' : 'text-latte'}`}
                    >
                        {form.text.length}/{LIMITS.columnText}자
                    </span>
                    <textarea
                        placeholder={'3mm vs 7mm\n내 얼굴엔 어떤 깊이가 맞을까?'}
                        value={form.text}
                        rows={2}
                        onChange={(e) => setForm({ ...form, text: e.target.value })}
                        className={`${inputCls} mt-1.5 resize-none`}
                    />
                    <span className="mt-1 block text-caption text-latte">
                        <b>엔터</b>를 눌러 줄을 바꾸면 화면에도 그대로 줄바꿈되어 나옵니다. 카드에는 <b>2줄까지만</b>{' '}
                        보이고, {LIMITS.columnText}자를 넘으면 뒷부분이 <b>말줄임(…)</b>으로 잘립니다.
                    </span>
                </label>

                {/* URL */}
                <label className="mt-4 block text-small">
                    <span className="font-semibold text-cocoa">더보기 URL</span>
                    <input
                        placeholder="https://blog.naver.com/drpyton/..."
                        value={form.link}
                        onChange={(e) => setForm({ ...form, link: e.target.value })}
                        className={`${inputCls} mt-1.5`}
                    />
                    <span className="mt-1 block text-caption text-latte">
                        비워두면 블로그 홈({site.blog})으로 자동 연결됩니다.
                    </span>
                </label>

                {/* 순서 */}
                <label className="mt-4 block text-small">
                    <span className="font-semibold text-cocoa">몇 번째로 보이게 할까요?</span>
                    <input
                        type="number"
                        min={1}
                        value={form.order}
                        onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                        className={`mt-1.5 w-20 rounded-lg border px-2 py-1.5 text-small ${
                            isDuplicateOrder ? 'border-red-400' : 'border-cocoa/15'
                        }`}
                    />
                    <span className="mt-1 block text-caption text-latte">
                        이 페이지에 등록된 칼럼: {sameTargetItems.length}개 / 최대 {COUNT_LIMITS.columnPerPage}개
                        {usedOrders.length > 0 &&
                            ` · 사용중인 번호: ${[...usedOrders].sort((a, b) => a - b).join(', ')}`}
                    </span>
                    {isDuplicateOrder && (
                        <span className="mt-1 flex items-center gap-2 text-caption text-red-500">
                            {form.order}번은 이미 사용 중입니다.
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, order: nextFreeOrder(usedOrders) })}
                                className="rounded border border-red-300 px-2 py-0.5 text-red-600"
                            >
                                비어있는 {nextFreeOrder(usedOrders)}번으로 바꾸기
                            </button>
                        </span>
                    )}
                    {isOverCount && (
                        <span className="mt-1 block text-caption text-red-500">
                            이 페이지는 이미 최대 개수({COUNT_LIMITS.columnPerPage}개)에 도달했습니다. 기존 칼럼을
                            삭제한 뒤 등록하세요.
                        </span>
                    )}
                </label>

                {/* 중복/초과 상태에서는 버튼 자체를 눌러지지 않게 막음 (실수 방지) */}
                <button
                    onClick={submit}
                    disabled={busy || isDuplicateOrder || isOverCount}
                    className="mt-6 w-full rounded-lg bg-cocoa py-3 text-medium font-semibold text-cream transition-colors hover:bg-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {busy
                        ? '저장 중...'
                        : isDuplicateOrder
                          ? '순서 번호를 바꿔주세요'
                          : editingId
                            ? '수정 완료'
                            : '등록'}
                </button>
            </div>

            {/* ══════════ 목록 ══════════ */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-lead font-bold text-cocoa">등록된 칼럼 ({visibleItems.length})</h2>
                <select
                    value={filterScope}
                    onChange={(e) => {
                        setFilterScope(e.target.value as typeof filterScope);
                        setFilterTarget('all');
                    }}
                    className="rounded-lg border border-cocoa/15 px-2 py-1.5 text-small"
                >
                    <option value="all">전체</option>
                    <option value="signature">시그니처</option>
                    <option value="device">기기·제품</option>
                </select>
                {filterScope !== 'all' && (
                    <select
                        value={filterTarget}
                        onChange={(e) => setFilterTarget(e.target.value)}
                        className="rounded-lg border border-cocoa/15 px-2 py-1.5 text-small"
                    >
                        <option value="all">전체 페이지</option>
                        {(filterScope === 'device' ? DEVICE_OPTIONS : SIGNATURE_PAGES).map((o) => (
                            <option key={o.slug} value={o.slug}>
                                {'label' in o ? o.label : o.name}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
                {visibleItems.map((it) => (
                    <div
                        key={it.id}
                        className="flex flex-col gap-3 rounded-xl bg-white p-4 text-small shadow-[0_1px_8px_rgba(69,54,45,0.05)] sm:flex-row sm:items-center"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-cocoa">
                                {it.title ? (
                                    <>
                                        {it.title} <span className="text-latte">({it.en})</span>
                                    </>
                                ) : (
                                    <span className="text-latte">[기기상세 · 제목만 노출]</span>
                                )}
                            </p>
                            <p className="mt-0.5 whitespace-pre-line text-latte">{it.text}</p>
                            <p className="mt-1 text-caption text-latte">
                                {targetLabel(it.slugs[0])} 페이지 · {it.order}번
                                {!it.link && ' · URL 미입력(블로그 홈으로 연결)'}
                            </p>
                        </div>
                        <div className="flex shrink-0 gap-3">
                            <button onClick={() => startEdit(it)} className="text-cocoa underline">
                                수정
                            </button>
                            <button onClick={() => remove(it)} className="text-red-500">
                                삭제
                            </button>
                        </div>
                    </div>
                ))}
                {visibleItems.length === 0 && (
                    <p className="rounded-xl bg-white p-6 text-center text-small text-latte">
                        등록된 칼럼이 없습니다. 사이트에도 아무것도 안 나옵니다.
                    </p>
                )}
            </div>
        </div>
    );
}

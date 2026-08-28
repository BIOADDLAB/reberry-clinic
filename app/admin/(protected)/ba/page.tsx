// #LINK: /app/admin/(protected)/ba/page.tsx
// #ISSUE: 전후사진 관리 — 등록 / 수정 / 삭제 / 페이지별 필터
//   · 시술 페이지는 체크박스로 여러 개 선택할 수 있으며 사진 파일은 한 번만 저장함
//   · "메인 노출" 체크하면 메인페이지 슬라이더에도 같이 나옴 (그때 순서 지정)
//   · 수정 시 사진을 새로 안 올리면 기존 사진 그대로 유지됨
'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/components/lib/firebase';
import { uploadImage } from '@/components/lib/storageUpload';
import {
    TREATMENT_PAGES,
    TREATMENT_PAGE_GROUPS,
    LIMITS,
    COUNT_LIMITS,
    BA_IMAGE_GUIDE,
} from '@/components/lib/adminConfig';
import {
    BA_CATEGORIES,
    BA_PLACES,
    baCategoryLabel,
    baPlaceLabel,
    resolveBACategory,
    resolveBAPlace,
    resolveBASlugs,
    showsOnReviews,
    showsOnTreatment,
} from '@/components/lib/ba';

interface BAPhotoDoc {
    id: string;
    slug: string; // 기존 단일 페이지 데이터 및 대표 페이지
    slugs?: string[]; // 실제 노출할 시술 페이지들
    label: string; // 사진 아래 알약 모양 글자
    before: string; // Storage 이미지 URL
    after: string;
    main?: number; // 메인페이지 노출 순서 (없으면 메인 미노출)
    order?: number; // 그 시그니처 페이지 안에서의 순서
    category?: string; // 전후사진 페이지(/reviews) 카테고리 탭
    place?: string; // 노출 위치 treatment/reviews/both (없으면 both)
}

const EMPTY_FORM = {
    // 새로 올리는 사진은 어디에 띄울지 반드시 고르게 한다(기본값 = 시술 페이지)
    place: 'treatment' as string,
    slugs: [] as string[],
    // 전후사진 페이지 탭. 카테고리를 따로 안 건드리면 시술 페이지 기준으로 자동 배정된다
    category: (resolveBACategory({ slug: TREATMENT_PAGES[0].slug }) ?? BA_CATEGORIES[0].key) as string,
    useCustomLabel: false,
    customLabel: '',
    order: 1,
    showMain: false,
    mainOrder: 1,
};

export default function AdminBAPage() {
    const [items, setItems] = useState<BAPhotoDoc[]>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [beforeFile, setBeforeFile] = useState<File | null>(null);
    const [afterFile, setAfterFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [filterSlug, setFilterSlug] = useState<string>('all');
    const [filterPlace, setFilterPlace] = useState<string>('all');

    useEffect(() => {
        const q = query(collection(db, 'baPhotos'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snap) => setItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as BAPhotoDoc[]));
    }, []);

    // 비어 있는 가장 빠른 순서 번호 (1,2,4 가 쓰였으면 → 3)
    const nextFreeOrder = (taken: number[]) => {
        for (let n = 1; n <= taken.length + 1; n += 1) if (!taken.includes(n)) return n;
        return taken.length + 1;
    };

    // 시술 페이지에 뜨는 사진인지 (= 시술 페이지 선택·순서 칸을 보여줄지)
    const usesTreatment = form.place !== 'reviews';
    // 전후사진 페이지에 뜨는 사진인지 (= 카테고리 칸을 보여줄지)
    const usesReviews = form.place !== 'treatment';

    const currentPage = TREATMENT_PAGES.find((p) => p.slug === form.slugs[0]);
    // 자동 라벨은 그 사진이 실제로 걸리는 쪽 이름을 쓴다
    const autoLabel = usesTreatment ? (currentPage?.label ?? '') : baCategoryLabel(form.category);
    const finalLabel = form.useCustomLabel ? form.customLabel.trim() : autoLabel;

    // 선택한 각 페이지의 등록 수와 사용 중인 순서를 한 번에 검사한다.
    const targetStats = useMemo(
        () =>
            form.slugs.map((slug) => {
                const pageItems = items.filter(
                    (it) => it.id !== editingId && showsOnTreatment(it) && resolveBASlugs(it).includes(slug),
                );
                return {
                    slug,
                    count: pageItems.length,
                    usedOrders: pageItems.map((it) => it.order ?? 0).filter(Boolean),
                };
            }),
        [items, form.slugs, editingId],
    );
    const duplicateTargets = targetStats.filter((target) => target.usedOrders.includes(form.order));
    const fullTargets = targetStats.filter((target) => target.count >= COUNT_LIMITS.baPerPage);
    const usedOrders = [...new Set(targetStats.flatMap((target) => target.usedOrders))];
    const isDuplicateOrder = usesTreatment && duplicateTargets.length > 0;
    const isOverCount = usesTreatment && fullTargets.length > 0;

    // 메인 노출 순서는 카테고리와 무관하게 "메인페이지 전체"에서 하나뿐이어야 함
    const mainItems = items.filter((it) => typeof it.main === 'number' && it.id !== editingId);
    const usedMainOrders = mainItems.map((it) => it.main as number);
    const isDuplicateMain = form.showMain && usedMainOrders.includes(form.mainOrder);
    const isOverMainCount = form.showMain && !editingId && mainItems.length >= COUNT_LIMITS.baMain;

    const visibleItems = useMemo(
        () =>
            items
                .filter((it) => filterPlace === 'all' || resolveBAPlace(it) === filterPlace)
                // 시술 페이지 필터는 시술 페이지에 뜨는 사진에만 의미가 있다
                .filter(
                    (it) =>
                        filterSlug === 'all' ||
                        (resolveBASlugs(it).includes(filterSlug) && showsOnTreatment(it)),
                ),
        [items, filterSlug, filterPlace],
    );

    const startEdit = (it: BAPhotoDoc) => {
        const place = resolveBAPlace(it);
        const slugs = resolveBASlugs(it);
        const category = resolveBACategory(it) ?? BA_CATEGORIES[0].key;
        // 저장된 라벨이 자동 라벨과 다르면 '직접 입력' 상태로 되살린다
        const auto =
            place === 'reviews'
                ? baCategoryLabel(category)
                : (TREATMENT_PAGES.find((p) => p.slug === slugs[0])?.label ?? '');

        setEditingId(it.id);
        setForm({
            place,
            slugs,
            category,
            useCustomLabel: it.label !== auto,
            customLabel: it.label,
            order: it.order ?? 1,
            showMain: typeof it.main === 'number',
            mainOrder: it.main ?? 1,
        });
        setBeforeFile(null);
        setAfterFile(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setBeforeFile(null);
        setAfterFile(null);
    };

    // 파일 용량 체크 — 너무 큰 사진은 업로드도 느리고 사이트도 느려짐
    const pickFile = (file: File | null, setter: (f: File | null) => void) => {
        if (file && file.size > BA_IMAGE_GUIDE.maxFileSizeMB * 1024 * 1024) {
            alert(`이미지 용량은 ${BA_IMAGE_GUIDE.maxFileSizeMB}MB 이하로 올려주세요.`);
            return;
        }
        setter(file);
    };

    const treatmentPageName = (slug: string) => {
        const page = TREATMENT_PAGES.find((item) => item.slug === slug);
        return page ? `${page.group} > ${page.label}` : slug;
    };

    const usedOrdersFor = (slugs: string[]) => [
        ...new Set(
            items
                .filter(
                    (it) =>
                        it.id !== editingId &&
                        showsOnTreatment(it) &&
                        resolveBASlugs(it).some((slug) => slugs.includes(slug)),
                )
                .map((it) => it.order ?? 0)
                .filter(Boolean),
        ),
    ];

    const toggleTreatmentPage = (slug: string, checked: boolean) => {
        const slugs = checked
            ? [...new Set([...form.slugs, slug])]
            : form.slugs.filter((selected) => selected !== slug);
        setForm({
            ...form,
            slugs,
            category:
                checked && form.slugs.length === 0
                    ? (resolveBACategory({ slug, slugs: [slug] }) ?? form.category)
                    : form.category,
            order: slugs.length > 0 ? nextFreeOrder(usedOrdersFor(slugs)) : form.order,
        });
    };

    const submit = async () => {
        if (usesTreatment && form.slugs.length === 0) return alert('노출할 시술 페이지를 한 개 이상 선택하세요.');
        if (!finalLabel) return alert('표시 라벨을 입력하세요.');
        if (!editingId && (!beforeFile || !afterFile)) return alert('전/후 사진을 모두 선택하세요.');
        if (isDuplicateOrder)
            return alert(
                `${duplicateTargets.map((target) => treatmentPageName(target.slug)).join(', ')}에 이미 ${form.order}번이 있습니다.`,
            );
        if (isDuplicateMain) return alert(`메인 노출 ${form.mainOrder}번은 이미 사용 중입니다.`);
        if (isOverCount)
            return alert(
                `${fullTargets.map((target) => treatmentPageName(target.slug)).join(', ')}에는 사진을 최대 ${COUNT_LIMITS.baPerPage}장까지 등록할 수 있습니다.`,
            );
        if (isOverMainCount) return alert(`메인 노출은 최대 ${COUNT_LIMITS.baMain}장까지 가능합니다.`);

        setBusy(true);
        try {
            // 수정 시 새 파일을 안 골랐으면 기존 URL 유지
            const existing = items.find((it) => it.id === editingId);
            const beforeUrl = beforeFile ? await uploadImage(beforeFile, 'ba') : existing!.before;
            const afterUrl = afterFile ? await uploadImage(afterFile, 'ba') : existing!.after;
            const primarySlug = form.slugs[0] ?? existing?.slug ?? TREATMENT_PAGES[0].slug;

            const payload = {
                place: form.place,
                slug: primarySlug,
                slugs: form.slugs,
                category: form.category,
                label: finalLabel,
                before: beforeUrl,
                after: afterUrl,
                order: form.order,
                ...(form.showMain ? { main: form.mainOrder } : { main: null }), // null 로 지워야 기존 값이 사라짐
            };

            if (editingId) {
                await updateDoc(doc(db, 'baPhotos', editingId), payload);
            } else {
                await addDoc(collection(db, 'baPhotos'), { ...payload, createdAt: serverTimestamp() });
            }
            cancelEdit();
        } finally {
            setBusy(false);
        }
    };

    const remove = async (it: BAPhotoDoc) => {
        if (!confirm(`"${it.label}" 전후사진을 삭제할까요?`)) return;
        if (editingId === it.id) cancelEdit();
        await deleteDoc(doc(db, 'baPhotos', it.id));
    };

    const inputCls =
        'w-full rounded-lg border border-cocoa/15 px-3 py-2.5 text-small outline-none focus:border-cocoa/40';

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-h2 font-bold text-cocoa">전후사진 관리</h1>
            <p className="mt-1 text-small text-latte">시술 전/후 사진을 등록·수정합니다.</p>

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

                {/* 시술 페이지와 전후사진 페이지 노출을 각각 체크한다. */}
                <fieldset className="rounded-lg bg-cocoa/[0.03] p-4">
                    <legend className="px-1 text-small font-semibold text-cocoa">이 사진을 어디에 띄울까요?</legend>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:gap-5">
                        <label className="flex items-center gap-2 text-small text-cocoa">
                            <input
                                type="checkbox"
                                checked={usesTreatment}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        place: e.target.checked ? (usesReviews ? 'both' : 'treatment') : 'reviews',
                                    })
                                }
                            />
                            시술 상세 페이지에 노출
                        </label>
                        <label className="flex items-center gap-2 text-small text-cocoa">
                            <input
                                type="checkbox"
                                checked={usesReviews}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        place: e.target.checked ? (usesTreatment ? 'both' : 'reviews') : 'treatment',
                                    })
                                }
                            />
                            전후사진 페이지에도 노출
                        </label>
                    </div>
                    <p className="mt-2 text-caption text-latte">
                        시술 페이지 = 선택한 상세 페이지의 &lsquo;Your Beauty Physician&rsquo; 슬라이더 / 전후사진
                        페이지 = 상단 메뉴의 &lsquo;전후사진&rsquo;. 기존 사진 중 노출 위치 값이 없는 데이터는 시술
                        페이지와 전후사진 페이지에 계속 노출됩니다.
                    </p>
                </fieldset>

                {/* 한 사진을 여러 시술 페이지에서 함께 사용할 수 있다. */}
                {usesTreatment && (
                    <fieldset className="mt-4 rounded-lg border border-cocoa/10 p-4">
                        <legend className="px-1 text-small font-semibold text-cocoa">노출할 시술 페이지 (다중 선택)</legend>
                        <div className="mt-1 grid gap-4 md:grid-cols-3">
                            {TREATMENT_PAGE_GROUPS.map((group) => (
                                <div key={group.key}>
                                    <p className="mb-2 text-small font-semibold text-cocoa">{group.label}</p>
                                    <div className="flex flex-col gap-2">
                                        {group.pages.map((page) => (
                                            <label key={page.slug} className="flex items-center gap-2 text-small text-latte">
                                                <input
                                                    type="checkbox"
                                                    checked={form.slugs.includes(page.slug)}
                                                    onChange={(e) => toggleTreatmentPage(page.slug, e.target.checked)}
                                                />
                                                {page.label}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-3 text-caption text-latte">
                            같은 전후사진을 여러 페이지에서 사용하려면 모두 체크하세요. 사진 파일은 한 번만
                            업로드됩니다.
                        </p>
                        {form.slugs.length === 0 && (
                            <p className="mt-1 text-caption text-red-500">시술 페이지를 한 개 이상 선택하세요.</p>
                        )}
                    </fieldset>
                )}

                {/* 전후사진 페이지 노출을 체크했을 때만 탭 선택을 보여준다. */}
                {usesReviews && (
                    <label className="mt-4 block text-small">
                        <span className="font-semibold text-cocoa">전후사진 페이지 카테고리</span>
                        <select
                            value={form.category}
                            onChange={(e) => setForm({ ...form, category: e.target.value })}
                            className={`${inputCls} mt-1.5`}
                        >
                            {BA_CATEGORIES.map((c) => (
                                <option key={c.key} value={c.key}>
                                    {c.label}
                                </option>
                            ))}
                        </select>
                        <span className="mt-1 block text-caption text-latte">
                            전후사진 페이지 상단 탭에서 이 사진이 어디에 걸릴지 정합니다. 사진이 한 장도 없는 탭은
                            화면에 나오지 않습니다.
                        </span>
                    </label>
                )}

                {/* 라벨 */}
                <div className="mt-4">
                    <p className="text-small font-semibold text-cocoa">
                        표시 라벨 (사진 아래 글자)
                        <span className="ml-2 text-caption font-normal text-latte">
                            {finalLabel.length}/{LIMITS.baLabel}자
                        </span>
                    </p>
                    <div className="mt-1.5 flex flex-col gap-2 sm:flex-row sm:items-center">
                        <span className="rounded-lg border border-cocoa/15 bg-cocoa/5 px-3 py-2 text-small text-latte">
                            {form.useCustomLabel ? '직접 입력 중' : autoLabel}
                        </span>
                        <label className="flex items-center gap-1.5 text-small text-latte">
                            <input
                                type="checkbox"
                                checked={form.useCustomLabel}
                                onChange={(e) => setForm({ ...form, useCustomLabel: e.target.checked })}
                            />
                            직접 입력
                        </label>
                        {form.useCustomLabel && (
                            <input
                                placeholder="예: 색소 3회차"
                                value={form.customLabel}
                                maxLength={LIMITS.baLabel}
                                onChange={(e) => setForm({ ...form, customLabel: e.target.value })}
                                className={`${inputCls} flex-1`}
                            />
                        )}
                    </div>
                </div>

                {/* 사진 */}
                <div className="mt-5 rounded-lg bg-cocoa/[0.03] p-4">
                    <p className="text-small font-semibold text-cocoa">사진 업로드</p>
                    <p className="mt-1 text-caption text-latte">
                        화면에 보이는 크기는 가로 {BA_IMAGE_GUIDE.displayWidth} × 세로 {BA_IMAGE_GUIDE.displayHeight}px
                        입니다. 선명하게 보이려면{' '}
                        <b>
                            2배 크기({BA_IMAGE_GUIDE.recommendWidth} × {BA_IMAGE_GUIDE.recommendHeight}px)
                        </b>{' '}
                        로 올려주세요. 비율이 다르면 가운데 기준으로 잘려 보입니다. (최대 {BA_IMAGE_GUIDE.maxFileSizeMB}
                        MB)
                    </p>
                    <div className="mt-3 flex flex-col gap-4 sm:flex-row">
                        <label className="flex-1 text-small">
                            <span className="font-semibold text-cocoa">전(Before)</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => pickFile(e.target.files?.[0] ?? null, setBeforeFile)}
                                className="mt-1.5 block w-full text-small"
                            />
                        </label>
                        <label className="flex-1 text-small">
                            <span className="font-semibold text-cocoa">후(After)</span>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => pickFile(e.target.files?.[0] ?? null, setAfterFile)}
                                className="mt-1.5 block w-full text-small"
                            />
                        </label>
                    </div>
                    {editingId && (
                        <p className="mt-2 text-caption text-latte">
                            수정 시 사진을 새로 고르지 않으면 <b>기존 사진이 그대로 유지</b>됩니다.
                        </p>
                    )}
                </div>

                {/* 순서 — 선택한 시술 페이지들에서 공통으로 쓰는 순번이라 전후사진 전용 사진에는 필요 없다
                    (전후사진 페이지는 매번 무작위로 섞어서 보여줌) */}
                <label className={`mt-5 block text-small ${usesTreatment ? '' : 'hidden'}`}>
                    <span className="font-semibold text-cocoa">선택한 시술 페이지에서 몇 번째로 보일까요?</span>
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
                        선택한 모든 시술 페이지에서 같은 순서 번호로 노출됩니다.
                    </span>
                    {targetStats.map((target) => (
                        <span key={target.slug} className="mt-1 block text-caption text-latte">
                            {treatmentPageName(target.slug)}: {target.count}장 / 최대 {COUNT_LIMITS.baPerPage}장
                            {target.usedOrders.length > 0 &&
                                ` · 사용중: ${[...target.usedOrders].sort((a, b) => a - b).join(', ')}`}
                        </span>
                    ))}
                    {isDuplicateOrder && (
                        <span className="mt-1 flex items-center gap-2 text-caption text-red-500">
                            {duplicateTargets.map((target) => treatmentPageName(target.slug)).join(', ')}에서 이미 사용 중인
                            번호입니다.
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
                            {fullTargets.map((target) => treatmentPageName(target.slug)).join(', ')}의 최대 개수에
                            도달했습니다. 기존 사진을 삭제한 뒤 등록하세요.
                        </span>
                    )}
                </label>

                {/* 메인 노출 */}
                <div className="mt-5 rounded-lg bg-cocoa/[0.03] p-4">
                    <label className="flex flex-wrap items-center gap-2 text-small">
                        <input
                            type="checkbox"
                            checked={form.showMain}
                            onChange={(e) => setForm({ ...form, showMain: e.target.checked })}
                        />
                        <span className="font-semibold text-cocoa">메인 페이지에도 노출</span>
                        {form.showMain && (
                            <>
                                <span className="text-latte">순서</span>
                                <input
                                    type="number"
                                    min={1}
                                    value={form.mainOrder}
                                    onChange={(e) => setForm({ ...form, mainOrder: Number(e.target.value) })}
                                    className={`w-20 rounded-lg border px-2 py-1.5 ${
                                        isDuplicateMain ? 'border-red-400' : 'border-cocoa/20'
                                    }`}
                                />
                            </>
                        )}
                    </label>
                    {form.showMain && (
                        <p className="mt-1.5 text-caption text-latte">
                            메인 노출: {mainItems.length}장 / 최대 {COUNT_LIMITS.baMain}장
                            {usedMainOrders.length > 0 &&
                                ` · 사용중: ${[...usedMainOrders].sort((a, b) => a - b).join(', ')}`}
                        </p>
                    )}
                    {isDuplicateMain && (
                        <p className="mt-1 flex items-center gap-2 text-caption text-red-500">
                            이미 사용 중인 번호입니다.
                            <button
                                type="button"
                                onClick={() => setForm({ ...form, mainOrder: nextFreeOrder(usedMainOrders) })}
                                className="rounded border border-red-300 px-2 py-0.5 text-red-600"
                            >
                                비어있는 {nextFreeOrder(usedMainOrders)}번으로 바꾸기
                            </button>
                        </p>
                    )}
                    {isOverMainCount && (
                        <p className="mt-1 text-caption text-red-500">메인 노출 최대 개수에 도달했습니다.</p>
                    )}
                </div>

                {/* 중복/초과 상태에서는 버튼 자체를 눌러지지 않게 막음 */}
                <button
                    onClick={submit}
                    disabled={
                        busy ||
                        (usesTreatment && form.slugs.length === 0) ||
                        isDuplicateOrder ||
                        isDuplicateMain ||
                        isOverCount ||
                        isOverMainCount
                    }
                    className="mt-6 w-full rounded-lg bg-cocoa py-3 text-medium font-semibold text-cream transition-colors hover:bg-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {busy
                        ? '업로드 중...'
                        : usesTreatment && form.slugs.length === 0
                          ? '시술 페이지를 선택하세요'
                          : isDuplicateOrder || isDuplicateMain
                          ? '순서 번호를 바꿔주세요'
                          : editingId
                            ? '수정 완료'
                            : '등록'}
                </button>
            </div>

            {/* ══════════ 목록 ══════════ */}
            <div className="mt-8 flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-lead font-bold text-cocoa">등록된 사진 ({visibleItems.length})</h2>
                <select
                    value={filterPlace}
                    onChange={(e) => setFilterPlace(e.target.value)}
                    aria-label="노출 위치로 거르기"
                    className="rounded-lg border border-cocoa/15 px-2 py-1.5 text-small"
                >
                    <option value="all">노출 위치 전체</option>
                    {BA_PLACES.map((p) => (
                        <option key={p.key} value={p.key}>
                            {p.label}
                        </option>
                    ))}
                </select>
                <select
                    value={filterSlug}
                    onChange={(e) => setFilterSlug(e.target.value)}
                    aria-label="시술 페이지로 거르기"
                    className="rounded-lg border border-cocoa/15 px-2 py-1.5 text-small"
                >
                    <option value="all">전체 시술 페이지</option>
                    {TREATMENT_PAGE_GROUPS.map((group) => (
                        <optgroup key={group.key} label={group.label}>
                            {group.pages.map((p) => (
                                <option key={p.slug} value={p.slug}>
                                    {p.label}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
                {visibleItems.map((it) => (
                    <div
                        key={it.id}
                        className="flex flex-col gap-3 rounded-xl bg-white p-3 shadow-[0_1px_8px_rgba(69,54,45,0.05)] sm:flex-row sm:items-center"
                    >
                        <div className="flex gap-2">
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                                <Image src={it.before} alt="" fill sizes="64px" className="object-cover" />
                            </div>
                            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                                <Image src={it.after} alt="" fill sizes="64px" className="object-cover" />
                            </div>
                        </div>
                        <div className="min-w-0 flex-1 text-small">
                            <p className="flex flex-wrap items-center gap-2 font-semibold text-cocoa">
                                {it.label}
                                <span className="rounded-full bg-cocoa/8 px-2 py-0.5 text-caption font-normal text-latte">
                                    {baPlaceLabel(it.place)}
                                </span>
                            </p>
                            <p className="mt-0.5 text-latte">
                                {showsOnTreatment(it) &&
                                    `${resolveBASlugs(it)
                                        .map((slug) => treatmentPageName(slug))
                                        .join(', ')}${typeof it.order === 'number' ? ` · ${it.order}번` : ''}`}
                                {showsOnTreatment(it) && showsOnReviews(it) && ' / '}
                                {showsOnReviews(it) && `탭 ${baCategoryLabel(resolveBACategory(it) ?? '미지정')}`}
                                {typeof it.main === 'number' && (
                                    <span className="ml-2 rounded-full bg-cocoa/8 px-2 py-0.5 text-caption">
                                        메인 {it.main}번
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex shrink-0 gap-3 text-small">
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
                        등록된 전후사진이 없습니다. 사이트에도 아무것도 안 나옵니다.
                    </p>
                )}
            </div>
        </div>
    );
}

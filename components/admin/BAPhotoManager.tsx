/* 전후사진 관리 — 홈페이지 전후사진 페이지와 같은 카드 격자에서 사진을 올리고 고친다. */

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { addDoc, collection, deleteDoc, doc, onSnapshot, serverTimestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/components/lib/firebase';
import { deleteStoredImage, uploadImage } from '@/components/lib/storageUpload';
import { SIGNATURE_BA_VISIBLE, isSignatureSlug } from '@/components/lib/signaturePages';
import {
    BA_IMAGE_GUIDE,
    COUNT_LIMITS,
    LIMITS,
    TREATMENT_PAGES,
    TREATMENT_PAGE_GROUPS,
} from '@/components/lib/adminConfig';
import {
    BA_CATEGORIES,
    baCategoryLabel,
    baCreatedAtMillis,
    baPhotoUrl,
    formatTreatmentDate,
    sortBAPhotos,
    resolveBACategory,
    resolveBAPlace,
    resolveBASlugs,
    showsOnReviews,
    showsOnTreatment,
} from '@/components/lib/ba';
import {
    AddRowButton,
    AdminHeader,
    DragHandle,
    ErrorBanner,
    Field,
    HelpBanner,
    MoveButton,
    TextAction,
    Toast,
    VisibilitySwitch,
    confirmDelete,
    useAdminAction,
    useDragReorder,
} from '@/components/admin/AdminUI';

interface BAPhotoDoc {
    id: string;
    slug: string;
    slugs?: string[];
    label: string;
    before: string;
    after: string;
    main?: number;
    mainManual?: boolean;
    order?: number;
    orderManual?: boolean;
    reviewsOrder?: number;
    reviewsManual?: boolean;
    category?: string;
    place?: string;
    treatmentDate?: string;
    createdAt?: unknown;
}

const VALID_SLUGS = new Set(TREATMENT_PAGES.map((page) => page.slug));


const emptyForm = () => ({
    place: 'treatment' as string,
    slugs: [] as string[],
    category: BA_CATEGORIES[0].key as string,
    label: '',
    treatmentDate: '',
    showMain: false,
    imageFile: null as File | null,
    previewUrl: '',
});

export default function BAPhotoManager() {
    const [items, setItems] = useState<BAPhotoDoc[]>([]);
    const [filter, setFilter] = useState<string>(BA_CATEGORIES[0].key);
    /* 시술 페이지별 보기는 탭(filter)과 반드시 다른 상태로 둔다.
       #ISSUE: 처음에는 filter 하나에 탭 값과 페이지 slug 를 같이 담았는데, 전후사진 탭의
               카테고리 키와 시그니처 페이지 slug 가 글자가 같다(acne = 여드름 / 비수술 턱끝전진 필러,
               redness = 홍조 / 비수술 눈밑 지방 재배치). 그래서 홍조 탭을 누르면 화면은 홍조 사진인데
               "비수술 눈밑 지방 재배치 페이지 순서" 라고 뜨고, 순서 화살표까지 나왔다. */
    const [orderPage, setOrderPage] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [form, setForm] = useState(emptyForm());
    const [loading, setLoading] = useState(true);
    const { busy, error, toast, run, setError } = useAdminAction();
    const formSection = useRef<HTMLElement>(null);

    useEffect(
        () =>
            onSnapshot(
                collection(db, 'baPhotos'),
                (snapshot) => {
                    setItems(
                        snapshot.docs
                            .map((entry) => ({ id: entry.id, ...entry.data() }) as BAPhotoDoc)
                            .sort((a, b) => baCreatedAtMillis(b.createdAt) - baCreatedAtMillis(a.createdAt)),
                    );
                    setLoading(false);
                    setError(null);
                },
                (snapshotError) => {
                    setError(snapshotError.message || '전후사진을 불러오지 못했습니다.');
                    setLoading(false);
                },
            ),
        [setError],
    );

    const nextFreeOrder = (taken: number[]) => {
        for (let number = 1; number <= taken.length + 1; number += 1) if (!taken.includes(number)) return number;
        return taken.length + 1;
    };

    const usesTreatment = form.place !== 'reviews';
    const usesReviews = form.place !== 'treatment';
    const pageName = (slug: string) => TREATMENT_PAGES.find((page) => page.slug === slug)?.label ?? slug;

    /* 시술 페이지 하나를 고른 상태. 이때만 순서를 바꿀 수 있다.
       #ISSUE: order 는 "그 시술 페이지 안에서 몇 번째" 라는 뜻인데, 지금까지는 등록할 때
               자동으로 붙기만 하고 고칠 방법이 없었다. 전체 목록에서는 사진마다 속한 페이지가
               달라 순서를 논할 수 없으므로, 페이지를 하나 고른 화면에서만 순서를 바꾼다. */
    const orderingSlug = TREATMENT_PAGES.some((page) => page.slug === orderPage) ? orderPage : null;
    /* 전후사진 페이지 탭을 고른 상태. 시술 페이지 순서(order)와 섞이지 않게 reviewsOrder 만 고친다. */
    const orderingCategory =
        !orderingSlug && BA_CATEGORIES.some((category) => category.key === filter) ? filter : null;
    /* 메인에 보이는 사진 탭. 여기서 옮기면 main 번호만 바뀌고, 시술·전후사진 페이지 순서는 그대로다. */
    const orderingMain = !orderingSlug && filter === 'main';
    const canReorder = Boolean(orderingSlug || orderingCategory || orderingMain);

    const visibleItems = useMemo(() => {
        if (orderingSlug) {
            return sortBAPhotos(
                items.filter((item) => showsOnTreatment(item) && resolveBASlugs(item).includes(orderingSlug)),
                { rank: (item) => item.order, pinned: (item) => item.orderManual === true },
            );
        }
        if (orderingMain) {
            return sortBAPhotos(
                items.filter((item) => typeof item.main === 'number'),
                { rank: (item) => item.main, pinned: (item) => item.mainManual === true },
            );
        }
        if (orderingCategory) {
            return sortBAPhotos(
                items.filter((item) => showsOnReviews(item) && resolveBACategory(item) === orderingCategory),
                { rank: (item) => item.reviewsOrder, pinned: (item) => item.reviewsManual === true },
            );
        }
        return items;
    }, [items, filter, orderingSlug, orderingCategory, orderingMain]);

    /* 옮긴 뒤 1,2,3… 으로 다시 매긴다. 두 개만 맞바꾸면 번호가 겹쳐 순서가 튄다.
       메인 탭은 main, 시술 페이지는 order, 전후사진 탭은 reviewsOrder.
       #NOTE: 한 사진을 여러 시술 페이지에 걸어 둔 경우 order 는 하나뿐이라, 시술 페이지에서 옮기면
              그 사진이 걸린 다른 시술 페이지에서도 같은 순서로 움직인다. 전후사진 페이지·메인 순서는 건드리지 않는다. */
    const saveOrder = (orderedIds: string[]) =>
        void run(
            async () => {
                const field = orderingMain ? 'main' : orderingCategory ? 'reviewsOrder' : 'order';
                const manualField = orderingMain ? 'mainManual' : orderingCategory ? 'reviewsManual' : 'orderManual';
                const batch = writeBatch(db);
                orderedIds.forEach((id, index) =>
                    batch.update(doc(db, 'baPhotos', id), { [field]: index + 1, [manualField]: true }),
                );
                await batch.commit();
            },
            '순서 변경 실패',
            '순서를 바꿨습니다',
        );

    const drag = useDragReorder(saveOrder);
    const orderedIds = visibleItems.map((item) => item.id);

    const nudge = (index: number, step: -1 | 1) => {
        const swap = index + step;
        if (swap < 0 || swap >= orderedIds.length) return;
        const next = [...orderedIds];
        [next[index], next[swap]] = [next[swap], next[index]];
        saveOrder(next);
    };

    /* 폼은 목록 위에 있어도 화면 밖일 수 있다 → 열릴 때 스스로 화면으로 온다.
       #ISSUE: 예전에는 startEdit 에서 window.scrollTo(0) 을 불렀다. 화면 맨 위(제목·사용법)로만
               올라가서 정작 폼은 안 보였고, [고치기]·[+ 사진 올리기] 를 눌러도 아무 일도
               안 일어난 것처럼 보였다. */
    useEffect(() => {
        if (adding || editingId) formSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, [adding, editingId]);

    const startAdd = () => {
        setEditingId(null);
        setAdding(true);
        setForm(emptyForm());
    };

    const startEdit = (item: BAPhotoDoc) => {
        const place = resolveBAPlace(item);
        const slugs = resolveBASlugs(item).filter((slug) => VALID_SLUGS.has(slug as (typeof TREATMENT_PAGES)[number]['slug']));
        setEditingId(item.id);
        setAdding(false);
        setForm({
            place,
            slugs,
            category: resolveBACategory(item) ?? BA_CATEGORIES[0].key,
            label: item.label,
            treatmentDate: item.treatmentDate ?? '',
            showMain: typeof item.main === 'number',
            imageFile: null,
            previewUrl: baPhotoUrl(item),
        });
    };

    const cancel = () => {
        setEditingId(null);
        setAdding(false);
        setForm(emptyForm());
    };

    const pickFile = (file: File | null) => {
        if (file && file.size > BA_IMAGE_GUIDE.maxFileSizeMB * 1024 * 1024) {
            alert(`사진은 ${BA_IMAGE_GUIDE.maxFileSizeMB}MB 이하로 올려 주세요.`);
            return;
        }
        setForm((current) => ({
            ...current,
            imageFile: file,
            previewUrl: file ? URL.createObjectURL(file) : current.previewUrl,
        }));
    };

    const submit = () =>
        run(
            async () => {
                /* 시술 페이지 칩을 다 끄면 "이 사진은 시술 페이지에 안 보이게" 라는 뜻으로 받아들인다.
                   #ISSUE: 예전에는 여기서 저장을 막고 "시술 페이지를 골라 주세요" 를 화면 맨 위 띠에 띄웠다.
                           한 페이지에만 걸린 사진을 화면에서 빼려고 칩을 끈 사람에게는, 이유가 저 위에 있어
                           보이지 않으니 "저장 버튼이 안 먹는다" 로만 느껴졌다.
                           → 칩을 다 끄면 전후사진 페이지 노출만 남긴다(place='reviews'). 그래야 시술 페이지에서
                             사진이 빠지면서도 전후사진 페이지에는 그대로 남는다. */
                const place = usesTreatment && form.slugs.length === 0 ? 'reviews' : form.place;
                if (place === 'reviews' && !usesReviews) {
                    throw new Error('이대로 저장하면 사진이 어디에도 안 보입니다. 시술 페이지를 고르거나 [전후사진 페이지]를 켜 주세요.');
                }
                if (!form.label.trim()) throw new Error('사진 아래 이름을 적어 주세요.');
                if (!form.treatmentDate) throw new Error('시술일을 골라 주세요.');
                if (!editingId && !form.imageFile) throw new Error('사진을 올려 주세요.');

                const existing = items.find((item) => item.id === editingId);
                const imageUrl = form.imageFile ? await uploadImage(form.imageFile, 'ba') : form.previewUrl;
                if (!imageUrl) throw new Error('사진을 올리지 못했습니다.');

                const usedOrders = items
                    .filter((item) => item.id !== editingId && showsOnTreatment(item) && resolveBASlugs(item).some((slug) => form.slugs.includes(slug)))
                    .map((item) => item.order ?? 0)
                    .filter(Boolean);
                const usedReviewsOrders = items
                    .filter((item) => item.id !== editingId && showsOnReviews(item) && resolveBACategory(item) === form.category)
                    .map((item) => item.reviewsOrder ?? 0)
                    .filter(Boolean);
                const usedMain = items.filter((item) => item.id !== editingId && typeof item.main === 'number').map((item) => item.main as number);
                const keepsReviewsOrder =
                    existing?.reviewsOrder &&
                    resolveBACategory(existing) === form.category &&
                    !usedReviewsOrders.includes(existing.reviewsOrder);
                const dateChanged = Boolean(existing && existing.treatmentDate !== form.treatmentDate);

                const payload = {
                    place,
                    slug: form.slugs[0] ?? existing?.slug ?? TREATMENT_PAGES[0].slug,
                    slugs: form.slugs,
                    category: form.category,
                    label: form.label.trim().slice(0, LIMITS.baLabel),
                    treatmentDate: form.treatmentDate,
                    before: imageUrl,
                    after: imageUrl,
                    order: existing?.order && !usedOrders.includes(existing.order) ? existing.order : nextFreeOrder(usedOrders),
                    ...(place !== 'treatment'
                        ? { reviewsOrder: keepsReviewsOrder ? existing.reviewsOrder : nextFreeOrder(usedReviewsOrders) }
                        : {}),
                    main: form.showMain
                        ? existing?.main && !usedMain.includes(existing.main)
                            ? existing.main
                            : nextFreeOrder(usedMain)
                        : null,
                    ...(dateChanged ? { orderManual: false, reviewsManual: false, mainManual: false } : {}),
                };

                if (editingId) await updateDoc(doc(db, 'baPhotos', editingId), payload);
                else await addDoc(collection(db, 'baPhotos'), { ...payload, createdAt: serverTimestamp() });

                if (existing && form.imageFile) {
                    await Promise.allSettled(
                        [...new Set([existing.before, existing.after].filter((url) => url && url !== imageUrl))].map((url) =>
                            deleteStoredImage(url),
                        ),
                    );
                }
                cancel();
            },
            '저장에 실패했습니다.',
            editingId ? '사진을 수정했습니다' : '사진을 올렸습니다',
        );

    const remove = (item: BAPhotoDoc) => {
        if (!confirmDelete(item.label || '이 사진')) return;
        void run(
            async () => {
                if (editingId === item.id) cancel();
                await deleteDoc(doc(db, 'baPhotos', item.id));
                await Promise.allSettled([...new Set([item.before, item.after].filter(Boolean))].map((url) => deleteStoredImage(url)));
            },
            '삭제에 실패했습니다.',
            '삭제했습니다',
        );
    };

    const mainCount = items.filter((item) => typeof item.main === 'number').length;
    const overMain = form.showMain && !editingId && mainCount >= COUNT_LIMITS.baMain;
    const overPage = usesTreatment && form.slugs.some((slug) => {
        const count = items.filter((item) => item.id !== editingId && showsOnTreatment(item) && resolveBASlugs(item).includes(slug)).length;
        return count >= COUNT_LIMITS.baPerPage;
    });

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">전후사진을 불러오는 중입니다.</div>;
    }

    return (
        <div className="pb-10">
            <AdminHeader
                title="전후사진 관리"
                description="홈페이지 전후사진과 같은 칸입니다. 사진을 눌러 고치거나, 아래 버튼으로 새 사진을 올립니다."
                previewHref="/reviews"
            />
            <ErrorBanner message={error} />
            <HelpBanner>
                <b className="text-cocoa">사용법</b> · 사진을 누르면 그 자리에서 이름·시술일·어디에 보일지를 고칩니다.
                새 사진은 맨 아래 <b className="text-cocoa">[+ 사진 올리기]</b>를 누르세요.
                <br />
                처음 순서는 <b className="text-cocoa">시술일이 최근인 사진</b>이 앞이고, 오래된 시술일은 뒤입니다. 같은
                날이면 나중에 올린 사진이 앞입니다. 방금 올린 사진은 시술일이 가장 최근일 때 맨 앞에 옵니다.
                <br />
                <b className="text-cocoa">메인 순서</b>는 [메인에 보이는 사진] 탭에서,{' '}
                <b className="text-cocoa">전후사진 페이지 순서</b>는 카테고리 탭에서,{' '}
                <b className="text-cocoa">시술 페이지 순서</b>는 아래 [시술 페이지별로 보기]에서 바꿉니다. 카드의
                화살표나 점 여섯 개(⠿)로 옮기면 그 화면 순서가 고정됩니다.
            </HelpBanner>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
                {[
                    { key: 'main', label: '메인에 보이는 사진' },
                    ...BA_CATEGORIES.map((category) => ({ key: category.key, label: category.label })),
                ].map((tab) => (
                    <button
                        key={tab.key}
                        type="button"
                        // 탭을 누르면 아래 시술 페이지 선택은 풀린다 (두 개가 동시에 켜져 보이지 않게)
                        onClick={() => {
                            setFilter(tab.key);
                            setOrderPage('');
                        }}
                        className={`rounded-full border px-4 py-2 text-small font-semibold ${
                            filter === tab.key && !orderingSlug
                                ? 'border-cocoa bg-cocoa text-cream'
                                : 'border-cocoa/15 bg-cream text-latte'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* 시술 페이지 하나만 보는 칸. 페이지가 16개라 위 탭에 다 늘어놓으면 탭이 두 줄을 넘는다 */}
            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                <span className="text-caption text-latte">시술 페이지별로 보기 · 순서 정하기</span>
                <select
                    value={orderingSlug ?? ''}
                    onChange={(event) => setOrderPage(event.target.value)}
                    className="min-h-11 rounded-full border border-cocoa/15 bg-white px-4 text-small font-semibold text-cocoa"
                >
                    <option value="">페이지 고르기</option>
                    {TREATMENT_PAGE_GROUPS.map((group) => (
                        <optgroup key={group.key} label={group.label}>
                            {group.pages.map((page) => (
                                <option key={page.slug} value={page.slug}>
                                    {page.label}
                                </option>
                            ))}
                        </optgroup>
                    ))}
                </select>
            </div>

            {orderingMain && (
                <p className="mt-3 text-center text-caption leading-6 text-latte">
                    메인 첫 화면에 나오는 사진 <b className="text-cocoa">{visibleItems.length}장</b>입니다. 여기 놓인 순서
                    그대로 메인에 나옵니다. 카드 아래 <b className="text-cocoa">화살표</b>나 점 여섯 개(⠿)를 끌어서
                    옮기세요. 전후사진 페이지·시술 페이지 순서는 바뀌지 않습니다.
                </p>
            )}

            {orderingCategory && (
                <p className="mt-3 text-center text-caption leading-6 text-latte">
                    전후사진 페이지의 <b className="text-cocoa">{baCategoryLabel(orderingCategory)}</b> 탭에 나오는 사진{' '}
                    <b className="text-cocoa">{visibleItems.length}장</b>입니다. 여기 놓인 순서 그대로 홈페이지에 나옵니다.
                    카드 아래 <b className="text-cocoa">화살표</b>나 점 여섯 개(⠿)를 끌어서 옮기세요. 시술 페이지 순서는
                    바뀌지 않습니다.
                </p>
            )}

            {orderingSlug && (
                <p className="mt-3 text-center text-caption leading-6 text-latte">
                    <b className="text-cocoa">{pageName(orderingSlug)}</b> 페이지에 걸어 둔 사진{' '}
                    <b className="text-cocoa">{visibleItems.length}장</b>입니다. 여기 놓인 순서 그대로 홈페이지에 나옵니다.
                    카드 아래 <b className="text-cocoa">화살표</b>나 점 여섯 개(⠿)를 끌어서 옮기세요. 전후사진 페이지 순서는
                    바뀌지 않습니다.
                    {/* 시그니처 페이지는 시안대로 3칸이라 앞 3장만 나간다 → 관리자에서 장수가 더 많아 보여도
                        오류가 아니라는 걸 이 자리에서 알려 준다 (뒤 사진은 More View → 전후사진 페이지에서 본다) */}
                    {isSignatureSlug(orderingSlug) && visibleItems.length > SIGNATURE_BA_VISIBLE && (
                        <>
                            <br />
                            시그니처 페이지는 <b className="text-cocoa">앞 {SIGNATURE_BA_VISIBLE}장</b>만 나옵니다. 뒤에
                            놓인 {visibleItems.length - SIGNATURE_BA_VISIBLE}장은 전후사진 페이지에서 보입니다. 보여줄
                            사진을 바꾸려면 순서를 앞으로 옮기세요.
                        </>
                    )}
                </p>
            )}

            {/* 사진 올리기는 목록 위에 둔다 — 사진이 100장을 넘으면 아래쪽 버튼은 한참 스크롤해야 나온다.
                누르면 바로 아래 폼이 열리므로 누른 자리에서 그대로 이어 쓸 수 있다. */}
            <div className="mt-8">
                <AddRowButton disabled={busy} onClick={startAdd}>
                    + 사진 올리기
                </AddRowButton>
            </div>

            {(adding || editingId) && (
                <section
                    ref={formSection}
                    className="mt-6 scroll-mt-4 rounded-2xl bg-white p-5 shadow-[0_8px_24px_rgba(69,54,45,0.06)] md:p-7"
                >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <h2 className="text-lead font-bold text-cocoa">{editingId ? '이 사진 고치기' : '새 사진 올리기'}</h2>
                        <TextAction onClick={cancel}>취소</TextAction>
                    </div>

                    <div className="mt-5 grid gap-6 md:grid-cols-[220px_1fr]">
                        <label className="block cursor-pointer">
                            <span className="relative flex aspect-square items-center justify-center overflow-hidden rounded-[6px] bg-sand/40 ring-1 ring-cocoa/10">
                                {form.previewUrl ? (
                                    <Image src={form.previewUrl} alt="" fill unoptimized className="object-contain" />
                                ) : (
                                    <span className="px-4 text-center text-small font-semibold text-latte">여기를 눌러 사진 올리기</span>
                                )}
                            </span>
                            <input
                                type="file"
                                accept="image/*"
                                className="sr-only"
                                onChange={(event) => pickFile(event.target.files?.[0] ?? null)}
                            />
                            <p className="mt-2 text-center text-caption text-latte">
                                {BA_IMAGE_GUIDE.recommendWidth}×{BA_IMAGE_GUIDE.recommendHeight}px 정사각 권장
                            </p>
                        </label>

                        <div>
                            <p className="text-caption font-semibold text-latte">사진 아래 이름</p>
                            <Field
                                value={form.label}
                                onChange={(label) => setForm((current) => ({ ...current, label }))}
                                placeholder="예: 리베리 볼륨부스터"
                                className="border-cocoa/15 bg-white text-small font-bold text-cocoa"
                            />

                            <p className="mt-4 text-caption font-semibold text-latte">시술일</p>
                            <input
                                type="date"
                                value={form.treatmentDate}
                                onChange={(event) => setForm((current) => ({ ...current, treatmentDate: event.target.value }))}
                                className="mt-1 min-h-11 rounded-lg border border-cocoa/15 px-3 text-small text-cocoa"
                            />

                            <p className="mt-4 text-caption font-semibold text-latte">어디에 보일까요?</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                <Chip
                                    active={usesTreatment}
                                    onClick={() =>
                                        setForm((current) => ({
                                            ...current,
                                            place: usesTreatment ? (usesReviews ? 'reviews' : current.place) : usesReviews ? 'both' : 'treatment',
                                        }))
                                    }
                                >
                                    시술 페이지
                                </Chip>
                                <Chip
                                    active={usesReviews}
                                    onClick={() =>
                                        setForm((current) => ({
                                            ...current,
                                            place: usesReviews ? (usesTreatment ? 'treatment' : current.place) : usesTreatment ? 'both' : 'reviews',
                                        }))
                                    }
                                >
                                    전후사진 페이지
                                </Chip>
                            </div>

                            {usesTreatment && (
                                <div className="mt-4 space-y-3">
                                    {TREATMENT_PAGE_GROUPS.map((group) => (
                                        <div key={group.key}>
                                            <p className="mb-2 text-caption font-semibold text-latte">{group.label}</p>
                                            <div className="flex flex-wrap gap-2">
                                                {group.pages.map((page) => (
                                                    <Chip
                                                        key={page.slug}
                                                        active={form.slugs.includes(page.slug)}
                                                        onClick={() =>
                                                            setForm((current) => ({
                                                                ...current,
                                                                slugs: current.slugs.includes(page.slug)
                                                                    ? current.slugs.filter((slug) => slug !== page.slug)
                                                                    : [...current.slugs, page.slug],
                                                            }))
                                                        }
                                                    >
                                                        {page.label}
                                                    </Chip>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                    {/* 칩을 다 끈 상태에서 저장을 눌러도 되는 걸 미리 알려 준다 (예전에는 여기서 저장이 막혔다) */}
                                    {form.slugs.length === 0 && (
                                        <p className="text-caption text-latte">
                                            켜진 페이지가 없습니다. 이대로 저장하면 시술 페이지에서는 빠지고{' '}
                                            {usesReviews ? '전후사진 페이지에만 남습니다.' : '어디에도 안 보이니 [전후사진 페이지]를 켜 주세요.'}
                                        </p>
                                    )}
                                </div>
                            )}

                            {usesReviews && (
                                <div className="mt-4">
                                    <p className="text-caption font-semibold text-latte">전후사진 페이지 탭</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {BA_CATEGORIES.map((category) => (
                                            <Chip
                                                key={category.key}
                                                active={form.category === category.key}
                                                onClick={() => setForm((current) => ({ ...current, category: category.key }))}
                                            >
                                                {category.label}
                                            </Chip>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="mt-5">
                                <VisibilitySwitch
                                    prominent
                                    visible={form.showMain}
                                    disabled={busy || overMain}
                                    onLabel="메인에도 보임"
                                    offLabel="메인은 안 보임 · 눌러서 넣기"
                                    onChange={(showMain) => setForm((current) => ({ ...current, showMain }))}
                                />
                                <p className="mt-2 text-caption text-latte">
                                    버튼이 초록색이면 메인 첫 화면에도 나갑니다. 지금 {mainCount}/{COUNT_LIMITS.baMain}장
                                </p>
                                {overMain && <p className="mt-1 text-caption text-red-600">메인 사진은 더 넣을 수 없습니다.</p>}
                                {overPage && (
                                    <p className="mt-1 text-caption text-red-600">
                                        선택한 시술 페이지에 사진이 가득 찼습니다. 기존 사진을 지운 뒤 올려 주세요.
                                    </p>
                                )}
                            </div>

                            <button
                                type="button"
                                disabled={busy || overMain || overPage}
                                onClick={() => void submit()}
                                className="mt-6 inline-flex min-h-12 items-center rounded-full bg-[#C95813] px-8 text-small font-bold text-white disabled:opacity-40"
                            >
                                {busy ? '저장 중…' : editingId ? '이 사진 저장하기' : '사진 올리기'}
                            </button>
                            {/* #ISSUE: 저장이 막힌 이유(빈 칸·글자수 등)를 화면 맨 위 띠에만 띄웠더니, 버튼까지
                                내려온 사람에게는 아무 반응 없이 안 되는 것처럼 보였다 → 버튼 바로 옆에도 같이 띄운다 */}
                            {error && <p className="mt-3 text-caption text-red-600">{error}</p>}
                        </div>
                    </div>
                </section>
            )}

            <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {visibleItems.map((item, index) => (
                    <article
                        key={item.id}
                        {...(canReorder && !busy ? drag.rowProps(item.id, orderedIds) : {})}
                        className={`overflow-hidden rounded-[6px] bg-white shadow-[0_4px_18px_rgba(69,54,45,0.06)] ring-1 ${
                            drag.isTarget(item.id) ? 'ring-2 ring-[#C95813]' : 'ring-cocoa/[0.06]'
                        } ${drag.isMoving(item.id) ? 'opacity-40' : ''}`}
                    >
                        <div className="flex items-center justify-between gap-2 px-3.5 pb-2 pt-3.5">
                            <span className="flex min-w-0 items-center gap-1.5">
                                {/* 순서를 정하는 화면에서는 몇 번째인지 숫자로 보여 준다 */}
                                {canReorder && (
                                    <span className="font-display shrink-0 text-caption-sm font-bold text-[#C95813]">
                                        {index + 1}
                                    </span>
                                )}
                                <span className="truncate rounded-full bg-sand/70 px-2.5 py-1 text-caption-sm font-semibold text-cocoa/70">
                                    {item.label || baCategoryLabel(resolveBACategory(item) ?? '')}
                                </span>
                            </span>
                            <span className="font-display text-caption-sm tracking-[0.2em] text-cocoa/30">RE:BERRY</span>
                        </div>
                        <button type="button" onClick={() => startEdit(item)} className="relative block aspect-square w-full bg-white">
                            {baPhotoUrl(item) && (
                                <Image src={baPhotoUrl(item)} alt="" fill unoptimized sizes="220px" className="object-contain" />
                            )}
                        </button>
                        <div className="space-y-2 px-3 py-3">
                            <p className="text-caption text-latte">
                                {showsOnTreatment(item) && resolveBASlugs(item).map(pageName).join(', ')}
                                {showsOnTreatment(item) && showsOnReviews(item) && ' · '}
                                {showsOnReviews(item) && `전후사진 · ${baCategoryLabel(resolveBACategory(item) ?? '')}`}
                                {typeof item.main === 'number' && ' · 메인'}
                                {item.treatmentDate && ` · ${formatTreatmentDate(item.treatmentDate)}`}
                            </p>
                            <div className="flex items-center gap-2">
                                <TextAction onClick={() => startEdit(item)}>고치기</TextAction>
                                <TextAction tone="danger" disabled={busy} onClick={() => remove(item)}>
                                    삭제
                                </TextAction>
                                {canReorder && (
                                    <span className="ml-auto flex items-center gap-1">
                                        <span className="text-caption-sm text-latte">순서</span>
                                        <MoveButton
                                            dir="left"
                                            disabled={busy || index === 0}
                                            onClick={() => nudge(index, -1)}
                                        />
                                        <MoveButton
                                            dir="right"
                                            disabled={busy || index === visibleItems.length - 1}
                                            onClick={() => nudge(index, 1)}
                                        />
                                        {/* 손잡이만 끌리게 둔다 → 사진을 눌러 고치는 동작을 방해하지 않는다 */}
                                        <DragHandle disabled={busy} {...(busy ? {} : drag.handleProps(item.id))} />
                                    </span>
                                )}
                            </div>
                        </div>
                    </article>
                ))}
            </div>

            {visibleItems.length === 0 && (
                <p className="mt-10 rounded-2xl bg-white py-16 text-center text-small text-latte">이 칸에 사진이 없습니다.</p>
            )}

            <Toast message={toast} />
        </div>
    );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`inline-flex min-h-11 items-center rounded-full border px-4 text-small font-semibold ${
                active ? 'border-cocoa bg-cocoa text-cream' : 'border-cocoa/15 bg-white text-latte'
            }`}
        >
            {children}
        </button>
    );
}

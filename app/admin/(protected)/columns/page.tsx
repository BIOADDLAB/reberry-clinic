'use client';

import { useEffect, useMemo, useState } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '@/components/lib/firebase';
import { solutions } from '@/components/lib/solutions';
import {
    SIGNATURE_PAGES,
    SKIN_TREATMENT_PAGES,
    AGING_LIFTING_PAGES,
    LIMITS,
    COUNT_LIMITS,
} from '@/components/lib/adminConfig';
import { site } from '@/components/lib/site';

type ColumnScope = 'signature' | 'skin' | 'aging' | 'device';
type FilterScope = 'all' | ColumnScope;

interface ColDoc {
    id: string;
    title: string;
    en: string;
    text: string;
    link: string;
    slugs: string[];
    order: number;
}

interface PageOption {
    slug: string;
    label: string;
}

const DEVICE_OPTIONS: PageOption[] = solutions.map((solution) => ({
    slug: solution.slug,
    label: solution.name,
}));

const PAGE_OPTIONS: Record<ColumnScope, readonly PageOption[]> = {
    signature: SIGNATURE_PAGES,
    skin: SKIN_TREATMENT_PAGES,
    aging: AGING_LIFTING_PAGES,
    device: DEVICE_OPTIONS,
};

const SCOPE_LABEL: Record<ColumnScope, string> = {
    signature: '시그니처 시술',
    skin: '피부교정',
    aging: '안티에이징 레이저리프팅',
    device: '기기·제품 상세',
};

const TREATMENT_SCOPE_SLUGS = new Set<string>([
    ...SIGNATURE_PAGES.map((page) => page.slug),
    ...SKIN_TREATMENT_PAGES.map((page) => page.slug),
    ...AGING_LIFTING_PAGES.map((page) => page.slug),
]);

const EMPTY_FORM = {
    scope: 'signature' as ColumnScope,
    targets: [SIGNATURE_PAGES[0].slug] as string[],
    title: '',
    en: '',
    text: '',
    link: '',
    order: 1,
    alsoDevice: false,
    deviceTarget: DEVICE_OPTIONS[0].slug,
};

const nextFreeOrder = (taken: number[]) => {
    for (let number = 1; number <= taken.length + 1; number += 1) {
        if (!taken.includes(number)) return number;
    }
    return taken.length + 1;
};

export default function AdminColumnsPage() {
    const [items, setItems] = useState<ColDoc[]>([]);
    const [form, setForm] = useState(EMPTY_FORM);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [filterScope, setFilterScope] = useState<FilterScope>('all');
    const [filterTarget, setFilterTarget] = useState('all');

    useEffect(() => {
        const columnsQuery = query(collection(db, 'columns'), orderBy('order'));
        return onSnapshot(columnsQuery, (snapshot) => {
            setItems(snapshot.docs.map((column) => ({ id: column.id, ...column.data() })) as ColDoc[]);
        });
    }, []);

    const isDevice = form.scope === 'device';
    const titleLimit = form.en.trim() ? LIMITS.columnTitle : LIMITS.columnTitleNoEn;
    const selectedTargets = useMemo(() => {
        const targets =
            form.scope === 'signature' && form.alsoDevice
                ? [...form.targets, form.deviceTarget]
                : form.targets;
        return [...new Set(targets)];
    }, [form.scope, form.targets, form.alsoDevice, form.deviceTarget]);

    const targetLabel = (slug: string) => {
        const signature = SIGNATURE_PAGES.find((page) => page.slug === slug);
        if (signature) return `시그니처 · ${signature.label}`;

        const skin = SKIN_TREATMENT_PAGES.find((page) => page.slug === slug);
        if (skin) return `피부교정 · ${skin.label}`;

        const aging = AGING_LIFTING_PAGES.find((page) => page.slug === slug);
        if (aging) return `안티에이징 · ${aging.label}`;

        return `기기·제품 · ${DEVICE_OPTIONS.find((page) => page.slug === slug)?.label ?? slug}`;
    };

    const targetStats = useMemo(
        () =>
            selectedTargets.map((target) => {
                const targetItems = items.filter(
                    (item) => item.slugs.includes(target) && item.id !== editingId,
                );
                return {
                    target,
                    count: targetItems.length,
                    usedOrders: targetItems.map((item) => item.order),
                };
            }),
        [selectedTargets, items, editingId],
    );

    const duplicateTargets = targetStats.filter((stat) => stat.usedOrders.includes(form.order));
    const fullTargets = targetStats.filter((stat) => stat.count >= COUNT_LIMITS.columnPerPage);
    const isDuplicateOrder = duplicateTargets.length > 0;
    const isOverCount = fullTargets.length > 0;
    const firstTargetOrders = targetStats[0]?.usedOrders ?? [];

    const visibleItems = useMemo(() => {
        const scopeSlugs =
            filterScope === 'all'
                ? null
                : new Set<string>(PAGE_OPTIONS[filterScope].map((page) => page.slug));

        return items.filter((item) => {
            if (filterScope === 'device') {
                const hasDeviceTarget = item.slugs.some((slug) => !TREATMENT_SCOPE_SLUGS.has(slug));
                if (!hasDeviceTarget) return false;
            } else if (scopeSlugs && !item.slugs.some((slug) => scopeSlugs.has(slug))) {
                return false;
            }

            return filterTarget === 'all' || item.slugs.includes(filterTarget);
        });
    }, [items, filterScope, filterTarget]);

    const changeScope = (scope: ColumnScope) => {
        const target = PAGE_OPTIONS[scope][0].slug;
        const taken = items.filter((item) => item.slugs.includes(target)).map((item) => item.order);
        setForm({
            ...form,
            scope,
            targets: [target],
            order: nextFreeOrder(taken),
            alsoDevice: false,
        });
    };

    const changeSingleTarget = (target: string) => {
        const taken = items
            .filter((item) => item.slugs.includes(target) && item.id !== editingId)
            .map((item) => item.order);
        setForm({ ...form, targets: [target], order: nextFreeOrder(taken) });
    };

    const toggleTarget = (target: string, checked: boolean) => {
        const targets = checked
            ? [...form.targets, target]
            : form.targets.filter((selected) => selected !== target);
        const uniqueTargets = [...new Set(targets)];
        const taken = uniqueTargets.length === 1
            ? items
                  .filter((item) => item.slugs.includes(uniqueTargets[0]) && item.id !== editingId)
                  .map((item) => item.order)
            : [];

        setForm({
            ...form,
            targets: uniqueTargets,
            ...(uniqueTargets.length === 1 ? { order: nextFreeOrder(taken) } : {}),
        });
    };

    const startEdit = (item: ColDoc) => {
        const signatureTargets = item.slugs.filter((slug) => SIGNATURE_PAGES.some((page) => page.slug === slug));
        const skinTargets = item.slugs.filter((slug) => SKIN_TREATMENT_PAGES.some((page) => page.slug === slug));
        const agingTargets = item.slugs.filter((slug) => AGING_LIFTING_PAGES.some((page) => page.slug === slug));
        const deviceTargets = item.slugs.filter((slug) => !TREATMENT_SCOPE_SLUGS.has(slug));

        const scope: ColumnScope = signatureTargets.length
            ? 'signature'
            : skinTargets.length
              ? 'skin'
              : agingTargets.length
                ? 'aging'
                : 'device';
        const targets =
            scope === 'signature'
                ? signatureTargets
                : scope === 'skin'
                  ? skinTargets
                  : scope === 'aging'
                    ? agingTargets
                    : deviceTargets;

        setEditingId(item.id);
        setForm({
            scope,
            targets: targets.length ? targets : [PAGE_OPTIONS[scope][0].slug],
            title: item.title ?? '',
            en: item.en ?? '',
            text: item.text ?? '',
            link: item.link ?? '',
            order: item.order ?? 1,
            alsoDevice: scope === 'signature' && deviceTargets.length > 0,
            deviceTarget: deviceTargets[0] ?? DEVICE_OPTIONS[0].slug,
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
    };

    const submit = async () => {
        if (selectedTargets.length === 0) return alert('노출할 페이지를 하나 이상 선택하세요.');
        if (!form.text.trim()) return alert('제목(카드 본문)을 입력하세요.');
        if (!isDevice && !form.title.trim()) return alert('시술·기기 이름을 입력하세요.');
        if (isDuplicateOrder) {
            return alert(`${duplicateTargets.map((stat) => targetLabel(stat.target)).join(', ')} 페이지에 이미 ${form.order}번이 있습니다.`);
        }
        if (isOverCount) {
            return alert(`${fullTargets.map((stat) => targetLabel(stat.target)).join(', ')} 페이지는 칼럼을 더 등록할 수 없습니다.`);
        }

        setBusy(true);
        try {
            const payload = {
                title: isDevice ? '' : form.title.trim(),
                en: isDevice ? '' : form.en.trim(),
                text: form.text.replace(/\\n/g, '\n'),
                link: form.link.trim(),
                slugs: selectedTargets,
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

    const remove = async (item: ColDoc) => {
        if (!confirm(`"${item.text.split('\n')[0]}" 칼럼을 삭제할까요?`)) return;
        if (editingId === item.id) cancelEdit();
        await deleteDoc(doc(db, 'columns', item.id));
    };

    const inputClass =
        'w-full rounded-lg border border-cocoa/15 px-3 py-2.5 text-small outline-none focus:border-cocoa/40';
    const isCheckboxScope = form.scope === 'skin' || form.scope === 'aging';

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-h2 font-bold text-cocoa">블로그 연결 관리</h1>
            <p className="mt-1 text-small text-latte">닥터 파이톤 블로그 연결 카드를 등록·수정합니다.</p>

            <div className="mt-6 rounded-2xl bg-white p-5 shadow-[0_2px_20px_rgba(69,54,45,0.06)] md:p-7">
                {editingId && (
                    <div className="mb-5 flex items-center justify-between rounded-lg bg-cocoa/5 px-4 py-2.5 text-small">
                        <span className="font-semibold text-cocoa">수정 중입니다</span>
                        <button onClick={cancelEdit} className="text-latte underline">
                            취소하고 새로 등록
                        </button>
                    </div>
                )}

                <p className="text-small font-semibold text-cocoa">어디에 노출할까요?</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-small">
                    {(Object.keys(SCOPE_LABEL) as ColumnScope[]).map((scope) => (
                        <label key={scope} className="flex items-center gap-1.5">
                            <input
                                type="radio"
                                checked={form.scope === scope}
                                onChange={() => changeScope(scope)}
                            />
                            {SCOPE_LABEL[scope]}
                        </label>
                    ))}
                </div>

                {isCheckboxScope ? (
                    <fieldset className="mt-3 rounded-lg bg-cocoa/[0.03] p-4">
                        <legend className="px-1 text-small font-semibold text-cocoa">노출할 페이지를 선택하세요</legend>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {PAGE_OPTIONS[form.scope].map((page) => (
                                <label key={page.slug} className="flex items-center gap-2 text-small text-cocoa">
                                    <input
                                        type="checkbox"
                                        checked={form.targets.includes(page.slug)}
                                        onChange={(event) => toggleTarget(page.slug, event.target.checked)}
                                    />
                                    {page.label}
                                </label>
                            ))}
                        </div>
                    </fieldset>
                ) : (
                    <select
                        value={form.targets[0]}
                        onChange={(event) => changeSingleTarget(event.target.value)}
                        className={`${inputClass} mt-2`}
                    >
                        {PAGE_OPTIONS[form.scope].map((page) => (
                            <option key={page.slug} value={page.slug}>
                                {page.label}
                            </option>
                        ))}
                    </select>
                )}

                {isDevice && (
                    <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-caption text-amber-800">
                        기기·제품 상세 페이지의 칼럼 카드에는 <b>제목과 더보기 버튼만</b> 나옵니다. 시술·기기 이름과
                        영문 이름은 입력하지 않아도 됩니다.
                    </p>
                )}

                {!isDevice && (
                    <>
                        <div className="mt-4 flex flex-col gap-4 md:flex-row">
                            <label className="flex-1 text-small">
                                <span className="font-semibold text-cocoa">시술·기기 이름</span>
                                <span className="ml-2 text-caption text-latte">
                                    {form.title.length}/{titleLimit}자
                                </span>
                                <input
                                    placeholder="예: 온다리프팅"
                                    value={form.title}
                                    maxLength={titleLimit}
                                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                                    className={`${inputClass} mt-1.5`}
                                />
                            </label>
                            <label className="flex-1 text-small">
                                <span className="font-semibold text-cocoa">영문 이름</span>
                                <span className="ml-2 text-caption text-latte">(선택)</span>
                                <span className="ml-2 text-caption text-latte">
                                    {form.en.length}/{LIMITS.columnEn}자
                                </span>
                                <input
                                    placeholder="예: Onda"
                                    value={form.en}
                                    maxLength={LIMITS.columnEn}
                                    onChange={(event) => setForm({ ...form, en: event.target.value })}
                                    className={`${inputClass} mt-1.5`}
                                />
                            </label>
                        </div>

                        {form.scope === 'signature' && (
                            <div className="mt-4 rounded-lg bg-cocoa/[0.03] p-4">
                                <label className="flex items-center gap-2 text-small">
                                    <input
                                        type="checkbox"
                                        checked={form.alsoDevice}
                                        onChange={(event) => setForm({ ...form, alsoDevice: event.target.checked })}
                                    />
                                    <span className="font-semibold text-cocoa">
                                        같은 칼럼을 기기·제품 상세 페이지에도 추가
                                    </span>
                                </label>
                                {form.alsoDevice && (
                                    <select
                                        value={form.deviceTarget}
                                        onChange={(event) => setForm({ ...form, deviceTarget: event.target.value })}
                                        className={`${inputClass} mt-2`}
                                    >
                                        {DEVICE_OPTIONS.map((device) => (
                                            <option key={device.slug} value={device.slug}>
                                                {device.label}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        )}
                    </>
                )}

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
                        onChange={(event) => setForm({ ...form, text: event.target.value })}
                        className={`${inputClass} mt-1.5 resize-none`}
                    />
                    <span className="mt-1 block text-caption text-latte">
                        엔터로 줄바꿈할 수 있으며 카드에는 2줄까지만 보입니다.
                    </span>
                </label>

                <label className="mt-4 block text-small">
                    <span className="font-semibold text-cocoa">더보기 URL</span>
                    <input
                        placeholder="https://blog.naver.com/drpyton/..."
                        value={form.link}
                        onChange={(event) => setForm({ ...form, link: event.target.value })}
                        className={`${inputClass} mt-1.5`}
                    />
                    <span className="mt-1 block text-caption text-latte">
                        비워두면 블로그 홈({site.blog})으로 연결됩니다.
                    </span>
                </label>

                <label className="mt-4 block text-small">
                    <span className="font-semibold text-cocoa">몇 번째로 보이게 할까요?</span>
                    <input
                        type="number"
                        min={1}
                        value={form.order}
                        onChange={(event) => setForm({ ...form, order: Number(event.target.value) })}
                        className={`mt-1.5 w-20 rounded-lg border px-2 py-1.5 text-small ${
                            isDuplicateOrder ? 'border-red-400' : 'border-cocoa/15'
                        }`}
                    />
                    <span className="mt-1 block text-caption text-latte">
                        선택 페이지 {selectedTargets.length}개 · 페이지당 최대 {COUNT_LIMITS.columnPerPage}개
                    </span>
                    {isDuplicateOrder && (
                        <span className="mt-1 flex flex-wrap items-center gap-2 text-caption text-red-500">
                            {duplicateTargets.map((stat) => targetLabel(stat.target)).join(', ')} 페이지에서 이미 사용 중인
                            번호입니다.
                            {firstTargetOrders.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setForm({ ...form, order: nextFreeOrder(firstTargetOrders) })}
                                    className="rounded border border-red-300 px-2 py-0.5 text-red-600"
                                >
                                    {nextFreeOrder(firstTargetOrders)}번으로 바꾸기
                                </button>
                            )}
                        </span>
                    )}
                    {isOverCount && (
                        <span className="mt-1 block text-caption text-red-500">
                            {fullTargets.map((stat) => targetLabel(stat.target)).join(', ')} 페이지는 최대 개수에
                            도달했습니다.
                        </span>
                    )}
                </label>

                <button
                    onClick={submit}
                    disabled={busy || selectedTargets.length === 0 || isDuplicateOrder || isOverCount}
                    className="mt-6 w-full rounded-lg bg-cocoa py-3 text-medium font-semibold text-cream transition-colors hover:bg-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {busy
                        ? '저장 중...'
                        : selectedTargets.length === 0
                          ? '노출할 페이지를 선택하세요'
                          : isDuplicateOrder
                            ? '순서 번호를 바꿔주세요'
                            : editingId
                              ? '수정 완료'
                              : '등록'}
                </button>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2">
                <h2 className="mr-auto text-lead font-bold text-cocoa">등록된 칼럼 ({visibleItems.length})</h2>
                <select
                    value={filterScope}
                    onChange={(event) => {
                        setFilterScope(event.target.value as FilterScope);
                        setFilterTarget('all');
                    }}
                    className="rounded-lg border border-cocoa/15 px-2 py-1.5 text-small"
                >
                    <option value="all">전체</option>
                    {(Object.keys(SCOPE_LABEL) as ColumnScope[]).map((scope) => (
                        <option key={scope} value={scope}>
                            {SCOPE_LABEL[scope]}
                        </option>
                    ))}
                </select>
                {filterScope !== 'all' && (
                    <select
                        value={filterTarget}
                        onChange={(event) => setFilterTarget(event.target.value)}
                        className="rounded-lg border border-cocoa/15 px-2 py-1.5 text-small"
                    >
                        <option value="all">전체 페이지</option>
                        {PAGE_OPTIONS[filterScope].map((page) => (
                            <option key={page.slug} value={page.slug}>
                                {page.label}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
                {visibleItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-xl bg-white p-4 text-small shadow-[0_1px_8px_rgba(69,54,45,0.05)] sm:flex-row sm:items-center"
                    >
                        <div className="min-w-0 flex-1">
                            <p className="font-semibold text-cocoa">
                                {item.title ? (
                                    <>
                                        {item.title}
                                        {item.en && <span className="text-latte"> ({item.en})</span>}
                                    </>
                                ) : (
                                    <span className="text-latte">[기기상세 · 제목만 노출]</span>
                                )}
                            </p>
                            <p className="mt-0.5 whitespace-pre-line text-latte">{item.text}</p>
                            <p className="mt-1 text-caption text-latte">
                                {item.slugs.map(targetLabel).join(' · ')} · {item.order}번
                                {!item.link && ' · URL 미입력(블로그 홈으로 연결)'}
                            </p>
                        </div>
                        <div className="flex shrink-0 gap-3">
                            <button onClick={() => startEdit(item)} className="text-cocoa underline">
                                수정
                            </button>
                            <button onClick={() => remove(item)} className="text-red-500">
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

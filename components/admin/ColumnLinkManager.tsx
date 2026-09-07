/* 블로그 연결 관리 — 시술 페이지 칼럼 카드와 같은 칸에서 글자와 주소를 눌러 고친다. */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/components/lib/firebase';
import { solutions } from '@/components/lib/solutions';
import {
    AGING_LIFTING_PAGES,
    COUNT_LIMITS,
    LIMITS,
    SIGNATURE_PAGES,
    SKIN_TREATMENT_PAGES,
    TREATMENT_PAGES,
} from '@/components/lib/adminConfig';
import { site } from '@/components/lib/site';
import {
    saveTreatmentColumnHeading,
    subscribeTreatmentColumnHeadings,
    type TreatmentColumnHeadings,
} from '@/components/lib/treatmentColumnHeadings';
import { defaultColumnHeading } from '@/components/ui/TreatmentColumnSection';
import {
    AddRowButton,
    AdminHeader,
    ErrorBanner,
    Field,
    HelpBanner,
    SaveBar,
    TextAction,
    Toast,
    confirmDelete,
    useAdminAction,
    useDirtyEdits,
} from '@/components/admin/AdminUI';

type Scope = 'signature' | 'skin' | 'aging' | 'device';

interface ColDoc {
    id: string;
    title: string;
    en: string;
    text: string;
    link: string;
    slugs: string[];
    order?: number;
}

const DEVICE_PAGES = solutions.map((solution) => ({ slug: solution.slug, label: solution.name }));
const SCOPE_PAGES = {
    signature: SIGNATURE_PAGES,
    skin: SKIN_TREATMENT_PAGES,
    aging: AGING_LIFTING_PAGES,
    device: DEVICE_PAGES,
} as const;
const SCOPE_LABEL: Record<Scope, string> = {
    signature: '시그니처',
    skin: '피부교정',
    aging: '안티에이징',
    device: '기기·제품',
};
const ALL_PAGES = [
    ...TREATMENT_PAGES.map((page) => ({ slug: page.slug, label: `${page.group} · ${page.label}` })),
    ...DEVICE_PAGES.map((page) => ({ slug: page.slug, label: `기기·제품 · ${page.label}` })),
];

const fieldKey = (id: string, field: string) => `${id}:${field}`;

export default function ColumnLinkManager() {
    const [items, setItems] = useState<ColDoc[]>([]);
    const [headings, setHeadings] = useState<TreatmentColumnHeadings>({});
    const [scope, setScope] = useState<Scope>('signature');
    const [pageSlug, setPageSlug] = useState<string>(SIGNATURE_PAGES[0].slug);
    const [loading, setLoading] = useState(true);
    const { edits, setEdit, shown, dirtyCount, clearEdits } = useDirtyEdits();
    const { busy, error, toast, run, setError } = useAdminAction();

    useEffect(
        () =>
            onSnapshot(
                collection(db, 'columns'),
                (snapshot) => {
                    setItems(
                        snapshot.docs
                            .map((column) => {
                                const data = column.data();
                                const slugs = Array.isArray(data.slugs)
                                    ? data.slugs.filter((slug): slug is string => typeof slug === 'string' && slug.length > 0)
                                    : typeof data.slug === 'string' && data.slug
                                      ? [data.slug]
                                      : [];
                                return {
                                    id: column.id,
                                    title: typeof data.title === 'string' ? data.title : '',
                                    en: typeof data.en === 'string' ? data.en : '',
                                    text: typeof data.text === 'string' ? data.text : '',
                                    link: typeof data.link === 'string' ? data.link : '',
                                    slugs: [...new Set(slugs)],
                                    ...(typeof data.order === 'number' ? { order: data.order } : {}),
                                };
                            })
                            .sort((a, b) => (a.order ?? 999) - (b.order ?? 999)),
                    );
                    setLoading(false);
                    setError(null);
                },
                (snapshotError) => {
                    setError(snapshotError.message || '칼럼을 불러오지 못했습니다.');
                    setLoading(false);
                },
            ),
        [setError],
    );

    useEffect(
        () => subscribeTreatmentColumnHeadings(setHeadings, (headingError) => console.error(headingError)),
        [],
    );

    const pages = SCOPE_PAGES[scope];
    const currentPage = pages.find((page) => page.slug === pageSlug) ?? pages[0];
    const pageItems = useMemo(
        () => items.filter((item) => item.slugs.includes(currentPage.slug)),
        [items, currentPage.slug],
    );
    const headingFallback = defaultColumnHeading(currentPage.label);
    const headingOriginal = headings[currentPage.slug] || headingFallback;

    const saveAll = () =>
        run(
            async () => {
                for (const [editKey, heading] of Object.entries(edits)) {
                    if (!editKey.startsWith('heading:')) continue;
                    const slug = editKey.slice('heading:'.length);
                    const page = ALL_PAGES.find((entry) => entry.slug === slug);
                    await saveTreatmentColumnHeading(slug, heading.trim() || defaultColumnHeading(page?.label.split(' · ').at(-1) ?? currentPage.label));
                }
                for (const item of items) {
                    const fields = ['title', 'en', 'text', 'link'] as const;
                    if (!fields.some((field) => edits[fieldKey(item.id, field)] !== undefined)) continue;
                    const pick = (field: (typeof fields)[number]) => edits[fieldKey(item.id, field)];
                    await updateDoc(doc(db, 'columns', item.id), {
                        title: pick('title') ?? item.title,
                        en: pick('en') ?? item.en,
                        text: pick('text') ?? item.text,
                        link: pick('link') ?? item.link,
                        slugs: item.slugs,
                        order: item.order ?? 1,
                    });
                }
                clearEdits();
            },
            '저장에 실패했습니다.',
            '홈페이지에 반영했습니다',
        );

    const addCard = () =>
        run(
            async () => {
                if (pageItems.length >= COUNT_LIMITS.columnPerPage) {
                    throw new Error(`이 페이지에는 칼럼을 ${COUNT_LIMITS.columnPerPage}개까지만 넣을 수 있습니다.`);
                }
                const used = pageItems.map((item) => item.order ?? 0);
                let order = 1;
                while (used.includes(order)) order += 1;
                await addDoc(collection(db, 'columns'), {
                    title: '',
                    en: '',
                    text: '',
                    link: '',
                    slugs: [currentPage.slug],
                    order,
                });
            },
            '추가에 실패했습니다.',
            '카드를 추가했습니다',
        );

    const move = (item: ColDoc, dir: -1 | 1) => {
        const index = pageItems.findIndex((entry) => entry.id === item.id);
        const target = pageItems[index + dir];
        if (!target) return;
        void run(
            async () => {
                await updateDoc(doc(db, 'columns', item.id), { order: target.order ?? index + dir + 1 });
                await updateDoc(doc(db, 'columns', target.id), { order: item.order ?? index + 1 });
            },
            '순서 변경 실패',
            '순서를 바꿨습니다',
        );
    };

    const togglePage = (item: ColDoc, slug: string) => {
        const slugs = item.slugs.includes(slug) ? item.slugs.filter((value) => value !== slug) : [...item.slugs, slug];
        if (slugs.length === 0) return;
        void run(
            () => updateDoc(doc(db, 'columns', item.id), { slugs }),
            '저장 실패',
            '보이는 페이지를 바꿨습니다',
        );
    };

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">칼럼을 불러오는 중입니다.</div>;
    }

    return (
        <div className="pb-32">
            <AdminHeader
                title="블로그 연결 관리"
                description="시술 페이지에 나오는 칼럼 카드와 똑같습니다. 글자를 눌러 고친 뒤 [저장하기]를 누르세요."
                previewHref="/treatments/signature/booster"
            />
            <ErrorBanner message={error} />
            <HelpBanner>
                <b className="text-cocoa">사용법</b> · 먼저 위 탭에서 페이지를 고릅니다. 카드의 이름·제목·주소를 눌러
                고친 뒤 아래 <b className="text-cocoa">[저장하기]</b>를 누릅니다.
            </HelpBanner>

            <div className="mt-8 flex flex-wrap justify-center gap-2">
                {(Object.keys(SCOPE_LABEL) as Scope[]).map((nextScope) => (
                    <button
                        key={nextScope}
                        type="button"
                        onClick={() => {
                            setScope(nextScope);
                            setPageSlug(SCOPE_PAGES[nextScope][0].slug);
                        }}
                        className={`rounded-full border px-4 py-2 text-small font-semibold ${
                            scope === nextScope ? 'border-cocoa bg-cocoa text-cream' : 'border-cocoa/15 bg-cream text-latte'
                        }`}
                    >
                        {SCOPE_LABEL[nextScope]}
                    </button>
                ))}
            </div>
            <div className="mt-3 flex flex-wrap justify-center gap-2">
                {pages.map((page) => (
                    <button
                        key={page.slug}
                        type="button"
                        onClick={() => setPageSlug(page.slug)}
                        className={`rounded-full border px-4 py-2 text-caption font-semibold ${
                            currentPage.slug === page.slug ? 'border-deep bg-deep text-cream' : 'border-cocoa/10 bg-cream text-latte'
                        }`}
                    >
                        {page.label}
                    </button>
                ))}
            </div>

            <section className="mx-auto mt-12 max-w-5xl text-center">
                <p className="font-display text-h2">Column</p>
                <Field
                    value={shown(`heading:${currentPage.slug}`, headingOriginal)}
                    dirty={`heading:${currentPage.slug}` in edits}
                    onChange={(value) => setEdit(`heading:${currentPage.slug}`, value, headingOriginal)}
                    className="mx-auto mt-4 max-w-3xl text-center text-h2 font-bold text-cocoa"
                />
            </section>

            <div className="mx-auto mt-10 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pageItems.map((item, index) => {
                    const titleLimit = shown(fieldKey(item.id, 'en'), item.en).trim() ? LIMITS.columnTitle : LIMITS.columnTitleNoEn;
                    return (
                        <article
                            key={item.id}
                            className="flex min-h-[220px] flex-col rounded-[16px] border border-cocoa/[0.1] bg-cream p-5"
                        >
                            {/* #ISSUE: 이 칸(title)을 맨 위 큰 글씨에 놓았더니 다들 "시술 이름" 을
                                제목처럼 적어서, 홈페이지 카드마다 "색소"·"온다리프팅" 만 반복되고
                                진짜 제목(text)은 안 보이는 문제가 있었다.
                                → 큰 제목 칸은 text 하나로 통일하고, 이름표(title·en)는 아래 작은 칸으로 내린다. */}
                            <div className="flex items-start justify-between gap-2">
                                <Field
                                    multiline
                                    value={shown(fieldKey(item.id, 'text'), item.text)}
                                    dirty={fieldKey(item.id, 'text') in edits}
                                    onChange={(value) =>
                                        setEdit(fieldKey(item.id, 'text'), value.slice(0, LIMITS.columnText + 20), item.text)
                                    }
                                    placeholder="제목을 입력하세요 (카드에 크게 보입니다)"
                                    className="min-w-0 flex-1 text-medium font-bold leading-7 text-cocoa"
                                />
                                <span className="font-display shrink-0 pt-2 text-caption text-cocoa/25">
                                    {String(index + 1).padStart(2, '0')}
                                </span>
                            </div>

                            <div className="mt-3 flex items-center gap-2 rounded-lg bg-cocoa/[0.03] px-2.5 py-2">
                                <span className="shrink-0 text-caption-sm text-cocoa/40">이름표(선택)</span>
                                <Field
                                    value={shown(fieldKey(item.id, 'title'), item.title)}
                                    dirty={fieldKey(item.id, 'title') in edits}
                                    onChange={(value) => setEdit(fieldKey(item.id, 'title'), value.slice(0, titleLimit), item.title)}
                                    placeholder="시술·기기 이름"
                                    className="min-w-0 flex-1 text-caption text-latte"
                                />
                                {scope !== 'device' && (
                                    <Field
                                        value={shown(fieldKey(item.id, 'en'), item.en)}
                                        dirty={fieldKey(item.id, 'en') in edits}
                                        onChange={(value) => setEdit(fieldKey(item.id, 'en'), value.slice(0, LIMITS.columnEn), item.en)}
                                        placeholder="영문(선택)"
                                        className="w-24 shrink-0 text-caption text-latte"
                                    />
                                )}
                            </div>
                            <Field
                                value={shown(fieldKey(item.id, 'link'), item.link)}
                                dirty={fieldKey(item.id, 'link') in edits}
                                onChange={(value) => setEdit(fieldKey(item.id, 'link'), value, item.link)}
                                placeholder={`더보기 주소 (비우면 ${site.blog})`}
                                className="mt-2 text-caption text-latte"
                            />
                            <details className="mt-3 text-left">
                                <summary className="cursor-pointer text-caption font-semibold text-latte">다른 페이지에도 보이기</summary>
                                <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto">
                                    {ALL_PAGES.map((page) => (
                                        <button
                                            key={page.slug}
                                            type="button"
                                            disabled={busy}
                                            onClick={() => togglePage(item, page.slug)}
                                            className={`rounded-full border px-2.5 py-1 text-caption-sm ${
                                                item.slugs.includes(page.slug)
                                                    ? 'border-cocoa bg-cocoa text-cream'
                                                    : 'border-cocoa/15 text-latte'
                                            }`}
                                        >
                                            {page.label}
                                        </button>
                                    ))}
                                </div>
                            </details>
                            <div className="mt-auto flex flex-wrap gap-2 pt-4">
                                <TextAction disabled={busy || index === 0} onClick={() => move(item, -1)}>
                                    앞으로
                                </TextAction>
                                <TextAction disabled={busy || index === pageItems.length - 1} onClick={() => move(item, 1)}>
                                    뒤로
                                </TextAction>
                                <TextAction
                                    tone="danger"
                                    disabled={busy}
                                    onClick={() => {
                                        if (!confirmDelete(item.title || item.text || '이 칼럼')) return;
                                        void run(() => deleteDoc(doc(db, 'columns', item.id)), '삭제 실패', '삭제했습니다');
                                    }}
                                >
                                    삭제
                                </TextAction>
                            </div>
                        </article>
                    );
                })}
            </div>

            <div className="mx-auto mt-6 max-w-5xl">
                <AddRowButton disabled={busy} onClick={() => void addCard()}>
                    + {currentPage.label}에 칼럼 추가
                </AddRowButton>
            </div>

            <SaveBar
                dirtyCount={dirtyCount}
                busy={busy}
                onSave={() => void saveAll()}
                onRevert={() => {
                    if (!window.confirm('저장하지 않은 수정을 모두 되돌릴까요?')) return;
                    clearEdits();
                }}
            />
            <Toast message={toast} />
        </div>
    );
}

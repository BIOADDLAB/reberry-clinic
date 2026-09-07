/* 팝업 관리 — 메인에 뜨는 팝업과 같은 모양에서 사진·탭 이름을 고친다. */

'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { uploadImage } from '@/components/lib/storageUpload';
import {
    POPUP_IMAGE_HEIGHT,
    POPUP_IMAGE_WIDTH,
    POPUP_MAX_TABS,
    deletePopupImage,
    getPopupSetting,
    savePopupSetting,
    type PopupTab,
} from '@/components/lib/popup';
import {
    AddRowButton,
    AdminHeader,
    ErrorBanner,
    Field,
    HelpBanner,
    TextAction,
    Toast,
    VisibilitySwitch,
    confirmDelete,
    useAdminAction,
} from '@/components/admin/AdminUI';

const emptyTab = (): PopupTab => ({ label: '', imageUrl: '', linkUrl: '' });

export default function PopupManager() {
    const [enabled, setEnabled] = useState(false);
    const [tabs, setTabs] = useState<PopupTab[]>([emptyTab()]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const pendingDelete = useRef(new Set<string>());
    const { busy, error, toast, run, setError } = useAdminAction();

    useEffect(() => {
        getPopupSetting()
            .then((setting) => {
                setEnabled(setting?.enabled ?? false);
                setTabs(setting?.tabs?.length ? setting.tabs : [emptyTab()]);
            })
            .catch(() => setError('팝업을 불러오지 못했습니다.'))
            .finally(() => setLoading(false));
    }, [setError]);

    const current = tabs[index] ?? tabs[0];

    const setTab = (patch: Partial<PopupTab>) =>
        setTabs((prev) => prev.map((tab, tabIndex) => (tabIndex === index ? { ...tab, ...patch } : tab)));

    const addTab = () => {
        if (tabs.length >= POPUP_MAX_TABS) return;
        setTabs((prev) => [...prev, emptyTab()]);
        setIndex(tabs.length);
    };

    const removeTab = () => {
        if (!confirmDelete(current?.label || `탭 ${index + 1}`)) return;
        if (current?.imageUrl) pendingDelete.current.add(current.imageUrl);
        setTabs((prev) => {
            const next = prev.filter((_, tabIndex) => tabIndex !== index);
            return next.length ? next : [emptyTab()];
        });
        setIndex((currentIndex) => Math.max(0, currentIndex - 1));
    };

    const pickImage = async (file: File | undefined) => {
        if (!file) return;
        setUploading(true);
        try {
            const previous = current?.imageUrl;
            const url = await uploadImage(file, 'popups');
            setTab({ imageUrl: url });
            if (previous && previous !== url) pendingDelete.current.add(previous);
        } catch {
            setError('사진을 올리지 못했습니다.');
        } finally {
            setUploading(false);
        }
    };

    const save = () =>
        run(
            async () => {
                const usable = tabs.filter((tab) => tab.imageUrl);
                if (enabled && usable.length === 0) throw new Error('팝업을 켜려면 사진이 있는 탭이 하나 필요합니다.');
                await savePopupSetting({ enabled, tabs: usable });
                const keep = new Set(usable.map((tab) => tab.imageUrl));
                await Promise.allSettled(
                    [...pendingDelete.current].filter((url) => !keep.has(url)).map((url) => deletePopupImage(url)),
                );
                pendingDelete.current.clear();
                setTabs(usable.length ? usable : [emptyTab()]);
                setIndex(0);
            },
            '저장에 실패했습니다.',
            enabled ? '팝업을 홈페이지에 반영했습니다' : '팝업을 저장했습니다. 지금은 꺼져 있습니다.',
        );

    if (loading) {
        return <div className="rounded-2xl bg-white py-20 text-center text-small text-latte">팝업을 불러오는 중입니다.</div>;
    }

    return (
        <div className="pb-10">
            <AdminHeader
                title="팝업 관리"
                description="메인에 처음 들어올 때 뜨는 창과 똑같습니다. 사진을 누르고, 오른쪽 탭 이름을 고친 뒤 저장하세요."
                previewHref="/"
            />
            <ErrorBanner message={error} />
            <HelpBanner>
                <b className="text-cocoa">사용법</b> · 왼쪽 큰 칸을 누르면 사진이 바뀝니다. 오른쪽 글자를 누르면 탭 이름이
                바뀝니다. 다 고친 뒤 <b className="text-cocoa">[저장하기]</b>를 누르세요.
            </HelpBanner>

            <div className="mt-6">
                <VisibilitySwitch
                    visible={enabled}
                    onLabel="팝업 켜져 있음"
                    offLabel="팝업 꺼져 있음 · 눌러서 켜기"
                    onChange={setEnabled}
                />
            </div>

            <div className="mx-auto mt-8 max-w-[720px] overflow-hidden rounded-[10px] bg-white shadow-[0_28px_70px_rgba(56,43,34,0.18)]">
                <div className="grid grid-cols-1 items-stretch sm:grid-cols-[minmax(0,1.55fr)_minmax(7.5rem,0.7fr)]">
                    <label className="relative aspect-[4/5] cursor-pointer overflow-hidden bg-cream">
                        {current?.imageUrl ? (
                            <Image
                                src={current.imageUrl}
                                alt=""
                                fill
                                unoptimized
                                className="object-contain"
                            />
                        ) : (
                            <span className="flex h-full items-center justify-center px-6 text-center text-small font-semibold text-latte">
                                {uploading ? '올리는 중…' : '여기를 눌러 사진 올리기'}
                            </span>
                        )}
                        <input
                            type="file"
                            accept="image/*"
                            disabled={uploading}
                            className="sr-only"
                            onChange={(event) => void pickImage(event.target.files?.[0])}
                        />
                    </label>
                    <nav className="flex min-h-0 flex-col border-t border-cocoa/10 bg-cream sm:border-l sm:border-t-0">
                        {tabs.map((tab, tabIndex) => (
                            <button
                                key={tabIndex}
                                type="button"
                                onClick={() => setIndex(tabIndex)}
                                className={`w-full px-3 py-3.5 text-center text-caption leading-snug whitespace-pre-line ${
                                    tabIndex === index ? 'bg-sand/45 font-semibold text-cocoa' : 'text-cocoa/45'
                                } ${tabIndex < tabs.length - 1 ? 'border-b border-cocoa/10' : ''}`}
                            >
                                {tab.label || `탭 ${tabIndex + 1}`}
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="flex border-t border-cocoa/10 bg-cream text-caption text-cocoa/55">
                    <span className="flex flex-1 items-center justify-center border-r border-cocoa/10 py-4">오늘 하루 그만 보기</span>
                    <span className="flex flex-1 items-center justify-center py-4">닫기</span>
                </div>
            </div>

            <section className="mx-auto mt-8 max-w-[720px] rounded-2xl bg-white p-5">
                <p className="text-small font-bold text-cocoa">선택한 탭 고치기</p>
                <p className="mt-3 text-caption font-semibold text-latte">탭 이름 (엔터로 줄바꿈)</p>
                <Field
                    multiline
                    value={current?.label ?? ''}
                    onChange={(label) => setTab({ label })}
                    placeholder={'예: 9월\n이벤트'}
                    className="mt-1 border-cocoa/15 bg-[#FBF9F5] text-small text-cocoa"
                />
                <p className="mt-4 text-caption font-semibold text-latte">사진을 누르면 이동할 주소 (없어도 됩니다)</p>
                <Field
                    value={current?.linkUrl ?? ''}
                    onChange={(linkUrl) => setTab({ linkUrl })}
                    placeholder="/events"
                    className="mt-1 border-cocoa/15 bg-[#FBF9F5] text-small text-cocoa"
                />
                <p className="mt-2 text-caption text-latte">
                    권장 사진 크기 {POPUP_IMAGE_WIDTH}×{POPUP_IMAGE_HEIGHT}px (4:5)
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                    <TextAction tone="danger" disabled={busy} onClick={removeTab}>
                        이 탭 삭제
                    </TextAction>
                </div>
            </section>

            <div className="mx-auto mt-6 max-w-[720px] space-y-3">
                <AddRowButton disabled={tabs.length >= POPUP_MAX_TABS} onClick={addTab}>
                    + 탭 추가 ({tabs.length}/{POPUP_MAX_TABS})
                </AddRowButton>
                <button
                    type="button"
                    disabled={busy || uploading}
                    onClick={() => void save()}
                    className="flex min-h-14 w-full items-center justify-center rounded-full bg-[#C95813] text-small font-bold text-white disabled:opacity-40"
                >
                    {busy ? '저장 중…' : '저장하기'}
                </button>
            </div>
            <Toast message={toast} />
        </div>
    );
}

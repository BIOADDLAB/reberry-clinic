// #LINK: /app/admin/(protected)/popups/page.tsx
// #ISSUE: 메인 팝업 관리 — 노출 on/off + 탭 최대 5개(이미지·이름·링크)
//   · 이미지가 없는 탭은 저장할 때 자동으로 빠진다
//   · 이미지를 교체하거나 탭을 지우면 Storage 의 이전 파일도 같이 지운다
'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { uploadImage } from '@/components/lib/storageUpload';
import {
    deletePopupImage,
    getPopupSetting,
    savePopupSetting,
    POPUP_IMAGE_HEIGHT,
    POPUP_IMAGE_WIDTH,
    POPUP_MAX_TABS,
    type PopupTab,
} from '@/components/lib/popup';

const inputCls = 'w-full rounded-lg border border-cocoa/15 px-3 py-2.5 text-small outline-none focus:border-cocoa/40';

const emptyTab = (): PopupTab => ({ label: '', imageUrl: '', linkUrl: '' });

export default function AdminPopupsPage() {
    const [enabled, setEnabled] = useState(false);
    const [tabs, setTabs] = useState<PopupTab[]>([]);
    const [loading, setLoading] = useState(true);
    const [busy, setBusy] = useState(false);
    /** 업로드 중인 탭 번호. 버튼을 잠그는 용도 */
    const [uploading, setUploading] = useState<number | null>(null);

    useEffect(() => {
        let alive = true;
        getPopupSetting().then((s) => {
            if (!alive) return;
            setEnabled(s?.enabled ?? false);
            setTabs(s?.tabs?.length ? s.tabs : [emptyTab()]);
            setLoading(false);
        });
        return () => {
            alive = false;
        };
    }, []);

    const setTab = (index: number, patch: Partial<PopupTab>) =>
        setTabs((prev) => prev.map((t, i) => (i === index ? { ...t, ...patch } : t)));

    const addTab = () => setTabs((prev) => (prev.length >= POPUP_MAX_TABS ? prev : [...prev, emptyTab()]));

    const removeTab = async (index: number) => {
        if (!confirm('이 탭을 지울까요?')) return;
        const target = tabs[index];
        if (target.imageUrl) await deletePopupImage(target.imageUrl);
        setTabs((prev) => prev.filter((_, i) => i !== index));
    };

    const pickImage = async (index: number, file: File | undefined) => {
        if (!file) return;
        setUploading(index);
        try {
            const previous = tabs[index].imageUrl;
            const url = await uploadImage(file, 'popups');
            setTab(index, { imageUrl: url });
            if (previous) await deletePopupImage(previous);
        } catch {
            alert('이미지 업로드에 실패했습니다.');
        } finally {
            setUploading(null);
        }
    };

    const submit = async () => {
        const usable = tabs.filter((t) => t.imageUrl);
        if (enabled && usable.length === 0) return alert('팝업을 켜려면 이미지가 있는 탭이 최소 1개 필요합니다.');

        setBusy(true);
        try {
            await savePopupSetting({ enabled, tabs: usable });
            setTabs(usable.length ? usable : [emptyTab()]);
            alert('저장했습니다.');
        } catch {
            alert('저장에 실패했습니다. 잠시 후 다시 시도해주세요.');
        } finally {
            setBusy(false);
        }
    };

    if (loading) return <p className="text-small text-latte">불러오는 중...</p>;

    return (
        <div className="mx-auto max-w-4xl">
            <h1 className="text-h2 font-bold text-cocoa">팝업 관리</h1>
            <p className="mt-1 text-small text-latte">
                메인 화면에 처음 들어올 때 뜨는 팝업입니다. 탭은 최대 {POPUP_MAX_TABS}개까지 등록할 수 있고, 이미지가
                없는 탭은 저장할 때 자동으로 빠집니다. 탭이 둘 이상이면 5초마다 자동으로 넘어갑니다.
                <br />
                이미지는{' '}
                <b>
                    {POPUP_IMAGE_WIDTH}×{POPUP_IMAGE_HEIGHT}px (4:5, 인스타 세로 게시물)
                </b>{' '}
                을 권장합니다. 다른 비율도 잘리지 않고 통째로 보입니다.
            </p>

            <label className="mt-6 flex w-fit items-center gap-2.5 rounded-xl border border-cocoa/15 bg-white px-4 py-3">
                <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
                <span className="text-small font-semibold text-cocoa">팝업 노출하기</span>
            </label>

            <div className="mt-6 flex flex-col gap-4">
                {tabs.map((tab, i) => (
                    <div
                        key={i}
                        className="overflow-hidden rounded-2xl bg-white shadow-[0_2px_20px_rgba(69,54,45,0.06)]"
                    >
                        <div className="flex items-center justify-between border-b border-cocoa/10 px-6 py-4">
                            <span className="text-small font-semibold text-cocoa">탭 {i + 1}</span>
                            <button type="button" onClick={() => removeTab(i)} className="text-caption text-red-500">
                                삭제
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                <div className="flex aspect-[4/5] w-[112px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-cocoa/15 bg-cocoa/[0.03]">
                                    {tab.imageUrl ? (
                                        <Image
                                            src={tab.imageUrl}
                                            alt=""
                                            width={POPUP_IMAGE_WIDTH}
                                            height={POPUP_IMAGE_HEIGHT}
                                            unoptimized
                                            className="h-full w-full object-contain"
                                        />
                                    ) : (
                                        <span className="text-caption text-latte">이미지 없음</span>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <span className="text-small font-semibold text-cocoa">팝업 이미지</span>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        disabled={uploading === i}
                                        onChange={(e) => pickImage(i, e.target.files?.[0])}
                                        className="mt-1.5 block w-full text-small text-latte file:mr-3 file:rounded-lg file:border-0 file:bg-cocoa file:px-4 file:py-2 file:text-small file:text-cream"
                                    />
                                    <p className="mt-2 text-caption text-latte">
                                        {uploading === i
                                            ? '업로드 중…'
                                            : `${POPUP_IMAGE_WIDTH}×${POPUP_IMAGE_HEIGHT}px (4:5) 이미지를 올려주세요.`}
                                    </p>
                                </div>
                            </div>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-small font-semibold text-cocoa">탭 이름 (오른쪽 목록 글자)</span>
                                <textarea
                                    value={tab.label}
                                    onChange={(e) => setTab(i, { label: e.target.value })}
                                    placeholder={'예: 8월\n이벤트'}
                                    rows={3}
                                    className={`${inputCls} min-h-[4.75rem] resize-y`}
                                />
                                <span className="text-caption text-latte">
                                    엔터로 줄바꿈하면 팝업 목록에도 그대로 보입니다.
                                </span>
                            </label>

                            <label className="flex flex-col gap-1.5">
                                <span className="text-small font-semibold text-cocoa">
                                    이미지 클릭 시 이동 주소 <span className="font-normal text-latte">(선택)</span>
                                </span>
                                <input
                                    value={tab.linkUrl ?? ''}
                                    onChange={(e) => setTab(i, { linkUrl: e.target.value })}
                                    placeholder="/events"
                                    className={inputCls}
                                />
                                <span className="text-caption text-latte">
                                    사이트 안 페이지는 /events 처럼 경로만 적으세요. 외부 사이트만 https:// 로
                                    시작합니다(새 탭으로 열립니다).
                                </span>
                            </label>
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
                <button
                    type="button"
                    onClick={addTab}
                    disabled={tabs.length >= POPUP_MAX_TABS}
                    className="rounded-lg border border-cocoa/15 bg-white px-5 py-2.5 text-small text-cocoa disabled:opacity-40"
                >
                    탭 추가 ({tabs.length}/{POPUP_MAX_TABS})
                </button>

                <button
                    type="button"
                    onClick={submit}
                    disabled={busy || uploading !== null}
                    className="rounded-lg bg-cocoa px-5 py-2.5 text-small font-semibold text-cream transition-colors hover:bg-deep disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {busy ? '저장 중…' : '저장'}
                </button>
            </div>
        </div>
    );
}

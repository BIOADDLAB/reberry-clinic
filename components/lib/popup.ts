// #LINK: /components/lib/popup.ts
// #ISSUE: 메인 팝업 설정 — Firestore settings/popup 문서 한 건에 탭 배열을 통째로 저장한다.
//   · 읽기는 화면 진입 시 1회. 문서가 없거나 규칙에 막혀도 null 을 돌려주고 팝업만 안 뜬다(화면은 안 죽음)
//   · 이미지 업로드는 다른 관리자 화면과 같은 storageUpload.uploadImage 를 쓴다(폴더만 'popups')

import { doc, getDoc, setDoc } from 'firebase/firestore';
import { deleteObject, ref } from 'firebase/storage';
import { db, storage } from './firebase';

/** 팝업 탭 하나. imageUrl 은 Firebase Storage 다운로드 주소 */
export interface PopupTab {
    /** 오른쪽 목록에 보이는 짧은 이름. 예: 8월 이벤트 */
    label: string;
    imageUrl: string;
    /** 이미지를 눌렀을 때 이동할 주소. 비우면 링크 없이 이미지만 보여준다 */
    linkUrl?: string;
}

export interface PopupSetting {
    enabled: boolean;
    tabs: PopupTab[];
}

/** 탭 최대 개수 — 관리자 화면과 팝업이 같은 값을 본다 */
export const POPUP_MAX_TABS = 5;

/** 권장 이미지 규격. 인스타 세로 게시물(4:5)과 같다 */
export const POPUP_IMAGE_WIDTH = 1080;
export const POPUP_IMAGE_HEIGHT = 1350;

const POPUP_DOC = doc(db, 'settings', 'popup');

export async function getPopupSetting(): Promise<PopupSetting | null> {
    try {
        const snap = await getDoc(POPUP_DOC);
        return snap.exists() ? (snap.data() as PopupSetting) : null;
    } catch (e) {
        console.warn('[popup] 설정을 읽지 못했습니다. 팝업 없이 진행합니다.', e);
        return null;
    }
}

export async function savePopupSetting(data: PopupSetting) {
    await setDoc(POPUP_DOC, data);
}

/** 교체·삭제된 팝업 이미지를 Storage 에서 지운다. 이미 없으면 조용히 넘어간다 */
export async function deletePopupImage(url: string) {
    if (!url.includes('/o/')) return;
    try {
        await deleteObject(ref(storage, url));
    } catch {}
}

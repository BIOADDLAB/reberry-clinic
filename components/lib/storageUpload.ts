// #LINK: /components/lib/storageUpload.ts
// #ISSUE: Storage 업로드 헬퍼 — 파일 하나 넣으면 https URL 하나 나옴
'use client';

import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadImage(file: File, folder: string): Promise<string> {
    const path = `${folder}/${Date.now()}-${file.name}`;
    const r = ref(storage, path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
}

/** Firebase Storage 다운로드 URL이면 해당 파일을 정리한다. 로컬/외부 URL은 건드리지 않는다. */
export async function deleteStoredImage(url: string): Promise<void> {
    if (!url.includes('/o/')) return;
    await deleteObject(ref(storage, url));
}

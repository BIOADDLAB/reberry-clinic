// #LINK: /components/lib/storageUpload.ts
// #ISSUE: Storage 업로드 헬퍼 — 파일 하나 넣으면 https URL 하나 나옴
'use client';

import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export async function uploadImage(file: File, folder: string): Promise<string> {
    const path = `${folder}/${Date.now()}-${file.name}`;
    const r = ref(storage, path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
}

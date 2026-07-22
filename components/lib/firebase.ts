// #LINK: /components/lib/firebase.ts
// #ISSUE: Firebase 초기화 — 콘솔에서 받은 설정 그대로 사용 (.env 없이)
// 주의 1) Next.js 는 서버에서도 이 파일을 읽으므로 initializeApp 중복 호출 방지(getApps) 필요
// 주의 2) Analytics 는 브라우저 전용 → isSupported 확인 후 클라이언트에서만 초기화

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: 'AIzaSyD9jhBEd8Z0DKC0nDrer1KtxMrVqLhx0Vo',
    authDomain: 'reberryclinic-a8dcd.firebaseapp.com',
    projectId: 'reberryclinic-a8dcd',
    storageBucket: 'reberryclinic-a8dcd.firebasestorage.app',
    messagingSenderId: '24828435632',
    appId: '1:24828435632:web:975a83b838989e3f626f75',
    measurementId: 'G-KRH4EZTGQ1',
};

// 이미 초기화됐으면 재사용 (Next.js 핫리로드/SSR 중복 초기화 에러 방지)
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app); // 관리자 로그인
export const db = getFirestore(app); // 전후사진·칼럼 데이터
export const storage = getStorage(app); // 이미지 파일

// Analytics 는 브라우저에서만 (서버에서 호출하면 에러)
export const initAnalytics = async () => {
    if (typeof window === 'undefined') return null;
    const { getAnalytics, isSupported } = await import('firebase/analytics');
    return (await isSupported()) ? getAnalytics(app) : null;
};

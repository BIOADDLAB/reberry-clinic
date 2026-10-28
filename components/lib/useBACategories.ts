'use client';

import { useSyncExternalStore } from 'react';
import { BA_CATEGORIES } from './ba';
import { subscribeBACategories, type BACategory } from './baCategories';

const FALLBACK: BACategory[] = BA_CATEGORIES.map((category, sort) => ({
    key: category.key,
    label: category.label,
    isPublished: true,
    sort,
    createdAt: '',
    updatedAt: '',
}));

let cache: BACategory[] = FALLBACK;
let isLoading = true;
let started = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((listener) => listener());

function load() {
    if (started) return;
    started = true;
    subscribeBACategories(
        (items) => {
            cache = items.length > 0 ? items : FALLBACK;
            isLoading = false;
            emit();
        },
        (error) => {
            console.error('[useBACategories] Firestore 조회 실패:', error);
            cache = FALLBACK;
            isLoading = false;
            emit();
        },
    );
}

function subscribe(onChange: () => void) {
    listeners.add(onChange);
    load();
    return () => {
        listeners.delete(onChange);
    };
}

export function useBACategories(publishedOnly = false): BACategory[] {
    const items = useSyncExternalStore(subscribe, () => cache, () => FALLBACK);
    return publishedOnly ? items.filter((item) => item.isPublished) : items;
}

export function useBACategoriesLoading(): boolean {
    return useSyncExternalStore(subscribe, () => isLoading, () => true);
}

'use client';

import { useEffect, useState } from 'react';
import {
    subscribeTreatmentColumnHeadings,
    type TreatmentColumnHeadings,
} from '@/components/lib/treatmentColumnHeadings';

export function useTreatmentColumnHeading(slug: string, fallback: string) {
    const [headings, setHeadings] = useState<TreatmentColumnHeadings>({});

    useEffect(() => subscribeTreatmentColumnHeadings(setHeadings), []);

    return headings[slug] || fallback;
}

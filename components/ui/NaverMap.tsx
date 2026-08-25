'use client';

import { useEffect, useRef, useState } from 'react';
import Script from 'next/script';
import { site } from '@/components/lib/site';

declare global {
    interface Window {
        naver?: {
            maps: {
                Map: new (
                    element: HTMLElement,
                    options: {
                        center: unknown;
                        zoom: number;
                        scaleControl?: boolean;
                        logoControl?: boolean;
                        mapDataControl?: boolean;
                    },
                ) => { autoResize?: () => void };
                LatLng: new (lat: number, lng: number) => unknown;
                Marker: new (options: { position: unknown; map: unknown; title?: string }) => unknown;
                Event: {
                    addListener: (target: unknown, eventName: string, listener: () => void) => void;
                };
            };
        };
    }
}

export default function NaverMap({ title }: { title: string }) {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstance = useRef<{ autoResize?: () => void } | null>(null);
    const [sdkReady, setSdkReady] = useState(false);

    useEffect(() => {
        const element = mapRef.current;
        const maps = window.naver?.maps;
        if (!sdkReady || !element || !maps || mapInstance.current) return;

        const position = new maps.LatLng(site.lat, site.lng);
        const map = new maps.Map(element, {
            center: position,
            zoom: 16,
            scaleControl: false,
            logoControl: true,
            mapDataControl: false,
        });
        const marker = new maps.Marker({
            position,
            map,
            title: site.branch,
        });
        maps.Event.addListener(marker, 'click', () => {
            window.open(site.naver, '_blank', 'noopener,noreferrer');
        });
        mapInstance.current = map;
        map.autoResize?.();

        const observer = new ResizeObserver(() => mapInstance.current?.autoResize?.());
        observer.observe(element);
        return () => {
            observer.disconnect();
            mapInstance.current = null;
        };
    }, [sdkReady]);

    return (
        <>
            <Script
                id="naver-maps-sdk"
                src={`https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${site.naverMapClientId}`}
                strategy="afterInteractive"
                onReady={() => setSdkReady(true)}
            />
            <div
                ref={mapRef}
                role="application"
                aria-label={title}
                className="naver-map absolute inset-0 h-full w-full"
            />
        </>
    );
}

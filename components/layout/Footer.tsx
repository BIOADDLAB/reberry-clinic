// #COMPONENTS: 푸터

'use client';

import Link from 'next/link';
import Image from 'next/image';
import T from '@/components/lang/T';
import { site } from '@/components/lib/site';

const links = [
    { label: '비급여수가표', href: '/price-list' },
    { label: '이용약관', href: '#' },
    { label: '개인정보처리방침', href: '#' },
];

export default function Footer() {
    return (
        <footer className="bg-cocoa text-cream">
            <div className="container-site py-14 text-center lg:pt-21.5 lg:pb-20">
                {/* 로고 영역 */}
                <Image
                    src="/images/logo.svg"
                    alt="RE:BERRY"
                    width={150}
                    height={28}
                    className="notranslate mx-auto h-4.5 w-auto invert brightness-0 "
                />

                {/* 이용약관 영역 */}
                {/* #ISSUE: 구글 번역에 맡기면 "비급여수가표"가 문장처럼 길게 풀려 lg:gap-20 이 무너졌다.
                    → 사전(dict.ts)에서 짧은 표기로 고정 */}
                <nav className="mt-7.5 text-[15px] flex justify-center flex-wrap gap-x-8 gap-y-2 lg:gap-20">
                    {links.map((i) => (
                        <Link
                            key={i.label}
                            href={i.href}
                            className="hover:opacity-80 duration-300 ease-in transition-all "
                        >
                            <T ko={i.label} />
                        </Link>
                    ))}
                </nav>

                {/* 정보 영역 */}
                {/* #ISSUE: 사업자 정보는 구글이 상호·주소를 뭉개서 notranslate 로 막아뒀는데,
                    그 탓에 번역 모드에서 한국어로 남았다 → 항목별로 사전 치환 */}
                <div className="mt-5.5 text-caption-xs flex justify-center flex-wrap items-center">
                    <T ko={site.branch} />
                    <span className="mx-1.5 opacity-40">|</span>
                    <T ko="대표" />: <T ko={site.director} />
                    <span className="mx-1.5 opacity-40">|</span>
                    <T ko={site.address} />
                    <span className="mx-1.5 opacity-40">|</span>
                    <T ko="전화" />: <span className="notranslate">{site.tel}</span>
                    <span className="mx-1.5 opacity-40">|</span>
                    <T ko="사업자등록번호" />: <span className="notranslate">{site.bizNo}</span>
                </div>

                {/* 카피라이터 영역 */}
                <div className="notranslate text-caption-xs uppercase leading-7">
                    Copyright © 2026 Reberry Clinic All Right Reserved.
                </div>
            </div>
        </footer>
    );
}

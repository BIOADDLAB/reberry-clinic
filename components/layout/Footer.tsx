// #COMPONENTS: 푸터

import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/components/lib/site';

const links = [
    { label: '비급여수가표', href: '#' },
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
                <nav className="mt-7.5 text-[15px] flex justify-center flex-wrap gap-x-8 gap-y-2 lg:gap-20">
                    {links.map((i) => (
                        <Link
                            key={i.label}
                            href={i.href}
                            className="hover:opacity-80 duration-300 ease-in transition-all "
                        >
                            {i.label}
                        </Link>
                    ))}
                </nav>

                {/* 정보 영역 */}
                <div className="mt-5.5 text-caption-xs flex justify-center flex-wrap items-center">
                    {site.branch}
                    <span className="mx-1.5 opacity">|</span>
                    대표: {site.director}
                    <span className="mx-1.5 opacity-40">|</span>
                    {site.address}
                    <span className="mx-1.5 opacity-40">|</span>
                    전화: {site.tel}
                    <span className="mx-1.5 opacity-40">|</span>
                    사업자등록번호: {site.bizNo}
                </div>

                {/* 카피라이터 영역 */}
                <div className="text-caption-xs uppercase leading-7">
                    Copyright © 2026 Reberry Clinic All Right Reserved.
                </div>
            </div>
        </footer>
    );
}

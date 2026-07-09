// #COMPONENTS: 푸터

import Link from 'next/link';
import Image from 'next/image';
import { site } from '@/components/lib/site';

export default function Footer() {
    return (
        <footer>
            <div className="bg-cocoa text-cream">
                {/* 로고 영역 */}
                <h2>
                    <Link href="/">
                        <Image src="/images/logo.svg" alt={site.nameEn} width={176} height={18} />
                    </Link>
                </h2>

                {/* 하단 메뉴 네비게이션 */}
                <ul>
                    <li>
                        <Link href="/non-payment">비급여수가표</Link>
                    </li>
                    <li>
                        <Link href="/terms">이용약관</Link>
                    </li>
                    <li>
                        <Link href="/privacy">개인정보처리방침</Link>
                    </li>
                </ul>

                {/* 병원 정보 및 카피라이트 */}
                <div>
                    <div>
                        <span>{site.name}</span>
                        <span>|</span>
                        <span>대표 : {site.ceo}</span>
                        <span>|</span>
                        <span>{site.address}</span>
                        <span>|</span>
                        <span>전화 : {site.tel}</span>
                        <span>|</span>
                        <span>사업자등록번호 : {site.businessNumber}</span>
                    </div>

                    <p>COPYRIGHT © 2026 REBERRY CLINIC ALL RIGHT RESERVED. Made By BIOADDLAB</p>
                </div>
            </div>
        </footer>
    );
}

// #COMPONENTS: 헤더
import Link from 'next/link';
import Image from 'next/image';
import { nav } from '@/components/lib/site';

export default function Header() {
    return (
        <header className="fixed inset-x-0 top-0 z-50 transition-colors duration-300">
            <div className="container-site relative flex h-16 items-center justify-between lg:h-25">
                {/* 로고 영역
                - 흰색 바탕일때는 cocoa로 변환됨 */}
                <Link href="/" aria-label="리베리의원 홈" className="notranslate relative z-10 shrink-0">
                    <Image
                        src="/images/logo.svg"
                        alt="RE:BERRY"
                        width={132}
                        height={24}
                        priority
                        className="h-4 w-auto transition "
                    />
                </Link>

                <nav className="notranslate absolute left-1/2 -translate-x-1/2 items-center gap-9 xl:flex 2xl:gap-11">
                    {nav.map((i) => (
                        <div key={i.label} className="group relative">
                            <Link
                                href={i.href}
                                className="whitespace-nowrap py-7 text-small 
                            hover:opacity-60 duration-300 ease-in
                            transition-all
                            "
                            >
                                {i.label}
                            </Link>
                            {i.children && (
                                <div className="invisible absolute left-1/2 top-full min-w-44 -translate-x-1/2 bg-cream text-cocoa opacity-0 shadow-lg ring-1 ring-cocoa/5 transition-all duration-200 group-hover:visible group-hover:opacity-100">
                                    <ul>
                                        {i.children.map((c) => (
                                            <li key={c.href} className="">
                                                {c.label}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    ))}
                </nav>

                {/* 언어선택 영역 */}
                <div className="relative z-10 hidden shrink-0 xl:block">언어선택</div>
                <button className="relative z-10 flex h-10 w-10 flex-col items-center justify-center gap-1.5 xl:hidden">
                    <span className="h-px w-6 bg-current transition-transform">dd</span>
                    <span className="h-px w-6 bg-current transition-transform">dd</span>
                </button>
            </div>
        </header>
    );
}

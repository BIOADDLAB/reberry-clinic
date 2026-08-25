'use client';

import { useTranslations } from 'next-intl';
import Reveal from '@/components/motion/Reveal';
import T from '@/components/lang/T';
import { cn } from '@/components/lib/cn';
import { site } from '@/components/lib/site';
import { useIsKo } from '@/components/lib/useLang';

export default function LocationSection() {
    // 영업시간 라벨("평 일")은 한국어에서만 글자를 흩뿌려 정렬한다.
    // 번역문("Mon–Fri")에 같은 처리를 하면 글자가 뿔뿔이 흩어져 읽히지 않는다.
    const isKo = useIsKo();
    const t = useTranslations('common');

    return (
        <section className="bg-cream py-16 lg:py-24">
            <div className="container-site grid items-stretch gap-8 lg:grid-cols-2 lg:gap-14">
                <Reveal className="relative min-h-[280px] overflow-hidden bg-sand/35 lg:min-h-0">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m5!3m3!1m2!1s0x357c990061dd2c9d%3A0x2995135531b14865!2z66as67Kg66as7J2Y7JuQIOuniO2PrA!5e0!3m2!1sko!2skr!4v1784792342069!5m2!1sko!2skr"
                        className="absolute inset-0 h-full w-full border-0"
                        loading="lazy"
                        referrerPolicy="strict-origin-when-cross-origin"
                        title={t('locationMapTitle')}
                    />
                </Reveal>
                <Reveal delay={0.1}>
                    <dl>
                        <div className="flex flex-col gap-1.5 items-start lg:flex-row lg:items-center lg:gap-6 border-y border-cocoa/15 py-4 lg:py-5">
                            <dt className="font-display w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-lead text-[#614836]">
                                Location
                            </dt>
                            <dd className="min-w-0 text-small font-medium leading-relaxed">
                                <T ko={site.address} />
                                <br />
                                <T ko={site.addressDetail} />
                            </dd>
                        </div>

                        <div className="flex flex-col gap-1.5 items-start lg:flex-row lg:items-start lg:gap-6 border-b border-cocoa/15 py-4 lg:py-5">
                            <dt className="font-display w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-lead text-[#614836]">
                                Tel.
                            </dt>
                            <dd className="notranslate min-w-0 text-small font-medium">
                                <a href={site.phoneLink} className="hover:underline">
                                    {site.phone}
                                </a>
                            </dd>
                        </div>

                        <div className="flex flex-col gap-2 items-start lg:flex-row lg:items-start lg:gap-6 border-b border-cocoa/15 py-4 lg:py-5">
                            <dt className="w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-medium text-[#614836]">
                                <T ko="영업 시간안내" />
                            </dt>
                            <dd className="min-w-0 space-y-1 text-small">
                                {site.hours.map((h) => (
                                    <p key={h.label} className="flex font-medium gap-5">
                                        <span
                                            className={cn(
                                                'flex shrink-0 justify-between text-small font-medium text-[#614836]',
                                                // 번역문("Mon–Fri")은 48px 칸에 안 들어간다
                                                isKo ? 'w-12' : 'w-20',
                                            )}
                                        >
                                            {isKo ? (
                                                h.label.split('').map((char, i) => <span key={i}>{char}</span>)
                                            ) : (
                                                <T ko={h.label} />
                                            )}
                                        </span>
                                        <span className="notranslate">{h.value}</span>
                                    </p>
                                ))}
                                <p className="pt-1 text-caption text-latte">
                                    <T ko="평일 점심시간" /> <span className="notranslate">{site.lunch}</span>
                                </p>
                            </dd>
                        </div>

                        <div className="flex flex-col gap-1.5 items-start lg:flex-row lg:items-start lg:gap-6 border-b border-cocoa/15 py-4 lg:py-5">
                            <dt className="w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-medium text-[#614836]">
                                <T ko="지하철" />
                            </dt>
                            <dd className="min-w-0 text-small font-medium">
                                <T ko={site.subway} />
                            </dd>
                        </div>

                        <div className="flex flex-col gap-1.5 items-start lg:flex-row lg:items-start lg:gap-6 border-b border-cocoa/15 py-4 lg:py-5">
                            <dt className="w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-medium font-semibold text-[#614836]">
                                <T ko="주차" />
                            </dt>
                            <dd className="min-w-0 text-small font-medium">
                                <T ko={site.parking[0]} />
                                <br />
                                <T ko={site.parking[1]} />
                            </dd>
                        </div>
                    </dl>
                </Reveal>
            </div>
        </section>
    );
}

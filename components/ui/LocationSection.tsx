import Reveal from '@/components/motion/Reveal';
import { site } from '@/components/lib/site';

export default function LocationSection() {
    return (
        <section className="bg-cream py-16 lg:py-24">
            <div className="container-site grid items-stretch gap-8 lg:grid-cols-2 lg:gap-14">
                <Reveal className="flex min-h-[280px] items-center justify-center bg-sand/35 text-latte lg:min-h-0">
                    {/* TODO: 네이버/카카오 지도 API 교체 */}
                    구글맵
                </Reveal>
                <Reveal delay={0.1}>
                    <dl>
                        <div className="flex flex-col gap-1.5 items-start lg:flex-row lg:items-center lg:gap-6 border-y border-cocoa/15 py-4 lg:py-5">
                            <dt className="font-display w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-lead text-[#614836]">
                                Location
                            </dt>
                            <dd className="text-small font-medium leading-relaxed">
                                {site.address}
                                <br />
                                {site.addressDetail}
                            </dd>
                        </div>

                        <div className="flex flex-col gap-1.5 items-start lg:flex-row lg:items-start lg:gap-6 border-b border-cocoa/15 py-4 lg:py-5">
                            <dt className="font-display w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-lead text-[#614836]">
                                Tel.
                            </dt>
                            <dd className="notranslate text-small font-medium">
                                <a href={site.phoneLink} className="hover:underline">
                                    {site.phone}
                                </a>
                            </dd>
                        </div>

                        <div className="flex flex-col gap-2 items-start lg:flex-row lg:items-start lg:gap-6 border-b border-cocoa/15 py-4 lg:py-5">
                            <dt className="w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-medium text-[#614836]">
                                영업 시간안내
                            </dt>
                            <dd className="space-y-1 text-small">
                                {site.hours.map((h) => (
                                    <p key={h.label} className="flex font-medium gap-5">
                                        <span className="flex w-12 shrink-0 justify-between text-small font-medium text-[#614836]">
                                            {h.label.split('').map((char, i) => (
                                                <span key={i}>{char}</span>
                                            ))}
                                        </span>
                                        {h.value}
                                    </p>
                                ))}
                            </dd>
                        </div>

                        <div className="flex flex-col gap-1.5 items-start lg:flex-row lg:items-start lg:gap-6 border-b border-cocoa/15 py-4 lg:py-5">
                            <dt className="w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-medium text-[#614836]">지하철</dt>
                            <dd className="text-small font-medium">{site.subway}</dd>
                        </div>

                        <div className="flex flex-col gap-1.5 items-start lg:flex-row lg:items-start lg:gap-6 border-b border-cocoa/15 py-4 lg:py-5">
                            <dt className="w-auto lg:w-48 px-0 lg:px-8 shrink-0 text-medium font-semibold text-[#614836]">
                                주차
                            </dt>
                            <dd className="text-small font-medium">
                                {site.parking[0]}
                                <br />
                                {site.parking[1]}
                            </dd>
                        </div>
                    </dl>
                </Reveal>
            </div>
        </section>
    );
}

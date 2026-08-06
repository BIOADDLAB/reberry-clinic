import Image from 'next/image';
import { getLocale, getTranslations } from 'next-intl/server';
import SubHero from '@/components/ui/SubHero';
import LocationSection from '@/components/ui/LocationSection';
import Reveal from '@/components/motion/Reveal';
import { site } from '@/components/lib/site';
import { fetchLatestYouTubeVideos } from '@/components/lib/youtube';
import { fetchLatestNaverBlogPosts } from '@/components/lib/naverBlog';
import DoctorMore from '@/components/ui/DoctorMore';

export async function generateMetadata() {
    const t = await getTranslations('doctors');
    return { title: t('metaTitle') };
}

export default async function DoctorsPage() {
    const t = await getTranslations('doctors');
    const locale = await getLocale();
    const tLabels = await getTranslations('labels');
    const directorName = locale !== 'ko' && tLabels.has(site.director) ? tLabels(site.director) : site.director;
    const career = t.raw('career') as string[];
    const certification = t.raw('certification') as string[];
    const [youtubeVideos, blogPosts] = await Promise.all([
        fetchLatestYouTubeVideos(site.youtubeChannelId),
        fetchLatestNaverBlogPosts(3),
    ]);

    return (
        <>
            <SubHero en="RE:BERRY Specialist" image="/images/bg-sub-01.jpg" />

            {/* 원장 소개 상단 — 인물과 소개글을 나란히 배치 */}
            <section className="overflow-hidden bg-cream pt-20 md:pt-24 lg:pt-28">
                <div className="container-site grid items-end gap-10 lg:grid-cols-[minmax(320px,430px)_minmax(0,570px)] lg:justify-center lg:gap-20">
                    <Reveal className="mx-auto w-full max-w-[363px]">
                        <div className="relative aspect-[363/525] w-full">
                            <Image
                                src="/images/img-doc-02.png"
                                alt={t('directorImgAlt')}
                                fill
                                quality={90}
                                priority
                                sizes="(max-width: 1024px) 363px, 363px"
                                className="object-contain object-bottom"
                            />
                        </div>
                    </Reveal>

                    <Reveal delay={0.1} className="pb-14 text-center lg:pb-20 lg:text-left">
                        <p className="font-display text-h2 tracking-[0.05em]">RE:BERRY Specialist</p>
                        <div className="mt-5 inline-flex flex-col">
                            <span className="h-px w-full bg-cocoa/35" />
                            <h1 className="font-display px-1 py-2 text-h3">Academic Background &amp; License</h1>
                            <span className="h-px w-full bg-cocoa/35" />
                        </div>
                        <p className="mt-8 text-pretty text-small leading-8 text-latte">
                            {t.rich('bio', {
                                br: () => <br className="hidden lg:block" />,
                                brMobile: () => <br className="block lg:hidden" />,
                                strong: (chunks) => (
                                    <strong className="mb-5 block font-bold text-cocoa lg:mb-0 lg:inline">{chunks}</strong>
                                ),
                                gap: () => <span className="block h-6" aria-hidden="true" />,
                            })}
                        </p>
                    </Reveal>
                </div>
            </section>

            {/* 이력 및 콘텐츠 레이아웃 */}
            <section className="texture-paper bg-cream bg-[url('/images/bg-texture-07.jpg')] bg-cover bg-center">
                <div className="container-site grid items-stretch gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12">
                    <Reveal className="h-full bg-cream/75 px-6 py-20 md:px-9 lg:px-11 lg:py-28">
                        <div className="flex flex-wrap items-center gap-3">
                            <span className="text-h2 font-extrabold">{directorName}</span>
                            <span className="text-lead">{t('directorTitle')}</span>
                            <Image
                                src="/images/i-sig-02.svg"
                                alt={t('signatureAlt')}
                                width={180}
                                height={64}
                                className="h-12 w-auto"
                            />
                        </div>
                        <p className="mt-4 text-medium font-bold leading-relaxed">
                            {t.rich('education', { br: () => <br /> })}
                        </p>

                        <ProfileList title="Career" items={career} />
                        <ProfileList title="Certification · Key Doctor" items={certification} />
                        <DoctorMore />
                    </Reveal>

                    <div className="grid content-start gap-8 py-20 lg:py-28">
                        <Reveal delay={0.1} className="py-2">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="text-h3 font-bold text-cocoa">마포피부왕 닥터파이톤</h2>
                                    <p className="mt-1 font-display text-caption text-latte">RE:BERRY YouTube</p>
                                </div>
                                <a
                                    href={site.youtube}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 text-caption font-semibold text-latte underline-offset-4 hover:text-cocoa hover:underline"
                                >
                                    채널 바로가기
                                </a>
                            </div>
                            {youtubeVideos.length > 0 ? (
                                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                    {youtubeVideos.map((video) => (
                                        <a
                                            key={video.id}
                                            href={video.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group min-w-0"
                                        >
                                            <div className="relative aspect-video overflow-hidden rounded-lg bg-cocoa/10">
                                                <Image
                                                    src={video.thumbnailUrl}
                                                    alt=""
                                                    fill
                                                    quality={85}
                                                    sizes="(max-width: 640px) 100vw, 220px"
                                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                                />
                                            </div>
                                            <p className="clamp-2 mt-2 text-caption font-semibold leading-5 text-cocoa">
                                                {video.title}
                                            </p>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-6 grid min-h-56 place-items-center border-b border-cocoa/10">
                                    <span className="text-caption text-latte/60">영상을 불러오지 못했습니다.</span>
                                </div>
                            )}
                        </Reveal>

                        <Reveal delay={0.15} className="py-2">
                            <div className="flex items-end justify-between gap-4">
                                <div>
                                    <h2 className="font-display text-h3 text-cocoa">RE:BERRY Blog</h2>
                                    <p className="mt-1 text-caption text-latte">Naver Blog</p>
                                </div>
                                <a
                                    href={site.blog}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="shrink-0 text-caption font-semibold text-latte underline-offset-4 hover:text-cocoa hover:underline"
                                >
                                    블로그 바로가기
                                </a>
                            </div>
                            {blogPosts.length > 0 ? (
                                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                                    {blogPosts.map((post) => (
                                        <a
                                            key={post.id}
                                            href={post.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group min-w-0"
                                        >
                                            <div className="relative aspect-video overflow-hidden rounded-lg bg-cocoa/10">
                                                {post.thumbnailUrl ? (
                                                    <Image
                                                        src={post.thumbnailUrl}
                                                        alt=""
                                                        fill
                                                        quality={85}
                                                        sizes="(max-width: 640px) 100vw, 220px"
                                                        className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                                                    />
                                                ) : (
                                                    <div className="grid h-full place-items-center text-caption text-latte/50">
                                                        RE:BERRY
                                                    </div>
                                                )}
                                            </div>
                                            <p className="clamp-2 mt-2 text-caption font-semibold leading-5 text-cocoa">
                                                {post.title}
                                            </p>
                                            <time className="mt-1 block text-[11px] text-latte/70">
                                                {formatBlogDate(post.publishedAt)}
                                            </time>
                                        </a>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-6 grid min-h-56 place-items-center border-b border-cocoa/10">
                                    <span className="text-caption text-latte/60">글을 불러오지 못했습니다.</span>
                                </div>
                            )}
                        </Reveal>
                    </div>
                </div>
            </section>

            <section className="relative overflow-hidden bg-cocoa text-cream">
                <div className="container-site lg:px-0! text-center border-r-0 lg:border-r border-cream py-20 lg:py-30">
                    <Reveal>
                        <h2 className="font-display text-h2 leading-[48px] text-cream tracking-[3.24em]">
                            RE:BERRY PROMISE
                        </h2>
                        <p className="mt-2.25 text-h2 leading-[51px] font-light ">
                            {t.rich('promiseHeadline', {
                                br: () => <br className="block lg:hidden" />,
                                hl: (chunks) => <strong className="font-bold">{chunks}</strong>,
                            })}
                        </p>
                    </Reveal>
                    <div className="relative pt-4 mt-12 lg:pt-12">
                        <div className="absolute top-0 right-0 hidden w-[200vw] border-t border-cream lg:block" />
                        <Reveal className="mx-auto max-w-2xl">
                            <video
                                className="aspect-video w-full bg-deep object-cover rounded-[10px]"
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="metadata"
                            >
                                <source src="/videos/video-pc.mp4" type="video/mp4" />
                                {t('videoFallback')}
                            </video>
                            <p className="mt-4 text-small text-cream/80">{t('conferenceCaption')}</p>
                        </Reveal>
                    </div>
                </div>
            </section>

            <LocationSection />
        </>
    );
}

function ProfileList({ title, items }: { title: string; items: string[] }) {
    return (
        <div className="mt-7">
            <p className="font-display inline-block bg-gradient-to-b from-transparent from-[50%] to-sand to-[50%] px-1.5 text-small">
                {title}
            </p>
            <ul className="mt-3 space-y-1 text-small leading-6 text-latte">
                {items.map((item) => (
                    <li key={item} className="flex items-start">
                        <span className="mr-1.5 shrink-0 font-bold text-cocoa">·</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

function formatBlogDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(date);
}

import { getTranslations } from 'next-intl/server';
import LocationSection from '@/components/ui/LocationSection';
import SubHero from '@/components/ui/SubHero';
import { site } from '@/components/lib/site';

export async function generateMetadata() {
    const t = await getTranslations('reservation');
    return { title: t('metaTitle'), description: t('description') };
}

export default async function ReservationPage() {
    const t = await getTranslations('reservation');

    return (
        <>
            <SubHero en="RESERVATION" title={t('title')} image="/images/bg-sub-06.jpg" />
            <section className="bg-[#F5F1EA] py-20 lg:py-28">
                <div className="container-site">
                    <div className="mx-auto max-w-2xl rounded-[28px] border border-cocoa/10 bg-cream px-6 py-12 text-center shadow-[0_18px_50px_rgba(69,54,45,0.08)] md:px-12 md:py-16">
                        <span className="mx-auto grid size-14 place-items-center rounded-full bg-[#FEE500] text-xl font-black text-[#191919]">
                            K
                        </span>
                        <p className="mt-7 text-caption font-semibold tracking-[0.18em] text-latte">KAKAO TALK</p>
                        <h1 className="mt-2 whitespace-pre-line text-h2 font-bold text-cocoa lg:whitespace-normal!">
                            {t('kakaoTitle')}
                        </h1>
                        <p className="mx-auto mt-4 max-w-xl text-small leading-7 whitespace-pre-line  text-latte">
                            {t('description')}
                        </p>
                        <a
                            href={site.kakao}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-9 inline-flex min-h-13  items-center justify-center rounded-full bg-[#FEE500] px-8 py-3 text-small font-bold text-[#191919] transition-transform hover:-translate-y-0.5"
                        >
                            {t('kakaoButton')}
                        </a>
                        <p className="mt-4 text-caption whitespace-pre-line lg:whitespace-normal! text-latte">
                            {t('kakaoNotice')}
                        </p>
                    </div>
                </div>
            </section>
            <LocationSection />
        </>
    );
}

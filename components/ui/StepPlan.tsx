import Image from 'next/image';
import Reveal from '@/components/motion/Reveal';
import { RevealGroup, RevealItem } from '@/components/motion/RevealGroup';

const steps = [
    {
        no: '01',
        title: '정밀한 피부상태 파악',
        desc: '마크뷰와 라이프비즈 인피니티의 \nAI를 기반으로 피부 3D 재구성',
        image: '/images/img-step-01.jpg',
    },
    {
        no: '02',
        title: '퍼스널 플랜',
        desc: '정밀한 3D 영상과 고객의 구체적인 \n니즈를 바탕으로 정교한 시술을 \n설계합니다.',
        image: '/images/img-step-02.jpg',
    },
    {
        no: '03',
        title: '오직 당신만을 위한 시술',
        desc: '인정받는 더마 스페셜리스트가 \n정기적 플랜 하에서, 당일 피부 상태에 \n적합한 치료를 계획합니다.',
        image: '/images/img-step-03.jpg',
    },
];

export default function StepPlan() {
    return (
        <section className="relative texture-paper py-20 lg:pt-35 lg:pb-30">
            <Image src="/images/bg-texture-06.jpg" alt="" fill quality={85} sizes="100vw" className="object-cover" />
            <div className="container-site relative">
                <Reveal className="text-center">
                    <p className="font-display text-h2">3 Step Plan</p>
                    <h2 className="mt-6.75 tracking-tighter text-h2">
                        리베리의원만의 <strong className="font-bold">3단계 입체 분석</strong>과{' '}
                        <br className="block md:hidden" />
                        <strong className="font-bold">전담 스킨 케어 시스템</strong>
                    </h2>
                </Reveal>
                <RevealGroup className="mx-auto mt-12 grid max-w-md gap-7.25 lg:mt-18 lg:max-w-5xl lg:grid-cols-3">
                    {steps.map((s) => (
                        <RevealItem key={s.no} className="overflow-hidden bg-cocoa text-cream">
                            <div className="relative aspect-[4/3]">
                                <Image
                                    src={s.image}
                                    alt={s.title}
                                    fill
                                    quality={85}
                                    sizes="(max-width: 1024px) 100vw, 300px"
                                    className="object-cover"
                                />
                            </div>
                            <div className="p-10">
                                <p className="font-display text-h3">Step {s.no}</p>
                                <h3 className="mt-3.75 text-medium font-bold">{s.title}</h3>
                                <p className="mt-3 whitespace-pre-line text-small font-medium leading-6">{s.desc}</p>
                            </div>
                        </RevealItem>
                    ))}
                </RevealGroup>
            </div>
        </section>
    );
}

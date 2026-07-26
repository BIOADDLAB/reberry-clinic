'use client';

import Image from 'next/image';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const publications = [
    'First Author, Targets of monoclonal antibodies for immunological diseases,\nArch Pharm Res. (2019), SCI(E)',
    'First Prize, Academic Paper Competition (English-language),\nSeoul Pharmaceutical Association',
    'Poster accepted for presentation at the 27th FAPA Congress (Manila, 2018),\nFederation of Asian Pharmaceutical Associations (LRP-001)',
];

export default function DoctorMore() {
    const [open, setOpen] = useState(false);
    const t = useTranslations('common');
    const tDoctors = useTranslations('doctors');
    const memberships = tDoctors.raw('memberships') as string[];

    return (
        <div>
            {!open && (
                <button
                    onClick={() => setOpen(true)}
                    className="mt-8 flex items-center gap-1.5 text-medium transition-opacity  font-bold duration-500 hover:opacity-60 ml-4"
                >
                    {t('more')}
                    <Image src="/images/i-plus-02.svg" alt="" width={13} height={13} className="mb-3" />
                </button>
            )}
            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                    >
                        <p className="font-display mt-6 ml-4 inline-block w-fit bg-gradient-to-b from-transparent from-[50%] to-[#CDC5B6] to-[50%] px-1.5 text-small">
                            Memberships
                        </p>
                        {/* #ISSUE ul 여백(ml-4) 제거 및 flex 들여쓰기 유지 */}
                        <ul className="mt-3 space-y-1 text-small leading-[24px]">
                            {memberships.map((m) => (
                                <li key={m} className="flex">
                                    <span className="mr-1.5 shrink-0 text-lg font-bold leading-[24px]">·</span>
                                    <span>{m}</span>
                                </li>
                            ))}
                        </ul>

                        <p className="font-display mt-6 ml-4 inline-block w-fit bg-gradient-to-b from-transparent from-[50%] to-[#CDC5B6] to-[50%] px-1.5 text-small">
                            Publications &amp; Academic Activities
                        </p>
                        <ul className="mt-3 space-y-2 text-small leading-[24px]">
                            {publications.map((p) => (
                                <li key={p} className="flex notranslate whitespace-pre-line">
                                    <span className="mr-1.5 shrink-0 text-lg font-bold leading-[24px]">·</span>
                                    <span>{p}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => setOpen(false)}
                            className="mt-8 flex items-center gap-1.5 text-medium font-bold transition-opacity duration-500 hover:opacity-60 ml-4"
                        >
                            {t('collapse')}
                            <Image
                                src="/images/i-plus-02.svg"
                                alt=""
                                width={13}
                                height={13}
                                className="rotate-45 mb-3"
                            />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

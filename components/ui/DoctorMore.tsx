'use client';

import { useTranslations } from 'next-intl';

const publications = [
    'First Author, Targets of monoclonal antibodies for immunological diseases,\nArch Pharm Res. (2019), SCI(E)',
    'First Prize, Academic Paper Competition (English-language),\nSeoul Pharmaceutical Association',
    'Poster accepted for presentation at the 27th FAPA Congress (Manila, 2018),\nFederation of Asian Pharmaceutical Associations (LRP-001)',
];

export default function DoctorMore() {
    const tDoctors = useTranslations('doctors');
    const memberships = tDoctors.raw('memberships') as string[];

    return (
        <div>
            <p className="font-display mt-7 inline-block w-fit bg-gradient-to-b from-transparent from-[50%] to-sand to-[50%] px-1.5 text-small">
                Memberships
            </p>
            <ul className="mt-3 space-y-1 text-small leading-6 text-latte">
                {memberships.map((membership) => (
                    <li key={membership} className="flex items-start">
                        <span className="mr-1.5 shrink-0 font-bold text-cocoa">·</span>
                        <span>{membership}</span>
                    </li>
                ))}
            </ul>

            <p className="font-display mt-7 inline-block w-fit bg-gradient-to-b from-transparent from-[50%] to-sand to-[50%] px-1.5 text-small">
                Publications &amp; Academic Activities
            </p>
            <ul className="mt-3 space-y-2 text-small leading-6 text-latte">
                {publications.map((publication) => (
                    <li key={publication} className="notranslate flex items-start whitespace-pre-line">
                        <span className="mr-1.5 shrink-0 font-bold text-cocoa">·</span>
                        <span>{publication}</span>
                    </li>
                ))}
            </ul>
        </div>
    );
}

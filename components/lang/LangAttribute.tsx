'use client';

import { useEffect } from 'react';

/* .font-display 요소에 notranslate 를 자동으로 붙인다.
   이 프로젝트에서 font-display(Belleza)는 "RE:BERRY", "Attentive Care", "More View" 처럼
   영문 브랜드 표기 전용이다. 브라우저 자체 번역 기능(Chrome 등)이 건드리면 서체 무드가 깨지고
   자간(tracking-[1em] 등)이 잡힌 자리에서 레이아웃까지 밀린다.
   컴포넌트마다 notranslate 를 손으로 붙이면 새로 추가할 때마다 빠뜨리므로 여기서 일괄 처리.
   → 새 영문 표기를 만들 때 font-display 만 붙이면 번역 제외가 따라온다.

   <html lang>/data-lang 자체는 app/layout.tsx 에서 서버 렌더링 시점에 next-intl 로케일로 바로 심는다
   (예전엔 여기서 클라이언트 훅으로 심었지만, 그러면 첫 페인트 때 한 프레임 어긋났다). */
export default function LangAttribute() {
    useEffect(() => {
        document.querySelectorAll('.font-display').forEach((el) => el.classList.add('notranslate'));
    }, []);
    return null;
}

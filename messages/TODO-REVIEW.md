# 번역 검수 필요 목록

next-intl 전환 과정에서 채워 넣은 번역 중 사람이 다시 검수해야 하는 항목을 여기에 기록한다.
JSON은 주석을 지원하지 않으므로, 각 언어 파일 옆에 이 파일로 대신 관리한다.

## 이관 시점(과거 dict.ts/labels.ts)부터 있던 미해결 항목

- `labels.유선민` (en/ja/zh) — 공식 로마자 표기 확정 전 임시값. dict.ts에 있던 기존 `#TODO` 그대로 이관.

## 이번 작업으로 새로 채운 임시 번역 (구글 번역 결과 참고, 검수 필요)

### about (app/(marketing)/about/page.tsx)
- `about.promise1` (en/ja/zh) — 기존에 번역이 없던 새 문구. 구글 번역 결과 참고해 신규 번역, 검수 필요.
- `about.promise2` (en/ja/zh) — 위와 동일.
- `about.interiorAlt`, `about.promiseAlt` (en/ja/zh) — alt 텍스트 신규 번역, 검수 필요.

### home (app/(marketing)/page.tsx)
- `home.heroTagline`, `home.heroImgAlt` (en/ja/zh) — 신규 번역, 검수 필요.
- `home.directorTitle`, `home.directorImgAlt` (en/ja/zh) — 신규 번역, 검수 필요.
- `home.directorBio` (en/ja/zh) — 대표원장 인사말 전문. 기존엔 구글 번역에만 의존하던 문단이라 신규 번역, 특히 어조/존댓말 뉘앙스 검수 필요.
- `home.heroHeadline` zh — 기존 LangText 원문 자체가 ko/en/ja와 달리 "결과/result" 뉘앙스가 빠져 있던 걸 그대로 이관함(의도적 축약인지 확인 필요).

### solutions (messages/solutions/{en,ja,zh}.json — components/lib/solutions.ts 데이터 전체)
- 45개 장비/제품 항목의 desc·point 전부, 그리고 excelv/ulthera/gold-ptt 3개 항목의 subTitle·introDescription·principles(원리 설명 문단, 의료 클레임 포함)까지 전부 신규 번역.
- 사용자 요청에 따라 "UI 크롬만" 이 아니라 데이터까지 전부 채웠음 — 다만 원리 설명은 의료 정보이므로 다른 어떤 항목보다 우선 검수 필요.
- name(장비 고유명사)은 번역하지 않음 — 기존 로직 그대로 로케일 무관하게 engName 사용.

### doctors (app/(marketing)/doctors/page.tsx)
- `doctors.career`, `doctors.certification` (en/ja/zh) — 경력·자격 목록 신규 번역, 고유명사(장비명 등) 표기 검수 필요.
- `doctors.education` (en/ja/zh) — 학력 표기, 특히 대학명 로마자 표기 검수 필요.
- `doctors.bio`, `doctors.promiseHeadline`, `doctors.conferenceCaption` — 신규 번역, 검수 필요.

<!-- 아래에 컴포넌트별 마이그레이션을 진행하며 새로 추가한 번역 키를 계속 추가할 것 -->

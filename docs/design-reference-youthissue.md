# 디자인 레퍼런스 — youthissue.vercel.app 추출 결과

> 사용자가 지정한 레퍼런스 사이트(https://youthissue.vercel.app/, "청년이슈 픽")의 실제 배포 HTML/CSS를
> 직접 fetch하여 추출한 값. 클라이언트 렌더링 앱이라 브라우저 없이 curl로 raw HTML/CSS를 가져와 분석함
> (Tailwind arbitrary value 클래스 `bg-[#hex]`, `text-[#hex]` 형태로 하드코딩되어 있어 추출 가능했음).

---

## 1. 컬러 팔레트

| 역할 | 값 | 사용처 |
|---|---|---|
| **Primary (틸/청록)** | `#25B9B9` | 메인 브랜드 컬러 — 활성 배지, 강조 텍스트, primary 버튼 bg |
| Primary hover/dark | `#20A6A6` | 텍스트 hover, 아이콘 강조 |
| Primary tint (bg) | `#E9F8F8` | 배지/카드 배경 (연한 틸) |
| Primary tint 2 | `#F5FBFB` / `#DCF3F3` / `#D6EFEF` / `#CAEEFA` | 카드 내부 서브 섹션 배경 |
| **Text primary (다크 네이비)** | `#161B30` | 본문 텍스트, 헤딩, 툴팁 배경 |
| Text secondary | `#555B61` | 보조 텍스트, 필터 pill 텍스트 |
| Text tertiary/muted | `#8D9399` / `#B1B6BC` | placeholder, 아이콘 기본색, 카운트 배지 |
| **Page background** | `#F5F6F7` | 전체 배경, 비활성 pill 배경 |
| Card border | `#ECEFF2` / `#E2E6EB` | 카드/헤더 하단 구분선 |
| **Accent blue** | `#64A7FF` / `#0098D4` | 보조 정보(언론사 수 등) 강조 |
| Blue tint | `#E9F6FA` / `#CAEEFA` | 파란 계열 배지 배경 |
| **Warning/포인트 amber** | `#FFC84D` / `#FF9000` / `#F7AC00` | NEW 배지, 순위 강조 |
| **Danger/urgent red** | `#EF4452` / `#EF6E0E` | 마감임박·긴급 배지 |
| **Success green** | `#23B169` | 긍정적 지표(있다면) |
| Purple accent (드물게) | `#7233F8` / bg `#E5D9FE` | 특수 카테고리 배지 1건 |

**패턴**: 각 색상군마다 "진한 텍스트색 + 연한 배경(tint)" 페어로 배지(badge)를 구성함
(예: `bg-[#E9F8F8] text-[#25B9B9]`, `bg-[#E5D9FE] text-[#7233F8]`). 순수 채도색을 큰 면적에
칠하지 않고 배지/포인트에만 국한 — 전체 화면은 흰색/연회색이 지배적.

## 2. 타이포그래피

- **폰트: Spoqa Han Sans Neo** (`--font-sans: "Spoqa Han Sans Neo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`)
  - 한국 스타트업/서비스에서 흔히 쓰이는 실무형 한글 폰트. Noto Sans KR보다 약간 더 브랜드감 있고 숫자 가독성이 좋음.
  - `letter-spacing: -0.15px` 살짝 좁힘 (한글 타이트닝)
- 굵기: medium(500) / semibold(600) / bold(700) / extrabold(800) 4단계 사용
- 폰트 크기: 매우 작은 단위(9px, 10px, 12px, 13px)까지 세분화해서 배지·메타정보에 사용 — 본문은 이보다 큼

## 3. 형태(Shape) & 그림자

- **모서리**: 카드 `rounded-[12px]`, 툴팁 `rounded-[8px]`, 작은 배지 `rounded-[4px]`, **버튼/필터 pill은 `rounded-full`** (완전 캡슐형)
  - 즉 "카드는 각지지 않은 12px, 인터랙티브 pill류는 완전 라운드"라는 명확한 위계
- **그림자**: 대부분 무그림자(flat). 예외적으로 툴팁(`shadow-[0_4px_16px_rgba(17,17,17,0.18)]`)과
  활성 primary 버튼(`shadow-[0_1px_6px_rgba(37,185,185,0.22)]` — 브랜드컬러 자체를 그림자 색으로 씀)에만
  약하게 사용. 무분별한 카드 그림자 없음.
- **인터랙션**: 클릭 시 `active:scale-[0.92~0.95]` (버튼/아이콘이 눌릴 때 살짝 축소) + `transition-all duration-200`

## 4. 레이아웃

- 모바일 퍼스트, **`max-w-[480px] mx-auto`**로 데스크톱에서도 모바일 폭 그대로 중앙 정렬(카드형 앱처럼 보이게)
- 헤더: `sticky top-0`, 흰 배경 + 하단 헤어라인 보더

## 5. 우리 서비스에 적용 시 판단

**공통점 활용**: 우리 서비스도 스텝형 마법사 + 결과 카드 구조라 이 레퍼런스의 "12px 카드 + full-rounded pill 버튼 + flat 배경 + 브랜드컬러 배지 페어링" 패턴은 그대로 가져오기 좋음. 특히 **활성 필터/선택지 pill**(`rounded-full`, 선택 시 컬러 반전) 패턴은 문답 마법사의 선택지 버튼에 바로 적용 가능.

**차이점(우리 도메인 특성상 조정 필요)**:
- youthissue는 뉴스 큐레이션(가벼운 정보 소비)이라 원색 틸이 경쾌하게 어울리지만, 우리는 "정부지원 대출 자격"이라는 금융/신뢰 도메인 → 프라이머리 컬러를 이 틸 그대로 쓰기보다, **동일한 "진한 텍스트 + 연한 tint 배지" 구조는 유지하되 색조 자체는 신뢰감 있는 톤(네이비/블루 계열 유지 또는 틸을 살짝 딥하게)**으로 조정하는 걸 권장
- CLAUDE.md가 "정형화된 AI 스타일(보라 그라데이션) 금지"를 요구하는데, 이 레퍼런스도 그라데이션이 전혀 없어(flat 컬러 블록) 방향이 일치함

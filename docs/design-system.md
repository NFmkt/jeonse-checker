# 디자인 시스템 확정 (2단계 완료)

> 확정일: 2026-07-10. 레퍼런스: youthissue.vercel.app 실제 배포 CSS 추출값([design-reference-youthissue.md](design-reference-youthissue.md))
> 컬러 방향: **레퍼런스 틸 그대로 사용** (사용자 확정)

---

## 1. 컬러 팔레트

| 토큰 | 값 | 용도 |
|---|---|---|
| `--color-primary` | `#25B9B9` | 브랜드 컬러 — 활성 pill, 강조 텍스트, primary 버튼 |
| `--color-primary-hover` | `#20A6A6` | hover/active 강조 |
| `--color-primary-tint` | `#E9F8F8` | 배지/카드 서브 배경 |
| `--color-primary-tint-2` | `#F5FBFB` | 카드 내부 섹션 배경 |
| `--color-text-primary` | `#161B30` | 본문/헤딩 |
| `--color-text-secondary` | `#555B61` | 보조 텍스트 |
| `--color-text-muted` | `#6E7479` / `#B1B6BC` | placeholder, 카운트, 본문 보조 텍스트 (이슈 #6에서 `#8D9399`→`#6E7479`로 조정 — WCAG AA 4.5:1 대비 기준 충족을 위해 사용자 승인, 2026-07-12) |
| `--color-bg` | `#F5F6F7` | 페이지 배경, 비활성 pill |
| `--color-border` | `#ECEFF2` | 카드/구분선 |
| `--color-accent-blue` | `#0098D4` / tint `#E9F6FA` | 보조 정보(대출한도 등 수치 강조) |
| `--color-success` | `#23B169` | "자격 충족" 배지 |
| `--color-danger` | `#EF4452` | "자격 미충족" 배지, 필수 안내 |
| `--color-warning` | `#FF9000` / tint `#FFC84D` | 특례/우대 조건 강조 |

**배지 페어링 규칙**: 모든 상태 배지는 `연한 tint 배경 + 진한 동색 텍스트` 조합 고정
(예: 충족 = `bg-[#E9F8F8] text-[#25B9B9]`, 미충족 = `bg-[#FDE8EA] text-[#EF4452]`).

## 2. 타이포그래피

- **폰트: Spoqa Han Sans Neo** (OFL 라이선스, 무료 상업 이용 가능)
  ```css
  @import url('https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css');
  font-family: "Spoqa Han Sans Neo", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  letter-spacing: -0.15px;
  ```
- 굵기: 500(medium) 본문 강조 / 600(semibold) 라벨·배지 / 700(bold) 헤딩 / 800(extrabold) 결과화면 핵심 수치
- 크기 스케일: 9·10·12·13px(메타/배지) — 16px(본문, 모바일 줌 방지 최소값) — 20·24·36px(헤딩/결과 수치)

## 3. 형태(Shape) & 인터랙션

- **카드**: `border-radius: 12px`, 무그림자(flat), 배경 `#FFFFFF`, 테두리 `1px solid #ECEFF2`
- **문답 선택지 버튼(핵심 컴포넌트)**: `border-radius: 9999px`(완전 pill), 비선택 시 `bg-[#F5F6F7] text-[#555B61]`, 선택 시 `bg-[#25B9B9] text-white` + `shadow: 0 1px 6px rgba(37,185,185,0.22)`
- **작은 배지/태그**: `border-radius: 4px`
- **툴팁/팝오버**: `border-radius: 8px`, `shadow: 0 4px 16px rgba(17,17,17,0.18)`
- **인터랙션**: 클릭 시 `active:scale(0.92~0.95)` + `transition: all 200ms ease-out`. 큰 그림자·과도한 라운딩·보라 그라데이션 금지(CLAUDE.md 준수 확인됨).

## 4. 레이아웃

- 모바일 퍼스트, 콘텐츠 폭 `max-width: 480px; margin: 0 auto` (데스크톱에서도 모바일 폭 카드형 유지 — 스텝형 마법사 특성상 넓은 화면이 불필요)
- 헤더: `position: sticky; top: 0`, 흰 배경 + 하단 헤어라인

## 5. 결과 화면 적용 방식

- 자격 충족: `success` 배지 + `#25B9B9` 계열 카드 강조
- 자격 미충족: `danger` 배지 + 사유 텍스트(`text-secondary`)
- 대출한도/금리 range: `accent-blue` tint 박스에 수치 강조(숫자는 extrabold 800)
- 니치 3종 자기신고 특례: `warning` 톤 배지로 구분

---

## 상속 규칙 (CLAUDE.md 준수)

위 팔레트·타이포그래피·형태 규칙은 이후 생성되는 **모든 컴포넌트에 예외 없이 상속**한다.
개별 컴포넌트 작업 시 임의로 새 색상/폰트/라운딩 값을 추가하지 않는다.

# 이슈 #6: 반응형 / 접근성 QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 375px~1440px 반응형 레이아웃을 검증하고, 터치 타겟·명도 대비·reduced-motion·폼 라벨/키보드
탐색 등 접근성 기준을 점검·수정한다.

**Architecture:** 기존 컴포넌트에 국한된 순수 스타일/속성 변경. 새 컴포넌트나 데이터 변경 없음.

**Tech Stack:** Next.js 16 + TypeScript + Tailwind v4. 컴포넌트 테스트 미설정 — 브라우저 라이브
검증(`resize_window`, `read_page`, `get_page_text`)으로 확인한다.

## Global Constraints

- **명도 대비 결정(사용자 승인, 2026-07-12)**: `docs/design-system.md`의 `--color-text-muted` 토큰
  값 `#8D9399`는 흰 배경 대비 약 3.1:1로 WCAG AA 본문 텍스트 기준(4.5:1) 미달임이 확인되어, 사용자가
  토큰 자체를 **`#6E7479`로 조정**하기로 결정함(흰 배경 대비 약 4.73:1, 계산 검증 완료). 이 값은
  이제 새로운 고정 토큰이며 임의 값이 아니다 — `docs/design-system.md`도 이 값으로 갱신한다.
- 그 외 컬러·타이포그래피·형태 값은 `docs/design-system.md`에 고정된 토큰만 사용한다.
- 터치 타겟은 최소 44×44px(WCAG 2.5.5/2.5.8 권장치, issues.md #6 승인기준)이어야 한다.
- `prefers-reduced-motion: reduce` 환경에서는 트랜지션/애니메이션을 없애거나 최소화한다(사용자가
  실제로 애니메이션을 끄고 싶어하는 경우이므로, 무시하지 않는다).
- 반응형 검증은 코드를 먼저 고치고 나중에 확인하는 게 아니라, 이 프로젝트는 이미 모바일 퍼스트
  `max-width: 480px; margin: 0 auto` 레이아웃(design-system.md 4장)이므로 **먼저 4개 breakpoint에서
  라이브 검증하고, 실제로 깨지는 지점만 고친다**(추측성 사전 리팩토링 금지).

---

### Task 1: 명도 대비 수정 (`--color-text-muted` 토큰을 `#6E7479`로 조정)

**Files:**
- Modify: `docs/design-system.md`
- Modify: `components/Questionnaire.tsx` (3곳)
- Modify: `components/ResultCard.tsx` (3곳)
- Modify: `app/page.tsx` (2곳)

**Interfaces:**
- Consumes: 없음
- Produces: 없음(순수 색상 값 치환, 총 8곳)

- [ ] **Step 1: `docs/design-system.md`의 토큰 값 갱신**

`docs/design-system.md`의 컬러 팔레트 표에서 아래 줄을 찾는다:

```
| `--color-text-muted` | `#8D9399` / `#B1B6BC` | placeholder, 카운트 |
```

아래로 교체한다(변경 이력 각주 추가):

```
| `--color-text-muted` | `#6E7479` / `#B1B6BC` | placeholder, 카운트, 본문 보조 텍스트 (이슈 #6에서 `#8D9399`→`#6E7479`로 조정 — WCAG AA 4.5:1 대비 기준 충족을 위해 사용자 승인, 2026-07-12) |
```

- [ ] **Step 2: `components/Questionnaire.tsx`의 `#8D9399`를 `#6E7479`로 전부 교체**

`text-[#8D9399]`가 나오는 3곳(전세피해/갱신만료/주거취약계층 보조 설명 `<p>`)을 전부
`text-[#6E7479]`로 바꾼다.

- [ ] **Step 3: `components/ResultCard.tsx`의 `#8D9399`를 `#6E7479`로 전부 교체**

3곳(비대상 배지, 비대상 설명, 출처/확인일자 줄)을 전부 `text-[#6E7479]`로 바꾼다(배지의
`bg-[#F5F6F7]`는 그대로 둔다).

- [ ] **Step 4: `app/page.tsx`의 `#8D9399`를 `#6E7479`로 전부 교체**

개인정보 비저장 고지와 정확성 면책 문구, 2곳을 전부 `text-[#6E7479]`로 바꾼다.

- [ ] **Step 5: 남은 참조 확인**

Run: `grep -rn "8D9399" components/ app/ docs/design-system.md`
Expected: `docs/design-system.md`의 각주 설명 텍스트 안에서만 `#8D9399`가 남아 있어야 한다(이전
값을 설명하기 위한 언급이므로 정상). 컴포넌트 파일에는 0건이어야 한다.

- [ ] **Step 6: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 7: 커밋**

```bash
git add docs/design-system.md components/Questionnaire.tsx components/ResultCard.tsx app/page.tsx
git commit -m "fix: 명도 대비 개선 위해 text-muted 토큰 #8D9399→#6E7479 조정(WCAG AA 4.5:1)"
```

---

### Task 2: 터치 타겟 44×44px 이상 확보

**Files:**
- Modify: `components/Questionnaire.tsx:25-46` (`ToggleButton` 컴포넌트)

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: 현재 `ToggleButton` 확인**

현재 `h-9`(36px)로 44px 미만이다. `components/Questionnaire.tsx`에서 `ToggleButton` 함수를
찾는다(현재 형태):

```tsx
function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-4 rounded-full text-sm font-semibold transition-all duration-200 ease-out active:scale-95 ${
        active
          ? 'bg-[#25B9B9] text-white shadow-[0_1px_6px_rgba(37,185,185,0.22)]'
          : 'bg-[#F5F6F7] text-[#555B61]'
      }`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: 높이를 44px(`h-11`)로 올리고 `aria-pressed` 추가**

전체를 아래로 교체한다(터치 타겟 44px 확보 + 토글 버튼임을 스크린리더에 알리는 `aria-pressed`
추가 — 접근성 기준 "폼 요소에 라벨이 있고"의 정신에 맞음, 시각 스타일은 변경 없음):

```tsx
function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-11 px-4 rounded-full text-sm font-semibold transition-all duration-200 ease-out active:scale-95 ${
        active
          ? 'bg-[#25B9B9] text-white shadow-[0_1px_6px_rgba(37,185,185,0.22)]'
          : 'bg-[#F5F6F7] text-[#555B61]'
      }`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 4: 브라우저로 라이브 검증**

`npm run dev`로 로컬 서버를 띄우고, 문답 아무 단계에서나 pill 버튼을 `javascript_tool`로
`getBoundingClientRect()` 조회해 `height >= 44`인지 확인한다. `다음`/`이전`/`다시 하기` 버튼은
이미 `h-11`(44px)이므로 별도 수정 불필요 — 동일한 방법으로 44px 이상인지만 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add components/Questionnaire.tsx
git commit -m "fix: 선택 pill 터치 타겟 44px로 확대(h-9→h-11) + aria-pressed 추가"
```

---

### Task 3: `prefers-reduced-motion` 지원

**Files:**
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: 현재 `app/globals.css` 확인**

이슈 #5 Task 1에서 정리된 현재 전체 파일:

```css
@import url('https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css');
@import "tailwindcss";

:root {
  --background: #F5F6F7;
  --foreground: #161B30;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: 'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: -0.15px;
}
```

- [ ] **Step 2: `prefers-reduced-motion: reduce` 미디어쿼리 추가**

파일 맨 끝에 아래 블록을 추가한다(모든 트랜지션·애니메이션을 사실상 순간적으로 만들어
`active:scale-95`/`transition-all` 등 Tailwind 유틸리티가 만드는 모든 애니메이션에 전역 적용):

```css

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 4: 브라우저로 라이브 검증**

`resize_window`나 OS 설정 없이도, `javascript_tool`로 다음을 실행해 미디어쿼리가 실제로
매치되는 환경을 시뮬레이션하기는 어렵지만(브라우저 자동화 도구가 OS 레벨 설정을 바꿀 수 없음),
최소한 CSS 규칙 자체가 스타일시트에 존재하는지 확인한다:

```js
[...document.styleSheets].some(s => {
  try { return [...s.cssRules].some(r => r.media && r.media.mediaText.includes('prefers-reduced-motion')) }
  catch(e) { return false }
})
```
Expected: `true`.

- [ ] **Step 5: 커밋**

```bash
git add app/globals.css
git commit -m "feat: prefers-reduced-motion 지원 — 트랜지션/애니메이션 최소화"
```

---

### Task 4: 반응형 레이아웃 QA (375 / 768 / 1024 / 1440px)

**Files:**
- 코드 변경은 검증 중 실제로 깨지는 지점이 발견될 때만(현재 예상: 없음 — 이미 모바일 퍼스트
  `max-w-[480px] mx-auto` 구조). 발견되면 해당 파일을 최소한으로 수정한다.

**Interfaces:**
- Consumes: 없음
- Produces: 없음

이 태스크는 코드 작성보다 **검증이 본체**다. 컴포넌트 테스트가 없으므로 브라우저 라이브 검증으로
확인한다.

- [ ] **Step 1: 4개 breakpoint에서 순서대로 확인**

`npm run dev`(또는 `.claude/launch.json`의 `loan-eligibility-service` 설정)로 서버를 띄우고,
`resize_window`로 아래 4개 크기를 순서대로 적용하면서 각각에서 문답 화면(1단계)과 결과 화면
(11단계 완료 후)을 모두 확인한다:

| 크기 | 프리셋 |
|---|---|
| 375×812 | `preset: "mobile"` |
| 768×1024 | `preset: "tablet"` |
| 1024×768 | `width: 1024, height: 768` (직접 지정) |
| 1440×900 | `width: 1440, height: 900` (직접 지정) |

각 크기에서 확인할 것:
- `javascript_tool`로 `document.documentElement.scrollWidth > document.documentElement.clientWidth`가
  `false`인지 확인(가로 스크롤 없음 = 승인기준 1번).
- `read_page`로 버튼/입력 요소가 화면 밖으로 잘리지 않고 전부 상호작용 가능한지 확인.
- 결과 화면에서 7개 카드가 전부 읽기 가능한 형태로 쌓이는지(`get_page_text`로 텍스트 순서 확인).

- [ ] **Step 2: 문제 발견 시 최소 수정**

레이아웃 깨짐(가로 스크롤 발생, 요소 겹침, 잘림)이 실제로 발견되면 해당 컴포넌트의 최소한의
Tailwind 클래스만 조정한다(예: 특정 요소에 `flex-wrap` 누락 시 추가). 이 계획서 작성 시점에는
구체적인 깨짐 지점이 없으므로, 발견된 이슈는 이 태스크의 구현자가 실제 진단 후 고치고 그 내용을
보고서에 정확히 남긴다.

- [ ] **Step 3: 폼 라벨 + 키보드 탐색 순서 확인**

`read_page`(filter: "all" 또는 "interactive")로 각 문답 스텝의 `fieldset`/`legend` 구조가
여전히 살아있는지 확인(이미 모든 스텝이 `<fieldset><legend>질문</legend>...</fieldset>` 구조를
쓰고 있음 — 회귀만 없으면 됨). 키보드 탐색 순서는 DOM 순서를 그대로 따르므로(탭 인덱스 조작
없음), DOM 순서가 시각적 순서와 일치하는지 `read_page`의 트리 순서로 확인한다.

- [ ] **Step 4: 빌드 + 테스트 재확인**

Run: `npm run build && npm test`
Expected: 둘 다 성공(테스트 개수는 이전 태스크들에서 변경 없었다면 76개 그대로).

- [ ] **Step 5: 커밋**

코드 변경이 있었다면:
```bash
git add <수정된 파일>
git commit -m "fix: 반응형 QA 중 발견된 레이아웃 이슈 수정"
```

코드 변경이 없었다면(검증만으로 통과) 커밋 불필요 — 보고서에 "코드 변경 없이 4개 breakpoint 전부
통과" 명시.

---

## 완료 후 체크 (issues.md #6 승인기준 재확인)

- [ ] 375px, 768px, 1024px, 1440px에서 레이아웃 깨짐 없음(가로 스크롤 없음)
- [ ] 모든 인터랙티브 요소 터치 타겟 44×44px 이상
- [ ] 본문 텍스트 대비 4.5:1 이상(라이트 모드 기준)
- [ ] prefers-reduced-motion 설정 시 애니메이션 축소/제거됨
- [ ] 폼 요소에 라벨이 있고 키보드 탐색이 시각적 순서와 일치함

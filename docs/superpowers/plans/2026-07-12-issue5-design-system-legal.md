# 이슈 #5: 디자인 시스템 전면 적용 + 법적 고지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `docs/design-system.md`에 고정된 컬러/타이포그래피/형태 토큰을 전체 화면에 값 단위로
일치시키고(임의 값 제거), 문답 선택 pill의 active:scale 인터랙션을 추가하고, `docs/SPEC.md` 6장의
법적 고지 3종(정확성 면책·개인정보 비저장 고지·상품별 출처+확인일자)을 화면에 삽입한다.

**Architecture:** 기존 컴포넌트(`Questionnaire.tsx`, `ResultCard.tsx`, `app/page.tsx`,
`app/globals.css`)에 국한된 순수 UI/텍스트 변경. 데이터 레이어는 `EligibilityResult`에
`sourceUrl`/`verifiedAt` 두 필드를 추가하는 것 한 곳뿐이며, 이는 이슈 #4에서 `loanLimitText`/
`rateRangeText`를 추가했던 것과 동일한 패턴을 반복한다(각 상품 JSON에는 `sourceUrl`/`verifiedAt`이
이미 존재함 — 새 리서치 불필요, 배선만 하면 됨).

**Tech Stack:** Next.js 16 + TypeScript + Tailwind v4, Vitest(`environment: 'node'`, 컴포넌트
테스트 미설정 — 데이터 배선은 유닛 테스트로, 순수 UI/스타일 변경은 브라우저 라이브 검증으로 확인).

## Global Constraints

- 컬러·타이포그래피·형태 값은 `docs/design-system.md`에 고정된 토큰 값만 사용한다. 그 문서에 없는
  새 색상·라운딩·그림자 값을 만들지 않는다.
- `--color-text-muted` 토큰은 `#8D9399`다(문서 1장). 현재 코드에 퍼져 있는 `#8A9099`는 이 토큰과
  다른 값이므로 전부 `#8D9399`로 교정한다(추측이 아니라 문서 값을 그대로 따른다).
- 선택 pill 인터랙션은 문서 3장 그대로: `active:scale(0.92~0.95)` + `transition: all 200ms
  ease-out`, 선택 시 `shadow: 0 1px 6px rgba(37,185,185,0.22)`.
- 법적 고지 3종의 문구는 `docs/SPEC.md` 6장에 확정된 표현을 **그대로** 사용한다(의역하지 않는다).
  단, 출처 고지의 날짜는 SPEC.md의 예시 날짜(2026-07-09)를 하드코딩하지 않고 각 상품 JSON의 실제
  `verifiedAt` 값을 그대로 표시한다(상품마다 확인일이 다르므로 — `docs/eligibility-criteria.md`,
  각 `data/products/*.json` 참조).
- 그라데이션·과도한 그림자·과도한 라운딩을 추가하지 않는다(CLAUDE.md 금지 스타일).
- `EligibilityResult` 필드명은 `sourceUrl: string`, `verifiedAt: string`을 그대로 사용한다(이슈 #4의
  `loanLimitText`/`rateRangeText`와 동일한 패턴 — 다른 이름으로 바꾸지 않는다).
- 이 이슈의 범위는 `docs/issues.md` #5 승인기준에 명시된 5개 항목뿐이다. Spoqa 폰트 외부 CDN
  자체호스팅 전환(HANDOFF.md에 별도 추적 중인 기술부채)은 이 계획의 범위 밖이다 — 폰트 바이너리
  파일 다운로드가 필요한 작업이라 별도 사용자 승인 없이는 진행하지 않는다. 건드리지 않는다.

---

### Task 1: 컬러 토큰 정합성 수정 (`#8A9099` → `#8D9399`, globals.css 임의 값 정리)

**Files:**
- Modify: `components/Questionnaire.tsx` (5곳: 특이사항 단계 3개 보조 설명 문구 `text-[#8A9099]`)
- Modify: `components/ResultCard.tsx` (2곳: "비대상" 배지 텍스트, 비대상 설명 문구)
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: 없음 (순수 색상 값 치환)
- Produces: 없음 (다른 태스크가 이 값에 의존하지 않음)

- [ ] **Step 1: `Questionnaire.tsx`의 `#8A9099`를 `#8D9399`로 전부 교체**

`components/Questionnaire.tsx`에서 `text-[#8A9099]`가 나오는 3곳(전세피해/갱신만료/주거취약계층
보조 설명 `<p>` 태그)을 전부 `text-[#8D9399]`로 바꾼다. 예를 들어:

```tsx
              <p className="text-xs text-[#8A9099] px-1">
                전세사기피해 확인서 대상 여부는 관할 기관에서 최종 확인됩니다.
              </p>
```

위 코드를 아래로 바꾼다(다른 두 곳도 클래스명만 동일하게 교체):

```tsx
              <p className="text-xs text-[#8D9399] px-1">
                전세사기피해 확인서 대상 여부는 관할 기관에서 최종 확인됩니다.
              </p>
```

- [ ] **Step 2: `ResultCard.tsx`의 `#8A9099`를 `#8D9399`로 전부 교체**

`components/ResultCard.tsx`의 `!result.applicable` 분기 안 2곳을 바꾼다:

```tsx
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F5F6F7] text-[#8D9399]">
            비대상
          </span>
        </div>
        <p className="text-sm text-[#8D9399]">
          특이사항 단계에서 해당 항목을 선택하지 않아 판정하지 않았습니다.
        </p>
```

- [ ] **Step 3: `app/globals.css`의 임의 배경/전경 값과 미정의 다크모드 제거**

현재 파일 전체는 다음과 같다(Next.js 스캐폴딩 기본값이 그대로 남아 있음 — `#ffffff`/`#171717`/
`#0a0a0a`/`#ededed`는 `docs/design-system.md`에 없는 값이고, 다크모드는 그 문서에 정의돼 있지 않다):

```css
@import url('https://spoqa.github.io/spoqa-han-sans/css/SpoqaHanSansNeo.css');
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: 'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: 'Spoqa Han Sans Neo', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  letter-spacing: -0.15px;
}
```

전체를 아래로 교체한다(`--background`/`--foreground`를 design-system.md의 `--color-bg`(`#F5F6F7`)와
`--color-text-primary`(`#161B30`) 값으로 고정하고, 미정의 다크모드 블록을 제거):

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

- [ ] **Step 4: 남은 `#8A9099` 참조가 없는지 확인**

Run: `grep -rn "8A9099" components/ app/` (bash) — 또는 Windows에서 동일한 검색 도구로.
Expected: 출력 없음(0건).

- [ ] **Step 5: 빌드 확인**

Run: `npm run build`
Expected: 성공(타입 에러 없음, 스타일 변경은 타입에 영향 없음).

- [ ] **Step 6: 커밋**

```bash
git add components/Questionnaire.tsx components/ResultCard.tsx app/globals.css
git commit -m "fix: 컬러 토큰 정합성(#8A9099→#8D9399) + globals.css 임의 값 정리"
```

---

### Task 2: 선택 pill active:scale 인터랙션 추가

**Files:**
- Modify: `components/Questionnaire.tsx:25-45` (`ToggleButton` 컴포넌트)

**Interfaces:**
- Consumes: 없음
- Produces: 없음(같은 파일 내 완결)

- [ ] **Step 1: 현재 `ToggleButton` 구현 확인**

`components/Questionnaire.tsx`에서 `ToggleButton` 함수를 찾는다(현재 아래와 같은 형태):

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
      className={`h-9 px-4 rounded-full text-sm font-semibold transition-colors ${
        active ? 'bg-[#25B9B9] text-white' : 'bg-[#F5F6F7] text-[#555B61]'
      }`}
    >
      {children}
    </button>
  )
}
```

- [ ] **Step 2: `active:scale` + `transition: all 200ms` + 선택 시 shadow 추가**

위 함수 전체를 아래로 교체한다(design-system.md 3장의 정확한 값 사용: `active:scale-95`
Tailwind 유틸리티는 0.95 배율로 문서의 "0.92~0.95" 범위 안에 들어간다, `transition-all
duration-200 ease-out`, 선택 시에만 `shadow-[0_1px_6px_rgba(37,185,185,0.22)]`):

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

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 4: 브라우저로 라이브 검증**

`npm run dev`(또는 `.claude/launch.json`의 `loan-eligibility-service` 설정)로 로컬 서버를 띄우고,
문답 1단계("이사할 집을 결정하셨나요?")에서 pill 버튼을 클릭했을 때 (a) 클릭 즉시 살짝 눌리는
스케일 애니메이션이 보이는지, (b) 선택된 pill에 은은한 틸 그림자가 추가되는지 확인한다.
`javascript_tool`로 선택된 버튼의 `getComputedStyle(...).boxShadow` 값을 확인해
`rgba(37, 185, 185, 0.22)`가 포함돼 있는지 확인해도 된다.

- [ ] **Step 5: 커밋**

```bash
git add components/Questionnaire.tsx
git commit -m "feat: 선택 pill에 active:scale 인터랙션 + 선택 시 그림자 추가"
```

---

### Task 3: 법적 고지 2종 추가 (정확성 면책 + 개인정보 비저장 고지)

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: 없음
- Produces: 없음

- [ ] **Step 1: 현재 `app/page.tsx` 확인**

전체 파일은 현재 다음과 같다:

```tsx
'use client'

import { useState } from 'react'
import { Questionnaire } from '@/components/Questionnaire'
import { ResultCard } from '@/components/ResultCard'
import { checkAllProducts, type Applicant, type EligibilityResult } from '@/lib/eligibility'

export default function Home() {
  const [results, setResults] = useState<EligibilityResult[] | null>(null)

  function handleComplete(applicant: Applicant) {
    setResults(checkAllProducts(applicant))
  }

  return (
    <main className="min-h-screen bg-[#F5F6F7]">
      {results ? (
        <div className="max-w-[480px] mx-auto px-4 py-8">
          <div className="flex flex-col gap-3">
            {results.map((result) => (
              <ResultCard key={result.productId} result={result} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setResults(null)}
            className="mt-4 h-11 px-4 rounded-full text-sm font-semibold bg-[#F5F6F7] text-[#555B61] border border-[#ECEFF2]"
          >
            다시 하기
          </button>
        </div>
      ) : (
        <Questionnaire onComplete={handleComplete} />
      )}
    </main>
  )
}
```

- [ ] **Step 2: 결과 화면 상단에 개인정보 비저장 고지, 하단(다시하기 버튼 아래)에 정확성 면책 추가**

`results ? (...)` 블록 전체를 아래로 교체한다(SPEC.md 6장 문구를 그대로 사용, 색상은
`--color-text-muted`(`#8D9399`) 토큰):

```tsx
        <div className="max-w-[480px] mx-auto px-4 py-8">
          <p className="mb-4 text-xs text-[#8D9399]">
            입력하신 정보는 서버로 전송·저장되지 않으며, 브라우저를 닫거나 새로고침하면 사라집니다.
          </p>
          <div className="flex flex-col gap-3">
            {results.map((result) => (
              <ResultCard key={result.productId} result={result} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setResults(null)}
            className="mt-4 h-11 px-4 rounded-full text-sm font-semibold bg-[#F5F6F7] text-[#555B61] border border-[#ECEFF2]"
          >
            다시 하기
          </button>
          <p className="mt-4 text-xs text-[#8D9399]">
            본 진단 결과는 2026-07 기준 공식 자격요건을 바탕으로 한 참고용 시뮬레이션이며, 실제
            대출 가능 여부는 기금e든든 또는 취급은행의 심사 결과에 따라 다를 수 있습니다.
          </p>
        </div>
```

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: 성공.

- [ ] **Step 4: 브라우저로 라이브 검증**

11단계 문답을 끝까지 완료해 결과 화면에서 두 문구가 정확한 텍스트로(오타 없이, SPEC.md 6장과
글자 단위로 일치) 보이는지 `get_page_text`로 확인한다.

- [ ] **Step 5: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: 결과 화면에 정확성 면책 + 개인정보 비저장 고지 문구 추가"
```

---

### Task 4: 상품 카드에 출처 URL + 확인일자 표시

**Files:**
- Modify: `lib/eligibility.ts` (`EligibilityResult` 타입 + 7개 `check*` 함수의 return문)
- Modify: `components/ResultCard.tsx`
- Test: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: 7개 상품 JSON에 이미 존재하는 `sourceUrl: string`, `verifiedAt: string` 필드(새 리서치
  불필요)
- Produces: `EligibilityResult`에 `sourceUrl: string`, `verifiedAt: string` 필드 추가(이 태스크
  안에서 배선까지 끝나며, 이후 태스크 없음)

이 태스크는 이슈 #4의 Task 1·2와 완전히 동일한 패턴이다(다른 필드 이름으로 반복).

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/eligibility.test.ts`의 각 `describe` 블록에 아래 테스트를 추가한다(각 블록이 이미 쓰는
fixture 변수명을 그대로 사용: `baseApplicant`/`youthBase`/`newlywedBase`/`newbornBase`/
`damageBase`/`renewalBase`/`vulnerableBase`):

`describe('checkBootmokGeneral', ...)` 안에:

```typescript
  it('결과에 출처 URL과 확인일자가 포함된다', () => {
    const result = checkBootmokGeneral(baseApplicant)
    expect(result.sourceUrl).toBe('https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020101.jsp')
    expect(result.verifiedAt).toBe('2026-07-09')
  })
```

`describe('checkBootmokYouth', ...)` 안에:

```typescript
  it('결과에 출처 URL과 확인일자가 포함된다', () => {
    const result = checkBootmokYouth(youthBase)
    expect(result.sourceUrl).toBe('https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020301.jsp')
    expect(result.verifiedAt).toBe('2026-07-10')
  })
```

`describe('checkBootmokNewlywed', ...)` 안에:

```typescript
  it('결과에 출처 URL과 확인일자가 포함된다', () => {
    const result = checkBootmokNewlywed(newlywedBase)
    expect(result.sourceUrl).toBe('https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020401.jsp')
    expect(result.verifiedAt).toBe('2026-07-10')
  })
```

`describe('checkBootmokNewborn', ...)` 안에:

```typescript
  it('결과에 출처 URL과 확인일자가 포함된다', () => {
    const result = checkBootmokNewborn(newbornBase)
    expect(result.sourceUrl).toBe('https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021401.jsp')
    expect(result.verifiedAt).toBe('2026-07-10')
  })
```

`describe('checkJeonseDamage', ...)` 안에:

```typescript
  it('결과에 출처 URL과 확인일자가 포함된다', () => {
    const result = checkJeonseDamage(damageBase)
    expect(result.sourceUrl).toBe('https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021201.jsp')
    expect(result.verifiedAt).toBe('2026-07-10')
  })
```

`describe('checkRenewalExtension', ...)` 안에:

```typescript
  it('결과에 출처 URL과 확인일자가 포함된다', () => {
    const result = checkRenewalExtension(renewalBase)
    expect(result.sourceUrl).toBe('https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021002.jsp')
    expect(result.verifiedAt).toBe('2026-07-10')
  })
```

`describe('checkVulnerableHousing', ...)` 안에:

```typescript
  it('결과에 출처 URL과 확인일자가 포함된다', () => {
    const result = checkVulnerableHousing(vulnerableBase)
    expect(result.sourceUrl).toBe('https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021101.jsp')
    expect(result.verifiedAt).toBe('2026-07-10')
  })
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: 위 7개 신규 테스트가 FAIL(`sourceUrl`/`verifiedAt`이 `undefined`), 기존 69개는 PASS.

- [ ] **Step 3: `EligibilityResult` 타입 확장**

`lib/eligibility.ts`의 `EligibilityResult` 타입에 두 필드를 추가한다:

```typescript
export type EligibilityResult = {
  productId: string
  productName: string
  eligible: boolean
  reasons: string[]
  applicable: boolean
  loanLimitText: string
  rateRangeText: string
  sourceUrl: string
  verifiedAt: string
}
```

- [ ] **Step 4: 7개 함수의 return문 수정**

`checkBootmokGeneral`/`checkBootmokYouth`/`checkBootmokNewlywed`/`checkBootmokNewborn`의
`applicable: true` return문에 아래 두 줄을 추가한다:

```typescript
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
```

`checkJeonseDamage`/`checkRenewalExtension`/`checkVulnerableHousing`은 이슈 #4 Task 2와 동일한
패턴을 따른다: 자기신고 미체크 시 조기 return(`applicable: false`)에는 빈 문자열 두 줄을,
정상 판정 return(`applicable: true`)에는 `rule.sourceUrl`/`rule.verifiedAt`을 추가한다. 예를 들어
`checkJeonseDamage`의 조기 return은:

```typescript
    return {
      productId: rule.id,
      productName: rule.name,
      eligible: false,
      reasons: [],
      applicable: false,
      loanLimitText: '',
      rateRangeText: '',
      sourceUrl: '',
      verifiedAt: '',
    }
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: 전체 PASS (69개 + 신규 7개 = 76개).

- [ ] **Step 6: `ResultCard.tsx`에 출처/확인일자 표시**

`applicable: true` 분기의 대출한도·금리 박스 바로 다음, 카드가 끝나는 `</div>` 직전에 아래를
추가한다:

```tsx
      <p className="mt-3 text-[10px] text-[#8D9399]">
        출처: <a href={result.sourceUrl} className="underline" target="_blank" rel="noopener noreferrer">주택도시기금포털</a> (확인일: {result.verifiedAt})
      </p>
```

완성된 `applicable: true` 분기 전체는 다음과 같아야 한다:

```tsx
  return (
    <div className="bg-white rounded-xl border border-[#ECEFF2] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-[#161B30]">{result.productName}</h3>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            result.eligible ? 'bg-[#E9F8F8] text-[#25B9B9]' : 'bg-[#FDE8EA] text-[#EF4452]'
          }`}
        >
          {result.eligible ? '자격 충족' : '자격 미충족'}
        </span>
      </div>
      {!result.eligible && (
        <ul className="text-sm text-[#555B61] list-disc list-inside space-y-1">
          {result.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      <div className="mt-3 rounded-lg bg-[#E9F6FA] px-3 py-2">
        <p className="text-xs font-semibold text-[#0098D4]">대출한도</p>
        <p className="text-sm font-extrabold text-[#0098D4]">{result.loanLimitText}</p>
        <p className="mt-1.5 text-xs font-semibold text-[#0098D4]">금리</p>
        <p className="text-sm font-extrabold text-[#0098D4]">{result.rateRangeText}</p>
      </div>
      <p className="mt-3 text-[10px] text-[#8D9399]">
        출처: <a href={result.sourceUrl} className="underline" target="_blank" rel="noopener noreferrer">주택도시기금포털</a> (확인일: {result.verifiedAt})
      </p>
    </div>
  )
```

- [ ] **Step 7: 빌드 + 테스트 재확인**

Run: `npm run build && npm test`
Expected: 둘 다 성공, 테스트 76/76 PASS.

- [ ] **Step 8: 브라우저로 라이브 검증**

11단계 문답을 완료(특이사항 단계에서 니치 하나 체크)해 결과 화면에서 판정 대상(applicable) 카드
전부(코어4 + 체크한 니치1) 하단에 "출처: 주택도시기금포털 (확인일: YYYY-MM-DD)" 링크가 상품별로
다른 실제 URL/날짜로 표시되는지 확인한다. "비대상" 카드에는 이 줄이 없어야 한다(early-return
분기를 건드리지 않았으므로 당연히 그렇다).

- [ ] **Step 9: 커밋**

```bash
git add lib/eligibility.ts lib/eligibility.test.ts components/ResultCard.tsx
git commit -m "feat: 결과 카드에 출처 URL + 확인일자 표시"
```

---

## 완료 후 체크 (issues.md #5 승인기준 재확인)

- [ ] 전체 화면에서 컬러·폰트·라운딩 값이 design-system.md 토큰과 일치함(임의 값 없음)
- [ ] 선택 pill의 active:scale 인터랙션이 레퍼런스대로 동작함
- [ ] 정확성 면책 문구가 결과 화면에 노출됨
- [ ] 개인정보 비저장 고지가 첫 화면 또는 결과 화면에 노출됨
- [ ] 각 상품 카드 하단에 출처 URL + 확인일자가 표시됨
- [ ] 그라데이션·과도한 그림자 등 CLAUDE.md 금지 스타일이 없음

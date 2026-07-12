# 이슈 #4: 대출한도·금리 range 표시 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 7개 상품 각각의 결과 카드에 대출한도(최대 금액)와 금리 range(최저~최고)를 표시한다.

**Architecture:** 기존 상품 규칙 JSON(`data/products/*.json`)에 `loanLimitText`/`rateRangeText` 문자열
필드를 추가하고, `lib/eligibility.ts`의 각 `check*` 함수가 이 필드를 `EligibilityResult`에 그대로
실어 반환하도록 확장한다. UI는 `ResultCard.tsx`에서 `result.applicable`일 때만 이 텍스트를 accent-blue
tint 박스로 렌더링한다. 수치는 `docs/eligibility-criteria.md`("대출한도·금리 range" 표, 2026-07-10
공식 소스 리서치 완료분)에서 그대로 가져오며 새로 계산하거나 추정하지 않는다.

**Tech Stack:** Next.js 16 (App Router) + TypeScript + Tailwind v4, Vitest(`environment: node`, 컴포넌트
테스트 미설정 — 기존 프로젝트 패턴대로 `lib/eligibility.ts` 순수 함수만 유닛 테스트, UI는 브라우저 라이브 검증).

## Global Constraints

- 대출한도·금리 수치는 `docs/eligibility-criteria.md`의 "대출한도·금리 range" 표 값을 **문자 그대로**
  사용한다. 임의로 반올림하거나 새 수치를 계산하지 않는다.
- 공식 미확인 상품(갱신만료 임차인 지원 버팀목의 금리, 주거취약계층 민간임대 금리)은 **"공식 미확인"**
  문구를 그대로 표시하고 추정값을 넣지 않는다(SPEC.md 8장, issues.md #4 승인기준).
- 소득구간별 세부 금리표는 다루지 않는다 — "range"(최저~최고) 형태로만 단순화한다(SPEC.md 5장).
- 색상/타이포그래피는 `docs/design-system.md`에 고정된 토큰만 사용한다(`--color-accent-blue`
  `#0098D4` / tint `#E9F6FA`, 숫자는 `font-extrabold`). 새 색상·라운딩 값을 임의로 추가하지 않는다.
- `EligibilityResult` 타입과 7개 `check*` 함수의 필드명은 아래 각 Task의 "Interfaces" 절에 정의된
  그대로 사용한다(다른 이름으로 바꾸지 않는다).

---

### Task 1: 코어 4개 상품 — 대출한도·금리 필드 추가

**Files:**
- Modify: `data/products/bootmok-general.json`
- Modify: `data/products/bootmok-youth.json`
- Modify: `data/products/bootmok-newlywed.json`
- Modify: `data/products/bootmok-newborn.json`
- Modify: `lib/eligibility.ts:9-37` (`Applicant`/`EligibilityResult` 타입 아래쪽, `checkBootmokGeneral`/
  `checkBootmokYouth`/`checkBootmokNewlywed`/`checkBootmokNewborn` 각 함수의 return문)
- Test: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: 기존 `Applicant`, `bootmokGeneral`/`bootmokYouth`/`bootmokNewlywed`/`bootmokNewborn` JSON import
- Produces: `EligibilityResult`에 `loanLimitText: string`, `rateRangeText: string` 필드 추가(이후
  Task 2, Task 3이 이 두 필드명을 그대로 사용함)

- [ ] **Step 1: 실패하는 테스트 작성**

`lib/eligibility.test.ts`의 `describe('checkBootmokGeneral', ...)` 블록 안, 기존 테스트들 다음에
아래 테스트를 추가한다(파일 최상단 `import`는 이미 있으므로 그대로 둔다):

```typescript
  it('결과에 대출한도·금리 range 텍스트가 포함된다', () => {
    const result = checkBootmokGeneral(baseApplicant)
    expect(result.loanLimitText).toBe(
      '일반 수도권 1.2억/비수도권 8천만 · 신혼·2자녀↑ 수도권 2.5억/비수도권 1.6억'
    )
    expect(result.rateRangeText).toBe('연 2.5%~3.5% (우대 중복불가, 최대 -1.0%p)')
  })
```

같은 방식으로 `describe('checkBootmokYouth', ...)` 안에:

```typescript
  it('결과에 대출한도·금리 range 텍스트가 포함된다', () => {
    const result = checkBootmokYouth(baseApplicant)
    expect(result.loanLimitText).toBe(
      '일반 1.5억 · 만25세미만 단독세대주 1.2억 (25.6.27 이전 계약은 2억/1.5억)'
    )
    expect(result.rateRangeText).toBe(
      '연 2.2%~3.3% (소득구간별, 지방 -0.2%p, 기초우대 최대 -1.0%p)'
    )
  })
```

`describe('checkBootmokNewlywed', ...)` 안에:

```typescript
  it('결과에 대출한도·금리 range 텍스트가 포함된다', () => {
    const result = checkBootmokNewlywed(baseApplicant)
    expect(result.loanLimitText).toBe(
      '수도권 2.5억 · 비수도권 1.6억 (25.6.27 이전 계약은 3억/2억)'
    )
    expect(result.rateRangeText).toBe(
      '연 1.9%~3.3% (소득×보증금 매트릭스, 지방 -0.2%p, 다자녀 최대 -0.7%p)'
    )
  })
```

`describe('checkBootmokNewborn', ...)` 안에:

```typescript
  it('결과에 대출한도·금리 range 텍스트가 포함된다', () => {
    const result = checkBootmokNewborn(baseApplicant)
    expect(result.loanLimitText).toBe('최대 2.4억 (25.6.27 이전 계약 3억)')
    expect(result.rateRangeText).toBe(
      '연 1.3%~4.3% (소득 구간별 특례금리, 우대 최대 -0.5%p)'
    )
  })
```

> 위 4개 테스트가 참조하는 `baseApplicant`는 파일 상단에 이미 정의된 공용 fixture다(각 `describe`
> 블록 기존 테스트들이 쓰는 것과 동일한 변수명 — 실제 파일을 열어 정확한 변수명을 확인하고 맞춰
> 사용할 것. 다르면 해당 `describe` 블록의 기존 테스트에서 쓰는 fixture 변수명을 그대로 쓴다).

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: 위 4개 신규 테스트가 `result.loanLimitText`가 `undefined`라서 FAIL. 기존 테스트(62개)는
계속 PASS.

- [ ] **Step 3: 4개 상품 JSON에 필드 추가**

`data/products/bootmok-general.json` 전체를 아래로 교체:

```json
{
  "id": "bootmok-general",
  "name": "버팀목전세자금(일반)",
  "incomeLimitKrw": 50000000,
  "newlywedIncomeLimitKrw": 75000000,
  "netAssetLimitKrw": 345000000,
  "depositLimitKrw": {
    "capital": 300000000,
    "nonCapital": 200000000
  },
  "areaLimitSqm": 85,
  "loanLimitText": "일반 수도권 1.2억/비수도권 8천만 · 신혼·2자녀↑ 수도권 2.5억/비수도권 1.6억",
  "rateRangeText": "연 2.5%~3.5% (우대 중복불가, 최대 -1.0%p)",
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020101.jsp",
  "verifiedAt": "2026-07-09"
}
```

`data/products/bootmok-youth.json` 전체를 아래로 교체:

```json
{
  "id": "bootmok-youth",
  "name": "청년전용 버팀목전세자금",
  "ageMin": 19,
  "ageMax": 34,
  "incomeLimitKrw": 50000000,
  "elevatedIncomeLimitKrw": 60000000,
  "newlywedIncomeLimitKrw": 75000000,
  "netAssetLimitKrw": 345000000,
  "depositLimitKrw": 300000000,
  "areaLimitSqm": 85,
  "areaLimitSqmUnder25Solo": 60,
  "loanLimitText": "일반 1.5억 · 만25세미만 단독세대주 1.2억 (25.6.27 이전 계약은 2억/1.5억)",
  "rateRangeText": "연 2.2%~3.3% (소득구간별, 지방 -0.2%p, 기초우대 최대 -1.0%p)",
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020301.jsp",
  "verifiedAt": "2026-07-10"
}
```

`data/products/bootmok-newlywed.json` 전체를 아래로 교체:

```json
{
  "id": "bootmok-newlywed",
  "name": "신혼부부전용 전세자금",
  "incomeLimitKrw": 75000000,
  "netAssetLimitKrw": 345000000,
  "depositLimitKrw": {
    "capital": 400000000,
    "nonCapital": 300000000
  },
  "areaLimitSqm": 85,
  "loanLimitText": "수도권 2.5억 · 비수도권 1.6억 (25.6.27 이전 계약은 3억/2억)",
  "rateRangeText": "연 1.9%~3.3% (소득×보증금 매트릭스, 지방 -0.2%p, 다자녀 최대 -0.7%p)",
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020401.jsp",
  "verifiedAt": "2026-07-10"
}
```

`data/products/bootmok-newborn.json` 전체를 아래로 교체:

```json
{
  "id": "bootmok-newborn",
  "name": "신생아 특례 버팀목대출",
  "incomeLimitKrw": 130000000,
  "dualIncomeLimitKrw": 200000000,
  "netAssetLimitKrw": 345000000,
  "depositLimitKrw": {
    "capital": 500000000,
    "nonCapital": 400000000
  },
  "areaLimitSqm": 85,
  "loanLimitText": "최대 2.4억 (25.6.27 이전 계약 3억)",
  "rateRangeText": "연 1.3%~4.3% (소득 구간별 특례금리, 우대 최대 -0.5%p)",
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021401.jsp",
  "verifiedAt": "2026-07-10"
}
```

- [ ] **Step 4: `EligibilityResult` 타입 확장**

`lib/eligibility.ts`의 `EligibilityResult` 타입 정의를 찾아(현재 `productId`/`productName`/
`eligible`/`reasons`/`applicable` 필드로 구성됨) 아래처럼 두 필드를 추가한다:

```typescript
export type EligibilityResult = {
  productId: string
  productName: string
  eligible: boolean
  reasons: string[]
  applicable: boolean
  loanLimitText: string
  rateRangeText: string
}
```

- [ ] **Step 5: `checkBootmokGeneral`/`checkBootmokYouth`/`checkBootmokNewlywed`/`checkBootmokNewborn`
  return문 수정**

4개 함수 각각의 `return { productId: rule.id, productName: rule.name, eligible: ..., reasons, applicable: true }`
객체에 아래 두 줄을 추가한다(4곳 전부 동일 패턴):

```typescript
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
```

- [ ] **Step 6: 테스트 통과 확인**

Run: `npm test`
Expected: 전체 PASS (기존 62개 + 신규 4개 = 66개).

- [ ] **Step 7: 커밋**

```bash
git add data/products/bootmok-general.json data/products/bootmok-youth.json data/products/bootmok-newlywed.json data/products/bootmok-newborn.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 코어 4개 상품에 대출한도·금리 range 필드 추가"
```

---

### Task 2: 니치 3개 상품 — 대출한도·금리 필드 추가 (공식 미확인 포함)

**Files:**
- Modify: `data/products/bootmok-jeonse-damage.json`
- Modify: `data/products/bootmok-renewal-extension.json`
- Modify: `data/products/bootmok-vulnerable-housing.json`
- Modify: `lib/eligibility.ts`의 `checkJeonseDamage`/`checkRenewalExtension`/`checkVulnerableHousing`
  return문 (Task 1에서 확장한 `EligibilityResult` 타입을 그대로 사용)
- Test: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: Task 1에서 정의한 `EligibilityResult.loanLimitText` / `.rateRangeText`
- Produces: 니치 3종도 동일 필드를 채운 `EligibilityResult`를 반환(비대상 시 조기 return하는 분기는
  `applicable: false`이므로 이 두 필드는 빈 문자열 `''`로 채워 타입만 만족시킨다 — UI는 `applicable`
  기준으로 렌더링 여부를 이미 분기하므로 빈 문자열이 노출될 일은 없다)

- [ ] **Step 1: 실패하는 테스트 작성**

`describe('checkJeonseDamage', ...)` 안에(자기신고 `true`로 설정해 판정 로직을 타는 기존 테스트들과
같은 방식으로):

```typescript
  it('결과에 대출한도·금리 range 텍스트가 포함된다', () => {
    const result = checkJeonseDamage({ ...baseApplicant, selfReportedJeonseDamage: true })
    expect(result.loanLimitText).toBe('2.4억 (호당한도·전세금80%·담보한도 중 최소값)')
    expect(result.rateRangeText).toBe(
      '연 1.2%~2.7% (소득×보증금 매트릭스, 다자녀 최대 -0.7%p)'
    )
  })
```

`describe('checkRenewalExtension', ...)` 안에:

```typescript
  it('결과에 대출한도·금리 range 텍스트가 포함된다(금리는 공식 미확인)', () => {
    const result = checkRenewalExtension({ ...baseApplicant, selfReportedRenewalExtension: true })
    expect(result.loanLimitText).toBe('수도권 4.5억 / 비수도권 2.5억')
    expect(result.rateRangeText).toBe(
      '공식 미확인 — 원문에 구체 수치 없음, "신청자격에 따른 금리 적용"만 명시'
    )
  })
```

`describe('checkVulnerableHousing', ...)` 안에:

```typescript
  it('결과에 대출한도·금리 range 텍스트가 포함된다(민간임대 금리는 공식 미확인)', () => {
    const result = checkVulnerableHousing({ ...baseApplicant, selfReportedVulnerableHousing: true })
    expect(result.loanLimitText).toBe('공공임대 50만원 / 민간임대 1억 이내')
    expect(result.rateRangeText).toBe(
      '공공임대: 연 0%(5천만 한도)~1.2~1.8%(초과분). 민간임대: 공식 미확인'
    )
  })
```

> `baseApplicant`는 Task 1과 동일한 fixture 변수명을 그대로 사용한다(실제 파일에서 확인).

- [ ] **Step 2: 테스트 실패 확인**

Run: `npm test`
Expected: 신규 3개 테스트 FAIL(`loanLimitText`가 `undefined`), 나머지는 PASS.

- [ ] **Step 3: 니치 3개 상품 JSON에 필드 추가**

`data/products/bootmok-jeonse-damage.json` 전체를 아래로 교체:

```json
{
  "id": "bootmok-jeonse-damage",
  "name": "전세피해 임차인 버팀목전세자금",
  "incomeLimitKrw": 130000000,
  "netAssetLimitKrw": 511000000,
  "depositLimitKrw": 300000000,
  "areaLimitSqm": 85,
  "loanLimitText": "2.4억 (호당한도·전세금80%·담보한도 중 최소값)",
  "rateRangeText": "연 1.2%~2.7% (소득×보증금 매트릭스, 다자녀 최대 -0.7%p)",
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021201.jsp",
  "verifiedAt": "2026-07-10"
}
```

`data/products/bootmok-renewal-extension.json` 전체를 아래로 교체:

```json
{
  "id": "bootmok-renewal-extension",
  "name": "갱신만료 임차인 지원 버팀목전세자금",
  "depositLimitKrw": {
    "capital": 450000000,
    "nonCapital": 250000000
  },
  "loanLimitText": "수도권 4.5억 / 비수도권 2.5억",
  "rateRangeText": "공식 미확인 — 원문에 구체 수치 없음, \"신청자격에 따른 금리 적용\"만 명시",
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021002.jsp",
  "verifiedAt": "2026-07-10"
}
```

`data/products/bootmok-vulnerable-housing.json` 전체를 아래로 교체:

```json
{
  "id": "bootmok-vulnerable-housing",
  "name": "주거취약계층 이주지원 버팀목전세자금",
  "depositLimitKrw": {
    "publicHousing": 500000,
    "privateHousing": 100000000
  },
  "loanLimitText": "공공임대 50만원 / 민간임대 1억 이내",
  "rateRangeText": "공공임대: 연 0%(5천만 한도)~1.2~1.8%(초과분). 민간임대: 공식 미확인",
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021101.jsp",
  "verifiedAt": "2026-07-10"
}
```

- [ ] **Step 4: `checkJeonseDamage`/`checkRenewalExtension`/`checkVulnerableHousing` 수정**

각 함수에는 두 곳의 return문이 있다: (a) 자기신고 안 했을 때 조기 return(`applicable: false`),
(b) 판정 로직을 다 돈 뒤의 return(`applicable: true`). (a)에는 빈 문자열을, (b)에는 `rule`의 실제
값을 채운다. 예를 들어 `checkJeonseDamage`는 다음과 같이 바뀐다:

```typescript
export function checkJeonseDamage(applicant: Applicant): EligibilityResult {
  const rule = bootmokJeonseDamage

  if (!applicant.selfReportedJeonseDamage) {
    return {
      productId: rule.id,
      productName: rule.name,
      eligible: false,
      reasons: [],
      applicable: false,
      loanLimitText: '',
      rateRangeText: '',
    }
  }

  const reasons: string[] = []
  // ...(기존 판정 로직 그대로)...

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
  }
}
```

`checkRenewalExtension`, `checkVulnerableHousing`도 동일한 패턴(조기 return엔 빈 문자열 두 줄,
마지막 return엔 `rule.loanLimitText`/`rule.rateRangeText` 두 줄)으로 수정한다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: 전체 PASS (66개 + 신규 3개 = 69개).

- [ ] **Step 6: 커밋**

```bash
git add data/products/bootmok-jeonse-damage.json data/products/bootmok-renewal-extension.json data/products/bootmok-vulnerable-housing.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 니치 3개 상품에 대출한도·금리 range 필드 추가(공식 미확인 포함)"
```

---

### Task 3: 결과 카드 UI — 대출한도·금리 range 표시

> 이 Task를 시작하기 전에 전역 스킬 `@frontend-design`을 호출해 `docs/design-system.md`의
> accent-blue 토큰 사용 규칙을 재확인할 것(CLAUDE.md 4단계 필수 규칙). 이 프로젝트는 색상·라운딩·
> 인터랙션 값이 이미 design-system.md에 고정돼 있으므로 새 값을 만들지 말고 아래 코드의 값만 그대로
> 사용한다.

**Files:**
- Modify: `components/ResultCard.tsx`

**Interfaces:**
- Consumes: Task 1·2에서 채운 `EligibilityResult.loanLimitText` / `.rateRangeText` (문자열, `applicable`
  이 `true`일 때만 의미 있는 값)
- Produces: (최종 UI, 이후 태스크 없음)

이 Task는 순수 UI 변경이며 컴포넌트 테스트가 이 리포지토리에 설정돼 있지 않다(`vitest.config.ts`의
`environment: 'node'`, `@testing-library` 미설치 — 이슈 #1~#3과 동일하게 브라우저 라이브 검증으로
대체한다). 따라서 아래는 코드 작성 → 브라우저 확인 순서로 진행한다.

- [ ] **Step 1: `ResultCard.tsx`에 대출한도·금리 range 블록 추가**

`components/ResultCard.tsx`의 `!result.eligible` 블록(사유 리스트) 바로 다음, 카드가 끝나는 `</div>`
직전에 아래 블록을 추가한다(`result.applicable`이 이미 `true`인 분기 안에만 추가하면 되므로, 기존
"비대상"용 early return 블록은 건드리지 않는다):

```tsx
      <div className="mt-3 rounded-lg bg-[#E9F6FA] px-3 py-2">
        <p className="text-xs font-semibold text-[#0098D4]">대출한도</p>
        <p className="text-sm font-extrabold text-[#0098D4]">{result.loanLimitText}</p>
        <p className="mt-1.5 text-xs font-semibold text-[#0098D4]">금리</p>
        <p className="text-sm font-extrabold text-[#0098D4]">{result.rateRangeText}</p>
      </div>
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
    </div>
  )
```

- [ ] **Step 2: 타입체크 + 빌드 확인**

Run: `npm run build`
Expected: 성공(타입 에러 없음).

- [ ] **Step 3: 브라우저로 라이브 검증**

`npm run dev`로 로컬 서버를 띄우고(또는 `.claude/launch.json`의 `loan-eligibility-service` 설정으로
프리뷰), 11단계 문답을 끝까지 완료해 결과 화면에서 코어 4개 상품 카드 각각에 "대출한도"/"금리" 박스가
`#E9F6FA` 배경 + `#0098D4` 텍스트로 렌더링되는지 확인한다. 이어서 "특이사항" 단계에서 전세피해 체크박스만
선택해 재실행하고, 전세피해 카드에도 동일한 박스가 렌더링되며 갱신만료 카드에는 "공식 미확인" 문구가
그대로(추정치 없이) 표시되는지 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add components/ResultCard.tsx
git commit -m "feat: 결과 카드에 대출한도·금리 range 표시"
```

---

## 완료 후 체크 (issues.md #4 승인기준 재확인)

- [ ] 리서치 산출물의 대출한도·금리 range 데이터가 상품별 JSON에 반영됨(출처·확인일 포함) — 기존
  `sourceUrl`/`verifiedAt` 필드 유지 확인
- [ ] 결과 카드에 한도/금리 range가 명확한 수치로 표시됨(범위 형태, 세부 금리표 없음)
- [ ] 데이터 미확보 상품("공식 미확인")은 추정값 없이 그대로 표시됨

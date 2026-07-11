# 전체 문답 플로우 확장 (issues.md #2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** SPEC.md 3장의 11단계 전체 문답(집 결정여부·지역·면적·보증금·주택소유·결혼가구·소득·순자산·보유대출·특이사항·나이)을 구현하고, 코어 4개 상품(버팀목 일반·청년전용·신혼부부전용·신생아특례) 전체를 판정 대상으로 확장한다.

**Architecture:** issues.md #1에서 만든 파이프라인(순수 판정함수 ← JSON 규칙데이터 ← 문답 컴포넌트 ← 페이지 조립)을 그대로 확장한다. `lib/eligibility.ts`의 `Applicant` 타입에 11단계 문답이 수집하는 필드를 전부 추가하고, 상품별 순수 판정함수 3개(`checkBootmokYouth`/`checkBootmokNewlywed`/`checkBootmokNewborn`)를 추가한 뒤 `checkAllCoreProducts`로 묶는다. `components/Questionnaire.tsx`를 5단계→11단계로 확장하고, `app/page.tsx`가 4개 상품 결과를 모두 렌더링하도록 바꾼다.

**Tech Stack:** Next.js(App Router) + TypeScript + Tailwind CSS v4, Vitest(순수 함수 유닛테스트만).

## Global Constraints

- 서버로 개인정보 전송·저장 금지 — 전체 계산은 클라이언트 컴포넌트(`"use client"`) 내에서만 수행 (SPEC.md 4장)
- 자격 수치는 JSON 규칙 데이터 파일로 분리, 각 필드에 `sourceUrl`·`verifiedAt` 포함 (SPEC.md 4장)
- 사용 수치는 `docs/eligibility-criteria.md`의 값을 그대로 사용(출처: nhuf.molit.go.kr, 확인일 2026-07-10):
  - 청년전용 버팀목: 나이 만19~34세, 소득한도 기본 5천만원/혁신도시·재개발·다자녀2+ 6천만원/신혼 7.5천만원, 순자산 3.45억, 보증금 3억(지역 구분 없음), 전용면적 85㎡(만25세 미만은 60㎡)
  - 신혼부부전용: 소득한도 7.5천만원, 순자산 3.45억, 보증금 수도권 4억/비수도권 3억, 전용면적 85㎡
  - 신생아특례: 소득한도 일반 1.3억/맞벌이 2억, 순자산 3.45억, 보증금 수도권 5억/비수도권 4억, 전용면적 85㎡
  - 버팀목(일반)에 신혼 특례 소득한도 7.5천만원 추가(기존 5천만원은 유지)
- 모든 상품 공통: 무주택 요건(세대주 포함 세대원 전원 무주택) — `housingOwnership`이 `'one-house'` 또는 `'multi-house'`면 4개 상품 전부 미충족 처리. `'public-rental'`(공공임대 거주)은 무주택으로 간주해 통과.
- 금액 단위는 원(KRW) 정수. 사유 문구 포맷은 기존 `formatManwon`/`formatEok` 헬퍼(`lib/eligibility.ts`)를 그대로 재사용 — 새 함수를 만들지 않는다.
- **알려진 스코프 단순화(문서화된 결정, 결함 아님):**
  - "이사할 집 결정 여부"(1번 문항)는 답변만 수집하고 판정 로직에는 사용하지 않는다(매물 검색 기능은 스코프 밖).
  - "보유 대출"(9번 문항)과 "특이사항"의 연체이력은 답변만 수집하고 판정 로직에는 사용하지 않는다 — `docs/eligibility-criteria.md`의 공통 판정축(무주택/세대주/소득/자산/나이/지역/보증금/면적/특례대상)에 대출보유·연체이력은 포함되어 있지 않고, 은행 심사 영역이기 때문이다.
  - 청년전용의 "만25세 미만 단독세대주 60㎡" 예외는 "단독세대주" 문항이 없어 나이만으로 판정한다(`age < 25`). 향후 세대구성 문항이 추가되면 정교화.
  - 니치 3종(전세피해·갱신만료·주거취약계층) 자기신고는 이 플랜의 범위가 아니다 — issues.md #3(Blocked by #2)에서 다룬다. "특이사항" 단계에는 중기재직·혁신도시/재개발·연체이력만 넣는다.
- **빌드 순서 예외**: Task 1~5는 `lib/eligibility.ts`와 그 테스트만 다루며, 이 시점에는 `components/Questionnaire.tsx`·`app/page.tsx`가 아직 구(舊) 5필드 `Applicant`를 생성하므로 **`npm run build`가 실패하는 것이 정상**이다. Task 1~5는 `npm test`(vitest)만으로 검증한다. `npm run build` 그린 상태는 Task 6(문답 위저드 확장) 완료 후부터 다시 요구된다.

---

### Task 1: Applicant 타입 확장 + 공통 무주택 게이트 + 버팀목(일반) 신혼 소득기준 (TDD)

**Files:**
- Modify: `data/products/bootmok-general.json`
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: 기존 `Applicant`(5필드), `checkBootmokGeneral`, `formatEok`, `formatManwon` (issues.md #1 산출물)
- Produces:
  - 확장된 `type Applicant = { houseDecided: boolean; region: 'capital' | 'non-capital'; areaSqm: number; depositKrw: number; housingOwnership: 'none' | 'public-rental' | 'one-house' | 'multi-house'; isNewlywed: boolean; hasChildrenTwoOrMore: boolean; hasNewbornWithin2Years: boolean; isDualIncome: boolean; annualIncomeKrw: number; netAssetKrw: number; hasExistingLoan: boolean; isSmeEmployeeOrFounder: boolean; isInnovationCityOrRedevelopment: boolean; hasDelinquencyHistory: boolean; age: number }`
  - `function checkHousingOwnership(applicant: Applicant): string | null` — Task 2~4가 그대로 재사용
  - 갱신된 `checkBootmokGeneral(applicant: Applicant): EligibilityResult` — 무주택 게이트 + 신혼 소득한도 반영

- [ ] **Step 1: `bootmok-general.json`에 신혼 소득한도 필드 추가**

`data/products/bootmok-general.json`을 다음 내용으로 교체:
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
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020101.jsp",
  "verifiedAt": "2026-07-09"
}
```

- [ ] **Step 2: 실패하는 테스트 작성 — 확장된 fixture + 신규 케이스**

`lib/eligibility.test.ts` 전체를 다음 내용으로 교체(기존 7개 테스트는 확장된 fixture로 그대로 유지, 4개 신규 테스트 추가로 총 11개):

```typescript
import { describe, it, expect } from 'vitest'
import { checkBootmokGeneral, type Applicant } from './eligibility'

const baseApplicant: Applicant = {
  houseDecided: true,
  region: 'capital',
  areaSqm: 60,
  depositKrw: 250000000,
  housingOwnership: 'none',
  isNewlywed: false,
  hasChildrenTwoOrMore: false,
  hasNewbornWithin2Years: false,
  isDualIncome: false,
  annualIncomeKrw: 40000000,
  netAssetKrw: 100000000,
  hasExistingLoan: false,
  isSmeEmployeeOrFounder: false,
  isInnovationCityOrRedevelopment: false,
  hasDelinquencyHistory: false,
  age: 40,
}

describe('checkBootmokGeneral', () => {
  it('모든 조건을 충족하면 eligible: true를 반환한다', () => {
    const result = checkBootmokGeneral(baseApplicant)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('연소득이 5천만원을 초과하면 소득 초과 사유와 함께 eligible: false를 반환한다', () => {
    const result = checkBootmokGeneral({ ...baseApplicant, annualIncomeKrw: 52000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('소득 5,200만원으로 한도 5,000만원 초과')
  })

  it('순자산이 3.45억원을 초과하면 순자산 초과 사유와 함께 eligible: false를 반환한다', () => {
    const result = checkBootmokGeneral({ ...baseApplicant, netAssetKrw: 350000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('순자산 3.5억원으로 한도 3.45억원 초과')
  })

  it('전용면적이 85㎡를 초과하면 면적 초과 사유와 함께 eligible: false를 반환한다', () => {
    const overArea = checkBootmokGeneral({ ...baseApplicant, areaSqm: 90 })
    expect(overArea.eligible).toBe(false)
    expect(overArea.reasons).toContain('전용면적 90㎡로 한도 85㎡ 초과')
  })

  it('수도권 보증금이 3억원을 초과하면 보증금 초과 사유와 함께 eligible: false를 반환한다', () => {
    const result = checkBootmokGeneral({ ...baseApplicant, region: 'capital', depositKrw: 320000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 3.2억원으로 수도권 한도 3억원 초과')
  })

  it('비수도권 보증금이 2억원을 초과하면 보증금 초과 사유와 함께 eligible: false를 반환한다', () => {
    const result = checkBootmokGeneral({
      ...baseApplicant,
      region: 'non-capital',
      depositKrw: 220000000,
    })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 2.2억원으로 비수도권 한도 2억원 초과')
  })

  it('여러 조건을 동시에 초과하면 모든 사유가 배열에 담긴다', () => {
    const result = checkBootmokGeneral({
      ...baseApplicant,
      region: 'capital',
      areaSqm: 90,
      depositKrw: 320000000,
      annualIncomeKrw: 52000000,
      netAssetKrw: 350000000,
    })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toHaveLength(4)
  })

  it('1주택 이상 소유 중이면 무주택 요건 미충족 사유가 담긴다', () => {
    const result = checkBootmokGeneral({ ...baseApplicant, housingOwnership: 'one-house' })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('무주택 요건 미충족(현재 주택을 소유하고 있어요)')
  })

  it('2주택 이상 소유 중이어도 무주택 요건 미충족 사유가 담긴다', () => {
    const result = checkBootmokGeneral({ ...baseApplicant, housingOwnership: 'multi-house' })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('무주택 요건 미충족(현재 주택을 소유하고 있어요)')
  })

  it('공공임대 거주 중이면 무주택으로 간주되어 다른 조건 충족 시 eligible: true', () => {
    const result = checkBootmokGeneral({ ...baseApplicant, housingOwnership: 'public-rental' })
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('신혼부부면 소득한도가 7.5천만원으로 상향되어 6천만원 소득도 충족한다', () => {
    const result = checkBootmokGeneral({ ...baseApplicant, isNewlywed: true, annualIncomeKrw: 60000000 })
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })
})
```

- [ ] **Step 2b: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Applicant` 타입 불일치(신규 필드 없음) 및 `Cannot find` 관련 타입 에러, 신규 4개 테스트도 실패

- [ ] **Step 3: `lib/eligibility.ts` 확장 구현**

`lib/eligibility.ts`를 다음 내용으로 교체:

```typescript
import bootmokGeneral from '@/data/products/bootmok-general.json'

export type Applicant = {
  houseDecided: boolean
  region: 'capital' | 'non-capital'
  areaSqm: number
  depositKrw: number
  housingOwnership: 'none' | 'public-rental' | 'one-house' | 'multi-house'
  isNewlywed: boolean
  hasChildrenTwoOrMore: boolean
  hasNewbornWithin2Years: boolean
  isDualIncome: boolean
  annualIncomeKrw: number
  netAssetKrw: number
  hasExistingLoan: boolean
  isSmeEmployeeOrFounder: boolean
  isInnovationCityOrRedevelopment: boolean
  hasDelinquencyHistory: boolean
  age: number
}

export type EligibilityResult = {
  productId: string
  productName: string
  eligible: boolean
  reasons: string[]
}

function formatEok(krw: number): string {
  return `${(krw / 100000000).toFixed(2).replace(/\.?0+$/, '')}억원`
}

function formatManwon(krw: number): string {
  return `${Math.round(krw / 10000).toLocaleString()}만원`
}

export function checkHousingOwnership(applicant: Applicant): string | null {
  if (applicant.housingOwnership === 'one-house' || applicant.housingOwnership === 'multi-house') {
    return '무주택 요건 미충족(현재 주택을 소유하고 있어요)'
  }
  return null
}

export function checkBootmokGeneral(applicant: Applicant): EligibilityResult {
  const reasons: string[] = []
  const rule = bootmokGeneral

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

  const incomeLimit = applicant.isNewlywed ? rule.newlywedIncomeLimitKrw : rule.incomeLimitKrw
  if (applicant.annualIncomeKrw > incomeLimit) {
    reasons.push(
      `소득 ${formatManwon(applicant.annualIncomeKrw)}으로 한도 ${formatManwon(incomeLimit)} 초과`
    )
  }

  if (applicant.netAssetKrw > rule.netAssetLimitKrw) {
    reasons.push(
      `순자산 ${formatEok(applicant.netAssetKrw)}으로 한도 ${formatEok(rule.netAssetLimitKrw)} 초과`
    )
  }

  if (applicant.areaSqm > rule.areaLimitSqm) {
    reasons.push(`전용면적 ${applicant.areaSqm}㎡로 한도 ${rule.areaLimitSqm}㎡ 초과`)
  }

  const depositLimit =
    applicant.region === 'capital' ? rule.depositLimitKrw.capital : rule.depositLimitKrw.nonCapital

  if (applicant.depositKrw > depositLimit) {
    const regionLabel = applicant.region === 'capital' ? '수도권' : '비수도권'
    reasons.push(
      `전세보증금 ${formatEok(applicant.depositKrw)}으로 ${regionLabel} 한도 ${formatEok(depositLimit)} 초과`
    )
  }

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
  }
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm test`
Expected: PASS — 11개 테스트 모두 통과

- [ ] **Step 5: 커밋**

```bash
git add data/products/bootmok-general.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: Applicant 타입 확장 + 무주택 게이트 + 버팀목(일반) 신혼 소득기준"
```

---

### Task 2: 청년전용 버팀목전세자금 자격판정 (TDD)

**Files:**
- Create: `data/products/bootmok-youth.json`
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: `Applicant`, `EligibilityResult`, `checkHousingOwnership`(Task 1)
- Produces: `function checkBootmokYouth(applicant: Applicant): EligibilityResult` — Task 5(집계 함수)가 그대로 호출

- [ ] **Step 1: 규칙 데이터 파일 작성**

`data/products/bootmok-youth.json`:
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
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020301.jsp",
  "verifiedAt": "2026-07-10"
}
```

- [ ] **Step 2: 실패하는 테스트 추가**

`lib/eligibility.test.ts` 끝에 추가(기존 import에 `checkBootmokYouth` 추가):

```typescript
import { checkBootmokGeneral, checkBootmokYouth, type Applicant } from './eligibility'
```
(기존 `import { checkBootmokGeneral, type Applicant } from './eligibility'` 줄을 위 내용으로 교체)

파일 끝에 추가:
```typescript

describe('checkBootmokYouth', () => {
  const youthBase: Applicant = { ...baseApplicant, age: 28 }

  it('모든 조건을 충족하면 eligible: true를 반환한다', () => {
    const result = checkBootmokYouth(youthBase)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('나이가 19세 미만이면 연령 요건 미충족 사유를 반환한다', () => {
    const result = checkBootmokYouth({ ...youthBase, age: 18 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('나이 만 18세로 대상 연령(만 19~34세) 밖')
  })

  it('나이가 35세 이상이면 연령 요건 미충족 사유를 반환한다', () => {
    const result = checkBootmokYouth({ ...youthBase, age: 35 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('나이 만 35세로 대상 연령(만 19~34세) 밖')
  })

  it('혁신도시 이전기관 종사자면 소득한도가 6천만원으로 상향된다', () => {
    const result = checkBootmokYouth({
      ...youthBase,
      isInnovationCityOrRedevelopment: true,
      annualIncomeKrw: 55000000,
    })
    expect(result.eligible).toBe(true)
  })

  it('신혼이면 소득한도가 7.5천만원으로 상향된다', () => {
    const result = checkBootmokYouth({ ...youthBase, isNewlywed: true, annualIncomeKrw: 70000000 })
    expect(result.eligible).toBe(true)
  })

  it('25세 미만이면 전용면적 한도가 60㎡로 적용된다', () => {
    const result = checkBootmokYouth({ ...youthBase, age: 24, areaSqm: 70 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전용면적 70㎡로 한도 60㎡ 초과')
  })

  it('보증금이 3억원을 초과하면 지역과 무관하게 미충족 사유를 반환한다', () => {
    const result = checkBootmokYouth({ ...youthBase, region: 'non-capital', depositKrw: 310000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 3.1억원으로 한도 3억원 초과')
  })

  it('1주택 이상 소유 중이면 다른 조건과 무관하게 무주택 요건 미충족 사유를 반환한다', () => {
    const result = checkBootmokYouth({ ...youthBase, housingOwnership: 'one-house' })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('무주택 요건 미충족(현재 주택을 소유하고 있어요)')
  })
})
```

- [ ] **Step 2b: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find export 'checkBootmokYouth'`

- [ ] **Step 3: 구현 추가**

`lib/eligibility.ts` 상단 import에 추가:
```typescript
import bootmokYouth from '@/data/products/bootmok-youth.json'
```

파일 끝에 추가:
```typescript

export function checkBootmokYouth(applicant: Applicant): EligibilityResult {
  const reasons: string[] = []
  const rule = bootmokYouth

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

  if (applicant.age < rule.ageMin || applicant.age > rule.ageMax) {
    reasons.push(`나이 만 ${applicant.age}세로 대상 연령(만 ${rule.ageMin}~${rule.ageMax}세) 밖`)
  }

  const incomeLimit = applicant.isNewlywed
    ? rule.newlywedIncomeLimitKrw
    : applicant.isInnovationCityOrRedevelopment || applicant.hasChildrenTwoOrMore
      ? rule.elevatedIncomeLimitKrw
      : rule.incomeLimitKrw
  if (applicant.annualIncomeKrw > incomeLimit) {
    reasons.push(
      `소득 ${formatManwon(applicant.annualIncomeKrw)}으로 한도 ${formatManwon(incomeLimit)} 초과`
    )
  }

  if (applicant.netAssetKrw > rule.netAssetLimitKrw) {
    reasons.push(
      `순자산 ${formatEok(applicant.netAssetKrw)}으로 한도 ${formatEok(rule.netAssetLimitKrw)} 초과`
    )
  }

  const areaLimit = applicant.age < 25 ? rule.areaLimitSqmUnder25Solo : rule.areaLimitSqm
  if (applicant.areaSqm > areaLimit) {
    reasons.push(`전용면적 ${applicant.areaSqm}㎡로 한도 ${areaLimit}㎡ 초과`)
  }

  if (applicant.depositKrw > rule.depositLimitKrw) {
    reasons.push(
      `전세보증금 ${formatEok(applicant.depositKrw)}으로 한도 ${formatEok(rule.depositLimitKrw)} 초과`
    )
  }

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
  }
}
```

`formatEok`/`formatManwon`/`checkHousingOwnership`는 Task 1에서 이미 정의되어 있으므로 재정의하지 않는다.

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm test`
Expected: PASS — 19개 테스트 모두 통과(Task 1의 11개 + 신규 8개)

- [ ] **Step 5: 커밋**

```bash
git add data/products/bootmok-youth.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 청년전용 버팀목전세자금 자격판정 함수"
```

---

### Task 3: 신혼부부전용 전세자금 자격판정 (TDD)

**Files:**
- Create: `data/products/bootmok-newlywed.json`
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: `Applicant`, `EligibilityResult`, `checkHousingOwnership`(Task 1)
- Produces: `function checkBootmokNewlywed(applicant: Applicant): EligibilityResult` — Task 5가 그대로 호출

- [ ] **Step 1: 규칙 데이터 파일 작성**

`data/products/bootmok-newlywed.json`:
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
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05020401.jsp",
  "verifiedAt": "2026-07-10"
}
```

- [ ] **Step 2: 실패하는 테스트 추가**

import 줄 교체:
```typescript
import { checkBootmokGeneral, checkBootmokYouth, checkBootmokNewlywed, type Applicant } from './eligibility'
```

파일 끝에 추가:
```typescript

describe('checkBootmokNewlywed', () => {
  const newlywedBase: Applicant = { ...baseApplicant, isNewlywed: true, annualIncomeKrw: 70000000 }

  it('모든 조건을 충족하면 eligible: true를 반환한다', () => {
    const result = checkBootmokNewlywed(newlywedBase)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('신혼부부 요건에 해당하지 않으면 미충족 사유를 반환한다', () => {
    const result = checkBootmokNewlywed({ ...newlywedBase, isNewlywed: false })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('신혼부부(혼인 7년 이내 또는 3개월 내 결혼예정) 요건에 해당하지 않음')
  })

  it('연소득이 7.5천만원을 초과하면 소득 초과 사유를 반환한다', () => {
    const result = checkBootmokNewlywed({ ...newlywedBase, annualIncomeKrw: 80000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('소득 8,000만원으로 한도 7,500만원 초과')
  })

  it('순자산이 3.45억원을 초과하면 순자산 초과 사유를 반환한다', () => {
    const result = checkBootmokNewlywed({ ...newlywedBase, netAssetKrw: 350000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('순자산 3.5억원으로 한도 3.45억원 초과')
  })

  it('수도권 보증금이 4억원을 초과하면 보증금 초과 사유를 반환한다', () => {
    const result = checkBootmokNewlywed({ ...newlywedBase, region: 'capital', depositKrw: 410000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 4.1억원으로 수도권 한도 4억원 초과')
  })

  it('비수도권 보증금이 3억원을 초과하면 보증금 초과 사유를 반환한다', () => {
    const result = checkBootmokNewlywed({
      ...newlywedBase,
      region: 'non-capital',
      depositKrw: 310000000,
    })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 3.1억원으로 비수도권 한도 3억원 초과')
  })

  it('전용면적이 85㎡를 초과하면 면적 초과 사유를 반환한다', () => {
    const result = checkBootmokNewlywed({ ...newlywedBase, areaSqm: 90 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전용면적 90㎡로 한도 85㎡ 초과')
  })
})
```

- [ ] **Step 2b: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find export 'checkBootmokNewlywed'`

- [ ] **Step 3: 구현 추가**

`lib/eligibility.ts` 상단 import에 추가:
```typescript
import bootmokNewlywed from '@/data/products/bootmok-newlywed.json'
```

파일 끝에 추가:
```typescript

export function checkBootmokNewlywed(applicant: Applicant): EligibilityResult {
  const reasons: string[] = []
  const rule = bootmokNewlywed

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

  if (!applicant.isNewlywed) {
    reasons.push('신혼부부(혼인 7년 이내 또는 3개월 내 결혼예정) 요건에 해당하지 않음')
  }

  if (applicant.annualIncomeKrw > rule.incomeLimitKrw) {
    reasons.push(
      `소득 ${formatManwon(applicant.annualIncomeKrw)}으로 한도 ${formatManwon(rule.incomeLimitKrw)} 초과`
    )
  }

  if (applicant.netAssetKrw > rule.netAssetLimitKrw) {
    reasons.push(
      `순자산 ${formatEok(applicant.netAssetKrw)}으로 한도 ${formatEok(rule.netAssetLimitKrw)} 초과`
    )
  }

  const depositLimit =
    applicant.region === 'capital' ? rule.depositLimitKrw.capital : rule.depositLimitKrw.nonCapital
  if (applicant.depositKrw > depositLimit) {
    const regionLabel = applicant.region === 'capital' ? '수도권' : '비수도권'
    reasons.push(
      `전세보증금 ${formatEok(applicant.depositKrw)}으로 ${regionLabel} 한도 ${formatEok(depositLimit)} 초과`
    )
  }

  if (applicant.areaSqm > rule.areaLimitSqm) {
    reasons.push(`전용면적 ${applicant.areaSqm}㎡로 한도 ${rule.areaLimitSqm}㎡ 초과`)
  }

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
  }
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm test`
Expected: PASS — 26개 테스트 모두 통과(누적 19개 + 신규 7개)

- [ ] **Step 5: 커밋**

```bash
git add data/products/bootmok-newlywed.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 신혼부부전용 전세자금 자격판정 함수"
```

---

### Task 4: 신생아 특례 버팀목대출 자격판정 (TDD)

**Files:**
- Create: `data/products/bootmok-newborn.json`
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: `Applicant`, `EligibilityResult`, `checkHousingOwnership`(Task 1)
- Produces: `function checkBootmokNewborn(applicant: Applicant): EligibilityResult` — Task 5가 그대로 호출

- [ ] **Step 1: 규칙 데이터 파일 작성**

`data/products/bootmok-newborn.json`:
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
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021401.jsp",
  "verifiedAt": "2026-07-10"
}
```

- [ ] **Step 2: 실패하는 테스트 추가**

import 줄 교체:
```typescript
import {
  checkBootmokGeneral,
  checkBootmokYouth,
  checkBootmokNewlywed,
  checkBootmokNewborn,
  type Applicant,
} from './eligibility'
```

파일 끝에 추가:
```typescript

describe('checkBootmokNewborn', () => {
  const newbornBase: Applicant = {
    ...baseApplicant,
    hasNewbornWithin2Years: true,
    annualIncomeKrw: 120000000,
  }

  it('모든 조건을 충족하면 eligible: true를 반환한다', () => {
    const result = checkBootmokNewborn(newbornBase)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('2년 내 출산·입양 요건에 해당하지 않으면 미충족 사유를 반환한다', () => {
    const result = checkBootmokNewborn({ ...newbornBase, hasNewbornWithin2Years: false })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('대출접수일 기준 2년 내 출산·입양 요건에 해당하지 않음')
  })

  it('외벌이 소득이 1.3억원을 초과하면 소득 초과 사유를 반환한다', () => {
    const result = checkBootmokNewborn({ ...newbornBase, annualIncomeKrw: 140000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('소득 14,000만원으로 한도 13,000만원 초과')
  })

  it('맞벌이면 소득한도가 2억원으로 상향된다', () => {
    const result = checkBootmokNewborn({ ...newbornBase, isDualIncome: true, annualIncomeKrw: 180000000 })
    expect(result.eligible).toBe(true)
  })

  it('순자산이 3.45억원을 초과하면 순자산 초과 사유를 반환한다', () => {
    const result = checkBootmokNewborn({ ...newbornBase, netAssetKrw: 350000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('순자산 3.5억원으로 한도 3.45억원 초과')
  })

  it('수도권 보증금이 5억원을 초과하면 보증금 초과 사유를 반환한다', () => {
    const result = checkBootmokNewborn({ ...newbornBase, region: 'capital', depositKrw: 510000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 5.1억원으로 수도권 한도 5억원 초과')
  })

  it('비수도권 보증금이 4억원을 초과하면 보증금 초과 사유를 반환한다', () => {
    const result = checkBootmokNewborn({
      ...newbornBase,
      region: 'non-capital',
      depositKrw: 410000000,
    })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 4.1억원으로 비수도권 한도 4억원 초과')
  })

  it('전용면적이 85㎡를 초과하면 면적 초과 사유를 반환한다', () => {
    const result = checkBootmokNewborn({ ...newbornBase, areaSqm: 90 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전용면적 90㎡로 한도 85㎡ 초과')
  })
})
```

- [ ] **Step 2b: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find export 'checkBootmokNewborn'`

- [ ] **Step 3: 구현 추가**

`lib/eligibility.ts` 상단 import에 추가:
```typescript
import bootmokNewborn from '@/data/products/bootmok-newborn.json'
```

파일 끝에 추가:
```typescript

export function checkBootmokNewborn(applicant: Applicant): EligibilityResult {
  const reasons: string[] = []
  const rule = bootmokNewborn

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

  if (!applicant.hasNewbornWithin2Years) {
    reasons.push('대출접수일 기준 2년 내 출산·입양 요건에 해당하지 않음')
  }

  const incomeLimit = applicant.isDualIncome ? rule.dualIncomeLimitKrw : rule.incomeLimitKrw
  if (applicant.annualIncomeKrw > incomeLimit) {
    reasons.push(
      `소득 ${formatManwon(applicant.annualIncomeKrw)}으로 한도 ${formatManwon(incomeLimit)} 초과`
    )
  }

  if (applicant.netAssetKrw > rule.netAssetLimitKrw) {
    reasons.push(
      `순자산 ${formatEok(applicant.netAssetKrw)}으로 한도 ${formatEok(rule.netAssetLimitKrw)} 초과`
    )
  }

  const depositLimit =
    applicant.region === 'capital' ? rule.depositLimitKrw.capital : rule.depositLimitKrw.nonCapital
  if (applicant.depositKrw > depositLimit) {
    const regionLabel = applicant.region === 'capital' ? '수도권' : '비수도권'
    reasons.push(
      `전세보증금 ${formatEok(applicant.depositKrw)}으로 ${regionLabel} 한도 ${formatEok(depositLimit)} 초과`
    )
  }

  if (applicant.areaSqm > rule.areaLimitSqm) {
    reasons.push(`전용면적 ${applicant.areaSqm}㎡로 한도 ${rule.areaLimitSqm}㎡ 초과`)
  }

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
  }
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm test`
Expected: PASS — 34개 테스트 모두 통과(누적 26개 + 신규 8개)

- [ ] **Step 5: 커밋**

```bash
git add data/products/bootmok-newborn.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 신생아 특례 버팀목대출 자격판정 함수"
```

---

### Task 5: 코어 4개 상품 집계 함수 (TDD)

**Files:**
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: `checkBootmokGeneral`, `checkBootmokYouth`, `checkBootmokNewlywed`, `checkBootmokNewborn`(Task 1~4)
- Produces: `function checkAllCoreProducts(applicant: Applicant): EligibilityResult[]` — Task 7(페이지 조립)이 그대로 호출

- [ ] **Step 1: 실패하는 테스트 추가**

import 줄 교체:
```typescript
import {
  checkBootmokGeneral,
  checkBootmokYouth,
  checkBootmokNewlywed,
  checkBootmokNewborn,
  checkAllCoreProducts,
  type Applicant,
} from './eligibility'
```

파일 끝에 추가:
```typescript

describe('checkAllCoreProducts', () => {
  it('4개 상품 결과를 정해진 순서(일반→청년→신혼부부→신생아특례)로 반환한다', () => {
    const results = checkAllCoreProducts(baseApplicant)
    expect(results).toHaveLength(4)
    expect(results.map((r) => r.productId)).toEqual([
      'bootmok-general',
      'bootmok-youth',
      'bootmok-newlywed',
      'bootmok-newborn',
    ])
  })

  it('무주택 요건을 미충족하면 4개 상품 모두 eligible: false를 반환한다', () => {
    const results = checkAllCoreProducts({ ...baseApplicant, housingOwnership: 'one-house' })
    expect(results.every((r) => !r.eligible)).toBe(true)
    expect(results.every((r) => r.reasons.includes('무주택 요건 미충족(현재 주택을 소유하고 있어요)'))).toBe(
      true
    )
  })

  it('신혼+신생아 조건을 함께 충족하면 4개 상품 모두 eligible: true가 될 수 있다', () => {
    const results = checkAllCoreProducts({
      ...baseApplicant,
      age: 30,
      isNewlywed: true,
      hasNewbornWithin2Years: true,
      annualIncomeKrw: 70000000,
      depositKrw: 250000000,
    })
    expect(results.every((r) => r.eligible)).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find export 'checkAllCoreProducts'`

- [ ] **Step 3: 구현 추가**

`lib/eligibility.ts` 파일 끝에 추가:
```typescript

export function checkAllCoreProducts(applicant: Applicant): EligibilityResult[] {
  return [
    checkBootmokGeneral(applicant),
    checkBootmokYouth(applicant),
    checkBootmokNewlywed(applicant),
    checkBootmokNewborn(applicant),
  ]
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm test`
Expected: PASS — 37개 테스트 모두 통과(누적 34개 + 신규 3개)

- [ ] **Step 5: 커밋**

```bash
git add lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 코어 4개 상품 집계 함수 checkAllCoreProducts"
```

---

### Task 6: 11단계 문답 위저드로 확장

**Files:**
- Modify: `components/Questionnaire.tsx`

**Interfaces:**
- Consumes: 확장된 `Applicant` 타입(Task 1, `lib/eligibility.ts`에서 import)
- Produces: `function Questionnaire({ onComplete }: { onComplete: (applicant: Applicant) => void })` — Task 7이 `app/page.tsx`에서 그대로 사용

이 태스크부터 `npm run build`가 다시 그린이어야 한다(Global Constraints "빌드 순서 예외" 참조 — Applicant를 완전히 채우는 컴포넌트로 갱신하기 때문).

- [ ] **Step 1: 컴포넌트 전체 교체**

`components/Questionnaire.tsx`:
```typescript
'use client'

import { useState } from 'react'
import type { Applicant } from '@/lib/eligibility'

type Props = {
  onComplete: (applicant: Applicant) => void
}

const STEPS = [
  'houseDecided',
  'region',
  'area',
  'deposit',
  'housing',
  'household',
  'income',
  'asset',
  'existingLoan',
  'special',
  'age',
] as const
type Step = (typeof STEPS)[number]

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

export function Questionnaire({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [houseDecided, setHouseDecided] = useState<boolean | null>(null)
  const [region, setRegion] = useState<Applicant['region'] | null>(null)
  const [areaSqm, setAreaSqm] = useState('')
  const [depositManwon, setDepositManwon] = useState('')
  const [housingOwnership, setHousingOwnership] = useState<Applicant['housingOwnership'] | null>(null)
  const [isNewlywed, setIsNewlywed] = useState(false)
  const [hasChildrenTwoOrMore, setHasChildrenTwoOrMore] = useState(false)
  const [hasNewbornWithin2Years, setHasNewbornWithin2Years] = useState(false)
  const [isDualIncome, setIsDualIncome] = useState(false)
  const [annualIncomeManwon, setAnnualIncomeManwon] = useState('')
  const [netAssetManwon, setNetAssetManwon] = useState('')
  const [hasExistingLoan, setHasExistingLoan] = useState(false)
  const [isSmeEmployeeOrFounder, setIsSmeEmployeeOrFounder] = useState(false)
  const [isInnovationCityOrRedevelopment, setIsInnovationCityOrRedevelopment] = useState(false)
  const [hasDelinquencyHistory, setHasDelinquencyHistory] = useState(false)
  const [ageInput, setAgeInput] = useState('')

  const step: Step = STEPS[stepIndex]

  function goNext() {
    if (stepIndex === STEPS.length - 1) {
      onComplete({
        houseDecided: houseDecided ?? true,
        region: region ?? 'capital',
        areaSqm: Number(areaSqm),
        depositKrw: Number(depositManwon) * 10000,
        housingOwnership: housingOwnership ?? 'none',
        isNewlywed,
        hasChildrenTwoOrMore,
        hasNewbornWithin2Years,
        isDualIncome,
        annualIncomeKrw: Number(annualIncomeManwon) * 10000,
        netAssetKrw: Number(netAssetManwon) * 10000,
        hasExistingLoan,
        isSmeEmployeeOrFounder,
        isInnovationCityOrRedevelopment,
        hasDelinquencyHistory,
        age: Number(ageInput),
      })
      return
    }
    setStepIndex((i) => i + 1)
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  const canProceed =
    (step === 'houseDecided' && houseDecided !== null) ||
    (step === 'region' && region !== null) ||
    (step === 'area' && areaSqm !== '') ||
    (step === 'deposit' && depositManwon !== '') ||
    (step === 'housing' && housingOwnership !== null) ||
    step === 'household' ||
    (step === 'income' && annualIncomeManwon !== '') ||
    (step === 'asset' && netAssetManwon !== '') ||
    step === 'existingLoan' ||
    step === 'special' ||
    (step === 'age' && ageInput !== '')

  return (
    <div className="max-w-[480px] mx-auto px-4 py-8">
      {step === 'houseDecided' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            이사할 집을 결정하셨나요?
          </legend>
          <div className="flex gap-2">
            <ToggleButton active={houseDecided === true} onClick={() => setHouseDecided(true)}>
              결정했어요
            </ToggleButton>
            <ToggleButton active={houseDecided === false} onClick={() => setHouseDecided(false)}>
              나중에 결정
            </ToggleButton>
          </div>
        </fieldset>
      )}

      {step === 'region' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            이사할 집은 어느 지역에 있나요?
          </legend>
          <div className="flex gap-2">
            {(['capital', 'non-capital'] as const).map((value) => (
              <ToggleButton key={value} active={region === value} onClick={() => setRegion(value)}>
                {value === 'capital' ? '수도권' : '비수도권'}
              </ToggleButton>
            ))}
          </div>
        </fieldset>
      )}

      {step === 'area' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            전용면적은 몇 ㎡인가요?
          </legend>
          <input
            type="number"
            value={areaSqm}
            onChange={(e) => setAreaSqm(e.target.value)}
            placeholder="예: 59"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      {step === 'deposit' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            전세보증금은 얼마인가요? (만원 단위)
          </legend>
          <input
            type="number"
            value={depositManwon}
            onChange={(e) => setDepositManwon(e.target.value)}
            placeholder="예: 25000"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      {step === 'housing' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            현재 주택 소유 상태는 어떻게 되나요?
          </legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['none', '무주택'],
                ['public-rental', '공공임대 거주 중'],
                ['one-house', '1주택'],
                ['multi-house', '2주택 이상'],
              ] as const
            ).map(([value, label]) => (
              <ToggleButton
                key={value}
                active={housingOwnership === value}
                onClick={() => setHousingOwnership(value)}
              >
                {label}
              </ToggleButton>
            ))}
          </div>
        </fieldset>
      )}

      {step === 'household' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            해당하는 항목을 모두 선택해주세요
          </legend>
          <div className="flex flex-col gap-2">
            <ToggleButton active={isNewlywed} onClick={() => setIsNewlywed((v) => !v)}>
              신혼부부(혼인 7년 이내 또는 3개월 내 결혼예정)
            </ToggleButton>
            <ToggleButton
              active={hasChildrenTwoOrMore}
              onClick={() => setHasChildrenTwoOrMore((v) => !v)}
            >
              자녀 2명 이상
            </ToggleButton>
            <ToggleButton
              active={hasNewbornWithin2Years}
              onClick={() => setHasNewbornWithin2Years((v) => !v)}
            >
              2년 내 출산·입양
            </ToggleButton>
            <ToggleButton active={isDualIncome} onClick={() => setIsDualIncome((v) => !v)}>
              맞벌이 가구
            </ToggleButton>
          </div>
        </fieldset>
      )}

      {step === 'income' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            부부합산 연소득은 얼마인가요? (만원 단위)
          </legend>
          <input
            type="number"
            value={annualIncomeManwon}
            onChange={(e) => setAnnualIncomeManwon(e.target.value)}
            placeholder="예: 4500"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      {step === 'asset' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            순자산은 얼마인가요? (만원 단위)
          </legend>
          <input
            type="number"
            value={netAssetManwon}
            onChange={(e) => setNetAssetManwon(e.target.value)}
            placeholder="예: 10000"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      {step === 'existingLoan' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            현재 보유 중인 대출이 있나요?
          </legend>
          <div className="flex gap-2">
            <ToggleButton active={!hasExistingLoan} onClick={() => setHasExistingLoan(false)}>
              없음
            </ToggleButton>
            <ToggleButton active={hasExistingLoan} onClick={() => setHasExistingLoan(true)}>
              있음
            </ToggleButton>
          </div>
        </fieldset>
      )}

      {step === 'special' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            해당하는 특이사항을 모두 선택해주세요
          </legend>
          <div className="flex flex-col gap-2">
            <ToggleButton
              active={isSmeEmployeeOrFounder}
              onClick={() => setIsSmeEmployeeOrFounder((v) => !v)}
            >
              중소기업 재직·창업
            </ToggleButton>
            <ToggleButton
              active={isInnovationCityOrRedevelopment}
              onClick={() => setIsInnovationCityOrRedevelopment((v) => !v)}
            >
              혁신도시 이전기관 종사자·재개발 입주자
            </ToggleButton>
            <ToggleButton
              active={hasDelinquencyHistory}
              onClick={() => setHasDelinquencyHistory((v) => !v)}
            >
              연체·부도 이력 있음
            </ToggleButton>
          </div>
        </fieldset>
      )}

      {step === 'age' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">나이(만 나이)를 입력해주세요</legend>
          <input
            type="number"
            value={ageInput}
            onChange={(e) => setAgeInput(e.target.value)}
            placeholder="예: 32"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      <div className="flex gap-2 mt-6">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="h-11 px-4 rounded-full text-sm font-semibold bg-[#F5F6F7] text-[#555B61]"
          >
            이전
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!canProceed}
          className="h-11 px-6 rounded-full text-sm font-semibold bg-[#25B9B9] text-white disabled:opacity-40"
        >
          {stepIndex === STEPS.length - 1 ? '결과 보기' : '다음'}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 빌드로 타입 에러 확인**

Run: `npm run build`
Expected: 컴파일 에러 없음(이 시점에는 `app/page.tsx`가 아직 옛 `checkBootmokGeneral` 단일 호출을 쓰므로 그 부분은 타입이 여전히 맞음 — `onComplete` 콜백 시그니처가 확장된 `Applicant`를 만족하는지만 확인. `Questionnaire`가 완전한 `Applicant`를 생성하므로 여기서부터 빌드 그린이어야 한다)

- [ ] **Step 3: 커밋**

```bash
git add components/Questionnaire.tsx
git commit -m "feat: 11단계 문답 위저드로 확장(집결정/지역/면적/보증금/주택소유/결혼가구/소득/순자산/보유대출/특이사항/나이)"
```

---

### Task 7: 결과 화면 4개 상품 표시 + 페이지 조립 + 수동 검증

**Files:**
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Questionnaire`(Task 6), `checkAllCoreProducts`·`Applicant`·`EligibilityResult`(Task 5), `ResultCard`(issues.md #1, 변경 없음)
- Produces: 없음(최종 태스크, 페이지 조립)

- [ ] **Step 1: 페이지를 4개 상품 결과 배열을 다루도록 교체**

`app/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Questionnaire } from '@/components/Questionnaire'
import { ResultCard } from '@/components/ResultCard'
import { checkAllCoreProducts, type Applicant, type EligibilityResult } from '@/lib/eligibility'

export default function Home() {
  const [results, setResults] = useState<EligibilityResult[] | null>(null)

  function handleComplete(applicant: Applicant) {
    setResults(checkAllCoreProducts(applicant))
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

- [ ] **Step 2: 빌드 확인**

Run: `npm run build`
Expected: `Compiled successfully`, 에러 없음

- [ ] **Step 3: 테스트 스위트 최종 확인**

Run: `npm test`
Expected: PASS — Task 1~5에서 작성한 37개 테스트 전부 통과 유지

- [ ] **Step 4: 개발 서버로 수동 확인**

Run: `npm run dev` (백그라운드 실행 후) → `http://localhost:3000` 접속
Expected: 집 결정여부 → 지역 → 면적 → 보증금 → 주택소유 → 결혼가구 → 소득 → 순자산 → 보유대출 → 특이사항 → 나이,
총 11단계 입력 후 "결과 보기" 클릭 시 4개 상품 카드(버팀목 일반/청년전용/신혼부부전용/신생아특례)가 모두 렌더링됨.
각 단계에서 "이전" 버튼으로 되돌아가 답변을 수정할 수 있음. "다시 하기" 클릭 시 처음(집 결정여부)부터 재입력 가능.
브라우저 개발자도구 Network 탭에서 XHR/fetch 요청이 발생하지 않음을 확인(서버 전송 없음 검증).

- [ ] **Step 5: 커밋**

```bash
git add app/page.tsx
git commit -m "feat: 결과화면 4개 상품 표시 + 페이지 조립 (issues.md #2)"
```

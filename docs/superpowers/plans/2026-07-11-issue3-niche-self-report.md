# 니치 3종 자기신고 + 판정 통합 (issues.md #3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** "특이사항" 단계에 니치 3종(전세피해 임차인 버팀목·갱신만료 임차인 지원 버팀목·주거취약계층 이주지원 버팀목)에 대한 자기신고 체크박스를 추가하고, 체크된 항목만 판정 로직에 포함시켜 결과 화면이 코어 4개+니치 3개, 총 7개 상품을 모두 표시하도록 확장한다.

**Architecture:** issues.md #2까지 만든 파이프라인을 그대로 확장한다. `EligibilityResult`에 `applicable: boolean` 필드를 추가해 "미충족"과 "비대상(자기신고 안 함)"을 구분한다. 니치 상품 순수 판정함수 3개(`checkJeonseDamage`/`checkRenewalExtension`/`checkVulnerableHousing`)를 추가하고, `checkAllProducts`로 코어 4개+니치 3개를 묶는다. `Questionnaire.tsx`의 "특이사항" 단계에 체크박스 3개(보조 설명 문구 포함)를 추가하고, `ResultCard.tsx`가 `applicable: false`일 때 "비대상" 상태를 별도로 렌더링하도록 확장한 뒤 `app/page.tsx`가 `checkAllProducts`를 사용하도록 바꾼다.

**Tech Stack:** Next.js(App Router) + TypeScript + Tailwind CSS v4, Vitest(순수 함수 유닛테스트만).

## Global Constraints

- 서버로 개인정보 전송·저장 금지 — 전체 계산은 클라이언트 컴포넌트(`"use client"`) 내에서만 수행
- 자격 수치는 JSON 규칙 데이터 파일로 분리, 각 필드에 `sourceUrl`·`verifiedAt` 포함
- 사용 수치는 `docs/eligibility-criteria.md`의 값을 그대로 사용(출처: nhuf.molit.go.kr, 확인일 2026-07-11):
  - 전세피해 임차인 버팀목: 소득한도 1.3억원, 순자산한도 5.11억원(다른 상품보다 높음), 보증금 3억원 이내(지역 구분 없음), 전용면적 85㎡
  - 갱신만료 임차인 지원 버팀목(한시): 소득/자산/나이 한도 없음, 보증금 수도권 4.5억/비수도권 2.5억, 전용면적 제한 없음
  - 주거취약계층 이주지원 버팀목: 소득/자산/나이 한도 없음, 보증금 공공임대 50만원 한도 / 민간임대 1억원 이내
- 3개 상품 모두 공통 무주택 게이트(`checkHousingOwnership`, issues.md #2 산출물)를 그대로 재사용한다.
- **"비대상" vs "미충족" 구분(핵심 설계)**: `EligibilityResult`에 `applicable: boolean`을 추가한다. 자기신고 체크박스를 선택하지 않은 니치 상품은 게이트·소득·자산 등 어떤 계산도 하지 않고 즉시 `{ applicable: false, eligible: false, reasons: [] }`를 반환한다 — 이때 `eligible: false`는 표시에 쓰이지 않는 자리값이며 결함이 아니다(ResultCard가 `applicable`을 먼저 확인해 분기한다). 코어 4개 상품은 항상 `applicable: true`.
- **주거취약계층의 대상주택 구분**: "공공임대"/"민간임대" 여부를 묻는 별도 문항은 만들지 않고, 이미 수집된 `housingOwnership === 'public-rental'`이면 공공임대 한도(50만원)를, 그 외(`'none'`)면 민간임대 한도(1억원)를 적용한다 — 기존 문항 재사용으로 문항 수 증가를 피하는 결정.
- 주거취약계층의 보증금 금액 표기는 50만원처럼 작은 단위라 `formatEok`(억원 단위, 소수점 2자리)를 쓰면 반올림 오차가 커진다. 이 상품의 보증금 사유 문구만 `formatManwon`을 사용한다(다른 6개 상품은 기존처럼 `formatEok` 유지).
- 금액 단위는 원(KRW) 정수. `formatEok`/`formatManwon`/`checkHousingOwnership`는 재정의하지 않고 기존 것을 재사용한다.
- **빌드 순서 예외**: Task 1~5는 `lib/eligibility.ts`와 그 테스트만 다루며, 이 시점에는 `components/Questionnaire.tsx`·`app/page.tsx`·`components/ResultCard.tsx`가 아직 니치 상품을 모르므로 `npm run build`는 계속 성공해야 한다(신규 필드/함수 추가만이라 기존 코드와 호환) — 단, Task 1에서 `EligibilityResult`에 `applicable`을 추가하면 그 필드를 읽지 않는 기존 `ResultCard.tsx`는 여전히 컴파일된다(TS는 초과 필드를 허용). 따라서 이번 계획은 이슈#2와 달리 Task 1~5 구간에서도 `npm run build`가 계속 그린이어야 한다 — 실패하면 그 자체가 결함이다.

---

### Task 1: EligibilityResult에 applicable 필드 추가 + 코어 4개 함수 반영 (TDD)

**Files:**
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: 기존 `EligibilityResult`, `checkBootmokGeneral`/`checkBootmokYouth`/`checkBootmokNewlywed`/`checkBootmokNewborn`(issues.md #2 산출물)
- Produces: 확장된 `type EligibilityResult = { productId: string; productName: string; eligible: boolean; reasons: string[]; applicable: boolean }` — Task 2~4의 니치 함수가 그대로 사용

- [ ] **Step 1: 실패하는 테스트 추가**

`lib/eligibility.test.ts` 파일 끝에 추가:
```typescript

describe('EligibilityResult.applicable (코어 상품은 항상 true)', () => {
  it('checkBootmokGeneral 결과는 applicable: true를 포함한다', () => {
    const result = checkBootmokGeneral(baseApplicant)
    expect(result.applicable).toBe(true)
  })

  it('checkBootmokYouth 결과는 applicable: true를 포함한다', () => {
    const result = checkBootmokYouth({ ...baseApplicant, age: 28 })
    expect(result.applicable).toBe(true)
  })

  it('checkBootmokNewlywed 결과는 applicable: true를 포함한다', () => {
    const result = checkBootmokNewlywed({ ...baseApplicant, isNewlywed: true, annualIncomeKrw: 70000000 })
    expect(result.applicable).toBe(true)
  })

  it('checkBootmokNewborn 결과는 applicable: true를 포함한다', () => {
    const result = checkBootmokNewborn({
      ...baseApplicant,
      hasNewbornWithin2Years: true,
      annualIncomeKrw: 120000000,
    })
    expect(result.applicable).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — 4개 테스트 모두 `result.applicable`이 `undefined`라 `toBe(true)` 불일치

- [ ] **Step 3: `EligibilityResult` 타입 확장 + 4개 함수 반영**

`lib/eligibility.ts`에서 `EligibilityResult` 타입을 다음으로 교체:
```typescript
export type EligibilityResult = {
  productId: string
  productName: string
  eligible: boolean
  reasons: string[]
  applicable: boolean
}
```

`checkBootmokGeneral`, `checkBootmokYouth`, `checkBootmokNewlywed`, `checkBootmokNewborn` 4개 함수 각각의 `return { ... }` 블록에 `applicable: true`를 추가한다(각 함수마다 동일한 한 줄 추가). 예를 들어 `checkBootmokGeneral`의 반환문은 다음과 같이 바뀐다:
```typescript
  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
  }
```
나머지 3개 함수(`checkBootmokYouth`/`checkBootmokNewlywed`/`checkBootmokNewborn`)의 반환문에도 동일하게 `applicable: true,`를 추가한다.

- [ ] **Step 4: 테스트 실행 + 빌드 확인**

Run: `npm test`
Expected: PASS — 41개 테스트 모두 통과(기존 37개 + 신규 4개)

Run: `npm run build`
Expected: `Compiled successfully`, 에러 없음(기존 `ResultCard.tsx`는 초과 필드를 무시하므로 그대로 컴파일됨)

- [ ] **Step 5: 커밋**

```bash
git add lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: EligibilityResult에 applicable 필드 추가 + 코어 4개 함수 반영"
```

---

### Task 2: 전세피해 임차인 버팀목전세자금 자격판정 (TDD)

**Files:**
- Create: `data/products/bootmok-jeonse-damage.json`
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: `Applicant`(확장 필요, 이 태스크에서 `selfReportedJeonseDamage: boolean` 필드 추가), `EligibilityResult`, `checkHousingOwnership`(Task 1까지 산출물)
- Produces: 확장된 `Applicant`(니치 3종 필드 포함 시작), `function checkJeonseDamage(applicant: Applicant): EligibilityResult` — Task 5가 그대로 호출

- [ ] **Step 1: 규칙 데이터 파일 작성**

`data/products/bootmok-jeonse-damage.json`:
```json
{
  "id": "bootmok-jeonse-damage",
  "name": "전세피해 임차인 버팀목전세자금",
  "incomeLimitKrw": 130000000,
  "netAssetLimitKrw": 511000000,
  "depositLimitKrw": 300000000,
  "areaLimitSqm": 85,
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021201.jsp",
  "verifiedAt": "2026-07-10"
}
```

- [ ] **Step 2: 실패하는 테스트 추가 — Applicant 확장 + 신규 함수**

`lib/eligibility.test.ts` 상단의 `baseApplicant` 정의에 아래 3개 필드를 추가(니치 3종 자기신고 필드, 전부 기본값 `false`):
```typescript
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
  selfReportedJeonseDamage: false,
  selfReportedRenewalExtension: false,
  selfReportedVulnerableHousing: false,
}
```
(기존 정의를 위 내용으로 완전히 교체 — 필드 15개에서 18개로 확장)

import 줄 교체(`checkJeonseDamage` 추가):
```typescript
import {
  checkBootmokGeneral,
  checkBootmokYouth,
  checkBootmokNewlywed,
  checkBootmokNewborn,
  checkAllCoreProducts,
  checkJeonseDamage,
  type Applicant,
} from './eligibility'
```

파일 끝에 추가:
```typescript

describe('checkJeonseDamage', () => {
  const damageBase: Applicant = { ...baseApplicant, selfReportedJeonseDamage: true }

  it('자기신고 체크를 하지 않으면 applicable: false를 반환하고 판정하지 않는다', () => {
    const result = checkJeonseDamage({ ...damageBase, selfReportedJeonseDamage: false })
    expect(result.applicable).toBe(false)
    expect(result.eligible).toBe(false)
    expect(result.reasons).toEqual([])
  })

  it('자기신고 체크 후 모든 조건을 충족하면 applicable: true, eligible: true를 반환한다', () => {
    const result = checkJeonseDamage(damageBase)
    expect(result.applicable).toBe(true)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('연소득이 1.3억원을 초과하면 소득 초과 사유를 반환한다', () => {
    const result = checkJeonseDamage({ ...damageBase, annualIncomeKrw: 140000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('소득 14,000만원으로 한도 13,000만원 초과')
  })

  it('순자산이 5.11억원을 초과하면 순자산 초과 사유를 반환한다', () => {
    const result = checkJeonseDamage({ ...damageBase, netAssetKrw: 520000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('순자산 5.2억원으로 한도 5.11억원 초과')
  })

  it('보증금이 3억원을 초과하면 지역과 무관하게 미충족 사유를 반환한다', () => {
    const result = checkJeonseDamage({ ...damageBase, region: 'non-capital', depositKrw: 310000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 3.1억원으로 한도 3억원 초과')
  })

  it('전용면적이 85㎡를 초과하면 면적 초과 사유를 반환한다', () => {
    const result = checkJeonseDamage({ ...damageBase, areaSqm: 90 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전용면적 90㎡로 한도 85㎡ 초과')
  })

  it('1주택 이상 소유 중이면 무주택 요건 미충족 사유를 반환한다', () => {
    const result = checkJeonseDamage({ ...damageBase, housingOwnership: 'one-house' })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('무주택 요건 미충족(현재 주택을 소유하고 있어요)')
  })
})
```

- [ ] **Step 2b: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Applicant` 타입에 니치 필드가 없어 타입 에러, `Cannot find export 'checkJeonseDamage'`

- [ ] **Step 3: `Applicant` 타입 확장 + 함수 구현**

`lib/eligibility.ts`의 `Applicant` 타입에 아래 3개 필드 추가(`age: number` 다음 줄에):
```typescript
  age: number
  selfReportedJeonseDamage: boolean
  selfReportedRenewalExtension: boolean
  selfReportedVulnerableHousing: boolean
```

상단 import에 추가:
```typescript
import bootmokJeonseDamage from '@/data/products/bootmok-jeonse-damage.json'
```

파일 끝에 추가:
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
    }
  }

  const reasons: string[] = []

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

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

  if (applicant.depositKrw > rule.depositLimitKrw) {
    reasons.push(
      `전세보증금 ${formatEok(applicant.depositKrw)}으로 한도 ${formatEok(rule.depositLimitKrw)} 초과`
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
    applicable: true,
  }
}
```

- [ ] **Step 4: 테스트 실행 + 빌드 확인**

Run: `npm test`
Expected: PASS — 48개 테스트 모두 통과(누적 41개 + 신규 7개)

Run: `npm run build`
Expected: `Compiled successfully`(니치 필드가 `Applicant`에 추가됐지만 기존 `Questionnaire.tsx`는 아직 이 필드들을 채우지 않는다 — 이 시점에서 빌드가 깨진다면, `Questionnaire.tsx`가 만드는 객체가 `Applicant` 타입과 안 맞기 때문이다. 이 계획에서는 니치 필드에 **기본값을 두지 않고 필수 필드로 유지**하되, `Questionnaire.tsx`를 건드리는 것은 Task 6의 몫이다. 따라서 이 시점엔 `npm run build`가 **`Questionnaire.tsx:구현부 근처에서 실패하는 것이 정상`**이다 — Task 6에서 그 파일이 갱신되며 다시 그린이 된다. Task 2~5는 `npm test`만으로 검증한다.)

- [ ] **Step 5: 커밋**

```bash
git add data/products/bootmok-jeonse-damage.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: Applicant에 니치 자기신고 필드 추가 + 전세피해 임차인 버팀목 자격판정 함수"
```

---

### Task 3: 갱신만료 임차인 지원 버팀목전세자금 자격판정 (TDD)

**Files:**
- Create: `data/products/bootmok-renewal-extension.json`
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: `Applicant`, `EligibilityResult`, `checkHousingOwnership`(Task 1~2)
- Produces: `function checkRenewalExtension(applicant: Applicant): EligibilityResult` — Task 5가 그대로 호출

이 상품은 소득·순자산·전용면적 한도가 "없음"이라 해당 검사를 아예 수행하지 않는다(보증금과 무주택 게이트만 검사).

- [ ] **Step 1: 규칙 데이터 파일 작성**

`data/products/bootmok-renewal-extension.json`:
```json
{
  "id": "bootmok-renewal-extension",
  "name": "갱신만료 임차인 지원 버팀목전세자금",
  "depositLimitKrw": {
    "capital": 450000000,
    "nonCapital": 250000000
  },
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021002.jsp",
  "verifiedAt": "2026-07-10"
}
```

- [ ] **Step 2: 실패하는 테스트 추가**

import 줄 교체(`checkRenewalExtension` 추가):
```typescript
import {
  checkBootmokGeneral,
  checkBootmokYouth,
  checkBootmokNewlywed,
  checkBootmokNewborn,
  checkAllCoreProducts,
  checkJeonseDamage,
  checkRenewalExtension,
  type Applicant,
} from './eligibility'
```

파일 끝에 추가:
```typescript

describe('checkRenewalExtension', () => {
  const renewalBase: Applicant = { ...baseApplicant, selfReportedRenewalExtension: true }

  it('자기신고 체크를 하지 않으면 applicable: false를 반환하고 판정하지 않는다', () => {
    const result = checkRenewalExtension({ ...renewalBase, selfReportedRenewalExtension: false })
    expect(result.applicable).toBe(false)
    expect(result.eligible).toBe(false)
    expect(result.reasons).toEqual([])
  })

  it('자기신고 체크 후 모든 조건을 충족하면 applicable: true, eligible: true를 반환한다', () => {
    const result = checkRenewalExtension(renewalBase)
    expect(result.applicable).toBe(true)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('수도권 보증금이 4.5억원을 초과하면 보증금 초과 사유를 반환한다', () => {
    const result = checkRenewalExtension({ ...renewalBase, region: 'capital', depositKrw: 460000000 })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 4.6억원으로 수도권 한도 4.5억원 초과')
  })

  it('비수도권 보증금이 2.5억원을 초과하면 보증금 초과 사유를 반환한다', () => {
    const result = checkRenewalExtension({
      ...renewalBase,
      region: 'non-capital',
      depositKrw: 260000000,
    })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 2.6억원으로 비수도권 한도 2.5억원 초과')
  })

  it('2주택 이상 소유 중이면 무주택 요건 미충족 사유를 반환한다', () => {
    const result = checkRenewalExtension({ ...renewalBase, housingOwnership: 'multi-house' })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('무주택 요건 미충족(현재 주택을 소유하고 있어요)')
  })
})
```

- [ ] **Step 2b: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find export 'checkRenewalExtension'`

- [ ] **Step 3: 구현 추가**

`lib/eligibility.ts` 상단 import에 추가:
```typescript
import bootmokRenewalExtension from '@/data/products/bootmok-renewal-extension.json'
```

파일 끝에 추가:
```typescript

export function checkRenewalExtension(applicant: Applicant): EligibilityResult {
  const rule = bootmokRenewalExtension

  if (!applicant.selfReportedRenewalExtension) {
    return {
      productId: rule.id,
      productName: rule.name,
      eligible: false,
      reasons: [],
      applicable: false,
    }
  }

  const reasons: string[] = []

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

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
    applicable: true,
  }
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm test`
Expected: PASS — 53개 테스트 모두 통과(누적 48개 + 신규 5개)

- [ ] **Step 5: 커밋**

```bash
git add data/products/bootmok-renewal-extension.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 갱신만료 임차인 지원 버팀목전세자금 자격판정 함수"
```

---

### Task 4: 주거취약계층 이주지원 버팀목전세자금 자격판정 (TDD)

**Files:**
- Create: `data/products/bootmok-vulnerable-housing.json`
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: `Applicant`, `EligibilityResult`, `checkHousingOwnership`(Task 1~3)
- Produces: `function checkVulnerableHousing(applicant: Applicant): EligibilityResult` — Task 5가 그대로 호출

이 상품도 소득·순자산·나이 한도가 "없음"이다. 보증금 한도는 "공공임대"/"민간임대" 구분인데, 별도 문항 없이 기존 `housingOwnership === 'public-rental'` 여부로 구분한다(Global Constraints 참조). 이 상품만 보증금 사유 문구에 `formatEok` 대신 `formatManwon`을 사용한다(50만원처럼 작은 금액이라 억원 단위 반올림 오차를 피하기 위함).

- [ ] **Step 1: 규칙 데이터 파일 작성**

`data/products/bootmok-vulnerable-housing.json`:
```json
{
  "id": "bootmok-vulnerable-housing",
  "name": "주거취약계층 이주지원 버팀목전세자금",
  "depositLimitKrw": {
    "publicHousing": 500000,
    "privateHousing": 100000000
  },
  "sourceUrl": "https://nhuf.molit.go.kr/FP/FP05/FP0502/FP05021101.jsp",
  "verifiedAt": "2026-07-10"
}
```

- [ ] **Step 2: 실패하는 테스트 추가**

import 줄 교체(`checkVulnerableHousing` 추가):
```typescript
import {
  checkBootmokGeneral,
  checkBootmokYouth,
  checkBootmokNewlywed,
  checkBootmokNewborn,
  checkAllCoreProducts,
  checkJeonseDamage,
  checkRenewalExtension,
  checkVulnerableHousing,
  type Applicant,
} from './eligibility'
```

파일 끝에 추가:
```typescript

describe('checkVulnerableHousing', () => {
  const vulnerableBase: Applicant = { ...baseApplicant, selfReportedVulnerableHousing: true }

  it('자기신고 체크를 하지 않으면 applicable: false를 반환하고 판정하지 않는다', () => {
    const result = checkVulnerableHousing({ ...vulnerableBase, selfReportedVulnerableHousing: false })
    expect(result.applicable).toBe(false)
    expect(result.eligible).toBe(false)
    expect(result.reasons).toEqual([])
  })

  it('공공임대 거주 중이고 보증금이 50만원 이하이면 eligible: true를 반환한다', () => {
    const result = checkVulnerableHousing({
      ...vulnerableBase,
      housingOwnership: 'public-rental',
      depositKrw: 400000,
    })
    expect(result.applicable).toBe(true)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('공공임대 거주 중이고 보증금이 50만원을 초과하면 미충족 사유를 반환한다', () => {
    const result = checkVulnerableHousing({
      ...vulnerableBase,
      housingOwnership: 'public-rental',
      depositKrw: 600000,
    })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 60만원으로 공공임대 한도 50만원 초과')
  })

  it('무주택(공공임대 아님)이고 보증금이 1억원 이하이면 eligible: true를 반환한다', () => {
    const result = checkVulnerableHousing({
      ...vulnerableBase,
      housingOwnership: 'none',
      depositKrw: 80000000,
    })
    expect(result.applicable).toBe(true)
    expect(result.eligible).toBe(true)
    expect(result.reasons).toEqual([])
  })

  it('무주택(공공임대 아님)이고 보증금이 1억원을 초과하면 민간임대 한도 초과 사유를 반환한다', () => {
    const result = checkVulnerableHousing({
      ...vulnerableBase,
      housingOwnership: 'none',
      depositKrw: 110000000,
    })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('전세보증금 11,000만원으로 민간임대 한도 10,000만원 초과')
  })

  it('1주택 이상 소유 중이면 무주택 요건 미충족 사유를 반환한다', () => {
    const result = checkVulnerableHousing({ ...vulnerableBase, housingOwnership: 'one-house' })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toContain('무주택 요건 미충족(현재 주택을 소유하고 있어요)')
  })
})
```

- [ ] **Step 2b: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find export 'checkVulnerableHousing'`

- [ ] **Step 3: 구현 추가**

`lib/eligibility.ts` 상단 import에 추가:
```typescript
import bootmokVulnerableHousing from '@/data/products/bootmok-vulnerable-housing.json'
```

파일 끝에 추가:
```typescript

export function checkVulnerableHousing(applicant: Applicant): EligibilityResult {
  const rule = bootmokVulnerableHousing

  if (!applicant.selfReportedVulnerableHousing) {
    return {
      productId: rule.id,
      productName: rule.name,
      eligible: false,
      reasons: [],
      applicable: false,
    }
  }

  const reasons: string[] = []

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

  const isPublicHousing = applicant.housingOwnership === 'public-rental'
  const depositLimit = isPublicHousing
    ? rule.depositLimitKrw.publicHousing
    : rule.depositLimitKrw.privateHousing
  if (applicant.depositKrw > depositLimit) {
    const housingLabel = isPublicHousing ? '공공임대' : '민간임대'
    reasons.push(
      `전세보증금 ${formatManwon(applicant.depositKrw)}으로 ${housingLabel} 한도 ${formatManwon(depositLimit)} 초과`
    )
  }

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
  }
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm test`
Expected: PASS — 59개 테스트 모두 통과(누적 53개 + 신규 6개)

- [ ] **Step 5: 커밋**

```bash
git add data/products/bootmok-vulnerable-housing.json lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 주거취약계층 이주지원 버팀목전세자금 자격판정 함수"
```

---

### Task 5: 코어 4개 + 니치 3개, 총 7개 상품 집계 함수 (TDD)

**Files:**
- Modify: `lib/eligibility.ts`
- Modify: `lib/eligibility.test.ts`

**Interfaces:**
- Consumes: `checkAllCoreProducts`(issues.md #2), `checkJeonseDamage`, `checkRenewalExtension`, `checkVulnerableHousing`(Task 2~4)
- Produces: `function checkAllProducts(applicant: Applicant): EligibilityResult[]` — Task 7(페이지 조립)이 그대로 호출

- [ ] **Step 1: 실패하는 테스트 추가**

import 줄 교체(`checkAllProducts` 추가):
```typescript
import {
  checkBootmokGeneral,
  checkBootmokYouth,
  checkBootmokNewlywed,
  checkBootmokNewborn,
  checkAllCoreProducts,
  checkJeonseDamage,
  checkRenewalExtension,
  checkVulnerableHousing,
  checkAllProducts,
  type Applicant,
} from './eligibility'
```

파일 끝에 추가:
```typescript

describe('checkAllProducts', () => {
  it('코어 4개 + 니치 3개, 정해진 순서로 7개 결과를 반환한다', () => {
    const results = checkAllProducts(baseApplicant)
    expect(results).toHaveLength(7)
    expect(results.map((r) => r.productId)).toEqual([
      'bootmok-general',
      'bootmok-youth',
      'bootmok-newlywed',
      'bootmok-newborn',
      'bootmok-jeonse-damage',
      'bootmok-renewal-extension',
      'bootmok-vulnerable-housing',
    ])
  })

  it('니치 3종을 자기신고하지 않으면 코어 4개는 applicable: true, 니치 3개는 applicable: false다', () => {
    const results = checkAllProducts(baseApplicant)
    expect(results.slice(0, 4).every((r) => r.applicable)).toBe(true)
    expect(results.slice(4).every((r) => !r.applicable)).toBe(true)
  })

  it('코어+니치 조건을 모두 충족하면 7개 상품 모두 eligible: true를 반환한다', () => {
    const results = checkAllProducts({
      ...baseApplicant,
      age: 30,
      isNewlywed: true,
      hasNewbornWithin2Years: true,
      annualIncomeKrw: 70000000,
      depositKrw: 80000000,
      selfReportedJeonseDamage: true,
      selfReportedRenewalExtension: true,
      selfReportedVulnerableHousing: true,
    })
    expect(results.every((r) => r.applicable)).toBe(true)
    expect(results.every((r) => r.eligible)).toBe(true)
  })
})
```

- [ ] **Step 2: 테스트 실행하여 실패 확인**

Run: `npm test`
Expected: FAIL — `Cannot find export 'checkAllProducts'`

- [ ] **Step 3: 구현 추가**

`lib/eligibility.ts` 파일 끝에 추가:
```typescript

export function checkAllProducts(applicant: Applicant): EligibilityResult[] {
  return [
    ...checkAllCoreProducts(applicant),
    checkJeonseDamage(applicant),
    checkRenewalExtension(applicant),
    checkVulnerableHousing(applicant),
  ]
}
```

- [ ] **Step 4: 테스트 실행하여 통과 확인**

Run: `npm test`
Expected: PASS — 62개 테스트 모두 통과(누적 59개 + 신규 3개)

- [ ] **Step 5: 커밋**

```bash
git add lib/eligibility.ts lib/eligibility.test.ts
git commit -m "feat: 코어4개+니치3개 총7개 상품 집계 함수 checkAllProducts"
```

---

### Task 6: "특이사항" 단계에 니치 3종 자기신고 체크박스 추가

**Files:**
- Modify: `components/Questionnaire.tsx`

**Interfaces:**
- Consumes: 확장된 `Applicant` 타입(Task 2, `lib/eligibility.ts`에서 import — `selfReportedJeonseDamage`/`selfReportedRenewalExtension`/`selfReportedVulnerableHousing` 포함)
- Produces: `function Questionnaire({ onComplete }: { onComplete: (applicant: Applicant) => void })` — Task 7이 `app/page.tsx`에서 그대로 사용

이 태스크부터 `npm run build`가 다시 그린이어야 한다(Applicant를 완전히 채우는 컴포넌트로 갱신하기 때문).

- [ ] **Step 1: state 3개 추가**

`components/Questionnaire.tsx`의 기존 state 선언부(`const [hasDelinquencyHistory, setHasDelinquencyHistory] = useState(false)` 다음 줄)에 추가:
```typescript
  const [selfReportedJeonseDamage, setSelfReportedJeonseDamage] = useState(false)
  const [selfReportedRenewalExtension, setSelfReportedRenewalExtension] = useState(false)
  const [selfReportedVulnerableHousing, setSelfReportedVulnerableHousing] = useState(false)
```

- [ ] **Step 2: `onComplete` 호출 객체에 3개 필드 추가**

`goNext()` 안의 `onComplete({ ... })` 객체에서 `hasDelinquencyHistory,` 다음 줄에 추가:
```typescript
        hasDelinquencyHistory,
        selfReportedJeonseDamage,
        selfReportedRenewalExtension,
        selfReportedVulnerableHousing,
        age: Number(ageInput),
```
(즉 기존 `hasDelinquencyHistory,\n        age: Number(ageInput),` 두 줄 사이에 3줄을 끼워 넣는다)

- [ ] **Step 3: "특이사항"(`special`) 단계 JSX에 체크박스 3개 + 보조 설명 추가**

기존 `special` 단계 블록:
```typescript
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
```
를 아래 내용으로 교체(기존 3개 버튼은 그대로 두고 니치 3종 체크박스 + 보조 설명을 추가):
```typescript
      {step === 'special' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            해당하는 특이사항을 모두 선택해주세요
          </legend>
          <div className="flex flex-col gap-3">
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
            <div className="flex flex-col gap-1">
              <ToggleButton
                active={selfReportedJeonseDamage}
                onClick={() => setSelfReportedJeonseDamage((v) => !v)}
              >
                전세피해 임차인에 해당해요
              </ToggleButton>
              <p className="text-xs text-[#8A9099] px-1">
                전세사기피해 확인서 대상 여부는 관할 기관에서 최종 확인됩니다.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <ToggleButton
                active={selfReportedRenewalExtension}
                onClick={() => setSelfReportedRenewalExtension((v) => !v)}
              >
                갱신만료 임차인 지원 대상에 해당해요
              </ToggleButton>
              <p className="text-xs text-[#8A9099] px-1">
                지침 대상 여부는 관할 기관에서 최종 확인됩니다.
              </p>
            </div>
            <div className="flex flex-col gap-1">
              <ToggleButton
                active={selfReportedVulnerableHousing}
                onClick={() => setSelfReportedVulnerableHousing((v) => !v)}
              >
                주거취약계층 이주지원 대상에 해당해요
              </ToggleButton>
              <p className="text-xs text-[#8A9099] px-1">
                지침 대상 여부는 관할 기관에서 최종 확인됩니다.
              </p>
            </div>
          </div>
        </fieldset>
      )}
```

- [ ] **Step 4: 빌드로 타입 에러 확인**

Run: `npm run build`
Expected: 컴파일 에러 없음(`Questionnaire`가 완전한 `Applicant`를 생성하므로 빌드 그린)

- [ ] **Step 5: 커밋**

```bash
git add components/Questionnaire.tsx
git commit -m "feat: 특이사항 단계에 니치 3종 자기신고 체크박스 + 보조설명 추가"
```

---

### Task 7: ResultCard "비대상" 상태 + 페이지 조립(7개 상품) + 수동 검증

**Files:**
- Modify: `components/ResultCard.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `Questionnaire`(Task 6), `checkAllProducts`·`Applicant`·`EligibilityResult`(Task 5)
- Produces: 없음(최종 태스크, 페이지 조립)

- [ ] **Step 1: `ResultCard`에 비대상 상태 분기 추가**

`components/ResultCard.tsx` 전체를 다음 내용으로 교체:
```typescript
import type { EligibilityResult } from '@/lib/eligibility'

export function ResultCard({ result }: { result: EligibilityResult }) {
  if (!result.applicable) {
    return (
      <div className="bg-white rounded-xl border border-[#ECEFF2] p-4 opacity-60">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[#161B30]">{result.productName}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F5F6F7] text-[#8A9099]">
            비대상
          </span>
        </div>
        <p className="text-sm text-[#8A9099]">
          특이사항 단계에서 해당 항목을 선택하지 않아 판정하지 않았습니다.
        </p>
      </div>
    )
  }

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
    </div>
  )
}
```

- [ ] **Step 2: 페이지에서 `checkAllProducts` 사용**

`app/page.tsx`에서 import와 호출부를 교체:
```typescript
import { checkAllProducts, type Applicant, type EligibilityResult } from '@/lib/eligibility'
```
(기존 `import { checkAllCoreProducts, type Applicant, type EligibilityResult } from '@/lib/eligibility'` 줄을 위 내용으로 교체)

```typescript
  function handleComplete(applicant: Applicant) {
    setResults(checkAllProducts(applicant))
  }
```
(기존 `setResults(checkAllCoreProducts(applicant))` 줄을 위 내용으로 교체)

나머지 `app/page.tsx` 코드는 변경 없음(`results.map`으로 7개 카드를 그대로 렌더링).

- [ ] **Step 3: 빌드 확인**

Run: `npm run build`
Expected: `Compiled successfully`, 에러 없음

- [ ] **Step 4: 테스트 스위트 최종 확인**

Run: `npm test`
Expected: PASS — Task 1~5에서 작성한 62개 테스트 전부 통과 유지

- [ ] **Step 5: 개발 서버로 수동 확인**

Run: `npm run dev`(백그라운드 실행 후) → `http://localhost:3000` 접속

시나리오 A — 니치 3종 전부 체크 안 함: 11단계 입력 후 결과 화면에 상품 카드가 **7개** 표시되고, 니치 3개(전세피해/갱신만료/주거취약계층) 카드는 "비대상" 배지 + "선택하지 않아 판정하지 않았습니다" 문구가 표시됨.

시나리오 B — "특이사항" 단계에서 니치 3종을 전부 체크: 결과 화면에서 니치 3개 카드가 "자격 충족" 또는 "자격 미충족"(구체적 사유 포함)으로 정상 판정됨.

두 시나리오 모두 브라우저 개발자도구 Network 탭에서 XHR/fetch 요청이 발생하지 않음을 확인(서버 전송 없음 검증).

- [ ] **Step 6: 커밋**

```bash
git add components/ResultCard.tsx app/page.tsx
git commit -m "feat: 비대상 상태 렌더링 + 코어4+니치3 총7개 상품 결과화면 (issues.md #3)"
```

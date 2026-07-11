import { describe, it, expect } from 'vitest'
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

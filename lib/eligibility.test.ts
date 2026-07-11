import { describe, it, expect } from 'vitest'
import { checkBootmokGeneral, type Applicant } from './eligibility'

const baseApplicant: Applicant = {
  region: 'capital',
  areaSqm: 60,
  depositKrw: 250000000,
  annualIncomeKrw: 40000000,
  netAssetKrw: 100000000,
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
      region: 'capital',
      areaSqm: 90,
      depositKrw: 320000000,
      annualIncomeKrw: 52000000,
      netAssetKrw: 350000000,
    })
    expect(result.eligible).toBe(false)
    expect(result.reasons).toHaveLength(4)
  })
})

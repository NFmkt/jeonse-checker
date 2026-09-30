import { describe, it, expect } from 'vitest'
import bootmokGeneral from '@/data/products/bootmok-general.json'
import bootmokYouth from '@/data/products/bootmok-youth.json'
import bootmokNewlywed from '@/data/products/bootmok-newlywed.json'
import bootmokNewborn from '@/data/products/bootmok-newborn.json'
import bootmokJeonseDamage from '@/data/products/bootmok-jeonse-damage.json'
import bootmokRenewalExtension from '@/data/products/bootmok-renewal-extension.json'
import bootmokVulnerableHousing from '@/data/products/bootmok-vulnerable-housing.json'
import generalBankLoan from '@/data/products/general-bank-loan.json'
import { depositLimitReason } from './eligibility'
import { checkHouseConditions, type HouseConditionsResult } from './houseConditions'

const EOK = 100000000

function productOf(result: HouseConditionsResult, productId: string) {
  const found = result.products.find((p) => p.productId === productId)
  if (!found) throw new Error(`상품 없음: ${productId}`)
  return found
}

describe('checkHouseConditions: 대상 상품과 출처', () => {
  const result = checkHouseConditions({ depositKrw: EOK, areaSqm: 30, region: 'capital' })

  it('자기신고가 필요 없는 다섯 상품만 판정한다', () => {
    expect(result.products.map((p) => p.productId)).toEqual([
      bootmokGeneral.id,
      bootmokYouth.id,
      bootmokNewlywed.id,
      bootmokNewborn.id,
      generalBankLoan.id,
    ])
  })

  it('자기신고 상품 셋은 notEvaluated에 이름만 싣는다', () => {
    expect(result.notEvaluated).toEqual([
      { productId: bootmokJeonseDamage.id, productName: bootmokJeonseDamage.name },
      { productId: bootmokRenewalExtension.id, productName: bootmokRenewalExtension.name },
      { productId: bootmokVulnerableHousing.id, productName: bootmokVulnerableHousing.name },
    ])
    for (const p of result.products) {
      expect(result.notEvaluated.map((n) => n.productId)).not.toContain(p.productId)
    }
  })

  it('각 상품의 이름·출처·확인일을 JSON에서 그대로 싣는다', () => {
    const general = productOf(result, bootmokGeneral.id)
    expect(general.productName).toBe(bootmokGeneral.name)
    expect(general.sourceUrl).toBe(bootmokGeneral.sourceUrl)
    expect(general.verifiedAt).toBe(bootmokGeneral.verifiedAt)
    const bank = productOf(result, generalBankLoan.id)
    expect(bank.productName).toBe(generalBankLoan.name)
    expect(bank.sourceUrl).toBe(generalBankLoan.sourceUrl)
    expect(bank.verifiedAt).toBe(generalBankLoan.verifiedAt)
  })

  it('주택 유형은 확인하지 않았다고 밝힌다', () => {
    expect(result.housingTypeChecked).toBe(false)
  })
})

describe('checkHouseConditions: 보증금 경계', () => {
  it('수도권 버팀목 일반: 한도와 같으면 fit, 1원 넘으면 exceeds(사유는 기존 문자열)', () => {
    const limit = bootmokGeneral.depositLimitKrw.capital
    const at = checkHouseConditions({ depositKrw: limit, areaSqm: 60, region: 'capital' })
    expect(productOf(at, bootmokGeneral.id).status).toBe('fit')
    expect(productOf(at, bootmokGeneral.id).reasons).toEqual([])

    const over = checkHouseConditions({ depositKrw: limit + 1, areaSqm: 60, region: 'capital' })
    const general = productOf(over, bootmokGeneral.id)
    expect(general.status).toBe('exceeds')
    const expected = depositLimitReason(bootmokGeneral.depositLimitKrw, {
      depositKrw: limit + 1,
      region: 'capital',
    })
    expect(expected).toContain('수도권 한도')
    expect(general.reasons).toEqual([expected])
  })

  it('비수도권 버팀목 일반: 한도와 같으면 fit, 1원 넘으면 exceeds, 사유에 비수도권', () => {
    const limit = bootmokGeneral.depositLimitKrw.nonCapital
    const at = checkHouseConditions({ depositKrw: limit, areaSqm: 60, region: 'non-capital' })
    expect(productOf(at, bootmokGeneral.id).status).toBe('fit')
    const over = checkHouseConditions({ depositKrw: limit + 1, areaSqm: 60, region: 'non-capital' })
    const general = productOf(over, bootmokGeneral.id)
    expect(general.status).toBe('exceeds')
    expect(general.reasons[0]).toContain('비수도권 한도')
  })

  it('지역이 필요 없는 청년전용 단일 한도는 지역 null이어도 경계를 판정한다', () => {
    const limit = bootmokYouth.depositLimitKrw
    const at = checkHouseConditions({ depositKrw: limit, areaSqm: 30, region: null })
    expect(productOf(at, bootmokYouth.id).status).toBe('fit')
    const over = checkHouseConditions({ depositKrw: limit + 1, areaSqm: 30, region: null })
    expect(productOf(over, bootmokYouth.id).status).toBe('exceeds')
    expect(productOf(over, bootmokYouth.id).reasons[0]).toContain('전세보증금')
  })

  it('신혼·신생아·시중은행도 각자 JSON 한도로 경계를 판정한다', () => {
    const cases: Array<[string, { capital: number; nonCapital: number }]> = [
      [bootmokNewlywed.id, bootmokNewlywed.depositLimitKrw],
      [bootmokNewborn.id, bootmokNewborn.depositLimitKrw],
      [generalBankLoan.id, generalBankLoan.depositLimitKrw],
    ]
    for (const [id, limit] of cases) {
      for (const region of ['capital', 'non-capital'] as const) {
        const value = region === 'capital' ? limit.capital : limit.nonCapital
        const at = checkHouseConditions({ depositKrw: value, areaSqm: 30, region })
        expect(productOf(at, id).status).toBe('fit')
        const over = checkHouseConditions({ depositKrw: value + 1, areaSqm: 30, region })
        expect(productOf(over, id).status).toBe('exceeds')
      }
    }
  })
})

describe('checkHouseConditions: 전용면적 경계', () => {
  it('버팀목 일반: 한도와 같으면 fit, 넘으면 exceeds(사유는 기존 문자열)', () => {
    const limit = bootmokGeneral.areaLimitSqm
    const at = checkHouseConditions({ depositKrw: EOK, areaSqm: limit, region: 'capital' })
    expect(productOf(at, bootmokGeneral.id).status).toBe('fit')
    const over = checkHouseConditions({ depositKrw: EOK, areaSqm: limit + 0.1, region: 'capital' })
    const general = productOf(over, bootmokGeneral.id)
    expect(general.status).toBe('exceeds')
    expect(general.reasons).toEqual([`전용면적 ${limit + 0.1}㎡로 한도 ${limit}㎡ 초과`])
  })

  it('시중은행 일반전세대출은 면적 한도가 없어 면적이 커도 fit', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: 200, region: 'capital' })
    expect(productOf(r, generalBankLoan.id).status).toBe('fit')
  })

  it('신혼·신생아는 면적 한도를 JSON에서 읽는다', () => {
    for (const rule of [bootmokNewlywed, bootmokNewborn]) {
      const at = checkHouseConditions({
        depositKrw: EOK,
        areaSqm: rule.areaLimitSqm,
        region: 'capital',
      })
      expect(productOf(at, rule.id).status).toBe('fit')
      const over = checkHouseConditions({
        depositKrw: EOK,
        areaSqm: rule.areaLimitSqm + 0.1,
        region: 'capital',
      })
      expect(productOf(over, rule.id).status).toBe('exceeds')
    }
  })
})

describe('checkHouseConditions: 청년전용 depends 구간', () => {
  const solo = bootmokYouth.areaLimitSqmUnder25Solo
  const full = bootmokYouth.areaLimitSqm

  it('단독세대주 한도 이하면 fit', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: solo, region: 'capital' })
    expect(productOf(r, bootmokYouth.id).status).toBe('fit')
  })

  it('단독세대주 한도 초과, 일반 한도 이하면 depends와 고정 사유', () => {
    for (const area of [solo + 0.1, full]) {
      const r = checkHouseConditions({ depositKrw: EOK, areaSqm: area, region: 'capital' })
      const youth = productOf(r, bootmokYouth.id)
      expect(youth.status).toBe('depends')
      expect(youth.reasons).toEqual([`만 25세 미만 단독세대주는 전용면적 ${solo}㎡ 이하만 돼요`])
    }
  })

  it('일반 한도 초과면 exceeds', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: full + 0.1, region: 'capital' })
    expect(productOf(r, bootmokYouth.id).status).toBe('exceeds')
  })

  it('보증금이 한도를 넘으면 면적이 depends 구간이어도 exceeds', () => {
    const r = checkHouseConditions({
      depositKrw: bootmokYouth.depositLimitKrw + 1,
      areaSqm: solo + 1,
      region: 'capital',
    })
    expect(productOf(r, bootmokYouth.id).status).toBe('exceeds')
  })
})

describe('checkHouseConditions: 집 값이 없을 때 unknown', () => {
  it('면적 null이면 면적 한도가 있는 상품만 unknown, 시중은행은 판정한다', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: null, region: 'capital' })
    for (const id of [bootmokGeneral.id, bootmokYouth.id, bootmokNewlywed.id, bootmokNewborn.id]) {
      expect(productOf(r, id).status).toBe('unknown')
      expect(productOf(r, id).reasons.length).toBeGreaterThan(0)
    }
    expect(productOf(r, generalBankLoan.id).status).toBe('fit')
  })

  it('지역 null이면 지역별 한도 상품만 unknown, 청년전용은 판정한다', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: 30, region: null })
    for (const id of [bootmokGeneral.id, bootmokNewlywed.id, bootmokNewborn.id, generalBankLoan.id]) {
      expect(productOf(r, id).status).toBe('unknown')
      expect(productOf(r, id).reasons.length).toBeGreaterThan(0)
    }
    expect(productOf(r, bootmokYouth.id).status).toBe('fit')
  })

  it('unknown 상품에도 출처와 확인일을 싣는다', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: null, region: null })
    const general = productOf(r, bootmokGeneral.id)
    expect(general.sourceUrl).toBe(bootmokGeneral.sourceUrl)
    expect(general.verifiedAt).toBe(bootmokGeneral.verifiedAt)
  })
})

describe('checkHouseConditions: 요약', () => {
  it('판정된 상품이 없으면 unknown', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: null, region: null })
    expect(r.products.every((p) => p.status === 'unknown')).toBe(true)
    expect(r.summary).toBe('unknown')
  })

  it('전부 exceeds면 exceeds', () => {
    const deposit = generalBankLoan.depositLimitKrw.capital + 1
    const r = checkHouseConditions({ depositKrw: deposit, areaSqm: 30, region: 'capital' })
    expect(r.products.every((p) => p.status === 'exceeds')).toBe(true)
    expect(r.summary).toBe('exceeds')
  })

  it('전부 fit면 fit', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: 30, region: 'capital' })
    expect(r.products.every((p) => p.status === 'fit')).toBe(true)
    expect(r.summary).toBe('fit')
  })

  it('일부만 맞으면 partial', () => {
    const deposit = bootmokGeneral.depositLimitKrw.capital + 1
    const r = checkHouseConditions({ depositKrw: deposit, areaSqm: 30, region: 'capital' })
    expect(productOf(r, bootmokGeneral.id).status).toBe('exceeds')
    expect(productOf(r, generalBankLoan.id).status).toBe('fit')
    expect(r.summary).toBe('partial')
  })

  it('fit 상품 옆에 unknown이 있으면 fit이라 하지 않고 partial', () => {
    const r = checkHouseConditions({ depositKrw: EOK, areaSqm: null, region: 'capital' })
    expect(productOf(r, generalBankLoan.id).status).toBe('fit')
    expect(r.summary).toBe('partial')
  })

  it('depends가 섞이면 partial', () => {
    const r = checkHouseConditions({
      depositKrw: EOK,
      areaSqm: bootmokYouth.areaLimitSqmUnder25Solo + 1,
      region: 'capital',
    })
    expect(productOf(r, bootmokYouth.id).status).toBe('depends')
    expect(r.summary).toBe('partial')
  })
})

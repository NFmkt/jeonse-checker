import bootmokGeneral from '@/data/products/bootmok-general.json'
import bootmokYouth from '@/data/products/bootmok-youth.json'
import bootmokNewlywed from '@/data/products/bootmok-newlywed.json'
import bootmokNewborn from '@/data/products/bootmok-newborn.json'
import bootmokJeonseDamage from '@/data/products/bootmok-jeonse-damage.json'
import bootmokRenewalExtension from '@/data/products/bootmok-renewal-extension.json'
import bootmokVulnerableHousing from '@/data/products/bootmok-vulnerable-housing.json'
import generalBankLoan from '@/data/products/general-bank-loan.json'
import { areaLimitReason, depositLimitReason, type Applicant } from './eligibility'

/** 집 조건(사람이 아니라 집에 붙는 값)만. 나이·소득·자산 같은 개인 조건은 판정하지 않는다. */
export type HouseInput = {
  depositKrw: number
  areaSqm: number | null
  region: Applicant['region'] | null
}

/**
 * fit: 집 조건이 한도 안. exceeds: 한도 초과. depends: 개인 조건에 따라 달라짐.
 * unknown: 판정에 필요한 집 값(면적·지역)이 없음.
 */
export type HouseConditionStatus = 'fit' | 'exceeds' | 'depends' | 'unknown'

export type HouseConditionProduct = {
  productId: string
  productName: string
  status: HouseConditionStatus
  reasons: string[]
  sourceUrl: string
  verifiedAt: string
}

export type HouseConditionsSummary = 'fit' | 'exceeds' | 'partial' | 'unknown'

export type HouseConditionsResult = {
  summary: HouseConditionsSummary
  /** 주택 유형(아파트·다세대·오피스텔 등)은 규칙 데이터에 조건이 없어 판정하지 않는다. */
  housingTypeChecked: false
  products: HouseConditionProduct[]
  /** 자기신고가 필요한 상품. 집 조건만으로는 판정하지 않고 이름만 싣는다. */
  notEvaluated: Array<{ productId: string; productName: string }>
}

type HouseRule = {
  id: string
  name: string
  sourceUrl: string
  verifiedAt: string
  depositLimitKrw: number | { capital: number; nonCapital: number }
  areaLimitSqm?: number
  areaLimitSqmUnder25Solo?: number
}

// 자기신고 없이 집 조건만으로 볼 수 있는 상품. 한도 값은 각 JSON에서만 읽는다.
const HOUSE_RULES: HouseRule[] = [
  bootmokGeneral,
  bootmokYouth,
  bootmokNewlywed,
  bootmokNewborn,
  generalBankLoan,
]

// 자기신고가 있어야 대상 여부를 알 수 있는 상품.
const SELF_REPORT_RULES = [bootmokJeonseDamage, bootmokRenewalExtension, bootmokVulnerableHousing]

function evaluate(rule: HouseRule, house: HouseInput): HouseConditionProduct {
  const base = {
    productId: rule.id,
    productName: rule.name,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
  }

  const regional = typeof rule.depositLimitKrw !== 'number'
  const hasAreaLimit = rule.areaLimitSqm !== undefined

  const missing: string[] = []
  if (regional && house.region === null) missing.push('지역 정보가 없어 판정할 수 없어요')
  if (hasAreaLimit && house.areaSqm === null) missing.push('전용면적 정보가 없어 판정할 수 없어요')
  if (missing.length > 0) return { ...base, status: 'unknown', reasons: missing }

  // 위에서 필요한 값이 있는지 확인했으므로, 필요 없는 값은 쓰이지 않는다.
  const region = house.region ?? 'non-capital'
  const areaSqm = house.areaSqm ?? 0

  const exceeded: string[] = []
  const depositReason = depositLimitReason(rule.depositLimitKrw, { depositKrw: house.depositKrw, region })
  if (depositReason) exceeded.push(depositReason)
  if (rule.areaLimitSqm !== undefined) {
    const areaReason = areaLimitReason({ areaLimitSqm: rule.areaLimitSqm }, { areaSqm })
    if (areaReason) exceeded.push(areaReason)
  }
  if (exceeded.length > 0) return { ...base, status: 'exceeds', reasons: exceeded }

  // 청년전용: 만 25세 미만 단독세대주는 더 좁은 면적 한도가 적용된다. 나이·세대 구성은 모르므로 depends.
  const soloLimit = rule.areaLimitSqmUnder25Solo
  if (soloLimit !== undefined && areaSqm > soloLimit) {
    return {
      ...base,
      status: 'depends',
      reasons: [`만 25세 미만 단독세대주는 전용면적 ${soloLimit}㎡ 이하만 돼요`],
    }
  }

  return { ...base, status: 'fit', reasons: [] }
}

function summarize(products: HouseConditionProduct[]): HouseConditionsSummary {
  const judged = products.filter((p) => p.status !== 'unknown')
  if (judged.length === 0) return 'unknown'
  if (products.every((p) => p.status === 'exceeds')) return 'exceeds'
  if (products.every((p) => p.status === 'fit')) return 'fit'
  return 'partial'
}

export function checkHouseConditions(house: HouseInput): HouseConditionsResult {
  const products = HOUSE_RULES.map((rule) => evaluate(rule, house))
  return {
    summary: summarize(products),
    housingTypeChecked: false,
    products,
    notEvaluated: SELF_REPORT_RULES.map((rule) => ({ productId: rule.id, productName: rule.name })),
  }
}

import bootmokGeneral from '@/data/products/bootmok-general.json'
import bootmokYouth from '@/data/products/bootmok-youth.json'
import bootmokNewlywed from '@/data/products/bootmok-newlywed.json'
import bootmokNewborn from '@/data/products/bootmok-newborn.json'
import bootmokJeonseDamage from '@/data/products/bootmok-jeonse-damage.json'
import bootmokRenewalExtension from '@/data/products/bootmok-renewal-extension.json'
import bootmokVulnerableHousing from '@/data/products/bootmok-vulnerable-housing.json'
import generalBankLoan from '@/data/products/general-bank-loan.json'

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
  selfReportedJeonseDamage: boolean
  selfReportedRenewalExtension: boolean
  selfReportedVulnerableHousing: boolean
}

export type EligibilityResult = {
  productId: string
  productName: string
  eligible: boolean
  reasons: string[]
  applicable: boolean
  loanLimitText: string[]
  rateRangeText: string[]
  sourceUrl: string
  verifiedAt: string
  bankList?: string[]
}

function formatEok(krw: number): string {
  return `${(krw / 100000000).toFixed(2).replace(/\.?0+$/, '')}억원`
}

function formatManwon(krw: number): string {
  return `${Math.round(krw / 10000).toLocaleString()}만원`
}

/**
 * 보증금 한도 비교. 한도는 상품 JSON의 depositLimitKrw 그대로(단일 값 또는 수도권/비수도권).
 * 초과가 아니면 null. 사유 문자열은 checkXxx와 집 조건 판정(lib/houseConditions.ts)이 함께 쓴다.
 */
export function depositLimitReason(
  limit: number | { capital: number; nonCapital: number },
  house: Pick<Applicant, 'depositKrw' | 'region'>
): string | null {
  if (typeof limit === 'number') {
    if (house.depositKrw > limit) {
      return `전세보증금 ${formatEok(house.depositKrw)}으로 한도 ${formatEok(limit)} 초과`
    }
    return null
  }
  const regionLimit = house.region === 'capital' ? limit.capital : limit.nonCapital
  if (house.depositKrw > regionLimit) {
    const regionLabel = house.region === 'capital' ? '수도권' : '비수도권'
    return `전세보증금 ${formatEok(house.depositKrw)}으로 ${regionLabel} 한도 ${formatEok(regionLimit)} 초과`
  }
  return null
}

/** 주거취약계층 상품의 보증금 한도 비교(공공임대/민간임대 구분, 만원 단위 표기). */
export function vulnerableDepositLimitReason(
  limit: { publicHousing: number; privateHousing: number },
  house: Pick<Applicant, 'depositKrw' | 'housingOwnership'>
): string | null {
  const isPublicHousing = house.housingOwnership === 'public-rental'
  const depositLimit = isPublicHousing ? limit.publicHousing : limit.privateHousing
  if (house.depositKrw > depositLimit) {
    const housingLabel = isPublicHousing ? '공공임대' : '민간임대'
    return `전세보증금 ${formatManwon(house.depositKrw)}으로 ${housingLabel} 한도 ${formatManwon(depositLimit)} 초과`
  }
  return null
}

/**
 * 전용면적 한도 비교. options.under25Solo가 true이고 상품에 areaLimitSqmUnder25Solo가 있으면
 * 그 한도를 쓴다(청년전용의 만 25세 미만 단독세대주 예외). 초과가 아니면 null.
 */
export function areaLimitReason(
  rule: { areaLimitSqm: number; areaLimitSqmUnder25Solo?: number },
  house: Pick<Applicant, 'areaSqm'>,
  options: { under25Solo?: boolean } = {}
): string | null {
  const limit =
    options.under25Solo && rule.areaLimitSqmUnder25Solo !== undefined
      ? rule.areaLimitSqmUnder25Solo
      : rule.areaLimitSqm
  if (house.areaSqm > limit) {
    return `전용면적 ${house.areaSqm}㎡로 한도 ${limit}㎡ 초과`
  }
  return null
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

  const areaReason = areaLimitReason(rule, applicant)
  if (areaReason) reasons.push(areaReason)

  const depositReason = depositLimitReason(rule.depositLimitKrw, applicant)
  if (depositReason) reasons.push(depositReason)

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
    bankList: rule.bankList,
  }
}

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

  const areaReason = areaLimitReason(rule, applicant, { under25Solo: applicant.age < 25 })
  if (areaReason) reasons.push(areaReason)

  const depositReason = depositLimitReason(rule.depositLimitKrw, applicant)
  if (depositReason) reasons.push(depositReason)

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
    bankList: rule.bankList,
  }
}

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

  const depositReason = depositLimitReason(rule.depositLimitKrw, applicant)
  if (depositReason) reasons.push(depositReason)

  const areaReason = areaLimitReason(rule, applicant)
  if (areaReason) reasons.push(areaReason)

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
    bankList: rule.bankList,
  }
}

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

  const depositReason = depositLimitReason(rule.depositLimitKrw, applicant)
  if (depositReason) reasons.push(depositReason)

  const areaReason = areaLimitReason(rule, applicant)
  if (areaReason) reasons.push(areaReason)

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
    bankList: rule.bankList,
  }
}

export function checkAllCoreProducts(applicant: Applicant): EligibilityResult[] {
  return [
    checkBootmokGeneral(applicant),
    checkBootmokYouth(applicant),
    checkBootmokNewlywed(applicant),
    checkBootmokNewborn(applicant),
  ]
}

export function checkJeonseDamage(applicant: Applicant): EligibilityResult {
  const rule = bootmokJeonseDamage

  if (!applicant.selfReportedJeonseDamage) {
    return {
      productId: rule.id,
      productName: rule.name,
      eligible: false,
      reasons: [],
      applicable: false,
      loanLimitText: [],
      rateRangeText: [],
      sourceUrl: '',
      verifiedAt: '',
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

  const depositReason = depositLimitReason(rule.depositLimitKrw, applicant)
  if (depositReason) reasons.push(depositReason)

  const areaReason = areaLimitReason(rule, applicant)
  if (areaReason) reasons.push(areaReason)

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
    bankList: rule.bankList,
  }
}

export function checkRenewalExtension(applicant: Applicant): EligibilityResult {
  const rule = bootmokRenewalExtension

  if (!applicant.selfReportedRenewalExtension) {
    return {
      productId: rule.id,
      productName: rule.name,
      eligible: false,
      reasons: [],
      applicable: false,
      loanLimitText: [],
      rateRangeText: [],
      sourceUrl: '',
      verifiedAt: '',
    }
  }

  const reasons: string[] = []

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

  const depositReason = depositLimitReason(rule.depositLimitKrw, applicant)
  if (depositReason) reasons.push(depositReason)

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
    bankList: rule.bankList,
  }
}

export function checkVulnerableHousing(applicant: Applicant): EligibilityResult {
  const rule = bootmokVulnerableHousing

  if (!applicant.selfReportedVulnerableHousing) {
    return {
      productId: rule.id,
      productName: rule.name,
      eligible: false,
      reasons: [],
      applicable: false,
      loanLimitText: [],
      rateRangeText: [],
      sourceUrl: '',
      verifiedAt: '',
    }
  }

  const reasons: string[] = []

  const housingReason = checkHousingOwnership(applicant)
  if (housingReason) reasons.push(housingReason)

  const depositReason = vulnerableDepositLimitReason(rule.depositLimitKrw, applicant)
  if (depositReason) reasons.push(depositReason)

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
    bankList: rule.bankList,
  }
}

export function checkGeneralBankLoan(applicant: Applicant): EligibilityResult {
  const reasons: string[] = []
  const rule = generalBankLoan

  if (applicant.housingOwnership === 'multi-house') {
    reasons.push('본인 및 배우자 합산 1주택 이내 요건 미충족(2주택 이상 보유)')
  }

  const depositReason = depositLimitReason(rule.depositLimitKrw, applicant)
  if (depositReason) reasons.push(depositReason)

  return {
    productId: rule.id,
    productName: rule.name,
    eligible: reasons.length === 0,
    reasons,
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
    sourceUrl: rule.sourceUrl,
    verifiedAt: rule.verifiedAt,
  }
}

export function checkAllProducts(applicant: Applicant): EligibilityResult[] {
  return [
    ...checkAllCoreProducts(applicant),
    checkJeonseDamage(applicant),
    checkRenewalExtension(applicant),
    checkVulnerableHousing(applicant),
    checkGeneralBankLoan(applicant),
  ]
}

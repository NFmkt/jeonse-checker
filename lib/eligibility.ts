import bootmokGeneral from '@/data/products/bootmok-general.json'
import bootmokYouth from '@/data/products/bootmok-youth.json'
import bootmokNewlywed from '@/data/products/bootmok-newlywed.json'
import bootmokNewborn from '@/data/products/bootmok-newborn.json'
import bootmokJeonseDamage from '@/data/products/bootmok-jeonse-damage.json'
import bootmokRenewalExtension from '@/data/products/bootmok-renewal-extension.json'
import bootmokVulnerableHousing from '@/data/products/bootmok-vulnerable-housing.json'

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
  loanLimitText: string
  rateRangeText: string
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
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
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
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
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
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
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
    applicable: true,
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
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
      loanLimitText: '',
      rateRangeText: '',
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
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
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
      loanLimitText: '',
      rateRangeText: '',
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
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
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
      loanLimitText: '',
      rateRangeText: '',
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
    loanLimitText: rule.loanLimitText,
    rateRangeText: rule.rateRangeText,
  }
}

export function checkAllProducts(applicant: Applicant): EligibilityResult[] {
  return [
    ...checkAllCoreProducts(applicant),
    checkJeonseDamage(applicant),
    checkRenewalExtension(applicant),
    checkVulnerableHousing(applicant),
  ]
}

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

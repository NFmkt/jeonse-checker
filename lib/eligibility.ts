import bootmokGeneral from '@/data/products/bootmok-general.json'

export type Applicant = {
  region: 'capital' | 'non-capital'
  areaSqm: number
  depositKrw: number
  annualIncomeKrw: number
  netAssetKrw: number
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

export function checkBootmokGeneral(applicant: Applicant): EligibilityResult {
  const reasons: string[] = []
  const rule = bootmokGeneral

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

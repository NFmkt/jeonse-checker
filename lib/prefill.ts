import type { Applicant } from '@/lib/eligibility'

// 쿼리스트링으로 문답 초기값을 채우는 순수 파서.
// 계약: deposit = 전세보증금(원 단위 정수 문자열), region = 'capital' | 'non-capital',
// area = 전용면적(㎡, 정수). 유효하지 않은 값은 조용히 무시한다(클램프/추측 없음).
// 아래 범위 상수가 유일한 출처이며 Questionnaire의 RangeSlider도 이 상수를 import해 그대로 쓴다.
// 숫자 문자열은 선행 0 없는 정규 정수 표기만 허용한다("0150000000"은 무시).

export const DEPOSIT_MANWON_RANGE = { min: 3000, max: 60000, step: 100 } as const
export const AREA_SQM_RANGE = { min: 20, max: 120, step: 1 } as const

export type Prefill = {
  depositManwon?: number
  region?: Applicant['region']
  areaSqm?: number
}

export type RawSearchParams = Record<string, string | string[] | undefined>

const WON_PER_MANWON = 10000

function parseDigits(raw: string | string[] | undefined): number | null {
  if (typeof raw !== 'string' || !/^(0|[1-9]\d*)$/.test(raw)) return null
  const n = Number(raw)
  return Number.isSafeInteger(n) ? n : null
}

function parseDeposit(raw: string | string[] | undefined): number | undefined {
  const won = parseDigits(raw)
  if (won === null || won % WON_PER_MANWON !== 0) return undefined
  const manwon = won / WON_PER_MANWON
  const { min, max, step } = DEPOSIT_MANWON_RANGE
  if (manwon < min || manwon > max || (manwon - min) % step !== 0) return undefined
  return manwon
}

function parseArea(raw: string | string[] | undefined): number | undefined {
  const n = parseDigits(raw)
  if (n === null) return undefined
  const { min, max } = AREA_SQM_RANGE
  return n >= min && n <= max ? n : undefined
}

function parseRegion(raw: string | string[] | undefined): Applicant['region'] | undefined {
  return raw === 'capital' || raw === 'non-capital' ? raw : undefined
}

export function parsePrefill(params: RawSearchParams): Prefill {
  const result: Prefill = {}
  const depositManwon = parseDeposit(params.deposit)
  if (depositManwon !== undefined) result.depositManwon = depositManwon
  const region = parseRegion(params.region)
  if (region !== undefined) result.region = region
  const areaSqm = parseArea(params.area)
  if (areaSqm !== undefined) result.areaSqm = areaSqm
  return result
}

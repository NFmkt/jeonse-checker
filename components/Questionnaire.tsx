'use client'

import { useState } from 'react'
import type { Applicant } from '@/lib/eligibility'

type Props = {
  onComplete: (applicant: Applicant) => void
}

const STEPS = [
  'houseDecided',
  'region',
  'area',
  'deposit',
  'housing',
  'household',
  'income',
  'asset',
  'existingLoan',
  'special',
  'age',
] as const
type Step = (typeof STEPS)[number]

function ToggleButton({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-9 px-4 rounded-full text-sm font-semibold transition-colors ${
        active ? 'bg-[#25B9B9] text-white' : 'bg-[#F5F6F7] text-[#555B61]'
      }`}
    >
      {children}
    </button>
  )
}

export function Questionnaire({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [houseDecided, setHouseDecided] = useState<boolean | null>(null)
  const [region, setRegion] = useState<Applicant['region'] | null>(null)
  const [areaSqm, setAreaSqm] = useState('')
  const [depositManwon, setDepositManwon] = useState('')
  const [housingOwnership, setHousingOwnership] = useState<Applicant['housingOwnership'] | null>(null)
  const [isNewlywed, setIsNewlywed] = useState(false)
  const [hasChildrenTwoOrMore, setHasChildrenTwoOrMore] = useState(false)
  const [hasNewbornWithin2Years, setHasNewbornWithin2Years] = useState(false)
  const [isDualIncome, setIsDualIncome] = useState(false)
  const [annualIncomeManwon, setAnnualIncomeManwon] = useState('')
  const [netAssetManwon, setNetAssetManwon] = useState('')
  const [hasExistingLoan, setHasExistingLoan] = useState(false)
  const [isSmeEmployeeOrFounder, setIsSmeEmployeeOrFounder] = useState(false)
  const [isInnovationCityOrRedevelopment, setIsInnovationCityOrRedevelopment] = useState(false)
  const [hasDelinquencyHistory, setHasDelinquencyHistory] = useState(false)
  const [ageInput, setAgeInput] = useState('')

  const step: Step = STEPS[stepIndex]

  function goNext() {
    if (stepIndex === STEPS.length - 1) {
      onComplete({
        houseDecided: houseDecided ?? true,
        region: region ?? 'capital',
        areaSqm: Number(areaSqm),
        depositKrw: Number(depositManwon) * 10000,
        housingOwnership: housingOwnership ?? 'none',
        isNewlywed,
        hasChildrenTwoOrMore,
        hasNewbornWithin2Years,
        isDualIncome,
        annualIncomeKrw: Number(annualIncomeManwon) * 10000,
        netAssetKrw: Number(netAssetManwon) * 10000,
        hasExistingLoan,
        isSmeEmployeeOrFounder,
        isInnovationCityOrRedevelopment,
        hasDelinquencyHistory,
        age: Number(ageInput),
      })
      return
    }
    setStepIndex((i) => i + 1)
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  const canProceed =
    (step === 'houseDecided' && houseDecided !== null) ||
    (step === 'region' && region !== null) ||
    (step === 'area' && areaSqm !== '') ||
    (step === 'deposit' && depositManwon !== '') ||
    (step === 'housing' && housingOwnership !== null) ||
    step === 'household' ||
    (step === 'income' && annualIncomeManwon !== '') ||
    (step === 'asset' && netAssetManwon !== '') ||
    step === 'existingLoan' ||
    step === 'special' ||
    (step === 'age' && ageInput !== '')

  return (
    <div className="max-w-[480px] mx-auto px-4 py-8">
      {step === 'houseDecided' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            이사할 집을 결정하셨나요?
          </legend>
          <div className="flex gap-2">
            <ToggleButton active={houseDecided === true} onClick={() => setHouseDecided(true)}>
              결정했어요
            </ToggleButton>
            <ToggleButton active={houseDecided === false} onClick={() => setHouseDecided(false)}>
              나중에 결정
            </ToggleButton>
          </div>
        </fieldset>
      )}

      {step === 'region' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            이사할 집은 어느 지역에 있나요?
          </legend>
          <div className="flex gap-2">
            {(['capital', 'non-capital'] as const).map((value) => (
              <ToggleButton key={value} active={region === value} onClick={() => setRegion(value)}>
                {value === 'capital' ? '수도권' : '비수도권'}
              </ToggleButton>
            ))}
          </div>
        </fieldset>
      )}

      {step === 'area' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            전용면적은 몇 ㎡인가요?
          </legend>
          <input
            type="number"
            value={areaSqm}
            onChange={(e) => setAreaSqm(e.target.value)}
            placeholder="예: 59"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      {step === 'deposit' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            전세보증금은 얼마인가요? (만원 단위)
          </legend>
          <input
            type="number"
            value={depositManwon}
            onChange={(e) => setDepositManwon(e.target.value)}
            placeholder="예: 25000"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      {step === 'housing' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            현재 주택 소유 상태는 어떻게 되나요?
          </legend>
          <div className="flex flex-wrap gap-2">
            {(
              [
                ['none', '무주택'],
                ['public-rental', '공공임대 거주 중'],
                ['one-house', '1주택'],
                ['multi-house', '2주택 이상'],
              ] as const
            ).map(([value, label]) => (
              <ToggleButton
                key={value}
                active={housingOwnership === value}
                onClick={() => setHousingOwnership(value)}
              >
                {label}
              </ToggleButton>
            ))}
          </div>
        </fieldset>
      )}

      {step === 'household' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            해당하는 항목을 모두 선택해주세요
          </legend>
          <div className="flex flex-col gap-2">
            <ToggleButton active={isNewlywed} onClick={() => setIsNewlywed((v) => !v)}>
              신혼부부(혼인 7년 이내 또는 3개월 내 결혼예정)
            </ToggleButton>
            <ToggleButton
              active={hasChildrenTwoOrMore}
              onClick={() => setHasChildrenTwoOrMore((v) => !v)}
            >
              자녀 2명 이상
            </ToggleButton>
            <ToggleButton
              active={hasNewbornWithin2Years}
              onClick={() => setHasNewbornWithin2Years((v) => !v)}
            >
              2년 내 출산·입양
            </ToggleButton>
            <ToggleButton active={isDualIncome} onClick={() => setIsDualIncome((v) => !v)}>
              맞벌이 가구
            </ToggleButton>
          </div>
        </fieldset>
      )}

      {step === 'income' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            부부합산 연소득은 얼마인가요? (만원 단위)
          </legend>
          <input
            type="number"
            value={annualIncomeManwon}
            onChange={(e) => setAnnualIncomeManwon(e.target.value)}
            placeholder="예: 4500"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      {step === 'asset' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            순자산은 얼마인가요? (만원 단위)
          </legend>
          <input
            type="number"
            value={netAssetManwon}
            onChange={(e) => setNetAssetManwon(e.target.value)}
            placeholder="예: 10000"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      {step === 'existingLoan' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            현재 보유 중인 대출이 있나요?
          </legend>
          <div className="flex gap-2">
            <ToggleButton active={!hasExistingLoan} onClick={() => setHasExistingLoan(false)}>
              없음
            </ToggleButton>
            <ToggleButton active={hasExistingLoan} onClick={() => setHasExistingLoan(true)}>
              있음
            </ToggleButton>
          </div>
        </fieldset>
      )}

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

      {step === 'age' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">나이(만 나이)를 입력해주세요</legend>
          <input
            type="number"
            value={ageInput}
            onChange={(e) => setAgeInput(e.target.value)}
            placeholder="예: 32"
            className="w-full h-11 px-3 rounded-lg border border-[#ECEFF2]"
          />
        </fieldset>
      )}

      <div className="flex gap-2 mt-6">
        {stepIndex > 0 && (
          <button
            type="button"
            onClick={goBack}
            className="h-11 px-4 rounded-full text-sm font-semibold bg-[#F5F6F7] text-[#555B61]"
          >
            이전
          </button>
        )}
        <button
          type="button"
          onClick={goNext}
          disabled={!canProceed}
          className="h-11 px-6 rounded-full text-sm font-semibold bg-[#25B9B9] text-white disabled:opacity-40"
        >
          {stepIndex === STEPS.length - 1 ? '결과 보기' : '다음'}
        </button>
      </div>
    </div>
  )
}

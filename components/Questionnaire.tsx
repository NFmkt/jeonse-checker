'use client'

import { useState } from 'react'
import type { Applicant } from '@/lib/eligibility'

type Props = {
  onComplete: (applicant: Applicant) => void
}

const STEPS = ['region', 'area', 'deposit', 'income', 'asset'] as const
type Step = (typeof STEPS)[number]

export function Questionnaire({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [region, setRegion] = useState<Applicant['region'] | null>(null)
  const [areaSqm, setAreaSqm] = useState('')
  const [depositManwon, setDepositManwon] = useState('')
  const [annualIncomeManwon, setAnnualIncomeManwon] = useState('')
  const [netAssetManwon, setNetAssetManwon] = useState('')

  const step: Step = STEPS[stepIndex]

  function goNext() {
    if (stepIndex === STEPS.length - 1) {
      onComplete({
        region: region ?? 'capital',
        areaSqm: Number(areaSqm),
        depositKrw: Number(depositManwon) * 10000,
        annualIncomeKrw: Number(annualIncomeManwon) * 10000,
        netAssetKrw: Number(netAssetManwon) * 10000,
      })
      return
    }
    setStepIndex((i) => i + 1)
  }

  function goBack() {
    setStepIndex((i) => Math.max(0, i - 1))
  }

  const canProceed =
    (step === 'region' && region !== null) ||
    (step === 'area' && areaSqm !== '') ||
    (step === 'deposit' && depositManwon !== '') ||
    (step === 'income' && annualIncomeManwon !== '') ||
    (step === 'asset' && netAssetManwon !== '')

  return (
    <div className="max-w-[480px] mx-auto px-4 py-8">
      {step === 'region' && (
        <fieldset>
          <legend className="text-lg font-semibold text-[#161B30] mb-4">
            이사할 집은 어느 지역에 있나요?
          </legend>
          <div className="flex gap-2">
            {(['capital', 'non-capital'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setRegion(value)}
                className={`h-9 px-4 rounded-full text-sm font-semibold transition-colors ${
                  region === value ? 'bg-[#25B9B9] text-white' : 'bg-[#F5F6F7] text-[#555B61]'
                }`}
              >
                {value === 'capital' ? '수도권' : '비수도권'}
              </button>
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

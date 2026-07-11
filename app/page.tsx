'use client'

import { useState } from 'react'
import { Questionnaire } from '@/components/Questionnaire'
import { ResultCard } from '@/components/ResultCard'
import { checkBootmokGeneral, type Applicant, type EligibilityResult } from '@/lib/eligibility'

export default function Home() {
  const [result, setResult] = useState<EligibilityResult | null>(null)

  function handleComplete(applicant: Applicant) {
    setResult(checkBootmokGeneral(applicant))
  }

  return (
    <main className="min-h-screen bg-[#F5F6F7]">
      {result ? (
        <div className="max-w-[480px] mx-auto px-4 py-8">
          <ResultCard result={result} />
          <button
            type="button"
            onClick={() => setResult(null)}
            className="mt-4 h-11 px-4 rounded-full text-sm font-semibold bg-[#F5F6F7] text-[#555B61] border border-[#ECEFF2]"
          >
            다시 하기
          </button>
        </div>
      ) : (
        <Questionnaire onComplete={handleComplete} />
      )}
    </main>
  )
}

'use client'

import { useState } from 'react'
import { Questionnaire } from '@/components/Questionnaire'
import { ResultCard } from '@/components/ResultCard'
import { checkAllProducts, type Applicant, type EligibilityResult } from '@/lib/eligibility'

export default function Home() {
  const [results, setResults] = useState<EligibilityResult[] | null>(null)

  function handleComplete(applicant: Applicant) {
    setResults(checkAllProducts(applicant))
  }

  return (
    <main className="min-h-screen bg-[#F5F6F7]">
      {results ? (
        <div className="max-w-[480px] mx-auto px-4 py-8">
          <p className="mb-4 text-xs text-[#8D9399]">
            입력하신 정보는 서버로 전송·저장되지 않으며, 브라우저를 닫거나 새로고침하면 사라집니다.
          </p>
          <div className="flex flex-col gap-3">
            {results.map((result) => (
              <ResultCard key={result.productId} result={result} />
            ))}
          </div>
          <button
            type="button"
            onClick={() => setResults(null)}
            className="mt-4 h-11 px-4 rounded-full text-sm font-semibold bg-[#F5F6F7] text-[#555B61] border border-[#ECEFF2]"
          >
            다시 하기
          </button>
          <p className="mt-4 text-xs text-[#8D9399]">
            본 진단 결과는 2026-07 기준 공식 자격요건을 바탕으로 한 참고용 시뮬레이션이며, 실제
            대출 가능 여부는 기금e든든 또는 취급은행의 심사 결과에 따라 다를 수 있습니다.
          </p>
        </div>
      ) : (
        <Questionnaire onComplete={handleComplete} />
      )}
    </main>
  )
}

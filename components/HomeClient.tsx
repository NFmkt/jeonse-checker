'use client'

import { useState } from 'react'
import { Header } from '@/components/Header'
import { CoverPage } from '@/components/CoverPage'
import { Questionnaire } from '@/components/Questionnaire'
import { ResultCard } from '@/components/ResultCard'
import { NoticeSection } from '@/components/NoticeSection'
import type { Prefill } from '@/lib/prefill'
import { checkAllProducts, type Applicant, type EligibilityResult } from '@/lib/eligibility'

type Filter = 'all' | 'eligible'

export function HomeClient({ prefill }: { prefill?: Prefill }) {
  const [started, setStarted] = useState(false)
  const [applicant, setApplicant] = useState<Applicant | null>(null)
  const [results, setResults] = useState<EligibilityResult[] | null>(null)
  const [filter, setFilter] = useState<Filter>('eligible')

  function handleComplete(applicant: Applicant) {
    setApplicant(applicant)
    setResults(checkAllProducts(applicant))
  }

  function reset() {
    setStarted(false)
    setApplicant(null)
    setResults(null)
    setFilter('eligible')
  }

  const eligibleCount = results?.filter((r) => r.applicable && r.eligible).length ?? 0
  const visibleResults =
    results?.filter((r) => filter === 'all' || (r.applicable && r.eligible)) ?? []

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#F5F6F7]">
      <Header />
      {!started ? (
        <CoverPage onStart={() => setStarted(true)} />
      ) : results && applicant ? (
        <div className="max-w-[480px] mx-auto px-4 py-6">
          <div className="fade-up mb-5 rounded-2xl bg-[#E9F8F8] p-6">
            <p className="text-sm font-semibold text-[#20A6A6]">진단 결과</p>
            <div className="mt-1 flex items-end justify-between">
              <h1 className="text-2xl font-bold text-[#161B30]">자격 충족 상품</h1>
              <p className="text-3xl font-extrabold tabular-nums text-[#161B30]">
                {eligibleCount}
                <span className="text-base font-semibold text-[#5FAFAF]">/{results.length}</span>
              </p>
            </div>
          </div>

          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter('eligible')}
              aria-pressed={filter === 'eligible'}
              className={`h-10 px-5 rounded-full text-sm font-bold transition-all duration-200 ease-out active:scale-95 cursor-pointer ${
                filter === 'eligible' ? 'bg-[#25B9B9] text-white' : 'bg-white text-[#555B61] border border-[#ECEFF2]'
              }`}
            >
              충족 {eligibleCount}
            </button>
            <button
              type="button"
              onClick={() => setFilter('all')}
              aria-pressed={filter === 'all'}
              className={`h-10 px-5 rounded-full text-sm font-bold transition-all duration-200 ease-out active:scale-95 cursor-pointer ${
                filter === 'all' ? 'bg-[#25B9B9] text-white' : 'bg-white text-[#555B61] border border-[#ECEFF2]'
              }`}
            >
              전체 {results.length}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {visibleResults.map((result, i) => (
              <ResultCard
                key={result.productId}
                result={result}
                index={i}
                depositKrw={applicant.depositKrw}
              />
            ))}
          </div>

          <div className="flex justify-center mt-6">
            <button
              type="button"
              onClick={reset}
              className="h-12 px-6 rounded-full text-base font-semibold bg-white text-[#555B61] border border-[#ECEFF2] cursor-pointer transition-all duration-200 ease-out active:scale-95"
            >
              다시 하기
            </button>
          </div>

          <NoticeSection />
        </div>
      ) : (
        <Questionnaire onComplete={handleComplete} initialValues={prefill} />
      )}
    </main>
  )
}

import type { EligibilityResult } from '@/lib/eligibility'

export function ResultCard({ result }: { result: EligibilityResult }) {
  if (!result.applicable) {
    return (
      <div className="bg-white rounded-xl border border-[#ECEFF2] p-4 opacity-60">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-[#161B30]">{result.productName}</h3>
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F5F6F7] text-[#6E7479]">
            비대상
          </span>
        </div>
        <p className="text-sm text-[#6E7479]">
          특이사항 단계에서 해당 항목을 선택하지 않아 판정하지 않았습니다.
        </p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#ECEFF2] p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-[#161B30]">{result.productName}</h3>
        <span
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            result.eligible ? 'bg-[#E9F8F8] text-[#25B9B9]' : 'bg-[#FDE8EA] text-[#EF4452]'
          }`}
        >
          {result.eligible ? '자격 충족' : '자격 미충족'}
        </span>
      </div>
      {!result.eligible && (
        <ul className="text-sm text-[#555B61] list-disc list-inside space-y-1">
          {result.reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      )}
      <div className="mt-3 rounded-lg bg-[#E9F6FA] px-3 py-2">
        <p className="text-xs font-semibold text-[#0098D4]">대출한도</p>
        <p className="text-sm font-extrabold text-[#0098D4]">{result.loanLimitText}</p>
        <p className="mt-1.5 text-xs font-semibold text-[#0098D4]">금리</p>
        <p className="text-sm font-extrabold text-[#0098D4]">{result.rateRangeText}</p>
      </div>
      <p className="mt-3 text-[10px] text-[#6E7479]">
        출처: <a href={result.sourceUrl} className="underline" target="_blank" rel="noopener noreferrer">주택도시기금포털</a> (확인일: {result.verifiedAt})
      </p>
    </div>
  )
}

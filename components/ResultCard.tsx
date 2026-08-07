'use client'

import { useState } from 'react'
import type { EligibilityResult } from '@/lib/eligibility'
import {
  IconChevronDown,
  IconBankWoori,
  IconBankKB,
  IconBankShinhan,
  IconBankNH,
  IconBankHana,
} from '@/components/icons'

function formatManwon(krw: number): string {
  const manwon = Math.round(krw / 10000)
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000)
    const rest = manwon % 10000
    return rest === 0 ? `${eok}억원` : `${eok}억 ${rest.toLocaleString()}만원`
  }
  return `${manwon.toLocaleString()}만원`
}

function BulletText({ items }: { items: string[] }) {
  if (items.length <= 1) {
    return <p className="mt-1 text-sm leading-relaxed text-[#555B61]">{items[0] ?? ''}</p>
  }
  return (
    <ul className="mt-1 list-disc space-y-0.5 pl-4 text-sm leading-relaxed text-[#555B61]">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  )
}

const BANK_ICON: Record<string, (p: { className?: string }) => React.ReactNode> = {
  우리은행: IconBankWoori,
  KB국민은행: IconBankKB,
  신한은행: IconBankShinhan,
  NH농협은행: IconBankNH,
  하나은행: IconBankHana,
}

function BankBadge({ bank }: { bank: string }) {
  const Icon = BANK_ICON[bank]
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#F5F6F7] py-1 pl-1 pr-3 text-xs font-semibold text-[#555B61]">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {Icon ? <Icon className="h-5 w-5" /> : null}
      </span>
      {bank}
    </span>
  )
}

function sourceLabel(url: string): string {
  if (url.includes('hf.go.kr')) return '한국주택금융공사'
  if (url.includes('nhuf.molit.go.kr')) return '주택도시기금포털'
  return '공식 출처'
}

function parseRateRange(text: string): [number, number] | null {
  const matches = text.match(/\d+(?:\.\d+)?%/g)
  if (!matches || matches.length < 2) return null
  return [parseFloat(matches[0]), parseFloat(matches[1])]
}

function formatManwonRounded(krw: number): string {
  const manwon = Math.round(krw / 10000)
  if (manwon >= 10000) {
    const eok = Math.floor(manwon / 10000)
    const rest = manwon % 10000
    return rest === 0 ? `${eok}억원` : `${eok}억 ${rest.toLocaleString()}만원`
  }
  return `${manwon.toLocaleString()}만원`
}

function InterestCalculator({
  rateRangeText,
  depositKrw,
}: {
  rateRangeText: string
  depositKrw: number
}) {
  const rates = parseRateRange(rateRangeText)
  const maxLoanKrw = Math.max(Math.round((depositKrw * 0.8) / 1000000) * 1000000, 10000000)
  const [loanKrw, setLoanKrw] = useState(maxLoanKrw)

  if (!rates || depositKrw <= 0) return null

  const [minRate, maxRate] = rates
  const percent = (loanKrw / maxLoanKrw) * 100
  const minMonthly = Math.round((loanKrw * (minRate / 100)) / 12)
  const maxMonthly = Math.round((loanKrw * (maxRate / 100)) / 12)

  return (
    <div className="mt-3 ml-11 rounded-xl border border-[#ECEFF2] p-4">
      <p className="text-sm font-semibold text-[#8D9399]">이자 계산기 (약식)</p>
      <p className="mt-1 text-sm text-[#B1B6BC]">대출금 {formatManwon(loanKrw)} 기준</p>

      <p className="mt-3 text-sm font-semibold text-[#8D9399]">예상 월 이자</p>
      <p className="mt-0.5 text-3xl font-extrabold tabular-nums text-[#25B9B9]">
        {formatManwonRounded(minMonthly)}~{formatManwonRounded(maxMonthly)}
      </p>

      <input
        type="range"
        aria-label="대출금액"
        min={10000000}
        max={maxLoanKrw}
        step={1000000}
        value={loanKrw}
        onChange={(e) => setLoanKrw(Number(e.target.value))}
        className="range-slider mt-4 w-full"
        style={{
          background: `linear-gradient(to right, #25B9B9 ${percent}%, #ECEFF2 ${percent}%)`,
        }}
      />
      <div className="mt-1 flex justify-between text-xs text-[#B1B6BC]">
        <span>{formatManwon(10000000)}</span>
        <span>{formatManwon(maxLoanKrw)}</span>
      </div>
    </div>
  )
}

export function ResultCard({
  result,
  index,
  depositKrw,
}: {
  result: EligibilityResult
  index: number
  depositKrw: number
}) {
  const [isOpen, setIsOpen] = useState(result.eligible)
  const style = { animationDelay: `${index * 60}ms` }

  if (!result.applicable) {
    return (
      <div
        className="fade-up flex items-start gap-3 rounded-2xl border border-[#ECEFF2] bg-white/60 p-5 opacity-70"
        style={style}
      >
        <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F5F6F7] text-sm font-bold text-[#B1B6BC]">
          {index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold text-[#8D9399]">{result.productName}</h3>
          <p className="mt-1 text-sm text-[#B1B6BC]">
            특이사항 단계에서 해당 항목을 선택하지 않아 판정하지 않았습니다.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-up rounded-2xl border border-[#ECEFF2] bg-white" style={style}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-start justify-between gap-2 p-5 text-left cursor-pointer"
      >
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#E9F8F8] text-sm font-bold text-[#25B9B9]">
            {index + 1}
          </span>
          <h3 className="text-lg font-semibold leading-snug text-[#161B30]">
            {result.productName}
          </h3>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`rounded-full px-3 py-1.5 text-sm font-bold ${
              result.eligible ? 'bg-[#E9F8F8] text-[#25B9B9]' : 'bg-[#FDE8EA] text-[#EF4452]'
            }`}
          >
            {result.eligible ? '자격 충족' : '자격 미충족'}
          </span>
          <span
            className="transition-transform duration-200"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
          >
            <IconChevronDown className="h-5 w-5" />
          </span>
        </div>
      </button>

      {isOpen && (
        <div className="pop-in px-5 pb-5">
          {!result.eligible && (
            <ul className="mb-3 ml-11 list-disc space-y-1 text-base text-[#555B61]">
              {result.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          )}

          <div className="ml-11 divide-y divide-[#CAEEFA] rounded-xl bg-[#E9F6FA]">
            <div className="px-4 py-3">
              <p className="text-sm font-bold text-[#0098D4]">대출한도</p>
              <BulletText items={result.loanLimitText} />
            </div>
            <div className="px-4 py-3">
              <p className="text-sm font-bold text-[#0098D4]">금리</p>
              <BulletText items={result.rateRangeText} />
            </div>
          </div>

          {result.bankList && result.bankList.length > 0 && (
            <div className="mt-3 ml-11">
              <p className="text-sm font-semibold text-[#8D9399]">취급은행</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {result.bankList.map((bank) => (
                  <BankBadge key={bank} bank={bank} />
                ))}
              </div>
            </div>
          )}

          {result.eligible && (
            <InterestCalculator rateRangeText={result.rateRangeText.join(' ')} depositKrw={depositKrw} />
          )}

          <p className="mt-3 ml-11 text-xs text-[#B1B6BC]">
            출처:{' '}
            <a
              href={result.sourceUrl}
              className="underline hover:text-[#25B9B9]"
              target="_blank"
              rel="noopener noreferrer"
            >
              {sourceLabel(result.sourceUrl)}
            </a>{' '}
            (확인일: {result.verifiedAt})
          </p>
        </div>
      )}
    </div>
  )
}

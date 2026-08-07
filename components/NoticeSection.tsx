'use client'

import { useState } from 'react'
import { IconChevronDown } from '@/components/icons'

export function NoticeSection() {
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-center gap-1 py-2 text-xs font-medium text-[#B1B6BC] cursor-pointer"
      >
        <span>꼭 알아두세요</span>
        <span
          className="shrink-0 transition-transform duration-200"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        >
          <IconChevronDown className="h-3.5 w-3.5" color="#B1B6BC" />
        </span>
      </button>
      {open && (
        <div className="mt-1 rounded-xl bg-[#F5F6F7] px-4 py-3 text-xs leading-relaxed text-[#8D9399]">
          <p className="mb-2">
            입력하신 정보는 서버로 전송·저장되지 않으며, 브라우저를 닫거나 새로고침하면 사라집니다.
          </p>
          <p className="mb-2">
            본 진단 결과는 2026-07 기준 공식 자격요건을 바탕으로 한 참고용 시뮬레이션이며, 실제
            대출 가능 여부는 기금e든든 또는 취급은행의 심사 결과에 따라 다를 수 있습니다.
          </p>
          <p>각 상품 카드 하단의 출처 링크에서 공식 자격요건을 직접 확인할 수 있습니다.</p>
        </div>
      )}
    </div>
  )
}

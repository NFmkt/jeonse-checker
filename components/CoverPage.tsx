import { IconHouse } from '@/components/icons'

export function CoverPage({ onStart }: { onStart: () => void }) {
  return (
    <div className="max-w-[480px] mx-auto px-4 py-10">
      <div className="fade-up rounded-2xl border border-[#ECEFF2] bg-white p-7 text-center">
        <span className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#E9F8F8]">
          <IconHouse className="h-11 w-11" />
        </span>
        <h1 className="text-3xl font-bold leading-snug text-[#161B30]">
          전세대출,
          <br />
          나도 받을 수 있을까?
        </h1>
        <p className="mt-4 text-base leading-relaxed text-[#686D73]">
          11개 질문에 답하면
          <br />
          대출상품 자격을 한번에 확인할 수 있어요!
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="rounded-full bg-[#E9F8F8] px-3.5 py-2 text-sm font-bold text-[#20A6A6]">
            개인정보 미저장
          </span>
          <span className="rounded-full bg-[#E9F6FA] px-3.5 py-2 text-sm font-bold text-[#0098D4]">
            약 2분 소요
          </span>
          <span className="rounded-full bg-[#FFF7E6] px-3.5 py-2 text-sm font-bold text-[#B8860B]">
            8개 상품 진단
          </span>
        </div>

        <button
          type="button"
          onClick={onStart}
          className="mt-7 h-14 w-full rounded-full text-base font-bold text-white bg-[#25B9B9] shadow-[0_1px_6px_rgba(37,185,185,0.28)] cursor-pointer transition-all duration-200 ease-out active:scale-95"
        >
          진단 시작하기
        </button>
      </div>
    </div>
  )
}

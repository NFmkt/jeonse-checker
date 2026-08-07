'use client'

import { useState } from 'react'
import type { Applicant } from '@/lib/eligibility'
import { RangeSlider } from '@/components/RangeSlider'
import { BracketList } from '@/components/BracketList'
import {
  IconHouse,
  IconPin,
  IconArea,
  IconCoin,
  IconPeople,
  IconChart,
  IconWallet,
  IconCard,
  IconFlag,
  IconCalendar,
  IconInfo,
} from '@/components/icons'

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

const STEP_META: Record<Step, { label: string; icon: (p: { className?: string }) => React.ReactNode; tint: string }> = {
  houseDecided: { label: '거주지 결정', icon: IconHouse, tint: '#E9F8F8' },
  region: { label: '지역', icon: IconPin, tint: '#E9F6FA' },
  area: { label: '전용면적', icon: IconArea, tint: '#E9F8F8' },
  deposit: { label: '전세보증금', icon: IconCoin, tint: '#FFF7E6' },
  housing: { label: '주택 소유', icon: IconHouse, tint: '#ECEFF2' },
  household: { label: '가구 구성', icon: IconPeople, tint: '#E9F6FA' },
  income: { label: '연소득', icon: IconChart, tint: '#E5F6EE' },
  asset: { label: '순자산', icon: IconWallet, tint: '#FFF7E6' },
  existingLoan: { label: '보유 대출', icon: IconCard, tint: '#ECEFF2' },
  special: { label: '특이사항', icon: IconFlag, tint: '#FDE8EA' },
  age: { label: '나이', icon: IconCalendar, tint: '#E9F6FA' },
}

function formatManwon(v: number): string {
  if (v === 0) return '0원'
  if (v % 10000 === 0) return `${v / 10000}억원`
  if (v >= 10000) return `${Math.floor(v / 10000)}억 ${(v % 10000).toLocaleString()}만원`
  return `${v.toLocaleString()}만원`
}

const INCOME_BRACKETS = [
  { value: 5000, label: `${formatManwon(5000)} 이하` },
  { value: 6000, label: `${formatManwon(6000)} 이하` },
  { value: 7500, label: `${formatManwon(7500)} 이하` },
  { value: 13000, label: `${formatManwon(13000)} 이하` },
  { value: 20000, label: `${formatManwon(20000)} 이하` },
  { value: 30000, label: `${formatManwon(20000)} 초과` },
]

const ASSET_BRACKETS = [
  { value: 34500, label: `${formatManwon(34500)} 이하` },
  { value: 51100, label: `${formatManwon(34500)} 초과 ~ ${formatManwon(51100)} 이하` },
  { value: 60000, label: `${formatManwon(51100)} 초과` },
]

function QuestionHeader({ step, title }: { step: Step; title: React.ReactNode }) {
  const meta = STEP_META[step]
  const Icon = meta.icon
  return (
    <legend className="mb-7 block w-full text-center">
      <span
        className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{ backgroundColor: meta.tint }}
      >
        <Icon className="h-8 w-8" />
      </span>
      <span className="block text-sm font-semibold text-[#8D9399]">{meta.label}</span>
      <span className="mt-2 block text-2xl font-bold leading-snug text-[#161B30]">{title}</span>
    </legend>
  )
}

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
      aria-pressed={active}
      className={`h-12 px-5 rounded-full text-base font-semibold transition-all duration-200 ease-out active:scale-95 cursor-pointer ${
        active
          ? 'bg-[#25B9B9] text-white shadow-[0_1px_6px_rgba(37,185,185,0.28)]'
          : 'bg-[#F5F6F7] text-[#555B61] hover:bg-[#E9F8F8] hover:text-[#20A6A6]'
      }`}
    >
      {children}
    </button>
  )
}

function SelfReportButton({
  active,
  onClick,
  infoOpen,
  onToggleInfo,
  note,
  children,
}: {
  active: boolean
  onClick: () => void
  infoOpen: boolean
  onToggleInfo: () => void
  note: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div
        className={`flex h-12 items-center rounded-full pl-5 pr-2 transition-all duration-200 ease-out ${
          active ? 'bg-[#25B9B9] shadow-[0_1px_6px_rgba(37,185,185,0.28)]' : 'bg-[#F5F6F7]'
        }`}
      >
        <button
          type="button"
          onClick={onClick}
          aria-pressed={active}
          className={`flex-1 truncate text-center text-base font-semibold cursor-pointer ${
            active ? 'text-white' : 'text-[#555B61]'
          }`}
        >
          {children}
        </button>
        <button
          type="button"
          onClick={onToggleInfo}
          aria-label="안내 보기"
          aria-expanded={infoOpen}
          className="ml-1 flex h-8 w-8 shrink-0 items-center justify-center cursor-pointer"
        >
          <IconInfo className="h-5 w-5" color={active ? '#FFFFFF' : '#B1B6BC'} />
        </button>
      </div>
      {infoOpen && (
        <div className="mt-1.5 rounded-xl bg-[#F5F6F7] px-4 py-3">
          <p className="text-sm leading-relaxed text-[#555B61]">{note}</p>
        </div>
      )}
    </div>
  )
}

export function Questionnaire({ onComplete }: Props) {
  const [stepIndex, setStepIndex] = useState(0)
  const [openInfoKey, setOpenInfoKey] = useState<string | null>(null)
  const [houseDecided, setHouseDecided] = useState<boolean | null>(null)
  const [region, setRegion] = useState<Applicant['region'] | null>(null)
  const [areaSqm, setAreaSqm] = useState(59)
  const [depositManwon, setDepositManwon] = useState(20000)
  const [housingOwnership, setHousingOwnership] = useState<Applicant['housingOwnership'] | null>(null)
  const [isNewlywed, setIsNewlywed] = useState(false)
  const [hasChildrenTwoOrMore, setHasChildrenTwoOrMore] = useState(false)
  const [hasNewbornWithin2Years, setHasNewbornWithin2Years] = useState(false)
  const [isDualIncome, setIsDualIncome] = useState(false)
  const [annualIncomeManwon, setAnnualIncomeManwon] = useState<number | null>(null)
  const [netAssetManwon, setNetAssetManwon] = useState<number | null>(null)
  const [hasExistingLoan, setHasExistingLoan] = useState(false)
  const [isSmeEmployeeOrFounder, setIsSmeEmployeeOrFounder] = useState(false)
  const [isInnovationCityOrRedevelopment, setIsInnovationCityOrRedevelopment] = useState(false)
  const [hasDelinquencyHistory, setHasDelinquencyHistory] = useState(false)
  const [selfReportedJeonseDamage, setSelfReportedJeonseDamage] = useState(false)
  const [selfReportedRenewalExtension, setSelfReportedRenewalExtension] = useState(false)
  const [selfReportedVulnerableHousing, setSelfReportedVulnerableHousing] = useState(false)
  const [age, setAge] = useState(30)

  const step: Step = STEPS[stepIndex]

  function goNext() {
    if (stepIndex === STEPS.length - 1) {
      onComplete({
        houseDecided: houseDecided ?? true,
        region: region ?? 'capital',
        areaSqm,
        depositKrw: depositManwon * 10000,
        housingOwnership: housingOwnership ?? 'none',
        isNewlywed,
        hasChildrenTwoOrMore,
        hasNewbornWithin2Years,
        isDualIncome,
        annualIncomeKrw: (annualIncomeManwon ?? 0) * 10000,
        netAssetKrw: (netAssetManwon ?? 0) * 10000,
        hasExistingLoan,
        isSmeEmployeeOrFounder,
        isInnovationCityOrRedevelopment,
        hasDelinquencyHistory,
        selfReportedJeonseDamage,
        selfReportedRenewalExtension,
        selfReportedVulnerableHousing,
        age,
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
    step === 'area' ||
    step === 'deposit' ||
    (step === 'housing' && housingOwnership !== null) ||
    step === 'household' ||
    (step === 'income' && annualIncomeManwon !== null) ||
    (step === 'asset' && netAssetManwon !== null) ||
    step === 'existingLoan' ||
    step === 'special' ||
    step === 'age'

  return (
    <div className="max-w-[480px] mx-auto px-4 py-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-[#ECEFF2]">
          <div
            className="h-full rounded-full bg-[#25B9B9] transition-all duration-300 ease-out"
            style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-sm font-bold text-[#8D9399]">
          {stepIndex + 1} / {STEPS.length}
        </span>
      </div>

      <div key={step} className="pop-in rounded-2xl border border-[#ECEFF2] bg-white p-6">
        {step === 'houseDecided' && (
          <fieldset>
            <QuestionHeader step="houseDecided" title="이사할 집을 결정하셨나요?" />
            <div className="flex justify-center gap-2">
              <ToggleButton active={houseDecided === true} onClick={() => setHouseDecided(true)}>
                결정했어요
              </ToggleButton>
              <ToggleButton active={houseDecided === false} onClick={() => setHouseDecided(false)}>
                나중에 결정해요
              </ToggleButton>
            </div>
          </fieldset>
        )}

        {step === 'region' && (
          <fieldset>
            <QuestionHeader step="region" title="이사할 집은 어느 지역에 있나요?" />
            <div className="flex justify-center gap-2">
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
            <QuestionHeader step="area" title="전용면적은 몇 ㎡인가요?" />
            <RangeSlider
              label="전용면적"
              value={areaSqm}
              onChange={setAreaSqm}
              min={20}
              max={120}
              step={1}
              formatValue={(v) => `${v}㎡`}
              unitSuffix="이하"
              quickValues={[39, 49, 59, 74, 85, 102].map((v) => ({
                value: v,
                label: `${v}㎡ 이하`,
              }))}
            />
          </fieldset>
        )}

        {step === 'deposit' && (
          <fieldset>
            <QuestionHeader step="deposit" title="전세보증금은 얼마인가요?" />
            <RangeSlider
              label="전세보증금"
              value={depositManwon}
              onChange={setDepositManwon}
              min={3000}
              max={60000}
              step={100}
              formatValue={formatManwon}
              unitSuffix="이하"
              quickValues={[5000, 10000, 15000, 20000, 25000, 30000, 40000, 50000].map((v) => ({
                value: v,
                label: `${formatManwon(v)} 이하`,
              }))}
            />
          </fieldset>
        )}

        {step === 'housing' && (
          <fieldset>
            <QuestionHeader step="housing" title="현재 주택 소유 상태는 어떻게 되나요?" />
            <BracketList
              value={housingOwnership}
              onChange={setHousingOwnership}
              options={[
                { value: 'none', label: '무주택' },
                { value: 'public-rental', label: '공공임대 거주 중' },
                { value: 'one-house', label: '1주택' },
                { value: 'multi-house', label: '2주택 이상' },
              ]}
            />
          </fieldset>
        )}

        {step === 'household' && (
          <fieldset>
            <QuestionHeader step="household" title="가구 구성 중 해당하는 항목을 모두 선택해주세요" />
            <div className="flex flex-col gap-2.5">
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
            <QuestionHeader step="income" title="연소득은 얼마인가요?" />
            <p className="-mt-5 mb-4 text-center text-sm text-[#8D9399]">
              배우자가 있다면, 배우자의 소득도 포함해야 해요
            </p>
            <BracketList
              value={annualIncomeManwon}
              onChange={setAnnualIncomeManwon}
              options={INCOME_BRACKETS}
            />
          </fieldset>
        )}

        {step === 'asset' && (
          <fieldset>
            <QuestionHeader step="asset" title="빚을 제외한 순자산은 얼마인가요?" />
            <p className="-mt-5 mb-4 text-center text-sm text-[#8D9399]">
              배우자가 있다면, 배우자의 자산도 포함해야 해요
            </p>
            <BracketList
              value={netAssetManwon}
              onChange={setNetAssetManwon}
              options={ASSET_BRACKETS}
            />
          </fieldset>
        )}

        {step === 'existingLoan' && (
          <fieldset>
            <QuestionHeader step="existingLoan" title="현재 보유 중인 대출이 있나요?" />
            <div className="flex justify-center gap-2">
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
            <QuestionHeader step="special" title="해당하는 특이사항을 모두 선택해주세요" />
            <div className="flex flex-col gap-3">
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
              <SelfReportButton
                active={selfReportedJeonseDamage}
                onClick={() => setSelfReportedJeonseDamage((v) => !v)}
                infoOpen={openInfoKey === 'jeonseDamage'}
                onToggleInfo={() =>
                  setOpenInfoKey((k) => (k === 'jeonseDamage' ? null : 'jeonseDamage'))
                }
                note="전세사기 등으로 보증금 30% 이상 피해를 입은 무주택 세대주가 대상이에요. 확인서 대상 여부는 관할 기관에서 최종 확인됩니다."
              >
                전세피해 임차인
              </SelfReportButton>
              <SelfReportButton
                active={selfReportedRenewalExtension}
                onClick={() => setSelfReportedRenewalExtension((v) => !v)}
                infoOpen={openInfoKey === 'renewalExtension'}
                onToggleInfo={() =>
                  setOpenInfoKey((k) => (k === 'renewalExtension' ? null : 'renewalExtension'))
                }
                note="계약갱신요구권을 행사한 뒤 같은 집에서 보증금을 올려 재계약한 한시 지원 대상이에요. 지침 대상 여부는 관할 기관에서 최종 확인됩니다."
              >
                갱신만료 임차인 지원 대상
              </SelfReportButton>
              <SelfReportButton
                active={selfReportedVulnerableHousing}
                onClick={() => setSelfReportedVulnerableHousing((v) => !v)}
                infoOpen={openInfoKey === 'vulnerableHousing'}
                onToggleInfo={() =>
                  setOpenInfoKey((k) => (k === 'vulnerableHousing' ? null : 'vulnerableHousing'))
                }
                note="주거취약계층 주거지원 업무처리지침 대상으로 3개월 이상 거주 중인 무주택 세대주가 대상이에요. 지침 대상 여부는 관할 기관에서 최종 확인됩니다."
              >
                주거취약계층 이주지원 대상
              </SelfReportButton>
            </div>
          </fieldset>
        )}

        {step === 'age' && (
          <fieldset>
            <QuestionHeader step="age" title="만 나이를 선택해주세요" />
            <RangeSlider
              label="만 나이"
              value={age}
              onChange={setAge}
              min={19}
              max={100}
              step={1}
              formatValue={(v) => `만 ${v}세`}
              quickValues={[20, 25, 30, 34, 40, 50].map((v) => ({ value: v, label: `${v}세` }))}
            />
          </fieldset>
        )}

        <div className="flex justify-center gap-2 mt-9 pt-6 border-t border-[#ECEFF2]">
          {stepIndex > 0 && (
            <button
              type="button"
              onClick={goBack}
              className="h-12 px-5 rounded-full text-base font-semibold bg-[#F5F6F7] text-[#555B61] cursor-pointer transition-all duration-200 ease-out active:scale-95"
            >
              이전
            </button>
          )}
          <button
            type="button"
            onClick={goNext}
            disabled={!canProceed}
            className="h-12 px-7 rounded-full text-base font-semibold bg-[#25B9B9] text-white shadow-[0_1px_6px_rgba(37,185,185,0.28)] disabled:shadow-none disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed transition-all duration-200 ease-out active:scale-95"
          >
            {stepIndex === STEPS.length - 1 ? '결과 보기' : '다음'}
          </button>
        </div>
      </div>
    </div>
  )
}

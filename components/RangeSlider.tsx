'use client'

type Props = {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step: number
  formatValue: (value: number) => string
  unitSuffix?: string
  quickValues?: { value: number; label: string }[]
}

export function RangeSlider({
  label,
  value,
  onChange,
  min,
  max,
  step,
  formatValue,
  unitSuffix,
  quickValues,
}: Props) {
  const percent = ((value - min) / (max - min)) * 100

  return (
    <div>
      <div className="rounded-2xl bg-[#E9F8F8] px-6 pt-6 pb-7">
        <p className="text-center text-sm font-semibold text-[#20A6A6]">{label}</p>
        <p className="mt-1 text-center text-5xl font-extrabold tabular-nums text-[#161B30]">
          {formatValue(value)}
          {unitSuffix && (
            <span className="ml-1.5 text-2xl font-bold text-[#5FAFAF]">{unitSuffix}</span>
          )}
        </p>

        <input
          type="range"
          aria-label={label}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="range-slider mt-7 w-full"
          style={{
            background: `linear-gradient(to right, #25B9B9 ${percent}%, #CAEEFA ${percent}%)`,
          }}
        />
        <div className="mt-1 flex justify-between text-xs tabular-nums text-[#5FAFAF]">
          <span>{formatValue(min)}</span>
          <span>{formatValue(max)}</span>
        </div>
      </div>

      {quickValues && quickValues.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {quickValues.map((q) => (
            <button
              key={q.value}
              type="button"
              onClick={() => onChange(q.value)}
              aria-pressed={value === q.value}
              className={`h-10 rounded-full text-sm font-bold transition-all duration-200 ease-out active:scale-95 cursor-pointer ${
                value === q.value
                  ? 'bg-[#25B9B9] text-white shadow-[0_1px_6px_rgba(37,185,185,0.28)]'
                  : 'bg-[#F5F6F7] text-[#555B61] hover:bg-[#E9F8F8] hover:text-[#20A6A6]'
              }`}
            >
              {q.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

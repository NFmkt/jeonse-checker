'use client'

type Option<T> = { value: T; label: string }

type Props<T> = {
  value: T | null
  onChange: (value: T) => void
  options: Option<T>[]
}

export function BracketList<T extends string | number>({ value, onChange, options }: Props<T>) {
  return (
    <div className="flex flex-col gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={`h-14 w-full rounded-full px-5 text-center text-base font-semibold transition-all duration-200 ease-out active:scale-[0.98] cursor-pointer ${
            value === opt.value
              ? 'bg-[#25B9B9] text-white shadow-[0_1px_6px_rgba(37,185,185,0.28)]'
              : 'bg-[#F5F6F7] text-[#555B61] hover:bg-[#E9F8F8] hover:text-[#20A6A6]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

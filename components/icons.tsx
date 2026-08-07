const NAVY = '#313D4C'
const TEAL = '#25B9B9'
const BLUE = '#64A7FF'
const YELLOW = '#FFC84D'
const GREEN = '#23B169'
const RED = '#EF4452'
const ORANGE = '#FF9000'

type IconProps = { className?: string; color?: string }

export function IconInfo({ className, color = '#8D9399' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill={color} />
      <circle cx="10" cy="6.6" r="1.3" fill="#FFFFFF" />
      <rect x="8.8" y="9.1" width="2.4" height="6" rx="1.2" fill="#FFFFFF" />
    </svg>
  )
}

export function IconChevronDown({ className, color = '#8D9399' }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M4.5 7.5 10 13l5.5-5.5-1.4-1.4L10 10.2 5.9 6.1Z" fill={color} />
    </svg>
  )
}

export function IconHouse({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M3 11 10 4 17 11Z" fill={TEAL} />
      <rect x="4.5" y="10.5" width="11" height="6.7" rx="1" fill={NAVY} />
      <rect x="8.6" y="12.8" width="2.8" height="4.4" rx="0.6" fill="#FFFFFF" />
    </svg>
  )
}

export function IconPin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 17.5C8.5 15 4.5 11 4.5 7.5A5.5 5.5 0 1 1 15.5 7.5C15.5 11 11.5 15 10 17.5Z"
        fill={BLUE}
      />
      <circle cx="10" cy="7.5" r="2.1" fill="#FFFFFF" />
    </svg>
  )
}

export function IconArea({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="2" width="5.5" height="1.8" fill={TEAL} />
      <rect x="2" y="2" width="1.8" height="5.5" fill={TEAL} />
      <rect x="12.5" y="2" width="5.5" height="1.8" fill={TEAL} />
      <rect x="16.2" y="2" width="1.8" height="5.5" fill={TEAL} />
      <rect x="2" y="16.2" width="5.5" height="1.8" fill={TEAL} />
      <rect x="2" y="12.5" width="1.8" height="5.5" fill={TEAL} />
      <rect x="12.5" y="16.2" width="5.5" height="1.8" fill={TEAL} />
      <rect x="16.2" y="12.5" width="1.8" height="5.5" fill={TEAL} />
      <rect x="8.5" y="8.5" width="3" height="3" rx="0.8" fill={NAVY} />
    </svg>
  )
}

export function IconCoin({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill={YELLOW} />
      <rect x="9.3" y="5.6" width="1.4" height="8.8" rx="0.7" fill={NAVY} />
      <rect x="6.4" y="8" width="7.2" height="1.4" rx="0.7" fill={NAVY} />
      <rect x="6.4" y="10.6" width="7.2" height="1.4" rx="0.7" fill={NAVY} />
    </svg>
  )
}

export function IconWallet({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="5" width="16" height="12" rx="2.4" fill={ORANGE} />
      <rect x="2" y="8" width="16" height="2.4" fill={NAVY} />
      <circle cx="14.4" cy="13.2" r="1.5" fill="#FFFFFF" />
    </svg>
  )
}

export function IconPeople({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="13" cy="6.6" r="2.6" fill={BLUE} />
      <path d="M8.5 17c0-3.6 2-6.2 4.5-6.2s4.5 2.6 4.5 6.2" fill={BLUE} />
      <circle cx="7.3" cy="8.6" r="3" fill={NAVY} />
      <path d="M2 17.6c0-4 2.3-6.8 5.3-6.8s5.3 2.8 5.3 6.8" fill={NAVY} />
    </svg>
  )
}

export function IconChart({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="11.5" width="3.6" height="5.5" rx="1" fill={GREEN} />
      <rect x="8.2" y="7.5" width="3.6" height="9.5" rx="1" fill={GREEN} />
      <rect x="13.9" y="3.2" width="3.6" height="13.8" rx="1" fill={NAVY} />
    </svg>
  )
}

export function IconCard({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2" y="4.8" width="16" height="11.4" rx="2" fill={NAVY} />
      <rect x="2" y="7.8" width="16" height="2.6" fill={TEAL} />
      <rect x="4.3" y="11.6" width="3" height="2.2" rx="0.5" fill={YELLOW} />
    </svg>
  )
}

export function IconFlag({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="5" y="2.5" width="1.6" height="15" rx="0.8" fill={NAVY} />
      <path d="M6.6 3.4 15.8 6.5 6.6 9.6Z" fill={RED} />
    </svg>
  )
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <rect x="2.5" y="4.5" width="15" height="13" rx="2" fill={BLUE} />
      <path d="M2.5 6.5a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2v2H2.5Z" fill={NAVY} />
      <rect x="6" y="2" width="1.7" height="3.6" rx="0.85" fill={NAVY} />
      <rect x="12.3" y="2" width="1.7" height="3.6" rx="0.85" fill={NAVY} />
      <circle cx="10" cy="12.8" r="1.8" fill={YELLOW} />
    </svg>
  )
}

/**
 * 은행 배지 아이콘: 실제 등록 로고를 재현하지 않는 오리지널 추상 픽토그램.
 * 각 은행의 브랜드 컬러 + 대표적인 이미지 연상(마름모/별/원/잎/동심원)만 차용한다.
 */
export function IconBankWoori({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 3 17 10 10 17 3 10Z" fill="#0060AF" />
      <path d="M10 6.5 13.5 10 10 13.5 6.5 10Z" fill="#FFFFFF" />
    </svg>
  )
}

export function IconBankKB({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M10 2 12.2 7.8 18 10 12.2 12.2 10 18 7.8 12.2 2 10 7.8 7.8Z"
        fill="#DDA000"
      />
    </svg>
  )
}

export function IconBankShinhan({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="#0046FF" />
      <rect x="4" y="9.3" width="12" height="1.4" rx="0.7" fill="#FFFFFF" transform="rotate(-45 10 10)" />
    </svg>
  )
}

export function IconBankNH({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path d="M10 2C10 2 4 6.2 4 12 4 15.3 6.7 18 10 18 13.3 18 16 15.3 16 12 16 6.2 10 2 10 2Z" fill="#00A651" />
      <rect x="9.3" y="6" width="1.4" height="10" rx="0.7" fill="#FFFFFF" />
    </svg>
  )
}

export function IconBankHana({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="#009490" />
      <circle cx="10" cy="10" r="3" fill="#FFFFFF" />
    </svg>
  )
}

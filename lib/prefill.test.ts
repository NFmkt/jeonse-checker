import { describe, expect, it } from 'vitest'
import { parsePrefill, DEPOSIT_MANWON_RANGE, AREA_SQM_RANGE } from '@/lib/prefill'

describe('parsePrefill - deposit (원 단위 정수 문자열 -> 만원)', () => {
  it('원 단위 정수를 만원으로 변환한다', () => {
    expect(parsePrefill({ deposit: '150000000' })).toEqual({ depositManwon: 15000 })
    expect(parsePrefill({ deposit: '155000000' })).toEqual({ depositManwon: 15500 })
  })

  it('슬라이더 하한/상한 경계값은 허용한다', () => {
    expect(parsePrefill({ deposit: '30000000' })).toEqual({ depositManwon: 3000 })
    expect(parsePrefill({ deposit: '600000000' })).toEqual({ depositManwon: 60000 })
    expect(DEPOSIT_MANWON_RANGE).toEqual({ min: 3000, max: 60000, step: 100 })
  })

  it('범위 밖 값은 무시한다(클램프하지 않음)', () => {
    expect(parsePrefill({ deposit: '29900000' })).toEqual({})
    expect(parsePrefill({ deposit: '600100000' })).toEqual({})
    expect(parsePrefill({ deposit: '0' })).toEqual({})
    expect(parsePrefill({ deposit: '99999999999999999999999' })).toEqual({})
  })

  it('슬라이더 step(100만원)에 맞지 않는 값은 무시한다', () => {
    expect(parsePrefill({ deposit: '150500000' })).toEqual({})
    expect(parsePrefill({ deposit: '150000001' })).toEqual({})
  })

  it('정수 문자열이 아니면 무시한다', () => {
    for (const bad of ['', ' ', 'abc', '-150000000', '+150000000', '1.5e8', '150000000.0', '150,000,000', '15만', ' 150000000', '150000000 ', '0x10', 'NaN', 'Infinity', '0150000000']) {
      expect(parsePrefill({ deposit: bad }), bad).toEqual({})
    }
  })

  it('배열(파라미터 중복)이나 undefined는 무시한다', () => {
    expect(parsePrefill({ deposit: ['150000000', '200000000'] })).toEqual({})
    expect(parsePrefill({ deposit: undefined })).toEqual({})
  })
})

describe('parsePrefill - region', () => {
  it('capital / non-capital 정확히 일치하는 값만 허용한다', () => {
    expect(parsePrefill({ region: 'capital' })).toEqual({ region: 'capital' })
    expect(parsePrefill({ region: 'non-capital' })).toEqual({ region: 'non-capital' })
  })

  it('그 외 값(대소문자, 한글, 다른 코드)은 추측 매핑 없이 무시한다', () => {
    for (const bad of ['Capital', 'CAPITAL', '수도권', '비수도권', 'seoul', 'gyeonggi', '', 'non_capital']) {
      expect(parsePrefill({ region: bad }), bad).toEqual({})
    }
    expect(parsePrefill({ region: ['capital', 'non-capital'] })).toEqual({})
  })
})

describe('parsePrefill - area (전용면적 ㎡)', () => {
  it('슬라이더 범위(20~120)의 정수만 허용한다', () => {
    expect(parsePrefill({ area: '59' })).toEqual({ areaSqm: 59 })
    expect(parsePrefill({ area: '20' })).toEqual({ areaSqm: 20 })
    expect(parsePrefill({ area: '120' })).toEqual({ areaSqm: 120 })
    expect(AREA_SQM_RANGE).toEqual({ min: 20, max: 120, step: 1 })
  })

  it('범위 밖, 소수, 음수, 문자열은 무시한다', () => {
    for (const bad of ['19', '121', '0', '-59', '59.5', '84.97', '', 'abc', '5e1', ' 59', '059', 'Infinity', '-Infinity']) {
      expect(parsePrefill({ area: bad }), bad).toEqual({})
    }
  })
})

describe('parsePrefill - 조합', () => {
  it('세 값을 함께 파싱한다', () => {
    expect(parsePrefill({ deposit: '150000000', region: 'capital', area: '59' })).toEqual({
      depositManwon: 15000,
      region: 'capital',
      areaSqm: 59,
    })
  })

  it('하나가 잘못돼도 나머지 유효한 값은 살린다', () => {
    expect(parsePrefill({ deposit: 'abc', region: 'capital', area: '59' })).toEqual({
      region: 'capital',
      areaSqm: 59,
    })
  })

  it('알 수 없는 파라미터와 빈 입력은 무시하고 빈 객체를 돌려준다', () => {
    expect(parsePrefill({})).toEqual({})
    expect(parsePrefill({ foo: 'bar', utm_source: 'x' })).toEqual({})
  })
})

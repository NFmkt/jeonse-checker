import { describe, it, expect, vi, afterEach } from 'vitest'
import bootmokGeneral from '@/data/products/bootmok-general.json'
import { POST } from './route'

const EOK = 100000000

function post(body: unknown, raw = false): Request {
  return new Request('http://localhost/api/house-conditions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: raw ? (body as string) : JSON.stringify(body),
  })
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/house-conditions: 정상', () => {
  it('200과 계약된 모양을 돌려준다', async () => {
    const res = await POST(post({ depositKrw: EOK, areaSqm: 59.5, region: 'capital' }))
    expect(res.status).toBe(200)
    const json = await res.json()

    expect(Object.keys(json).sort()).toEqual(
      ['housingTypeChecked', 'notEvaluated', 'products', 'summary', 'version'].sort()
    )
    expect(json.version).toBe(1)
    expect(json.summary).toBe('fit')
    expect(json.housingTypeChecked).toBe(false)
    expect(json.products).toHaveLength(5)
    for (const p of json.products) {
      expect(Object.keys(p).sort()).toEqual(
        ['productId', 'productName', 'reasons', 'sourceUrl', 'status', 'verifiedAt'].sort()
      )
      expect(Array.isArray(p.reasons)).toBe(true)
    }
    expect(json.products[0].productId).toBe(bootmokGeneral.id)
    expect(json.products[0].sourceUrl).toBe(bootmokGeneral.sourceUrl)
    expect(json.notEvaluated).toHaveLength(3)
    for (const n of json.notEvaluated) {
      expect(Object.keys(n).sort()).toEqual(['productId', 'productName'])
    }
  })

  it('areaSqm·region 없이 보증금만 보내도 200이고 해당 상품은 unknown', async () => {
    const res = await POST(post({ depositKrw: EOK }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.summary).toBe('unknown')
    expect(json.products.every((p: { status: string }) => p.status === 'unknown')).toBe(true)
  })

  it('한도를 넘는 보증금은 exceeds로 판정한다', async () => {
    const res = await POST(
      post({ depositKrw: bootmokGeneral.depositLimitKrw.capital + 1, areaSqm: 30, region: 'capital' })
    )
    const json = await res.json()
    expect(json.products[0].status).toBe('exceeds')
  })

  it('CORS 헤더를 두지 않는다(서버 간 호출 전용)', async () => {
    const res = await POST(post({ depositKrw: EOK }))
    expect(res.headers.get('access-control-allow-origin')).toBeNull()
  })
})

describe('POST /api/house-conditions: 400', () => {
  const badBodies: Array<[string, unknown]> = [
    ['depositKrw 문자열', { depositKrw: '100000000' }],
    ['depositKrw 음수', { depositKrw: -1 }],
    ['depositKrw 0', { depositKrw: 0 }],
    ['depositKrw 소수', { depositKrw: 100000000.5 }],
    ['depositKrw 없음', { areaSqm: 59, region: 'capital' }],
    ['depositKrw null', { depositKrw: null }],
    ['depositKrw 안전 정수 초과', { depositKrw: Number.MAX_SAFE_INTEGER + 2 }],
    ['region 다른 값', { depositKrw: EOK, region: 'seoul' }],
    ['region 한글', { depositKrw: EOK, region: '수도권' }],
    ['region 숫자', { depositKrw: EOK, region: 1 }],
    ['areaSqm 0', { depositKrw: EOK, areaSqm: 0 }],
    ['areaSqm 음수', { depositKrw: EOK, areaSqm: -5 }],
    ['areaSqm 문자열', { depositKrw: EOK, areaSqm: '59' }],
    ['areaSqm null', { depositKrw: EOK, areaSqm: null }],
    ['본문이 배열', [{ depositKrw: EOK }]],
    ['본문이 null', null],
    ['본문이 숫자', 5],
  ]

  it.each(badBodies)('%s → 400', async (_name, body) => {
    const res = await POST(post(body))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: '잘못된 요청이에요.' })
  })

  it('JSON이 아닌 본문 → 400', async () => {
    const res = await POST(post('{not json', true))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: '잘못된 요청이에요.' })
  })

  it('빈 본문 → 400', async () => {
    const res = await POST(post('', true))
    expect(res.status).toBe(400)
  })

  it('areaSqm Infinity(JSON 직렬화 시 null) → 400', async () => {
    const res = await POST(post({ depositKrw: EOK, areaSqm: Infinity }))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/house-conditions: 로그', () => {
  it('요청 본문을 로그에 남기지 않는다', async () => {
    const spies = [
      vi.spyOn(console, 'log').mockImplementation(() => {}),
      vi.spyOn(console, 'info').mockImplementation(() => {}),
      vi.spyOn(console, 'warn').mockImplementation(() => {}),
      vi.spyOn(console, 'error').mockImplementation(() => {}),
      vi.spyOn(console, 'debug').mockImplementation(() => {}),
    ]
    await POST(post({ depositKrw: 123456789, areaSqm: 61.25, region: 'capital' }))
    await POST(post({ depositKrw: '123456789' }))
    await POST(post('{not json 123456789', true))
    for (const spy of spies) expect(spy).not.toHaveBeenCalled()
  })
})

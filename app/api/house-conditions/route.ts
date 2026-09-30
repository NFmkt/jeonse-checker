import { checkHouseConditions, type HouseInput } from '@/lib/houseConditions'

// 서버 간 호출 전용 API. 브라우저에서 직접 부르지 않으므로 CORS 헤더를 두지 않는다.
// 요청 본문에는 보증금·면적 같은 값이 있으므로 로그에 남기지 않는다(성공·실패 모두).

const BAD_REQUEST = { error: '잘못된 요청이에요.' }

function badRequest(): Response {
  return Response.json(BAD_REQUEST, { status: 400 })
}

function parseHouse(body: unknown): HouseInput | null {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) return null
  const { depositKrw, areaSqm, region } = body as Record<string, unknown>

  if (typeof depositKrw !== 'number' || !Number.isSafeInteger(depositKrw) || depositKrw <= 0) {
    return null
  }

  let area: number | null = null
  if (areaSqm !== undefined) {
    if (typeof areaSqm !== 'number' || !Number.isFinite(areaSqm) || areaSqm <= 0) return null
    area = areaSqm
  }

  let regionValue: HouseInput['region'] = null
  if (region !== undefined) {
    if (region !== 'capital' && region !== 'non-capital') return null
    regionValue = region
  }

  return { depositKrw, areaSqm: area, region: regionValue }
}

export async function POST(request: Request): Promise<Response> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest()
  }

  const house = parseHouse(body)
  if (!house) return badRequest()

  return Response.json({ version: 1, ...checkHouseConditions(house) })
}

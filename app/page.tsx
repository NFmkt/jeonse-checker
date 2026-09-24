import { HomeClient } from '@/components/HomeClient'
import { parsePrefill, type RawSearchParams } from '@/lib/prefill'

export default async function Page({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
  const prefill = parsePrefill(await searchParams)
  return <HomeClient prefill={prefill} />
}

import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'all'

  const result = await getCollections(category)
  return NextResponse.json(result)
}

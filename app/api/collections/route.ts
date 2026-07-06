import { NextResponse } from 'next/server'
import { getCollections } from '@/lib/store'
import type { Category } from '@/lib/types'

export const dynamic = 'force-static'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = (searchParams.get('category') || 'all') as Category | 'all'

  const result = getCollections(category)
  return NextResponse.json(result)
}

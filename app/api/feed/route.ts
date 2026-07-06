import { NextResponse } from 'next/server'
import { getFeed } from '@/lib/store'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category') || 'all'

  const feed = await getFeed(category)
  return NextResponse.json(feed)
}

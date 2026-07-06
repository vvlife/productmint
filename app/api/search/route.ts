import { NextResponse } from 'next/server'
import { search } from '@/lib/store'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q') || ''

  if (!q.trim()) {
    return NextResponse.json({ results: [], total: 0 })
  }

  const results = search(q)
  return NextResponse.json(results)
}

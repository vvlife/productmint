import { NextRequest, NextResponse } from 'next/server'
import { getUserIdeas, addUserIdea } from '@/lib/remote-store'
import type { Idea } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const ideas = await getUserIdeas()
    return NextResponse.json({ ideas })
  } catch {
    return NextResponse.json({ ideas: [] })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { title, description, author } = await req.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }
    if (!author?.trim()) {
      return NextResponse.json({ error: 'author is required' }, { status: 400 })
    }

    const idea: Idea = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim().slice(0, 150),
      description: (description || title).trim().slice(0, 500),
      author: author.trim().slice(0, 30),
      platform: 'other',
      sourceUrl: '',
      publishedAt: new Date().toISOString(),
      heat: 1,
      category: '其他',
    }

    await addUserIdea(idea)

    return NextResponse.json({ success: true, idea })
  } catch (error) {
    console.error('Submit idea error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

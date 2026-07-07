import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Vercel serverless 是只读文件系统
// 用户需求存在客户端 localStorage，这个 API 只做参数校验

export async function GET() {
  return NextResponse.json({ ideas: [], note: 'stored in client localStorage' })
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

    const idea = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim().slice(0, 150),
      description: (description || title).trim().slice(0, 500),
      author: author.trim().slice(0, 30),
      platform: 'user' as const,
      sourceUrl: '',
      publishedAt: new Date().toISOString(),
      heat: 1,
    }

    return NextResponse.json({ success: true, idea })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { put, list, del } from '@vercel/blob'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BLOB_PATH = 'user-ideas/ideas.json'

async function loadIdeas(): Promise<any[]> {
  try {
    const { blobs } = await list({ prefix: BLOB_PATH })
    if (blobs.length === 0) return []
    const resp = await fetch(blobs[0].url)
    if (!resp.ok) return []
    const data = await resp.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}

async function saveIdeas(ideas: any[]): Promise<void> {
  // 删除旧文件
  try {
    const { blobs } = await list({ prefix: BLOB_PATH })
    for (const blob of blobs) {
      await del(blob.url)
    }
  } catch {}
  // 写入新文件
  await put(BLOB_PATH, JSON.stringify(ideas), {
    contentType: 'application/json',
    access: 'public',
  })
}

export async function GET() {
  try {
    const ideas = await loadIdeas()
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

    const idea = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim().slice(0, 150),
      description: (description || title).trim().slice(0, 500),
      author: author.trim().slice(0, 30),
      platform: 'user',
      sourceUrl: '',
      publishedAt: new Date().toISOString(),
      heat: 1,
      category: '其他',
    }

    // 读取现有 ideas，添加新的，保存
    const ideas = await loadIdeas()
    ideas.unshift(idea)
    if (ideas.length > 500) ideas.length = 500
    await saveIdeas(ideas)

    return NextResponse.json({ success: true, idea })
  } catch (error) {
    console.error('Submit idea error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

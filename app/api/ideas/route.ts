import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const USER_IDEAS_PATH = path.join(process.cwd(), '.data', 'user-ideas.json')

interface UserIdea {
  id: string
  title: string
  description: string
  author: string
  platform: 'user'
  sourceUrl: string
  publishedAt: string
  heat: number
}

async function loadUserIdeas(): Promise<UserIdea[]> {
  try {
    const raw = await fs.readFile(USER_IDEAS_PATH, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function saveUserIdeas(ideas: UserIdea[]): Promise<void> {
  await fs.mkdir(path.dirname(USER_IDEAS_PATH), { recursive: true })
  await fs.writeFile(USER_IDEAS_PATH, JSON.stringify(ideas, null, 2), 'utf-8')
}

export async function GET() {
  try {
    const ideas = await loadUserIdeas()
    return NextResponse.json({ ideas })
  } catch (error) {
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

    const ideas = await loadUserIdeas()
    const newIdea: UserIdea = {
      id: `user_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title: title.trim().slice(0, 150),
      description: (description || title).trim().slice(0, 500),
      author: author.trim().slice(0, 30),
      platform: 'user',
      sourceUrl: '',
      publishedAt: new Date().toISOString(),
      heat: 1,
    }

    ideas.unshift(newIdea)
    // 最多保留 200 条用户需求
    if (ideas.length > 200) ideas.length = 200
    await saveUserIdeas(ideas)

    return NextResponse.json({ success: true, idea: newIdea })
  } catch (error) {
    console.error('Submit idea error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JSONBLOB_BASE = 'https://jsonblob.com/api/jsonBlob'
const BLOB_ID = process.env.SUBSCRIPTION_BLOB_ID || ''

interface Subscription {
  id: string
  email: string
  topic: string
  createdAt: string
  lastSentAt?: string
}

async function getSubscriptions(): Promise<Subscription[]> {
  if (!BLOB_ID) return []
  try {
    const resp = await fetch(`${JSONBLOB_BASE}/${BLOB_ID}`, { cache: 'no-store' })
    if (!resp.ok) return []
    const data = await resp.json()
    return data.subscriptions || []
  } catch {
    return []
  }
}

async function saveSubscriptions(subs: Subscription[]): Promise<boolean> {
  if (!BLOB_ID) return false
  try {
    const resp = await fetch(`${JSONBLOB_BASE}/${BLOB_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptions: subs }),
    })
    return resp.ok
  } catch {
    return false
  }
}

export async function GET() {
  const subs = await getSubscriptions()
  return NextResponse.json({ subscriptions: subs, total: subs.length })
}

export async function POST(req: NextRequest) {
  try {
    const { email, topic } = await req.json()

    if (!email?.trim()) {
      return NextResponse.json({ error: '邮箱不能为空' }, { status: 400 })
    }
    if (!topic?.trim()) {
      return NextResponse.json({ error: '请选择一个主题' }, { status: 400 })
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: '邮箱格式不正确' }, { status: 400 })
    }

    const subs = await getSubscriptions()

    // 检查是否已订阅
    const existing = subs.find(s => s.email === email)
    if (existing) {
      // 更新主题（只保留一个）
      existing.topic = topic
      await saveSubscriptions(subs)
      return NextResponse.json({ success: true, message: '订阅已更新', subscription: existing })
    }

    // 创建新订阅（每人一个邮箱一个主题）
    const newSub: Subscription = {
      id: `sub_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: email.trim(),
      topic: topic,
      createdAt: new Date().toISOString(),
    }

    subs.push(newSub)
    await saveSubscriptions(subs)

    return NextResponse.json({ success: true, subscription: newSub })
  } catch (error) {
    console.error('Subscription error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '未知错误' },
      { status: 500 }
    )
  }
}

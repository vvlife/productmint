import { NextRequest, NextResponse } from 'next/server'
import { webSearch } from '@/lib/web-search'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const JSONBLOB_BASE = 'https://jsonblob.com/api/jsonBlob'
const SUBSCRIPTION_BLOB_ID = process.env.SUBSCRIPTION_BLOB_ID || ''
const IDEAS_BLOB_ID = process.env.JSONBLOB_ID || ''

interface Subscription {
  id: string
  email: string
  topics: string[]
  createdAt: string
  lastSentAt?: string
}

interface PendingIdea {
  id: string
  email: string
  title: string
  description: string
  topic: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
}

async function getSubscriptions(): Promise<Subscription[]> {
  if (!SUBSCRIPTION_BLOB_ID) return []
  try {
    const resp = await fetch(`${JSONBLOB_BASE}/${SUBSCRIPTION_BLOB_ID}`, { cache: 'no-store' })
    if (!resp.ok) return []
    const data = await resp.json()
    return data.subscriptions || []
  } catch {
    return []
  }
}

async function saveSubscriptions(subs: Subscription[]): Promise<boolean> {
  if (!SUBSCRIPTION_BLOB_ID) return false
  try {
    const resp = await fetch(`${JSONBLOB_BASE}/${SUBSCRIPTION_BLOB_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptions: subs }),
    })
    return resp.ok
  } catch {
    return false
  }
}

async function getPendingIdeas(): Promise<PendingIdea[]> {
  if (!SUBSCRIPTION_BLOB_ID) return []
  try {
    const resp = await fetch(`${JSONBLOB_BASE}/${SUBSCRIPTION_BLOB_ID}`, { cache: 'no-store' })
    if (!resp.ok) return []
    const data = await resp.json()
    return data.pendingIdeas || []
  } catch {
    return []
  }
}

async function savePendingIdeas(ideas: PendingIdea[]): Promise<boolean> {
  if (!SUBSCRIPTION_BLOB_ID) return false
  try {
    const resp = await fetch(`${JSONBLOB_BASE}/${SUBSCRIPTION_BLOB_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pendingIdeas: ideas }),
    })
    return resp.ok
  } catch {
    return false
  }
}

function generateApprovalToken(email: string, ideaId: string, ideaTitle: string): string {
  return Buffer.from(JSON.stringify({ email, ideaId, ideaTitle })).toString('base64')
}

async function sendEmail(to: string, subject: string, html: string) {
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  if (!RESEND_API_KEY) {
    console.log('[email] No RESEND_API_KEY, skipping email')
    return
  }

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'IdeaHub <onboarding@resend.dev>',
        to,
        subject,
        html,
      }),
    })
    console.log(`[email] Sent to ${to}: ${subject}`)
  } catch (e) {
    console.error(`[email] Failed to send to ${to}:`, e)
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Daily collection endpoint. Use POST to trigger.' })
}

export async function POST() {
  console.log('[daily] Starting daily collection...')

  const subs = await getSubscriptions()
  if (subs.length === 0) {
    console.log('[daily] No subscriptions found')
    return NextResponse.json({ success: true, message: 'No subscriptions' })
  }

  const pendingIdeas = await getPendingIdeas()
  let newIdeasCount = 0

  for (const sub of subs) {
    for (const topicId of sub.topics) {
      try {
        // 搜索该主题的最新资讯
        const searchResults = await webSearch(`${topicId} 创业 产品 需求`, 5)

        for (const result of searchResults) {
          // 检查是否已存在
          const exists = pendingIdeas.some(
            pi => pi.email === sub.email && pi.title === result.title
          )
          if (exists) continue

          const ideaId = `idea_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
          const newIdea: PendingIdea = {
            id: ideaId,
            email: sub.email,
            title: result.title,
            description: result.description,
            topic: topicId,
            createdAt: new Date().toISOString(),
            status: 'pending',
          }

          pendingIdeas.push(newIdea)
          newIdeasCount++

          // 生成审批链接
          const token = generateApprovalToken(sub.email, ideaId, result.title)
          const approveUrl = `https://ideahub-pearl.vercel.app/api/approve?token=${token}`

          // 发送邮件
          await sendEmail(
            sub.email,
            `新想法：${result.title}`,
            `
              <h2>${result.title}</h2>
              <p>${result.description}</p>
              <hr>
              <p>
                <a href="${approveUrl}" style="display:inline-block;padding:10px 20px;background:#111;color:white;border-radius:8px;text-decoration:none;">
                  批准并生成产品
                </a>
              </p>
              <p style="color:#666;font-size:12px;">点击批准后，我们会自动生成产品方案并发送到你的邮箱。</p>
            `
          )
        }
      } catch (e) {
        console.error(`[daily] Error processing topic ${topicId} for ${sub.email}:`, e)
      }
    }

    // 更新最后发送时间
    sub.lastSentAt = new Date().toISOString()
  }

  await savePendingIdeas(pendingIdeas)
  await saveSubscriptions(subs)

  console.log(`[daily] Done. ${newIdeasCount} new ideas sent to ${subs.length} subscribers.`)

  return NextResponse.json({
    success: true,
    subscribers: subs.length,
    newIdeas: newIdeasCount,
  })
}

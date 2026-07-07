import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new Response('无效的链接', { status: 400 })
  }

  // 解析 token: base64 encoded { email, ideaId, ideaTitle }
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString())
    const { email, ideaId, ideaTitle } = decoded

    if (!email || !ideaId) {
      return new Response('无效的链接', { status: 400 })
    }

    // 触发产品生成
    const genResp = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://ideahub-pearl.vercel.app'}/api/generate-idea`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ideaId, ideaTitle }),
    })

    const result = await genResp.json()

    if (result.success) {
      return new Response(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>IdeaHub - 已批准</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; background: #f9fafb; }
            .card { text-align: center; padding: 3rem; background: white; border-radius: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); max-width: 400px; }
            h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
            p { color: #6b7280; margin-bottom: 1.5rem; }
            a { color: #2563eb; text-decoration: none; }
            a:hover { text-decoration: underline; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>已批准</h1>
            <p>「${ideaTitle}」的产品方案正在生成中，<br>完成后会发送到你的邮箱。</p>
            <a href="https://ideahub-pearl.vercel.app">返回 IdeaHub</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    } else {
      return new Response('生成失败，请稍后重试', { status: 500 })
    }
  } catch (e) {
    return new Response('无效的链接', { status: 400 })
  }
}

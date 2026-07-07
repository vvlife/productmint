import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return new Response('无效的链接', {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }

  // 验证 token 格式
  try {
    const decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf-8'))
    if (!decoded.email || !decoded.ideaId) {
      return new Response('无效的链接', {
        status: 400,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      })
    }

    // 重定向到预览页面
    return NextResponse.redirect(new URL(`/preview/${token}`, request.url))
  } catch (e) {
    return new Response('无效的链接', {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    })
  }
}

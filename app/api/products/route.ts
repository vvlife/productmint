import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// 产品数据由前端 localStorage 管理，这个 API 仅用于占位
// 实际产品列表通过 localStorage 在前端共享

export async function GET() {
  return NextResponse.json({
    message: 'Products are stored client-side in localStorage',
    products: [],
  })
}

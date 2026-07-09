import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/remote-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const products = await getAllProducts()

    // 只展示有 HTML 的产品（已生成的）
    const communityProducts = products
      .filter(p => p.generatedHtml || (p.versions && p.versions.length > 0))
      .sort((a, b) => (b.votes || 0) - (a.votes || 0) || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((p, index) => ({
        id: p.id,
        name: p.name,
        tagline: p.tagline,
        ideaTitle: p.ideaTitle,
        createdAt: p.createdAt,
        votes: p.votes || 0,
        votedBy: p.votedBy || [],
        generatedHtml: p.generatedHtml || '',
        versions: p.versions || [],
        currentVersion: p.currentVersion || (p.versions ? p.versions.length : 0),
        rank: index + 1,
      }))

    return NextResponse.json({ products: communityProducts })
  } catch (error) {
    console.error('Community API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

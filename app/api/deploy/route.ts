import { NextRequest, NextResponse } from 'next/server'
import { getProduct, updateProductDeployUrl } from '@/lib/remote-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { productId } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const product = await getProduct(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const html = product.generatedHtml || product.versions?.[product.versions.length - 1]?.html || ''
    if (!html.trim()) {
      return NextResponse.json({ error: 'No HTML to deploy' }, { status: 400 })
    }

    // 公网链接就是 IdeaHub 自身的 /p/{productId} 路由
    const origin = req.headers.get('origin') || req.headers.get('host') || ''
    const protocol = origin.includes('localhost') ? 'http' : 'https'
    const deployUrl = `${protocol}://${origin}/p/${productId}`

    await updateProductDeployUrl(productId, deployUrl)

    return NextResponse.json({
      success: true,
      url: deployUrl,
      productId,
      deployedAt: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Deploy API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

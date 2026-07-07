import { NextRequest, NextResponse } from 'next/server'
import { getProduct } from '@/lib/remote-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

interface SubmitRequest {
  productId: string
  email: string
  category?: string
}

export async function POST(req: NextRequest) {
  try {
    const { productId, email, category } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }
    if (!email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const product = await getProduct(productId)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const host = req.headers.get('host') || 'ideahub-lyart.vercel.app'
    const productUrl = `https://${host}/product/${productId}/app`

    const payload = {
      productType: 'web',
      name: product.name,
      webUrl: productUrl,
      iconUrl: `${productUrl}/favicon.ico`,
      categories: category || 'AI Vibe Coding',
      subtitle: product.tagline,
      description: product.problem
        ? `${product.tagline}\n\n${product.problem}\n\n${product.solution || ''}`
        : product.tagline,
      contactEmail: email,
      lang: 'zh',
    }

    const resp = await fetch('https://www.aicpb.com/api/submit-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    })

    const data = await resp.json()

    if (data.code === 200) {
      return NextResponse.json({
        success: true,
        platform: 'AICPB',
        id: data.data?.id,
        message: '提交成功，等待审核',
      })
    } else {
      return NextResponse.json({
        success: false,
        platform: 'AICPB',
        error: data.message || '提交失败',
      }, { status: 400 })
    }
  } catch (error) {
    console.error('Submit leaderboard error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

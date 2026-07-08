import { NextRequest, NextResponse } from 'next/server'
import { getProduct, addProduct } from '@/lib/remote-store'
import type { Product } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { productId, userId } = await req.json()

    if (!productId) {
      return NextResponse.json({ error: 'productId is required' }, { status: 400 })
    }

    const original = await getProduct(productId)
    if (!original) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 创建产品副本
    const cloned: Product = {
      ...original,
      id: `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: `${original.name} (改编)`,
      clonedFrom: productId,
      createdAt: new Date().toISOString(),
      votes: 0,
      votedBy: [],
      versions: original.versions ? [...original.versions] : undefined,
      currentVersion: original.currentVersion,
      generatedHtml: original.generatedHtml,
    }

    await addProduct(cloned)

    return NextResponse.json({
      success: true,
      product: cloned,
      message: `已复制「${original.name}」，可以在对话中告诉我要怎么修改`,
    })
  } catch (error) {
    console.error('Clone error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

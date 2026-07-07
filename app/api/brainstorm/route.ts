import { NextRequest, NextResponse } from 'next/server'
import { createBrainstormSession, getProduct } from '@/lib/remote-store'
import type { BrainstormSession } from '@/lib/types'

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

    const session: BrainstormSession = {
      id: `bs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      productId,
      productTitle: product.name,
      status: 'active',
      participants: [],
      requirementCount: 0,
      createdAt: new Date().toISOString(),
    }

    await createBrainstormSession(session)

    return NextResponse.json({ success: true, session })
  } catch (error) {
    console.error('Create brainstorm error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

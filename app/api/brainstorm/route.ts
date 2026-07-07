import { NextRequest, NextResponse } from 'next/server'
import { createBrainstormSession, getProduct } from '@/lib/remote-store'
import type { BrainstormSession } from '@/lib/types'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const { productId, title } = await req.json()

    let productTitle = title || '未命名讨论'

    if (productId) {
      const product = await getProduct(productId)
      if (product) {
        productTitle = product.name
      }
    }

    const session: BrainstormSession = {
      id: `bs_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      productId: productId || '',
      productTitle,
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

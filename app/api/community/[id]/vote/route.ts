import { NextRequest, NextResponse } from 'next/server'
import { getProduct, updateProduct } from '@/lib/remote-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { userId } = await req.json()
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 })
    }

    const product = await getProduct(id)
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const votes = product.votes || 0
    const votedBy = product.votedBy || []
    const hasVoted = votedBy.includes(userId)

    const newVotes = hasVoted ? Math.max(0, votes - 1) : votes + 1
    const newVotedBy = hasVoted
      ? votedBy.filter(uid => uid !== userId)
      : [...votedBy, userId]

    await updateProduct(id, { votes: newVotes, votedBy: newVotedBy })

    return NextResponse.json({
      success: true,
      votes: newVotes,
      hasVoted: !hasVoted,
    })
  } catch (error) {
    console.error('Vote error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

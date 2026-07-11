import { NextRequest, NextResponse } from 'next/server'
import { getAllProducts } from '@/lib/remote-store'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * 红果短剧模式：AI 游戏（无广告）和 GM 游戏（有广告）混合排列
 * 默认每 4 个 AI 游戏后插 1 个 GM 游戏（20% 广告密度）
 */
function interleaveProducts<T extends { id: string; votes?: number; createdAt?: string }>(
  aiGames: T[],
  gmGames: T[],
  adEvery: number = 4,
): T[] {
  const result: T[] = []
  let aiIdx = 0
  let gmIdx = 0
  let sinceLastAd = 0

  while (aiIdx < aiGames.length || gmIdx < gmGames.length) {
    if (aiIdx < aiGames.length) {
      result.push(aiGames[aiIdx])
      aiIdx++
      sinceLastAd++
    }

    if (sinceLastAd >= adEvery && gmIdx < gmGames.length) {
      result.push(gmGames[gmIdx])
      gmIdx++
      sinceLastAd = 0
    }

    if (aiIdx >= aiGames.length && gmIdx < gmGames.length) {
      while (gmIdx < gmGames.length) {
        result.push(gmGames[gmIdx])
        gmIdx++
      }
    }
  }

  if (aiGames.length === 0) return gmGames

  return result
}

/** Fisher-Yates shuffle (in-place) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const adEvery = parseInt(url.searchParams.get('adEvery') || '4')
    const excludeParam = url.searchParams.get('exclude') || ''
    const excludeSet = new Set(excludeParam ? excludeParam.split(',').filter(Boolean) : [])

    const products = await getAllProducts()

    // Filter products that have HTML
    const withHtml = products.filter(p => p.generatedHtml || (p.versions && p.versions.length > 0))

    // Exclude already-viewed products (for refresh)
    let available = withHtml
    if (excludeSet.size > 0) {
      available = withHtml.filter(p => !excludeSet.has(p.id))
    }

    // If everything was excluded (user has seen all), reset and show all again
    if (available.length === 0 && withHtml.length > 0) {
      available = withHtml
    }

    // Split into AI games and GM (ad) games
    const aiGames = available.filter(p => !p.id.startsWith('prod_gm_'))
    const gmGames = available.filter(p => p.id.startsWith('prod_gm_'))

    // When refreshing (exclude present), shuffle for random order
    if (excludeSet.size > 0) {
      shuffle(aiGames)
      shuffle(gmGames)
    } else {
      // Initial load: sort by votes (desc) then date (desc)
      const sortByVotes = (a: typeof aiGames[0], b: typeof aiGames[0]) =>
        (b.votes || 0) - (a.votes || 0) ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      aiGames.sort(sortByVotes)
      gmGames.sort(sortByVotes)
    }

    // Interleave: every N AI games, insert 1 GM game
    const interleaved = interleaveProducts(aiGames, gmGames, adEvery)

    const communityProducts = interleaved.map((p, index) => ({
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
      _thumb: p._thumb || '',
      _source: p._source || '',
      _category: p._category || '',
    }))

    return NextResponse.json({
      products: communityProducts,
      stats: {
        total: communityProducts.length,
        aiGames: aiGames.length,
        gmGames: gmGames.length,
        adEvery,
        excluded: excludeSet.size,
      }
    })
  } catch (error) {
    console.error('Community API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

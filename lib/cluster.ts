import type { Idea, Collection, Category } from './types'

// ── Tokenize: extract meaningful keywords from text ────────────
function tokenize(text: string): Set<string> {
  const lower = text.toLowerCase()
  const chineseMatches = lower.match(/[\u4e00-\u9fa5]{2,}/g) || []
  const englishMatches = lower.match(/[a-z]{2,}/g) || []

  const stopWords = new Set([
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might', 'must', 'can', 'need',
    'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of',
    'with', 'by', 'from', 'about', 'as', 'into', 'like', 'through',
    'after', 'over', 'between', 'out', 'against', 'during', 'without',
    'before', 'under', 'around', 'among',
    '有没有', '求推荐', '求一个', '如何', '怎么', '怎样',
    '什么', '为什么', '哪个', '哪些', '帮忙', '求助',
    '请问', '想要', '需要', '希望', '寻找',
    'show', 'ask', 'just', 'this', 'that', 'it', 'they',
    'them', 'their', 'there', 'here', 'where', 'when',
    'which', 'who', 'what', 'how', 'why', 'anyone',
    'looking', 'for', 'somebody', 'make',
  ])

  const tokens = new Set<string>()
  for (const w of [...chineseMatches, ...englishMatches]) {
    if (!stopWords.has(w)) {
      tokens.add(w)
    }
  }
  return tokens
}

// ── Extract named entities (product/company names) ─────────────
function extractEntities(text: string): Set<string> {
  const entities = new Set<string>()

  // Match capitalized words (English product/company names)
  const capitalized = text.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || []
  for (const e of capitalized) {
    if (e.length > 2) entities.add(e.toLowerCase())
  }

  // Match common Chinese product patterns
  const chineseEntities = text.match(/[\u4e00-\u9fa5]{2,6}(?:平台|产品|工具|应用|服务|公司|团队)/g) || []
  for (const e of chineseEntities) {
    entities.add(e)
  }

  return entities
}

// ── Content similarity: strict match on entities + keywords ────
function contentSimilarity(a: Idea, b: Idea): number {
  const textA = `${a.title} ${a.description}`
  const textB = `${b.title} ${b.description}`

  const entitiesA = extractEntities(textA)
  const entitiesB = extractEntities(textB)

  // If both have named entities, check overlap
  if (entitiesA.size > 0 && entitiesB.size > 0) {
    let entityOverlap = 0
    for (const e of entitiesA) {
      if (entitiesB.has(e)) entityOverlap++
    }
    const entityUnion = entitiesA.size + entitiesB.size - entityOverlap
    const entitySim = entityUnion === 0 ? 0 : entityOverlap / entityUnion

    // High entity overlap means same subject
    if (entitySim > 0.3) return entitySim
  }

  // Fallback to keyword similarity with high threshold
  const tokensA = tokenize(textA)
  const tokensB = tokenize(textB)

  if (tokensA.size === 0 || tokensB.size === 0) return 0

  let intersection = 0
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++
  }
  const union = tokensA.size + tokensB.size - intersection
  return union === 0 ? 0 : intersection / union
}

// ── Extract common keywords for collection title ───────────────
function extractCommonKeywords(ideas: Idea[]): string[] {
  const tokenCounts = new Map<string, number>()

  for (const idea of ideas) {
    const tokens = tokenize(`${idea.title} ${idea.description}`)
    for (const token of tokens) {
      tokenCounts.set(token, (tokenCounts.get(token) || 0) + 1)
    }
  }

  const sorted = Array.from(tokenCounts.entries())
    .filter(([_, count]) => count >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([token]) => token)

  return sorted
}

function generateCollectionTitle(ideas: Idea[]): string {
  const keywords = extractCommonKeywords(ideas)
  if (keywords.length > 0) {
    return keywords.join(' · ') + ' 相关动态'
  }
  const firstTitle = ideas[0].title
  return firstTitle.length > 20 ? firstTitle.slice(0, 20) + '...' : firstTitle
}

function generateCollectionSummary(ideas: Idea[]): string {
  const totalHeat = ideas.reduce((sum, i) => sum + i.heat, 0)
  return `${ideas.length}条相关动态，累计关注${totalHeat}+。`
}

// ── Cluster ideas: only merge when content主体 is the same ────
export function clusterIdeas(
  ideas: Idea[],
  _threshold?: number
): { ideas: Idea[]; collections: Collection[] } {
  if (ideas.length === 0) return { ideas: [], collections: [] }

  const HIGH_THRESHOLD = 0.6

  const parent: number[] = ideas.map((_, i) => i)

  function find(x: number): number {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]]
      x = parent[x]
    }
    return x
  }

  function union(x: number, y: number) {
    const px = find(x)
    const py = find(y)
    if (px !== py) parent[px] = py
  }

  for (let i = 0; i < ideas.length; i++) {
    for (let j = i + 1; j < ideas.length; j++) {
      const sim = contentSimilarity(ideas[i], ideas[j])
      if (sim >= HIGH_THRESHOLD) {
        union(i, j)
      }
    }
  }

  const groups = new Map<number, number[]>()
  for (let i = 0; i < ideas.length; i++) {
    const root = find(i)
    if (!groups.has(root)) groups.set(root, [])
    groups.get(root)!.push(i)
  }

  const updatedIdeas: Idea[] = []
  const collections: Collection[] = []
  let collectionCounter = 0

  for (const indices of groups.values()) {
    if (indices.length >= 2) {
      const collectionId = `col_${Date.now()}_${collectionCounter++}`
      const groupIdeas = indices.map(i => ideas[i])

      const categoryCounts = new Map<string, number>()
      for (const idea of groupIdeas) {
        categoryCounts.set(idea.category, (categoryCounts.get(idea.category) || 0) + 1)
      }
      const category = Array.from(categoryCounts.entries())
        .sort((a, b) => b[1] - a[1])[0]?.[0] as Category || '其他'

      const collection: Collection = {
        id: collectionId,
        title: generateCollectionTitle(groupIdeas),
        summary: generateCollectionSummary(groupIdeas),
        category,
        ideaIds: groupIdeas.map(i => i.id),
        createdAt: new Date().toISOString(),
      }

      for (const idea of groupIdeas) {
        updatedIdeas.push({ ...idea, collectionId })
      }
      collections.push(collection)
    } else {
      updatedIdeas.push(ideas[indices[0]])
    }
  }

  return { ideas: updatedIdeas, collections }
}

import type { RawIdea, Platform } from '../types'

// GitHub Issues - 用户在热门项目中提的 feature request
export async function crawlGitHubIssues(): Promise<RawIdea[]> {
  const results: RawIdea[] = []

  // 搜索带有 feature-request / enhancement 标签的 issue
  const queries = [
    'label:feature-request is:open stars:>1000',
    'label:enhancement is:open stars:>500',
    'label:"help wanted" is:open stars:>1000',
  ]

  for (const q of queries.slice(0, 2)) {
    try {
      const resp = await fetch(
        `https://api.github.com/search/issues?q=${encodeURIComponent(q)}&sort=created&order=desc&per_page=10`,
        {
          headers: { 'User-Agent': 'IdeaHub/1.0', 'Accept': 'application/vnd.github.v3+json' },
          signal: AbortSignal.timeout(8000),
        }
      )
      if (!resp.ok) continue
      const data = await resp.json()

      for (const issue of (data.items || []).slice(0, 8)) {
        const repoName = issue.repository_url?.split('/').slice(-2).join('/') || ''
        results.push({
          title: `[${repoName}] ${issue.title}`.slice(0, 120),
          description: (issue.body || issue.title).slice(0, 300),
          platform: 'github' as Platform,
          sourceUrl: issue.html_url,
          publishedAt: issue.created_at || new Date().toISOString(),
          heat: issue.reactions?.['+1'] || 0,
        })
      }
    } catch {}
    if (results.length >= 15) break
  }

  return results
}

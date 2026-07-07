import type { RawIdea, Platform } from '../types'

export async function crawlGitHubTrending(): Promise<RawIdea[]> {
  const results: RawIdea[] = []
  const resp = await fetch('https://api.github.com/search/repositories?q=created:>2026-06-01&sort=stars&order=desc&per_page=15', {
    headers: { 'User-Agent': 'IdeaHub/1.0', 'Accept': 'application/vnd.github.v3+json' },
    signal: AbortSignal.timeout(10000),
  })
  if (!resp.ok) throw new Error(`GitHub API returned ${resp.status}`)
  const data = await resp.json()

  for (const repo of (data.items || []).slice(0, 15)) {
    results.push({
      title: `${repo.full_name} - ${repo.description || 'No description'}`.slice(0, 120),
      description: repo.description || repo.full_name,
      platform: 'github' as Platform,
      sourceUrl: repo.html_url,
      publishedAt: repo.created_at,
      heat: repo.stargazers_count || 0,
    })
  }
  return results
}

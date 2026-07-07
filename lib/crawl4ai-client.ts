/**
 * Crawl4AI 客户端 - 调用 Python crawl-server 获取网页内容
 */

const CRAWL_SERVER = process.env.CRAWL4AI_URL || 'http://127.0.0.1:8765'

interface CrawlResult {
  success: boolean
  url: string
  title: string
  markdown: string
  fit_markdown: string
  links: { internal: string[]; external: string[] }
}

interface BatchResult {
  results: Array<{
    url: string
    success: boolean
    title?: string
    markdown?: string
    error?: string
  }>
}

export async function crawlUrl(url: string, cssSelector?: string): Promise<CrawlResult> {
  const resp = await fetch(`${CRAWL_SERVER}/crawl`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, css_selector: cssSelector }),
    signal: AbortSignal.timeout(30000),
  })
  if (!resp.ok) throw new Error(`Crawl4AI error: ${resp.status}`)
  return resp.json()
}

export async function crawlBatch(urls: string[]): Promise<BatchResult> {
  const resp = await fetch(`${CRAWL_SERVER}/crawl/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ urls }),
    signal: AbortSignal.timeout(60000),
  })
  if (!resp.ok) throw new Error(`Crawl4AI batch error: ${resp.status}`)
  return resp.json()
}

export async function isCrawlServerAvailable(): Promise<boolean> {
  try {
    const resp = await fetch(`${CRAWL_SERVER}/health`, { signal: AbortSignal.timeout(3000) })
    return resp.ok
  } catch {
    return false
  }
}

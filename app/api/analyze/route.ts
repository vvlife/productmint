import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const AGNES_API_KEY = process.env.AGNES_API_KEY || ''
const AGNES_BASE_URL = 'https://apihub.agnes-ai.com/v1'

interface AnalyzeRequest {
  ideaTitle: string
  ideaDescription: string
  platform: string
  category: string
}

export async function POST(req: NextRequest) {
  try {
    const body: AnalyzeRequest = await req.json()
    const { ideaTitle, ideaDescription, platform, category } = body

    if (!ideaTitle) {
      return NextResponse.json({ error: 'ideaTitle is required' }, { status: 400 })
    }

    if (!AGNES_API_KEY) {
      return NextResponse.json({ error: 'AGNES_API_KEY not configured' }, { status: 500 })
    }

    const prompt = `你是一个资深产品经理和创业顾问。请分析以下用户需求，并设计一个产品方案来解决这个问题。

## 用户需求
- **标题**: ${ideaTitle}
- **描述**: ${ideaDescription}
- **来源平台**: ${platform}
- **需求分类**: ${category}

## 请输出 JSON 格式的产品方案（不要输出其他内容，只输出 JSON）

{
  "name": "产品名称（简洁有力，中文）",
  "tagline": "一句话描述产品的核心价值",
  "problem": "深入分析这个需求背后的真实问题是什么，用户的痛点在哪里",
  "solution": "产品如何解决这个问题，核心思路是什么",
  "targetUsers": "目标用户群体是谁，包括主要和次要用户",
  "coreFeatures": ["核心功能1", "核心功能2", "核心功能3", "核心功能4"],
  "techStack": ["推荐技术1", "推荐技术2", "推荐技术3"],
  "monetization": "商业模式，如何赚钱",
  "competitors": "现有竞品分析，谁在做类似的事",
  "differentiator": "我们的差异化优势是什么",
  "mvp": "MVP 版本应该包含什么，最快多久能上线"
}`

    const response = await fetch(`${AGNES_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AGNES_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'agnes-2.0-flash',
        messages: [
          { role: 'system', content: '你是一个资深产品经理和创业顾问，擅长分析用户需求并设计产品方案。请只输出 JSON，不要输出 markdown 代码块标记。' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Agnes API error:', response.status, errText)
      return NextResponse.json(
        { error: `Agnes API error: ${response.status}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    let content = data.choices?.[0]?.message?.content || ''

    // 清理可能的 markdown 代码块标记
    content = content.trim()
    if (content.startsWith('```json')) {
      content = content.slice(7)
    }
    if (content.startsWith('```')) {
      content = content.slice(3)
    }
    if (content.endsWith('```')) {
      content = content.slice(0, -3)
    }
    content = content.trim()

    let product
    try {
      product = JSON.parse(content)
    } catch {
      // 如果 JSON 解析失败，返回原始内容
      return NextResponse.json({
        error: 'Failed to parse AI response as JSON',
        raw: content,
      }, { status: 502 })
    }

    return NextResponse.json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Analyze API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

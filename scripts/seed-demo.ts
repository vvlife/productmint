// 注入 demo 产品和 brainstorm session，让截图有内容
import { promises as fs } from 'fs'
import path from 'path'

const STORE_PATH = path.join(process.cwd(), '.data', 'store.json')

const now = new Date()
const minutesAgo = (m: number) => new Date(now.getTime() - m * 60 * 1000).toISOString()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000).toISOString()

const products = [
  {
    id: 'prod_mindmirror_001',
    name: 'MindMirror',
    tagline: 'AI 驱动的心理健康日记，从情绪识别到成长建议',
    ideaTitle: '36 岁 app 开发 今年失业了',
    createdAt: hoursAgo(2),
    votes: 7,
    votedBy: [],
    generatedHtml: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>MindMirror</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen"><div class="max-w-2xl mx-auto px-4 py-12"><h1 class="text-4xl font-bold text-gray-900 mb-2">MindMirror</h1><p class="text-lg text-gray-600 mb-8">AI 驱动的心理健康日记，从情绪识别到成长建议</p><div class="bg-white rounded-2xl shadow-sm p-6 mb-6"><h2 class="text-xl font-semibold mb-4">🌱 今日心情</h2><textarea class="w-full border rounded-lg p-3" rows="3" placeholder="今天感觉怎么样？"></textarea><button class="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-lg">AI 分析情绪</button></div><div class="grid grid-cols-2 gap-4"><div class="bg-white rounded-2xl shadow-sm p-4"><div class="text-3xl font-bold text-indigo-600">7</div><div class="text-sm text-gray-500">连续记录天数</div></div><div class="bg-white rounded-2xl shadow-sm p-4"><div class="text-3xl font-bold text-purple-600">82%</div><div class="text-sm text-gray-500">积极情绪占比</div></div></div></div></body></html>',
    versions: [
      { id: 'v1', html: '<html>v1</html>', createdAt: hoursAgo(2) },
      { id: 'v2', html: '<html>v2</html>', createdAt: hoursAgo(1) },
    ],
  },
  {
    id: 'prod_inkpath_002',
    name: 'InkPath',
    tagline: '把 AI 模型的"灵感路径"画给你看',
    ideaTitle: '让 AI 写代码的过程不再黑箱',
    createdAt: hoursAgo(5),
    votes: 4,
    votedBy: [],
    generatedHtml: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>InkPath</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-slate-50 min-h-screen"><div class="max-w-4xl mx-auto px-4 py-12"><h1 class="text-3xl font-bold text-slate-900 mb-2">InkPath</h1><p class="text-slate-600 mb-6">可视化 AI 写代码的每一步推理</p><div class="bg-white rounded-xl border p-4 mb-4"><div class="text-xs text-slate-400 mb-2">Step 1/5 · 分析需求</div><div class="font-mono text-sm text-slate-700">理解用户的输入：实现一个登录页...</div></div><div class="bg-white rounded-xl border p-4 mb-4"><div class="text-xs text-slate-400 mb-2">Step 2/5 · 选择技术栈</div><div class="font-mono text-sm text-slate-700">React + TypeScript + Tailwind CSS</div></div><div class="bg-white rounded-xl border p-4"><div class="text-xs text-slate-400 mb-2">Step 3/5 · 设计组件结构</div><div class="font-mono text-sm text-slate-700">LoginForm → Input + Button + Validation</div></div></div></body></html>',
    versions: [{ id: 'v1', html: '<html>v1</html>', createdAt: hoursAgo(5) }],
  },
  {
    id: 'prod_pomodoro_003',
    name: 'FocusFlow',
    tagline: 'AI 帮你判断"现在该不该休息"',
    ideaTitle: '深度工作被打断的成本太高了',
    createdAt: hoursAgo(8),
    votes: 3,
    votedBy: [],
    generatedHtml: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>FocusFlow</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-rose-50 min-h-screen"><div class="max-w-md mx-auto px-4 py-16 text-center"><div class="text-6xl mb-4">🎯</div><h1 class="text-3xl font-bold text-rose-900 mb-2">FocusFlow</h1><p class="text-rose-700 mb-8">AI 帮你判断"现在该不该休息"</p><div class="bg-white rounded-2xl shadow p-8"><div class="text-5xl font-mono font-bold text-rose-600 mb-4">25:00</div><div class="w-full bg-rose-100 rounded-full h-2 mb-4"><div class="bg-rose-500 h-2 rounded-full" style="width: 60%"></div></div><p class="text-sm text-slate-500">正在深度工作中</p></div></div></body></html>',
    versions: [{ id: 'v1', html: '<html>v1</html>', createdAt: hoursAgo(8) }],
  },
  {
    id: 'prod_kitchen_004',
    name: 'FridgeMuse',
    tagline: '拍一下冰箱，AI 告诉你今晚做什么',
    ideaTitle: '996 程序员回家不知道吃啥',
    createdAt: hoursAgo(12),
    votes: 2,
    votedBy: [],
    generatedHtml: '<!DOCTYPE html><html><head><meta charset="utf-8"><title>FridgeMuse</title><script src="https://cdn.tailwindcss.com"></script></head><body class="bg-orange-50 min-h-screen"><div class="max-w-md mx-auto px-4 py-12"><h1 class="text-3xl font-bold text-orange-900 mb-2">🥗 FridgeMuse</h1><p class="text-orange-700 mb-6">拍一下冰箱，AI 告诉你今晚做什么</p><div class="bg-white rounded-2xl p-6 mb-4"><div class="aspect-video bg-orange-100 rounded-xl flex items-center justify-center text-4xl mb-4">📸</div><button class="w-full py-3 bg-orange-500 text-white rounded-xl font-semibold">打开相机</button></div><div class="bg-white rounded-2xl p-6"><h2 class="font-semibold mb-3">🍳 推荐菜谱</h2><div class="space-y-2"><div class="p-3 bg-orange-50 rounded-lg"><div class="font-medium">番茄炒蛋</div><div class="text-xs text-gray-500">用时 10 分钟</div></div><div class="p-3 bg-orange-50 rounded-lg"><div class="font-medium">青椒肉丝</div><div class="text-xs text-gray-500">用时 15 分钟</div></div></div></div></div></body></html>',
    versions: [{ id: 'v1', html: '<html>v1</html>', createdAt: hoursAgo(12) }],
  },
]

const brainstormSessions = [
  {
    id: 'demo_session_saas',
    title: '面向独立开发者的轻量 CRM',
    ideaTitle: '独立开发者需要一个不臃肿的 CRM',
    createdAt: hoursAgo(3),
  },
  {
    id: 'demo_session_ai',
    title: 'AI 写作工具的差异化',
    ideaTitle: '现在 AI 写作工具同质化严重',
    createdAt: hoursAgo(10),
  },
]

const brainstormRequirements = [
  // session 1: SaaS CRM
  { id: 'r1', sessionId: 'demo_session_saas', author: '阿星', type: 'requirement', content: '需要支持自定义字段，每个独立开发者的客户跟进维度不同', createdAt: hoursAgo(2) },
  { id: 'r2', sessionId: 'demo_session_saas', author: '小李', type: 'requirement', content: '邮件 / 微信 / Twitter 消息统一收件箱是关键痛点', createdAt: hoursAgo(2) },
  { id: 'r3', sessionId: 'demo_session_saas', author: 'vivy', type: 'feedback', content: '目前用 Notion 做 CRM，但缺少跟进提醒和转化漏斗', createdAt: minutesAgo(45) },
  { id: 'r4', sessionId: 'demo_session_saas', author: '老王', type: 'suggestion', content: '建议加一个 "客户故事" 模块，记录沟通中的关键洞察', createdAt: minutesAgo(15) },
  // session 2: AI writing
  { id: 'r5', sessionId: 'demo_session_ai', author: '小鹿', type: 'requirement', content: '需要支持中文长文写作的连贯性，不要每次都重新理解上下文', createdAt: hoursAgo(8) },
  { id: 'r6', sessionId: 'demo_session_ai', author: '阿星', type: 'feedback', content: '现在所有 AI 写作工具输出都很"AI 味"，缺少人味', createdAt: hoursAgo(5) },
  { id: 'r7', sessionId: 'demo_session_ai', author: 'vivy', type: 'suggestion', content: '可以加一个 "模仿我的文风" 模式，让 AI 学习用户过去的文章', createdAt: minutesAgo(30) },
]

const data = {
  products,
  analysis: [],
  brainstormSessions,
  brainstormRequirements,
  userIdeas: [],
}

async function main() {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true })
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
  console.log(`✅ Seeded ${products.length} products, ${brainstormSessions.length} brainstorm sessions`)
  console.log(`   Path: ${STORE_PATH}`)
}

main().catch(console.error)

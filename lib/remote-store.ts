// ── 存储层 ──────────────────────────────────────────────────────
// 默认使用 jsonblob.com（需配置 JSONBLOB_ID）作为远程存储；
// 若未配置 JSONBLOB_ID，则自动回退到服务器本地文件 .data/store.json，
// 方便本地开发无需外部依赖即可保存产品与分析记录。

import { promises as fs } from 'fs'
import path from 'path'
import type { Product, ProductVersion, Idea, BrainstormSession, BrainstormRequirement } from './types'

const JSONBLOB_BASE = 'https://jsonblob.com/api/jsonBlob'
const LOCAL_STORE_PATH = path.join(process.cwd(), '.data', 'store.json')

interface StoreData {
  products: Product[]
  analysis: AnalysisRecord[]
  brainstormSessions: BrainstormSession[]
  brainstormRequirements: BrainstormRequirement[]
  userIdeas: Idea[]
}

export interface AnalysisRecord {
  id: string
  ideaId: string
  ideaTitle: string
  analysis: Partial<Product>
  createdAt: string
}

function getBlobId(): string {
  return process.env.JSONBLOB_ID || ''
}

function useLocalFallback(): boolean {
  return !getBlobId()
}

async function readLocalStore(): Promise<StoreData> {
  try {
    const raw = await fs.readFile(LOCAL_STORE_PATH, 'utf-8')
    const data = JSON.parse(raw) as Partial<StoreData>
    return {
      products: data.products || [],
      analysis: data.analysis || [],
      brainstormSessions: data.brainstormSessions || [],
      brainstormRequirements: data.brainstormRequirements || [],
      userIdeas: data.userIdeas || [],
    }
  } catch {
    return { products: [], analysis: [], brainstormSessions: [], brainstormRequirements: [], userIdeas: [] }
  }
}

async function writeLocalStore(data: StoreData): Promise<boolean> {
  try {
    await fs.mkdir(path.dirname(LOCAL_STORE_PATH), { recursive: true })
    await fs.writeFile(LOCAL_STORE_PATH, JSON.stringify(data, null, 2), 'utf-8')
    return true
  } catch {
    return false
  }
}

async function fetchStore(): Promise<StoreData> {
  // 本地文件兜底模式
  if (useLocalFallback()) {
    return readLocalStore()
  }
  try {
    const resp = await fetch(`${JSONBLOB_BASE}/${getBlobId()}`, {
      cache: 'no-store',
    })
    if (!resp.ok) return { products: [], analysis: [], brainstormSessions: [], brainstormRequirements: [], userIdeas: [] }
    const data = await resp.json()
    return {
      products: data.products || [],
      analysis: data.analysis || [],
      brainstormSessions: data.brainstormSessions || [],
      brainstormRequirements: data.brainstormRequirements || [],
      userIdeas: data.userIdeas || [],
    }
  } catch {
    return { products: [], analysis: [], brainstormSessions: [], brainstormRequirements: [], userIdeas: [] }
  }
}

async function saveStore(data: StoreData): Promise<boolean> {
  // 本地文件兜底模式
  if (useLocalFallback()) {
    return writeLocalStore(data)
  }
  try {
    const resp = await fetch(`${JSONBLOB_BASE}/${getBlobId()}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return resp.ok
  } catch {
    return false
  }
}

// ── 产品 CRUD ──────────────────────────────────────────────────

export async function getAllProducts(): Promise<Product[]> {
  const store = await fetchStore()
  return store.products
}

export async function getProduct(id: string): Promise<Product | null> {
  const store = await fetchStore()
  return store.products.find(p => p.id === id) || null
}

export async function getProductsByIdea(ideaId: string): Promise<Product[]> {
  const store = await fetchStore()
  return store.products.filter(p => p.ideaId === ideaId)
}

export async function addProduct(product: Product): Promise<boolean> {
  const store = await fetchStore()
  store.products.unshift(product)
  return saveStore(store)
}

export async function deleteProduct(id: string): Promise<boolean> {
  const store = await fetchStore()
  store.products = store.products.filter(p => p.id !== id)
  return saveStore(store)
}

// ── 分析记录 CRUD ──────────────────────────────────────────────

export async function getAnalysisByIdea(ideaId: string): Promise<AnalysisRecord[]> {
  const store = await fetchStore()
  return store.analysis.filter(a => a.ideaId === ideaId)
}

export async function addAnalysisRecord(record: AnalysisRecord): Promise<boolean> {
  const store = await fetchStore()
  // 去重：同一个 ideaId 只保留最新的
  store.analysis = store.analysis.filter(a => a.ideaId !== record.ideaId)
  store.analysis.unshift(record)
  // 最多保留 100 条
  if (store.analysis.length > 100) {
    store.analysis = store.analysis.slice(0, 100)
  }
  return saveStore(store)
}

// ── 更新产品的生成 HTML ────────────────────────────────────────

export async function updateProductHtml(id: string, html: string): Promise<boolean> {
  const store = await fetchStore()
  const product = store.products.find(p => p.id === id)
  if (!product) return false
  product.generatedHtml = html
  return saveStore(store)
}

// ── 版本管理 ──────────────────────────────────────────────────

// 新增一个版本（version 自增），并设为当前版本，同时同步 generatedHtml
export async function addProductVersion(
  id: string,
  versionHtml: string,
  prompt?: string,
): Promise<ProductVersion | null> {
  const store = await fetchStore()
  const product = store.products.find(p => p.id === id)
  if (!product) return null
  const versions = product.versions || []
  // 兼容旧产品：若还没有版本历史，但已有 generatedHtml，先把它作为 v1 补齐
  if (versions.length === 0 && product.generatedHtml) {
    versions.push({
      id: `ver_seed_${product.id}`,
      version: 1,
      html: product.generatedHtml,
      createdAt: product.createdAt,
    })
  }
  const nextVersion = (versions.reduce((m, v) => Math.max(m, v.version), 0)) + 1
  const newVersion: ProductVersion = {
    id: `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    version: nextVersion,
    html: versionHtml,
    prompt,
    createdAt: new Date().toISOString(),
  }
  versions.push(newVersion)
  product.versions = versions
  product.currentVersion = nextVersion
  product.generatedHtml = versionHtml
  const ok = await saveStore(store)
  return ok ? newVersion : null
}

// 切换当前展示的版本
export async function setCurrentVersion(id: string, version: number): Promise<boolean> {
  const store = await fetchStore()
  const product = store.products.find(p => p.id === id)
  if (!product || !product.versions) return false
  const target = product.versions.find(v => v.version === version)
  if (!target) return false
  product.currentVersion = version
  product.generatedHtml = target.html
  return saveStore(store)
}

// ── 更新部署链接 ──────────────────────────────────────────────

// 将产品的公网部署链接（Vercel Blob URL）写回记录
export async function updateProductDeployUrl(
  id: string,
  deployUrl: string,
): Promise<boolean> {
  const store = await fetchStore()
  const product = store.products.find(p => p.id === id)
  if (!product) return false
  product.deployUrl = deployUrl
  product.deployedAt = new Date().toISOString()
  return saveStore(store)
}

// ── Brainstorm CRUD ────────────────────────────────────────────

export async function createBrainstormSession(
  session: BrainstormSession,
): Promise<boolean> {
  const store = await fetchStore()
  store.brainstormSessions.unshift(session)
  return saveStore(store)
}

export async function getBrainstormSession(
  id: string,
): Promise<BrainstormSession | null> {
  const store = await fetchStore()
  return store.brainstormSessions.find(s => s.id === id) || null
}

export async function getBrainstormSessionsByProduct(
  productId: string,
): Promise<BrainstormSession[]> {
  const store = await fetchStore()
  return store.brainstormSessions.filter(s => s.productId === productId)
}

export async function addBrainstormRequirement(
  req: BrainstormRequirement,
): Promise<boolean> {
  const store = await fetchStore()
  store.brainstormRequirements.unshift(req)
  // 更新 session 的 participant 和 requirementCount
  const session = store.brainstormSessions.find(s => s.id === req.sessionId)
  if (session) {
    if (!session.participants.includes(req.author)) {
      session.participants.push(req.author)
    }
    session.requirementCount++
  }
  return saveStore(store)
}

export async function getBrainstormRequirements(
  sessionId: string,
): Promise<BrainstormRequirement[]> {
  const store = await fetchStore()
  return store.brainstormRequirements
    .filter(r => r.sessionId === sessionId)
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
}

export async function closeBrainstormSession(
  id: string,
  mergedRequirements: string,
): Promise<boolean> {
  const store = await fetchStore()
  const session = store.brainstormSessions.find(s => s.id === id)
  if (!session) return false
  session.status = 'closed'
  session.closedAt = new Date().toISOString()
  session.mergedRequirements = mergedRequirements
  return saveStore(store)
}

// ── 用户需求 CRUD ─────────────────────────────────────────────

export async function getUserIdeas(): Promise<Idea[]> {
  const store = await fetchStore()
  return store.userIdeas || []
}

export async function addUserIdea(idea: Idea): Promise<boolean> {
  const store = await fetchStore()
  if (!store.userIdeas) store.userIdeas = []
  store.userIdeas.unshift(idea)
  if (store.userIdeas.length > 500) store.userIdeas.length = 500
  return saveStore(store)
}

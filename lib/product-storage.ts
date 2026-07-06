// ── 产品 localStorage 存储 ─────────────────────────────────────

import type { Product, ProductSummary } from './types'

const PRODUCTS_KEY = 'ideahub_products'

export function loadProducts(): Product[] {
  if (typeof window === 'undefined') return []
  try {
    const saved = localStorage.getItem(PRODUCTS_KEY)
    if (saved) {
      return JSON.parse(saved)
    }
  } catch {}
  return []
}

export function saveProducts(products: Product[]): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products))
  } catch {}
}

export function addProduct(product: Product): void {
  const products = loadProducts()
  products.unshift(product)
  saveProducts(products)
}

export function getProduct(id: string): Product | null {
  const products = loadProducts()
  return products.find(p => p.id === id) || null
}

export function getProductsByIdea(ideaId: string): Product[] {
  const products = loadProducts()
  return products.filter(p => p.ideaId === ideaId)
}

export function getProductSummaries(): ProductSummary[] {
  const products = loadProducts()
  return products.map(p => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    ideaTitle: p.ideaTitle,
    createdAt: p.createdAt,
  }))
}

export function deleteProduct(id: string): void {
  const products = loadProducts()
  const filtered = products.filter(p => p.id !== id)
  saveProducts(filtered)
}

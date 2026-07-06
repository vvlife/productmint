import { NextResponse } from 'next/server'
import { triggerCrawl } from '@/lib/store'

export async function POST() {
  // Placeholder for future crawl logic
  // In production, this would queue scrape tasks for various platforms
  const result = triggerCrawl()
  return NextResponse.json(result, { status: 200 })
}

export async function GET() {
  return NextResponse.json({
    success: false,
    message: 'This endpoint only supports POST requests. Send a POST request to trigger a crawl task.',
  }, { status: 405 })
}

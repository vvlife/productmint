"""
Crawl4AI API Server for IdeaHub
轻量级爬虫服务，供 Next.js 后端调用
"""
import asyncio
import json
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="Crawl4AI Server")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

class CrawlRequest(BaseModel):
    url: str
    css_selector: Optional[str] = None
    js_code: Optional[str] = None

class BatchCrawlRequest(BaseModel):
    urls: list[str]
    css_selector: Optional[str] = None

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.post("/crawl")
async def crawl(req: CrawlRequest):
    try:
        from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

        browser_config = BrowserConfig(headless=True, verbose=False)
        run_config = CrawlerRunConfig(
            cache_mode=CacheMode.BYPASS,
            css_selector=req.css_selector,
        )
        if req.js_code:
            run_config.js_code = [req.js_code]

        async with AsyncWebCrawler(config=browser_config) as crawler:
            result = await crawler.arun(url=req.url, config=run_config)

        return {
            "success": True,
            "url": req.url,
            "title": result.metadata.get("title", "") if result.metadata else "",
            "markdown": result.markdown.raw_markdown if result.markdown else "",
            "fit_markdown": result.markdown.fit_markdown if result.markdown else "",
            "links": {
                "internal": list(result.links.get("internal", []))[:50] if result.links else [],
                "external": list(result.links.get("external", []))[:20] if result.links else [],
            },
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/crawl/batch")
async def crawl_batch(req: BatchCrawlRequest):
    try:
        from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

        browser_config = BrowserConfig(headless=True, verbose=False)
        run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)

        results = []
        async with AsyncWebCrawler(config=browser_config) as crawler:
            tasks = [crawler.arun(url=u, config=run_config) for u in req.urls[:10]]
            crawl_results = await asyncio.gather(*tasks, return_exceptions=True)

            for url, r in zip(req.urls, crawl_results):
                if isinstance(r, Exception):
                    results.append({"url": url, "success": False, "error": str(r)})
                else:
                    results.append({
                        "url": url,
                        "success": True,
                        "title": r.metadata.get("title", "") if r.metadata else "",
                        "markdown": r.markdown.raw_markdown[:5000] if r.markdown else "",
                    })

        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8765)

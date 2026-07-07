"""
News Bot Server for IdeaHub
Lightweight RSS/API-based news collection, no LLM required
"""
import os
import re
import sys
import hashlib
import asyncio
import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from concurrent.futures import ThreadPoolExecutor

import httpx
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="News Bot Server")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── RSS Feed Sources ───────────────────────────────────────────
RSS_FEEDS = {
    "HackerNews": "https://hnrss.org/newest?points=50",
    "ProductHunt": "https://www.producthunt.com/feed",
    "TechCrunch": "https://techcrunch.com/feed/",
    "ArsTechnica": "https://feeds.arstechnica.com/arstechnica/index",
    "TheVerge": "https://www.theverge.com/rss/index.xml",
    "36Kr": "https://36kr.com/feed",
    "SSPAI": "https://sspai.com/feed",
    "GitHubTrending": "https://rsshub.app/github/trending/daily/all",
    "IndieHackers": "https://www.indiehackers.com/feed",
    "DevTo": "https://dev.to/feed",
    "Reddit_SideProject": "https://www.reddit.com/r/SideProject/.rss",
    "Reddit_Startups": "https://www.reddit.com/r/startups/.rss",
    "V2EX": "https://www.v2ex.com/index.xml",
    "Zhihu": "https://rsshub.app/zhihu/hot",
    "Weibo": "https://rsshub.app/weibo/search/hot",
    "Xiaohongshu": "https://rsshub.app/xiaohongshu/trending",
}

# ── Category keywords ──────────────────────────────────────────
CATEGORY_KEYWORDS = {
    "AI工具": ["ai", "gpt", "llm", "chatgpt", "claude", "openai", "人工智能", "机器学习", "aigc"],
    "SaaS": ["saas", "crm", "erp", "协作", "项目管理", "低代码", "no-code"],
    "开发者工具": ["developer", "coding", "programming", "github", "gitlab", "api", "sdk", "devops"],
    "设计": ["design", "ui", "ux", "figma", "sketch", "原型"],
    "消费": ["电商", "购物", "消费", "生活", "健康", "社交"],
    "教育": ["教育", "学习", "课程", "培训", "edtech"],
    "出海": ["出海", "global", "international", "overseas", "跨境"],
}

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}


def categorize(title: str, description: str = "") -> str:
    text = f"{title} {description}".lower()
    for cat, keywords in CATEGORY_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return cat
    return "其他"


def parse_rss(xml_text: str, source: str) -> list[dict]:
    items = []
    try:
        root = ET.fromstring(xml_text)
        ns = {"atom": "http://www.w3.org/2005/Atom"}

        # Try RSS 2.0 format
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            desc = (item.findtext("description") or "").strip()
            pub_date = (item.findtext("pubDate") or "").strip()

            if not title:
                continue

            # Clean HTML from description
            desc = re.sub(r"<[^>]+>", "", desc)[:200]

            items.append({
                "title": title,
                "description": desc,
                "sourceUrl": link,
                "publishedAt": pub_date or datetime.now(timezone.utc).isoformat(),
                "source": source,
            })

        # Try Atom format if no RSS items found
        if not items:
            for entry in root.iter("{http://www.w3.org/2005/Atom}entry"):
                title_el = entry.find("{http://www.w3.org/2005/Atom}title")
                link_el = entry.find("{http://www.w3.org/2005/Atom}link")
                summary_el = entry.find("{http://www.w3.org/2005/Atom}summary")
                updated_el = entry.find("{http://www.w3.org/2005/Atom}updated")

                title = (title_el.text or "").strip() if title_el is not None else ""
                link = link_el.get("href", "") if link_el is not None else ""
                desc = (summary_el.text or "").strip() if summary_el is not None else ""
                pub_date = (updated_el.text or "").strip() if updated_el is not None else ""

                if not title:
                    continue

                desc = re.sub(r"<[^>]+>", "", desc)[:200]

                items.append({
                    "title": title,
                    "description": desc,
                    "sourceUrl": link,
                    "publishedAt": pub_date or datetime.now(timezone.utc).isoformat(),
                    "source": source,
                })
    except ET.ParseError:
        pass

    return items


async def fetch_feed(client: httpx.AsyncClient, name: str, url: str) -> list[dict]:
    try:
        resp = await client.get(url, timeout=15, follow_redirects=True)
        if resp.status_code == 200:
            items = parse_rss(resp.text, name)
            return items[:15]
    except Exception as e:
        print(f"[feed] Error fetching {name}: {e}")
    return []


async def fetch_hackernews_api(client: httpx.AsyncClient) -> list[dict]:
    """Fetch top stories from HackerNews Firebase API."""
    items = []
    try:
        resp = await client.get(
            "https://hacker-news.firebaseio.com/v0/topstories.json",
            timeout=10,
        )
        if resp.status_code != 200:
            return items

        ids = resp.json()[:20]

        # Fetch stories in parallel
        async def fetch_story(sid: int):
            r = await client.get(
                f"https://hacker-news.firebaseio.com/v0/item/{sid}.json",
                timeout=8,
            )
            return r.json() if r.status_code == 200 else None

        stories = await asyncio.gather(*[fetch_story(sid) for sid in ids])

        for story in stories:
            if not story or not story.get("title"):
                continue
            items.append({
                "title": story["title"],
                "description": (story.get("text") or story["title"])[:200],
                "sourceUrl": story.get("url") or f"https://news.ycombinator.com/item?id={story['id']}",
                "publishedAt": datetime.fromtimestamp(story.get("time", 0), tz=timezone.utc).isoformat(),
                "source": "HackerNews",
                "heat": story.get("score", 0),
            })
    except Exception as e:
        print(f"[hn] Error: {e}")
    return items


async def fetch_github_trending(client: httpx.AsyncClient) -> list[dict]:
    """Fetch GitHub trending repos."""
    items = []
    try:
        resp = await client.get(
            "https://api.github.com/search/repositories?q=created:>2026-07-01&sort=stars&order=desc&per_page=15",
            timeout=10,
        )
        if resp.status_code == 200:
            data = resp.json()
            for repo in data.get("items", [])[:15]:
                items.append({
                    "title": f"{repo['full_name']}: {repo.get('description', '')[:80]}",
                    "description": repo.get("description", "")[:200],
                    "sourceUrl": repo["html_url"],
                    "publishedAt": repo.get("created_at", ""),
                    "source": "GitHub",
                    "heat": repo.get("stargazers_count", 0),
                })
    except Exception as e:
        print(f"[github] Error: {e}")
    return items


class CollectRequest(BaseModel):
    topics: list[str] = []
    max_items: int = 20


class SearchRequest(BaseModel):
    query: str
    max_results: int = 10


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.post("/collect")
async def collect(req: CollectRequest):
    """Collect news from all RSS/API sources."""
    async with httpx.AsyncClient(headers=HEADERS) as client:
        # Fetch all sources in parallel
        tasks = [fetch_feed(client, name, url) for name, url in RSS_FEEDS.items()]
        tasks.append(fetch_hackernews_api(client))
        tasks.append(fetch_github_trending(client))

        results = await asyncio.gather(*tasks, return_exceptions=True)

    all_items = []
    seen_titles = set()

    for result in results:
        if isinstance(result, Exception):
            continue
        for item in result:
            title_key = item["title"].lower().strip()
            if title_key in seen_titles:
                continue
            seen_titles.add(title_key)

            category = categorize(item["title"], item.get("description", ""))
            item["category"] = category
            all_items.append(item)

    # Filter by topics if provided
    if req.topics:
        topic_lower = [t.lower() for t in req.topics]
        filtered = []
        for item in all_items:
            text = f"{item['title']} {item.get('description', '')}".lower()
            if any(t in text for t in topic_lower):
                filtered.append(item)
        all_items = filtered

    # Sort by heat (if available) then limit
    all_items.sort(key=lambda x: x.get("heat", 0), reverse=True)
    all_items = all_items[:req.max_items]

    # Add IDs and format
    ideas = []
    for i, item in enumerate(all_items):
        ideas.append({
            "id": f"news_{i}_{hashlib.md5(item['title'].encode()).hexdigest()[:8]}",
            "title": item["title"],
            "description": item.get("description", item["title"]),
            "platform": "other",
            "sourceUrl": item.get("sourceUrl", ""),
            "publishedAt": item.get("publishedAt", datetime.now(timezone.utc).isoformat()),
            "heat": item.get("heat", 0),
            "category": item.get("category", "其他"),
            "source": item.get("source", ""),
        })

    return {
        "success": True,
        "ideas": ideas,
        "total": len(ideas),
        "sources": list(RSS_FEEDS.keys()) + ["HackerNews_API", "GitHub"],
        "collected_at": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/search")
async def search(req: SearchRequest):
    """Search news by keyword (local filter on cached data or re-fetch)."""
    q = req.query.lower().strip()
    if not q:
        return {"success": True, "ideas": [], "total": 0}

    async with httpx.AsyncClient(headers=HEADERS) as client:
        # Fetch a subset of sources for search
        search_tasks = [
            fetch_feed(client, "HackerNews", RSS_FEEDS["HackerNews"]),
            fetch_feed(client, "ProductHunt", RSS_FEEDS["ProductHunt"]),
            fetch_feed(client, "Reddit_Startups", RSS_FEEDS["Reddit_Startups"]),
            fetch_hackernews_api(client),
        ]
        results = await asyncio.gather(*search_tasks, return_exceptions=True)

    matched = []
    seen = set()

    for result in results:
        if isinstance(result, Exception):
            continue
        for item in result:
            text = f"{item['title']} {item.get('description', '')}".lower()
            if q in text:
                title_key = item["title"].lower().strip()
                if title_key not in seen:
                    seen.add(title_key)
                    category = categorize(item["title"], item.get("description", ""))
                    matched.append({
                        "id": f"search_{hashlib.md5(item['title'].encode()).hexdigest()[:8]}",
                        "title": item["title"],
                        "description": item.get("description", item["title"]),
                        "platform": "other",
                        "sourceUrl": item.get("sourceUrl", ""),
                        "publishedAt": item.get("publishedAt", ""),
                        "heat": item.get("heat", 0),
                        "category": category,
                        "source": item.get("source", ""),
                    })

    matched = matched[:req.max_results]

    return {
        "success": True,
        "ideas": matched,
        "total": len(matched),
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8766)

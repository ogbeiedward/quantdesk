"""Narrative Intelligence — CoinDesk RSS, CoinTelegraph, trending coins, sentiment scoring."""
import asyncio
import re
import xml.etree.ElementTree as ET
from datetime import datetime
from typing import List, Dict
import httpx
from fastapi import APIRouter

router = APIRouter(prefix="/api/narrative", tags=["narrative"])

# ─── Sentiment keyword scoring ────────────────────────────────
BULLISH_KEYWORDS = [
    "surge", "rally", "breakout", "bull", "ath", "all-time high", "adoption",
    "institutional", "etf approved", "accumulate", "moon", "record", "milestone",
    "upgrade", "launch", "partnership", "invest", "growth", "soar", "gain",
    "positive", "optimistic", "bullish", "outperform", "beat", "exceed",
]

BEARISH_KEYWORDS = [
    "crash", "bear", "dump", "sell-off", "liquidation", "ban", "hack", "exploit",
    "fraud", "lawsuit", "regulation", "restrict", "plunge", "drop", "fall",
    "concern", "risk", "warning", "negative", "bearish", "decline", "loss",
    "sink", "warning", "fear", "panic", "collapse", "bankrupt",
]


def score_sentiment(title: str, description: str) -> dict:
    """Score article sentiment from title + description keywords."""
    text = f"{title} {description}".lower()
    b_score = sum(1 for kw in BULLISH_KEYWORDS if kw in text)
    bear_score = sum(1 for kw in BEARISH_KEYWORDS if kw in text)

    if b_score > bear_score:
        sentiment = "Bullish"
        strength = min(b_score * 20, 100)
    elif bear_score > b_score:
        sentiment = "Bearish"
        strength = min(bear_score * 20, 100)
    else:
        sentiment = "Neutral"
        strength = 50

    return {"label": sentiment, "strength": strength, "bullish_signals": b_score, "bearish_signals": bear_score}


def extract_mentioned_assets(text: str) -> List[str]:
    """Extract mentioned crypto assets from text."""
    assets_map = {
        "bitcoin": "BTC", "btc": "BTC", "ethereum": "ETH", "eth": "ETH",
        "solana": "SOL", "sol": "SOL", "xrp": "XRP", "ripple": "XRP",
        "cardano": "ADA", "ada": "ADA", "bnb": "BNB", "binance": "BNB",
        "dogecoin": "DOGE", "doge": "DOGE", "avalanche": "AVAX", "avax": "AVAX",
        "chainlink": "LINK", "link": "LINK", "polkadot": "DOT", "dot": "DOT",
    }
    text_lower = text.lower()
    found = list({v for k, v in assets_map.items() if k in text_lower})
    return found[:5]  # Cap at 5 assets per article


async def fetch_rss_feed(client: httpx.AsyncClient, url: str, source_name: str) -> List[dict]:
    """Fetch and parse an RSS feed."""
    try:
        resp = await client.get(url, timeout=10, follow_redirects=True)
        root = ET.fromstring(resp.text)
        channel = root.find("channel")
        if channel is None:
            return []

        articles = []
        for item in channel.findall("item")[:10]:
            title = item.findtext("title", "").strip()
            description = re.sub(r"<[^>]+>", "", item.findtext("description", "")).strip()[:300]
            link = item.findtext("link", "#")
            pub_date = item.findtext("pubDate", "")

            sentiment = score_sentiment(title, description)
            assets = extract_mentioned_assets(f"{title} {description}")

            articles.append({
                "title": title,
                "description": description,
                "url": link,
                "source": source_name,
                "published_at": pub_date,
                "sentiment": sentiment["label"],
                "sentiment_strength": sentiment["strength"],
                "bullish_signals": sentiment["bullish_signals"],
                "bearish_signals": sentiment["bearish_signals"],
                "mentioned_assets": assets,
            })
        return articles
    except Exception:
        return []


@router.get("/feed")
async def narrative_feed():
    """Aggregated crypto news with AI-scored sentiment from multiple sources."""
    feeds = [
        ("https://www.coindesk.com/arc/outboundfeeds/rss/", "CoinDesk"),
        ("https://cointelegraph.com/rss", "CoinTelegraph"),
        ("https://decrypt.co/feed", "Decrypt"),
        ("https://bitcoinmagazine.com/.rss/full/", "Bitcoin Magazine"),
    ]

    async with httpx.AsyncClient(timeout=12, follow_redirects=True) as client:
        tasks = [fetch_rss_feed(client, url, name) for url, name in feeds]
        results = await asyncio.gather(*tasks, return_exceptions=True)

    all_articles = []
    for result in results:
        if isinstance(result, list):
            all_articles.extend(result)

    # Sort by freshness (latest first)
    # Parse dates for sorting
    def parse_date(article):
        try:
            return datetime.strptime(article["published_at"], "%a, %d %b %Y %H:%M:%S %z").timestamp()
        except Exception:
            return 0

    all_articles.sort(key=parse_date, reverse=True)

    # Summary statistics
    bullish_count = sum(1 for a in all_articles if a["sentiment"] == "Bullish")
    bearish_count = sum(1 for a in all_articles if a["sentiment"] == "Bearish")
    total = len(all_articles)
    market_mood = "Bullish" if bullish_count > bearish_count else "Bearish" if bearish_count > bullish_count else "Neutral"

    return {
        "articles": all_articles[:25],
        "summary": {
            "total": total,
            "bullish": bullish_count,
            "bearish": bearish_count,
            "neutral": total - bullish_count - bearish_count,
            "market_mood": market_mood,
            "mood_score": round((bullish_count / total * 100) if total > 0 else 50, 1),
        }
    }


@router.get("/trending")
async def trending_coins():
    """Trending coins from CoinGecko with momentum scoring."""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get("https://api.coingecko.com/api/v3/search/trending")
            data = r.json()
            coins = data.get("coins", [])

            trending = []
            for item in coins:
                coin = item.get("item", {})
                trending.append({
                    "id": coin.get("id"),
                    "name": coin.get("name"),
                    "symbol": coin.get("symbol", "").upper(),
                    "rank": coin.get("market_cap_rank"),
                    "thumb": coin.get("thumb"),
                    "score": coin.get("score", 0),
                    "price_btc": coin.get("price_btc"),
                })
            return {"trending": trending, "as_of": datetime.utcnow().isoformat()}
        except Exception:
            return {"trending": [], "error": "Unable to fetch trending data"}


@router.get("/social-sentiment")
async def social_sentiment():
    """Social sentiment and narrative momentum for major assets."""
    # Fetch Fear & Greed as social proxy
    fg_data = {}
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            r = await client.get("https://api.alternative.me/fng/?limit=7")
            data = r.json().get("data", [])
            fg_data = {
                "current_value": int(data[0]["value"]) if data else 50,
                "current_label": data[0]["value_classification"] if data else "Neutral",
                "history": [
                    {"date": d["timestamp"], "value": int(d["value"]), "label": d["value_classification"]}
                    for d in data
                ],
            }
        except Exception:
            fg_data = {"current_value": 50, "current_label": "Neutral", "history": []}

        # BTC Google Trends proxy via CoinGecko market data
        sentiment_by_asset = []
        try:
            r = await client.get(
                "https://api.coingecko.com/api/v3/coins/markets",
                params={
                    "vs_currency": "usd",
                    "order": "market_cap_desc",
                    "per_page": 10,
                    "page": 1,
                    "sparkline": False,
                    "price_change_percentage": "1h,24h,7d",
                }
            )
            coins = r.json()
            for coin in coins:
                change_1h = coin.get("price_change_percentage_1h_in_currency", 0) or 0
                change_24h = coin.get("price_change_percentage_24h_in_currency", 0) or 0
                change_7d = coin.get("price_change_percentage_7d_in_currency", 0) or 0

                # Momentum score: weighted average of price changes
                momentum = change_1h * 0.5 + change_24h * 0.3 + change_7d * 0.2
                narrative = "Bullish" if momentum > 1 else "Bearish" if momentum < -1 else "Neutral"

                sentiment_by_asset.append({
                    "symbol": coin.get("symbol", "").upper(),
                    "name": coin.get("name"),
                    "price": coin.get("current_price"),
                    "change_1h": round(change_1h, 2),
                    "change_24h": round(change_24h, 2),
                    "change_7d": round(change_7d, 2),
                    "momentum_score": round(momentum, 2),
                    "narrative": narrative,
                })
        except Exception:
            pass

    return {
        "fear_greed": fg_data,
        "asset_sentiment": sentiment_by_asset,
    }

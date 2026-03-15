"""Market data router — tickers, candles, orderbook, news."""
from fastapi import APIRouter, Depends
from typing import List
from app.core.config import get_settings
from app.schemas.schemas import MarketTicker, CandleData, OrderBookData, NewsItem
from app.services.market_data import (
    get_crypto_tickers, get_crypto_klines, get_crypto_orderbook, get_forex_tickers,
)

router = APIRouter(prefix="/api/market", tags=["market"])
settings = get_settings()


@router.get("/crypto/tickers", response_model=List[MarketTicker])
async def crypto_tickers():
    return await get_crypto_tickers()


@router.get("/crypto/klines")
async def crypto_klines(symbol: str = "BTCUSDT", interval: str = "1h", limit: int = 200):
    return await get_crypto_klines(symbol, interval, limit)


@router.get("/crypto/orderbook")
async def crypto_orderbook(symbol: str = "BTCUSDT", limit: int = 20):
    return await get_crypto_orderbook(symbol, limit)


@router.get("/forex/tickers", response_model=List[MarketTicker])
async def forex_tickers():
    return await get_forex_tickers(settings.ALPHA_VANTAGE_API_KEY)


@router.get("/news")
async def get_news():
    """Return financial news. Uses NewsAPI if key is set, else returns sample data."""
    if settings.NEWS_API_KEY:
        import httpx
        async with httpx.AsyncClient(timeout=10) as client:
            try:
                resp = await client.get(
                    "https://newsapi.org/v2/everything",
                    params={
                        "q": "crypto OR forex OR trading OR bitcoin",
                        "sortBy": "publishedAt",
                        "pageSize": 20,
                        "apiKey": settings.NEWS_API_KEY,
                    },
                )
                data = resp.json()
                articles = data.get("articles", [])
                return [
                    {
                        "title": a["title"],
                        "description": a.get("description", ""),
                        "url": a["url"],
                        "source": a["source"]["name"],
                        "published_at": a["publishedAt"],
                        "sentiment": "Neutral",
                    }
                    for a in articles
                ]
            except Exception:
                pass

    # Sample news data for demo
    return [
        {"title": "Bitcoin Surges Past $95,000 as Institutional Demand Grows", "description": "Major financial institutions are increasing their Bitcoin allocations amid growing macro uncertainty.", "url": "#", "source": "CryptoNews", "published_at": "2026-03-11T18:00:00Z", "sentiment": "Bullish"},
        {"title": "Federal Reserve Signals Potential Rate Cut in Q2 2026", "description": "The Fed's latest minutes suggest a dovish pivot that could boost risk assets.", "url": "#", "source": "Reuters", "published_at": "2026-03-11T16:30:00Z", "sentiment": "Bullish"},
        {"title": "Ethereum Layer 2 Solutions See Record Transaction Volumes", "description": "Optimism and Arbitrum process over 10 million transactions daily.", "url": "#", "source": "The Block", "published_at": "2026-03-11T14:00:00Z", "sentiment": "Bullish"},
        {"title": "EUR/USD Faces Resistance at 1.0900 Ahead of ECB Meeting", "description": "Traders are cautious as the European Central Bank prepares for its policy announcement.", "url": "#", "source": "FXStreet", "published_at": "2026-03-11T12:00:00Z", "sentiment": "Neutral"},
        {"title": "Crypto Exchange Regulations Tighten in Asia-Pacific Region", "description": "New compliance requirements could impact trading volumes in the short term.", "url": "#", "source": "Bloomberg", "published_at": "2026-03-11T10:00:00Z", "sentiment": "Bearish"},
        {"title": "Solana DeFi TVL Reaches New All-Time High", "description": "Solana's DeFi ecosystem now holds over $15 billion in total value locked.", "url": "#", "source": "DeFi Pulse", "published_at": "2026-03-11T08:00:00Z", "sentiment": "Bullish"},
        {"title": "GBP/USD Drops on Weaker UK GDP Data", "description": "The British pound fell against the dollar following disappointing economic growth figures.", "url": "#", "source": "Financial Times", "published_at": "2026-03-11T06:00:00Z", "sentiment": "Bearish"},
        {"title": "AI-Powered Trading Strategies Gain Popularity Among Retail Investors", "description": "More retail traders are adopting algorithmic and AI-based strategies.", "url": "#", "source": "TechCrunch", "published_at": "2026-03-10T22:00:00Z", "sentiment": "Neutral"},
    ]

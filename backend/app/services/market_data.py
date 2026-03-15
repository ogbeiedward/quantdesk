"""Market data service — Binance + Alpha Vantage integrations."""
import asyncio
import json
import time
from typing import Dict, List, Optional
import httpx
import aiohttp

# ─── In-Memory Price Cache (Redis-backed in production) ──────
_price_cache: Dict[str, dict] = {}
_orderbook_cache: Dict[str, dict] = {}
_kline_cache: Dict[str, list] = {}


# ─── Binance REST API ────────────────────────────────────────
BINANCE_BASE = "https://api.binance.com/api/v3"

CRYPTO_SYMBOLS = [
    "BTCUSDT", "ETHUSDT", "BNBUSDT", "SOLUSDT", "XRPUSDT",
    "ADAUSDT", "DOGEUSDT", "AVAXUSDT", "DOTUSDT", "MATICUSDT",
    "LINKUSDT", "LTCUSDT", "ATOMUSDT", "UNIUSDT", "NEARUSDT",
]

FOREX_PAIRS = [
    "EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD",
    "NZDUSD", "EURGBP", "EURJPY", "GBPJPY", "USDCHF",
]


async def get_crypto_tickers() -> List[dict]:
    """Fetch 24hr ticker data for crypto pairs from Binance."""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(f"{BINANCE_BASE}/ticker/24hr")
            data = resp.json()
            tickers = []
            for item in data:
                if item["symbol"] in CRYPTO_SYMBOLS:
                    tickers.append({
                        "symbol": item["symbol"],
                        "price": float(item["lastPrice"]),
                        "change_24h": float(item["priceChangePercent"]),
                        "volume_24h": float(item["quoteVolume"]),
                        "high_24h": float(item["highPrice"]),
                        "low_24h": float(item["lowPrice"]),
                    })
            _price_cache["crypto"] = {t["symbol"]: t for t in tickers}
            return tickers
        except Exception:
            cached = _price_cache.get("crypto", {})
            return list(cached.values())


async def get_crypto_klines(symbol: str, interval: str = "1h", limit: int = 200) -> List[dict]:
    """Fetch candlestick data from Binance."""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{BINANCE_BASE}/klines",
                params={"symbol": symbol, "interval": interval, "limit": limit},
            )
            data = resp.json()
            candles = []
            for k in data:
                candles.append({
                    "timestamp": k[0],
                    "open": float(k[1]),
                    "high": float(k[2]),
                    "low": float(k[3]),
                    "close": float(k[4]),
                    "volume": float(k[5]),
                })
            _kline_cache[f"{symbol}_{interval}"] = candles
            return candles
        except Exception:
            return _kline_cache.get(f"{symbol}_{interval}", [])


async def get_crypto_orderbook(symbol: str, limit: int = 20) -> dict:
    """Fetch order book depth from Binance."""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(
                f"{BINANCE_BASE}/depth",
                params={"symbol": symbol, "limit": limit},
            )
            data = resp.json()
            result = {
                "bids": [{"price": float(b[0]), "quantity": float(b[1])} for b in data.get("bids", [])],
                "asks": [{"price": float(a[0]), "quantity": float(a[1])} for a in data.get("asks", [])],
            }
            _orderbook_cache[symbol] = result
            return result
        except Exception:
            return _orderbook_cache.get(symbol, {"bids": [], "asks": []})


async def get_forex_tickers(api_key: str) -> List[dict]:
    """Fetch forex data from Alpha Vantage or return simulated data."""
    if not api_key:
        # Simulated forex data for demo
        import random
        base_prices = {
            "EURUSD": 1.0850, "GBPUSD": 1.2650, "USDJPY": 149.50,
            "AUDUSD": 0.6520, "USDCAD": 1.3580, "NZDUSD": 0.6120,
            "EURGBP": 0.8580, "EURJPY": 162.20, "GBPJPY": 189.10,
            "USDCHF": 0.8820,
        }
        tickers = []
        for symbol, base in base_prices.items():
            noise = random.uniform(-0.002, 0.002) * base
            price = base + noise
            tickers.append({
                "symbol": symbol,
                "price": round(price, 5),
                "change_24h": round(random.uniform(-1.5, 1.5), 2),
                "volume_24h": round(random.uniform(1e8, 5e9), 0),
                "high_24h": round(price * 1.005, 5),
                "low_24h": round(price * 0.995, 5),
            })
        return tickers

    async with httpx.AsyncClient(timeout=10) as client:
        tickers = []
        for pair in FOREX_PAIRS[:5]:  # Rate-limit friendly
            try:
                from_c, to_c = pair[:3], pair[3:]
                resp = await client.get(
                    "https://www.alphavantage.co/query",
                    params={
                        "function": "CURRENCY_EXCHANGE_RATE",
                        "from_currency": from_c,
                        "to_currency": to_c,
                        "apikey": api_key,
                    },
                )
                data = resp.json()
                rate_data = data.get("Realtime Currency Exchange Rate", {})
                if rate_data:
                    price = float(rate_data.get("5. Exchange Rate", 0))
                    tickers.append({
                        "symbol": pair,
                        "price": price,
                        "change_24h": 0.0,
                        "volume_24h": 0.0,
                        "high_24h": price,
                        "low_24h": price,
                    })
            except Exception:
                continue
        return tickers


def get_current_price(symbol: str) -> Optional[float]:
    """Get cached current price for a symbol."""
    crypto = _price_cache.get("crypto", {})
    if symbol in crypto:
        return crypto[symbol]["price"]
    return None

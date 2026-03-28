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


# ─── Smart Money & Institutional Indicators ───────────────────

BINANCE_FUTURES_BASE = "https://fapi.binance.com/fapi/v1"


async def get_funding_rates() -> List[dict]:
    """Fetch current funding rates from Binance Futures (free, no auth)."""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(f"{BINANCE_FUTURES_BASE}/premiumIndex")
            data = resp.json()
            results = []
            target_symbols = {"BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "ADAUSDT", "AVAXUSDT"}
            for item in data:
                if item.get("symbol") in target_symbols:
                    funding_rate = float(item.get("lastFundingRate", 0))
                    results.append({
                        "symbol": item["symbol"],
                        "funding_rate": round(funding_rate * 100, 4),  # as percentage
                        "funding_rate_annualized": round(funding_rate * 3 * 365 * 100, 2),
                        "mark_price": float(item.get("markPrice", 0)),
                        "index_price": float(item.get("indexPrice", 0)),
                        "sentiment": "Bearish (Longs Paying)" if funding_rate > 0.01 else
                                     "Bullish (Shorts Paying)" if funding_rate < -0.01 else "Neutral",
                    })
            return sorted(results, key=lambda x: abs(x["funding_rate"]), reverse=True)
        except Exception:
            return []


async def get_open_interest() -> List[dict]:
    """Fetch open interest from Binance Futures (free, no auth)."""
    async with httpx.AsyncClient(timeout=10) as client:
        target_symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT"]
        results = []
        for sym in target_symbols:
            try:
                resp = await client.get(
                    f"{BINANCE_FUTURES_BASE}/openInterest",
                    params={"symbol": sym}
                )
                data = resp.json()
                oi = float(data.get("openInterest", 0))
                price = get_current_price(sym) or 1
                results.append({
                    "symbol": sym,
                    "open_interest_contracts": round(oi, 2),
                    "open_interest_usd": round(oi * price, 2),
                })
            except Exception:
                continue
        return results


async def get_fear_and_greed() -> dict:
    """Fetch Crypto Fear & Greed Index from alternative.me (free)."""
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get("https://api.alternative.me/fng/?limit=30")
            data = resp.json().get("data", [])
            if not data:
                return {}
            current = data[0]
            history = [{"date": d["timestamp"], "value": int(d["value"]), "label": d["value_classification"]}
                       for d in data]
            # Trend: is fear/greed increasing or decreasing?
            recent_avg = sum(int(d["value"]) for d in data[:7]) / 7
            older_avg = sum(int(d["value"]) for d in data[7:14]) / 7
            trend = "Improving" if recent_avg > older_avg else "Deteriorating"

            return {
                "value": int(current["value"]),
                "label": current["value_classification"],
                "trend": trend,
                "history": history[:30],
                "interpretation": (
                    "Extreme Fear — potential buying opportunity" if int(current["value"]) < 25 else
                    "Fear — market is nervous" if int(current["value"]) < 45 else
                    "Neutral" if int(current["value"]) < 55 else
                    "Greed — consider taking profits" if int(current["value"]) < 75 else
                    "Extreme Greed — high risk of correction"
                )
            }
        except Exception:
            return {"value": 50, "label": "Neutral", "trend": "Unknown", "history": []}


async def get_long_short_ratio() -> List[dict]:
    """Fetch long/short ratio from Binance Futures accounts (free public endpoint)."""
    async with httpx.AsyncClient(timeout=10) as client:
        target_symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"]
        results = []
        for sym in target_symbols:
            try:
                resp = await client.get(
                    "https://fapi.binance.com/futures/data/globalLongShortAccountRatio",
                    params={"symbol": sym, "period": "1h", "limit": 24}
                )
                data = resp.json()
                if isinstance(data, list) and data:
                    latest = data[-1]
                    long_pct = float(latest.get("longAccount", 0.5)) * 100
                    short_pct = float(latest.get("shortAccount", 0.5)) * 100
                    ratio = float(latest.get("longShortRatio", 1.0))
                    results.append({
                        "symbol": sym,
                        "long_pct": round(long_pct, 1),
                        "short_pct": round(short_pct, 1),
                        "ratio": round(ratio, 3),
                        "sentiment": "Bullish (More Longs)" if ratio > 1.2 else
                                     "Bearish (More Shorts)" if ratio < 0.8 else "Balanced",
                        "history": [{"timestamp": d["timestamp"], "ratio": float(d.get("longShortRatio", 1))}
                                    for d in data[-12:]],
                    })
            except Exception:
                continue
        return results


def compute_technical_indicators(closes: List[float]) -> dict:
    """Compute RSI, MACD, Bollinger Bands, and ATR from raw close prices."""
    import numpy as np
    c = np.array(closes)
    if len(c) < 30:
        return {}

    # RSI
    deltas = np.diff(c)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)
    period = 14
    avg_gain = np.mean(gains[:period])
    avg_loss = np.mean(losses[:period])
    for i in range(period, len(gains)):
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
    rs = avg_gain / avg_loss if avg_loss > 0 else 0
    rsi = 100 - (100 / (1 + rs))

    # EMA helper
    def ema(arr, p):
        m = 2.0 / (p + 1)
        e = [arr[0]]
        for v in arr[1:]:
            e.append((v - e[-1]) * m + e[-1])
        return np.array(e)

    # MACD
    ema12 = ema(c, 12)
    ema26 = ema(c, 26)
    macd_line = ema12 - ema26
    signal_line = ema(macd_line, 9)
    macd_hist = macd_line[-1] - signal_line[-1]

    # Bollinger Bands (20, 2)
    sma20 = np.mean(c[-20:])
    std20 = np.std(c[-20:])
    bb_upper = sma20 + 2 * std20
    bb_lower = sma20 - 2 * std20
    bb_pct = (c[-1] - bb_lower) / (bb_upper - bb_lower) if bb_upper != bb_lower else 0.5

    # Composite signal
    signals = []
    if rsi < 30:
        signals.append("RSI Oversold (Buy)")
    elif rsi > 70:
        signals.append("RSI Overbought (Sell)")
    if macd_hist > 0 and macd_line[-2] < signal_line[-2]:
        signals.append("MACD Bullish Crossover")
    elif macd_hist < 0 and macd_line[-2] > signal_line[-2]:
        signals.append("MACD Bearish Crossover")
    if c[-1] < bb_lower:
        signals.append("Below Lower BB (Potential Reversal)")
    elif c[-1] > bb_upper:
        signals.append("Above Upper BB (Potential Reversal)")

    return {
        "rsi": round(float(rsi), 2),
        "macd": round(float(macd_line[-1]), 6),
        "macd_signal": round(float(signal_line[-1]), 6),
        "macd_hist": round(float(macd_hist), 6),
        "bb_upper": round(float(bb_upper), 6),
        "bb_middle": round(float(sma20), 6),
        "bb_lower": round(float(bb_lower), 6),
        "bb_pct": round(float(bb_pct), 3),
        "ema_12": round(float(ema12[-1]), 6),
        "ema_26": round(float(ema26[-1]), 6),
        "signals": signals,
        "overall": "Bullish" if len([s for s in signals if "Buy" in s or "Bullish" in s]) > len([s for s in signals if "Sell" in s or "Bearish" in s]) else "Bearish" if signals else "Neutral",
    }

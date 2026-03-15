"""Analytics router — correlation, volatility, heatmap data."""
from fastapi import APIRouter
import random
from app.services.market_data import CRYPTO_SYMBOLS

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


@router.get("/correlation")
async def correlation_matrix():
    """Return a correlation matrix for major crypto assets."""
    symbols = CRYPTO_SYMBOLS[:8]
    matrix = {}
    for s1 in symbols:
        matrix[s1] = {}
        for s2 in symbols:
            if s1 == s2:
                matrix[s1][s2] = 1.0
            else:
                matrix[s1][s2] = round(random.uniform(-0.3, 0.95), 2)
    return {"symbols": symbols, "matrix": matrix}


@router.get("/volatility")
async def volatility_scanner():
    """Return volatility data for assets."""
    data = []
    for s in CRYPTO_SYMBOLS:
        data.append({
            "symbol": s,
            "volatility_1h": round(random.uniform(0.5, 5.0), 2),
            "volatility_24h": round(random.uniform(1.0, 15.0), 2),
            "volatility_7d": round(random.uniform(3.0, 25.0), 2),
            "trend_strength": round(random.uniform(0, 100), 0),
        })
    return data


@router.get("/heatmap")
async def market_heatmap():
    """Return heatmap data for market performance."""
    data = []
    for s in CRYPTO_SYMBOLS:
        data.append({
            "symbol": s,
            "change_1h": round(random.uniform(-3, 3), 2),
            "change_24h": round(random.uniform(-10, 10), 2),
            "change_7d": round(random.uniform(-20, 20), 2),
            "volume": round(random.uniform(1e6, 1e9), 0),
            "market_cap": round(random.uniform(1e9, 1e12), 0),
        })
    return data

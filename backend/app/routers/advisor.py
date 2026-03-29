from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from app.services.market_data import get_crypto_klines, compute_technical_indicators, get_fear_and_greed

router = APIRouter(prefix="/api/advisor", tags=["advisor"])

class AdvisorRequest(BaseModel):
    capital: float
    symbol: str = "BTCUSDT"
    risk_tolerance: str = "Medium"  # Low, Medium, High

class AdvisorResponse(BaseModel):
    action: str
    confidence: str
    reason: str
    recommended_size: float
    entry_price: float
    stop_loss: float
    take_profit: float

@router.post("/signal", response_model=AdvisorResponse)
async def get_trading_signal(req: AdvisorRequest):
    # Fetch latest market data
    klines = await get_crypto_klines(req.symbol, interval="1h", limit=100)
    if not klines:
        return AdvisorResponse(
            action="HOLD", confidence="Low", reason="Market data unavailable.",
            recommended_size=0, entry_price=0, stop_loss=0, take_profit=0
        )
    
    closes = [k["close"] for k in klines]
    current_price = closes[-1]
    
    # Compute Technicals
    tech = compute_technical_indicators(closes)
    fng = await get_fear_and_greed()
    
    rsi = tech.get("rsi", 50)
    macd_hist = tech.get("macd_hist", 0)
    
    # Default to Hold
    action = "HOLD"
    confidence = "Medium"
    
    # Scoring system
    score = 0
    reasons = []
    
    if rsi < 35:
        score += 2
        reasons.append(f"RSI is oversold at {rsi}.")
    elif rsi > 65:
        score -= 2
        reasons.append(f"RSI is overbought at {rsi}.")
        
    if macd_hist > 0:
        score += 1
        reasons.append("MACD histogram is positive (bullish momentum).")
    elif macd_hist < 0:
        score -= 1
        reasons.append("MACD histogram is negative (bearish momentum).")
        
    fng_val = fng.get("value", 50)
    if fng_val < 30:
        score += 2
        reasons.append(f"Market is in Extreme Fear ({fng_val}), historical accumulation zone.")
    elif fng_val > 70:
        score -= 2
        reasons.append(f"Market is in Extreme Greed ({fng_val}), high risk of correction.")
        
    # Decision logic
    if score >= 3:
        action = "BUY"
        confidence = "High" if score >= 4 else "Medium"
    elif score <= -3:
        action = "SELL"
        confidence = "High" if score <= -4 else "Medium"
    else:
        action = "HOLD"
        reasons = ["Market is currently neutral without strong technical divergence."]
        
    # Risk Management & Kelly Criterion mapping
    risk_pct = 0.02 # default 2% risk per trade
    if req.risk_tolerance.lower() == "high":
        risk_pct = 0.05
    elif req.risk_tolerance.lower() == "low":
        risk_pct = 0.01
        
    # Position Sizing
    recommended_size = req.capital * risk_pct * 10  # 10x effective leverage calculation
    recommended_size = min(recommended_size, req.capital) # Do not exceed available capital
    
    if action == "HOLD":
        recommended_size = 0
        
    # Stop Loss & Take Profit (ATR or simple percentage)
    # Using 3% SL and 6% TP for High Risk, 2%/4% for Medium, 1%/2% for Low
    sl_pct = 0.02
    tp_pct = 0.04
    if req.risk_tolerance.lower() == "high":
        sl_pct, tp_pct = 0.04, 0.08
    elif req.risk_tolerance.lower() == "low":
        sl_pct, tp_pct = 0.015, 0.03

    if action == "BUY":
        stop_loss = current_price * (1 - sl_pct)
        take_profit = current_price * (1 + tp_pct)
    else: # SELL
        stop_loss = current_price * (1 + sl_pct)
        take_profit = current_price * (1 - tp_pct)

    return AdvisorResponse(
        action=action,
        confidence=confidence,
        reason=" ".join(reasons),
        recommended_size=round(recommended_size, 2),
        entry_price=current_price,
        stop_loss=round(stop_loss, 2),
        take_profit=round(take_profit, 2)
    )

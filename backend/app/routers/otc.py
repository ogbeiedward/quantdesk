"""OTC Desk & Institutional Block Trading — Galaxy Digital/FalconX-style RFQ engine."""
import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Wallet, Transaction
from app.services.market_data import get_current_price

router = APIRouter(prefix="/api/otc", tags=["otc"])

# In-memory RFQ blotter (replace with DB in full production)
_blotter: list = []

# Block trade threshold: orders above this notional get OTC treatment
BLOCK_TRADE_MIN_NOTIONAL = 50_000.0  # $50k
OTC_SPREAD_BPS = 3  # 3 basis points spread (vs 10bps for retail)
OTC_PRICE_IMPROVEMENT_BPS = 5  # 5bps price improvement vs mid


class RFQRequest(BaseModel):
    symbol: str
    quantity: float
    side: str  # BUY or SELL
    urgency: str = "normal"  # normal, urgent, patient


class ExecuteRFQRequest(BaseModel):
    rfq_id: str
    confirm: bool = True


class OTCOrderRequest(BaseModel):
    symbol: str
    quantity: float
    side: str
    strategy: str = "market"  # market, twap, vwap, iceberg


def compute_rfq(symbol: str, quantity: float, side: str, mid_price: float, urgency: str) -> dict:
    """Compute an RFQ quote with institutional pricing."""
    notional = quantity * mid_price

    # Spread varies by urgency and size
    if urgency == "urgent":
        spread_bps = OTC_SPREAD_BPS * 2
        price_improvement_bps = OTC_PRICE_IMPROVEMENT_BPS * 0.5
    elif urgency == "patient":
        spread_bps = max(OTC_SPREAD_BPS - 1, 1)
        price_improvement_bps = OTC_PRICE_IMPROVEMENT_BPS * 1.5
    else:
        spread_bps = OTC_SPREAD_BPS
        price_improvement_bps = OTC_PRICE_IMPROVEMENT_BPS

    # Size adjustment: larger orders get worse pricing
    if notional > 500_000:
        spread_bps *= 2
    elif notional > 1_000_000:
        spread_bps *= 3

    if side.upper() == "BUY":
        quoted_price = mid_price * (1 + spread_bps / 10000) * (1 - price_improvement_bps / 10000)
    else:
        quoted_price = mid_price * (1 - spread_bps / 10000) * (1 + price_improvement_bps / 10000)

    quoted_price = round(quoted_price, 6)
    fee_bps = max(0.5, 1.5 - (notional / 1_000_000) * 0.5)  # Lower fees for bigger orders
    fee = notional * fee_bps / 10000

    return {
        "rfq_id": str(uuid.uuid4()),
        "symbol": symbol,
        "side": side.upper(),
        "quantity": quantity,
        "mid_price": round(mid_price, 6),
        "quoted_price": quoted_price,
        "notional_usd": round(notional, 2),
        "spread_bps": spread_bps,
        "price_improvement_bps": price_improvement_bps,
        "fee_bps": round(fee_bps, 2),
        "fee_usd": round(fee, 2),
        "net_cost": round(quantity * quoted_price + fee if side.upper() == "BUY" else quantity * quoted_price - fee, 2),
        "execution_quality": "A+" if urgency == "patient" else "A",
        "settlement": "T+0",
        "counterparty": "QuantDesk Prime",
        "valid_for_seconds": 30,
        "urgency": urgency,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "status": "PENDING",
    }


@router.post("/rfq")
async def request_for_quote(
    req: RFQRequest,
    current_user: User = Depends(get_current_user),
):
    """Generate an institutional RFQ quote for a block trade."""
    symbol = req.symbol.upper()
    if not symbol.endswith("USDT"):
        symbol = f"{symbol}USDT"

    mid_price = get_current_price(symbol)
    if mid_price is None:
        # Try to get from CoinGecko
        import httpx
        async with httpx.AsyncClient(timeout=5) as client:
            try:
                r = await client.get("https://api.coingecko.com/api/v3/simple/price",
                                     params={"ids": "bitcoin", "vs_currencies": "usd"})
                d = r.json()
                mid_price = d.get("bitcoin", {}).get("usd", 0)
            except Exception:
                raise HTTPException(status_code=400, detail=f"Cannot determine price for {symbol}")

    notional = req.quantity * mid_price

    if notional < BLOCK_TRADE_MIN_NOTIONAL:
        raise HTTPException(
            status_code=400,
            detail=f"OTC desk minimum is ${BLOCK_TRADE_MIN_NOTIONAL:,.0f}. Use regular trading for smaller orders."
        )

    quote = compute_rfq(symbol, req.quantity, req.side, mid_price, req.urgency)
    _blotter.append({**quote, "user_id": str(current_user.id)})
    return quote


@router.post("/execute")
async def execute_rfq(
    req: ExecuteRFQRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Execute an accepted RFQ quote as a block trade."""
    # Find the RFQ in blotter
    rfq = next(
        (r for r in _blotter if r["rfq_id"] == req.rfq_id and r["user_id"] == str(current_user.id)),
        None
    )
    if not rfq:
        raise HTTPException(status_code=404, detail="RFQ not found or expired")

    if not req.confirm:
        rfq["status"] = "DECLINED"
        return {"message": "Quote declined", "rfq_id": req.rfq_id}

    # Execute: deduct / credit wallet
    wal_result = await db.execute(
        select(Wallet).where(and_(Wallet.user_id == current_user.id, Wallet.currency == "USD"))
    )
    wallet = wal_result.scalar_one_or_none()
    if wallet is None:
        raise HTTPException(status_code=400, detail="USD wallet not found")

    cost = rfq["net_cost"]

    if rfq["side"] == "BUY":
        if float(wallet.balance) < cost:
            raise HTTPException(status_code=400, detail="Insufficient balance for block trade")
        wallet.balance = float(wallet.balance) - cost
        desc = f"OTC BUY {rfq['quantity']} {rfq['symbol']} @ {rfq['quoted_price']} | Spread: {rfq['spread_bps']}bps"
    else:
        proceeds = rfq["quantity"] * rfq["quoted_price"] - rfq["fee_usd"]
        wallet.balance = float(wallet.balance) + proceeds
        desc = f"OTC SELL {rfq['quantity']} {rfq['symbol']} @ {rfq['quoted_price']} | Spread: {rfq['spread_bps']}bps"

    tx = Transaction(
        wallet_id=wallet.id,
        type="OTC_TRADE",
        amount=round(-cost if rfq["side"] == "BUY" else rfq["quantity"] * rfq["quoted_price"] - rfq["fee_usd"], 2),
        balance_after=round(float(wallet.balance), 2),
        description=desc,
    )
    db.add(tx)
    await db.commit()

    rfq["status"] = "EXECUTED"
    rfq["executed_at"] = datetime.now(timezone.utc).isoformat()

    return {
        "message": "Block trade executed successfully",
        "rfq_id": req.rfq_id,
        "execution_report": {
            "symbol": rfq["symbol"],
            "side": rfq["side"],
            "quantity": rfq["quantity"],
            "filled_price": rfq["quoted_price"],
            "notional": rfq["notional_usd"],
            "fee": rfq["fee_usd"],
            "execution_quality": rfq["execution_quality"],
            "counterparty": rfq["counterparty"],
            "settlement": rfq["settlement"],
            "executed_at": rfq["executed_at"],
        }
    }


@router.get("/blotter")
async def get_blotter(current_user: User = Depends(get_current_user)):
    """Return all institutional trades for this user (trade blotter)."""
    user_trades = [r for r in _blotter if r["user_id"] == str(current_user.id)]
    executed = [t for t in user_trades if t.get("status") == "EXECUTED"]

    total_notional = sum(t.get("notional_usd", 0) for t in executed)
    total_fees = sum(t.get("fee_usd", 0) for t in executed)

    return {
        "trades": sorted(user_trades, key=lambda x: x.get("created_at", ""), reverse=True),
        "summary": {
            "total_trades": len(executed),
            "total_notional_usd": round(total_notional, 2),
            "total_fees_usd": round(total_fees, 2),
            "avg_spread_bps": round(
                sum(t.get("spread_bps", 0) for t in executed) / max(len(executed), 1), 2
            ),
        }
    }


@router.get("/prime-brokerage")
async def prime_brokerage_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Prime brokerage account summary — margin, credit, settlement."""
    from app.models.models import Position
    open_pos_result = await db.execute(
        select(Position).where(and_(Position.user_id == current_user.id, Position.is_open.is_(True)))
    )
    positions = open_pos_result.scalars().all()

    wal_result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallets = {w.currency: float(w.balance) for w in wal_result.scalars().all()}
    usd_balance = wallets.get("USD", 0.0)

    total_notional = sum(float(p.quantity) * float(p.current_price or p.entry_price) for p in positions)
    total_unrealized_pnl = sum(float(p.unrealized_pnl) for p in positions)
    used_margin = sum(
        float(p.quantity) * float(p.entry_price) / float(p.leverage) for p in positions
    )
    free_margin = usd_balance - used_margin
    margin_level = (usd_balance / used_margin * 100) if used_margin > 0 else float("inf")

    # Simulated credit score based on account metrics
    credit_score = min(int(100 - (used_margin / max(usd_balance, 1)) * 50), 100)
    credit_rating = "AAA" if credit_score > 80 else "AA" if credit_score > 60 else "A" if credit_score > 40 else "BBB"

    executing_brokers = [
        {"name": "QuantDesk Prime", "type": "Principal", "status": "Active", "credit_line": 1_000_000},
        {"name": "Simulated OTC Desk", "type": "Agency", "status": "Active", "credit_line": 500_000},
    ]

    return {
        "account_type": "Institutional Prime",
        "usd_balance": round(usd_balance, 2),
        "total_equity": round(usd_balance + total_unrealized_pnl, 2),
        "used_margin": round(used_margin, 2),
        "free_margin": round(free_margin, 2),
        "margin_level_pct": round(margin_level, 1) if margin_level != float("inf") else "N/A",
        "total_notional": round(total_notional, 2),
        "unrealized_pnl": round(total_unrealized_pnl, 2),
        "open_positions": len(positions),
        "credit_score": credit_score,
        "credit_rating": credit_rating,
        "executing_brokers": executing_brokers,
        "settlement_cycle": "T+0 (Crypto) / T+2 (Forex)",
        "margin_call_level": 50.0,
        "liquidation_level": 20.0,
    }

"""Strategy & Backtesting router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Strategy
from app.schemas.schemas import StrategyCreate, StrategyOut, BacktestRequest, BacktestResult
from app.services.backtesting import run_backtest
from app.services.market_data import get_crypto_klines

router = APIRouter(prefix="/api/strategies", tags=["strategies"])


@router.get("/", response_model=List[StrategyOut])
async def list_strategies(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=StrategyOut)
async def create_strategy(
    data: StrategyCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    strategy = Strategy(
        user_id=current_user.id,
        name=data.name,
        description=data.description,
        config=data.config,
    )
    db.add(strategy)
    await db.commit()
    await db.refresh(strategy)
    return strategy


@router.post("/backtest")
async def backtest_strategy(
    data: BacktestRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get strategy
    result = await db.execute(
        select(Strategy).where(Strategy.id == data.strategy_id, Strategy.user_id == current_user.id)
    )
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")

    # Get historical candles
    interval_map = {"1m": "1m", "5m": "5m", "1h": "1h", "1d": "1d"}
    interval = interval_map.get(data.timeframe, "1d")
    candles = await get_crypto_klines(data.symbol, interval, limit=500)

    if not candles:
        raise HTTPException(status_code=400, detail="Could not fetch historical data")

    # Run backtest
    results = run_backtest(candles, strategy.config, data.initial_capital)

    # Save results to strategy
    strategy.backtest_results = results
    await db.commit()

    return results


@router.delete("/{strategy_id}")
async def delete_strategy(
    strategy_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Strategy).where(Strategy.id == strategy_id, Strategy.user_id == current_user.id)
    )
    strategy = result.scalar_one_or_none()
    if not strategy:
        raise HTTPException(status_code=404, detail="Strategy not found")
    await db.delete(strategy)
    await db.commit()
    return {"message": "Strategy deleted"}

"""Watchlist router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, WatchlistItem
from app.schemas.schemas import WatchlistAdd, WatchlistItemOut

router = APIRouter(prefix="/api/watchlist", tags=["watchlist"])


@router.get("/", response_model=List[WatchlistItemOut])
async def get_watchlist(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WatchlistItem).where(WatchlistItem.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=WatchlistItemOut)
async def add_to_watchlist(
    data: WatchlistAdd,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Check if already in watchlist
    existing = await db.execute(
        select(WatchlistItem).where(
            and_(WatchlistItem.user_id == current_user.id, WatchlistItem.symbol == data.symbol)
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Already in watchlist")

    item = WatchlistItem(user_id=current_user.id, symbol=data.symbol)
    db.add(item)
    await db.commit()
    await db.refresh(item)
    return item


@router.delete("/{symbol}")
async def remove_from_watchlist(
    symbol: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(WatchlistItem).where(
            and_(WatchlistItem.user_id == current_user.id, WatchlistItem.symbol == symbol)
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(item)
    await db.commit()
    return {"message": "Removed from watchlist"}

"""Wallet & transaction router."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import get_settings
from app.models.models import User, Wallet, Transaction
from app.schemas.schemas import WalletOut, TransactionOut

router = APIRouter(prefix="/api/wallet", tags=["wallet"])
settings = get_settings()


@router.get("/", response_model=List[WalletOut])
async def get_wallets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    return result.scalars().all()


@router.get("/transactions", response_model=List[TransactionOut])
async def get_transactions(
    currency: str = "USD",
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Transaction)
        .join(Wallet)
        .where(and_(Wallet.user_id == current_user.id, Wallet.currency == currency))
        .order_by(Transaction.created_at.desc())
        .limit(100)
    )
    return result.scalars().all()


@router.post("/reset")
async def reset_demo_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reset demo account to initial balance."""
    result = await db.execute(select(Wallet).where(Wallet.user_id == current_user.id))
    wallets = result.scalars().all()
    for w in wallets:
        if w.currency == "USD":
            w.balance = settings.DEMO_BALANCE
        else:
            w.balance = 0.0
    await db.commit()
    return {"message": "Demo account reset to initial balance"}

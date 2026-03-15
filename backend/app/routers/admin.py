"""Admin router — user management, system monitoring."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from app.core.database import get_db
from app.core.deps import get_admin_user
from app.models.models import User, Wallet, Order
from app.schemas.schemas import UserOut, AdminUserUpdate

router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.get("/users", response_model=List[UserOut])
async def list_users(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.put("/users/{user_id}")
async def update_user(
    user_id: str,
    data: AdminUserUpdate,
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if data.is_active is not None:
        user.is_active = data.is_active
    if data.role:
        user.role = data.role
    if data.demo_balance is not None:
        wallet_result = await db.execute(
            select(Wallet).where(and_(Wallet.user_id == user.id, Wallet.currency == "USD"))
        )
        wallet = wallet_result.scalar_one_or_none()
        if wallet:
            wallet.balance = data.demo_balance

    await db.commit()
    return {"message": "User updated"}


@router.get("/stats")
async def system_stats(
    admin: User = Depends(get_admin_user),
    db: AsyncSession = Depends(get_db),
):
    user_count = len((await db.execute(select(User))).scalars().all())
    order_count = len((await db.execute(select(Order))).scalars().all())
    return {
        "total_users": user_count,
        "total_orders": order_count,
    }

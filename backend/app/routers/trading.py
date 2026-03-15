"""Trading router — order placement, positions, and trade management."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.models import User, Order, Position, OrderStatus
from app.schemas.schemas import OrderCreate, OrderOut, PositionOut, ClosePositionRequest
from app.services.trading_engine import execute_market_order, execute_limit_order, close_position_by_id
from app.services.market_data import get_current_price

router = APIRouter(prefix="/api/trading", tags=["trading"])


@router.post("/orders", response_model=OrderOut)
async def place_order(
    data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    market_price = get_current_price(data.symbol)
    if market_price is None:
        raise HTTPException(status_code=400, detail=f"No market data for {data.symbol}")

    order = Order(
        user_id=current_user.id,
        symbol=data.symbol,
        side=data.side,
        order_type=data.order_type,
        quantity=data.quantity,
        price=data.price,
        stop_loss=data.stop_loss,
        take_profit=data.take_profit,
        leverage=data.leverage,
    )
    db.add(order)
    await db.flush()

    if data.order_type == "MARKET":
        order = await execute_market_order(db, order, market_price)
    elif data.order_type == "LIMIT":
        order = await execute_limit_order(db, order, market_price)

    await db.commit()
    await db.refresh(order)
    return order


@router.get("/orders", response_model=List[OrderOut])
async def get_orders(
    status: str = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Order).where(Order.user_id == current_user.id)
    if status:
        query = query.where(Order.status == status)
    query = query.order_by(Order.created_at.desc()).limit(100)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/positions", response_model=List[PositionOut])
async def get_positions(
    open_only: bool = True,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    query = select(Position).where(Position.user_id == current_user.id)
    if open_only:
        query = query.where(Position.is_open == True)
    query = query.order_by(Position.opened_at.desc())
    result = await db.execute(query)
    positions = result.scalars().all()

    # Update current prices
    for pos in positions:
        price = get_current_price(pos.symbol)
        if price:
            pos.current_price = price
            if pos.side == "BUY":
                pos.unrealized_pnl = (price - pos.entry_price) * pos.quantity * pos.leverage
            else:
                pos.unrealized_pnl = (pos.entry_price - price) * pos.quantity * pos.leverage

    return positions


@router.post("/positions/close", response_model=PositionOut)
async def close_position(
    data: ClosePositionRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    pos = await close_position_by_id(db, current_user.id, data.position_id)
    if pos is None:
        raise HTTPException(status_code=404, detail="Position not found or already closed")
    return pos

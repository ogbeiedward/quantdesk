"""Paper trading engine — order execution, P&L, slippage, fees simulation."""
import random
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Order, Position, Wallet, Transaction, OrderStatus
from app.services.market_data import get_current_price


MAKER_FEE = 0.001  # 0.1%
TAKER_FEE = 0.001
MAX_SLIPPAGE = 0.002  # 0.2%


def simulate_slippage(price: float, side: str) -> float:
    """Simulate realistic slippage."""
    slip = random.uniform(0, MAX_SLIPPAGE)
    if side == "BUY":
        return price * (1 + slip)
    return price * (1 - slip)


def calculate_fee(quantity: float, price: float) -> float:
    return quantity * price * TAKER_FEE


async def execute_market_order(db: AsyncSession, order: Order, market_price: float) -> Order:
    """Execute a market order at the current price with slippage + fees."""
    filled_price = simulate_slippage(market_price, order.side)
    fee = calculate_fee(order.quantity, filled_price)
    order.filled_price = round(filled_price, 8)
    order.fee = round(fee, 8)
    order.slippage = round(abs(filled_price - market_price), 8)
    order.status = OrderStatus.FILLED.value
    order.filled_at = datetime.now(timezone.utc)

    # Update wallet — deduct cost or credit proceeds
    usd_wallet = await _get_wallet(db, order.user_id, "USD")
    if usd_wallet:
        cost = order.quantity * filled_price + fee
        if order.side == "BUY":
            if usd_wallet.balance < cost:
                order.status = OrderStatus.CANCELLED.value
                await db.commit()
                return order
            usd_wallet.balance -= cost
            await _record_transaction(db, usd_wallet, "TRADE", -cost,
                                      f"BUY {order.quantity} {order.symbol} @ {filled_price}")
        else:
            proceeds = order.quantity * filled_price - fee
            usd_wallet.balance += proceeds
            await _record_transaction(db, usd_wallet, "TRADE", proceeds,
                                      f"SELL {order.quantity} {order.symbol} @ {filled_price}")

    # Create or update position
    await _update_position(db, order)
    await db.commit()
    return order


async def execute_limit_order(db: AsyncSession, order: Order, market_price: float) -> Order:
    """Check if a limit order should be filled."""
    if order.price is None:
        return order
    if order.side == "BUY" and market_price <= order.price:
        return await execute_market_order(db, order, order.price)
    elif order.side == "SELL" and market_price >= order.price:
        return await execute_market_order(db, order, order.price)
    return order


async def check_stop_loss_take_profit(db: AsyncSession, user_id: UUID):
    """Check open positions for stop loss / take profit triggers."""
    result = await db.execute(
        select(Position).where(
            and_(Position.user_id == user_id, Position.is_open == True)
        )
    )
    positions = result.scalars().all()
    for pos in positions:
        price = get_current_price(pos.symbol)
        if price is None:
            continue
        pos.current_price = price

        # Calculate unrealized P&L
        if pos.side == "BUY":
            pos.unrealized_pnl = (price - pos.entry_price) * pos.quantity * pos.leverage
        else:
            pos.unrealized_pnl = (pos.entry_price - price) * pos.quantity * pos.leverage

        # Check stop loss
        if pos.stop_loss:
            if pos.side == "BUY" and price <= pos.stop_loss:
                await _close_position(db, pos, price)
            elif pos.side == "SELL" and price >= pos.stop_loss:
                await _close_position(db, pos, price)

        # Check take profit
        if pos.take_profit:
            if pos.side == "BUY" and price >= pos.take_profit:
                await _close_position(db, pos, price)
            elif pos.side == "SELL" and price <= pos.take_profit:
                await _close_position(db, pos, price)

        # Check liquidation (if leverage > 1)
        if pos.leverage > 1:
            margin = (pos.entry_price * pos.quantity) / pos.leverage
            if pos.unrealized_pnl <= -margin * 0.8:
                await _close_position(db, pos, price)

    await db.commit()


async def close_position_by_id(db: AsyncSession, user_id: UUID, position_id: UUID) -> Optional[Position]:
    """Manually close a position."""
    result = await db.execute(
        select(Position).where(
            and_(Position.id == position_id, Position.user_id == user_id, Position.is_open == True)
        )
    )
    pos = result.scalar_one_or_none()
    if pos is None:
        return None
    price = get_current_price(pos.symbol)
    if price is None:
        return None
    await _close_position(db, pos, price)
    await db.commit()
    return pos


async def _close_position(db: AsyncSession, pos: Position, exit_price: float):
    """Close a position and credit wallet."""
    if pos.side == "BUY":
        pnl = (exit_price - pos.entry_price) * pos.quantity * pos.leverage
    else:
        pnl = (pos.entry_price - exit_price) * pos.quantity * pos.leverage

    fee = calculate_fee(pos.quantity, exit_price)
    pnl -= fee

    pos.realized_pnl = round(pnl, 8)
    pos.unrealized_pnl = 0.0
    pos.current_price = exit_price
    pos.is_open = False
    pos.closed_at = datetime.now(timezone.utc)

    # Credit wallet
    usd_wallet = await _get_wallet(db, pos.user_id, "USD")
    if usd_wallet:
        # Return initial margin + PnL
        margin = pos.entry_price * pos.quantity
        usd_wallet.balance += margin + pnl
        await _record_transaction(db, usd_wallet, "TRADE", pnl,
                                  f"CLOSE {pos.side} {pos.quantity} {pos.symbol} PnL: {pnl:.2f}")


async def _update_position(db: AsyncSession, order: Order):
    """Create or update a position from a filled order."""
    # Check for existing open position
    result = await db.execute(
        select(Position).where(
            and_(
                Position.user_id == order.user_id,
                Position.symbol == order.symbol,
                Position.side == order.side,
                Position.is_open == True,
            )
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        # Increase position
        total_qty = existing.quantity + order.quantity
        avg_price = (
            (existing.entry_price * existing.quantity + order.filled_price * order.quantity) / total_qty
        )
        existing.quantity = total_qty
        existing.entry_price = avg_price
    else:
        # New position
        pos = Position(
            user_id=order.user_id,
            symbol=order.symbol,
            side=order.side,
            quantity=order.quantity,
            entry_price=order.filled_price,
            current_price=order.filled_price,
            stop_loss=order.stop_loss,
            take_profit=order.take_profit,
            leverage=order.leverage,
        )
        db.add(pos)


async def _get_wallet(db: AsyncSession, user_id: UUID, currency: str) -> Optional[Wallet]:
    result = await db.execute(
        select(Wallet).where(and_(Wallet.user_id == user_id, Wallet.currency == currency))
    )
    return result.scalar_one_or_none()


async def _record_transaction(db: AsyncSession, wallet: Wallet, tx_type: str, amount: float, desc: str):
    tx = Transaction(
        wallet_id=wallet.id,
        type=tx_type,
        amount=round(amount, 8),
        balance_after=round(wallet.balance, 8),
        description=desc,
    )
    db.add(tx)

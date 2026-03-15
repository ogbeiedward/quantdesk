"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID


# ─── Auth ────────────────────────────
class UserCreate(BaseModel):
    email: EmailStr
    username: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class PasswordReset(BaseModel):
    email: EmailStr

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

# ─── User ────────────────────────────
class UserOut(BaseModel):
    id: UUID
    email: str
    username: str
    role: str
    is_active: bool
    risk_profile: str
    created_at: datetime

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    risk_profile: Optional[str] = None

# ─── Wallet ──────────────────────────
class WalletOut(BaseModel):
    id: UUID
    currency: str
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True

class TransactionOut(BaseModel):
    id: UUID
    type: str
    amount: float
    balance_after: float
    description: str
    created_at: datetime

    class Config:
        from_attributes = True

# ─── Orders ──────────────────────────
class OrderCreate(BaseModel):
    symbol: str
    side: str  # BUY / SELL
    order_type: str  # MARKET / LIMIT / STOP_LOSS / TAKE_PROFIT
    quantity: float
    price: Optional[float] = None
    stop_loss: Optional[float] = None
    take_profit: Optional[float] = None
    leverage: float = 1.0

class OrderOut(BaseModel):
    id: UUID
    symbol: str
    side: str
    order_type: str
    quantity: float
    price: Optional[float]
    filled_price: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    status: str
    leverage: float
    fee: float
    slippage: float
    created_at: datetime
    filled_at: Optional[datetime]

    class Config:
        from_attributes = True

# ─── Positions ───────────────────────
class PositionOut(BaseModel):
    id: UUID
    symbol: str
    side: str
    quantity: float
    entry_price: float
    current_price: Optional[float]
    stop_loss: Optional[float]
    take_profit: Optional[float]
    leverage: float
    unrealized_pnl: float
    realized_pnl: float
    is_open: bool
    opened_at: datetime
    closed_at: Optional[datetime]

    class Config:
        from_attributes = True

class ClosePositionRequest(BaseModel):
    position_id: UUID

# ─── Watchlist ───────────────────────
class WatchlistAdd(BaseModel):
    symbol: str

class WatchlistItemOut(BaseModel):
    id: UUID
    symbol: str
    added_at: datetime

    class Config:
        from_attributes = True

# ─── Strategy ────────────────────────
class StrategyCreate(BaseModel):
    name: str
    description: str = ""
    config: dict = {}

class StrategyOut(BaseModel):
    id: UUID
    name: str
    description: str
    config: dict
    backtest_results: Optional[dict]
    created_at: datetime

    class Config:
        from_attributes = True

class BacktestRequest(BaseModel):
    strategy_id: UUID
    symbol: str
    timeframe: str = "1d"
    start_date: str
    end_date: str
    initial_capital: float = 100000.0

class BacktestResult(BaseModel):
    total_return: float
    win_rate: float
    sharpe_ratio: float
    max_drawdown: float
    profit_factor: float
    total_trades: int
    equity_curve: List[float]

# ─── Market Data ─────────────────────
class MarketTicker(BaseModel):
    symbol: str
    price: float
    change_24h: float
    volume_24h: float
    high_24h: float
    low_24h: float

class CandleData(BaseModel):
    timestamp: int
    open: float
    high: float
    low: float
    close: float
    volume: float

class OrderBookEntry(BaseModel):
    price: float
    quantity: float

class OrderBookData(BaseModel):
    bids: List[OrderBookEntry]
    asks: List[OrderBookEntry]

# ─── News ────────────────────────────
class NewsItem(BaseModel):
    title: str
    description: str
    url: str
    source: str
    published_at: str
    sentiment: str = "Neutral"

# ─── Admin ───────────────────────────
class AdminUserUpdate(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None
    demo_balance: Optional[float] = None

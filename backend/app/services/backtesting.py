"""Backtesting engine — run strategies against historical data."""
import numpy as np
from typing import List, Dict, Any


def run_backtest(
    candles: List[dict],
    strategy_config: dict,
    initial_capital: float = 100000.0,
) -> dict:
    """
    Simple backtesting engine supporting EMA crossover, RSI, and MACD strategies.
    Returns performance metrics.
    """
    if len(candles) < 50:
        return {"error": "Insufficient data for backtesting"}

    closes = np.array([c["close"] for c in candles])
    strategy_type = strategy_config.get("type", "ema_crossover")

    if strategy_type == "ema_crossover":
        signals = _ema_crossover_signals(closes, strategy_config)
    elif strategy_type == "rsi":
        signals = _rsi_signals(closes, strategy_config)
    elif strategy_type == "macd":
        signals = _macd_signals(closes, strategy_config)
    else:
        signals = _ema_crossover_signals(closes, strategy_config)

    return _simulate_trades(closes, signals, initial_capital)


def _ema(data: np.ndarray, period: int) -> np.ndarray:
    """Exponential Moving Average."""
    ema = np.zeros_like(data)
    ema[0] = data[0]
    multiplier = 2.0 / (period + 1)
    for i in range(1, len(data)):
        ema[i] = (data[i] - ema[i - 1]) * multiplier + ema[i - 1]
    return ema


def _rsi(data: np.ndarray, period: int = 14) -> np.ndarray:
    """Relative Strength Index."""
    deltas = np.diff(data)
    gains = np.where(deltas > 0, deltas, 0)
    losses = np.where(deltas < 0, -deltas, 0)

    avg_gain = np.zeros(len(data))
    avg_loss = np.zeros(len(data))
    avg_gain[period] = np.mean(gains[:period])
    avg_loss[period] = np.mean(losses[:period])

    for i in range(period + 1, len(data)):
        avg_gain[i] = (avg_gain[i - 1] * (period - 1) + gains[i - 1]) / period
        avg_loss[i] = (avg_loss[i - 1] * (period - 1) + losses[i - 1]) / period

    rs = np.divide(avg_gain, avg_loss, out=np.zeros_like(avg_gain), where=avg_loss != 0)
    rsi = 100 - (100 / (1 + rs))
    rsi[:period] = 50
    return rsi


def _ema_crossover_signals(closes: np.ndarray, config: dict) -> List[int]:
    """Generate buy/sell signals from EMA crossover."""
    fast = config.get("fast_period", 12)
    slow = config.get("slow_period", 26)
    ema_fast = _ema(closes, fast)
    ema_slow = _ema(closes, slow)

    signals = [0] * len(closes)
    for i in range(1, len(closes)):
        if ema_fast[i] > ema_slow[i] and ema_fast[i - 1] <= ema_slow[i - 1]:
            signals[i] = 1  # Buy
        elif ema_fast[i] < ema_slow[i] and ema_fast[i - 1] >= ema_slow[i - 1]:
            signals[i] = -1  # Sell
    return signals


def _rsi_signals(closes: np.ndarray, config: dict) -> List[int]:
    """Generate signals from RSI."""
    period = config.get("rsi_period", 14)
    oversold = config.get("oversold", 30)
    overbought = config.get("overbought", 70)
    rsi = _rsi(closes, period)

    signals = [0] * len(closes)
    for i in range(1, len(closes)):
        if rsi[i] < oversold and rsi[i - 1] >= oversold:
            signals[i] = 1
        elif rsi[i] > overbought and rsi[i - 1] <= overbought:
            signals[i] = -1
    return signals


def _macd_signals(closes: np.ndarray, config: dict) -> List[int]:
    """Generate signals from MACD crossover."""
    fast = config.get("fast_period", 12)
    slow = config.get("slow_period", 26)
    signal_period = config.get("signal_period", 9)

    ema_fast = _ema(closes, fast)
    ema_slow = _ema(closes, slow)
    macd_line = ema_fast - ema_slow
    signal_line = _ema(macd_line, signal_period)

    signals = [0] * len(closes)
    for i in range(1, len(closes)):
        if macd_line[i] > signal_line[i] and macd_line[i - 1] <= signal_line[i - 1]:
            signals[i] = 1
        elif macd_line[i] < signal_line[i] and macd_line[i - 1] >= signal_line[i - 1]:
            signals[i] = -1
    return signals


def _simulate_trades(
    closes: np.ndarray, signals: List[int], initial_capital: float
) -> dict:
    """Simulate trades from signals and calculate performance metrics."""
    capital = initial_capital
    position = 0.0
    entry_price = 0.0
    trades = []
    equity_curve = [capital]
    wins = 0
    losses = 0

    for i in range(len(closes)):
        if signals[i] == 1 and position == 0:
            # Buy
            position = capital / closes[i]
            entry_price = closes[i]
            capital = 0
        elif signals[i] == -1 and position > 0:
            # Sell
            capital = position * closes[i]
            pnl = (closes[i] - entry_price) / entry_price
            trades.append(pnl)
            if pnl > 0:
                wins += 1
            else:
                losses += 1
            position = 0
            entry_price = 0

        # Equity
        current_equity = capital + position * closes[i]
        equity_curve.append(current_equity)

    # Close any remaining position
    if position > 0:
        capital = position * closes[-1]
        pnl = (closes[-1] - entry_price) / entry_price
        trades.append(pnl)
        if pnl > 0:
            wins += 1
        else:
            losses += 1

    total_trades = len(trades)
    total_return = ((equity_curve[-1] - initial_capital) / initial_capital) * 100
    win_rate = (wins / total_trades * 100) if total_trades > 0 else 0

    # Sharpe ratio (annualized, assuming daily data)
    if len(trades) > 1:
        returns = np.array(trades)
        sharpe = (np.mean(returns) / np.std(returns)) * np.sqrt(252) if np.std(returns) > 0 else 0
    else:
        sharpe = 0

    # Max drawdown
    eq = np.array(equity_curve)
    peak = np.maximum.accumulate(eq)
    drawdown = (eq - peak) / peak
    max_dd = float(np.min(drawdown)) * 100

    # Profit factor
    gross_profit = sum(t for t in trades if t > 0)
    gross_loss = abs(sum(t for t in trades if t < 0))
    profit_factor = gross_profit / gross_loss if gross_loss > 0 else float("inf")

    return {
        "total_return": round(total_return, 2),
        "win_rate": round(win_rate, 2),
        "sharpe_ratio": round(sharpe, 2),
        "max_drawdown": round(max_dd, 2),
        "profit_factor": round(profit_factor, 2),
        "total_trades": total_trades,
        "equity_curve": [round(e, 2) for e in equity_curve[::max(1, len(equity_curve) // 100)]],
    }

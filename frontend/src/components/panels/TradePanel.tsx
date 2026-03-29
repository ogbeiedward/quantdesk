import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL, WS_BASE_URL } from '../../api/config';

const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT', 'LTCUSDT', 'AVAXUSDT'];
const ORDER_TYPES = ['Market', 'Limit', 'Stop Limit'];
const LEVERAGE_OPTIONS = [1, 2, 3, 5, 10, 20, 50, 100];

const TradePanel: React.FC = () => {
  const [orderType, setOrderType] = useState('Limit');
  const [side, setSide] = useState<'BUY' | 'SELL'>('BUY');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [leverage, setLeverage] = useState(1);
  const [sizePercent, setSizePercent] = useState(0);
  const [livePrice, setLivePrice] = useState<number | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastResult, setLastResult] = useState<{ success: boolean; message: string } | null>(null);
  
  // AI Copilot state
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotCapital, setCopilotCapital] = useState('10000');
  const [copilotRisk, setCopilotRisk] = useState('Medium');
  const [copilotAdvice, setCopilotAdvice] = useState<any>(null);
  const [isCopilotLoading, setIsCopilotLoading] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Fetch wallet balance
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/wallet/`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => {
        const usd = Array.isArray(d) ? d.find((w: any) => w.currency === 'USD') : null;
        if (usd) setBalance(parseFloat(usd.balance));
      })
      .catch(() => {});
  }, [lastResult]);

  // WebSocket for live price
  useEffect(() => {
    if (wsRef.current) wsRef.current.close();
    const ws = new WebSocket(`${WS_BASE_URL}/ws/market`);
    wsRef.current = ws;
    ws.onmessage = (evt) => {
      try {
        const data = JSON.parse(evt.data);
        if (data.type === 'ticker' && data.symbol === symbol) {
          setLivePrice(data.price);
          if (orderType === 'Market') setPrice(data.price.toString());
        }
      } catch {}
    };
    return () => ws.close();
  }, [symbol, orderType]);

  // Calculate total value
  const effectivePrice = parseFloat(price) || livePrice || 0;
  const qty = parseFloat(quantity) || 0;
  const notional = qty * effectivePrice;
  const margin = leverage > 1 ? notional / leverage : notional;
  const estimatedFee = notional * 0.001;
  const slippage = orderType === 'Market' ? notional * 0.001 : 0;

  // Auto-fill quantity from percent
  const handlePercentChange = (pct: number) => {
    setSizePercent(pct);
    if (effectivePrice > 0 && balance > 0) {
      const usdAmount = (balance * pct) / 100;
      const newQty = usdAmount / effectivePrice;
      setQuantity(newQty.toFixed(6));
    }
  };

  const handleSubmit = async () => {
    const token = localStorage.getItem('token');
    if (!token || !quantity || !symbol) return;
    setIsSubmitting(true);
    setLastResult(null);

    const body: any = {
      symbol,
      side,
      order_type: orderType.toUpperCase().replace(' ', '_'),
      quantity: parseFloat(quantity),
      leverage,
    };
    if (orderType !== 'Market' && price) body.price = parseFloat(price);
    if (stopLoss) body.stop_loss = parseFloat(stopLoss);
    if (takeProfit) body.take_profit = parseFloat(takeProfit);

    try {
      const res = await fetch(`${API_BASE_URL}/api/trading/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        setLastResult({ success: true, message: `Order ${data.status || 'submitted'}! Filled @ $${parseFloat(data.filled_price || price || '0').toLocaleString()}` });
        setQuantity('');
        setSizePercent(0);
      } else {
        const err = await res.json();
        setLastResult({ success: false, message: err.detail || 'Order failed' });
      }
    } catch {
      setLastResult({ success: false, message: 'Connection error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetAdvice = async () => {
    setIsCopilotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/advisor/signal`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ capital: parseFloat(copilotCapital), symbol, risk_tolerance: copilotRisk })
      });
      const data = await res.json();
      setCopilotAdvice(data);
    } catch {
      setCopilotAdvice({ error: 'Failed to access AI Copilot' });
    } finally {
      setIsCopilotLoading(false);
    }
  };

  const applyAdvice = () => {
    if (!copilotAdvice || copilotAdvice.action === 'HOLD') return;
    setSide(copilotAdvice.action as 'BUY' | 'SELL');
    setOrderType('Limit');
    setPrice(copilotAdvice.entry_price.toString());
    const newQty = (copilotAdvice.recommended_size / copilotAdvice.entry_price).toFixed(6);
    setQuantity(newQty);
    setStopLoss(copilotAdvice.stop_loss.toString());
    setTakeProfit(copilotAdvice.take_profit.toString());
  };

  const symbolBase = symbol.replace('USDT', '');

  return (
    <div className="flex flex-col h-full bg-trading-dark border border-trading-border rounded-lg overflow-hidden">
      <div className="h-10 border-b border-trading-border bg-trading-panel flex items-center px-4 shrink-0 gap-3">
        <h2 className="font-semibold text-white text-sm">Place Order</h2>
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="ml-auto bg-trading-dark border border-trading-border rounded px-2 py-0.5 text-xs text-white focus:outline-none"
        >
          {SYMBOLS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <button onClick={() => setShowCopilot(!showCopilot)} className={`px-2 py-0.5 rounded text-xs font-bold transition-all ${showCopilot ? 'bg-trading-blue text-white shadow shadow-trading-blue/30' : 'bg-trading-dark text-trading-blue border border-trading-blue/30 hover:bg-trading-blue/10'}`}>
          🤖 AI Copilot
        </button>
      </div>

      <div className="p-3 flex-1 overflow-y-auto flex flex-col gap-3 text-xs">
        
        {/* AI Copilot Panel */}
        {showCopilot && (
          <div className="bg-trading-blue/10 border border-trading-blue/30 rounded-lg p-3 flex flex-col gap-3">
            <h3 className="text-trading-blue font-bold text-sm tracking-wide">🤖 Algorithmic Trading Copilot</h3>
            <div className="flex gap-2">
              <div className="flex-1 bg-trading-dark border border-trading-border rounded-lg flex items-center px-2 py-1.5">
                <span className="text-trading-muted w-4">$</span>
                <input type="number" className="flex-1 bg-transparent text-right text-white focus:outline-none font-mono text-xs"
                  placeholder="Capital" value={copilotCapital} onChange={(e) => setCopilotCapital(e.target.value)} />
              </div>
              <select value={copilotRisk} onChange={(e) => setCopilotRisk(e.target.value)}
                className="w-1/3 bg-trading-dark border border-trading-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none">
                <option value="Low">Low Risk</option>
                <option value="Medium">Med Risk</option>
                <option value="High">High Risk</option>
              </select>
            </div>
            <button onClick={handleGetAdvice} disabled={isCopilotLoading || !copilotCapital}
              className="w-full py-2 bg-trading-blue hover:bg-blue-600 text-white font-bold rounded flex items-center justify-center transition-all disabled:opacity-50">
              {isCopilotLoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Generate Trade Plan'}
            </button>
            
            {copilotAdvice && !copilotAdvice.error && (
              <div className="bg-trading-dark border border-trading-border p-3 rounded flex flex-col gap-2 mt-1 shadow-inner">
                <div className="flex justify-between items-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold shadow ${
                    copilotAdvice.action === 'BUY' ? 'bg-trading-green text-white shadow-trading-green/20' : 
                    copilotAdvice.action === 'SELL' ? 'bg-trading-red text-white shadow-trading-red/20' : 'bg-trading-border text-trading-muted'
                  }`}>
                    {copilotAdvice.action}
                  </span>
                  <span className="text-[10px] text-trading-muted">Confidence: <span className="text-white font-semibold">{copilotAdvice.confidence}</span></span>
                </div>
                <p className="text-trading-muted text-[11px] leading-relaxed italic border-l-2 border-trading-blue/50 pl-2">
                  "{copilotAdvice.reason}"
                </p>
                {copilotAdvice.action !== 'HOLD' && (
                  <>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-1">
                      <div className="flex justify-between text-[10px]"><span className="text-trading-muted">Entry Price</span><span className="text-white font-mono font-bold">${copilotAdvice.entry_price.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-trading-muted">Rec. Size</span><span className="text-white font-mono font-bold">${copilotAdvice.recommended_size.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-trading-muted">Stop Loss</span><span className="text-trading-red font-mono">${copilotAdvice.stop_loss.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                      <div className="flex justify-between text-[10px]"><span className="text-trading-muted">Take Profit</span><span className="text-trading-green font-mono">${copilotAdvice.take_profit.toLocaleString(undefined, {minimumFractionDigits: 2})}</span></div>
                    </div>
                    <button onClick={applyAdvice} className="mt-2 text-[10px] w-full py-1.5 border border-trading-blue text-trading-blue hover:bg-trading-blue hover:text-white transition-all rounded font-bold uppercase tracking-widest">
                      Apply Parameters
                    </button>
                  </>
                )}
              </div>
            )}
            {copilotAdvice && copilotAdvice.error && <div className="text-trading-red text-[10px] text-center">{copilotAdvice.error}</div>}
          </div>
        )}
        {/* Live price */}
        <div className="flex justify-between items-center">
          <span className="text-trading-muted">Market Price</span>
          <span className="font-mono text-white font-bold">
            {livePrice ? `$${livePrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </span>
        </div>

        {/* Available balance */}
        <div className="flex justify-between items-center">
          <span className="text-trading-muted">Available</span>
          <span className="font-mono text-trading-green">${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</span>
        </div>

        {/* Buy/Sell Toggle */}
        <div className="flex bg-trading-panel rounded-lg p-1 border border-trading-border">
          <button
            className={`flex-1 py-2 rounded text-xs font-bold transition-all ${side === 'BUY' ? 'bg-trading-green text-white shadow' : 'text-trading-muted hover:text-white'}`}
            onClick={() => setSide('BUY')}
          >↑ BUY / LONG</button>
          <button
            className={`flex-1 py-2 rounded text-xs font-bold transition-all ${side === 'SELL' ? 'bg-trading-red text-white shadow' : 'text-trading-muted hover:text-white'}`}
            onClick={() => setSide('SELL')}
          >↓ SELL / SHORT</button>
        </div>

        {/* Order type */}
        <div className="flex gap-3 border-b border-trading-border/50 pb-2">
          {ORDER_TYPES.map((t) => (
            <button
              key={t}
              className={`text-xs font-medium pb-1 border-b-2 transition-colors ${orderType === t ? 'text-trading-blue border-trading-blue' : 'text-trading-muted border-transparent hover:text-white'}`}
              onClick={() => setOrderType(t)}
            >{t}</button>
          ))}
        </div>

        {/* Leverage */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-trading-muted">Leverage</span>
            <span className={`font-bold font-mono ${leverage > 5 ? 'text-trading-red' : leverage > 1 ? 'text-yellow-400' : 'text-white'}`}>{leverage}x</span>
          </div>
          <div className="flex gap-1 flex-wrap">
            {LEVERAGE_OPTIONS.map((l) => (
              <button
                key={l}
                onClick={() => setLeverage(l)}
                className={`px-1.5 py-0.5 rounded text-[10px] transition-colors ${leverage === l ? 'bg-trading-blue text-white' : 'bg-trading-border/50 text-trading-muted hover:text-white'}`}
              >{l}x</button>
            ))}
          </div>
        </div>

        {/* Price (hidden for market orders) */}
        {orderType !== 'Market' && (
          <div className="bg-trading-panel border border-trading-border rounded-lg flex items-center px-3 py-2 focus-within:border-trading-blue transition-colors">
            <span className="text-trading-muted w-14">Price</span>
            <input
              type="number"
              className="flex-1 bg-transparent text-right text-white focus:outline-none font-mono"
              placeholder={livePrice?.toFixed(2) || '0.00'}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            <span className="text-trading-muted w-10 text-right">USD</span>
          </div>
        )}

        {/* Quantity */}
        <div className="bg-trading-panel border border-trading-border rounded-lg flex items-center px-3 py-2 focus-within:border-trading-blue transition-colors">
          <span className="text-trading-muted w-14">Amount</span>
          <input
            type="number"
            className="flex-1 bg-transparent text-right text-white focus:outline-none font-mono"
            placeholder="0.000000"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <span className="text-trading-muted w-10 text-right">{symbolBase}</span>
        </div>

        {/* Size slider */}
        <div>
          <input
            type="range" min={0} max={100} step={25} value={sizePercent}
            className="w-full accent-trading-blue h-1 bg-trading-border rounded-lg appearance-none cursor-pointer"
            onChange={(e) => handlePercentChange(parseInt(e.target.value))}
          />
          <div className="flex justify-between text-[10px] text-trading-muted mt-1 font-mono">
            {[0, 25, 50, 75, 100].map((p) => (
              <button key={p} onClick={() => handlePercentChange(p)} className="hover:text-white">{p}%</button>
            ))}
          </div>
        </div>

        {/* SL/TP */}
        <div className="flex gap-2">
          <div className="flex-1 bg-trading-panel border border-trading-border rounded-lg flex items-center px-2 py-1.5 focus-within:border-trading-red transition-colors">
            <span className="text-trading-red text-[10px] w-6">SL</span>
            <input
              type="number" className="flex-1 bg-transparent text-right text-white focus:outline-none font-mono text-xs"
              placeholder="Stop Loss" value={stopLoss}
              onChange={(e) => setStopLoss(e.target.value)}
            />
          </div>
          <div className="flex-1 bg-trading-panel border border-trading-border rounded-lg flex items-center px-2 py-1.5 focus-within:border-trading-green transition-colors">
            <span className="text-trading-green text-[10px] w-6">TP</span>
            <input
              type="number" className="flex-1 bg-transparent text-right text-white focus:outline-none font-mono text-xs"
              placeholder="Take Profit" value={takeProfit}
              onChange={(e) => setTakeProfit(e.target.value)}
            />
          </div>
        </div>

        {/* Order summary */}
        {notional > 0 && (
          <div className="bg-trading-panel border border-trading-border rounded-lg p-2 space-y-1">
            <div className="flex justify-between"><span className="text-trading-muted">Notional</span><span className="font-mono">${notional.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></div>
            {leverage > 1 && <div className="flex justify-between"><span className="text-trading-muted">Margin Required</span><span className="font-mono text-yellow-400">${margin.toFixed(2)}</span></div>}
            <div className="flex justify-between"><span className="text-trading-muted">Est. Fee (0.1%)</span><span className="font-mono text-trading-muted">${estimatedFee.toFixed(4)}</span></div>
            {slippage > 0 && <div className="flex justify-between"><span className="text-trading-muted">Est. Slippage</span><span className="font-mono text-yellow-400">${slippage.toFixed(4)}</span></div>}
          </div>
        )}

        {/* Risk warning for high leverage */}
        {leverage >= 10 && (
          <div className="bg-trading-red/10 border border-trading-red/30 rounded p-2 text-[10px] text-trading-red">
            ⚠️ High leverage ({leverage}x) significantly increases liquidation risk. Your position can be fully liquidated if price moves against you by {(100 / leverage).toFixed(1)}%.
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !quantity}
          className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide text-white transition-all hover:opacity-90 disabled:opacity-40 ${
            side === 'BUY' ? 'bg-trading-green shadow-lg shadow-trading-green/20' : 'bg-trading-red shadow-lg shadow-trading-red/20'
          }`}
        >
          {isSubmitting ? 'Processing...' : `${side} ${symbolBase} ${leverage > 1 ? `${leverage}x` : ''}`}
        </button>

        {/* Result feedback */}
        {lastResult && (
          <div className={`rounded p-2 text-[10px] text-center ${lastResult.success ? 'bg-trading-green/10 text-trading-green border border-trading-green/20' : 'bg-trading-red/10 text-trading-red border border-trading-red/20'}`}>
            {lastResult.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default TradePanel;

import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';

const Institutional: React.FC = () => {
  const [tab, setTab] = useState<'otc' | 'prime' | 'blotter'>('otc');
  const [rfqSymbol, setRfqSymbol] = useState('BTC');
  const [rfqQty, setRfqQty] = useState('1');
  const [rfqSide, setRfqSide] = useState<'BUY' | 'SELL'>('BUY');
  const [rfqUrgency, setRfqUrgency] = useState('normal');
  const [quote, setQuote] = useState<any>(null);
  const [prime, setPrime] = useState<any>(null);
  const [blotter, setBlotter] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [execResult, setExecResult] = useState<any>(null);
  const [error, setError] = useState('');

  const token = () => localStorage.getItem('token') || '';

  const fetchPrime = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/otc/prime-brokerage`, { headers: { Authorization: `Bearer ${token()}` } });
      setPrime(await r.json());
    } catch {}
  };
  const fetchBlotter = async () => {
    try {
      const r = await fetch(`${API_BASE_URL}/api/otc/blotter`, { headers: { Authorization: `Bearer ${token()}` } });
      setBlotter(await r.json());
    } catch {}
  };

  useEffect(() => { if (tab === 'prime') fetchPrime(); if (tab === 'blotter') fetchBlotter(); }, [tab]);

  const requestQuote = async () => {
    setIsLoading(true); setError(''); setQuote(null); setExecResult(null);
    try {
      const r = await fetch(`${API_BASE_URL}/api/otc/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ symbol: rfqSymbol, quantity: parseFloat(rfqQty), side: rfqSide, urgency: rfqUrgency }),
      });
      const d = await r.json();
      if (r.ok) setQuote(d);
      else setError(d.detail || 'RFQ failed');
    } catch { setError('Connection error'); }
    finally { setIsLoading(false); }
  };

  const executeQuote = async (confirm: boolean) => {
    if (!quote) return;
    setIsLoading(true);
    try {
      const r = await fetch(`${API_BASE_URL}/api/otc/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ rfq_id: quote.rfq_id, confirm }),
      });
      const d = await r.json();
      setExecResult({ success: r.ok, data: d });
      if (r.ok && confirm) setQuote(null);
    } catch { setExecResult({ success: false, data: { message: 'Error' } }); }
    finally { setIsLoading(false); }
  };

  const ratingColor = (r: string) => r === 'AAA' ? 'text-trading-green' : r === 'AA' ? 'text-blue-400' : r === 'A' ? 'text-yellow-400' : 'text-trading-red';

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-4 bg-trading-dark">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Institutional Desk</h1>
          <p className="text-xs text-trading-muted">Galaxy Digital · FalconX · Genesis-style OTC & Prime Brokerage</p>
        </div>
        <span className="text-xs text-trading-blue bg-trading-blue/10 border border-trading-blue/20 rounded px-3 py-1.5 font-semibold">
          QuantDesk Prime
        </span>
      </div>

      <div className="flex gap-1 bg-trading-panel border border-trading-border rounded-lg p-1">
        {[{ id: 'otc', label: '🏦 OTC Desk' }, { id: 'prime', label: '📊 Prime Brokerage' }, { id: 'blotter', label: '📋 Trade Blotter' }].map(t => (
          <button key={t.id} onClick={() => setTab(t.id as any)}
            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${tab === t.id ? 'bg-trading-blue text-white shadow' : 'text-trading-muted hover:text-white'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* OTC Desk */}
      {tab === 'otc' && (
        <div className="flex flex-col gap-4">
          <div className="bg-trading-panel border border-trading-border rounded-xl p-5">
            <h3 className="font-semibold text-white mb-1">Request for Quote (RFQ)</h3>
            <p className="text-xs text-trading-muted mb-4">Minimum $50,000 notional. Institutional pricing with price improvement vs market.</p>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-trading-muted mb-1 block">Asset</label>
                <select value={rfqSymbol} onChange={e => setRfqSymbol(e.target.value)}
                  className="w-full bg-trading-dark border border-trading-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-trading-blue">
                  {['BTC', 'ETH', 'SOL', 'BNB', 'XRP', 'ADA'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-trading-muted mb-1 block">Quantity</label>
                <input type="number" value={rfqQty} onChange={e => setRfqQty(e.target.value)}
                  className="w-full bg-trading-dark border border-trading-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-trading-blue" />
              </div>
              <div>
                <label className="text-xs text-trading-muted mb-1 block">Direction</label>
                <div className="flex rounded-lg overflow-hidden border border-trading-border">
                  <button onClick={() => setRfqSide('BUY')} className={`flex-1 py-2 text-xs font-bold transition-colors ${rfqSide === 'BUY' ? 'bg-trading-green text-white' : 'bg-trading-dark text-trading-muted'}`}>BUY</button>
                  <button onClick={() => setRfqSide('SELL')} className={`flex-1 py-2 text-xs font-bold transition-colors ${rfqSide === 'SELL' ? 'bg-trading-red text-white' : 'bg-trading-dark text-trading-muted'}`}>SELL</button>
                </div>
              </div>
              <div>
                <label className="text-xs text-trading-muted mb-1 block">Execution Urgency</label>
                <select value={rfqUrgency} onChange={e => setRfqUrgency(e.target.value)}
                  className="w-full bg-trading-dark border border-trading-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-trading-blue">
                  <option value="patient">Patient (Best Price)</option>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent (Speed Priority)</option>
                </select>
              </div>
            </div>
            <button onClick={requestQuote} disabled={isLoading}
              className="w-full py-3 bg-trading-blue hover:bg-blue-600 text-white font-bold rounded-lg transition-all disabled:opacity-50">
              {isLoading ? '⏳ Fetching Quote...' : '📨 Request Indicative Quote'}
            </button>
            {error && <p className="text-trading-red text-xs mt-2">{error}</p>}
          </div>

          {quote && (
            <div className="bg-trading-panel border border-trading-blue/40 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-white">Indicative Quote</h3>
                <span className="text-xs text-trading-green bg-trading-green/10 border border-trading-green/20 rounded px-2 py-1">Valid 30s</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div className="bg-trading-dark rounded-lg p-3">
                  <div className="text-trading-muted text-xs mb-1">Quoted Price</div>
                  <div className="text-white font-mono font-bold text-lg">${quote.quoted_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                  <div className="text-trading-green text-xs">{quote.price_improvement_bps}bps improvement vs mid</div>
                </div>
                <div className="bg-trading-dark rounded-lg p-3">
                  <div className="text-trading-muted text-xs mb-1">Net Cost / Proceeds</div>
                  <div className={`font-mono font-bold text-lg ${rfqSide === 'BUY' ? 'text-trading-red' : 'text-trading-green'}`}>
                    ${quote.net_cost?.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-trading-muted text-xs">Fee: ${quote.fee_usd?.toFixed(2)} ({quote.fee_bps}bps)</div>
                </div>
              </div>
              <div className="flex gap-3 text-xs text-trading-muted mb-4">
                <span>Counterparty: <span className="text-white">{quote.counterparty}</span></span>
                <span>Settlement: <span className="text-white">{quote.settlement}</span></span>
                <span>Quality: <span className="text-trading-green font-bold">{quote.execution_quality}</span></span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => executeQuote(true)} disabled={isLoading}
                  className="flex-1 py-3 bg-trading-green hover:opacity-90 text-white font-bold rounded-lg transition-all disabled:opacity-50">
                  ✅ Accept & Execute Block Trade
                </button>
                <button onClick={() => executeQuote(false)} disabled={isLoading}
                  className="px-6 py-3 bg-trading-red/20 hover:bg-trading-red/30 text-trading-red font-bold rounded-lg transition-all">
                  ✕ Decline
                </button>
              </div>
            </div>
          )}

          {execResult && (
            <div className={`rounded-xl p-4 border ${execResult.success ? 'border-trading-green/30 bg-trading-green/10' : 'border-trading-red/30 bg-trading-red/10'}`}>
              <div className={`font-semibold mb-2 ${execResult.success ? 'text-trading-green' : 'text-trading-red'}`}>
                {execResult.success ? '✅ Block Trade Executed' : '❌ Execution Failed'}
              </div>
              {execResult.data?.execution_report && (
                <div className="text-xs text-trading-muted space-y-1">
                  <div>Symbol: {execResult.data.execution_report.symbol} | Side: {execResult.data.execution_report.side}</div>
                  <div>Qty: {execResult.data.execution_report.quantity} | Fill: ${execResult.data.execution_report.filled_price?.toLocaleString()}</div>
                  <div>Notional: ${execResult.data.execution_report.notional?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div>
                </div>
              )}
              {!execResult.success && <div className="text-trading-red text-xs">{execResult.data?.message}</div>}
            </div>
          )}
        </div>
      )}

      {/* Prime Brokerage */}
      {tab === 'prime' && prime && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ['Account Type', prime.account_type, ''],
              ['Total Equity', `$${prime.total_equity?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, ''],
              ['USD Balance', `$${prime.usd_balance?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, ''],
              ['Used Margin', `$${prime.used_margin?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, ''],
              ['Free Margin', `$${prime.free_margin?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, ''],
              ['Credit Rating', prime.credit_rating || 'N/A', prime.credit_rating],
            ].map(([label, value, rating]: any) => (
              <div key={label} className="bg-trading-panel border border-trading-border rounded-xl p-4">
                <div className="text-xs text-trading-muted uppercase mb-1">{label}</div>
                <div className={`text-xl font-mono font-bold ${rating && ['AAA','AA','A','BBB'].includes(rating) ? ratingColor(rating) : 'text-white'}`}>{value}</div>
              </div>
            ))}
          </div>
          <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">Executing Brokers & Credit Lines</h3>
            <table className="w-full text-xs">
              <thead><tr className="text-trading-muted border-b border-trading-border">
                <th className="text-left py-2">Broker</th><th className="text-left">Type</th><th className="text-left">Status</th><th className="text-right">Credit Line</th>
              </tr></thead>
              <tbody>{prime.executing_brokers?.map((b: any) => (
                <tr key={b.name} className="border-b border-trading-border/30">
                  <td className="py-2 text-white">{b.name}</td><td className="text-trading-muted">{b.type}</td>
                  <td><span className="text-trading-green">● {b.status}</span></td>
                  <td className="text-right font-mono">${b.credit_line?.toLocaleString()}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">Margin & Risk Thresholds</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-trading-muted">Margin Level</span>
                <span className="font-mono">{prime.margin_level_pct === 'N/A' ? 'N/A' : `${prime.margin_level_pct}%`}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Margin Call Level</span>
                <span className="font-mono text-yellow-400">{prime.margin_call_level}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Liquidation Level</span>
                <span className="font-mono text-trading-red">{prime.liquidation_level}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-trading-muted">Settlement Cycle</span>
                <span className="font-mono text-trading-muted">{prime.settlement_cycle}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Blotter */}
      {tab === 'blotter' && blotter && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-4 gap-3">
            {[
              ['Total Trades', blotter.summary?.total_trades],
              ['Total Notional', blotter.summary?.total_notional_usd ? `$${blotter.summary.total_notional_usd.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0'],
              ['Total Fees', `$${blotter.summary?.total_fees_usd?.toFixed(2) || '0.00'}`],
              ['Avg Spread', `${blotter.summary?.avg_spread_bps?.toFixed(2) || '0'}bps`],
            ].map(([l, v]: any) => (
              <div key={l} className="bg-trading-panel border border-trading-border rounded-xl p-4">
                <div className="text-xs text-trading-muted uppercase mb-1">{l}</div>
                <div className="text-xl font-mono font-bold text-white">{v}</div>
              </div>
            ))}
          </div>
          <div className="bg-trading-panel border border-trading-border rounded-xl p-4 overflow-x-auto">
            <h3 className="font-semibold text-white mb-3">Trade Blotter</h3>
            {blotter.trades?.length === 0 ? (
              <p className="text-trading-muted text-sm">No institutional trades yet. Use the OTC Desk to place block trades.</p>
            ) : (
              <table className="w-full text-xs">
                <thead><tr className="text-trading-muted border-b border-trading-border">
                  <th className="text-left py-2">Symbol</th><th>Side</th><th className="text-right">Qty</th>
                  <th className="text-right">Quoted Price</th><th className="text-right">Notional</th>
                  <th className="text-right">Fee</th><th>Status</th><th className="text-right">Created</th>
                </tr></thead>
                <tbody>{blotter.trades?.map((t: any) => (
                  <tr key={t.rfq_id} className="border-b border-trading-border/30 hover:bg-trading-border/10">
                    <td className="py-2 font-semibold text-white">{t.symbol}</td>
                    <td className={`text-center font-bold ${t.side === 'BUY' ? 'text-trading-green' : 'text-trading-red'}`}>{t.side}</td>
                    <td className="text-right font-mono">{t.quantity}</td>
                    <td className="text-right font-mono">${t.quoted_price?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right font-mono">${t.notional_usd?.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                    <td className="text-right font-mono">${t.fee_usd?.toFixed(2)}</td>
                    <td className={`text-center ${t.status === 'EXECUTED' ? 'text-trading-green' : t.status === 'DECLINED' ? 'text-trading-red' : 'text-yellow-400'}`}>{t.status}</td>
                    <td className="text-right text-trading-muted">{new Date(t.created_at).toLocaleTimeString()}</td>
                  </tr>
                ))}</tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Institutional;

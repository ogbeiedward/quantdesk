import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

const STRATEGIES = ['ema_crossover', 'rsi', 'macd'];
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];
const TIMEFRAMES = ['1m', '5m', '1h', '1d'];

const Metric: React.FC<{ label: string; value: React.ReactNode; positive?: boolean; negative?: boolean }> = ({ label, value, positive, negative }) => (
  <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
    <div className="text-xs text-trading-muted uppercase tracking-wider mb-1">{label}</div>
    <div className={`text-xl font-mono font-bold ${positive ? 'text-trading-green' : negative ? 'text-trading-red' : 'text-white'}`}>{value}</div>
  </div>
);

const Backtesting: React.FC = () => {
  const [strategy, setStrategy] = useState('ema_crossover');
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [timeframe, setTimeframe] = useState('1h');
  const [capital, setCapital] = useState('100000');
  const [config, _setConfig] = useState({ fast_period: 12, slow_period: 26, rsi_period: 14, oversold: 30, overbought: 70 });
  const setConfig = _setConfig; // keep for future use

  const [strategyId, setStrategyId] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [portfolio, setPortfolio] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/analytics/portfolio`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(setPortfolio).catch(() => {});
  }, []);

  const runBacktest = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    setIsLoading(true); setError('');
    try {
      let sid = strategyId;
      if (!sid) {
        const sr = await fetch(`${API_BASE_URL}/api/strategies/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ name: `${strategy.toUpperCase()} ${symbol}`, description: `Auto ${strategy}`, config: { type: strategy, ...config } }),
        });
        const sd = await sr.json(); sid = sd.id; setStrategyId(sid);
      }
      const br = await fetch(`${API_BASE_URL}/api/strategies/backtest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ strategy_id: sid, symbol, timeframe, initial_capital: parseFloat(capital) }),
      });
      const bd = await br.json();
      if (bd.error) throw new Error(bd.error);
      setResults(bd);
    } catch (e: any) { setError(e.message || 'Backtest failed'); }
    finally { setIsLoading(false); }
  };

  const equityData = results?.equity_curve?.map((v: number, i: number) => ({ i, value: v })) || [];

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-4 bg-trading-dark">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Strategy Lab & Backtesting</h1>
      </div>

      {portfolio && portfolio.total_trades > 0 && (
        <div className="grid grid-cols-4 gap-3">
          <Metric label="Live P&L" value={`$${portfolio.total_pnl?.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} positive={portfolio.total_pnl > 0} negative={portfolio.total_pnl < 0} />
          <Metric label="Win Rate" value={`${portfolio.win_rate?.toFixed(1)}%`} positive={portfolio.win_rate > 50} />
          <Metric label="Sharpe Ratio" value={portfolio.sharpe_ratio?.toFixed(2)} positive={portfolio.sharpe_ratio > 1} />
          <Metric label="Max Drawdown" value={`${portfolio.max_drawdown?.toFixed(2)}%`} negative />
        </div>
      )}

      {portfolio?.equity_curve?.length > 1 && (
        <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
          <h3 className="font-semibold text-white mb-3">Live Account Equity Curve</h3>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={portfolio.equity_curve.map((v: number, i: number) => ({ i, value: v }))}>
                <CartesianGrid strokeDasharray="2 2" stroke="#2a2e39" />
                <XAxis dataKey="i" hide />
                <YAxis domain={['auto', 'auto']} tick={{ fill: '#8b92a5', fontSize: 10 }} width={70} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid #2a2e39', borderRadius: 8, fontSize: 11 }}
                  formatter={(v: number) => [`$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Equity']} />
                <Line type="monotone" dataKey="value" stroke="#00c853" dot={false} strokeWidth={2} />
                <ReferenceLine y={100000} stroke="#8b92a5" strokeDasharray="3 3" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
        <h3 className="font-semibold text-white mb-4">Run Backtest</h3>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[['Strategy', strategy, setStrategy, STRATEGIES, (s: string) => s.replace('_',' ').toUpperCase()],
            ['Symbol', symbol, setSymbol, SYMBOLS, (s: string) => s],
            ['Timeframe', timeframe, setTimeframe, TIMEFRAMES, (s: string) => s]].map(([label, val, setter, opts, fmt]: any) => (
            <div key={label as string}>
              <label className="text-xs text-trading-muted mb-1 block">{label}</label>
              <select value={val} onChange={(e) => { setter(e.target.value); setStrategyId(null); }}
                className="w-full bg-trading-dark border border-trading-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-trading-blue">
                {opts.map((o: string) => <option key={o} value={o}>{fmt(o)}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="text-xs text-trading-muted mb-1 block">Initial Capital ($)</label>
            <input type="number" value={capital} onChange={(e) => setCapital(e.target.value)}
              className="w-full bg-trading-dark border border-trading-border rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-trading-blue" />
          </div>
        </div>
        <button onClick={runBacktest} disabled={isLoading}
          className="w-full py-3 bg-trading-blue hover:bg-blue-600 text-white font-bold rounded-lg transition-all disabled:opacity-50">
          {isLoading ? '⏳ Running Backtest...' : '▶ Run Backtest'}
        </button>
        {error && <p className="text-trading-red text-xs mt-2">{error}</p>}
      </div>

      {results && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-3 gap-3">
            <Metric label="Total Return" value={`${results.total_return > 0 ? '+' : ''}${results.total_return}%`} positive={results.total_return > 0} negative={results.total_return < 0} />
            <Metric label="Win Rate" value={`${results.win_rate}%`} positive={results.win_rate > 50} />
            <Metric label="Sharpe Ratio" value={results.sharpe_ratio} positive={results.sharpe_ratio > 1} />
            <Metric label="Max Drawdown" value={`${results.max_drawdown}%`} negative />
            <Metric label="Profit Factor" value={results.profit_factor === Infinity ? '∞' : results.profit_factor} positive={results.profit_factor > 1.5} />
            <Metric label="Total Trades" value={results.total_trades} />
          </div>
          <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">Equity Curve</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equityData}>
                  <CartesianGrid strokeDasharray="2 2" stroke="#2a2e39" />
                  <XAxis dataKey="i" hide />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: '#8b92a5', fontSize: 10 }} width={75} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={{ background: '#1a1d2e', border: '1px solid #2a2e39', borderRadius: 8, fontSize: 11 }}
                    formatter={(v: number) => [`$${v.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Equity']} />
                  <Line type="monotone" dataKey="value" stroke={results.total_return >= 0 ? '#00c853' : '#ef5350'} dot={false} strokeWidth={2} />
                  <ReferenceLine y={parseFloat(capital)} stroke="#8b92a5" strokeDasharray="4 4" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
            <h3 className="font-semibold text-white mb-3">Risk Analysis & Kelly Criterion</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-trading-muted text-xs mb-1">Risk/Reward Assessment</div>
                <div className={`font-semibold ${results.profit_factor > 1.5 ? 'text-trading-green' : results.profit_factor > 1 ? 'text-yellow-400' : 'text-trading-red'}`}>
                  {results.profit_factor > 2 ? '✅ Excellent Edge' : results.profit_factor > 1.5 ? '✅ Good Edge' : results.profit_factor > 1 ? '⚠️ Marginal' : '❌ Negative Edge'}
                </div>
              </div>
              <div>
                <div className="text-trading-muted text-xs mb-1">Kelly Criterion (Optimal Bet %)</div>
                <div className="font-semibold text-white font-mono">
                  {Math.max(0, Math.min(((results.win_rate/100) - (1 - results.win_rate/100) / results.profit_factor) * 100, 50)).toFixed(1)}% per trade
                </div>
              </div>
              <div>
                <div className="text-trading-muted text-xs mb-1">Avg Expectancy per trade</div>
                <div className={`font-semibold font-mono ${results.total_return > 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                  ${results.total_trades > 0 ? (results.total_return / 100 * parseFloat(capital) / results.total_trades).toFixed(2) : '0.00'}
                </div>
              </div>
              <div>
                <div className="text-trading-muted text-xs mb-1">Strategy Verdict</div>
                <div className={`font-semibold ${results.sharpe_ratio > 1 && results.profit_factor > 1.5 ? 'text-trading-green' : 'text-yellow-400'}`}>
                  {results.sharpe_ratio > 1 && results.profit_factor > 1.5 ? '✅ Deploy-Ready' : '⚠️ Needs Optimization'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Backtesting;

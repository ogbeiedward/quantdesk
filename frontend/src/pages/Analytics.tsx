import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../api/config';
import { LineChart, Line, ReferenceLine, ResponsiveContainer } from 'recharts';


type Tab = 'smartmoney' | 'onchain' | 'narrative' | 'correlation';

const Badge: React.FC<{ label: string }> = ({ label }) => {
  const color = label === 'Bullish' ? 'bg-trading-green/20 text-trading-green border-trading-green/30'
    : label === 'Bearish' ? 'bg-trading-red/20 text-trading-red border-trading-red/30'
    : 'bg-trading-muted/20 text-trading-muted border-trading-muted/20';
  return <span className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase ${color}`}>{label}</span>;
};

const Metric: React.FC<{ label: string; value: React.ReactNode; sub?: string }> = ({ label, value, sub }) => (
  <div className="bg-trading-panel border border-trading-border rounded-lg p-4">
    <div className="text-xs text-trading-muted uppercase tracking-wider mb-1">{label}</div>
    <div className="text-xl font-mono font-bold text-white">{value}</div>
    {sub && <div className="text-xs text-trading-muted mt-1">{sub}</div>}
  </div>
);

const Analytics: React.FC = () => {
  const [tab, setTab] = useState<Tab>('smartmoney');
  const [smartMoney, setSmartMoney] = useState<any>(null);
  const [onChain, setOnChain] = useState<any>(null);
  const [narrative, setNarrative] = useState<any>(null);
  const [correlation, setCorrelation] = useState<any>(null);
  const [volatility, setVolatility] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async (section: Tab) => {
    setLoading(true);
    try {
      if (section === 'smartmoney' && !smartMoney) {
        const r = await fetch(`${API_BASE_URL}/api/analytics/smart-money`);
        setSmartMoney(await r.json());
      }
      if (section === 'onchain' && !onChain) {
        const [oc, vol] = await Promise.all([
          fetch(`${API_BASE_URL}/api/analytics/on-chain`).then(r => r.json()),
          fetch(`${API_BASE_URL}/api/analytics/volatility`).then(r => r.json()),
        ]);
        setOnChain(oc);
        setVolatility(vol);
      }
      if (section === 'narrative' && !narrative) {
        const r = await fetch(`${API_BASE_URL}/api/narrative/feed`);
        const social = await fetch(`${API_BASE_URL}/api/narrative/social-sentiment`);
        const [nd, sd] = await Promise.all([r.json(), social.json()]);
        setNarrative({ feed: nd, social: sd });
      }
      if (section === 'correlation' && !correlation) {
        const r = await fetch(`${API_BASE_URL}/api/analytics/correlation`);
        setCorrelation(await r.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(tab); }, [tab]);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: 'smartmoney', label: 'Smart Money', icon: '🧠' },
    { id: 'onchain', label: 'On-Chain', icon: '⛓️' },
    { id: 'narrative', label: 'Narrative', icon: '📰' },
    { id: 'correlation', label: 'Correlations', icon: '🔗' },
  ];

  return (
    <div className="h-full overflow-y-auto p-4 flex flex-col gap-4 bg-trading-dark">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">Market Intelligence</h1>
        <span className="text-xs text-trading-muted bg-trading-panel border border-trading-border rounded px-2 py-1">
          Powered by Binance · CoinGecko · alternative.me · CoinDesk
        </span>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-trading-panel border border-trading-border rounded-lg p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 py-2 px-3 rounded text-xs font-medium transition-all ${
              tab === t.id ? 'bg-trading-blue text-white shadow' : 'text-trading-muted hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-trading-blue border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* ── Smart Money ── */}
      {tab === 'smartmoney' && smartMoney && !loading && (
        <div className="flex flex-col gap-4">
          {/* Fear & Greed */}
          {smartMoney.fear_greed && (
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Fear & Greed Index</h3>
                <Badge label={smartMoney.fear_greed.value > 60 ? 'Bullish' : smartMoney.fear_greed.value < 40 ? 'Bearish' : 'Neutral'} />
              </div>
              <div className="flex items-center gap-6">
                <div className="text-5xl font-mono font-bold" style={{
                  color: smartMoney.fear_greed.value > 60 ? '#00c853' : smartMoney.fear_greed.value < 40 ? '#ef5350' : '#8b92a5'
                }}>
                  {smartMoney.fear_greed.value}
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">{smartMoney.fear_greed.label}</div>
                  <div className="text-xs text-trading-muted">{smartMoney.fear_greed.interpretation}</div>
                  <div className="text-xs text-trading-muted mt-1">Trend: <span className={smartMoney.fear_greed.trend === 'Improving' ? 'text-trading-green' : 'text-trading-red'}>{smartMoney.fear_greed.trend}</span></div>
                </div>
              </div>
              {smartMoney.fear_greed.history?.length > 0 && (
                <div className="mt-3 h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={smartMoney.fear_greed.history.slice(0, 14).reverse()}>
                      <Line type="monotone" dataKey="value" stroke="#2196f3" dot={false} strokeWidth={2} />
                      <ReferenceLine y={50} stroke="#8b92a5" strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* Funding Rates */}
          {smartMoney.funding_rates?.length > 0 && (
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Funding Rates (Binance Perp)</h3>
              <div className="space-y-2">
                {smartMoney.funding_rates.slice(0, 6).map((fr: any) => (
                  <div key={fr.symbol} className="flex items-center justify-between text-sm">
                    <span className="text-trading-muted font-mono w-24">{fr.symbol}</span>
                    <span className={`font-mono font-bold ${fr.funding_rate > 0 ? 'text-trading-red' : 'text-trading-green'}`}>
                      {fr.funding_rate > 0 ? '+' : ''}{fr.funding_rate.toFixed(4)}%
                    </span>
                    <span className="text-xs text-trading-muted">{fr.funding_rate_annualized.toFixed(1)}% APR</span>
                    <Badge label={fr.sentiment.split(' ')[0]} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-trading-muted mt-3">Positive = Longs paying Shorts (bearish signal). Negative = Shorts paying Longs (bullish signal).</p>
            </div>
          )}

          {/* Long/Short Ratio */}
          {smartMoney.long_short_ratio?.length > 0 && (
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Long/Short Ratio</h3>
              {smartMoney.long_short_ratio.map((ls: any) => (
                <div key={ls.symbol} className="mb-3">
                  <div className="flex justify-between mb-1 text-xs">
                    <span className="text-white font-semibold">{ls.symbol}</span>
                    <Badge label={ls.sentiment.split(' ')[0]} />
                  </div>
                  <div className="h-3 rounded-full overflow-hidden flex">
                    <div className="bg-trading-green" style={{ width: `${ls.long_pct}%` }} />
                    <div className="bg-trading-red" style={{ width: `${ls.short_pct}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] mt-1">
                    <span className="text-trading-green">Longs {ls.long_pct.toFixed(1)}%</span>
                    <span className="text-trading-red">Shorts {ls.short_pct.toFixed(1)}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── On-Chain ── */}
      {tab === 'onchain' && onChain && !loading && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            {onChain.btc_hash_rate_eh && <Metric label="BTC Hash Rate" value={`${onChain.btc_hash_rate_eh} EH/s`} sub="Network security" />}
            {onChain.btc_dominance && <Metric label="BTC Dominance" value={`${onChain.btc_dominance}%`} sub={`ETH ${onChain.eth_dominance}%`} />}
            {onChain.btc_daily_txns && <Metric label="Daily Transactions" value={onChain.btc_daily_txns?.toLocaleString() || '—'} sub="BTC network" />}
            {onChain.total_market_cap_usd && (
              <Metric label="Total Market Cap" value={`$${(onChain.total_market_cap_usd / 1e12).toFixed(2)}T`}
                sub={`${onChain.market_cap_change_24h >= 0 ? '+' : ''}${onChain.market_cap_change_24h?.toFixed(2)}% 24h`} />
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <div className="text-xs text-trading-muted uppercase mb-2">MVRV Signal</div>
              <Badge label={onChain.mvrv_signal || 'Neutral'} />
              <p className="text-xs text-trading-muted mt-2">Market Value to Realized Value proxy. Above 3.7 = historically overvalued.</p>
            </div>
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <div className="text-xs text-trading-muted uppercase mb-2">Whale Alert</div>
              <Badge label={onChain.whale_alert_signal === 'Watch' ? 'Neutral' : 'Bullish'} />
              <p className="text-xs text-trading-muted mt-2">Mempool: {onChain.btc_mempool_size?.toLocaleString() || '—'} pending txns</p>
            </div>
          </div>

          {/* Volatility Scanner */}
          {volatility.length > 0 && (
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Volatility Scanner (Real)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-trading-muted border-b border-trading-border">
                      <th className="text-left py-2">Symbol</th>
                      <th className="text-right">1H Vol</th>
                      <th className="text-right">24H Vol</th>
                      <th className="text-right">7D Vol</th>
                      <th className="text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {volatility.map((v: any) => (
                      <tr key={v.symbol} className="border-b border-trading-border/30 hover:bg-trading-border/10">
                        <td className="py-2 font-semibold">{v.symbol.replace('USDT', '')}</td>
                        <td className="text-right font-mono">{v.volatility_1h}%</td>
                        <td className="text-right font-mono">{v.volatility_24h}%</td>
                        <td className="text-right font-mono">{v.volatility_7d}%</td>
                        <td className="text-right">
                          <div className="h-1.5 bg-trading-border rounded overflow-hidden inline-block w-16">
                            <div className="h-full bg-trading-blue" style={{ width: `${v.trend_strength}%` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Narrative ── */}
      {tab === 'narrative' && narrative && !loading && (
        <div className="flex flex-col gap-4">
          {/* Market Mood */}
          {narrative.feed?.summary && (
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-white">Market Mood (AI Scored)</h3>
                <Badge label={narrative.feed.summary.market_mood} />
              </div>
              <div className="flex gap-6 text-sm">
                <div className="text-center">
                  <div className="text-trading-green text-2xl font-mono font-bold">{narrative.feed.summary.bullish}</div>
                  <div className="text-xs text-trading-muted">Bullish Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-trading-red text-2xl font-mono font-bold">{narrative.feed.summary.bearish}</div>
                  <div className="text-xs text-trading-muted">Bearish Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-trading-muted text-2xl font-mono font-bold">{narrative.feed.summary.neutral}</div>
                  <div className="text-xs text-trading-muted">Neutral Articles</div>
                </div>
                <div className="text-center">
                  <div className="text-white text-2xl font-mono font-bold">{narrative.feed.summary.mood_score}%</div>
                  <div className="text-xs text-trading-muted">Bullish Score</div>
                </div>
              </div>
            </div>
          )}

          {/* Asset Sentiment */}
          {narrative.social?.asset_sentiment?.length > 0 && (
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Asset Momentum (Price-Based)</h3>
              <div className="grid grid-cols-2 gap-2">
                {narrative.social.asset_sentiment.slice(0, 8).map((a: any) => (
                  <div key={a.symbol} className="flex items-center justify-between bg-trading-dark rounded p-2">
                    <div>
                      <span className="text-xs font-bold text-white">{a.symbol}</span>
                      <div className="text-[10px] text-trading-muted">1H: {a.change_1h}% | 24H: {a.change_24h}%</div>
                    </div>
                    <Badge label={a.narrative} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* News Feed */}
          {narrative.feed?.articles?.length > 0 && (
            <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
              <h3 className="font-semibold text-white mb-3">Live News Feed</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {narrative.feed.articles.map((a: any, i: number) => (
                  <div key={i} className="border-b border-trading-border/50 pb-3 last:border-0">
                    <div className="flex items-start justify-between gap-2">
                      <a href={a.url} target="_blank" rel="noreferrer"
                        className="text-sm text-white hover:text-trading-blue font-medium leading-snug flex-1">
                        {a.title}
                      </a>
                      <Badge label={a.sentiment} />
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-trading-blue bg-trading-blue/10 border border-trading-blue/20 px-1.5 rounded">{a.source}</span>
                      {a.mentioned_assets?.map((sym: string) => (
                        <span key={sym} className="text-[10px] text-trading-muted bg-trading-border/30 px-1.5 rounded">{sym}</span>
                      ))}
                    </div>
                    {a.description && <p className="text-xs text-trading-muted mt-1 line-clamp-2">{a.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Correlation ── */}
      {tab === 'correlation' && correlation && !loading && (
        <div className="bg-trading-panel border border-trading-border rounded-xl p-4">
          <h3 className="font-semibold text-white mb-1">Correlation Matrix (60-Day)</h3>
          <p className="text-xs text-trading-muted mb-3">Real correlations computed from Binance price data. High correlation = assets move together = less diversification.</p>
          <div className="overflow-x-auto">
            <table className="text-[10px] font-mono">
              <thead>
                <tr>
                  <th className="w-20" />
                  {correlation.symbols.map((s: string) => (
                    <th key={s} className="p-1 text-trading-muted w-16">{s.replace('USDT', '')}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {correlation.symbols.map((row: string) => (
                  <tr key={row}>
                    <td className="text-trading-muted p-1 font-bold">{row.replace('USDT', '')}</td>
                    {correlation.symbols.map((col: string) => {
                      const val = correlation.matrix[row]?.[col] ?? 0;
                      const abs = Math.abs(val);
                      const bg = val === 1 ? 'bg-trading-blue/40' :
                        val >= 0.8 ? 'bg-trading-green/30' :
                        val >= 0.5 ? 'bg-trading-green/15' :
                        val < 0 ? `bg-trading-red/${Math.floor(abs * 30)}` : 'bg-transparent';
                      return (
                        <td key={col} className={`p-1 text-center rounded ${bg}`}>
                          <span className={val >= 0.8 ? 'text-trading-green' : val < 0 ? 'text-trading-red' : 'text-white'}>
                            {val.toFixed(2)}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;

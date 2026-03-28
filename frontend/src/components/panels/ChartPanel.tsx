import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart, IChartApi, ISeriesApi,
  CandlestickSeries, LineSeries,
  ColorType,
} from 'lightweight-charts';
import { API_BASE_URL, WS_BASE_URL } from '../../api/config';

const INTERVALS = ['1m', '5m', '15m', '1H', '4H', '1D'];
const INTERVAL_MAP: Record<string, string> = {
  '1m': '1m', '5m': '5m', '15m': '15m', '1H': '1h', '4H': '4h', '1D': '1d',
};
const SYMBOLS = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT', 'XRPUSDT', 'ADAUSDT'];

interface IndicatorData {
  rsi?: number;
  macd?: number;
  signals?: string[];
  overall?: string;
}

const ChartPanel: React.FC = () => {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const ema12SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const ema26SeriesRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbUpperRef = useRef<ISeriesApi<'Line'> | null>(null);
  const bbLowerRef = useRef<ISeriesApi<'Line'> | null>(null);

  const [symbol, setSymbol] = useState('BTCUSDT');
  const [interval, setInterval] = useState('1H');
  const [price, setPrice] = useState<number | null>(null);
  const [change24h, setChange24h] = useState<number | null>(null);
  const [indicators, setIndicators] = useState<IndicatorData>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showIndicators, setShowIndicators] = useState(true);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: { background: { type: ColorType.Solid, color: '#0b0e14' }, textColor: '#8b92a5' },
      grid: { vertLines: { color: '#1e2230' }, horzLines: { color: '#1e2230' } },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#2a2e39' },
      timeScale: { borderColor: '#2a2e39', timeVisible: true },
      width: chartContainerRef.current.clientWidth,
      height: chartContainerRef.current.clientHeight,
    });
    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00c853', downColor: '#ef5350',
      borderUpColor: '#00c853', borderDownColor: '#ef5350',
      wickUpColor: '#00c853', wickDownColor: '#ef5350',
    });
    candleSeriesRef.current = candleSeries;

    ema12SeriesRef.current = chart.addSeries(LineSeries, { color: '#2196f3', lineWidth: 1, title: 'EMA12' });
    ema26SeriesRef.current = chart.addSeries(LineSeries, { color: '#ff9800', lineWidth: 1, title: 'EMA26' });
    bbUpperRef.current = chart.addSeries(LineSeries, { color: '#7b61ff88', lineWidth: 1, lineStyle: 2 });
    bbLowerRef.current = chart.addSeries(LineSeries, { color: '#7b61ff88', lineWidth: 1, lineStyle: 2 });

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
      }
    });
    if (chartContainerRef.current) ro.observe(chartContainerRef.current);

    return () => { ro.disconnect(); chart.remove(); };
  }, []);

  const calcEma = (arr: number[], p: number) => {
    const m = 2 / (p + 1);
    const e = [arr[0]];
    for (let i = 1; i < arr.length; i++) e.push((arr[i] - e[i - 1]) * m + e[i - 1]);
    return e;
  };

  const fetchKlines = useCallback(async () => {
    if (!candleSeriesRef.current) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/market/crypto/klines?symbol=${symbol}&interval=${INTERVAL_MAP[interval]}&limit=500`);
      const data = await res.json();

      const candles = data.map((c: { timestamp: number; open: number; high: number; low: number; close: number }) => ({
        time: Math.floor(c.timestamp / 1000) as unknown as number,
        open: c.open, high: c.high, low: c.low, close: c.close,
      }));

      candleSeriesRef.current.setData(candles as any);

      if (candles.length > 0) {
        const last = candles[candles.length - 1];
        setPrice(last.close);
        setChange24h(((last.close - candles[0].open) / candles[0].open) * 100);
      }

      if (showIndicators && ema12SeriesRef.current && ema26SeriesRef.current) {
        const closes = data.map((c: { close: number }) => c.close);
        const times = data.map((c: { timestamp: number }) => Math.floor(c.timestamp / 1000));

        const ema12 = calcEma(closes, 12);
        const ema26 = calcEma(closes, 26);
        const recent20 = closes.slice(-20);
        const mean = recent20.reduce((a: number, b: number) => a + b, 0) / recent20.length;
        const std = Math.sqrt(recent20.reduce((a: number, b: number) => a + (b - mean) ** 2, 0) / recent20.length);

        ema12SeriesRef.current.setData(times.map((t: number, i: number) => ({ time: t as any, value: ema12[i] })));
        ema26SeriesRef.current.setData(times.map((t: number, i: number) => ({ time: t as any, value: ema26[i] })));

        const bbTimes = times.slice(-20);
        bbUpperRef.current?.setData(bbTimes.map((t: number) => ({ time: t as any, value: mean + 2 * std })));
        bbLowerRef.current?.setData(bbTimes.map((t: number) => ({ time: t as any, value: mean - 2 * std })));

        // RSI
        const deltas = closes.slice(1).map((v: number, i: number) => v - closes[i]);
        const gains = deltas.map((d: number) => Math.max(d, 0));
        const losses = deltas.map((d: number) => Math.max(-d, 0));
        const period = 14;
        const avgGain = gains.slice(0, period).reduce((a: number, b: number) => a + b, 0) / period;
        const avgLoss = losses.slice(0, period).reduce((a: number, b: number) => a + b, 0) / period;
        const rsi = 100 - (100 / (1 + (avgLoss > 0 ? avgGain / avgLoss : 0)));
        const macdVal = ema12[ema12.length - 1] - ema26[ema26.length - 1];
        const signals: string[] = [];
        if (rsi < 30) signals.push('RSI Oversold (Buy)');
        else if (rsi > 70) signals.push('RSI Overbought (Sell)');

        setIndicators({ rsi: Math.round(rsi * 100) / 100, macd: Math.round(macdVal * 10000) / 10000, signals, overall: rsi < 50 ? 'Bearish' : 'Bullish' });
      }
    } catch (e) {
      console.error('Fetch klines error:', e);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, interval, showIndicators]);

  useEffect(() => { fetchKlines(); }, [fetchKlines]);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE_URL}/ws/market`);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ticker' && data.symbol === symbol) {
          setPrice(data.price);
          setChange24h(data.change);
        }
      } catch { /* ignore */ }
    };
    return () => ws.close();
  }, [symbol]);

  const priceUp = (change24h || 0) >= 0;

  return (
    <div className="flex flex-col h-full bg-trading-dark border border-trading-border rounded-lg overflow-hidden">
      <div className="h-12 border-b border-trading-border bg-trading-panel flex items-center px-3 gap-3 shrink-0 flex-wrap">
        <select value={symbol} onChange={(e) => setSymbol(e.target.value)}
          className="bg-trading-dark border border-trading-border rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-trading-blue">
          {SYMBOLS.map((s) => <option key={s} value={s}>{s.replace('USDT', '/USDT')}</option>)}
        </select>
        <div className="h-4 w-px bg-trading-border" />
        <div className="flex flex-col">
          <span className={`text-sm font-mono font-bold ${priceUp ? 'text-trading-green' : 'text-trading-red'}`}>
            {price ? `$${price.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '—'}
          </span>
          <span className={`text-[10px] ${priceUp ? 'text-trading-green' : 'text-trading-red'}`}>
            {change24h != null ? `${priceUp ? '+' : ''}${change24h.toFixed(2)}%` : ''}
          </span>
        </div>
        {indicators.rsi != null && (
          <>
            <div className="h-4 w-px bg-trading-border" />
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className={`${indicators.rsi! < 30 ? 'text-trading-green' : indicators.rsi! > 70 ? 'text-trading-red' : 'text-trading-muted'}`}>
                RSI {indicators.rsi}
              </span>
              <span className={`${(indicators.macd || 0) > 0 ? 'text-trading-green' : 'text-trading-red'}`}>
                MACD {indicators.macd}
              </span>
              {indicators.signals && indicators.signals.length > 0 && (
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                  indicators.overall === 'Bullish' ? 'bg-trading-green/20 text-trading-green' : 'bg-trading-red/20 text-trading-red'
                }`}>
                  {indicators.signals[0]}
                </span>
              )}
            </div>
          </>
        )}
        <div className="ml-auto flex items-center gap-1">
          {INTERVALS.map((iv) => (
            <button key={iv} onClick={() => setInterval(iv)}
              className={`text-[10px] px-2 py-1 rounded transition-colors ${interval === iv ? 'bg-trading-blue text-white' : 'bg-trading-border/50 text-trading-muted hover:text-white'}`}>
              {iv}
            </button>
          ))}
          <button onClick={() => setShowIndicators((v) => !v)}
            className={`text-[10px] px-2 py-1 rounded ml-1 ${showIndicators ? 'bg-trading-blue/30 text-trading-blue' : 'bg-trading-border/50 text-trading-muted'}`}>
            IND
          </button>
          <button onClick={fetchKlines} className="text-[10px] px-2 py-1 rounded bg-trading-border/50 text-trading-muted hover:text-white">↻</button>
        </div>
      </div>
      <div className="flex-1 relative min-h-0">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-trading-dark/80 z-10">
            <div className="w-6 h-6 border-2 border-trading-blue border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={chartContainerRef} className="w-full h-full" />
      </div>
    </div>
  );
};

export default ChartPanel;

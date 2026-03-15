import React from 'react';

const WatchlistPanel = () => {
  const pairs = [
    { symbol: 'BTC/USD', price: '64,230.50', change: '+2.45%' },
    { symbol: 'ETH/USD', price: '3,450.20', change: '+1.20%' },
    { symbol: 'SOL/USD', price: '145.80', change: '-0.54%' },
    { symbol: 'ADA/USD', price: '0.45', change: '+5.10%' },
    { symbol: 'XRP/USD', price: '0.62', change: '-1.20%' },
    { symbol: 'DOT/USD', price: '6.80', change: '+0.10%' },
  ];

  return (
    <div className="flex flex-col h-full bg-trading-dark border border-trading-border rounded-lg overflow-hidden">
      <div className="h-10 border-b border-trading-border bg-trading-panel flex items-center px-4 shrink-0 justify-between">
        <h2 className="font-semibold text-white tracking-wide font-sans text-sm">Watchlist</h2>
        <button className="text-trading-muted hover:text-white">
           <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="flex px-4 py-2 text-[10px] text-trading-muted border-b border-trading-border/50 uppercase tracking-wider">
          <div className="w-1/3">Pair</div>
          <div className="w-1/3 text-right">Price</div>
          <div className="w-1/3 text-right">Change</div>
        </div>

        <div className="flex flex-col">
          {pairs.map((pair, i) => {
            const isPositive = pair.change.startsWith('+');
            return (
              <div key={i} className="flex px-4 py-3 hover:bg-trading-panel cursor-pointer border-b border-trading-border/30 transition-colors items-center">
                <div className="w-1/3 text-xs font-semibold text-white">{pair.symbol}</div>
                <div className="w-1/3 text-right text-xs font-mono text-gray-300">{pair.price}</div>
                <div className={`w-1/3 text-right text-xs font-mono font-medium ${isPositive ? 'text-trading-green' : 'text-trading-red'}`}>
                  {pair.change}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WatchlistPanel;

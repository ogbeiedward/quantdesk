import React from 'react';

const OrderBookPanel = () => {
  // Mock data
  const asks = Array.from({ length: 15 }).map((_, i) => ({
    price: 64231.0 + (i * 0.5),
    size: (Math.random() * 2).toFixed(4),
    total: (Math.random() * 10).toFixed(4)
  })).reverse();

  const bids = Array.from({ length: 15 }).map((_, i) => ({
    price: 64230.5 - (i * 0.5),
    size: (Math.random() * 2).toFixed(4),
    total: (Math.random() * 10).toFixed(4)
  }));

  return (
    <div className="flex flex-col h-full bg-trading-dark border border-trading-border rounded-lg overflow-hidden text-xs font-mono">
      <div className="h-10 border-b border-trading-border bg-trading-panel flex items-center px-4 shrink-0 justify-between">
        <h2 className="font-semibold text-white tracking-wide font-sans text-sm">Order Book</h2>
        <div className="flex gap-1">
          <div className="w-4 h-4 rounded bg-trading-border/50 text-[10px] flex items-center justify-center cursor-pointer hover:bg-trading-border">0.1</div>
        </div>
      </div>

      <div className="flex px-4 py-2 text-trading-muted border-b border-trading-border/50 bg-[#0d1017]">
        <div className="w-1/3">Price(USD)</div>
        <div className="w-1/3 text-right">Size(BTC)</div>
        <div className="w-1/3 text-right">Total</div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col pt-1">
        {/* Asks */}
        <div className="flex-1 overflow-hidden flex flex-col justify-end">
          {asks.map((ask, i) => (
            <div key={i} className="flex px-4 py-0.5 hover:bg-trading-red/10 cursor-pointer group relative">
              <div className="absolute top-0 right-0 bottom-0 bg-trading-red/10 -z-10 transition-all" style={{ width: `${Math.random() * 100}%` }}></div>
              <div className="w-1/3 text-trading-red">{ask.price.toFixed(1)}</div>
              <div className="w-1/3 text-right text-gray-300 group-hover:text-white">{ask.size}</div>
              <div className="w-1/3 text-right text-trading-muted">{ask.total}</div>
            </div>
          ))}
        </div>

        {/* Spread */}
        <div className="py-2 px-4 flex items-center gap-2 border-y border-trading-border/50 bg-trading-border/20 my-1">
          <span className="text-trading-green text-sm font-bold">64,230.50</span>
          <svg className="w-3 h-3 text-trading-green" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
          <span className="text-trading-muted line-through ml-auto text-[10px]">64,231.00</span>
        </div>

        {/* Bids */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {bids.map((bid, i) => (
            <div key={i} className="flex px-4 py-0.5 hover:bg-trading-green/10 cursor-pointer group relative">
              <div className="absolute top-0 right-0 bottom-0 bg-trading-green/10 -z-10 transition-all" style={{ width: `${Math.random() * 100}%` }}></div>
              <div className="w-1/3 text-trading-green">{bid.price.toFixed(1)}</div>
              <div className="w-1/3 text-right text-gray-300 group-hover:text-white">{bid.size}</div>
              <div className="w-1/3 text-right text-trading-muted">{bid.total}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderBookPanel;

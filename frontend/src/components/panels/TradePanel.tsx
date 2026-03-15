import React, { useState } from 'react';

const TradePanel = () => {
  const [orderType, setOrderType] = useState('Limit');
  const [side, setSide] = useState<'Buy' | 'Sell'>('Buy');

  return (
    <div className="flex flex-col h-full bg-trading-dark border border-trading-border rounded-lg overflow-hidden">
      <div className="h-10 border-b border-trading-border bg-trading-panel flex items-center px-4 shrink-0">
        <h2 className="font-semibold text-white tracking-wide font-sans text-sm">Place Order</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {/* Buy/Sell Tabs */}
        <div className="flex bg-trading-panel rounded-lg p-1 mb-4 border border-trading-border">
          <button 
            className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${side === 'Buy' ? 'bg-trading-green text-white shadow' : 'text-trading-muted hover:text-white'}`}
            onClick={() => setSide('Buy')}
          >
            Buy
          </button>
          <button 
            className={`flex-1 py-1.5 rounded text-sm font-medium transition-colors ${side === 'Sell' ? 'bg-trading-red text-white shadow' : 'text-trading-muted hover:text-white'}`}
            onClick={() => setSide('Sell')}
          >
            Sell
          </button>
        </div>

        {/* Order Type Tabs */}
        <div className="flex gap-4 mb-6 border-b border-trading-border/50 pb-2">
          {['Limit', 'Market', 'Stop Limit'].map(type => (
            <button 
              key={type}
              className={`text-xs font-medium pb-2 -mb-[9px] border-b-2 transition-colors ${orderType === type ? 'text-trading-blue border-trading-blue' : 'text-trading-muted border-transparent hover:text-white'}`}
              onClick={() => setOrderType(type)}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Form Inputs */}
        <div className="space-y-4">
          <div className="bg-trading-panel border border-trading-border rounded-lg flex items-center px-3 py-2 transition-colors focus-within:border-trading-blue">
            <span className="text-xs text-trading-muted w-16">Price</span>
            <input type="number" className="flex-1 bg-transparent text-right text-sm text-white focus:outline-none font-mono" defaultValue="64230.50" disabled={orderType === 'Market'} />
            <span className="text-xs text-trading-muted w-10 text-right">USD</span>
          </div>

          <div className="bg-trading-panel border border-trading-border rounded-lg flex items-center px-3 py-2 transition-colors focus-within:border-trading-blue">
            <span className="text-xs text-trading-muted w-16">Size</span>
            <input type="number" className="flex-1 bg-transparent text-right text-sm text-white focus:outline-none font-mono" placeholder="0.00" />
            <span className="text-xs text-trading-muted w-10 text-right">BTC</span>
          </div>
          
          {/* Slider */}
          <div className="py-2">
            <input type="range" className="w-full accent-trading-blue h-1 bg-trading-border rounded-lg appearance-none cursor-pointer" min="0" max="100" defaultValue="0" />
            <div className="flex justify-between text-[10px] text-trading-muted mt-2 font-mono">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-trading-border/50 flex justify-between items-center text-sm">
            <span className="text-trading-muted text-xs">Total Value</span>
            <span className="font-mono text-white">0.00 <span className="text-trading-muted text-xs">USD</span></span>
          </div>

          <button className={`w-full py-3 rounded-lg font-bold text-sm tracking-wide text-white transition-opacity hover:opacity-90 mt-2 shadow-lg ${side === 'Buy' ? 'bg-trading-green shadow-trading-green/20' : 'bg-trading-red shadow-trading-red/20'}`}>
            {side} BTC
          </button>
        </div>
      </div>
    </div>
  );
};

export default TradePanel;

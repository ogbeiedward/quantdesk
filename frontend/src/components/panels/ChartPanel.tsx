import React from 'react';

const ChartPanel = () => {
  return (
    <div className="flex flex-col h-full bg-trading-dark border border-trading-border rounded-lg overflow-hidden">
      <div className="h-10 border-b border-trading-border bg-trading-panel flex items-center px-4 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <h2 className="text-sm font-semibold text-white">BTC/USD</h2>
          <div className="h-4 w-px bg-trading-border"></div>
          <span className="text-xs text-trading-green">+2.45%</span>
          <span className="text-xs text-trading-muted font-mono">$64,230.50</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-xs px-2 py-1 rounded bg-trading-border/50 text-trading-muted hover:text-white">1H</button>
          <button className="text-xs px-2 py-1 rounded bg-trading-blue/20 text-trading-blue">4H</button>
          <button className="text-xs px-2 py-1 rounded bg-trading-border/50 text-trading-muted hover:text-white">1D</button>
        </div>
      </div>
      <div className="flex-1 p-4 flex items-center justify-center relative bg-[#0b0e14]">
        {/* Mock Chart Grid */}
        <div className="absolute inset-0 border-t border-l border-trading-border/30" style={{ backgroundImage: 'linear-gradient(to right, #2a2e3933 1px, transparent 1px), linear-gradient(to bottom, #2a2e3933 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        <div className="z-10 text-center">
          <svg className="w-16 h-16 mx-auto text-trading-muted/50 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <p className="text-trading-muted/70 text-sm">TradingView Widget Placeholder</p>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;

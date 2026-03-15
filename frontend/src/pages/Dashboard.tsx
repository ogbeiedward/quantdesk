import React from 'react';

const Dashboard = () => {
  return (
    <div className="p-6 h-full flex flex-col gap-6">
      <div className="flex gap-6">
        {/* Portfolio Value Card */}
        <div className="bg-trading-panel border border-trading-border rounded-xl p-6 flex-1 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-trading-blue/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <h2 className="text-trading-muted text-sm uppercase tracking-wider font-semibold mb-2">Total Estimated Balance</h2>
          <div className="flex items-end gap-3">
             <span className="text-3xl font-mono text-white tracking-tight">$100,452.80</span>
             <span className="text-trading-green text-sm font-medium mb-1 flex items-center bg-trading-green/10 px-2 py-0.5 rounded">
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
                +4.52%
             </span>
          </div>
          <p className="text-xs text-trading-muted mt-2">≈ 1.5642 BTC</p>
        </div>

        {/* 24h P&L */}
        <div className="bg-trading-panel border border-trading-border rounded-xl p-6 flex-1 shadow-lg">
          <h2 className="text-trading-muted text-sm uppercase tracking-wider font-semibold mb-2">24h P&L</h2>
          <div className="flex items-end gap-3">
             <span className="text-2xl font-mono text-trading-green tracking-tight">+$452.80</span>
          </div>
          <div className="mt-4 h-1 w-full bg-trading-border rounded overflow-hidden">
            <div className="h-full bg-trading-green w-3/4"></div>
          </div>
        </div>

        {/* Win Rate */}
        <div className="bg-trading-panel border border-trading-border rounded-xl p-6 flex-1 shadow-lg">
          <h2 className="text-trading-muted text-sm uppercase tracking-wider font-semibold mb-2">Win Rate (30D)</h2>
           <div className="flex items-end gap-3">
             <span className="text-2xl font-mono text-white tracking-tight">68.5%</span>
          </div>
          <div className="mt-4 flex gap-1 text-xs font-mono">
            <span className="text-trading-green">45W</span>
            <span className="text-trading-muted">-</span>
            <span className="text-trading-red">21L</span>
          </div>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        <div className="bg-trading-panel border border-trading-border rounded-xl flex-[2] flex flex-col overflow-hidden shadow-lg">
           <div className="p-4 border-b border-trading-border font-semibold text-sm">Recent Trades</div>
           <div className="flex-1 p-4 flex items-center justify-center text-trading-muted/50 text-sm">
             No recent trades to display
           </div>
        </div>
        <div className="bg-trading-panel border border-trading-border rounded-xl flex-1 flex flex-col overflow-hidden shadow-lg">
           <div className="p-4 border-b border-trading-border font-semibold text-sm">Top Assets</div>
           <div className="flex-1 p-4 flex flex-col gap-3">
             {['BTC', 'ETH', 'SOL'].map((token, i) => (
                <div key={i} className="flex justify-between items-center bg-trading-dark p-3 rounded border border-trading-border">
                  <span className="font-semibold">{token}</span>
                  <span className="font-mono text-sm">1.02</span>
                </div>
             ))}
           </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

import React from 'react';

const Wallet = () => {
  const assets = [
    { asset: 'USDC', balance: '100,000.00', value: '$100,000.00' },
    { asset: 'BTC', balance: '0.0070', value: '$452.80' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto h-full flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Wallet Simulator</h1>
        <div className="flex gap-3">
          <button className="bg-trading-blue hover:bg-blue-600 text-white px-4 py-2 rounded font-medium transition-colors shadow-lg shadow-trading-blue/20">
            Deposit Funds
          </button>
          <button className="bg-trading-dark border border-trading-border hover:bg-trading-panel text-white px-4 py-2 rounded font-medium transition-colors">
            Reset Account
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-trading-panel rounded-xl border border-trading-border shadow-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-trading-border bg-trading-dark/50 font-semibold text-sm">
            Asset Balances
          </div>
          <table className="w-full text-left text-sm">
            <thead className="text-trading-muted border-b border-trading-border/50">
              <tr>
                <th className="px-6 py-3 font-medium">Asset</th>
                <th className="px-6 py-3 font-medium text-right">Balance</th>
                <th className="px-6 py-3 font-medium text-right">Value (USD)</th>
                <th className="px-6 py-3 font-medium text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-trading-border/50 font-mono">
              {assets.map((item, i) => (
                <tr key={i} className="hover:bg-trading-border/20 transition-colors">
                  <td className="px-6 py-4 font-sans font-semibold text-white">{item.asset}</td>
                  <td className="px-6 py-4 text-right text-gray-300">{item.balance}</td>
                  <td className="px-6 py-4 text-right text-white">{item.value}</td>
                  <td className="px-6 py-4 flex justify-center gap-2">
                    <button className="text-trading-blue hover:underline text-xs font-sans">Trade</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-trading-panel rounded-xl border border-trading-border shadow-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-trading-border bg-trading-dark/50 font-semibold text-sm">
            Transaction History
          </div>
          <div className="flex-1 p-4 flex flex-col gap-3">
             <div className="flex justify-between items-center text-sm">
               <div className="flex flex-col">
                 <span className="text-trading-green font-medium">+100,000.00 USDC</span>
                 <span className="text-xs text-trading-muted cursor-pointer hover:underline" title="txn_398f484">Simulated Deposit</span>
               </div>
               <span className="text-xs text-trading-muted font-mono">Today 10:42 AM</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;

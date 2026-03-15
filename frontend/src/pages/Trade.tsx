import React from 'react';
import ChartPanel from '../components/panels/ChartPanel';
import OrderBookPanel from '../components/panels/OrderBookPanel';
import TradePanel from '../components/panels/TradePanel';
import WatchlistPanel from '../components/panels/WatchlistPanel';

const Trade = () => {
  return (
    <div className="h-full p-2 grid gap-2" style={{
      gridTemplateColumns: 'minmax(250px, 300px) 1fr minmax(280px, 320px)',
      gridTemplateRows: '1fr minmax(200px, 30%)',
      gridTemplateAreas: `
        "left center right"
        "left bottom right"
      `
    }}>
      {/* Left Column */}
      <div className="flex flex-col gap-2" style={{ gridArea: 'left' }}>
        <div className="flex-1 min-h-0">
          <WatchlistPanel />
        </div>
        <div className="flex-1 min-h-0">
          <div className="h-full bg-trading-dark border border-trading-border rounded-lg overflow-hidden flex items-center justify-center p-4">
             <span className="text-trading-muted text-sm text-center">Positions & Orders Panel<br/>(WIP)</span>
          </div>
        </div>
      </div>

      {/* Center Main Area */}
      <div className="flex flex-col min-w-0" style={{ gridArea: 'center' }}>
        <ChartPanel />
      </div>
      
      {/* Bottom Center Area */}
      <div className="min-w-0" style={{ gridArea: 'bottom' }}>
        <div className="h-full w-full bg-trading-dark border border-trading-border rounded-lg overflow-hidden flex items-center justify-center">
             <span className="text-trading-muted text-sm border-b border-trading-border w-full h-10 absolute top-0 bg-trading-panel flex items-center px-4">Market News / Feed</span>
        </div>
      </div>

      {/* Right Column */}
      <div className="flex flex-col gap-2" style={{ gridArea: 'right' }}>
        <div className="flex-[3] min-h-0">
          <OrderBookPanel />
        </div>
        <div className="flex-[2] min-h-0 shrink-0">
          <TradePanel />
        </div>
      </div>
    </div>
  );
};

export default Trade;

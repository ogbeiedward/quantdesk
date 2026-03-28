import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthGuard from './components/AuthGuard';
import { API_BASE_URL } from './api/config';
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Wallet from './pages/Wallet';
import Analytics from './pages/Analytics';
import Backtesting from './pages/Backtesting';
import Institutional from './pages/Institutional';

const NavIcon: React.FC<{ to: string; title: string; children: React.ReactNode }> = ({ to, title, children }) => {
  const location = useLocation();
  const isActive = location.pathname.startsWith(to);
  return (
    <Link to={to} title={title}
      className={`w-10 h-10 rounded-lg flex items-center justify-center transition-all ${isActive ? 'bg-trading-blue text-white shadow-lg shadow-trading-blue/20' : 'text-trading-muted hover:bg-trading-border/50 hover:text-white'}`}>
      {children}
    </Link>
  );
};

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const [balance, setBalance] = React.useState<string>('0.00');
  const location = useLocation();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    fetch(`${API_BASE_URL}/api/wallet/`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : [])
      .then((data: any[]) => {
        const usd = data.find(w => w.currency === 'USD');
        if (usd) setBalance(Number(usd.balance).toLocaleString('en-US', { minimumFractionDigits: 2 }));
      }).catch(() => {});
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-trading-dark text-trading-text font-sans selection:bg-trading-blue selection:text-white">
      <aside className="w-16 border-r border-trading-border flex flex-col items-center py-4 bg-trading-panel shrink-0 select-none">
        <div className="w-8 h-8 bg-trading-blue rounded mb-8 flex items-center justify-center text-white font-bold shadow-lg shadow-trading-blue/20">Q</div>
        <nav className="flex flex-col gap-4 w-full px-3">
          {/* Dashboard */}
          <NavIcon to="/dashboard" title="Dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>
            </svg>
          </NavIcon>
          {/* Trade Terminal */}
          <NavIcon to="/trade" title="Trade Terminal">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </NavIcon>
          {/* Analytics / Intelligence */}
          <NavIcon to="/analytics" title="Market Intelligence">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/>
            </svg>
          </NavIcon>
          {/* Strategy Lab */}
          <NavIcon to="/backtesting" title="Strategy Lab">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
            </svg>
          </NavIcon>
          {/* Institutional / OTC */}
          <NavIcon to="/institutional" title="Institutional Desk">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </NavIcon>
          {/* Wallet */}
          <NavIcon to="/wallet" title="Wallet">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
            </svg>
          </NavIcon>
        </nav>
        <div className="mt-auto w-full px-3">
          <button onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}
            className="w-10 h-10 rounded-lg text-trading-muted hover:bg-trading-border/50 hover:text-trading-red flex items-center justify-center transition-colors" title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <header className="h-14 border-b border-trading-border bg-trading-panel flex items-center justify-between px-6 shrink-0 z-10">
          <h1 className="font-semibold text-white tracking-wide">
            QuantDesk <span className="text-xs uppercase bg-trading-blue/10 text-trading-blue px-2 py-0.5 rounded ml-2 border border-trading-blue/20">Institutional</span>
          </h1>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-trading-green shadow-[0_0_8px_rgba(0,200,83,0.6)]" />
              <span className="text-xs text-trading-muted uppercase font-medium">Live Markets</span>
            </div>
            <div className="h-6 w-px bg-trading-border" />
            <div className="flex flex-col items-end">
              <span className="text-xs text-trading-muted uppercase">Available Balance</span>
              <span className="text-sm font-mono text-white font-medium">${balance}</span>
            </div>
            <div className="w-8 h-8 rounded border border-trading-border bg-trading-dark flex items-center justify-center ml-2">
              <span className="text-xs font-bold text-white">EO</span>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto overflow-x-hidden bg-trading-dark relative">
          {children}
        </div>
      </main>
    </div>
  );
};

const wrap = (el: React.ReactNode) => <AuthGuard><AppLayout>{el}</AppLayout></AuthGuard>;

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={wrap(<Navigate to="/dashboard" replace />)} />
        <Route path="/dashboard" element={wrap(<Dashboard />)} />
        <Route path="/trade" element={wrap(<Trade />)} />
        <Route path="/wallet" element={wrap(<Wallet />)} />
        <Route path="/analytics" element={wrap(<Analytics />)} />
        <Route path="/backtesting" element={wrap(<Backtesting />)} />
        <Route path="/institutional" element={wrap(<Institutional />)} />
      </Routes>
    </Router>
  );
}

export default App;

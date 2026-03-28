import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import AuthGuard from './components/AuthGuard';
import { API_BASE_URL } from './api/config';
import Dashboard from './pages/Dashboard';
import Trade from './pages/Trade';
import Wallet from './pages/Wallet';

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const isActive = (path: string) => location.pathname.startsWith(path);
  const [balance, setBalance] = React.useState<string>('0.00');

  React.useEffect(() => {
    const fetchWallet = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      try {
        const resp = await fetch(`${API_BASE_URL}/api/wallet/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (resp.ok) {
          const data = await resp.json();
          const usd = data.find((w: any) => w.currency === 'USD');
          if (usd) {
            setBalance(Number(usd.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
          }
        }
      } catch (e) {
        console.error("Failed to fetch wallet", e);
      }
    };
    fetchWallet();
  }, [location.pathname]);

  return (
    <div className="flex h-screen bg-trading-dark text-trading-text font-sans selection:bg-trading-blue selection:text-white">
      {/* Sidebar Layout */}
      <aside className="w-16 border-r border-trading-border flex flex-col items-center py-4 bg-trading-panel shrink-0 select-none">
        <div className="w-8 h-8 bg-trading-blue rounded mb-8 flex items-center justify-center text-white font-bold shadow-lg shadow-trading-blue/20">Q</div>
        <nav className="flex flex-col gap-6 w-full px-3">
          <Link to="/dashboard" className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all ${isActive('/dashboard') ? 'bg-trading-blue text-white shadow-lg shadow-trading-blue/20' : 'text-trading-muted hover:bg-trading-border/50 hover:text-white'}`} title="Dashboard">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
          </Link>
          <Link to="/trade" className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all ${isActive('/trade') ? 'bg-trading-blue text-white shadow-lg shadow-trading-blue/20' : 'text-trading-muted hover:bg-trading-border/50 hover:text-white'}`} title="Trade Terminal">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </Link>
          <Link to="/wallet" className={`w-10 h-10 rounded-lg flex items-center justify-center cursor-pointer transition-all ${isActive('/wallet') ? 'bg-trading-blue text-white shadow-lg shadow-trading-blue/20' : 'text-trading-muted hover:bg-trading-border/50 hover:text-white'}`} title="Wallet">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>
          </Link>
        </nav>
        
        <div className="mt-auto w-full px-3">
           <button 
             onClick={() => {
               localStorage.removeItem('token');
               window.location.href = '/login';
             }}
             className="w-10 h-10 rounded-lg text-trading-muted hover:bg-trading-border/50 hover:text-trading-red flex items-center justify-center cursor-pointer transition-colors" 
             title="Logout"
           >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
           </button>
        </div>
      </aside>

      {/* Main Area */}
      <main className="flex-1 overflow-hidden flex flex-col min-w-0">
        <header className="h-14 border-b border-trading-border bg-trading-panel flex items-center justify-between px-6 shrink-0 z-10">
          <h1 className="font-semibold text-white tracking-wide">QuantDesk <span className="text-xs uppercase bg-trading-blue/10 text-trading-blue px-2 py-0.5 rounded ml-2 border border-trading-blue/20">Pro</span></h1>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-trading-green shadow-[0_0_8px_rgba(0,200,83,0.6)]"></div>
              <span className="text-xs text-trading-muted uppercase font-medium">Markets Open</span>
            </div>
            
            <div className="h-6 w-px bg-trading-border"></div>
            
            <div className="flex flex-col items-end justify-center">
              <span className="text-xs text-trading-muted uppercase">Global P&L</span>
              <span className="text-sm font-mono text-trading-green">+$452.80</span>
            </div>
            
            <div className="flex flex-col items-end justify-center">
              <span className="text-xs text-trading-muted uppercase">Available Balance</span>
              <span className="text-sm font-mono text-white font-medium">${balance}</span>
            </div>
            
            <div className="w-8 h-8 rounded border border-trading-border bg-trading-dark flex items-center justify-center overflow-hidden ml-2 cursor-pointer outline outline-2 outline-transparent hover:outline-trading-blue/50 transition-all">
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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route path="/" element={<AuthGuard><AppLayout><Navigate to="/dashboard" replace /></AppLayout></AuthGuard>} />
        <Route path="/dashboard" element={<AuthGuard><AppLayout><Dashboard /></AppLayout></AuthGuard>} />
        <Route path="/trade" element={<AuthGuard><AppLayout><Trade /></AppLayout></AuthGuard>} />
        <Route path="/wallet" element={<AuthGuard><AppLayout><Wallet /></AppLayout></AuthGuard>} />
      </Routes>
    </Router>
  );
}

export default App;

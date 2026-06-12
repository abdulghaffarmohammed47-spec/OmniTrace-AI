import { useState, useMemo, useRef, useEffect } from 'react';
import { AuthProvider, useAuth } from './lib/authContext';
import AuthPage from './components/AuthPage';
import { generateTransactions, buildTransactionGraph } from './lib/syntheticData';
import FraudMonitor from './components/FraudMonitor';
import GraphExplorer from './components/GraphExplorer';
import PerformanceAnalytics from './components/PerformanceAnalytics';

type Tab = 'monitor' | 'graph' | 'performance';

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="text-center">
        <div className="relative inline-block mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-cyan-500/30 animate-pulse">
            OT
          </div>
          <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-ping" />
        </div>
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
            <path d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" fill="currentColor" className="opacity-75" />
          </svg>
          Initializing OmniTrace AI...
        </div>
      </div>
    </div>
  );
}

function UserMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  const roleLabels: Record<string, { label: string; color: string }> = {
    admin: { label: 'Admin', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' },
    analyst: { label: 'Analyst', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' },
    viewer: { label: 'Viewer', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  };

  const roleBadge = roleLabels[user.role] || roleLabels.viewer;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-800/60 transition-all group border border-transparent hover:border-slate-700/50"
      >
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${user.avatar} flex items-center justify-center text-white text-xs font-bold shadow-sm`}>
          {initials}
        </div>
        <div className="hidden md:block text-left">
          <div className="text-xs font-medium text-slate-200 group-hover:text-white transition-colors leading-tight">{user.name}</div>
          <div className="text-[10px] text-slate-500 leading-tight">{user.email}</div>
        </div>
        <svg className={`w-3.5 h-3.5 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-slate-900/95 backdrop-blur-2xl border border-slate-700/60 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden z-[100] animate-in">
          {/* User info header */}
          <div className="p-4 border-b border-slate-800/80">
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${user.avatar} flex items-center justify-center text-white font-bold shadow-lg`}>
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user.name}</div>
                <div className="text-xs text-slate-400 truncate">{user.email}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${roleBadge.color}`}>
                {roleBadge.label}
              </span>
              <span className="text-[10px] text-slate-600">
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Session info */}
          <div className="px-4 py-3 border-b border-slate-800/60">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-500">Last login</span>
              <span className="text-slate-300 font-mono">{new Date(user.lastLogin).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] mt-1.5">
              <span className="text-slate-500">Session status</span>
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            <button
              onClick={() => { logout(); setOpen(false); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('monitor');
  const [seed, setSeed] = useState(42);

  const transactions = useMemo(() => generateTransactions(seed, 120), [seed]);
  const graph = useMemo(() => buildTransactionGraph(transactions), [transactions]);

  const stats = useMemo(() => {
    const fraudCount = transactions.filter(t => t.isFraud).length;
    return {
      totalTxns: transactions.length,
      fraudCount,
      fraudRate: ((fraudCount / transactions.length) * 100).toFixed(1),
      totalNodes: graph.nodes.length,
      totalEdges: graph.edges.length,
      totalVolume: transactions.reduce((s, t) => s + t.amount, 0),
    };
  }, [transactions, graph]);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'monitor', label: 'Fraud Monitor', icon: '🔮' },
    { key: 'graph', label: 'Graph Search', icon: '🕸️' },
    { key: 'performance', label: 'Performance', icon: '📊' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Top Bar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/25">
                  OT
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
              </div>
              <div>
                <h1 className="text-base font-bold text-white tracking-tight">
                  OmniTrace <span className="text-cyan-400">AI</span>
                </h1>
                <p className="text-[10px] text-slate-500 -mt-0.5 tracking-wider uppercase">
                  Fraud Detection & Graph Analytics
                </p>
              </div>
            </div>

            {/* Nav Tabs */}
            <nav className="hidden sm:flex items-center gap-1 bg-slate-900/50 rounded-xl p-1 border border-slate-800">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === tab.key
                      ? 'bg-slate-800 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <span className="mr-1.5">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </nav>

            {/* Right section: stats + user */}
            <div className="flex items-center gap-4">
              {/* Stats */}
              <div className="hidden xl:flex items-center gap-4 text-[10px]">
                <div className="text-center">
                  <div className="text-cyan-400 font-bold font-mono text-sm">{stats.totalTxns}</div>
                  <div className="text-slate-500 uppercase">Txns</div>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div className="text-center">
                  <div className="text-red-400 font-bold font-mono text-sm">{stats.fraudCount}</div>
                  <div className="text-slate-500 uppercase">Flagged</div>
                </div>
                <div className="w-px h-6 bg-slate-800" />
                <div className="text-center">
                  <div className="text-purple-400 font-bold font-mono text-sm">{stats.totalNodes}</div>
                  <div className="text-slate-500 uppercase">Nodes</div>
                </div>
              </div>

              {/* Separator */}
              <div className="hidden xl:block w-px h-8 bg-slate-800" />

              {/* User Menu */}
              <UserMenu />
            </div>
          </div>

          {/* Mobile Tabs */}
          <div className="sm:hidden flex items-center gap-1 pb-3 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-400'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Stat Banner */}
      <div className="border-b border-slate-800/50 bg-gradient-to-r from-slate-900/50 via-slate-950 to-slate-900/50">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-[11px]">
              <span className="text-slate-500">
                👋 Welcome, <span className="text-slate-300 font-semibold">{user?.name}</span>
              </span>
              <span className="text-slate-500">
                📡 Monitoring <span className="text-slate-300 font-semibold">{stats.totalTxns}</span> transactions
              </span>
              <span className="text-slate-500">
                💰 Volume: <span className="text-slate-300 font-mono">${(stats.totalVolume / 1000).toFixed(1)}K</span>
              </span>
              <span className="text-slate-500">
                🚨 Fraud Rate: <span className="text-red-400 font-semibold">{stats.fraudRate}%</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px]">
              <span className="text-slate-500">Seed:</span>
              <input
                type="number"
                value={seed}
                onChange={e => setSeed(Number(e.target.value))}
                className="w-16 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] text-slate-300
                  font-mono focus:ring-1 focus:ring-cyan-500/50 outline-none"
              />
              <button
                onClick={() => setSeed(Math.floor(Math.random() * 10000))}
                className="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-[11px]"
              >
                🎲 Randomize
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'monitor' && <FraudMonitor transactions={transactions} />}
        {activeTab === 'graph' && <GraphExplorer graph={graph} />}
        {activeTab === 'performance' && <PerformanceAnalytics graph={graph} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 mt-8">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                System Active
              </span>
              <span>Algorithms: BFS · DFS · Dijkstra · A*</span>
              <span>Engine: Rules + ML Hybrid</span>
            </div>
            <div className="text-[10px] text-slate-600">
              OmniTrace AI — Fraud Detection & State-Space Graph Analytics Engine
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function AppRouted() {
  const { user, isLoading } = useAuth();

  if (isLoading) return <LoadingScreen />;
  if (!user) return <AuthPage />;
  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouted />
    </AuthProvider>
  );
}

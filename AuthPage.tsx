import { useState, useCallback, type FormEvent } from 'react';
import { useAuth, type User } from '../lib/authContext';

type Mode = 'login' | 'signup';

export default function AuthPage() {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<User['role']>('analyst');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          setError('Please fill in all fields.');
          triggerShake();
          setIsSubmitting(false);
          return;
        }
        const result = await login(email, password);
        if (!result.success) {
          setError(result.error || 'Login failed.');
          triggerShake();
        }
      } else {
        if (!name || !email || !password) {
          setError('Please fill in all fields.');
          triggerShake();
          setIsSubmitting(false);
          return;
        }
        if (password.length < 6) {
          setError('Password must be at least 6 characters.');
          triggerShake();
          setIsSubmitting(false);
          return;
        }
        const result = await signup(name, email, password, role);
        if (!result.success) {
          setError(result.error || 'Signup failed.');
          triggerShake();
        }
      }
    } catch {
      setError('An unexpected error occurred.');
      triggerShake();
    } finally {
      setIsSubmitting(false);
    }
  }, [mode, email, password, name, role, login, signup]);

  const switchMode = () => {
    setMode(prev => prev === 'login' ? 'signup' : 'login');
    setError('');
  };

  const fillDemo = () => {
    setEmail('admin@omnitrace.ai');
    setPassword('admin123');
    setMode('login');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex relative overflow-hidden" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-cyan-500/[0.07] blur-[120px] animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/[0.07] blur-[120px]"
          style={{ animation: 'pulse 4s ease-in-out infinite alternate' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-purple-600/[0.05] blur-[100px]"
          style={{ animation: 'pulse 6s ease-in-out infinite alternate-reverse' }} />

        {/* Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>

        {/* Floating nodes animation */}
        {Array.from({ length: 18 }, (_, i) => {
          const size = 3 + (i % 4) * 2;
          const left = ((i * 37 + 13) % 100);
          const top = ((i * 53 + 7) % 100);
          const delay = (i * 0.7) % 5;
          const duration = 8 + (i % 5) * 3;
          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: size,
                height: size,
                left: `${left}%`,
                top: `${top}%`,
                backgroundColor: i % 3 === 0 ? '#22d3ee' : i % 3 === 1 ? '#a78bfa' : '#f87171',
                opacity: 0.15 + (i % 3) * 0.1,
                animation: `float ${duration}s ease-in-out ${delay}s infinite alternate`,
              }}
            />
          );
        })}

        {/* Connection lines between some nodes */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]">
          <line x1="15%" y1="20%" x2="35%" y2="45%" stroke="#22d3ee" strokeWidth="1" />
          <line x1="35%" y1="45%" x2="60%" y2="30%" stroke="#a78bfa" strokeWidth="1" />
          <line x1="60%" y1="30%" x2="80%" y2="55%" stroke="#22d3ee" strokeWidth="1" />
          <line x1="80%" y1="55%" x2="70%" y2="80%" stroke="#f87171" strokeWidth="1" />
          <line x1="25%" y1="70%" x2="45%" y2="60%" stroke="#a78bfa" strokeWidth="1" />
          <line x1="45%" y1="60%" x2="35%" y2="45%" stroke="#22d3ee" strokeWidth="1" />
        </svg>
      </div>

      {/* Left Branding Panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-[48%] relative z-10 flex-col justify-between p-12 xl:p-16">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 mb-16">
            <div className="relative">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-cyan-500/30">
                OT
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                OmniTrace <span className="text-cyan-400">AI</span>
              </h1>
              <p className="text-[10px] text-slate-500 tracking-widest uppercase">
                Fraud Intelligence Platform
              </p>
            </div>
          </div>

          {/* Hero */}
          <div className="max-w-lg">
            <h2 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Detect fraud.<br />
              <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Trace networks.
              </span><br />
              Stop threats.
            </h2>
            <p className="text-slate-400 mt-6 leading-relaxed text-sm max-w-md">
              Advanced fraud detection workspace powered by machine learning classifiers,
              expert rule engines, and AI state-space graph search algorithms — BFS, DFS,
              Dijkstra, and A* — to uncover fraud rings in real time.
            </p>
          </div>

          {/* Feature pills */}
          <div className="mt-10 flex flex-wrap gap-2">
            {[
              { icon: '🧠', label: 'ML + Rules Hybrid Engine' },
              { icon: '🕸️', label: 'Graph Network Analytics' },
              { icon: '⚡', label: 'BFS · DFS · Dijkstra · A*' },
              { icon: '🔮', label: 'Real-Time Risk Scoring' },
            ].map((f, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300">
                <span>{f.icon}</span>
                {f.label}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="flex items-center gap-8 mt-12">
          {[
            { value: '99.7%', label: 'Detection Rate' },
            { value: '<50ms', label: 'Avg. Latency' },
            { value: '4', label: 'Search Algorithms' },
            { value: '24/7', label: 'Monitoring' },
          ].map((s, i) => (
            <div key={i}>
              <div className="text-lg font-bold font-mono text-white">{s.value}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Auth Form Panel */}
      <div className="flex-1 flex items-center justify-center relative z-10 px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-cyan-500/30">
              OT
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">OmniTrace <span className="text-cyan-400">AI</span></h1>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest">Fraud Intelligence</p>
            </div>
          </div>

          {/* Card */}
          <div
            className={`bg-slate-900/70 backdrop-blur-2xl rounded-2xl border border-slate-800/80 p-8 shadow-2xl shadow-black/30
              ${shake ? 'animate-shake' : ''}`}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white">
                {mode === 'login' ? 'Welcome back' : 'Create account'}
              </h2>
              <p className="text-sm text-slate-400 mt-1.5">
                {mode === 'login'
                  ? 'Sign in to access the fraud analytics workspace'
                  : 'Get started with OmniTrace AI'}
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Full Name</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">👤</span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white
                        placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">✉️</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-4 py-3 text-sm text-white
                      placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 mb-1.5 block">Password</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔒</span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={mode === 'login' ? '••••••••' : 'Min 6 characters'}
                    className="w-full bg-slate-800/60 border border-slate-700/60 rounded-xl pl-10 pr-12 py-3 text-sm text-white
                      placeholder:text-slate-600 focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors text-xs"
                    tabIndex={-1}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label className="text-xs font-medium text-slate-400 mb-1.5 block">Role</label>
                  <div className="grid grid-cols-3 gap-2">
                    {([
                      { key: 'analyst' as const, icon: '🔍', label: 'Analyst' },
                      { key: 'admin' as const, icon: '🛡️', label: 'Admin' },
                      { key: 'viewer' as const, icon: '👁️', label: 'Viewer' },
                    ]).map(r => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setRole(r.key)}
                        className={`py-2.5 rounded-xl text-xs font-medium transition-all border ${
                          role === r.key
                            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300 shadow-inner'
                            : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600'
                        }`}
                      >
                        <span className="block text-base mb-0.5">{r.icon}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold text-sm
                  hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                  shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/30 active:scale-[0.98] relative overflow-hidden group"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" fill="currentColor" className="opacity-75" />
                    </svg>
                    {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                  </span>
                ) : (
                  <span>{mode === 'login' ? 'Sign In' : 'Create Account'}</span>
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-slate-700/50" />
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">or</span>
              <div className="flex-1 h-px bg-slate-700/50" />
            </div>

            {/* Demo login */}
            <button
              onClick={fillDemo}
              className="w-full py-3 rounded-xl border border-slate-700/60 text-slate-300 text-xs font-medium
                hover:bg-slate-800/60 hover:border-slate-600 transition-all flex items-center justify-center gap-2"
            >
              <span>⚡</span>
              Use Demo Account
              <span className="text-[10px] text-slate-500 ml-1">(admin@omnitrace.ai)</span>
            </button>

            {/* Toggle mode */}
            <p className="text-center text-xs text-slate-500 mt-6">
              {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={switchMode}
                className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-4 mt-6 text-[10px] text-slate-600">
            <span className="flex items-center gap-1">🔐 End-to-End Encrypted</span>
            <span>·</span>
            <span className="flex items-center gap-1">🛡️ SOC 2 Compliant</span>
            <span>·</span>
            <span className="flex items-center gap-1">🌐 GDPR Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}

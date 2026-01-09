
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2, AlertCircle, Database, ShieldCheck, Globe } from 'lucide-react';
import { validateLogin, saveSession } from '../services/authService';
import { UserSession } from '../types';

const LOGO_URL = "https://depedcaloocan.com/wp-content/uploads/2025/07/webtap.png";

interface LoginProps {
  onSuccess: (session: UserSession) => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setError(null);

    try {
      // Calling the refactored Vercel-ready API service
      const session = await validateLogin(username, password);

      if (session) {
        saveSession(session);
        onSuccess(session);
      } else {
        setError("Database rejection: Invalid Username or Password.");
      }
    } catch (err) {
      setError("Cloud Database Timeout: Please check your internet connection.");
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] relative overflow-hidden p-6">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600 rounded-full blur-[180px] animate-pulse"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-500 rounded-full blur-[180px] animate-pulse"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/50 backdrop-blur-2xl rounded-[3.5rem] border border-white/5 shadow-2xl p-12">
          <div className="flex flex-col items-center mb-12 text-center">
            <div className="w-24 h-24 bg-white rounded-3xl flex items-center justify-center mb-8 shadow-2xl p-2 overflow-hidden border border-indigo-500/20">
              <img src={LOGO_URL} alt="FTAD Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter mb-2">FTAD CENTRAL</h1>
            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4">Cloud Database Auth v3.0</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></div>
              <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Vercel DB Live</span>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Account Username</label>
              <div className="relative group">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  placeholder="e.g. Taguig"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Database Access Key</label>
              <div className="relative group">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-indigo-400 transition-colors" size={18} />
                <input 
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold placeholder:text-slate-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="text-rose-500 shrink-0" size={18} />
                <p className="text-[11px] font-bold text-rose-200 uppercase tracking-tight leading-tight">{error}</p>
              </div>
            )}

            <button 
              type="submit"
              disabled={isAuthenticating}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl py-5 font-black flex items-center justify-center gap-3 transition-all shadow-xl shadow-indigo-600/30 disabled:opacity-50 group"
            >
              {isAuthenticating ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  COMMUNICATING WITH VERCEL...
                </>
              ) : (
                <>
                  SECURE SIGN IN
                  <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
             <div className="flex items-center gap-6">
                <div className="flex flex-col items-center gap-1">
                   <Globe size={14} className="text-slate-600" />
                   <span className="text-[8px] font-black text-slate-600 uppercase">SSL Valid</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                   <Database size={14} className="text-slate-600" />
                   <span className="text-[8px] font-black text-slate-600 uppercase">Encrypted</span>
                </div>
             </div>
             <p className="text-[9px] text-slate-600 font-bold uppercase tracking-[0.2em] text-center leading-relaxed">
              This system uses Vercel Infrastructure.<br/>Regional Technical Assistance Division Database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
